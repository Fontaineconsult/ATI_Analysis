"""
Transform graph plan dicts (from :func:`graph_export.fetch_plans`) into the
Asana sections/tasks structure the connector pushes:

    [{"sectionName": str, "tasks": [{"name": str, "notes": str,
                                     "completed"?: bool}, ...]}, ...]

Each task's notes embed ``[graph Plan.unique_id: <uid>]`` so a task can always
be traced back to its source Plan node.
"""

# Section order for the Asana push, derived from the single source of truth
# (data_config.WORKING_GROUP_DEFS) so a new working group is never silently
# dropped; "Unassigned" always sorts last. Defensive fallback keeps the
# standalone connector working even if the app package isn't importable.
try:
    from app.data_config import working_groups as _WORKING_GROUPS
except Exception:
    _WORKING_GROUPS = ["Web", "Procurement", "Instructional Materials"]

SECTION_ORDER = [*_WORKING_GROUPS, "Unassigned"]


def wg_of(plan):
    wgs = plan.get("working_groups") or []
    return wgs[0] if wgs else "Unassigned"


def note_for(plan):
    years = ", ".join(plan.get("plan_years") or []) or "—"
    campus = ", ".join(plan.get("campuses") or []) or "—"
    inds = ", ".join(plan.get("indicators") or []) or "—"
    flags = []
    if plan.get("is_key_plan"):
        flags.append("KEY")
    if plan.get("is_campus_plan"):
        flags.append("campus-plan")
    if plan.get("abandoned"):
        flags.append("abandoned")
    flag_str = ", ".join(flags) or "—"
    desc = (plan.get("description") or "").strip()
    lines = [
        f"Status: {plan.get('plan_status')}",
        f"Year: {years}   Campus: {campus}",
        f"Flags: {flag_str}",
        f"Indicators: {inds}",
        "",
        f"[graph Plan.unique_id: {plan.get('uid')}]",
    ]
    if desc and desc != (plan.get("name") or "").strip():
        lines = [desc, ""] + lines
    return "\n".join(lines)


def build_sections(plans):
    """Bucket plans by working group into ordered Asana sections."""
    buckets = {s: [] for s in SECTION_ORDER}
    for p in plans:
        name = (p.get("name") or "").strip() or "(untitled plan)"
        task = {"name": name, "notes": note_for(p)}
        if str(p.get("plan_status")).lower() == "completed":
            task["completed"] = True
        buckets.setdefault(wg_of(p), []).append(task)

    # Preserve SECTION_ORDER, then append any working groups not in the canonical
    # list (so a new working group never silently drops its plans).
    ordered = list(SECTION_ORDER) + [k for k in buckets if k not in SECTION_ORDER]
    return [{"sectionName": s, "tasks": buckets[s]} for s in ordered if buckets.get(s)]


def count_tasks(sections):
    return sum(len(s["tasks"]) for s in sections)
