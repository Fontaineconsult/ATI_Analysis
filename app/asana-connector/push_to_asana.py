"""
CLI: push the plans graph (or a saved asana_payload.json) into a new Asana project.

Run from the project root (PYTHONPATH is bootstrapped below so a bare shell works):

    # Preview only — no credentials, no network:
    python app/asana-connector/push_to_asana.py --dry-run

    # Live push from the graph (needs ASANA_* env vars set):
    python app/asana-connector/push_to_asana.py --project-name "ATI Plans 2025-2026"

    # Live push from a previously exported payload (no DB needed):
    python app/asana-connector/push_to_asana.py --from-json asana_payload.json
"""
import argparse
import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(os.path.dirname(HERE))  # .../ATI_Analysis
# Make sibling modules importable by bare name, and `app...` importable from a bare shell.
sys.path.insert(0, HERE)
sys.path.insert(0, PROJECT_ROOT)

from connector import sync_plans_to_asana  # noqa: E402


def main(argv=None):
    parser = argparse.ArgumentParser(description="Push ATI plans into an Asana project.")
    parser.add_argument("--dry-run", action="store_true",
                        help="Preview sections/tasks; no credentials or network calls.")
    parser.add_argument("--project-name", default=None,
                        help="Asana project name (default: 'ATI Plans Import <date>').")
    parser.add_argument("--from-json", metavar="PATH", default=None,
                        help="Use a saved sections payload (e.g. asana_payload.json) "
                             "instead of querying the graph.")
    parser.add_argument("--reuse-existing-project", action="store_true",
                        help="Push into an existing project of the same name if found.")
    parser.add_argument("--project-gid", default=None,
                        help="Push into this exact existing project by gid (reuses "
                             "same-named sections; no workspace/team needed).")
    args = parser.parse_args(argv)

    sections = None
    if args.from_json:
        path = args.from_json
        if not os.path.isabs(path):
            path = os.path.join(HERE, path)
        with open(path, encoding="utf-8") as f:
            sections = json.load(f)
        print(f"Loaded {len(sections)} sections from {path}")
    else:
        # Graph path: configure the neomodel connection like the other scripts do.
        from app.database.graph_schema import set_connection
        set_connection()

    summary = sync_plans_to_asana(
        project_name=args.project_name,
        sections=sections,
        dry_run=args.dry_run,
        reuse_existing_project=args.reuse_existing_project,
        target_project_gid=args.project_gid,
    )
    print("\n=== summary ===")
    print(json.dumps(summary, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
