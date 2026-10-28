// CSUEB 6.5-ins (2025-2026): Roger Wen as QA program owner, status to Defined, notes updated. 2026-10-27, Daniel Fontaine.
// Person twin of add_person: email is the identity key (trimmed, lowercased); unique_id hex; active=true,
// can_approve_yse=false, ati_involvement='contact' (the default); works_at_campus csueb. No employee_id is known,
// so none is set. Title as given by the user. "Academic Technology" stays in the title: that Department name is
// already SFSU's and Department names are unique.
// Status twin of assign_status_to_yse: disconnect every status_is, connect the named StatusLevel.
// Status set to Defined on the user's explicit instruction (admin decision), after the QA program was listed.
// ready_for_admin_review is not changed.

MERGE (p:Person {email: 'roger.wen@csueastbay.edu'})
ON CREATE SET p.unique_id = replace(randomUUID(), '-', ''), p.name = 'Roger Wen',
              p.active = true, p.can_approve_yse = false, p.ati_involvement = 'contact'
SET p.title = 'Sr. Director of the Online Campus, Academic Technology';

MATCH (p:Person {email: 'roger.wen@csueastbay.edu'}), (c:Campus {abbreviation: 'csueb'})
MERGE (p)-[:works_at_campus]->(c);

MATCH (i:Process {title: 'Online & Hybrid Course Quality Assurance Program (CSUEB Online Campus)'}), (p:Person {email: 'roger.wen@csueastbay.edu'})
MERGE (i)-[:owned_by]->(p);

MATCH (y:YearSuccessEvidence {year_identifier: '2025-2026-6.5-ins-csueb'})
OPTIONAL MATCH (y)-[old:status_is]->(:StatusLevel)
DELETE old;

MATCH (y:YearSuccessEvidence {year_identifier: '2025-2026-6.5-ins-csueb'}), (s:StatusLevel {status_level: 'Defined'})
MERGE (y)-[:status_is]->(s);

MATCH (n:Note {name: 'maturity-review-oct-2026-yse:2025-2026-6.5-ins-csueb-d8e32011'})
SET n.content = "Maturity review, 2026-10-23 (Daniel Fontaine), revised 2026-10-27. Recorded status: Defined, lowered from Established on 2026-10-27. The evidence supports: Defined. Confidence: medium.\n\nBasis: Three items are listed. The Online & Hybrid Course Quality Assurance Program (CSUEB Online Campus), listed 2026-10-27, is the campus redesign process. Faculty redesign an online or hybrid course to the Quality Matters rubric with an eLearning Specialist, who peer reviews the course before official review, and East Bay certifies its own courses under Subscriber-Managed Official Reviews status. Roger Wen, Senior Director of the Online Campus, leads the program, and Online Campus pays the subscription, review fees and faculty training from its base budget. The program reaches about ten opt-in online and hybrid courses a year (5 certified and 5 in progress in 2024-25), not every redesign. Neither the program page nor the 2024-25 MERLOT report says where accessibility is checked against WCAG 2.1 AA during review, and no accessibility results before and after redesign are reported. 24-25 CIC 47/FAC 14/FDEC 5 and the Instructional Materials - ATI pages state the standard and do not describe a redesign process. That is a consistent practice for a subset of courses, which is Defined.\n\nTo reach Established:\n1. Write down where accessibility is checked in the QA review (the rubric standard, the tool and the passing threshold), and add the path for redesigns outside the grant program.\n2. Show that the director's and the eLearning Specialists' position descriptions include accessibility review during redesign.\n3. Collect accessibility scores before and after redesign for certified courses, and record the CIC 47 Senate approval and effective date.\n\nRecord problems: CIC 47 has no owner and its page title is misspelled. Roger Wen has no employee ID on record.";

MATCH (y:YearSuccessEvidence {year_identifier: '2025-2026-6.5-ins-csueb'})
MATCH (p:Person {unique_id: 'a1d223af-c7aa-466b-bf54-47f0a199696d'})
MERGE (n:Note {name: 'bar-coverage-oct-2026-yse:2025-2026-6.5-ins-csueb-7a3e9c12'})
ON CREATE SET n.unique_id = replace(randomUUID(), '-', ''), n.date_created = date('2026-10-27'), n.depreciated = false, n.include_in_report = false
SET n.content = "Companion bar coverage, 2026-10-27 (Daniel Fontaine). Recorded status: Defined. Bar grade: Defined. Of 4 requirements, none is met and all 4 are partly met. No item is linked to a requirement.\n\nRequirements:\n1. Position: responsibility for accessibility during redesign formally assigned across instructional design and faculty support roles: Partly. Roger Wen leads the QA program, and each faculty member is paired with an eLearning Specialist who peer reviews the course. No position description is recorded for either role.\n2. Budget: staff time and resources identified for accessibility-focused redesign: Partly. Online Campus pays the Quality Matters subscription, review fees and training from its base budget, and the Transformation Grant pays faculty. The source is a campus self-report, and Chancellor's Office funding was cut in 2024-25.\n3. Procedures: a documented process integrates accessibility into all stages of redesign, aligned with Section 508 and WCAG 2.1 AA: Partly. The QA redesign process is documented for opt-in online and hybrid courses. No source shows the accessibility checkpoint inside the review or its WCAG alignment, and redesigns outside the program have no path.\n4. Output: metrics before and after redesign showing accessibility is incorporated: Partly. The certified course list and the student success dashboard exist. Neither reports accessibility results."
MERGE (y)-[:has_note]->(n)
MERGE (n)-[:created_by]->(p);

MATCH (y:YearSuccessEvidence {year_identifier: '2025-2026-6.5-ins-csueb'})
WHERE y.admin_review_description IS NOT NULL AND NOT y.admin_review_description CONTAINS 'Evidence review, October 27, 2026.'
SET y.admin_review_description = y.admin_review_description + "\n\nEvidence review, October 27, 2026. The Online Campus Quality Assurance program is now on record as the campus redesign process: faculty redesign online and hybrid courses to the Quality Matters rubric with an eLearning Specialist, who peer reviews each course before certification, in a program the Senior Director of the Online Campus leads and the Online Campus budget funds. It reaches about ten opt-in courses a year, and neither source shows where accessibility is checked during review or reports accessibility results before and after redesign, so the indicator holds at Defined.";
