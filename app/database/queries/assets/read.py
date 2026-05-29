#
# ASSET / TAAP READ QUERIES
#
from neomodel import db

from app.database.graph_schema import *
from app.data_config import asset_scopes
from app.endpoints.data_api.errors.custom_exceptions import NotFoundError, ValidationError


# Each §508 stewardship capacity is held by a Person OR an OrgUnit under a shared
# rel-type. The two neomodel accessors are merged into one list per capacity so a
# caller never has to know whether the holder is an individual or a unit.
_STEWARDSHIP_ACCESSORS = {
    "procured_by":   ("procured_by", "procured_by_unit"),
    "developed_by":  ("developed_by", "developed_by_unit"),
    "maintained_by": ("maintained_by", "maintained_by_unit"),
    "used_by":       ("used_by", "used_by_unit"),
}

# Reverse accessors for implementations that remediate the asset (the work that
# keeps it accessible). Presence of ANY of these means the asset is remediated.
_REMEDIATION_ACCESSORS = (
    ("Process",   "remediated_by_processes"),
    ("Project",   "remediated_by_projects"),
    ("Procedure", "remediated_by_procedures"),
    ("Service",   "remediated_by_services"),
)


def _holders(person_rel, unit_rel) -> list:
    """Merge a Person accessor and an OrgUnit accessor into one tagged list."""
    holders = [
        {"type": "person", "unique_id": p.unique_id, "name": p.name}
        for p in person_rel.all()
    ]
    holders += [
        {"type": "org_unit", "unique_id": u.unique_id, "name": u.name}
        for u in unit_rel.all()
    ]
    return holders


def _asset_stewardship(asset) -> dict:
    return {
        capacity: _holders(getattr(asset, person_attr), getattr(asset, unit_attr))
        for capacity, (person_attr, unit_attr) in _STEWARDSHIP_ACCESSORS.items()
    }


def _asset_remediations(asset) -> list:
    remediations = []
    for label, accessor in _REMEDIATION_ACCESSORS:
        for impl in getattr(asset, accessor).all():
            remediations.append({
                "type": label,
                "title": impl.title,
                "unique_id": impl.unique_id,
            })
    return remediations


def _serialize_asset_detail(asset) -> dict:
    """
    Full asset projection: identity + stewardship parties + vendor/campus anchor
    + remediating implementations + covering TAAPs, plus the derived
    `elevation_signal`.

    elevation_signal encodes the model's headline insight: an asset that is
    stewarded under §508 yet has NO remediating implementation is the signal that
    remediation responsibility has elevated to the institution
    (Title II §35.205 / the responsibility heuristic).
    """
    stewardship = _asset_stewardship(asset)
    remediations = _asset_remediations(asset)
    campus_node = asset.at_campus.single()

    is_stewarded = any(stewardship.values())
    is_remediated = bool(remediations)

    data = asset.serialize()
    data.update({
        "stewardship": stewardship,
        "supplied_by": [
            {"unique_id": v.unique_id, "name": v.name} for v in asset.supplied_by.all()
        ],
        "at_campus": (
            {"abbreviation": campus_node.abbreviation, "name": campus_node.name}
            if campus_node else None
        ),
        "remediated_by": remediations,
        "covered_by_taap": [t.serialize() for t in asset.covered_by_taap.all()],
        "is_stewarded": is_stewarded,
        "is_remediated": is_remediated,
        "elevation_signal": is_stewarded and not is_remediated,
    })
    return data


def get_all_assets() -> list:
    """All Asset nodes as lightweight summaries (serialize()), ordered by identifier."""
    return [a.serialize() for a in Asset.nodes.order_by("asset_identifier").all()]


def get_asset(asset_identifier: str) -> dict:
    """Full detail for one Asset. Raises NotFoundError if it doesn't exist."""
    try:
        asset = Asset.nodes.get(asset_identifier=asset_identifier)
    except Asset.DoesNotExist:
        raise NotFoundError(f"Asset {asset_identifier!r} not found")
    return _serialize_asset_detail(asset)


def get_assets_by_scope(scope: str) -> list:
    """All assets at a given scope (summaries). Raises ValidationError on a bad scope."""
    if scope not in asset_scopes:
        raise ValidationError(
            f"scope must be one of {list(asset_scopes.keys())}; got {scope!r}"
        )
    return [a.serialize() for a in Asset.nodes.filter(scope=scope).order_by("asset_identifier")]


# Assets anchored to a campus via the scope-anchor edge. Cypher (not an in-Python
# filter over all nodes) so the campus lookup happens in the database.
_ASSETS_BY_CAMPUS_QUERY = """
    MATCH (a:Asset)-[:asset_at_campus]->(:Campus {abbreviation: $campus_abbrev})
    RETURN a
    ORDER BY a.asset_identifier
"""


def get_assets_by_campus(campus_abbrev: str) -> list:
    """All assets whose scope anchor is the given campus (summaries)."""
    results, _ = db.cypher_query(_ASSETS_BY_CAMPUS_QUERY, {"campus_abbrev": campus_abbrev})
    return [Asset.inflate(row[0]).serialize() for row in results]


# The elevation query: assets stewarded under §508 (any procure/develop/maintain/use
# edge) but with NO remediating implementation. These are the assets where
# responsibility has elevated to the institution. The shared rel-types let one
# pattern catch Person and OrgUnit holders alike.
_ELEVATION_SIGNAL_QUERY = """
    MATCH (a:Asset)
    WHERE (a)-[:procured_by|developed_by|maintained_by|used_by]->()
      AND NOT (a)<-[:remediates]-()
    RETURN a
    ORDER BY a.asset_identifier
"""


def get_elevation_signal_assets() -> list:
    """
    Assets that are stewarded yet unremediated — the modeled signal that
    remediation responsibility has elevated to the institution. Returns full
    detail (so the caller sees who stewards each one).
    """
    results, _ = db.cypher_query(_ELEVATION_SIGNAL_QUERY)
    return [_serialize_asset_detail(Asset.inflate(row[0])) for row in results]


#
# TAAP reads
#

def _serialize_taap_detail(taap) -> dict:
    data = taap.serialize()
    data.update({
        "covers_asset": [a.serialize() for a in taap.covers_asset.all()],
        "owned_by": [
            {"unique_id": p.unique_id, "name": p.name} for p in taap.owned_by.all()
        ],
        "signed_by": [
            {"unique_id": p.unique_id, "name": p.name} for p in taap.signed_by.all()
        ],
        "is_evidence_for": [
            yse.year_identifier for yse in taap.is_evidence_for.all()
        ],
    })
    return data


def get_all_taaps() -> list:
    """All TAAP nodes as summaries, ordered by title."""
    return [t.serialize() for t in TAAP.nodes.order_by("title").all()]


def get_taap(title: str) -> dict:
    """Full detail for one TAAP (by its unique title). Raises NotFoundError if missing."""
    try:
        taap = TAAP.nodes.get(title=title)
    except TAAP.DoesNotExist:
        raise NotFoundError(f"TAAP {title!r} not found")
    return _serialize_taap_detail(taap)


def get_taaps_for_asset(asset_identifier: str) -> list:
    """All TAAPs covering the given asset (summaries). Raises NotFoundError if the asset is missing."""
    try:
        asset = Asset.nodes.get(asset_identifier=asset_identifier)
    except Asset.DoesNotExist:
        raise NotFoundError(f"Asset {asset_identifier!r} not found")
    return [t.serialize() for t in asset.covered_by_taap.all()]


def get_active_taaps() -> list:
    """All TAAPs flagged active=True (summaries)."""
    return [t.serialize() for t in TAAP.nodes.filter(active=True).order_by("review_due")]


def get_taaps_due_for_review(on_or_before) -> list:
    """
    Active TAAPs whose review_due is on or before `on_or_before`
    (a date or 'YYYY-MM-DD' string). Useful for the annual-review worklist.
    """
    from app.database.queries.assets.create import _coerce_date

    cutoff = _coerce_date(on_or_before, field_name="on_or_before")
    if cutoff is None:
        raise ValidationError("on_or_before is required")
    return [
        t.serialize()
        for t in TAAP.nodes.filter(active=True, review_due__lte=cutoff).order_by("review_due")
    ]
