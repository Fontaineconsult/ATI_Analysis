"""
Layer-1 unit tests for the TAAP identifier helper (app/database/identifiers.py).

Pure function, no DB. The unique index on TAAP.taap_identifier relies on this format:
'<asset_identifier>--<requesting_unit_slug>--<YYYY>'. The double-hyphen segment
separator is what keeps the asset's own hyphenated identifier parseable.
"""
import pytest

from app.database.identifiers import SEGMENT_SEPARATOR, make_taap_identifier

pytestmark = pytest.mark.unit


def test_taap_identifier_format():
    assert make_taap_identifier("handshake-ssu", "career-center", "2026") == \
        "handshake-ssu--career-center--2026"


def test_taap_identifier_splits_back_into_three_coordinates():
    ident = make_taap_identifier("humanity-ssu", "campus-recreation", "2026")
    assert ident.split(SEGMENT_SEPARATOR) == ["humanity-ssu", "campus-recreation", "2026"]


def test_same_asset_and_unit_differ_by_year():
    this_year = make_taap_identifier("handshake-ssu", "career-center", "2026")
    renewal = make_taap_identifier("handshake-ssu", "career-center", "2027")
    assert this_year != renewal


def test_same_asset_differs_by_requesting_unit():
    d1 = make_taap_identifier("humanity-ssu", "campus-recreation", "2026")
    d2 = make_taap_identifier("humanity-ssu", "student-union", "2026")
    assert d1 != d2
