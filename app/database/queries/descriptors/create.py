#
# DESCRIPTOR CREATE QUERIES
#
# UniversalDescriptor holds human-readable descriptions of the ontology (node types,
# fields, and field/vocabulary values). Descriptors are NOT edge-connected to instance
# data — they are retrieved by their `descriptor_handle` (or keyword-searched on
# `search_text`) and merged onto results in the app layer. This is the only sanctioned
# creation path: it builds the deterministic handle, validates the kind/target, guards
# the unique index, and populates `search_text`.
#
from datetime import date

from app.database.graph_schema import *
from app.data_config import descriptor_kinds
from app.database.identifiers import (
    make_node_type_handle,
    make_field_handle,
    make_field_value_handle,
)
from app.endpoints.data_api.errors.custom_exceptions import (
    CrudError,
    NotFoundError,
    ValidationError,
)


def _clean(value):
    """Trim a string input to None if blank; pass non-strings through."""
    if value is None:
        return None
    if isinstance(value, str):
        value = value.strip()
        return value or None
    return value


def build_descriptor_handle(descriptor_kind, target_label=None, target_field=None, target_value=None):
    """
    Build the deterministic descriptor_handle for a (kind, target) tuple, validating that
    the target coordinates required by that kind are present.

        node_type   -> needs target_label              -> 'node_type:<Label>'
        field       -> needs target_label + target_field -> 'field:<Label>.<field>'
        field_value -> needs target_field + target_value -> 'field_value:<field>.<value>'

    Raises ValidationError on an unknown kind or a missing required coordinate.
    """
    if descriptor_kind == "node_type":
        if not target_label:
            raise ValidationError("node_type descriptors require target_label")
        return make_node_type_handle(target_label)
    if descriptor_kind == "field":
        if not (target_label and target_field):
            raise ValidationError("field descriptors require target_label and target_field")
        return make_field_handle(target_label, target_field)
    if descriptor_kind == "field_value":
        if not (target_field and target_value):
            raise ValidationError("field_value descriptors require target_field and target_value")
        return make_field_value_handle(target_field, target_value)
    raise ValidationError(
        f"descriptor_kind must be one of {list(descriptor_kinds.keys())}; got {descriptor_kind!r}"
    )


def compose_search_text(title=None, description_short=None, description_full=None,
                        target_label=None, target_field=None, target_value=None):
    """
    Lowercase, space-joined concatenation of the human-readable parts of a descriptor, for
    CONTAINS / full-text keyword search. Kept in one place so create and update populate
    `search_text` identically.
    """
    parts = [title, description_short, description_full, target_label, target_field, target_value]
    return " ".join(p.strip().lower() for p in parts if p and isinstance(p, str) and p.strip())


def create_descriptor(
    descriptor_kind: str,
    target_label: str = None,
    target_field: str = None,
    target_value: str = None,
    title: str = None,
    description_short: str = None,
    description_full: str = None,
    include_in_report: bool = False,
) -> UniversalDescriptor:
    """
    Create a UniversalDescriptor.

    Identity is the `descriptor_handle`, built deterministically from (descriptor_kind,
    target_*) by the identifiers.py helpers — so two authors describing the same element
    produce the same handle, and the unique index catches duplicates.

    Parameters
    ----------
    descriptor_kind : str (required) — one of `descriptor_kinds` (node_type|field|field_value).
    target_label / target_field / target_value : str — the target coordinates; which are
        required depends on the kind (see build_descriptor_handle).
    title : str, optional — short human label.
    description_short : str, optional — concise default UI text.
    description_full : str, optional — long-form rationale.
    include_in_report : bool — report-inclusion flag (default False).

    Raises
    ------
    ValidationError on a bad kind, missing target coordinate, or duplicate handle.
    CrudError on save failure.
    """
    if descriptor_kind not in descriptor_kinds:
        raise ValidationError(
            f"descriptor_kind must be one of {list(descriptor_kinds.keys())}; got {descriptor_kind!r}"
        )

    target_label = _clean(target_label)
    target_field = _clean(target_field)
    target_value = _clean(target_value)
    title = _clean(title)
    description_short = _clean(description_short)
    description_full = _clean(description_full)

    descriptor_handle = build_descriptor_handle(descriptor_kind, target_label, target_field, target_value)

    if UniversalDescriptor.nodes.filter(descriptor_handle=descriptor_handle):
        raise ValidationError(
            f"UniversalDescriptor with descriptor_handle {descriptor_handle!r} already exists"
        )

    search_text = compose_search_text(
        title, description_short, description_full, target_label, target_field, target_value
    )

    try:
        descriptor = UniversalDescriptor(
            descriptor_handle=descriptor_handle,
            descriptor_kind=descriptor_kind,
            target_label=target_label,
            target_field=target_field,
            target_value=target_value,
            title=title,
            description_short=description_short,
            description_full=description_full,
            search_text=search_text,
            include_in_report=bool(include_in_report),
            last_updated=date.today(),
        )
        descriptor.save()
        return descriptor
    except Exception as e:
        raise CrudError(f"Failed to create UniversalDescriptor {descriptor_handle!r}: {e}")
