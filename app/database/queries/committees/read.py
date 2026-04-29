#
# COMMITTEE READ QUERIES
#
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
        "working_group_plans": [
            _serialize_working_group_plan(wgp)
            for wgp in plan.working_group_plans.all()
        ],
    }


def _serialize_working_group_plan(wgp) -> dict:
    wg_node = wgp.working_group.single()
    return {
        "plan_identifier": wgp.plan_identifier,
        "working_group": wg_node.name if wg_node else None,
        "prioritized_success_indicators": [
            si.serialize() for si in wgp.prioritized_success_indicators.all()
        ],
        "group_leads": [p.serialize() for p in wgp.group_leads.all()],
    }