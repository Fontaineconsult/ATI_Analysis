"""
Tests for the shared ontology engine (app/database/queries/ontology/read.py).

Two layers:
  - introspect_schema() is PURE (reads the neomodel classes, no DB) -> unit tests.
  - assemble_ontology() / ontology_health() join live descriptor + principle data
    -> integration tests (read-only; they never write, so no sentinel scoping needed).
"""
import pytest

from app.database.queries.ontology.read import (
    introspect_schema,
    assemble_ontology,
    ontology_health,
)


# --------------------------------------------------------------------------- #
# Layer 1 — structural introspection (no DB)                                  #
# --------------------------------------------------------------------------- #
@pytest.mark.unit
class TestIntrospectSchema:
    def test_shape_and_counts(self):
        s = introspect_schema()
        assert set(s) >= {"node_types", "relationship_types", "field_values", "counts"}
        # The real schema is large; guard against an empty/half-loaded reflection.
        assert s["counts"]["node_types"] >= 40
        assert s["counts"]["fields"] > 0
        assert s["counts"]["relationship_types"] > 0
        assert len(s["node_types"]) == s["counts"]["node_types"]

    def test_meta_layer_node_types_present(self):
        labels = {n["label"] for n in introspect_schema()["node_types"]}
        # The ontology's self-describing layer must itself appear in the ontology.
        assert {"UniversalDescriptor", "Principle", "IntellectualSource", "Interface"} <= labels

    def test_choice_field_carries_choices_and_handle(self):
        iface = next(n for n in introspect_schema()["node_types"] if n["label"] == "Interface")
        function = next(f for f in iface["fields"] if f["name"] == "function")
        assert function["required"] is True
        assert function["handle"] == "field:Interface.function"
        values = {c["value"] for c in function["choices"]}
        assert "teaching-and-learning" in values

    def test_array_choice_field_resolves_inner_choices(self):
        iface = next(n for n in introspect_schema()["node_types"] if n["label"] == "Interface")
        cov = next(f for f in iface["fields"] if f["name"] == "coverage_domains")
        assert cov["type"].startswith("Array<")
        assert cov["choices"] is not None and len(cov["choices"]) > 0

    def test_relationship_direction_and_target(self):
        iface = next(n for n in introspect_schema()["node_types"] if n["label"] == "Interface")
        by_name = {r["name"]: r for r in iface["relationships"]}
        # Outgoing typed edge.
        assert by_name["presented_by"]["direction"] == "to"
        assert by_name["presented_by"]["target"] == "Asset"
        assert by_name["presented_by"]["rel_type"] == "presented_by"
        # Reverse manager is introspected as an incoming edge.
        assert by_name["remediated_by_processes"]["direction"] == "from"

    def test_field_value_handles_are_global_and_well_formed(self):
        fvs = introspect_schema()["field_values"]
        sample = next(v for v in fvs if v["field"] == "function" and v["value"] == "teaching-and-learning")
        assert sample["handle"] == "field_value:function.teaching-and-learning"


# --------------------------------------------------------------------------- #
# Layer 2 — descriptions overlay + integrity (live DB)                        #
# --------------------------------------------------------------------------- #
@pytest.mark.integration
class TestAssembleAndHealth:
    def test_assembly_overlays_descriptor_and_shaped_by(self, neo4j_connection):
        o = assemble_ontology()
        iface = next(n for n in o["node_types"] if n["label"] == "Interface")
        # Every element gains the two overlay keys, present even when null/empty.
        assert "descriptor" in iface and "shaped_by" in iface
        assert isinstance(iface["shaped_by"], list)
        for f in iface["fields"]:
            assert "descriptor" in f and "shaped_by" in f
            for c in (f["choices"] or []):
                assert "handle" in c and "descriptor" in c

    def test_health_coverage_and_drift_structure(self, neo4j_connection):
        h = ontology_health()
        assert 0.0 <= h["overall_coverage_pct"] <= 100.0
        assert set(h["coverage"]) == {"node_type", "field", "field_value", "rel_type"}
        for kind in h["coverage"].values():
            assert kind["described"] <= kind["total"]
            assert 0.0 <= kind["coverage_pct"] <= 100.0
        assert isinstance(h["orphan_descriptors"], list)
        assert {"total", "ungrounded", "inert"} <= set(h["principles"])
