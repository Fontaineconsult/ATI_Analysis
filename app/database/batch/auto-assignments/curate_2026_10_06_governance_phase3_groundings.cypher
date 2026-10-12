// =====================================================================================
// Governance pass, Phase 3: every principle grounding says what it rests on.
// Run 2026-10-06 by Daniel Fontaine. Follows Phases 1a, 1b and 2.
//
// WHY THIS PASS RAN
//   After Phase 2, sixteen derives_from edges still carried no provision, kind, quote or
//   rationale; eight edges to the Title II node still described it as conflated (Phase 1b
//   made it the statute); two edges to the 2010 Title II regulation said its text was not
//   in the graph (Phase 1b loaded it). Three principles also lacked their real source:
//     - Procurement as a lever rested only on the ATI policy.
//     - Time-bound alternative access rested on Title II, which allows alternate versions
//       "only where it is not possible ... due to technical or legal limitations". Its
//       real source is CSU policy: the ATI policy's procurement goal of Equally Effective
//       Access Plans for ICT that is not fully Section 508 compliant, and the ATI
//       procurement process's TAAP guidance, which itself states that TAAPs "do not
//       indicate accessibility compliance under ADA Title II".
//     - Universal design rested on laws that permit it; the ATI policy states it.
//
// SECTIONS (one UNWIND; each row MERGEs the edge and SETs its properties)
//   A. Procurement as a lever: ATI policy, EO 1111 VII, Gov Code 7405, 35.200(a),
//      the CSU ATI Procurement Process, Section508.gov procurement guidance.
//   B. Time-bound alternative: ATI policy and TAAP guidance added; the Title II rule edge's
//      rationale updated to cite CSU's own position.
//   C. The eight Title II statute edges, rewritten against 42 U.S.C. 12131-12132.
//   D. 2010 regulation edges: notice (35.106) and burden limits updated; program access
//      (35.150(a)) and equally effective (35.130(b)(1)(iii)) added; ED 504 104.4(b)(1)(iii)
//      added to equally effective.
//   E. The ATI policy's principles, each with the policy sentence it rests on; universal
//      design gains its ATI edge. Student accommodations policy edges filled.
//   F. Remaining edges (Section 508, Gov Code 7405, WCAG 2.1), filled honestly, mostly as
//      interpretation or design_choice with no quote.
//
// QUOTES
//   Every quote was checked verbatim, whitespace-normalized, against stored raw_text
//   before this file ran: statutes and eCFR parts (Phase 1b), the 2024 rule, the 2021 ATI
//   memo (which the 2024 policy carries forward), EO 1111, the student accommodations
//   policy, the CSU ATI Procurement Process pages and Section508.gov pages.
//
// NOT DONE HERE
//   - Removing the Title II rule edge from time-bound alternative. It stays, as
//     interpretation, so the tension stays visible.
//   - shapes edges. Separate pass.
//
// VALIDATE FIRST
//   python -m app.database.cypher_runner.run_file app/database/batch/auto-assignments/curate_2026_10_06_governance_phase3_groundings.cypher
//   python -m app.database.cypher_runner.run_file app/database/batch/auto-assignments/curate_2026_10_06_governance_phase3_groundings.cypher --execute
// =====================================================================================

UNWIND [
  // ---------------------------------------------------------------- A. Procurement lever
  {h: "principle:vendor-leverage-procurement-as-accessibility-lever", g: "ae8c836ef5354e18afdedf905935ada7",
   provision: "CSU ATI Policy (2024), Key Strategies", kind: "mandate",
   quote: "The CSU seeks to improve product accessibility through partnerships and by leveraging the procurement process.",
   why: "The policy names procurement as a lever, and its procurement goals require processes that follow Section 508 for all acquired ICT."},
  {h: "principle:vendor-leverage-procurement-as-accessibility-lever", g: "ae34235450c4443b8b4298540b677903",
   provision: "EO 1111, VII (Disability Support and Accommodation in Contracting)", kind: "mandate",
   quote: "Any public solicitation process developed by a campus or the Chancellor’s Office shall be compliant with regulations and guidelines issued pursuant to ADA and California",
   why: "The order brings solicitations under the ADA and Government Code 11135, and its scope names procurement of goods and services."},
  {h: "principle:vendor-leverage-procurement-as-accessibility-lever", g: "247ccd3b219d4cec85ecbc2e57be154c",
   provision: "Cal. Gov. Code 7405(a)", kind: "mandate",
   quote: "in developing, procuring, maintaining, or using electronic or information technology",
   why: "State law applies Section 508 at the point of procurement as well as development and use."},
  {h: "principle:vendor-leverage-procurement-as-accessibility-lever", g: "63c25f78f69b4bc0b0db52da6df7fec4",
   provision: "28 CFR 35.200(a)", kind: "mandate",
   quote: "directly or through contractual, licensing, or other arrangements",
   why: "Buying a platform does not transfer the Title II duty. Content provided through a vendor arrangement is the entity's to make accessible, which is why acquisition is where leverage counts."},
  {h: "principle:vendor-leverage-procurement-as-accessibility-lever", g: "749610aedade4c709d784c10cd36dbb0",
   provision: "CSU ATI Procurement Process, Step 3", kind: "mandate",
   quote: "The ATI Reviewer then sends the specific contract recommendations to the Buyer for incorporation into the final contract/PO.",
   why: "The procedure turns review into findings, a vendor roadmap, and contract language, which is the form of leverage the principle commits to."},
  {h: "principle:vendor-leverage-procurement-as-accessibility-lever", g: "34a1e0763aaa4b2c80dfb8cc672fbb36",
   provision: "Section508.gov, Define Accessibility Criteria", kind: "design_choice",
   quote: "When preparing solicitations, statements of work, or other procurement documents, clearly define your criteria to ensure the information and communication technology (ICT) your agency buys or builds is accessible",
   why: "Federal guidance written for agencies. It binds no CSU campus, but it is the practice Government Code 7405 points toward."},

  // -------------------------------------------------------- B. Time-bound alternative
  {h: "principle:time-bound-alternative-when-not-conformant", g: "ae8c836ef5354e18afdedf905935ada7",
   provision: "CSU ATI Policy (2024), Procurement Accessibility Goals", kind: "mandate",
   quote: "Equally Effective Access Plans are created for Information Communication Technology (ICT) products that are not fully Section 508 compliant.",
   why: "This is the principle's source: CSU policy requires an alternative access plan for ICT that does not conform."},
  {h: "principle:time-bound-alternative-when-not-conformant", g: "749610aedade4c709d784c10cd36dbb0",
   provision: "CSU ATI Procurement Process, Temporary Alternate Access Planning (TAAP v3.3)", kind: "mandate",
   quote: "TAAPs are now explicitly positioned as temporary risk-management tools and do not indicate accessibility compliance under ADA Title II",
   why: "CSU guidance makes the plan temporary, ties it to vendor remediation, escalates continued use, and states that it is not Title II compliance."},
  {h: "principle:time-bound-alternative-when-not-conformant", g: "63c25f78f69b4bc0b0db52da6df7fec4",
   provision: "28 CFR 35.202; 28 CFR 35.204", kind: "interpretation",
   quote: "only where it is not possible to make web content directly accessible due to technical or legal limitations",
   why: "In tension with the rule, and CSU agrees: its TAAP guidance says a TAAP does not indicate Title II compliance. The nearest Title II basis is the other-action duty in 35.204. The principle rests on CSU policy."},

  // --------------------------------------------- C. Title II statute (42 U.S.C. 12131-12134)
  {h: "principle:bounded-duty-burden-limits", g: "e668e2199b7e4927b548c179e4bf4b27",
   provision: "42 U.S.C. 12131(2)", kind: "interpretation",
   quote: "with or without reasonable modifications to rules, policies, or practices, the removal of architectural, communication, or transportation barriers, or the provision of auxiliary aids and services, meets the essential eligibility requirements",
   why: "The statute frames the duty around reasonable modifications. The undue burden and fundamental alteration limits themselves are regulatory: 28 CFR 35.150(a)(3), 35.164, 35.204."},
  {h: "principle:notice-as-part-of-access", g: "e668e2199b7e4927b548c179e4bf4b27",
   provision: "42 U.S.C. 12132", kind: "interpretation",
   quote: "be excluded from participation in or be denied the benefits of the services, programs, or activities of a public entity",
   why: "The general prohibition. The notice duty is regulatory: 28 CFR 35.106."},
  {h: "principle:program-accessibility-as-proactive-duty", g: "e668e2199b7e4927b548c179e4bf4b27",
   provision: "42 U.S.C. 12132", kind: "mandate",
   quote: "no qualified individual with a disability shall, by reason of such disability, be excluded from participation in or be denied the benefits of the services, programs, or activities of a public entity",
   why: "The statutory duty that 28 CFR 35.150(a) and subpart H carry out program-wide and in advance."},
  {h: "principle:proportionate-remedy", g: "e668e2199b7e4927b548c179e4bf4b27",
   provision: "42 U.S.C. 12132", kind: "interpretation",
   quote: null,
   why: "The statute sets no severity scale. Scope by impact comes from the 2024 rule's exceptions and minimal-impact defense; formal plans scaled to severity are CSU practice."},
  {h: "principle:time-bound-alternative-when-not-conformant", g: "e668e2199b7e4927b548c179e4bf4b27",
   provision: "42 U.S.C. 12132", kind: "interpretation",
   quote: null,
   why: "The statute provides no interim-alternative mechanism. The principle rests on CSU policy (ATI policy and TAAP guidance)."},
  {h: "principle:closest-to-capacity", g: "e668e2199b7e4927b548c179e4bf4b27",
   provision: "42 U.S.C. 12132", kind: "design_choice",
   quote: null,
   why: "The statute places the duty on the public entity. Allocating responsibility to the party closest to remediation capacity is internal governance design, which the statute permits but does not require."},
  {h: "principle:equally-effective-access", g: "e668e2199b7e4927b548c179e4bf4b27",
   provision: "42 U.S.C. 12132", kind: "mandate",
   quote: "be excluded from participation in or be denied the benefits of the services, programs, or activities of a public entity",
   why: "Denial of benefits is the statutory basis; 28 CFR 35.130(b)(1)(iii) and 35.160 state the equal-effectiveness test."},
  {h: "principle:universal-design-over-accommodation", g: "e668e2199b7e4927b548c179e4bf4b27",
   provision: "42 U.S.C. 12132", kind: "design_choice",
   quote: null,
   why: "Title II does not require universal design. The CSU ATI policy states the principle; Title II's proactive standard makes room for it."},

  // ------------------------------------------------ D. 2010 Title II regulation, ED 504 rule
  {h: "principle:notice-as-part-of-access", g: "28513850e4794975925f7538fdc096ac",
   provision: "28 CFR 35.106", kind: "mandate",
   quote: "A public entity shall make available to applicants, participants, beneficiaries, and other interested persons information regarding the provisions of this part and its applicability to the services, programs, or activities of the public entity",
   why: "The notice duty itself. 28 CFR 35.163 (information and signage) extends it to the physical route to access."},
  {h: "principle:bounded-duty-burden-limits", g: "28513850e4794975925f7538fdc096ac",
   provision: "28 CFR 35.150(a)(3); 28 CFR 35.164", kind: "mandate", quote: null,
   why: "The limits as they apply to program access and to effective communication. The 2024 rule states that 35.204 mirrors them."},
  {h: "principle:program-accessibility-as-proactive-duty", g: "28513850e4794975925f7538fdc096ac",
   provision: "28 CFR 35.150(a)", kind: "mandate",
   quote: "A public entity shall operate each service, program, or activity so that the service, program, or activity, when viewed in its entirety, is readily accessible to and usable by individuals with disabilities.",
   why: "The program-access duty: systemic, viewed as a whole, and not triggered by a request."},
  {h: "principle:equally-effective-access", g: "28513850e4794975925f7538fdc096ac",
   provision: "28 CFR 35.130(b)(1)(iii)", kind: "mandate",
   quote: "Provide a qualified individual with a disability with an aid, benefit, or service that is not as effective in affording equal opportunity to obtain the same result, to gain the same benefit, or to reach the same level of achievement as that provided to others",
   why: "The Title II test the principle restates: same result, same benefit, same level of achievement."},
  {h: "principle:equally-effective-access", gt: "ED Section 504 Regulation (34 CFR Part 104)",
   provision: "34 CFR 104.4(b)(1)(iii)", kind: "mandate",
   quote: "Provide a qualified handicapped person with an aid, benefit, or service that is not as effective as that provided to others",
   why: "Section 504's parallel prohibition, which reaches every CSU operation through federal funding."},

  // ---------------------------------------------------- E. ATI policy and student policy
  {h: "principle:institution-wide-responsibility", g: "ae8c836ef5354e18afdedf905935ada7",
   provision: "CSU ATI Policy (2024), Vision", kind: "mandate",
   quote: "Technology accessibility is an institution-wide responsibility that requires commitment and involvement from leadership across the enterprise.",
   why: "Stated as the first ATI principle."},
  {h: "principle:equally-effective-access", g: "ae8c836ef5354e18afdedf905935ada7",
   provision: "CSU ATI Policy (2024), Vision", kind: "mandate",
   quote: "Technology for individuals with disabilities must provide access to obtain the same result, gain the same benefit or have the same opportunity to reach the same level of achievement as persons without disabilities.",
   why: "The second ATI principle, in the words of 28 CFR 35.130(b)(1)(iii)."},
  {h: "principle:universal-design-over-accommodation", g: "ae8c836ef5354e18afdedf905935ada7",
   provision: "CSU ATI Policy (2024), Vision", kind: "mandate",
   quote: "The implementation of Universal Design principles should reduce the need for, and costs associated with, individual accommodations for inaccessible technology products.",
   why: "The principle's actual source: the third ATI principle."},
  {h: "principle:capability-maturity-over-binary-compliance", g: "ae8c836ef5354e18afdedf905935ada7",
   provision: "CSU ATI Policy (2024), Key Strategies", kind: "mandate",
   quote: "The CSU is using a \"capabilities maturity\" strategy to achieve its vision for accessibility.",
   why: "The policy sets six status levels (Not Started to Optimized) and an Established baseline on timelines."},
  {h: "principle:continuous-sustained-remediation", g: "ae8c836ef5354e18afdedf905935ada7",
   provision: "CSU ATI Policy (2024), Key Strategies", kind: "mandate",
   quote: "During this extended remediation period, the CSU should work to achieve incremental improvements in barrier removal each year.",
   why: "Continuous quality improvement is a named key component."},
  {h: "principle:prioritization-by-impact", g: "ae8c836ef5354e18afdedf905935ada7",
   provision: "CSU ATI Policy (2024), Key Strategies", kind: "mandate",
   quote: "campuses should select ATI implementation activities that target accessibility barriers with the greatest impact",
   why: "Prioritization under finite resources is a named key component; the ATI Prioritization Framework carries it out."},
  {h: "principle:local-adaptation-flexibility", g: "ae8c836ef5354e18afdedf905935ada7",
   provision: "CSU ATI Policy (2024), Implementation Approach", kind: "mandate",
   quote: "to ensure that campuses have adequate flexibility to manage their ATI implementation",
   why: "The implementation approach was built with the Executive Sponsors Steering Committee for campus variation."},
  {h: "principle:shared-responsibility-requiring-coordination", g: "ae8c836ef5354e18afdedf905935ada7",
   provision: "CSU ATI Policy (2024), Implementing the ATI Plan", kind: "mandate",
   quote: "Ensuring the accessibility of information technology and resources is a shared responsibility and requires a coordinated, ongoing effort to ensure its success.",
   why: "Stated as the basis for executive sponsor leadership and the ATI Steering Committee."},
  {h: "principle:equally-effective-access", g: "e6f402d1454048baa0774281e82e64d7",
   provision: "CSU Policy for Provision of Accommodations and Support Services to Students with Disabilities, Policy", kind: "mandate",
   quote: "The CSU will provide appropriate accommodations and support services and make reasonable modifications in policies, practices, or procedures when necessary to avoid discrimination on the basis of disability",
   why: "The student-facing accommodation commitment."},
  {h: "principle:bounded-duty-burden-limits", g: "e6f402d1454048baa0774281e82e64d7",
   provision: "CSU Policy for Provision of Accommodations and Support Services to Students with Disabilities, Policy", kind: "mandate",
   quote: "would result in a fundamental alteration in the nature of the service, program, or activity or would create undue financial or administrative burdens",
   why: "CSU policy adopts the same two limits for student accommodations."},

  // ---------------------------------------------------------------- F. Remaining edges
  {h: "principle:conformance-to-an-external-technical-standard", g: "7b8f0d60d1cc4f4f8cfc35fdbad73852",
   provision: "WCAG 2.1 Level AA", kind: "mandate", quote: null,
   why: "The standard the 2024 rule incorporates by reference (28 CFR 35.200(b), 35.202(b)). It is the measure, not the source of the duty."},
  {h: "principle:program-accessibility-as-proactive-duty", g: "247ccd3b219d4cec85ecbc2e57be154c",
   provision: "Cal. Gov. Code 7405(a)", kind: "interpretation",
   quote: "in developing, procuring, maintaining, or using electronic or information technology",
   why: "7405 applies a technology standard in advance of any request, for state entities' ICT. That is proactive, but it is a technology duty, not Title II's program-access duty."},
  {h: "principle:program-accessibility-as-proactive-duty", g: "2d9ef5513cca4b4a958c1f3e6a84aac6",
   provision: "29 U.S.C. 794d", kind: "interpretation", quote: null,
   why: "Section 508 binds federal agencies and reaches the CSU through Government Code 7405 and 11135."},
  {h: "principle:closest-to-capacity", g: "2d9ef5513cca4b4a958c1f3e6a84aac6",
   provision: "29 U.S.C. 794d", kind: "design_choice", quote: null,
   why: "Section 508 assigns the duty to the agency that develops, procures, maintains or uses the ICT. Locating it with the party closest to remediation capacity is governance design."},
  {h: "principle:universal-design-over-accommodation", g: "247ccd3b219d4cec85ecbc2e57be154c",
   provision: "Cal. Gov. Code 7405(a)", kind: "design_choice", quote: null,
   why: "A technology standard applied up front makes room for universal design without naming it."},
  {h: "principle:universal-design-over-accommodation", g: "2d9ef5513cca4b4a958c1f3e6a84aac6",
   provision: "29 U.S.C. 794d", kind: "design_choice", quote: null,
   why: "As for 7405: the standard permits the approach and does not require it."}
] AS row
MATCH (p:Principle {handle: row.h})
MATCH (g) WHERE (row.g IS NOT NULL AND g.unique_id = row.g)
             OR (row.gt IS NOT NULL AND g.title = row.gt AND (g:Law OR g:Directive))
MERGE (p)-[r:derives_from]->(g)
SET r.provision = row.provision, r.grounding_kind = row.kind, r.quote = row.quote,
    r.rationale = row.why, r.assessed_date = date("2026-10-06");
