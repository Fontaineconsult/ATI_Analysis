// Ingest: Procurement Working Group 11/12 (MeetingMinutes 57f6acd02bbe45db9e1444a76051a3ac)
// Source: the MeetingMinutes node itself, 17,399 characters, loaded 2026-11-13, ontology_ingested false.
// Recording referenced by the minutes: GMT20261112-220913_Recording.transcript.vtt (not read for this ingest).
//
// ANCHORS (already on the minutes node, this file does not set them):
//   minutes_under_plan  -> 2025-2026-sfsu-pro      (convening campus for SFBRN work)
//   minutes_recorded_by -> Daniel Fontaine
//   pertains_to         -> Procurement (CommunityOfPractice)
// Reporting year 2025-2026. Facts anchor to the campus whose practice they describe.
// All 13 candidate year_identifiers bind-checked 2026-11-13, every one returned 1.
//
// SCOPE APPROVED BY THE USER:
//   7 notes, 3 plans, 4 queries, 1 concern, 1 query settled. No recommendation.
//   The user cut the notes to stable facts that hold across a reporting year, and cut
//   the plan to add a risk-acceptance path to the impact decision tool. They then asked
//   for notes on implementations rather than generic indicator-level notes.
//
// NOTE PLACEMENT:
//   Six of seven notes document a specific implementation through is_documented_by, so
//   the operational detail sits on the thing it describes and reaches the evidence tree
//   a status review walks. Each is also attached to its indicator and to the minutes,
//   which is the existing convention, and each documentation edge is excluded from
//   2025-2026 so the note renders once in the report rather than twice.
//     1  About ICT Purchases - VPAT                          86d96d17d43d44cd84c0c637265abd23
//     2  SFBRN Impact Matrix                                 7dfd71d849bf438eb81eff120b216ac4
//     3  none, and the comment on it says why
//     4  LTI Accessibility Review and Approval Gate (CSUEB)  7f88a439-2b4c-4fe2-8816-0ce896418a7d
//     5  Report of On-Campus Inaccessibility (barrier form)  d46bab54020b440d856c460f6148d794
//     6  Canvas LTI vendors and P2P review status            8fa315a3edae4d989f4cdc56e1e7f209
//     7  SFBRN TAAP Authoring Process                        c665c9fb582b4cd0af1b8f753960a301
//   Notes 6 and 7 are additions from this pass. Note 6 was on the cut list as a weak
//   indicator-level note about request counts; it is specific detail on an implementation
//   that is itself a vendor count. Note 7 is new, and puts a drafting rule on the
//   authoring process so it binds on the next plan rather than only the one being revised.
//
// NOT INGESTED:
//   - Every per-requisition decision: the OpenAI API credit renewal, WebWork's manual
//     review, The Economist and The Atlantic, Visix, the catering and contracting
//     renewal. Standing global-state rule: notes and queries are process-level.
//   - Section 8 in full (failures-section feedback, severity measurement, ACR quality
//     scoring, form speed, AWS report reading). Tool and rubric design, excluded by the
//     10/28 precedent in ingest_2026_10_28_procurement_wg_acr_storage.cypher.
//   - Web working group recruiting. Belongs to the web group, not procurement.
//   - Zach Oshri's working group membership, the WebWork institutional fact, and the
//     library subscription repository difference. Cut as transactional or temporary;
//     the repository difference survives inside query 3's detail. The review-only
//     request volume was also cut and then reinstated as note 6, on the implementation
//     whose own content is a vendor-by-vendor count.
//   - Noelle (new CSUEB director, does not attend), Brad (departed, owns nothing current).
//
// ALREADY IN THE GRAPH, SO NOTHING NEW WAS WRITTEN FOR IT:
//   - The "reconvene with the CSUEB library" action item is Plan
//     71f5750178ea4e6c9db323d8983b3e1c, already In Progress and already furthering
//     7.11-ins-ssu and 7.11-ins-csueb. No second plan is written for it.
//   - Recommendation 1ad6d43e (library accessibility duty in position descriptions) is
//     open but scoped to SF State, while the 11/12 discussion was about CSU East Bay.
//     Flagged for the user, not duplicated here.
//   - Recommendation 8650bd2b (inventory Canvas LTI tools) is open on 5.16-ins-sfsu.
//   - The $0 eREC route for LTIs is already noted at CSUEB and SSU, dated 2026-10-26.
//     Note 1 adds only the close-out mechanic, which those notes do not carry.
//   - CSUEB ACR local storage is the 10/28 note on 1.8-pro-csueb.
//
// IDENTITY RESOLUTIONS (all existing nodes, none created):
//   Amanda McGowan  538d0f04e2814aa8819bebad3f93325b   (ssu, member)
//   Daniel Fontaine a1d223af-c7aa-466b-bf54-47f0a199696d (sfsu, member)
//   Jonathan Hale   c02326cffb814ed9b5b8d5a94d46de11   (csueb, contributor)
//   Sara Marquez    21ede31e2676400785ca516fb2f5a10d   (ssu, contributor)
//   Margaret Price  d7fc0e8cbebc4a429652cfec83ded881   (csueb, member)
//   Zach Oshri      00ce88c5d3a44fb5a59987f2e9022286   (csueb, member)
//   NO NODE, prose only: Raphael (approver named in plan 2), Yvonne (named in plan 1),
//   Noelle, Gene, Sean, Brad. Each is peripheral and named only as a contact.
//   "Sandy Ayala" in the minutes is Sandra Ayala (ssu, member); she is not referenced
//   by any node in this file.
//
// AS-HEARD TERMS the minutes flag as unconfirmed, carried cautiously below:
//   the catering product ("caterees", possibly Catertrax), Visix ("Physics V"),
//   "Lobo Vision", "OP&A Ei Credit" (OpenAI API credits), "Chris Daniel" (Level Access).
//   No node in this file is keyed on any of them.
//
// MECHANICAL NOTES:
//   - Plan MERGEs on `description`, which is the enforced unique constraint
//     (constraint_unique_Plan_description). `name` carries no constraint, so merging on
//     it would create a second node and then violate the description constraint.
//   - Concern has no natural key, so it MERGEs on the has_concern pattern plus its text.
//   - Query has no natural key, so it MERGEs on its question text.
//   - Note names use the project convention <slug>-<mon>-<year>-yse:<yid>-<8hex> with a
//     literal hex suffix, because a generated one would duplicate the note on re-run.
//   - Plans attach with includes_plan from the working group plan matching their
//     furthers_yse family, and in_academic_year from AcademicYear.name.

// ---------------------------------------------------------------------------
// NOTE 1 of 7 -- 1.5-pro-csueb, documenting "About ICT Purchases - VPAT"
// How a zero dollar review closes at CSU East Bay. S1, Jonathan Hale operates it;
// the governing rule is Amanda McGowan's.
// The implementation is CSU East Bay's own ICT review record and already evidences
// 1.5-pro-csueb, so the note and its indicator agree.
// ---------------------------------------------------------------------------
MATCH (y:YearSuccessEvidence {year_identifier: '2025-2026-1.5-pro-csueb'})
MATCH (m:MeetingMinutes {unique_id: '57f6acd02bbe45db9e1444a76051a3ac'})
MATCH (author:Person {unique_id: 'a1d223af-c7aa-466b-bf54-47f0a199696d'})
MATCH (impl:Guidance {unique_id: '86d96d17d43d44cd84c0c637265abd23'})
MERGE (n:Note {name: 'csueb-zero-dollar-review-closeout-nov-2026-yse:2025-2026-1.5-pro-csueb-7b24e1c9'})
ON CREATE SET n.unique_id = replace(randomUUID(), '-', ''), n.include_in_report = true, n.date_created = date('2026-11-12')
SET n.content = "Software that nobody pays for still reaches accessibility review at CSU East Bay, because the request enters P2P as a zero dollar requisition. Every usual review runs on it, including IT security, the IT review and ATI. The buyer then rejects the requisition and records the reason in a comment, such as no purchase or payment by P-card. Rejecting it keeps the item out of the Common Financial System while leaving the approval comments and the decision in P2P, where an auditor can find them. A zero dollar approval records that the product meets accessibility requirements and may be used. Applications the campus builds itself follow the same path as a zero dollar eREQ. The rule behind the route is that any software someone will use goes through P2P and reaches the accessibility desk, because the university will not operate a second review system beside it."
MERGE (y)-[:has_note]->(n)
MERGE (m)-[:has_note]->(n)
MERGE (n)-[:created_by]->(author)
MERGE (impl)-[d:is_documented_by]->(n)
ON CREATE SET d.added_date = date('2026-11-12'), d.modified_date = date('2026-11-12'), d.included_in_years = [], d.excluded_from_years = ['2025-2026'];

// ---------------------------------------------------------------------------
// NOTE 2 of 7 -- 1.4-pro-sfsu, documenting "SFBRN Impact Matrix"
// What the purchase gate can and cannot evaluate. S1, Daniel Fontaine's stated position,
// agreed with Amanda McGowan that charters are where locally built tools get reviewed.
// The impact matrix is the thing that sets the level of Section 508 evaluation, so a
// purchase it cannot rate is operational detail about it. It evidences 1.4-pro at all
// three campuses, this note's indicator among them.
// ---------------------------------------------------------------------------
MATCH (y:YearSuccessEvidence {year_identifier: '2025-2026-1.4-pro-sfsu'})
MATCH (m:MeetingMinutes {unique_id: '57f6acd02bbe45db9e1444a76051a3ac'})
MATCH (author:Person {unique_id: 'a1d223af-c7aa-466b-bf54-47f0a199696d'})
MATCH (impl:Process {unique_id: '7dfd71d849bf438eb81eff120b216ac4'})
MERGE (n:Note {name: 'purchase-gate-reaches-interfaces-nov-2026-yse:2025-2026-1.4-pro-sfsu-3f8a62d4'})
ON CREATE SET n.unique_id = replace(randomUUID(), '-', ''), n.include_in_report = true, n.date_created = date('2026-11-12')
SET n.content = "A purchase of API credits presents no interface to evaluate, so the depth of a Section 508 review cannot be set from the requisition alone. The only evidence available at the purchase gate is a vendor conformance report or one produced internally. Credits buy capacity, and what a campus team builds with that capacity is decided after the purchase closes. Review of a locally built tool therefore belongs to application maintenance and the team that runs it, under an owner outside the people who wrote it. Liability begins at the moment anyone other than the builder can reach the tool. Whether the tool uses artificial intelligence does not change the question, which is whether a person can operate the interface by keyboard, mouse or screen reader. Application development needs accessibility review on the same footing as security review."
MERGE (y)-[:has_note]->(n)
MERGE (m)-[:has_note]->(n)
MERGE (n)-[:created_by]->(author)
MERGE (impl)-[d:is_documented_by]->(n)
ON CREATE SET d.added_date = date('2026-11-12'), d.modified_date = date('2026-11-12'), d.included_in_years = [], d.excluded_from_years = ['2025-2026'];

// ---------------------------------------------------------------------------
// NOTE 3 of 7 -- 4.6-pro-ssu, indicator only, NO implementation
// The equivalent-access rule the group adopted for digital signage. S1, Amanda McGowan
// proposed it and Daniel Fontaine agreed. Product naming kept cautious; the minutes
// flag both Visix and "Lobo Vision" as unconfirmed readings.
// This is the one note with no implementation to document. SSU Accessible Procurement
// Guidance is the closest candidate and its published scope would cover signage, but it
// does not state this rule, and attaching the note to it would read as though it did.
// The rule is two days old and lives in no procedure yet.
// ---------------------------------------------------------------------------
MATCH (y:YearSuccessEvidence {year_identifier: '2025-2026-4.6-pro-ssu'})
MATCH (m:MeetingMinutes {unique_id: '57f6acd02bbe45db9e1444a76051a3ac'})
MATCH (author:Person {unique_id: 'a1d223af-c7aa-466b-bf54-47f0a199696d'})
MERGE (n:Note {name: 'signage-second-channel-rule-nov-2026-yse:2025-2026-4.6-pro-ssu-9c51d7a8'})
ON CREATE SET n.unique_id = replace(randomUUID(), '-', ''), n.include_in_report = true, n.date_created = date('2026-11-12')
SET n.content = "Equivalent access to campus digital signage at Sonoma State is delivered by publishing the same content elsewhere, rather than by remediating the screen. Anything posted to a signage screen must also appear in at least one other digital channel a student can read with their own assistive technology, such as email, social media or a web page. The screens post job fairs, events, clubs and courses, and some content plays as music or video. Content posted to the screens is sent to the Director of Marketing and Communications so that it also reaches social media. Signage is held to different standards than software, and earlier campus guidance set WCAG 2.1 level A for what appears on screen."
MERGE (y)-[:has_note]->(n)
MERGE (m)-[:has_note]->(n)
MERGE (n)-[:created_by]->(author);

// ---------------------------------------------------------------------------
// NOTE 4 of 7 -- 1.11-pro-csueb, documenting the CSUEB LTI gate
// Who holds Canvas learning tool review at CSU East Bay. S1, settled in the meeting:
// Jonathan Hale asked and Amanda McGowan and Daniel Fontaine agreed.
// WIRING MISMATCH, flagged for the user rather than fixed here: the LTI gate evidences
// nine CSU East Bay indicators and 1.11-pro-csueb is not among them, although it is the
// body holding review authority that 1.11-pro asks about. Adding an is_evidence_for edge
// is a larger claim than a note, so it is not made in this file.
// ---------------------------------------------------------------------------
MATCH (y:YearSuccessEvidence {year_identifier: '2025-2026-1.11-pro-csueb'})
MATCH (m:MeetingMinutes {unique_id: '57f6acd02bbe45db9e1444a76051a3ac'})
MATCH (author:Person {unique_id: 'a1d223af-c7aa-466b-bf54-47f0a199696d'})
MATCH (impl:Process {unique_id: '7f88a439-2b4c-4fe2-8816-0ce896418a7d'})
MERGE (n:Note {name: 'csueb-lti-review-single-owner-nov-2026-yse:2025-2026-1.11-pro-csueb-2d93f4b6'})
ON CREATE SET n.unique_id = replace(randomUUID(), '-', ''), n.include_in_report = true, n.date_created = date('2026-11-12')
SET n.content = "Responsibility for reviewing Canvas learning tools at CSU East Bay sits with one team. Requests to add a learning tools interoperability integration go to Jonathan Hale's team, which holds the accessibility review. The academic technology staff who submit those requests do not review them separately, which the group settled on 2026-11-12. Learning tools reach Canvas in growing numbers and almost none arrives with a vendor conformance report, so each one needs a review. Students and faculty both use them."
MERGE (y)-[:has_note]->(n)
MERGE (m)-[:has_note]->(n)
MERGE (n)-[:created_by]->(author)
MERGE (impl)-[d:is_documented_by]->(n)
ON CREATE SET d.added_date = date('2026-11-12'), d.modified_date = date('2026-11-12'), d.included_in_years = [], d.excluded_from_years = ['2025-2026'];

// ---------------------------------------------------------------------------
// NOTE 5 of 7 -- 7.11-ins-csueb, documenting the CSUEB barrier report form
// What a student meets today when a library resource is unusable, and the decision the
// group took against it. S1, Jonathan Hale described the practice.
// This note corrects the record: Recommendation f3611db4ebaf4175977ef6ac1d6e9c36 on this
// same indicator states the route as practice. Zach Oshri's team has had nothing through it.
// The barrier report form evidences 1.19-web-csueb and not this indicator. The crossing is
// deliberate: the fix the group discussed is to route library barriers through that same
// form, so the note belongs on the form and bears on the library indicator.
// ---------------------------------------------------------------------------
MATCH (y:YearSuccessEvidence {year_identifier: '2025-2026-7.11-ins-csueb'})
MATCH (m:MeetingMinutes {unique_id: '57f6acd02bbe45db9e1444a76051a3ac'})
MATCH (author:Person {unique_id: 'a1d223af-c7aa-466b-bf54-47f0a199696d'})
MATCH (impl:Service {unique_id: 'd46bab54020b440d856c460f6148d794'})
MERGE (n:Note {name: 'csueb-library-barrier-route-nov-2026-yse:2025-2026-7.11-ins-csueb-6e07c3f1'})
ON CREATE SET n.unique_id = replace(randomUUID(), '-', ''), n.include_in_report = true, n.date_created = date('2026-11-12')
SET n.content = "A student who cannot use a CSU East Bay library resource meets a referral rather than a repair. Front-line library staff triage the report and try fixes to the student's own device and operating system. When those fail, staff refer the student to accessibility services. Zach Oshri's team has received no requests through that pathway, and its role in the route has not been confirmed with the team. The library's own support process for inaccessible content is minimal. Routing a technology barrier to a disability services office treats a defect in a purchased product as an individual accommodation, and the group decided on 2026-11-12 that the alternate access plan covering these subscriptions will not do it. Remediation of a library technology barrier belongs with the team that can change the resource or press its vendor."
MERGE (y)-[:has_note]->(n)
MERGE (m)-[:has_note]->(n)
MERGE (n)-[:created_by]->(author)
MERGE (impl)-[d:is_documented_by]->(n)
ON CREATE SET d.added_date = date('2026-11-12'), d.modified_date = date('2026-11-12'), d.included_in_years = [], d.excluded_from_years = ['2025-2026'];

// ---------------------------------------------------------------------------
// NOTE 6 of 7 -- implementation note on "Canvas LTI vendors and P2P review status"
// (8fa315a3edae4d989f4cdc56e1e7f209), indicator 6.9-ins-csueb.
// RESURRECTED from the cut list. It was a weak indicator-level note about request
// counts. It is strong operational detail here, because this implementation IS a
// vendor-by-vendor count, and these figures change what its 28 unreviewed vendors mean.
// ---------------------------------------------------------------------------
MATCH (y:YearSuccessEvidence {year_identifier: '2025-2026-6.9-ins-csueb'})
MATCH (m:MeetingMinutes {unique_id: '57f6acd02bbe45db9e1444a76051a3ac'})
MATCH (author:Person {unique_id: 'a1d223af-c7aa-466b-bf54-47f0a199696d'})
MATCH (impl:Process {unique_id: '8fa315a3edae4d989f4cdc56e1e7f209'})
MERGE (n:Note {name: 'csueb-lti-review-only-backlog-nov-2026-yse:2025-2026-6.9-ins-csueb-4a7d82e5'})
ON CREATE SET n.unique_id = replace(randomUUID(), '-', ''), n.include_in_report = true, n.date_created = date('2026-11-12')
SET n.content = "The vendors this audit found without a purchasing record are now entering review as zero dollar requests. Zach Oshri has submitted about 14 of them and expects to onboard roughly 40 vendors in total. They are filed under Supplier Unknown, so a reviewer searching the purchasing system by vendor name finds nothing for them. Whether any of those vendors supplied accessibility documentation is being checked against Zach Oshri's own spreadsheet, against an understanding in the working group that none did."
MERGE (y)-[:has_note]->(n)
MERGE (m)-[:has_note]->(n)
MERGE (n)-[:created_by]->(author)
MERGE (impl)-[d:is_documented_by]->(n)
ON CREATE SET d.added_date = date('2026-11-12'), d.modified_date = date('2026-11-12'), d.included_in_years = [], d.excluded_from_years = ['2025-2026'];

// ---------------------------------------------------------------------------
// NOTE 7 of 7 -- implementation note on "SFBRN TAAP Authoring Process"
// (c665c9fb582b4cd0af1b8f753960a301), indicator 4.6-pro-csueb.
// NEW. A drafting rule for the authoring process, which is where it binds on future
// plans rather than only on the one plan being revised. The implementation evidences
// 4.6-pro at all three campuses, so the rule reaches the practice it governs.
// ---------------------------------------------------------------------------
MATCH (y:YearSuccessEvidence {year_identifier: '2025-2026-4.6-pro-csueb'})
MATCH (m:MeetingMinutes {unique_id: '57f6acd02bbe45db9e1444a76051a3ac'})
MATCH (author:Person {unique_id: 'a1d223af-c7aa-466b-bf54-47f0a199696d'})
MATCH (impl:Procedure {unique_id: 'c665c9fb582b4cd0af1b8f753960a301'})
MERGE (n:Note {name: 'taap-no-disability-services-referral-nov-2026-yse:2025-2026-4.6-pro-csueb-8f10b5c2'})
ON CREATE SET n.unique_id = replace(randomUUID(), '-', ''), n.include_in_report = true, n.date_created = date('2026-11-12')
SET n.content = "An alternate access plan does not discharge a technology barrier by sending the user to disability services. A plan written for the CSU East Bay library subscriptions put that referral in writing, and it was cancelled in the system on 2026-11-12 for revision. The revision names the team that remediates the barrier instead. A referral records who helps the individual, which is not the same as naming who fixes the product, and the six legal requirements for an equally effective alternative ask for the second."
MERGE (y)-[:has_note]->(n)
MERGE (m)-[:has_note]->(n)
MERGE (n)-[:created_by]->(author)
MERGE (impl)-[d:is_documented_by]->(n)
ON CREATE SET d.added_date = date('2026-11-12'), d.modified_date = date('2026-11-12'), d.included_in_years = [], d.excluded_from_years = ['2025-2026'];

// ---------------------------------------------------------------------------
// PLAN 1 of 3 -- no furthers_yse
// Amanda McGowan committed to the change (S2). Deliberately unwired: no procurement
// indicator reaches software the campus builds itself, and attaching it to 1.5-pro would
// misfile locally built software as a procurement.
// ---------------------------------------------------------------------------
MATCH (wgp:WorkingGroupPlan {plan_identifier: '2025-2026-ssu-pro'})
MATCH (ay:AcademicYear {name: '2025-2026'})
MERGE (p:Plan {description: "Every project charter covering an application built on campus states that the application requires an accessibility review before release. Amanda McGowan holds the charter template and owes the change. The charter for the AI chatbot work is missing the line item her other charters carry, and it is raised with the charter's author. Whether the reviewed items are then recorded through P2P or in a separate catalog of tested products is undecided. This is complete when the requirement appears in the template and in each open charter for a locally built application."})
ON CREATE SET p.unique_id = replace(randomUUID(), '-', ''), p.is_key_plan = false, p.is_campus_plan = false, p.abandoned = false
SET p.name = 'SSU: Add the accessibility review requirement to every project charter', p.plan_status = 'Not Started'
MERGE (wgp)-[:includes_plan]->(p)
MERGE (p)-[:in_academic_year]->(ay);

// ---------------------------------------------------------------------------
// PLAN 2 of 3 -- furthers 7.11-ins-csueb
// Amanda McGowan committed to seeking the approval (S2). Raphael is the approver and is
// named in prose rather than as a node; the minutes give no surname and he owns no work here.
// Filed under the CSUEB instructional materials plan to match its furthers_yse.
// ---------------------------------------------------------------------------
MATCH (wgp:WorkingGroupPlan {plan_identifier: '2025-2026-csueb-ins'})
MATCH (y:YearSuccessEvidence {year_identifier: '2025-2026-7.11-ins-csueb'})
MATCH (ay:AcademicYear {name: '2025-2026'})
MERGE (p:Plan {description: "Library staff report a technology barrier through the digital accessibility barrier ticket type that already exists, and the ticket reaches Zach Oshri's team for remediation. Amanda McGowan owes Raphael's approval to add the team to that feed, because the ticket type carries the SFBRN name. The library needs training on which ticket type to use. This is complete when a library barrier report reaches Zach Oshri's team as a ticket, with no referral to disability services in the path."})
ON CREATE SET p.unique_id = replace(randomUUID(), '-', ''), p.is_key_plan = false, p.is_campus_plan = false, p.abandoned = false
SET p.name = "CSUEB: Put Zach Oshri's team on the accessibility barrier ticket feed", p.plan_status = 'Not Started'
MERGE (wgp)-[:includes_plan]->(p)
MERGE (p)-[:furthers_yse]->(y)
MERGE (p)-[:in_academic_year]->(ay);

// ---------------------------------------------------------------------------
// PLAN 3 of 3 -- furthers 8.9-pro-csueb
// Jonathan Hale committed to the entries (S2) and starts once the library plan is signed.
// ---------------------------------------------------------------------------
MATCH (wgp:WorkingGroupPlan {plan_identifier: '2025-2026-csueb-pro'})
MATCH (y:YearSuccessEvidence {year_identifier: '2025-2026-8.9-pro-csueb'})
MATCH (ay:AcademicYear {name: '2025-2026'})
MERGE (p:Plan {description: "The time Jonathan Hale and Sara Marquez spend on ATI reviews at CSU East Bay is recorded as tickets. No catalog item exists for the work, so each one is entered as an other request with the alternate access plan form attached and the meeting documented. Jonathan Hale owes the entries and starts once the library plan is signed. This is complete when a count of completed reviews and their history can be pulled from the ticket system."})
ON CREATE SET p.unique_id = replace(randomUUID(), '-', ''), p.is_key_plan = false, p.is_campus_plan = false, p.abandoned = false
SET p.name = 'CSUEB: Record ATI review effort as SFBRN tickets', p.plan_status = 'Not Started'
MERGE (wgp)-[:includes_plan]->(p)
MERGE (p)-[:furthers_yse]->(y)
MERGE (p)-[:in_academic_year]->(ay);

// ---------------------------------------------------------------------------
// QUERY 1 of 4 -- 1.8-pro-sfsu
// S3. Jonathan Hale proposed it, Amanda McGowan deferred it, so she owes the answer.
// Anchored on the SFSU plan because P2P supplier records are shared across SFBRN.
// ---------------------------------------------------------------------------
MATCH (wgp:WorkingGroupPlan {plan_identifier: '2025-2026-sfsu-pro'})
MATCH (y:YearSuccessEvidence {year_identifier: '2025-2026-1.8-pro-sfsu'})
MATCH (raiser:Person {unique_id: 'c02326cffb814ed9b5b8d5a94d46de11'})
MATCH (owes:Person {unique_id: '538d0f04e2814aa8819bebad3f93325b'})
MERGE (q:Query {question: "Should supplier onboarding in P2P require current accessibility compliance documentation?"})
ON CREATE SET q.unique_id = replace(randomUUID(), '-', ''), q.status = 'open', q.category = 'policy_decision', q.date_raised = date('2026-11-12')
SET q.detail = "A supplier record in P2P carries no accessibility documentation requirement when the supplier is onboarded. Requiring one would put a current conformance report in front of a reviewer who searches for that supplier, before any requisition is written. Review-only requests are filed under Supplier Unknown today, which leaves a searching reviewer nothing to find. Amanda McGowan holds the decision and treated it as a later question."
MERGE (q)-[:raised_under_plan]->(wgp)
MERGE (q)-[:addresses_evidence]->(y)
MERGE (q)-[:query_raised_by]->(raiser)
MERGE (q)-[:answerable_by]->(owes);

// ---------------------------------------------------------------------------
// QUERY 2 of 4 -- 1.3-pro-sfsu
// S3. Daniel Fontaine raised it against his own tool; Amanda McGowan asked whether a
// ten-user rule could be codified. Both owe the answer.
// principle:audience-determines-governing-duty decided the Title I sentence: a product
// required for employment is governed by Title I's individual interactive process, which
// a Title II procurement review is not built to settle.
// ---------------------------------------------------------------------------
MATCH (wgp:WorkingGroupPlan {plan_identifier: '2025-2026-sfsu-pro'})
MATCH (y:YearSuccessEvidence {year_identifier: '2025-2026-1.3-pro-sfsu'})
MATCH (raiser:Person {unique_id: 'a1d223af-c7aa-466b-bf54-47f0a199696d'})
MATCH (owes1:Person {unique_id: '538d0f04e2814aa8819bebad3f93325b'})
MATCH (owes2:Person {unique_id: 'a1d223af-c7aa-466b-bf54-47f0a199696d'})
MERGE (q:Query {question: "Does a product with no accessibility evidence and few users get a formal risk-acceptance path, and where does the user cutoff sit?"})
ON CREATE SET q.unique_id = replace(randomUUID(), '-', ''), q.status = 'open', q.category = 'policy_decision', q.date_raised = date('2026-11-12')
SET q.detail = "A product that supplies no accessibility evidence raises its own impact rating, so the review returns a decision that it cannot be approved. A marginal conformance report has a bypass and an absent one does not. There is no path for a reviewer to approve such a product with the accepted risk recorded. Approving without evidence is operationally expedient and may not be legal, so the decision needs to be made explicitly and written down where it can be found later. A product required for employment is governed by Title I and its individual interactive process, which a Title II procurement review is not built to settle. Amanda McGowan asked whether the rule could be codified at ten users or fewer. Any cutoff is arbitrary at its boundary, and a model still needs a hard number the group agrees to keep to."
MERGE (q)-[:raised_under_plan]->(wgp)
MERGE (q)-[:addresses_evidence]->(y)
MERGE (q)-[:query_raised_by]->(raiser)
MERGE (q)-[:answerable_by]->(owes1)
MERGE (q)-[:answerable_by]->(owes2);

// ---------------------------------------------------------------------------
// QUERY 3 of 4 -- 1.9-pro-csueb
// S3. The CSUEB library asked it through Jonathan Hale and Sara Marquez, who led the
// review. Amanda McGowan and Daniel Fontaine owe the answer. The detail carries the
// repository difference that was cut as a note.
// ---------------------------------------------------------------------------
MATCH (wgp:WorkingGroupPlan {plan_identifier: '2025-2026-sfsu-pro'})
MATCH (y:YearSuccessEvidence {year_identifier: '2025-2026-1.9-pro-csueb'})
MATCH (raiser:Person {unique_id: 'c02326cffb814ed9b5b8d5a94d46de11'})
MATCH (owes1:Person {unique_id: '538d0f04e2814aa8819bebad3f93325b'})
MATCH (owes2:Person {unique_id: 'a1d223af-c7aa-466b-bf54-47f0a199696d'})
MERGE (q:Query {question: "Should each CSU East Bay library subscription get its own accessibility review, or does a blanket rule apply?"})
ON CREATE SET q.unique_id = replace(randomUUID(), '-', ''), q.status = 'open', q.category = 'policy_decision', q.date_raised = date('2026-11-12')
SET q.detail = "The CSU East Bay library database holds hundreds of subscriptions. Each subscription presents its own interface, which is the argument for reviewing each one. The library asked whether a blanket rule could cover them instead. The submissions name no master enabling agreements, and conformance reports were found for some titles and not for others. SF State's library subscriptions route through the Chancellor's Office central repository and CSU East Bay's do not, so the two campuses cannot answer this the same way."
MERGE (q)-[:raised_under_plan]->(wgp)
MERGE (q)-[:addresses_evidence]->(y)
MERGE (q)-[:query_raised_by]->(raiser)
MERGE (q)-[:answerable_by]->(owes1)
MERGE (q)-[:answerable_by]->(owes2);

// ---------------------------------------------------------------------------
// QUERY 4 of 4 -- 7.11-ins-csueb
// S3, and it exists because the graph holds both answers. Recommendation
// f3611db4ebaf4175977ef6ac1d6e9c36 on this indicator states the first route as practice.
// Daniel Fontaine read that route from his notes on 11/12 and also argued against it in
// the same discussion. The minutes record that the group did not resolve the difference,
// so this file files the question and takes no side.
// ---------------------------------------------------------------------------
MATCH (wgp:WorkingGroupPlan {plan_identifier: '2025-2026-sfsu-pro'})
MATCH (y:YearSuccessEvidence {year_identifier: '2025-2026-7.11-ins-csueb'})
MATCH (raiser:Person {unique_id: 'a1d223af-c7aa-466b-bf54-47f0a199696d'})
MATCH (owes1:Person {unique_id: 'a1d223af-c7aa-466b-bf54-47f0a199696d'})
MATCH (owes2:Person {unique_id: '538d0f04e2814aa8819bebad3f93325b'})
MERGE (q:Query {question: "How should a library technology barrier route at CSU East Bay?"})
ON CREATE SET q.unique_id = replace(randomUUID(), '-', ''), q.status = 'open', q.category = 'technical_clarification', q.date_raised = date('2026-11-12')
SET q.detail = "Two routes are on record and they disagree. One sends the barrier to accessibility services, which triages it and passes it to Zach Oshri's team. The other holds that a technology barrier must not reach a disability services office at all, because the defect sits in a purchased product rather than in the student's circumstances. The open recommendation on this indicator states the first route. Settling this fixes what the revised alternate access plan and the library's training can say."
MERGE (q)-[:raised_under_plan]->(wgp)
MERGE (q)-[:addresses_evidence]->(y)
MERGE (q)-[:query_raised_by]->(raiser)
MERGE (q)-[:answerable_by]->(owes1)
MERGE (q)-[:answerable_by]->(owes2);

// ---------------------------------------------------------------------------
// CONCERN -- 1.11-pro-sfsu
// S1, Amanda McGowan stated the visibility gap. A Concern and not a Query because nobody
// named who should own it, and not a Plan because nobody committed to closing it.
// Anchor caveat, raised with the user: 1.11-pro is about authority for the ICT PROCUREMENT
// process, and software a campus builds itself never enters procurement. It is the closest
// indicator that exists.
// ---------------------------------------------------------------------------
MATCH (y:YearSuccessEvidence {year_identifier: '2025-2026-1.11-pro-sfsu'})
MATCH (raiser:Person {unique_id: '538d0f04e2814aa8819bebad3f93325b'})
MERGE (y)-[:has_concern]->(c:Concern {concern: "No accessibility review reaches software built locally outside IT at SF State and CSU East Bay."})
ON CREATE SET c.unique_id = replace(randomUUID(), '-', ''), c.status = 'open', c.date_raised = date('2026-11-12')
SET c.detail = "The project office sees a project only when an ITS team member works on it. Sonoma State's academic technology team works through IT, so its projects are visible. The academic technology teams at SF State and CSU East Bay sit outside IT, so a tool either of them builds can be started and finished unseen. A project charter carries the accessibility review requirement, which closes the gap only where a charter is written. No office has been named to own review of the rest."
MERGE (c)-[:raised_by]->(raiser);

// ---------------------------------------------------------------------------
// SETTLE QUERY 7682f6ed139f473cbf6d910f7fab5565 -- 8.9-pro-sfsu
// "Can a report be pulled showing who processed which ATI reviews?"
// Jonathan Hale owed the answer and gave it in section 9. Plan 3 above is the committed
// work that changes the answer.
// ---------------------------------------------------------------------------
MATCH (q:Query {unique_id: '7682f6ed139f473cbf6d910f7fab5565'})
MATCH (settler:Person {unique_id: 'c02326cffb814ed9b5b8d5a94d46de11'})
SET q.status = 'settled',
    q.date_settled = date('2026-11-12'),
    q.answer = "Not today. CSU East Bay records no tickets for the ATI review time Jonathan Hale and Sara Marquez spend, so a report has nothing to count. Jonathan Hale will enter the work as SFBRN tickets under an other request until a catalog item exists, which will give both a count of completed reviews and their history."
MERGE (q)-[:query_settled_by]->(settler);

// ---------------------------------------------------------------------------
// STAMP THE SOURCE MINUTES
// ---------------------------------------------------------------------------
MATCH (m:MeetingMinutes {unique_id: '57f6acd02bbe45db9e1444a76051a3ac'})
SET m.ontology_ingested = true,
    m.ontology_ingest_date = date('2026-11-13'),
    m.ontology_ingest_note = "7 notes, 6 of them documenting an implementation (zero dollar review close-out on About ICT Purchases - VPAT, 1.5-pro-csueb; purchase gate scope on SFBRN Impact Matrix, 1.4-pro-sfsu; signage second channel, 4.6-pro-ssu, indicator only; LTI review owner on the CSUEB LTI gate, 1.11-pro-csueb; library barrier route on the CSUEB barrier report form, 7.11-ins-csueb; review-only vendor backlog on the Canvas LTI vendor audit, 6.9-ins-csueb; no-referral drafting rule on SFBRN TAAP Authoring Process, 4.6-pro-csueb). 3 plans (SSU charters, CSUEB barrier ticket feed, CSUEB review effort tickets), 4 queries (supplier onboarding documentation, risk acceptance with no evidence, library subscription review scope, library barrier routing conflict), 1 concern (no review of locally built software outside IT), 1 query settled (8.9-pro-sfsu review reporting, by Jonathan Hale). Per-requisition decisions, rubric and tool design feedback, and web working group recruiting not ingested.";
