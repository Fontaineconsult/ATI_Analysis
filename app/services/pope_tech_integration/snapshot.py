"""What a Pope Tech snapshot becomes as a Metric. No graph code.

The one definition shared by store.py (which saves through add_metric) and
emit_cypher.py (which writes the same thing as a reviewable batch file).
"""
from app.endpoints.data_api.errors.custom_exceptions import ValidationError
from app.services.pope_tech_integration import config

METRIC_TYPE = "tabular"


def composite_key(snapshot: dict, academic_year: str) -> str:
    """'<academic year>_popetech_<campus>_<as of>', one per campus per date per year."""
    return f"{academic_year}_popetech_{snapshot['org']['campus']}_{snapshot['as_of']}"


def snapshot_metric_dict(snapshot: dict, academic_year: str) -> dict:
    """The add_metric payload for one snapshot. Refuses anything it can't record."""
    if snapshot.get("schema") != config.SNAPSHOT_SCHEMA:
        raise ValidationError(
            f"Expected schema {config.SNAPSHOT_SCHEMA}, got {snapshot.get('schema')!r}")
    if not snapshot.get("has_data"):
        raise ValidationError(f"Snapshot for {snapshot.get('as_of')} holds no scan data")
    org = snapshot.get("org") or {}
    if not org.get("campus") or not snapshot.get("as_of"):
        raise ValidationError("Snapshot is missing org.campus or as_of")

    excl = (snapshot.get("errors") or {}).get("excl_contrast")
    name = org.get("name") or org["campus"]
    return {
        "name": f"Pope Tech WAVE errors ({org['campus']})",
        "metric_type": METRIC_TYPE,
        "composite_key": composite_key(snapshot, academic_year),
        "description": (
            f"Pope Tech WAVE scan of {name} as of {snapshot['as_of']}. "
            "The value is the error count excluding contrast. "
            "The stored JSON holds the full snapshot."
        ),
        "single_value": None if excl is None else str(excl),
        "value_dict": snapshot,
        "value_schema": snapshot["schema"],
        "measured_on": snapshot["as_of"],
        "academic_year": academic_year,
    }
