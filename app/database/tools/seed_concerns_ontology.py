#!/usr/bin/env python3
"""
Seed descriptors for the Concern ontology type.

The ontology engine auto-DISCOVERS `node_type:Concern` and the
`has_concern` / `became_recommendation` / `became_plan` rel types by reflecting
over graph_schema; this script authors the curated UniversalDescriptor prose
that overlays them in the Ontology Browser and keeps ontology_health coverage
green.

Idempotent upsert. Run from repo root:
    python -m app.database.tools.seed_concerns_ontology            # apply
    python -m app.database.tools.seed_concerns_ontology --dry-run  # report only
"""
import argparse
import sys

import app.endpoints.data_api  # noqa: F401  (warm data_api before queries-layer imports)
from app.database.graph_schema import set_connection, UniversalDescriptor
from app.database.identifiers import make_node_type_handle, make_rel_type_handle

LABEL = "Concern"

NODE_TYPE_DESCRIPTOR = (
    "Concern",
    # description_short — the UI-default text
    "An issue raised against one year's evidence for which no path to "
    "resolution has been defined yet. Lifecycle: open → converted (it became a "
    "recommendation or a plan) or dismissed.",
    # description_full — the design rationale
    "A Concern is the holding pen between 'someone said this is a problem' and "
    "'here is what we are doing about it'. It exists so that a raised issue has "
    "somewhere to live before anyone has decided what would resolve it — "
    "instead of being lost in a note or prematurely written up as a "
    "recommendation nobody agreed to.\n\n"
    "It is deliberately an unstable state. A concern is meant to LEAVE, in one "
    "of three ways: it converts into a Recommendation (something should "
    "change), it converts into a Plan (someone will do something), or it is "
    "dismissed with a resolution saying why. A concern that has been open for a "
    "long time is itself a signal — it says an issue has been sitting without "
    "anyone defining what would close it.\n\n"
    "What separates it from its neighbours is the resolution path, not the "
    "subject matter. A Recommendation already states the change to make. A Plan "
    "already names committed work. A Query is an open DECISION that has a "
    "decider; a concern has no owner of the answer yet. A Note is an "
    "observation that does not assert a problem at all.\n\n"
    "Lifecycle over deletion: there is no delete path, and a converted concern "
    "keeps its `became_recommendation` / `became_plan` edge to whatever it "
    "became. That edge is the provenance trail — it makes 'where did this plan "
    "come from' a queryable question rather than an archaeological one.",
)

RELATIONSHIPS = {
    "has_concern": (
        "Has Concern",
        "Connects a YearSuccessEvidence to a Concern raised against it. The "
        "concern's raised_by edge records who raised it; status + resolution "
        "carry the lifecycle (open → converted | dismissed).",
    ),
    "became_recommendation": (
        "Became Recommendation",
        "Provenance edge from a converted Concern to the Recommendation it was "
        "promoted into. Both nodes survive: the concern records that the issue "
        "was raised, the recommendation records what should change.",
    ),
    "became_plan": (
        "Became Plan",
        "Provenance edge from a converted Concern to the Plan it was promoted "
        "into. Answers 'what raised this plan' without reading prose.",
    ),
}


def main(argv=None):
    ap = argparse.ArgumentParser(description="Seed Concern ontology descriptors.")
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
