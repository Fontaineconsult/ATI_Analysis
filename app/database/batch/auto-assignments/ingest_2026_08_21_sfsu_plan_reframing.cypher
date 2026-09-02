// ============================================================================
// Correction: 2026-08-21 — reframe the three Plans filed on 2026-08-20 from
//             topic labels into completable tasks.
//
// WHY: the plans were named after their subject rather than the work, and their
//   descriptions described the subject rather than what has to happen. Neither
//   could be marked Completed meaningfully, and the Teaching Square plan's
//   description duplicated the Guidance node that describes the programme.
//   The rule is now written into the ontology-ingest skill under
//   "Writing Plan name and description".
//
// Each plan is matched on its OLD name and given a new name and description.
// The source batch files (ingest_2026_08_20_sfsu_faculty_development_interview
// and ingest_2026_08_20_sfsu_jedi_teaching_squares) are updated in the same
// change so that re-running them is a no-op against the corrected nodes rather
// than re-creating the originals — Plan.description is the unique index, so a
// stale MERGE key would silently duplicate.
//
// No wiring changes: furthers_yse, includes_plan, in_academic_year and
// plan_status are all left exactly as they were.
// ============================================================================


MATCH (p:Plan {name: "SFSU: CEETL Teaching Square rollout"})
SET p.name = "SFSU: Verify CEETL Teaching Square rollout",
    p.description = "Confirm the Fall UDL 3.0 Teaching Square runs as published, and collect what it produces. Anoshua Chaudhuri owns the programme and Julie Paulson co-leads the square. Academic Technology's digital accessibility material still has to be folded into the curriculum, and that hand-off is the part most at risk of not happening. Done when the fall cohort has run, the participant count is recorded against the target of 20, and any UDL findings the square reports out are attached as evidence - those findings are the Output that 6.5-ins currently lacks entirely.";

MATCH (p:Plan {name: "SFSU: AT accessibility documentation catalog"})
SET p.name = "SFSU: Publish the AT accessibility documentation catalog",
    p.description = "Academic Technology is to build and publish the faculty-facing documentation catalog covering both remediation of existing course materials and born-accessible authoring, including practical format guidance. Andrew Roderick owns delivery and estimated six to eight weeks from 2026-08-20. It replaces whatever prior remediation documentation existed. SFBRN input on documentation standards and standard procedures was invited and should be given while the catalog is still in draft rather than after it ships. Done when the catalog is published behind the SF State accessibility page and the delivery workshops are scheduled.";

MATCH (p:Plan {name: "SFSU: CEETL course-redesign guidance publishing"})
SET p.name = "SFSU: Publish CEETL course-redesign accessibility guidance",
    p.description = "CEETL is to publish course-redesign accessibility guidance to its YouTube channel, and to decide whether to stand up a CEETL-hosted page of best-practice course-redesign guidelines drawn from what the Teaching Squares learn. Anoshua Chaudhuri owns it. Nothing had been published as of 2026-08-20 and the page remained under consideration rather than committed. Done when the video content is live and the decision on the guidelines page is recorded either way, so that a deferral is visible rather than simply absent.";
