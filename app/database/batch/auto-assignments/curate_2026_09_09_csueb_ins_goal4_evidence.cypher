// =====================================================================================
// Rectify pass: CSU East Bay, Instructional Materials Goal 4, 2025-2026.
// Run 2026-09-09 by Daniel Fontaine. YSE mode: missing is_evidence_for links.
//
// SCOPE
//   Goal 4 (ins): "The campus has implemented a comprehensive plan to ensure the
//   timely adoption of instructional materials, including courses with late-hire
//   faculty or adjunct faculty." Four indicators, four CSUEB YSEs for 2025-2026:
//     4.1-ins  Established  post instructional materials to the approved LMS
//     4.11-ins Initiated    review accessibility of faculty-maintained sites and apps
//     4.3-ins  Established  guidelines and procedures for accessible LMS course content
//     4.5-ins  Defined      alt media staff get timely access to LMS materials
//
// SEARCHES RUN
//   1. Cross-campus peer  - what SFSU and SSU wire to the same four keys in 2025-2026.
//      4.11-ins has NO evidence at any campus, so that search returned nothing for it.
//   2. Sibling indicator  - the 40 live CSUEB implementations evidencing anything in
//      2025-2026, read for goal-4 subject matter.
//   3. Subject match      - descriptions decomposed against each indicator's verbs.
//   4. Orphans            - 4 live implementations with no evidence link anywhere.
//
// STRENGTH IS CAPPED BY WHAT BACKS THE WORK
//   A rating of 3 says the work directly and completely addresses the indicator, and
//   an undocumented practice cannot carry that claim however good the practice is.
//   The LTI Accessibility Review and Approval Gate is the clearest subject match in
//   this file and is rated 2, not 3, because the graph holds one page behind it and
//   that page carries no captured text. Raise it once the process is written down.
//   ScreenSteps Faculty Guides is the only 3 here; it carries eight live pages and
//   every one of them has captured text.
//
// NO RATIONALES ARE SET BY THIS FILE
//   is_evidence_for.rationale states how a piece of work answers a specific indicator.
//   That argument is written by a person at final review, not by the pass that proposes
//   the link, because a machine-written reason reads as settled and would be graded as
//   evidence by the next maturity review. Every link below lands with strength and
//   control only, and the reasoning that produced it is in the section comments here.
//
// WHAT THIS PASS DELIBERATELY DID NOT DO
//   - Canvas Studio Professional Captioning (Verbit) was proposed on 4.3-ins and
//     WITHDRAWN. It is SFSU work. Both its owners hold sfsu.edu addresses and implement
//     only SFSU evidence. It reached a CSUEB proposal through the orphan search, which
//     ran WITHOUT a campus filter: an orphan has no evidence link, so it has no campus
//     anchor either, and subject fit was allowed to stand in for one. Any future orphan
//     search must establish a candidate's campus from its owners or its documentation
//     before proposing it anywhere, because an orphan is exactly the case where the
//     graph will not catch the mistake for you.
//   - PopeTech Web Accessibility Scanning was proposed on 4.11-ins and WITHDRAWN. The
//     proposal read "campus-affiliated websites" in the node description as covering
//     faculty-maintained sites on the campus domain. Nothing states that. No scan
//     report, no page and no note in the graph says faculty sites are in the scan
//     scope, so the link asserted coverage the sources do not support. Scope inferred
//     from a generic phrase is not evidence. If faculty sites are in fact scanned, the
//     thing to add is the scan report that shows it, and the link follows from that.
//   - 21-22 CIC 44 (LMS Opening Timeline) is a plausible 4.5 candidate by title, since
//     when a Canvas shell opens governs when alt media staff can see its materials. The
//     node carries no description and no documentation, so it can only be read from its
//     title, and nothing is proposed. Capture its text, then revisit.
//   - Equalify Reflow and the Accessible Course Materials Remediation Form were caught
//     by the 4.3 subject search and rejected. Both remediate files after they exist.
//     4.3 covers creating accessible content. They stay on 5.13 / 6.4 / 6.8.
//   - The Textbook Adoption Monitoring Platform was caught by the 4.1 search and
//     rejected there. Messaging faculty about adoptions is not posting materials to
//     the LMS. It is proposed on 4.5 instead, in section 4.1 below.
//   - "Accessible Document Training" is an orphan Guidance with no owner and one page.
//     It concerns document formats rather than LMS course content. Reported, not wired.
//     The fix there is naming an owner, not guessing an indicator.
//   - One InternalPolicy node exists with no title at all. Reported for repair.
//   - No accountable_community, accountable_working_group or status_is edge is touched.
//
// EFFECT ON THE 4.3 MATURITY REVIEW OF 2026-09-09
//   That review found no documented operational process for checking LMS course
//   content. Sections 3.1 and 3.5 show the campus does run one, on UDOIT and on
//   automatic Verbit activation, and that it was wired to 6.7 / 6.8 / 5.11 rather than
//   to 4.3. That is missing wiring, not missing practice, and the review's second
//   recommendation narrows accordingly once this file runs.
// =====================================================================================


// -------------------------------------------------------------------------------------
// 1. 4.1-ins  Develop a process to promote the posting of instructional materials
//             to the university approved LMS and other platforms.
//
//    Peers: SFSU wires "LMS Promotional Materials", SSU wires "Accessible Canvas
//    Template". CSUEB wires four Senate policies and one Accessibility Services page,
//    and nothing that helps a faculty member put a course into Canvas.
// -------------------------------------------------------------------------------------

// 1.1  ScreenSteps Faculty Guides -> 4.1-ins   strength 3, internal
//      The Canvas for Faculty manual is the campus instruction set for putting a
//      course into the LMS: preparing a first Canvas course, adding a syllabus,
//      building the layout with modules, connecting external tools. Eight live pages,
//      all with captured text, maintained by the Online Campus.
MATCH (i:Guidance {unique_id: "5bdfb2fe90d0419cb1359ff2de48edae"})
MATCH (y:YearSuccessEvidence {year_identifier: "2025-2026-4.1-ins-csueb"})
MERGE (i)-[r:is_evidence_for]->(y)
ON CREATE SET r.strength = 3, r.control = "internal";

// 1.2  Annual Back to the Bay Workshops -> 4.1-ins   strength 2, internal
//      The annual faculty development event held before fall instruction begins,
//      sponsored in part by the Office of the Online Campus, with Canvas sessions on
//      its schedule. Promotion delivered in person where the guide library does it in
//      writing. Partial because it is an event rather than a standing process.
MATCH (i:Guidance {unique_id: "b94c1cd15fff4659a2ae6bbcecca54e5"})
MATCH (y:YearSuccessEvidence {year_identifier: "2025-2026-4.1-ins-csueb"})
MERGE (i)-[r:is_evidence_for]->(y)
ON CREATE SET r.strength = 2, r.control = "internal";


// -------------------------------------------------------------------------------------
// 2. 4.11-ins Developed a process to review the accessibility of faculty-maintained
//             websites or web applications, whether hosted on the campus domain or
//             elsewhere.
//
//    This YSE has ZERO evidence and sits at Initiated. No campus wires anything to
//    4.11-ins in 2025-2026, so there is no peer to copy. Everything below is a subject
//    match against work CSUEB already runs.
// -------------------------------------------------------------------------------------

// 2.1  LTI Accessibility Review and Approval Gate -> 4.11-ins   strength 2, internal
//      An LTI integration is a web application hosted elsewhere that a faculty member
//      asks to use in their course, and this process reviews each one before it
//      reaches Canvas. Two staff obtain conformance documentation from the vendor, the
//      Online Campus lead reviews it and completes an ICT questionnaire, and an
//      integration that fails does not go into Canvas.
//      Rated 2 rather than 3 on documentation, not on subject fit: the process has one
//      page behind it and that page carries no captured text. Nothing in the graph lets
//      a reader check the steps above. Write the process down and this becomes a 3.
MATCH (i:Process {unique_id: "7f88a439-2b4c-4fe2-8816-0ce896418a7d"})
MATCH (y:YearSuccessEvidence {year_identifier: "2025-2026-4.11-ins-csueb"})
MERGE (i)-[r:is_evidence_for]->(y)
ON CREATE SET r.strength = 2, r.control = "internal";

// 2.2  WITHDRAWN. PopeTech Web Accessibility Scanning was proposed here at strength 2
//      and rejected on review. See the PopeTech entry under WHAT THIS PASS DELIBERATELY
//      DID NOT DO. The link was created by the first execution of this file on
//      2026-09-09 and removed the same day. Do not re-propose it without evidence that
//      faculty-maintained sites are in the scan scope.

// 2.3  24-25 CIC 47 -> 4.11-ins   strength 2, internal
//      The Web Based Content section requires instructors to have any third party
//      platform or product used in their course reviewed and approved through the ICT
//      review process annually, and to develop equitable alternatives where a product
//      is inaccessible. Partial because it mandates the review without describing how
//      one is conducted.
MATCH (i:InternalPolicy {unique_id: "410a57b968544b37a8c3ca2441f7925b"})
MATCH (y:YearSuccessEvidence {year_identifier: "2025-2026-4.11-ins-csueb"})
MERGE (i)-[r:is_evidence_for]->(y)
ON CREATE SET r.strength = 2, r.control = "internal";

// 2.4  About ICT Purchases - VPAT -> 4.11-ins   strength 1, internal
//      Requests submitted through the ICT Review Request route automatically for
//      Section 508 conformance review, which is the path a faculty-requested web
//      application travels. Indirect: the page describes the procurement route rather
//      than a review of faculty-maintained sites, and the course-side gate is 2.1.
//      The most cuttable link in this file.
MATCH (i:Guidance {unique_id: "86d96d17d43d44cd84c0c637265abd23"})
MATCH (y:YearSuccessEvidence {year_identifier: "2025-2026-4.11-ins-csueb"})
MERGE (i)-[r:is_evidence_for]->(y)
ON CREATE SET r.strength = 1, r.control = "internal";


// -------------------------------------------------------------------------------------
// 3. 4.3-ins  Develop a process and document specific guidelines and procedures for
//             creating accessible course content hosted in the campus LMS.
//
//    Four live items already wired. The gap is the operational half: the campus runs
//    checking and captioning work on Canvas content and wired it to other indicators.
// -------------------------------------------------------------------------------------

// 3.1  UDOIT Course Accessibility Scanning & Bulk Remediation -> 4.3-ins   strength 2, internal
//      The operating process behind checking Canvas course content: a faculty intake
//      form, two delivery modes, a student assistant working in the live course or on
//      files pulled out and pushed back, progress tracked as a file-count percentage.
//      The ScreenSteps UDOIT guide tells faculty how to run the scan; this is what
//      happens when they cannot fix what it finds. Partial because it answers the
//      process half and not the documented-guidelines half, and because its primary
//      home is the remediation indicators 6.7 and 6.8.
MATCH (i:Process {unique_id: "f3528420ca4e4fa58690aed414fc8607"})
MATCH (y:YearSuccessEvidence {year_identifier: "2025-2026-4.3-ins-csueb"})
MERGE (i)-[r:is_evidence_for]->(y)
ON CREATE SET r.strength = 2, r.control = "internal";

// 3.2  Accessibility Compliance for Digital Teaching & Learning -> 4.3-ins   strength 2, internal
//      Published campus guidance that from 24 April 2026 web content and digital course
//      materials must be accessible under the DOJ ADA Title II rule. Four live pages,
//      all with captured text. Partial because it establishes the obligation rather
//      than the procedure for meeting it.
MATCH (i:Guidance {unique_id: "71f8b7e0653149e1b1ccc7d3411fc9c6"})
MATCH (y:YearSuccessEvidence {year_identifier: "2025-2026-4.3-ins-csueb"})
MERGE (i)-[r:is_evidence_for]->(y)
ON CREATE SET r.strength = 2, r.control = "internal";

// 3.3  Media Captioning & Prioritization Guidance -> 4.3-ins   strength 2, internal
//      Documented guidelines for one class of course content: video with audio requires
//      accurate synchronized captions at WCAG 2.1 Level AA, audio-only content requires
//      a full-text transcript, auto-generated captions must be corrected before use.
//      Carries a prioritization framework and routes course content to Accessibility
//      Services or the Online Campus. Partial because it covers media, not a course.
MATCH (i:Guidance {unique_id: "f6df870190d64e2089f6c985c46f5d1d"})
MATCH (y:YearSuccessEvidence {year_identifier: "2025-2026-4.3-ins-csueb"})
MERGE (i)-[r:is_evidence_for]->(y)
ON CREATE SET r.strength = 2, r.control = "internal";

// 3.4  WITHDRAWN. Canvas Studio Professional Captioning (Verbit) was proposed here at
//      strength 2 and is SFSU work, not East Bay work. See the entry under WHAT THIS
//      PASS DELIBERATELY DID NOT DO. The link was created by the first execution of
//      this file on 2026-09-09 and removed the same day. Never wire it to a csueb YSE.

// 3.5  Automated Verbit Captioning Activation -> 4.3-ins   strength 2, internal
//      A nightly service that sets the captioning provider on every new Canvas course
//      shell and its Panopto folder without staff intervention, so faculty take no
//      action to have course video captioned. Makes a class of LMS course content
//      accessible by default. Partial because it covers video, and because it is
//      infrastructure rather than a documented guideline faculty read.
MATCH (i:Process {unique_id: "9329b070-13bd-4f42-97cf-71f1ccc04b6a"})
MATCH (y:YearSuccessEvidence {year_identifier: "2025-2026-4.3-ins-csueb"})
MERGE (i)-[r:is_evidence_for]->(y)
ON CREATE SET r.strength = 2, r.control = "internal";


// -------------------------------------------------------------------------------------
// 4. 4.5-ins  Develop a process that provides alternate media production staff with
//             timely access to instructional materials within the university approved
//             LMS and other platforms.
//
//    Three live items already wired. The gap is upstream: the adoption machinery that
//    makes timely access possible is wired to goal 1 and not to 4.5.
// -------------------------------------------------------------------------------------

// 4.1  CSUEB Textbook Adoption Monitoring Platform -> 4.5-ins   strength 2, internal
//      The Alt Media Request and Fulfillment Automation already wired here describes
//      adoption data flowing nightly from Follett through this platform before it syncs
//      into the alt media system, so this is the upstream half of the same pipeline.
//      Partial because its own purpose is affordability and library coverage, with alt
//      media timeliness a consequence.
MATCH (i:Process {unique_id: "7fef8b4080ee49b5a43eac7f7bdd7a46"})
MATCH (y:YearSuccessEvidence {year_identifier: "2025-2026-4.5-ins-csueb"})
MERGE (i)-[r:is_evidence_for]->(y)
ON CREATE SET r.strength = 2, r.control = "internal";

// 4.2  Policy on Timely Adoption to Assure Accessibility and Affordability of Textbooks
//      -> 4.5-ins   strength 2, internal
//      Requires all faculty to submit textbook, course reader and course material
//      requests to the University Bookstore by a due date Academic Affairs sets in
//      consultation with Accessibility Services. Consulting the alt media unit on the
//      deadline is what makes access timely rather than incidental. Partial because it
//      governs the bookstore route and is silent on materials that reach students only
//      through Canvas.
MATCH (i:InternalPolicy {unique_id: "667e1005aa96485fb4c4fda5418720bb"})
MATCH (y:YearSuccessEvidence {year_identifier: "2025-2026-4.5-ins-csueb"})
MERGE (i)-[r:is_evidence_for]->(y)
ON CREATE SET r.strength = 2, r.control = "internal";

// 4.3  24-25 CIC 47 -> 4.5-ins   strength 2, internal
//      States that Accessible Media requires significant capacity and lead time,
//      requires scanned material to be submitted for remediation no later than the
//      textbook adoption deadline, and bars unremediated material from use in a course.
//      Sets the deadline that gives alt media staff their working window. Partial
//      because it fixes the deadline without describing how staff obtain the materials.
MATCH (i:InternalPolicy {unique_id: "410a57b968544b37a8c3ca2441f7925b"})
MATCH (y:YearSuccessEvidence {year_identifier: "2025-2026-4.5-ins-csueb"})
MERGE (i)-[r:is_evidence_for]->(y)
ON CREATE SET r.strength = 2, r.control = "internal";

// 4.4  Textbook Adoption Internal Tracking -> 4.5-ins   strength 1, internal
//      Records who in each department is the contact for textbook adoptions. When an
//      adoption is missing or late, that record is how alt media staff find the person
//      who can settle it. Indirect: it supports timely access without delivering it.
MATCH (i:Process {unique_id: "0a11fa46959a44429c32105d0fa3de7e"})
MATCH (y:YearSuccessEvidence {year_identifier: "2025-2026-4.5-ins-csueb"})
MERGE (i)-[r:is_evidence_for]->(y)
ON CREATE SET r.strength = 1, r.control = "internal";
