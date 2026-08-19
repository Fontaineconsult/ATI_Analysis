#
# EVIDENCE UPDATE QUERIES
#
from datetime import datetime

from neomodel import db

from app.database.class_factory import implementation_classes
from app.database.graph_schema import *
from app.endpoints.data_api.errors.custom_exceptions import (
    AuthorizationError,
    CrudError,
    NotFoundError,
    ValidationError,
)

def _validate_evidence_strength(strength):
    """Normalize/validate an evidence-strength value: int 0-3 or None (unrated)."""
    if strength is None:
        return None
    if isinstance(strength, bool) or not isinstance(strength, int) or strength not in (0, 1, 2, 3):
        raise ValidationError(f"Invalid evidence strength (expected 0-3 or null): {strength!r}")
    return strength


def assign_implementation_to_year_success_indicator(year_success_identifier: str,
                                                    implementation_type: str,
                                                    implementation_title: str,
                                                    strength=None) -> bool:

    strength = _validate_evidence_strength(strength)
    try:
        year_success_evidence = YearSuccessEvidence.nodes.get(year_identifier=year_success_identifier)
        implementation_class = implementation_classes[implementation_type]
        implementation_node = implementation_class.nodes.get(title=implementation_title)

        # Retired implementations are closed to new evidence assignment (their
        # existing historical links are untouched).
        if getattr(implementation_node, 'retired', False):
            raise ValidationError(
                f"Implementation {implementation_title} is retired and cannot be assigned to new evidence"
            )

        if implementation_node.is_evidence_for.is_connected(year_success_evidence):
            raise CrudError(f"Implementation {implementation_title} is already assigned to success indicator {year_success_identifier}")

        if strength is not None:
            implementation_node.is_evidence_for.connect(year_success_evidence, {'strength': strength})
        else:
            implementation_node.is_evidence_for.connect(year_success_evidence)
        print(f"Implementation {implementation_title} assigned to success indicator {year_success_identifier}")
        return True
    except (ValidationError, CrudError):
        raise
    except Exception as e:
        raise CrudError(f"Error assigning implementation {implementation_title} to success indicator {year_success_identifier}: {e}")


def copy_evidence_to_campuses(implementation_type: str,
                              implementation_unique_id: str,
                              year_name: str,
                              source_campus: str,
                              target_campuses,
                              include_people: bool = True):
    """Copy an implementation's current-year evidence links from one campus to
    others: for each YSE the implementation evidences at `source_campus` in
    `year_name`, MERGE an is_evidence_for link to the SAME indicator's YSE at
    each target campus (matched via the tracks edge — no identifier surgery).

    - Strength copies ON CREATE only: a target link that already exists keeps
      its own rating.
    - include_people also MERGEs the source YSE's assigned people
      (Person-implements->YSE) onto the target YSE — for every matched pair,
      so a re-run syncs newly assigned people. Implementation-level owners /
      participants / assets live on the shared implementation node and need
      no copying.
    - Idempotent throughout; targets with no matching indicator YSE are
      reported as skipped, never an error.

    :return: {campus: {created, already_linked, skipped_missing_indicator,
              people_added}}
    """
    if implementation_type not in implementation_classes:
        raise ValidationError(f"Invalid implementation_type: {implementation_type}")
    if not isinstance(target_campuses, (list, tuple)) or not target_campuses:
        raise ValidationError("target_campuses must be a non-empty list of campus abbreviations")
    if source_campus in target_campuses:
        raise ValidationError("source campus cannot be a copy target")

    implementation_class = implementation_classes[implementation_type]
    try:
        impl_node = implementation_class.nodes.get(unique_id=implementation_unique_id)
    except implementation_class.DoesNotExist:
        raise NotFoundError(f"No {implementation_type} found with unique_id: {implementation_unique_id}")

    # Retired implementations are closed to new evidence assignment.
    if getattr(impl_node, 'retired', False):
        raise ValidationError(
            f"Implementation {impl_node.title} is retired and cannot be assigned to new evidence"
        )

    label = implementation_type  # validated against implementation_classes above

    summary = {}
    for target in target_campuses:
        rows, _ = db.cypher_query(
            f"""
            MATCH (impl:{label} {{unique_id: $uid}})-[src_r:is_evidence_for]->(src:YearSuccessEvidence)
                  -[:evidence_in_year]->(y:AcademicYear {{name: $year}})
            WHERE (src)-[:evidence_at_campus]->(:Campus {{abbreviation: $source}})
            MATCH (src)-[:tracks]->(si:SuccessIndicator)
            OPTIONAL MATCH (tgt:YearSuccessEvidence)-[:tracks]->(si)
              WHERE (tgt)-[:evidence_in_year]->(y)
                AND (tgt)-[:evidence_at_campus]->(:Campus {{abbreviation: $target}})
            RETURN src.year_identifier, src_r.strength, tgt.year_identifier,
                   tgt IS NOT NULL AND exists((impl)-[:is_evidence_for]->(tgt))
            """,
            {"uid": implementation_unique_id, "year": year_name,
             "source": source_campus, "target": target},
        )

        created = already = missing = people_added = 0
        for src_id, strength, tgt_id, already_linked in rows:
            if tgt_id is None:
                missing += 1
                continue
            if already_linked:
                already += 1
            else:
                db.cypher_query(
                    f"""
                    MATCH (impl:{label} {{unique_id: $uid}}), (tgt:YearSuccessEvidence {{year_identifier: $tgt_id}})
                    MERGE (impl)-[nr:is_evidence_for]->(tgt)
                    ON CREATE SET nr.strength = $strength
                    """,
                    {"uid": implementation_unique_id, "tgt_id": tgt_id, "strength": strength},
                )
                created += 1
            if include_people:
                prows, _ = db.cypher_query(
                    """
                    MATCH (p:Person)-[:implements]->(:YearSuccessEvidence {year_identifier: $src_id})
                    MATCH (tgt:YearSuccessEvidence {year_identifier: $tgt_id})
                    WHERE NOT (p)-[:implements]->(tgt)
                    MERGE (p)-[:implements]->(tgt)
                    RETURN count(p)
                    """,
                    {"src_id": src_id, "tgt_id": tgt_id},
                )
                people_added += prows[0][0] if prows else 0

        summary[target] = {
            "created": created,
            "already_linked": already,
            "skipped_missing_indicator": missing,
            "people_added": people_added,
        }
    return summary


def set_evidence_strength(year_success_identifier: str,
                          implementation_type: str,
                          implementation_unique_id: str,
                          strength):
    """Set (or clear, with None) the strength rating on an existing
    is_evidence_for link between an implementation and a YSE.

    :return: {'strength': <0-3 or None>} — the stored value.
    """
    strength = _validate_evidence_strength(strength)

    if implementation_type not in implementation_classes:
        raise ValidationError(f"Invalid implementation_type: {implementation_type}")
    implementation_class = implementation_classes[implementation_type]
    try:
        implementation_node = implementation_class.nodes.get(unique_id=implementation_unique_id)
    except implementation_class.DoesNotExist:
        raise NotFoundError(f"No {implementation_type} found with unique_id: {implementation_unique_id}")
    try:
        year_success_evidence = YearSuccessEvidence.nodes.get(year_identifier=year_success_identifier)
    except YearSuccessEvidence.DoesNotExist:
        raise NotFoundError(f"No YearSuccessEvidence found with year_identifier: {year_success_identifier}")

    rel = implementation_node.is_evidence_for.relationship(year_success_evidence)
    if rel is None:
        raise NotFoundError(
            f"{implementation_type} {implementation_unique_id} is not evidence for {year_success_identifier}"
        )

    rel.strength = strength
    rel.save()
    return {'strength': strength}


def set_evidence_control(year_success_identifier: str,
                         implementation_type: str,
                         implementation_unique_id: str,
                         control):
    """Set (or clear, with None) the control flag on an existing
    is_evidence_for link: whether THIS evidence's owners operate the practice
    ('internal') or rely on one they don't directly control ('external' —
    another unit, SFBRN, the CO, a vendor). Relative to the link, not the
    implementation — vocab in data_config.evidence_control_choices.

    :return: {'control': 'internal' | 'external' | None} — the stored value.
    """
    from app.data_config import evidence_control_choices

    if control is not None and control not in evidence_control_choices:
        raise ValidationError(
            f"Invalid evidence control (expected {sorted(evidence_control_choices)} or null): {control!r}"
        )

    if implementation_type not in implementation_classes:
        raise ValidationError(f"Invalid implementation_type: {implementation_type}")
    implementation_class = implementation_classes[implementation_type]
    try:
        implementation_node = implementation_class.nodes.get(unique_id=implementation_unique_id)
    except implementation_class.DoesNotExist:
        raise NotFoundError(f"No {implementation_type} found with unique_id: {implementation_unique_id}")
    try:
        year_success_evidence = YearSuccessEvidence.nodes.get(year_identifier=year_success_identifier)
    except YearSuccessEvidence.DoesNotExist:
        raise NotFoundError(f"No YearSuccessEvidence found with year_identifier: {year_success_identifier}")

    rel = implementation_node.is_evidence_for.relationship(year_success_evidence)
    if rel is None:
        raise NotFoundError(
            f"{implementation_type} {implementation_unique_id} is not evidence for {year_success_identifier}"
        )

    rel.control = control
    rel.save()
    return {'control': control}


def update_status_level_node(unique_id, data):
    """
    Update an existing StatusLevel node's description fields.
    """
    try:
        node = StatusLevel.nodes.get(unique_id=unique_id)
    except StatusLevel.DoesNotExist:
        raise NotFoundError(f"StatusLevel with unique_id '{unique_id}' not found.")
    except Exception as e:
        raise CrudError(f"Failed to retrieve StatusLevel: {e}")

    try:
        if 'description_of_procedures' in data:
            node.description_of_procedures = data['description_of_procedures']
        if 'description_of_documentation' in data:
            node.description_of_documentation = data['description_of_documentation']
        if 'description_of_documentation_evidence' in data:
            node.description_of_documentation_evidence = data['description_of_documentation_evidence']
        if 'description_of_resources' in data:
            node.description_of_resources = data['description_of_resources']
        if 'ati_report_evidence_column' in data:
            node.ati_report_evidence_column = data['ati_report_evidence_column']
        node.save()
        return node.serialize()
    except Exception as e:
        raise CrudError(f"Failed to update StatusLevel: {e}")


def assign_status_to_yse(year_success_identifier: str, status: str) -> bool:
    try:
        year_success_evidence = YearSuccessEvidence.nodes.get(year_identifier=year_success_identifier)
        status_level = StatusLevel.nodes.get(status_level=status)

        year_success_evidence.status_level.disconnect_all()
        year_success_evidence.status_level.connect(status_level)

        print(f"Status of success indicator {year_success_identifier} set to {status}")
        return True
    except Exception as e:
        raise CrudError(f"Error assigning status {status} to success indicator {year_success_identifier}: {e}")


def assign_person_to_yse(year_success_identifier: str, person_name: str) -> bool:
    try:
        year_success_evidence = YearSuccessEvidence.nodes.get(year_identifier=year_success_identifier)
        person = Person.nodes.get(name=person_name)

        if person.implements_yse.is_connected(year_success_evidence):
            raise CrudError(f"Person {person_name} is already assigned to success indicator {year_success_identifier}")

        person.implements_yse.connect(year_success_evidence)
        print(f"Person {person_name} assigned to success indicator {year_success_identifier}")
        return True
    except Exception as e:
        raise CrudError(f"Error assigning person {person_name} to success indicator {year_success_identifier}: {e}")


def assign_department_to_yse(year_success_identifier: str, department_name: str) -> bool:
    try:
        year_success_evidence = YearSuccessEvidence.nodes.get(year_identifier=year_success_identifier)
        department = Department.nodes.get(name=department_name)

        if department.implements_yse.is_connected(year_success_evidence):
            raise CrudError(f"Department {department_name} is already assigned to success indicator {year_success_identifier}")

        department.implements_yse.connect(year_success_evidence)
        print(f"Department {department_name} assigned to success indicator {year_success_identifier}")
        return True
    except Exception as e:
        raise CrudError(f"Error assigning department {department_name} to success indicator {year_success_identifier}: {e}")


def assign_vendor_to_yse(year_success_identifier: str, vendor_name: str) -> bool:
    try:
        year_success_evidence = YearSuccessEvidence.nodes.get(year_identifier=year_success_identifier)
        vendor = Vendor.nodes.get(name=vendor_name)

        if vendor.implements_yse.is_connected(year_success_evidence):
            raise CrudError(f"Vendor {vendor_name} is already assigned to success indicator {year_success_identifier}")

        vendor.implements_yse.connect(year_success_evidence)
        print(f"Vendor {vendor_name} assigned to success indicator {year_success_identifier}")
        return True
    except Exception as e:
        raise CrudError(f"Error assigning vendor {vendor_name} to success indicator {year_success_identifier}: {e}")


def assign_college_to_yse(year_success_identifier: str, college_name: str) -> bool:
    try:
        year_success_evidence = YearSuccessEvidence.nodes.get(year_identifier=year_success_identifier)
        college = College.nodes.get(name=college_name)

        if college.implements_yse.is_connected(year_success_evidence):
            raise CrudError(f"College {college_name} is already assigned to success indicator {year_success_identifier}")

        college.implements_yse.connect(year_success_evidence)
        print(f"College {college_name} assigned to success indicator {year_success_identifier}")
        return True
    except Exception as e:
        raise CrudError(f"Error assigning college {college_name} to success indicator {year_success_identifier}: {e}")


def assign_note_to_yse(year_success_identifier: str, note_name: str) -> bool:
    try:
        year_success_evidence = YearSuccessEvidence.nodes.get(year_identifier=year_success_identifier)
        note = Note.nodes.get(name=note_name)

        if year_success_evidence.notes.is_connected(note):
            raise CrudError(f"YSE {year_success_identifier} already has note {note_name}")

        year_success_evidence.notes.connect(note)
        print(f"Note {note_name} assigned to success indicator {year_success_identifier}")
        return True
    except Exception as e:
        raise CrudError(f"Error assigning note {note_name} to success indicator {year_success_identifier}: {e}")


def assign_metric_to_yse(year_success_identifier: str, metric_composite_key: str) -> bool:
    try:
        year_success_evidence = YearSuccessEvidence.nodes.get(year_identifier=year_success_identifier)
        metric = Metric.nodes.get(composite_key=metric_composite_key)

        if year_success_evidence.metrics.is_connected(metric):
            raise CrudError(f"YSE {year_success_identifier} already has metric {metric_composite_key}")

        year_success_evidence.metrics.connect(metric)
        print(f"Metric {metric_composite_key} assigned to success indicator {year_success_identifier}")
        return True
    except Exception as e:
        raise CrudError(f"Error assigning metric {metric_composite_key} to success indicator {year_success_identifier}: {e}")


def assign_approver_to_yse(year_success_identifier: str, employee_id: str) -> bool:
    try:
        # Attempt to get the YearSuccessEvidence node by year_identifier
        try:
            year_success_evidence = YearSuccessEvidence.nodes.get(year_identifier=year_success_identifier)
        except YearSuccessEvidence.DoesNotExist:
            raise NotFoundError(f"YearSuccessEvidence with identifier '{year_success_identifier}' not found.")

        # Attempt to get the Person node by employee_id
        try:
            person = Person.nodes.get(employee_id=employee_id)
        except Person.DoesNotExist:
            raise NotFoundError(f"Person with employee_id '{employee_id}' not found.")

        # Approving is gated on the Approver flag (Settings -> Members). The flag
        # is data-entry on Person; this is the enforcement point every caller
        # (endpoint, MCP, script) funnels through.
        if not person.can_approve_yse:
            raise AuthorizationError(
                f"Person {employee_id} cannot approve evidence: the Approver flag "
                "(can_approve_yse) is not set."
            )

        # Idempotent: a review that is already complete stays as recorded (first
        # completion wins — a stale second click, by anyone, is a no-op, never a
        # rewire and never an error). Withdraw first to change the approver.
        if year_success_evidence.administrative_review_complete:
            return True

        # Assign the approver
        year_success_evidence.administrative_review_completed_by.connect(person)
        year_success_evidence.administrative_review_complete = True
        year_success_evidence.administrative_review_completed_date = datetime.now().date()
        year_success_evidence.save()

        print(f"Approver {employee_id} assigned to success indicator {year_success_identifier}")
        return True

    except (NotFoundError, AuthorizationError) as e:
        # Reraise for the endpoint's 404/403 mapping.
        raise e

    except Exception as e:
        # Catch any other exceptions and raise them as a CrudError
        raise CrudError(f"Error assigning approver {employee_id} to success indicator {year_success_identifier}: {e}")


def update_admin_reviewer_description(year_success_identifier: str, description: str) -> bool:
    """Update the admin_review_description field for a YearSuccessEvidence node"""
    try:
        try:
            year_success_evidence = YearSuccessEvidence.nodes.get(year_identifier=year_success_identifier)
        except YearSuccessEvidence.DoesNotExist:
            raise NotFoundError(f"YearSuccessEvidence with identifier '{year_success_identifier}' not found.")

        year_success_evidence.admin_review_description = description
        year_success_evidence.save()

        print(f"Admin reviewer description updated for {year_success_identifier}")
        return True

    except NotFoundError as e:
        raise e
    except Exception as e:
        raise CrudError(f"Error updating admin reviewer description for {year_success_identifier}: {e}")


def add_admin_reviewer_note(year_success_identifier: str, note_content: str, created_by_employee_id: str) -> dict:
    """
    Add a new admin reviewer note to a YearSuccessEvidence node.
    Creates a Note node and connects it via the admin_reviewer_note relationship.

    :param year_success_identifier: The year_identifier of the YSE
    :param note_content: The content of the note
    :param created_by_employee_id: The employee_id of the person creating the note
    :return: Dictionary with the created note data
    """
    try:
        # Get the YSE node
        try:
            yse = YearSuccessEvidence.nodes.get(year_identifier=year_success_identifier)
        except YearSuccessEvidence.DoesNotExist:
            raise NotFoundError(f"YearSuccessEvidence with identifier '{year_success_identifier}' not found.")

        # Get the person creating the note
        try:
            person = Person.nodes.get(employee_id=created_by_employee_id)
        except Person.DoesNotExist:
            raise NotFoundError(f"Person with employee_id '{created_by_employee_id}' not found.")

        # Create a unique name for the note
        note_name = f"Admin Review Note - {year_success_identifier} - {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}"

        # Create the note
        note = Note(
            name=note_name,
            content=note_content,
            date_created=datetime.now().date(),
            depreciated=False,
            include_in_report=True
        )
        note.save()

        # Connect the note to the person who created it
        note.created_by.connect(person)

        # Connect the note to the YSE via admin_reviewer_note relationship
        yse.admin_reviewer_note.connect(note)

        print(f"Admin reviewer note added to {year_success_identifier} by {person.name}")

        return {
            "unique_id": note.unique_id,
            "name": note.name,
            "content": note.content,
            "date_created": note.date_created.isoformat() if note.date_created else None,
            "created_by": {
                "name": person.name,
                "employee_id": person.employee_id,
                "email": person.email
            }
        }

    except NotFoundError as e:
        raise e
    except Exception as e:
        raise CrudError(f"Error adding admin reviewer note for {year_success_identifier}: {e}")



def set_ready_for_admin_review(year_success_identifier: str, ready: bool) -> bool:
    """
    Toggle the ready_for_admin_review flag on a YearSuccessEvidence — step one
    of the two-step review workflow (implementor marks ready; a flagged approver
    then completes the review via assign_approver_to_yse). Pre-approval state,
    so un-marking is allowed; approval itself leaves the flag untouched (the UI
    gives Approved precedence). Rollover resets it each year.
    """
    if not isinstance(ready, bool):
        raise ValidationError("'ready' must be a boolean.")
    try:
        try:
            yse = YearSuccessEvidence.nodes.get(year_identifier=year_success_identifier)
        except YearSuccessEvidence.DoesNotExist:
            raise NotFoundError(f"YearSuccessEvidence with identifier '{year_success_identifier}' not found.")

        if yse.ready_for_admin_review != ready:
            yse.ready_for_admin_review = ready
            yse.save()
        return True

    except (NotFoundError, ValidationError) as e:
        raise e
    except Exception as e:
        raise CrudError(f"Error setting ready_for_admin_review on {year_success_identifier}: {e}")


def withdraw_approval(year_success_identifier: str, employee_id: str) -> bool:
    """
    Withdraw a completed administrative review: clears the complete flag and
    date and removes the admin_review_completed_by edge. Gated on the same
    Approver flag as approving (any flagged approver may withdraw — the record
    is a state, not a signature). Idempotent: withdrawing an incomplete review
    is a no-op. The ready_for_admin_review flag is left untouched, so the
    evidence drops back to "ready — awaiting approval".
    """
    try:
        try:
            yse = YearSuccessEvidence.nodes.get(year_identifier=year_success_identifier)
        except YearSuccessEvidence.DoesNotExist:
            raise NotFoundError(f"YearSuccessEvidence with identifier '{year_success_identifier}' not found.")

        try:
            person = Person.nodes.get(employee_id=employee_id)
        except Person.DoesNotExist:
            raise NotFoundError(f"Person with employee_id '{employee_id}' not found.")

        if not person.can_approve_yse:
            raise AuthorizationError(
                f"Person {employee_id} cannot withdraw an approval: the Approver flag "
                "(can_approve_yse) is not set."
            )

        if not yse.administrative_review_complete:
            return True

        yse.administrative_review_completed_by.disconnect_all()
        yse.administrative_review_complete = False
        yse.administrative_review_completed_date = None
        yse.save()
        return True

    except (NotFoundError, AuthorizationError) as e:
        raise e
    except Exception as e:
        raise CrudError(f"Error withdrawing approval on {year_success_identifier}: {e}")


def add_recommendation_to_yse(year_success_identifier: str, recommendation: str,
                              detail: str = None, created_by_employee_id: str = None) -> dict:
    """
    Record an end-of-review-cycle improvement on a YSE: creates a Recommendation
    (status 'open') and wires has_recommendation + created_by.
    """
    if not recommendation or not recommendation.strip():
        raise ValidationError("'recommendation' is required.")
    try:
        try:
            yse = YearSuccessEvidence.nodes.get(year_identifier=year_success_identifier)
        except YearSuccessEvidence.DoesNotExist:
            raise NotFoundError(f"YearSuccessEvidence with identifier '{year_success_identifier}' not found.")

        person = None
        if created_by_employee_id:
            try:
                person = Person.nodes.get(employee_id=created_by_employee_id)
            except Person.DoesNotExist:
                raise NotFoundError(f"Person with employee_id '{created_by_employee_id}' not found.")

        rec = Recommendation(
            recommendation=recommendation.strip(),
            detail=(detail or None),
            date_created=datetime.now().date(),
        )
        rec.save()
        yse.recommendations.connect(rec)
        if person is not None:
            rec.created_by.connect(person)
        return rec.serialize()

    except (NotFoundError, ValidationError) as e:
        raise e
    except Exception as e:
        raise CrudError(f"Error adding recommendation to {year_success_identifier}: {e}")


def update_recommendation(unique_id: str, status: str = None, resolution: str = None,
                          recommendation: str = None, detail: str = None) -> dict:
    """
    Update a Recommendation's lifecycle or text. Moving out of 'open' stamps
    date_resolved; moving back to 'open' clears it. Recommendations are records
    — there is deliberately no delete path.
    """
    from app.data_config import recommendation_statuses

    if status is not None and status not in recommendation_statuses:
        raise ValidationError(
            f"Invalid status (expected {sorted(recommendation_statuses)}): {status!r}"
        )
    try:
        try:
            rec = Recommendation.nodes.get(unique_id=unique_id)
        except Recommendation.DoesNotExist:
            raise NotFoundError(f"Recommendation with unique_id '{unique_id}' not found.")

        if recommendation is not None and recommendation.strip():
            rec.recommendation = recommendation.strip()
        if detail is not None:
            rec.detail = detail or None
        if resolution is not None:
            rec.resolution = resolution or None
        if status is not None and status != rec.status:
            rec.status = status
            rec.date_resolved = None if status == "open" else datetime.now().date()
        rec.save()
        return rec.serialize()

    except (NotFoundError, ValidationError) as e:
        raise e
    except Exception as e:
        raise CrudError(f"Error updating recommendation {unique_id}: {e}")


# ---------------------------------------------------------------------------
# Concern lifecycle — an issue raised on a YSE with no resolution path yet.
# A concern is meant to LEAVE: it converts into a Recommendation or a Plan, or
# it is dismissed. See graph_schema.Concern.
# ---------------------------------------------------------------------------

def add_concern_to_yse(year_success_identifier: str, concern: str,
                       detail: str = None, raised_by_employee_id: str = None) -> dict:
    """
    Record an issue on a YSE for which no path to resolution exists yet: creates
    a Concern (status 'open') and wires has_concern + raised_by.
    """
    if not concern or not concern.strip():
        raise ValidationError("'concern' is required.")
    try:
        try:
            yse = YearSuccessEvidence.nodes.get(year_identifier=year_success_identifier)
        except YearSuccessEvidence.DoesNotExist:
            raise NotFoundError(f"YearSuccessEvidence with identifier '{year_success_identifier}' not found.")

        person = None
        if raised_by_employee_id:
            try:
                person = Person.nodes.get(employee_id=raised_by_employee_id)
            except Person.DoesNotExist:
                raise NotFoundError(f"Person with employee_id '{raised_by_employee_id}' not found.")

        con = Concern(
            concern=concern.strip(),
            detail=(detail or None),
            date_raised=datetime.now().date(),
        )
        con.save()
        yse.concerns.connect(con)
        if person is not None:
            con.raised_by.connect(person)
        return con.serialize()

    except (NotFoundError, ValidationError) as e:
        raise e
    except Exception as e:
        raise CrudError(f"Error adding concern to {year_success_identifier}: {e}")


def update_concern(unique_id: str, status: str = None, resolution: str = None,
                   concern: str = None, detail: str = None) -> dict:
    """
    Update a Concern's lifecycle or text. Moving out of 'open' stamps
    date_resolved; moving back to 'open' clears it. Concerns are records —
    there is deliberately no delete path.

    Setting status to 'converted' directly is allowed but does NOT create the
    target node; use convert_concern_to_recommendation / convert_concern_to_plan
    for that, which also wire the provenance edge.
    """
    from app.data_config import concern_statuses

    if status is not None and status not in concern_statuses:
        raise ValidationError(
            f"Invalid status (expected {sorted(concern_statuses)}): {status!r}"
        )
    try:
        try:
            con = Concern.nodes.get(unique_id=unique_id)
        except Concern.DoesNotExist:
            raise NotFoundError(f"Concern with unique_id '{unique_id}' not found.")

        if concern is not None and concern.strip():
            con.concern = concern.strip()
        if detail is not None:
            con.detail = detail or None
        if resolution is not None:
            con.resolution = resolution or None
        if status is not None and status != con.status:
            con.status = status
            con.date_resolved = None if status == "open" else datetime.now().date()
        con.save()
        return con.serialize()

    except (NotFoundError, ValidationError) as e:
        raise e
    except Exception as e:
        raise CrudError(f"Error updating concern {unique_id}: {e}")


def _load_open_concern(unique_id: str) -> "Concern":
    """Fetch a Concern that is eligible for conversion, or raise."""
    try:
        con = Concern.nodes.get(unique_id=unique_id)
    except Concern.DoesNotExist:
        raise NotFoundError(f"Concern with unique_id '{unique_id}' not found.")
    if con.status == "converted":
        raise ValidationError(
            f"Concern '{unique_id}' has already been converted. Reopen it first to convert again."
        )
    return con


def _yse_for_concern(con: "Concern"):
    """The YearSuccessEvidence a Concern hangs off (has_concern is its anchor)."""
    rows, _ = db.cypher_query(
        """
        MATCH (y:YearSuccessEvidence)-[:has_concern]->(c:Concern {unique_id: $uid})
        RETURN y.year_identifier AS yid
        """,
        {"uid": con.unique_id},
    )
    if not rows:
        raise NotFoundError(f"Concern '{con.unique_id}' is not attached to any YearSuccessEvidence.")
    return rows[0][0]


def convert_concern_to_recommendation(unique_id: str, recommendation: str = None,
                                      detail: str = None, resolution: str = None,
                                      created_by_employee_id: str = None) -> dict:
    """
    Promote a Concern into a Recommendation on the same YSE: creates the
    Recommendation (status 'open'), wires became_recommendation, and closes the
    concern as 'converted'. The concern is kept — it is the provenance record.

    `recommendation` defaults to the concern's own text when not supplied, so
    the cheap path is a one-click promote.
    """
    try:
        con = _load_open_concern(unique_id)
        year_identifier = _yse_for_concern(con)

        rec_text = (recommendation or con.concern or "").strip()
        if not rec_text:
            raise ValidationError("'recommendation' is required (the concern has no text to fall back on).")

        rec_payload = add_recommendation_to_yse(
            year_identifier,
            rec_text,
            detail=(detail if detail is not None else con.detail),
            created_by_employee_id=created_by_employee_id,
        )
        rec = Recommendation.nodes.get(unique_id=rec_payload["unique_id"])

        con.became_recommendation.connect(rec)
        con.status = "converted"
        con.resolution = (resolution or "Converted to a recommendation.")
        con.date_resolved = datetime.now().date()
        con.save()

        return {"concern": con.serialize(), "recommendation": rec.serialize()}

    except (NotFoundError, ValidationError) as e:
        raise e
    except Exception as e:
        raise CrudError(f"Error converting concern {unique_id} to a recommendation: {e}")


def convert_concern_to_plan(unique_id: str, name: str, description: str = None,
                            plan_status: str = "Not Started", resolution: str = None) -> dict:
    """
    Promote a Concern into a Plan furthering the same YSE: creates the Plan via
    the sanctioned add_plan path, wires became_plan, and closes the concern as
    'converted'. The concern is kept as the provenance record.

    The academic year is taken from the YSE the concern hangs off, so the plan
    always lands in the year whose evidence raised it.
    """
    from app.database.queries.implementation.create import add_plan

    if not name or not name.strip():
        raise ValidationError("'name' is required to create a plan.")
    try:
        con = _load_open_concern(unique_id)
        year_identifier = _yse_for_concern(con)

        rows, _ = db.cypher_query(
            """
            MATCH (y:YearSuccessEvidence {year_identifier: $yid})-[:evidence_in_year]->(a:AcademicYear)
            RETURN a.name AS year
            """,
            {"yid": year_identifier},
        )
        if not rows:
            raise NotFoundError(f"YearSuccessEvidence '{year_identifier}' has no academic year.")
        academic_year_name = rows[0][0]

        plan_description = (description or con.detail or con.concern or "").strip()
        if not plan_description:
            raise ValidationError("'description' is required (the concern has no text to fall back on).")

        add_plan({
            "name": name.strip(),
            "description": plan_description,
            "academic_year_name": academic_year_name,
            "furthered_yse_identifier": year_identifier,
            "plan_status": plan_status,
        })

        # add_plan returns a bool; description carries the unique index, so it is
        # the reliable handle on the node just created.
        try:
            plan = Plan.nodes.get(description=plan_description)
        except Plan.DoesNotExist:
            raise CrudError("Plan was created but could not be retrieved by description.")

        con.became_plan.connect(plan)
        con.status = "converted"
        con.resolution = (resolution or f"Converted to plan '{name.strip()}'.")
        con.date_resolved = datetime.now().date()
        con.save()

        return {"concern": con.serialize(), "plan": plan.serialize()}

    except (NotFoundError, ValidationError, CrudError) as e:
        raise e
    except Exception as e:
        raise CrudError(f"Error converting concern {unique_id} to a plan: {e}")
