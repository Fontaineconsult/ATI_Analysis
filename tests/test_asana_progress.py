"""
Plan progress as Asana subtasks — the merged system.

Covers the three behaviors the merge introduced: sync merges by gid (rows are
first-order, so their unique_id must survive a refresh), the app can ADD a
subtask (Asana written first via the injected fake, then the graph row), and
the app can COMPLETE one (the row reflects Asana's post-write answer).

The connector is loaded by file path (app/asana-connector is not a package),
with a fake client and config injected — no network. Graph writes are real and
sentinel-scoped: the plan and everything hanging off it are torn down by
description prefix.
"""
import importlib.util
import os
from types import SimpleNamespace

import pytest
from neomodel import db

pytestmark = pytest.mark.integration

SENTINEL = "ZZZ-TEST asana progress"
PLAN_DESC = f"{SENTINEL} plan 9999-9999"


def _load_reconcile():
    path = os.path.join(
        os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
        "app", "asana-connector", "reconcile.py",
    )
    spec = importlib.util.spec_from_file_location("test_asana_reconcile", path)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


class FakeAsana:
    """The slice of AsanaClient the progress writes touch, with call capture."""

    def __init__(self, existing_task_gids=()):
        self.existing = set(existing_task_gids)
        self.calls = []
        self._n = 0

    def _gid(self, prefix):
        self._n += 1
        return f"{prefix}-{self._n}"

    def get_task(self, gid):
        self.calls.append(("get_task", gid))
        if gid not in self.existing:
            raise self.error(404)
        return {"gid": gid}

    def create_subtask(self, parent_gid, name, *, notes=None, due_on=None,
                       assignee=None):
        self.calls.append(("create_subtask", parent_gid, name, assignee))
        return {"gid": self._gid("sub"), "name": name, "notes": notes,
                "completed": False, "completed_at": None, "due_on": due_on,
                "assignee": {"name": "Somebody", "email": assignee} if assignee else None,
                "permalink_url": "https://app.asana.com/sub"}

    def set_task_assignee(self, gid, assignee):
        self.calls.append(("set_task_assignee", gid, assignee))
        return {"gid": gid, "name": "assigned thing", "completed": False,
                "completed_at": None, "due_on": None,
                "assignee": {"name": "Somebody", "email": assignee} if assignee else None,
                "permalink_url": "https://app.asana.com/sub"}

    def set_task_completed(self, gid, completed):
        self.calls.append(("set_task_completed", gid, completed))
        return {"gid": gid, "name": "done thing", "completed": bool(completed),
                "completed_at": "2026-09-09T12:00:00Z" if completed else None,
                "due_on": None, "permalink_url": "https://app.asana.com/sub"}

    def update_task(self, gid, *, name=None, notes=None, due_on=None,
                    custom_fields=None):
        self.calls.append(("update_task", gid, name, notes, due_on))
        return {"gid": gid, "name": name or "kept name", "notes": notes,
                "completed": False, "completed_at": None, "due_on": due_on,
                "permalink_url": "https://app.asana.com/sub"}

    def find_project_by_name(self, name, workspace, team=None):
        self.calls.append(("find_project", name))
        return {"gid": "proj-1", "name": name}

    def create_task(self, name, project_gid, *, notes=None, completed=False,
                    custom_fields=None):
        self.calls.append(("create_task", name))
        gid = self._gid("task")
        self.existing.add(gid)
        return {"gid": gid, "name": name}

    def list_sections(self, project_gid):
        return [{"name": "Unassigned", "gid": "sec-1"}]

    def create_section(self, project_gid, name):
        return {"gid": self._gid("sec"), "name": name}

    def add_task_to_section(self, section_gid, task_gid):
        self.calls.append(("add_to_section", section_gid, task_gid))
        return {}

    @staticmethod
    def error(status):
        class _E(RuntimeError):
            status_code = status
        e = _E(f"Asana API {status}")
        return e


FAKE_CONFIG = SimpleNamespace(
    access_token="fake", workspace_gid="ws-1", team_gid=None,
    base_url="https://fake", require=lambda *a, **k: None,
)


@pytest.fixture
def sentinel_plan(neo4j_connection):
    from app.database.graph_schema import Plan

    plan = Plan(name=f"{SENTINEL} plan", description=PLAN_DESC).save()
    yield plan
    db.cypher_query(
        """
        MATCH (p:Plan) WHERE p.description STARTS WITH $prefix
        OPTIONAL MATCH (p)-[:has_asana_subtask]->(s:AsanaSubtask)
        DETACH DELETE s, p
        """,
        {"prefix": SENTINEL},
    )
    db.cypher_query(
        "MATCH (p:Person) WHERE p.name STARTS WITH $prefix DETACH DELETE p",
        {"prefix": SENTINEL},
    )


@pytest.fixture
def sentinel_person(sentinel_plan):
    from app.database.graph_schema import Person

    return Person(name=f"{SENTINEL} Assignee",
                  email="zzz-test-assignee@example.edu").save()


# --------------------------------------------------------------------------- #
# Sync merges by gid — rows are first-order, identity survives a refresh       #
# --------------------------------------------------------------------------- #

def test_sync_merges_by_gid_instead_of_replacing(sentinel_plan):
    from app.database.queries.asana.create import sync_plan_subtasks
    from app.database.queries.asana.read import get_plan_subtasks

    first = sync_plan_subtasks(sentinel_plan.unique_id, [
        {"gid": "s1", "name": "write the draft", "completed": False},
        {"gid": "s2", "name": "review it", "completed": False},
    ])
    ids_by_gid = {r["asana_gid"]: r["unique_id"] for r in first}

    # Next refresh: s1 completed in Asana, s2 deleted there, s3 new.
    second = sync_plan_subtasks(sentinel_plan.unique_id, [
        {"gid": "s1", "name": "write the draft", "completed": True,
         "completed_at": "2026-09-09T10:00:00Z"},
        {"gid": "s3", "name": "ship it", "completed": False},
    ])
    by_gid = {r["asana_gid"]: r for r in second}

    # The surviving row kept its unique_id: it was updated, not replaced.
    assert by_gid["s1"]["unique_id"] == ids_by_gid["s1"]
    assert by_gid["s1"]["completed"] is True
    # The Asana deletion propagated; the new subtask gained a row.
    remaining = {r["asana_gid"] for r in get_plan_subtasks(sentinel_plan.unique_id)}
    assert remaining == {"s1", "s3"}


# --------------------------------------------------------------------------- #
# Adding progress: Asana first, then the first-order row                       #
# --------------------------------------------------------------------------- #

def test_add_subtask_on_a_linked_plan(sentinel_plan):
    reconcile = _load_reconcile()
    fake = FakeAsana(existing_task_gids={"task-linked"})
    sentinel_plan.asana_task_gid = "task-linked"
    sentinel_plan.save()

    row = reconcile.add_plan_subtask(
        sentinel_plan.unique_id, "collect the roster",
        year_name="9999-9999", client=fake, config=FAKE_CONFIG,
        logger=lambda *_: None,
    )

    assert ("create_subtask", "task-linked", "collect the roster", None) in fake.calls
    assert row["asana_gid"].startswith("sub-")
    assert row["completed"] is False

    from app.database.queries.asana.read import get_plan_subtasks
    rows = get_plan_subtasks(sentinel_plan.unique_id)
    assert [r["name"] for r in rows] == ["collect the roster"]


def test_add_subtask_creates_the_missing_task_first(sentinel_plan):
    """A plan never pushed to Asana still accepts progress: the add path runs
    the same find-or-create the bulk refresh would, for this one plan."""
    reconcile = _load_reconcile()
    fake = FakeAsana()

    row = reconcile.add_plan_subtask(
        sentinel_plan.unique_id, "first step",
        year_name="9999-9999", client=fake, config=FAKE_CONFIG,
        logger=lambda *_: None,
    )

    created_tasks = [c for c in fake.calls if c[0] == "create_task"]
    assert len(created_tasks) == 1

    from app.database.graph_schema import Plan
    refreshed = Plan.nodes.get(unique_id=sentinel_plan.unique_id)
    assert refreshed.asana_task_gid is not None
    assert row["name"] == "first step"


def test_add_subtask_requires_a_name_and_year(sentinel_plan):
    reconcile = _load_reconcile()
    with pytest.raises(ValueError):
        reconcile.add_plan_subtask(sentinel_plan.unique_id, "   ",
                                   year_name="9999-9999",
                                   client=FakeAsana(), config=FAKE_CONFIG)
    with pytest.raises(ValueError):
        reconcile.add_plan_subtask(sentinel_plan.unique_id, "a step",
                                   year_name=None,
                                   client=FakeAsana(), config=FAKE_CONFIG)


# --------------------------------------------------------------------------- #
# Completing progress: the row shows Asana's answer                            #
# --------------------------------------------------------------------------- #

def test_complete_subtask_updates_the_row_from_asanas_response(sentinel_plan):
    from app.database.queries.asana.create import sync_plan_subtasks

    seeded = sync_plan_subtasks(sentinel_plan.unique_id, [
        {"gid": "s9", "name": "done thing", "completed": False},
    ])
    original_uid = seeded[0]["unique_id"]

    reconcile = _load_reconcile()
    fake = FakeAsana()
    row = reconcile.set_plan_subtask_completed(
        sentinel_plan.unique_id, "s9", True,
        client=fake, config=FAKE_CONFIG, logger=lambda *_: None,
    )

    assert ("set_task_completed", "s9", True) in fake.calls
    assert row["completed"] is True
    assert row["completed_at"] == "2026-09-09T12:00:00Z"   # Asana's stamp, not ours
    assert row["unique_id"] == original_uid


def test_complete_rejects_a_subtask_not_on_the_plan_before_touching_asana(sentinel_plan):
    """The membership check runs first, so a wrong gid never mutates a task
    that belongs to somebody else's plan."""
    from app.endpoints.data_api.errors.custom_exceptions import NotFoundError

    reconcile = _load_reconcile()
    fake = FakeAsana()
    with pytest.raises(NotFoundError):
        reconcile.set_plan_subtask_completed(
            sentinel_plan.unique_id, "not-a-subtask", True,
            client=fake, config=FAKE_CONFIG, logger=lambda *_: None,
        )
    assert fake.calls == []


# --------------------------------------------------------------------------- #
# The description (notes) travels both ways, and fields edit in place          #
# --------------------------------------------------------------------------- #

def test_sync_carries_the_description(sentinel_plan):
    from app.database.queries.asana.create import sync_plan_subtasks

    rows = sync_plan_subtasks(sentinel_plan.unique_id, [
        {"gid": "s1", "name": "write the draft", "completed": False,
         "notes": "Use the March outline; two pages max."},
    ])
    assert rows[0]["notes"] == "Use the March outline; two pages max."


def test_edit_updates_fields_via_asana_and_keeps_identity(sentinel_plan):
    from app.database.queries.asana.create import sync_plan_subtasks

    seeded = sync_plan_subtasks(sentinel_plan.unique_id, [
        {"gid": "s5", "name": "old name", "completed": False},
    ])
    original_uid = seeded[0]["unique_id"]

    reconcile = _load_reconcile()
    fake = FakeAsana()
    row = reconcile.update_plan_subtask(
        sentinel_plan.unique_id, "s5",
        name="new name", notes="now with a description", due_on="2026-10-01",
        client=fake, config=FAKE_CONFIG, logger=lambda *_: None,
    )

    assert ("update_task", "s5", "new name", "now with a description", "2026-10-01") in fake.calls
    assert row["name"] == "new name"
    assert row["notes"] == "now with a description"
    assert row["due_on"] == "2026-10-01"
    assert row["unique_id"] == original_uid


def test_sync_follows_asanas_assignee_when_it_has_one(sentinel_plan, sentinel_person):
    from app.database.queries.asana.create import sync_plan_subtasks

    rows = sync_plan_subtasks(sentinel_plan.unique_id, [
        {"gid": "s1", "name": "assigned in Asana", "completed": False,
         "assignee": {"name": "ZZZ Assignee", "email": "zzz-test-assignee@example.edu"}},
    ])
    assert rows[0]["assigned_to"]["unique_id"] == sentinel_person.unique_id


def test_assignment_is_local_and_survives_the_sync(sentinel_plan, sentinel_person):
    """Asana rejects non-workspace emails as actors, so ownership is app-side:
    assigning sends nothing to Asana, and a refresh that reports no assignee
    leaves the local assignment alone (same rule as task_status)."""
    from app.database.queries.asana.create import sync_plan_subtasks

    sync_plan_subtasks(sentinel_plan.unique_id, [
        {"gid": "s7", "name": "needs an owner", "completed": False},
    ])

    reconcile = _load_reconcile()
    fake = FakeAsana()
    row = reconcile.set_plan_subtask_assignee(
        sentinel_plan.unique_id, "s7", sentinel_person.unique_id,
        client=fake, config=FAKE_CONFIG, logger=lambda *_: None,
    )
    assert fake.calls == []                      # nothing went to Asana
    assert row["assigned_to"]["unique_id"] == sentinel_person.unique_id
    assert row["assignee_name"] == sentinel_person.name   # the generic text

    # The next refresh reports no Asana assignee: the assignment survives.
    rows = sync_plan_subtasks(sentinel_plan.unique_id, [
        {"gid": "s7", "name": "needs an owner", "completed": False},
    ])
    assert rows[0]["assigned_to"]["unique_id"] == sentinel_person.unique_id
    assert rows[0]["assignee_name"] == sentinel_person.name

    # Unassign: also local, clears edge and mirrors together.
    row = reconcile.set_plan_subtask_assignee(
        sentinel_plan.unique_id, "s7", None,
        client=fake, config=FAKE_CONFIG, logger=lambda *_: None,
    )
    assert fake.calls == []
    assert row["assigned_to"] is None
    assert row["assignee_name"] is None


def test_a_person_with_no_email_can_own_a_task(sentinel_plan):
    """The failure that forced the model: 'ayalas@sonoma.edu' was not a valid
    Asana actor. Ownership no longer depends on Asana, so no email is fine."""
    from app.database.graph_schema import Person
    from app.database.queries.asana.create import sync_plan_subtasks

    no_email = Person(name=f"{SENTINEL} No Email").save()
    sync_plan_subtasks(sentinel_plan.unique_id, [
        {"gid": "s8", "name": "needs an owner", "completed": False},
    ])

    reconcile = _load_reconcile()
    row = reconcile.set_plan_subtask_assignee(
        sentinel_plan.unique_id, "s8", no_email.unique_id,
        client=FakeAsana(), config=FAKE_CONFIG, logger=lambda *_: None,
    )
    assert row["assigned_to"]["name"] == f"{SENTINEL} No Email"


def test_add_with_an_assignee(sentinel_plan, sentinel_person):
    reconcile = _load_reconcile()
    fake = FakeAsana(existing_task_gids={"task-linked"})
    sentinel_plan.asana_task_gid = "task-linked"
    sentinel_plan.save()

    row = reconcile.add_plan_subtask(
        sentinel_plan.unique_id, "owned from birth",
        assignee_person_id=sentinel_person.unique_id,
        year_name="9999-9999", client=fake, config=FAKE_CONFIG,
        logger=lambda *_: None,
    )

    # Asana gets the subtask WITHOUT an assignee; the ownership is local.
    assert ("create_subtask", "task-linked", "owned from birth", None) in fake.calls
    assert row["assigned_to"]["unique_id"] == sentinel_person.unique_id
    assert row["assignee_name"] == sentinel_person.name


def test_sync_gives_every_row_a_status_from_its_completion(sentinel_plan):
    from app.database.queries.asana.create import sync_plan_subtasks

    rows = sync_plan_subtasks(sentinel_plan.unique_id, [
        {"gid": "s1", "name": "fresh", "completed": False},
        {"gid": "s2", "name": "already done in Asana", "completed": True},
    ])
    by_gid = {r["asana_gid"]: r for r in rows}
    assert by_gid["s1"]["task_status"] == "Not Started"
    assert by_gid["s2"]["task_status"] == "Completed"


def test_completing_moves_the_tracker_and_reopening_drops_it(sentinel_plan):
    from app.database.queries.asana.create import sync_plan_subtasks

    sync_plan_subtasks(sentinel_plan.unique_id, [
        {"gid": "s9", "name": "done thing", "completed": False},
    ])
    reconcile = _load_reconcile()
    fake = FakeAsana()

    row = reconcile.set_plan_subtask_completed(
        sentinel_plan.unique_id, "s9", True,
        client=fake, config=FAKE_CONFIG, logger=lambda *_: None,
    )
    assert row["task_status"] == "Completed"

    row = reconcile.set_plan_subtask_completed(
        sentinel_plan.unique_id, "s9", False,
        client=fake, config=FAKE_CONFIG, logger=lambda *_: None,
    )
    assert row["task_status"] == "In Progress"


def test_status_completed_completes_the_asana_subtask(sentinel_plan):
    from app.database.queries.asana.create import sync_plan_subtasks

    sync_plan_subtasks(sentinel_plan.unique_id, [
        {"gid": "s10", "name": "nearly there", "completed": False},
    ])
    reconcile = _load_reconcile()
    fake = FakeAsana()

    row = reconcile.set_plan_subtask_status(
        sentinel_plan.unique_id, "s10", status="Completed",
        resolution_note="Shipped with the fall release.",
        client=fake, config=FAKE_CONFIG, logger=lambda *_: None,
    )
    assert ("set_task_completed", "s10", True) in fake.calls
    assert row["task_status"] == "Completed"
    assert row["completed"] is True
    assert row["resolution_note"] == "Shipped with the fall release."


def test_status_off_completed_reopens_in_asana(sentinel_plan):
    from app.database.queries.asana.create import sync_plan_subtasks

    sync_plan_subtasks(sentinel_plan.unique_id, [
        {"gid": "s11", "name": "was done", "completed": True},
    ])
    reconcile = _load_reconcile()
    fake = FakeAsana()

    row = reconcile.set_plan_subtask_status(
        sentinel_plan.unique_id, "s11", status="Abandoned",
        resolution_note="Superseded by the CSUBuy rollout.",
        client=fake, config=FAKE_CONFIG, logger=lambda *_: None,
    )
    assert ("set_task_completed", "s11", False) in fake.calls
    assert row["task_status"] == "Abandoned"
    assert row["resolution_note"] == "Superseded by the CSUBuy rollout."


def test_status_within_the_open_side_never_touches_asana(sentinel_plan):
    """On Hold, In Progress, and friends are states Asana cannot express, so a
    move between them is a purely local write."""
    from app.database.queries.asana.create import sync_plan_subtasks

    sync_plan_subtasks(sentinel_plan.unique_id, [
        {"gid": "s12", "name": "paused work", "completed": False},
    ])
    reconcile = _load_reconcile()
    fake = FakeAsana()

    row = reconcile.set_plan_subtask_status(
        sentinel_plan.unique_id, "s12", status="On Hold",
        client=fake, config=FAKE_CONFIG, logger=lambda *_: None,
    )
    assert fake.calls == []
    assert row["task_status"] == "On Hold"

    # The tracker survives the next sync: Asana knows nothing about On Hold.
    rows = sync_plan_subtasks(sentinel_plan.unique_id, [
        {"gid": "s12", "name": "paused work", "completed": False},
    ])
    assert rows[0]["task_status"] == "On Hold"


def test_status_uses_the_plan_vocabulary(sentinel_plan):
    from app.database.queries.asana.create import sync_plan_subtasks
    from app.endpoints.data_api.errors.custom_exceptions import ValidationError

    sync_plan_subtasks(sentinel_plan.unique_id, [
        {"gid": "s13", "name": "typo target", "completed": False},
    ])
    reconcile = _load_reconcile()
    with pytest.raises(ValidationError):
        reconcile.set_plan_subtask_status(
            sentinel_plan.unique_id, "s13", status="Complete",   # the old bug's spelling
            client=FakeAsana(), config=FAKE_CONFIG, logger=lambda *_: None,
        )


def test_edit_requires_a_field_and_a_nonblank_name(sentinel_plan):
    reconcile = _load_reconcile()
    with pytest.raises(ValueError):
        reconcile.update_plan_subtask(
            sentinel_plan.unique_id, "s1",
            client=FakeAsana(), config=FAKE_CONFIG, logger=lambda *_: None,
        )
    with pytest.raises(ValueError):
        reconcile.update_plan_subtask(
            sentinel_plan.unique_id, "s1", name="   ",
            client=FakeAsana(), config=FAKE_CONFIG, logger=lambda *_: None,
        )
