"""
Export every Plan + related info from the live graph to plans_export.json.

READ-ONLY against Neo4j. Run from project root:
    python app/asana-connector/export_plans.py

The query/summary logic now lives in graph_export.py so the live connector and
this script stay in sync. This script just wires up the connection, writes the
JSON snapshot, and prints the summary.
"""
import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(os.path.dirname(HERE))
sys.path.insert(0, HERE)
sys.path.insert(0, PROJECT_ROOT)

from app.database.graph_schema import set_connection  # noqa: E402
from graph_export import fetch_plans, print_summary    # noqa: E402

OUT_PATH = os.path.join(HERE, "plans_export.json")


def main():
    set_connection()
    plans = fetch_plans()
    with open(OUT_PATH, "w", encoding="utf-8") as f:
        json.dump(plans, f, indent=2, default=str)
    print_summary(plans, OUT_PATH)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
