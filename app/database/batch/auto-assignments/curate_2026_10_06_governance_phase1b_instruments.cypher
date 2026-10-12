// =====================================================================================
// Governance pass, Phase 1b: the missing instruments and their primary sources.
// Run 2026-10-06 by Daniel Fontaine. Follows Phase 1a (consolidation).
// User decision: add ED's Section 504 regulation (34 CFR 104) only, not HHS 45 CFR 84.
//
// WHY THIS PASS RAN
//   The presentation (Title II as the spine; procurement and web alongside; 504 and
//   Title I as the complications) needs every instrument it cites to exist in the graph
//   with primary text behind it. Before this file:
//     - ADA Title I had no node: no statute, no EEOC regulation.
//     - "Americans with Disabilities Act Title II" (e668e219) conflated three instruments:
//       statute title, 2010-regulation description and date, 2024-rule section and source.
//     - Section 504 had no regulation and no text.
//     - The 2010 Title II regulation node had no text.
//     - EO 1111 had no text and no supersedes edge to EO 926.
//
// SECTIONS
//   1. e668e219 becomes the Title II statute (42 U.S.C. 12131-12134). Its 2024-rule page
//      moves to the 2024 rule node. Cornell LII sources for 12131-12134.
//   2. New Law: ADA Title I (42 U.S.C. 12111-12117), with Cornell sources.
//   3. New Directive: EEOC ADA Title I Regulation (29 CFR Part 1630), eCFR source.
//   4. New Directive: ED Section 504 Regulation (34 CFR Part 104), eCFR source.
//   5. Section 504 statute: Cornell source for 29 U.S.C. 794.
//   6. 2010 Title II regulation: eCFR source for 28 CFR Part 35.
//   7. EO 1111 supersedes EO 926 (its cover memo and header both say so).
//
// SOURCE TEXT (written after this file, not in it)
//   raw_text never goes in a batch file. Each source page above, plus EO 1111's PDF
//   (calstatela.edu copy), gets raw_text and raw_text_captured through neo4j-cli,
//   extracted 2026-10-06:
//     Cornell LII statute pages: main content; defined-term links reduced to text.
//     eCFR parts 104 and 1630: the whole part, including 1630's Interpretive Guidance.
//     eCFR part 35: regulation text only, cut at "Appendix A to Part 35". The appendices
//       (DOJ guidance and section-by-section analysis, about 1.5M chars) are left out;
//       the 2024 rule's own Federal Register page already holds its analysis. The current
//       eCFR text includes subpart H, added by the 2024 rule.
//     EO 1111: pypdf text of the 10-page PDF, including the 2018-05-23 cover memo.
//
// NOT DONE, AND WHY
//   - Gov Code 11135 text. leginfo, Justia and FindLaw all refuse automated fetches, and
//     Justia's challenge page is a bot check this run does not bypass. Manual paste.
//   - The 2024 ATI policy's PolicyStat text. It matches the 2021 memo's text, which the
//     memo node already holds (18,893 chars). Optional.
//   - Statute-to-regulation edges (implements). No relationship type exists for it yet.
//   - The eight derives_from edges to e668e219 keep their 2026-10-06 grounding properties,
//     whose rationales say "This node conflates...". Phase 3 re-points or rewrites them now
//     that the statute and both regulations are separate.
//
// VALIDATE FIRST
//   python -m app.database.cypher_runner.run_file app/database/batch/auto-assignments/curate_2026_10_06_governance_phase1b_instruments.cypher
//   python -m app.database.cypher_runner.run_file app/database/batch/auto-assignments/curate_2026_10_06_governance_phase1b_instruments.cypher --execute
// =====================================================================================


// --- 1. Title II statute -------------------------------------------------------------
MATCH (t:Law {unique_id: "e668e2199b7e4927b548c179e4bf4b27"})
SET t.title = "Americans with Disabilities Act Title II (42 U.S.C. 12131-12134)",
    t.description = "Title II, Subtitle A of the ADA. No qualified individual with a disability shall, by reason of disability, be excluded from participation in or denied the benefits of the services, programs, or activities of a public entity, or be subjected to discrimination by it. The Department of Justice implements it through 28 CFR Part 35.",
    t.effective_date = date("1992-01-26"),
    t.legislative_authority = "United States Congress",
    t.relevant_sections = "Title II, Subtitle A (42 U.S.C. 12131-12134)";

MATCH (t:Law {unique_id: "e668e2199b7e4927b548c179e4bf4b27"})-[r:is_sourced_from]->(w:Webpage {unique_id: "d31af4056dc54a7cb381053ff70ec0fe"})
MATCH (rule:Directive {unique_id: "63c25f78f69b4bc0b0db52da6df7fec4"})
MERGE (rule)-[n:is_sourced_from]->(w)
ON CREATE SET n.added_date = date("2026-10-06")
DELETE r;

UNWIND [
  {s: "12131", name: "42 U.S. Code § 12131 - Definitions"},
  {s: "12132", name: "42 U.S. Code § 12132 - Discrimination"},
  {s: "12133", name: "42 U.S. Code § 12133 - Enforcement"},
  {s: "12134", name: "42 U.S. Code § 12134 - Regulations"}
] AS row
MERGE (w:Webpage {url: "https://www.law.cornell.edu/uscode/text/42/" + row.s})
ON CREATE SET w.unique_id = replace(randomUUID(), "-", ""), w.name = row.name,
              w.include_in_report = true, w.depreciated = false, w.no_longer_exists = false
WITH w
MATCH (t:Law {unique_id: "e668e2199b7e4927b548c179e4bf4b27"})
MERGE (t)-[r:is_sourced_from]->(w)
ON CREATE SET r.added_date = date("2026-10-06");


// --- 2. ADA Title I statute -----------------------------------------------------------
MERGE (l:Law {title: "Americans with Disabilities Act Title I (42 U.S.C. 12111-12117)"})
ON CREATE SET l.unique_id = replace(randomUUID(), "-", ""),
              l.description = "Title I of the ADA prohibits covered employers, including state and local governments, from discriminating against qualified individuals with disabilities in employment. Discrimination includes not making reasonable accommodations to the known limitations of an otherwise qualified applicant or employee unless the accommodation would impose an undue hardship. The EEOC implements it through 29 CFR Part 1630.",
              l.effective_date = date("1992-07-26"),
              l.legislative_authority = "United States Congress",
              l.relevant_sections = "Title I (42 U.S.C. 12111-12117)";

UNWIND [
  {s: "12111", name: "42 U.S. Code § 12111 - Definitions"},
  {s: "12112", name: "42 U.S. Code § 12112 - Discrimination"},
  {s: "12113", name: "42 U.S. Code § 12113 - Defenses"},
  {s: "12114", name: "42 U.S. Code § 12114 - Illegal use of drugs and alcohol"},
  {s: "12115", name: "42 U.S. Code § 12115 - Posting notices"},
  {s: "12116", name: "42 U.S. Code § 12116 - Regulations"},
  {s: "12117", name: "42 U.S. Code § 12117 - Enforcement"}
] AS row
MERGE (w:Webpage {url: "https://www.law.cornell.edu/uscode/text/42/" + row.s})
ON CREATE SET w.unique_id = replace(randomUUID(), "-", ""), w.name = row.name,
              w.include_in_report = true, w.depreciated = false, w.no_longer_exists = false
WITH w
MATCH (l:Law {title: "Americans with Disabilities Act Title I (42 U.S.C. 12111-12117)"})
MERGE (l)-[r:is_sourced_from]->(w)
ON CREATE SET r.added_date = date("2026-10-06");


// --- 3. EEOC regulation ---------------------------------------------------------------
MERGE (d:Directive {title: "EEOC ADA Title I Regulation (29 CFR Part 1630)"})
ON CREATE SET d.unique_id = replace(randomUUID(), "-", ""),
              d.source_institution = "U.S. Equal Employment Opportunity Commission",
              d.effective_date = date("2011-05-24"),
              d.description = "EEOC regulation implementing ADA Title I: definitions of disability and qualified individual, reasonable accommodation, undue hardship, and the interactive process, with the Interpretive Guidance appendix. Revised 2011 to implement the ADA Amendments Act.";

MERGE (w:Webpage {url: "https://www.ecfr.gov/current/title-29/part-1630"})
ON CREATE SET w.unique_id = replace(randomUUID(), "-", ""),
              w.name = "29 CFR Part 1630 - Regulations to Implement the Equal Employment Provisions of the ADA",
              w.include_in_report = true, w.depreciated = false, w.no_longer_exists = false
WITH w
MATCH (d:Directive {title: "EEOC ADA Title I Regulation (29 CFR Part 1630)"})
MERGE (d)-[r:is_sourced_from]->(w)
ON CREATE SET r.added_date = date("2026-10-06");


// --- 4. ED Section 504 regulation -----------------------------------------------------
MERGE (d:Directive {title: "ED Section 504 Regulation (34 CFR Part 104)"})
ON CREATE SET d.unique_id = replace(randomUUID(), "-", ""),
              d.source_institution = "U.S. Department of Education",
              d.effective_date = date("1980-05-09"),
              d.description = "Department of Education regulation implementing Section 504 for recipients of its federal financial assistance. Subpart E governs postsecondary education, including academic adjustments (104.44) and auxiliary aids for students with impaired sensory, manual, or speaking skills.";

MERGE (w:Webpage {url: "https://www.ecfr.gov/current/title-34/part-104"})
ON CREATE SET w.unique_id = replace(randomUUID(), "-", ""),
              w.name = "34 CFR Part 104 - Nondiscrimination on the Basis of Handicap in Programs or Activities Receiving Federal Financial Assistance",
              w.include_in_report = true, w.depreciated = false, w.no_longer_exists = false
WITH w
MATCH (d:Directive {title: "ED Section 504 Regulation (34 CFR Part 104)"})
MERGE (d)-[r:is_sourced_from]->(w)
ON CREATE SET r.added_date = date("2026-10-06");


// --- 5. Section 504 statute -----------------------------------------------------------
MERGE (w:Webpage {url: "https://www.law.cornell.edu/uscode/text/29/794"})
ON CREATE SET w.unique_id = replace(randomUUID(), "-", ""),
              w.name = "29 U.S. Code § 794 - Nondiscrimination under Federal grants and programs",
              w.include_in_report = true, w.depreciated = false, w.no_longer_exists = false
WITH w
MATCH (l:Law {unique_id: "17825dbe87af4c01baa232ab390136b1"})
MERGE (l)-[r:is_sourced_from]->(w)
ON CREATE SET r.added_date = date("2026-10-06");


// --- 6. 2010 Title II regulation ------------------------------------------------------
MERGE (w:Webpage {url: "https://www.ecfr.gov/current/title-28/part-35"})
ON CREATE SET w.unique_id = replace(randomUUID(), "-", ""),
              w.name = "28 CFR Part 35 - Nondiscrimination on the Basis of Disability in State and Local Government Services",
              w.include_in_report = true, w.depreciated = false, w.no_longer_exists = false
WITH w
MATCH (d:Directive {unique_id: "28513850e4794975925f7538fdc096ac"})
MERGE (d)-[r:is_sourced_from]->(w)
ON CREATE SET r.added_date = date("2026-10-06");


// --- 7. EO 1111 supersedes EO 926 ----------------------------------------------------
MATCH (e1111:Directive {unique_id: "ae34235450c4443b8b4298540b677903"})
MATCH (e926:Directive {unique_id: "2e85c0ff35d74d3fb26d5539304cf0c9"})
MERGE (e1111)-[s:supersedes]->(e926)
ON CREATE SET s.scope = "full", s.added_date = date("2026-10-06"),
              s.quote = "Attached is a copy of Executive Order 1111 relating to disability support and accommodations, which supersedes Executive Order 926.",
              s.note = "From the Chancellor's cover memo dated 2018-05-23; the order's header also reads \"Supersedes: Executive Order 926\".";
