"""Evidence control (internal/external) on the is_evidence_for relationship.

The control flag is RELATIVE to the link's YSE: 'external' formally states that
this evidence's owners rely on a practice they don't directly control (another
unit, SFBRN, the CO, a vendor) — the statement the model previously could not
make. Covers the setter round-trip, validation, and the endpoint action.

Reuses the sentinel fixtures from the strength suite (same edge, same isolation).
"""
import pytest

from app.database.queries.evidence.update import (
    assign_implementation_to_year_success_indicator,
    set_evidence_control,
)
from app.endpoints.data_api.errors.custom_exceptions import NotFoundError, ValidationError
from tests.test_implementation_retirement import SENTINEL_TITLE_PREFIX, _sentinel_yse, sentinel_process  # noqa: F401


def _rel(process, yse):
    return process.is_evidence_for.relationship(yse)


@pytest.mark.integration
def test_set_update_and_clear_control(sentinel_process, cleanup_yse_family):
    from tests.conftest import TEST_ACADEMIC_YEAR_NAME
    yse = _sentinel_yse(TEST_ACADEMIC_YEAR_NAME)
    assign_implementation_to_year_success_indicator(
        yse.year_identifier, "Process", sentinel_process.title,
    )
    assert _rel(sentinel_process, yse).control is None, "new links are unspecified"

    assert set_evidence_control(
        yse.year_identifier, "Process", sentinel_process.unique_id, "external"
    ) == {"control": "external"}
    assert _rel(sentinel_process, yse).control == "external"

    assert set_evidence_control(
        yse.year_identifier, "Process", sentinel_process.unique_id, "internal"
    ) == {"control": "internal"}
    assert _rel(sentinel_process, yse).control == "internal"

    assert set_evidence_control(
        yse.year_identifier, "Process", sentinel_process.unique_id, None
    ) == {"control": None}
    assert _rel(sentinel_process, yse).control is None


@pytest.mark.integration
def test_control_validation_and_not_found(sentinel_process, cleanup_yse_family):
    from tests.conftest import TEST_ACADEMIC_YEAR_NAME
    yse = _sentinel_yse(TEST_ACADEMIC_YEAR_NAME)

    with pytest.raises(ValidationError):
        set_evidence_control(yse.year_identifier, "Process", sentinel_process.unique_id, "outsourced")

    with pytest.raises(ValidationError):
        set_evidence_control(yse.year_identifier, "NotAType", sentinel_process.unique_id, "external")

    # Link doesn't exist yet -> NotFound, not silent creation.
    with pytest.raises(NotFoundError):
        set_evidence_control(yse.year_identifier, "Process", sentinel_process.unique_id, "external")


@pytest.mark.integration
@pytest.mark.api
def test_endpoint_set_evidence_control(flask_client, sentinel_process, cleanup_yse_family):
    from tests.conftest import TEST_ACADEMIC_YEAR_NAME
    yse = _sentinel_yse(TEST_ACADEMIC_YEAR_NAME)
    base = "/ati/data-api/v1/implementations"

    flask_client.put(base, json={
        "action": "assign_implementation_to_yse",
        "year_success_identifier": yse.year_identifier,
        "implementation_type": "Process",
        "implementation_title": sentinel_process.title,
    })

    resp = flask_client.put(base, json={
        "action": "set_evidence_control",
        "year_success_identifier": yse.year_identifier,
        "implementation_type": "Process",
        "unique_id": sentinel_process.unique_id,
        "control": "external",
    })
    assert resp.status_code == 200
    assert resp.get_json()["data"] == {"control": "external"}
    assert _rel(sentinel_process, yse).control == "external"

    cleared = flask_client.put(base, json={
        "action": "set_evidence_control",
        "year_success_identifier": yse.year_identifier,
        "implementation_type": "Process",
        "unique_id": sentinel_process.unique_id,
        "control": None,
    })
    assert cleared.status_code == 200
    assert _rel(sentinel_process, yse).control is None
