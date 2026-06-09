"""
Idempotent seed for the Role nodes — the capacities people provide, from the applicable
W3C Accessibility Maturity Model role-categories (pruned to what applies to a CSU campus).
General capacity descriptions, not job descriptions; institution-neutral. Prune/extend
freely — re-running is safe.

Upsert on `handle`: an existing handle is UPDATED (name + description refreshed); a new one
is CREATED. Reports created-vs-updated.

Run with: python -m app.database.tools.seed_roles
"""
from app.database.graph_schema import set_connection, Role

# Warm up the data_api package first so a standalone run resolves the
# queries<->data_api import cycle (same accommodation seed_dimensions.py makes).
import app.endpoints.data_api  # noqa: E402,F401


# (handle, name, description) — general capacity descriptions, NOT job descriptions.
ROLES = [
    ("role:accessibility-consultant-advisor", "Accessibility Consultant/Advisor", "Provides expert accessibility guidance across dimensions."),
    ("role:accessibility-specialist", "Accessibility Specialist", "Hands-on accessibility expertise and remediation capacity."),
    ("role:chief-accessibility-officer", "Chief Accessibility Officer / Lead", "Executive-level accessibility program leadership."),
    ("role:content-producer", "Content Provider/Producer", "Creates and prepares accessible content."),
    ("role:designer", "Designer", "Designs accessible interfaces and experiences."),
    ("role:developer", "Developer", "Implements accessible software/UI."),
    ("role:instructor-trainer", "Instructor/Trainer", "Delivers accessibility knowledge and skills training."),
    ("role:it-manager", "IT Manager", "Manages ICT systems with accessibility responsibility."),
    ("role:legal-representative", "Legal Representative", "Provides legal/compliance counsel on accessibility."),
    ("role:org-policy-maker", "Organizational Policy-Maker", "Sets institutional accessibility policy."),
    ("role:product-manager", "Product Manager", "Owns product direction including accessibility."),
    ("role:project-manager", "Project Manager", "Coordinates accessibility projects and timelines."),
    ("role:qa-specialist", "QA Specialist", "Performs manual/automated accessibility testing."),
    ("role:researcher", "Researcher", "Conducts user research including users with disabilities."),
    ("role:procurement-team", "Procurement Team", "Integrates accessibility into acquisition."),
    ("role:ux-team", "UX Team", "User-experience capacity including accessibility."),
    ("role:employee-with-disability", "Employee with Disability", "First-hand lived-experience capacity informing the work."),
    ("role:dei-officer", "Diversity & Inclusion Officer", "Disability-inclusion capacity across the org."),
    ("role:comms", "Public Relations/Communications", "Accessible communications capacity."),
    ("role:alt-media-coordinator", "Alternative Media Coordinator", "Braille/alt-format production capacity (campus-specific)."),
]


def seed_roles():
    created = updated = 0
    for handle, name, description in ROLES:
        node = Role.nodes.get_or_none(handle=handle)
        if node is None:
            Role(handle=handle, name=name, description=description).save()
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
    print("Seed Roles (Role nodes)")
    print("=" * 60 + "\n")
    seed_roles()
