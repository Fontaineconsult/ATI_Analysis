// Evidence review sentences appended to the coordinator's Evidence Summary (admin_review_description),
// CSUEB 2025-2026 Instructional Materials, the 22 indicators marked ready for admin review. 2026-10-27, Daniel Fontaine.
// Mirrors update_admin_reviewer_description (plain property set, no side effects). Appends a labeled paragraph;
// the coordinator's text is left unchanged. Idempotent: the WHERE guard skips a summary that already has the label.
// PUBLIC: admin_review_description renders in the campus report under Evidence Summary.

MATCH (y:YearSuccessEvidence {year_identifier: '2025-2026-1.2-ins-csueb'})
WHERE y.admin_review_description IS NOT NULL AND NOT y.admin_review_description CONTAINS 'Evidence review, October 27, 2026.'
SET y.admin_review_description = y.admin_review_description + "\n\nEvidence review, October 27, 2026. Measured against the companion guide, two of the eight Established expectations are met: faculty are told adoption deadlines that leave four to six weeks for remediation, and the monitoring platform tracks adoption status each night. No enforced procedure covers instructors assigned late, staff time for adoption coordination is not documented, and messaging from the Provost, deans and chairs is not yet regular. The monitoring platform is still in testing.";

MATCH (y:YearSuccessEvidence {year_identifier: '2025-2026-1.6-ins-csueb'})
WHERE y.admin_review_description IS NOT NULL AND NOT y.admin_review_description CONTAINS 'Evidence review, October 27, 2026.'
SET y.admin_review_description = y.admin_review_description + "\n\nEvidence review, October 27, 2026. None of the companion guide's five Established expectations is met yet, because no adoption report has been produced or delivered. No schedule, recipient or person responsible for the report is on record.";

MATCH (y:YearSuccessEvidence {year_identifier: '2025-2026-4.3-ins-csueb'})
WHERE y.admin_review_description IS NOT NULL AND NOT y.admin_review_description CONTAINS 'Evidence review, October 27, 2026.'
SET y.admin_review_description = y.admin_review_description + "\n\nEvidence review, October 27, 2026. The ATI Coordinator is staff assigned to this program, and the coordinator's position description includes the work, which meets the rubric's Established requirement that ATI tasks appear in campus job descriptions. The other contributors across the four units carry the work without it appearing in their position descriptions, which is the staffing limit that holds the indicator below Managed.";

MATCH (y:YearSuccessEvidence {year_identifier: '2025-2026-4.5-ins-csueb'})
WHERE y.admin_review_description IS NOT NULL AND NOT y.admin_review_description CONTAINS 'Evidence review, October 27, 2026.'
SET y.admin_review_description = y.admin_review_description + "\n\nEvidence review, October 27, 2026. The companion guide's Established expectations center on access inside Canvas, and none is fully met yet. No Canvas role or permission for alternate media staff is documented, and no record shows when staff gain course access relative to the start of instruction. Early access to textbook titles depends on faculty adopting on time.";

MATCH (y:YearSuccessEvidence {year_identifier: '2025-2026-4.11-ins-csueb'})
WHERE y.admin_review_description IS NOT NULL AND NOT y.admin_review_description CONTAINS 'Evidence review, October 27, 2026.'
SET y.admin_review_description = y.admin_review_description + "\n\nEvidence review, October 27, 2026. None of the companion guide's six Established expectations is met. The Canvas gate and the P2P questionnaire review tools and purchases, not sites that faculty build and maintain themselves. No method is in place to find faculty sites hosted outside the campus domain.";

MATCH (y:YearSuccessEvidence {year_identifier: '2025-2026-5.12-ins-csueb'})
WHERE y.admin_review_description IS NOT NULL AND NOT y.admin_review_description CONTAINS 'Evidence review, October 27, 2026.'
SET y.admin_review_description = y.admin_review_description + "\n\nEvidence review, October 27, 2026. The published guidance page does not mention course readers, so the routes through Online Campus and the Library rest on staff practice. No record shows who remediates readers or how that work is funded.";

MATCH (y:YearSuccessEvidence {year_identifier: '2025-2026-5.13-ins-csueb'})
WHERE y.admin_review_description IS NOT NULL AND NOT y.admin_review_description CONTAINS 'Evidence review, October 27, 2026.'
SET y.admin_review_description = y.admin_review_description + "\n\nEvidence review, October 27, 2026. The student assistant team is the largest resource behind this work, and no allocation record for it is on file. The Reflow pipeline is still in testing, and the workflow from intake to faculty sign-off is not yet written as a procedure.";

MATCH (y:YearSuccessEvidence {year_identifier: '2025-2026-5.14-ins-csueb'})
WHERE y.admin_review_description IS NOT NULL AND NOT y.admin_review_description CONTAINS 'Evidence review, October 27, 2026.'
SET y.admin_review_description = y.admin_review_description + "\n\nEvidence review, October 27, 2026. The companion guide's Established expectations go beyond review before use: documenting and addressing risks, developing alternate activities when a tool cannot be made accessible, and supporting faculty throughout. None of these is in place yet, inside or outside Canvas. The gate has no published procedure.";

MATCH (y:YearSuccessEvidence {year_identifier: '2025-2026-5.15-ins-csueb'})
WHERE y.admin_review_description IS NOT NULL AND NOT y.admin_review_description CONTAINS 'Evidence review, October 27, 2026.'
SET y.admin_review_description = y.admin_review_description + "\n\nEvidence review, October 27, 2026. Three of the companion guide's five Established expectations are partly met through the Canvas gate: evaluation at adoption, review of publisher documentation, and alignment with procurement. Remediation or alternate access is not planned ahead of term, and faculty have no guidance on choosing accessible publisher content. The gate has no published procedure.";

MATCH (y:YearSuccessEvidence {year_identifier: '2025-2026-5.16-ins-csueb'})
WHERE y.admin_review_description IS NOT NULL AND NOT y.admin_review_description CONTAINS 'Evidence review, October 27, 2026.'
SET y.admin_review_description = y.admin_review_description + "\n\nEvidence review, October 27, 2026. The gate has no published procedure, and only the ATI Coordinator's position description is on record for the review. Tools already in use are not re-reviewed, and remediation after adoption is not covered.";

MATCH (y:YearSuccessEvidence {year_identifier: '2025-2026-6.2-ins-csueb'})
WHERE y.admin_review_description IS NOT NULL AND NOT y.admin_review_description CONTAINS 'Evidence review, October 27, 2026.'
SET y.admin_review_description = y.admin_review_description + "\n\nEvidence review, October 27, 2026. Outside Canvas integrations, course materials have no accessibility check at the point of adoption. Responsibility across faculty support, instructional design and procurement is not documented, and no record shows that new courses launch with accessible materials.";

MATCH (y:YearSuccessEvidence {year_identifier: '2025-2026-6.4-ins-csueb'})
WHERE y.admin_review_description IS NOT NULL AND NOT y.admin_review_description CONTAINS 'Evidence review, October 27, 2026.'
SET y.admin_review_description = y.admin_review_description + "\n\nEvidence review, October 27, 2026. None of the companion guide's four Established expectations is met, because review before posting depends on faculty requesting it. No role is assigned to review revised courses, and no record shows that revised materials are checked before students see them.";

MATCH (y:YearSuccessEvidence {year_identifier: '2025-2026-6.7-ins-csueb'})
WHERE y.admin_review_description IS NOT NULL AND NOT y.admin_review_description CONTAINS 'Evidence review, October 27, 2026.'
SET y.admin_review_description = y.admin_review_description + "\n\nEvidence review, October 27, 2026. Against the companion guide, the Output expectation is met: the dashboard produces evaluation results each night, and they drive outreach to departments. Procedures, position and budget are partly in place, because the manual method and the evaluation schedule are not written down and student assistant time is not recorded as allocated.";

MATCH (y:YearSuccessEvidence {year_identifier: '2025-2026-6.9-ins-csueb'})
WHERE y.admin_review_description IS NOT NULL AND NOT y.admin_review_description CONTAINS 'Evidence review, October 27, 2026.'
SET y.admin_review_description = y.admin_review_description + "\n\nEvidence review, October 27, 2026. CSU East Bay has no TAAPs on record for 2025-26, so the companion guide's expectation of a central TAAP log is not met. The October 2026 audit of Canvas integrations found 28 of 44 vendors with no CSUBuy review record, so those tools never reached the step where a TAAP would be considered.";

MATCH (y:YearSuccessEvidence {year_identifier: '2025-2026-7.11-ins-csueb'})
WHERE y.admin_review_description IS NOT NULL AND NOT y.admin_review_description CONTAINS 'Evidence review, October 27, 2026.'
SET y.admin_review_description = y.admin_review_description + "\n\nEvidence review, October 27, 2026. None of the companion guide's four Established expectations is fully met. The review at purchase is practiced, but the route from Accessibility Services to the ATI Coordinator's team is not written down, and no staff time or budget is assigned to library asset accessibility.";

MATCH (y:YearSuccessEvidence {year_identifier: '2025-2026-7.3-ins-csueb'})
WHERE y.admin_review_description IS NOT NULL AND NOT y.admin_review_description CONTAINS 'Evidence review, October 27, 2026.'
SET y.admin_review_description = y.admin_review_description + "\n\nEvidence review, October 27, 2026. The practice depends on one person, and the example documents are not kept in a published location. No record shows who refreshes the examples or when.";

MATCH (y:YearSuccessEvidence {year_identifier: '2025-2026-7.5-ins-csueb'})
WHERE y.admin_review_description IS NOT NULL AND NOT y.admin_review_description CONTAINS 'Evidence review, October 27, 2026.'
SET y.admin_review_description = y.admin_review_description + "\n\nEvidence review, October 27, 2026. Procedures and documentation are close to Established. Resources hold the grade: no position description or budget covers the checklist, guides and workshops, and the syllabus elements loaded into every Canvas shell carry no accessibility statement.";

MATCH (y:YearSuccessEvidence {year_identifier: '2025-2026-8.1-ins-csueb'})
WHERE y.admin_review_description IS NOT NULL AND NOT y.admin_review_description CONTAINS 'Evidence review, October 27, 2026.'
SET y.admin_review_description = y.admin_review_description + "\n\nEvidence review, October 27, 2026. No message from the Provost or President, named sponsor, campaign plan or measure of reach is on record. The communication on file is a consistent practice run by Online Campus.";

MATCH (y:YearSuccessEvidence {year_identifier: '2025-2026-8.11-ins-csueb'})
WHERE y.admin_review_description IS NOT NULL AND NOT y.admin_review_description CONTAINS 'Evidence review, October 27, 2026.'
SET y.admin_review_description = y.admin_review_description + "\n\nEvidence review, October 27, 2026. The accessibility segment of New Faculty Orientation depends on an invitation to Accessibility Services, is absent from the published orientation description, and appears in no position description. Back to the Bay attendance is optional.";

MATCH (y:YearSuccessEvidence {year_identifier: '2025-2026-8.14-ins-csueb'})
WHERE y.admin_review_description IS NOT NULL AND NOT y.admin_review_description CONTAINS 'Evidence review, October 27, 2026.'
SET y.admin_review_description = y.admin_review_description + "\n\nEvidence review, October 27, 2026. The practice is ad hoc and limited to one person. The CIC 47 policy listed for this indicator governs textbook adoption and does not address professional development.";

MATCH (y:YearSuccessEvidence {year_identifier: '2025-2026-9.2-ins-csueb'})
WHERE y.admin_review_description IS NOT NULL AND NOT y.admin_review_description CONTAINS 'Evidence review, October 27, 2026.'
SET y.admin_review_description = y.admin_review_description + "\n\nEvidence review, October 27, 2026. The CIC 47 policy listed here is a Senate policy approval, not a committee review of an instructional materials plan. Direction for instructional materials rests with one person.";

MATCH (y:YearSuccessEvidence {year_identifier: '2025-2026-9.3-ins-csueb'})
WHERE y.admin_review_description IS NOT NULL AND NOT y.admin_review_description CONTAINS 'Evidence review, October 27, 2026.'
SET y.admin_review_description = y.admin_review_description + "\n\nEvidence review, October 27, 2026. No members, charter or meetings are on record. Interest in forming the group is documented, and no practice exists yet.";
