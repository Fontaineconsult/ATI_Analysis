"""
IntellectualSource: provenance fields and the `informs` edge.

Test data is named with a sentinel prefix and torn down by unique_id, so nothing here
can touch a real source. IntellectualSource has no academic year to scope by, which is
why the fixture tracks what it created rather than filtering by a year prefix.
"""
from datetime import date

import pytest

SENTINEL = "ZZ-TEST-SOURCE"


@pytest.fixture
def cleanup_sources(neo4j_connection):
    """Delete every node this test created, by name prefix. Cannot match a real source."""
    created = []
    yield created
    from neomodel import db

    db.cypher_query(
        "MATCH (s:IntellectualSource) WHERE s.name STARTS WITH $p DETACH DELETE s",
        {"p": SENTINEL},
    )


@pytest.fixture
def sentinel_implementation(neo4j_connection):
    """A throwaway Process to hang an informs edge on."""
    from neomodel import db

    rows, _ = db.cypher_query(
        "CREATE (p:Process {unique_id: randomUUID(), title: $t}) RETURN p.unique_id",
        {"t": f"{SENTINEL} implementation"},
    )
    uid = rows[0][0]
    yield uid
    db.cypher_query("MATCH (p:Process {unique_id:$u}) DETACH DELETE p", {"u": uid})


# --- provenance fields --------------------------------------------------------------

@pytest.mark.integration
def test_create_carries_provenance_and_stamps_capture_date(cleanup_sources):
    from app.database.queries.intellectual_sources.create import create_intellectual_source

    node = create_intellectual_source({
        "name": f"{SENTINEL} with provenance",
        "description_short": "short",
        "url": "https://example.org/source",
        "raw_text": "the mirrored text",
        "author": "A. Author",
        "publisher": "A Publisher",
        "published_date": "2020-01-15",
        "citation": "A. Author, 2020.",
    })
    cleanup_sources.append(node.unique_id)

    assert node.url == "https://example.org/source"
    assert node.author == "A. Author"
    assert node.published_date == date(2020, 1, 15)
    # Stamped by the query layer, not taken from the caller.
    assert node.raw_text_captured == date.today()


@pytest.mark.integration
def test_create_without_raw_text_leaves_capture_date_unset(cleanup_sources):
    from app.database.queries.intellectual_sources.create import create_intellectual_source

    node = create_intellectual_source({"name": f"{SENTINEL} no text"})
    cleanup_sources.append(node.unique_id)
    assert node.raw_text is None
    assert node.raw_text_captured is None


@pytest.mark.integration
def test_bad_published_date_is_a_validation_error(cleanup_sources):
    from app.database.queries.intellectual_sources.create import create_intellectual_source
    from app.endpoints.data_api.errors.custom_exceptions import ValidationError

    with pytest.raises(ValidationError):
        create_intellectual_source({"name": f"{SENTINEL} bad date", "published_date": "15-01-2020"})


@pytest.mark.integration
def test_capture_date_moves_only_when_the_text_changes(cleanup_sources):
    """An unrelated edit must not make a stale mirror look freshly captured."""
    from app.database.queries.intellectual_sources.create import create_intellectual_source
    from app.database.queries.intellectual_sources.update import update_intellectual_source
    from neomodel import db

    node = create_intellectual_source({"name": f"{SENTINEL} capture", "raw_text": "original"})
    cleanup_sources.append(node.unique_id)

    # Backdate the capture so a spurious re-stamp is visible.
    db.cypher_query(
        "MATCH (s:IntellectualSource {unique_id:$u}) SET s.raw_text_captured = date('2020-01-01')",
        {"u": node.unique_id},
    )

    # Editing another field leaves the capture date alone.
    update_intellectual_source(node.unique_id, {"author": "Someone"})
    after_unrelated = _captured(node.unique_id)
    assert after_unrelated == date(2020, 1, 1)

    # Re-sending identical text is not a change either.
    update_intellectual_source(node.unique_id, {"raw_text": "original"})
    assert _captured(node.unique_id) == date(2020, 1, 1)

    # Changing the text moves it.
    update_intellectual_source(node.unique_id, {"raw_text": "revised"})
    assert _captured(node.unique_id) == date.today()

    # Clearing the text clears the date.
    update_intellectual_source(node.unique_id, {"raw_text": ""})
    assert _captured(node.unique_id) is None


def _captured(uid):
    from neomodel import db

    rows, _ = db.cypher_query(
        "MATCH (s:IntellectualSource {unique_id:$u}) RETURN s.raw_text_captured", {"u": uid}
    )
    value = rows[0][0]
    if value is None:
        return None
    # The raw driver hands back an ISO string for a date property.
    return date.fromisoformat(str(value)) if isinstance(value, str) else date(
        value.year, value.month, value.day
    )


# --- the informs edge ---------------------------------------------------------------

@pytest.mark.integration
def test_informs_attaches_and_reads_back(cleanup_sources, sentinel_implementation):
    from app.database.queries.intellectual_sources.create import create_intellectual_source
    from app.database.queries.intellectual_sources.read import get_intellectual_source
    from app.database.queries.intellectual_sources.update import (
        attach_informed_implementation,
        detach_informed_implementation,
    )

    node = create_intellectual_source({"name": f"{SENTINEL} informs"})
    cleanup_sources.append(node.unique_id)

    attach_informed_implementation(node.unique_id, sentinel_implementation)
    read = get_intellectual_source(node.unique_id)
    titles = [i["title"] for i in read["informed_implementations"]]
    assert f"{SENTINEL} implementation" in titles
    assert read["informed_implementations"][0]["label"] == "Process"

    # Idempotent: MERGE, so a second attach does not double the edge.
    attach_informed_implementation(node.unique_id, sentinel_implementation)
    assert len(get_intellectual_source(node.unique_id)["informed_implementations"]) == 1

    detach_informed_implementation(node.unique_id, sentinel_implementation)
    assert get_intellectual_source(node.unique_id)["informed_implementations"] == []


@pytest.mark.integration
def test_informs_refuses_a_non_implementation_target(cleanup_sources):
    """A typo must not wire a source to a Person or a YSE."""
    from app.database.queries.intellectual_sources.create import create_intellectual_source
    from app.database.queries.intellectual_sources.update import attach_informed_implementation
    from app.endpoints.data_api.errors.custom_exceptions import NotFoundError, ValidationError
    from neomodel import db

    node = create_intellectual_source({"name": f"{SENTINEL} wrong target"})
    cleanup_sources.append(node.unique_id)

    rows, _ = db.cypher_query("MATCH (p:Person) RETURN p.unique_id LIMIT 1")
    if rows:
        with pytest.raises(ValidationError):
            attach_informed_implementation(node.unique_id, rows[0][0])

    with pytest.raises(NotFoundError):
        attach_informed_implementation(node.unique_id, "no-such-node-id")


@pytest.mark.integration
def test_list_carries_edge_counts(cleanup_sources, sentinel_implementation):
    from app.database.queries.intellectual_sources.create import create_intellectual_source
    from app.database.queries.intellectual_sources.read import get_all_intellectual_sources
    from app.database.queries.intellectual_sources.update import attach_informed_implementation

    node = create_intellectual_source({"name": f"{SENTINEL} counted"})
    cleanup_sources.append(node.unique_id)
    attach_informed_implementation(node.unique_id, sentinel_implementation)

    row = next(s for s in get_all_intellectual_sources() if s["unique_id"] == node.unique_id)
    assert row["informs_count"] == 1
    assert row["source_count"] == 0


# --- endpoint ------------------------------------------------------------------------

@pytest.mark.api
@pytest.mark.integration
def test_put_action_dispatch(flask_client, cleanup_sources, sentinel_implementation):
    created = flask_client.post("/ati/data-api/v1/intellectual-sources", json={
        "name": f"{SENTINEL} endpoint", "url": "https://example.org/e",
    })
    assert created.status_code == 201
    uid = created.get_json()["data"]["item"]["unique_id"]
    cleanup_sources.append(uid)

    linked = flask_client.put("/ati/data-api/v1/intellectual-sources", json={
        "action": "attach_informed_implementation",
        "unique_id": uid,
        "implementation_unique_id": sentinel_implementation,
    })
    assert linked.status_code == 200
    assert len(linked.get_json()["data"]["item"]["informed_implementations"]) == 1

    # No action still patches fields, which is what this endpoint did before.
    patched = flask_client.put("/ati/data-api/v1/intellectual-sources", json={
        "unique_id": uid, "author": "Patched Author",
    })
    assert patched.status_code == 200
    assert patched.get_json()["data"]["item"]["author"] == "Patched Author"

    unknown = flask_client.put("/ati/data-api/v1/intellectual-sources", json={
        "unique_id": uid, "action": "not_a_real_action",
    })
    assert unknown.status_code == 400


# --- source pages and their own text -------------------------------------------------

@pytest.fixture
def sentinel_page(neo4j_connection):
    """A throwaway Webpage to hang is_sourced_from on."""
    from neomodel import db

    rows, _ = db.cypher_query(
        "CREATE (w:Webpage {unique_id: randomUUID(), name: $n, url: $u}) RETURN w.unique_id",
        {"n": f"{SENTINEL} page", "u": f"https://example.invalid/{SENTINEL}"},
    )
    uid = rows[0][0]
    yield uid
    db.cypher_query("MATCH (w:Webpage {unique_id:$u}) DETACH DELETE w", {"u": uid})


@pytest.mark.integration
def test_source_pages_carry_their_own_text_status(cleanup_sources, sentinel_page):
    """A synthesized source keeps its text on its pages, so the read has to report each
    page's text separately from the node's."""
    from neomodel import db

    from app.database.queries.intellectual_sources.create import create_intellectual_source
    from app.database.queries.intellectual_sources.read import (
        get_all_intellectual_sources,
        get_intellectual_source,
    )

    node = create_intellectual_source({"name": f"{SENTINEL} synthesized"})
    cleanup_sources.append(node.unique_id)
    db.cypher_query(
        "MATCH (s:IntellectualSource {unique_id:$s}) MATCH (w:Webpage {unique_id:$w}) "
        "MERGE (s)-[:is_sourced_from]->(w)",
        {"s": node.unique_id, "w": sentinel_page},
    )

    read = get_intellectual_source(node.unique_id)
    assert len(read["sources"]) == 1
    page = read["sources"][0]
    assert page["label"] == "Webpage"
    assert page["text_length"] == 0
    assert page["raw_text_captured"] is None

    # The list counts the gap, so a synthesized source is not marked unread forever.
    row = next(s for s in get_all_intellectual_sources() if s["unique_id"] == node.unique_id)
    assert row["source_count"] == 1
    assert row["sources_without_text"] == 1

    # Fill the page the way the modal does, then the gap closes.
    from app.database.queries.documentation.update import update_webpage

    update_webpage({"unique_id": sentinel_page, "raw_text": "what the page says"})

    read = get_intellectual_source(node.unique_id)
    assert read["sources"][0]["text_length"] == len("what the page says")
    assert read["sources"][0]["raw_text_captured"] is not None
    row = next(s for s in get_all_intellectual_sources() if s["unique_id"] == node.unique_id)
    assert row["sources_without_text"] == 0


@pytest.mark.integration
def test_source_text_only_webpage_write_touches_nothing_else(cleanup_sources, sentinel_page):
    """The narrow write the modal uses. update_webpage's maintainer, year-inclusion and YSE
    side effects are all truthiness-guarded, so a text-only call must leave them alone."""
    from neomodel import db

    from app.database.queries.documentation.update import update_webpage

    update_webpage({"unique_id": sentinel_page, "raw_text": "text only"})

    rows, _ = db.cypher_query(
        "MATCH (w:Webpage {unique_id:$u}) RETURN w.raw_text, w.name, w.url, "
        "size([(w)<-[:maintained_by]-() | 1]) + size([(w)-[:maintained_by]->() | 1])",
        {"u": sentinel_page},
    )
    raw_text, name, url, maintainer_edges = rows[0]
    assert raw_text == "text only"
    assert name == f"{SENTINEL} page"          # untouched
    assert url == f"https://example.invalid/{SENTINEL}"
    assert maintainer_edges == 0               # no maintainer was invented
