#
# COMMITTEE READ QUERIES
#
from neomodel import db

from app.database.graph_schema import *
from app.database.identifiers import make_campus_plan_identifier, previous_academic_year
from app.endpoints.data_api.errors.custom_exceptions import NotFoundError


# The shared implementation now lives in identifiers.py so the single-indicator
# report can reuse it. Kept as a module alias for the call sites below.
_previous_academic_year = previous_academic_year


def get_all_committees() -> list:
    """
    Get all ATIWorkingGroup nodes from the graph
    :return: List of ATIWorkingGroup nodes
    """
    return ATIWorkingGroup.nodes.all()


def fetch_campus_plan(campus_abbrev: str, year_name: str) -> dict:
    """
    Return the CampusPlan for (campus, year) along with its WorkingGroupPlan
    children. Raises NotFoundError if no such plan exists.

    Shape:
      {
        "plan_identifier": "2025-2026-sfsu",
        "academic_year": "2025-2026",
        "campus": {"abbreviation": "sfsu", "name": "..."},
        "executive_summary": str | None,
        "executive_sponsors": [Person.serialize(), ...],
        "working_group_plans": [
          {
            "plan_identifier": "2025-2026-sfsu-web",
            "working_group": "Web",
            "prioritized_success_indicators": [SuccessIndicator.serialize(), ...],
            "group_leads": [Person.serialize(), ...],
          },
          ...
        ]
      }
    """
    plan_identifier = make_campus_plan_identifier(year_name, campus_abbrev)

    try:
        plan = CampusPlan.nodes.get(plan_identifier=plan_identifier)
    except CampusPlan.DoesNotExist:
        raise NotFoundError(f"CampusPlan {plan_identifier!r} not found")

    campus_node = plan.campus.single()
    year_node = plan.academic_year.single()

    # Policy intent is one President Summary Report per plan, so serialize as a
    # single object (or None) even though the schema allows many. If multiple
    # are attached, take the first — eventually we'll add cardinality=ZeroOrOne.
    presidents_report_nodes = plan.presidents_report.all()
    presidents_report = (
        presidents_report_nodes[0].serialize() if presidents_report_nodes else None
    )

    # The campus + year used to surface plans per WGP — pulled from the
    # connected nodes when present, falling back to the args.
    campus_for_plans = campus_node.abbreviation if campus_node else campus_abbrev
    year_for_plans = year_node.name if year_node else year_name

    return {
        "plan_identifier": plan.plan_identifier,
        "academic_year": year_node.name if year_node else year_name,
        "campus": (
            {"abbreviation": campus_node.abbreviation, "name": campus_node.name}
            if campus_node
            else None
        ),
        "executive_summary": plan.executive_summary,
        "executive_sponsors": [p.serialize() for p in plan.executive_sponsors.all()],
        "presidents_report": presidents_report,
        "working_group_plans": [
            _serialize_working_group_plan(wgp, campus_for_plans, year_for_plans)
            for wgp in plan.working_group_plans.all()
        ],
    }


# Cypher for the per-WGP plan surfacing query. Walks
#   Plan -[:furthers_yse]-> YSE -[:evidence_at_campus]-> Campus
#                              -[:evidence_in_year]-> AcademicYear
#                              -[:tracks]-> SI <-[:supported_by]- Goal
#                                              <-[:responsible_for]- ATIWorkingGroup
# and returns DISTINCT Plans flagged is_campus_plan = true. The Goal hop is
# the structural source of truth for SI <-> WG; we deliberately don't filter
# on the SI.composite_key suffix even though it usually agrees, to stay robust
# if a SI is moved between Goals.
#
# Plan.in_academic_year marks when the plan was created and is also the target
# completion year. Plan.completed_in_year is set when the plan actually closed.
# Both surface here so the frontend can show "Year: 2024-2025" / "Completed 2025-2026".
_PLANS_FOR_WGP_QUERY = """
    MATCH (p:Plan)-[:furthers_yse]->(yse:YearSuccessEvidence)
    WHERE p.is_campus_plan = true
    MATCH (yse)-[:evidence_at_campus]->(:Campus {abbreviation: $campus_abbrev})
    MATCH (yse)-[:evidence_in_year]->(:AcademicYear {name: $year_name})
    MATCH (yse)-[:tracks]->(:SuccessIndicator)
                  <-[:supported_by]-(:Goal)
                  <-[:responsible_for]-(:ATIWorkingGroup {name: $wg_name})
    OPTIONAL MATCH (p)-[:in_academic_year]->(planYear:AcademicYear)
    OPTIONAL MATCH (p)-[:completed_in_year]->(completedYear:AcademicYear)
    OPTIONAL MATCH (p)-[:abandoned_in_year]->(abandonedYear:AcademicYear)
    // Visibility rule:
    //   - Plans from the current year (or a future/unknown year) always show,
    //     whatever their status — they're this year's work.
    //   - Plans carried over from a PREVIOUS year show ONLY if they're still
    //     active. A prior-year plan that is abandoned, on hold, or complete is
    //     hidden, so the campus plan surfaces current, actionable work instead of
    //     last year's finished/dead carry-overs.
    //   "Done/dead" is detected from plan_status, the abandoned flag, OR the
    //   completed_in_year / abandoned_in_year edges, so inconsistently-recorded
    //   plans are still filtered. Stored statuses are 'Completed'/'Abandoned'/
    //   'On Hold' (data_config spells complete as 'Complete' — match both).
    //   AcademicYear names are fixed-width "YYYY-YYYY", so lexical >= is chronological.
    WITH p, planYear, completedYear, abandonedYear
    WHERE coalesce(planYear.name, $year_name) >= $year_name
       OR NOT (
            coalesce(p.abandoned, false)
            OR p.plan_status IN ['On Hold', 'Complete', 'Completed', 'Abandoned']
            OR completedYear IS NOT NULL
            OR abandonedYear IS NOT NULL
          )
    RETURN DISTINCT p,
                    planYear.name      AS plan_year,
                    completedYear.name AS completed_year,
                    abandonedYear.name AS abandoned_year
"""


def _fetch_plans_for_working_group(wg_name: str, campus_abbrev: str, year_name: str) -> list:
    if not wg_name:
        return []
    results, _ = db.cypher_query(
        _PLANS_FOR_WGP_QUERY,
        {"wg_name": wg_name, "campus_abbrev": campus_abbrev, "year_name": year_name},
    )
    plans = []
    for plan_node, plan_year, completed_year, abandoned_year in results:
        data = Plan.inflate(plan_node).serialize()
        # Created/target year (per the policy, also the intended completion year).
        data["academic_year"] = plan_year
        data["completed_year"] = completed_year
        data["abandoned_year"] = abandoned_year
        plans.append(data)
    return plans


# Cypher for the per-WGP companion-plans-per-indicator query. Walks
#   WGP -[:prioritises_success_indicator]-> SI
#   <-[:tracks]- YSE -[:evidence_at_campus]-> Campus (must match)
#                    -[:evidence_in_year]-> AcademicYear (must match)
#                    <-[:furthers_yse]- Plan (is_campus_plan = true)
# and returns each prioritized SI's id alongside the list of campus-plan
# Plans for THIS campus + year that target it. The list-comprehension
# `WHERE pp.unique_id IS NOT NULL` strips the {null,null} placeholder rows
# that OPTIONAL MATCH produces when no plan matches a given SI.
_COMPANION_PLANS_FOR_WGP_QUERY = """
    MATCH (wgp:WorkingGroupPlan {plan_identifier: $wgp_identifier})
          -[:prioritizes_success_indicator]->(si:SuccessIndicator)
    OPTIONAL MATCH (p:Plan)-[:furthers_yse]->(yse:YearSuccessEvidence)
                           -[:tracks]->(si)
    WHERE p.is_campus_plan = true
      AND (yse)-[:evidence_at_campus]->(:Campus {abbreviation: $campus_abbrev})
      AND (yse)-[:evidence_in_year]->(:AcademicYear {name: $year_name})
    OPTIONAL MATCH (p)-[:in_academic_year]->(planYear:AcademicYear)
    OPTIONAL MATCH (p)-[:completed_in_year]->(completedYear:AcademicYear)
    WITH si, p, planYear, completedYear
    RETURN si.unique_id AS si_id,
           [pp IN collect(DISTINCT {
               unique_id: p.unique_id,
               name: p.name,
               description: p.description,
               plan_status: p.plan_status,
               abandoned: coalesce(p.abandoned, false),
               academic_year: planYear.name,
               completed_year: completedYear.name
           }) WHERE pp.unique_id IS NOT NULL] AS companion_plans
"""


# All non-removed SuccessIndicators owned by an ATIWorkingGroup, with each
# indicator's YSE/StatusLevel for THIS campus + year (when present). Used to
# populate the "+ Add Indicator" modal — picking the right indicator is much
# easier when you can see "this one's at Established already, that one's
# Not Started." Both YSE and StatusLevel are OPTIONAL — a freshly-stubbed
# indicator may have neither.
_AVAILABLE_INDICATORS_FOR_WG_QUERY = """
    MATCH (:ATIWorkingGroup {name: $wg_name})-[:responsible_for]->(:Goal)
          -[:supported_by]->(si:SuccessIndicator)
    WHERE si.removed = false OR si.removed IS NULL

    // Current-year YSE + StatusLevel for this campus.
    OPTIONAL MATCH (yse:YearSuccessEvidence)-[:tracks]->(si)
    WHERE (yse)-[:evidence_at_campus]->(:Campus {abbreviation: $campus_abbrev})
      AND (yse)-[:evidence_in_year]->(:AcademicYear {name: $year_name})
    OPTIONAL MATCH (yse)-[:status_is]->(sl:StatusLevel)

    // Previous-year YSE + StatusLevel for this campus — surfaced so the UI
    // can show the year-over-year progression ("Initiated → Defined").
    OPTIONAL MATCH (prevYse:YearSuccessEvidence)-[:tracks]->(si)
    WHERE (prevYse)-[:evidence_at_campus]->(:Campus {abbreviation: $campus_abbrev})
      AND (prevYse)-[:evidence_in_year]->(:AcademicYear {name: $previous_year_name})
    OPTIONAL MATCH (prevYse)-[:status_is]->(prevSl:StatusLevel)

    RETURN DISTINCT si,
                    yse.year_identifier      AS yse_identifier,
                    sl.status_level          AS status_level,
                    sl.status_value          AS status_value,
                    prevSl.status_level      AS previous_status_level,
                    prevSl.status_value      AS previous_status_value
    ORDER BY si.composite_key
"""


def _fetch_available_indicators_for_wg(wg_name: str, campus_abbrev: str, year_name: str) -> list:
    if not wg_name:
        return []
    results, _ = db.cypher_query(
        _AVAILABLE_INDICATORS_FOR_WG_QUERY,
        {
            "wg_name": wg_name,
            "campus_abbrev": campus_abbrev,
            "year_name": year_name,
            "previous_year_name": _previous_academic_year(year_name),
        },
    )
    indicators = []
    for si_node, yse_id, status_level, status_value, prev_status_level, prev_status_value in results:
        data = SuccessIndicator.inflate(si_node).serialize()
        data["yse_identifier"] = yse_id
        data["status_level"] = status_level
        data["status_value"] = status_value
        data["previous_status_level"] = prev_status_level
        data["previous_status_value"] = prev_status_value
        indicators.append(data)
    return indicators


# Per-prioritized-SI status: walks WGP → prioritized SI ← YSE → StatusLevel
# for both current and previous year. Returns
# {si_id: {status_level, status_value, previous_status_level, previous_status_value}}.
_STATUS_FOR_WGP_PRIORITIZED_QUERY = """
    MATCH (:WorkingGroupPlan {plan_identifier: $wgp_id})
          -[:prioritizes_success_indicator]->(si:SuccessIndicator)

    OPTIONAL MATCH (yse:YearSuccessEvidence)-[:tracks]->(si)
    WHERE (yse)-[:evidence_at_campus]->(:Campus {abbreviation: $campus_abbrev})
      AND (yse)-[:evidence_in_year]->(:AcademicYear {name: $year_name})
    OPTIONAL MATCH (yse)-[:status_is]->(sl:StatusLevel)

    OPTIONAL MATCH (prevYse:YearSuccessEvidence)-[:tracks]->(si)
    WHERE (prevYse)-[:evidence_at_campus]->(:Campus {abbreviation: $campus_abbrev})
      AND (prevYse)-[:evidence_in_year]->(:AcademicYear {name: $previous_year_name})
    OPTIONAL MATCH (prevYse)-[:status_is]->(prevSl:StatusLevel)

    RETURN si.unique_id     AS si_id,
           sl.status_level  AS status_level,
           sl.status_value  AS status_value,
           prevSl.status_level AS previous_status_level,
           prevSl.status_value AS previous_status_value
"""


def _fetch_status_by_si(wgp_identifier: str, campus_abbrev: str, year_name: str) -> dict:
    results, _ = db.cypher_query(
        _STATUS_FOR_WGP_PRIORITIZED_QUERY,
        {
            "wgp_id": wgp_identifier,
            "campus_abbrev": campus_abbrev,
            "year_name": year_name,
            "previous_year_name": _previous_academic_year(year_name),
        },
    )
    return {
        si_id: {
            "status_level": status_level,
            "status_value": status_value,
            "previous_status_level": prev_status_level,
            "previous_status_value": prev_status_value,
        }
        for si_id, status_level, status_value, prev_status_level, prev_status_value in results
    }


def _fetch_companion_plans_by_si(wgp_identifier: str, campus_abbrev: str, year_name: str) -> dict:
    """
    Return {si_unique_id -> [companion_plan_dict, ...]} for every prioritized SI
    on this WGP. Empty list when an SI has no campus-plan Plan attached.
    """
    results, _ = db.cypher_query(
        _COMPANION_PLANS_FOR_WGP_QUERY,
        {"wgp_identifier": wgp_identifier, "campus_abbrev": campus_abbrev, "year_name": year_name},
    )
    return {si_id: companion_plans for si_id, companion_plans in results}


# Per-prioritized-SI progress data: walks each prioritized SI's YSE (for this
# campus + year), then to ProgressUpdates connected to this WGP that target
# that YSE. Returns per-SI: yse_identifier, update_count, and ALL updates
# (newest first) — the WorkingGroupPlan view renders them as a timeline.
_PROGRESS_FOR_WGP_QUERY = """
    MATCH (wgp:WorkingGroupPlan {plan_identifier: $wgp_id})
          -[:prioritizes_success_indicator]->(si:SuccessIndicator)
    OPTIONAL MATCH (yse:YearSuccessEvidence)-[:tracks]->(si)
    WHERE (yse)-[:evidence_at_campus]->(:Campus {abbreviation: $campus_abbrev})
      AND (yse)-[:evidence_in_year]->(:AcademicYear {name: $year_name})
    OPTIONAL MATCH (wgp)-[:has_progress_update]->(pu:ProgressUpdate)-[:about_yse]->(yse)
    OPTIONAL MATCH (pu)-[:authored_by]->(author:Person)
    WITH si, yse, pu, author
    ORDER BY pu.update_date DESC
    WITH si, yse,
         [item IN collect({pu: pu, author: author}) WHERE item.pu IS NOT NULL] AS valid_items
    RETURN si.unique_id AS si_id,
           yse.year_identifier AS yse_id,
           size(valid_items) AS update_count,
           valid_items AS updates
"""


def _fetch_progress_by_si(wgp_identifier: str, campus_abbrev: str, year_name: str) -> dict:
    """
    {si_unique_id -> {yse_identifier, update_count, updates}} for every
    prioritized SI on this WGP. `updates` is the full list of ProgressUpdate
    entries (newest first), or [] when none exist. `yse_identifier` is null
    if no matching YSE exists for this (campus, year, SI).
    """
    from app.database.graph_schema import Person, ProgressUpdate

    results, _ = db.cypher_query(
        _PROGRESS_FOR_WGP_QUERY,
        {"wgp_id": wgp_identifier, "campus_abbrev": campus_abbrev, "year_name": year_name},
    )
    by_si_id = {}
    for si_id, yse_id, update_count, updates_raw in results:
        updates = []
        for item in updates_raw or []:
            if item is None or item.get("pu") is None:
                continue
            pu = ProgressUpdate.inflate(item["pu"])
            author = Person.inflate(item["author"]) if item.get("author") else None
            updates.append({
                "update_date": str(pu.update_date) if pu.update_date else None,
                "trajectory": pu.trajectory,
                "note": pu.note,
                "author_name": author.name if author else None,
            })
        by_si_id[si_id] = {
            "yse_identifier": yse_id,
            "update_count": update_count,
            "updates": updates,
        }
    return by_si_id


def _serialize_working_group_plan(wgp, campus_abbrev: str, year_name: str) -> dict:
    wg_node = wgp.working_group.single()
    wg_name = wg_node.name if wg_node else None

    companion_plans_by_si = _fetch_companion_plans_by_si(
        wgp.plan_identifier, campus_abbrev, year_name
    )
    progress_by_si = _fetch_progress_by_si(
        wgp.plan_identifier, campus_abbrev, year_name
    )
    status_by_si = _fetch_status_by_si(
        wgp.plan_identifier, campus_abbrev, year_name
    )

    prioritized_serialized = []
    for si in wgp.prioritized_success_indicators.all():
        data = si.serialize()
        data["companion_plans"] = companion_plans_by_si.get(si.unique_id, [])
        data["progress"] = progress_by_si.get(
            si.unique_id,
            {"yse_identifier": None, "update_count": 0, "updates": []},
        )
        status = status_by_si.get(si.unique_id, {})
        data["status_level"] = status.get("status_level")
        data["status_value"] = status.get("status_value")
        data["previous_status_level"] = status.get("previous_status_level")
        data["previous_status_value"] = status.get("previous_status_value")
        prioritized_serialized.append(data)

    return {
        "plan_identifier": wgp.plan_identifier,
        "working_group": wg_name,
        "prioritized_success_indicators": prioritized_serialized,
        "available_indicators": _fetch_available_indicators_for_wg(wg_name, campus_abbrev, year_name),
        "group_leads": [p.serialize() for p in wgp.group_leads.all()],
        "plans": _fetch_plans_for_working_group(wg_name, campus_abbrev, year_name),
    }