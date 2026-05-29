#
# ASSET / TAAP DELETE QUERIES
#
from app.database.graph_schema import *
from app.endpoints.data_api.errors.custom_exceptions import CrudError, NotFoundError

# Reuse the dispatch map + resolvers so assign/unassign stay symmetric (mirrors
# evidence/delete.py importing SUB_NODE_MAP from evidence/create.py).
from app.database.queries.assets.update import (
    _resolve_asset,
    _resolve_holder,
    _resolve_person,
    _resolve_taap,
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

def delete_taap(title: str) -> bool:
    """
    Delete a TAAP node (true delete). Relationships to the covered Asset, owner,
    signers, and YSE are detached; those neighbor nodes remain.

    Raises NotFoundError if missing, CrudError on failure.
    """
    taap = _resolve_taap(title)
    try:
        taap.delete()
        return True
    except Exception as e:
        raise CrudError(f"Failed to delete TAAP {title!r}: {e}")


def unassign_owner_from_taap(title: str, person_unique_id: str) -> bool:
    """Disconnect the TAAP owner (owned_by). Idempotent."""
    taap = _resolve_taap(title)
    person = _resolve_person(person_unique_id)
    return _disconnect_rel(taap.owned_by, person, what_for="TAAP owner")


def unassign_signer_from_taap(title: str, person_unique_id: str) -> bool:
    """Disconnect a TAAP signer (signed_by). Idempotent."""
    taap = _resolve_taap(title)
    person = _resolve_person(person_unique_id)
    return _disconnect_rel(taap.signed_by, person, what_for="TAAP signer")


def disconnect_taap_from_yse(title: str, yse_identifier: str) -> bool:
    """Disconnect a TAAP from a YearSuccessEvidence (is_evidence_for). Idempotent."""
    taap = _resolve_taap(title)
    try:
        yse = YearSuccessEvidence.nodes.get(year_identifier=yse_identifier)
    except YearSuccessEvidence.DoesNotExist:
        raise NotFoundError(f"YearSuccessEvidence {yse_identifier!r} not found")
    return _disconnect_rel(taap.is_evidence_for, yse, what_for="TAAP evidence")
