// =====================================================================================
// Title II principle groundings: what each derives_from edge actually rests on.
// Run 2026-10-06 by Daniel Fontaine.
//
// WHY THIS PASS RAN
//   Nine principles derive_from Title II through fifteen edges to three nodes:
//     Law       Americans with Disabilities Act Title II          e668e2199b7e4927b548c179e4bf4b27
//     Directive DOJ Title II Web and Mobile Final Rule (2024)     63c25f78f69b4bc0b0db52da6df7fec4
//     Directive ADA Title II Regulation (28 CFR Part 35), 2010    28513850e4794975925f7538fdc096ac
//   Every derives_from edge was bare: no provision, no quote, no statement of how directly
//   the source applies. This file records the assessment on the edge itself.
//
// PROPERTIES SET ON EACH OF THE FIFTEEN EDGES
//   provision       the section the principle rests on; null where none can be named
//   grounding_kind  mandate        the provision requires what the principle states
//                   interpretation the principle reads a requirement into the source
//                   design_choice  the source permits the principle but does not require it
//                   unverified     the grounding node has no text in the graph to check
//   quote           verbatim from the source text in the graph; null where the node has none.
//                   Only the 2024 rule has text (its Federal Register page, 684,673 chars,
//                   captured before this run). Each quote was checked against that text.
//   rationale       the verdict, in one or two sentences
//   assessed_date   2026-10-06
//
// A NOTE ON THE "ADA TITLE II" LAW NODE
//   It conflates three instruments: its title names the statute, its description and
//   effective date (2011-03-15) are the 2010 regulation's, its relevant_sections reads
//   "Subpart H: Web and Mobile" (the 2024 rule), and its only source page is the 2024
//   rule's ada.gov page, which has no text. No node represents the statute itself
//   (42 U.S.C. 12131-12134). Edges to it say so in their rationale.
//
// WHAT THIS FILE DELIBERATELY DOES NOT DO
//   - Split the conflated Law node or re-point any edge. That is a modelling decision.
//   - Remove the Title II edge from time-bound-alternative or add one to Executive Order
//     1111. The tension is recorded; the re-grounding is a decision.
//   - Touch derives_from edges to non-Title II nodes (EO 1111, Section 508, Gov Code 7405,
//     WCAG 2.1, the ATI directive).
//   - Add grounding_kind to data_config as a vocabulary. Four values, documented here; move
//     them to data_config if the app starts reading them.
//
// VALIDATE FIRST
//   python -m app.database.cypher_runner.run_file app/database/batch/auto-assignments/curate_2026_10_06_title_ii_principle_groundings.cypher
//   python -m app.database.cypher_runner.run_file app/database/batch/auto-assignments/curate_2026_10_06_title_ii_principle_groundings.cypher --execute
// =====================================================================================

UNWIND [
  // --- Undue burden and fundamental alteration bound the duty ---
  {p: "principle:bounded-duty-burden-limits", g: "63c25f78f69b4bc0b0db52da6df7fec4",
   provision: "28 CFR 35.204", kind: "mandate",
   quote: "shall take any other action that would not result in such an alteration or such burdens but would nevertheless ensure that individuals with disabilities receive the benefits or services provided by the public entity to the maximum extent possible",
   why: "Section 35.204 sets both limits and keeps the residual duty to take other action, which is the principle as stated."},
  {p: "principle:bounded-duty-burden-limits", g: "28513850e4794975925f7538fdc096ac",
   provision: "28 CFR 35.150(a)(3); 28 CFR 35.164", kind: "mandate", quote: null,
   why: "The 2024 rule states that 35.204 mirrors these limits. The 2010 regulation's text is not in the graph, so no quote is recorded."},
  {p: "principle:bounded-duty-burden-limits", g: "e668e2199b7e4927b548c179e4bf4b27",
   provision: null, kind: "mandate", quote: null,
   why: "The limits are regulatory (28 CFR 35.150(a)(3), 35.164, 35.204), not statutory. This node conflates the statute, the 2010 regulation and the 2024 rule."},

  // --- Notice is part of access ---
  {p: "principle:notice-as-part-of-access", g: "28513850e4794975925f7538fdc096ac",
   provision: null, kind: "unverified", quote: null,
   why: "Probably 28 CFR 35.106 (notice) and 35.163 (information and signage). The 2010 regulation's text is not in the graph, so the grounding cannot be checked."},
  {p: "principle:notice-as-part-of-access", g: "e668e2199b7e4927b548c179e4bf4b27",
   provision: null, kind: "unverified", quote: null,
   why: "No text in the graph. This node conflates the statute, the 2010 regulation and the 2024 rule."},

  // --- Program accessibility is a proactive, systemic duty ---
  {p: "principle:program-accessibility-as-proactive-duty", g: "63c25f78f69b4bc0b0db52da6df7fec4",
   provision: "28 CFR 35.200(a)", kind: "mandate",
   quote: "Section 35.200(a) requires a public entity to ensure that the following are readily accessible to and usable by individuals with disabilities",
   why: "The duty applies to web content and mobile apps on fixed compliance dates, including content provided through contractual arrangements, independent of any request."},
  {p: "principle:program-accessibility-as-proactive-duty", g: "e668e2199b7e4927b548c179e4bf4b27",
   provision: "28 CFR 35.149-35.150", kind: "mandate", quote: null,
   why: "The general program-access duty is in the 2010 regulation, which this principle is not linked to. This node conflates the statute, the 2010 regulation and the 2024 rule."},

  // --- Remedy proportionate to barrier severity ---
  {p: "principle:proportionate-remedy", g: "63c25f78f69b4bc0b0db52da6df7fec4",
   provision: "28 CFR 35.201; 28 CFR 35.205", kind: "interpretation",
   quote: "enabling public entities to focus their resources on making frequently used or high impact content WCAG 2.1 Level AA compliant first",
   why: "The exceptions and the minimal-impact defense limit scope by impact. Nothing in Title II scales a formal alternative-access plan to barrier severity; that part is CSU practice."},
  {p: "principle:proportionate-remedy", g: "e668e2199b7e4927b548c179e4bf4b27",
   provision: null, kind: "interpretation", quote: null,
   why: "See the 2024 rule edge. This node conflates the statute, the 2010 regulation and the 2024 rule."},

  // --- Time-bound alternative access when full conformance is not yet achieved ---
  {p: "principle:time-bound-alternative-when-not-conformant", g: "63c25f78f69b4bc0b0db52da6df7fec4",
   provision: "28 CFR 35.202; 28 CFR 35.204", kind: "interpretation",
   quote: "only where it is not possible to make web content directly accessible due to technical or legal limitations",
   why: "In tension with the rule. 35.202 allows alternate versions only under technical or legal limits, and the preamble warns they risk a segregated approach. The time-bound plan comes from Executive Order 1111 practice; the nearest Title II basis is the other-action duty in 35.204."},
  {p: "principle:time-bound-alternative-when-not-conformant", g: "e668e2199b7e4927b548c179e4bf4b27",
   provision: null, kind: "interpretation", quote: null,
   why: "See the 2024 rule edge. This node conflates the statute, the 2010 regulation and the 2024 rule."},

  // --- Closest to Capacity ---
  {p: "principle:closest-to-capacity", g: "e668e2199b7e4927b548c179e4bf4b27",
   provision: "28 CFR 35.200(a); 28 CFR 35.201", kind: "design_choice", quote: null,
   why: "Title II places the duty on the public entity, including content provided through vendors, and excepts third-party postings. That supports responsibility rising to the institution, not responsibility sitting with the party closest to capacity, which is internal governance design."},

  // --- Conformance to an external technical standard ---
  {p: "principle:conformance-to-an-external-technical-standard", g: "63c25f78f69b4bc0b0db52da6df7fec4",
   provision: "28 CFR 35.200(b); 28 CFR 35.202(b)", kind: "mandate",
   quote: "Section 35.200 requires public entities to make their web content and mobile apps accessible by complying with a technical standard for accessibility—WCAG 2.1 Level AA",
   why: "WCAG 2.1 Level AA is the required standard and is incorporated by reference."},

  // --- Equally effective access ---
  {p: "principle:equally-effective-access", g: "e668e2199b7e4927b548c179e4bf4b27",
   provision: "28 CFR 35.130(b)(1)(ii)-(iii); 28 CFR 35.160", kind: "mandate", quote: null,
   why: "The core provisions are in the 2010 regulation, whose text is not in the graph. The 2024 rule's 35.205 uses the same test: substantially equivalent timeliness, privacy, independence and ease of use. This node conflates the statute, the 2010 regulation and the 2024 rule."},

  // --- Universal Design reduces accommodation ---
  {p: "principle:universal-design-over-accommodation", g: "e668e2199b7e4927b548c179e4bf4b27",
   provision: null, kind: "design_choice", quote: null,
   why: "Title II does not require universal design; the 2024 rule mentions it once, in a footnote describing commenters' views. A proactive technical standard makes room for the principle without requiring it."}
] AS row
MATCH (p:Principle {handle: row.p})-[r:derives_from]->(g {unique_id: row.g})
SET r.provision = row.provision,
    r.grounding_kind = row.kind,
    r.quote = row.quote,
    r.rationale = row.why,
    r.assessed_date = date("2026-10-06");
