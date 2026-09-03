// =====================================================================================
// Description purity pass: SSU faculty development implementations
// 2026-09-03. Follows ingest_2026_09_03_ssu_faculty_development.cypher.
//
// WHY
//   An implementation description is a standing definition of what the work IS, not a
//   record of how we came to know about it. The 2026-09-03 SSU ingest wrote seven
//   descriptions carrying attestation ("Attested by X on 2026-09-03"), origin stories,
//   correction narratives, naming disputes and single-instance detail such as cohort
//   date ranges. CTET Canvas Professional Development Ladder was the worst at 2,093
//   characters over sixteen sentences, of which three said what the programme is.
//
//   This file rewrites all seven to two or three sentences of definition. Nothing is
//   lost: every fact removed here is already carried by a Note attached to the same
//   YSE and to the meeting minutes, except the Ladder level structure and cohort
//   dates, which this file moves into a new Note before trimming.
//
//   Guidance added to .claude/skills/ontology-ingest/SKILL.md under
//   "Writing implementation descriptions".
//
// SCOPE NOTE
//   The Tool description for PDF Accessibility Remediation carried the same defect
//   (attestation and a date) and is cleaned here too. The naming fact that Sonoma
//   calls it Willie Pang PDF remediator is kept, because an alias is a durable
//   property of the thing rather than a record of a conversation.
// =====================================================================================


// -------------------------------------------------------------------------------------
// 1. PRESERVE WHAT THE LADDER DESCRIPTION IS ABOUT TO LOSE
// -------------------------------------------------------------------------------------

MATCH (y:YearSuccessEvidence {year_identifier: "2025-2026-8.12-ins-ssu"})
MATCH (mm:MeetingMinutes {unique_id: "1b2bb494575a4f30b012f2d4878868ed"})
MATCH (dan:Person {name: "Daniel Fontaine"})
MERGE (n:Note {name: "ssu-ladder-cohort-structure-sep-2026-yse:2025-2026-8.12-ins-ssu-5e19c8b4"})
ON CREATE SET n.unique_id = replace(randomUUID(), "-", ""),
              n.date_created = date("2026-09-03"),
              n.include_in_report = true,
              n.content = "Level structure and 2025-2026 cohort detail for the CTET Canvas professional development sequence, recorded 2026-09-02 from the CTET online and hybrid teaching page and confirmed by John Lynch on 2026-09-03. Level 1, Canvas Design Foundations, is an asynchronous course covering course layout, assessments, engagement, resources and accessibility, carrying a 300 dollar stipend. Fall 2025 ran it as a two-week intensive from 13 to 26 October at 15 to 20 hours weekly, and as a four-week course from 13 October to 9 November at 6 to 8 hours weekly. Level 2, Online Facilitation Fundamentals, covers online teaching strategies and technology integration, requires Level 1 completed or in progress, and carries a 300 dollar stipend. Fall 2025 ran it from 10 to 24 November as an intensive and from 10 November to 7 December as a four-week course. Level 3, the QLT Faculty Learning Community, requires Levels 1 and 2 and carries a 400 dollar stipend, with cohorts from 20 October to 16 November 2025 and from 12 to 25 January 2026. SSU also pays the 750 dollar external review fee for faculty who go on to QLT certification, which is recorded separately as CTET QLT Certification. The programme is held as one Service rather than three because the levels are a single progression with an eligibility chain: a faculty member enters the sequence, not a level."
MERGE (y)-[:has_note]->(n)
MERGE (mm)-[:has_note]->(n)
MERGE (n)-[:created_by]->(dan);


// -------------------------------------------------------------------------------------
// 2. REWRITE THE DESCRIPTIONS
// -------------------------------------------------------------------------------------

MATCH (s {unique_id: "407119b5316d45f69710530392f1a027"})
SET s.description = "Three-tier faculty professional development sequence run by the Center for Teaching and Educational Technology at Sonoma State, paid at each level and gated by an eligibility chain from Level 1 through Level 3. Level 1 covers Canvas course design, Level 2 covers online facilitation and technology integration, and Level 3 is a Faculty Learning Community in which participants apply the QLT rubric to their own courses. Accessibility is taught inside Level 1 rather than as a separate offering, and the QLT rubric applied at Level 3 carries accessibility criteria.";

MATCH (s:Service {title: "CTET Accessibility Workshop Series"})
SET s.description = "Recurring accessibility workshop programme run by the Center for Teaching and Educational Technology at Sonoma State, open to faculty and staff through the semester. Four strands run regularly, covering UDOIT, Tidy Up, Principles of Accessibility and Panopto, at roughly three to four sessions each per semester. Accessibility content is also delivered inside other CTET workshops rather than only as standalone sessions.";

MATCH (pr:Process {title: "New Faculty Orientation Accessibility Segment (SSU)"})
SET pr.description = "Accessibility content delivered inside Sonoma State New Faculty Orientation each year. CTET runs a segment on what accessibility means and how to implement it in Canvas, with pointers to further CTET resources, and Disability Services delivers a separate presentation on compliance obligations relating to students with disabilities. Textbook ordering deadlines for early adoption are covered in the same orientation.";

MATCH (pr:Process {title: "CTET Student Worker Accessibility Training"})
SET pr.description = "Checklist-based training that student workers on the CTET remediation team complete, demonstrating defined competencies by set dates. The Canvas Remediation Manual is the written training path. Students are additionally enrolled in external accessibility coursework as it becomes available.";

MATCH (g:Guidance {title: "ATI Faculty Responsibilities Video (six key components)"})
SET g.description = "Video distributed to all Sonoma State faculty at the start of each year, organising faculty instructional-materials responsibilities around six core items. These include ordering textbooks in a timely fashion, minimising PDF use, proper document formatting, captioning videos, and alt text for images in presentations. The video is reinforced through orientation presentations, standalone workshops, and campus signage.";

MATCH (pr:Process {title: "Instructional Materials Subcommittee (SSU)"})
SET pr.description = "Standing Sonoma State subcommittee for instructional materials accessibility. It meets on a recurring cadence, sets annual priorities, and documents them in an Instructional Material Plan submitted each year. Standing participants include CTET, Disability Services and the campus bookstore.";

MATCH (pr:Process {title: "Textbook Adoption Reporting via Bookstore (SSU)"})
SET pr.description = "Adoption data pipeline running from the Sonoma State bookstore to campus administration and faculty. The bookstore manager compiles textbook adoption data and sends it to deans, who distribute it to faculty in their schools. Sonoma reinforces the same deadlines through Canvas banners and reminders at dean and department-meeting level.";

MATCH (t:Tool {tool_identifier: "pdf-accessibility-remediation"})
SET t.description = "Web application for remediating PDF accessibility, hosted on AWS Amplify under a CSU account at https://csu.d2ljzoawo09xv6.amplifyapp.com/home/. Referred to at Sonoma State as Willie Pang PDF remediator. CTET shows it to faculty directly as one of the self-service tools for PDF work, alongside UDOIT and Panopto.";
