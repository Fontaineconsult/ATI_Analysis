#
# ASSET / TAAP UPDATE QUERIES
#
from app.database.graph_schema import *
from app.data_config import asset_classes, asset_scopes, taap_outcomes
from app.database.queries.assets.create import _coerce_date
from app.endpoints.data_api.errors.custom_exceptions import (
    CrudError,
    NotFoundError,
    ValidationError,
)


# Stewardship capacity -> (Person accessor, OrgUnit accessor). Each §508 capacity
# can be held by either a Person or an OrgUnit; the holder_type picks which side.
# Keys match the stewardship keys produced by queries/assets/read.py.
STEWARDSHIP_CAPACITIES = {
    "procured_by":   ("procured_by", "procured_by_unit"),
    "developed_by":  ("developed_by", "developed_by_unit"),
    "maintained_by": ("maintained_by", "maintained_by_unit"),
    "used_by":       ("used_by", "used_by_unit"),
}

# holder_type -> (neomodel class, index into the STEWARDSHIP_CAPACITIES tuple).
HOLDER_TYPES = {
    "person":   (Person, 0),
    "org_unit": (OrgUnit, 1),
}


def _resolve_asset(asset_identifier: str):
    try:
        return Asset.nodes.get(asset_identifier=asset_identifier)
    except Asset.DoesNotExist:
        raise NotFoundError(f"Asset {asset_identifier!r} not found")


def _steward_accessor(asset, capacity: str, holder_type: str):
    """
    Validate capacity + holder_type and return the bound neomodel relationship
    accessor for that (capacity, holder_type) on `asset`.
    """
    if capacity not in STEWARDSHIP_CAPACITIES:
        raise ValidationError(
            f"capacity must be one of {list(STEWARDSHIP_CAPACITIES.keys())}; got {capacity!r}"
        )
    if holder_type not in HOLDER_TYPES:
        raise ValidationError(
            f"holder_type must be one of {list(HOLDER_TYPES.keys())}; got {holder_type!r}"
        )
    _, idx = HOLDER_TYPES[holder_type]
    return getattr(asset, STEWARDSHIP_CAPACITIES[capacity][idx])


def _resolve_holder(holder_type: str, holder_unique_id: str):
    cls, _ = HOLDER_TYPES[holder_type]
    try:
        return cls.nodes.get(unique_id=holder_unique_id)
    except cls.DoesNotExist:
        raise NotFoundError(f"{cls.__name__} {holder_unique_id!r} not found")


def _connect_rel(rel, target, *, what_for: str) -> bool:
    """Idempotently connect `target` via the bound relationship `rel`."""
    try:
        if not rel.is_connected(target):
            rel.connect(target)
        return True
    except Exception as e:
        raise CrudError(f"Failed to assign {what_for}: {e}")


def update_asset(asset_identifier: str, data: dict) -> dict:
    """
    Patch an Asset's descriptive fields. Only keys present in `data` are touched.

    Mutable: title, version, description, asset_class, scope.
    Immutable: asset_identifier — it's the stable composite business key (mirrors
    YearSuccessEvidence.year_identifier / CampusPlan.plan_identifier). A new
    identity means delete + re-create. Changing `scope` here updates the property
    but does NOT rebuild the identifier.

    Raises NotFoundError if the asset is missing, ValidationError on a bad
    asset_class/scope, CrudError on save failure.
    """
    asset = _resolve_asset(asset_identifier)

    if "asset_class" in data and data["asset_class"] is not None and data["asset_class"] not in asset_classes:
        raise ValidationError(
            f"asset_class must be one of {list(asset_classes.keys())}; got {data['asset_class']!r}"
        )
    if "scope" in data and data["scope"] is not None and data["scope"] not in asset_scopes:
        raise ValidationError(
            f"scope must be one of {list(asset_scopes.keys())}; got {data['scope']!r}"
        )

    try:
        for field in ("title", "version", "description", "asset_class", "scope"):
            if field in data:
                setattr(asset, field, data[field])
        asset.save()
        return asset.serialize()
    except Exception as e:
        raise CrudError(f"Failed to update Asset {asset_identifier!r}: {e}")


def assign_steward_to_asset(asset_identifier: str, capacity: str, holder_type: str, holder_unique_id: str) -> bool:
    """
    Connect a §508 steward to an Asset. Idempotent.

    capacity    : one of STEWARDSHIP_CAPACITIES (procured_by / developed_by /
                  maintained_by / used_by).
    holder_type : 'person' or 'org_unit'.
    holder_unique_id : unique_id of the Person / OrgUnit.

    Raises ValidationError on a bad capacity/holder_type, NotFoundError if the
    asset or holder is missing, CrudError on failure.
    """
    asset = _resolve_asset(asset_identifier)
    rel = _steward_accessor(asset, capacity, holder_type)
    holder = _resolve_holder(holder_type, holder_unique_id)
    return _connect_rel(rel, holder, what_for=f"{capacity} steward")


def assign_vendor_to_asset(asset_identifier: str, vendor_name: str) -> bool:
    """Connect a Vendor as the asset's supplier (supplied_by). Idempotent."""
    asset = _resolve_asset(asset_identifier)
    try:
        vendor = Vendor.nodes.get(name=vendor_name)
    except Vendor.DoesNotExist:
        raise NotFoundError(f"Vendor {vendor_name!r} not found")
    return _connect_rel(asset.supplied_by, vendor, what_for="vendor")


def assign_asset_to_campus(asset_identifier: str, campus_abbrev: str) -> bool:
    """Anchor an Asset to a Campus (at_campus). Idempotent."""
    asset = _resolve_asset(asset_identifier)
    try:
        campus = Campus.nodes.get(abbreviation=campus_abbrev)
    except Campus.DoesNotExist:
        raise NotFoundError(f"Campus {campus_abbrev!r} not found")
    return _connect_rel(asset.at_campus, campus, what_for="campus anchor")


#
# TAAP updates
#

def _resolve_taap(title: str):
    try:
        return TAAP.nodes.get(title=title)
    except TAAP.DoesNotExist:
        raise NotFoundError(f"TAAP {title!r} not found")


def _resolve_person(person_unique_id: str):
    try:
        return Person.nodes.get(unique_id=person_unique_id)
    except Person.DoesNotExist:
        raise NotFoundError(f"Person {person_unique_id!r} not found")


def update_taap(title: str, data: dict) -> dict:
    """
    Patch a TAAP's fields. Only keys present in `data` are touched.

    Mutable: description, outcome, effective_date, review_due, active.
    Immutable: title — the unique business key (delete + re-create for a new one).

    Raises NotFoundError if missing, ValidationError on a bad outcome/date,
    CrudError on save failure.
    """
    taap = _resolve_taap(title)

    if "outcome" in data and data["outcome"] is not None and data["outcome"] not in taap_outcomes:
        raise ValidationError(
            f"outcome must be one of {list(taap_outcomes.keys())}; got {data['outcome']!r}"
        )

    updates = dict(data)
    if "effective_date" in updates:
        updates["effective_date"] = _coerce_date(updates["effective_date"], field_name="effective_date")
    if "review_due" in updates:
        updates["review_due"] = _coerce_date(updates["review_due"], field_name="review_due")

    try:
        for field in ("description", "outcome", "effective_date", "review_due", "active"):
            if field in updates:
                setattr(taap, field, updates[field])
        taap.save()
        return taap.serialize()
    except Exception as e:
        raise CrudError(f"Failed to update TAAP {title!r}: {e}")


def assign_owner_to_taap(title: str, person_unique_id: str) -> bool:
    """Connect a Person as the TAAP's owner (owned_by). Idempotent."""
    taap = _resolve_taap(title)
    person = _resolve_person(person_unique_id)
    return _connect_rel(taap.owned_by, person, what_for="TAAP owner")


def assign_signer_to_taap(title: str, person_unique_id: str) -> bool:
    """Connect a Person as a TAAP signer (signed_by). Idempotent."""
    taap = _resolve_taap(title)
    person = _resolve_person(person_unique_id)
    return _connect_rel(taap.signed_by, person, what_for="TAAP signer")


def connect_taap_to_yse(title: str, yse_identifier: str) -> bool:
    """
    Connect a TAAP to a YearSuccessEvidence as evidence (is_evidence_for) — a TAAP
    is itself evidence, so this mirrors how implementation nodes feed YSE.
    Idempotent.
    """
    taap = _resolve_taap(title)
    try:
        yse = YearSuccessEvidence.nodes.get(year_identifier=yse_identifier)
    except YearSuccessEvidence.DoesNotExist:
        raise NotFoundError(f"YearSuccessEvidence {yse_identifier!r} not found")
    return _connect_rel(taap.is_evidence_for, yse, what_for="TAAP evidence")
