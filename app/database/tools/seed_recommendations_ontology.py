#!/usr/bin/env python3
"""
Seed descriptors for the Recommendation ontology type.

The ontology engine auto-DISCOVERS `node_type:Recommendation` and
`rel_type:has_recommendation` by reflecting over graph_schema; this script
authors the curated UniversalDescriptor prose that overlays them in the
Ontology Browser and keeps ontology_health coverage green.

Idempotent upsert. Run from repo root:
    python -m app.database.tools.seed_recommendations_ontology            # apply
    python -m app.database.tools.seed_recommendations_ontology --dry-run  # report only
"""
import argparse
import sys

import app.endpoints.data_api  # noqa: F401  (warm data_api before queries-layer imports)
from app.database.graph_schema import set_connection, UniversalDescriptor
from app.database.identifiers import make_node_type_handle, make_rel_type_handle

LABEL = "Recommendation"

NODE_TYPE_DESCRIPTOR = (
    "Recommendation",
    # description_short — the UI-default text
    "An improvement identified at the end of a review cycle for one year's "
    "evidence — what should change before the next cycle. Lifecycle: open → "
    "addressed or dismissed, with a resolution recording how or why.",
    # description_full — the design rationale
    "A Recommendation is the durable record of 'what we think needs to change', "
    "attached to the YearSuccessEvidence whose review produced it — the maturity "
    "review's blocking gaps, an approver's conditions, a reviewer's asks. It "
    "exists so that improvement guidance survives the review that produced it "
    "instead of dissolving into notes.\n\n"
    "Lifecycle over deletion: a recommendation is open until it is addressed "
    "(the improvement was made) or dismissed (deliberately not pursued), with "
    "`resolution` prose recording how or why and `date_resolved` stamping the "
    "transition. There is no delete path — recommendations are records, and a "
    "dismissed recommendation with its reasoning is itself evidence of a "
    "considered decision.\n\n"
    "Rollover policy is deliberately open: the natural rule is that OPEN "
    "recommendations carry forward to the next year's evidence (they are "
    "guidance for the next cycle) while resolved ones stay with the reviewed "
    "year. To be wired into the rollover tooling at the next cycle decision.",
)

RELATIONSHIPS = {
    "has_recommendation": (
        "Has Recommendation",
        "Connects a YearSuccessEvidence to a Recommendation raised during its "
        "review cycle. The recommendation's created_by edge records the reviewer; "
        "status + resolution carry the lifecycle (open → addressed | dismissed).",
    ),
}


def main(argv=None):
    ap = argparse.ArgumentParser(description="Seed Recommendation ontology descriptors.")
    ap.add_argument("--dry-run", action="store_true", help="Report what would change without writing.")
    args = ap.parse_args(argv)

    set_connection()
    from app.database.queries.descriptors.create import create_descriptor
    from app.database.queries.descriptors.update import update_descriptor

    node_title, node_short, node_full = NODE_TYPE_DESCRIPTOR
    plan = [(make_node_type_handle(LABEL),
             dict(descriptor_kind="node_type", target_label=LABEL),
             node_title, node_short, node_full)]
    for rel, (title, short) in RELATIONSHIPS.items():
        plan.append((make_rel_type_handle(rel),
                     dict(descriptor_kind="rel_type", target_field=rel),
                     title, short, None))

    created, updated, unchanged = [], [], []
    for handle, create_kwargs, title, short, full in plan:
        existing = UniversalDescriptor.nodes.get_or_none(descriptor_handle=handle)
        if existing is None:
            if not args.dry_run:
                create_descriptor(title=title, description_short=short,
                                  description_full=full, **create_kwargs)
            created.append(handle)
        elif ((existing.title or "") == title
              and (existing.description_short or "") == short
              and (existing.description_full or "") == (full or "")):
            unchanged.append(handle)
        else:
            if not args.dry_run:
                update_descriptor(handle, title=title, description_short=short,
                                  description_full=full)
            updated.append(handle)

    mode = "DRY RUN — " if args.dry_run else ""
    print(f"{mode}created: {created or 'none'}")
    print(f"{mode}updated: {updated or 'none'}")
    print(f"{mode}unchanged: {unchanged or 'none'}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
