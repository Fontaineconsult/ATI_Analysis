// =====================================================================================
// SFBRN accessibility services: live nodes for what the SFBRN site describes.
// /implementation-rectify follow-on, run 2026-10-06 by Daniel Fontaine.
// Sources (fetched 2026-10-06):
//   https://www.sfbrn.calstate.edu/accessible
//   https://www.sfbrn.calstate.edu/ati-accessibilty-resources
//   https://www.sfbrn.calstate.edu/sfbrn-web-accessibility-scanning
//   https://www.sfbrn.calstate.edu/using-pope-tech-sfbrn
//
// WHY THIS PASS RAN
//   The resources page describes five current services. The graph held two of them only
//   through retired nodes (Drupal PDF Accessibility Review, Scheduled Web Monitoring
//   Process), one not at all at SFBRN level (Equidox account access and support), one not
//   at all (CCC Accessibility Center courses), and one under an outdated page (WebAIM
//   document training). Two of the four pages were not in the graph.
//
// DECISION: NEW LIVE NODES, NOT UN-RETIRED ONES
//   Drupal PDF Accessibility Review was a time-bound Project; what runs now is ongoing
//   monitoring, which is a Service. Scheduled Web Monitoring Process described SF State's
//   pre-Pope Tech process; what runs now is SFBRN-wide Pope Tech monitoring. The retired
//   nodes keep their history. Their 2025-2026 evidence links are NOT removed here; that is
//   a separate decision about what the year claims, reported for the user.
//
// SECTIONS
//   1. Four implementations: Drupal PDF monitoring, Pope Tech monitoring, Equidox support
//      (Services), CCC courses (Guidance). Owner and tools.
//   2. Two new Webpages (/accessible, /sfbrn-web-accessibility-scanning) and the current
//      WebAIM registration page.
//   3. Documentation links for 2025-2026.
//   4. Evidence for SF State, 2025-2026, rated against each indicator's text.
//
// EVIDENCE CONTROL
//   external throughout: SF State relies on a practice SFBRN or the CSU runs
//   (IsEvidenceForRel names SFBRN and the CO as the external cases).
//
// CONSIDERED AND REJECTED
//   Drupal PDF monitoring -> 1.11-web: the indicator asks for MANUAL evaluation of documents;
//   this is automated scanning. Pope Tech monitoring at SSU and CSUEB: the service covers all
//   three campuses, but this pass is SF State's; CSUEB already carries its own PopeTech
//   Web Accessibility Scanning node (Zach Oshri). Wiring the other campuses is follow-up.
//
// NOT IN THIS FILE
//   raw_text for any page. Written separately through neo4j-cli with raw_text_captured
//   stamped, matching queries/documentation/update.py. Never in a batch file.
//   Done 2026-10-06 after this file ran: main content extracted from each page's HTML
//   (stdlib html.parser; nav, header, footer and forms dropped) and written as Markdown to
//   seven Webpages: /accessible (1,848 chars), /ati-accessibilty-resources (4,533),
//   /using-pope-tech-sfbrn and /sfbrn-web-accessibility-scanning (11,844 each, identical
//   content), MarComm web guidelines (13,262), MarComm social media (22,142), and the WebAIM
//   CSU registration page (1,604). Each write set raw_text and raw_text_captured only.
//
// VALIDATE FIRST
//   python -m app.database.cypher_runner.run_file app/database/batch/auto-assignments/curate_2026_10_06_sfbrn_accessibility_services.cypher
//   python -m app.database.cypher_runner.run_file app/database/batch/auto-assignments/curate_2026_10_06_sfbrn_accessibility_services.cypher --execute
// =====================================================================================


// --- 1. Implementations --------------------------------------------------------------
MERGE (s:Service {title: "SFBRN Drupal PDF Accessibility Monitoring"})
ON CREATE SET s.unique_id = replace(randomUUID(), "-", ""), s.retired = false,
              s.description = "SFBRN ATI scans SF State Drupal sites and Box repositories twice a month for inaccessible PDFs. Results go to the departments that publish the files, who remediate them with Equidox or remove them. It supports SF State's ADA Title II compliance work.";

MERGE (s:Service {title: "SFBRN Pope Tech Web Monitoring"})
ON CREATE SET s.unique_id = replace(randomUUID(), "-", ""), s.retired = false,
              s.description = "SFBRN runs Pope Tech scans of public websites at San Francisco State, Sonoma State and CSU East Bay. SFBRN administers the scans and site assignments. Content owners get view-only Pope Tech accounts through campus sign-on and correct the issues in Drupal.";

MERGE (s:Service {title: "SFBRN Equidox Account Access and Support"})
ON CREATE SET s.unique_id = replace(randomUUID(), "-", ""), s.retired = false,
              s.description = "SFBRN ATI provides Equidox accounts to SF State staff and faculty who remediate PDFs to WCAG 2.1 AA. The service includes training, onboarding sessions and one-on-one consultations.";

MERGE (g:Guidance {title: "CCC Accessibility Center Courses"})
ON CREATE SET g.unique_id = replace(randomUUID(), "-", ""), g.retired = false,
              g.description = "Free, self-paced accessibility courses from the California Community Colleges Accessibility Center, offered to all CSU faculty and staff through a CSU partnership. SFBRN lists them among its digital accessibility training resources.";

MATCH (p:Person {name: "Daniel Fontaine"})
MATCH (s:Service) WHERE s.title IN ["SFBRN Drupal PDF Accessibility Monitoring", "SFBRN Pope Tech Web Monitoring", "SFBRN Equidox Account Access and Support"]
MERGE (s)-[:owned_by]->(p);

MATCH (s:Service {title: "SFBRN Pope Tech Web Monitoring"})
MATCH (t:Tool {tool_identifier: "popetech"})
MERGE (s)-[:uses_tool]->(t);

MATCH (s:Service) WHERE s.title IN ["SFBRN Drupal PDF Accessibility Monitoring", "SFBRN Equidox Account Access and Support"]
MATCH (t:Tool {tool_identifier: "equidox"})
MERGE (s)-[:uses_tool]->(t);


// --- 2. Webpages ---------------------------------------------------------------------
MERGE (w:Webpage {url: "https://www.sfbrn.calstate.edu/accessible"})
ON CREATE SET w.unique_id = replace(randomUUID(), "-", ""), w.name = "SFBRN Accessible Technology Initiative",
              w.description = "SFBRN's ATI landing page: the shared-responsibility statement and links to resources, Pope Tech monitoring and the barrier report form.",
              w.include_in_report = true, w.depreciated = false, w.no_longer_exists = false;

MERGE (w:Webpage {url: "https://www.sfbrn.calstate.edu/sfbrn-web-accessibility-scanning"})
ON CREATE SET w.unique_id = replace(randomUUID(), "-", ""), w.name = "SFBRN Web Accessibility Scanning",
              w.description = "The URL SFBRN's ATI page links for Pope Tech monitoring. It serves the same page as /using-pope-tech-sfbrn.",
              w.include_in_report = true, w.depreciated = false, w.no_longer_exists = false;

MERGE (w:Webpage {url: "https://webaim.org/training/online/csu/course/registration"})
ON CREATE SET w.unique_id = replace(randomUUID(), "-", ""), w.name = "WebAIM CSU Accessible Document Training Registration",
              w.description = "Registration for the CSU's self-paced WebAIM course on accessible Word, PowerPoint and PDF documents.",
              w.include_in_report = true, w.depreciated = false, w.no_longer_exists = false;


// --- 3. Documentation, 2025-2026 -----------------------------------------------------
// The resources page (b52c78b0...) documents every service it describes, not only training.
MATCH (w:Webpage {unique_id: "b52c78b09f17459fa9a516f252b349c7"})
MATCH (i) WHERE i.title IN ["SFBRN Drupal PDF Accessibility Monitoring", "SFBRN Pope Tech Web Monitoring", "SFBRN Equidox Account Access and Support", "CCC Accessibility Center Courses"]
MERGE (i)-[r:is_documented_by]->(w)
ON CREATE SET r.added_date = date("2026-10-06"), r.modified_date = date("2026-10-06"),
              r.included_in_years = ["2025-2026"], r.excluded_from_years = [];

// Pope Tech monitoring: the usage page under both URLs, and the ATI landing page that links it.
MATCH (s:Service {title: "SFBRN Pope Tech Web Monitoring"})
MATCH (w:Webpage) WHERE w.url IN ["https://www.sfbrn.calstate.edu/using-pope-tech-sfbrn", "https://www.sfbrn.calstate.edu/sfbrn-web-accessibility-scanning", "https://www.sfbrn.calstate.edu/accessible"]
MERGE (s)-[r:is_documented_by]->(w)
ON CREATE SET r.added_date = date("2026-10-06"), r.modified_date = date("2026-10-06"),
              r.included_in_years = ["2025-2026"], r.excluded_from_years = [];

// Accessible Document Training: the current WebAIM registration page.
MATCH (i:Guidance {unique_id: "bce9989c1bb04d82b88f0b0ec631487b"})
MATCH (w:Webpage {url: "https://webaim.org/training/online/csu/course/registration"})
MERGE (i)-[r:is_documented_by]->(w)
ON CREATE SET r.added_date = date("2026-10-06"), r.modified_date = date("2026-10-06"),
              r.included_in_years = ["2025-2026"], r.excluded_from_years = [];


// --- 4. Evidence for SF State, 2025-2026 ---------------------------------------------
UNWIND [
  {t: "SFBRN Drupal PDF Accessibility Monitoring", y: "2025-2026-3.6-web-sfsu", s: 2,
   why: "Twice-monthly scans of Drupal and Box catch existing PDFs that do not comply, including ones changed after publication. Scanning finds them; it does not verify each change."},
  {t: "SFBRN Drupal PDF Accessibility Monitoring", y: "2025-2026-3.5-web-sfsu", s: 2,
   why: "SFBRN ATI is the body that runs ongoing monitoring of SF State documents on the web. No formal assignment record is in hand."},
  {t: "SFBRN Drupal PDF Accessibility Monitoring", y: "2025-2026-2.5-web-sfsu", s: 1,
   why: "Monitoring runs after publication, so it backs the pre-publication requirement without meeting it."},
  {t: "SFBRN Pope Tech Web Monitoring", y: "2025-2026-1.4-web-sfsu", s: 2,
   why: "Recurring Pope Tech scans of SF State public sites identify pages that need remediation. The SFBRN pages do not state the scan schedule."},
  {t: "SFBRN Pope Tech Web Monitoring", y: "2025-2026-3.5-web-sfsu", s: 2,
   why: "SFBRN administers web monitoring and assigns sites; content owners correct issues. No formal assignment record is in hand."},
  {t: "SFBRN Equidox Account Access and Support", y: "2025-2026-6.8-web-sfsu", s: 2,
   why: "Names where SF State staff go for PDF remediation accounts, training and consultation. Covers documents only, not every content type."},
  {t: "SFBRN Equidox Account Access and Support", y: "2025-2026-5.6-web-sfsu", s: 2,
   why: "Equidox onboarding and training is a document accessibility training tied to SFBRN PDF monitoring."},
  {t: "CCC Accessibility Center Courses", y: "2025-2026-5.5-web-sfsu", s: 1,
   why: "Self-paced courses open to SF State content contributors. A resource, not a campus training process."},
  {t: "CCC Accessibility Center Courses", y: "2025-2026-5.6-web-sfsu", s: 1,
   why: "Self-paced courses that include document accessibility. A resource, not a campus training process."}
] AS row
MATCH (i {title: row.t}) WHERE i:Service OR i:Guidance
MATCH (y:YearSuccessEvidence {year_identifier: row.y})
MERGE (i)-[e:is_evidence_for]->(y)
ON CREATE SET e.strength = row.s, e.control = "external", e.rationale = row.why;
