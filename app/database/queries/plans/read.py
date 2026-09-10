#
# PLANS READ QUERIES
#
# The first module of the plans domain (the extraction the implementation
# module has needed for a while): plan reads live here, starting with the
# board the /plans view renders from. Create/update still live in
# queries/implementation/ until their own slice moves them.
#
from datetime import date

from neomodel import db

from app.endpoints.data_api.errors.custom_exceptions import ValidationError

# One row per Plan visible at this campus + year. Scoping and visibility are
# the SAME rule the campus-plan view and the Asana export use (see
# _PLANS_FOR_WGP_QUERY and asana-connector/graph_export.py): the anchor is a
# furthers_yse edge into the year at the campus, and plans completed or
# abandoned in a DIFFERENT year are someone else's books.
#
# The subtask projection feeds the task rollups computed in Python: the board
# is a task tracker, so every row carries how much of its work is open,
# overdue, and unowned, without a per-plan fetch.
_PLANS_BOARD_QUERY = """
MATCH (plan:Plan)
OPTIONAL MATCH (plan)-[:completed_in_year]->(completedYear:AcademicYear)
OPTIONAL MATCH (plan)-[:abandoned_in_year]->(abandonedYear:AcademicYear)
WITH plan, completedYear, abandonedYear
WHERE size([(plan)-[:furthers_yse]->(e:YearSuccessEvidence)
            WHERE (e)-[:evidence_in_year]->(:AcademicYear {name: $year_name})
              AND (e)-[:evidence_at_campus]->(:Campus {abbreviation: $campus_abbrev})
            | 1]) > 0
  AND (completedYear IS NULL OR completedYear.name = $year_name)
  AND (NOT coalesce(plan.abandoned, false)
       OR (abandonedYear IS NOT NULL AND abandonedYear.name = $year_name))
OPTIONAL MATCH (plan)-[:furthers_goal]->(g:Goal)
OPTIONAL MATCH (plan)-[:furthers_yse]->(yse:YearSuccessEvidence)-[:tracks]->(si:SuccessIndicator)
OPTIONAL MATCH (g)<-[:responsible_for]-(wgViaGoal:ATIWorkingGroup)
OPTIONAL MATCH (si)<-[:supported_by]-(:Goal)<-[:responsible_for]-(wgViaInd:ATIWorkingGroup)
WITH plan, completedYear, abandonedYear,
     collect(DISTINCT coalesce(wgViaGoal.name, wgViaInd.name)) AS working_groups,
     collect(DISTINCT g.goal_number) AS goal_numbers,
     collect(DISTINCT si.composite_key) AS indicators
RETURN plan.unique_id      AS unique_id,
       plan.name           AS name,
       plan.description    AS description,
       plan.plan_status    AS plan_status,
       plan.is_key_plan    AS is_key_plan,
       plan.is_campus_plan AS is_campus_plan,
       plan.abandoned      AS abandoned,
       plan.abandoned_notes  AS abandoned_notes,
       plan.completion_notes AS completion_notes,
       toString(plan.completed_date) AS completed_date,
       plan.asana_task_gid AS asana_task_gid,
       completedYear.name  AS completed_year,
       abandonedYear.name  AS abandoned_year,
       [wg IN working_groups WHERE wg IS NOT NULL | wg] AS working_groups,
       [gn IN goal_numbers WHERE gn IS NOT NULL | gn]   AS goal_numbers,
       [ik IN indicators WHERE ik IS NOT NULL | ik]     AS indicators,
       [ (plan)-[:progress_documented_by]->(n:Note) | {
           note: {properties: {
               unique_id: n.unique_id, name: n.name, content: n.content,
               date_created: toString(n.date_created)
           }},
           created_by: head([ (n)-[:created_by]->(p:Person) | {properties: {
               unique_id: p.unique_id, name: p.name, email: p.email,
               employee_id: p.employee_id
           }} ])
       } ] AS progress_notes,
       [ (plan)-[:has_asana_subtask]->(s:AsanaSubtask) | {
           completed: coalesce(s.completed, false),
           due_on: s.due_on,
           task_status: s.task_status,
           assigned: size([(s)-[:assigned_to]->(:Person) | 1]) > 0
       } ] AS subtasks
ORDER BY name
"""


# Every subtask on the campus+year's visible plans, with the context a
# cross-plan task list needs: which plan, who owns it, when it is due. Same
# plan-visibility WHERE as the board query.
_TASKS_BOARD_QUERY = """
MATCH (plan:Plan)-[:has_asana_subtask]->(s:AsanaSubtask)
OPTIONAL MATCH (plan)-[:completed_in_year]->(completedYear:AcademicYear)
OPTIONAL MATCH (plan)-[:abandoned_in_year]->(abandonedYear:AcademicYear)
WITH plan, s, completedYear, abandonedYear
WHERE size([(plan)-[:furthers_yse]->(e:YearSuccessEvidence)
            WHERE (e)-[:evidence_in_year]->(:AcademicYear {name: $year_name})
              AND (e)-[:evidence_at_campus]->(:Campus {abbreviation: $campus_abbrev})
            | 1]) > 0
  AND (completedYear IS NULL OR completedYear.name = $year_name)
  AND (NOT coalesce(plan.abandoned, false)
       OR (abandonedYear IS NOT NULL AND abandonedYear.name = $year_name))
RETURN s.unique_id      AS unique_id,
       s.asana_gid      AS asana_gid,
       s.name           AS name,
       s.notes          AS notes,
       coalesce(s.completed, false) AS completed,
       s.task_status    AS task_status,
       s.resolution_note AS resolution_note,
       s.due_on         AS due_on,
       s.assignee_name  AS assignee_name,
       s.permalink_url  AS permalink_url,
       head([ (s)-[:assigned_to]->(p:Person) |
              {unique_id: p.unique_id, name: p.name, employee_id: p.employee_id} ])
           AS assigned_to,
       {unique_id: plan.unique_id, name: plan.name} AS plan
ORDER BY coalesce(s.due_on, '9999-12-31'), s.name
"""


def tasks_board(campus_abbrev: str, year_name: str) -> list:
    """Every progress subtask across the campus+year's visible plans.

    The cross-plan task list: each row carries its plan, its owner (the
    assigned_to Person when resolvable, the Asana mirror name otherwise), and
    a derived `overdue` flag. Open tasks sort by due date at the source;
    completion filtering is the caller's choice.
    """
    if not campus_abbrev or not year_name:
        raise ValidationError("campus_abbrev and year_name are required.")

    rows, cols = db.cypher_query(
        _TASKS_BOARD_QUERY,
        {"campus_abbrev": campus_abbrev, "year_name": year_name},
    )
    today = date.today().isoformat()
    tasks = []
    for row in rows:
        rec = dict(zip(cols, row))
        rec["overdue"] = bool(
            not rec["completed"] and rec["due_on"] and rec["due_on"] < today
        )
        tasks.append(rec)
    return tasks


def plans_board(campus_abbrev: str, year_name: str) -> list:
    """The /plans view's one read: every visible plan with its task rollups.

    Each row carries the plan's fields, its working-group / goal / indicator
    context, the legacy progress notes (the detail panel still renders them),
    and four derived task counts: total, open, overdue (due before today and
    not completed), and unowned (open with nobody assigned). `no_next_step`
    flags an In Progress plan with no open task, because a plan being worked
    with no recorded next step is exactly what a task tracker exists to catch.
    """
    if not campus_abbrev or not year_name:
        raise ValidationError("campus_abbrev and year_name are required.")

    rows, cols = db.cypher_query(
        _PLANS_BOARD_QUERY,
        {"campus_abbrev": campus_abbrev, "year_name": year_name},
    )
    today = date.today().isoformat()
    board = []
    for row in rows:
        rec = dict(zip(cols, row))
        subs = rec.pop("subtasks") or []
        open_subs = [s for s in subs if not s["completed"]]
        rec["tasks_total"] = len(subs)
        rec["tasks_open"] = len(open_subs)
        rec["tasks_overdue"] = sum(
            1 for s in open_subs if s["due_on"] and s["due_on"] < today
        )
        rec["tasks_unassigned_open"] = sum(1 for s in open_subs if not s["assigned"])
        rec["no_next_step"] = bool(
            not rec.get("abandoned")
            and (rec.get("plan_status") == "In Progress")
            and not open_subs
        )
        board.append(rec)
    return board


# Accomplishments with their goal / working-group / year / plan context.
# Deliberately unscoped (the Accomplishments tab has always shown the full
# set); the context columns let the caller filter or group without another
# fetch.
_ACCOMPLISHMENTS_QUERY = """
MATCH (a:Accomplishment)
OPTIONAL MATCH (a)-[:advances_goal]->(g:Goal)
OPTIONAL MATCH (g)<-[:responsible_for]-(wg:ATIWorkingGroup)
OPTIONAL MATCH (a)-[:in_academic_year]->(ay:AcademicYear)
OPTIONAL MATCH (a)-[:achieved_through]->(pl:Plan)
RETURN a.unique_id     AS unique_id,
       a.name          AS name,
       a.description   AS description,
       [w IN collect(DISTINCT wg.name) WHERE w IS NOT NULL | w]        AS working_groups,
       [gn IN collect(DISTINCT g.goal_number) WHERE gn IS NOT NULL | gn] AS goal_numbers,
       [y IN collect(DISTINCT ay.name) WHERE y IS NOT NULL | y]        AS years,
       [p IN collect(DISTINCT CASE WHEN pl IS NULL THEN NULL
                              ELSE {unique_id: pl.unique_id, name: pl.name} END)
        WHERE p IS NOT NULL | p]                                        AS achieved_through
ORDER BY name
"""


def accomplishments_board() -> list:
    """Every Accomplishment with its context, for the Accomplishments tab."""
    rows, cols = db.cypher_query(_ACCOMPLISHMENTS_QUERY, {})
    return [dict(zip(cols, row)) for row in rows]
