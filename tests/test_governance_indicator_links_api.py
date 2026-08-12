"""
Governance -> indicator-framework links: the `informs` (-> Goal) and `drives`
(-> SuccessIndicator) edges, through the query layer and the /governance endpoint.

Isolation: these edges necessarily point at REAL Goal and SuccessIndicator nodes —
they are shared reference data and the sentinel academic year cannot scope them.
So the test owns the other end instead: every test creates its own sentinel-titled
governance node and deletes it at teardown, which takes the edges with it. Real
goals and indicators are read and linked but never modified.
"""
import pytest
from neomodel import db

SENTINEL = "9999-9999"
LAW_TITLE = f"{SENTINEL} Test Governance Instrument"

pytestmark = [pytest.mark.integration, pytest.mark.api]

API = "/ati/data-api/v1"


@pytest.fixture
def cleanup_governance(neo4j_connection):
    """Detach-delete every sentinel-titled governance node. Deleting the instrument
    removes its informs/drives edges; the Goal and SuccessIndicator survive."""
    yield
    for label in ("Law", "Case", "Directive", "ExternalPolicy", "Memo", "Guideline"):
        db.cypher_query(
            f"MATCH (n:{label}) WHERE n.title STARTS WITH $prefix DETACH DELETE n",
            {"prefix": SENTINEL},
        )


@pytest.fixture
def test_law(cleanup_governance):
    from app.database.graph_schema import Law

    return Law(title=LAW_TITLE, description="throwaway instrument").save()


@pytest.fixture
def link_targets():
    """A real Goal and a real live SuccessIndicator to point at."""
    from app.database.queries.governance.read import get_governance_link_targets

    targets = get_governance_link_targets()
    assert targets["goals"], "graph has no goals to link"
    assert targets["success_indicators"], "graph has no live indicators to link"
    return targets["goals"][0], targets["success_indicators"][0]


# --- Layer 4: read ------------------------------------------------------------

def test_link_targets_are_year_agnostic_and_exclude_removed_indicators():
    """The picker pool must not inherit the introduced_in_year gate, or an indicator
    would be un-linkable in the very year it was introduced."""
    from app.database.queries.governance.read import get_governance_link_targets

    targets = get_governance_link_targets()
    assert all(not si["removed"] for si in targets["success_indicators"])
    # Indicators introduced in a later year still appear — no year gate applied.
    keys = {si["composite_key"] for si in targets["success_indicators"]}
    assert len(keys) == len(targets["success_indicators"]), "composite_key should be unique"
    assert all("working_group" in g for g in targets["goals"])


def test_governance_projection_carries_both_edge_shapes(test_law, link_targets):
    from app.database.queries.governance.read import get_all_governance_items

    item = next(i for i in get_all_governance_items() if i["unique_id"] == test_law.unique_id)
    assert item["goals"] == []
    assert item["success_indicators"] == []


# --- Layer 3/4: write functions ----------------------------------------------

def test_attach_goal_is_idempotent(test_law, link_targets):
    from app.database.queries.governance.update import attach_goal_to_governance

    goal, _ = link_targets
    attach_goal_to_governance("law", test_law.unique_id, goal["unique_id"])
    attach_goal_to_governance("law", test_law.unique_id, goal["unique_id"])

    rows, _meta = db.cypher_query(
        "MATCH (l:Law {unique_id: $u})-[r:informs]->(:Goal) RETURN count(r)",
        {"u": test_law.unique_id},
    )
    assert rows[0][0] == 1, "re-attaching informs must not create a parallel edge"


def test_attach_indicator_is_idempotent_and_preserves_unsupplied_qualifiers(test_law, link_targets):
    """Re-attaching updates in place. A payload that mentions only `note` must not
    wipe the provision — the citation is the substance of a drives edge."""
    from app.database.queries.governance.update import attach_indicator_to_governance

    _, si = link_targets
    attach_indicator_to_governance("law", test_law.unique_id, si["unique_id"], {
        "provision": "SC 1.2.4",
        "quote": "Captions are provided for all live audio content.",
        "note": "original note",
    })
    attach_indicator_to_governance("law", test_law.unique_id, si["unique_id"], {"note": "revised note"})

    rows, _meta = db.cypher_query(
        "MATCH (l:Law {unique_id: $u})-[r:drives]->(:SuccessIndicator) "
        "RETURN count(r), collect([r.provision, r.quote, r.note, r.added_date])",
        {"u": test_law.unique_id},
    )
    assert rows[0][0] == 1, "re-attaching drives must not create a parallel edge"
    provision, quote, note, added = rows[0][1][0]
    assert provision == "SC 1.2.4"
    assert quote.startswith("Captions are provided")
    assert note == "revised note"
    assert added is not None


def test_update_citation_clears_on_empty_and_leaves_absent_alone(test_law, link_targets):
    from app.database.queries.governance.update import (
        attach_indicator_to_governance,
        update_governance_drives_indicator,
    )

    _, si = link_targets
    attach_indicator_to_governance("law", test_law.unique_id, si["unique_id"], {
        "provision": "E202.7.2", "quote": "Alternative means shall be provided.", "note": "n",
    })
    # Present-but-empty clears; absent keys are left alone.
    update_governance_drives_indicator("law", test_law.unique_id, si["unique_id"], {"provision": ""})

    rows, _meta = db.cypher_query(
        "MATCH (l:Law {unique_id: $u})-[r:drives]->() RETURN r.provision, r.quote, r.note",
        {"u": test_law.unique_id},
    )
    assert rows[0][0] is None, "empty string must clear the provision"
    assert rows[0][1] == "Alternative means shall be provided.", "absent key must not clear the quote"
    assert rows[0][2] == "n"


def test_update_citation_on_missing_edge_raises(test_law, link_targets):
    from app.database.queries.governance.update import update_governance_drives_indicator
    from app.endpoints.data_api.errors.custom_exceptions import NotFoundError

    _, si = link_targets
    with pytest.raises(NotFoundError):
        update_governance_drives_indicator("law", test_law.unique_id, si["unique_id"], {"note": "x"})


# --- Layer 5: endpoints -------------------------------------------------------

def test_link_targets_endpoint(flask_client):
    resp = flask_client.get(f"{API}/governance/link-targets")
    assert resp.status_code == 200
    data = resp.get_json()["data"]
    assert data["goals"] and data["success_indicators"]


def test_governance_endpoint_link_lifecycle(flask_client, test_law, link_targets):
    goal, si = link_targets
    uid = test_law.unique_id

    resp = flask_client.put(f"{API}/governance", json={
        "action": "attach_goal", "type": "law",
        "governance_unique_id": uid, "goal_unique_id": goal["unique_id"],
    })
    assert resp.status_code == 200
    assert len(resp.get_json()["data"]["item"]["goals"]) == 1

    resp = flask_client.put(f"{API}/governance", json={
        "action": "attach_indicator", "type": "law",
        "governance_unique_id": uid, "indicator_unique_id": si["unique_id"],
        "provision": "SC 1.2.4", "quote": "…", "note": "why",
    })
    assert resp.status_code == 200
    driven = resp.get_json()["data"]["item"]["success_indicators"]
    assert len(driven) == 1
    assert driven[0]["provision"] == "SC 1.2.4"
    assert driven[0]["added_date"] is not None

    # The list projection and the single-node serializer must agree in shape.
    resp = flask_client.get(f"{API}/governance")
    item = next(i for i in resp.get_json()["data"]["items"] if i["unique_id"] == uid)
    assert len(item["goals"]) == 1 and len(item["success_indicators"]) == 1
    assert item["success_indicators"][0]["provision"] == "SC 1.2.4"

    for action, key, value in (
        ("detach_goal", "goal_unique_id", goal["unique_id"]),
        ("detach_indicator", "indicator_unique_id", si["unique_id"]),
    ):
        resp = flask_client.put(f"{API}/governance", json={
            "action": action, "type": "law", "governance_unique_id": uid, key: value,
        })
        assert resp.status_code == 200

    resp = flask_client.get(f"{API}/governance")
    item = next(i for i in resp.get_json()["data"]["items"] if i["unique_id"] == uid)
    assert item["goals"] == [] and item["success_indicators"] == []


def test_for_indicator_read_is_the_inverse_direction(flask_client, test_law, link_targets):
    """The dashboard's indicator view reads the same edge from the other end."""
    from app.database.queries.governance.update import (
        attach_goal_to_governance,
        attach_indicator_to_governance,
    )

    goal, si = link_targets
    composite_key = si["composite_key"]

    resp = flask_client.get(f"{API}/governance/for-indicator/{composite_key}?candidates=1")
    assert resp.status_code == 200
    before = resp.get_json()["data"]
    assert before["unique_id"] == si["unique_id"], "the write actions need the SI's unique_id"
    assert before["candidates"], "picker pool must be populated when asked for"
    assert all("raw_text" not in c for c in before["candidates"]), \
        "raw_text must not ride along — this is fetched on every indicator selection"

    attach_indicator_to_governance("law", test_law.unique_id, si["unique_id"],
                                   {"provision": "SC 1.2.4", "quote": "…"})
    attach_goal_to_governance("law", test_law.unique_id, goal["unique_id"])

    after = flask_client.get(f"{API}/governance/for-indicator/{composite_key}").get_json()["data"]
    driving = [d for d in after["driving"] if d["unique_id"] == test_law.unique_id]
    assert len(driving) == 1
    assert driving[0]["type"] == "law", "label must be mapped back to the API type key"
    assert driving[0]["provision"] == "SC 1.2.4"

    # The goal's informs edges are CONTEXT, surfaced separately from this indicator's
    # own drives edges — the union is derived here, never materialized.
    inherited = [g for g in after["informing_goal"] if g["unique_id"] == test_law.unique_id]
    assert len(inherited) == 1
    assert not any(k in inherited[0] for k in ("provision", "quote"))

    # Both sides carry the instrument's source artifacts: a cited instrument is only
    # as checkable as the artifact behind it is reachable.
    for row in (driving[0], inherited[0]):
        assert row["documents"] == [] and row["webpages"] == []


def test_for_indicator_surfaces_source_documents_and_files(flask_client, test_law, link_targets):
    """A Document attached to the instrument reaches the indicator panel, with a
    download URL when the document has an uploaded file."""
    from app.database.graph_schema import Document, StoredFile
    from app.database.queries.governance.update import (
        attach_document_to_governance,
        attach_indicator_to_governance,
    )

    _goal, si = link_targets
    doc = Document(name=f"{SENTINEL} Source Doc", uri_path="www.example.org/spec").save()
    stored = StoredFile(storage_key=f"{SENTINEL}-key", original_filename="spec.pdf", size=4096).save()
    try:
        doc.has_file.connect(stored)
        attach_document_to_governance("law", test_law.unique_id, doc.unique_id)
        attach_indicator_to_governance("law", test_law.unique_id, si["unique_id"], {"provision": "§1"})

        data = flask_client.get(
            f"{API}/governance/for-indicator/{si['composite_key']}"
        ).get_json()["data"]
        row = next(d for d in data["driving"] if d["unique_id"] == test_law.unique_id)

        assert len(row["documents"]) == 1
        projected = row["documents"][0]
        assert projected["name"] == f"{SENTINEL} Source Doc"
        assert projected["uri_path"] == "www.example.org/spec"
        assert projected["file"]["download_url"] == \
            f"/ati/data-api/v1/files/{SENTINEL}-key?name=spec.pdf"
        assert projected["file"]["size"] == 4096
        # raw_text is what makes a quote possible; the panel reports whether it exists.
        assert row["has_raw_text"] is False
    finally:
        db.cypher_query(
            "MATCH (d:Document) WHERE d.name STARTS WITH $p DETACH DELETE d", {"p": SENTINEL})
        db.cypher_query(
            "MATCH (s:StoredFile) WHERE s.storage_key STARTS WITH $p DETACH DELETE s", {"p": SENTINEL})


def test_for_indicator_omits_candidates_by_default(flask_client, link_targets):
    """The picker pool is the bulk of the payload and is only needed once the panel is
    expanded — and the panel starts collapsed — so it must be opt-in."""
    import json

    _goal, si = link_targets
    key = si["composite_key"]

    lean = flask_client.get(f"{API}/governance/for-indicator/{key}").get_json()["data"]
    full = flask_client.get(f"{API}/governance/for-indicator/{key}?candidates=1").get_json()["data"]

    assert "candidates" not in lean
    assert full["candidates"]
    # The collapsed header only needs the counts; the difference should be large enough
    # that deferring it is worth the extra round trip.
    assert len(json.dumps(lean)) * 5 < len(json.dumps(full))
    # Everything the header renders is present without opting in.
    assert lean["composite_key"] == key
    assert "driving" in lean and "informing_goal" in lean


def test_for_indicator_unknown_key_is_404(flask_client):
    assert flask_client.get(f"{API}/governance/for-indicator/9.9-nope").status_code == 404


@pytest.mark.parametrize("payload,expected", [
    ({"action": "attach_goal", "type": "law"}, 400),                       # no governance id
    ({"action": "attach_indicator", "type": "law"}, 400),                  # no governance id
    ({"action": "attach_goal", "type": "law", "governance_unique_id": "x",
      "goal_unique_id": "nope"}, 404),
    ({"action": "attach_indicator", "type": "law", "governance_unique_id": "x",
      "indicator_unique_id": "nope"}, 404),
])
def test_link_actions_reject_bad_input(flask_client, test_law, payload, expected):
    if payload.get("governance_unique_id") == "x":
        payload["governance_unique_id"] = test_law.unique_id
    resp = flask_client.put(f"{API}/governance", json=payload)
    assert resp.status_code == expected
