// ===========================================================================
// CSUEB Accessibility Services site crawl -> graph
// Generated 2026-08-18 by /ontology-ingest
// ===========================================================================
//
// SOURCE
//   Web crawl of https://www.csueastbay.edu/accessibility/ and every in-section
//   link, plus the linked Assistive Technology office at /atso/.
//   23 pages retrieved 2026-08-18; 2 URLs returned HTTP 404 (see FIXES).
//   This is a WEBSITE source, not a meeting: there is no MeetingMinutes node to
//   anchor to and therefore NO ontology_ingested stamp at the end of this file.
//
// ANCHORS
//   Campus  csueb        Year 2025-2026 (reporting year)
//   Plans   2025-2026-csueb-ins / -pro / -web
//   Target YSEs, all verified present before writing:
//     2025-2026-4.5-ins-csueb   (Defined)
//     2025-2026-4.1-ins-csueb   (Established)
//     2025-2026-4.3-ins-csueb   (Established)
//     2025-2026-1.19-web-csueb  (Initiated)
//     2025-2026-6.8-web-csueb   (Defined)
//
// APPROVED MANIFEST (2026-08-18) — user decisions applied:
//   DROPPED  C4 Assistive Technology Office service
//   DROPPED  C5 ASL Interpreting & Real-Time Captioning service
//   DROPPED  DACC / ATI Committee governance modeling — nothing written
//   KNOCK-ON of those drops, applied per the peripheral-person rule:
//     - Person nodes NOT created: Casey Gielen (AT Coordinator), Rochelle
//       Thompson (Accessibility Services), Iris Gallardo (HR). Each was
//       load-bearing only for C4/C5/DACC; with those dropped they own no
//       modeled work. They remain identity-round questions for the Pamela
//       Baird interview guide (2026-08-18-csueb-disability-services-cop.md).
//     - Tool nodes NOT created: Kurzweil 3000, Read&Write, OrbitNote, ZoomText,
//       Fusion, Dragon Naturally Speaking, Natural Reader, Genio/Glean,
//       Livescribe, Messenger Pigeon. Their S1 use was the ATO service (C4).
//   DEFERRED Doug Ferguson — the 2024-25 committees page gives him the title
//     "Assistive Technology Coordinator" while the live /atso/ page gives that
//     title to Casey Gielen. Unresolved title conflict; no node created.
//
// MODELING NOTE — downloadable forms are Webpage, not Document
//   Document.hash is the unique index and is populated by the content-addressed
//   file-upload path (app/fs). We hold URLs, not file content, so fabricating a
//   hash would be wrong. The .docx/.pdf forms below are therefore Webpage nodes
//   keyed on their URL, which is what we actually verified.
//
// SUCCESS INDICATOR TEXT (quoted for the evidence-wiring rationale)
//   4.5-ins  "Develop a process that provides alternate media production staff
//             with timely access to instructional materials within the
//             university approved LMS and other platforms."
//   4.1-ins  "Develop a process to promote the posting of instructional
//             materials to the university approved LMS and other platforms."
//   4.3-ins  "Develop a process and document specific guidelines and procedures
//             for creating accessible course content hosted in the campus LMS."
//   1.19-web "Develop an application support process that includes published,
//             specific accessibility statement(s) and a method to both report
//             and address issues."
//   6.8-web  "Developed a process to ensure that campus members involved in
//             creating and/or maintaining digital content (web, web design,
//             documents, videos, audio, etc.) know who to contact for
//             compliance training, assistance, resources and support."
//
// NOT TOUCHED — deliberately
//   Service "Accessible Remediation (Accessibility Services)" is retired:true,
//   has no owner, and its only documentation is the dead forms-policies.html
//   URL, yet it still evidences 1.11-web, 1.12-web, 5.11-ins (Established) and
//   5.13-ins. The crawl shows the underlying services ARE live, so the node
//   looks retired in error — but whether to un-retire it or move its evidence
//   onto the new nodes below is an open question on the interview guide.
//   No statement in this file modifies it.
// ===========================================================================


// ---------------------------------------------------------------------------
// SECTION 1 — Data fixes found by the crawl
// ---------------------------------------------------------------------------

// FIX 1. Trailing encoded space breaks this link. No node holds the clean URL,
// so the SET cannot collide with the unique index on Webpage.url.
MATCH (w:Webpage {url: "https://csueb.tfaforms.net/4741763%20"})
SET w.url = "https://csueb.tfaforms.net/4741763",
    w.name = "Accessible Media Request Form - Fall Semester 2026";

// FIX 2. /accessibility/forms-policies.html returned HTTP 404 on 2026-08-18.
// Flagged rather than deleted: it is the only documentation on the retired
// Accessible Remediation service, and that node is out of scope here.
MATCH (w:Webpage {url: "https://www.csueastbay.edu/accessibility/forms-policies.html"})
SET w.no_longer_exists = true,
    w.description = "Verified HTTP 404 on 2026-08-18. Superseded by /accessibility/using-accommodations/policies-and-forms.html, created in this batch.";


// ---------------------------------------------------------------------------
// SECTION 2 — Webpages (MERGE on url, the unique index)
// ---------------------------------------------------------------------------

MERGE (w:Webpage {url: "https://csueb.tfaforms.net/4741762"})
ON CREATE SET w.unique_id = randomUUID(),
    w.name = "Accessible Media Request Form - Summer Session 2026",
    w.description = "Term-scoped student request form for textbooks and course materials in accessible formats. Companion to the Fall 2026 form.";

MERGE (w:Webpage {url: "https://docs.google.com/document/d/e/2PACX-1vTN9w-J-BbvzcFFKU6VC5PH9Vg6RLJ6D7idTrZwHE4EMkoudHfuQuRuuQ5-qA3zYJdWM8eObmksVzpp/pub"})
ON CREATE SET w.unique_id = randomUUID(),
    w.name = "CSUEB Accessible Media Policy (published)",
    w.description = "Published Accessibility Services policy governing provision of textbooks and course materials in accessible formats.";

MERGE (w:Webpage {url: "https://www.csueastbay.edu/accessibility/using-accommodations/policies-and-forms.html"})
ON CREATE SET w.unique_id = randomUUID(),
    w.name = "Accessibility Services Policies & Forms",
    w.description = "Live index of 13 published accommodation policies and 5 forms. Replaces the dead /accessibility/forms-policies.html. Includes the Accessible Media policy and the term accessible-media request forms.";

MERGE (w:Webpage {url: "https://www.csueastbay.edu/accessibility/using-accommodations/accommodations/index.html"})
ON CREATE SET w.unique_id = randomUUID(),
    w.name = "Accommodations index - Accessibility Services",
    w.description = "Student-facing index of accommodation types, including Accessible Media.";

MERGE (w:Webpage {url: "https://www.csueastbay.edu/accessibility/reporting-on-campus-inaccessibility.html"})
ON CREATE SET w.unique_id = randomUUID(),
    w.name = "Report of On-Campus Inaccessibility - public instructions",
    w.description = "Published instructions for reporting an accessibility barrier: the ServiceNow catalog form, or a downloadable Word/PDF form emailed to as@csueastbay.edu. Reports route to Accessibility Services. Names inaccessible websites and non-captioned video among reportable issues.";

MERGE (w:Webpage {url: "https://www.csueastbay.edu/accessibility/files/docs/forms/report-of-on-campus-inaccessibility.docx"})
ON CREATE SET w.unique_id = randomUUID(),
    w.name = "Report of On-Campus Inaccessibility form (Word)",
    w.description = "Downloadable offline alternative to the ServiceNow catalog form.";

MERGE (w:Webpage {url: "https://www.csueastbay.edu/accessibility/files/docs/forms/report-of-on-campus-inaccessibility1.pdf"})
ON CREATE SET w.unique_id = randomUUID(),
    w.name = "Report of On-Campus Inaccessibility form (PDF)",
    w.description = "Downloadable offline alternative to the ServiceNow catalog form.";

MERGE (w:Webpage {url: "https://www.csueastbay.edu/accessibility/faculty-resources/how-to-make-your-course-accessible.html"})
ON CREATE SET w.unique_id = randomUUID(),
    w.name = "Course Accessibility & Timeline - faculty guidance",
    w.description = "Published faculty guidance carrying the campus accessibility calendar: textbook adoption deadlines of mid-March for summer and fall and mid-October for winter and spring; a stated 4-6 week remediation lead time; a priority-registration phase for students needing interpreting, real-time captioning or accessible textbooks; one week notice for accessible testing; syllabus statement expectations; captioning guidance; and LMS steps for extended exam time.";

MERGE (w:Webpage {url: "https://www.csueastbay.edu/online/faculty-support-services/accessibility-compliance-for-digital-teaching-learning.html"})
ON CREATE SET w.unique_id = randomUUID(),
    w.name = "Accessibility Compliance for Digital Teaching & Learning - course checklist (Online Campus)",
    w.description = "The live Online Campus course checklist that Accessibility Services faculty FAQs point faculty to. Distinct from the /ati/ instructional-materials page already on this implementation.";

MERGE (w:Webpage {url: "https://sfbrn.service-now.com/esc?id=sc_cat_item&table=sc_cat_item&sys_id=772c07ee2b9fc10083b281afe8da152d"})
ON CREATE SET w.unique_id = randomUUID(),
    w.name = "Instructional video captioning request - ServiceNow catalog item",
    w.description = "Faculty intake route for captioning of instructional media, published on the Course Accessibility & Timeline page. Distinct catalog item from the accessibility barrier report.";

MERGE (w:Webpage {url: "https://www.csueastbay.edu/accessibility/complaint-resolution1/index.html"})
ON CREATE SET w.unique_id = randomUUID(),
    w.name = "Complaint Resolution - Accessibility Services",
    w.description = "Entry point for disability access complaints. Two pathways, informal and formal; complainants may go straight to the formal process.";

MERGE (w:Webpage {url: "https://www.csueastbay.edu/accessibility/complaint-resolution1/informal-complaint-resolution.html"})
ON CREATE SET w.unique_id = randomUUID(),
    w.name = "Informal Complaint Resolution and Appeals",
    w.description = "Informal pathway handled directly by Accessibility Services, including accommodation appeals.";

MERGE (w:Webpage {url: "https://www.csueastbay.edu/accessibility/complaint-resolution1/formal-complaint-resolution.html"})
ON CREATE SET w.unique_id = randomUUID(),
    w.name = "Formal Complaint Resolution",
    w.description = "Formal pathway, available as an alternative or an escalation from the informal process.";

MERGE (w:Webpage {url: "https://www.csueastbay.edu/accessibility/complaint-resolution1/rights-responsibilities-and-resources.html"})
ON CREATE SET w.unique_id = randomUUID(),
    w.name = "Rights, Responsibilities and Resources",
    w.description = "Published statement of student and university rights and responsibilities underpinning the complaint pathways.";

MERGE (w:Webpage {url: "https://www.csueastbay.edu/accessibility/files/docs/forms/accommodation-appeal-form.pdf"})
ON CREATE SET w.unique_id = randomUUID(),
    w.name = "Accommodation Appeal Form (PDF)",
    w.description = "Form used when a requested accommodation is denied. The Accessibility Services Director addresses the grievance; formal options remain available afterwards.";


// ---------------------------------------------------------------------------
// SECTION 3 — Attach new documentation to EXISTING implementations
// ---------------------------------------------------------------------------

// Alt Media Request & Fulfillment Automation (Process, Zach Oshri) — the ITS
// pipeline. Gains the second term form and the governing published policy.
MATCH (i:Process {title: "Alt Media Request & Fulfillment Automation"})
MATCH (w:Webpage {url: "https://csueb.tfaforms.net/4741762"})
MERGE (i)-[r:is_documented_by]->(w)
ON CREATE SET r.added_date = date("2026-08-18");

MATCH (i:Process {title: "Alt Media Request & Fulfillment Automation"})
MATCH (w:Webpage {url: "https://docs.google.com/document/d/e/2PACX-1vTN9w-J-BbvzcFFKU6VC5PH9Vg6RLJ6D7idTrZwHE4EMkoudHfuQuRuuQ5-qA3zYJdWM8eObmksVzpp/pub"})
MERGE (i)-[r:is_documented_by]->(w)
ON CREATE SET r.added_date = date("2026-08-18");

// Report of On-Campus Inaccessibility (Service, Pamela Baird) — gains the
// public instructions page and both downloadable offline forms.
MATCH (i:Service {title: "Report of On-Campus Inaccessibility (barrier report form)"})
MATCH (w:Webpage {url: "https://www.csueastbay.edu/accessibility/reporting-on-campus-inaccessibility.html"})
MERGE (i)-[r:is_documented_by]->(w)
ON CREATE SET r.added_date = date("2026-08-18");

MATCH (i:Service {title: "Report of On-Campus Inaccessibility (barrier report form)"})
MATCH (w:Webpage {url: "https://www.csueastbay.edu/accessibility/files/docs/forms/report-of-on-campus-inaccessibility.docx"})
MERGE (i)-[r:is_documented_by]->(w)
ON CREATE SET r.added_date = date("2026-08-18");

MATCH (i:Service {title: "Report of On-Campus Inaccessibility (barrier report form)"})
MATCH (w:Webpage {url: "https://www.csueastbay.edu/accessibility/files/docs/forms/report-of-on-campus-inaccessibility1.pdf"})
MERGE (i)-[r:is_documented_by]->(w)
ON CREATE SET r.added_date = date("2026-08-18");

// Accessibility Compliance for Digital Teaching & Learning (Guidance) — gains
// the live Online Campus checklist faculty are actually directed to.
MATCH (i:Guidance {title: "Accessibility Compliance for Digital Teaching & Learning"})
MATCH (w:Webpage {url: "https://www.csueastbay.edu/online/faculty-support-services/accessibility-compliance-for-digital-teaching-learning.html"})
MERGE (i)-[r:is_documented_by]->(w)
ON CREATE SET r.added_date = date("2026-08-18");

// Media Captioning & Prioritization Guidance (Guidance) — gains the faculty
// ServiceNow intake route for instructional video captioning.
MATCH (i:Guidance {title: "Media Captioning & Prioritization Guidance"})
MATCH (w:Webpage {url: "https://sfbrn.service-now.com/esc?id=sc_cat_item&table=sc_cat_item&sys_id=772c07ee2b9fc10083b281afe8da152d"})
MERGE (i)-[r:is_documented_by]->(w)
ON CREATE SET r.added_date = date("2026-08-18");


// ---------------------------------------------------------------------------
// SECTION 4 — C1: Accessible Media Production (Accessibility Services)
// Service. S1: term request forms are live now (Fall 2026 / Summer 2026), a
// dedicated alternate.media@csueastbay.edu mailbox is published, the policy is
// published, and the process is described in operating detail. This is the
// student intake and eligibility half that Zach Oshri's 2026-08-12 annotation
// assigns to Pamela Baird's office; 4.5-ins previously carried only his ITS
// automation.
// ---------------------------------------------------------------------------

MERGE (s:Service {title: "Accessible Media Production (Accessibility Services)"})
ON CREATE SET s.unique_id = randomUUID(),
    s.retired = false,
    s.description = "The Accessibility Services side of alternate media at CSU East Bay: student eligibility, intake, and instructor liaison, as published on the Accessibility Services site in August 2026. Two request categories are offered, textbooks in accessible formats and non-textbook course materials in accessible formats (handouts, presentations, articles, syllabi). Students must be enrolled to submit, and requests are made on a term-scoped form (Fall 2026 and Summer 2026 forms are separately published). After a request is filed the Accessible Media team verifies the student's courses and contacts the instructors directly for access to materials, and corresponds with the student by campus email. Textbooks are not released until proof of purchase is verified. A dedicated mailbox, alternate.media@csueastbay.edu, is published as the contact. Eligibility is established upstream through the Accessibility Services Welcome Meeting. Distinct from the ITS-owned Alt Media Request & Fulfillment Automation process, which is the production pipeline this intake feeds.";

MATCH (s:Service {title: "Accessible Media Production (Accessibility Services)"})
MATCH (p:Person {name: "Pamela Baird"})
MERGE (s)-[:owned_by]->(p);

MATCH (s:Service {title: "Accessible Media Production (Accessibility Services)"})
MATCH (c:CommunityOfPractice {name: "Disability Services"})
MERGE (s)-[:accountable_community]->(c);

MATCH (s:Service {title: "Accessible Media Production (Accessibility Services)"})
MATCH (w:Webpage {url: "https://www.csueastbay.edu/accessibility/using-accommodations/accommodations/accessible-media.html"})
MERGE (s)-[r:is_documented_by]->(w)
ON CREATE SET r.added_date = date("2026-08-18");

MATCH (s:Service {title: "Accessible Media Production (Accessibility Services)"})
MATCH (w:Webpage {url: "https://www.csueastbay.edu/accessibility/using-accommodations/policies-and-forms.html"})
MERGE (s)-[r:is_documented_by]->(w)
ON CREATE SET r.added_date = date("2026-08-18");

MATCH (s:Service {title: "Accessible Media Production (Accessibility Services)"})
MATCH (w:Webpage {url: "https://www.csueastbay.edu/accessibility/using-accommodations/accommodations/index.html"})
MERGE (s)-[r:is_documented_by]->(w)
ON CREATE SET r.added_date = date("2026-08-18");

// 4.5-ins: the indicator is about alternate media production staff getting
// timely access to instructional materials. This service is the mechanism by
// which that access is requested from instructors. Strength 2 (partial): it
// addresses the intake and instructor-liaison half, not LMS role definitions.
MATCH (s:Service {title: "Accessible Media Production (Accessibility Services)"})
MATCH (y:YearSuccessEvidence {year_identifier: "2025-2026-4.5-ins-csueb"})
MERGE (s)-[r:is_evidence_for]->(y)
ON CREATE SET r.strength = 2, r.control = "internal";


// ---------------------------------------------------------------------------
// SECTION 5 — C2: Course Accessibility & Timeline (Accessibility Services)
// Guidance. S1: published, current faculty guidance carrying hard campus
// deadlines. This is the most consequential find of the crawl — it is standing
// published evidence for the 4.5-ins companion-guide bar "Access is granted
// early enough to support review and remediation", which the March 2026 note
// still attached to that YSE asserts does not exist.
// Owner deliberately unset: the page is Accessibility Services material but no
// maintainer is named on it. Confirm in the Baird interview.
// ---------------------------------------------------------------------------

MERGE (g:Guidance {title: "Course Accessibility & Timeline (Accessibility Services)"})
ON CREATE SET g.unique_id = randomUUID(),
    g.retired = false,
    g.description = "Published Accessibility Services guidance to faculty setting out the campus accessibility calendar and faculty obligations across the term, as published in August 2026. Textbook adoption deadlines are stated as mid-March for summer and fall and mid-October for winter and spring, with the reason given explicitly: remediating a textbook takes 4-6 weeks depending on the book, the publisher, and its starting accessibility, and late adoption results in requests that faculty be flexible on assignment, quiz and exam dates. The term is described in phases. During priority registration, students whose accommodations need lead time (sign language interpreting, real-time captioning, accessible textbooks and materials) register first and are told to submit requests promptly. During regular registration the remaining students submit course notes and accessible furniture requests. A classroom scheduling phase handles relocation for physical barriers through Academic Resources and Planning. From the first day, faculty are expected to carry a syllabus statement inviting accommodation discussions, and Agreement Accommodations require a meeting between student, instructor and accessibility counselor. During the term, accommodations are not retroactive and accessible testing requires one week notice. Faculty responsibilities are enumerated: publish textbook lists early, use a microphone, leave accessible furniture in place, respond promptly to the Accessible Testing Office. Online delivery guidance covers step-by-step extended exam time in the LMS, the limits of automatic captioning for Deaf and hard-of-hearing students, and a ServiceNow route for requesting captioning of instructional video.";

MATCH (g:Guidance {title: "Course Accessibility & Timeline (Accessibility Services)"})
MATCH (c:CommunityOfPractice {name: "Disability Services"})
MERGE (g)-[:accountable_community]->(c);

MATCH (g:Guidance {title: "Course Accessibility & Timeline (Accessibility Services)"})
MATCH (w:Webpage {url: "https://www.csueastbay.edu/accessibility/faculty-resources/how-to-make-your-course-accessible.html"})
MERGE (g)-[r:is_documented_by]->(w)
ON CREATE SET r.added_date = date("2026-08-18");

// 4.5-ins: the published adoption deadlines and the stated 4-6 week lead time
// are the campus's mechanism for giving alternate media staff timely access.
// Strength 2 (partial): it sets the timing expectation but does not itself
// grant LMS access.
MATCH (g:Guidance {title: "Course Accessibility & Timeline (Accessibility Services)"})
MATCH (y:YearSuccessEvidence {year_identifier: "2025-2026-4.5-ins-csueb"})
MERGE (g)-[r:is_evidence_for]->(y)
ON CREATE SET r.strength = 2, r.control = "internal";

// 4.3-ins: "document specific guidelines and procedures for creating accessible
// course content hosted in the campus LMS" — the online-delivery section covers
// LMS exam configuration, captioning limits and accessible material selection.
MATCH (g:Guidance {title: "Course Accessibility & Timeline (Accessibility Services)"})
MATCH (y:YearSuccessEvidence {year_identifier: "2025-2026-4.3-ins-csueb"})
MERGE (g)-[r:is_evidence_for]->(y)
ON CREATE SET r.strength = 2, r.control = "internal";

// 4.1-ins: "promote the posting of instructional materials to the LMS" — the
// guidance pushes early textbook adoption and early publication of reading
// lists. Strength 1 (indirect support): promotion is a side effect of the
// accommodation timeline, not the page's purpose.
MATCH (g:Guidance {title: "Course Accessibility & Timeline (Accessibility Services)"})
MATCH (y:YearSuccessEvidence {year_identifier: "2025-2026-4.1-ins-csueb"})
MERGE (g)-[r:is_evidence_for]->(y)
ON CREATE SET r.strength = 1, r.control = "internal";


// ---------------------------------------------------------------------------
// SECTION 6 — C3: Complaint Resolution (Accessibility Services)
// Service. S1: both pathways are published with a live appeal form.
// 1.19-web asks for a method to both REPORT and ADDRESS issues. The barrier
// report form already on the graph is the report half; this is the address
// half, which had no node.
// ---------------------------------------------------------------------------

MERGE (s:Service {title: "Complaint Resolution (Accessibility Services)"})
ON CREATE SET s.unique_id = randomUUID(),
    s.retired = false,
    s.description = "The published CSU East Bay pathway for resolving complaints of inaccessibility, disability discrimination, retaliation, or denied accommodation, as published in August 2026. Two routes are offered and a complainant may use either at any time: informal resolution, handled directly by Accessibility Services and covering accommodation appeals through a published Accommodation Appeal Form addressed by the Accessibility Services Director; and formal resolution, available as an alternative or an escalation, with onward reporting options through the campus Civil Rights and Title IX office. A published Rights, Responsibilities and Resources statement sets out the standing on both sides. This is the resolution counterpart to the Report of On-Campus Inaccessibility intake service.";

MATCH (s:Service {title: "Complaint Resolution (Accessibility Services)"})
MATCH (p:Person {name: "Pamela Baird"})
MERGE (s)-[:owned_by]->(p);

MATCH (s:Service {title: "Complaint Resolution (Accessibility Services)"})
MATCH (c:CommunityOfPractice {name: "Disability Services"})
MERGE (s)-[:accountable_community]->(c);

MATCH (s:Service {title: "Complaint Resolution (Accessibility Services)"})
MATCH (w:Webpage {url: "https://www.csueastbay.edu/accessibility/complaint-resolution1/index.html"})
MERGE (s)-[r:is_documented_by]->(w)
ON CREATE SET r.added_date = date("2026-08-18");

MATCH (s:Service {title: "Complaint Resolution (Accessibility Services)"})
MATCH (w:Webpage {url: "https://www.csueastbay.edu/accessibility/complaint-resolution1/informal-complaint-resolution.html"})
MERGE (s)-[r:is_documented_by]->(w)
ON CREATE SET r.added_date = date("2026-08-18");

MATCH (s:Service {title: "Complaint Resolution (Accessibility Services)"})
MATCH (w:Webpage {url: "https://www.csueastbay.edu/accessibility/complaint-resolution1/formal-complaint-resolution.html"})
MERGE (s)-[r:is_documented_by]->(w)
ON CREATE SET r.added_date = date("2026-08-18");

MATCH (s:Service {title: "Complaint Resolution (Accessibility Services)"})
MATCH (w:Webpage {url: "https://www.csueastbay.edu/accessibility/complaint-resolution1/rights-responsibilities-and-resources.html"})
MERGE (s)-[r:is_documented_by]->(w)
ON CREATE SET r.added_date = date("2026-08-18");

MATCH (s:Service {title: "Complaint Resolution (Accessibility Services)"})
MATCH (w:Webpage {url: "https://www.csueastbay.edu/accessibility/files/docs/forms/accommodation-appeal-form.pdf"})
MERGE (s)-[r:is_documented_by]->(w)
ON CREATE SET r.added_date = date("2026-08-18");

// 1.19-web: supplies the "address issues" half of the indicator.
// Strength 2 (partial): it addresses resolution, not the published
// application-specific accessibility statements the indicator also requires.
MATCH (s:Service {title: "Complaint Resolution (Accessibility Services)"})
MATCH (y:YearSuccessEvidence {year_identifier: "2025-2026-1.19-web-csueb"})
MERGE (s)-[r:is_evidence_for]->(y)
ON CREATE SET r.strength = 2, r.control = "internal";

// 6.8-web: "know who to contact for compliance training, assistance, resources
// and support" — the pathway publishes named routes and a contact of record.
// Strength 1 (indirect support): it is a complaint route, not a support desk.
MATCH (s:Service {title: "Complaint Resolution (Accessibility Services)"})
MATCH (y:YearSuccessEvidence {year_identifier: "2025-2026-6.8-web-csueb"})
MERGE (s)-[r:is_evidence_for]->(y)
ON CREATE SET r.strength = 1, r.control = "internal";


// ---------------------------------------------------------------------------
// SECTION 7 — Notes
// ---------------------------------------------------------------------------

// N1 on 4.5-ins. Records the published-evidence finding against the stale
// March 2026 note on the same YSE, and the office split as each side publishes
// it. include_in_report = true: this is reportable substance.
MERGE (n:Note {name: "csueb-alt-media-published-intake-aug-2026-yse:2025-2026-4.5-ins-csueb-4f1c7a92"})
ON CREATE SET n.unique_id = randomUUID(),
    n.date_created = date("2026-08-18"),
    n.include_in_report = true,
    n.content = "Site crawl of csueastbay.edu/accessibility on 2026-08-18 found the alternate media chain published end to end, which bears directly on the older note on this indicator. That note, carried forward from March 2026, states there is no formal process and that alternate media staff reach out to faculty reactively. The published record now shows otherwise on the timing question: faculty guidance states textbook adoption deadlines of mid-March for summer and fall and mid-October for winter and spring, gives the reason as a 4-6 week remediation lead time, and places students needing accessible textbooks in a priority registration phase so requests arrive early. Intake is term-scoped and live, with separate published request forms for Fall 2026 and Summer 2026, a dedicated alternate.media@csueastbay.edu mailbox, a published Accessible Media policy, and a stated workflow in which the team verifies enrolment and contacts instructors for materials, holding textbooks until proof of purchase. The office split is also published on both sides and matches Zach Oshri's 2026-08-12 annotation: Accessibility Services runs eligibility and intake, and the Accessibility Services faculty FAQ names ITS Accessible Media as the party that requests remediation of course materials. What the crawl did NOT find, and what the companion guide for this indicator still asks for, are documented LMS role definitions and permission levels for alternate media staff, and any record of access actually granted before instruction begins. Whether the published timeline is honoured in practice is a question for the stakeholder interview, not something the website can settle.";

MATCH (n:Note {name: "csueb-alt-media-published-intake-aug-2026-yse:2025-2026-4.5-ins-csueb-4f1c7a92"})
MATCH (p:Person {name: "Daniel Fontaine"})
MERGE (n)-[:created_by]->(p);

MATCH (y:YearSuccessEvidence {year_identifier: "2025-2026-4.5-ins-csueb"})
MATCH (n:Note {name: "csueb-alt-media-published-intake-aug-2026-yse:2025-2026-4.5-ins-csueb-4f1c7a92"})
MERGE (y)-[:has_note]->(n);

// N2 on 1.19-web. Records the scope gap the crawl confirms: the indicator and
// its companion guide want application-specific statements; the campus has one
// campus-wide statement. include_in_report = false: this is a review finding.
MERGE (n:Note {name: "csueb-accessibility-statement-scope-aug-2026-yse:2025-2026-1.19-web-csueb-9d3e5b17"})
ON CREATE SET n.unique_id = randomUUID(),
    n.date_created = date("2026-08-18"),
    n.include_in_report = false,
    n.content = "Site crawl of csueastbay.edu/accessibility on 2026-08-18 clarifies where this indicator stands. The report-and-address machinery is real and now fully documented in the graph: a ServiceNow catalog form with downloadable Word and PDF alternatives, published instructions naming inaccessible websites and non-captioned video among reportable issues, routing to Accessibility Services, and a two-track complaint resolution pathway with an accommodation appeal form addressed by the Accessibility Services Director. The unmet half is the statement itself. This indicator asks for published, SPECIFIC accessibility statements, and its companion guide is explicit that Established requires an application-specific statement whenever a third-party product with known barriers is adopted, each naming the vendor, the barriers, the known workarounds and a support contact, with the collection maintained and available to campus. The crawl found exactly one campus-wide statement, on the ATI site, and no product-level statement anywhere. No collection exists to maintain. This is the gap to close before the indicator can move, and it is a smaller lift than it looks: the LTI accessibility review gate already produces the vendor conformance findings a per-product statement would carry.";

MATCH (n:Note {name: "csueb-accessibility-statement-scope-aug-2026-yse:2025-2026-1.19-web-csueb-9d3e5b17"})
MATCH (p:Person {name: "Daniel Fontaine"})
MERGE (n)-[:created_by]->(p);

MATCH (y:YearSuccessEvidence {year_identifier: "2025-2026-1.19-web-csueb"})
MATCH (n:Note {name: "csueb-accessibility-statement-scope-aug-2026-yse:2025-2026-1.19-web-csueb-9d3e5b17"})
MERGE (y)-[:has_note]->(n);
