#!/usr/bin/env python3
"""
Seed descriptors for the shared IMPLEMENTATION fields + the is_evidence_for relationship.

The implementation UI (graph_components/implementation/*) treats Process / Project / Procedure /
Service / Guidance / Tracking / InternalPolicy as one family and resolves shared-field help via a
VIRTUAL node-type label "Implementation" — e.g. describeField('Implementation', 'dimensions'). This
seeds those `field:Implementation.*` descriptors (plus `rel_type:is_evidence_for`) so labels, inline
help, and HelpTips render.

Note: the `field:Implementation.*` descriptors are intentionally VIRTUAL — there is no single
"Implementation" node type in the schema (the fields live on each of the seven types), so these will
appear as "orphan descriptors" in ontology_health. That's expected, not drift.

Idempotent upsert (create where missing, else set title + description_short). Run from repo root:
    python -m app.database.tools.seed_implementation_field_descriptors          # apply
    python -m app.database.tools.seed_implementation_field_descriptors --dry-run # report only
"""
import argparse
import sys

import app.endpoints.data_api  # noqa: F401  (warm data_api before queries-layer imports)
from app.database.graph_schema import set_connection, UniversalDescriptor
from app.database.identifiers import make_field_handle, make_rel_type_handle

IMPL_LABEL = "Implementation"

# field -> (title, description_short). The "field" keys match what the UI passes to
# describeField('Implementation', <field>).
IMPLEMENTATION_FIELDS = {
    "title": ("Title", "A short human title identifying this implementation."),
    "description": ("Description", "A free-text summary of what this implementation is and what it does."),
    "dimensions": ("AMM Dimensions", "The W3C Accessibility Maturity Model dimension(s) this activity falls under — a cross-cutting classification of the work (stored as the classified_under relationship)."),
    "owned_by": ("Owner", "The person custodially responsible for maintaining this implementation's evidence record — distinct from the people who did the work."),
    "participants": ("Participants (working team)", "The people who actually performed the work, each acting in a role — distinct from the custodial owner."),
    "accountable_working_group": ("Accountable Working Group", "The ATI working group (committee) accountable for this work — who answers for it, distinct from who owns the record."),
}

# rel_type -> (title, description_short). is_evidence_for IS a real schema relationship, so this
# descriptor is not a virtual orphan.
RELATIONSHIP_DESCRIPTORS = {
    "is_evidence_for": ("Evidence For", "Links this implementation to the YearSuccessEvidence it serves as proof for, in a given academic year."),
}


def main(argv=None):
    ap = argparse.ArgumentParser(description="Seed implementation field/relationship descriptors.")
    ap.add_argument("--dry-run", action="store_true", help="Report what would change without writing.")
    args = ap.parse_args(argv)

    set_connection()
    from app.database.queries.descriptors.create import create_descriptor
    from app.database.queries.descriptors.update import update_descriptor

    # (handle, kind, kwargs-for-create, title, short)
    plan = []
    for field, (title, short) in IMPLEMENTATION_FIELDS.items():
        plan.append((make_field_handle(IMPL_LABEL, field), "field",
                     dict(descriptor_kind="field", target_label=IMPL_LABEL, target_field=field),
                     title, short))
    for rel, (title, short) in RELATIONSHIP_DESCRIPTORS.items():
        plan.append((make_rel_type_handle(rel), "rel_type",
                     dict(descriptor_kind="rel_type", target_field=rel),
                     title, short))

    created, updated, unchanged = [], [], []
    for handle, _kind, create_kwargs, title, short in plan:
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
    print(f"[seed-impl-fields] {verb}created {len(created)}, {verb}updated {len(updated)}, "
          f"unchanged {len(unchanged)} (of {len(plan)})")
    for h in created:
        print("  created:  " + h)
    for h in updated:
        print("  updated:  " + h)
    return 0


if __name__ == "__main__":
    sys.exit(main())
