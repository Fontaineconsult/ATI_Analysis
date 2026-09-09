"""
Tests for the central Documentation read layer and its endpoint.

READ-ONLY. Every test here reads the live graph and writes nothing, so there is
no sentinel-year cleanup fixture — these are assertions about invariants the
projection must hold for whatever data happens to be there, not about specific
records. That is deliberate: the things most likely to break in
queries/documentation/read.py (a coercion that stops reporting itself, a derived
count that disagrees with the array it came from, a per-type field block that
drops out of the projection) are all properties of the shape, and a fixture-built
graph of three nodes would not exercise the 52 legacy string booleans or the
100-odd records that reach the graph only through is_sourced_from.

Anything asserting an exact count would be a test of today's data, so the
assertions are all relational: this number equals that number, this flag implies
that echo.
"""
import pytest
from neomodel import StructuredNode

from app.database import graph_schema
from app.database.queries.documentation.read import (
    DOC_TYPES,
    DOC_TYPE_TO_CLASS,
    DOC_TYPE_TO_LABEL,
    _type_capabilities,
    get_documentation_collection,
    get_documentation_detail,
)
from app.endpoints.data_api.documentation import SUPPORTED_TYPES
from app.endpoints.data_api.errors.custom_exceptions import ValidationError


# --------------------------------------------------------------------------- #
# Pure unit — no DB                                                           #
# --------------------------------------------------------------------------- #

@pytest.mark.unit
def test_endpoint_and_read_layer_agree_on_types():
    """The URL surface is documented in terms of these; a type added to the read
    layer must not silently fall out of the endpoint's contract."""
    assert SUPPORTED_TYPES == DOC_TYPES
    assert set(DOC_TYPES) == set(DOC_TYPE_TO_CLASS)


@pytest.mark.unit
def test_unknown_type_is_a_validation_error_not_a_query():
    with pytest.raises(ValidationError):
        get_documentation_collection(doc_types=["documents", "widgets"])
    with pytest.raises(ValidationError):
        get_documentation_detail("widgets", "anything")


# The attachment facet in the Documentation UI groups these into families
# (ATTACHMENT_FAMILIES in documentationConfig.js). The JS side cannot see the
# neomodel schema, so this is where drift gets caught: give any node type a
# RelationshipTo a documentation class and this fails, naming the label that now
# needs a family. The mirror assertion lives in documentationConfig.test.js.
ATTACHABLE_LABELS = {
    # implementations
    "Process", "Project", "Procedure", "Service", "Guidance", "InternalPolicy", "Tracking",
    # governance
    "Law", "Case", "Directive", "ExternalPolicy", "Memo", "Guideline",
    # evidence
    "YearSuccessEvidence", "SuccessIndicator", "StatusLevel",
    # plans & minutes
    "CampusPlan", "WorkingGroupPlan", "Plan", "ProgressUpdate", "Accomplishment",
    "MeetingMinutes",
    # assets
    "Asset", "Interface", "Component", "Tool", "TAAP",
    # open questions
    "Query",
    # people
    "PositionDescription",
}


def _labels_that_can_attach_to_documentation():
    """Every node class declaring a RelationshipTo one of the five doc classes.

    StoredFile is excluded: its `has_file` relationships are RelationshipFrom
    declarations mirroring an edge that points FROM a document, so a StoredFile
    is a location, not a parent. The documentation classes themselves are
    excluded for the same reason — Webpage.notes points outward.
    """
    doc_labels = set(DOC_TYPE_TO_LABEL.values())
    attachable = set()
    for name in dir(graph_schema):
        cls = getattr(graph_schema, name)
        if not isinstance(cls, type) or not issubclass(cls, StructuredNode):
            continue
        if cls is StructuredNode or cls.__name__ != name:
            continue
        if cls.__name__ in doc_labels or cls.__name__ == "StoredFile":
            continue
        rels = cls.defined_properties(aliases=False, properties=False, rels=True)
        if any(getattr(d, "_raw_class", None) in doc_labels for d in rels.values()):
            attachable.add(cls.__name__)
    return attachable


@pytest.mark.unit
def test_attachable_labels_match_the_frontend_families():
    assert _labels_that_can_attach_to_documentation() == ATTACHABLE_LABELS


@pytest.mark.unit
def test_capabilities_are_derived_from_the_schema():
    """Metric genuinely has no `depreciated`, so a Deprecate control there would
    be a no-op that reports success. The capability map must say so, and must say
    it because the class says so — not because someone typed it."""
    caps = _type_capabilities()
    assert set(caps) == set(DOC_TYPES)

    assert caps["metrics"]["supports_depreciation"] is False
    assert "depreciated" not in caps["metrics"]["editable_flags"]
    assert caps["webpages"]["supports_no_longer_exists"] is True
    assert caps["notes"]["supports_no_longer_exists"] is False

    # The source-text mirror exists only on the two artifact types.
    assert caps["documents"]["supports_raw_text"] is True
    assert caps["webpages"]["supports_raw_text"] is True
    for doc_type in ("notes", "messages", "metrics"):
        assert caps[doc_type]["supports_raw_text"] is False

    for doc_type, cap in caps.items():
        cls = DOC_TYPE_TO_CLASS[doc_type]
        props = set(cls.defined_properties(aliases=False, rels=False).keys())
        assert cap["label"] == DOC_TYPE_TO_LABEL[doc_type]
        assert cap["supports_depreciation"] == ("depreciated" in props)
        assert cap["supports_raw_text"] == ("raw_text" in props)
        assert set(cap["editable_flags"]) <= props


# --------------------------------------------------------------------------- #
# Read layer — live graph                                                     #
# --------------------------------------------------------------------------- #

@pytest.fixture(scope="module")
def collection(neo4j_connection):
    """One fetch for the whole module — this read is ~1k nodes and every test
    below asserts about the same payload."""
    return get_documentation_collection()


@pytest.mark.integration
def test_collection_shape(collection):
    assert set(collection) == {"items", "summary", "meta"}
    assert collection["meta"]["types"] == list(DOC_TYPES)
    assert collection["meta"]["include_text"] is False
    assert set(collection["meta"]["type_capabilities"]) == set(DOC_TYPES)
    assert collection["items"], "expected a non-empty graph to read"


@pytest.mark.integration
def test_every_type_projects_its_own_fields(collection):
    """A per-type field block silently dropping out of the projection is the
    failure this catches — the collection would still return rows, just thinner."""
    by_type = {}
    for item in collection["items"]:
        by_type.setdefault(item["doc_type"], []).append(item)

    assert set(by_type) <= set(DOC_TYPES)

    required = {
        "documents": {"file_path", "uri_path", "hash", "has_location", "file"},
        "webpages": {"url", "no_longer_exists", "has_location"},
        "notes": {"date_created", "content_preview", "content_length"},
        "messages": {"message_type", "date_created", "content_preview", "file"},
        "metrics": {"composite_key", "metric_type", "single_value", "comment"},
    }
    for doc_type, items in by_type.items():
        for key in required[doc_type]:
            assert key in items[0], f"{doc_type} lost {key} from the projection"


@pytest.mark.integration
def test_summary_is_computed_over_the_returned_rows(collection):
    """summary['total'] == len(items) is the invariant the docstring claims; the
    per-key counts must come from the same array, not a second query."""
    items, summary = collection["items"], collection["summary"]
    assert summary["total"] == len(items)
    assert sum(summary["by_type"].values()) == len(items)

    for key in ("orphaned", "shared", "dead", "hidden_from_report",
                "hidden_but_referenced", "dead_but_referenced"):
        assert summary[key] == sum(1 for i in items if i.get(key)), key
    assert summary["integrity_issues"] == sum(1 for i in items if i.get("integrity"))
    assert summary["report_flag_unset"] == sum(
        1 for i in items if i.get("include_in_report_set") is False
    )


@pytest.mark.integration
def test_derived_signals_agree_with_the_arrays_they_came_from(collection):
    for item in collection["items"]:
        refs = item["referenced_by"]
        assert item["reference_count"] == len(refs)
        assert item["parent_count"] == len({r["parent_id"] for r in refs if r["parent_id"]})
        assert item["orphaned"] is (item["reference_count"] == 0)
        assert item["shared"] is (item["parent_count"] > 1)
        assert item["reference_labels"] == sorted(
            {r["parent_label"] for r in refs if r.get("parent_label")}
        )
        assert item["rel_types"] == sorted({r["rel_type"] for r in refs if r.get("rel_type")})


@pytest.mark.integration
def test_references_are_matched_untyped(collection):
    """Enumerating rel-types is how the old orphan query came to report the
    records that reach the graph only through is_sourced_from. If this projection
    ever starts filtering, those edges vanish and this fails."""
    rel_types = {r for i in collection["items"] for r in i["rel_types"]}
    assert "is_documented_by" in rel_types
    assert "is_sourced_from" in rel_types, "untyped inbound match appears to have been narrowed"
    assert "has_note" in rel_types


@pytest.mark.integration
def test_booleans_are_tri_state_and_coercion_is_reported(collection):
    """Every flag reaches the client as a real bool or None — and any value that
    had to be coerced from a legacy string says so in `integrity` AND echoes the
    stored value verbatim in `stored`. Silent normalisation is the bug."""
    for item in collection["items"]:
        assert isinstance(item["include_in_report"], bool)
        assert isinstance(item["include_in_report_set"], bool)
        if "depreciated" in item:
            assert item["depreciated"] is None or isinstance(item["depreciated"], bool)

        for code in item["integrity"]:
            family, _, field = code.partition(":")
            if family != "string_boolean":
                continue
            stored = item["stored"][field]
            assert stored is not None
            # toString() of a real boolean is 'true'/'false'; anything else is
            # the legacy string this code exists to announce.
            assert stored not in ("true", "false"), (
                f"{item['unique_id']} flagged {code} but stored a clean boolean"
            )


@pytest.mark.integration
def test_titles_and_locations_are_computed_once(collection):
    """Webpage has no `title` property — the projection coalesces one, and every
    consumer depends on that rather than reaching for a field that isn't there."""
    for item in collection["items"]:
        assert item["title"], f"{item['doc_type']} {item['unique_id']} has no title"
        assert isinstance(item["has_location"], bool)
    assert all(i["has_location"] is False for i in collection["items"]
               if i["doc_type"] == "notes"), "a Note cannot have a location"


@pytest.mark.integration
def test_full_text_is_withheld_from_the_collection(collection):
    """raw_text can be an entire document; the index is ~1k rows."""
    assert all(i["raw_text"] is None for i in collection["items"])
    assert any(i["has_raw_text"] for i in collection["items"]), (
        "expected some captured source text — has_raw_text may have stopped projecting"
    )


@pytest.mark.integration
def test_type_narrowing(neo4j_connection):
    payload = get_documentation_collection(doc_types=["metrics"])
    assert payload["meta"]["types"] == ["metrics"]
    assert {i["doc_type"] for i in payload["items"]} <= {"metrics"}
    assert payload["summary"]["total"] == len(payload["items"])


@pytest.mark.integration
def test_detail_returns_one_record_with_its_text(collection):
    source = next(i for i in collection["items"] if i["has_raw_text"])
    detail = get_documentation_detail(source["doc_type"], source["unique_id"])

    assert detail["unique_id"] == source["unique_id"]
    assert detail["reference_count"] == source["reference_count"]
    assert detail["raw_text"], "detail must include the text the collection withholds"


@pytest.mark.integration
def test_detail_missing_id_is_none_not_an_error(neo4j_connection):
    assert get_documentation_detail("documents", "no-such-unique-id") is None


# --------------------------------------------------------------------------- #
# Endpoint                                                                    #
# --------------------------------------------------------------------------- #

@pytest.mark.api
@pytest.mark.integration
def test_get_documentation(flask_client):
    response = flask_client.get("/ati/data-api/v1/documentation")
    assert response.status_code == 200
    body = response.get_json()
    assert body["status"] == "success"
    assert set(body["data"]) == {"items", "summary", "meta"}
    assert body["data"]["summary"]["total"] == len(body["data"]["items"])


@pytest.mark.api
@pytest.mark.integration
def test_get_documentation_filtered_by_type(flask_client):
    response = flask_client.get("/ati/data-api/v1/documentation?types=documents,webpages")
    assert response.status_code == 200
    data = response.get_json()["data"]
    assert data["meta"]["types"] == ["documents", "webpages"]
    assert {i["doc_type"] for i in data["items"]} <= {"documents", "webpages"}


@pytest.mark.api
@pytest.mark.integration
def test_unknown_type_is_400(flask_client):
    response = flask_client.get("/ati/data-api/v1/documentation?types=widgets")
    assert response.status_code == 400
    assert response.get_json()["status"] == "error"


@pytest.mark.api
@pytest.mark.integration
def test_get_one_record(flask_client):
    index = flask_client.get("/ati/data-api/v1/documentation?types=webpages").get_json()
    sample = index["data"]["items"][0]

    response = flask_client.get(
        f"/ati/data-api/v1/documentation/webpages/{sample['unique_id']}"
    )
    assert response.status_code == 200
    assert response.get_json()["data"]["unique_id"] == sample["unique_id"]


@pytest.mark.api
@pytest.mark.integration
def test_missing_record_is_404(flask_client):
    response = flask_client.get(
        "/ati/data-api/v1/documentation/documents/no-such-unique-id"
    )
    assert response.status_code == 404
    assert response.get_json()["status"] == "error"


@pytest.mark.api
@pytest.mark.integration
def test_documentation_is_read_only(flask_client):
    """No POST/PUT/DELETE, by design — documentation is created and re-pointed
    from the surfaces that own the parent context."""
    for method in (flask_client.post, flask_client.put, flask_client.delete):
        assert method("/ati/data-api/v1/documentation").status_code == 405
