// =====================================================================================
// Full sweep: implementation descriptions, duplicates, and documentation links
// 2026-09-03. Curation pass, not an ingest. No new source material.
//
// WHY
//   Applies the rule added to .claude/skills/ontology-ingest/SKILL.md under
//   "Writing implementation descriptions": a description is a standing definition of
//   what the work IS, in two or three sentences, carrying no attestation, no origin
//   story, no correction narrative and no single-year instance detail.
//
//   Swept all 142 implementation nodes across the three campuses. 24 carried
//   descriptions longer than three sentences. All 24 are rewritten here.
//
// WHERE THE REMOVED CONTENT GOES
//   - Process nodes have a `process_markdown` field. Step-by-step workflow detail
//     belongs there, not in the description and not in a Note. Six Process nodes get
//     their pipeline detail moved into it.
//   - Substantive programme detail on non-Process nodes goes to a Note on a
//     current-year YSE the implementation evidences.
//   - Provenance, attestation, our own grading arguments and verification flags go to
//     a Note with include_in_report = false. These are working records, not evidence.
//   - Nothing is deleted outright.
//
// SECTIONS
//   1. Process nodes: description rewrite + process_markdown
//   2. Non-Process nodes: description rewrite
//   3. Preservation notes
//   4. Duplicate removal
//   5. Documentation links found in source text
// =====================================================================================


// -------------------------------------------------------------------------------------
// 1. PROCESS NODES - description rewritten, workflow moved to process_markdown
// -------------------------------------------------------------------------------------

MATCH (i {unique_id: "d8ccc3a8-2899-46b4-bd5a-be9480587bcc"})
SET i.description = "How the J. Paul Leonard Library at SF State receives and routes reports of content a user cannot access. Intake is deliberately general rather than accessibility-specific, through an Ask a Librarian chat button on every page that opens on its own after about a minute of inactivity, and a report-a-problem link on individual OneSearch records. Requests are triaged to one of four outcomes: resolved directly, referred to the DPRC for an accommodation, met by producing an accessible format, or escalated to the vendor.",
    i.process_markdown = "## Intake\n\nDeliberately general rather than accessibility-specific. Every page of the Library website carries an Ask a Librarian chat button, and if a visitor stays on a page for about a minute without interacting the chat window opens on its own. Individual OneSearch records additionally carry a link for reporting a problem with that item, which gives a second point-of-use route. The design intent is that a user never has to classify their own problem as an accessibility issue, and never has to know the name of a particular contact.\n\n## Staffing and platform\n\nThe chat runs 24 hours a day. SF State staff cover part of the rotation and librarians at other institutions cover the remainder, because the underlying service is shared. A question submitted overnight is logged and picked up when staff come online rather than answered immediately. The service runs on Springshare, which also provides the Library scheduling, calendaring and statistics tools, and which is procured centrally through the Chancellor's Office rather than locally.\n\n## Triage\n\nRequests are monitored by many Library faculty and staff and routed to one of four outcomes: resolved directly, referred to the DPRC for an accommodation, met by producing an accessible format such as printing or locating an OCRed PDF, or escalated to the vendor. Vendor escalations go to the Electronic Resources team, who open a ticket with the vendor directly. DPRC referrals have no dedicated routing path and go to a general DPRC email address, through the chat, or in person at a service desk.\n\n## Turnaround and volume\n\nThere is no fixed service level for vendor escalations. Resolution time depends on the vendor, of which the Library holds contracts with hundreds, and larger vendors tend to respond faster. Vendors generally treat accessibility issues as a priority to act on, and the team follows up when a ticket sits unresolved. Accessibility-related requests are rare in absolute terms.";

MATCH (i {unique_id: "ed35a02d17454d769537feb28f196751"})
SET i.description = "AI-driven document remediation platform integrated into Canvas via LTI 1.3 and hosted at accessibility-checker.csueastbay.edu. Watched course files are scrubbed of personally identifiable information, OCR-extracted, then passed through AI semantic inference for heading levels, alt text, table structure and mathematical content, with output landing as Markdown that converts to HTML, audio, translations, Braille, tagged PDF or a Canvas page. Faculty edit the generated output side by side, and nothing is visible to students until explicitly published through the LTI tool.",
    i.process_markdown = "## Pipeline, per watched course file\n\n1. PII scrub (emails, social security numbers and similar) before any processing.\n2. OCR text extraction via IBM open-source Docling, base text only.\n3. AI semantic inference for heading levels, alt text for figures, table structure, and mathematics and chemistry handling.\n4. Output as Markdown, a deliberate intermediate that converts cleanly to HTML with maths rendering, MP3 audio, translations, Braille, tagged PDF, or the primary faculty-facing target, a Canvas page with structure intact.\n\n## Properties\n\nCourse-copy safe: remediation is an overlay keyed to file presence in the shell, so processed state travels with copies and files are not reprocessed.\n\nFaculty edit the generated output side by side, including alt text. Nothing reaches students until explicitly published through the LTI tool.\n\n## Scale and cost\n\nOver 400,000 PDFs processed at roughly 90 percent first-pass accuracy, with scores not directly comparable across content types, validated with low-vision users navigating the output. Cost is under 0.20 dollars per document against roughly 70,000 to 80,000 dollars a year for 14 student assistants. Portability was tested with Qwen via OpenRouter at hundredths of a cent per document. Self-hosted open models are the end state, pending GPU infrastructure East Bay does not yet have. The current single dedicated server halves throughput, at 8 to 10 minutes for a 15-page document against 2 to 3 expected on cluster infrastructure.";

MATCH (i {unique_id: "f3528420ca4e4fa58690aed414fc8607"})
SET i.description = "End-to-end Canvas course-file remediation at CSU East Bay, entered through a faculty intake form and delivered in two service modes: direct designer access, where a student assistant is added to the live course and remediates in place, and download-based remediation, where files are pulled out, remediated externally and pushed back. The UDOITOrchestrator browser extension closes UDOIT's bulk gap by scanning a course, pulling only flagged files through the Canvas API into a ZIP with a manifest mapping each file to its original location, and pushing remediated files back. Working storage is SharePoint, with one original and finished folder pair per faculty member and progress tracked as a file-count percentage.",
    i.process_markdown = "## Intake\n\nFaculty submit a Microsoft Form giving name, email, department, up to five courses, term and priority.\n\n## Service modes\n\nDirect designer access, where a student assistant is added to the live course and remediates in place, or download-based remediation, where files are pulled out, remediated externally and pushed back. The team is deliberately shifting work toward download-based.\n\n## The UDOITOrchestrator extension\n\nPublic, v2.4.0, AGPL-3.0. Scans a course via UDOIT (Cidi Labs hosted), pulls only flagged files through the Canvas API into a ZIP with a manifest mapping each file back to its original location, supports batch runs across sub-accounts at roughly 200 courses in about an hour with an optional fresh UDOIT scan per run, and pushes remediated files back into Canvas in seconds with overwrite and optional rescan verification.\n\n## Working storage and remediation\n\nSharePoint, one original and finished folder pair per faculty member. Original-folder edit access is cut off two weeks after creation, and later additions go through the request queue. Student assistants remediate with ABBYY FineReader first for tag structure, then manual confirmation in Adobe Acrobat, with Word, PowerPoint and Excel compliance checked separately. Progress is tracked as a finished-to-original file-count percentage in a colour-coded spreadsheet, and a 1:1 match auto-emails the faculty member to review the finished folder. Re-upload runs through the extension.\n\n## Coverage\n\nEvolved from pure opt-in to opt-in plus proactive UDOIT-report outreach to flagged courses. The same workflow serves instructional-materials remediation and East Bay Alt Media services.";

MATCH (i {unique_id: "7fef8b4080ee49b5a43eac7f7bdd7a46"})
SET i.description = "A platform that combines textbook adoption data with library holdings to show what students are already covered for. A nightly Follett feed supplies adoption data by ISBN, which is cross-referenced against the library Alma system through its API to return Primo links for titles the library already holds online, producing a coverage percentage and an approximate figure for what that coverage saves students. Titles not held at all surface as purchase suggestions, and the platform sends faculty a direct Canvas message carrying the exact link needed to complete an adoption.",
    i.process_markdown = "## Data flow\n\nA nightly data feed from Follett supplies adoption data by ISBN. Those ISBNs are cross-referenced against the library Alma system through Alma's API, which returns Primo links to the library's own holding for each title where one exists online.\n\n## Outputs\n\n- An approximate dollar figure for what library coverage saves students, and a coverage percentage. Recommended materials are tracked separately and excluded from that figure.\n- Titles not held at all, surfaced as purchase suggestions so the library can act without further research.\n- A separate view breaking licensing usage down by fiscal year and department, to inform upgrade and downgrade decisions.\n- A direct Canvas message to faculty containing the exact link needed to complete a textbook adoption, which submits to Follett and returns to the platform, closing the loop without staff chasing adoptions manually.";

MATCH (i {unique_id: "5b1a33b0-1170-43d0-8f44-f9ac9dba3920"})
SET i.description = "CTET-run remediation of live Canvas courses at Sonoma State, staffed by the student remediation team. Courses are selected by UDOIT batch score sorted against enrolment, each course gets a ServiceNow ticket, and a student works major-to-minor issues in a Canvas designer role without gradebook access. Content is remediated but never changed: spelling and content issues are reported to the instructor rather than fixed.",
    i.process_markdown = "## Course selection\n\nUDOIT batch scores sorted against enrolment, giving accessibility-score prioritisation, in the Cidi Labs course listing.\n\n## Ticket and work\n\nEach course gets a ServiceNow ticket with a standardised subject line. A student assigns it to themselves, captures a before UDOIT screenshot, and works major-to-minor issues in a Canvas designer role with no gradebook access.\n\n## Faculty communication\n\nCanned emails at each step. Kickoff states what will happen and how, names the student doing the work, and offers an opt-out. Closure gives the final UDOIT score, forward-use guidance to import the remediated course rather than an old sandbox, and student-authored improvement notes, such as unused files flagged via UFIXIT and format suggestions like Pages over documents and Panopto over YouTube.\n\n## Boundaries\n\nContent is remediated, never changed. Spelling and content issues are reported to the instructor, not fixed.\n\n## Record and closure\n\nA running log of course, instructor, term, student and UDOIT before and after scores is the programme record. UDOIT is re-run on completion, the designer role is removed, and the ticket is closed.";

MATCH (i {unique_id: "9329b070-13bd-4f42-97cf-71f1ccc04b6a"})
SET i.description = "A Python service that activates Verbit captioning on every new Canvas course shell at CSU East Bay without staff intervention. It scrapes the campus Canvas provisioning tables for course IDs and instructor associations, drives a headless browser into the course shell and its Panopto folder, completes the OAuth handshake, and sets the captioning provider through Panopto's own API. It runs nightly as a watchdog, so any shell that appears is configured in the background and faculty take no action.",
    i.process_markdown = "## Why it exists\n\nPanopto offers no site-wide setting to force all folders to a given captioning provider, and East Bay was told this will not be enabled at the platform level. The service is the workaround, replacing a per-course manual toggle that became unsustainable under caption-request volume.\n\n## Steps\n\n1. Scrape East Bay Canvas provisioning tables to obtain course IDs and instructor associations.\n2. Drive a headless browser into the course shell and its Panopto folder.\n3. Complete the OAuth handshake.\n4. Set the captioning provider through Panopto's API.\n\nRuns nightly as a watchdog. Panopto maintains the connection to Verbit, so the automation touches only the Canvas and Panopto side. Scripts and process documentation are public.";

MATCH (i {unique_id: "7f88a439-2b4c-4fe2-8816-0ce896418a7d"})
SET i.description = "How CSU East Bay reviews learning tools interoperability integrations that faculty request, before they can enter Canvas. Two staff independently approach the vendor for conformance documentation, the Online Campus lead reviews the conformance report and completes an ICT questionnaire, and a Business Operations Specialist enters the completed questionnaire into P2P for procurement processing. The gate is hard: an integration that fails the accessibility checks does not go into Canvas at all.",
    i.process_markdown = "## Steps\n\n1. A faculty request for an LTI integration arrives.\n2. Two staff independently approach the vendor for conformance documentation.\n3. The Online Campus lead reviews the conformance report and completes an ICT questionnaire.\n4. A Business Operations Specialist enters the completed questionnaire into P2P for procurement processing.\n\n## The gate\n\nHard rather than advisory. An integration that fails East Bay accessibility checks does not go into Canvas at all.";


// -------------------------------------------------------------------------------------
// 2. NON-PROCESS NODES - description rewritten
// -------------------------------------------------------------------------------------

MATCH (i {unique_id: "68c788ad-e912-47d2-b558-492a936b4958"})
SET i.description = "The Accessibility Services side of alternate media at CSU East Bay, covering student eligibility, request intake and instructor liaison. A student meets with Disability Services to establish that accessible materials are a reasonable accommodation before being shown the request form, which the student submits themselves on term-scoped forms for textbooks and for non-textbook course materials. After a request is filed the Accessible Media team verifies the student's courses and contacts instructors directly for access to materials, with textbooks released only once proof of purchase is verified.";

MATCH (i {unique_id: "8550dd14-54a2-4e5f-8a34-185867067b24"})
SET i.description = "Published Accessibility Services guidance to CSU East Bay faculty, setting out the campus accessibility calendar and faculty obligations across the term. Textbook adoption deadlines are mid-March for summer and fall and mid-October for winter and spring, on the stated basis that remediating a textbook takes four to six weeks depending on the book, the publisher and its starting accessibility. The guidance describes the term in phases from priority registration onward, enumerates faculty responsibilities, and covers online delivery topics including extended exam time, the limits of automatic captioning, and the route for requesting captioning of instructional video.";

MATCH (i {unique_id: "3c2b3f404fea4fd7b22bd5b90e8fd368"})
SET i.description = "The faculty-facing course remediation programme at Sonoma State, run by the Center for Teaching and Educational Technology. CTET identifies content requiring remediation, obtains the instructor's consent, remediates the content to Universal Design for Learning standards and federal accessibility regulations, and notifies the instructor when the work is complete. It is the programme a faculty member joins, and is distinct from Canvas Course Remediation, which is the internal method behind it.";

MATCH (i {unique_id: "ba5b4154887840ff95942dce230ccb20"})
SET i.description = "A five-session accessibility workshop series delivered by the CSU East Bay Office of Faculty Development across AY 2024-25, published on its Programs page and framed around the April 2026 ADA Title II deadline. Sessions covered meeting accessibility standards in hybrid and online classes using Canvas, the basics and principles of Universal Design for Learning, a faculty panel on accessibility, and accessible technology selection and purchasing.";

MATCH (i {unique_id: "6d71107d0f0d410199999a222dcb2528"})
SET i.description = "CEETL's faculty certificate programme at SF State, focused on culturally responsive and historically aware teaching, with disability justice as a core evidence-based component alongside gender and racial justice and Universal Design for Learning framed as its practical classroom implementation. The series has three parts: two asynchronous online courses with discussion forums, Slice 1 A New Hope and Slice 2 Do or Do Not, each earning a badge, followed by a JEDI Teaching Square. Slice 1 is required first, both courses are prerequisites for the Teaching Square, and all three together earn the certificate.";

MATCH (i {unique_id: "10d0dc3477a14e3ca2a228f17308c8e4"})
SET i.description = "The final component of CEETL's JEDI PIE certificate series at SF State, and the collaborative faculty-to-faculty half of it. Two squares run per year, a Fall UDL 3.0 Teaching Square and a Spring TILT Teaching Square, each open to the first 20 participants with a stipend available for 10 hours of learning. Completion of both asynchronous Slice courses is a prerequisite, participants may enrol in only one square, and the Fall square is where faculty apply Universal Design for Learning 3.0 collaboratively to their own teaching.";

MATCH (i {unique_id: "77c3cc2b8b414006ab988243af0719cc"})
SET i.description = "The Accessible Technology Initiative is the California State University systemwide effort to ensure that information and communication technology is accessible to students, employees and the public. It supports compliance with the Americans with Disabilities Act, Section 504 and Section 508 of the Rehabilitation Act, California Government Code 11135, Executive Order 1111, and CSU policy. Its three focus areas are web accessibility, instructional materials, and ICT procurement, applying universal design for broad accessibility.";

MATCH (i {unique_id: "920ca455e3f3432990c5709e2c4638ce"})
SET i.description = "Published Sonoma State guidance for captioning and media accessibility. All SSU-produced time-based media requires WCAG 2.1 AA compliant closed captioning, audio-only content requires text alternatives, live events require synchronized captions, and automated captions must be manually reviewed and corrected. A companion style guide sets caption content rules, white-on-black sans-serif presentation, character and line limits, maximum reading speed, and sound and speaker notation.";

MATCH (i {unique_id: "b84b0f46b2f64332b67abd5014efe725"})
SET i.description = "CSU East Bay's published web accessibility guidance, targeting WCAG 2.1 Level AA across all technology products used to deliver academic programs and services, student services, information technology services, and auxiliary programs and services. It publishes a quick-start checklist for web editors and developers covering unique page titles, heading structure, alternate text, skip links, captions and transcripts, keyboard accessibility, meaningful markup, and colour and styling. Evaluation guidance is organised around the four WCAG principles, with recommended testing methods including keyboard navigation, screen reader spot-checks and automated checkers.";

MATCH (i {unique_id: "07f3c381-f209-4ee6-9117-792b054f0a37"})
SET i.description = "The published CSU East Bay pathway for resolving complaints of inaccessibility, disability discrimination, retaliation, or denied accommodation. Two routes are offered and a complainant may use either at any time: informal resolution, handled directly by Accessibility Services and covering accommodation appeals through a published form addressed by the Accessibility Services Director, and formal resolution, available as an alternative or an escalation, with onward reporting options through the campus Civil Rights and Title IX office. This is the resolution counterpart to the Report of On-Campus Inaccessibility intake service.";

MATCH (i {unique_id: "61a432eed0524761924555edcce79884"})
SET i.description = "A dashboard that pulls UDOIT reports nightly and produces a department-level accessibility scorecard, showing how each department is trending week over week. Where the scorecard flags a department performing badly, the Online Campus lead contacts that department directly to work on making their instructional materials more accessible. The evaluation runs without a manual trigger, and the outreach that follows it is an established practice rather than an ad hoc response.";

MATCH (i {unique_id: "1e36c9aaae434f2594aef65c2c3e4cd9"})
SET i.description = "Sonoma State's published accessible procurement guidance, scoped to web applications, hardware, software, telecommunications, multimedia, copiers, kiosks and similar under Section 508, Government Code 11135 and Executive Order 926. Accessibility is evaluated from the earliest stages of procurement: purchase requests enter through CSUBuy P2P, IT reviews information security and accessibility, VPATs and ACRs are examined for WCAG 2.1 alignment, and procurements are risk-classified by user scope. Equally Effective Alternative Access Plans are developed where barriers exist, and documents route for signature before purchase.";

MATCH (i {unique_id: "50e075e9146a47c7b75f9bec239e34ea"})
SET i.description = "How the Accessible Technology Initiative is organised at Sonoma State. The ATI Committee meets monthly under a Presidential mandate and covers the three priority areas of web, procurement and instructional materials, while the ATI Ambassador Program places a faculty representative in each school with monthly strategy meetings. Supporting staffing spans Universal Access support in IT, bookstore coordination for timely textbook ordering, DSS alternate-format production, and CTET training and remediation, with published role-based guidance for faculty, staff and students.";

MATCH (i {unique_id: "35047370-8694-40a6-8e99-f145e46dbd6b"})
SET i.description = "Rollout of DesignPLUS at SF State, a Cidi Labs product and sister to UDOIT, reflecting the same interplay between accessibility detection and remediation. DesignPLUS builds accessibility in at the template level and detects problems as content is entered, automating the Canvas course content portion of remediation for faculty who adopt it. Adoption requires faculty to rebuild their courses into DesignPLUS templates, which makes this a multi-year phased rollout.";

MATCH (i {unique_id: "524d5b0402e1472382b61517574e1c50"})
SET i.description = "CEETL's onboarding programme for incoming faculty at SF State. Every new faculty member goes through a Universal Design session as part of the orientation. The digital accessibility portion is delivered separately by instructional designers from Academic Technology rather than by CEETL, and the DPRC participates in the orientation.";

MATCH (i {unique_id: "52f6ef49-27c7-47d6-8719-5f8805b98107"})
SET i.description = "The student remediation team at Sonoma State's Center for Teaching and Educational Technology, roughly six to seven students with funding stepped up to two concurrent full-day positions. Two lead students run the UDOIT scores, build the ServiceNow tickets and send the kickoff emails with before screenshots, and the rest remediate. During term the same students also cover classroom technology duties such as audio and projectors, and onboarding runs through the Canvas remediation manual with daily check-ins and QA double-checks by the programme lead.";

MATCH (i {unique_id: "6fd87a06-0341-49cb-bd17-a508489e0e13"})
SET i.description = "Student remediators at Sonoma State make course PDFs accessible using Equidox and Adobe Acrobat Professional, preserving content as authored rather than converting it to Canvas pages unless it is unusable. Reading order and OCR are verified with built-in read-aloud tools and manual numbering of reading order, with JAWS used for spot screen-reader checks. Scanned government PDFs are first searched for an existing readable version online.";


// -------------------------------------------------------------------------------------
// 3. PRESERVATION NOTES
//
// Everything removed from a description that was not moved into process_markdown.
// include_in_report = false where the content is provenance, attestation, our own
// grading argument, or a verification flag: working records rather than evidence.
// -------------------------------------------------------------------------------------

MATCH (y:YearSuccessEvidence {year_identifier: "2025-2026-7.11-ins-sfsu"})
MATCH (dan:Person {name: "Daniel Fontaine"})
MERGE (n:Note {name: "sfsu-library-intake-gaps-sep-2026-yse:2025-2026-7.11-ins-sfsu-a71c3e08"})
ON CREATE SET n.unique_id = replace(randomUUID(), "-", ""),
              n.date_created = date("2026-09-03"),
              n.include_in_report = true,
              n.content = "Four gaps in the Library accessibility request pathway, identified as the agreed improvement targets when the process was described in August 2026. The triage rule is established practice rather than a documented routing procedure, and the Dean does not personally handle these requests. Accessibility requests are not tagged or counted, so no volume, turnaround or pattern is visible, though a rough count of DPRC referrals could be obtained by searching the Springshare statistics for DPRC. No turnaround is stated to users. The vendor-escalation outcome does not report back to campus procurement, where a record of which vendors generate barriers would carry weight at renewal. The example given for a vendor escalation was a Spanish-language film in the streaming collection missing English captions."
MERGE (y)-[:has_note]->(n)
MERGE (n)-[:created_by]->(dan);

MATCH (y:YearSuccessEvidence {year_identifier: "2025-2026-4.5-ins-csueb"})
MATCH (dan:Person {name: "Daniel Fontaine"})
MERGE (n:Note {name: "csueb-alt-media-org-history-sep-2026-yse:2025-2026-4.5-ins-csueb-4d90b12f"})
ON CREATE SET n.unique_id = replace(randomUUID(), "-", ""),
              n.date_created = date("2026-09-03"),
              n.include_in_report = false,
              n.content = "Organisational history for alternate media at CSU East Bay, per Pamela Baird, Director of Disability Services, on 2026-08-19. Accessible Media originally sat within Disability Services. The technical remediation function later moved to ITS while the student-facing intake function stayed with Disability Services, and it has since moved again from ITS to Online Campus under Zach Oshri, a separate department on the academic side under the Provost. Pamela is not certain whether that most recent move changes the intake workflow. Disability Services remains the student's interface after intake: a student with a delay concern, her example being reaching the third week of instruction without a textbook, returns to Disability Services rather than contacting alternate media directly, and their assigned Accessibility Services Counselor pursues a status update. At East Bay, Assistive Technology and Accessible Media are two separate functions. This service is distinct from the ITS-owned Alt Media Request and Fulfillment Automation process, which is the production pipeline this intake feeds."
MERGE (y)-[:has_note]->(n)
MERGE (n)-[:created_by]->(dan);

MATCH (y:YearSuccessEvidence {year_identifier: "2025-2026-5.13-ins-csueb"})
MATCH (dan:Person {name: "Daniel Fontaine"})
MERGE (n:Note {name: "csueb-equalify-status-and-asheard-sep-2026-yse:2025-2026-5.13-ins-csueb-c02f7a63"})
ON CREATE SET n.unique_id = replace(randomUUID(), "-", ""),
              n.date_created = date("2026-09-03"),
              n.include_in_report = false,
              n.content = "Build and status detail for the Equalify Reflow pipeline, as at the 2026-08-10 demonstration. Built by Zach Oshri with a University of Illinois Chicago counterpart, plus an outside AI engineer whose company was heard as DQ, likely Deque but unverified. Semantic inference currently runs on Anthropic Claude. OpenAI models were rejected for this inference task. Status at the time of recording: the document pipeline is finished and stable, and a fall pilot with 20 faculty validates the remaining LTI integration layer. Presented publicly at the most recent ATI conference. Verify the engineering partner name before it is repeated anywhere external."
MERGE (y)-[:has_note]->(n)
MERGE (n)-[:created_by]->(dan);

MATCH (y:YearSuccessEvidence {year_identifier: "2025-2026-1.1-ins-csueb"})
MATCH (dan:Person {name: "Daniel Fontaine"})
MERGE (n:Note {name: "csueb-adoption-platform-coverage-figures-sep-2026-yse:2025-2026-1.1-ins-csueb-7b3e0d51"})
ON CREATE SET n.unique_id = replace(randomUUID(), "-", ""),
              n.date_created = date("2026-09-03"),
              n.include_in_report = true,
              n.content = "Coverage figures for the CSU East Bay textbook adoption monitoring platform, current as at August 2026. Library coverage of required materials stands at 72 percent, with recommended materials tracked separately and excluded from that figure. The overall adoption rate, meaning the share of course sections with any adoption on file, was roughly 45 to 47 percent when Zach Oshri took on the role and has been improved manually since. These are point-in-time figures and belong with the reporting year rather than in the platform description."
MERGE (y)-[:has_note]->(n)
MERGE (n)-[:created_by]->(dan);

MATCH (y:YearSuccessEvidence {year_identifier: "2025-2026-6.7-ins-ssu"})
MATCH (dan:Person {name: "Daniel Fontaine"})
MERGE (n:Note {name: "ssu-acp-participation-and-provenance-sep-2026-yse:2025-2026-6.7-ins-ssu-e2418c07"})
ON CREATE SET n.unique_id = replace(randomUUID(), "-", ""),
              n.date_created = date("2026-09-03"),
              n.include_in_report = true,
              n.content = "Over 100 faculty have participated in the Accessible Content Partnership. Faculty join by contacting CTET at ctet@sonoma.edu. The published objectives set out the workflow: identify faculty members and courses for the programme, obtain consent from the faculty member to begin remediation, communicate when the work has started and which CTET staff will do it, remediate course content to meet Universal Design for Learning standards and federal accessibility regulations, and communicate when the remediation is complete. The consent and notification steps and the participation figure exist on the partnership side rather than on Canvas Course Remediation, which is the internal method. Recorded 2026-09-02 from the CTET accessibility page. Owner is not established: every sibling CTET remediation node is owned by Tim Hensel, but the page names only the CTET mailbox."
MERGE (y)-[:has_note]->(n)
MERGE (n)-[:created_by]->(dan);

MATCH (y:YearSuccessEvidence {year_identifier: "2025-2026-6.7-ins-ssu"})
MATCH (dan:Person {name: "Daniel Fontaine"})
MERGE (n:Note {name: "ssu-canvas-remediation-volume-sep-2026-yse:2025-2026-6.7-ins-ssu-9c15ba24"})
ON CREATE SET n.unique_id = replace(randomUUID(), "-", ""),
              n.date_created = date("2026-09-03"),
              n.include_in_report = true,
              n.content = "Volume and uptake figures for CTET Canvas course remediation at Sonoma State. Summer 2026 volume was 72 courses, and roughly 90 percent of student time in summer goes to remediation. One faculty member opted out in the programme's first year. These are point-in-time figures and belong with the reporting year rather than in the process description."
MERGE (y)-[:has_note]->(n)
MERGE (n)-[:created_by]->(dan);

MATCH (y:YearSuccessEvidence {year_identifier: "2025-2026-4.1-ins-sfsu"})
MATCH (dan:Person {name: "Daniel Fontaine"})
MERGE (n:Note {name: "sfsu-jedi-pie-lineage-and-uptake-sep-2026-yse:2025-2026-4.1-ins-sfsu-0a6df739"})
ON CREATE SET n.unique_id = replace(randomUUID(), "-", ""),
              n.date_created = date("2026-09-03"),
              n.include_in_report = true,
              n.content = "The current JEDI PIE certificate series is a substantial revision of the 2020 JEDI PIE certificate rather than a continuation of it, and is published as Return of the JEDI PIE. Slice 2 carries a practical module on Universal Design 3.0, completed by approximately 50 faculty as at August 2026. Digital accessibility content embedded in the online coursework is sourced from SFBRN material and curated with the Teaching Square leads from ATI websites across the CSU system."
MERGE (y)-[:has_note]->(n)
MERGE (n)-[:created_by]->(dan);

MATCH (y:YearSuccessEvidence {year_identifier: "2025-2026-6.5-ins-sfsu"})
MATCH (dan:Person {name: "Daniel Fontaine"})
MERGE (n:Note {name: "sfsu-teaching-square-leads-and-funding-sep-2026-yse:2025-2026-6.5-ins-sfsu-b6902d4a"})
ON CREATE SET n.unique_id = replace(randomUUID(), "-", ""),
              n.date_created = date("2026-09-03"),
              n.include_in_report = true,
              n.content = "The JEDI Teaching Square is co-led by Julie Paulson, Director of Disability Studies, with a second faculty lead. The leads hold a separate grant with CSU Stanislaus focused on neurodivergence and course-redesign accessibility, which funds stipends for 12 participants, with CEETL funding roughly 8 more to reach the cohort of 20. The Fall square is the applied counterpart to the UDL module taught in the asynchronous coursework."
MERGE (y)-[:has_note]->(n)
MERGE (n)-[:created_by]->(dan);

MATCH (y:YearSuccessEvidence {year_identifier: "2025-2026-1.15-web-csueb"})
MATCH (dan:Person {name: "Daniel Fontaine"})
MERGE (n:Note {name: "csueb-ati-priorities-2025-26-sep-2026-yse:2025-2026-1.15-web-csueb-3fa8c15e"})
ON CREATE SET n.unique_id = replace(randomUUID(), "-", ""),
              n.date_created = date("2026-09-03"),
              n.include_in_report = true,
              n.content = "CSU East Bay published ATI priorities for 2025-26: supporting document and course remediation, reducing barriers on high-traffic pages, and ensuring new ICT purchases follow accessibility review. The published vision is to create a culture of access for an inclusive learning and working environment, and the mission is to help implement CSU accessibility policy through accessible practices for the web, instructional materials and technology procurement. Priorities are restated each year and belong with the reporting year rather than in the overview description."
MERGE (y)-[:has_note]->(n)
MERGE (n)-[:created_by]->(dan);

MATCH (y:YearSuccessEvidence {year_identifier: "2025-2026-1.12-web-ssu"})
MATCH (dan:Person {name: "Daniel Fontaine"})
MERGE (n:Note {name: "ssu-captioning-platforms-and-contacts-sep-2026-yse:2025-2026-1.12-web-ssu-8e0b5713"})
ON CREATE SET n.unique_id = replace(randomUUID(), "-", ""),
              n.date_created = date("2026-09-03"),
              n.include_in_report = true,
              n.content = "Approved no-cost captioning platforms at Sonoma State: YuJa for instructional use, YouTube, and Google Drive or Docs. Other platforms including Vimeo and transcription and podcast services require CSUBuy review. AutomaticSync provides professional WCAG-compliant captioning at department expense. The style guide sets a 37-character two-line limit and a 180 words per minute maximum reading speed, and is maintained by the Accessibility Services Analyst. Captioning service contact is DSS, and YuJa support is CTET. A 2026-06 note records Sonoma moving from YuJa to Panopto, so the platform list needs confirming before it is relied on."
MERGE (y)-[:has_note]->(n)
MERGE (n)-[:created_by]->(dan);

MATCH (y:YearSuccessEvidence {year_identifier: "2025-2026-6.7-ins-csueb"})
MATCH (dan:Person {name: "Daniel Fontaine"})
MERGE (n:Note {name: "csueb-dashboard-maturity-argument-sep-2026-yse:2025-2026-6.7-ins-csueb-d5471bf9"})
ON CREATE SET n.unique_id = replace(randomUUID(), "-", ""),
              n.date_created = date("2026-09-03"),
              n.include_in_report = false,
              n.content = "The argument for elevating maturity on this indicator, made at the 2026-08-07 meeting, rests on the remediation dashboard running its evaluation without a manual trigger and on the department outreach that follows being established practice rather than an ad hoc response. A substantial amount of that outreach was done over the year to August 2026. This reasoning is our grading position and was previously carried inside the implementation description, where it read as a property of the dashboard rather than as our assessment of it."
MERGE (y)-[:has_note]->(n)
MERGE (n)-[:created_by]->(dan);

MATCH (y:YearSuccessEvidence {year_identifier: "2025-2026-7.5-web-ssu"})
MATCH (dan:Person {name: "Daniel Fontaine"})
MERGE (n:Note {name: "ssu-ati-program-leadership-sep-2026-yse:2025-2026-7.5-web-ssu-1c68e40b"})
ON CREATE SET n.unique_id = replace(randomUUID(), "-", ""),
              n.date_created = date("2026-09-03"),
              n.include_in_report = true,
              n.content = "Leadership recorded on the published SSU ATI program overview: the ATI Committee chaired by Dr Sandy Ayala as Faculty Fellow, and the ATI Ambassador Program led by Dr Justin Lipp. Justin Lipp has since left Sonoma State, which the 2026-09-03 instructional materials meeting confirmed, so the Ambassador Program lead named on the published page is out of date and the current lead is unknown. DSS alternate-format production is described on the same page as over 2000 pages per semester. Leadership names were moved out of the implementation description because they change without the programme changing."
MERGE (y)-[:has_note]->(n)
MERGE (n)-[:created_by]->(dan);

MATCH (y:YearSuccessEvidence {year_identifier: "2025-2026-1.8-pro-csueb"})
MATCH (dan:Person {name: "Daniel Fontaine"})
MERGE (n:Note {name: "csueb-lti-gate-denials-sep-2026-yse:2025-2026-1.8-pro-csueb-5a2e93c6"})
ON CREATE SET n.unique_id = replace(randomUUID(), "-", ""),
              n.date_created = date("2026-09-03"),
              n.include_in_report = true,
              n.content = "At least twelve learning tools interoperability integrations were denied on accessibility grounds at CSU East Bay during the year to August 2026. That count is the evidence that the review gate is enforced rather than advisory. Because the second reviewer carries a heavier workload, Zach Oshri frequently receives the vendor conformance response first. Jonathan Hale, Business Operations Specialist, enters the completed ICT questionnaire into P2P."
MERGE (y)-[:has_note]->(n)
MERGE (n)-[:created_by]->(dan);

MATCH (y:YearSuccessEvidence {year_identifier: "2025-2026-5.16-ins-sfsu"})
MATCH (dan:Person {name: "Daniel Fontaine"})
MERGE (n:Note {name: "sfsu-designplus-rationale-sep-2026-yse:2025-2026-5.16-ins-sfsu-f409a2d7"})
ON CREATE SET n.unique_id = replace(randomUUID(), "-", ""),
              n.date_created = date("2026-09-03"),
              n.include_in_report = true,
              n.content = "DesignPLUS was purchased primarily to improve Canvas course quality and student interactivity, with accessibility as a strong secondary benefit. Because adoption requires faculty to rebuild their courses into DesignPLUS templates, the rollout was expected to run in cohorts, with faculty prepping fall courses during spring and vice versa. The cohort structure was an expectation at the time of recording rather than a confirmed plan, and should be checked against how the rollout has actually been organised."
MERGE (y)-[:has_note]->(n)
MERGE (n)-[:created_by]->(dan);

MATCH (y:YearSuccessEvidence {year_identifier: "2025-2026-6.3-web-sfsu"})
MATCH (dan:Person {name: "Daniel Fontaine"})
MERGE (n:Note {name: "sfsu-nffo-2026-delivery-sep-2026-yse:2025-2026-6.3-web-sfsu-2b7c04e5"})
ON CREATE SET n.unique_id = replace(randomUUID(), "-", ""),
              n.date_created = date("2026-09-03"),
              n.include_in_report = true,
              n.content = "Delivery detail for the 2026 CEETL New Faculty Foundation Orientation. The UDL session was delivered by Julie Paulson, Director of Disability Studies. Prior years brought in an outside UDL presenter who has since left the university. The DPRC participated but did not deliver a formal presentation in 2026: Maisoon greeted attendees and gave a tour that included the testing center, focused on accommodations support. Presenter and delivery detail changes year to year and belongs with the reporting year rather than in the programme description."
MERGE (y)-[:has_note]->(n)
MERGE (n)-[:created_by]->(dan);

MATCH (y:YearSuccessEvidence {year_identifier: "2025-2026-6.8-ins-ssu"})
MATCH (dan:Person {name: "Daniel Fontaine"})
MERGE (n:Note {name: "ssu-student-team-skills-transition-sep-2026-yse:2025-2026-6.8-ins-ssu-7d3f1096"})
ON CREATE SET n.unique_id = replace(randomUUID(), "-", ""),
              n.date_created = date("2026-09-03"),
              n.include_in_report = true,
              n.content = "Skills on the CTET student remediation team were historically self-taught, with Equidox and Acrobat picked up on the job. That is being replaced with structured onboarding through the Canvas remediation manual, daily check-ins, and QA double-checks by the programme lead. Two career tracks are being cultivated, one toward remediation and one toward hardware and audiovisual work. The transition was in progress as at mid-2026."
MERGE (y)-[:has_note]->(n)
MERGE (n)-[:created_by]->(dan);

MATCH (y:YearSuccessEvidence {year_identifier: "2025-2026-4.1-ins-csueb"})
MATCH (dan:Person {name: "Daniel Fontaine"})
MERGE (n:Note {name: "csueb-course-timeline-phase-detail-sep-2026-yse:2025-2026-4.1-ins-csueb-6f80a3d2"})
ON CREATE SET n.unique_id = replace(randomUUID(), "-", ""),
              n.date_created = date("2026-09-03"),
              n.include_in_report = true,
              n.content = "Phase detail from the CSU East Bay course accessibility timeline guidance. During priority registration, students whose accommodations need lead time, such as sign language interpreting, real-time captioning and accessible textbooks and materials, register first and are told to submit requests promptly. During regular registration the remaining students submit course notes and accessible furniture requests. A classroom scheduling phase handles relocation for physical barriers through Academic Resources and Planning. From the first day faculty are expected to carry a syllabus statement inviting accommodation discussions, and Agreement Accommodations require a meeting between student, instructor and accessibility counselor. During the term accommodations are not retroactive and accessible testing requires one week notice. Enumerated faculty responsibilities are to publish textbook lists early, use a microphone, leave accessible furniture in place, and respond promptly to the Accessible Testing Office. Late adoption results in requests that faculty be flexible on assignment, quiz and exam dates."
MERGE (y)-[:has_note]->(n)
MERGE (n)-[:created_by]->(dan);


// -------------------------------------------------------------------------------------
// 4. DUPLICATE REMOVAL
//
// "Academic Senate Policies Referencing Instructional Materials Accessibility" exists
// twice with identical descriptions, once as Guidance and once as InternalPolicy. The
// InternalPolicy copy carries four YearSuccessEvidence links and a supporting document.
// The Guidance copy has no relationships of any kind. It is an artifact of a node being
// created under the wrong type and then recreated correctly, and is deleted.
//
// DETACH DELETE is safe here only because the node has zero relationships, which the
// bind-check confirmed before this file ran.
// -------------------------------------------------------------------------------------

MATCH (g:Guidance {unique_id: "79100c1506db406f81777ee799c0a775"})
WHERE NOT (g)--()
DETACH DELETE g;


// -------------------------------------------------------------------------------------
// 5. DOCUMENTATION LINKS FOUND IN SOURCE TEXT
//
// 43 distinct URLs appear inside the source text of the 84 documented pages and are not
// yet nodes. Most are third-party reference material (WebAIM technique pages, Adobe,
// section508.gov, eCFR) which the campus guidance cites rather than owns, and are left
// alone. The four attached here are campus-owned artifacts that document an
// implementation directly.
//
// The two HTML pages were fetched and confirmed live on 2026-09-03. The two file
// downloads are recorded from the link as published on the parent page, with no
// raw_text, because their content was not retrieved.
// -------------------------------------------------------------------------------------

MERGE (w:Webpage {url: "https://www.csueastbay.edu/accessibility/other-important-information/tips-and-resources/for-faculty-staff.html"})
ON CREATE SET w.unique_id = replace(randomUUID(), "-", ""),
              w.name = "Tips and Resources for Faculty and Staff",
              w.description = "CSU East Bay Accessibility Services guidance for faculty and staff on supporting students with disabilities. Sections cover general tips and Universal Design for Learning, the syllabus and the textbook including adoption timelines, early-semester steps such as accommodation statements and advance notice of reading assignments, and general strategies for teaching and presenting covering confidentiality, contacting accessibility counselors, lecture structure, multi-sensory presentation and assignment formatting.",
              w.include_in_report = true;

MATCH (i {unique_id: "8550dd14-54a2-4e5f-8a34-185867067b24"})
MATCH (w:Webpage {url: "https://www.csueastbay.edu/accessibility/other-important-information/tips-and-resources/for-faculty-staff.html"})
MERGE (i)-[r:is_documented_by]->(w)
ON CREATE SET r.added_date = date("2026-09-03");

MERGE (d:Document {uri_path: "https://accessibility.sonoma.edu/sites/default/files/2025-01/accessible_syllabus_template_2025.docx"})
ON CREATE SET d.unique_id = replace(randomUUID(), "-", ""),
              d.name = "Accessible Syllabus Template 2025 (Word)",
              d.description = "The downloadable Word syllabus template itself, linked from the Sonoma State accessible syllabus template page. Recorded from the published link. File content has not been retrieved.",
              d.include_in_report = true,
              d.is_administrative_review_documentation = false,
              d.is_milestone_and_measures_documentation = false;

MATCH (i {unique_id: "74e8d022ab6947459d4f020bac84be5f"})
MATCH (d:Document {uri_path: "https://accessibility.sonoma.edu/sites/default/files/2025-01/accessible_syllabus_template_2025.docx"})
MERGE (i)-[r:is_documented_by]->(d)
ON CREATE SET r.added_date = date("2026-09-03");

MERGE (d:Document {uri_path: "https://accessibility.sonoma.edu/sites/default/files/appendix.c.vpat_guide.doc"})
ON CREATE SET d.unique_id = replace(randomUUID(), "-", ""),
              d.name = "SSU VPAT Guide (Appendix C)",
              d.description = "Sonoma State VPAT guide for vendors, linked as Appendix C from the SSU information for vendors page. Recorded from the published link. File content has not been retrieved.",
              d.include_in_report = true,
              d.is_administrative_review_documentation = false,
              d.is_milestone_and_measures_documentation = false;

MATCH (i {unique_id: "1e36c9aaae434f2594aef65c2c3e4cd9"})
MATCH (d:Document {uri_path: "https://accessibility.sonoma.edu/sites/default/files/appendix.c.vpat_guide.doc"})
MERGE (i)-[r:is_documented_by]->(d)
ON CREATE SET r.added_date = date("2026-09-03");

MERGE (d:Document {uri_path: "https://www.csueastbay.edu/staff/files/docs/vpat-guide.pdf"})
ON CREATE SET d.unique_id = replace(randomUUID(), "-", ""),
              d.name = "CSUEB VPAT Guide",
              d.description = "CSU East Bay VPAT guide, linked from the Office of Faculty Development resources page. Recorded from the published link. File content has not been retrieved.",
              d.include_in_report = true,
              d.is_administrative_review_documentation = false,
              d.is_milestone_and_measures_documentation = false;

MATCH (i {unique_id: "86d96d17d43d44cd84c0c637265abd23"})
MATCH (d:Document {uri_path: "https://www.csueastbay.edu/staff/files/docs/vpat-guide.pdf"})
MERGE (i)-[r:is_documented_by]->(d)
ON CREATE SET r.added_date = date("2026-09-03");

// Note recording what the link sweep found and what was deliberately left alone.
MATCH (y:YearSuccessEvidence {year_identifier: "2025-2026-1.3-pro-ssu"})
MATCH (dan:Person {name: "Daniel Fontaine"})
MERGE (n:Note {name: "sweep-documentation-link-findings-sep-2026-yse:2025-2026-1.3-pro-ssu-9f2a7c31"})
ON CREATE SET n.unique_id = replace(randomUUID(), "-", ""),
              n.date_created = date("2026-09-03"),
              n.include_in_report = false,
              n.content = "Link sweep across the source text of the 84 documented pages that carry it, 2026-09-03. 43 distinct URLs appear inside that text and are not yet nodes. Four campus-owned artifacts were attached: the CSU East Bay tips and resources page for faculty and staff, the Sonoma accessible syllabus template Word file, the Sonoma VPAT guide Appendix C, and the CSU East Bay VPAT guide. The remainder are third-party reference material that campus guidance cites rather than owns, chiefly WebAIM technique pages for Word, PowerPoint and Acrobat, Adobe accessibility pages, section508.gov, NCDAE factsheets and eCFR, and were left alone to keep the documentation graph to artifacts the campuses answer for. Two further findings worth acting on separately: the CSU East Bay page Making A University Event Accessible is live and substantive but no implementation covers event accessibility, so it has nowhere to attach, and 16 of the 187 webpages documenting implementations are already flagged as no longer existing."
MERGE (y)-[:has_note]->(n)
MERGE (n)-[:created_by]->(dan);
