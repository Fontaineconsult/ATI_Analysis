// =====================================================================================
// Scholarship groundings for principle:shared-responsibility-requiring-coordination.
// Run 2026-10-07 by Daniel Fontaine, on the user's approval.
//
// WHY
//   This is the user's reference principle, and it was left untouched by the two earlier
//   scholarship files (curate_2026_10_07_reading_list_scholarship.cypher and
//   curate_2026_10_07_goodley_treviranus_rose_roulstone.cypher) until the user approved
//   these two additions. Its five existing groundings are all mandates. Both sources here
//   describe the work as carried by many units together. Neither names a coordinating
//   function, which the principle adds.
//   Existing groundings, rationales and shapes on this principle are not changed.
//
// VALIDATE FIRST
//   python -m app.database.cypher_runner.run_file app/database/batch/auto-assignments/curate_2026_10_07_shared_responsibility_scholarship.cypher
//   python -m app.database.cypher_runner.run_file app/database/batch/auto-assignments/curate_2026_10_07_shared_responsibility_scholarship.cypher --execute
// =====================================================================================

UNWIND [
  {src: "Huger, Fostering a Disability-Friendly Institutional Climate (2011)", prov: "Abstract",
   quote: "The partnership and collaboration of institutional departments will offer students with disabilities increased opportunities for academic and social integration.",
   why: "Huger argues that serving students with disabilities requires partnership and collaboration among institutional departments. She names disability services staff, administrators in other offices, faculty, and student leaders as each having a role. The source treats the work as shared across units. It does not say how that work is coordinated. Only the abstract was read."},
  {src: "Goodley, Liddiard, and Lawthom, The depathologising university (2025)", prov: "SJDR 27(1), enabling access as colleagues",
   quote: "Access is not a distraction. Access is not a hindrance. Access is not a parallel process. Access is a welcome comrade.",
   why: "The authors describe access as a staffed and resourced colleague that works alongside researchers, academics, technicians, professional services and support staff. They describe pushing university bureaucracy toward co-production with disabled people's organisations. The source treats access as joint work among many actors inside the institution's ordinary processes. It does not name a coordinating function."}
] AS row
MATCH (p:Principle {handle: "principle:shared-responsibility-requiring-coordination"})
MATCH (i:IntellectualSource {name: row.src})
MERGE (p)-[r:derives_from]->(i)
SET r.provision = row.prov, r.grounding_kind = "scholarship", r.quote = row.quote,
    r.rationale = row.why, r.assessed_date = date("2026-10-07");
