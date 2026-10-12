#
# ASSET / TAAP CREATE QUERIES
#
import re
from datetime import date

from app.database.graph_schema import *
from app.database.identifiers import make_asset_identifier, make_taap_identifier
from app.data_config import (
    asset_classes,
    asset_scopes,
    taap_distribution_actions,
    taap_outcomes,
    taap_requirements,
    taap_risk_levels,
    taap_statement_elements,
    taap_statuses,
    taap_user_groups,
)
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


def _validate_choice(value, vocab: dict, *, field_name: str):
    """A single-valued vocabulary field: None passes, anything else must be a key."""
    if value is not None and value not in vocab:
        raise ValidationError(
            f"{field_name} must be one of {list(vocab.keys())}; got {value!r}"
        )
    return value


def _validate_keys(values, vocab: dict, *, field_name: str) -> list:
    """
    A checkbox section stored as an array of vocabulary keys. None becomes [];
    duplicates are dropped in first-seen order; an unknown key is a 400.
    """
    if values is None:
        return []
    if isinstance(values, str):
        values = [values]
    seen, clean = set(), []
    for v in values:
        if v not in vocab:
            raise ValidationError(
                f"{field_name} values must be among {list(vocab.keys())}; got {v!r}"
            )
        if v not in seen:
            seen.add(v)
            clean.append(v)
    return clean


# The TAAP form's checkbox sections and the vocabulary each one is validated against.
# Shared by create_taap and update_taap so the two never drift.
TAAP_ARRAY_FIELDS = {
    "affected_user_groups": taap_user_groups,
    "statement_elements":   taap_statement_elements,
    "distribution_actions": taap_distribution_actions,
    "requirements_met":     taap_requirements,
}

# The form's single-choice graded sections.
TAAP_CHOICE_FIELDS = {
    "outcome":                   taap_outcomes,
    "institutional_risk":        taap_risk_levels,
    "accommodation_requirement": taap_risk_levels,
    "taap_status":               taap_statuses,
}

# Free-text and descriptive fields that create and update both accept as-is.
TAAP_TEXT_FIELDS = (
    "description",
    "template_version",
    "vendor_contact",
    "known_barriers",
    "proposed_alternative",
    "accessibility_statement",
    "misc_notes",
)

TAAP_DATE_FIELDS = ("creation_date", "effective_date", "review_due")


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


def _resolve_requesting_unit(name: str, campus, *, create_missing: bool):
    """
    Find the OrgUnit a TAAP was requested by. With `create_missing`, an unknown
    name becomes a Department operating under `campus`, because the form names
    the department in prose and most of them are not yet in the graph.
    """
    name = (name or "").strip()
    if not name:
        raise ValidationError("requesting_unit is required")
    unit = OrgUnit.nodes.first_or_none(name=name)
    if unit is not None:
        return unit
    if not create_missing:
        raise NotFoundError(f"OrgUnit {name!r} not found")
    from app.database.queries.organizational_units.create import create_org_unit
    return create_org_unit("department", name, campus_abbreviation=campus.abbreviation)


def _academic_year_for(creation_date: date) -> str:
    """
    The AcademicYear name a creation date falls in. CSU academic years begin in
    July: 2026-07-29 is in '2026-2027'; 2026-05-12 is in '2025-2026'.
    """
    start = creation_date.year if creation_date.month >= 7 else creation_date.year - 1
    return f"{start}-{start + 1}"


def create_taap(
    title: str,
    asset_identifier: str,
    campus_abbrev: str,
    requesting_unit: str,
    creation_date=None,
    effective_date=None,
    review_due=None,
    academic_year: str = None,
    create_missing_unit: bool = False,
    active: bool = True,
    **fields,
) -> TAAP:
    """
    Create a Temporary Alternate Access Plan (TAAP) covering an Asset.

    A TAAP is the institution's required response when full conformance isn't
    achievable (Title II §35.205). This is the only sanctioned creation path: it
    builds the composite `taap_identifier` (asset + requesting unit + creation
    year) and wires the required edges `covers_asset`, `taap_at_campus`, and
    `requested_by`. Bare `TAAP(...).save()` skips all of that.

    `in_year` is wired when the AcademicYear exists: the one named by
    `academic_year`, or the one the creation date falls in. Signers, the
    preparer, references, the signed copy, and evidence links are optional edges
    added through queries/assets/update.py.

    Parameters
    ----------
    title : str (required)
        The product name as written on the form. Indexed, NOT unique.
    asset_identifier : str (required)
        The Asset this TAAP covers. NotFoundError if missing.
    campus_abbrev : str (required)
        The campus the plan is for. NotFoundError if missing.
    requesting_unit : str (required)
        Name of the OrgUnit whose purchase the plan covers. NotFoundError if
        missing unless `create_missing_unit`, which creates it as a Department
        under the campus.
    creation_date, effective_date, review_due : date | 'YYYY-MM-DD', optional
        One of creation_date or effective_date is required: the identifier
        carries the creation year, falling back to the effective year.
    academic_year : str, optional
        AcademicYear name to anchor to. NotFoundError if given and missing.
        Omitted: derived from the creation date and skipped if that year node
        does not exist.
    **fields
        Any of TAAP_TEXT_FIELDS, TAAP_CHOICE_FIELDS, TAAP_ARRAY_FIELDS. Choice
        and array values are validated against their data_config vocabulary.

    Raises
    ------
    ValidationError on bad input or a duplicate taap_identifier.
    NotFoundError if the asset, campus, unit, or named year doesn't exist.
    CrudError on save failure.
    """
    if not title or not title.strip():
        raise ValidationError("title is required")

    unknown = set(fields) - set(TAAP_TEXT_FIELDS) - set(TAAP_CHOICE_FIELDS) - set(TAAP_ARRAY_FIELDS)
    if unknown:
        raise ValidationError(f"Unknown TAAP fields: {sorted(unknown)}")

    creation_date = _coerce_date(creation_date, field_name="creation_date")
    effective_date = _coerce_date(effective_date, field_name="effective_date")
    review_due = _coerce_date(review_due, field_name="review_due")
    year_source = creation_date or effective_date
    if year_source is None:
        raise ValidationError("creation_date or effective_date is required to build the taap_identifier")

    for name, vocab in TAAP_CHOICE_FIELDS.items():
        if name in fields:
            _validate_choice(fields[name], vocab, field_name=name)
    for name, vocab in TAAP_ARRAY_FIELDS.items():
        if name in fields:
            fields[name] = _validate_keys(fields[name], vocab, field_name=name)

    try:
        asset = Asset.nodes.get(asset_identifier=asset_identifier)
    except Asset.DoesNotExist:
        raise NotFoundError(f"Asset {asset_identifier!r} not found")
    try:
        campus = Campus.nodes.get(abbreviation=campus_abbrev)
    except Campus.DoesNotExist:
        raise NotFoundError(f"Campus {campus_abbrev!r} not found")

    unit = _resolve_requesting_unit(requesting_unit, campus, create_missing=create_missing_unit)
    unit_slug = _slugify(unit.name)
    if not unit_slug:
        raise ValidationError(f"requesting_unit {unit.name!r} does not yield a usable slug")

    year = None
    if academic_year:
        try:
            year = AcademicYear.nodes.get(name=academic_year)
        except AcademicYear.DoesNotExist:
            raise NotFoundError(f"AcademicYear {academic_year!r} not found")
    else:
        year = AcademicYear.nodes.first_or_none(name=_academic_year_for(year_source))

    taap_identifier = make_taap_identifier(asset_identifier, unit_slug, str(year_source.year))
    if TAAP.nodes.filter(taap_identifier=taap_identifier):
        raise ValidationError(f"TAAP with taap_identifier {taap_identifier!r} already exists")

    try:
        taap = TAAP(
            taap_identifier=taap_identifier,
            title=title.strip(),
            creation_date=creation_date,
            effective_date=effective_date,
            review_due=review_due,
            active=active,
            **fields,
        )
        taap.save()
        taap.covers_asset.connect(asset)
        taap.at_campus.connect(campus)
        taap.requested_by.connect(unit)
        if year is not None:
            taap.in_year.connect(year)
        return taap
    except Exception as e:
        raise CrudError(f"Failed to create TAAP {taap_identifier!r}: {e}")
