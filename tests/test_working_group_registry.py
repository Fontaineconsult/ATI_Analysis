"""
PARITY test for the backend working-group SSOT (app/data_config.py).

The five WG maps used to be hand-maintained literals; they are now DERIVED from
WORKING_GROUP_DEFS. These assertions pin each derived map to EXACTLY the literal it replaced
(the values are copied verbatim from the pre-refactor data_config), so a green suite proves
"derived == old literal" — i.e. zero behavior change for the ~30 consumers that import these
maps by name. Pure unit test: data_config has no project imports, so no DB / Flask boot.
"""
import pytest

from app.data_config import (
    WORKING_GROUP_DEFS,
    working_group_names,
    compsite_key_wg_names,
    working_group_names_web_query,
    working_groups,
    working_group_abbrevs,
)

pytestmark = pytest.mark.unit


def test_working_group_names_matches_old_literal():
    assert working_group_names == {
        'pro': 'Procurement',
        'web': 'Web',
        'ins': 'Instructional Materials',
        'ste': 'Steering',
        'com': 'Communication & Training',
        'gov': 'Governance, Planning & Policies',
        'Procurement': 'Procurement',
        'Web': 'Web',
        'Instructional Materials': 'Instructional Materials',
        'Steering': 'Steering',
        'Communication & Training': 'Communication & Training',
        'Governance, Planning & Policies': 'Governance, Planning & Policies',
    }


def test_compsite_key_wg_names_matches_old_literal():
    # Only indicator-carrying groups (no 'ste'); abbrev->abbrev and name->abbrev.
    assert compsite_key_wg_names == {
        'pro': 'pro',
        'web': 'web',
        'ins': 'ins',
        'com': 'com',
        'gov': 'gov',
        'Procurement': 'pro',
        'Web': 'web',
        'Instructional Materials': 'ins',
        'Communication & Training': 'com',
        'Governance, Planning & Policies': 'gov',
    }


def test_web_query_map_matches_old_literal():
    # The evidence-endpoint gate: slug -> name, indicator-carrying groups only.
    assert working_group_names_web_query == {
        "web": "Web",
        "instructional-materials": "Instructional Materials",
        "procurement": "Procurement",
        "communication-training": "Communication & Training",
        "governance": "Governance, Planning & Policies",
    }


def test_working_groups_list_matches_old_literal_including_order():
    # Order matters — exports/reports iterate this list for section/column order.
    assert working_groups == [
        "Web",
        "Procurement",
        "Instructional Materials",
        "Communication & Training",
        "Governance, Planning & Policies",
    ]


def test_working_group_abbrevs_matches_old_literal_including_order():
    # com/gov flipped campus_plan=True with their 2026-2027 indicator sets — every
    # registry group now carries a per-campus WorkingGroupPlan (registry order).
    assert working_group_abbrevs == ("web", "pro", "ins", "com", "gov", "ste")
    assert isinstance(working_group_abbrevs, tuple)


# ---- Structural invariants of the registry itself ----

def test_registry_keys_are_unique():
    abbrevs = [d["abbrev"] for d in WORKING_GROUP_DEFS]
    names = [d["name"] for d in WORKING_GROUP_DEFS]
    slugs = [d["url_slug"] for d in WORKING_GROUP_DEFS]
    assert len(abbrevs) == len(set(abbrevs)), "duplicate abbrev in WORKING_GROUP_DEFS"
    assert len(names) == len(set(names)), "duplicate name in WORKING_GROUP_DEFS"
    assert len(slugs) == len(set(slugs)), "duplicate url_slug in WORKING_GROUP_DEFS"


def test_every_entry_has_the_required_fields():
    for d in WORKING_GROUP_DEFS:
        assert set(d) >= {"abbrev", "name", "url_slug", "has_indicators", "campus_plan"}
        assert isinstance(d["has_indicators"], bool)
        assert isinstance(d["campus_plan"], bool)


def test_flag_membership_matches_todays_reality():
    indicator_names = {d["name"] for d in WORKING_GROUP_DEFS if d["has_indicators"]}
    campus_plan_abbrevs = {d["abbrev"] for d in WORKING_GROUP_DEFS if d["campus_plan"]}
    assert indicator_names == {
        "Web", "Procurement", "Instructional Materials",
        "Communication & Training", "Governance, Planning & Policies",
    }
    # All groups carry campus plans as of 2026-2027 (com/gov flipped True).
    assert campus_plan_abbrevs == {"web", "pro", "ins", "com", "gov", "ste"}
