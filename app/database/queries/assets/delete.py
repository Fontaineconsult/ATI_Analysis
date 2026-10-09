#
# ASSET / TAAP DELETE QUERIES
#
from app.database.graph_schema import *
from app.endpoints.data_api.errors.custom_exceptions import CrudError, NotFoundError, ValidationError

# Reuse the dispatch map + resolvers so assign/unassign stay symmetric (mirrors
# evidence/delete.py importing SUB_NODE_MAP from evidence/create.py).
from app.database.queries.assets.update import (
    _resolve_asset,
    _resolve_document,
    _resolve_holder,
    _resolve_org_unit,
    _resolve_person,
    _resolve_taap,
    _resolve_webpage,
    _resolve_yse,
    _steward_accessor,
)


def _disconnect_rel(rel, target, *, what_for: str) -> bool:
    """Idempotent inverse of update._connect_rel."""
    try:
        if rel.is_connected(target):
            rel.disconnect(target)
        return True
    except Exception as e:
        raise CrudError(f"Failed to unassign {what_for}: {e}")


def delete_asset(asset_identifier: str) -> bool:
    """
    Delete an Asset node. The asset is the owned unit here, so this is a true
    delete (unlike the shared status-level sub-nodes, which are only disconnected).

    neomodel detaches all relationships on delete: any covering TAAP / remediating
    implementation / stewardship edges are removed, but those neighbor nodes
    themselves are left intact.

    Raises NotFoundError if the asset is missing, CrudError on failure.
    """
    asset = _resolve_asset(asset_identifier)
    try:
        asset.delete()
        return True
    except Exception as e:
        raise CrudError(f"Failed to delete Asset {asset_identifier!r}: {e}")


def unassign_steward_from_asset(asset_identifier: str, capacity: str, holder_type: str, holder_unique_id: str) -> bool:
    """Disconnect a §508 steward from an Asset. Idempotent. Inverse of assign_steward_to_asset."""
    asset = _resolve_asset(asset_identifier)
    rel = _steward_accessor(asset, capacity, holder_type)
    holder = _resolve_holder(holder_type, holder_unique_id)
    return _disconnect_rel(rel, holder, what_for=f"{capacity} steward")


def unassign_vendor_from_asset(asset_identifier: str, vendor_name: str) -> bool:
    """Disconnect a Vendor from an Asset's supplied_by. Idempotent."""
    asset = _resolve_asset(asset_identifier)
    try:
        vendor = Vendor.nodes.get(name=vendor_name)
    except Vendor.DoesNotExist:
        raise NotFoundError(f"Vendor {vendor_name!r} not found")
    return _disconnect_rel(asset.supplied_by, vendor, what_for="vendor")


def unassign_asset_from_campus(asset_identifier: str, campus_abbrev: str) -> bool:
    """Disconnect an Asset's campus anchor (at_campus). Idempotent."""
    asset = _resolve_asset(asset_identifier)
    try:
        campus = Campus.nodes.get(abbreviation=campus_abbrev)
    except Campus.DoesNotExist:
        raise NotFoundError(f"Campus {campus_abbrev!r} not found")
    return _disconnect_rel(asset.at_campus, campus, what_for="campus anchor")


#
# TAAP deletes
#

def delete_taap(key: str) -> bool:
    """
    Delete a TAAP node (true delete). Relationships to the covered Asset, campus,
    year, units, people, references, signed copy, and YSE are detached; those
    neighbor nodes remain. A plan that supersedes this one keeps existing with
    its `supersedes` edge gone.

    Raises NotFoundError if missing, CrudError on failure.
    """
    taap = _resolve_taap(key)
    identifier = taap.taap_identifier
    try:
        taap.delete()
        return True
    except Exception as e:
        raise CrudError(f"Failed to delete TAAP {identifier!r}: {e}")


def unassign_owner_from_taap(key: str, person_unique_id: str) -> bool:
    """Disconnect the TAAP owner (owned_by). Idempotent."""
    taap = _resolve_taap(key)
    person = _resolve_person(person_unique_id)
    return _disconnect_rel(taap.owned_by, person, what_for="TAAP owner")


def unassign_preparer_from_taap(key: str, person_unique_id: str) -> bool:
    """Disconnect the TAAP preparer (prepared_by). Idempotent."""
    taap = _resolve_taap(key)
    person = _resolve_person(person_unique_id)
    return _disconnect_rel(taap.prepared_by, person, what_for="TAAP preparer")


def unassign_signer_from_taap(key: str, person_unique_id: str) -> bool:
    """Disconnect a TAAP signer (signed_by). Idempotent."""
    taap = _resolve_taap(key)
    person = _resolve_person(person_unique_id)
    return _disconnect_rel(taap.signed_by, person, what_for="TAAP signer")


def unassign_unit_from_taap(key: str, capacity: str, unit_unique_id: str) -> bool:
    """Disconnect an OrgUnit from a TAAP (requested_by | alternative_provided_by). Idempotent."""
    if capacity not in ("requested_by", "alternative_provided_by"):
        raise ValidationError(
            f"capacity must be 'requested_by' or 'alternative_provided_by'; got {capacity!r}"
        )
    taap = _resolve_taap(key)
    unit = _resolve_org_unit(unit_unique_id)
    return _disconnect_rel(getattr(taap, capacity), unit, what_for=f"TAAP {capacity}")


def remove_reference_from_taap(key: str, target_type: str, target_unique_id: str) -> bool:
    """Disconnect a referenced Document or Webpage from a TAAP (references). Idempotent."""
    taap = _resolve_taap(key)
    if target_type == "document":
        rel, target = taap.references_documents, _resolve_document(target_unique_id)
    elif target_type == "webpage":
        rel, target = taap.references_webpages, _resolve_webpage(target_unique_id)
    else:
        raise ValidationError(f"target_type must be 'document' or 'webpage'; got {target_type!r}")
    return _disconnect_rel(rel, target, what_for="TAAP reference")


def detach_signed_copy_from_taap(key: str) -> bool:
    """Drop the TAAP's signed_copy edge. The Document itself remains. Idempotent."""
    taap = _resolve_taap(key)
    try:
        current = taap.signed_copy.single()
        if current is not None:
            taap.signed_copy.disconnect(current)
        return True
    except Exception as e:
        raise CrudError(f"Failed to detach signed copy: {e}")


def clear_taap_supersedes(key: str) -> bool:
    """
    Drop the TAAP's supersedes edge. The previous plan's taap_status and active
    flag are left as they are; a curator who undoes a renewal decides those.
    """
    taap = _resolve_taap(key)
    try:
        current = taap.supersedes.single()
        if current is not None:
            taap.supersedes.disconnect(current)
        return True
    except Exception as e:
        raise CrudError(f"Failed to clear supersedes: {e}")


def disconnect_taap_from_yse(key: str, yse_identifier: str) -> bool:
    """Disconnect a TAAP from a YearSuccessEvidence (is_evidence_for). Idempotent."""
    taap = _resolve_taap(key)
    yse = _resolve_yse(yse_identifier)
    return _disconnect_rel(taap.is_evidence_for, yse, what_for="TAAP evidence")
