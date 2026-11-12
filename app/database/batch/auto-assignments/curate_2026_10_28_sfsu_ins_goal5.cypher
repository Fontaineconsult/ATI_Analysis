// Goal 5 status corrections and evidence summaries for SFSU IM 2025-2026.

// 5.13-ins: Initiated -> Defined
// Reason: documented two-pass PDF approach (Acrobat + Equidox), named staff
// (Kevin Connor in PD, 6 student workers), operational UDOIT files queue,
// PDF API tool in development, cross-campus validation with Sonoma.
MATCH (yse:YearSuccessEvidence {year_identifier: '2025-2026-5.13-ins-sfsu'})-[r:status_is]->(:StatusLevel)
DELETE r
WITH yse
MATCH (sl:StatusLevel {status_level: 'Defined'})
MERGE (yse)-[:status_is]->(sl);

// 5.16-ins: Initiated -> Defined
// Reason: consistent BuyIT gate process with 4 named staff, DesignPLUS piloted
// with 12 faculty including showcase videos and longitudinal evaluation,
// CSU considering systemwide adoption.
MATCH (yse:YearSuccessEvidence {year_identifier: '2025-2026-5.16-ins-sfsu'})-[r:status_is]->(:StatusLevel)
DELETE r
WITH yse
MATCH (sl:StatusLevel {status_level: 'Defined'})
MERGE (yse)-[:status_is]->(sl);

// Evidence summaries for all Goal 5 YSEs.

MATCH (yse:YearSuccessEvidence {year_identifier: '2025-2026-5.11-ins-sfsu'})
SET yse.admin_review_description = "Five active implementations address audio and video accessibility: Canvas Studio professional captioning through Verbit (deployed this year), JEDI PIE, the Accessible Media Quick Converter, CPaGE processes, and the Canvas remediation process. Cristian Alvarado operates the Verbit integration and handles one-off caption requests. Kevin Connor, Alex Cherian, Ash Klein, and Daniel Fontaine also implement. CPaGE targets 85% accessibility on course shells using the built-in Canvas checker, and student assistants check tags and auto-tag PDFs. DPRC has referred two faculty whose captioning needs it could not meet. The expanded Verbit contract is in progress. The service covers captions only. No audio description capability exists.";

MATCH (yse:YearSuccessEvidence {year_identifier: '2025-2026-5.12-ins-sfsu'})
SET yse.admin_review_description = "The Accessible Media Quick Converter provides automated document conversion through SensusAccess. DPRC remediates print materials as a direct accommodation, not as a universal design measure. Kevin Connor and Daniel Fontaine implement. No universal design process exists for instructor-developed course readers.";

MATCH (yse:YearSuccessEvidence {year_identifier: '2025-2026-5.13-ins-sfsu'})
SET yse.admin_review_description = "AT's Canvas remediation process addresses document accessibility on a rolling basis, starting with sections over 100 students. Kevin Connor runs day-to-day remediation (in his position description) with six student workers. PDF work began in summer 2026 using a two-pass approach: Adobe Acrobat first, Equidox for anything Acrobat cannot handle. Cross-campus comparison with Sonoma confirmed the same process at different scale. In fall 2026 AT started a UDOIT-based files queue that bulk-downloads, remediates, and re-uploads flagged files. A student built a tool routing UDOIT-flagged files to the Adobe PDF Services API for automated remediation with manual review; the tool is in development and has run on test courses. The Accessible Media Quick Converter provides SensusAccess conversion. Most flagged files are PDFs accumulated over years. Whiteboard images and math formulas have no remediation path.";

MATCH (yse:YearSuccessEvidence {year_identifier: '2025-2026-5.14-ins-sfsu'})
SET yse.admin_review_description = "CEETL's Excellence in Online Pedagogies course covers emerging technology accessibility, adapting the Quality Matters Bridge to Quality guide. Angie Petty implements. No other process or implementation addresses this indicator. The evidence is limited to professional development content.";

MATCH (yse:YearSuccessEvidence {year_identifier: '2025-2026-5.15-ins-sfsu'})
SET yse.admin_review_description = "The only wired implementation (SF State Accessible Technology Procurement Process) is retired. Daniel Fontaine implements. Faculty request publisher tools through the bookstore, which bypasses procurement. AT moved LTI installs into BuyIT over several years, but BuyIT's retirement removes that control. A plan for closer DPRC/AT collaboration was abandoned. Procurement reviews a basic VPAT at acquisition. DPRC remediation remains accommodation-only.";

MATCH (yse:YearSuccessEvidence {year_identifier: '2025-2026-5.16-ins-sfsu'})
SET yse.admin_review_description = "AT routes every LTI request through BuyIT for accessibility review, operated by Andrew Roderick, Mantasha Lakdawala, Cristian Alvarado, and Daniel Fontaine. The BuyIT/TAAP process includes a checkbox for course-related purchases that triggers a more detailed review. DesignPLUS was piloted over summer 2026 with 12 faculty who each redesigned at least one fall course. Pilot faculty recorded showcase videos published on the DesignPLUS webpage. AT is running a longitudinal evaluation with faculty sponsor Chris Bettinger comparing DesignPLUS and non-DesignPLUS courses. DesignPLUS includes an accessibility checker that flags issues inside the design flow. The CSU is considering DesignPLUS for its standard licensed tool package. BuyIT is the only step that puts an LTI request in front of accessibility review, and no replacement has been named for its retirement.";
