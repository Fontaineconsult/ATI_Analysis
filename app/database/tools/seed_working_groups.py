"""
Seed / reconcile the ATIWorkingGroup nodes (and, optionally, back-fill a new group's
per-campus WorkingGroupPlans).

The ATI working groups are identity nodes keyed by their unique ``name``. Historically the
three original groups were provisioned out-of-band (a DB dump) with **no scripted creation
path**, so adding a new working group (e.g. "Steering") had nowhere to be created. This tool
is that path: it MERGEs one ``ATIWorkingGroup`` per entry in
``data_config.WORKING_GROUP_DEFS`` (idempotent, keyed on ``name``), reporting what already
exists and what it would create. It never modifies or deletes existing working-group nodes,
and it does NOT create Goals / SuccessIndicators / YSE — that domain content is authored
through the normal admin paths.

With ``--backfill-plans`` it also connects a WorkingGroupPlan for every configured group to
each existing CampusPlan that is missing one (using the sanctioned
``create_working_group_plan``), so a newly-added group gets plan scaffolding on the campus
plans that already exist. Future academic-year rollovers create these automatically because
the new code is now in ``working_group_abbrevs``.

Dry-run by default — safe to run anytime. Live-DB writes happen ONLY with ``--apply``.

Run (from the app host, e.g. C:\\www\\ati):
    python -m app.database.tools.seed_working_groups                       # dry-run: nodes
    python -m app.database.tools.seed_working_groups --apply               # create missing nodes
    python -m app.database.tools.seed_working_groups --backfill-plans      # dry-run: nodes + plans
    python -m app.database.tools.seed_working_groups --apply --backfill-plans   # do both
"""
import sys

from app.data_config import WORKING_GROUP_DEFS, working_group_abbrevs
from app.database.identifiers import make_working_group_plan_identifier


def seed_nodes(apply: bool):
    """MERGE one ATIWorkingGroup per WORKING_GROUP_DEFS entry. Returns (created, existing)."""
    from app.database.graph_schema import ATIWorkingGroup
    created, existing = [], []
    for wg in WORKING_GROUP_DEFS:
        name = wg["name"]
        if ATIWorkingGroup.nodes.get_or_none(name=name):
            existing.append(name)
            continue
        if apply:
            ATIWorkingGroup(name=name).save()
        created.append(name)  # created, or "would create" in dry-run
    return created, existing


def backfill_plans(apply: bool):
    """For each existing CampusPlan, ensure a WorkingGroupPlan exists for every configured
    working group. Returns a list of (campus, year, code) that were (or would be) created."""
    from app.database.graph_schema import CampusPlan, WorkingGroupPlan
    from app.database.queries.committees.create import create_working_group_plan

    to_create = []
    for plan in CampusPlan.nodes.all():
        campus = plan.campus.single()
        year = plan.academic_year.single()
        if not (campus and year):
            continue
        campus_abbrev = campus.abbreviation
        year_name = year.name
        existing_ids = {wgp.plan_identifier for wgp in plan.working_group_plans.all()}
        for code in working_group_abbrevs:
            wgp_id = make_working_group_plan_identifier(year_name, campus_abbrev, code)
            if wgp_id in existing_ids:
                continue
            to_create.append((campus_abbrev, year_name, code))
            if apply:
                wgp = create_working_group_plan(campus_abbrev, year_name, code)
                plan.working_group_plans.connect(wgp)
    return to_create


def main(argv):
    apply = "--apply" in argv
    do_plans = "--backfill-plans" in argv

    # create_app() both warms up the data_api package (dodging the latent circular import
    # when we later import queries.committees.create) and configures the DB connection.
    from app import create_app
    app = create_app()
    with app.app_context():
        mode = "APPLIED (live-DB writes)" if apply else "DRY-RUN — pass --apply to write"
        print(f"seed_working_groups — {mode}\n")

        created, existing = seed_nodes(apply)
        print("ATIWorkingGroup nodes:")
        print(f"  already present ({len(existing)}): {', '.join(existing) or '-'}")
        print(f"  {'created' if apply else 'would create'} ({len(created)}): {', '.join(created) or '-'}")

        if do_plans:
            rows = backfill_plans(apply)
            print("\nWorkingGroupPlan backfill (existing CampusPlans):")
            if not rows:
                print("  nothing to do — every campus plan already has all groups.")
            else:
                verb = "created" if apply else "would create"
                print(f"  {verb} {len(rows)} WorkingGroupPlan(s):")
                for campus_abbrev, year_name, code in rows:
                    print(f"    {make_working_group_plan_identifier(year_name, campus_abbrev, code)}")


if __name__ == "__main__":
    main(sys.argv[1:])
