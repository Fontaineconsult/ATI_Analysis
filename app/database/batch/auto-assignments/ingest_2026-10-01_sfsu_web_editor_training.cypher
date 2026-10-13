// ingest_2026-10-01_sfsu_web_editor_training.cypher
//
// Source: MeetingMinutes "Meeting Notes: SF State - Web Editor Training, Accessibility Module"
//         unique_id 012948ca9c604c90b89cb4e6cb4c138e, meeting_date 2026-10-01,
//         already anchored minutes_under_plan -> 2025-2026-sfsu-web.
// Ingested by: Daniel Fontaine. Manifest approved 2026-10-01.
//
// Anchors: reporting year 2025-2026, campus sfsu, working group web.
// No InterviewGuide preps this meeting.
//
// Identity resolutions:
//   Alexis "Lowry" (as written in the minutes) -> Alexis Cabrerra (0279792e...), email cabrera@sfsu.edu.
//     The surname in the minutes is treated as a transcription error. Spelling of the node name
//     ("Cabrerra" vs "Cabrera") is unverified and NOT changed here.
//   Chloe Pearson -> c16582194cbd... (existing). Title set to "Mar Comm Professional II" on the
//     user's instruction. Existing employee_id 917430582 kept.
//   Daniel -> Daniel Fontaine (a1d223af...).
//   "Sean" -> Shawn Hicks (departed). Note prose only. Node not modified in this file.
//   Amanda McGowan, Cecilia -> Note prose only.
//
// Judgment calls:
//   No implementations. The editor course and training-gated Pope Tech accounts are not operating yet.
//   Pope Tech reconfiguration rides the existing plan "Prepare Popetech for new SFSU Website" (no new plan).
//   Governance plan offered by Alexis -> artifact_request Query, answerable_by Alexis, on 3.1-web.
//   Daniel's asks of the training content -> Recommendation on 5.5-web.
//   Staging scan failure stays a Note (progress update "PopeTech Can't get through auth" already exists).
//   No open SFSU Query is settled by this source (0 of 5).
//   Not in this file (pending separate approval): Shawn Hicks inactive, abandon the two
//   "Reach out to Shawn" plans, rewrite the Popetech plan description, Alexis surname.

// ---------------------------------------------------------------- people
MATCH (p:Person {unique_id: "c16582194cbd4f8ab2f7f5017a33ab70"})
SET p.title = "Mar Comm Professional II";

MATCH (mm:MeetingMinutes {unique_id: "012948ca9c604c90b89cb4e6cb4c138e"})
MATCH (p:Person) WHERE p.unique_id IN ["c16582194cbd4f8ab2f7f5017a33ab70", "a1d223af-c7aa-466b-bf54-47f0a199696d"]
MERGE (p)-[:participated_in]->(mm);

// ---------------------------------------------------------------- community stake
MATCH (c:CommunityOfPractice {unique_id: "463c8e56ee2b4a229e5642e78139b6ad"})
MATCH (si:SuccessIndicator {composite_key: "5.5-web"})
MERGE (c)-[s:has_stake_in]->(si)
ON CREATE SET s.added_date = date("2026-10-01"), s.note = "Marketing & Communications builds and runs the required accessibility training for web content editors on SF State's site.";

// ---------------------------------------------------------------- plans
MATCH (wgp:WorkingGroupPlan {plan_identifier: "2025-2026-sfsu-web"})
MATCH (ay:AcademicYear {name: "2025-2026"})
MATCH (y:YearSuccessEvidence {year_identifier: "2025-2026-5.5-web-sfsu"})
MERGE (pl:Plan {name: "SFSU: Launch the required accessibility module in the web editor Canvas course"})
ON CREATE SET pl.unique_id = replace(randomUUID(), "-", ""), pl.is_key_plan = false, pl.is_campus_plan = false, pl.abandoned = false, pl.plan_status = "In Progress",
  pl.description = "The SF State web team (Chloe Pearson, Alexis Cabrerra) finishes the accessibility module of the Canvas course that every editor must pass before getting access to the new site. The module covers image descriptions, heading order, raw URLs, and the rule that documents are accessible before upload. It names Equidox and Pope Tech as tools editors will learn and links to the SFBRN Pope Tech and Equidox pages, not the DPRC site. This is done when the module is live in the course and course completion gates editor access on the new site."
MERGE (wgp)-[:includes_plan]->(pl)
MERGE (pl)-[:in_academic_year]->(ay)
MERGE (pl)-[:furthers_yse]->(y);

MATCH (wgp:WorkingGroupPlan {plan_identifier: "2025-2026-sfsu-web"})
MATCH (ay:AcademicYear {name: "2025-2026"})
MATCH (y:YearSuccessEvidence {year_identifier: "2025-2026-1.7-web-sfsu"})
MERGE (pl:Plan {name: "SFSU: Make training completion the trigger for Pope Tech accounts"})
ON CREATE SET pl.unique_id = replace(randomUUID(), "-", ""), pl.is_key_plan = false, pl.is_campus_plan = false, pl.abandoned = false, pl.plan_status = "Not Started",
  pl.description = "Daniel Fontaine and the SF State web team define how passing the editor training triggers creation of a Pope Tech account. Accounts stop being generated in bulk. The account list then names the people expected to act on scan results. This is done when the workflow is written down, the web team has agreed to it, and new Pope Tech accounts are created only on training completion."
MERGE (wgp)-[:includes_plan]->(pl)
MERGE (pl)-[:in_academic_year]->(ay)
MERGE (pl)-[:furthers_yse]->(y);

MATCH (wgp:WorkingGroupPlan {plan_identifier: "2025-2026-sfsu-web"})
MATCH (ay:AcademicYear {name: "2025-2026"})
MATCH (y:YearSuccessEvidence {year_identifier: "2025-2026-3.6-web-sfsu"})
MERGE (pl:Plan {name: "SFSU: Stand up SFBRN PDF monitoring for SF State web documents"})
ON CREATE SET pl.unique_id = replace(randomUUID(), "-", ""), pl.is_key_plan = false, pl.is_campus_plan = false, pl.abandoned = false, pl.plan_status = "Not Started",
  pl.description = "The SFBRN accessibility team scans PDFs across SF State's web presence for conformance and supports document owners in remediating them. Document owners stay responsible for keeping each document accessible after upload. This is done when scheduled PDF scans run against SF State's sites and findings reach the owning department."
MERGE (wgp)-[:includes_plan]->(pl)
MERGE (pl)-[:in_academic_year]->(ay)
MERGE (pl)-[:furthers_yse]->(y);

// ---------------------------------------------------------------- query (artifact request)
MATCH (wgp:WorkingGroupPlan {plan_identifier: "2025-2026-sfsu-web"})
MATCH (y:YearSuccessEvidence {year_identifier: "2025-2026-3.1-web-sfsu"})
MATCH (daniel:Person {unique_id: "a1d223af-c7aa-466b-bf54-47f0a199696d"})
MATCH (alexis:Person {unique_id: "0279792e7b914bcd93b0f968b222ffc0"})
MERGE (q:Query {question: "Will the web team share its finalized governance plan, including the three-strikes rule that removes editing access?"})
ON CREATE SET q.unique_id = replace(randomUUID(), "-", ""), q.status = "open", q.category = "artifact_request", q.date_raised = date("2026-10-01"),
  q.detail = "The web team's governance plan for the new SF State site sets the rules editors work under, including loss of editing access after three violations. Alexis Cabrerra offered to share it once finalized. It is the document that assigns responsibility for keeping site updates compliant."
MERGE (q)-[:raised_under_plan]->(wgp)
MERGE (q)-[:addresses_evidence]->(y)
MERGE (q)-[:query_raised_by]->(daniel)
MERGE (q)-[:answerable_by]->(alexis);

// ---------------------------------------------------------------- recommendation
MATCH (y:YearSuccessEvidence {year_identifier: "2025-2026-5.5-web-sfsu"})
MATCH (daniel:Person {unique_id: "a1d223af-c7aa-466b-bf54-47f0a199696d"})
MERGE (y)-[:has_recommendation]->(r:Recommendation {recommendation: "Name the supported tools and track completion in the editor training."})
ON CREATE SET r.unique_id = replace(randomUUID(), "-", ""), r.status = "open", r.date_created = date("2026-10-01"),
  r.detail = "The editor training names Equidox and Pope Tech as tools editors are expected to learn. It states that ATI provides support and training for both, and links to the SFBRN pages for each. It records which editors completed which training, so completion can be checked. The web team owns the course and makes these changes."
MERGE (r)-[:created_by]->(daniel);

// ---------------------------------------------------------------- notes (YSE + minutes)
UNWIND [
  {name: "editor-training-requirement-oct-2026-yse:2025-2026-5.5-web-sfsu-4a1c7e02", yse: "2025-2026-5.5-web-sfsu",
   content: "The current SF State website has no required accessibility or editing training. On the new site, every editor must complete a Canvas course before access is granted. The course rebuilds an earlier Drupal training written by Cecilia on the web team. Chloe Pearson owns the accessibility module, a short written training with video walkthroughs to follow. It covers writing and brand guidance, image descriptions, heading order, avoiding raw URLs, and the rule that documents are accessible before upload. It mixes general guidance with Drupal steps, for example how to add a table header row. Tool skills such as Equidox are routed to ATI rather than taught in the course. Rollout was expected to begin in mid-October 2026."},
  {name: "editor-enforcement-plan-oct-2026-yse:2025-2026-1.15-web-sfsu-9d3b52f6", yse: "2025-2026-1.15-web-sfsu",
   content: "Alexis Cabrerra described how the web team will keep editors following the accessibility rules on the new site. The team will audit editor work periodically. Editors must attend one or two community meetings a year. An annual refresher, likely a short quiz, is modeled on the CSU's required annual trainings. The team's governance plan removes editing access after three violations. The meetings succeed the Drupal Community of Practice that Shawn Hicks ran, which drew about 50 attendees out of roughly 1,000 invited."},
  {name: "popetech-new-site-launch-oct-2026-yse:2025-2026-1.14-web-sfsu-6e80a4d1", yse: "2025-2026-1.14-web-sfsu",
   content: "The new SF State website launches November 9, 2026. Pope Tech could not scan the site during a staging pass. The site sits behind a password wall, which is the likely cause, but this is unconfirmed and should be retested once the site is public. The new site's URL structure differs from the old one, so Pope Tech scan groups must be rebuilt after launch. Scan responsibility also has to be divided to match the new site's permission tiers."},
  {name: "popetech-monitoring-split-oct-2026-yse:2025-2026-3.5-web-sfsu-b27f3c95", yse: "2025-2026-3.5-web-sfsu",
   content: "The SF State web team expects to be the primary day-to-day monitor of Pope Tech results on the new site, alongside SFBRN. Pope Tech accounts are currently generated in bulk. Between 50 and 100 accounts exist and it is unclear how many are used. Daniel Fontaine wants account creation tied to completing the editor training, so the account list names the people expected to act on results. The workflow has not been designed."},
  {name: "new-site-permission-tiers-oct-2026-yse:2025-2026-2.5-web-sfsu-0c5e9a18", yse: "2025-2026-2.5-web-sfsu",
   content: "On the current site all editors hold the same permissions. The new site has five tiers: SFBRN at the top, then the web team, then power users. Editors can change news, events and profiles only. Content or Team Publishers can also change general pages, which is where documents live and where most accessibility errors are expected. Through launch the web team limits access to one editor per department, over departmental objections. That cuts the editor pool from about 1,000 to about 500. The training requires documents to be accessible before upload. This answers the earlier abandoned plan to review with Alexis who can submit and publish."},
  {name: "editor-support-routing-sfbrn-oct-2026-yse:2025-2026-6.8-web-sfsu-f41d8b63", yse: "2025-2026-6.8-web-sfsu",
   content: "Editors on the new SF State site are to be pointed to the SFBRN site for Pope Tech and Equidox information and support. The SFBRN site has a Pope Tech page and an Equidox page. The DPRC Access site is outdated and being retired, and the training will stop linking to it. The editor pool is about 500 under a one-editor-per-department limit, which supersedes the November 2025 figure of about 50."},
  {name: "sfbrn-pdf-monitoring-oct-2026-yse:2025-2026-3.6-web-sfsu-3a96e7c0", yse: "2025-2026-3.6-web-sfsu",
   content: "Daniel Fontaine's SFBRN team is taking on PDF monitoring for SF State's web presence: scanning PDFs for conformance and supporting remediation with document owners. Owners remain responsible for keeping a document accessible after upload, not only when it is posted. An Accessible Technologist 3 position has cleared HR and is pending union review before posting. Funding for a student assistant is secured."},
  {name: "web-cop-on-hold-oct-2026-yse:2025-2026-5.14-web-sfsu-d85c1f47", yse: "2025-2026-5.14-web-sfsu",
   content: "The SF State Drupal Community of Practice is being renamed the Web Content Community. Alexis Cabrerra will invite Daniel Fontaine and offered him meeting time to present. Daniel's own ATI web community of practice is on hold. The SFBRN team's current focus is procurement and instructional materials. SF State has no permanent web leadership since Shawn Hicks left. Amanda McGowan is taking a director-level coordinating role across this work."}
] AS row
MATCH (y:YearSuccessEvidence {year_identifier: row.yse})
MATCH (mm:MeetingMinutes {unique_id: "012948ca9c604c90b89cb4e6cb4c138e"})
MATCH (daniel:Person {unique_id: "a1d223af-c7aa-466b-bf54-47f0a199696d"})
MERGE (n:Note {name: row.name})
ON CREATE SET n.unique_id = replace(randomUUID(), "-", ""), n.content = row.content, n.date_created = date("2026-10-01"), n.include_in_report = false, n.depreciated = false
MERGE (y)-[:has_note]->(n)
MERGE (mm)-[:has_note]->(n)
MERGE (n)-[:created_by]->(daniel);

// ---------------------------------------------------------------- stamp
MATCH (mm:MeetingMinutes {unique_id: "012948ca9c604c90b89cb4e6cb4c138e"})
SET mm.ontology_ingested = true, mm.ontology_ingest_date = date("2026-10-01"),
  mm.ontology_ingest_note = "8 notes, 3 plans, 1 query (artifact_request), 1 recommendation, 2 participants, 1 community stake (M&C -> 5.5-web), 1 person title update. 0 of 5 open SFSU queries settled.";
