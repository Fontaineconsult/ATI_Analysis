"""
Idempotent seed for the ontology descriptions layer (UniversalDescriptor).

Pre-populates descriptors so the Settings > Ontology Descriptions view opens with real
content instead of empty. Three kinds are seeded:

  - node_type   : one per curated node class, description drawn from its class docstring.
  - field       : the salient identity / descriptive fields on Interface and Asset.
  - field_value : every value of the public controlled vocabularies in data_config, so each
                  choice (e.g. function 'teaching-and-learning') can be described on its own.

Upsert semantics: keyed on descriptor_handle (built by the identifiers.py factory). A handle
that already exists is UPDATED (its descriptions refreshed); a new handle is CREATED. Re-running
is safe and reports created-vs-updated counts. Hand edits made in the UI to a descriptor's text
WILL be overwritten by a re-run — re-run only to (re)introduce the seed baseline.

Run with: python -m app.database.tools.seed_descriptors
"""
import inspect
import re

from app.database import graph_schema
from app.database.graph_schema import set_connection

# Load the data_api endpoint package FIRST. The queries.descriptors modules import
# custom_exceptions from inside data_api, and data_api/__init__ eagerly imports every
# endpoint (including descriptors.py, which imports back into queries.descriptors.create).
# Importing a queries module as this script's entry point would therefore re-enter a
# half-initialized create.py and raise a circular ImportError. Warming up the full package
# first resolves the cycle, the same accommodation tests/conftest.py makes via
# _warmup_data_api(). (Inside Flask boot the package always loads first, so this is only
# needed for standalone script entry points.)
import app.endpoints.data_api  # noqa: E402,F401

from app.data_config import (  # noqa: E402
    functions, coverage_domains, audiences, interface_provenances, component_kinds,
    asset_classes, asset_scopes, taap_outcomes,
)
from app.database.queries.descriptors.create import create_descriptor, build_descriptor_handle  # noqa: E402
from app.database.queries.descriptors.read import get_descriptor  # noqa: E402
from app.database.queries.descriptors.update import update_descriptor  # noqa: E402
from app.endpoints.data_api.errors.custom_exceptions import NotFoundError  # noqa: E402


# --- node types to describe (skipped silently if a name isn't defined in the schema) -------
NODE_TYPE_LABELS = [
    # ICT / assets
    "Asset", "Interface", "Component", "Tool", "TAAP",
    # governance
    "Law", "Case", "Directive", "ExternalPolicy", "Memo", "Guideline",
    # indicators
    "Goal", "SuccessIndicator",
    # evidence
    "YearSuccessEvidence", "AcademicYear", "StatusLevel", "Accomplishment",
    # implementation
    "Plan", "InternalPolicy", "Process", "Project", "Procedure", "Service", "Guidance", "Tracking",
    # organizational
    "ATIWorkingGroup", "Person", "Department", "College", "Vendor", "Campus",
    # documentation
    "Document", "Webpage", "Note", "Message", "Metric",
    # meta + meta-scaffold
    "UniversalDescriptor", "Principle", "IntellectualSource",
]

# --- salient fields to describe: (label, field, short, full) -------------------------------
FIELD_DESCRIPTORS = [
    ("Interface", "interface_identifier",
     "The composite identity signature of an interface.",
     "Unique key built as backing--locus--function--title-slug. All four coordinates are "
     "identity, so the identifier is immutable; a different coordinate is a different interface."),
    ("Interface", "function",
     "The institutional purpose the interface serves (identity coordinate).",
     "One of the controlled `functions` vocabulary. Identity-bearing and single-valued — it is "
     "part of the interface's key."),
    ("Interface", "locus",
     "The named structural zone within the backing (identity coordinate).",
     "Governed free text (e.g. 'course-shells'), slugified into the identifier. Identity-bearing."),
    ("Interface", "presented_by",
     "The backing Asset behind the interface (or 'standalone').",
     "Supplies the `backing` identity coordinate. Optional — a standalone interface has no owned "
     "asset behind it, which is a correct, meaningful state."),
    ("Interface", "audience",
     "Who encounters the interface (multi-valued).",
     "Any of the `audiences` vocabulary; the governing legal basis differs by audience. Descriptive, "
     "not identity."),
    ("Interface", "coverage_domains",
     "Institution-chosen domains of ATI attention (multi-valued).",
     "Any of the `coverage_domains` vocabulary — the declared 'what we track'. Descriptive, "
     "orthogonal to function and provenance."),
    ("Interface", "provenance",
     "How the interface became known to the ATI.",
     "One of `interface_provenances` (declared / enacted / both). The declared-vs-enacted gap is "
     "diagnostic and not meant to be eliminated."),
    ("Asset", "asset_identifier",
     "The composite identity of an asset.",
     "Built as title-slug plus locus, because scope (where remediation authority sits) is part of "
     "asset identity — e.g. 'canvas-sfsu' vs 'canvas-systemwide'."),
    ("Asset", "asset_class",
     "The kind of asset.",
     "One of the `asset_classes` vocabulary."),
    ("Asset", "scope",
     "The scope at which the asset is owned and remediated.",
     "One of the `asset_scopes` vocabulary (e.g. campus, systemwide, vendor, regional)."),
    # meta-scaffold
    ("Principle", "handle",
     "The stable, unique handle for a principle (its URL/selection key).",
     "Namespaced as 'principle:<slug>' (e.g. 'principle:closest-to-capacity'). Identity — immutable."),
    ("Principle", "description_short",
     "Concise statement of the principle (the default UI text).",
     "Shown by default in lists and tooltips; the full rationale lives in description_full."),
    ("Principle", "description_full",
     "The full rationale behind the principle — the whole idea.",
     "Long-form reasoning and design commitment; shown on demand behind an expand."),
    ("Principle", "derives_from",
     "Grounding: the Governance and/or IntellectualSource a principle is grounded DOWN in.",
     "Heterogeneous edge — points at law/policy (mandate) and/or theory (scholarship). An "
     "ungrounded principle is intentionally findable, not blocked at save time."),
    ("Principle", "shapes",
     "The ontology elements (descriptors) this principle shapes ACROSS the schema.",
     "The across-link from a conceptual commitment to the type-level elements it justifies — it "
     "points at the SAME UniversalDescriptor that holds each element's prose. A principle that "
     "shapes nothing is inert and findable later."),
]

# --- field-value vocabularies: (field_name, vocabulary dict) -------------------------------
FIELD_VALUE_VOCABS = [
    ("function", functions),
    ("coverage_domains", coverage_domains),
    ("audience", audiences),
    ("provenance", interface_provenances),
    ("component_kind", component_kinds),
    ("asset_class", asset_classes),
    ("scope", asset_scopes),
    ("outcome", taap_outcomes),
]


def _clean_docstring(doc: str) -> str:
    """Dedent a class docstring and collapse internal whitespace into clean prose."""
    if not doc:
        return ""
    text = inspect.cleandoc(doc).strip()
    return re.sub(r"\s+", " ", text)


def _first_sentence(text: str) -> str:
    """First sentence of a cleaned docstring, for the short description."""
    if not text:
        return ""
    match = re.search(r"(.+?[.!?])(\s|$)", text)
    return (match.group(1) if match else text).strip()


def _upsert(descriptor_kind, *, target_label=None, target_field=None, target_value=None,
            title=None, short=None, full=None):
    """Create the descriptor, or update its descriptions if its handle already exists."""
    handle = build_descriptor_handle(descriptor_kind, target_label, target_field, target_value)
    try:
        get_descriptor(handle)
    except NotFoundError:
        create_descriptor(
            descriptor_kind=descriptor_kind,
            target_label=target_label, target_field=target_field, target_value=target_value,
            title=title, description_short=short, description_full=full,
        )
        return "created"
    update_descriptor(handle, {"title": title, "description_short": short, "description_full": full})
    return "updated"


def seed_descriptors():
    created = updated = 0

    print("Node-type descriptors:")
    for label in NODE_TYPE_LABELS:
        cls = getattr(graph_schema, label, None)
        if cls is None:
            print(f"  - {label}: SKIP (not in schema)")
            continue
        full = _clean_docstring(cls.__doc__)
        short = _first_sentence(full)
        result = _upsert("node_type", target_label=label, title=label, short=short, full=full)
        created += result == "created"
        updated += result == "updated"
        print(f"  - node_type:{label}: {result}")

    print("\nField descriptors:")
    for label, field, short, full in FIELD_DESCRIPTORS:
        title = f"{label}.{field}"
        result = _upsert("field", target_label=label, target_field=field, title=title, short=short, full=full)
        created += result == "created"
        updated += result == "updated"
        print(f"  - field:{label}.{field}: {result}")

    print("\nField-value descriptors:")
    for field, vocab in FIELD_VALUE_VOCABS:
        for value, label in vocab.items():
            result = _upsert(
                "field_value", target_field=field, target_value=value,
                title=label, short=label, full=label,
            )
            created += result == "created"
            updated += result == "updated"
        print(f"  - field_value:{field}.*  ({len(vocab)} values)")

    print(f"\nDone. Created: {created}, Updated: {updated}")


if __name__ == "__main__":
    set_connection()
    print("=" * 60)
    print("Seed Ontology Descriptors (UniversalDescriptor)")
    print("=" * 60 + "\n")
    seed_descriptors()
