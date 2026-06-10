#
# COMMITTEE UPDATE QUERIES
#
from neomodel import db

from app.data_config import trajectory_choices
from app.database.graph_schema import *
from app.endpoints.data_api.errors.custom_exceptions import (
    CrudError,
    NotFoundError,
    ValidationError,
)


def add_prioritized_indicator(working_group_plan_identifier: str, indicator_composite_key: str) -> bool:
    """
    Add a `prioritizes_success_indicator` edge from the WorkingGroupPlan
    identified by `working_group_plan_identifier` to the SuccessIndicator
    identified by `indicator_composite_key`.

    Idempotent: re-adding the same edge is a no-op (uses MERGE under the hood).

    Raises NotFoundError if either node is missing, CrudError on failure.
    """
    # Verify both endpoints exist first so we raise NotFoundError with a clear
    # message rather than silently MERGE'ing nothing.
    try:
        WorkingGroupPlan.nodes.get(plan_identifier=working_group_plan_identifier)
    except WorkingGroupPlan.DoesNotExist:
        raise NotFoundError(
            f"WorkingGroupPlan {working_group_plan_identifier!r} not found"
        )

    try:
        SuccessIndicator.nodes.get(composite_key=indicator_composite_key)
    except SuccessIndicator.DoesNotExist:
        raise NotFoundError(
            f"SuccessIndicator {indicator_composite_key!r} not found"
        )

    try:
        db.cypher_query(
            """
            MATCH (wgp:WorkingGroupPlan {plan_identifier: $wgp_id})
            MATCH (si:SuccessIndicator {composite_key: $si_key})
            MERGE (wgp)-[:prioritizes_success_indicator]->(si)
            """,
            {
                "wgp_id": working_group_plan_identifier,
                "si_key": indicator_composite_key,
            },
        )
        return True
    except Exception as e:
        raise CrudError(
            f"Failed to prioritize {indicator_composite_key!r} on {working_group_plan_identifier!r}: {e}"
        )


def remove_prioritized_indicator(working_group_plan_identifier: str, indicator_composite_key: str) -> bool:
    """
    Remove the `prioritizes_success_indicator` edge from the WorkingGroupPlan to the
    SuccessIndicator. The inverse of `add_prioritized_indicator`.

    Idempotent: removing an edge that isn't there is a no-op. Only the priority edge is
    deleted — any ProgressUpdates or companion Plans tied to the indicator are left intact
    (re-prioritizing surfaces them again).

    Raises NotFoundError if the WorkingGroupPlan is missing, CrudError on failure.
    """
    try:
        WorkingGroupPlan.nodes.get(plan_identifier=working_group_plan_identifier)
    except WorkingGroupPlan.DoesNotExist:
        raise NotFoundError(
            f"WorkingGroupPlan {working_group_plan_identifier!r} not found"
        )

    try:
        db.cypher_query(
            """
            MATCH (wgp:WorkingGroupPlan {plan_identifier: $wgp_id})
                  -[r:prioritizes_success_indicator]->
                  (si:SuccessIndicator {composite_key: $si_key})
            DELETE r
            """,
            {
                "wgp_id": working_group_plan_identifier,
                "si_key": indicator_composite_key,
            },
        )
        return True
    except Exception as e:
        raise CrudError(
            f"Failed to un-prioritize {indicator_composite_key!r} on {working_group_plan_identifier!r}: {e}"
        )


def update_campus_plan_summary(plan_identifier: str, executive_summary) -> bool:
    """
    Set the CampusPlan's `executive_summary` (the plan-level narrative shown in the header).
    An empty/blank string clears it (stored as None).

    Raises NotFoundError if the CampusPlan is missing, CrudError on failure.
    """
    try:
        plan = CampusPlan.nodes.get(plan_identifier=plan_identifier)
    except CampusPlan.DoesNotExist:
        raise NotFoundError(f"CampusPlan {plan_identifier!r} not found")

    summary = executive_summary.strip() if isinstance(executive_summary, str) else executive_summary
    try:
        plan.executive_summary = summary or None
        plan.save()
        return True
    except Exception as e:
        raise CrudError(
            f"Failed to update executive summary for {plan_identifier!r}: {e}"
        )


def add_progress_update(
    working_group_plan_identifier: str,
    yse_identifier: str,
    note: str,
    trajectory: str = None,
    author_unique_id: str = None,
) -> ProgressUpdate:
    """
    Create a ProgressUpdate node connected to:
      - WorkingGroupPlan (predicate: has_progress_update)
      - YearSuccessEvidence (predicate: about_yse)
      - Person, if author_unique_id given (predicate: authored_by)

    update_date is set server-side to today.

    Raises NotFoundError if the WGP, YSE, or author Person can't be found.
    Raises CrudError on save failure (incl. neomodel `choices` validation
    failures on `trajectory`).
    """
    from datetime import date

    if trajectory is not None and trajectory not in trajectory_choices:
        raise ValidationError(
            f"Invalid trajectory {trajectory!r}; must be one of {list(trajectory_choices.keys())}"
        )

    try:
        wgp = WorkingGroupPlan.nodes.get(plan_identifier=working_group_plan_identifier)
    except WorkingGroupPlan.DoesNotExist:
        raise NotFoundError(f"WorkingGroupPlan {working_group_plan_identifier!r} not found")

    try:
        yse = YearSuccessEvidence.nodes.get(year_identifier=yse_identifier)
    except YearSuccessEvidence.DoesNotExist:
        raise NotFoundError(f"YearSuccessEvidence {yse_identifier!r} not found")

    author = None
    if author_unique_id:
        try:
            author = Person.nodes.get(unique_id=author_unique_id)
        except Person.DoesNotExist:
            raise NotFoundError(f"Person {author_unique_id!r} not found")

    try:
        pu = ProgressUpdate(
            update_date=date.today(),
            note=note,
            trajectory=trajectory,
        )
        pu.save()
        wgp.progress_updates.connect(pu)
        pu.about_yse.connect(yse)
        if author:
            pu.author.connect(author)
        return pu
    except Exception as e:
        raise CrudError(f"Failed to create ProgressUpdate: {e}")


def _connect_person(node, relationship_attr, person_unique_id, *, what_for):
    """
    Idempotently connect a Person (by unique_id) to `node` via the
    given neomodel relationship attribute name.

    `what_for` is a human-readable noun used in error messages
    (e.g. "executive sponsor", "group lead").
    """
    try:
        person = Person.nodes.get(unique_id=person_unique_id)
    except Person.DoesNotExist:
        raise NotFoundError(f"Person {person_unique_id!r} not found")

    rel = getattr(node, relationship_attr)
    try:
        if not rel.is_connected(person):
            rel.connect(person)
        return True
    except Exception as e:
        raise CrudError(f"Failed to assign {what_for}: {e}")


def _disconnect_person(node, relationship_attr, person_unique_id, *, what_for):
    """Idempotent inverse of `_connect_person`."""
    try:
        person = Person.nodes.get(unique_id=person_unique_id)
    except Person.DoesNotExist:
        raise NotFoundError(f"Person {person_unique_id!r} not found")

    rel = getattr(node, relationship_attr)
    try:
        if rel.is_connected(person):
            rel.disconnect(person)
        return True
    except Exception as e:
        raise CrudError(f"Failed to unassign {what_for}: {e}")


def assign_executive_sponsor_to_campus_plan(plan_identifier: str, person_unique_id: str) -> bool:
    """Connect a Person as an executive sponsor on a CampusPlan. Idempotent."""
    try:
        plan = CampusPlan.nodes.get(plan_identifier=plan_identifier)
    except CampusPlan.DoesNotExist:
        raise NotFoundError(f"CampusPlan {plan_identifier!r} not found")
    return _connect_person(plan, 'executive_sponsors', person_unique_id, what_for='executive sponsor')


def unassign_executive_sponsor_from_campus_plan(plan_identifier: str, person_unique_id: str) -> bool:
    """Disconnect a Person from a CampusPlan's executive sponsors. Idempotent."""
    try:
        plan = CampusPlan.nodes.get(plan_identifier=plan_identifier)
    except CampusPlan.DoesNotExist:
        raise NotFoundError(f"CampusPlan {plan_identifier!r} not found")
    return _disconnect_person(plan, 'executive_sponsors', person_unique_id, what_for='executive sponsor')


def assign_group_lead_to_working_group_plan(working_group_plan_identifier: str, person_unique_id: str) -> bool:
    """Connect a Person as a group lead on a WorkingGroupPlan. Idempotent."""
    try:
        wgp = WorkingGroupPlan.nodes.get(plan_identifier=working_group_plan_identifier)
    except WorkingGroupPlan.DoesNotExist:
        raise NotFoundError(f"WorkingGroupPlan {working_group_plan_identifier!r} not found")
    return _connect_person(wgp, 'group_leads', person_unique_id, what_for='group lead')


def unassign_group_lead_from_working_group_plan(working_group_plan_identifier: str, person_unique_id: str) -> bool:
    """Disconnect a Person from a WorkingGroupPlan's group leads. Idempotent."""
    try:
        wgp = WorkingGroupPlan.nodes.get(plan_identifier=working_group_plan_identifier)
    except WorkingGroupPlan.DoesNotExist:
        raise NotFoundError(f"WorkingGroupPlan {working_group_plan_identifier!r} not found")
    return _disconnect_person(wgp, 'group_leads', person_unique_id, what_for='group lead')


def add_person_to_committee(employee_id, committee_name):
    """
    Assigns a Person to an ATIWorkingGroup based on the provided person_id and committee_name.

    Parameters:
    - employee_id (str): The unique identifier of the Person to be added.
    - committee_name (str): The name of the ATIWorkingGroup to which the Person will be added.

    Returns:
    - str: A message indicating the success or failure of the operation.
    """
    try:
        # Retrieve the Person and ATIWorkingGroup nodes from the database
        person = Person.nodes.get(employee_id=employee_id)
        committee = ATIWorkingGroup.nodes.get(name=committee_name)

        # Create the relationship between the Person and the ATIWorkingGroup
        person.in_ati_working_group.connect(committee)

        return f"Person with ID {employee_id} has been successfully added to the committee '{committee_name}'."
    except Exception as e:
        return f"An error occurred: {str(e)}"