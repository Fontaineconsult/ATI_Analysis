#
# AUTOMATIC ACCOMPLISHMENT CREATION FROM COMPLETED PLANS
#
# When a Plan flips to plan_status="Completed", an Accomplishment node is
# auto-created, linked back to the plan via :achieved_through, and inherits
# the plan's furthered goals/YSEs and completion year. Callers in
# implementation/update.py and implementation/create.py do an idempotency
# check (MATCH (p:Plan)<-[:achieved_through]-(:Accomplishment)) BEFORE
# calling this helper, so we assume it's safe to create. Errors propagate
# to the caller, which wraps in try/except + warning log.
#
from datetime import date

from app.database.graph_schema import Plan, Accomplishment, AcademicYear
from app.endpoints.data_api.errors.custom_exceptions import NotFoundError


def _current_academic_year_name() -> str:
    """ATI academic year is Aug→Jul. Aug+ rolls into next-year naming."""
    today = date.today()
    if today.month >= 8:
        return f"{today.year}-{today.year + 1}"
    return f"{today.year - 1}-{today.year}"


def create_single_accomplishment_from_plan(
        plan_id: str,
        accomplishment_name: str = None,
        accomplishment_description: str = None,
) -> dict:
    """
    Build an Accomplishment node from a (Completed) Plan and wire all edges.

    Parameters
    ----------
    plan_id : str
        Plan.unique_id of the source plan.
    accomplishment_name : str, optional
        Display name for the new accomplishment. Defaults to the plan's name.
    accomplishment_description : str, optional
        Description for the new accomplishment. Defaults to the plan's
        `completion_notes`, then to a generated fallback that includes the
        plan's unique_id to guarantee uniqueness (Accomplishment.description
        is unique_index'd on the schema).

    Returns
    -------
    dict with keys:
        unique_id            — the new Accomplishment.unique_id
        accomplishment_name  — the name actually used

    Raises
    ------
    NotFoundError if the source plan doesn't exist.
    Any neomodel error on save (e.g. UniqueProperty if description collides).
    """
    try:
        plan = Plan.nodes.get(unique_id=plan_id)
    except Plan.DoesNotExist:
        raise NotFoundError(f"Plan with unique_id '{plan_id}' not found.")

    # Name: caller value, else plan name. Plan.name is not unique-indexed,
    # so collisions are fine here.
    name = (accomplishment_name or plan.name or '').strip() or f"Completion of plan {plan.unique_id}"

    # Description: caller value, else plan's completion notes, else a
    # generated fallback that includes the plan unique_id so we never
    # collide with another auto-created accomplishment.
    raw_description = (accomplishment_description or plan.completion_notes or '').strip()
    if not raw_description:
        raw_description = f"Completion of plan: {plan.name} ({plan.unique_id})"
    # Even with completion_notes, two plans could share the same note text.
    # Belt-and-suspenders: tag the plan id at the end so description stays
    # unique across all auto-created accomplishments.
    if f"({plan.unique_id})" not in raw_description:
        description = f"{raw_description} ({plan.unique_id})"
    else:
        description = raw_description

    acc = Accomplishment(name=name, description=description)
    acc.save()

    # Wire achieved_through back to the source plan.
    acc.achieved_through.connect(plan)

    # Mirror the plan's furthered goals onto the accomplishment.
    for goal in plan.furthered_goals.all():
        acc.advanced_goals.connect(goal)

    # Mirror the plan's furthered YSEs onto the accomplishment so the
    # per-goal projection in the compound query picks it up alongside the
    # plan's evidence.
    for yse in plan.furthered_year_success_indicators.all():
        acc.advanced_year_success_indicators.connect(yse)

    # Academic year: prefer the plan's completed_in_year edge; fall back to
    # the current academic year computed at runtime.
    completed_year_node = plan.completed_year.single()
    if completed_year_node is None:
        current_year_name = _current_academic_year_name()
        completed_year_node = AcademicYear.nodes.get_or_none(name=current_year_name)
        if completed_year_node is None:
            completed_year_node = AcademicYear(name=current_year_name)
            completed_year_node.save()
    acc.academic_year.connect(completed_year_node)

    return {
        'unique_id': acc.unique_id,
        'accomplishment_name': name,
    }
