// =====================================================================================
// WCAG-EM as an IntellectualSource, with the pages it is drawn from.
// Run 2026-09-22 by Daniel Fontaine.
// Source: https://www.w3.org/WAI/test-evaluate/conformance/wcag-em/ (fetched 2026-09-22)
//
// WHY INTELLECTUALSOURCE AND NOT GOVERNANCE
//   The page states it plainly: WCAG-EM "is a supporting resource for the WCAG standard;
//   it does not define additional WCAG requirements", and "It is published as a W3C Group
//   Note." A Group Note is not a Recommendation. WCAG 2.x is what the CSU is measured
//   against, through Section 508 and California Government Code 7405. WCAG-EM is the method
//   for checking against it, and nothing obliges anyone to use that method. Method we
//   borrow, not mandate we inherit.
//
// A DUPLICATE THIS FILE DOES NOT RESOLVE
//   `Guideline: WCAG Evaluation Methodology (WCAG-EM) 2.0` (49ef5c2c99f24ecd8b8b3687199a7dbd)
//   already exists on the governance side, from the original governance seed, carrying no
//   text and one source page. By the routing rule above it is mis-filed. This file does NOT
//   retire or delete it, because removing a governance node is not a curation step to take
//   without a decision. Flagged in the ingest report instead.
//
//   The spec page https://www.w3.org/TR/wcag-em-2/ is already in the graph backing that
//   Guideline. It is MERGEd on url below, so it is CROSS-LINKED rather than duplicated, and
//   ends up backing both nodes. That is the correct outcome for one page cited by two
//   parents, and it is why the MERGE keys on url and sets identity only ON CREATE.
//
// NO SOURCE TEXT
//   Every page lands with raw_text unset. The page content reaching this session came as a
//   subagent's summary, not as verbatim text, and writing a description into raw_text would
//   be recording a summary as if it were the source. Fill these with /get-source-text or
//   through the Intellectual Sources tab, which stamps raw_text_captured correctly.
//
// PAGES CHOSEN, AND THE ONES LEFT OUT
//   Ten pages: the overview, both spec versions, the report tool and template, the parent
//   evaluation suite, and the three companion practices the methodology depends on
//   (preliminary checks, combined expertise, involving users).
//   Left out: the thirteen Easy Checks sub-pages (image alt, page title, headings, colour
//   contrast, skip link, keyboard focus, language, zoom, captions, transcripts, audio
//   description, form field labels, required fields). They are individual checks rather
//   than WCAG-EM resources, and attaching thirteen of them would bury the methodology in
//   its own footnotes. The Easy Checks parent page is attached and reaches them.
//   Also left out: the MP4 overview video, the GitHub changelog and issue links, and the
//   AG WG group page. None is a source the methodology is drawn from.
//
// VALIDATE FIRST
//   python -m app.database.cypher_runner.run_file <this file>
//   python -m app.database.cypher_runner.run_file <this file> --execute
// =====================================================================================


// -------------------------------------------------------------------------------------
// 1. THE SOURCE
// -------------------------------------------------------------------------------------

MERGE (s:IntellectualSource {name: "Website Accessibility Conformance Evaluation Methodology (WCAG-EM)"})
ON CREATE SET s.unique_id = replace(randomUUID(), "-", ""),
              s.description_short = "A W3C Group Note setting out an approach for determining how well a digital product conforms to WCAG. It defines no additional requirements of its own.",
              s.description_full = "WCAG-EM describes how to evaluate conformance rather than what conformance is, and the W3C is explicit that it is a supporting resource for WCAG that does not define additional WCAG requirements. It applies to websites, mobile apps and kiosks, covers both self-assessment and third-party evaluation, and is independent of any particular tool, browser or assistive technology. The procedure runs in five steps: define the scope of the evaluation, explore the product, select a representative sample, evaluate the selected sample, and report the evaluation findings. It is written for internal evaluators, external auditors, benchmarkers and researchers, and the W3C recommends preliminary checks before applying it. Version 2 extends the methodology beyond websites to apps and other digital products; version 1, published in 2014, covered websites and web pages only. The resource was first published as Conformance Evaluation of Web Sites for Accessibility in September 2005.",
              s.url = "https://www.w3.org/WAI/test-evaluate/conformance/wcag-em/",
              s.publisher = "World Wide Web Consortium (W3C), Accessibility Guidelines Working Group",
              s.published_date = date("2026-07-23"),
              s.citation = "W3C Group Note. Website Accessibility Conformance Evaluation Methodology (WCAG-EM) 2.0, published 23 July 2026. Overview page updated 12 August 2026.";


// -------------------------------------------------------------------------------------
// 2. THE PAGES
//    MERGE on url. A url already in the graph is cross-linked, never duplicated, and keeps
//    its existing name and any text it already carries.
// -------------------------------------------------------------------------------------

MERGE (w:Webpage {url: "https://www.w3.org/WAI/test-evaluate/conformance/wcag-em/"})
ON CREATE SET w.unique_id = replace(randomUUID(), "-", ""),
              w.name = "WCAG-EM Overview: WCAG Evaluation Methodology (W3C WAI)",
              w.include_in_report = true;

MERGE (w:Webpage {url: "https://www.w3.org/TR/wcag-em-2/"})
ON CREATE SET w.unique_id = replace(randomUUID(), "-", ""),
              w.name = "WCAG Evaluation Methodology (WCAG-EM) 2.0",
              w.include_in_report = true;

MERGE (w:Webpage {url: "https://www.w3.org/TR/2014/NOTE-WCAG-EM-20140710/"})
ON CREATE SET w.unique_id = replace(randomUUID(), "-", ""),
              w.name = "Website Accessibility Conformance Evaluation Methodology (WCAG-EM) 1.0 (W3C Note, 2014)",
              w.include_in_report = true;

MERGE (w:Webpage {url: "https://www.w3.org/WAI/eval/report-tool/"})
ON CREATE SET w.unique_id = replace(randomUUID(), "-", ""),
              w.name = "WCAG-EM Report Tool: WCAG Evaluation Report Generator (W3C WAI)",
              w.include_in_report = true;

MERGE (w:Webpage {url: "https://www.w3.org/WAI/test-evaluate/report-template/"})
ON CREATE SET w.unique_id = replace(randomUUID(), "-", ""),
              w.name = "Accessibility Evaluation Report Template (W3C WAI)",
              w.include_in_report = true;

MERGE (w:Webpage {url: "https://www.w3.org/WAI/test-evaluate/"})
ON CREATE SET w.unique_id = replace(randomUUID(), "-", ""),
              w.name = "Evaluating Web Accessibility Overview (W3C WAI)",
              w.include_in_report = true;

MERGE (w:Webpage {url: "https://www.w3.org/WAI/test-evaluate/conformance/"})
ON CREATE SET w.unique_id = replace(randomUUID(), "-", ""),
              w.name = "Conformance Evaluation and Reports (W3C WAI)",
              w.include_in_report = true;

MERGE (w:Webpage {url: "https://www.w3.org/WAI/test-evaluate/preliminary/"})
ON CREATE SET w.unique_id = replace(randomUUID(), "-", ""),
              w.name = "Easy Checks, A First Review of Web Accessibility (W3C WAI)",
              w.include_in_report = true;

MERGE (w:Webpage {url: "https://www.w3.org/WAI/test-evaluate/combined-expertise/"})
ON CREATE SET w.unique_id = replace(randomUUID(), "-", ""),
              w.name = "Using Combined Expertise to Evaluate Web Accessibility (W3C WAI)",
              w.include_in_report = true;

MERGE (w:Webpage {url: "https://www.w3.org/WAI/test-evaluate/involving-users/"})
ON CREATE SET w.unique_id = replace(randomUUID(), "-", ""),
              w.name = "Involving Users in Evaluating Web Accessibility (W3C WAI)",
              w.include_in_report = true;


// -------------------------------------------------------------------------------------
// 3. WIRE THE PAGES TO THE SOURCE
// -------------------------------------------------------------------------------------

MATCH (s:IntellectualSource {name: "Website Accessibility Conformance Evaluation Methodology (WCAG-EM)"})
MATCH (w:Webpage) WHERE w.url IN [
  "https://www.w3.org/WAI/test-evaluate/conformance/wcag-em/",
  "https://www.w3.org/TR/wcag-em-2/",
  "https://www.w3.org/TR/2014/NOTE-WCAG-EM-20140710/",
  "https://www.w3.org/WAI/eval/report-tool/",
  "https://www.w3.org/WAI/test-evaluate/report-template/",
  "https://www.w3.org/WAI/test-evaluate/",
  "https://www.w3.org/WAI/test-evaluate/conformance/",
  "https://www.w3.org/WAI/test-evaluate/preliminary/",
  "https://www.w3.org/WAI/test-evaluate/combined-expertise/",
  "https://www.w3.org/WAI/test-evaluate/involving-users/"]
MERGE (s)-[:is_sourced_from]->(w);
