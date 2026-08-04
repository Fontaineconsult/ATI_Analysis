#!/usr/bin/env python3
"""
Seed descriptors for the CommunityOfPractice ontology type.

The ontology engine auto-DISCOVERS `node_type:CommunityOfPractice` and
`rel_type:member_of_community` by reflecting over graph_schema, so this script does not
register them — it authors the curated UniversalDescriptor prose that overlays them in the
Ontology Browser and keeps ontology_health coverage green (every new relationship type
needs a descriptor).

Authors: node_type:CommunityOfPractice (short + full design rationale) and
rel_type:member_of_community. `name`/`description` field descriptors are deliberately
omitted — field coverage is opt-in for salient fields only, and these are self-evident.

Idempotent upsert. Run from repo root:
    python -m app.database.tools.seed_communities_ontology            # apply
    python -m app.database.tools.seed_communities_ontology --dry-run  # report only
"""
import argparse
import sys

import app.endpoints.data_api  # noqa: F401  (warm data_api before queries-layer imports)
from app.database.graph_schema import set_connection, UniversalDescriptor
from app.database.identifiers import make_node_type_handle, make_rel_type_handle

LABEL = "CommunityOfPractice"

NODE_TYPE_DESCRIPTOR = (
    "Community of Practice",
    # description_short — the UI-default text
    "A cross-campus grouping of people around a shared functional area or interest — "
    "Library, Faculty Development, Disability Services, and so on. Freely creatable "
    "(not a seeded vocabulary); a person's membership carries an optional note about "
    "their stake in the area.",
    # description_full — the design rationale
    "A Community of Practice groups people across campuses around a shared functional "
    "area or interest. It is complementary to the existing people-grouping mechanisms "
    "and deliberately none of them: not an ATIWorkingGroup (the three structural ATI "
    "pillars with workplans), not a Role (a capacity someone provides), and not an "
    "OrgUnit such as a Department or College (a campus-specific employer). Where those "
    "mechanisms answer 'what does this person do for the ATI, in what capacity, and for "
    "whom', a community answers 'who else, anywhere in the system, works the same "
    "ground'.\n\n"
    "Campus-agnostic by design: there is one node per area, with members from any "
    "campus. A campus breakdown of a community is derived from its members' "
    "works_at_campus edges rather than from any edge on the community itself — the "
    "community node never needs migrating when campuses join or leave.\n\n"
    "Communities are freely creatable data (like Person or Department), not a seeded "
    "vocabulary: the unique index on name is the dedupe backstop. Membership is the "
    "member_of_community edge from Person; the edge carries an optional note (the "
    "person's stake in the area) and the date added. A person's memberships are managed "
    "with replace semantics from the individuals endpoint (set_communities), mirroring "
    "how role holdings work.",
)

RELATIONSHIPS = {
    "member_of_community": (
        "Member of Community",
        "Connects a Person to a CommunityOfPractice they belong to. The edge carries an "
        "optional note (the person's stake in the area) and the date added. A person's "
        "memberships are replaced as a set via the individuals endpoint "
        "(set_communities), mirroring role holdings.",
    ),
}


def main(argv=None):
    ap = argparse.ArgumentParser(description="Seed CommunityOfPractice ontology descriptors.")
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
                update_descriptor(handle, {"title": title, "description_short": short,
                                           "description_full": full})
            updated.append(handle)

    verb = "WOULD " if args.dry_run else ""
    print(f"[seed-communities-ontology] {verb}created {len(created)}, {verb}updated {len(updated)}, "
          f"unchanged {len(unchanged)} (of {len(plan)})")
    for h in created:
        print("  created:  " + h)
    for h in updated:
        print("  updated:  " + h)
    return 0


if __name__ == "__main__":
    sys.exit(main())
