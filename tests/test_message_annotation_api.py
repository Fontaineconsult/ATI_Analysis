"""
Message annotation updates (the Annotations section on dashboard/{wg} indicator
views) — regression tests for the update_message path.

The bug: the FE edit form packs the creator as the raw read-path node wrapper
({properties: {...}}) inside message_dict, and the endpoint fed that dict to
Person.nodes.get(employee_id=...), which 404'd the WHOLE update for any message
with a creator — flipping "In Report" (or any field) silently did nothing. The
correct creator key is the endpoint payload's top-level created_by (an
employee_id string, possibly empty), mirroring how the note branch works.

Also covers the message_type mapping: the FE speaks `message_type`, the graph
property is `type` (the create path maps it; update must too).

Isolation: person + message carry the sentinel year prefix (9999-9999...) in
their unique keys; cleanup deletes exactly that prefix.
"""
import pytest
from neomodel import db

SENTINEL = "9999-9999"

PERSON_NAME = f"{SENTINEL} Test Message Author"
PERSON_EMPLOYEE_ID = f"{SENTINEL}-emp-messages"
MESSAGE_NAME = f"{SENTINEL} Test Annotation Message"

pytestmark = [pytest.mark.integration, pytest.mark.api]

API = "/ati/data-api/v1/documents/messages"


@pytest.fixture
def message_with_creator(neo4j_connection):
    from app.database.graph_schema import Message, Person

    person = Person(name=PERSON_NAME, employee_id=PERSON_EMPLOYEE_ID).save()
    message = Message(
        name=MESSAGE_NAME,
        content="original content",
        type="e-mail",
        include_in_report=True,
    ).save()
    message.created_by.connect(person)
    yield message, person
    db.cypher_query(
        "MATCH (m:Message) WHERE m.name STARTS WITH $prefix DETACH DELETE m",
        {"prefix": SENTINEL},
    )
    db.cypher_query(
        "MATCH (p:Person) WHERE p.name STARTS WITH $prefix DETACH DELETE p",
        {"prefix": SENTINEL},
    )


def _fe_shaped_payload(message, *, include_in_report, created_by_top=""):
    """Exactly what services/api/put.js updateMessage sends from the edit form."""
    return {
        "action": "update_message",
        "year_success_evidence": None,
        "created_by": created_by_top,
        "message_dict": {
            "unique_id": message.unique_id,
            "name": message.name,
            "content": "edited content",
            "message_type": "memo",
            "include_in_report": include_in_report,
            "depreciated": False,
            "depreciated_date": "",
            # The FE packs the read-path node wrapper here; the endpoint must
            # NOT treat this as an employee_id.
            "created_by": {"properties": {"name": PERSON_NAME, "employee_id": PERSON_EMPLOYEE_ID}},
        },
    }


def test_update_in_report_works_for_message_with_creator(flask_client, message_with_creator):
    message, _person = message_with_creator

    resp = flask_client.put(API, json=_fe_shaped_payload(message, include_in_report=False))
    assert resp.status_code == 200, resp.get_json()

    rows, _ = db.cypher_query(
        "MATCH (m:Message {unique_id: $uid}) RETURN m.include_in_report, m.content, m.type",
        {"uid": message.unique_id},
    )
    include_in_report, content, msg_type = rows[0]
    assert include_in_report is False, "the In Report toggle must persist"
    assert content == "edited content"
    assert msg_type == "memo", "FE message_type must map to the graph's type property"


def test_update_with_creator_string_rewires_created_by(flask_client, message_with_creator):
    message, person = message_with_creator

    resp = flask_client.put(
        API,
        json=_fe_shaped_payload(message, include_in_report=True, created_by_top=PERSON_EMPLOYEE_ID),
    )
    assert resp.status_code == 200, resp.get_json()

    rows, _ = db.cypher_query(
        "MATCH (m:Message {unique_id: $uid})-[:created_by]->(p:Person) RETURN p.employee_id",
        {"uid": message.unique_id},
    )
    assert rows and rows[0][0] == person.employee_id
