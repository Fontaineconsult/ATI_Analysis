#
# ASANA SYNC CREATE QUERIES
#
# AsanaSubtask nodes are the plan's FIRST-ORDER progress records. Asana is the
# shared task surface (every write lands there too), but the graph rows are not
# a disposable mirror: sync merges by asana_gid so a row keeps its unique_id
# across refreshes, and the app creates rows directly when a subtask is added
# in-app. Every creation path attaches the node to its Plan by construction,
# which is the required-edge invariant this module enforces.
#
from datetime import datetime, timezone

from app.database.graph_schema import AsanaSubtask, Person, Plan
from app.endpoints.data_api.errors.custom_exceptions import (
    CrudError,
    NotFoundError,
)


def _get_plan(plan_uid: str) -> Plan:
    plan = Plan.nodes.get_or_none(unique_id=plan_uid)
    if plan is None:
        raise NotFoundError(f"Plan with unique_id '{plan_uid}' not found.")
    return plan


def _reconcile_assignee_edge(node: AsanaSubtask, email: str) -> None:
    """Follow Asana's assignee WHEN IT HAS ONE, resolved by email.

    Assignment is app-side data (Asana accepts only workspace members as
    actors, so most Person assignments never reach it): when Asana reports no
    assignee, the local edge and generic-text mirrors are left alone. A real
    Asana-side assignee wins when present; an email that matches no Person,
    or ambiguously matches several, keeps the mirrors but moves no edge."""
    if not email:
        return
    try:
        person = Person.nodes.get_or_none(email=email)
    except Person.MultipleNodesReturned:
        person = None
    if person is None:
        return
    current = node.assigned_to.single()
    if current is None or current.unique_id != person.unique_id:
        node.assigned_to.disconnect_all()
        node.assigned_to.connect(person)


def _apply(node: AsanaSubtask, sub: dict, now_iso: str) -> AsanaSubtask:
    """Copy one Asana subtask dict onto a node. `sub` is the API shape:
    gid, name, completed, and optionally completed_at, due_on,
    assignee (dict with name and email), permalink_url."""
    assignee = sub.get("assignee") or {}
    node.name = sub.get("name")
    node.notes = sub.get("notes")
    node.completed = bool(sub.get("completed"))
    node.completed_at = sub.get("completed_at")
    node.due_on = sub.get("due_on")
    # The name/email mirrors double as the APP-SIDE assignment's generic
    # text, so Asana's answer only overwrites them when Asana actually has
    # an assignee; absence leaves the local assignment untouched.
    if assignee.get("name") or assignee.get("email"):
        node.assignee_name = assignee.get("name")
        node.assignee_email = assignee.get("email")
    node.permalink_url = sub.get("permalink_url")
    node.last_synced = now_iso

    # State-tracker coherence. Completion is the one state Asana also knows,
    # so the tracker follows it: a pull that completes the task moves the
    # status to Completed, and a pull that reopens a Completed task drops it
    # to In Progress. Statuses Asana cannot express (On Hold, Abandoned) are
    # app-set and left alone. Rows from before the tracker backfill from the
    # completed flag.
    if node.task_status is None:
        node.task_status = "Completed" if node.completed else "Not Started"
    elif node.completed and node.task_status != "Completed":
        node.task_status = "Completed"
    elif not node.completed and node.task_status == "Completed":
        node.task_status = "In Progress"

    node.save()
    _reconcile_assignee_edge(node, assignee.get("email"))
    return node


def sync_plan_subtasks(plan_uid: str, subtasks: list) -> list:
    """Reconcile a Plan's subtask rows with what Asana reports.

    Merge semantics, not wholesale replacement: an existing row (matched by
    asana_gid) is updated in place so its unique_id survives the refresh, new
    subtasks gain rows, and rows whose gid Asana no longer reports are removed,
    because deletion in Asana is an intentional act that should propagate.

    :param plan_uid: Plan.unique_id of the plan whose rows to reconcile.
    :param subtasks: list of dicts straight from the Asana API.
    :return: the serialized AsanaSubtask dicts that now exist.
    """
    plan = _get_plan(plan_uid)

    now_iso = datetime.now(timezone.utc).isoformat()
    try:
        existing = {node.asana_gid: node for node in plan.asana_subtasks.all()}
        seen = set()
        result = []
        for sub in subtasks or []:
            gid = sub["gid"]
            seen.add(gid)
            node = existing.get(gid)
            if node is None:
                node = AsanaSubtask(asana_gid=gid)
                _apply(node, sub, now_iso)
                plan.asana_subtasks.connect(node)
            else:
                _apply(node, sub, now_iso)
            result.append(node.serialize())

        for gid, node in existing.items():
            if gid not in seen:
                node.delete()
        return result
    except Exception as e:
        raise CrudError(f"Failed to sync Asana subtasks for plan '{plan_uid}': {e}")


def add_plan_subtask_node(plan_uid: str, sub: dict) -> dict:
    """Persist ONE subtask the app just created in Asana, attached to its plan.

    The Asana write happens first (in the connector), so `sub` carries the real
    gid; this records it as the first-order row the app then reads and toggles.
    """
    plan = _get_plan(plan_uid)
    now_iso = datetime.now(timezone.utc).isoformat()
    try:
        node = AsanaSubtask(asana_gid=sub["gid"])
        _apply(node, sub, now_iso)
        plan.asana_subtasks.connect(node)
        return node.serialize()
    except Exception as e:
        raise CrudError(f"Failed to record Asana subtask for plan '{plan_uid}': {e}")
