// Evidence detail (rationale + verified satisfies) for every live evidence link on CSUEB 2025-2026
// Instructional Materials indicators that lacked a rationale. 2026-10-27, Daniel Fontaine.
// Mirrors set_evidence_rationale and set_evidence_satisfies on the is_evidence_for link.
// Rationale is set only where none exists (coalesce), so existing reasons are kept.
// satisfies is claimed only where the work fully delivers the requirement; partial coverage is not claimed,
// because the coverage view reads any claim as satisfied. Each handle is checked against the YSE's indicator.
// Retired links are skipped. Strength and control are not touched.

MATCH (i:InternalPolicy {unique_id: '410a57b968544b37a8c3ca2441f7925b'})-[r:is_evidence_for]->(y:YearSuccessEvidence {year_identifier: '2025-2026-1.1-ins-csueb'})
SET r.rationale = coalesce(r.rationale, "Records the two instruments that formally document timely adoption at East Bay. Academic Affairs Directive 2018-01 sets the adoption deadline and the steps around it, and CIC 47 adds the accessibility requirement. This is the formal documentation the indicator asks for, though CIC 47 has no recorded approval or effective date.");

MATCH (i:Process {unique_id: 'f3f85749560a4843b6871d4e00a5e611'})-[r:is_evidence_for]->(y:YearSuccessEvidence {year_identifier: '2025-2026-1.1-ins-csueb'})
SET r.rationale = coalesce(r.rationale, "The Academic Senate committee that leads policy work on textbook adoption and oversees its implementation, including the amendment requiring zero-textbook-cost tagging. It maintains the policy and is not the documented process itself.");

MATCH (i:Process {unique_id: '7fef8b4080ee49b5a43eac7f7bdd7a46'})-[r:is_evidence_for]->(y:YearSuccessEvidence {year_identifier: '2025-2026-1.1-ins-csueb'})
SET r.rationale = coalesce(r.rationale, "Shows the adoption policy in operation: the platform reads the nightly Follett feed and reports which sections have adopted. It supports the documented process with tracking and does not document the process.");

MATCH (i:Process {unique_id: '0a11fa46959a44429c32105d0fa3de7e'})-[r:is_evidence_for]->(y:YearSuccessEvidence {year_identifier: '2025-2026-1.1-ins-csueb'})
SET r.rationale = coalesce(r.rationale, "Names the adoption contact in each department, which is how the policy reaches faculty. It is a contact list, not the documented process.");

MATCH (i:Process {unique_id: '0a11fa46959a44429c32105d0fa3de7e'})-[r:is_evidence_for]->(y:YearSuccessEvidence {year_identifier: '2025-2026-1.2-ins-csueb'})
SET r.rationale = coalesce(r.rationale, "Names an adoption contact in each department, which assigns part of the role structure the indicator asks for. It does not cover the library, instructional design, accessibility or bookstore roles.");

MATCH (i:Process {unique_id: '7fef8b4080ee49b5a43eac7f7bdd7a46'})-[r:is_evidence_for]->(y:YearSuccessEvidence {year_identifier: '2025-2026-1.6-ins-csueb'})
SET r.rationale = coalesce(r.rationale, "The dashboard calculates the measures a semester report would carry: adoption rate, library and OER coverage, and projected student savings. No report built from it has been delivered to campus administration, so it is the means for this indicator rather than the process.");

MATCH (i:InternalPolicy {unique_id: 'cd4c3454271b4cfea377b3209bbd6bcc'})-[r:is_evidence_for]->(y:YearSuccessEvidence {year_identifier: '2025-2026-4.1-ins-csueb'})
SET r.rationale = coalesce(r.rationale, "Senate policy setting when Canvas course sites open to students, which is part of the campus rule for posting materials to the LMS. The record carries no description or link for it yet.");

MATCH (i:InternalPolicy {unique_id: 'efa1d07bae0c4d2293472e1bb82a037c'})-[r:is_evidence_for]->(y:YearSuccessEvidence {year_identifier: '2025-2026-4.1-ins-csueb'})
SET r.rationale = coalesce(r.rationale, "Senate policy update on the syllabus, which governs what faculty make available to students at the start of term. It bears on posting to Canvas, and the record carries no description of its text yet.");

MATCH (i:InternalPolicy {unique_id: '1ed2d00726df48d09ee41ecfb27f864c'})-[r:is_evidence_for]->(y:YearSuccessEvidence {year_identifier: '2025-2026-4.1-ins-csueb'})
SET r.rationale = coalesce(r.rationale, "Senate policy giving waitlisted students access to Canvas, which extends who can reach materials posted there. The record carries no description or link for it yet.");

MATCH (i:InternalPolicy {unique_id: '410a57b968544b37a8c3ca2441f7925b'})-[r:is_evidence_for]->(y:YearSuccessEvidence {year_identifier: '2025-2026-4.1-ins-csueb'})
SET r.rationale = coalesce(r.rationale, "Requires instructors to design course content to current WCAG standards, which sets the accessibility expectation for anything posted to Canvas.");

MATCH (i:Guidance {unique_id: 'b94c1cd15fff4659a2ae6bbcecca54e5'})-[r:is_evidence_for]->(y:YearSuccessEvidence {year_identifier: '2025-2026-4.1-ins-csueb'})
MATCH (y)-[:tracks]->(:SuccessIndicator)-[:has_evidence_requirement]->(er:EvidenceRequirement) WHERE er.handle IN ['evidence:4.1-ins:established:2', 'evidence:4.1-ins:established:3']
WITH r, er ORDER BY er.level, er.seq
WITH r, collect(er.handle) AS hs WHERE size(hs) = 2
SET r.rationale = coalesce(r.rationale, "Each August, Back to the Bay runs an Accessibility in your Canvas Course session with a sign-in sheet. That reinforces the accessibility expectation for LMS-hosted content in person and is a standing training resource."), r.satisfies = hs;

MATCH (i:Guidance {unique_id: '8550dd14-54a2-4e5f-8a34-185867067b24'})-[r:is_evidence_for]->(y:YearSuccessEvidence {year_identifier: '2025-2026-4.1-ins-csueb'})
SET r.rationale = coalesce(r.rationale, "Publishes the term calendar of faculty accessibility obligations, which tells faculty when materials need to be ready for review. It addresses timing more than use of the LMS.");

MATCH (i:Guidance {unique_id: '5bdfb2fe90d0419cb1359ff2de48edae'})-[r:is_evidence_for]->(y:YearSuccessEvidence {year_identifier: '2025-2026-4.1-ins-csueb'})
MATCH (y)-[:tracks]->(:SuccessIndicator)-[:has_evidence_requirement]->(er:EvidenceRequirement) WHERE er.handle IN ['evidence:4.1-ins:established:1', 'evidence:4.1-ins:established:3']
WITH r, er ORDER BY er.level, er.seq
WITH r, collect(er.handle) AS hs WHERE size(hs) = 2
SET r.rationale = coalesce(r.rationale, "The Canvas for Faculty manual holds 53 guides, including running UDOIT, captioning through Panopto and Verbit, and setting quiz availability. This is the clear guidance on using Canvas and the standing support resource the indicator asks for."), r.satisfies = hs;

MATCH (i:InternalPolicy {unique_id: '410a57b968544b37a8c3ca2441f7925b'})-[r:is_evidence_for]->(y:YearSuccessEvidence {year_identifier: '2025-2026-4.11-ins-csueb'})
SET r.rationale = coalesce(r.rationale, "States the accessibility standard a review of faculty-maintained sites would apply. It does not create a review of those sites.");

MATCH (i:Guidance {unique_id: '86d96d17d43d44cd84c0c637265abd23'})-[r:is_evidence_for]->(y:YearSuccessEvidence {year_identifier: '2025-2026-4.11-ins-csueb'})
SET r.rationale = coalesce(r.rationale, "Routes ICT purchases through a Section 508 conformance review. A faculty-maintained site enters this review only when it involves a purchase, so the link is peripheral.");

MATCH (i:Process {unique_id: '7f88a439-2b4c-4fe2-8816-0ce896418a7d'})-[r:is_evidence_for]->(y:YearSuccessEvidence {year_identifier: '2025-2026-4.11-ins-csueb'})
SET r.rationale = coalesce(r.rationale, "Reviews tools faculty request before they enter Canvas, which is the closest existing review to this indicator. It does not reach sites or web apps that faculty build and host themselves.");

MATCH (i:InternalPolicy {unique_id: '410a57b968544b37a8c3ca2441f7925b'})-[r:is_evidence_for]->(y:YearSuccessEvidence {year_identifier: '2025-2026-4.5-ins-csueb'})
SET r.rationale = coalesce(r.rationale, "Directive 2018-01 sets the adoption deadline so materials are chosen early enough to be remediated, which gives alternate media staff lead time. It says nothing about LMS access for those staff.");

MATCH (i:Service {unique_id: '68c788ad-e912-47d2-b558-492a936b4958'})-[r:is_evidence_for]->(y:YearSuccessEvidence {year_identifier: '2025-2026-4.5-ins-csueb'})
SET r.rationale = coalesce(r.rationale, "Accessibility Services handles eligibility, request intake and instructor liaison for alternate media. It is the intake side of the process, and access to course materials sits with production.");

MATCH (i:Process {unique_id: '20b9ea3904b74d4abc7028eaa8f1f64f'})-[r:is_evidence_for]->(y:YearSuccessEvidence {year_identifier: '2025-2026-4.5-ins-csueb'})
SET r.rationale = coalesce(r.rationale, "Gives production staff the adopted-title list before term from the nightly Follett feed and tracks each request in the intake workbook. It provides timely access to textbook materials and does not grant access to faculty-authored content in Canvas.");

MATCH (i:Process {unique_id: '7fef8b4080ee49b5a43eac7f7bdd7a46'})-[r:is_evidence_for]->(y:YearSuccessEvidence {year_identifier: '2025-2026-4.5-ins-csueb'})
SET r.rationale = coalesce(r.rationale, "Supplies the adoption data the alternate media pipeline draws on. It is the upstream source of early access rather than the access process itself.");

MATCH (i:Guidance {unique_id: '8550dd14-54a2-4e5f-8a34-185867067b24'})-[r:is_evidence_for]->(y:YearSuccessEvidence {year_identifier: '2025-2026-4.5-ins-csueb'})
SET r.rationale = coalesce(r.rationale, "Publishes adoption deadlines on a four to six week remediation basis, which tells faculty when alternate media staff need materials. It does not address LMS roles or access.");

MATCH (i:Process {unique_id: '0a11fa46959a44429c32105d0fa3de7e'})-[r:is_evidence_for]->(y:YearSuccessEvidence {year_identifier: '2025-2026-4.5-ins-csueb'})
SET r.rationale = coalesce(r.rationale, "Department adoption contacts give alternate media staff someone to follow up with when an adoption is missing. The link is peripheral.");

MATCH (i:Guidance {unique_id: '71f8b7e0653149e1b1ccc7d3411fc9c6'})-[r:is_evidence_for]->(y:YearSuccessEvidence {year_identifier: '2025-2026-5.11-ins-csueb'})
MATCH (y)-[:tracks]->(:SuccessIndicator)-[:has_evidence_requirement]->(er:EvidenceRequirement) WHERE er.handle IN ['evidence:5.11-ins:established:3']
WITH r, er ORDER BY er.level, er.seq
WITH r, collect(er.handle) AS hs WHERE size(hs) = 1
SET r.rationale = coalesce(r.rationale, "States the faculty obligation to caption audio and video and gives a dated rollout timeline, so faculty know their responsibilities and deadlines for media."), r.satisfies = hs;

MATCH (i:Process {unique_id: '9329b070-13bd-4f42-97cf-71f1ccc04b6a'})-[r:is_evidence_for]->(y:YearSuccessEvidence {year_identifier: '2025-2026-5.11-ins-csueb'})
SET r.rationale = coalesce(r.rationale, "Turns on Verbit captioning for every new Canvas and Panopto course shell each night, so media recorded in courses is captioned without a request. It covers creation, and remediation of existing media and the choice of media tools are outside it.");

MATCH (i:Guidance {unique_id: '71f8b7e0653149e1b1ccc7d3411fc9c6'})-[r:is_evidence_for]->(y:YearSuccessEvidence {year_identifier: '2025-2026-5.12-ins-csueb'})
SET r.rationale = coalesce(r.rationale, "General guidance on accessible digital course materials. It does not mention course readers, so it supports this indicator only as the general standard readers are held to.");

MATCH (i:Guidance {unique_id: '71f8b7e0653149e1b1ccc7d3411fc9c6'})-[r:is_evidence_for]->(y:YearSuccessEvidence {year_identifier: '2025-2026-5.13-ins-csueb'})
SET r.rationale = coalesce(r.rationale, "Links the AY 2025-26 course materials checklist and the Microsoft 365 and Adobe instructions, which tell faculty how to create accessible documents. It is the creation side of the process.");

MATCH (i:Process {unique_id: 'ed35a02d17454d769537feb28f196751'})-[r:is_evidence_for]->(y:YearSuccessEvidence {year_identifier: '2025-2026-5.13-ins-csueb'})
SET r.rationale = coalesce(r.rationale, "Converts PDFs in Canvas into accessible formats through OCR and AI-assisted structure, alt text and table tagging. It is a remediation route for documents and is still in testing.");

MATCH (i:Process {unique_id: '7f88a439-2b4c-4fe2-8816-0ce896418a7d'})-[r:is_evidence_for]->(y:YearSuccessEvidence {year_identifier: '2025-2026-5.14-ins-csueb'})
SET r.rationale = coalesce(r.rationale, "Reviews emerging tools faculty request for Canvas before they can be used, and tools that fail do not enter Canvas. Tools used outside Canvas, including AI tools, have no review route through it.");

MATCH (i:Process {unique_id: '7f88a439-2b4c-4fe2-8816-0ce896418a7d'})-[r:is_evidence_for]->(y:YearSuccessEvidence {year_identifier: '2025-2026-5.15-ins-csueb'})
SET r.rationale = coalesce(r.rationale, "Reviews publisher content integrated into Canvas at adoption, with each review recorded as an ICT questionnaire in P2P. Publisher content sold outside Canvas, such as Inclusive Access through Follett, does not pass through it.");

MATCH (i:Process {unique_id: '7f88a439-2b4c-4fe2-8816-0ce896418a7d'})-[r:is_evidence_for]->(y:YearSuccessEvidence {year_identifier: '2025-2026-5.16-ins-csueb'})
SET r.rationale = coalesce(r.rationale, "The selection and adoption control for learning and engagement tools: the conformance report is reviewed with Procurement, and a tool that fails does not enter Canvas. It does not re-review tools already in use or cover remediation after adoption.");

MATCH (i:Process {unique_id: '7f88a439-2b4c-4fe2-8816-0ce896418a7d'})-[r:is_evidence_for]->(y:YearSuccessEvidence {year_identifier: '2025-2026-6.2-ins-csueb'})
SET r.rationale = coalesce(r.rationale, "Requires an accessibility review of Canvas integrations before they can be adopted, which covers procuring course tools. Course materials in general, such as textbooks and documents, have no equivalent check.");

MATCH (i:Procedure {unique_id: 'c665c9fb582b4cd0af1b8f753960a301'})-[r:is_evidence_for]->(y:YearSuccessEvidence {year_identifier: '2025-2026-6.2-ins-csueb'})
SET r.rationale = coalesce(r.rationale, "Provides the alternate access plan when a product is procured with known barriers. It addresses what follows a deficient procurement rather than selecting or authoring materials.");

MATCH (i:Service {unique_id: '3d7a8864f9f94f66a7b84c9bd246536e'})-[r:is_evidence_for]->(y:YearSuccessEvidence {year_identifier: '2025-2026-6.4-ins-csueb'})
SET r.rationale = coalesce(r.rationale, "Lets faculty request remediation of scanned PDFs, Word and PowerPoint files in their Canvas courses. Faculty opt in, so it is a remediation service rather than a required review before posting.");

MATCH (i:InternalPolicy {unique_id: '410a57b968544b37a8c3ca2441f7925b'})-[r:is_evidence_for]->(y:YearSuccessEvidence {year_identifier: '2025-2026-6.5-ins-csueb'})
SET r.rationale = coalesce(r.rationale, "Requires course content to meet current WCAG standards, which applies when a course is redesigned. It does not describe a redesign process.");

MATCH (i:Guidance {unique_id: '4d43f6f74e0f4d29bd351db948a6d9fa'})-[r:is_evidence_for]->(y:YearSuccessEvidence {year_identifier: '2025-2026-6.5-ins-csueb'})
SET r.rationale = coalesce(r.rationale, "Describes the Instructional Materials priority and its accessibility expectations. It is general guidance and does not describe how accessibility enters course redesign.");

MATCH (i:Process {unique_id: 'f3528420ca4e4fa58690aed414fc8607'})-[r:is_evidence_for]->(y:YearSuccessEvidence {year_identifier: '2025-2026-6.7-ins-csueb'})
SET r.rationale = coalesce(r.rationale, "UDOIT scans each course, and the orchestrator supports bulk download and re-upload of flagged files, which provides the automated evaluation method. No schedule for manual evaluation is part of it.");

MATCH (i:Service {unique_id: '3d7a8864f9f94f66a7b84c9bd246536e'})-[r:is_evidence_for]->(y:YearSuccessEvidence {year_identifier: '2025-2026-6.8-ins-csueb'})
SET r.rationale = coalesce(r.rationale, "The intake route for remediation: faculty name the course and the help they need, and the team remediates PDF, Word and PowerPoint files.");

MATCH (i:Process {unique_id: 'ed35a02d17454d769537feb28f196751'})-[r:is_evidence_for]->(y:YearSuccessEvidence {year_identifier: '2025-2026-6.8-ins-csueb'})
SET r.rationale = coalesce(r.rationale, "An AI-assisted remediation route for PDFs in Canvas. It is still in testing.");

MATCH (i:Tracking {unique_id: '61a432eed0524761924555edcce79884'})-[r:is_evidence_for]->(y:YearSuccessEvidence {year_identifier: '2025-2026-6.8-ins-csueb'})
MATCH (y)-[:tracks]->(:SuccessIndicator)-[:has_evidence_requirement]->(er:EvidenceRequirement) WHERE er.handle IN ['evidence:6.8-ins:established:4']
WITH r, er ORDER BY er.level, er.seq
WITH r, collect(er.handle) AS hs WHERE size(hs) = 1
SET r.rationale = coalesce(r.rationale, "Department scorecards built from nightly UDOIT reports make remediation progress visible across departments, and the Online Campus lead contacts departments that score poorly. That is tracked, visible progress with priority set by need."), r.satisfies = hs;

MATCH (i:Process {unique_id: 'f3528420ca4e4fa58690aed414fc8607'})-[r:is_evidence_for]->(y:YearSuccessEvidence {year_identifier: '2025-2026-6.8-ins-csueb'})
SET r.rationale = coalesce(r.rationale, "Delivers remediation in two modes, a student assistant working in the live course or files remediated externally and returned. It is the remediation workforce behind this indicator.");

MATCH (i:Process {unique_id: '8fa315a3edae4d989f4cdc56e1e7f209'})-[r:is_evidence_for]->(y:YearSuccessEvidence {year_identifier: '2025-2026-6.9-ins-csueb'})
SET r.rationale = coalesce(r.rationale, "Matches every Canvas integration to its vendor's CSUBuy review status as of October 16, 2026, which shows which tools reached the review that would call for a TAAP. Of 44 vendors, 28 have no review record. The audit records no TAAPs itself.");

MATCH (i:Procedure {unique_id: 'f8e96ec87cb24b4cad8667483f7a5564'})-[r:is_evidence_for]->(y:YearSuccessEvidence {year_identifier: '2025-2026-6.9-ins-csueb'})
SET r.rationale = coalesce(r.rationale, "Defines when a product review calls for a TAAP: a high-risk product needs a signed TAAP before approval. It is the trigger for the plans this indicator asks for, and SFBRN runs it.");

MATCH (i:Procedure {unique_id: 'c665c9fb582b4cd0af1b8f753960a301'})-[r:is_evidence_for]->(y:YearSuccessEvidence {year_identifier: '2025-2026-6.9-ins-csueb'})
SET r.rationale = coalesce(r.rationale, "SFBRN writes TAAPs for East Bay on the Chancellor's Office template, which is the standard template this indicator asks for. No East Bay TAAPs are on record for 2025-26.");

MATCH (i:InternalPolicy {unique_id: 'a5926f875c6f4229ab704446b6bab7b0'})-[r:is_evidence_for]->(y:YearSuccessEvidence {year_identifier: '2025-2026-7.1-ins-csueb'})
SET r.rationale = coalesce(r.rationale, "Senate policy from 2007-08 stating that all course materials are to be accessible to all students to the highest degree possible. It documents faculty responsibility for accessible materials in policy.");

MATCH (i:InternalPolicy {unique_id: '410a57b968544b37a8c3ca2441f7925b'})-[r:is_evidence_for]->(y:YearSuccessEvidence {year_identifier: '2025-2026-7.1-ins-csueb'})
SET r.rationale = coalesce(r.rationale, "States that faculty are responsible for creating materials that meet required accessibility standards. This is the formal policy documentation the indicator asks for.");

MATCH (i:Service {unique_id: 'ed23b08291d54f53a8ff051e29803b70'})-[r:is_evidence_for]->(y:YearSuccessEvidence {year_identifier: '2025-2026-7.11-ins-csueb'})
SET r.rationale = coalesce(r.rationale, "A Chancellor's Office repository of 508 conformance statements for the Electronic Core Collection, which supports accessibility review of centrally licensed library content. It is a systemwide resource rather than an East Bay library process.");

MATCH (i:Guidance {unique_id: '4d43f6f74e0f4d29bd351db948a6d9fa'})-[r:is_evidence_for]->(y:YearSuccessEvidence {year_identifier: '2025-2026-7.3-ins-csueb'})
SET r.rationale = coalesce(r.rationale, "General reference on instructional materials accessibility. It is not an example set, so it supports this indicator only as the published reference the examples point to.");

MATCH (i:Guidance {unique_id: '71f8b7e0653149e1b1ccc7d3411fc9c6'})-[r:is_evidence_for]->(y:YearSuccessEvidence {year_identifier: '2025-2026-7.5-ins-csueb'})
SET r.rationale = coalesce(r.rationale, "Publishes the faculty resources for creating accessible content: the AY 2025-26 course materials checklist, the ScreenSteps Canvas guides, Word, PowerPoint and PDF instructions, the readiness timeline and the workshop series.");

MATCH (i:Guidance {unique_id: '4d43f6f74e0f4d29bd351db948a6d9fa'})-[r:is_evidence_for]->(y:YearSuccessEvidence {year_identifier: '2025-2026-7.5-ins-csueb'})
SET r.rationale = coalesce(r.rationale, "Published reference on accessibility expectations for instructional materials, which supports the resources page.");

MATCH (i:Guidance {unique_id: '71f8b7e0653149e1b1ccc7d3411fc9c6'})-[r:is_evidence_for]->(y:YearSuccessEvidence {year_identifier: '2025-2026-8.1-ins-csueb'})
SET r.rationale = coalesce(r.rationale, "Communicates the Title II obligations to faculty with a rollout timeline and workshop announcements each term. Online Campus runs it, and it carries no executive sponsorship, which this indicator asks for.");

MATCH (i:Guidance {unique_id: 'b94c1cd15fff4659a2ae6bbcecca54e5'})-[r:is_evidence_for]->(y:YearSuccessEvidence {year_identifier: '2025-2026-8.11-ins-csueb'})
SET r.rationale = coalesce(r.rationale, "Back to the Bay runs a recurring accessibility session with schedules, slides and sign-in records. It is the documented faculty development side of orientation, and New Faculty Orientation itself is not listed.");

MATCH (i:Guidance {unique_id: '71f8b7e0653149e1b1ccc7d3411fc9c6'})-[r:is_evidence_for]->(y:YearSuccessEvidence {year_identifier: '2025-2026-8.12-ins-csueb'})
SET r.rationale = coalesce(r.rationale, "Lists the recurring accessibility workshops offered to faculty, which ties accessibility into the faculty development program.");

MATCH (i:Guidance {unique_id: '71f8b7e0653149e1b1ccc7d3411fc9c6'})-[r:is_evidence_for]->(y:YearSuccessEvidence {year_identifier: '2025-2026-8.13-ins-csueb'})
SET r.rationale = coalesce(r.rationale, "Sets out the accessibility requirements Online Campus applies across its academic technology services.");

MATCH (i:Process {unique_id: '9329b070-13bd-4f42-97cf-71f1ccc04b6a'})-[r:is_evidence_for]->(y:YearSuccessEvidence {year_identifier: '2025-2026-8.13-ins-csueb'})
SET r.rationale = coalesce(r.rationale, "Builds captioning into Canvas and Panopto provisioning, so accessibility is part of academic technology operations without anyone asking for it.");

MATCH (i:Process {unique_id: '7f88a439-2b4c-4fe2-8816-0ce896418a7d'})-[r:is_evidence_for]->(y:YearSuccessEvidence {year_identifier: '2025-2026-8.13-ins-csueb'})
SET r.rationale = coalesce(r.rationale, "Every new Canvas integration passes an accessibility review before it is enabled, which builds accessibility into academic technology adoption.");

MATCH (i:Process {unique_id: 'f3528420ca4e4fa58690aed414fc8607'})-[r:is_evidence_for]->(y:YearSuccessEvidence {year_identifier: '2025-2026-8.13-ins-csueb'})
SET r.rationale = coalesce(r.rationale, "Academic technology staff scan courses with UDOIT and remediate flagged files, which makes accessibility review part of routine LMS support.");

MATCH (i:InternalPolicy {unique_id: '410a57b968544b37a8c3ca2441f7925b'})-[r:is_evidence_for]->(y:YearSuccessEvidence {year_identifier: '2025-2026-8.14-ins-csueb'})
SET r.rationale = coalesce(r.rationale, "An adoption and course materials policy. It does not address professional development for staff, so the link is peripheral.");

MATCH (i:Guidance {unique_id: '71f8b7e0653149e1b1ccc7d3411fc9c6'})-[r:is_evidence_for]->(y:YearSuccessEvidence {year_identifier: '2025-2026-8.3-ins-csueb'})
SET r.rationale = coalesce(r.rationale, "Brings the training materials together across modalities: the checklist, written how-tos for Microsoft 365 and Adobe, and the recurring workshops.");

MATCH (i:Guidance {unique_id: '4d43f6f74e0f4d29bd351db948a6d9fa'})-[r:is_evidence_for]->(y:YearSuccessEvidence {year_identifier: '2025-2026-8.3-ins-csueb'})
SET r.rationale = coalesce(r.rationale, "Written reference on instructional materials accessibility, one of the training materials in the set.");

MATCH (i:Guidance {unique_id: '5bdfb2fe90d0419cb1359ff2de48edae'})-[r:is_evidence_for]->(y:YearSuccessEvidence {year_identifier: '2025-2026-8.3-ins-csueb'})
SET r.rationale = coalesce(r.rationale, "Written step-by-step guides for creating and remediating accessible Canvas content, including running UDOIT and captioning video. This is the written modality of the training materials.");

MATCH (i:InternalPolicy {unique_id: '410a57b968544b37a8c3ca2441f7925b'})-[r:is_evidence_for]->(y:YearSuccessEvidence {year_identifier: '2025-2026-9.2-ins-csueb'})
SET r.rationale = coalesce(r.rationale, "A Senate policy approval, not a review of the Instructional Materials Plan by an ATI Steering Committee. It does not answer this indicator.");
