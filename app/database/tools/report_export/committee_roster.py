"""
Committee roster export.

Lists every active committee contributor across all campuses with their campus,
working group(s), and assigned YearSuccessEvidence (success indicators) for an
academic year — the "who's who" needed to assemble the ATI committee.

A committee member is an active Person not flagged as a non-committee member
(active = true AND non_committee_member_active = false). Output is e-mail-pasteable:
a styled HTML file (inline
styles so it survives a copy-paste into Gmail/Outlook) plus a plain-text fallback,
written next to this script under ./reports/. Read-only — it never writes to the graph.

Run:
    python -m app.database.tools.report_export.committee_roster [academic_year]

`academic_year` (e.g. 2025-2026) is optional; it scopes the *assignment* column. If
omitted, the latest AcademicYear in the graph is used. Working-group membership is not
year-scoped, so a contributor still appears even if they have no assignments that year.
"""
import os
import sys

from app.database.graph_schema import set_connection
from app.data_config import working_groups as WORKING_GROUPS
from neomodel import db


# Person-centric: one row per contributor, with WG membership and (year-scoped)
# assignments collected as lists. Staged WITHs keep the two collects from
# cross-multiplying. No apoc — aggregation/formatting happens in Python.
_ROSTER_QUERY = """
    MATCH (p:Person)
    WHERE coalesce(p.active, true) = true
      AND coalesce(p.non_committee_member_active, false) = false
    OPTIONAL MATCH (p)-[:works_at_campus]->(hc:Campus)
    WITH p, hc
    OPTIONAL MATCH (p)-[:participates_in]->(wg:ATIWorkingGroup)
    WITH p, hc, collect(DISTINCT wg.name) AS wgs
    OPTIONAL MATCH (p)-[:implements]->(yse:YearSuccessEvidence)-[:evidence_in_year]->(ay:AcademicYear)
        WHERE ($academic_year IS NULL OR ay.name = $academic_year)
    OPTIONAL MATCH (yse)-[:tracks]->(si:SuccessIndicator)
    OPTIONAL MATCH (yse)-[:evidence_at_campus]->(yc:Campus)
    WITH p, hc, wgs,
         collect(DISTINCT CASE WHEN yse IS NULL THEN NULL ELSE {
             indicator: si.composite_key,
             indicator_name: si.success_indicator,
             year: ay.name,
             campus: yc.abbreviation
         } END) AS raw_assignments
    RETURN p.name           AS name,
           p.title          AS title,
           p.email          AS email,
           p.ati_role       AS ati_role,
           hc.abbreviation  AS campus,
           [w IN wgs WHERE w IS NOT NULL]                 AS working_groups,
           [a IN raw_assignments WHERE a IS NOT NULL]     AS assignments
    ORDER BY campus, name
"""

# Sort index per working group, derived from the single source of truth.
_WG_ORDER = {name: i for i, name in enumerate(WORKING_GROUPS)}


def latest_academic_year():
    # Real ATI years are '20xx-20xx'; the 99xx-99xx test sentinels sort highest, so
    # restrict to 20xx to avoid picking a test year by default.
    rows, _ = db.cypher_query(
        "MATCH (ay:AcademicYear) WHERE ay.name STARTS WITH '20' RETURN ay.name ORDER BY ay.name DESC LIMIT 1"
    )
    return rows[0][0] if rows else None


def fetch_roster(academic_year):
    rows, _ = db.cypher_query(_ROSTER_QUERY, {"academic_year": academic_year})
    people = []
    for name, title, email, ati_role, campus, working_groups, assignments in rows:
        # de-dup indicator keys, drop blanks, sort
        indicators = sorted({a.get("indicator") for a in assignments if a.get("indicator")})
        people.append({
            "name": name or "(unnamed)",
            "title": title or "",
            "email": email or "",
            "ati_role": ati_role or "",
            "campus": campus or "(no campus)",
            "working_groups": sorted(working_groups, key=lambda w: _WG_ORDER.get(w, 99)),
            "indicators": indicators,
        })
    return people


def _group_by_campus(people):
    groups = {}
    for p in people:
        groups.setdefault(p["campus"], []).append(p)
    # campuses alphabetically, "(no campus)" last
    return sorted(groups.items(), key=lambda kv: (kv[0] == "(no campus)", kv[0]))


# ---- HTML (inline styles for e-mail clients) --------------------------------
_TD = 'style="border:1px solid #d0d7de;padding:6px 10px;vertical-align:top;font-size:13px;"'
_TH = 'style="border:1px solid #d0d7de;padding:6px 10px;text-align:left;background:#f3f6f9;font-size:12px;text-transform:uppercase;color:#475569;"'


def render_html(people, academic_year):
    year_label = academic_year or "all years"
    parts = [
        '<div style="font-family:Arial,Helvetica,sans-serif;color:#1f2937;">',
        f'<h2 style="margin:0 0 4px;">ATI Committee Roster</h2>',
        f'<p style="margin:0 0 16px;color:#475569;font-size:13px;">'
        f'{len(people)} contributor(s) across {len(_group_by_campus(people))} campus group(s) · '
        f'assignments for <strong>{year_label}</strong></p>',
    ]
    for campus, members in _group_by_campus(people):
        parts.append(f'<h3 style="margin:18px 0 6px;color:#0f766e;">{campus} '
                     f'<span style="font-weight:normal;color:#94a3b8;font-size:13px;">({len(members)})</span></h3>')
        parts.append('<table style="border-collapse:collapse;width:100%;margin-bottom:8px;">')
        parts.append(f'<tr><th {_TH}>Name</th><th {_TH}>Title</th><th {_TH}>Email</th>'
                     f'<th {_TH}>Working group(s)</th><th {_TH}>Assigned indicators</th></tr>')
        for m in members:
            wgs = ", ".join(m["working_groups"]) or "—"
            inds = ", ".join(m["indicators"]) or "—"
            role = f'<br><span style="color:#94a3b8;font-size:11px;">{m["ati_role"]}</span>' if m["ati_role"] else ""
            email = f'<a href="mailto:{m["email"]}" style="color:#0f766e;">{m["email"]}</a>' if m["email"] else "—"
            parts.append(
                f'<tr><td {_TD}><strong>{m["name"]}</strong>{role}</td>'
                f'<td {_TD}>{m["title"] or "—"}</td>'
                f'<td {_TD}>{email}</td>'
                f'<td {_TD}>{wgs}</td>'
                f'<td {_TD}>{inds}</td></tr>'
            )
        parts.append('</table>')
    parts.append('</div>')
    return "\n".join(parts)


def render_text(people, academic_year):
    year_label = academic_year or "all years"
    lines = [f"ATI COMMITTEE ROSTER — assignments for {year_label}",
             f"{len(people)} contributor(s)", ""]
    for campus, members in _group_by_campus(people):
        lines.append(f"== {campus} ({len(members)}) ==")
        for m in members:
            wgs = ", ".join(m["working_groups"]) or "—"
            inds = ", ".join(m["indicators"]) or "—"
            title = f" — {m['title']}" if m["title"] else ""
            email = f" <{m['email']}>" if m["email"] else ""
            lines.append(f"  • {m['name']}{title}{email}")
            lines.append(f"      working group(s): {wgs}")
            lines.append(f"      indicators:       {inds}")
        lines.append("")
    return "\n".join(lines)


if __name__ == "__main__":
    set_connection()
    year = sys.argv[1] if len(sys.argv) > 1 else latest_academic_year()

    people = fetch_roster(year)
    html = render_html(people, year)
    text = render_text(people, year)

    out_dir = os.path.join(os.path.dirname(__file__), "reports")
    os.makedirs(out_dir, exist_ok=True)
    suffix = (year or "all").replace("/", "-")
    html_path = os.path.join(out_dir, f"committee_roster_{suffix}.html")
    text_path = os.path.join(out_dir, f"committee_roster_{suffix}.txt")
    with open(html_path, "w", encoding="utf-8") as f:
        f.write(html)
    with open(text_path, "w", encoding="utf-8") as f:
        f.write(text)

    print(f"Academic year scope: {year or 'all years'}")
    print(f"Contributors:        {len(people)}")
    print(f"HTML (open + copy into the email body): {html_path}")
    print(f"Plain text:                             {text_path}")
    print()
    print(text)
