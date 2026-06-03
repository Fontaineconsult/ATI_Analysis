#
# INTERFACE CREATE QUERIES
#
import re

from app.database.graph_schema import *
from app.database.identifiers import make_interface_identifier
from app.data_config import interface_kinds, audiences, interface_provenances
# Aliased so the vocabulary doesn't collide with the `coverage_domains` field/param name.
from app.data_config import coverage_domains as COVERAGE_DOMAINS
from app.endpoints.data_api.errors.custom_exceptions import (
    CrudError,
    NotFoundError,
    ValidationError,
)


def _slugify(value: str) -> str:
    """
    Normalize free text into the hyphenated slug form used inside
    interface_identifiers (lowercase, non-alphanumeric runs collapsed to a single
    '-', no leading/trailing '-'). 'Course View' -> 'course-view'. Mirrors the
    helper in queries/assets/create.py.
    """
    slug = re.sub(r"[^a-z0-9]+", "-", (value or "").strip().lower())
    return slug.strip("-")


def _normalize_choice_list(value, allowed, field_name):
    """
    Coerce a multi-valued choice input into a clean, validated list of keys. Accepts
    None, a single string, or a list/tuple; raises ValidationError on any value outside
    `allowed` (a {key: label} vocabulary). Shared by the Interface ArrayProperty fields
    (interface_kind, audience): an interface can carry several of each at once.
    """
    if value is None:
        return []
    if isinstance(value, str):
        value = [value]
    if not isinstance(value, (list, tuple)):
        raise ValidationError(f"{field_name} must be a string or list of strings; got {value!r}")
    bad = [v for v in value if v not in allowed]
    if bad:
        raise ValidationError(
            f"{field_name} values must each be one of {list(allowed.keys())}; got {bad!r}"
        )
    return list(value)


def normalize_audience(audience):
    """Validated list of audience keys — Interface.audience is multi-valued."""
    return _normalize_choice_list(audience, audiences, "audience")


def normalize_interface_kind(interface_kind):
    """Validated list of interface-kind keys — Interface.interface_kind is multi-valued."""
    return _normalize_choice_list(interface_kind, interface_kinds, "interface_kind")


def create_interface(
    title: str,
    locus: str,
    interface_kind: str = None,
    coverage_domains: str = None,
    audience=None,
    provenance: str = None,
    description: str = None,
    presented_by: str = None,
) -> Interface:
    """
    Create an Interface (a salient point of interaction with ICT — where the
    accessibility duty lands and what remediation targets).

    Identity is composite: the unique `interface_identifier` is built from `locus`
    plus a slug of `title` via `make_interface_identifier`. The locus is the
    backing Asset.asset_identifier for an asset-backed interface ('canvas-sfsu'),
    or a campus abbreviation / the literal 'standalone' for one that has no owned
    asset behind it. The same view at different loci therefore resolves into
    distinct interfaces.

    This is the only sanctioned creation path for Interface: it builds the
    identifier in canonical format, validates the kind / coverage_domain /
    audience / provenance vocabularies, and guards the unique index with a
    friendly error.

    `presented_by` is OPTIONAL — a standalone interface has no backing asset, which
    is a correct, meaningful state (not a gap). When given, the named Asset must
    exist; it is connected after save. Remediation, components, and documentation
    edges are deferred to the assign_* functions in queries/interfaces/update.py.

    Parameters
    ----------
    title : str (required)
        The view/surface name, e.g. 'Course View'. Indexed but NOT unique on its own.
    locus : str (required)
        Identity anchor — backing asset_identifier, campus abbrev, or 'standalone'.
    interface_kind : str | list[str], optional — one or more of `interface_kinds` (multi-valued).
    coverage_domains : str, optional — one of `coverage_domains` (declared domain of attention).
    audience : str | list[str], optional — one or more of `audiences` (multi-valued).
    provenance : str, optional       — one of `interface_provenances`.
    description : str, optional.
    presented_by : str, optional     — asset_identifier of the backing Asset to connect.

    Raises
    ------
    ValidationError on bad/missing input or a duplicate interface_identifier.
    NotFoundError if `presented_by` names an Asset that doesn't exist.
    CrudError on save failure.
    """
    if not title or not title.strip():
        raise ValidationError("title is required")

    if coverage_domains is not None and coverage_domains not in COVERAGE_DOMAINS:
        raise ValidationError(
            f"coverage_domains must be one of {list(COVERAGE_DOMAINS.keys())}; got {coverage_domains!r}"
        )
    if provenance is not None and provenance not in interface_provenances:
        raise ValidationError(
            f"provenance must be one of {list(interface_provenances.keys())}; got {provenance!r}"
        )
    interface_kind = normalize_interface_kind(interface_kind)
    audience = normalize_audience(audience)

    title_slug = _slugify(title)
    locus_slug = _slugify(locus)
    if not title_slug:
        raise ValidationError(f"title {title!r} does not yield a usable slug")
    if not locus_slug:
        raise ValidationError("locus is required (backing asset_identifier, campus abbrev, or 'standalone')")

    interface_identifier = make_interface_identifier(locus_slug, title_slug)

    if Interface.nodes.filter(interface_identifier=interface_identifier):
        raise ValidationError(
            f"Interface with interface_identifier {interface_identifier!r} already exists"
        )

    # Resolve the optional backing asset up front so a bad reference is a 404 before
    # we create a dangling node.
    asset = None
    if presented_by:
        try:
            asset = Asset.nodes.get(asset_identifier=presented_by)
        except Asset.DoesNotExist:
            raise NotFoundError(f"Asset {presented_by!r} not found")

    try:
        interface = Interface(
            interface_identifier=interface_identifier,
            title=title,
            description=description,
            interface_kind=interface_kind,
            coverage_domains=coverage_domains,
            audience=audience,
            provenance=provenance,
        )
        interface.save()
        if asset is not None:
            interface.presented_by.connect(asset)
        return interface
    except Exception as e:
        raise CrudError(f"Failed to create Interface {interface_identifier!r}: {e}")
