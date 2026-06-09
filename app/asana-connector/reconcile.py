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
      Completion state and subtasks in Asana are never pushed — Asana owns them.

  PULL  (Asana -> graph)
    - for each linked task, mirror its subtasks (name/completed/assignee/due)
      into AsanaSubtask nodes via replace_plan_subtasks (wholesale replace,
      so deletions in Asana propagate).

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
    from app.database.queries.asana.create import replace_plan_subtasks
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

        # PULL: mirror this task's subtasks into the graph.
        subs = client.list_subtasks(task_gid)
        replace_plan_subtasks(uid, subs)
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
