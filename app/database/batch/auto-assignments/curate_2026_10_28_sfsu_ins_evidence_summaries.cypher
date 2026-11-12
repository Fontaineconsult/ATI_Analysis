// Write evidence summaries (admin_review_description) for SFSU IM 2025-2026 YSEs
// that currently have no summary. Does not overwrite existing summaries.

MATCH (yse:YearSuccessEvidence {year_identifier: '2025-2026-1.5-ins-sfsu'})
WHERE yse.admin_review_description IS NULL
SET yse.admin_review_description = 'No evidence of any kind exists for this indicator. No person, process or report addresses the distribution of timely-adoption performance data to campus administration.';

MATCH (yse:YearSuccessEvidence {year_identifier: '2025-2026-2.4-ins-sfsu'})
WHERE yse.admin_review_description IS NULL
SET yse.admin_review_description = 'One attested claim states that late-hire adoption performance reports reach campus administration. No linked documentation, implementation or stored report supports the claim. The status rests on testimony alone.';

MATCH (yse:YearSuccessEvidence {year_identifier: '2025-2026-4.1-ins-sfsu'})
WHERE yse.admin_review_description IS NULL
SET yse.admin_review_description = 'LMS Promotional Materials and the JEDI PIE certificate series address posting instructional materials to Canvas. About 50 faculty have completed Slice 2 of JEDI PIE, which carries UDL 3.0 content sourced from ATI websites across the CSU system. Public guidance about using the LMS exists in several places. No internal process document governs the activity, and no implementation on this indicator has an owner.';

MATCH (yse:YearSuccessEvidence {year_identifier: '2025-2026-4.3-ins-sfsu'})
WHERE yse.admin_review_description IS NULL
SET yse.admin_review_description = "Five implementations address accessible course content in Canvas, among them public accessibility guidance, AT's Canvas remediation process, the Accessible Media Quick Converter and CEETL courses. Canvas Studio now supports professional captioning through Verbit. AT is building an accessibility training portal, but nothing is public yet. AT is not initially collaborating with CEETL on training during the current organizational transition.";

MATCH (yse:YearSuccessEvidence {year_identifier: '2025-2026-4.5-ins-sfsu'})
WHERE yse.admin_review_description IS NULL
SET yse.admin_review_description = 'DPRC uses a custom application (Canvas Bot) that scans courses daily when a student requests accommodation. Alt media production staff get immediate access to files flagged for remediation. Two dedicated Accessible Technologists, Ray Choudhury and Dalice Mariah Stogden, hold this work in their position descriptions. The Accessible Media Quick Converter handles format conversion. Canvas Bot currently serves direct accommodations only, not universal design.';

MATCH (yse:YearSuccessEvidence {year_identifier: '2025-2026-4.11-ins-sfsu'})
WHERE yse.admin_review_description IS NULL
SET yse.admin_review_description = "AT manages accessibility for faculty web applications used in instruction and assesses compliance at procurement. Third-party tools that faculty select outside AT's support still require review, and some publisher tools bundled with textbook packages bypass that review entirely. The campus is examining options but has no documented process.";

MATCH (yse:YearSuccessEvidence {year_identifier: '2025-2026-5.11-ins-sfsu'})
WHERE yse.admin_review_description IS NULL
SET yse.admin_review_description = "Four implementations address audio and video accessibility. AT uses DPRC's Verbit account for Canvas Studio captioning, and Cristian handles one-off caption requests. The service covers captions only. No audio description capability exists. AT expects an expanded contract for public video content. Procurement reviews a basic VPAT at acquisition but nothing beyond.";

MATCH (yse:YearSuccessEvidence {year_identifier: '2025-2026-5.12-ins-sfsu'})
WHERE yse.admin_review_description IS NULL
SET yse.admin_review_description = 'The Accessible Media Quick Converter handles format conversion. DPRC remediates print materials as a direct accommodation. No universal design process exists for instructor-developed course readers.';

MATCH (yse:YearSuccessEvidence {year_identifier: '2025-2026-5.13-ins-sfsu'})
WHERE yse.admin_review_description IS NULL
SET yse.admin_review_description = "AT's Canvas remediation process and the Accessible Media Quick Converter address document accessibility. Files were out of scope in 2025-2026. In fall 2026, AT started building a UDOIT-based files queue. A student in AT built a tool that sends flagged files to Adobe PDF Services API and returns them for manual review. Most flagged files are PDFs accumulated over multiple years. Whiteboard images and math formulas have no remediation path.";

MATCH (yse:YearSuccessEvidence {year_identifier: '2025-2026-5.14-ins-sfsu'})
WHERE yse.admin_review_description IS NULL
SET yse.admin_review_description = "CEETL's Excellence in Online Pedagogies course covers emerging technology accessibility, adapting the Quality Matters Bridge to Quality guide. No other process or implementation addresses this indicator. The evidence is limited to professional development content.";

MATCH (yse:YearSuccessEvidence {year_identifier: '2025-2026-5.15-ins-sfsu'})
WHERE yse.admin_review_description IS NULL
SET yse.admin_review_description = "The only wired implementation (SF State Accessible Technology Procurement Process) is retired. Faculty request publisher tools through the bookstore, which bypasses procurement. AT moved LTI installs into BuyIT over several years, but BuyIT's retirement removes that control. Procurement reviews a basic VPAT at acquisition. DPRC remediation remains accommodation-only.";

MATCH (yse:YearSuccessEvidence {year_identifier: '2025-2026-5.16-ins-sfsu'})
WHERE yse.admin_review_description IS NULL
SET yse.admin_review_description = 'AT routes every LTI request through BuyIT for accessibility review. The BuyIT/TAAP process includes a checkbox for course-related purchases that triggers a more detailed review. BuyIT is the only step that puts an LTI request in front of accessibility review, and no replacement has been named for its retirement. DesignPLUS was purchased for Canvas course quality with accessibility as a secondary benefit, with rollout expected in cohorts.';

MATCH (yse:YearSuccessEvidence {year_identifier: '2025-2026-6.2-ins-sfsu'})
WHERE yse.admin_review_description IS NULL
SET yse.admin_review_description = 'Public CEETL guidance and the JEDI PIE certificate series address accessible course materials. No formal route exists for DPRC to notify AT that a course needs remediation. Requests arrive by email. Cristian Alvarado and Christina Passmore are working out the details of a DPRC-to-AT notification process. The campus course review and approval process refers to accessibility requirements but does not link to accessibility information on the page itself.';

MATCH (yse:YearSuccessEvidence {year_identifier: '2025-2026-6.4-ins-sfsu'})
WHERE yse.admin_review_description IS NULL
SET yse.admin_review_description = "CEETL courses and AT's internal CPaGE processes address course review before posting. Multiple concurrent professional development courses run in the LMS across semesters, facilitated by AT and CEETL staff. AT does not push QLT or Quality Matters. Andrew sees UDL 3.0 as a stronger basis than QLT. DPRC no longer has resources to support course accessibility reviews.";

MATCH (yse:YearSuccessEvidence {year_identifier: '2025-2026-6.5-ins-sfsu'})
WHERE yse.admin_review_description IS NULL
SET yse.admin_review_description = "Six implementations address accessibility at course redesign, among them JEDI Teaching Square, the Accessible Syllabus Tool, JEDI PIE and AT's internal CPaGE processes. DesignPLUS is in a pilot with 12 faculty but carries zero documentation. Julie Paulson co-leads Teaching Square through a CSU Stanislaus grant. CPaGE practices operate within one unit and are not campus-wide. No metrics on faculty adoption or course outcomes exist. The budget element of this indicator is unmet.";

MATCH (yse:YearSuccessEvidence {year_identifier: '2025-2026-6.7-ins-sfsu'})
WHERE yse.admin_review_description IS NULL
SET yse.admin_review_description = 'AT scanned spring 2026 Canvas courses with the UDOIT accessibility checker and raised scores from about 71% to the 80s by summer. No manual evaluation method exists. No written scan schedule is on record. Canvas Bot does daily scans for accommodation-triggered courses only.';

MATCH (yse:YearSuccessEvidence {year_identifier: '2025-2026-6.8-ins-sfsu'})
WHERE yse.admin_review_description IS NULL
SET yse.admin_review_description = "Kevin Connor runs day-to-day Canvas remediation with six student workers. AT runs batch UDOIT scans and sends mail-merge notifications to faculty. In spring 2026, the program covered about 4,000 courses. By October 2026, 21.7% of ATI points had been removed. AT's first dedicated accessibility work began in this period. PDF remediation runs on test courses only. The Accessible Media Quick Converter handles format conversion. Whiteboard images and math formulas still have no remediation path.";

MATCH (yse:YearSuccessEvidence {year_identifier: '2025-2026-6.9-ins-sfsu'})
WHERE yse.admin_review_description IS NULL
SET yse.admin_review_description = 'People are directed to the BuyIT process for LTI accessibility review. No campus policy pushes publisher tools into BuyIT. No Equally Effective Alternate Access Plan exists for the LMS or its integrations.';

MATCH (yse:YearSuccessEvidence {year_identifier: '2025-2026-7.1-ins-sfsu'})
WHERE yse.admin_review_description IS NULL
SET yse.admin_review_description = 'No formal policy, resolution or procedure documents faculty responsibility for selecting and authoring accessible instructional materials. Faculty receive encouragement through various mechanisms, and the syllabus policy references accessibility. The Affordable Instructional Materials Initiative touches this area. No one in Academic Affairs has been assigned responsibility.';

MATCH (yse:YearSuccessEvidence {year_identifier: '2025-2026-8.1-ins-sfsu'})
WHERE yse.admin_review_description IS NULL
SET yse.admin_review_description = "AT's Canvas remediation process, CEETL courses, the administrative review process and JEDI PIE all carry accessibility messaging. DPRC has conducted presentations and sits on committees. No formal communication campaign with executive support exists. Faculty respond better to evidence-based rationale than compliance mandates alone. CSU WebAIM training was communicated in a campus memo, but the effort is episodic.";

MATCH (yse:YearSuccessEvidence {year_identifier: '2025-2026-8.13-ins-sfsu'})
WHERE yse.admin_review_description IS NULL
SET yse.admin_review_description = 'AT reported ATI progress to the Academic Technology Advisory Committee, covering Canvas remediation, the files queue and the DesignPLUS accessibility checker. The Canvas LTI accessibility gate via BuyIT and CEETL courses also address this indicator. Ad hoc approaches are in place but lack formal documentation.';

MATCH (yse:YearSuccessEvidence {year_identifier: '2025-2026-8.14-ins-sfsu'})
WHERE yse.admin_review_description IS NULL
SET yse.admin_review_description = 'Various free professional development materials are available. No budget supports ongoing PD for employees with ATI instructional materials responsibilities. Student-assistant training and DesignPLUS training may already constitute PD for ATI employees, but neither is documented as such. The associated plan is on hold.';

MATCH (yse:YearSuccessEvidence {year_identifier: '2025-2026-9.1-ins-sfsu'})
WHERE yse.admin_review_description IS NULL
SET yse.admin_review_description = 'The ATI Charter is retired and no active implementation replaces it. No reportable notes address committee membership composition. The status rests on the existence of the committee itself, without documentation of its current membership across the required units.';

MATCH (yse:YearSuccessEvidence {year_identifier: '2025-2026-9.2-ins-sfsu'})
WHERE yse.admin_review_description IS NULL
SET yse.admin_review_description = 'The ATI Knowledge Graph contains a review system that allows assigned reviewers to review each success indicator before submission. The Administrative Review Process is the sole implementation.';

MATCH (yse:YearSuccessEvidence {year_identifier: '2025-2026-9.3-ins-sfsu'})
WHERE yse.admin_review_description IS NULL
SET yse.admin_review_description = 'The ATI Knowledge Graph review system allows the instructional materials subcommittee to inform revision and coordinate implementation of the Annual Instructional Materials Plan. The Administrative Review Process is the sole implementation.';
