#
# DOCUMENTATION READ QUERIES
#
# Two generations live here.
#
# 1. The five legacy `get_all_*` functions, kept as thin shims because
#    `GET /documents/<document_type>` still serves them. They no longer raise on
#    an empty collection — an empty Metric table is a valid answer, not a 404.
#
# 2. The projection-backed collection read powering the central Documentation
#    view. Three things about it are deliberate and load-bearing:
#
#    * INBOUND EDGES ARE MATCHED UNTYPED. Every inbound edge on a documentation
#      node IS a reference, and the rel-type is projected rather than filtered.
#      Enumerating types is precisely how `orphan_documents` came to report the
#      24 Documents and 79 Webpages that reach the graph only through
#      `is_sourced_from` as orphans.
#
#    * BOOLEANS ARE COERCED IN CYPHER, NOT DOWNSTREAM. neomodel's
#      `BooleanProperty.inflate` is `bool(value)`, and `bool('False') is True` —
#      so by the time any Python or JS consumer sees a legacy string flag, the
#      original value is unrecoverable. Raw Cypher is the last layer that can
#      still tell `'False'` from `False`. Verified 2026-08-22: 52 Documents carry
#      the string `'False'` on `is_milestone_and_measures_documentation` and on
#      `is_administrative_review_documentation`. Every other flag on every label
#      is a clean boolean.
#
#    * COERCION IS REPORTED, NEVER SILENT. Each coerced-from-dirt value is echoed
#      raw in `stored` and adds a code to `integrity`. Normalising quietly would
#      make those 52 rows invisible, which is the opposite of what a
#      reconciliation view is for.
#
#    The tri-state is preserved throughout: `depreciated` has no schema default,
#    so null means "never assessed", which is a different answer from "assessed,
#    not deprecated". `coalesce(flag, false)` is the tempting one-liner and it
#    erases exactly that distinction.
#
import json

from neomodel import db

from app.database.graph_schema import (
    Document,
    Webpage,
    Note,
    Message,
    Metric,
)
from app.endpoints.data_api.errors.custom_exceptions import ValidationError

# --------------------------------------------------------------------------- #
# Type registry                                                               #
# --------------------------------------------------------------------------- #

DOC_TYPE_TO_CLASS = {
    "documents": Document,
    "webpages": Webpage,
    "notes": Note,
    "messages": Message,
    "metrics": Metric,
}
DOC_TYPE_TO_LABEL = {key: cls.__name__ for key, cls in DOC_TYPE_TO_CLASS.items()}
DOC_TYPES = tuple(DOC_TYPE_TO_CLASS)


# --------------------------------------------------------------------------- #
# Cypher fragment builders                                                     #
# --------------------------------------------------------------------------- #

def _tri(expr):
    """Raw property -> true / false / null, preserving the tri-state.

    Reads a legacy string boolean as what it SAYS, which is the opposite of what
    neomodel's bool() does to it. NULL stays NULL.
    """
    return (
        "CASE "
        f"WHEN {expr} IS NULL THEN null "
        f"WHEN {expr} = true THEN true "
        f"WHEN {expr} = false THEN false "
        f"WHEN toLower(toString({expr})) IN ['true','t','yes','y','1'] THEN true "
        "ELSE false END"
    )


def _dirty_bool(expr):
    """True when the stored value is neither NULL nor a real boolean."""
    return f"({expr} IS NOT NULL AND NOT {expr} IN [true, false])"


def _dirty_date(expr):
    """True when a date property is stored as something that isn't ISO yyyy-mm-dd.

    Needs no type predicate: toString() of a real Date is always ISO, so anything
    that fails the pattern is by definition a bad string.
    """
    return (
        f"({expr} IS NOT NULL AND NOT toString({expr}) "
        "=~ '\\\\d{4}-\\\\d{2}-\\\\d{2}')"
    )


# Every inbound edge, untyped. See the module docstring.
_REFERENCED_BY = """
      referenced_by: [ (n)<-[r]-(parent) | {
        rel_type: type(r),
        parent_label: head(labels(parent)),
        parent_id: parent.unique_id,
        parent_title: coalesce(parent.title, parent.name, parent.success_indicator,
                               parent.year_identifier, parent.plan_identifier,
                               parent.composite_key, parent.asset_identifier,
                               parent.interface_identifier, parent.tool_identifier,
                               parent.question, parent.recommendation, parent.concern,
                               parent.unique_id),
        // null when the edge carries none of the tracked properties at all.
        // Note this is NOT a clean "has a rel model" test: governance stamps
        // added_date on is_sourced_from, so 102 of those edges project a
        // non-null edge_props whose year arrays are simply empty. The question
        // "does this edge scope years?" is answered by year_scoped below, which
        // is the field consumers should branch on.
        edge_props: CASE
          WHEN r.included_in_years IS NULL AND r.excluded_from_years IS NULL
           AND r.added_date IS NULL AND r.modified_date IS NULL AND r.added_by IS NULL
          THEN null
          ELSE { included_in_years: coalesce(r.included_in_years, []),
                 excluded_from_years: coalesce(r.excluded_from_years, []),
                 added_date: toString(r.added_date),
                 modified_date: toString(r.modified_date),
                 added_by: r.added_by } END,
        year_scoped: size(coalesce(r.included_in_years, []))
                   + size(coalesce(r.excluded_from_years, [])) > 0,
        // Resolved here so the client never parses a composite year_identifier —
        // the thing YEAR_PREFIX_LENGTH exists to prevent.
        yse: CASE WHEN parent:YearSuccessEvidence THEN {
          year_identifier: parent.year_identifier,
          year: head([ (parent)-[:evidence_in_year]->(y:AcademicYear) | y.name ]),
          campus: head([ (parent)-[:evidence_at_campus]->(c:Campus) | c.abbreviation ]),
          indicator: head([ (parent)-[:tracks]->(si:SuccessIndicator) | si.composite_key ])
        } ELSE null END
      } ]
"""

_FILE = """
      file: head([ (n)-[:has_file]->(sf:StoredFile) | {
        storage_key: sf.storage_key,
        original_filename: sf.original_filename,
        content_type: sf.content_type,
        size: sf.size,
        download_url: '/ati/data-api/v1/files/' + sf.storage_key +
          CASE WHEN sf.original_filename IS NULL THEN ''
               ELSE '?name=' + apoc.text.urlencode(sf.original_filename) END,
        // StoredFile is content-addressed, so one blob can back several records.
        shared_by: size([ (sf)<-[:has_file]-(o) | o ])
      } ])
"""

# Per-type field blocks. Everything outside these is shared.
_EXTRA = {
    "documents": """
      hash: n.hash,
      file_path: n.file_path,
      uri_path: n.uri_path,
      description: n.description,
      is_administrative_review_documentation: %(tri_admin)s,
      is_milestone_and_measures_documentation: %(tri_mm)s,
      has_location: (n.uri_path IS NOT NULL AND n.uri_path <> '')
                 OR (n.file_path IS NOT NULL AND n.file_path <> '')
                 OR EXISTS { (n)-[:has_file]->(:StoredFile) },
      %(file)s,
    """,
    "webpages": """
      url: n.url,
      description: n.description,
      no_longer_exists: %(tri_gone)s,
      has_location: n.url IS NOT NULL AND n.url <> '',
    """,
    "notes": """
      date_created: toString(n.date_created),
      content_preview: left(coalesce(n.content, ''), 240),
      content_length: size(coalesce(n.content, '')),
      has_location: false,
    """,
    "messages": """
      message_type: n.type,
      date_created: toString(n.date_created),
      content_preview: left(coalesce(n.content, ''), 240),
      content_length: size(coalesce(n.content, '')),
      file_path: n.file_path,
      uri_path: n.uri_path,
      has_location: (n.uri_path IS NOT NULL AND n.uri_path <> '')
                 OR (n.file_path IS NOT NULL AND n.file_path <> ''),
      %(file)s,
    """,
    "metrics": """
      composite_key: n.composite_key,
      metric_type: n.metric_type,
      description: n.description,
      single_value: n.single_value,
      comment: n.comment,
      has_location: (n.uri_path IS NOT NULL AND n.uri_path <> '')
                 OR (n.file_path IS NOT NULL AND n.file_path <> ''),
      file_path: n.file_path,
      uri_path: n.uri_path,
      %(file)s,
    """,
}

# Labels that actually declare `depreciated` — Metric does not, and emitting a
# synthetic false there would make the UI offer a switch that silently no-ops.
_HAS_DEPRECATED = {"documents", "webpages", "notes", "messages"}


def _projection(doc_type):
    label = DOC_TYPE_TO_LABEL[doc_type]
    extra = _EXTRA[doc_type] % {
        "tri_admin": _tri("n.is_administrative_review_documentation"),
        "tri_mm": _tri("n.is_milestone_and_measures_documentation"),
        "tri_gone": _tri("n.no_longer_exists"),
        "file": _FILE.strip().rstrip(","),
    }

    if doc_type in _HAS_DEPRECATED:
        deprecated_block = (
            f"depreciated: {_tri('n.depreciated')},\n"
            "      depreciated_date: toString(n.depreciated_date),\n"
        )
    else:
        deprecated_block = ""

    integrity_checks = [
        f"CASE WHEN {_dirty_bool('n.include_in_report')} "
        "THEN 'string_boolean:include_in_report' END",
    ]
    if doc_type in _HAS_DEPRECATED:
        integrity_checks += [
            f"CASE WHEN {_dirty_bool('n.depreciated')} "
            "THEN 'string_boolean:depreciated' END",
            f"CASE WHEN {_dirty_date('n.depreciated_date')} "
            "THEN 'unparseable_date:depreciated_date' END",
            f"CASE WHEN n.depreciated_date IS NOT NULL "
            f"AND coalesce({_tri('n.depreciated')}, false) = false "
            "THEN 'depreciated_date_without_flag' END",
        ]
    if doc_type == "documents":
        integrity_checks += [
            f"CASE WHEN {_dirty_bool('n.is_administrative_review_documentation')} "
            "THEN 'string_boolean:is_administrative_review_documentation' END",
            f"CASE WHEN {_dirty_bool('n.is_milestone_and_measures_documentation')} "
            "THEN 'string_boolean:is_milestone_and_measures_documentation' END",
        ]
    if doc_type == "webpages":
        integrity_checks.append(
            f"CASE WHEN {_dirty_bool('n.no_longer_exists')} "
            "THEN 'string_boolean:no_longer_exists' END"
        )
    if doc_type in ("notes", "messages"):
        integrity_checks.append(
            f"CASE WHEN {_dirty_date('n.date_created')} "
            "THEN 'unparseable_date:date_created' END"
        )
    integrity_checks.append(
        "CASE WHEN coalesce(n.name, '') = '' AND coalesce(n.url, '') = '' "
        "THEN 'missing_title' END"
    )

    stored_keys = ["include_in_report"]
    if doc_type in _HAS_DEPRECATED:
        stored_keys.append("depreciated")
    if doc_type == "documents":
        stored_keys += [
            "is_administrative_review_documentation",
            "is_milestone_and_measures_documentation",
        ]
    if doc_type == "webpages":
        stored_keys.append("no_longer_exists")
    stored = ", ".join(f"{key}: toString(n.{key})" for key in stored_keys)

    return f"""
    MATCH (n:{label})
    WHERE $unique_id IS NULL OR n.unique_id = $unique_id
    RETURN apoc.convert.toJson(collect({{
      doc_type: '{doc_type}',
      unique_id: n.unique_id,
      name: n.name,
      // Computed ONCE, so no consumer re-derives it and gets it wrong. Webpage
      // has no `title` property — reaching for one is a real bug elsewhere.
      title: coalesce(n.name, n.url, n.composite_key, n.unique_id),
      include_in_report: coalesce({_tri('n.include_in_report')}, true),
      // "Never set" is a distinct audit state from "explicitly false".
      include_in_report_set: n.include_in_report IS NOT NULL,
      {deprecated_block}
      raw_text_captured: toString(n.raw_text_captured),
      has_raw_text: n.raw_text IS NOT NULL AND n.raw_text <> '',
      raw_text: CASE WHEN $include_text THEN n.raw_text ELSE null END,
      content: CASE WHEN $include_text THEN n.content ELSE null END,
      {extra}
      maintained_by: head([ (n)-[:maintained_by]->(m:Person) |
        {{ unique_id: m.unique_id, name: m.name, email: m.email }} ]),
      created_by: head([ (n)-[:created_by]->(c:Person) |
        {{ unique_id: c.unique_id, name: c.name, email: c.email }} ]),
      // Raw echo, so the view can say "this literally stores the string 'False'"
      // rather than pretending it was always a boolean.
      stored: {{ {stored} }},
      integrity: [x IN [{', '.join(integrity_checks)}] WHERE x IS NOT NULL],
      {_REFERENCED_BY.strip().rstrip(',')}
    }})) AS j
    """


# --------------------------------------------------------------------------- #
# Derivation                                                                  #
# --------------------------------------------------------------------------- #

def _derive(row):
    """Derived signals, computed from the arrays already projected — never from a
    second query, so a badge and the list it sits in cannot disagree."""
    refs = row.get("referenced_by") or []
    parents = {r.get("parent_id") for r in refs if r.get("parent_id")}

    row["reference_count"] = len(refs)
    # Distinct parents. Defensive rather than load-bearing: a parent COULD hold
    # the same Note via two rel-types (has_note + admin_review_note), which would
    # make reference_count over-count the blast radius. Checked 2026-08-22 —
    # zero such cases exist today, so the two numbers currently agree on every
    # row. Kept because it costs nothing and the fan-out warning should quote a
    # count of records, not of edges.
    row["parent_count"] = len(parents)
    row["orphaned"] = len(refs) == 0
    row["shared"] = len(parents) > 1
    row["reference_labels"] = sorted({
        r["parent_label"] for r in refs if r.get("parent_label")
    })
    row["rel_types"] = sorted({r["rel_type"] for r in refs if r.get("rel_type")})
    row["yse_parent_count"] = len({
        r["yse"]["year_identifier"]
        for r in refs
        if r.get("yse") and r["yse"].get("year_identifier")
    })

    # Same rule as app/public_reports/sanitize.py: a document is dead when
    # deprecated, a webpage when deprecated or gone. Notes/messages follow
    # deprecation only; Metric has no deprecation concept at all.
    row["dead"] = bool(row.get("depreciated")) or bool(row.get("no_longer_exists"))
    row["depreciation_unset"] = (
        "depreciated" in row and row.get("depreciated") is None
    )
    row["hidden_from_report"] = row.get("include_in_report") is False

    # The two states this view exists to surface.
    row["hidden_but_referenced"] = row["hidden_from_report"] and row["reference_count"] > 0
    row["dead_but_referenced"] = row["dead"] and row["reference_count"] > 0
    row["has_integrity_issue"] = bool(row.get("integrity"))
    return row


def _summarize(items):
    """Counts computed over the SAME rows that are returned, so
    summary['total'] == len(items) is an invariant rather than a hope."""
    summary = {
        "total": len(items),
        "by_type": {t: 0 for t in DOC_TYPES},
        "orphaned": 0,
        "shared": 0,
        "dead": 0,
        "hidden_from_report": 0,
        "hidden_but_referenced": 0,
        "dead_but_referenced": 0,
        "report_flag_unset": 0,
        "integrity_issues": 0,
        "with_managed_file": 0,
    }
    for item in items:
        summary["by_type"][item["doc_type"]] = summary["by_type"].get(item["doc_type"], 0) + 1
        for key in ("orphaned", "shared", "dead", "hidden_from_report",
                    "hidden_but_referenced", "dead_but_referenced"):
            if item.get(key):
                summary[key] += 1
        if item.get("include_in_report_set") is False:
            summary["report_flag_unset"] += 1
        if item.get("integrity"):
            summary["integrity_issues"] += 1
        if item.get("file"):
            summary["with_managed_file"] += 1
    return summary


def _type_capabilities():
    """Derived from the neomodel classes, never hardcoded — so the UI can't render
    a control for a property the schema doesn't have. Metric genuinely has no
    `depreciated`, and update_metric doesn't touch it, so a Deprecate switch there
    would be a no-op that reports success."""
    caps = {}
    for doc_type, cls in DOC_TYPE_TO_CLASS.items():
        props = set(cls.defined_properties(aliases=False, rels=False).keys())
        caps[doc_type] = {
            "label": DOC_TYPE_TO_LABEL[doc_type],
            "supports_depreciation": "depreciated" in props,
            "supports_no_longer_exists": "no_longer_exists" in props,
            "supports_file": "has_file" in cls.defined_properties(properties=False, rels=True),
            "has_url": "url" in props,
            "has_content": "content" in props,
            "editable_flags": sorted(
                p for p in ("include_in_report", "depreciated", "no_longer_exists")
                if p in props
            ),
        }
    return caps


def _run(doc_type, unique_id=None, include_text=False):
    rows, _meta = db.cypher_query(
        _projection(doc_type),
        {"unique_id": unique_id, "include_text": include_text},
    )
    items = json.loads(rows[0][0]) if rows and rows[0] and rows[0][0] else []
    return [_derive(item) for item in items]


# --------------------------------------------------------------------------- #
# Public reads                                                                #
# --------------------------------------------------------------------------- #

def get_documentation_collection(doc_types=None, include_text=False):
    """Every documentation node, with its references and derived signals.

    ~950 nodes at present. Deliberately unpaginated: both primary jobs (find
    before duplicating, audit report visibility) are set operations, and the
    moment `summary` comes from a different query than `items` the two can drift.
    Full text is withheld unless include_text — raw_text can be a whole document.
    """
    if doc_types:
        unknown = [t for t in doc_types if t not in DOC_TYPE_TO_CLASS]
        if unknown:
            raise ValidationError(
                f"Unknown documentation type(s): {', '.join(unknown)}. "
                f"Expected any of: {', '.join(DOC_TYPES)}."
            )
        wanted = list(doc_types)
    else:
        wanted = list(DOC_TYPES)

    items = []
    for doc_type in wanted:
        items.extend(_run(doc_type, include_text=include_text))

    return {
        "items": items,
        "summary": _summarize(items),
        "meta": {
            "types": wanted,
            "type_capabilities": _type_capabilities(),
            "include_text": bool(include_text),
        },
    }


def get_documentation_detail(doc_type, unique_id):
    """One node, with full text. Returns None when it doesn't exist."""
    if doc_type not in DOC_TYPE_TO_CLASS:
        raise ValidationError(
            f"Unknown documentation type '{doc_type}'. "
            f"Expected any of: {', '.join(DOC_TYPES)}."
        )
    items = _run(doc_type, unique_id=unique_id, include_text=True)
    return items[0] if items else None


# --------------------------------------------------------------------------- #
# Legacy reads — still serving GET /documents/<document_type>                  #
# --------------------------------------------------------------------------- #
#
# These intentionally no longer raise NotFoundError on an empty collection. An
# empty table is a valid answer; the previous version turned it into a 404 (and,
# because the raise sat inside the try, actually a 500).

def get_all_documents():
    return list(Document.nodes.all())


def get_all_webpages():
    return list(Webpage.nodes.all())


def get_all_notes():
    return list(Note.nodes.all())


def get_all_messages():
    return list(Message.nodes.all())


def get_all_metrics():
    return list(Metric.nodes.all())
