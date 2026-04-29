#
# COMMITTEE READ QUERIES
#
from neomodel import db

from app.database.graph_schema import *
from app.database.identifiers import make_campus_plan_identifier
from app.endpoints.data_api.errors.custom_exceptions import NotFoundError


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
    RETURN DISTINCT p, planYear.name AS plan_year, completedYear.name AS completed_year
"""


def _fetch_plans_for_working_group(wg_name: str, campus_abbrev: str, year_name: str) -> list:
    if not wg_name:
        return []
    results, _ = db.cypher_query(
        _PLANS_FOR_WGP_QUERY,
        {"wg_name": wg_name, "campus_abbrev": campus_abbrev, "year_name": year_name},
    )
    plans = []
    for plan_node, plan_year, completed_year in results:
        data = Plan.inflate(plan_node).serialize()
        # Created/target year (per the policy, also the intended completion year).
        data["academic_year"] = plan_year
        data["completed_year"] = completed_year
        plans.append(data)
    return plans


def _serialize_working_group_plan(wgp, campus_abbrev: str, year_name: str) -> dict:
    wg_node = wgp.working_group.single()
    wg_name = wg_node.name if wg_node else None

    return {
        "plan_identifier": wgp.plan_identifier,
        "working_group": wg_name,
        "prioritized_success_indicators": [
            si.serialize() for si in wgp.prioritized_success_indicators.all()
        ],
        "group_leads": [p.serialize() for p in wgp.group_leads.all()],
        "plans": _fetch_plans_for_working_group(wg_name, campus_abbrev, year_name),
    }