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

# Separator BETWEEN identity coordinates in composite identifiers whose coordinates can
# themselves contain IDENTIFIER_SEPARATOR (e.g. an Interface's backing is an
# Asset.asset_identifier like 'canvas-sfsu'). A double hyphen keeps the coordinates
# parseable: split on SEGMENT_SEPARATOR to recover them, while within-segment slugs keep
# using IDENTIFIER_SEPARATOR.
SEGMENT_SEPARATOR = "--"


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


def make_interface_identifier(backing: str, locus_slug: str, function: str, title_slug: str) -> str:
    """
    Build an Interface.interface_identifier from its four identity coordinates.

    An Interface's identity is a signature of where work converges:
      - backing    : the backing Asset.asset_identifier ('canvas-sfsu'), or the literal
                     'standalone' when no owned asset sits behind it.
      - locus_slug : the named structural zone within the backing ('course-shells'),
                     governed free text, slugified.
      - function   : the institutional purpose the interface serves
                     ('teaching-and-learning'); an identity-bearing controlled-vocab key.
      - title_slug : slug of the human title; title is part of identity.

    Coordinates are joined with SEGMENT_SEPARATOR (not IDENTIFIER_SEPARATOR), because
    `backing` already contains IDENTIFIER_SEPARATOR hyphens — the double-hyphen keeps the
    four coordinates parseable.

    Format:  '<backing>--<locus_slug>--<function>--<title_slug>'
    Example: 'canvas-sfsu--course-shells--teaching-and-learning--canvas-course-shells'
    """
    return SEGMENT_SEPARATOR.join([backing, locus_slug, function, title_slug])


def make_component_identifier(parent: str, title_slug: str) -> str:
    """
    Build a Component.component_identifier.

    A Component is a WCAG-grain element that is part_of an Interface. Its identity is the
    parent Interface's identifier (or the literal 'standalone' when not yet attached) plus
    the slug of its title. The parent prefix guarantees global uniqueness; the composite is
    reached via the part_of edge rather than parsed, so a SEGMENT_SEPARATOR collision with
    the parent's own separators is harmless.

    Format:  '<parent>--<title_slug>'
    Example: 'canvas-sfsu--course-shells--teaching-and-learning--canvas-course-shells--video-player'
    """
    return SEGMENT_SEPARATOR.join([parent, title_slug])


def make_tool_identifier(title_slug: str) -> str:
    """
    Build a Tool.tool_identifier.

    A Tool is an instrument of remediation work (Pope Tech, Equidox, an OCR engine).
    Unlike Asset/Interface it has no scope/locus dimension, so its identity is just the
    slug of its product name. Kept as a helper for consistency with the other composite
    identifiers — every code path that builds one should go through identifiers.py.

    Format:  '<title_slug>'
    Example: 'pope-tech', 'equidox'
    """
    return title_slug


# Separator between a descriptor handle's kind prefix and its target coordinates. The
# kind prefix (`node_type:` / `field:` / `field_value:`) namespaces handles so they don't
# collide and so the app can tell a handle's kind from its prefix.
DESCRIPTOR_HANDLE_SEPARATOR = ":"


def make_node_type_handle(label: str) -> str:
    """
    Build a UniversalDescriptor.descriptor_handle for a node-type descriptor.

    Format:  'node_type:<Label>'
    Example: 'node_type:Interface'
    """
    return f"node_type{DESCRIPTOR_HANDLE_SEPARATOR}{label}"


def make_field_handle(label: str, field: str) -> str:
    """
    Build a UniversalDescriptor.descriptor_handle for a field descriptor (a field on a
    specific node type).

    Format:  'field:<Label>.<field>'
    Example: 'field:Interface.function'
    """
    return f"field{DESCRIPTOR_HANDLE_SEPARATOR}{label}.{field}"


def make_field_value_handle(field: str, value: str) -> str:
    """
    Build a UniversalDescriptor.descriptor_handle for a field-value descriptor (a single
    controlled-vocabulary value of a field, so each choice can be described on its own).

    Format:  'field_value:<field>.<value>'
    Example: 'field_value:function.teaching-and-learning'
    """
    return f"field_value{DESCRIPTOR_HANDLE_SEPARATOR}{field}.{value}"


# --- Meta-scaffold handles -----------------------------------------------------------------
# Principle.handle uses the same kind-prefix discipline as the descriptor handles above. The
# meta-graph anchors on UniversalDescriptor, so there is no separate SchemaElement handle —
# a relationship-type descriptor gets a `rel_type:` handle here (alongside node_type/field/
# field_value built above).

def make_rel_type_handle(rel_type: str) -> str:
    """
    UniversalDescriptor.descriptor_handle for a relationship-type descriptor.

    Format:  'rel_type:<rel>'
    Example: 'rel_type:develops'
    """
    return f"rel_type{DESCRIPTOR_HANDLE_SEPARATOR}{rel_type}"


def make_principle_handle(slug: str) -> str:
    """Principle handle. Format: 'principle:<slug>' (e.g. 'principle:closest-to-capacity')."""
    return f"principle{DESCRIPTOR_HANDLE_SEPARATOR}{slug}"
