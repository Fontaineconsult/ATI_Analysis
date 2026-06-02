"""
Centralized identifier-format helpers for graph nodes that use composite string IDs
(e.g. YearSuccessEvidence.year_identifier, CampusPlan.plan_identifier).

The schema enforces uniqueness of these identifiers via `unique_index=True`. The
*format* is enforced only by the construction code — every code path that builds
one of these identifiers should call the matching helper here so the format stays
consistent across the migration script, factory functions, and any ad-hoc Cypher.

The constants below are also referenced by Cypher queries that slice identifiers
(e.g. the migration's `substring(year_identifier, YEAR_PREFIX_LENGTH)`) — pass
them as query parameters rather than inlining the magic numbers.
"""

# Length of a "YYYY-YYYY" academic-year prefix. Used by Cypher substring()
# operations that strip the year prefix off an existing identifier.
YEAR_PREFIX_LENGTH = 9

IDENTIFIER_SEPARATOR = "-"


def make_yse_identifier(academic_year: str, indicator_composite_key: str, campus_abbrev: str) -> str:
    """
    Build a YearSuccessEvidence.year_identifier.

    Format: '<year>-<indicator_composite_key>-<campus_abbrev>'
    Example: '2025-2026-5.2-pro-sfsu'
    """
    return IDENTIFIER_SEPARATOR.join([academic_year, indicator_composite_key, campus_abbrev])


def make_campus_plan_identifier(academic_year: str, campus_abbrev: str) -> str:
    """
    Build a CampusPlan.plan_identifier (the document-level parent node).

    Format:  '<year>-<campus_abbrev>'
    Example: '2025-2026-sfsu'
    """
    return IDENTIFIER_SEPARATOR.join([academic_year, campus_abbrev])


def make_working_group_plan_identifier(academic_year: str, campus_abbrev: str, working_group_abbrev: str) -> str:
    """
    Build a WorkingGroupPlan.plan_identifier (a per-group child of a CampusPlan).

    Format:  '<year>-<campus_abbrev>-<working_group_abbrev>'
    Example: '2025-2026-sfsu-web'

    The working_group_abbrev is the 3-letter code used elsewhere in the codebase
    (web / pro / ins), matching the SuccessIndicator composite_key suffix.
    """
    return IDENTIFIER_SEPARATOR.join([academic_year, campus_abbrev, working_group_abbrev])


def make_asset_identifier(title_slug: str, locus: str) -> str:
    """
    Build an Asset.asset_identifier.

    Scope is part of asset identity, so the locus (where remediation authority sits)
    disambiguates the same nominal system across scopes: the CSU-wide Canvas resolves
    into 'canvas-systemwide' vs the campus-scoped 'canvas-sfsu'. `title` alone cannot
    carry this, which is why the unique index lives on the composite identifier instead.

    `locus` is a campus abbreviation (campus scope), a vendor slug (vendor scope),
    or the literal 'systemwide' / 'regional'.

    Format:  '<title_slug>-<locus>'
    Example: 'canvas-sfsu', 'canvas-systemwide', 'popetech-instructure'
    """
    return IDENTIFIER_SEPARATOR.join([title_slug, locus])


def make_interface_identifier(locus: str, view_slug: str) -> str:
    """
    Build an Interface.interface_identifier.

    An Interface is a salient point of interaction; its identity is the locus it
    lives on plus the slug of the view/surface. For an asset-backed interface the
    locus is the backing Asset.asset_identifier ('canvas-sfsu'); for a standalone
    interface the locus is a campus abbreviation or the literal 'standalone'. This
    mirrors how scope is part of Asset identity — the same view on the same product
    resolves into distinct interfaces where it is presented at different loci.

    Format:  '<locus>-<view_slug>'
    Example: 'canvas-sfsu-course-view'
    """
    return IDENTIFIER_SEPARATOR.join([locus, view_slug])
