"""
Idempotent seed for the seven W3C Accessibility Maturity Model (AMM) Dimension nodes.

Dimensions are a fixed controlled set used to classify the four doing-implementations
(Process/Project/Procedure/Service) via classified_under. Each is seeded with the AMM's
own dimension definition so the node is self-describing.

Upsert semantics: keyed on `handle`. An existing handle is UPDATED (name + description
refreshed); a new handle is CREATED. Re-running is safe and reports created-vs-updated.

Run with: python -m app.database.tools.seed_dimensions
"""
from app.database.graph_schema import set_connection, Dimension

# Load the data_api endpoint package first so a standalone run resolves the
# queries<->data_api import cycle (same accommodation seed_descriptors.py makes).
import app.endpoints.data_api  # noqa: E402,F401


# (handle, name, description) — definitions condensed from the AMM dimension descriptions.
DIMENSIONS = [
    ("dimension:communications", "Communications",
     "Information as it relates to an organization's accessibility, and the accessibility of all "
     "internal and external communications. Covers communications that are external and internal, "
     "formal and informal, major and minor, and produced either by the organization directly or by "
     "third parties under contract."),
    ("dimension:governance-oversight", "Governance & Oversight",
     "The organization's commitment to accessibility: directing, monitoring, sustaining, and "
     "measuring accessibility across the organization. Establishes accountability through policies, "
     "standards, and decision-making structures, and integrates accessibility into planning, "
     "resourcing, and risk management."),
    ("dimension:ict-development-lifecycle", "ICT Development Lifecycle",
     "Incorporation of web, software, and hardware accessibility considerations throughout the "
     "development process — from idea conception through design, development, testing, ACR "
     "production, user research, maintenance, and obsolescence."),
    ("dimension:knowledge-skills", "Knowledge & Skills",
     "Ongoing education and outsourcing practices that give internal and external personnel at all "
     "levels the accessibility knowledge and skills relevant to their organizational role."),
    ("dimension:personnel", "Personnel",
     "Employing qualified individuals with disabilities throughout the organization's hierarchy — "
     "across job types, authority levels, and departments — so their insights and lived experience "
     "inform decision-making."),
    ("dimension:procurement", "Procurement",
     "The strategic process of finding and acquiring accessible products and services the "
     "organization needs, including sourcing, negotiation, and selection, with accessibility "
     "integrated into procurement processes and contract language."),
    ("dimension:support", "Support",
     "Accessibility assistance provided to internal employees and external customers with "
     "disabilities, including reasonable accommodations for employees and accessibility-specific "
     "customer support."),
]


def seed_dimensions():
    created = updated = 0
    for handle, name, description in DIMENSIONS:
        node = Dimension.nodes.get_or_none(handle=handle)
        if node is None:
            Dimension(handle=handle, name=name, description=description).save()
            created += 1
            print(f"  - {handle}: created")
        else:
            node.name = name
            node.description = description
            node.save()
            updated += 1
            print(f"  - {handle}: updated")
    print(f"\nDone. Created: {created}, Updated: {updated}")


if __name__ == "__main__":
    set_connection()
    print("=" * 60)
    print("Seed AMM Dimensions (Dimension nodes)")
    print("=" * 60 + "\n")
    seed_dimensions()
