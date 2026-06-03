"""
Build the Asana sections/tasks payload from plans_export.json and write
asana_payload.json.

The bucketing/notes logic now lives in payload.py (shared with the live
connector). This script is the offline file-to-file step.

    python app/asana-connector/build_payload.py
"""
import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)

from payload import build_sections, count_tasks  # noqa: E402

IN_PATH = os.path.join(HERE, "plans_export.json")
OUT_PATH = os.path.join(HERE, "asana_payload.json")


def main():
    with open(IN_PATH, encoding="utf-8") as f:
        plans = json.load(f)
    sections = build_sections(plans)
    with open(OUT_PATH, "w", encoding="utf-8") as f:
        json.dump(sections, f, indent=2)
    print(f"sections: {[(s['sectionName'], len(s['tasks'])) for s in sections]}")
    print(f"total tasks: {count_tasks(sections)}")
    print(f"written: {OUT_PATH}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
