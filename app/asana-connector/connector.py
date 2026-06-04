"""
Public entry point for the Asana connector.

This is the surface the rest of the app wires to. The headline function:

    sync_plans_to_asana(...) -> dict

reads Plans from the graph (or accepts pre-built sections), then creates one
Asana project containing a section per working group and a task per plan.

It is import-safe: no graph/Flask import happens at module load, and the
neomodel connection is assumed to be configured by the caller (Flask
``create_app()`` in-app, or ``set_connection()`` in a script). A ``dry_run``
needs no credentials and touches no network — use it to preview.

Wiring example (do NOT call from import scope; call inside a request/handler)::

    import importlib.util, os
    here = os.path.join(app.root_path, "asana-connector", "connector.py")
    spec = importlib.util.spec_from_file_location("ati_asana_connector", here)
    mod  = importlib.util.module_from_spec(spec); spec.loader.exec_module(mod)
    summary = mod.sync_plans_to_asana(dry_run=False)

See README.md for the full wiring recipe and required env vars.
"""
import os
import sys

# Allow sibling modules (asana_client, payload, ...) to import by bare name even
# when this file is loaded by absolute path from the hyphenated connector folder.
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from asana_client import AsanaClient            # noqa: E402
from asana_config import load_config            # noqa: E402
from payload import build_sections, count_tasks  # noqa: E402


def _default_project_name():
    # datetime is fine here (this is plain Python, run inside a handler/script).
    from datetime import date
    return f"ATI Plans Import {date.today().isoformat()}"


def sync_plans_to_asana(*, client=None, config=None, project_name=None,
                        plans=None, sections=None, dry_run=False,
                        reuse_existing_project=False, target_project_gid=None,
                        logger=print):
    """Create an Asana project from the plans graph — or push into an existing one.

    Parameters
    ----------
    client : AsanaClient, optional
        Pre-built client (inject a fake in tests). Built from ``config`` if omitted.
    config : AsanaConfig, optional
        Resolved settings. Loaded from the environment if omitted.
    project_name : str, optional
        Defaults to ``"ATI Plans Import <YYYY-MM-DD>"``. Ignored when
        ``target_project_gid`` is given (the existing project's name is used).
    plans : list[dict], optional
        Plan dicts (from ``graph_export.fetch_plans``). Queried from the graph
        if both ``plans`` and ``sections`` are omitted.
    sections : list[dict], optional
        Pre-built Asana sections (from ``payload.build_sections`` or
        ``asana_payload.json``). Skips the graph entirely when provided.
    dry_run : bool
        Build & report the plan without any network calls or credentials.
    reuse_existing_project : bool
        If True and a project with ``project_name`` already exists in the
        workspace/team, push into it instead of creating a new one.
    target_project_gid : str, optional
        Push into this *exact* existing project (by gid). No workspace/team
        needed and no project is created; same-named sections are reused and
        any missing ones are added. Takes precedence over the create/reuse paths.

    Returns
    -------
    dict
        Summary: ``{dry_run, project_name, project_gid?, project_url?,
        section_count, task_count, sections:[{name, tasks}], created?}``.
    """
    project_name = project_name or _default_project_name()

    if sections is None:
        if plans is None:
            logger("Reading plans from the graph…")
            from graph_export import fetch_plans  # deferred: needs a live connection
            plans = fetch_plans()
        sections = build_sections(plans)

    total = count_tasks(sections)
    summary = {
        "dry_run": dry_run,
        "project_name": project_name,
        "section_count": len(sections),
        "task_count": total,
        "sections": [{"name": s["sectionName"], "tasks": len(s["tasks"])} for s in sections],
    }

    if dry_run:
        verb = (f"push into existing project {target_project_gid}"
                if target_project_gid else f"create project {project_name!r}")
        logger(f"[dry-run] would {verb} with {len(sections)} sections / {total} tasks:")
        for s in summary["sections"]:
            logger(f"  - {s['name']}: {s['tasks']} tasks")
        return summary

    cfg = config or load_config()
    # Pushing into an existing project needs only a token (no workspace/team).
    cfg.require(need_workspace=not target_project_gid)
    client = client or AsanaClient(cfg.access_token, base_url=cfg.base_url)

    # Fail fast on a bad token before creating anything.
    who = client.me()
    logger(f"Authenticated to Asana as {who.get('name')} <{who.get('email')}>")

    project = None
    created = True
    if target_project_gid:
        project = client.get_project(target_project_gid)
        created = False
        project_name = project.get("name", project_name)
        summary["project_name"] = project_name
        logger(f"Targeting existing project {project_name!r} ({project['gid']})")
    elif reuse_existing_project:
        project = client.find_project_by_name(project_name, cfg.workspace_gid, cfg.team_gid)
        if project:
            created = False
            logger(f"Reusing existing project {project_name!r} ({project['gid']})")

    if project is None:
        project = client.create_project(
            project_name, cfg.workspace_gid, team=cfg.team_gid,
            notes="Imported from the ATI Analysis plans graph. "
                  "Each task's notes carry its source [graph Plan.unique_id].",
        )
        logger(f"Created project {project_name!r} ({project['gid']})")

    project_gid = project["gid"]

    # If reusing a project, reuse any sections of the same name to avoid dupes.
    existing_sections = {}
    if not created:
        existing_sections = {s["name"]: s["gid"] for s in client.list_sections(project_gid)}

    created_tasks = 0
    for section in sections:
        sec_name = section["sectionName"]
        sec_gid = existing_sections.get(sec_name)
        if sec_gid is None:
            sec = client.create_section(project_gid, sec_name)
            sec_gid = sec["gid"]
            logger(f"  section {sec_name!r} ({sec_gid}) — {len(section['tasks'])} tasks")
        for task in section["tasks"]:
            t = client.create_task(
                task["name"], project_gid,
                notes=task.get("notes"),
                completed=bool(task.get("completed")),
            )
            client.add_task_to_section(sec_gid, t["gid"])
            created_tasks += 1

    summary.update({
        "created": created,
        "project_gid": project_gid,
        "project_url": project.get("permalink_url"),
        "tasks_created": created_tasks,
    })
    logger(f"Done: {created_tasks} tasks in project {project.get('permalink_url') or project_gid}")
    return summary
