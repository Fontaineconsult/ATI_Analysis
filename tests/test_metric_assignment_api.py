"""
Metric → implementation assignment — regression tests for the neomodel 6.x
NotImplementedError.

The bug: the seven implementation classes declared supporting_documents /
webpages / notes / messages with model=DocumentedByRel but left
supporting_metrics bare, while assign_documentation_to_implementation passes
the same year-inclusion relationship props on connect for every documentation
type. neomodel 6 refuses connect-with-props on a modelless edge, so adding a
metric to an implementation 500'd ("Failed to add metric").

Isolation: implementation + metric carry the sentinel year prefix (9999-9999...)
in their unique keys; cleanup deletes exactly that prefix.
"""
import pytest
from neomodel import db

SENTINEL = "9999-9999"

IMPL_TITLE = f"{SENTINEL} Test Metric Host Process"
METRIC_NAME = f"{SENTINEL} Test Metric"

pytestmark = [pytest.mark.integration, pytest.mark.api]

API = "/ati/data-api/v1/documents"


@pytest.fixture
def sentinel_process(neo4j_connection):
    from app.database.graph_schema import Process

    impl = Process(title=IMPL_TITLE, description="sentinel").save()
    yield impl
    db.cypher_query(
        "MATCH (m:Metric) WHERE m.name STARTS WITH $prefix DETACH DELETE m",
        {"prefix": SENTINEL},
    )
    db.cypher_query(
        "MATCH (p:Process) WHERE p.title STARTS WITH $prefix DETACH DELETE p",
        {"prefix": SENTINEL},
    )


# --- Layer 3: the assignment write ---------------------------------------------

def test_assign_metric_to_implementation_with_year(sentinel_process):
    from app.database.graph_schema import Metric
    from app.database.queries.implementation.update import assign_documentation_to_implementation

    metric = Metric(name=METRIC_NAME, composite_key=f"{METRIC_NAME}_count", metric_type="count").save()

    assert assign_documentation_to_implementation(
        implementation_id=sentinel_process.unique_id,
        implementation_type="Process",
        documentation_type="metric",
        documentation_id=metric.unique_id,
        academic_year="9999-9999",
        include_in_year=True,
    ) is True

    # The edge exists and carries the DocumentedByRel year-inclusion props.
    rel = sentinel_process.supporting_metrics.relationship(metric)
    assert rel is not None
    assert rel.included_in_years == ["9999-9999"]
    assert rel.excluded_from_years == []
    assert rel.added_date is not None

    # Re-assigning with include_in_year=False moves the year to the exclusions.
    assign_documentation_to_implementation(
        implementation_id=sentinel_process.unique_id,
        implementation_type="Process",
        documentation_type="metric",
        documentation_id=metric.unique_id,
        academic_year="9999-9999",
        include_in_year=False,
    )
    rel = sentinel_process.supporting_metrics.relationship(metric)
    assert rel.included_in_years == []
    assert rel.excluded_from_years == ["9999-9999"]


# --- Layer 5: the endpoint the FE actually hits ---------------------------------

def test_add_metric_endpoint_assigns_to_implementation(flask_client, sentinel_process):
    from app.database.graph_schema import Metric

    resp = flask_client.post(API, json={
        "action": "add_metric",
        "metric_dict": {
            "name": METRIC_NAME,
            "metric_type": "count",
            "description": "sentinel metric",
            "single_value": "42",
        },
        "implementation_id": sentinel_process.unique_id,
        "implementation_type": "Process",
    })
    assert resp.status_code == 201, resp.get_json()

    metric = Metric.nodes.get(composite_key=f"{METRIC_NAME}_count")
    assert sentinel_process.supporting_metrics.is_connected(metric)
    rel = sentinel_process.supporting_metrics.relationship(metric)
    assert rel.added_date is not None
