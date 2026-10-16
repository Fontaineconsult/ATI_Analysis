// =====================================================================================
// Governance pass: instruments behind the unified impact matrix research.
// Prepared 2026-10-16 for Daniel Fontaine. Not yet executed.
//
// WHY THIS PASS RAN
//   The grounding review (app/database/ontology/impact-matrix/matrix-grounding-review.md)
//   rests on laws, rulings, agency guidance and standards. 82 governance nodes already
//   existed. A dedup check against every governance title and source URL found most of
//   them present, including 28 CFR 35, the 2024 Title II rule, 34 CFR 104, the Revised
//   508 Standards, Gov Code 7405 and 11135, Ed Code 67302, EO 1111, the 2021 ATI memo,
//   the 2010 Dear Colleague Letter and 2011 FAQ, WCAG-EM 2.0, the ICT Testing Baseline,
//   VPAT 2.5Rev, EN 301 549, and the cases Penn State, South Carolina Technical College
//   System, Louisiana Tech, Miami, NAD v. Harvard, NAD v. MIT and Payan (2021). This file
//   adds only what the research cites and the graph lacks.
//
// SECTIONS
//   1. New Directive: DOJ interim final rule extending the Title II web rule dates (2026).
//      The Federal Register page moves to it from the 2024 rule node. The IFR partially
//      supersedes the 2024 rule (compliance dates only).
//   2. New Directive: DOJ "First Steps" guidance on the web rule (2025), which states the
//      vendor and contractor duty.
//   3. New Guideline: CSU ATI 2026 Title II Update, with its defenses page and its
//      Section 508 versus Title II page.
//   4. New Guideline: Section 508 Government ACR Supplement (GSA), which defines the
//      Critical / Major / Minor severity levels.
//   5. New Guideline: DHS Trusted Tester Process (v5).
//   6. Existing Directive "Section508.gov Guidance on Accessibility in Procurement": six
//      more source pages the research relied on, plus the existing risk-model page.
//   7. New Case: NFB and ACB v. Arizona Board of Regents (Kindle DX, 2010).
//   8. New Case: University of Montana (OCR 10-12-2118, 2014).
//   9. New Case: Youngstown State University (OCR 15-13-6002, 2014).
//  10. New Case: Payan v. LACCD (9th Cir. 2026), the damages decision.
//  11. New Case: Brennon B. v. Superior Court (Cal. 2022).
//  12. Duplicates, consolidated by the 2026-10-06 rule (one keeper; edges move to it;
//      the twin stays, marked duplicate_of, so its id still resolves; nothing deleted):
//      a. Revised 508 Standards: keeper Directive d072e062 (a regulation, like 28 CFR 35);
//         twin Guideline 6b77ff3b.
//      b. EO 1111: keeper Directive ae342354 (holds the principle groundings and the
//         supersedes edge to EO 926); twin ExternalPolicy af238d76.
//      c. WCAG-EM: keeper IntellectualSource 9a1f2f09 (a W3C Group Note that binds no
//         one, with ten sources); twin Guideline 49ef5c2c.
//      The Section 508 statute twin (df2cce7f) was already consolidated on 2026-10-06.
//  13. New IntellectualSource nodes: the scoring-method sources behind the review. They
//      carry no authority, so they are not governance.
//
// VERIFIED IN THIS SESSION
//   - IFR title, dates and the sentence "The amendments do not alter any other provisions
//     of the 2024 final rule", from the public-inspection PDF. federalregister.gov itself
//     answered with a bot check, which was not bypassed.
//   - Payan (9th Cir. 2026): decided 2026-03-11; "we reverse, vacate, and remand with
//     instructions to reinstate the jury's damages award" (FindLaw).
//   - DOJ First Steps title and 2025-01-08 date; GSA ACR Supplement title and severity
//     definitions; Trusted Tester v5 (section508.gov).
//   Not re-verified here, taken from the research passes: the ASU, Montana and Youngstown
//   agreement terms; the CSU Title II Update pages (403 to this session); Brennon B.
//   (Justia returned 403, so its decision date is left unset).
//
// NOT DONE, AND WHY
//   - HHS Section 504 rule (45 CFR 84). The 2026-10-06 governance pass recorded the
//     decision to add ED's 34 CFR 104 only. This file keeps to that decision.
//   - DOJ letters to Case Western, Pace and Reed (2010). They repeat the ASU terms.
//   - The 2016-2018 OCR web agreements. They are hundreds of template agreements, not
//     one instrument.
//   - Peer university policies (Illinois, Ohio State, Michigan, Arizona and others) and
//     the European Accessibility Act. Offered as a separate pass.
//   - informs / drives / derives_from edges. derives_from is the next conversation;
//     drives needs quoted raw_text.
//   - The Deque axe impact levels and the World Privacy Forum's AIA critique. The first
//     is a vendor describing its own product; the second only critiques a source that
//     is added here.
//   - Keeper titles and dates are not changed, except the 508 Standards title, which
//     gains the CFR part so the keeper is findable under either name.
//
// SOURCE TEXT
//   raw_text never goes in a batch file. Source text for the new pages is filled
//   afterwards through /get-source-text.
//
// VALIDATE FIRST
//   python -m app.database.cypher_runner.run_file app/database/batch/auto-assignments/curate_2026_10_16_governance_impact_matrix_grounding.cypher
//   python -m app.database.cypher_runner.run_file app/database/batch/auto-assignments/curate_2026_10_16_governance_impact_matrix_grounding.cypher --execute
// =====================================================================================


// --- 1. DOJ interim final rule (2026) ------------------------------------------------
MERGE (n:Directive {title: "DOJ Interim Final Rule: Extension of Title II Web and Mobile Compliance Dates (2026)"})
ON CREATE SET n.unique_id = replace(randomUUID(), '-', '')
SET n.description = "Department of Justice interim final rule, FR Doc. 2026-07663 (RIN 1190-AA82), amending 28 CFR 35.200(b). It moves the compliance date for public entities with a total population of 50,000 or more from April 24, 2026 to April 26, 2027, and for smaller entities and special districts from April 26, 2027 to April 26, 2028. It changes no other provision of the 2024 rule. A CSU campus falls in the 50,000-or-more group because its population is the State's.",
    n.effective_date = date("2026-04-20"),
    n.source_institution = "U.S. Department of Justice, Civil Rights Division";

MATCH (r24:Directive {unique_id: "63c25f78f69b4bc0b0db52da6df7fec4"})-[e:is_sourced_from]->(w:Webpage {unique_id: "2351f2888e8f4a2eb5fc39612c9ea641"})
DELETE e;

MATCH (n:Directive {title: "DOJ Interim Final Rule: Extension of Title II Web and Mobile Compliance Dates (2026)"})
MATCH (w:Webpage {unique_id: "2351f2888e8f4a2eb5fc39612c9ea641"})
MERGE (n)-[r:is_sourced_from]->(w)
ON CREATE SET r.added_date = date("2026-10-16");

MATCH (n:Directive {title: "DOJ Interim Final Rule: Extension of Title II Web and Mobile Compliance Dates (2026)"})
MERGE (s:Document {hash: "96a48ceefb430cce655ff0ab74fa3b109f29aef6"})
ON CREATE SET s.unique_id = replace(randomUUID(), '-', ''),
    s.name = "Extension of Compliance Dates, Title II Web and Mobile Rule: Interim Final Rule (Federal Register public inspection)",
    s.uri_path = "https://public-inspection.federalregister.gov/2026-07663.pdf",
    s.include_in_report = true
MERGE (n)-[r:is_sourced_from]->(s)
ON CREATE SET r.added_date = date("2026-10-16");

MATCH (ifr:Directive {title: "DOJ Interim Final Rule: Extension of Title II Web and Mobile Compliance Dates (2026)"})
MATCH (r24:Directive {unique_id: "63c25f78f69b4bc0b0db52da6df7fec4"})
MERGE (ifr)-[s:supersedes]->(r24)
ON CREATE SET s.scope = "partial", s.added_date = date("2026-10-16"),
              s.quote = "The compliance date for State and local government entities with a total population of 50,000 or more is extended from April 24, 2026, to April 26, 2027.",
              s.note = "Replaces only the compliance dates in 28 CFR 35.200(b). The IFR states: \"The amendments do not alter any other provisions of the 2024 final rule.\"";


// --- 2. DOJ First Steps guidance (2025) ----------------------------------------------
MERGE (n:Directive {title: "DOJ First Steps Toward Complying with the Title II Web and Mobile Rule (2025)"})
ON CREATE SET n.unique_id = replace(randomUUID(), '-', '')
SET n.description = "Department of Justice guidance for state and local governments on starting compliance with the 2024 Title II web and mobile rule. It states that a public entity must make sure content or mobile apps a vendor or contractor provides or posts on its behalf conform to WCAG 2.1 Level AA. It recommends contract terms that require accessibility information, warranties and indemnification.",
    n.effective_date = date("2025-01-08"),
    n.source_institution = "U.S. Department of Justice, Civil Rights Division";

MATCH (n:Directive {title: "DOJ First Steps Toward Complying with the Title II Web and Mobile Rule (2025)"})
MERGE (s:Webpage {url: "https://www.ada.gov/resources/web-rule-first-steps/"})
ON CREATE SET s.unique_id = replace(randomUUID(), '-', ''),
    s.name = "State and Local Governments: First Steps Toward Complying with the ADA Title II Web and Mobile Application Accessibility Rule (ADA.gov)",
    s.include_in_report = true
MERGE (n)-[r:is_sourced_from]->(s)
ON CREATE SET r.added_date = date("2026-10-16");


// --- 3. CSU ATI 2026 Title II Update -------------------------------------------------
MERGE (n:Guideline {title: "CSU ATI 2026 Title II Update"})
ON CREATE SET n.unique_id = replace(randomUUID(), '-', '')
SET n.description = "CSU Accessible Technology Initiative guidance on the Title II web and mobile rule after the 2026 extension. It gives the April 26, 2027 compliance date. It reads the fundamental alteration and undue burden defenses as decided at the entity level, with all resources counted and high cost alone not enough. It reads minimal impact under 28 CFR 35.205 as failing when users must rely on assistance, alternate processes or workarounds. It assigns web content and mobile apps to Title II and non-web software and hardware to Section 508.";

MATCH (n:Guideline {title: "CSU ATI 2026 Title II Update"})
MERGE (s:Webpage {url: "https://ati.calstate.edu/policy/2026-title-ii-update"})
ON CREATE SET s.unique_id = replace(randomUUID(), '-', ''),
    s.name = "2026 Title II Update (CSU ATI)",
    s.include_in_report = true
MERGE (n)-[r:is_sourced_from]->(s)
ON CREATE SET r.added_date = date("2026-10-16");

MATCH (n:Guideline {title: "CSU ATI 2026 Title II Update"})
MERGE (s:Webpage {url: "https://ati.calstate.edu/policy/2026-title-ii-update/defenses-and-limitations"})
ON CREATE SET s.unique_id = replace(randomUUID(), '-', ''),
    s.name = "2026 Title II Update: Defenses and Limitations (CSU ATI)",
    s.include_in_report = true
MERGE (n)-[r:is_sourced_from]->(s)
ON CREATE SET r.added_date = date("2026-10-16");

MATCH (n:Guideline {title: "CSU ATI 2026 Title II Update"})
MERGE (s:Webpage {url: "https://ati.calstate.edu/policy/2026-title-ii-update/section-508-vs-title-ii"})
ON CREATE SET s.unique_id = replace(randomUUID(), '-', ''),
    s.name = "2026 Title II Update: Section 508 vs. Title II (CSU ATI)",
    s.include_in_report = true
MERGE (n)-[r:is_sourced_from]->(s)
ON CREATE SET r.added_date = date("2026-10-16");


// --- 4. Section 508 Government ACR Supplement ----------------------------------------
MERGE (n:Guideline {title: "Section 508 Government ACR Supplement (GSA)"})
ON CREATE SET n.unique_id = replace(randomUUID(), '-', '')
SET n.description = "GSA template that asks vendors to supplement an Accessibility Conformance Report with an Issue Detail Supplement. Each issue records a severity, the affected screen or workflow, the impacted functional performance group, and any workaround. Severity has three levels: Critical prevents access to or completion of core functionality; Major substantially impairs important functionality but a workaround allows completion; Minor does not prevent completion of core tasks.",
    n.last_updated = date("2026-10-01");

MATCH (n:Guideline {title: "Section 508 Government ACR Supplement (GSA)"})
MERGE (s:Webpage {url: "https://www.section508.gov/sell/acr-supplement/"})
ON CREATE SET s.unique_id = replace(randomUUID(), '-', ''),
    s.name = "Section 508 Government ACR Supplement (Section508.gov)",
    s.include_in_report = true
MERGE (n)-[r:is_sourced_from]->(s)
ON CREATE SET r.added_date = date("2026-10-16");


// --- 5. DHS Trusted Tester -----------------------------------------------------------
MERGE (n:Guideline {title: "DHS Trusted Tester Process (v5)"})
ON CREATE SET n.unique_id = replace(randomUUID(), '-', '')
SET n.description = "A manual test process run by the Department of Homeland Security that aligns with the Section 508 ICT Testing Baseline. Certified testers record each test as Pass, Fail, Does Not Apply or Not Tested. Version 5 is current.";

MATCH (n:Guideline {title: "DHS Trusted Tester Process (v5)"})
MERGE (s:Webpage {url: "https://www.section508.gov/test/trusted-tester/"})
ON CREATE SET s.unique_id = replace(randomUUID(), '-', ''),
    s.name = "DHS Trusted Tester Process & Certification Program (Section508.gov)",
    s.include_in_report = true
MERGE (n)-[r:is_sourced_from]->(s)
ON CREATE SET r.added_date = date("2026-10-16");


// --- 6. Section508.gov procurement guidance: more source pages ------------------------
UNWIND [
  {url: "https://www.section508.gov/buy/understand-claims/", name: "Understand Vendor Accessibility Claims (Section508.gov)"},
  {url: "https://www.section508.gov/buy/request-accessibility-information/", name: "Request Accessibility Information from Vendors (Section508.gov)"},
  {url: "https://www.section508.gov/buy/understanding-section-508-exceptions/", name: "Understanding Section 508 Exceptions (Section508.gov)"},
  {url: "https://www.section508.gov/manage/playbooks/technology-accessibility-playbook/8/", name: "Technology Accessibility Playbook, Play 8: Integrate Accessibility into the Acquisition Process (Section508.gov)"},
  {url: "https://www.section508.gov/test/testing-lifecycle-overview/", name: "Accessibility Testing Lifecycle Overview (Section508.gov)"},
  {url: "https://www.section508.gov/test/elements-of-an-accessibility-test-report/", name: "Elements of an Accessibility Test Report (Section508.gov)"},
  {url: "https://www.section508.gov/blog/Accessibility-risk-management-and-model/", name: "Accessibility Risk Management and Model (Section508.gov)"}
] AS p
MATCH (n:Directive {unique_id: "34a1e0763aaa4b2c80dfb8cc672fbb36"})
MERGE (s:Webpage {url: p.url})
ON CREATE SET s.unique_id = replace(randomUUID(), '-', ''),
    s.name = p.name,
    s.include_in_report = true
MERGE (n)-[r:is_sourced_from]->(s)
ON CREATE SET r.added_date = date("2026-10-16");


// --- 7. ASU Kindle DX (2010) ---------------------------------------------------------
MERGE (n:Case {title: "National Federation of the Blind and American Council of the Blind v. Arizona Board of Regents (D. Ariz. settlement, 2010)"})
ON CREATE SET n.unique_id = replace(randomUUID(), '-', '')
SET n.description = "Blind students' organizations sued over Arizona State University's pilot of the Kindle DX e-reader in courses, because its menus and controls could not be used without sight. The pilot involved a small number of devices. The case was settled with the Department of Justice participating.",
    n.ruling = "Under the settlement, if Arizona State uses dedicated e-readers in a course it must use devices that blind students can use, where such devices are commercially available at a reasonable cost.",
    n.legislative_authority = "U.S. District Court for the District of Arizona; U.S. Department of Justice";

MATCH (n:Case {title: "National Federation of the Blind and American Council of the Blind v. Arizona Board of Regents (D. Ariz. settlement, 2010)"})
MERGE (s:Webpage {url: "https://archive.ada.gov/arizona_state_university.htm"})
ON CREATE SET s.unique_id = replace(randomUUID(), '-', ''),
    s.name = "Settlement Agreement: NFB and ACB v. Arizona Board of Regents (ADA.gov archive)",
    s.include_in_report = true
MERGE (n)-[r:is_sourced_from]->(s)
ON CREATE SET r.added_date = date("2026-10-16");


// --- 8. University of Montana (2014) -------------------------------------------------
MERGE (n:Case {title: "University of Montana (OCR Docket No. 10-12-2118, 2014)"})
ON CREATE SET n.unique_id = replace(randomUUID(), '-', '')
SET n.description = "An Office for Civil Rights resolution agreement after a complaint about inaccessible electronic and information technology at the University of Montana, including course materials and the learning management system.",
    n.effective_date = date("2014-03-07"),
    n.ruling = "The university agreed to buy or recommend only technology that gives people with disabilities the same programs, benefits and services, except where that would fundamentally alter the program or is not technically feasible, and then to provide accessible alternative technology. Purchase requests must require WCAG 2.0 AA and Section 508. Purchasing staff must be trained, and the procedures reported to OCR.",
    n.legislative_authority = "U.S. Department of Education, Office for Civil Rights";

MATCH (n:Case {title: "University of Montana (OCR Docket No. 10-12-2118, 2014)"})
MERGE (s:Document {hash: "6f8625d772d3b27292a085afc60186105b8839aa"})
ON CREATE SET s.unique_id = replace(randomUUID(), '-', ''),
    s.name = "Resolution Agreement, University of Montana, OCR Docket No. 10-12-2118 (March 7, 2014)",
    s.uri_path = "https://www.umt.edu/accessibility/docs/agreementresolution_march_7_2014.pdf",
    s.include_in_report = true
MERGE (n)-[r:is_sourced_from]->(s)
ON CREATE SET r.added_date = date("2026-10-16");


// --- 9. Youngstown State (2014) ------------------------------------------------------
MERGE (n:Case {title: "Youngstown State University (OCR Compliance Review No. 15-13-6002, 2014)"})
ON CREATE SET n.unique_id = replace(randomUUID(), '-', '')
SET n.description = "An Office for Civil Rights compliance review of the accessibility of Youngstown State University's websites and electronic and information technology, resolved by agreement.",
    n.ruling = "The university's technology plan must include a procedure so that any acquisition or use of technology and third-party websites, services or products gives people with disabilities equal opportunity. It requires regular audits, annual training, and certification of conformance by a qualified reviewer. It defines accessible as obtaining information as fully, equally and independently as a person without a disability.",
    n.legislative_authority = "U.S. Department of Education, Office for Civil Rights";

MATCH (n:Case {title: "Youngstown State University (OCR Compliance Review No. 15-13-6002, 2014)"})
MERGE (s:Document {hash: "0ed18dd417198732dab3fbf7dabe941a7307920f"})
ON CREATE SET s.unique_id = replace(randomUUID(), '-', ''),
    s.name = "Resolution Agreement, Youngstown State University, OCR Compliance Review No. 15-13-6002",
    s.uri_path = "https://ysu.edu/sites/default/files/accessibility/Resolution_Agreement_OCR_Compliance_Review.pdf",
    s.include_in_report = true
MERGE (n)-[r:is_sourced_from]->(s)
ON CREATE SET r.added_date = date("2026-10-16");


// --- 10. Payan (9th Cir. 2026) -------------------------------------------------------
MERGE (n:Case {title: "Payan v. Los Angeles Community College District (9th Cir. 2026)"})
ON CREATE SET n.unique_id = replace(randomUUID(), '-', '')
SET n.description = "The second Ninth Circuit decision in the Payan case. Blind students at a California community college had won a jury verdict under ADA Title II over inaccessible course materials, software and websites, including MyMathLab. After the 2021 remand the district court reduced the damages, and the students appealed.",
    n.effective_date = date("2026-03-11"),
    n.ruling = "The Ninth Circuit reversed, vacated and remanded with instructions to reinstate the jury's damages award of $218,500 to Payan and $24,000 to Mason.",
    n.legislative_authority = "U.S. Court of Appeals for the Ninth Circuit";

MATCH (n:Case {title: "Payan v. Los Angeles Community College District (9th Cir. 2026)"})
MERGE (s:Webpage {url: "https://caselaw.findlaw.com/court/us-9th-circuit/118211846.html"})
ON CREATE SET s.unique_id = replace(randomUUID(), '-', ''),
    s.name = "Payan v. Los Angeles Community College District (9th Cir. 2026) (FindLaw)",
    s.include_in_report = true
MERGE (n)-[r:is_sourced_from]->(s)
ON CREATE SET r.added_date = date("2026-10-16");


// --- 11. Brennon B. (Cal. 2022) ------------------------------------------------------
MERGE (n:Case {title: "Brennon B. v. Superior Court (Cal. 2022)"})
ON CREATE SET n.unique_id = replace(randomUUID(), '-', '')
SET n.description = "A California Supreme Court decision on whether a public school district is a business establishment under the Unruh Civil Rights Act. It bears on whether Unruh reaches public universities such as the CSU. Vendors that sell to the CSU remain business establishments.",
    n.ruling = "The court held that a public school district is not a business establishment within the meaning of the Unruh Civil Rights Act.",
    n.legislative_authority = "Supreme Court of California";

MATCH (n:Case {title: "Brennon B. v. Superior Court (Cal. 2022)"})
MERGE (s:Webpage {url: "https://law.justia.com/cases/california/supreme-court/2022/s266254.html"})
ON CREATE SET s.unique_id = replace(randomUUID(), '-', ''),
    s.name = "Brennon B. v. Superior Court, S266254 (Cal. 2022) (Justia)",
    s.include_in_report = true
MERGE (n)-[r:is_sourced_from]->(s)
ON CREATE SET r.added_date = date("2026-10-16");


// --- 12. Duplicates --------------------------------------------------------------------
// Move each twin's source edges to its keeper (keeping added_date), delete the twin's
// copy of the edge, then mark the twin duplicate_of the keeper.

// 12a. Revised 508 Standards
MATCH (k:Directive {unique_id: "d072e0621c544cd9b08c1f739574c44d"})
SET k.title = "Revised Section 508 Standards and Section 255 Guidelines (36 CFR Part 1194) (2017)";

MATCH (t:Guideline {unique_id: "6b77ff3bdbb449a5a309d76779e839f8"})-[e:is_sourced_from]->(s)
MATCH (k:Directive {unique_id: "d072e0621c544cd9b08c1f739574c44d"})
MERGE (k)-[r:is_sourced_from]->(s)
ON CREATE SET r.added_date = e.added_date
DELETE e;

MATCH (t:Guideline {unique_id: "6b77ff3bdbb449a5a309d76779e839f8"})
MATCH (k:Directive {unique_id: "d072e0621c544cd9b08c1f739574c44d"})
MERGE (t)-[d:duplicate_of]->(k)
ON CREATE SET d.added_date = date("2026-10-16"),
              d.note = "Same instrument: the Access Board's 2017 ICT final rule, 36 CFR Part 1194. Kept as a Directive because it is a regulation.";

// 12b. EO 1111
MATCH (t:ExternalPolicy {unique_id: "af238d7600c44f64a2b31e0e480bb1ff"})-[e:is_sourced_from]->(s)
MATCH (k:Directive {unique_id: "ae34235450c4443b8b4298540b677903"})
MERGE (k)-[r:is_sourced_from]->(s)
ON CREATE SET r.added_date = e.added_date
DELETE e;

MATCH (t:ExternalPolicy {unique_id: "af238d7600c44f64a2b31e0e480bb1ff"})
MATCH (k:Directive {unique_id: "ae34235450c4443b8b4298540b677903"})
MERGE (t)-[d:duplicate_of]->(k)
ON CREATE SET d.added_date = date("2026-10-16"),
              d.note = "Same instrument: the Board of Trustees policy is issued as Executive Order 1111 (2018-05-23). Both nodes cited the same EO 1111 PDF.";

// 12c. WCAG-EM
MATCH (t:Guideline {unique_id: "49ef5c2c99f24ecd8b8b3687199a7dbd"})-[e:is_sourced_from]->(s)
MATCH (k:IntellectualSource {unique_id: "9a1f2f0909344a98a8064c6bf081bdd5"})
MERGE (k)-[r:is_sourced_from]->(s)
ON CREATE SET r.added_date = e.added_date
DELETE e;

MATCH (t:Guideline {unique_id: "49ef5c2c99f24ecd8b8b3687199a7dbd"})
MATCH (k:IntellectualSource {unique_id: "9a1f2f0909344a98a8064c6bf081bdd5"})
MERGE (t)-[d:duplicate_of]->(k)
ON CREATE SET d.added_date = date("2026-10-16"),
              d.note = "Same work: W3C's WCAG Evaluation Methodology. It is a Group Note that defines no requirements and binds no one, so it is kept as an IntellectualSource.";


// --- 13. Scoring-method sources (IntellectualSource) ------------------------------------
UNWIND [
  {name: "Cox, What's Wrong with Risk Matrices? (2008)",
   author: "Louis Anthony Cox Jr.", publisher: "Risk Analysis (Society for Risk Analysis)",
   citation: "Cox, L. A. (2008). What's wrong with risk matrices? Risk Analysis, 28(2), 497-512.",
   url: "https://doi.org/10.1111/j.1539-6924.2008.01030.x",
   short: "Risk matrices compress range, can rank a smaller risk above a larger one, and are consistent only when they meet three design axioms.",
   full: "Cox shows that a risk matrix can correctly compare only a small share of pairs of risks, and can give opposite ratings to the same risk depending on the rater. He sets out three axioms a consistent matrix must meet: weak consistency, betweenness, and consistent colouring. The impact matrix uses them to test its outcome grid cell by cell."},
  {name: "Thomas, Bratvold and Bickel, The Risk of Using Risk Matrices (2014)",
   author: "Philip Thomas; Reidar B. Bratvold; J. Eric Bickel", publisher: "SPE Economics & Management",
   citation: "Thomas, P., Bratvold, R. B., & Bickel, J. E. (2014). The risk of using risk matrices. SPE Economics & Management, 6(2), 56-66.",
   url: "https://maverisk.nl/wp-content/uploads/TheRiskofUsingRiskMatrices.pdf",
   short: "The design choices in a risk matrix, such as bin edges and scale direction, change its rankings, and no published evidence shows matrices improve decisions.",
   full: "The authors name ranking reversal, instability from categorization and the lie factor as flaws inherent to risk matrices. They report centering bias in ratings and ask how a user knows the tool works. The impact matrix answers that question with a pilot against expert judgment and published cut points."},
  {name: "Krisper, Problems with Risk Matrices Using Ordinal Scales (2021)",
   author: "Michael Krisper", publisher: "arXiv",
   citation: "Krisper, M. (2021). Problems with risk matrices using ordinal scales. arXiv:2103.05440.",
   url: "https://arxiv.org/abs/2103.05440",
   short: "Arithmetic on ordinal codes adds precision the inputs do not have.",
   full: "Krisper catalogues problems with ordinal risk matrices, including semi-quantitative arithmetic and the neglect of uncertainty. It is the basis for treating a weighted sum of Low, Medium and High codes with care and for reporting unknowns separately."},
  {name: "Dodgson et al., Multi-criteria Analysis: A Manual (DCLG 2009)",
   author: "J. S. Dodgson; M. Spackman; A. Pearman; L. D. Phillips", publisher: "Department for Communities and Local Government (UK)",
   citation: "Dodgson, J. S., Spackman, M., Pearman, A., & Phillips, L. D. (2009). Multi-criteria analysis: a manual. London: Department for Communities and Local Government.",
   url: "https://eprints.lse.ac.uk/12761/",
   short: "A weighted sum is valid only when criteria are independent and nothing is counted twice; a minimum hurdle is a valid alternative where trade-offs are unacceptable.",
   full: "The manual sets the conditions for weighted additive scoring: mutual preference independence, no double counting, and swing weights derived from each criterion's range. It gives a test for double counting and recognises minimum hurdles that better scores elsewhere cannot offset. The impact matrix uses it to merge overlapping factors into groups, derive weights by swing weighting, and justify floors."},
  {name: "Keeney and Raiffa, Decisions with Multiple Objectives (1976)",
   author: "Ralph L. Keeney; Howard Raiffa", publisher: "John Wiley & Sons",
   citation: "Keeney, R. L., & Raiffa, H. (1976). Decisions with Multiple Objectives: Preferences and Value Tradeoffs. New York: Wiley.",
   url: null,
   short: "The foundational account of multi-attribute value theory, including independence conditions and swing weighting.",
   full: "Keeney and Raiffa set out when several attributes can be combined into one additive score and how weights should reflect the range of each attribute. The DCLG manual applies their method to public decisions."},
  {name: "Cinelli, Coles and Kirwan, Multi-criteria Decision Analysis Methods for Sustainability Assessment (2014)",
   author: "Marco Cinelli; Stuart R. Coles; Kerry Kirwan", publisher: "Ecological Indicators",
   citation: "Cinelli, M., Coles, S. R., & Kirwan, K. (2014). Analysis of the potentials of multi criteria decision analysis methods to conduct sustainability assessment. Ecological Indicators, 46, 138-148.",
   url: "https://wrap.warwick.ac.uk/id/eprint/61956/",
   short: "Compares compensatory methods with outranking methods such as ELECTRE, whose veto thresholds remove an option that fails badly on one criterion.",
   full: "The paper contrasts additive methods, which allow weak trade-offs, with ELECTRE's strong, non-compensatory veto. It supports treating the matrix floors as vetoes that the points cannot dilute."},
  {name: "AIAG and VDA, FMEA Handbook (2019)",
   author: "Automotive Industry Action Group; Verband der Automobilindustrie", publisher: "AIAG and VDA",
   citation: "AIAG & VDA. (2019). Failure Mode and Effects Analysis: FMEA Handbook. Southfield, MI: AIAG.",
   url: "https://quasist.com/fmea/action-priority-in-fmea/",
   short: "Replaced the multiplied risk priority number with action-priority tables in which the highest severity is high priority regardless of likelihood or detection.",
   full: "The 2019 handbook dropped severity times occurrence times detection because the product let severe, rare failures score low and invited gaming. Severity 9 and 10 now sets high priority on its own. The impact matrix follows the same reasoning: S3 on a core task is never Approve, and impact and severity are not multiplied. The url is a summary; the handbook itself is sold by AIAG."},
  {name: "Article 29 Working Party, Guidelines on Data Protection Impact Assessment (WP248 rev.01, 2017)",
   author: "Article 29 Data Protection Working Party", publisher: "European Commission (endorsed by the European Data Protection Board)",
   citation: "Article 29 Data Protection Working Party. (2017). Guidelines on Data Protection Impact Assessment (DPIA) and determining whether processing is likely to result in a high risk. WP248 rev.01.",
   url: "https://keepabl.com/news/edpb-guidance-dpias-9-criteria/",
   short: "Screens for high risk with nine criteria: meeting two usually requires an assessment, and in some cases one is enough.",
   full: "The guidelines are a screening rule built from a count of triggers, with single triggers sufficient in some cases. They bind EU data controllers, not the CSU, and are used here only as a model for floors written as facts. The url is a summary of the guidelines."},
  {name: "Treasury Board of Canada Secretariat, Algorithmic Impact Assessment",
   author: null, publisher: "Treasury Board of Canada Secretariat",
   citation: "Treasury Board of Canada Secretariat. Algorithmic Impact Assessment tool, under the Directive on Automated Decision-Making.",
   url: "https://www.canada.ca/en/government/system/digital-government/digital-government-innovations/responsible-use-ai/algorithmic-impact-assessment.html",
   short: "A points questionnaire that sets an impact level from percent-of-maximum bands, keeps mitigation separate from impact, and ties each level to process requirements.",
   full: "The tool scores 65 risk questions and 41 mitigation questions and reads the raw score as a percent of the maximum, banded into four levels. Each level sets requirements such as peer review and human decision-making rather than a verdict. The impact matrix copies the percent-of-maximum reading, the separation of mitigation from impact, and levels that set who reviews and signs. It avoids the tool's lack of single-item overrides and its unexplained weights."},
  {name: "Hubbard, The Failure of Risk Management (2009)",
   author: "Douglas W. Hubbard", publisher: "John Wiley & Sons",
   citation: "Hubbard, D. W. (2009). The Failure of Risk Management: Why It's Broken and How to Fix It. Hoboken, NJ: Wiley.",
   url: null,
   short: "Ordinal risk scores are rarely tested against outcomes, and raters cluster their answers in the middle of a scale.",
   full: "Hubbard reports that most ratings on 1-to-5 scales fall on 3 or 4 and argues that a scoring method must show it improves decisions. The impact matrix responds with fact-based anchors and a validation pilot."},
  {name: "Krippendorff, Content Analysis: An Introduction to Its Methodology (2004)",
   author: "Klaus Krippendorff", publisher: "Sage Publications",
   citation: "Krippendorff, K. (2004). Content Analysis: An Introduction to Its Methodology (2nd ed.). Thousand Oaks, CA: Sage.",
   url: null,
   short: "Sets the convention of relying on agreement of alpha 0.800 or higher, with 0.667 to 0.800 for tentative conclusions.",
   full: "Krippendorff's alpha measures agreement among raters for nominal, ordinal and interval data. The impact matrix pilot uses ordinal alpha and these thresholds as its agreement targets."},
  {name: "Landis and Koch, The Measurement of Observer Agreement for Categorical Data (1977)",
   author: "J. Richard Landis; Gary G. Koch", publisher: "Biometrics",
   citation: "Landis, J. R., & Koch, G. G. (1977). The measurement of observer agreement for categorical data. Biometrics, 33(1), 159-174.",
   url: null,
   short: "The widely used bands for interpreting kappa, in which 0.61 to 0.80 is substantial agreement.",
   full: "Landis and Koch give the conventional labels for kappa values. They are a reference point for reading the pilot's agreement results alongside Krippendorff's thresholds."},
  {name: "Brajnik, Barrier Walkthrough",
   author: "Giorgio Brajnik", publisher: "University of Udine",
   citation: "Brajnik, G. Barrier Walkthrough: heuristic evaluation guided by accessibility barriers. University of Udine.",
   url: "https://people.uniud.it/node/3464",
   short: "Grades an accessibility barrier as minor, significant or critical from its impact on the user's goal and how often it recurs on the way to that goal.",
   full: "The method judges barriers against user goals rather than against criteria in isolation. Impact is how far the goal cannot be achieved, and persistence is how often the barrier recurs. It supports defining severity by task completion and raising a recurring barrier one level."},
  {name: "Brajnik, Yesilada and Harper, Testability and Validity of WCAG 2.0: The Expertise Effect (2010)",
   author: "Giorgio Brajnik; Yeliz Yesilada; Simon Harper", publisher: "ASSETS 2010, ACM",
   citation: "Brajnik, G., Yesilada, Y., & Harper, S. (2010). Testability and validity of WCAG 2.0: the expertise effect. Proceedings of ASSETS 2010. ACM.",
   url: "https://research.manchester.ac.uk/en/publications/testability-and-validity-of-wcag-20-the-expertise-effect/",
   short: "Expert evaluators agree more than novices on WCAG 2.0 judgments, and many success criteria fall short of 80 percent agreement.",
   full: "The study measured how consistently evaluators apply WCAG 2.0. Its results set realistic agreement targets for severity ratings, which the impact matrix pilot places lower than its targets for fact-based exposure ratings."},
  {name: "NYU Accessibility Testing Standards: Severity Levels",
   author: null, publisher: "New York University, Digital Accessibility",
   citation: "New York University. Accessibility testing standards: severity.",
   url: "https://digitalaccessibility.nyu.edu/testing/severity.html",
   short: "Defines critical severity as a barrier likely to stop users completing a task with no alternative known to them.",
   full: "NYU's scale grades issues by their effect on task completion and on whether users know a way around them. It is one of the anchors for the matrix's S0 to S3 definitions."}
] AS src
MERGE (n:IntellectualSource {name: src.name})
ON CREATE SET n.unique_id = replace(randomUUID(), '-', '')
SET n.author = src.author,
    n.publisher = src.publisher,
    n.citation = src.citation,
    n.url = src.url,
    n.description_short = src.short,
    n.description_full = src.full;
