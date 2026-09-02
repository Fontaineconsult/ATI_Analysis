#!/usr/bin/env python3
"""
Fully reset the admin-review settings for one campus in one academic year.

The inverse of the assign_approver flow, scoped tighter than the year-wide
reset_year_workflow_fields() in create_new_ay_campus.py: this touches ONLY the
admin-review field family, on ONLY the given campus's YSEs for the given year.
Planning/workflow scalars (priority_level, documentation_status,
resources_status, implementation_plan_status, worked_on_* flags) are NOT
touched — those are year-rollover policy, not review state.

Per matching YearSuccessEvidence:
  - administrative_review_complete -> false
  - ready_for_admin_review        -> false
  - administrative_review_completed_date, admin_review_description removed
  - admin_review_completed_by approver edges deleted
  - (--include-notes only) admin_review_note reviewer Notes DETACH DELETEd —
    these are authored feedback, so destroying them is an explicit opt-in.

Idempotent: re-running against an already-reset campus is a no-op.

Run from repo root:
    python -m app.database.tools.reset_campus_admin_review 2025-2026 sfsu --dry-run
    python -m app.database.tools.reset_campus_admin_review 2025-2026 sfsu
    python -m app.database.tools.reset_campus_admin_review 2025-2026 sfsu --include-notes
"""
import argparse
import sys

import app.endpoints.data_api  # noqa: F401  (warm data_api before queries-layer imports)
from app.database.graph_schema import set_connection
from neomodel import db

# NB: property names vs edge types differ on YearSuccessEvidence —
# administrative_review_completed_by -> edge "admin_review_completed_by",
# admin_reviewer_note -> edge "admin_review_note". Cypher below uses edge types.
_SCOPE = """
    MATCH (e:YearSuccessEvidence)-[:evidence_in_year]->(:AcademicYear {name: $year})
    MATCH (e)-[:evidence_at_campus]->(:Campus {abbreviation: $campus})
"""

_COUNT_QUERY = _SCOPE + """
    OPTIONAL MATCH (e)-[rel:admin_review_completed_by]->(:Person)
    OPTIONAL MATCH (e)-[:admin_review_note]->(n:Note)
    WITH e, count(DISTINCT rel) AS approver_links, count(DISTINCT n) AS notes
    RETURN count(e) AS yses_in_scope,
           sum(CASE WHEN e.administrative_review_complete = true
                      OR e.ready_for_admin_review = true
                      OR e.administrative_review_completed_date IS NOT NULL
                      OR e.admin_review_description IS NOT NULL
                      OR approver_links > 0
                    THEN 1 ELSE 0 END) AS yses_with_review_state,
           sum(approver_links) AS approver_links,
           sum(notes) AS reviewer_notes
"""

_RESET_QUERY = _SCOPE + """
    SET e.administrative_review_complete = false,
        e.ready_for_admin_review = false
    REMOVE e.administrative_review_completed_date,
           e.admin_review_description
    WITH e
    OPTIONAL MATCH (e)-[rel:admin_review_completed_by]->(p:Person)
    DELETE rel
    RETURN count(DISTINCT e) AS yses_reset, count(DISTINCT p) AS approver_links_removed
"""

_DELETE_NOTES_QUERY = _SCOPE + """
    MATCH (e)-[:admin_review_note]->(n:Note)
    WITH collect(DISTINCT n) AS notes
    FOREACH (x IN notes | DETACH DELETE x)
    RETURN size(notes) AS notes_deleted
"""


def _require_scope(year: str, campus: str) -> None:
    """Fail loudly on a bad year/campus instead of silently matching nothing."""
    rows, _ = db.cypher_query(
        "OPTIONAL MATCH (y:AcademicYear {name: $year}) "
        "OPTIONAL MATCH (c:Campus {abbreviation: $campus}) "
        "RETURN y IS NOT NULL, c IS NOT NULL",
        {"year": year, "campus": campus},
    )
    year_ok, campus_ok = rows[0]
    if not year_ok:
        raise SystemExit(f"AcademicYear {year!r} not found.")
    if not campus_ok:
        raise SystemExit(f"Campus with abbreviation {campus!r} not found.")


def reset_campus_admin_review(year: str, campus: str,
                              include_notes: bool = False,
                              dry_run: bool = False) -> dict:
    """
    Reset every admin-review setting on the given campus's YSEs for the given
    year. Returns a counts dict; with dry_run=True nothing is written.
    """
    params = {"year": year, "campus": campus}
    _require_scope(year, campus)

    rows, _ = db.cypher_query(_COUNT_QUERY, params)
    yses_in_scope, with_state, approver_links, reviewer_notes = (
        rows[0] if rows else (0, 0, 0, 0)
    )
    counts = {
        "yses_in_scope": yses_in_scope or 0,
        "yses_with_review_state": with_state or 0,
        "approver_links": approver_links or 0,
        "reviewer_notes": reviewer_notes or 0,
        "yses_reset": 0,
        "approver_links_removed": 0,
        "notes_deleted": 0,
    }
    if dry_run:
        return counts

    rows, _ = db.cypher_query(_RESET_QUERY, params)
    if rows:
        counts["yses_reset"] = rows[0][0] or 0
        counts["approver_links_removed"] = rows[0][1] or 0

    if include_notes:
        rows, _ = db.cypher_query(_DELETE_NOTES_QUERY, params)
        counts["notes_deleted"] = (rows[0][0] or 0) if rows else 0

    return counts


def main(argv=None):
    ap = argparse.ArgumentParser(
        description="Fully reset admin-review settings for one campus in one academic year.",
    )
    ap.add_argument("year", help="AcademicYear name, e.g. 2025-2026")
    ap.add_argument("campus", help="Campus abbreviation, e.g. sfsu")
    ap.add_argument("--dry-run", action="store_true",
                    help="Report what would be reset without writing.")
    ap.add_argument("--include-notes", action="store_true",
                    help="Also DETACH DELETE admin reviewer Notes (authored feedback — off by default).")
    args = ap.parse_args(argv)

    set_connection()
    counts = reset_campus_admin_review(
        args.year, args.campus, include_notes=args.include_notes, dry_run=args.dry_run,
    )

    verb = "WOULD reset" if args.dry_run else "reset"
    print(f"[reset-campus-admin-review] {args.campus} / {args.year}: "
          f"{verb} {counts['yses_with_review_state']} of {counts['yses_in_scope']} YSEs with review state "
          f"({counts['approver_links'] if args.dry_run else counts['approver_links_removed']} approver links, "
          f"{counts['reviewer_notes']} reviewer notes"
          f"{' — notes deleted' if args.include_notes and not args.dry_run else ' — notes kept' if not args.dry_run else ''})")
    if args.dry_run and counts["reviewer_notes"]:
        print("  note: reviewer Notes are only deleted with --include-notes")
    return 0


if __name__ == "__main__":
    sys.exit(main())
