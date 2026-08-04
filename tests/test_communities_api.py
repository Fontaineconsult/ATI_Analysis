"""
CommunityOfPractice — create/read/update/delete queries and the /communities +
/individuals endpoints.

Isolation: communities and people created here are named with the sentinel year
prefix (9999-9999...), mirroring the conftest convention for non-year-scoped
nodes (cleanup filters by that prefix and can never match production data).
"""
import pytest
from neomodel import db

SENTINEL = "9999-9999"

COMMUNITY_NAME = f"{SENTINEL} Test Library Community"
OTHER_COMMUNITY_NAME = f"{SENTINEL} Test Faculty Development Community"
PERSON_NAME = f"{SENTINEL} Test Community Member"
PERSON_EMPLOYEE_ID = f"{SENTINEL}-emp-communities"

pytestmark = [pytest.mark.integration, pytest.mark.api]


@pytest.fixture
def cleanup_communities(neo4j_connection):
    """After-test cleanup for sentinel-named communities and people."""
    yield
    db.cypher_query(
        "MATCH (c:CommunityOfPractice) WHERE c.name STARTS WITH $prefix DETACH DELETE c",
        {"prefix": SENTINEL},
    )
    db.cypher_query(
        "MATCH (p:Person) WHERE p.name STARTS WITH $prefix DETACH DELETE p",
        {"prefix": SENTINEL},
    )


@pytest.fixture
def test_person(cleanup_communities):
    from app.database.graph_schema import Person

    return Person(name=PERSON_NAME, employee_id=PERSON_EMPLOYEE_ID).save()


# --- Layer 3: create function -------------------------------------------------

def test_create_community_and_duplicate_rejection(cleanup_communities):
    from app.database.queries.communities.create import create_community
    from app.endpoints.data_api.errors.custom_exceptions import ValidationError

    community = create_community({"name": COMMUNITY_NAME, "description": "Cross-campus library folk"})
    assert community.unique_id
    assert community.name == COMMUNITY_NAME

    with pytest.raises(ValidationError):
        create_community({"name": COMMUNITY_NAME})

    with pytest.raises(ValidationError):
        create_community({"name": "   "})


# --- Layer 4: read + membership queries ---------------------------------------

def test_membership_replace_semantics(test_person):
    from app.database.queries.communities.create import create_community
    from app.database.queries.communities.read import get_community
    from app.database.queries.communities.update import set_person_communities

    library = create_community({"name": COMMUNITY_NAME})
    faculty_dev = create_community({"name": OTHER_COMMUNITY_NAME})

    set_person_communities(PERSON_EMPLOYEE_ID, [
        {"community_id": library.unique_id, "note": "alt-media liaison"},
        {"community_id": faculty_dev.unique_id},
    ])
    detail = get_community(library.unique_id)
    assert [m["name"] for m in detail["members"]] == [PERSON_NAME]
    assert detail["members"][0]["note"] == "alt-media liaison"

    # Replace with a single membership — the other edge must be gone.
    set_person_communities(PERSON_EMPLOYEE_ID, [{"community_id": faculty_dev.unique_id}])
    assert get_community(library.unique_id)["members"] == []
    assert len(get_community(faculty_dev.unique_id)["members"]) == 1

    # Person serialization carries the memberships.
    from app.database.graph_schema import Person
    person = Person.nodes.get(employee_id=PERSON_EMPLOYEE_ID)
    assert [c["name"] for c in person.serialize()["communities"]] == [OTHER_COMMUNITY_NAME]


# --- Layer 5: endpoints -------------------------------------------------------

def test_communities_endpoint_crud(flask_client, cleanup_communities):
    created = flask_client.post("/ati/data-api/v1/communities", json={
        "action": "create_community",
        "name": COMMUNITY_NAME,
        "description": "Cross-campus library folk",
    })
    assert created.status_code == 201
    community_id = created.get_json()["data"]["community"]["unique_id"]

    duplicate = flask_client.post("/ati/data-api/v1/communities", json={
        "action": "create_community",
        "name": COMMUNITY_NAME,
    })
    assert duplicate.status_code == 400

    listing = flask_client.get("/ati/data-api/v1/communities")
    assert listing.status_code == 200
    mine = [c for c in listing.get_json()["data"]["items"] if c["unique_id"] == community_id]
    assert mine and mine[0]["member_count"] == 0

    updated = flask_client.put(f"/ati/data-api/v1/communities/{community_id}", json={
        "action": "update_community",
        "description": "Updated description",
    })
    assert updated.status_code == 200
    assert updated.get_json()["data"]["community"]["description"] == "Updated description"

    detail = flask_client.get(f"/ati/data-api/v1/communities/{community_id}")
    assert detail.status_code == 200
    assert detail.get_json()["data"]["community"]["members"] == []

    deleted = flask_client.delete(f"/ati/data-api/v1/communities/{community_id}")
    assert deleted.status_code == 200
    assert flask_client.get(f"/ati/data-api/v1/communities/{community_id}").status_code == 404


def test_community_stakes_round_trip(cleanup_communities):
    """add_community_stake -> read-back -> idempotent re-add -> remove.

    Uses a real SuccessIndicator (shared reference data, never modified) as the
    stake target; the sentinel community and its edges are cleaned up by fixture.
    """
    from app.database.graph_schema import SuccessIndicator
    from app.database.queries.communities.create import create_community
    from app.database.queries.communities.read import get_all_communities, get_community
    from app.database.queries.communities.update import add_community_stake, remove_community_stake
    from app.endpoints.data_api.errors.custom_exceptions import NotFoundError

    si = SuccessIndicator.nodes.filter(removed=False).first()
    community = create_community({"name": COMMUNITY_NAME})

    add_community_stake(community.unique_id, si.composite_key, note="test stake")
    detail = get_community(community.unique_id)
    assert [s["composite_key"] for s in detail["stakes"]] == [si.composite_key]
    assert detail["stakes"][0]["note"] == "test stake"

    # Idempotent re-add: still exactly one stake; note untouched when not provided.
    add_community_stake(community.unique_id, si.composite_key)
    detail = get_community(community.unique_id)
    assert len(detail["stakes"]) == 1
    assert detail["stakes"][0]["note"] == "test stake"

    # The list view counts it.
    mine = [c for c in get_all_communities() if c["unique_id"] == community.unique_id]
    assert mine and mine[0]["stake_count"] == 1

    with pytest.raises(NotFoundError):
        add_community_stake(community.unique_id, "no-such-key")
    with pytest.raises(NotFoundError):
        add_community_stake("no-such-community", si.composite_key)

    remove_community_stake(community.unique_id, si.composite_key)
    assert get_community(community.unique_id)["stakes"] == []
    # Removing an absent edge is a no-op.
    remove_community_stake(community.unique_id, si.composite_key)


def test_communities_stake_endpoint_actions(flask_client, cleanup_communities):
    from app.database.graph_schema import SuccessIndicator
    from app.database.queries.communities.create import create_community

    si = SuccessIndicator.nodes.filter(removed=False).first()
    community = create_community({"name": COMMUNITY_NAME})

    added = flask_client.put(f"/ati/data-api/v1/communities/{community.unique_id}", json={
        "action": "add_stake",
        "composite_key": si.composite_key,
        "note": "endpoint stake",
    })
    assert added.status_code == 200
    stakes = added.get_json()["data"]["community"]["stakes"]
    assert [s["composite_key"] for s in stakes] == [si.composite_key]

    missing_key = flask_client.put(f"/ati/data-api/v1/communities/{community.unique_id}", json={
        "action": "add_stake",
    })
    assert missing_key.status_code == 400

    removed = flask_client.put(f"/ati/data-api/v1/communities/{community.unique_id}", json={
        "action": "remove_stake",
        "composite_key": si.composite_key,
    })
    assert removed.status_code == 200
    assert removed.get_json()["data"]["community"]["stakes"] == []


def test_individuals_set_communities_action(flask_client, test_person):
    from app.database.queries.communities.create import create_community

    community = create_community({"name": COMMUNITY_NAME})

    response = flask_client.put("/ati/data-api/v1/individuals", json={
        "action": "set_communities",
        "employee_id": PERSON_EMPLOYEE_ID,
        "communities": [{"community_id": community.unique_id, "note": "founding member"}],
    })
    assert response.status_code == 200
    person = response.get_json()["data"]["person"]
    assert [c["name"] for c in person["communities"]] == [COMMUNITY_NAME]

    missing = flask_client.put("/ati/data-api/v1/individuals", json={
        "action": "set_communities",
        "employee_id": PERSON_EMPLOYEE_ID,
        "communities": [{"community_id": "no-such-community"}],
    })
    assert missing.status_code == 404
