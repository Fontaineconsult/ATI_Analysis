"""
Metric JSON values, value_schema and measured_on.

value_dict holds a raw JSON document (e.g. a Pope Tech metric snapshot) that the
frontend renders by its value_schema. Before this change serialize() decoded the
already-decoded JSONProperty a second time, so any metric holding a real object
raised TypeError and broke GET /documents/metrics.

Isolation: every metric name and composite key starts with the sentinel year;
cleanup deletes exactly that prefix.
"""
import pytest
from neomodel import db

SENTINEL = "9999-9999"
NAME = f"{SENTINEL} Pope Tech WAVE errors (sfsu)"
SCHEMA = "popetech-metric-snapshot/1"

SNAPSHOT = {
    "schema": SCHEMA,
    "as_of": "2026-10-01",
    "coverage": {"pages": 24508},
    "errors": {
        "incl_contrast": 65429,
        "excl_contrast": 10472,
        "categories": {"contrast": {"count": 54957, "pages": 14226}},
    },
}

pytestmark = [pytest.mark.integration]


@pytest.fixture
def cleanup_metrics(neo4j_connection):
    yield
    db.cypher_query(
        "MATCH (m:Metric) WHERE m.name STARTS WITH $prefix OR m.composite_key STARTS WITH $prefix "
        "DETACH DELETE m",
        {"prefix": SENTINEL},
    )


def _add(**overrides):
    from app.database.queries.documentation.create import add_metric

    metric_dict = {
        "name": NAME,
        "metric_type": "tabular",
        "composite_key": f"{SENTINEL}_popetech_sfsu_2026-10-01",
        "value_dict": SNAPSHOT,
        "value_schema": SCHEMA,
        "measured_on": "2026-10-01",
    }
    metric_dict.update(overrides)
    return add_metric(metric_dict)


# --- Layer 3: create / update functions -----------------------------------------

def test_json_value_round_trips_through_serialize(cleanup_metrics):
    from app.database.graph_schema import Metric

    assert _add() is True
    metric = Metric.nodes.get(composite_key=f"{SENTINEL}_popetech_sfsu_2026-10-01")
    out = metric.serialize()
    assert out["data"] == SNAPSHOT
    assert out["value_schema"] == SCHEMA
    assert out["measured_on"] == "2026-10-01"


def test_explicit_composite_key_allows_a_dated_series(cleanup_metrics):
    from app.database.graph_schema import Metric

    _add()
    _add(composite_key=f"{SENTINEL}_popetech_sfsu_2026-09-01", measured_on="2026-09-01")
    series = Metric.nodes.filter(name=NAME)
    assert sorted(m.measured_on.isoformat() for m in series) == ["2026-09-01", "2026-10-01"]


def test_default_composite_key_is_unchanged(cleanup_metrics):
    from app.database.graph_schema import Metric
    from app.endpoints.data_api.errors.custom_exceptions import ValidationError

    _add(composite_key=None)
    assert Metric.nodes.get_or_none(composite_key=f"{NAME}_tabular") is not None
    with pytest.raises(ValidationError):
        _add(composite_key=None)


@pytest.mark.parametrize("stored,expected", [
    ("", None),                       # legacy rows hold '""'
    ('{"a": 1}', {"a": 1}),           # legacy pre-encoded object
    (None, None),
])
def test_legacy_string_values_still_read(cleanup_metrics, stored, expected):
    from app.database.graph_schema import Metric

    key = f"{SENTINEL}_legacy_{stored!r}"
    Metric(name=f"{SENTINEL} legacy", composite_key=key, value_dict=stored).save()
    assert Metric.nodes.get(composite_key=key).serialize()["data"] == expected


def test_bad_measured_on_saves_nothing(cleanup_metrics):
    from app.database.graph_schema import Metric
    from app.endpoints.data_api.errors.custom_exceptions import ValidationError

    with pytest.raises(ValidationError):
        _add(measured_on="2026-10")
    assert Metric.nodes.get_or_none(composite_key=f"{SENTINEL}_popetech_sfsu_2026-10-01") is None


def test_unknown_academic_year_saves_nothing(cleanup_metrics):
    from app.database.graph_schema import Metric
    from app.endpoints.data_api.errors.custom_exceptions import NotFoundError

    with pytest.raises(NotFoundError):
        _add(academic_year="1066-1067")
    assert Metric.nodes.get_or_none(composite_key=f"{SENTINEL}_popetech_sfsu_2026-10-01") is None


def test_known_academic_year_links(cleanup_metrics, sentinel_academic_year):
    from app.database.graph_schema import Metric

    _add(academic_year=SENTINEL)
    metric = Metric.nodes.get(composite_key=f"{SENTINEL}_popetech_sfsu_2026-10-01")
    assert [ay.name for ay in metric.academic_year.all()] == [SENTINEL]


def test_update_sets_and_clears_the_new_fields(cleanup_metrics):
    from app.database.graph_schema import Metric
    from app.database.queries.documentation.update import update_metric

    _add(value_schema=None, measured_on=None)
    metric = Metric.nodes.get(composite_key=f"{SENTINEL}_popetech_sfsu_2026-10-01")

    update_metric({"unique_id": metric.unique_id, "value_schema": SCHEMA, "measured_on": "2026-10-01"})
    out = Metric.nodes.get(unique_id=metric.unique_id).serialize()
    assert (out["value_schema"], out["measured_on"]) == (SCHEMA, "2026-10-01")

    update_metric({"unique_id": metric.unique_id, "measured_on": ""})
    assert Metric.nodes.get(unique_id=metric.unique_id).serialize()["measured_on"] is None


# --- Layer 5: the list endpoint that used to 500 on a JSON-valued metric --------

@pytest.mark.api
def test_metrics_endpoint_serves_json_valued_metric(flask_client, cleanup_metrics):
    _add()
    resp = flask_client.get("/ati/data-api/v1/documents/metrics")
    assert resp.status_code == 200, resp.get_data(as_text=True)[:500]
    ours = [m for m in resp.get_json()["data"] if m["composite_key"] == f"{SENTINEL}_popetech_sfsu_2026-10-01"]
    assert len(ours) == 1
    assert ours[0]["data"] == SNAPSHOT
