#!/usr/bin/env python3
"""
Seed descriptors for the Query ontology type (the pending-question node).

The ontology engine auto-DISCOVERS `node_type:Query` by reflecting over graph_schema, so
this script does not register the type — it authors the curated UniversalDescriptor prose
that overlays it in the Ontology Browser and keeps ontology_health coverage green
(COVERAGE_GOAL_KINDS = node_type + rel_type, so every new relationship needs a descriptor).

Authors: node_type:Query, field:Query.{category,status,answer}, and a rel_type descriptor
for each new relationship (raised_under_plan, addresses_evidence, query_raised_by,
query_settled_by). `has_note` is reused and already described.

Idempotent upsert (create where missing, else refresh title + description_short). Run from
repo root:
    python -m app.database.tools.seed_query_ontology            # apply
    python -m app.database.tools.seed_query_ontology --dry-run  # report only
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

QUERY_LABEL = "Query"

# node_type -> (title, description_short)
NODE_TYPE_DESCRIPTOR = (
    "Pending Question",
    "An open question raised under a working group's plan that drives campus plans and "
    "Year Success Evidence; it carries a category and a status, and holds its answer once "
    "settled.",
)

# field -> (title, description_short)
QUERY_FIELDS = {
    "category": ("Category", "The kind of decision the question needs, framed by question type "
                             "(policy decision, resource request, technical clarification, "
                             "risk/compliance, information gap)."),
    "status":   ("Status", "Where the question sits in its lifecycle: open, in progress, or settled."),
    "answer":   ("Answer", "The resolution recorded on the question once it is settled."),
}

# rel_type -> (title, description_short)
QUERY_RELATIONSHIPS = {
    "raised_under_plan":  ("Raised Under Plan", "Anchors a Query to the WorkingGroupPlan it was "
                                                "raised under, which encodes its campus, academic "
                                                "year, and working group."),
    "addresses_evidence": ("Addresses Evidence", "Links a Query to the Year Success Evidence it bears on."),
    "query_raised_by":    ("Raised By", "The person who raised the question."),
    "query_settled_by":   ("Settled By", "The person who recorded the answer that settled the question."),
}


def main(argv=None):
    ap = argparse.ArgumentParser(description="Seed Query ontology descriptors.")
    ap.add_argument("--dry-run", action="store_true", help="Report what would change without writing.")
    args = ap.parse_args(argv)

    set_connection()
    from app.database.queries.descriptors.create import create_descriptor
    from app.database.queries.descriptors.update import update_descriptor

    # (handle, create_kwargs, title, short)
    plan = []
    node_title, node_short = NODE_TYPE_DESCRIPTOR
    plan.append((make_node_type_handle(QUERY_LABEL),
                 dict(descriptor_kind="node_type", target_label=QUERY_LABEL),
                 node_title, node_short))
    for field, (title, short) in QUERY_FIELDS.items():
        plan.append((make_field_handle(QUERY_LABEL, field),
                     dict(descriptor_kind="field", target_label=QUERY_LABEL, target_field=field),
                     title, short))
    for rel, (title, short) in QUERY_RELATIONSHIPS.items():
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
    print(f"[seed-query-ontology] {verb}created {len(created)}, {verb}updated {len(updated)}, "
          f"unchanged {len(unchanged)} (of {len(plan)})")
    for h in created:
        print("  created:  " + h)
    for h in updated:
        print("  updated:  " + h)
    return 0


if __name__ == "__main__":
    sys.exit(main())
