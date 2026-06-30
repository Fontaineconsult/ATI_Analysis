"""Unit tests for the orphan-file GC helpers (pure functions, no DB)."""
from datetime import datetime, timedelta, timezone

import pytest

from app.database.tools.gc_orphan_files import _age_hours, disk_only_keys

pytestmark = pytest.mark.unit


def test_disk_only_keys():
    assert disk_only_keys(["a", "b", "c"], ["b"]) == ["a", "c"]
    assert disk_only_keys([], ["x"]) == []
    assert disk_only_keys(["a"], []) == ["a"]
    assert disk_only_keys(["a", "b"], ["a", "b"]) == []


def test_age_hours():
    assert _age_hours(None) is None
    assert _age_hours("not-a-date") is None
    five_hours_ago = (datetime.now(timezone.utc) - timedelta(hours=5)).isoformat()
    assert 4.9 < _age_hours(five_hours_ago) < 5.1
