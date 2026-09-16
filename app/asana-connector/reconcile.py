"""
Two-way reconciliation between the plans graph and Asana.

``refresh_plans(campus_abbrev, year_name)`` is what the app's
"Asana Refresh" button calls. One refresh:

  PUSH  (graph -> Asana)
    - find-or-create the year's project ("ATI Plans <year>"; one project per
      academic year, shared by all campuses)
    - for each Plan of the selected campus + year:
        * linked (has asana_task_gid, task still exists) -> update name/notes
        * link broken (task deleted in Asana)            -> recreate + relink
        * never pushed                                   -> create + link
      The refresh never pushes completion state onto the plan TASKS.

  PULL  (Asana -> graph)
    - for each linked task, reconcile its subtasks (name/completed/assignee/
      due) into AsanaSubtask rows via sync_plan_subtasks — merge by gid, so
      app-created rows keep their unique_id and deletions in Asana propagate.

Subtasks are the app's progress records and flow BOTH ways: add_plan_subtask
and set_plan_subtask_completed (bottom of this module) write to Asana first,
then persist the result as the first-order graph row.

Graph writes go through app.database.queries.asana.* — imported lazily so a
``--dry-run`` style preview or a unit test with a fake client never needs the
``app`` package importable beyond what the caller already has.
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from asana_client import AsanaClient, AsanaError  # noqa: E402
from asana_config import load_config              # noqa: E402
from payload import note_for, wg_of               # noqa: E402


def project_name_for_year(year_name):
    return f"ATI Plans {year_name}"


# Project custom fields (Asana list-view columns) the sync populates, keyed by
# their Asana field name (case-insensitive). Add an entry here to map another
# column; the value function receives the plan dict and returns the label(s).
def _status_label(plan):
    # Mirrors the frontend getPlanStatusLabel: the abandoned flag wins.
    return "Abandoned" if plan.get("abandoned") else (plan.get("plan_status") or "Not Started")


def _campus_labels(plan):
    return plan.get("campuses") or []


SYNCED_FIELDS = {
    "status": lambda plan: [_status_label(plan)],
    "campus": _campus_labels,
}


class _FieldMapper:
    """Resolves SYNCED_FIELDS labels into Asana custom_fields payload values.

    Handles text / enum / multi_enum field types. Missing enum options are
    created on the fly (so e.g. a new campus abbreviation just works) and
    cached for the rest of the run.
    """

    def __init__(self, client, field_settings, logger):
        self.client = client
        self.logger = logger
        self.fields = {}
        for setting in field_settings:
            field = setting.get("custom_field") or {}
            key = (field.get("name") or "").strip().lower()
            if key in SYNCED_FIELDS:
                self.fields[key] = field

    def values_for(self, plan):
        """Return {field_gid: value} for the plan, or None if nothing to set."""
        out = {}
        for key, label_fn in SYNCED_FIELDS.items():
            field = self.fields.get(key)
            labels = [str(l) for l in label_fn(plan) if l]
            if not field or not labels:
                continue
            subtype = field.get("resource_subtype")
            if subtype == "text":
                out[field["gid"]] = ", ".join(labels)
            elif subtype == "enum":
                gid = self._option_gid(field, labels[0])
                if gid:
                    out[field["gid"]] = gid
            elif subtype == "multi_enum":
                gids = [g for g in (self._option_gid(field, l) for l in labels) if g]
                if gids:
                    out[field["gid"]] = gids
            else:
                self.logger(f"  field {field.get('name')!r}: unsupported type "
                            f"{subtype!r}, skipped")
        return out or None

    def _option_gid(self, field, label):
        options = field.setdefault("enum_options", [])
        for opt in options:
            if opt.get("name", "").strip().lower() == label.strip().lower() \
                    and opt.get("enabled", True):
                return opt["gid"]
        try:
            opt = self.client.create_enum_option(field["gid"], label)
        except AsanaError as e:
            self.logger(f"  couldn't add option {label!r} to field "
                        f"{field.get('name')!r}: {e}")
            return None
        options.append(opt)
        self.logger(f"  added option {label!r} to field {field.get('name')!r}")
        return opt["gid"]


def refresh_plans(campus_abbrev, year_name, *, client=None, config=None,
                  plans=None, logger=print):
    """Reconcile one campus+year's plans with the year's Asana project.

    Parameters
    ----------
    campus_abbrev : str
        Campus whose plans to push (the year's project is shared; only this
        campus's tasks are touched).
    year_name : str
        Academic year, e.g. "2025-2026". Scopes both the plans queried and
        the Asana project name.
    client, config : optional
        Injectable for tests; built from the environment when omitted.
    plans : list[dict], optional
        Pre-fetched plan dicts (graph_export.fetch_plans shape). Queried
        from the graph when omitted.

    Returns
    -------
    dict summary: {project_name, project_gid, project_url, plans_total,
                   tasks_created, tasks_updated, tasks_relinked,
                   subtasks_synced, sections:[...]}
    """
    if not campus_abbrev or not year_name:
        raise ValueError("refresh_plans requires campus_abbrev and year_name.")

    if plans is None:
        from graph_export import fetch_plans  # deferred: needs a live connection
        plans = fetch_plans(year_name=year_name, campus_abbrev=campus_abbrev)

    # Graph-write helpers (lazy: the app package is importable both in-app and
    # from the CLI, which bootstraps PROJECT_ROOT onto sys.path).
    from app.database.queries.asana.create import sync_plan_subtasks
    from app.database.queries.asana.update import set_plan_asana_task_gid

    cfg = config or load_config()
    cfg.require(need_workspace=True)
    client = client or AsanaClient(cfg.access_token, base_url=cfg.base_url)

    who = client.me()
    logger(f"Authenticated to Asana as {who.get('name')} <{who.get('email')}>")

    proj_name = project_name_for_year(year_name)
    project = client.find_project_by_name(proj_name, cfg.workspace_gid, cfg.team_gid)
    if project is None:
        project = client.create_project(
            proj_name, cfg.workspace_gid, team=cfg.team_gid,
            notes="Synced from the ATI Analysis plans graph. One project per "
                  "academic year; sections per working group. Subtasks you add "
                  "here are mirrored back into the app on each refresh.",
        )
        logger(f"Created project {proj_name!r} ({project['gid']})")
    else:
        logger(f"Using existing project {proj_name!r} ({project['gid']})")
    project_gid = project["gid"]

    sections = {s["name"]: s["gid"] for s in client.list_sections(project_gid)}

    # Project columns (custom fields) we mirror per task — currently Status
    # and Campus. Custom fields need a premium workspace; degrade gracefully.
    try:
        field_settings = client.get_project_custom_field_settings(project_gid)
    except AsanaError as e:
        logger(f"Custom fields unavailable ({e}); syncing without columns.")
        field_settings = []
    mapper = _FieldMapper(client, field_settings, logger)
    if mapper.fields:
        logger(f"Syncing columns: {', '.join(sorted(mapper.fields))}")
    else:
        logger("No Status/Campus columns found on the project; add them in "
               "Asana to have them populated.")

    def section_gid_for(plan):
        name = wg_of(plan)
        if name not in sections:
            sections[name] = client.create_section(project_gid, name)["gid"]
            logger(f"  created section {name!r}")
        return sections[name]

    created = updated = relinked = subtasks_synced = 0
    for plan in plans:
        uid = plan["uid"]
        name = (plan.get("name") or "").strip() or "(untitled plan)"
        notes = note_for(plan)
        custom_fields = mapper.values_for(plan)
        task_gid = plan.get("asana_task_gid")

        if task_gid:
            try:
                client.update_task(task_gid, name=name, notes=notes,
                                   custom_fields=custom_fields)
                updated += 1
            except AsanaError as e:
                if e.status_code not in (404, 410):
                    raise
                # Task was deleted in Asana — recreate and relink.
                task_gid = None
                relinked += 1

        if not task_gid:
            task = client.create_task(name, project_gid, notes=notes,
                                      custom_fields=custom_fields)
            task_gid = task["gid"]
            client.add_task_to_section(section_gid_for(plan), task_gid)
            set_plan_asana_task_gid(uid, task_gid)
            created += 1

        # PULL: reconcile this task's subtasks into the graph (merge by gid,
        # so app-created rows keep their identity across refreshes).
        subs = client.list_subtasks(task_gid)
        sync_plan_subtasks(uid, subs)
        subtasks_synced += len(subs)

    # `relinked` counts plans whose task vanished; they're also in `created`.
    created -= relinked

    summary = {
        "project_name": proj_name,
        "project_gid": project_gid,
        "project_url": project.get("permalink_url"),
        "campus": campus_abbrev,
        "year": year_name,
        "plans_total": len(plans),
        "tasks_created": created,
        "tasks_updated": updated,
        "tasks_relinked": relinked,
        "subtasks_synced": subtasks_synced,
        "sections": sorted(sections),
        "columns_synced": sorted(mapper.fields),
    }
    logger(f"Refresh done: {created} created, {updated} updated, "
           f"{relinked} relinked, {subtasks_synced} subtasks mirrored.")
    return summary


# --------------------------------------------------------------------------- #
# Single-subtask writes (the app's Progress section)                           #
# --------------------------------------------------------------------------- #
# The app writes progress as Asana subtasks: Asana gets the write first, then
# the graph records the result as a first-order row. Both functions accept an
# injectable client/config like refresh_plans, so tests run against a fake.

def _build_client(client, config):
    cfg = config or load_config()
    cfg.require(need_workspace=True)
    return (client or AsanaClient(cfg.access_token, base_url=cfg.base_url)), cfg


def _ensure_plan_task(plan_uid, year_name, campus_abbrev, client, cfg, logger):
    """Return the plan's Asana task gid, creating project + task when missing.

    A plan that was never pushed (or whose task was deleted in Asana) still has
    to accept progress, so the add path performs the same find-or-create the
    bulk refresh would, scoped to this one plan.
    """
    from app.database.graph_schema import Plan
    from app.database.queries.asana.update import set_plan_asana_task_gid

    plan_node = Plan.nodes.get_or_none(unique_id=plan_uid)
    if plan_node is None:
        raise ValueError(f"Plan with unique_id '{plan_uid}' not found.")

    if plan_node.asana_task_gid:
        try:
            client.get_task(plan_node.asana_task_gid)
            return plan_node.asana_task_gid
        except AsanaError as e:
            if e.status_code not in (404, 410):
                raise
            logger(f"task {plan_node.asana_task_gid} gone from Asana; recreating")

    from graph_export import fetch_plans
    plans = [p for p in fetch_plans(year_name=year_name, campus_abbrev=campus_abbrev)
             if p["uid"] == plan_uid]
    if not plans:
        # Fall back to an unscoped fetch: the plan may sit outside the current
        # year/campus slice (e.g. a carried-over plan).
        plans = [p for p in fetch_plans() if p["uid"] == plan_uid]
    if not plans:
        raise ValueError(f"Plan '{plan_uid}' not found in the plans export.")
    plan = plans[0]

    proj_name = project_name_for_year(year_name)
    project = client.find_project_by_name(proj_name, cfg.workspace_gid, cfg.team_gid)
    if project is None:
        project = client.create_project(
            proj_name, cfg.workspace_gid, team=cfg.team_gid,
            notes="Synced from the ATI Analysis plans graph.",
        )
        logger(f"Created project {proj_name!r} ({project['gid']})")
    project_gid = project["gid"]

    name = (plan.get("name") or "").strip() or "(untitled plan)"
    task = client.create_task(name, project_gid, notes=note_for(plan))
    sections = {s["name"]: s["gid"] for s in client.list_sections(project_gid)}
    wg = wg_of(plan)
    if wg not in sections:
        sections[wg] = client.create_section(project_gid, wg)["gid"]
    client.add_task_to_section(sections[wg], task["gid"])
    set_plan_asana_task_gid(plan_uid, task["gid"])
    logger(f"Created task for plan {plan_uid} ({task['gid']})")
    return task["gid"]


def add_plan_subtask(plan_uid, name, *, notes=None, due_on=None,
                     assignee_person_id=None,
                     year_name=None, campus_abbrev=None,
                     client=None, config=None, logger=print):
    """Create one progress subtask in Asana and record it in the graph.

    Returns the serialized AsanaSubtask row. Requires year_name so an unlinked
    plan can have its Asana task created on the way. The assignee is APP-SIDE
    data (Asana only accepts workspace members as actors, and most Person
    nodes are not in the workspace), so it is never sent to Asana: the edge
    and the generic name text are recorded locally after the create.
    """
    if not (name or "").strip():
        raise ValueError("A subtask needs a name.")
    if not year_name:
        raise ValueError("year_name is required (it names the Asana project).")

    from app.database.queries.asana.create import add_plan_subtask_node
    from app.database.queries.asana.update import pin_subtask_assignee

    client, cfg = _build_client(client, config)
    task_gid = _ensure_plan_task(plan_uid, year_name, campus_abbrev, client, cfg, logger)
    sub = client.create_subtask(task_gid, name.strip(), notes=notes, due_on=due_on)
    row = add_plan_subtask_node(plan_uid, sub)
    if assignee_person_id:
        row = pin_subtask_assignee(plan_uid, row["asana_gid"], assignee_person_id)
    return row


def set_plan_subtask_assignee(plan_uid, asana_gid, person_unique_id, *,
                              client=None, config=None, logger=print):
    """Assign (or with None, unassign) one subtask — a purely local write.

    Asana rejects non-workspace emails as actors ("Not a valid actor ID"), so
    ownership lives in the graph like task_status does: the assigned_to edge
    plus the person's name as generic text. Nothing is sent to Asana; a real
    Asana-side assignment (a workspace member assigned inside Asana) still
    syncs IN on refresh and wins when present. client/config are accepted for
    signature compatibility and unused.
    """
    from app.database.queries.asana.update import (
        clear_subtask_assignee,
        pin_subtask_assignee,
    )

    if person_unique_id:
        return pin_subtask_assignee(plan_uid, asana_gid, person_unique_id)
    return clear_subtask_assignee(plan_uid, asana_gid)


def set_plan_subtask_completed(plan_uid, asana_gid, completed, *,
                               client=None, config=None, logger=print):
    """Complete (or reopen) one subtask in Asana, then mirror the result.

    The graph row is updated from Asana's post-write response, so completed_at
    is Asana's stamp, not the app's guess.
    """
    from app.database.queries.asana.update import (
        apply_subtask_state,
        get_subtask_on_plan,
    )

    get_subtask_on_plan(plan_uid, asana_gid)   # verify BEFORE touching Asana
    client, _cfg = _build_client(client, config)
    sub = client.set_task_completed(asana_gid, completed)
    return apply_subtask_state(plan_uid, asana_gid, sub)


def set_plan_subtask_status(plan_uid, asana_gid, *, status=None,
                            resolution_note=None,
                            client=None, config=None, logger=print):
    """Set the state tracker and/or resolution note on one subtask.

    Both are app-side fields Asana cannot hold, so this is mostly a local
    write. The exception is the completion boundary, which Asana does know:
    moving to 'Completed' completes the Asana subtask, and moving a Completed
    task to any other status reopens it. A status change that stays on one
    side of that boundary touches Asana not at all.
    """
    from app.database.queries.asana.update import (
        apply_subtask_state,
        get_subtask_on_plan,
        set_subtask_status_local,
    )

    node = get_subtask_on_plan(plan_uid, asana_gid)   # verify BEFORE Asana
    needs_complete = status == "Completed" and not node.completed
    needs_reopen = (status is not None and status != "Completed"
                    and node.completed)
    if needs_complete or needs_reopen:
        client, _cfg = _build_client(client, config)
        sub = client.set_task_completed(asana_gid, needs_complete)
        apply_subtask_state(plan_uid, asana_gid, sub)

    return set_subtask_status_local(plan_uid, asana_gid,
                                    status=status,
                                    resolution_note=resolution_note)


def update_plan_subtask(plan_uid, asana_gid, *, name=None, notes=None,
                        due_on=None, client=None, config=None, logger=print):
    """Edit one subtask's name / description / due date, Asana first.

    None leaves a field alone (the client's update contract), so a caller can
    change just the description. The graph row is refreshed from Asana's
    post-write response.
    """
    if name is None and notes is None and due_on is None:
        raise ValueError("Nothing to update: pass name, notes and/or due_on.")
    if name is not None and not name.strip():
        raise ValueError("A subtask name cannot be blank.")

    from app.database.queries.asana.update import (
        apply_subtask_state,
        get_subtask_on_plan,
    )

    get_subtask_on_plan(plan_uid, asana_gid)   # verify BEFORE touching Asana
    client, _cfg = _build_client(client, config)
    sub = client.update_task(asana_gid, name=name, notes=notes, due_on=due_on)
    return apply_subtask_state(plan_uid, asana_gid, sub)
