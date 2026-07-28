"""
Author the 31 NEW success indicators from the CMM companion into the graph, scoped to a
future academic year via ``introduced_in_year`` (the year-gate). Uses ONLY the sanctioned
create paths (seed_working_groups.seed_nodes, add_goal, create_success_indicator) so the
required-relationship invariants and composite-key uniqueness are enforced.

What it does (idempotent — safe to re-run; skips anything that already exists):
  1. ensure the two new ATIWorkingGroup nodes exist: Communication & Training, Governance
     (via seed_working_groups.seed_nodes — all of WORKING_GROUP_DEFS, others already present).
  2. create the goals the new areas need (com: 1,2 · gov: 1,2,3). The 10 new SIs in existing
     areas (web/ins/pro) reuse goals that already exist.
  3. create all 31 SIs with introduced_in_year = <year> + their companion evidence.
  4. REACTIVATE locally-retired SIs the companion retains (data key `reactivations`, e.g.
     1.2-web): removed -> False, introduced_in_year -> <year> (the re-entry gate, so the SI
     re-enters with this batch instead of reappearing in historical years), text updated to
     the companion wording, companion evidence fields replaced.

The year-gate means these SIs do NOT appear in any year before <year>: year-scoped SI
listings and the AY-rollover stub step exclude introduced_in_year > viewed/rolled year.
They come online when someone rolls to <year> via /semester-migration (which stubs their
YSEs). Data source: new_success_indicators_2026_2027.json (extracted from the companion).

Dry-run by default — reports what it WOULD create. Live-DB writes ONLY with --apply.

Run (from repo root):
    python -m app.database.tools.create_new_success_indicators              # dry-run
    python -m app.database.tools.create_new_success_indicators --apply      # write
"""
import json
import os
import sys

DATA_FILE = os.path.join(os.path.dirname(__file__), "new_success_indicators_2026_2027.json")


def _goal_exists(wg_name, goal_number):
    from neomodel import db
    rows, _ = db.cypher_query(
        "MATCH (:ATIWorkingGroup {name:$n})-[:responsible_for]->(g:Goal {goal_number:$g}) RETURN g",
        {"n": wg_name, "g": int(goal_number)},
    )
    return bool(rows)


def run(apply):
    from app.data_config import working_group_names
    from app.database.graph_schema import SuccessIndicator
    from app.database.queries.indicators.create import add_goal, create_success_indicator
    from app.database.tools.seed_working_groups import seed_nodes

    data = json.load(open(DATA_FILE, encoding="utf-8"))
    year = data["introduced_in_year"]
    verb = "creating" if apply else "would create"

    print(f"=== 1. Working-group nodes ===")
    created_wg, existing_wg = seed_nodes(apply)
    print(f"  already present: {', '.join(existing_wg) or '-'}")
    print(f"  {verb}: {', '.join(created_wg) or '-'}")

    print(f"\n=== 2. Goals (new areas only) ===")
    g_created = g_skipped = 0
    for area, goals in data["goals"].items():
        wg_name = working_group_names[area]
        for gn, title in sorted(goals.items(), key=lambda kv: int(kv[0])):
            if _goal_exists(wg_name, gn):
                print(f"  skip  {wg_name} Goal {gn} (exists)")
                g_skipped += 1
                continue
            print(f"  {verb}  {wg_name} Goal {gn}: {title}")
            if apply:
                add_goal(goal=title, goal_number=int(gn), name=title, removed=False, working_group=area)
            g_created += 1

    print(f"\n=== 3. Success Indicators (introduced_in_year={year}) ===")
    s_created = s_skipped = 0
    for si in data["success_indicators"]:
        key = si["key"]
        if SuccessIndicator.nodes.get_or_none(composite_key=key):
            print(f"  skip  {key} (exists)")
            s_skipped += 1
            continue
        ev = len(si["examples_of_evidence"])
        lvl = "".join(x for x, f in [("E", si["established_example"]),
                                     ("M", si["managed_example"]),
                                     ("O", si["optimizing_example"])] if f) or "-"
        print(f"  {verb}  {key:11s} evid={ev} levels={lvl}")
        if apply:
            create_success_indicator(
                number=si["number"],
                goal_number=si["goal_number"],
                sub_committee=si["sub_committee"],
                success_indicator_text=si["text"],
                introduced_in_year=year,
                examples_of_evidence=si["examples_of_evidence"],
                established_example=si["established_example"],
                managed_example=si["managed_example"],
                optimizing_example=si["optimizing_example"],
            )
        s_created += 1

    print(f"\n=== 4. Reactivations (removed -> False, gate={year}) ===")
    r_done = r_skipped = 0
    for si in data.get("reactivations", []):
        key = si["key"]
        node = SuccessIndicator.nodes.get_or_none(composite_key=key)
        if node is None:
            print(f"  MISSING {key} — expected an existing (removed) SI; nothing to reactivate")
            continue
        if not node.removed and node.introduced_in_year == year:
            print(f"  skip  {key} (already reactivated, gate={year})")
            r_skipped += 1
            continue
        r_verb = "reactivating" if apply else "would reactivate"
        print(f"  {r_verb}  {key} (removed={node.removed} -> False, gate {node.introduced_in_year!r} -> {year!r})")
        if apply:
            # All updates on ONE node object with ONE save. Mixing the per-field
            # update helpers with a separately-fetched node clobbers their writes:
            # neomodel save() writes the full property map, so a stale object
            # resurrects old values (this bit us — removed flipped back to True).
            node.removed = False
            node.introduced_in_year = year
            node.success_indicator = si["text"]
            node.examples_of_evidence = si["examples_of_evidence"] or []
            node.established_example = si["established_example"]
            node.managed_example = si.get("managed_example")
            node.optimizing_example = si.get("optimizing_example")
            node.save()
        r_done += 1

    print(f"\n=== Summary ({'APPLIED' if apply else 'DRY-RUN'}) ===")
    print(f"  working groups: {len(created_wg)} {verb}, {len(existing_wg)} present")
    print(f"  goals:          {g_created} {verb}, {g_skipped} skipped")
    print(f"  indicators:     {s_created} {verb}, {s_skipped} skipped")
    print(f"  reactivations:  {r_done} {verb}, {r_skipped} skipped")
    if not apply:
        print("\n  Dry-run only. Re-run with --apply to write to the live DB.")


def main(argv):
    apply = "--apply" in argv
    from app import create_app
    app = create_app()
    with app.app_context():
        mode = "APPLIED (live-DB writes)" if apply else "DRY-RUN — pass --apply to write"
        print(f"create_new_success_indicators — {mode}\n")
        run(apply)


if __name__ == "__main__":
    main(sys.argv[1:])
