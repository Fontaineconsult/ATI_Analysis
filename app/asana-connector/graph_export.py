"""
Read every Plan + its working-group / campus / year / indicator context from
the live Neo4j graph.

``fetch_plans()`` assumes the neomodel connection is **already** configured —
by Flask ``create_app()`` when wired into the app, or by a caller that invoked
``set_connection()`` (see ``export_plans.py`` / ``push_to_asana.py``). This
mirrors the project rule that query modules never call ``set_connection()`` at
import time.

READ-ONLY: a single Cypher MATCH, no writes.
"""
from collections import Counter

# Working group is reached authoritatively via the responsible-for edge:
#   ATIWorkingGroup -[:responsible_for]-> Goal -[:supported_by]-> SuccessIndicator
# either from the plan's directly-furthered goal, or via its YSE's indicator.
PLANS_QUERY = """
MATCH (plan:Plan)
OPTIONAL MATCH (plan)-[:in_academic_year]->(py:AcademicYear)
OPTIONAL MATCH (wgp:WorkingGroupPlan)-[:includes_plan]->(plan)
OPTIONAL MATCH (wgp)-[:for_working_group]->(wg:ATIWorkingGroup)
OPTIONAL MATCH (cp:CampusPlan)-[:has_working_group_plan]->(wgp)
OPTIONAL MATCH (cp)-[:is_campus_plan_for]->(cpCampus:Campus)
OPTIONAL MATCH (plan)-[:furthers_goal]->(g:Goal)
OPTIONAL MATCH (plan)-[:furthers_yse]->(yse:YearSuccessEvidence)
OPTIONAL MATCH (yse)-[:evidence_at_campus]->(yseCampus:Campus)
OPTIONAL MATCH (yse)-[:tracks]->(si:SuccessIndicator)
OPTIONAL MATCH (g)<-[:responsible_for]-(wgViaGoal:ATIWorkingGroup)
OPTIONAL MATCH (si)<-[:supported_by]-(:Goal)<-[:responsible_for]-(wgViaInd:ATIWorkingGroup)
WITH plan, py, wgp, wg, cpCampus, yseCampus, g, si, wgViaGoal, wgViaInd
RETURN plan.unique_id     AS uid,
       plan.name          AS name,
       plan.description    AS description,
       plan.plan_status    AS plan_status,
       plan.is_key_plan    AS is_key_plan,
       plan.is_campus_plan AS is_campus_plan,
       plan.abandoned      AS abandoned,
       collect(DISTINCT py.name)                              AS plan_years,
       collect(DISTINCT coalesce(wg.name, wgViaGoal.name,
                                 wgViaInd.name))              AS working_groups,
       collect(DISTINCT coalesce(cpCampus.abbreviation,
                                 yseCampus.abbreviation))     AS campuses,
       collect(DISTINCT g.goal_number)                        AS goal_numbers,
       collect(DISTINCT si.composite_key)                     AS indicators
ORDER BY name
"""

LIST_FIELDS = ("plan_years", "working_groups", "campuses", "goal_numbers", "indicators")


def fetch_plans():
    """Return a list of plan dicts (one per :Plan node). Connection must be set."""
    from neomodel import db
    rows, cols = db.cypher_query(PLANS_QUERY)
    plans = []
    for row in rows:
        rec = dict(zip(cols, row))
        for k in LIST_FIELDS:
            rec[k] = [v for v in (rec.get(k) or []) if v is not None]
        plans.append(rec)
    return plans


def breakdown(plans, field):
    counts = Counter()
    for p in plans:
        for v in (p.get(field) or ["(none)"]):
            counts[str(v)] += 1
    return counts


def print_summary(plans, out_path=None):
    """Print the same human-readable summary the original export script did."""
    print(f"TOTAL PLANS: {len(plans)}")
    if out_path:
        print(f"written to: {out_path}")
    for label, field in (("BY WORKING GROUP", "working_groups"),
                         ("BY ACADEMIC YEAR", "plan_years"),
                         ("BY CAMPUS", "campuses")):
        print(f"\n{label}:")
        for k, v in breakdown(plans, field).most_common():
            print(f"  {v:4d}  {k}")
    print("\nFLAGS:")
    print(f"  is_campus_plan=true : {sum(1 for p in plans if p['is_campus_plan'])}")
    print(f"  is_key_plan=true    : {sum(1 for p in plans if p['is_key_plan'])}")
    print(f"  abandoned=true      : {sum(1 for p in plans if p['abandoned'])}")
    print("\nFIRST 8 PLANS (sample):")
    for p in plans[:8]:
        print(f"  - {p['name']!r}  wg={p['working_groups']} campus={p['campuses']} "
              f"year={p['plan_years']} status={p['plan_status']!r}")
