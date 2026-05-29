#
# ASSET / TAAP CREATE QUERIES
#
import re
from datetime import date

from app.database.graph_schema import *
from app.database.identifiers import make_asset_identifier
from app.data_config import asset_classes, asset_scopes, taap_outcomes
from app.endpoints.data_api.errors.custom_exceptions import (
    CrudError,
    NotFoundError,
    ValidationError,
)


def _slugify(value: str) -> str:
    """
    Normalize a free-text value into the hyphenated slug form used inside
    asset_identifiers (lowercase, non-alphanumeric runs collapsed to a single
    '-', no leading/trailing '-'). 'Canvas LMS' -> 'canvas-lms'.
    """
    slug = re.sub(r"[^a-z0-9]+", "-", (value or "").strip().lower())
    return slug.strip("-")


def _coerce_date(value, *, field_name: str):
    """
    Accept a date, an ISO 'YYYY-MM-DD' string, or None and return a date | None.
    Raises ValidationError on an unparseable string so callers get a 400, not a 500.
    """
    if value is None or isinstance(value, date):
        return value
    try:
        return date.fromisoformat(value)
    except (ValueError, TypeError):
        raise ValidationError(f"{field_name} must be an ISO date (YYYY-MM-DD); got {value!r}")


def create_asset(
    title: str,
    scope: str,
    locus: str,
    asset_class: str = None,
    version: str = None,
    description: str = None,
) -> Asset:
    """
    Create an Asset (a logged unit of ICT whose accessibility must be maintained).

    Identity is composite: the unique `asset_identifier` is built from a slug of
    `title` plus `locus` (where remediation authority sits) via
    `make_asset_identifier`. The same nominal system therefore resolves into
    distinct assets across scopes — 'canvas-sfsu' vs 'canvas-systemwide'.

    This is the only sanctioned creation path for Asset: it builds the identifier
    in the canonical format, validates the `asset_class` / `scope` vocabularies,
    and guards the unique index with a friendly error. Calling `Asset(...).save()`
    directly bypasses the identifier-format and uniqueness handling.

    Stewardship (procure / develop / maintain / use), vendor provenance, and the
    campus anchor are deliberately NOT wired here — they are optional edges, added
    via the `assign_*` functions in queries/assets/update.py. An asset with no
    steward is a valid, meaningful state (the elevation signal).

    Parameters
    ----------
    title : str (required)
        Human-readable name, e.g. 'Canvas'. Indexed but NOT unique on its own.
    scope : str (required)
        One of `asset_scopes` (systemwide | regional | campus | vendor).
    locus : str (required)
        Where remediation authority sits — a campus abbreviation (campus scope),
        a vendor slug (vendor scope), or the literal 'systemwide' / 'regional'.
        Forms the second half of the identifier.
    asset_class : str, optional
        One of `asset_classes` (institutional_system | employee_content |
        third_party_service | infrastructure).
    version, description : str, optional
        Descriptive fields.

    Raises
    ------
    ValidationError on bad/missing input or a duplicate asset_identifier.
    CrudError on save failure.
    """
    if not title or not title.strip():
        raise ValidationError("title is required")

    if scope not in asset_scopes:
        raise ValidationError(
            f"scope must be one of {list(asset_scopes.keys())}; got {scope!r}"
        )

    if asset_class is not None and asset_class not in asset_classes:
        raise ValidationError(
            f"asset_class must be one of {list(asset_classes.keys())}; got {asset_class!r}"
        )

    title_slug = _slugify(title)
    locus_slug = _slugify(locus)
    if not title_slug:
        raise ValidationError(f"title {title!r} does not yield a usable slug")
    if not locus_slug:
        raise ValidationError("locus is required (campus abbrev, vendor slug, 'systemwide', or 'regional')")

    asset_identifier = make_asset_identifier(title_slug, locus_slug)

    if Asset.nodes.filter(asset_identifier=asset_identifier):
        raise ValidationError(f"Asset with asset_identifier {asset_identifier!r} already exists")

    try:
        asset = Asset(
            asset_identifier=asset_identifier,
            title=title,
            scope=scope,
            asset_class=asset_class,
            version=version,
            description=description,
        )
        asset.save()
        return asset
    except Exception as e:
        raise CrudError(f"Failed to create Asset {asset_identifier!r}: {e}")


def create_taap(
    title: str,
    asset_identifier: str,
    outcome: str = None,
    description: str = None,
    effective_date=None,
    review_due=None,
    active: bool = True,
) -> TAAP:
    """
    Create a Temporary Alternate Access Plan (TAAP) covering an Asset.

    A TAAP is the institution's required response when full conformance isn't
    achievable (Title II §35.205). It is asset-scoped, so this is the only
    sanctioned creation path: it wires the required `covers_asset` edge to the
    Asset identified by `asset_identifier`. Bare `TAAP(...).save()` skips that
    required relationship.

    Parameters
    ----------
    title : str (required)
        Unique title for the TAAP.
    asset_identifier : str (required)
        The Asset this TAAP covers. Resolved here; NotFoundError if missing.
    outcome : str, optional
        One of `taap_outcomes` (equally_effective | non_equal_alternative | referral).
    description : str, optional
    effective_date, review_due : date | 'YYYY-MM-DD' str, optional
    active : bool, default True

    Raises
    ------
    ValidationError on bad input or a duplicate title.
    NotFoundError if the covered Asset doesn't exist.
    CrudError on save failure.
    """
    if not title or not title.strip():
        raise ValidationError("title is required")

    if outcome is not None and outcome not in taap_outcomes:
        raise ValidationError(
            f"outcome must be one of {list(taap_outcomes.keys())}; got {outcome!r}"
        )

    effective_date = _coerce_date(effective_date, field_name="effective_date")
    review_due = _coerce_date(review_due, field_name="review_due")

    try:
        asset = Asset.nodes.get(asset_identifier=asset_identifier)
    except Asset.DoesNotExist:
        raise NotFoundError(f"Asset {asset_identifier!r} not found")

    if TAAP.nodes.filter(title=title):
        raise ValidationError(f"TAAP with title {title!r} already exists")

    try:
        taap = TAAP(
            title=title,
            outcome=outcome,
            description=description,
            effective_date=effective_date,
            review_due=review_due,
            active=active,
        )
        taap.save()
        taap.covers_asset.connect(asset)
        return taap
    except Exception as e:
        raise CrudError(f"Failed to create TAAP {title!r}: {e}")
