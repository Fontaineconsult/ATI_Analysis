// ingest_2026_10_14_ssu_instructional_materials.cypher
//
// Source: MeetingMinutes "Sonoma Instructional Materials Working Group 10/14"
//         unique_id e9f1610cef814d23b72050eb08886128, meeting_date 2026-10-14,
//         minutes_under_plan -> 2025-2026-ssu-ins. Zoom AI summary, so most facts are
//         reported (S2/S4) rather than first-person operational.
// Ingested by: Daniel Fontaine. Manifest approved 2026-10-14 with corrections.
//
// Identity resolutions (existing): "Sandy" -> Sandra Ayala, "Timothy" -> Tim Hensel,
// "Kim Hester Williams" -> Kim D. Hester Williams, "Noelia" -> Noelia Franzen,
// "Steve" -> Steve Higginbotham, "John" -> John Lynch, "Youngmin" -> Youngmin Chun.
// Created: Mamie Yang, details supplied by the user: student, Early Childhood Studies,
// yangmam@sonoma.edu, ATI member on the Instructional Materials working group.
// employee_id 291690756 is a random placeholder, checked for collision, NOT a real number.
// No Person->Department edge exists in the schema, so the department is in `title`.
// "Kinesiology" in the attendee list is unresolved and not acted on.
//
// Judgment calls (user corrections applied):
//   Query 2d002479 (sixth video component) settled: accessible syllabi, from the poster.
//   CSU text-to-speech licensing (Kurzweil, Speechify) dropped: not evidence for Sonoma.
//   Acrobat awareness routed as a Recommendation on 7.5-ins-ssu, not a Note.
//   Christine Hayes and Kyle Falbo added to the Web working group (user named Kyle).
//   Web committee rebuild is its own Note on 7.6-web-ssu.
//   No implementations, plans, queries, concerns or tools. Individual course work
//   (Kim's course) and meeting logistics not ingested.

// ---------------------------------------------------------------- person
MERGE (p:Person {email: "yangmam@sonoma.edu"})
ON CREATE SET p.unique_id = replace(randomUUID(), "-", ""),
              p.name = "Mamie Yang",
              p.title = "Student, Early Childhood Studies",
              p.employee_id = "291690756",
              p.active = true,
              p.can_approve_yse = false,
              p.ati_involvement = "member",
              p.non_committee_member_active = false;

MATCH (p:Person {email: "yangmam@sonoma.edu"})
MATCH (c:Campus {abbreviation: "ssu"})
MATCH (wg:ATIWorkingGroup {unique_id: "f7207485-2382-416e-b3be-af476b0ed281"})
MERGE (p)-[:works_at_campus]->(c)
MERGE (p)-[:participates_in]->(wg);

// ---------------------------------------------------------------- web working group
MATCH (wg:ATIWorkingGroup {unique_id: "b4e7224a-b33a-4ca2-afc8-4753beab6d69"})
MATCH (p:Person) WHERE p.unique_id IN ["2bc9a1ac4a074276b3ee858666af9673", "37141e1f605f45399af3ea591e4df7b6"]
MERGE (p)-[:participates_in]->(wg);

// ---------------------------------------------------------------- attendance
MATCH (mm:MeetingMinutes {unique_id: "e9f1610cef814d23b72050eb08886128"})
MATCH (p:Person) WHERE p.unique_id IN [
  "f08ad9537d0e4715bcaea932e7663b2f", "a1d223af-c7aa-466b-bf54-47f0a199696d",
  "ad2f8c6c3b984491ba2f9905e657271e", "f74a41a274104438bec0051ad867d4d1",
  "37141e1f605f45399af3ea591e4df7b6", "538d0f04e2814aa8819bebad3f93325b",
  "5f41e9f05b434253b839ffd4a0129c3c", "ace1ad027f664d31a25fe05f11728811",
  "2bc9a1ac4a074276b3ee858666af9673", "706045e5eb7348c789189c7b5490538a",
  "a2489c1708664881b0f7a9912b2c7ca6", "9730d066fe4d4248bc6b49eae58b4374",
  "dd4d0e0da2ce4334863611a95ffc4d93"] OR p.email = "yangmam@sonoma.edu"
MERGE (p)-[:participated_in]->(mm);

// ---------------------------------------------------------------- settle query
MATCH (q:Query {unique_id: "2d002479c587479aa955bed47efabe41"})
MATCH (sa:Person {unique_id: "f08ad9537d0e4715bcaea932e7663b2f"})
SET q.status = "settled", q.date_settled = date("2026-10-14"),
    q.answer = "Accessible syllabi. The committee's six-area poster, presented on 2026-10-14, lists timely book orders, accessible syllabi, proper document formatting, accessible PDFs, alternative text for images and video captioning."
MERGE (q)-[:query_settled_by]->(sa);

// ---------------------------------------------------------------- recommendation
MATCH (y:YearSuccessEvidence {year_identifier: "2025-2026-7.5-ins-ssu"})
MATCH (daniel:Person {unique_id: "a1d223af-c7aa-466b-bf54-47f0a199696d"})
MERGE (r:Recommendation {recommendation: "Tell faculty that Adobe Acrobat is available to them through the Adobe tile"})
ON CREATE SET r.unique_id = replace(randomUUID(), "-", ""), r.status = "open", r.date_created = date("2026-10-14"),
  r.detail = "Faculty know that Sonoma State licenses Adobe Acrobat for them. They know to open it from the Adobe tile. They know it is the supported tool for making PDFs accessible, and that the student remediation team helps with courses that hold many PDFs. No owner was named for the message."
MERGE (y)-[:has_recommendation]->(r)
MERGE (r)-[:created_by]->(daniel);

// ---------------------------------------------------------------- notes (YSE + minutes, optional implementation or plan)
UNWIND [
  {name: "ati-six-areas-poster-oct-2026-yse:2025-2026-8.1-ins-ssu-0e8d7dd5", yse: "2025-2026-8.1-ins-ssu", impl: "1cf80e736e604855856b3709ab1cedb9", plan: null,
   content: "The SSU ATI committee's poster names six areas for instructional materials: timely book orders, accessible syllabi, proper document formatting, accessible PDFs, alternative text for images and video captioning. Committee members use it to present the ATI in department and program meetings. It is kept in the committee's shared folder. Its six areas match the six components of the faculty responsibilities video."},
  {name: "timely-adoption-faculty-tension-oct-2026-yse:2025-2026-1.2-ins-ssu-e629a8df", yse: "2025-2026-1.2-ins-ssu", impl: "d3476faa88b44e588dd6b44004f05063", plan: null,
   content: "Federal law requires textbook information to be available when student registration opens. Faculty who plan courses over winter break, particularly in literature, find the ordering deadline hard to meet. The English department also orders late because of late faculty hiring. The campus has used banners in Canvas to remind faculty of the deadline. The bookstore asks for orders within a window of about six weeks and ties timely orders to lower student cost and to supply."},
  {name: "adoption-timing-alt-media-dependency-oct-2026-yse:2025-2026-4.5-ins-ssu-12f8e06f", yse: "2025-2026-4.5-ins-ssu", impl: "cbe53aaed6f546bbaa209a5b4316065f", plan: null,
   content: "Disability Services depends on early book orders to produce alternate formats in time. A late order delays the request for publisher files, the processing for assistive technology and the handling of bundled materials. Disability Services estimates that the delay reaches about 2,000 students each semester."},
  {name: "remediation-team-prioritization-oct-2026-yse:2025-2026-6.8-ins-ssu-6f040824", yse: "2025-2026-6.8-ins-ssu", impl: "52f6ef49-27c7-47d6-8719-5f8805b98107", plan: null,
   content: "The student remediation team prioritizes high-impact courses with low UDOIT scores. Tim Hensel reported 21 courses fully remediated to scores of 98 or above as of 2026-10-14, a running total with no export behind it. Courses with many PDFs, mathematics in particular, are the hardest. The team works with the mathematics department on accessible formulas through workshops."},
  {name: "indicator-prioritization-oct-2026-yse:2025-2026-9.2-ins-ssu-73e31b51", yse: "2025-2026-9.2-ins-ssu", impl: null, plan: "91e38ad56d5840ab802abe489c7f455f",
   content: "Daniel Fontaine presented the SFBRN success indicators for instructional materials, web, procurement and governance. The committee is to choose which indicators to prioritize for the coming year. The list goes to John Lynch and Sandra Ayala to organize the ranking."},
  {name: "web-committee-rebuild-oct-2026-yse:2025-2026-7.6-web-ssu-5593eaf0", yse: "2025-2026-7.6-web-ssu", impl: null, plan: null,
   content: "Sonoma State's web ATI committee is to be rebuilt once a new director is in place. Christine Hayes and Kyle Falbo are joining it."}
] AS row
MATCH (y:YearSuccessEvidence {year_identifier: row.yse})
MATCH (mm:MeetingMinutes {unique_id: "e9f1610cef814d23b72050eb08886128"})
MATCH (daniel:Person {unique_id: "a1d223af-c7aa-466b-bf54-47f0a199696d"})
MERGE (n:Note {name: row.name})
ON CREATE SET n.unique_id = replace(randomUUID(), "-", ""), n.content = row.content, n.date_created = date("2026-10-14"), n.include_in_report = false, n.depreciated = false
MERGE (y)-[:has_note]->(n)
MERGE (mm)-[:has_note]->(n)
MERGE (n)-[:created_by]->(daniel)
WITH n, row
CALL (n, row) {
  WITH n, row WHERE row.impl IS NOT NULL
  MATCH (i {unique_id: row.impl})
  MERGE (i)-[:is_documented_by]->(n)
}
CALL (n, row) {
  WITH n, row WHERE row.plan IS NOT NULL
  MATCH (p:Plan {unique_id: row.plan})
  MERGE (p)-[:progress_documented_by]->(n)
};

// ---------------------------------------------------------------- stamp
MATCH (mm:MeetingMinutes {unique_id: "e9f1610cef814d23b72050eb08886128"})
SET mm.ontology_ingested = true, mm.ontology_ingest_date = date("2026-10-14"),
  mm.ontology_ingest_note = "1 person created (Mamie Yang, student member, Instructional Materials WG), 2 people added to the Web WG (Christine Hayes, Kyle Falbo), 14 participants wired, 6 notes (4 also on implementations, 1 on the indicator sign-off plan), 1 recommendation (Acrobat awareness), 1 of 13 open SSU queries settled (sixth video component). CSU text-to-speech licensing not ingested: not Sonoma evidence.";
