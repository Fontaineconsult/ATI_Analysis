// Companion bar coverage notes, CSUEB 2025-2026 Instructional Materials, 2026-10-27.
// One Note per indicator that has a companion bar and is marked ready for admin review.
// Each requirement is graded Met, Partly (delivered for part of the indicator's scope) or Bare.
// No requirement on these indicators carried a satisfies claim at grading time.
// Attached with has_note, created_by Daniel Fontaine.
// include_in_report=false: internal review notes, kept out of the public report.
// Idempotent: MERGE on note name; re-run refreshes content.

MATCH (y:YearSuccessEvidence {year_identifier: '2025-2026-1.2-ins-csueb'})
MATCH (p:Person {unique_id: 'a1d223af-c7aa-466b-bf54-47f0a199696d'})
MERGE (n:Note {name: 'bar-coverage-oct-2026-yse:2025-2026-1.2-ins-csueb-3c81e0a7'})
ON CREATE SET n.unique_id = replace(randomUUID(), '-', ''), n.date_created = date('2026-10-27'), n.depreciated = false, n.include_in_report = false
SET n.content = 'Companion bar coverage, 2026-10-27 (Daniel Fontaine). Recorded status: Defined. Bar grade: Defined. Of 8 requirements, 2 are met, 1 is partly met and 5 are bare. No item is linked to a requirement.\n\nRequirements:\n3. A written, enforced campuswide process that accounts for late-assigned instructors by auto-adopting: Bare. Directive 2018-01 and CIC 47 set the deadline, and nothing handles late assignment.\n5. Roles assigned across departments, library, instructional design, accessibility, ATI and bookstore: Partly. Textbook Adoption Internal Tracking names a contact in each department. No cross-unit role map exists.\n6. Faculty informed of timelines that leave time for accessibility review: Met. Course Accessibility & Timeline (Accessibility Services) publishes mid-March and mid-October deadlines on a 4 to 6 week remediation basis. That item is listed under 4.1, 4.3 and 4.5 and not here, so list it here as evidence.\n7. Staff time explicitly allocated to adoption coordination and accessibility review: Bare.\n8. Training and guidance regularly provided on adoption expectations: Bare.\n9. Tracking that monitors adoption status and flags risk early: Met. The CSUEB Textbook Adoption Monitoring Platform runs on a nightly Follett feed. It is still in test.\n10. Used consistently across terms and reviewed periodically: Bare.\n11. Consistent Provost, dean or chair communication aligned with term planning: Bare. The provost\'s messaging strategy is still in development.\n\nThe bar\'s Position Description, Budget and Output headings carry no text in the source, so they have no requirements to grade.'
MERGE (y)-[:has_note]->(n)
MERGE (n)-[:created_by]->(p);

MATCH (y:YearSuccessEvidence {year_identifier: '2025-2026-1.6-ins-csueb'})
MATCH (p:Person {unique_id: 'a1d223af-c7aa-466b-bf54-47f0a199696d'})
MERGE (n:Note {name: 'bar-coverage-oct-2026-yse:2025-2026-1.6-ins-csueb-9d4f2b16'})
ON CREATE SET n.unique_id = replace(randomUUID(), '-', ''), n.date_created = date('2026-10-27'), n.depreciated = false, n.include_in_report = false
SET n.content = 'Companion bar coverage, 2026-10-27 (Daniel Fontaine). Recorded status: Initiated. Bar grade: Initiated. Of 5 requirements, none is met and all 5 are bare. No item is linked to a requirement.\n\nRequirements:\n1. Reports generated on a predictable schedule aligned with terms: Bare.\n2. Reports include meaningful metrics on timely adoption and accessibility readiness: Bare. The monitoring platform dashboard already computes coverage percentage, OER sections and projected student savings, but no report built from it exists.\n3. Campus administration receives reports in time to act: Bare.\n4. Responsibilities for creating, reviewing and distributing reports are defined: Bare.\n5. Reports inform planning, resourcing and improvement: Bare.\n\nThe dashboard is the means for every requirement. One delivered report with a named recipient would open requirements 1, 3 and 4.'
MERGE (y)-[:has_note]->(n)
MERGE (n)-[:created_by]->(p);

MATCH (y:YearSuccessEvidence {year_identifier: '2025-2026-4.5-ins-csueb'})
MATCH (p:Person {unique_id: 'a1d223af-c7aa-466b-bf54-47f0a199696d'})
MERGE (n:Note {name: 'bar-coverage-oct-2026-yse:2025-2026-4.5-ins-csueb-5ae7c3d2'})
ON CREATE SET n.unique_id = replace(randomUUID(), '-', ''), n.date_created = date('2026-10-27'), n.depreciated = false, n.include_in_report = false
SET n.content = 'Companion bar coverage, 2026-10-27 (Daniel Fontaine). Recorded status: Defined. Bar grade: Defined. Of 5 requirements, none is met, 2 are partly met and 3 are bare. No item is linked to a requirement.\n\nRequirements:\n1. LMS roles and permissions for alternate media staff clearly defined: Bare. The 2026-08-18 note records that no Canvas role or permission is documented for them.\n2. Access granted early enough for review and remediation: Partly. Alt Media Request & Fulfillment Automation gives production staff the adopted-title list before term from the Follett feed. That covers other platforms. Nothing records when staff get Canvas access.\n3. Consistent across departments and terms: Bare. Early access depends on adoption compliance, which runs at 45 to 55 percent.\n4. Faculty understand and support access requirements: Partly. Course Accessibility & Timeline publishes the deadlines and says nothing about LMS access for alternate media staff.\n5. The process is reviewed for access barriers or delays: Bare.\n\nThe retired Policy on Timely Adoption is still listed and was not counted.'
MERGE (y)-[:has_note]->(n)
MERGE (n)-[:created_by]->(p);

MATCH (y:YearSuccessEvidence {year_identifier: '2025-2026-4.11-ins-csueb'})
MATCH (p:Person {unique_id: 'a1d223af-c7aa-466b-bf54-47f0a199696d'})
MERGE (n:Note {name: 'bar-coverage-oct-2026-yse:2025-2026-4.11-ins-csueb-e2b9047c'})
ON CREATE SET n.unique_id = replace(randomUUID(), '-', ''), n.date_created = date('2026-10-27'), n.depreciated = false, n.include_in_report = false
SET n.content = 'Companion bar coverage, 2026-10-27 (Daniel Fontaine). Recorded status: Initiated. Bar grade: Initiated. Of 6 requirements, none is met and all 6 are bare. No item is linked to a requirement.\n\nRequirements:\n1. External instructional content identified and reviewed: Bare. The LTI Accessibility Review and Approval Gate reviews tools entering Canvas. It does not review sites faculty build or host off campus.\n2. Faculty receive guidance and support for remediation: Bare.\n3. Reviews conducted consistently and documented: Bare.\n4. Risks tracked and addressed proactively: Bare.\n5. The process aligns with institutional accessibility standards: Bare. CIC 47 states the standard, and no review process exists to align with it.\n6. Methods to discover faculty sites outside the campus ecosystem: Bare.\n\nThe Faculty Maintained Websites note says faculty sites follow the ICT review. The March 2026 note says no process is in place. Settle the contradiction with Zach Oshri before relying on either.'
MERGE (y)-[:has_note]->(n)
MERGE (n)-[:created_by]->(p);

MATCH (y:YearSuccessEvidence {year_identifier: '2025-2026-5.14-ins-csueb'})
MATCH (p:Person {unique_id: 'a1d223af-c7aa-466b-bf54-47f0a199696d'})
MERGE (n:Note {name: 'bar-coverage-oct-2026-yse:2025-2026-5.14-ins-csueb-71c6a9e5'})
ON CREATE SET n.unique_id = replace(randomUUID(), '-', ''), n.date_created = date('2026-10-27'), n.depreciated = false, n.include_in_report = false
SET n.content = 'Companion bar coverage, 2026-10-27 (Daniel Fontaine). Recorded status: Initiated. Bar grade: Initiated. Of 5 requirements, none is met, 1 is partly met and 4 are bare. No item is linked to a requirement.\n\nRequirements:\n1. Emerging tools reviewed before instructional use: Partly. The LTI Accessibility Review and Approval Gate reviews tools that enter Canvas. AI tools and tools used outside Canvas have no review route. The gate has no linked documentation and no strength rating on this indicator.\n2. Accessibility risks documented and addressed: Bare.\n3. Alternate activities developed when full accessibility is not feasible: Bare.\n4. Learning outcomes equivalent for all students: Bare.\n5. Faculty receive guidance and support throughout: Bare. The faculty selection checklist is planned, and the AI guidelines are a draft awaiting Provost approval.'
MERGE (y)-[:has_note]->(n)
MERGE (n)-[:created_by]->(p);

MATCH (y:YearSuccessEvidence {year_identifier: '2025-2026-5.15-ins-csueb'})
MATCH (p:Person {unique_id: 'a1d223af-c7aa-466b-bf54-47f0a199696d'})
MERGE (n:Note {name: 'bar-coverage-oct-2026-yse:2025-2026-5.15-ins-csueb-b80d5f3a'})
ON CREATE SET n.unique_id = replace(randomUUID(), '-', ''), n.date_created = date('2026-10-27'), n.depreciated = false, n.include_in_report = false
SET n.content = 'Companion bar coverage, 2026-10-27 (Daniel Fontaine). Recorded status: Defined. Bar grade: Defined. Of 5 requirements, none is met, 3 are partly met and 2 are bare. No item is linked to a requirement.\n\nRequirements:\n1. Accessibility evaluated during selection and adoption: Partly. The LTI Accessibility Review and Approval Gate evaluates publisher content integrated into Canvas. Inclusive Access materials sold through Follett, about 125 sections in Fall 2024, are not evaluated.\n2. Publisher documentation reviewed and tracked: Partly. The gate reviews the conformance report. The Canvas LTI vendors and P2P review status audit tracks review status by vendor, and it is listed only under 6.9.\n3. Remediation or alternate access planned proactively: Bare. The Dean of Libraries\' tracking process is stated as intent.\n4. Faculty supported in making accessible choices: Bare.\n5. Aligned with procurement and instructional timelines: Partly. The gate hands off to the CSUBuy procurement review. Nothing ties it to the adoption calendar.\n\nThe gate is the only item listed and has no linked documentation.'
MERGE (y)-[:has_note]->(n)
MERGE (n)-[:created_by]->(p);

MATCH (y:YearSuccessEvidence {year_identifier: '2025-2026-6.2-ins-csueb'})
MATCH (p:Person {unique_id: 'a1d223af-c7aa-466b-bf54-47f0a199696d'})
MERGE (n:Note {name: 'bar-coverage-oct-2026-yse:2025-2026-6.2-ins-csueb-4f1e8b90'})
ON CREATE SET n.unique_id = replace(randomUUID(), '-', ''), n.date_created = date('2026-10-27'), n.depreciated = false, n.include_in_report = false
SET n.content = 'Companion bar coverage, 2026-10-27 (Daniel Fontaine). Recorded status: Initiated. Bar grade: Initiated. Of 4 requirements, none is met, 1 is partly met and 3 are bare. No item is linked to a requirement.\n\nRequirements:\n1. Position: responsibility formally assigned across faculty support, instructional design and procurement roles: Bare. Only Zach Oshri\'s Accessibility Specialist role is recorded as written into a position description.\n2. Budget: staff time and resources identified for review during course development: Bare.\n3. Procedures: a documented process requires accessibility verification at the point of adoption: Partly. The LTI Accessibility Review and Approval Gate verifies Canvas integrations. Course materials in general have no verification step. The remediate-or-OER practice exists only as a note.\n4. Output: records showing new courses launch with accessible materials: Bare.\n\nNeither listed item has a strength rating.'
MERGE (y)-[:has_note]->(n)
MERGE (n)-[:created_by]->(p);

MATCH (y:YearSuccessEvidence {year_identifier: '2025-2026-6.4-ins-csueb'})
MATCH (p:Person {unique_id: 'a1d223af-c7aa-466b-bf54-47f0a199696d'})
MERGE (n:Note {name: 'bar-coverage-oct-2026-yse:2025-2026-6.4-ins-csueb-c37a2d58'})
ON CREATE SET n.unique_id = replace(randomUUID(), '-', ''), n.date_created = date('2026-10-27'), n.depreciated = false, n.include_in_report = false
SET n.content = 'Companion bar coverage, 2026-10-27 (Daniel Fontaine). Recorded status: Initiated. Bar grade: Initiated. Of 4 requirements, none is met and all 4 are bare. No item is linked to a requirement.\n\nRequirements:\n1. Position: responsibility for review and remediation during course revision formally assigned: Bare.\n2. Budget: staff time or resources identified for review of course updates: Bare.\n3. Procedures: a documented process requires review and remediation before posting during revision: Bare. The only item, the Accessible Course Materials Remediation Form, remediates scanned PDFs on request. Faculty opt in, so nothing requires review before posting.\n4. Output: records showing revised materials are reviewed before students see them: Bare.'
MERGE (y)-[:has_note]->(n)
MERGE (n)-[:created_by]->(p);

MATCH (y:YearSuccessEvidence {year_identifier: '2025-2026-6.7-ins-csueb'})
MATCH (p:Person {unique_id: 'a1d223af-c7aa-466b-bf54-47f0a199696d'})
MERGE (n:Note {name: 'bar-coverage-oct-2026-yse:2025-2026-6.7-ins-csueb-8b2c64f1'})
ON CREATE SET n.unique_id = replace(randomUUID(), '-', ''), n.date_created = date('2026-10-27'), n.depreciated = false, n.include_in_report = false
SET n.content = 'Companion bar coverage, 2026-10-27 (Daniel Fontaine). Recorded status: Defined. Bar grade: Defined, the closest of this group to Established. Of 4 requirements, 1 is met and 3 are partly met. No item is linked to a requirement.\n\nRequirements:\n1. Position: responsibility for course evaluations formally assigned: Partly. Zach Oshri owns the scanning process, and his Accessibility Specialist role is written into his position description. The record does not show that the description names this work, and no other role is recorded.\n2. Budget: tools and staff time allocated for automated and manual evaluation: Partly. UDOIT and the dashboard are in place. Student assistant time is used and is not recorded as allocated.\n3. Procedures: a documented process sets a regular schedule and required automated and manual methods: Partly. UDOIT reports are pulled nightly. No manual method or review schedule is written down.\n4. Output: evaluation results generated, tracked and used to drive remediation: Met. The Instructional Materials Remediation Dashboard produces a department scorecard each night, and the Online Campus lead contacts departments that score poorly. The dashboard has no strength rating, so rate it and link it to this requirement.\n\nWriting down the manual method and schedule, and showing the position description text, would let this indicator argue for Established.'
MERGE (y)-[:has_note]->(n)
MERGE (n)-[:created_by]->(p);

MATCH (y:YearSuccessEvidence {year_identifier: '2025-2026-6.9-ins-csueb'})
MATCH (p:Person {unique_id: 'a1d223af-c7aa-466b-bf54-47f0a199696d'})
MERGE (n:Note {name: 'bar-coverage-oct-2026-yse:2025-2026-6.9-ins-csueb-d6a1f73e'})
ON CREATE SET n.unique_id = replace(randomUUID(), '-', ''), n.date_created = date('2026-10-27'), n.depreciated = false, n.include_in_report = false
SET n.content = 'Companion bar coverage, 2026-10-27 (Daniel Fontaine). Recorded status: Defined. Bar grade: Defined, low confidence. Of 4 requirements, none is met, 1 is partly met and 3 are bare. No item is linked to a requirement.\n\nRequirements:\n1. Position: responsibility for initiating, approving and implementing TAAPs formally assigned: Bare. Amanda McGowan owns the SFBRN authoring process. No position description is recorded for it, and nothing names who initiates a TAAP at East Bay.\n2. Budget: staff time and resources for alternate access solutions: Bare.\n3. Procedures: a documented process defines when and how TAAPs are created and tracked on a standard template: Partly. The SFBRN TAAP Authoring Process uses the Chancellor\'s Office template, and the SFBRN CSUBuy IT Accessibility Review Procedure says when a review finding calls for one. Nothing defines when an LTI integration triggers a TAAP, which the LTI is a weak spot note names.\n4. Output: TAAPs consistently used, centrally logged and stored accessibly: Bare. East Bay has no TAAPs on record for 2025-2026. The Canvas LTI vendors and P2P review status audit finds 28 of 44 vendors with no CSUBuy record.\n\nBoth SFBRN items are rated weak and marked as internal, though SFBRN serves three campuses. The retired CSUEB Equal Access Plan was not counted. Check that the empty register reflects practice before signing off at Defined.'
MERGE (y)-[:has_note]->(n)
MERGE (n)-[:created_by]->(p);

MATCH (y:YearSuccessEvidence {year_identifier: '2025-2026-7.11-ins-csueb'})
MATCH (p:Person {unique_id: 'a1d223af-c7aa-466b-bf54-47f0a199696d'})
MERGE (n:Note {name: 'bar-coverage-oct-2026-yse:2025-2026-7.11-ins-csueb-2e95b0c4'})
ON CREATE SET n.unique_id = replace(randomUUID(), '-', ''), n.date_created = date('2026-10-27'), n.depreciated = false, n.include_in_report = false
SET n.content = 'Companion bar coverage, 2026-10-27 (Daniel Fontaine). Recorded status: Initiated. Bar grade: Initiated. Of 4 requirements, none is met, 1 is partly met and 3 are bare. No item is linked to a requirement.\n\nRequirements:\n1. Position: responsibility for digital library asset accessibility formally assigned across library and accessibility roles: Bare. Zach Oshri is the de facto owner, and the work is absorbed into his existing role.\n2. Budget: staff time and resources for accessible acquisition, digitization and remediation: Bare. The September 2026 note records that no separate staff time or funding exists.\n3. Procedures: a documented process builds accessibility into acquiring, creating, digitizing and maintaining: Partly. Licensed content gets an accessibility review at purchase, which Kristin Hart described. The routing from Accessibility Services to Zach Oshri\'s team is practice and is written down nowhere.\n4. Output: records showing course library assets are accessible: Bare. The barrier pathway has received zero requests.\n\nThe only listed item, Chancellor\'s Office Access to eResources, has no strength rating. The two September 2026 recommendations remain open.'
MERGE (y)-[:has_note]->(n)
MERGE (n)-[:created_by]->(p);
