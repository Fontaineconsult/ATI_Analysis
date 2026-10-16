"""Command line entry: build the annual status report as a Word document.

    python -m app.database.tools.report_export.annual_report --year 2025-2026
    python -m app.database.tools.report_export.annual_report --year 2025-2026 --campus sfsu
    python -m app.database.tools.report_export.annual_report --year 2025-2026 --out C:/reports --json

Without --campus, one document per campus. --json also writes the model beside each
document, which is the input for any other renderer. Output goes to ./out next to the
report_export package unless --out says otherwise; that folder is ignored by git.
"""
from __future__ import annotations

import argparse
import logging
import json
import sys
import time
from pathlib import Path

DEFAULT_OUT = Path(__file__).resolve().parents[1] / "out"


def _progress(n: int, total: int, key: str) -> None:
    sys.stdout.write(f"\r  {n:3d}/{total}  {key:<14}")
    sys.stdout.flush()
    if n == total:
        sys.stdout.write("\n")


def main(argv=None) -> int:
    ap = argparse.ArgumentParser(description="ATI annual status report, as .docx.")
    ap.add_argument("--year", required=True, help="academic year, e.g. 2025-2026")
    ap.add_argument("--campus", help="campus abbreviation (sfsu, ssu, csueb); default: every campus")
    ap.add_argument("--out", help=f"output directory (default: {DEFAULT_OUT})")
    ap.add_argument("--json", action="store_true", help="also write the report model as JSON")
    ap.add_argument("--include-removed", action="store_true",
                    help="include indicators removed from the CSU set")
    args = ap.parse_args(argv)

    for stream in (sys.stdout, sys.stderr):
        if hasattr(stream, "reconfigure"):
            stream.reconfigure(encoding="utf-8", errors="replace")
    # The driver relays every server notification (unknown property keys in the
    # app's own rollup query, null-eliminated aggregates) as a WARNING line. They
    # are the app's to fix and they drown the progress line here.
    logging.getLogger("neo4j.notifications").setLevel(logging.ERROR)
    logging.getLogger("neo4j").setLevel(logging.ERROR)

    # Boot the Flask app once for its import side effect. The single-indicator query
    # lives in a queries module, and importing one outside a Flask boot trips the
    # data_api circular import (see CLAUDE.md, Known gotchas). create_app() also
    # configures the neomodel connection from the config gateway.
    from app import create_app
    create_app()
    from app.database.graph_schema import set_connection
    set_connection()

    from . import model as M
    from .docx_renderer import render

    out_dir = Path(args.out) if args.out else DEFAULT_OUT
    out_dir.mkdir(parents=True, exist_ok=True)

    campuses = [args.campus] if args.campus else [c["abbreviation"] for c in M.list_campuses()]
    written = []
    for campus in campuses:
        print(f"{campus} {args.year}")
        started = time.time()
        try:
            report = M.build_campus_year_report(
                args.year, campus, include_removed=args.include_removed, progress=_progress,
            )
        except ValueError as exc:
            print(f"  skipped: {exc}")
            continue
        stem = f"ati_annual_report_{campus}_{args.year}"
        try:
            path = render(report, str(out_dir / f"{stem}.docx"))
        except PermissionError:
            # The previous version is open in Word. Write beside it rather than fail.
            stamped = f"{stem}-{time.strftime('%H%M%S')}"
            path = render(report, str(out_dir / f"{stamped}.docx"))
            print(f"  {stem}.docx is open in another program; wrote {stamped}.docx instead")
            stem = stamped
        written.append(path)
        if args.json:
            (out_dir / f"{stem}.json").write_text(
                json.dumps(report, indent=2, ensure_ascii=False), encoding="utf-8"
            )
        s = report["summary"]
        print(f"  {s['indicators']} indicators, {s['evidence_items']} evidence items, "
              f"{s['plans']} plans in {time.time() - started:.0f}s")
        print(f"  -> {path}")

    if not written:
        print("Nothing written.")
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
