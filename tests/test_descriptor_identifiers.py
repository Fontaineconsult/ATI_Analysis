"""
Layer-1 unit tests for the descriptor handle factory (app/database/identifiers.py).

Pure functions, no DB — these guarantee the deterministic handle format that the unique
index on UniversalDescriptor.descriptor_handle relies on. If the format changes here, the
seed script and the create/update queries must change with it.
"""
import pytest

from app.database.identifiers import (
    make_node_type_handle,
    make_field_handle,
    make_field_value_handle,
)

pytestmark = pytest.mark.unit


def test_node_type_handle():
    assert make_node_type_handle("Interface") == "node_type:Interface"


def test_field_handle():
    assert make_field_handle("Interface", "function") == "field:Interface.function"


def test_field_value_handle():
    assert make_field_value_handle("function", "teaching-and-learning") == \
        "field_value:function.teaching-and-learning"


def test_handles_are_distinct_namespaces():
    # The kind prefix keeps the three handle namespaces from colliding.
    h = {
        make_node_type_handle("Interface"),
        make_field_handle("Interface", "function"),
        make_field_value_handle("function", "teaching-and-learning"),
    }
    assert len(h) == 3
    assert all(":" in handle for handle in h)
