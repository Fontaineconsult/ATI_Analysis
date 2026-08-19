// ===========================================================================
// CSU East Bay Disability Services — TAP process, Alt Media workflow, textbook
// adoption.  Meeting of 2026-08-19 (Daniel Fontaine + Pamela Baird).
// Generated 2026-08-19 by /ontology-ingest
// ===========================================================================
//
// SOURCE
//   MeetingMinutes already in the graph, filed under 2025-2026-csueb-pro:
//     uid ba53adcab7b04e1e989039633f170b33
//     "Meeting Notes: CSU East Bay Disability Services — TAP Process, Alt Media
//      Workflow, and Textbook Adoption"
//   ontology_ingested was False; this run enriches and stamps it. No new
//   MeetingMinutes node is created.
//
//   The meeting is the interview prepped by
//   app/database/ontology/interviews/2026-08-18-csueb-disability-services-cop.md
//
// ANCHORS
//   Campus csueb, reporting year 2025-2026. Minutes stay under the -pro plan
//   where the user filed them; notes anchor to their own subject YSEs across
//   the pro / ins / web families.
//
// APPROVED MANIFEST (2026-08-19) — user decisions applied:
//   DROPPED  both proposed Query nodes (alt-media org ownership; procurement
//            boundary during the reorg)
//   DROPPED  Plan "reinstate syllabus accessibility statement as required"
//   DROPPED  Plan "add DSS link to accessibilitystatement.html"
//   REPLACED Plan "bring TAP involvement model to Amanda" — instead annotated
//            onto the EXISTING plan "Finalize the updated TAAP authoring
//            workflow." (uid 912f6236bca04f80ac3a35da98e6f276) as a progress
//            update, via Plan.progress_updates -> progress_documented_by -> Note.
//            That plan already furthers 2025-2026-4.6-pro-csueb.
//   KEPT     Plan "reissue the textbook adoption policy" (Pamela's commitment)
//   KEPT     both Concerns, all six Notes, the settled Query, Pamela's
//            implements edge on 1.19-web, and the description enrichment.
//
// IDENTITY — as-heard flag
//   "Casey Galen" in the transcript (Pamela confirmed the spelling live after
//   audible uncertainty, "Gilan? Galen?"). Created here as **Casey Gielen**,
//   because the published campus page at csueastbay.edu/atso lists
//   casey.gielen@csueastbay.edu — the mailbox is the stronger evidence than a
//   spoken confirmation. FLAGGED: verify with Pamela; if she is right, rename.
//
//   Doug Ferguson gets NO node — "no longer with the university" and owns no
//   current work (departed-person rule). This settles the title conflict the
//   interview guide carried, where the 2024-25 committees page gave him the
//   Assistive Technology Coordinator title that the live page gives Gielen.
//
// SUCCESS INDICATOR TEXT (for the wiring rationale)
//   4.6-pro  "Develop a process for providing equally effective alternate
//             access... assigned roles and responsibilities, and distribution
//             strategy."
//   1.1-ins  "Campus has formally documented... a process to ensure the timely
//             adoption of textbooks..."
//   4.5-ins  "...provides alternate media production staff with timely access
//             to instructional materials..."
//   1.19-web "...published, specific accessibility statement(s) and a method to
//             both report and address issues."
//   4.3-ins  "...document specific guidelines and procedures for creating
//             accessible course content hosted in the campus LMS."
//   8.12-ins "Developed a process that integrates accessibility information
//             into faculty development."
//
// CONCERN ANCHORING NOTE
//   Both concerns sit on 4.6-pro. C2 (products bypassing procurement entirely)
//   would more naturally hang off 1.12-pro / 8.11-pro / 8.12-pro — "regardless
//   of procurement method", "all procurement channels" — but none of those has
//   a 2025-2026 CSUEB YSE; they are 2026-2027 introductions. 4.6-pro is the
//   closest live anchor, and its bar covers assigned roles and responsibilities.
// ===========================================================================


// ---------------------------------------------------------------------------
// SECTION 1 — People
// ---------------------------------------------------------------------------

MERGE (p:Person {name: "Casey Gielen"})
ON CREATE SET p.unique_id = randomUUID(),
    p.title = "Assistive Technology Coordinator",
    p.email = "casey.gielen@csueastbay.edu",
    p.active = true,
    p.can_approve_yse = false,
    p.non_committee_member_active = false,
    p.ati_role = "Assistive Technology Coordinator, CSU East Bay. Name recorded as 'Casey Galen' in the 2026-08-19 interview and confirmed aloud by Pamela Baird; spelled Gielen here on the strength of the published mailbox casey.gielen@csueastbay.edu. VERIFY.";

MERGE (p:Person {name: "Rochelle Thompson"})
ON CREATE SET p.unique_id = randomUUID(),
    p.title = "Assistant Director, Disability Services",
    p.email = "rochelle.thompson@csueastbay.edu",
    p.active = true,
    p.can_approve_yse = false,
    p.non_committee_member_active = false,
    p.ati_role = "Assistant Director of CSU East Bay Disability Services. Pamela Baird confirmed (2026-08-19) that she does not currently play a role in the TAP process, alternate media, or textbook adoption.";

MATCH (p:Person {name: "Casey Gielen"})
MATCH (c:Campus {abbreviation: "csueb"})
MERGE (p)-[:works_at_campus]->(c);

MATCH (p:Person {name: "Rochelle Thompson"})
MATCH (c:Campus {abbreviation: "csueb"})
MERGE (p)-[:works_at_campus]->(c);

MATCH (p:Person {name: "Casey Gielen"})
MATCH (com:CommunityOfPractice {name: "Disability Services"})
MERGE (p)-[:member_of_community]->(com);

MATCH (p:Person {name: "Rochelle Thompson"})
MATCH (com:CommunityOfPractice {name: "Disability Services"})
MERGE (p)-[:member_of_community]->(com);

// Complaint resolution for inaccessible content routes to Pamela directly —
// she confirmed the barrier report form and ticketing assignments come to her.
// Closes the "owns implementations but implements no evidence" gap.
MATCH (p:Person {name: "Pamela Baird"})
MATCH (y:YearSuccessEvidence {year_identifier: "2025-2026-1.19-web-csueb"})
MERGE (p)-[:implements]->(y);


// ---------------------------------------------------------------------------
// SECTION 2 — Settle the open Query the source answered
// ---------------------------------------------------------------------------

MATCH (q:Query {unique_id: "23fa042a-c67c-486e-8c5d-36442ef1b010"})
SET q.status = "settled",
    q.date_settled = date("2026-08-19"),
    q.answer = "Answered by Pamela Baird, Director of Disability Services, on 2026-08-19. Faculty-facing accessibility training and workshops at CSU East Bay are led campus-wide by Online Campus, and Pamela assessed general faculty awareness of Title II obligations and accessibility responsibilities as strong. She explicitly did not claim credit for that effort on behalf of Disability Services. She added a substantive caveat: Online Campus's practice of performing remediation on behalf of faculty, rather than teaching faculty to produce accessible materials themselves from the start, enables rather than builds faculty capability — she called this approach a cop-out. So the workshops exist and reach people, but the question of whether they change faculty practice is open on her account.";

MATCH (q:Query {unique_id: "23fa042a-c67c-486e-8c5d-36442ef1b010"})
MATCH (p:Person {name: "Daniel Fontaine"})
MERGE (q)-[:query_settled_by]->(p);


// ---------------------------------------------------------------------------
// SECTION 3 — Concerns (issues raised with no path to resolution)
// MERGE on the has_concern pattern with the concern text, so a re-run matches
// the existing node rather than duplicating it.
// ---------------------------------------------------------------------------

MATCH (y:YearSuccessEvidence {year_identifier: "2025-2026-4.6-pro-csueb"})
MERGE (y)-[:has_concern]->(c:Concern {concern: "CSU East Bay has no designated 504/ADA Coordinator"})
ON CREATE SET c.unique_id = randomUUID(),
    c.status = "open",
    c.date_raised = date("2026-08-19"),
    c.detail = "Pamela Baird confirmed the gap explicitly during the 2026-08-19 interview: there is no one on campus holding the 504/ADA Coordinator role. Raised in the context of complaint resolution, which routes to her directly through the online accessibility barrier report form and the campus ticketing system. Recorded as a concern rather than a recommendation because the source states the absence flatly — nobody named a fix, no office volunteered to absorb the function, and no decision is pending with a named decider. Filed against this indicator because its bar is assigned roles and responsibilities for equally effective alternate access, and a 504 coordinator is the role most campuses use to hold that accountability.";

MATCH (y:YearSuccessEvidence {year_identifier: "2025-2026-4.6-pro-csueb"})
MERGE (y)-[:has_concern]->(c:Concern {concern: "Products acquired outside procurement never reach accessibility review, so no TAP can exist for them"})
ON CREATE SET c.unique_id = randomUUID(),
    c.status = "open",
    c.date_raised = date("2026-08-19"),
    c.detail = "Raised by Pamela Baird on 2026-08-19 as a current, unresolved control gap. In the first week of instruction this term alone her assistant director fielded at least three cases of faculty adopting software incompatible with screen readers — one example was a math package a faculty member found at a conference. In each case the product had never entered procurement, because it was acquired free outside the normal channel, and so no accessibility review occurred and no EAP or TAP exists on record. Her formulation: procurement review can only catch what actually enters procurement. Daniel Fontaine agreed the gap is significant and said he would escalate it; recorded as a concern rather than a plan because escalation names no change, no owner of the fix, and no decision with a decider. The indicators whose language directly covers this — acquisitions regardless of procurement method, and gaps across all procurement channels — have no 2025-2026 CSUEB evidence node, so this is filed against the alternate-access indicator instead.";

MATCH (c:Concern {concern: "CSU East Bay has no designated 504/ADA Coordinator"})
MATCH (p:Person {name: "Pamela Baird"})
MERGE (c)-[:raised_by]->(p);

MATCH (c:Concern {concern: "Products acquired outside procurement never reach accessibility review, so no TAP can exist for them"})
MATCH (p:Person {name: "Pamela Baird"})
MERGE (c)-[:raised_by]->(p);


// ---------------------------------------------------------------------------
// SECTION 4 — Plan: Pamela's committed push on the textbook adoption policy
// S2 — commitment language from its owner ("is pushing to get updated policy
// language issued fresh from the current provost's office").
// ---------------------------------------------------------------------------

MERGE (pl:Plan {name: "Reissue the CSUEB textbook adoption policy from the provost's office"})
ON CREATE SET pl.unique_id = randomUUID(),
    pl.plan_status = "In Progress",
    pl.is_key_plan = false,
    pl.is_campus_plan = false,
    pl.abandoned = false,
    pl.description = "Pamela Baird is pushing the CSU East Bay provost's office to reissue and reinforce the campus textbook adoption policy with current faculty. The policy already exists and was properly adopted: it originated years ago when a previous provost worked with Pamela's office and issued a formal letter to all faculty, and it went through the Academic Senate. The problem she raised on 2026-08-19 is compliance rather than authority — timely adoption by faculty has become a real problem despite the policy being on the books. She recently raised this again with a senior associate provost and wants fresh policy language issued from the current provost's office so the requirement is back in front of faculty.";

MATCH (pl:Plan {name: "Reissue the CSUEB textbook adoption policy from the provost's office"})
MATCH (a:AcademicYear {name: "2025-2026"})
MERGE (pl)-[:in_academic_year]->(a);

MATCH (pl:Plan {name: "Reissue the CSUEB textbook adoption policy from the provost's office"})
MATCH (y:YearSuccessEvidence {year_identifier: "2025-2026-1.1-ins-csueb"})
MERGE (pl)-[:furthers_yse]->(y);


// ---------------------------------------------------------------------------
// SECTION 5 — Progress update on the EXISTING TAAP authoring plan
// Plan.progress_updates -> progress_documented_by -> Note, the established
// plan-annotation mechanism. The plan already furthers 2025-2026-4.6-pro-csueb.
// ---------------------------------------------------------------------------

MERGE (n:Note {name: "taap-signing-flow-dsg-involvement-aug-2026-plan:912f6236-4b1e77a0"})
ON CREATE SET n.unique_id = randomUUID(),
    n.date_created = date("2026-08-19"),
    n.include_in_report = true,
    n.content = "Progress update from the 2026-08-19 CSU East Bay Disability Services interview, on where Disability Services sits in the TAAP workflow being finalized.\n\nCurrent state at East Bay: Pamela Baird has not been consulted on any TAAP under the new naming and template system, and was not aware that EEAAP had been retired in favour of TAAP — in her words it was not yet on her radar. Her understanding of the campus process was still the older one, a binary accessibility thumbs-up or thumbs-down run by ITS ahead of procurement. Daniel Fontaine clarified that under the centralized SFBRN procurement structure — a single team across all three campuses, roughly five people with a say in the accessibility gate, with Zach Oshri handling initial VPAT review and TAAP drafting on the East Bay side — that description is no longer accurate, and that some ambiguity about where each piece sits remains internally during the reorganization.\n\nHistory that shapes her position: under Pamela's predecessor, VPAT review was split by risk, with low-impact reviews handled by East Bay's former assistive technology specialist and campus-wide or higher-impact procurements routed to ITS. That split later collapsed and ITS took all VPAT review. When Pamela became director she began receiving items to sign off on, and when a product was found inaccessible the resulting EEAAP would often default to being routed to Accessibility Services to solve. She pushed back on that pattern directly: if a department chooses to procure something inaccessible, developing the workaround is that department's responsibility, and her office does not have the bandwidth to absorb it. She remains available to consult, but does not accept the drafting.\n\nAgreed go-forward model: Pamela joins the SIGNING flow rather than the drafting one. She receives a mostly completed TAAP for review and can approve it or push it back. She additionally asked to be available for consultation earlier than final sign-off on an as-needed basis, whether through a standing committee or ad hoc — she does not want to be looped into every case, but wants the option to weigh in before a TAAP is finalized when the case warrants it. Daniel confirmed he would bring this model to Amanda McGowan as the centralized procurement process is designed across the three campuses, and acknowledged it is a genuinely complex integration problem.\n\nAlso confirmed on the call: TAAP templates are unique per campus, with East Bay, Sonoma and SF State each holding their own.";

MATCH (n:Note {name: "taap-signing-flow-dsg-involvement-aug-2026-plan:912f6236-4b1e77a0"})
MATCH (p:Person {name: "Daniel Fontaine"})
MERGE (n)-[:created_by]->(p);

MATCH (pl:Plan {unique_id: "912f6236bca04f80ac3a35da98e6f276"})
MATCH (n:Note {name: "taap-signing-flow-dsg-involvement-aug-2026-plan:912f6236-4b1e77a0"})
MERGE (pl)-[:progress_documented_by]->(n);

MATCH (m:MeetingMinutes {unique_id: "ba53adcab7b04e1e989039633f170b33"})
MATCH (n:Note {name: "taap-signing-flow-dsg-involvement-aug-2026-plan:912f6236-4b1e77a0"})
MERGE (m)-[:has_note]->(n);


// ---------------------------------------------------------------------------
// SECTION 6 — Notes on their subject YSEs (each also linked to the minutes)
// ---------------------------------------------------------------------------

MERGE (n:Note {name: "csueb-alt-media-intake-split-aug-2026-yse:2025-2026-4.5-ins-csueb-7d2b91c4"})
ON CREATE SET n.unique_id = randomUUID(),
    n.date_created = date("2026-08-19"),
    n.include_in_report = true,
    n.content = "Pamela Baird's account of the alternate media workflow from the Disability Services side, given 2026-08-19, and the organizational history behind it.\n\nAccessible Media originally sat inside Pamela's department. At some point the technical remediation function moved out to ITS while the student-facing intake function stayed with Disability Services, and that division is what still governs the workflow. Zach Oshri's team currently handles all alternate media production for East Bay.\n\nThe workflow as she describes it: a student meets with Disability Services to determine whether accessible materials are a reasonable accommodation for them. If approved, the student is shown a form and submits their own textbook and course material request. If the student later has a delay concern — her example was being in the third week of instruction without a textbook — they return to Disability Services rather than contacting alternate media directly, and their assigned Accessibility Services Counselor reaches out to whoever is currently handling alternate media for a status update. Disability Services therefore remains the interface point with the student even though the technical work happens in another division.\n\nA caveat she raised herself: Accessible Media has since moved again, from ITS to Online Campus under Zach, which is a separate department on the academic side under the Provost. She is not certain whether that move changes the workflow above, and said only that to her knowledge this is still how it currently operates.\n\nSeparately confirmed on the call: at East Bay, Assistive Technology and Accessible Media are organized as two distinct functions. She noted some other campuses combine them and East Bay does not.";

MERGE (n:Note {name: "csueb-taap-boundary-history-aug-2026-yse:2025-2026-4.6-pro-csueb-c81f3e05"})
ON CREATE SET n.unique_id = randomUUID(),
    n.date_created = date("2026-08-19"),
    n.include_in_report = true,
    n.content = "Where Disability Services sits relative to the TAAP process at CSU East Bay, per Pamela Baird on 2026-08-19.\n\nTerminology first: TAAP, the Temporary Alternative Access Plan, is the successor to the older EAP/EEAAP naming, produced during procurement when a product is found not to be fully accessible. Templates are unique per campus. Pamela had not been consulted on any TAAP under the new system and was unaware the EEAAP name had been retired.\n\nThe boundary she defends: when a department chooses to procure something inaccessible, developing the workaround belongs to that department, not to Accessibility Services by default. She arrived at this position because, on becoming director, she found EEAAPs were often routed to her office to solve once a product failed review, and her office does not have the bandwidth to absorb that work. She is available to consult; the plan itself is not hers to write.\n\nThe model agreed on the call is that she joins the signing flow — receiving a mostly complete TAAP to approve or push back — with optional earlier consultation available on request rather than by default. Progress on that integration is tracked on the plan 'Finalize the updated TAAP authoring workflow'.";

MERGE (n:Note {name: "csueb-textbook-policy-compliance-gap-aug-2026-yse:2025-2026-1.1-ins-csueb-a45d0c72"})
ON CREATE SET n.unique_id = randomUUID(),
    n.date_created = date("2026-08-19"),
    n.include_in_report = true,
    n.content = "CSU East Bay has a codified textbook adoption policy, and separately has a compliance problem with it — Pamela Baird, 2026-08-19.\n\nThe policy is real and properly adopted. It originated years ago when a previous provost worked with Pamela's office and issued a formal letter to all faculty; it went through the Academic Senate and was adopted as policy. That is the authority side, and it is settled.\n\nThe practice side is not. Faculty compliance with timely adoption has become a real problem on her account. She recently raised this again with a senior associate provost and is pushing to get updated policy language issued fresh from the current provost's office, to bring the requirement back in front of faculty — tracked as a plan against this indicator.\n\nThis matters for how the indicator reads: East Bay satisfies the letter of a formally documented process while the outcome the process exists to produce is not reliably occurring. Recorded so the distinction is visible at reporting time rather than being smoothed over by the existence of the policy document.";

MERGE (n:Note {name: "csueb-faculty-training-ownership-aug-2026-yse:2025-2026-8.12-ins-csueb-f60a2b39"})
ON CREATE SET n.unique_id = randomUUID(),
    n.date_created = date("2026-08-19"),
    n.include_in_report = true,
    n.content = "Who runs faculty-facing accessibility training at CSU East Bay, and one dissenting assessment of it — Pamela Baird, 2026-08-19. This answers and settles the open query raised 2026-07-24 after the Sonoma meeting.\n\nOnline Campus leads faculty training and workshops campus-wide, and Pamela assessed general faculty awareness of Title II obligations and their responsibilities around making content available as generally strong. She did not attribute credit for that awareness effort to her own office.\n\nHer caveat is the substantive part and is worth carrying into the indicator's assessment: she considers some of the approach a cop-out, in that Online Campus's practice of performing remediation on behalf of faculty, rather than teaching faculty to produce accessible materials themselves from the start, enables faculty rather than building their capability. Read against this indicator, that distinguishes reach from effect — the training exists and lands, but on her account it is not yet changing who does the work.";

MERGE (n:Note {name: "csueb-accessibility-statement-dss-link-aug-2026-yse:2025-2026-1.19-web-csueb-b93c81de"})
ON CREATE SET n.unique_id = randomUUID(),
    n.date_created = date("2026-08-19"),
    n.include_in_report = true,
    n.content = "State of the CSU East Bay accessibility statement page as reviewed live on 2026-08-19 with Pamela Baird.\n\nThe statement is updated and functional. Pamela had not checked it herself before this call and was pleasantly surprised to find it already current; it is handled by Vanessa Lopez.\n\nOne gap surfaced during the review: the accessibility statement page does not link to Disability Services. The page already carries an assessment and feedback section inviting feedback on Cal State East Bay website accessibility and linking to barrier reporting, and Pamela requested that a link to Accessibility Services / DSS be added there, likely under Campus Resources. Since complaint resolution routes to her office directly, a statement that solicits feedback without naming the office that receives it is an incomplete loop.\n\nTemplate scope confirmed on the call: the accessibility statement template is intended for system-wide use across all three campuses. East Bay is effectively the first adopter, having had no prior campus-specific version to migrate from; SF State's version will roll out alongside its upcoming full website relaunch.";

MERGE (n:Note {name: "csueb-syllabus-statement-downgraded-aug-2026-yse:2025-2026-4.3-ins-csueb-2e7a4f16"})
ON CREATE SET n.unique_id = randomUUID(),
    n.date_created = date("2026-08-19"),
    n.include_in_report = true,
    n.content = "The accessibility services statement is no longer a required syllabus element at CSU East Bay — Pamela Baird, 2026-08-19.\n\nEast Bay maintains a faculty-development-owned list of syllabus must-haves, the required statements every syllabus is expected to carry. An accessibility services statement used to be a required item on that list. At some point it was downgraded to suggested or encouraged rather than mandatory; the reasons are unclear to Pamela. She and colleagues are actively working to get it reinstated as a required element.\n\nRecorded against this indicator because the syllabus is the first accessible-course-content artifact a student encounters, and a statement that is merely encouraged is not a guideline the campus can claim to enforce.";

// created_by + YSE anchor + minutes anchor for each of the six notes.
MATCH (n:Note) WHERE n.name IN [
  "csueb-alt-media-intake-split-aug-2026-yse:2025-2026-4.5-ins-csueb-7d2b91c4",
  "csueb-taap-boundary-history-aug-2026-yse:2025-2026-4.6-pro-csueb-c81f3e05",
  "csueb-textbook-policy-compliance-gap-aug-2026-yse:2025-2026-1.1-ins-csueb-a45d0c72",
  "csueb-faculty-training-ownership-aug-2026-yse:2025-2026-8.12-ins-csueb-f60a2b39",
  "csueb-accessibility-statement-dss-link-aug-2026-yse:2025-2026-1.19-web-csueb-b93c81de",
  "csueb-syllabus-statement-downgraded-aug-2026-yse:2025-2026-4.3-ins-csueb-2e7a4f16"]
MATCH (p:Person {name: "Daniel Fontaine"})
MERGE (n)-[:created_by]->(p);

MATCH (n:Note) WHERE n.name IN [
  "csueb-alt-media-intake-split-aug-2026-yse:2025-2026-4.5-ins-csueb-7d2b91c4",
  "csueb-taap-boundary-history-aug-2026-yse:2025-2026-4.6-pro-csueb-c81f3e05",
  "csueb-textbook-policy-compliance-gap-aug-2026-yse:2025-2026-1.1-ins-csueb-a45d0c72",
  "csueb-faculty-training-ownership-aug-2026-yse:2025-2026-8.12-ins-csueb-f60a2b39",
  "csueb-accessibility-statement-dss-link-aug-2026-yse:2025-2026-1.19-web-csueb-b93c81de",
  "csueb-syllabus-statement-downgraded-aug-2026-yse:2025-2026-4.3-ins-csueb-2e7a4f16"]
MATCH (m:MeetingMinutes {unique_id: "ba53adcab7b04e1e989039633f170b33"})
MERGE (m)-[:has_note]->(n);

MATCH (y:YearSuccessEvidence {year_identifier: "2025-2026-4.5-ins-csueb"})
MATCH (n:Note {name: "csueb-alt-media-intake-split-aug-2026-yse:2025-2026-4.5-ins-csueb-7d2b91c4"})
MERGE (y)-[:has_note]->(n);

MATCH (y:YearSuccessEvidence {year_identifier: "2025-2026-4.6-pro-csueb"})
MATCH (n:Note {name: "csueb-taap-boundary-history-aug-2026-yse:2025-2026-4.6-pro-csueb-c81f3e05"})
MERGE (y)-[:has_note]->(n);

MATCH (y:YearSuccessEvidence {year_identifier: "2025-2026-1.1-ins-csueb"})
MATCH (n:Note {name: "csueb-textbook-policy-compliance-gap-aug-2026-yse:2025-2026-1.1-ins-csueb-a45d0c72"})
MERGE (y)-[:has_note]->(n);

MATCH (y:YearSuccessEvidence {year_identifier: "2025-2026-8.12-ins-csueb"})
MATCH (n:Note {name: "csueb-faculty-training-ownership-aug-2026-yse:2025-2026-8.12-ins-csueb-f60a2b39"})
MERGE (y)-[:has_note]->(n);

MATCH (y:YearSuccessEvidence {year_identifier: "2025-2026-1.19-web-csueb"})
MATCH (n:Note {name: "csueb-accessibility-statement-dss-link-aug-2026-yse:2025-2026-1.19-web-csueb-b93c81de"})
MERGE (y)-[:has_note]->(n);

MATCH (y:YearSuccessEvidence {year_identifier: "2025-2026-4.3-ins-csueb"})
MATCH (n:Note {name: "csueb-syllabus-statement-downgraded-aug-2026-yse:2025-2026-4.3-ins-csueb-2e7a4f16"})
MERGE (y)-[:has_note]->(n);


// ---------------------------------------------------------------------------
// SECTION 7 — Enrich the Accessible Media Production description
// The existing text was written from the published website on 2026-08-18.
// Pamela's own account adds the eligibility gate, the delay-escalation path,
// and the org history the site does not carry.
// ---------------------------------------------------------------------------

MATCH (s:Service {title: "Accessible Media Production (Accessibility Services)"})
SET s.description = "The Accessibility Services side of alternate media at CSU East Bay: student eligibility, intake, and instructor liaison. Described from the published site in August 2026 and confirmed step by step by Pamela Baird, Director of Disability Services, on 2026-08-19.\n\nEligibility first: a student meets with Disability Services to determine whether accessible materials constitute a reasonable accommodation for them. Only then are they shown the request form, which the student submits themselves. Two request categories are published, textbooks in accessible formats and non-textbook course materials (handouts, presentations, articles, syllabi), on term-scoped forms — Fall 2026 and Summer 2026 are separately published. Students must be enrolled to submit. After a request is filed the Accessible Media team verifies the student's courses and contacts their instructors directly for access to materials, corresponding with the student by campus email. Textbooks are not released until proof of purchase is verified. A dedicated mailbox, alternate.media@csueastbay.edu, is published as the contact.\n\nDisability Services remains the student's interface after intake. If a student has a delay concern — Pamela's example was reaching the third week of instruction without a textbook — they return to Disability Services rather than contacting alternate media directly, and their assigned Accessibility Services Counselor pursues a status update with whoever currently handles production.\n\nOrganizational history, per Pamela: Accessible Media originally sat within Disability Services. The technical remediation function later moved to ITS while the student-facing intake function stayed here, and it has since moved again from ITS to Online Campus under Zach Oshri, a separate department on the academic side under the Provost. Pamela is not certain whether that most recent move changes the workflow above. Distinct from the ITS-owned Alt Media Request & Fulfillment Automation process, which is the production pipeline this intake feeds. At East Bay, Assistive Technology and Accessible Media are two separate functions.";


// ---------------------------------------------------------------------------
// SECTION 8 — Stamp the source minutes as ingested
// ---------------------------------------------------------------------------

MATCH (m:MeetingMinutes {unique_id: "ba53adcab7b04e1e989039633f170b33"})
SET m.ontology_ingested = true,
    m.ontology_ingest_date = date("2026-08-19"),
    m.ontology_ingest_note = "created 2 Persons (Casey Gielen [as-heard, verify], Rochelle Thompson), 2 Concerns, 1 Plan, 7 Notes (6 on YSEs + 1 plan progress update); settled 1 Query (faculty workshops); added Pamela Baird implements 1.19-web + 2 community memberships; enriched the Accessible Media Production description.";
