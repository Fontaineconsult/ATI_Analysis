// ============================================================================
// ATI knowledge-graph presentation fan-out
//
// Center: one AcademicYear. Rings, inside → out:
//   AY ← CampusPlan → Campus
//              └→ WorkingGroupPlan → ATIWorkingGroup
//                        └→ group leads (Person)
//                                └→ implementations they work on
//                                        └→ supporting documents / webpages
//
// Paste the whole statement into Neo4j Browser (it renders the union as one
// graph). Change the $year literal in each arm to re-center on another year.
// Presentation tips: use the force-directed layout, drag the AcademicYear
// node to the middle and pin it, then style node color by label and caption
// by name/title. 2025-2026 is the richest year (people + evidence + docs).
// ============================================================================

MATCH p = (ay:AcademicYear {name:'2025-2026'})<-[:in_academic_year]-(:CampusPlan)-[:is_campus_plan_for]->(:Campus)
RETURN p
UNION
MATCH p = (:AcademicYear {name:'2025-2026'})<-[:in_academic_year]-(:CampusPlan)
          -[:has_working_group_plan]->(:WorkingGroupPlan)-[:for_working_group]->(:ATIWorkingGroup)
RETURN p
UNION
MATCH p = (:AcademicYear {name:'2025-2026'})<-[:in_academic_year]-(:CampusPlan)
          -[:has_working_group_plan]->(:WorkingGroupPlan)-[:has_group_lead]->(:Person)
RETURN p
UNION
MATCH p = (:AcademicYear {name:'2025-2026'})<-[:in_academic_year]-(:CampusPlan)
          -[:has_working_group_plan]->(:WorkingGroupPlan)-[:has_group_lead]->(:Person)
          -[:worked_on]->(impl)
RETURN p
UNION
MATCH p = (:AcademicYear {name:'2025-2026'})<-[:in_academic_year]-(:CampusPlan)
          -[:has_working_group_plan]->(:WorkingGroupPlan)-[:has_group_lead]->(:Person)
          -[:worked_on]->(impl)-[:is_documented_by]->(d)
WHERE d:Document OR d:Webpage
RETURN p
