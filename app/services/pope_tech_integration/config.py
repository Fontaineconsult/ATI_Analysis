"""Constants for the Pope Tech service.

Where PopeTechIntegrator lives is not decided here. It is the POPE_TECH entry
in app/services/registry.py, located by ATI_SERVICE_POPE_TECH_DIR (and
ATI_SERVICE_POPE_TECH_PYTHON if it has no .venv). PopeTechIntegrator keeps its
own POPE_TECH_API_KEY in its own .env; this repo never holds it.
"""
SERVICE_NAME = "pope_tech_integration"
PROGRAM_KEY = "POPE_TECH"

# The snapshot contract this service reads. A different schema is refused.
SNAPSHOT_SCHEMA = "popetech-metric-snapshot/1"

# ptq metric-snapshot exit codes.
EXIT_OK = 0
EXIT_BAD_DATE = 2
EXIT_WRITE_REFUSED = 4
EXIT_SOME_SKIPPED = 5

DEFAULT_TIMEOUT = 300

# Each campus's Tracking implementation; a saved snapshot is attached to it
# through has_metric. Created 2026-10-12 by
# batch/auto-assignments/create_2026-10-12_pope_tech_scan_metrics_tracking.cypher.
TRACKING_TITLES = {
    "sfsu": "SFSU Pope Tech Scan Metrics",
    "ssu": "SSU Pope Tech Scan Metrics",
    "csueb": "CSUEB Pope Tech Scan Metrics",
}
