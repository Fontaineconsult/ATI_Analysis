#
# ASANA SYNC READ QUERIES
#
from neomodel import db

from app.database.graph_schema import Plan
from app.endpoints.data_api.errors.custom_exceptions import NotFoundError

_PLAN_SUBTASKS_QUERY = """
    MATCH (p:Plan {unique_id: $plan_uid})-[:has_asana_subtask]->(s:AsanaSubtask)
    RETURN s
    ORDER BY s.completed, coalesce(s.due_on, '9999-12-31'), s.name
"""


def get_plan_subtasks(plan_uid: str) -> list:
    """All mirrored Asana subtasks for one plan — open first, then by due date.

    Raises NotFoundError if the plan doesn't exist (an empty subtask list on
    a real plan is a normal result, not an error).
    """
    plan = Plan.nodes.get_or_none(unique_id=plan_uid)
    if plan is None:
        raise NotFoundError(f"Plan with unique_id '{plan_uid}' not found.")

    from app.database.graph_schema import AsanaSubtask
    rows, _ = db.cypher_query(_PLAN_SUBTASKS_QUERY, {"plan_uid": plan_uid})
    return [AsanaSubtask.inflate(row[0]).serialize() for row in rows]
