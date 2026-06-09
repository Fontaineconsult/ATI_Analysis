#
# ASANA SYNC CREATE QUERIES
#
# AsanaSubtask nodes mirror subtasks that live under a Plan's Asana task.
# They are owned by the refresh sync: replace_plan_subtasks() is the only
# sanctioned creation path (it enforces the required has_asana_subtask edge
# by construction — every subtask is created already attached to its Plan).
#
from datetime import datetime, timezone

from neomodel import db

from app.database.graph_schema import AsanaSubtask, Plan
from app.endpoints.data_api.errors.custom_exceptions import (
    CrudError,
    NotFoundError,
)

# Delete every existing AsanaSubtask hanging off the plan. Wholesale
# replacement keeps the mirror honest: subtasks deleted in Asana disappear
# here on the next refresh instead of lingering as stale rows.
_DELETE_PLAN_SUBTASKS_QUERY = """
    MATCH (p:Plan {unique_id: $plan_uid})-[:has_asana_subtask]->(s:AsanaSubtask)
    DETACH DELETE s
"""


def replace_plan_subtasks(plan_uid: str, subtasks: list) -> list:
    """Replace a Plan's mirrored Asana subtasks with the given set.

    :param plan_uid: Plan.unique_id of the plan whose mirror to refresh.
    :param subtasks: list of dicts straight from the Asana API, each with
                     keys gid, name, completed, and optionally completed_at,
                     due_on, assignee (dict with name), permalink_url.
    :return: the serialized AsanaSubtask dicts that now exist.
    """
    plan = Plan.nodes.get_or_none(unique_id=plan_uid)
    if plan is None:
        raise NotFoundError(f"Plan with unique_id '{plan_uid}' not found.")

    now_iso = datetime.now(timezone.utc).isoformat()
    try:
        db.cypher_query(_DELETE_PLAN_SUBTASKS_QUERY, {"plan_uid": plan_uid})

        created = []
        for sub in subtasks or []:
            assignee = sub.get("assignee") or {}
            node = AsanaSubtask(
                asana_gid=sub["gid"],
                name=sub.get("name"),
                completed=bool(sub.get("completed")),
                completed_at=sub.get("completed_at"),
                due_on=sub.get("due_on"),
                assignee_name=assignee.get("name"),
                permalink_url=sub.get("permalink_url"),
                last_synced=now_iso,
            ).save()
            plan.asana_subtasks.connect(node)
            created.append(node.serialize())
        return created
    except Exception as e:
        raise CrudError(f"Failed to replace Asana subtasks for plan '{plan_uid}': {e}")
