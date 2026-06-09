#
# ASANA SYNC UPDATE QUERIES
#
from app.database.graph_schema import Plan
from app.endpoints.data_api.errors.custom_exceptions import (
    CrudError,
    NotFoundError,
)


def set_plan_asana_task_gid(plan_uid: str, task_gid: str) -> dict:
    """Record the Asana task gid a plan was pushed to (the reconciliation key)."""
    plan = Plan.nodes.get_or_none(unique_id=plan_uid)
    if plan is None:
        raise NotFoundError(f"Plan with unique_id '{plan_uid}' not found.")
    try:
        plan.asana_task_gid = task_gid
        plan.save()
        return plan.serialize()
    except Exception as e:
        raise CrudError(f"Failed to set asana_task_gid on plan '{plan_uid}': {e}")
