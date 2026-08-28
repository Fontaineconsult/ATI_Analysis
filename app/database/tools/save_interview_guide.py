"""
Save (or update) a stakeholder-interview prep guide as an InterviewGuide node.

The /stakeholder-interview skill's persistence step: after writing the guide file
to app/database/ontology/interviews/, run this to mirror it into the graph so the
prep is recallable, linkable, and closable (guide -> resulted_in -> minutes).

Usage (from the project root):
    PYTHONPATH=. python app/database/tools/save_interview_guide.py \
        --file app/database/ontology/interviews/2026-09-08-sfsu-topic.md \
        --title "Interview: Dean Stevens — Library ICT" \
        --campus sfsu --year 2025-2026 \
        [--meeting-date 2026-09-15] \
        [--people <person-uid>,<person-uid>] \
        [--targets 2025-2026-7.11-ins-sfsu,2025-2026-2.3-pro-sfsu] \
        [--communities <community-uid>] \
        [--update <guide-uid>]          # re-save an existing guide in place
        [--resulted-in <minutes-uid>]   # close the loop after ingest

Prints the guide's unique_id on success — record it in the guide file's header.
"""
import argparse
import sys
from pathlib import Path

import app.endpoints.data_api  # noqa: F401  (warm data_api before queries-layer imports)
from app.database.graph_schema import set_connection


def _split(value):
    return [x.strip() for x in value.split(",") if x.strip()] if value else []


def main(argv=None):
    ap = argparse.ArgumentParser(description="Mirror an interview prep guide into the graph.")
    ap.add_argument("--file", required=True, help="The guide .md file (its content becomes the node body).")
    ap.add_argument("--title", help="Guide title (default: first heading line of the file).")
    ap.add_argument("--campus", help="Campus abbreviation (required on create).")
    ap.add_argument("--year", help="Academic year name, e.g. 2025-2026 (required on create).")
    ap.add_argument("--meeting-date", help="Planned meeting date YYYY-MM-DD.")
    ap.add_argument("--people", help="Comma-separated Person unique_ids (prepared_for).")
    ap.add_argument("--targets", help="Comma-separated YSE year_identifiers.")
    ap.add_argument("--communities", help="Comma-separated CommunityOfPractice unique_ids.")
    ap.add_argument("--update", metavar="GUIDE_UID", help="Update this existing guide instead of creating.")
    ap.add_argument("--resulted-in", metavar="MINUTES_UID", help="Set the closure edge to these minutes.")
    args = ap.parse_args(argv)

    path = Path(args.file)
    if not path.is_file():
        sys.exit(f"error: {path} is not a file")
    content = path.read_text(encoding="utf-8")

    title = args.title
    if not title:
        first_heading = next((l for l in content.splitlines() if l.strip().startswith("#")), None)
        title = first_heading.lstrip("# ").strip() if first_heading else path.stem
    source_path = path.as_posix()

    set_connection()
    from app.database.queries.interview_guides.create import create_interview_guide
    from app.database.queries.interview_guides.update import (
        set_guide_communities,
        set_guide_people,
        set_guide_resulted_in,
        set_guide_targets,
        update_interview_guide,
    )

    if args.update:
        uid = args.update
        update_interview_guide(uid, title=title, content=content,
                               meeting_date=args.meeting_date, source_path=source_path)
        if args.people is not None:
            set_guide_people(uid, _split(args.people))
        if args.targets is not None:
            set_guide_targets(uid, _split(args.targets))
        if args.communities is not None:
            set_guide_communities(uid, _split(args.communities))
        verb = "updated"
    else:
        if not args.campus or not args.year:
            sys.exit("error: --campus and --year are required on create")
        guide = create_interview_guide(
            title=title,
            campus_abbrev=args.campus,
            year_name=args.year,
            content=content,
            meeting_date=args.meeting_date,
            source_path=source_path,
            prepared_for_unique_ids=_split(args.people),
            target_year_identifiers=_split(args.targets),
            pertains_to_community_unique_ids=_split(args.communities),
        )
        uid = guide.unique_id
        verb = "created"

    if args.resulted_in:
        set_guide_resulted_in(uid, args.resulted_in)

    print(f"[save-interview-guide] {verb}: {uid}")
    print(uid)


if __name__ == "__main__":
    main()
