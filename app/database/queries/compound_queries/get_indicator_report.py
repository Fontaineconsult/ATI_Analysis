#
# SINGLE-INDICATOR REPORT
#
# Purpose-built, render-ready payload for ONE success indicator at one campus/year —
# the data behind the dashboard "View" report. Unlike fetch_evidence_for_working_group
# (which loads an entire working group into the DataContext tree), this returns exactly
# one indicator, enriched with every part of the current graph backbone the report should
# surface: the remediation layer (Assets / Interfaces / Tools / Vendors), AMM Dimension
# classification, the people layer (implementers + their roles, per-implementation
# participants and owner), and TAAPs.
#
# Design notes:
#   - Bulk traversal is neomodel + each node's own serialize(), so the shape stays in
#     lockstep with the schema and we reuse serialize_participants / serialize_role_holdings.
#   - Filtering is done HERE (server-side): include_in_report and the DocumentedByRel
#     year gate (included_in_years / excluded_from_years). The frontend renders what it gets.
#   - The asset/interface/tool/vendor rollup and plan/accomplishment edges have no forward
#     neomodel manager on the implementation side (they live as reverse edges on Asset/Tool),
#     so they come from a single apoc.convert.toJson Cypher — the same pattern the compound
#     query uses.
#
import json

from app.database.graph_schema import (
    SuccessIndicator,
    YearSuccessEvidence,
    serialize_participants,
    serialize_role_holdings,
)
from app.endpoints.data_api.errors.custom_exceptions import NotFoundError
from neomodel import db

# The four "doing" implementations carry remediation, an accountable working group, and a
# participant team; the reference/governance types (Guidance, Tracking, InternalPolicy) do not.
_DOING_TYPES = ("Process", "Project", "Procedure", "Service")

# (reverse-manager on YSE, human label) for each evidence-bearing implementation type.
_EVIDENCE_MANAGERS = (
    ("processes_that_evidence", "Process"),
    ("projects_that_evidence", "Project"),
    ("procedures_that_evidence", "Procedure"),
    ("services_that_evidence", "Service"),
    ("guidance_that_evidence", "Guidance"),
    ("trackings_that_evidence", "Tracking"),
    ("internal_policies_that_evidence", "InternalPolicy"),
)


def _person_ref(person):
    """Compact person projection for inline display."""
    return {
        "unique_id": person.unique_id,
        "name": person.name,
        "title": person.title,
        "email": person.email,
        "ati_role": person.ati_role,
    }


def _included(node):
    """A node is shown unless it explicitly opts out via include_in_report=False."""
    return getattr(node, "include_in_report", True) is not False


def _supporting(manager, academic_year):
    """Serialize a supporting_documents/webpages/notes/messages manager, dropping nodes
    that opt out of the report and (when the edge carries a DocumentedByRel) those whose
    year gate excludes the selected academic year."""
    out = []
    for node in manager.all():
        if not _included(node):
            continue
        try:
            rel = manager.relationship(node)
        except Exception:
            rel = None
        if rel is not None:
            included_years = getattr(rel, "included_in_years", None)
            excluded_years = getattr(rel, "excluded_from_years", None)
            if included_years and academic_year not in included_years:
                continue
            if excluded_years and academic_year in excluded_years:
                continue
        out.append(node.serialize())
    return out


def _implementation_payload(impl, type_name, academic_year):
    """Render-ready projection of one implementation node: its documentation (filtered),
    owner, AMM dimensions, and — for the doing-types — accountable working group,
    participant team, and the interfaces it remediates."""
    owner = impl.owned_by.single() if hasattr(impl, "owned_by") else None

    payload = {
        "type": type_name,
        "unique_id": impl.unique_id,
        "title": impl.title,
        "description": impl.description,
        "owner": _person_ref(owner) if owner else None,
        "dimensions": (
            [{"handle": d.handle, "name": d.name} for d in impl.classified_under.all()]
            if hasattr(impl, "classified_under") else []
        ),
        "documents": _supporting(impl.supporting_documents, academic_year),
        "webpages": _supporting(impl.supporting_webpages, academic_year),
        "notes": _supporting(impl.supporting_notes, academic_year),
        "messages": _supporting(impl.supporting_messages, academic_year),
        "metrics": [m.serialize() for m in impl.supporting_metrics.all() if _included(m)],
        # Doing-type-only enrichments (empty/None for reference types).
        "accountable_working_group": None,
        "participants": [],
        "remediates_interfaces": [],
    }

    if type_name in _DOING_TYPES:
        awg = impl.accountable_working_group.single()
        payload["accountable_working_group"] = awg.name if awg else None
        payload["participants"] = serialize_participants(impl)
        payload["remediates_interfaces"] = [
            {
                "interface_identifier": iface.interface_identifier,
                "title": iface.title,
                "function": iface.function,
                "unique_id": iface.unique_id,
            }
            for iface in impl.remediates_interface.all()
        ]

    return payload


def _taap_payload(taap, academic_year):
    """TAAP projection: the plan itself + the assets it covers, its owner/signatory, and
    its supporting documentation (year-filtered like any other evidence)."""
    data = taap.serialize()
    owner = taap.owned_by.single()
    data["owner"] = _person_ref(owner) if owner else None
    data["signed_by"] = [_person_ref(p) for p in taap.signed_by.all()]
    data["covers_assets"] = [
        {"asset_identifier": a.asset_identifier, "title": a.title, "unique_id": a.unique_id}
        for a in taap.covers_asset.all()
    ]
    data["documents"] = _supporting(taap.supporting_documents, academic_year)
    data["webpages"] = _supporting(taap.supporting_webpages, academic_year)
    data["notes"] = _supporting(taap.supporting_notes, academic_year)
    data["messages"] = _supporting(taap.supporting_messages, academic_year)
    return data


def _resolve_identity(composite_key, academic_year, campus_abbreviation):
    """Resolve the indicator + its goal/working-group context and the matching YSE's
    year_identifier in a single query. Keeps date-typed fields out of raw Cypher (the
    rest of the payload comes from neomodel serialize(), which yields JSON-safe values)."""
    query = """
        MATCH (si:SuccessIndicator {composite_key: $composite_key})
        OPTIONAL MATCH (g:Goal)-[:supported_by]->(si)
        OPTIONAL MATCH (wg:ATIWorkingGroup)-[:responsible_for]->(g)
        WITH si, g, wg
        MATCH (si)<-[:tracks]-(yse:YearSuccessEvidence)-[:evidence_in_year]->(:AcademicYear {name: $academic_year})
        OPTIONAL MATCH (yse)-[:evidence_at_campus]->(c:Campus)
        WITH si, g, wg, yse, c
        WHERE $campus IS NULL OR c.abbreviation = $campus
        RETURN yse.year_identifier   AS year_identifier,
               g.goal_number         AS goal_number,
               g.name                AS goal_name,
               wg.name               AS working_group,
               c.abbreviation        AS campus_abbreviation,
               c.name                AS campus_name
        LIMIT 1
    """
    rows, _meta = db.cypher_query(
        query,
        {"composite_key": composite_key, "academic_year": academic_year, "campus": campus_abbreviation},
        resolve_objects=False,
    )
    if not rows:
        raise NotFoundError(
            f"No evidence for indicator '{composite_key}' in {academic_year}"
            + (f" at campus '{campus_abbreviation}'" if campus_abbreviation else "")
        )
    keys = ["year_identifier", "goal_number", "goal_name", "working_group", "campus_abbreviation", "campus_name"]
    return dict(zip(keys, rows[0]))


def _rollup(year_identifier):
    """Assets / Interfaces / Tools / Vendors touched by the indicator's work, plus the
    Plans and Accomplishments that further/advance the YSE. These edges have no forward
    neomodel manager on the implementation side, so they come from one apoc Cypher (the
    same backward-traversal pattern as the compound query). Assets are reached three ways:
    directly remediated, via a remediated interface's backing asset, and via a used tool's
    parent asset — reached_via records which."""
    query = """
        MATCH (yse:YearSuccessEvidence {year_identifier: $yse_id})
        WITH yse,
          [ (yse)<-[:is_evidence_for]-(impl)-[:remediates]->(a:Asset)
              | a {.asset_identifier, .title, .unique_id, .scope, .asset_class, .version, .description, reached_via: 'remediated'} ]
          + [ (yse)<-[:is_evidence_for]-(impl)-[:remediates_interface]->(:Interface)-[:presented_by]->(a:Asset)
              | a {.asset_identifier, .title, .unique_id, .scope, .asset_class, .version, .description, reached_via: 'interface'} ]
          + [ (yse)<-[:is_evidence_for]-(impl)-[:uses_tool]->(:Tool)-[:tool_of_asset]->(a:Asset)
              | a {.asset_identifier, .title, .unique_id, .scope, .asset_class, .version, .description, reached_via: 'tool'} ]
          AS assets,
          apoc.coll.toSet([ (yse)<-[:is_evidence_for]-(impl)-[:remediates_interface]->(i:Interface)
              | i {.interface_identifier, .title, .unique_id, .function, .locus, .coverage_domains, .audience, .provenance, .description} ]) AS interfaces,
          apoc.coll.toSet([ (yse)<-[:is_evidence_for]-(impl)-[:uses_tool]->(t:Tool)
              | t {.tool_identifier, .title, .unique_id, .description} ]) AS tools,
          apoc.coll.toSet(
            [ (yse)<-[:is_evidence_for]-(impl)-[:remediates]->(:Asset)-[:supplied_by]->(v:Vendor) | v {.name, .location, .unique_id, .sales_contact_name, .sales_contact_email, .technical_contact_name, .technical_contact_email} ]
            + [ (yse)<-[:is_evidence_for]-(impl)-[:uses_tool]->(:Tool)-[:supplied_by]->(v:Vendor) | v {.name, .location, .unique_id, .sales_contact_name, .sales_contact_email, .technical_contact_name, .technical_contact_email} ]
          ) AS vendors,
          [ (p:Plan)-[:furthers_yse]->(yse)
              | p {.name, .description, .unique_id, .plan_status, .abandoned, .abandoned_notes, .is_key_plan, .is_campus_plan, include_in_report: p.include_in_report} ] AS plans,
          [ (acc:Accomplishment)-[:advances_yse]->(yse) | acc {.name, .description, .unique_id} ] AS accomplishments
        RETURN apoc.convert.toJson({
          assets: assets, interfaces: interfaces, tools: tools, vendors: vendors, plans: plans, accomplishments: accomplishments
        }) AS j
    """
    rows, _meta = db.cypher_query(query, {"yse_id": year_identifier})
    if not rows or not rows[0] or not rows[0][0]:
        return {"assets": [], "interfaces": [], "tools": [], "vendors": [], "plans": [], "accomplishments": []}
    data = json.loads(rows[0][0])

    # Dedupe assets by unique_id, merging the reached_via tags (an asset can be touched
    # directly AND via an interface/tool — that confluence is worth showing, not hiding).
    merged = {}
    for asset in data.get("assets", []):
        key = asset.get("unique_id")
        via = asset.pop("reached_via", None)
        if key not in merged:
            merged[key] = {**asset, "reached_via": []}
        if via and via not in merged[key]["reached_via"]:
            merged[key]["reached_via"].append(via)
    data["assets"] = list(merged.values())

    # Plans honor include_in_report like every other report element.
    data["plans"] = [p for p in data.get("plans", []) if p.get("include_in_report") is not False]
    return data


def get_indicator_report(composite_key, academic_year, campus_abbreviation=None):
    """Build the full single-indicator report payload.

    :param composite_key: e.g. "1.12-web"
    :param academic_year: e.g. "2024-2025"
    :param campus_abbreviation: e.g. "sfsu" (optional; required in practice for a clean
        single result, since YSEs are per-campus)
    :return: a JSON-serializable dict (see module docstring for the section shape)
    """
    identity = _resolve_identity(composite_key, academic_year, campus_abbreviation)
    year_identifier = identity["year_identifier"]

    yse = YearSuccessEvidence.nodes.get_or_none(year_identifier=year_identifier)
    if yse is None:
        raise NotFoundError(f"YearSuccessEvidence '{year_identifier}' not found")
    indicator = SuccessIndicator.nodes.get(composite_key=composite_key)

    status = yse.status_level.single()
    completed_by = yse.administrative_review_completed_by.single()

    implementations = []
    for manager_name, type_name in _EVIDENCE_MANAGERS:
        for impl in getattr(yse, manager_name).all():
            implementations.append(_implementation_payload(impl, type_name, academic_year))

    rollup = _rollup(year_identifier)

    return {
        "indicator": {
            "composite_key": composite_key,
            "success_indicator": indicator.success_indicator,
            "number": indicator.number,
            "removed": indicator.removed,
            "date_added": indicator.date_added,
            "goal_number": identity["goal_number"],
            "goal_name": identity["goal_name"],
            "working_group": identity["working_group"],
        },
        "year": academic_year,
        "campus": {
            "abbreviation": identity["campus_abbreviation"],
            "name": identity["campus_name"],
        },
        "status": (
            {"status_level": status.status_level, "status_value": getattr(status, "status_value", None)}
            if status else None
        ),
        "yse": {
            "year_identifier": yse.year_identifier,
            "unique_id": yse.unique_id,
            "administrative_review_complete": getattr(yse, "administrative_review_complete", None),
            "administrative_review_completed_date": getattr(yse, "administrative_review_completed_date", None),
            "admin_review_description": getattr(yse, "admin_review_description", None),
        },
        "people": {
            "implementers": [
                {**_person_ref(p), "roles": serialize_role_holdings(p)}
                for p in yse.persons_that_implement.all()
            ],
            "admin_reviewers": [_person_ref(p) for p in yse.assigned_reviewers.all()],
            "admin_review_completed_by": _person_ref(completed_by) if completed_by else None,
        },
        "admin_review_notes": [
            {**note.serialize(), "created_by": (
                lambda author: {"unique_id": author.unique_id, "name": author.name} if author else None
            )(note.created_by.single())}
            for note in yse.admin_reviewer_note.all()
        ],
        "implementations": implementations,
        "taaps": [_taap_payload(t, academic_year) for t in yse.taaps_that_evidence.all()],
        "assets": rollup["assets"],
        "interfaces": rollup["interfaces"],
        "tools": rollup["tools"],
        "vendors": rollup["vendors"],
        "plans": rollup["plans"],
        "accomplishments": rollup["accomplishments"],
        "notes": [n.serialize() for n in yse.notes.all() if _included(n)],
        "messages": [m.serialize() for m in yse.messages.all() if _included(m)],
        "metrics": [m.serialize() for m in yse.metrics.all() if _included(m)],
    }


def get_goal_report(goal_number, working_group_code, academic_year, campus_abbreviation=None):
    """Build the full report for EVERY indicator in one goal (within a working group) at a
    year/campus — i.e. the goal an indicator belongs to, in one fetch.

    The goal + group is identified by composite-key shape: keys that start with
    `{goal_number}.` and end with `-{code}` (e.g. goal 5 / web → "5.1-web", "5.4-web", …).
    The `{goal_number}.` prefix is exact — "5." matches 5.x but not 50.x. The dashboard
    fetches the whole goal in one shot and caches it, so opening one indicator's report
    pre-loads its goal siblings.

    :param goal_number: the goal number (e.g. 5), as a string or int
    :param working_group_code: "web" | "pro" | "ins"
    :param academic_year: e.g. "2024-2025"
    :param campus_abbreviation: e.g. "sfsu" (optional)
    :return: {working_group, goal_number, year, campus, indicators: {<composite_key>: <report>, ...}}
    """
    goal_prefix = f"{goal_number}."
    suffix = f"-{working_group_code}"
    rows, _meta = db.cypher_query(
        """
        MATCH (si:SuccessIndicator)<-[:tracks]-(yse:YearSuccessEvidence)-[:evidence_in_year]->(:AcademicYear {name: $year})
        OPTIONAL MATCH (yse)-[:evidence_at_campus]->(c:Campus)
        WITH si, c
        WHERE si.composite_key STARTS WITH $goal_prefix AND si.composite_key ENDS WITH $suffix
          AND ($campus IS NULL OR c.abbreviation = $campus)
        RETURN DISTINCT si.composite_key AS composite_key
        ORDER BY composite_key
        """,
        {"year": academic_year, "goal_prefix": goal_prefix, "suffix": suffix, "campus": campus_abbreviation},
    )

    indicators = {}
    for (composite_key,) in rows:
        try:
            indicators[composite_key] = get_indicator_report(
                composite_key, academic_year, campus_abbreviation=campus_abbreviation
            )
        except NotFoundError:
            # An indicator that resolved above but can't be built (e.g. a race) is skipped
            # rather than failing the whole goal.
            continue

    return {
        "working_group": working_group_code,
        "goal_number": str(goal_number),
        "year": academic_year,
        "campus": campus_abbreviation,
        "indicators": indicators,
    }
