#!/usr/bin/env python3
"""
Seed descriptors for the MeetingMinutes ontology type.

The ontology engine auto-DISCOVERS `node_type:MeetingMinutes` by reflecting over graph_schema,
so this script does not register the type — it authors the curated UniversalDescriptor prose
that overlays it in the Ontology Browser and keeps ontology_health coverage green (every new
relationship type needs a descriptor).

Authors: node_type:MeetingMinutes, field:MeetingMinutes.{title,meeting_date,content}, and a
rel_type descriptor for each new relationship (minutes_under_plan, minutes_recorded_by).
`is_documented_by` and `has_note` are reused existing rel-types.

Idempotent upsert. Run from repo root:
    python -m app.database.tools.seed_meeting_minutes_ontology            # apply
    python -m app.database.tools.seed_meeting_minutes_ontology --dry-run  # report only
"""
import argparse
import sys

import app.endpoints.data_api  # noqa: F401  (warm data_api before queries-layer imports)
from app.database.graph_schema import set_connection, UniversalDescriptor
from app.database.identifiers import (
    make_node_type_handle,
    make_field_handle,
    make_rel_type_handle,
)

LABEL = "MeetingMinutes"

NODE_TYPE_DESCRIPTOR = (
    "Meeting Minutes",
    "A working-group meeting record: the minutes body (Markdown) kept for the record, assigned "
    "to a WorkingGroupPlan, optionally linked to supporting Documents/Webpages.",
)

FIELDS = {
    "title":        ("Title", "A short human title for the meeting (e.g. 'Web WG — 2026-03-14')."),
    "meeting_date": ("Meeting Date", "The date the meeting took place."),
    "content":      ("Minutes (Markdown)", "The minutes body as Markdown text — pasted, often "
                                           "auto-generated, and rendered readably on the frontend."),
}

RELATIONSHIPS = {
    "minutes_under_plan":  ("Recorded Under Plan", "Anchors a meeting record to the WorkingGroupPlan it "
                                                   "was recorded under, which encodes its campus, "
                                                   "academic year, and working group."),
    "minutes_recorded_by": ("Recorded By", "The person who recorded the minutes."),
}


def main(argv=None):
    ap = argparse.ArgumentParser(description="Seed MeetingMinutes ontology descriptors.")
    ap.add_argument("--dry-run", action="store_true", help="Report what would change without writing.")
    args = ap.parse_args(argv)

    set_connection()
    from app.database.queries.descriptors.create import create_descriptor
    from app.database.queries.descriptors.update import update_descriptor

    plan = []
    node_title, node_short = NODE_TYPE_DESCRIPTOR
    plan.append((make_node_type_handle(LABEL),
                 dict(descriptor_kind="node_type", target_label=LABEL),
                 node_title, node_short))
    for field, (title, short) in FIELDS.items():
        plan.append((make_field_handle(LABEL, field),
                     dict(descriptor_kind="field", target_label=LABEL, target_field=field),
                     title, short))
    for rel, (title, short) in RELATIONSHIPS.items():
        plan.append((make_rel_type_handle(rel),
                     dict(descriptor_kind="rel_type", target_field=rel),
                     title, short))

    created, updated, unchanged = [], [], []
    for handle, create_kwargs, title, short in plan:
        existing = UniversalDescriptor.nodes.get_or_none(descriptor_handle=handle)
        if existing is None:
            if not args.dry_run:
                create_descriptor(title=title, description_short=short, **create_kwargs)
            created.append(handle)
        elif (existing.description_short or "") == short and (existing.title or "") == title:
            unchanged.append(handle)
        else:
            if not args.dry_run:
                update_descriptor(handle, {"title": title, "description_short": short})
            updated.append(handle)

    verb = "WOULD " if args.dry_run else ""
    print(f"[seed-meeting-minutes-ontology] {verb}created {len(created)}, {verb}updated {len(updated)}, "
          f"unchanged {len(unchanged)} (of {len(plan)})")
    for h in created:
        print("  created:  " + h)
    for h in updated:
        print("  updated:  " + h)
    return 0


if __name__ == "__main__":
    sys.exit(main())
