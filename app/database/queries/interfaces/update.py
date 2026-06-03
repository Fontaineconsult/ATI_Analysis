#
# INTERFACE UPDATE QUERIES
#
from app.database.graph_schema import *
from app.data_config import interface_provenances
from app.data_config import coverage_domains as COVERAGE_DOMAINS
from app.database.class_factory import implementation_classes
from app.database.queries.interfaces.create import normalize_audience, normalize_interface_kind
from app.endpoints.data_api.errors.custom_exceptions import (
    CrudError,
    NotFoundError,
    ValidationError,
)


# Implementation type -> the Interface reverse-accessor that writes a
# (implementation)-[:remediates_interface]->(interface) edge. Only these four
# implementation kinds remediate an interface (they carry remediates_interface);
# Guidance / Tracking / InternalPolicy / TAAP do not.
_REMEDIATION_ACCESSOR_BY_TYPE = {
    "Process":   "remediated_by_processes",
    "Project":   "remediated_by_projects",
    "Procedure": "remediated_by_procedures",
    "Service":   "remediated_by_services",
}


def _resolve_implementation(implementation_type: str, implementation_unique_id: str):
    """
    Resolve a remediating implementation by (type, unique_id). Mirrors the resolver in
    queries/implementation/update.py. Raises ValidationError on a non-remediating type,
    NotFoundError if the node is missing.
    """
    if implementation_type not in _REMEDIATION_ACCESSOR_BY_TYPE:
        raise ValidationError(
            f"implementation_type must be one of {list(_REMEDIATION_ACCESSOR_BY_TYPE.keys())}; "
            f"got {implementation_type!r}"
        )
    cls = implementation_classes[implementation_type]
    try:
        return cls.nodes.get(unique_id=implementation_unique_id)
    except cls.DoesNotExist:
        raise NotFoundError(f"{implementation_type} {implementation_unique_id!r} not found")


def _resolve_interface(interface_identifier: str):
    try:
        return Interface.nodes.get(interface_identifier=interface_identifier)
    except Interface.DoesNotExist:
        raise NotFoundError(f"Interface {interface_identifier!r} not found")


def _connect_rel(rel, target, *, what_for: str) -> bool:
    """Idempotently connect `target` via the bound relationship `rel`."""
    try:
        if not rel.is_connected(target):
            rel.connect(target)
        return True
    except Exception as e:
        raise CrudError(f"Failed to assign {what_for}: {e}")


def update_interface(interface_identifier: str, data: dict) -> dict:
    """
    Patch an Interface's descriptive fields. Only keys present in `data` are touched.

    Mutable: title, description, interface_kind, coverage_domains, audience, provenance.
    Immutable: interface_identifier — the stable composite business key (mirrors
    Asset.asset_identifier / YearSuccessEvidence.year_identifier). A new identity means
    delete + re-create; this method never rebuilds the identifier.

    `audience` is multi-valued; whatever list is supplied replaces the existing one
    (set semantics, not append). Raises NotFoundError if the interface is missing,
    ValidationError on a bad vocabulary value, CrudError on save failure.
    """
    interface = _resolve_interface(interface_identifier)

    if "coverage_domains" in data and data["coverage_domains"] is not None and data["coverage_domains"] not in COVERAGE_DOMAINS:
        raise ValidationError(
            f"coverage_domains must be one of {list(COVERAGE_DOMAINS.keys())}; got {data['coverage_domains']!r}"
        )
    if "provenance" in data and data["provenance"] is not None and data["provenance"] not in interface_provenances:
        raise ValidationError(
            f"provenance must be one of {list(interface_provenances.keys())}; got {data['provenance']!r}"
        )

    updates = dict(data)
    if "interface_kind" in updates:
        updates["interface_kind"] = normalize_interface_kind(updates["interface_kind"])
    if "audience" in updates:
        updates["audience"] = normalize_audience(updates["audience"])

    try:
        for field in ("title", "description", "interface_kind", "coverage_domains", "audience", "provenance"):
            if field in updates:
                setattr(interface, field, updates[field])
        interface.save()
        return interface.serialize()
    except Exception as e:
        raise CrudError(f"Failed to update Interface {interface_identifier!r}: {e}")


def assign_asset_to_interface(interface_identifier: str, asset_identifier: str) -> bool:
    """
    Connect a backing Asset to an Interface (presented_by). Idempotent.

    This is the Interface's one core structural edge: §508 stewardship is NOT stored
    on the interface — it is derived upward through `presented_by` to the asset's
    stewards. A standalone interface (no presented_by) is a valid state.

    Raises NotFoundError if the interface or asset is missing, CrudError on failure.
    """
    interface = _resolve_interface(interface_identifier)
    try:
        asset = Asset.nodes.get(asset_identifier=asset_identifier)
    except Asset.DoesNotExist:
        raise NotFoundError(f"Asset {asset_identifier!r} not found")
    return _connect_rel(interface.presented_by, asset, what_for="backing asset")


def assign_remediation_to_interface(interface_identifier: str, implementation_type: str, implementation_unique_id: str) -> bool:
    """
    Connect a remediating Implementation (Process/Project/Procedure/Service) to an
    Interface. Idempotent. This is the specific-coverage edge: it creates
    (implementation)-[:remediates_interface]->(interface) — written from the Interface
    side via the reverse accessor, which neomodel directs correctly.

    An interface with at least one remediation is no longer `uncovered`.

    Raises ValidationError on a non-remediating type, NotFoundError if the interface or
    implementation is missing, CrudError on failure.
    """
    interface = _resolve_interface(interface_identifier)
    impl = _resolve_implementation(implementation_type, implementation_unique_id)
    accessor = getattr(interface, _REMEDIATION_ACCESSOR_BY_TYPE[implementation_type])
    return _connect_rel(accessor, impl, what_for=f"{implementation_type} remediation")
