"""
PositionDescription — create/read/update/delete queries and the
/position-descriptions endpoint.

A PositionDescription anchors to exactly one Person (describes_position_of,
enforced by add_position_description) and holds PD documents and job notes.

Isolation: people, documents, notes, and PDs created here are named with the
sentinel year prefix (9999-9999...), mirroring the conftest convention for
non-year-scoped nodes (cleanup filters by that prefix and can never match
production data).
"""
import hashlib

import pytest
from neomodel import db

SENTINEL = "9999-9999"
FILE_KEY = hashlib.sha256(b"ati-test-position-description-file").hexdigest()
REPLACEMENT_FILE_KEY = hashlib.sha256(b"ati-test-position-description-file-v2").hexdigest()

PERSON_NAME = f"{SENTINEL} Test PD Holder"
PERSON_EMPLOYEE_ID = f"{SENTINEL}-emp-position-descriptions"
PD_NAME = f"{SENTINEL} Alt Media Coordinator PD"
OTHER_PD_NAME = f"{SENTINEL} Superseded Coordinator PD"
DOCUMENT_NAME = f"{SENTINEL} PD Document"
NOTE_NAME = f"{SENTINEL} PD Note"

pytestmark = [pytest.mark.integration, pytest.mark.api]


@pytest.fixture
def cleanup_position_descriptions(neo4j_connection):
    """After-test cleanup for sentinel-named PDs, documents, notes, and people."""
    yield
    for label in ("PositionDescription", "Document", "Note", "Person"):
        db.cypher_query(
            f"MATCH (n:{label}) WHERE n.name STARTS WITH $prefix DETACH DELETE n",
            {"prefix": SENTINEL},
        )
    db.cypher_query(
        "MATCH (sf:StoredFile) WHERE sf.storage_key IN $keys DETACH DELETE sf",
        {"keys": [FILE_KEY, REPLACEMENT_FILE_KEY]},
    )


@pytest.fixture
def test_person(cleanup_position_descriptions):
    from app.database.graph_schema import Person

    return Person(name=PERSON_NAME, employee_id=PERSON_EMPLOYEE_ID).save()


@pytest.fixture
def test_attachments(cleanup_position_descriptions):
    from app.database.graph_schema import Document, Note

    document = Document(name=DOCUMENT_NAME, uri_path=f"sentinel://{SENTINEL}/pd.pdf").save()
    note = Note(name=NOTE_NAME, content="Covers captioning intake.").save()
    return document, note


# --- Layer 3: create function -------------------------------------------------

def test_create_position_description(test_person, test_attachments):
    from app.database.queries.individuals.create import add_position_description

    document, note = test_attachments
    pd = add_position_description({
        "employee_id": PERSON_EMPLOYEE_ID,
        "name": PD_NAME,
        "description": "Coordinates alternate media production.",
        "effective_date": "2026-07-01",
        "document_ids": [document.unique_id],
        "note_ids": [note.unique_id],
    })

    serialized = pd.serialize()
    assert serialized["person"]["employee_id"] == PERSON_EMPLOYEE_ID
    assert serialized["effective_date"] == "2026-07-01"
    assert [d["name"] for d in serialized["documents"]] == [DOCUMENT_NAME]
    assert [n["name"] for n in serialized["notes"]] == [NOTE_NAME]
    assert serialized["depreciated"] is False


def test_create_validation_and_missing_targets(test_person):
    from app.database.queries.individuals.create import add_position_description
    from app.endpoints.data_api.errors.custom_exceptions import NotFoundError, ValidationError

    with pytest.raises(ValidationError):
        add_position_description({"employee_id": PERSON_EMPLOYEE_ID, "name": "   "})

    with pytest.raises(ValidationError):
        add_position_description({"name": PD_NAME})

    with pytest.raises(NotFoundError):
        add_position_description({"employee_id": f"{SENTINEL}-nobody", "name": PD_NAME})

    with pytest.raises(NotFoundError):
        add_position_description({
            "employee_id": PERSON_EMPLOYEE_ID,
            "name": PD_NAME,
            "document_ids": ["no-such-document"],
        })


def test_create_with_uploaded_file(test_person):
    from app.database.queries.individuals.create import add_position_description

    pd = add_position_description({
        "employee_id": PERSON_EMPLOYEE_ID,
        "name": PD_NAME,
        "storage_key": FILE_KEY,
        "original_filename": "pd.pdf",
        "content_type": "application/pdf",
        "size": 12,
        "uploaded_by": PERSON_EMPLOYEE_ID,
    })

    block = pd.serialize()["file"]
    assert block is not None
    assert block["storage_key"] == FILE_KEY
    assert block["download_url"] == f"/ati/data-api/v1/files/{FILE_KEY}?name=pd.pdf"


# --- Layer 4: read / update / delete queries ----------------------------------

def test_read_ordering_and_person_projection(test_person):
    from app.database.queries.individuals.create import add_position_description
    from app.database.queries.individuals.read import get_position_descriptions_for_person

    add_position_description({
        "employee_id": PERSON_EMPLOYEE_ID,
        "name": OTHER_PD_NAME,
        "effective_date": "2024-07-01",
        "depreciated": True,
    })
    add_position_description({
        "employee_id": PERSON_EMPLOYEE_ID,
        "name": PD_NAME,
        "effective_date": "2026-07-01",
    })

    records = get_position_descriptions_for_person(PERSON_EMPLOYEE_ID)
    assert [r["name"] for r in records] == [PD_NAME, OTHER_PD_NAME]

    # Person serialization carries the light projection.
    from app.database.graph_schema import Person
    person = Person.nodes.get(employee_id=PERSON_EMPLOYEE_ID)
    projected = {pd["name"]: pd["depreciated"] for pd in person.serialize()["position_descriptions"]}
    assert projected == {PD_NAME: False, OTHER_PD_NAME: True}


def test_update_replace_semantics_and_preserve(test_person, test_attachments):
    from app.database.queries.individuals.create import add_position_description
    from app.database.queries.individuals.update import update_position_description

    document, note = test_attachments
    pd = add_position_description({
        "employee_id": PERSON_EMPLOYEE_ID,
        "name": PD_NAME,
        "description": "Original description.",
        "document_ids": [document.unique_id],
    })

    # Absent keys preserve; note_ids replaces the (empty) note set.
    updated = update_position_description(pd.unique_id, {
        "note_ids": [note.unique_id],
        "depreciated": True,
        "depreciated_date": "2026-08-31",
    }).serialize()
    assert updated["description"] == "Original description."
    assert [d["name"] for d in updated["documents"]] == [DOCUMENT_NAME]
    assert [n["name"] for n in updated["notes"]] == [NOTE_NAME]
    assert updated["depreciated"] is True

    # document_ids with an empty list unlinks the document.
    cleared = update_position_description(pd.unique_id, {"document_ids": []}).serialize()
    assert cleared["documents"] == []
    assert [n["name"] for n in cleared["notes"]] == [NOTE_NAME]


def test_update_replaces_and_unlinks_the_file(test_person):
    from app.database.graph_schema import StoredFile
    from app.database.queries.individuals.create import add_position_description
    from app.database.queries.individuals.update import update_position_description

    pd = add_position_description({
        "employee_id": PERSON_EMPLOYEE_ID,
        "name": PD_NAME,
        "storage_key": FILE_KEY,
        "original_filename": "pd.pdf",
    })

    replaced = update_position_description(pd.unique_id, {
        "storage_key": REPLACEMENT_FILE_KEY,
        "original_filename": "pd-v2.pdf",
    }).serialize()
    assert replaced["file"]["storage_key"] == REPLACEMENT_FILE_KEY

    # An explicit null unlinks; the StoredFile node survives for the orphan GC.
    unlinked = update_position_description(pd.unique_id, {"storage_key": None}).serialize()
    assert unlinked["file"] is None
    assert StoredFile.nodes.get_or_none(storage_key=REPLACEMENT_FILE_KEY) is not None


def test_delete_leaves_attachments(test_person, test_attachments):
    from app.database.graph_schema import Document, Note, PositionDescription
    from app.database.queries.individuals.create import add_position_description
    from app.database.queries.individuals.delete import delete_position_description
    from app.endpoints.data_api.errors.custom_exceptions import NotFoundError

    document, note = test_attachments
    pd = add_position_description({
        "employee_id": PERSON_EMPLOYEE_ID,
        "name": PD_NAME,
        "document_ids": [document.unique_id],
        "note_ids": [note.unique_id],
    })

    assert delete_position_description(pd.unique_id) is True
    assert PositionDescription.nodes.get_or_none(unique_id=pd.unique_id) is None
    # Linked documentation survives (delete = unlink).
    assert Document.nodes.get_or_none(unique_id=document.unique_id) is not None
    assert Note.nodes.get_or_none(unique_id=note.unique_id) is not None

    with pytest.raises(NotFoundError):
        delete_position_description(pd.unique_id)


# --- Layer 5: endpoint --------------------------------------------------------

def test_position_descriptions_endpoint_crud(flask_client, test_person, test_attachments):
    document, note = test_attachments

    created = flask_client.post("/ati/data-api/v1/position-descriptions", json={
        "action": "add_position_description",
        "employee_id": PERSON_EMPLOYEE_ID,
        "name": PD_NAME,
        "effective_date": "2026-07-01",
        "document_ids": [document.unique_id],
    })
    assert created.status_code == 201
    pd_id = created.get_json()["data"]["position_description"]["unique_id"]

    missing_person = flask_client.post("/ati/data-api/v1/position-descriptions", json={
        "action": "add_position_description",
        "employee_id": f"{SENTINEL}-nobody",
        "name": PD_NAME,
    })
    assert missing_person.status_code == 404

    listing = flask_client.get(
        f"/ati/data-api/v1/position-descriptions?employee_id={PERSON_EMPLOYEE_ID}")
    assert listing.status_code == 200
    assert [r["unique_id"] for r in listing.get_json()["data"]["items"]] == [pd_id]

    updated = flask_client.put(f"/ati/data-api/v1/position-descriptions/{pd_id}", json={
        "action": "update_position_description",
        "note_ids": [note.unique_id],
    })
    assert updated.status_code == 200
    body = updated.get_json()["data"]["position_description"]
    assert [n["name"] for n in body["notes"]] == [NOTE_NAME]
    assert [d["name"] for d in body["documents"]] == [DOCUMENT_NAME]

    detail = flask_client.get(f"/ati/data-api/v1/position-descriptions/{pd_id}")
    assert detail.status_code == 200
    assert detail.get_json()["data"]["position_description"]["person"]["name"] == PERSON_NAME

    deleted = flask_client.delete(f"/ati/data-api/v1/position-descriptions/{pd_id}")
    assert deleted.status_code == 200
    assert flask_client.get(f"/ati/data-api/v1/position-descriptions/{pd_id}").status_code == 404
