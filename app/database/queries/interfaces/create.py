#
# INTERFACE CREATE QUERIES
#
import re

from app.database.graph_schema import *
from app.database.identifiers import make_interface_identifier
from app.data_config import functions, audiences, interface_provenances
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
    (coverage_domains, audience): an interface can carry several of each at once.
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


def normalize_coverage_domains(coverage_domains):
    """Validated list of coverage-domain keys — Interface.coverage_domains is multi-valued."""
    return _normalize_choice_list(coverage_domains, COVERAGE_DOMAINS, "coverage_domains")


# The literal `backing` coordinate for an interface that has no owned asset behind it.
STANDALONE_BACKING = "standalone"


def create_interface(
    title: str,
    locus: str,
    function: str,
    presented_by: str = None,
    coverage_domains=None,
    audience=None,
    provenance: str = None,
    description: str = None,
) -> Interface:
    """
    Create an Interface (a salient point of interaction with ICT — where the
    accessibility duty lands and what remediation targets).

    Identity is a four-coordinate signature, built into the unique
    `interface_identifier` by `make_interface_identifier`:

        backing -- locus -- function -- title-slug

    where `backing` is the backing Asset.asset_identifier (from `presented_by`) or
    the literal 'standalone'. The same view at a different backing / locus / function
    therefore resolves into a distinct interface. All four coordinates are identity,
    so they are immutable after creation (see queries/interfaces/update.py).

    This is the only sanctioned creation path for Interface: it resolves the backing,
    builds the identifier in canonical format, validates the function / coverage_domain
    / audience / provenance vocabularies, and guards the unique index with a friendly
    error.

    `presented_by` is OPTIONAL — a standalone interface has no backing asset, which is
    a correct, meaningful state (not a gap). When given, the named Asset must exist; it
    is connected after save and supplies the `backing` coordinate. Working-group
    accountability, remediation, components, and documentation edges are deferred to the
    assign_* functions in queries/interfaces/update.py (they are NOT identity).

    Parameters
    ----------
    title : str (required)
        The view/surface name, e.g. 'Course View'. Identity coordinate (in the key).
    locus : str (required)
        The structural zone within the backing ('course-shells'); governed free text,
        slugified into the identifier. Identity coordinate.
    function : str (required)
        One of `functions` (institutional purpose). Identity coordinate.
    presented_by : str, optional
        asset_identifier of the backing Asset; absent => backing is 'standalone'.
    coverage_domains : str | list[str], optional — one or more of `coverage_domains` (multi-valued, descriptive).
    audience : str | list[str], optional — one or more of `audiences` (multi-valued, descriptive).
    provenance : str, optional       — one of `interface_provenances` (descriptive).
    description : str, optional.

    Raises
    ------
    ValidationError on bad/missing input or a duplicate interface_identifier.
    NotFoundError if `presented_by` names an Asset that doesn't exist.
    CrudError on save failure.
    """
    if not title or not title.strip():
        raise ValidationError("title is required")

    if function not in functions:
        raise ValidationError(
            f"function must be one of {list(functions.keys())}; got {function!r}"
        )
    if provenance is not None and provenance not in interface_provenances:
        raise ValidationError(
            f"provenance must be one of {list(interface_provenances.keys())}; got {provenance!r}"
        )
    coverage_domains = normalize_coverage_domains(coverage_domains)
    audience = normalize_audience(audience)

    title_slug = _slugify(title)
    locus_slug = _slugify(locus)
    if not title_slug:
        raise ValidationError(f"title {title!r} does not yield a usable slug")
    if not locus_slug:
        raise ValidationError("locus is required (the structural zone within the backing, e.g. 'course-shells')")

    # Resolve the optional backing asset up front so a bad reference is a 404 before we
    # create a dangling node, and so `backing` feeds the identifier.
    asset = None
    backing = STANDALONE_BACKING
    if presented_by:
        try:
            asset = Asset.nodes.get(asset_identifier=presented_by)
        except Asset.DoesNotExist:
            raise NotFoundError(f"Asset {presented_by!r} not found")
        backing = asset.asset_identifier

    interface_identifier = make_interface_identifier(backing, locus_slug, function, title_slug)

    if Interface.nodes.filter(interface_identifier=interface_identifier):
        raise ValidationError(
            f"Interface with interface_identifier {interface_identifier!r} already exists"
        )

    try:
        interface = Interface(
            interface_identifier=interface_identifier,
            title=title,
            description=description,
            locus=locus,
            function=function,
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
