// Back-label migration: add :OrgUnit to legacy :Department / :College nodes.
//
// WHY: graph_schema re-parented Department and College under OrgUnit. neomodel
// registers those classes under the FULL label set {OrgUnit, Department} /
// {OrgUnit, College}, so nodes created since then carry both labels — but the
// 17 Departments + 2 Colleges created before the re-parenting carry only their
// own label. Any neomodel read that inflates them (Department.nodes.all(),
// get_all_departments → /organizational-units?type=departments) throws
// "Node with labels Department does not resolve to any of the known objects",
// which 500s the department/college dropdown feeds (EmployersEditor,
// StewardshipCard). The schema docstring deferred this migration; this runs it.
//
// Idempotent: the WHERE guard means a re-run matches nothing (0 writes).
// Scope check (2026-08-09): 17 legacy Departments, 2 legacy Colleges.
MATCH (n) WHERE (n:Department OR n:College) AND NOT n:OrgUnit SET n:OrgUnit;
