// =====================================================================================
// VPAT, ACR review and ICT procurement review: the external canon.
// Run 2026-09-16 by Daniel Fontaine. Source: app/database/ontology/vpat-procurement-search-guide.md
//
// WHAT THIS FILE CREATES
//   4 governance nodes  - 3 Guideline, 1 Directive, each with its source Webpage(s)
//   5 IntellectualSource nodes - the first instances of that label in the graph
//   13 source Webpages, MERGEd on url so a page already present is reused
//   13 is_sourced_from edges
//   35 statements, 22 nodes. Nothing else in the graph is touched.
//
// NO SOURCE TEXT
//   Every node lands with raw_text unset, by instruction. The text is being added by
//   hand afterwards. Do NOT set raw_text from this file later either: raw_text_captured
//   is stamped by the query layer when the text changes, and a raw-Cypher write would
//   set the text without the date, leaving a mirror that cannot be aged. Add text through
//   the UI or /get-source-text so the pair stays consistent.
//
// NO EDGES BEYOND is_sourced_from
//   derives_from (to a Principle) and informs (to an implementation) are a second pass,
//   after the text is in hand. Writing them from the search guide's descriptions would be
//   reasoning from a summary rather than from the sources.
//
// THE ROUTING RULE THIS FILE APPLIES
//   Governance is what has authority over the CSU. California Government Code 7405 adopts
//   Section 508 for California state entities, and that statute is already a Law node
//   here, so the Section 508 apparatus reaches us as requirement. An IntellectualSource
//   has no authority: it is read material a campus draws on when authoring an
//   implementation, or when an existing one turns out to be behind what the field knows.
//
// WHAT WAS CONSIDERED AND EXCLUDED
//   - The Library Accessibility Alliance. A program libraries join to get third-party
//     evaluations funded, not an idea they read. If a CSU library participates, that
//     participation is a campus Implementation and the Alliance is its subject. It stays
//     in the CSUEB library interview guide rather than here.
//   - BTAA and TRLN model license language. Still open; see the guide's section 9.1.
//   - GSA ART and SRT. Software within the federal 508 programme, so they are described
//     on the Section508.gov Directive rather than given nodes of their own.
//   - SF State, Sonoma and CSU Northridge procurement pages. Campus evidence. Putting a
//     campus's own practice in with the canon would let it cite itself as the standard it
//     is measured against.
//
// IDEMPOTENCY
//   Governance MERGEs on title, IntellectualSource on name, Webpage on url, each a
//   unique index. unique_id is set ON CREATE, because neomodel generates it in Python and
//   a raw-Cypher node would otherwise have none.
//
// VALIDATE FIRST
//   python -m app.database.cypher_runner.run_file app/database/batch/auto-assignments/curate_2026_09_16_vpat_procurement_canon.cypher
//   python -m app.database.cypher_runner.run_file ... --execute
// =====================================================================================


// -------------------------------------------------------------------------------------
// 1. GOVERNANCE
// -------------------------------------------------------------------------------------

// 1.1 The VPAT itself. Carries no legal force anywhere; it is Governance because it is the
// required artifact in the procurement chain that Section 508 and Gov Code 7405 put us in.
// Version 2.5Rev, April 2025. ITI revises this without renaming the page, so check the
// version when the text is captured.
MERGE (g:Guideline {title: "Voluntary Product Accessibility Template (VPAT) 2.5Rev"})
ON CREATE SET g.unique_id = replace(randomUUID(), "-", ""),
              g.description = "The industry template vendors complete to report how a product conforms to accessibility standards. Published by the Information Technology Industry Council. A completed VPAT is an Accessibility Conformance Report (ACR). Issued in four editions: 508, WCAG, EU (EN 301 549), and INT, which covers all three.",
              g.effective_date = date("2025-04-01"),
              g.last_updated = date("2025-04-01");

MERGE (w:Webpage {url: "https://www.itic.org/policy/accessibility/vpat"})
ON CREATE SET w.unique_id = replace(randomUUID(), "-", ""),
              w.name = "VPAT (Information Technology Industry Council)",
              w.include_in_report = true;

MATCH (g:Guideline {title: "Voluntary Product Accessibility Template (VPAT) 2.5Rev"})
MATCH (w:Webpage {url: "https://www.itic.org/policy/accessibility/vpat"})
MERGE (g)-[:is_sourced_from]->(w);


// 1.2 The Access Board's test procedure. What a credible conformance claim was tested
// against. Pairs with WCAG-EM, already in the graph.
MERGE (g:Guideline {title: "Section 508 ICT Testing Baseline"})
ON CREATE SET g.unique_id = replace(randomUUID(), "-", ""),
              g.description = "The minimum tests and evaluation guidance that determine whether content meets Section 508 requirements. Maintained by the U.S. Access Board. Covers a Baseline for Web and a Baseline for Documents, with software and hardware baselines in development. Establishes what a conformance claim was actually tested against.";

MERGE (w:Webpage {url: "https://ictbaseline.access-board.gov/"})
ON CREATE SET w.unique_id = replace(randomUUID(), "-", ""),
              w.name = "Section 508 ICT Testing Baseline Portfolio (U.S. Access Board)",
              w.include_in_report = true;

MERGE (w:Webpage {url: "https://ictbaseline.access-board.gov/web-baselines/"})
ON CREATE SET w.unique_id = replace(randomUUID(), "-", ""),
              w.name = "Baseline for Web (U.S. Access Board)",
              w.include_in_report = true;

MATCH (g:Guideline {title: "Section 508 ICT Testing Baseline"})
MATCH (w:Webpage {url: "https://ictbaseline.access-board.gov/"})
MERGE (g)-[:is_sourced_from]->(w);

MATCH (g:Guideline {title: "Section 508 ICT Testing Baseline"})
MATCH (w:Webpage {url: "https://ictbaseline.access-board.gov/web-baselines/"})
MERGE (g)-[:is_sourced_from]->(w);


// 1.3 WCAG2ICT. Informative rather than normative, and the description says so. It matters
// because most purchased ICT is not a website, and this is what makes a WCAG claim
// meaningful for a desktop application or a PDF.
MERGE (g:Guideline {title: "Guidance on Applying WCAG 2 to Non-Web Information and Communications Technologies (WCAG2ICT)"})
ON CREATE SET g.unique_id = replace(randomUUID(), "-", ""),
              g.description = "W3C Group Note describing how WCAG 2 principles and success criteria apply to non-web documents and software, including mobile apps, native applications, and software with closed functionality. Informative rather than normative. Updated in coordination with EN 301 549.",
              g.last_updated = date("2025-08-21");

MERGE (w:Webpage {url: "https://www.w3.org/TR/wcag2ict-22/"})
ON CREATE SET w.unique_id = replace(randomUUID(), "-", ""),
              w.name = "Guidance on Applying WCAG 2 to Non-Web ICT (WCAG2ICT) (W3C Group Note)",
              w.include_in_report = true;

MERGE (w:Webpage {url: "https://www.w3.org/WAI/standards-guidelines/wcag/non-web-ict/"})
ON CREATE SET w.unique_id = replace(randomUUID(), "-", ""),
              w.name = "WCAG2ICT Overview (W3C WAI)",
              w.include_in_report = true;

MATCH (g:Guideline {title: "Guidance on Applying WCAG 2 to Non-Web Information and Communications Technologies (WCAG2ICT)"})
MATCH (w:Webpage {url: "https://www.w3.org/TR/wcag2ict-22/"})
MERGE (g)-[:is_sourced_from]->(w);

MATCH (g:Guideline {title: "Guidance on Applying WCAG 2 to Non-Web Information and Communications Technologies (WCAG2ICT)"})
MATCH (w:Webpage {url: "https://www.w3.org/WAI/standards-guidelines/wcag/non-web-ict/"})
MERGE (g)-[:is_sourced_from]->(w);


// 1.4 The federal 508 programme's buying guidance. Directive, on the Gov Code 7405
// reasoning above. ART's generated requirement statements are the concrete thing a campus
// procurement procedure would borrow, which makes this the highest-value text to capture
// in this section.
MERGE (g:Directive {title: "Section508.gov Guidance on Accessibility in Procurement"})
ON CREATE SET g.unique_id = replace(randomUUID(), "-", ""),
              g.description = "The U.S. federal Section 508 program's guidance for buying accessible ICT: how to define accessibility criteria in solicitations, pre-solicitation and post-solicitation review, and the supporting tools. Includes the Accessibility Requirements Tool (ART), which generates the accessibility requirement statements belonging in a solicitation, and the Solicitation Review Tool (SRT), which checks a drafted solicitation for them.",
              g.source_institution = "U.S. General Services Administration";

MERGE (w:Webpage {url: "https://www.section508.gov/buy/define-accessibility-criteria/"})
ON CREATE SET w.unique_id = replace(randomUUID(), "-", ""),
              w.name = "Define Accessibility Criteria in Contracts (Section508.gov)",
              w.include_in_report = true;

MERGE (w:Webpage {url: "https://www.section508.gov/buy/accessibility-in-procurement-pre-solicitation-2/"})
ON CREATE SET w.unique_id = replace(randomUUID(), "-", ""),
              w.name = "Accessibility in Procurement II: Solicitation and Post-Solicitation (Section508.gov)",
              w.include_in_report = true;

MERGE (w:Webpage {url: "https://www.section508.gov/tools/list-of-art-requirements/"})
ON CREATE SET w.unique_id = replace(randomUUID(), "-", ""),
              w.name = "Accessibility Requirements Tool (ART) Requirements Statements by ICT (Section508.gov)",
              w.include_in_report = true;

MATCH (g:Directive {title: "Section508.gov Guidance on Accessibility in Procurement"})
MATCH (w:Webpage {url: "https://www.section508.gov/buy/define-accessibility-criteria/"})
MERGE (g)-[:is_sourced_from]->(w);

MATCH (g:Directive {title: "Section508.gov Guidance on Accessibility in Procurement"})
MATCH (w:Webpage {url: "https://www.section508.gov/buy/accessibility-in-procurement-pre-solicitation-2/"})
MERGE (g)-[:is_sourced_from]->(w);

MATCH (g:Directive {title: "Section508.gov Guidance on Accessibility in Procurement"})
MATCH (w:Webpage {url: "https://www.section508.gov/tools/list-of-art-requirements/"})
MERGE (g)-[:is_sourced_from]->(w);


// -------------------------------------------------------------------------------------
// 2. INTELLECTUAL SOURCES
//
// The first instances of this label. Each has no authority over the CSU, is read material
// rather than a service, and is an idea rather than a description of someone's operations.
// url holds the canonical location where there is one; is_sourced_from holds the rest.
// -------------------------------------------------------------------------------------

// 2.1 The worked example of the routing rule: a government instrument with real force in
// its own jurisdiction and none over us. The highest-value item for authoring, because
// SF State's library said plainly it performs no substantive review of conformance
// reports, and this is what a substantive review procedure would be written from.
MERGE (s:IntellectualSource {name: "Commonwealth of Massachusetts Accessibility Conformance Report Review Checklist"})
ON CREATE SET s.unique_id = replace(randomUUID(), "-", ""),
              s.description_short = "A yes/no method for judging whether a vendor's conformance report is credible.",
              s.description_full = "Each check is a yes/no question where a yes supports the report's validity. The checks cover who completed the report and whether they had accessibility expertise or were a reputable third party, whether it measures conformance against WCAG 2.1 or 2.2 levels A and AA, and whether the Remarks and Explanations column carries detail for every criterion marked Partially Supports or Does Not Support. It is the clearest published answer to what reviewing a conformance report means beyond collecting one.",
              s.url = "https://www.mass.gov/info-details/accessibility-conformance-report-review",
              s.publisher = "Commonwealth of Massachusetts";

MERGE (w:Webpage {url: "https://www.mass.gov/doc/accessibility-conformance-report-review-checklist/download"})
ON CREATE SET w.unique_id = replace(randomUUID(), "-", ""),
              w.name = "Accessibility Conformance Report Review Checklist (Commonwealth of Massachusetts)",
              w.include_in_report = true;

MATCH (s:IntellectualSource {name: "Commonwealth of Massachusetts Accessibility Conformance Report Review Checklist"})
MATCH (w:Webpage {url: "https://www.mass.gov/doc/accessibility-conformance-report-review-checklist/download"})
MERGE (s)-[:is_sourced_from]->(w);


// 2.2 Teaching material rather than a description of Harvard's operations, which is what
// keeps it on the right side of the rule.
MERGE (s:IntellectualSource {name: "How to Interpret a VPAT (Harvard Digital Accessibility Services)"})
ON CREATE SET s.unique_id = replace(randomUUID(), "-", ""),
              s.description_short = "A guide to reading a conformance report, including the patterns that show it was not taken seriously.",
              s.description_full = "Written for non-specialist buyers. Names the red flags directly: an empty Remarks column, a bare Partially Supports with no context, a document where nearly every row reads Supports or Not Applicable, missing version numbers, and an outdated report.",
              s.url = "https://accessibility.huit.harvard.edu/interpret-vpat",
              s.publisher = "Harvard University Digital Accessibility Services";


// 2.3 Three tests a report must pass before it counts as evidence.
MERGE (s:IntellectualSource {name: "Evaluate Compliance Documentation (University of Michigan)"})
ON CREATE SET s.unique_id = replace(randomUUID(), "-", ""),
              s.description_short = "Three tests a conformance report must pass before it counts as evidence.",
              s.description_full = "A report must be created or updated within the past year, written against WCAG, and specific to the product and version under consideration. The version test is the one campuses most often skip, because vendors supply a report for a product line rather than for the release being licensed.",
              s.url = "https://accessibility.umich.edu/how-to/procurement-vendors/evaluate-compliance",
              s.publisher = "University of Michigan";


// 2.4 Synthesized from four institutions, so no single canonical url. The model is the
// intellectual source; each university's page is one instance of it, and those pages are
// other campuses' evidence rather than ours. That is the reason to synthesize instead of
// creating four nodes. Directly relevant to 4.6-pro, where CSUEB's own campus-level EAP
// process is retired.
MERGE (s:IntellectualSource {name: "Impact-tiered ICT accessibility review"})
ON CREATE SET s.unique_id = replace(randomUUID(), "-", ""),
              s.description_short = "A model that sizes the depth of an accessibility review to a product's reach.",
              s.description_full = "High-impact products get an in-depth review, including testing that validates rather than accepts the vendor's claims. Medium-impact products are reviewed at a committee's discretion. Where barriers are found and the purchase proceeds, it proceeds on an Equally Effective Alternate Access Plan naming the barriers, the workaround, how barriers are communicated, the resources required, and who is responsible. The model resolves the problem that verifying every purchase is impossible and verifying none of them is negligent, by making reach the thing that decides.";

MERGE (w:Webpage {url: "https://www.mtu.edu/accessibility/policies/procedures/procurement/"})
ON CREATE SET w.unique_id = replace(randomUUID(), "-", ""),
              w.name = "ICT Procurement Procedures (Michigan Technological University)",
              w.include_in_report = true;

MERGE (w:Webpage {url: "https://access.illinois.edu/ada/digital-accessibility-policy/procurement/"})
ON CREATE SET w.unique_id = replace(randomUUID(), "-", ""),
              w.name = "ICT Procurement Requirements (University of Illinois)",
              w.include_in_report = true;

MERGE (w:Webpage {url: "https://www.unr.edu/accessibility/resources/procurement/process"})
ON CREATE SET w.unique_id = replace(randomUUID(), "-", ""),
              w.name = "ICT Procurement Process (University of Nevada, Reno)",
              w.include_in_report = true;

MERGE (w:Webpage {url: "https://www.section508.gov/blog/Accessibility-risk-management-and-model/"})
ON CREATE SET w.unique_id = replace(randomUUID(), "-", ""),
              w.name = "Accessibility Risk Management and Risk Model for ICT (Section508.gov)",
              w.include_in_report = true;

MATCH (s:IntellectualSource {name: "Impact-tiered ICT accessibility review"})
MATCH (w:Webpage {url: "https://www.mtu.edu/accessibility/policies/procedures/procurement/"})
MERGE (s)-[:is_sourced_from]->(w);

MATCH (s:IntellectualSource {name: "Impact-tiered ICT accessibility review"})
MATCH (w:Webpage {url: "https://access.illinois.edu/ada/digital-accessibility-policy/procurement/"})
MERGE (s)-[:is_sourced_from]->(w);

MATCH (s:IntellectualSource {name: "Impact-tiered ICT accessibility review"})
MATCH (w:Webpage {url: "https://www.unr.edu/accessibility/resources/procurement/process"})
MERGE (s)-[:is_sourced_from]->(w);

MATCH (s:IntellectualSource {name: "Impact-tiered ICT accessibility review"})
MATCH (w:Webpage {url: "https://www.section508.gov/blog/Accessibility-risk-management-and-model/"})
MERGE (s)-[:is_sourced_from]->(w);


// 2.5 The purest case for this label: scholarship, no authority, read to author. The
// description is drawn from the title and publication rather than from claims about the
// contents, because the article is behind a publisher paywall and has not been read.
// citation carries only what is verified. Fill volume, issue and authors when the text is
// pasted in by hand.
MERGE (s:IntellectualSource {name: "Prioritizing Accessibility in the E-Resources Procurement Lifecycle"})
ON CREATE SET s.unique_id = replace(randomUUID(), "-", ""),
              s.description_short = "Peer-reviewed treatment of conformance reports as a working tool across acquisition and remediation in academic libraries.",
              s.description_full = "Treats the conformance report as an instrument used throughout an acquisition lifecycle rather than a gate passed once at purchase, and connects acquisition decisions to the remediation work that follows them. Not yet read: the publisher paywalls it, so this describes what the work is about and not what it argues.",
              s.url = "https://www.tandfonline.com/doi/full/10.1080/0361526X.2020.1722020",
              s.publisher = "Serials Review (Taylor and Francis)",
              s.published_date = date("2020-01-01"),
              s.citation = "Serials Review, 2020. DOI 10.1080/0361526X.2020.1722020.";
