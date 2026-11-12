// SSU instructional materials 2025-2026: status set to match the evidence on hand.
// Full sweep of all 31 indicators, 2026-10-30, after the web sweep corrections in
// curate_2026_10_30_ssu_ins_websweep_corrections.cypher.
// Nine moves, twenty-two holds. Every move is stated with what decided it.

// ---------------------------------------------------------------------------
// RAISE
// ---------------------------------------------------------------------------

// 6.9-ins: Initiated -> Defined
// Two signed TAAPs exist with named owners, Anatomy LT (Sean Place) and Insights
// Discovery Profiles (Elizabeth Stanny), both on the CSU standard template. The
// governing SFBRN CSUBuy IT Accessibility Review Procedure is listed here with
// four documents, three carrying captured text. Initiated understates a practice
// that uses a standard template and holds completed plans. Not Established: no
// campus process defines when a plan is required for the LMS or its integrations,
// and no central repository is available to ATI stakeholders.
MATCH (yse:YearSuccessEvidence {year_identifier: '2025-2026-6.9-ins-ssu'})-[r:status_is]->(:StatusLevel)
DELETE r
WITH yse
MATCH (sl:StatusLevel {status_level: 'Defined'})
MERGE (yse)-[:status_is]->(sl);

// ---------------------------------------------------------------------------
// LOWER
// ---------------------------------------------------------------------------

// 1.6-ins: Established -> Defined
// The bi-monthly reporting pipeline to campus administration is real, decade-old
// and owned by Steve Higginbotham. Not one report is on file. The September
// figures are recorded as spoken on a call with no export behind them, and
// Established requires documentation that reflects the practice.
MATCH (yse:YearSuccessEvidence {year_identifier: '2025-2026-1.6-ins-ssu'})-[r:status_is]->(:StatusLevel)
DELETE r
WITH yse
MATCH (sl:StatusLevel {status_level: 'Defined'})
MERGE (yse)-[:status_is]->(sl);

// 4.1-ins: Established -> Defined
// The Syllabus policy requires syllabi in an accessible format with content built
// into the learning management system, which is real posting guidance. Nothing
// evidences that posting is consistent across academic units, no measure exists,
// and the policy is three years past its scheduled review.
MATCH (yse:YearSuccessEvidence {year_identifier: '2025-2026-4.1-ins-ssu'})-[r:status_is]->(:StatusLevel)
DELETE r
WITH yse
MATCH (sl:StatusLevel {status_level: 'Defined'})
MERGE (yse)-[:status_is]->(sl);

// 4.5-ins: Established -> Defined
// A defined DSS account role gives alternate media staff direct access to Canvas,
// which is what the indicator asks. Nothing is listed as evidence and nothing is
// documented. The indicator also covers other platforms, and faculty adopt
// publisher platforms that alternate media staff cannot reach. An open concern
// records that production now leans on student assistants with no continuity of
// training after DSS staff changes.
MATCH (yse:YearSuccessEvidence {year_identifier: '2025-2026-4.5-ins-ssu'})-[r:status_is]->(:StatusLevel)
DELETE r
WITH yse
MATCH (sl:StatusLevel {status_level: 'Defined'})
MERGE (yse)-[:status_is]->(sl);

// 5.11-ins: Established -> Defined
// Captioning moved to Panopto and the policies covering selection and adoption are
// published and captured. The in-house caption correction procedure carries no
// documentation. John Lynch raised whether automated captions meet accessibility
// standards and that question is unsettled, so the quality of the output is not
// established.
MATCH (yse:YearSuccessEvidence {year_identifier: '2025-2026-5.11-ins-ssu'})-[r:status_is]->(:StatusLevel)
DELETE r
WITH yse
MATCH (sl:StatusLevel {status_level: 'Defined'})
MERGE (yse)-[:status_is]->(sl);

// 5.12-ins: Established -> Defined
// The only item listed is the DSS remediation service, which runs on individual
// accommodation requests. The copyright clearance arrangement with LAD Publishing
// is about indemnification rather than accessibility. Nothing addresses
// accessibility when course readers are created, selected or adopted.
MATCH (yse:YearSuccessEvidence {year_identifier: '2025-2026-5.12-ins-ssu'})-[r:status_is]->(:StatusLevel)
DELETE r
WITH yse
MATCH (sl:StatusLevel {status_level: 'Defined'})
MERGE (yse)-[:status_is]->(sl);

// 5.14-ins: Established -> Defined
// Rests on two notes describing ATISS and the IT Purchase Review, with nothing
// listed as evidence. The 2026-09-02 review of that same evidence on 8.13 lowered
// it to Defined because the Senate page is a roster rather than a review
// procedure. The same reasoning applies here, so this follows accepted precedent.
MATCH (yse:YearSuccessEvidence {year_identifier: '2025-2026-5.14-ins-ssu'})-[r:status_is]->(:StatusLevel)
DELETE r
WITH yse
MATCH (sl:StatusLevel {status_level: 'Defined'})
MERGE (yse)-[:status_is]->(sl);

// 7.3-ins: Established -> Defined
// Confirms the open recommendation filed 2026-09-03. John Lynch stated directly
// that Sonoma does not produce comparative before and after examples. Templates
// are not the example set the indicator asks for. Tim Hensel proposed saving a
// real as-found and remediated pair, and that plan has not started.
MATCH (yse:YearSuccessEvidence {year_identifier: '2025-2026-7.3-ins-ssu'})-[r:status_is]->(:StatusLevel)
DELETE r
WITH yse
MATCH (sl:StatusLevel {status_level: 'Defined'})
MERGE (yse)-[:status_is]->(sl);

// 7.5-ins: Established -> Defined
// A real resource set exists and CTET promotes it. The CTET Accessibility Workshop
// Series and the ATI Faculty Responsibilities Video carry the claim that resources
// are provided, and neither has any documentation. An open recommendation records
// that faculty are not told Adobe Acrobat is available to them through the Adobe
// tile, which cuts against the resources reaching the people who need them.
MATCH (yse:YearSuccessEvidence {year_identifier: '2025-2026-7.5-ins-ssu'})-[r:status_is]->(:StatusLevel)
DELETE r
WITH yse
MATCH (sl:StatusLevel {status_level: 'Defined'})
MERGE (yse)-[:status_is]->(sl);
