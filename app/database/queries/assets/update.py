#
# ASSET / TAAP UPDATE QUERIES
#
from app.database.graph_schema import *
from app.data_config import (
    asset_classes,
    asset_scopes,
    evidence_control_choices,
    evidence_strength_levels,
    taap_reference_kinds,
    taap_signer_roles,
)
from app.database.queries.assets.create import (
    TAAP_ARRAY_FIELDS,
    TAAP_CHOICE_FIELDS,
    TAAP_DATE_FIELDS,
    TAAP_TEXT_FIELDS,
    _coerce_date,
    _validate_choice,
    _validate_keys,
)
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


def _connect_rel(rel, target, *, what_for: str, properties: dict = None) -> bool:
    """
    Idempotently connect `target` via the bound relationship `rel`. When the edge
    already exists and `properties` are given, the edge's properties are updated
    in place, so re-asserting a signer with a new signed_date is one call.
    """
    try:
        if rel.is_connected(target):
            if properties:
                edge = rel.relationship(target)
                for key, value in properties.items():
                    setattr(edge, key, value)
                edge.save()
        else:
            rel.connect(target, properties or {})
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

def _resolve_taap(key: str):
    """
    Resolve a TAAP by its `taap_identifier`, falling back to a title that matches
    exactly one plan. The fallback keeps title-keyed callers (the assets explorer)
    working; a title shared by several plans is a 400 that names the identifiers.
    """
    if not key or not str(key).strip():
        raise ValidationError("taap_identifier is required")
    taap = TAAP.nodes.first_or_none(taap_identifier=key)
    if taap is not None:
        return taap
    matches = TAAP.nodes.filter(title=key).all()
    if len(matches) == 1:
        return matches[0]
    if len(matches) > 1:
        ids = sorted(t.taap_identifier for t in matches)
        raise ValidationError(f"Title {key!r} matches several TAAPs; use taap_identifier: {ids}")
    raise NotFoundError(f"TAAP {key!r} not found")


def _resolve_person(person_unique_id: str):
    try:
        return Person.nodes.get(unique_id=person_unique_id)
    except Person.DoesNotExist:
        raise NotFoundError(f"Person {person_unique_id!r} not found")


def _resolve_org_unit(unit_unique_id: str):
    try:
        return OrgUnit.nodes.get(unique_id=unit_unique_id)
    except OrgUnit.DoesNotExist:
        raise NotFoundError(f"OrgUnit {unit_unique_id!r} not found")


def _resolve_document(document_unique_id: str):
    try:
        return Document.nodes.get(unique_id=document_unique_id)
    except Document.DoesNotExist:
        raise NotFoundError(f"Document {document_unique_id!r} not found")


def _resolve_webpage(webpage_unique_id: str):
    try:
        return Webpage.nodes.get(unique_id=webpage_unique_id)
    except Webpage.DoesNotExist:
        raise NotFoundError(f"Webpage {webpage_unique_id!r} not found")


def _resolve_yse(yse_identifier: str):
    try:
        return YearSuccessEvidence.nodes.get(year_identifier=yse_identifier)
    except YearSuccessEvidence.DoesNotExist:
        raise NotFoundError(f"YearSuccessEvidence {yse_identifier!r} not found")


def update_taap(key: str, data: dict) -> dict:
    """
    Patch a TAAP's fields. Only keys present in `data` are touched.

    Mutable: title, active, every TAAP_TEXT_FIELDS, TAAP_DATE_FIELDS,
    TAAP_CHOICE_FIELDS and TAAP_ARRAY_FIELDS entry (see queries/assets/create.py).
    Immutable: taap_identifier — the composite business key. The covered asset,
    campus and requesting unit are part of that identity, so they do not change
    here either; a plan for a different unit is a new plan.

    Raises NotFoundError if missing, ValidationError on a bad choice/key/date,
    CrudError on save failure.
    """
    taap = _resolve_taap(key)

    updates = {}
    if "title" in data:
        if not data["title"] or not str(data["title"]).strip():
            raise ValidationError("title cannot be blank")
        updates["title"] = str(data["title"]).strip()
    if "active" in data:
        updates["active"] = bool(data["active"])
    for field in TAAP_TEXT_FIELDS:
        if field in data:
            updates[field] = data[field]
    for field in TAAP_DATE_FIELDS:
        if field in data:
            updates[field] = _coerce_date(data[field], field_name=field)
    for field, vocab in TAAP_CHOICE_FIELDS.items():
        if field in data:
            updates[field] = _validate_choice(data[field], vocab, field_name=field)
    for field, vocab in TAAP_ARRAY_FIELDS.items():
        if field in data:
            updates[field] = _validate_keys(data[field], vocab, field_name=field)

    try:
        for field, value in updates.items():
            setattr(taap, field, value)
        taap.save()
        return taap.serialize()
    except Exception as e:
        raise CrudError(f"Failed to update TAAP {taap.taap_identifier!r}: {e}")


def assign_owner_to_taap(key: str, person_unique_id: str) -> bool:
    """Connect a Person as the TAAP's accountable owner (owned_by). Idempotent."""
    taap = _resolve_taap(key)
    person = _resolve_person(person_unique_id)
    return _connect_rel(taap.owned_by, person, what_for="TAAP owner")


def assign_preparer_to_taap(key: str, person_unique_id: str) -> bool:
    """Connect the ATI reviewer who wrote the plan (prepared_by). Idempotent."""
    taap = _resolve_taap(key)
    person = _resolve_person(person_unique_id)
    return _connect_rel(taap.prepared_by, person, what_for="TAAP preparer")


def assign_signer_to_taap(key: str, person_unique_id: str, role: str = None, signed_date=None) -> bool:
    """
    Connect a Person as a TAAP signer (signed_by), recording the role they sign in
    and the signature date. Re-asserting an existing signer updates those two
    edge properties, so a pending signature can be dated once it lands. Idempotent.

    role        : one of data_config.taap_signer_roles, optional.
    signed_date : date | 'YYYY-MM-DD', optional.
    """
    taap = _resolve_taap(key)
    person = _resolve_person(person_unique_id)
    _validate_choice(role, taap_signer_roles, field_name="role")
    signed_date = _coerce_date(signed_date, field_name="signed_date")
    properties = {}
    if role is not None:
        properties["role"] = role
    if signed_date is not None:
        properties["signed_date"] = signed_date
    return _connect_rel(taap.signed_by, person, what_for="TAAP signer", properties=properties)


def assign_unit_to_taap(key: str, capacity: str, unit_unique_id: str) -> bool:
    """
    Connect an OrgUnit to a TAAP in one of two capacities. Idempotent.

    capacity : 'requested_by' (the unit whose purchase the plan covers) or
               'alternative_provided_by' (the unit the proposed alternative names
               as delivering it).
    """
    if capacity not in ("requested_by", "alternative_provided_by"):
        raise ValidationError(
            f"capacity must be 'requested_by' or 'alternative_provided_by'; got {capacity!r}"
        )
    taap = _resolve_taap(key)
    unit = _resolve_org_unit(unit_unique_id)
    return _connect_rel(getattr(taap, capacity), unit, what_for=f"TAAP {capacity}")


def add_reference_to_taap(key: str, kind: str, target_type: str, target_unique_id: str, note: str = None) -> bool:
    """
    Fill one of the form's "Referenced Documentation" slots: connect a Document or
    Webpage via `references` carrying `kind`. Re-asserting updates kind/note.

    kind        : one of data_config.taap_reference_kinds.
    target_type : 'document' or 'webpage'.
    """
    if kind not in taap_reference_kinds:
        raise ValidationError(
            f"kind must be one of {list(taap_reference_kinds.keys())}; got {kind!r}"
        )
    taap = _resolve_taap(key)
    if target_type == "document":
        rel, target = taap.references_documents, _resolve_document(target_unique_id)
    elif target_type == "webpage":
        rel, target = taap.references_webpages, _resolve_webpage(target_unique_id)
    else:
        raise ValidationError(f"target_type must be 'document' or 'webpage'; got {target_type!r}")
    properties = {"kind": kind}
    if note is not None:
        properties["note"] = note
    return _connect_rel(rel, target, what_for=f"TAAP {kind} reference", properties=properties)


def attach_signed_copy_to_taap(key: str, document_unique_id: str) -> bool:
    """
    Point the TAAP at the Document holding its signed form (signed_copy, at most
    one). Replacing an existing signed copy disconnects the old one first.
    """
    taap = _resolve_taap(key)
    document = _resolve_document(document_unique_id)
    try:
        current = taap.signed_copy.single()
        if current is not None and current.unique_id != document.unique_id:
            taap.signed_copy.disconnect(current)
        if not taap.signed_copy.is_connected(document):
            taap.signed_copy.connect(document)
        return True
    except Exception as e:
        raise CrudError(f"Failed to attach signed copy: {e}")


def set_taap_supersedes(key: str, previous_key: str) -> bool:
    """
    Record that this plan is the annual renewal of `previous_key` (supersedes, at
    most one). The previous plan's taap_status moves to 'renewed' and it goes
    inactive, which is the lifecycle the form's "Next Review" section describes.
    """
    taap = _resolve_taap(key)
    previous = _resolve_taap(previous_key)
    if previous.taap_identifier == taap.taap_identifier:
        raise ValidationError("a TAAP cannot supersede itself")
    try:
        current = taap.supersedes.single()
        if current is not None and current.taap_identifier != previous.taap_identifier:
            taap.supersedes.disconnect(current)
        if not taap.supersedes.is_connected(previous):
            taap.supersedes.connect(previous)
        previous.taap_status = "renewed"
        previous.active = False
        previous.save()
        return True
    except Exception as e:
        raise CrudError(f"Failed to set supersedes: {e}")


def connect_taap_to_yse(key: str, yse_identifier: str, strength=None, control: str = None) -> bool:
    """
    Connect a TAAP to a YearSuccessEvidence as evidence (is_evidence_for). A TAAP
    is itself evidence, so this mirrors how implementation nodes feed YSE, with
    the same strength (0-3) and control ('internal' | 'external') qualifiers.
    Re-asserting updates those qualifiers. Idempotent.
    """
    taap = _resolve_taap(key)
    yse = _resolve_yse(yse_identifier)
    properties = {}
    if strength is not None:
        try:
            strength = int(strength)
        except (TypeError, ValueError):
            raise ValidationError(f"strength must be an integer 0-3; got {strength!r}")
        if strength not in evidence_strength_levels:
            raise ValidationError(
                f"strength must be one of {sorted(evidence_strength_levels.keys())}; got {strength!r}"
            )
        properties["strength"] = strength
    if control is not None:
        if control not in evidence_control_choices:
            raise ValidationError(
                f"control must be one of {list(evidence_control_choices.keys())}; got {control!r}"
            )
        properties["control"] = control
    return _connect_rel(taap.is_evidence_for, yse, what_for="TAAP evidence", properties=properties)
