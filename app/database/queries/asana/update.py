#
# ASANA SYNC UPDATE QUERIES
#
from app.data_config import plan_statuses
from app.database.graph_schema import Plan
from app.endpoints.data_api.errors.custom_exceptions import (
    CrudError,
    NotFoundError,
    ValidationError,
)


def set_subtask_status_local(plan_uid: str, asana_gid: str,
                             status: str = None,
                             resolution_note: str = None) -> dict:
    """Set the app-side state tracker and/or resolution note on one subtask.

    LOCAL fields only: Asana carries neither. The completion side effect that
    keeps 'Completed' and Asana's completed flag in step lives in the
    connector (set_plan_subtask_status), which calls this last.
    """
    if status is None and resolution_note is None:
        raise ValidationError(
            "Nothing to set: pass status and/or resolution_note."
        )
    if status is not None and status not in plan_statuses:
        raise ValidationError(
            f"Invalid status {status!r}; must be one of {plan_statuses}"
        )

    node = get_subtask_on_plan(plan_uid, asana_gid)
    try:
        if status is not None:
            node.task_status = status
        if resolution_note is not None:
            node.resolution_note = resolution_note.strip() or None
        node.save()
        return node.serialize()
    except Exception as e:
        raise CrudError(f"Failed to set status on subtask '{asana_gid}': {e}")


def get_subtask_on_plan(plan_uid: str, asana_gid: str):
    """The subtask row, verified to hang off THIS plan.

    The connector calls this BEFORE writing to Asana, so a wrong gid fails
    here instead of mutating somebody else's task first.
    """
    plan = Plan.nodes.get_or_none(unique_id=plan_uid)
    if plan is None:
        raise NotFoundError(f"Plan with unique_id '{plan_uid}' not found.")
    for candidate in plan.asana_subtasks.all():
        if candidate.asana_gid == asana_gid:
            return candidate
    raise NotFoundError(
        f"Subtask '{asana_gid}' is not attached to plan '{plan_uid}'."
    )


def pin_subtask_assignee(plan_uid: str, asana_gid: str, person_unique_id: str) -> dict:
    """Wire assigned_to to the chosen Person — the app-side assignment.

    Asana cannot hold this (non-workspace emails are not valid actors), so
    the edge plus the person's name/email as generic text mirrors ARE the
    record. The sync leaves them alone unless Asana itself reports an
    assignee, which then wins.
    """
    from app.database.graph_schema import Person

    node = get_subtask_on_plan(plan_uid, asana_gid)
    person = Person.nodes.get_or_none(unique_id=person_unique_id)
    if person is None:
        raise NotFoundError(f"Person with unique_id '{person_unique_id}' not found.")
    try:
        node.assigned_to.disconnect_all()
        node.assigned_to.connect(person)
        node.assignee_name = person.name
        node.assignee_email = person.email
        node.save()
        return node.serialize()
    except Exception as e:
        raise CrudError(f"Failed to assign subtask '{asana_gid}': {e}")


def clear_subtask_assignee(plan_uid: str, asana_gid: str) -> dict:
    """Drop the app-side assignment: edge and generic-text mirrors together."""
    node = get_subtask_on_plan(plan_uid, asana_gid)
    try:
        node.assigned_to.disconnect_all()
        node.assignee_name = None
        node.assignee_email = None
        node.save()
        return node.serialize()
    except Exception as e:
        raise CrudError(f"Failed to unassign subtask '{asana_gid}': {e}")


def apply_subtask_state(plan_uid: str, asana_gid: str, sub: dict) -> dict:
    """Copy Asana's post-write state of one subtask onto its local row.

    Called after the connector completes, reopens, or edits a subtask in
    Asana, so the row reflects what Asana actually recorded (completed_at
    especially) rather than what the app hoped.
    """
    from datetime import datetime, timezone

    from app.database.queries.asana.create import _apply

    node = get_subtask_on_plan(plan_uid, asana_gid)
    try:
        _apply(node, sub, datetime.now(timezone.utc).isoformat())
        return node.serialize()
    except Exception as e:
        raise CrudError(f"Failed to update subtask '{asana_gid}': {e}")


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
