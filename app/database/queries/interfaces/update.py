#
# INTERFACE UPDATE QUERIES
#
from app.database.graph_schema import *
from app.data_config import interface_provenances, working_group_names
from app.database.class_factory import implementation_classes
from app.database.queries.interfaces.create import normalize_audience, normalize_coverage_domains
from app.endpoints.data_api.errors.custom_exceptions import (
    CrudError,
    NotFoundError,
    ValidationError,
)


# The four identity coordinates of an interface (backing is `presented_by`). All are
# baked into interface_identifier, so they are immutable — changing one is a different
# interface (delete + re-create), mirroring Asset.asset_identifier.
_INTERFACE_IDENTITY_FIELDS = ("title", "locus", "function", "presented_by")


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

    Mutable: description, coverage_domains, audience, provenance.
    Immutable: the four identity coordinates (title, locus, function, backing/presented_by)
    and interface_identifier itself — all baked into the composite business key. Changing
    identity means delete + re-create; passing an identity field here is a ValidationError.

    `coverage_domains` and `audience` are multi-valued; whatever list is supplied replaces
    the existing one (set semantics, not append). Raises NotFoundError if the interface is
    missing, ValidationError on an identity-field change or a bad vocabulary value, CrudError
    on save failure.
    """
    interface = _resolve_interface(interface_identifier)

    attempted_identity = [f for f in _INTERFACE_IDENTITY_FIELDS if f in data]
    if attempted_identity:
        raise ValidationError(
            f"Identity fields {attempted_identity} are immutable; delete + re-create to change them"
        )

    if "provenance" in data and data["provenance"] is not None and data["provenance"] not in interface_provenances:
        raise ValidationError(
            f"provenance must be one of {list(interface_provenances.keys())}; got {data['provenance']!r}"
        )

    updates = dict(data)
    if "coverage_domains" in updates:
        updates["coverage_domains"] = normalize_coverage_domains(updates["coverage_domains"])
    if "audience" in updates:
        updates["audience"] = normalize_audience(updates["audience"])

    try:
        for field in ("description", "coverage_domains", "audience", "provenance"):
            if field in updates:
                setattr(interface, field, updates[field])
        interface.save()
        return interface.serialize()
    except Exception as e:
        raise CrudError(f"Failed to update Interface {interface_identifier!r}: {e}")


def _resolve_working_group(name_or_abbrev: str):
    """
    Resolve an ATIWorkingGroup by full name ('Web') or abbreviation ('web'/'pro'/'ins').
    Mirrors the lookup in queries/committees/create.py. Raises ValidationError on an
    unknown key, NotFoundError if the node is missing.
    """
    name = working_group_names.get(name_or_abbrev, name_or_abbrev)
    try:
        return ATIWorkingGroup.nodes.get(name=name)
    except ATIWorkingGroup.DoesNotExist:
        raise NotFoundError(f"ATIWorkingGroup {name!r} not found")


def assign_working_group_to_interface(interface_identifier: str, working_group: str) -> bool:
    """
    Connect an accountable ATIWorkingGroup to an Interface (accountable_working_group).
    Idempotent. Multi-valued: an interface can have several accountable groups. This is
    accountability, NOT identity. Raises NotFoundError if the interface or group is
    missing, ValidationError on an unknown group key, CrudError on failure.
    """
    interface = _resolve_interface(interface_identifier)
    wg = _resolve_working_group(working_group)
    return _connect_rel(interface.accountable_working_groups, wg, what_for="accountable working group")


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
