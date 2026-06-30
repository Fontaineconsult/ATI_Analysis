"""Integration tests for StoredFile registration/linking (need a Neo4j connection).

Self-cleaning: each test deletes the StoredFile + Document it creates (try/finally via
the fixture teardown), using test-only SHA-256 keys that can't collide with real data.
Marked `integration`, so excluded from the default `-m "not integration"` / unit runs.
"""
import hashlib

import pytest

pytestmark = pytest.mark.integration


def _key(s: bytes) -> str:
    return hashlib.sha256(s).hexdigest()


@pytest.fixture
def tracked(neo4j_connection):
    """Collects created node ids/keys and removes them after the test."""
    created = {"keys": [], "doc_ids": []}
    yield created
    from app.database.graph_schema import Document, StoredFile
    for did in created["doc_ids"]:
        node = Document.nodes.get_or_none(unique_id=did)
        if node:
            node.delete()
    for key in created["keys"]:
        sf = StoredFile.nodes.get_or_none(storage_key=key)
        if sf:
            sf.delete()


def test_register_is_content_addressed_merge(tracked):
    from app.database.queries.files.create import register_stored_file
    key = _key(b"ati-test-register-merge")
    tracked["keys"].append(key)
    sf1 = register_stored_file(key, original_filename="a.pdf", content_type="application/pdf", size=5)
    sf2 = register_stored_file(key, original_filename="other.pdf")   # same bytes → same node
    assert sf1.storage_key == sf2.storage_key == key
    assert sf1.unique_id == sf2.unique_id                # MERGE, not a duplicate node
    assert sf2.original_filename == "a.pdf"              # first-seen metadata kept


def test_link_and_serialize(tracked):
    from app.database.graph_schema import Document
    from app.database.queries.files.create import link_file_to_node, register_stored_file
    key = _key(b"ati-test-link-serialize")
    tracked["keys"].append(key)
    doc = Document(name="ati-test-doc").save()
    tracked["doc_ids"].append(doc.unique_id)
    sf = register_stored_file(key, original_filename="report.pdf", content_type="application/pdf", size=9)
    link_file_to_node(doc, sf)
    block = doc.serialize()["file"]
    assert block is not None
    assert block["storage_key"] == key
    assert block["download_url"] == f"/ati/data-api/v1/files/{key}?name=report.pdf"


def test_find_orphans(tracked):
    from app.database.queries.files.create import register_stored_file
    from app.database.queries.files.read import find_orphan_stored_files
    key = _key(b"ati-test-orphan")
    tracked["keys"].append(key)
    register_stored_file(key)   # no has_file edge → orphan
    assert any(o["storage_key"] == key for o in find_orphan_stored_files())
