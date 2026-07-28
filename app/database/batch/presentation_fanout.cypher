// ============================================================================
// ATI knowledge-graph presentation fan-out (v2 — documentation-heavy)
//
// One AcademicYear at the center. Rings, inside → out:
//   AY ← CampusPlan → Campus
//        CampusPlan → WorkingGroupPlan → ATIWorkingGroup
//        WorkingGroupPlan → group leads (Person)
//   AY ⇐ every implementation with evidence in the year (virtual 'evidences'
//        edges — APOC collapses the 164-node YSE layer so the fan stays clean)
//   implementations → ALL their supporting Documents and Webpages (real edges)
//
// Paste the whole statement into Neo4j Browser. ~320 nodes / ~460 rels —
// bump Browser's "Initial Node Display" setting to 1000 first.
// Tips: drag + pin the AcademicYear in the middle; color by label; caption
// Person=name, implementations/docs=title|name. Change the year literal to
// re-center (2025-2026 is the documentation-rich year).
//
// Want the evidence layer visible instead (every YSE dot as its own ring)?
// Replace the two implementation blocks with:
//   CALL { WITH ay
//     OPTIONAL MATCH p = (ay)<-[:evidence_in_year]-(:YearSuccessEvidence)
//                        <-[:is_evidence_for]-(impl)
//     RETURN collect(p) AS evidenceRing }
// and return evidenceRing in place of impls + evidenceEdges (~480 nodes).
// ============================================================================

MATCH (ay:AcademicYear {name:'2025-2026'})

// Ring 1 — campus plans and their campuses
CALL { WITH ay
  OPTIONAL MATCH p = (ay)<-[:in_academic_year]-(:CampusPlan)-[:is_campus_plan_for]->(:Campus)
  RETURN collect(p) AS campusRing }

// Ring 2 — working-group plans converging on the working groups
CALL { WITH ay
  OPTIONAL MATCH p = (ay)<-[:in_academic_year]-(:CampusPlan)
                     -[:has_working_group_plan]->(:WorkingGroupPlan)
                     -[:for_working_group]->(:ATIWorkingGroup)
  RETURN collect(p) AS wgRing }

// Ring 3 — the people leading each working-group plan
CALL { WITH ay
  OPTIONAL MATCH p = (ay)<-[:in_academic_year]-(:CampusPlan)
                     -[:has_working_group_plan]->(:WorkingGroupPlan)
                     -[:has_group_lead]->(:Person)
  RETURN collect(p) AS peopleRing }

// Ring 4 — every implementation with evidence in the year (YSE layer collapsed)
CALL { WITH ay
  OPTIONAL MATCH (ay)<-[:evidence_in_year]-(:YearSuccessEvidence)<-[:is_evidence_for]-(impl)
  RETURN collect(DISTINCT impl) AS impls }

// Ring 5 — the full documentation rim: every Document and Webpage those
// implementations are documented by (real edges)
CALL { WITH impls
  UNWIND impls AS i
  OPTIONAL MATCH p = (i)-[:is_documented_by]->(d)
  WHERE d:Document OR d:Webpage
  RETURN collect(p) AS docRing }

RETURN ay,
       campusRing,
       wgRing,
       peopleRing,
       impls,
       [i IN impls | apoc.create.vRelationship(i, 'evidences', {}, ay)] AS evidenceEdges,
       docRing
