// =====================================================================================
// Governance pass, Phase 2: four principles for where the laws meet and complicate.
// Run 2026-10-06 by Daniel Fontaine. Follows Phase 1a (consolidation) and 1b (instruments
// and source text).
//
// WHY THIS PASS RAN
//   Every existing principle grounds in Title II or the ATI. Nothing grounded in Section
//   504, ADA Title I, or California law, so the graph could not say how those laws change
//   the Title II picture. Phase 1b put the primary text in the graph; these four
//   principles state the interactions and cite it.
//
// THE FOUR PRINCIPLES
//   principle:parallel-duties-conformance-and-accommodation
//   principle:audience-determines-governing-duty
//   principle:federal-funding-reaches-every-operation
//   principle:state-law-adopts-the-federal-standard
//
// GROUNDING EDGES
//   Each derives_from carries the properties the 2026-10-06 Title II pass introduced:
//   provision, grounding_kind (mandate | interpretation | design_choice | unverified),
//   quote, rationale, assessed_date. Every quote was checked, before this file ran,
//   against the raw_text of the grounding node or its sources (see the run report). The
//   2024 ATI policy's quote is checked against the 2021 memo, which the policy carries
//   forward verbatim and whose node holds the text.
//
// NOT DONE HERE
//   - shapes edges (principle -> SchemaElement). Fifteen of sixteen existing principles
//     shape nothing; that is a separate pass.
//   - Phase 3 (procurement grounding, re-pointing the eight Title II statute edges,
//     remaining edge properties).
//
// VALIDATE FIRST
//   python -m app.database.cypher_runner.run_file app/database/batch/auto-assignments/curate_2026_10_06_governance_phase2_principles.cypher
//   python -m app.database.cypher_runner.run_file app/database/batch/auto-assignments/curate_2026_10_06_governance_phase2_principles.cypher --execute
// =====================================================================================


// --- Principles ------------------------------------------------------------------------
UNWIND [
  {h: "principle:parallel-duties-conformance-and-accommodation",
   n: "Conformance and accommodation are parallel duties",
   s: "Conforming to the technical standard does not discharge the duty to accommodate an individual, and accommodating an individual does not excuse content that fails the standard.",
   f: "Title II now carries two duties that run at the same time. The 2024 rule requires web content and mobile apps to conform to WCAG 2.1 Level AA by a fixed date, whether or not anyone has asked. The effective communication duty in 28 CFR 35.160 and Section 504's auxiliary aids requirement still apply to each person who needs a different format, including for content the rule excepts. CSU policy gives the individual duty a procedure: EO 1111 requires an interactive process with each student who needs an accommodation. A campus that conforms has reduced how often it must accommodate, but it has not removed the duty. A campus that accommodates one person has not made the content conform for the next."},
  {h: "principle:audience-determines-governing-duty",
   n: "The audience determines which duty governs",
   s: "Who uses a system decides which law governs its accessibility: Title II and Section 504 for students and the public, Title I and Section 504 for employees and applicants.",
   f: "The 2024 Title II rule covers the web content and mobile apps a public entity provides. Employment runs on a different track. Under 28 CFR 35.140, Title I and the EEOC's regulation govern employment by a public entity that Title I covers, and the rule states that meeting subpart H does not relieve those obligations. Title I's duty is individual: reasonable accommodation for a known limitation, found through an interactive process and bounded by undue hardship. EO 1111 runs separate interactive processes for students and for employees and applicants. Many campus systems serve both audiences, such as the learning management system faculty teach in and the HR platforms every employee uses. Procurement and remediation planning have to identify the audience before they can identify the duty."},
  {h: "principle:federal-funding-reaches-every-operation",
   n: "Federal funding brings Section 504 to every operation",
   s: "Because the CSU receives federal financial assistance, Section 504 applies to all of its operations, not only to the program the funds pay for.",
   f: "Section 504 prohibits disability discrimination in any program or activity that receives federal financial assistance. The statute defines program or activity as all of the operations of a college, university, or public system of higher education. ED's regulation repeats the definition in 34 CFR 104.3(k). One federal grant therefore brings every CSU operation under Section 504, including operations the 2024 Title II rule excepts or does not reach. ED's regulation sets no web technical standard, so Section 504 reaches technology through nondiscrimination, academic adjustments and auxiliary aids rather than through a conformance date."},
  {h: "principle:state-law-adopts-the-federal-standard",
   n: "California adopts Section 508 as the state's technology standard",
   s: "California law makes the federal Section 508 standard the accessibility requirement for state entities, including the CSU, when they develop, procure, maintain, or use technology.",
   f: "Section 508 binds federal agencies, not states. California imports it. Government Code 7405 requires state governmental entities that develop, procure, maintain, or use electronic or information technology to comply with Section 508 and its regulations. The CSU's ATI policy states that Government Code 11135 applies Section 508 to the CSU. This makes Section 508 the standard for CSU procurement, separate from the Title II rule's WCAG 2.1 Level AA requirement for web content and mobile apps. The two overlap because the revised Section 508 standards incorporate WCAG 2.0 Level AA, but they are different requirements with different scopes and no shared deadline."}
] AS row
MERGE (p:Principle {handle: row.h})
ON CREATE SET p.unique_id = replace(randomUUID(), "-", "")
SET p.name = row.n, p.description_short = row.s, p.description_full = row.f;


// --- Grounding edges -------------------------------------------------------------------
UNWIND [
  // Parallel duties
  {h: "principle:parallel-duties-conformance-and-accommodation", g: "63c25f78f69b4bc0b0db52da6df7fec4",
   provision: "28 CFR Part 35, subpart H (preamble)", kind: "mandate",
   quote: "public entities still have an obligation to meet all of title II's existing requirements both before and after the date they must initially come into compliance with subpart H",
   why: "The rule's own preamble keeps equal access, effective communication and reasonable modification running alongside the technical standard."},
  {h: "principle:parallel-duties-conformance-and-accommodation", g: "28513850e4794975925f7538fdc096ac",
   provision: "28 CFR 35.160(a)(1)", kind: "mandate",
   quote: "A public entity shall take appropriate steps to ensure that communications with applicants, participants, members of the public, and companions with disabilities are as effective as communications with others.",
   why: "The individual effective communication duty, which applies to each person regardless of the content's conformance or exception status."},
  {h: "principle:parallel-duties-conformance-and-accommodation", gt: "ED Section 504 Regulation (34 CFR Part 104)",
   provision: "34 CFR 104.44(d)(1)", kind: "mandate",
   quote: "shall take such steps as are necessary to ensure that no handicapped student is denied the benefits of, excluded from participation in, or otherwise subjected to discrimination because of the absence of educational auxiliary aids for students with impaired sensory, manual, or speaking skills",
   why: "Section 504's postsecondary auxiliary aids duty is individual and has no conformance safe harbor."},
  {h: "principle:parallel-duties-conformance-and-accommodation", g: "ae34235450c4443b8b4298540b677903",
   provision: "EO 1111, student accommodation", kind: "mandate",
   quote: "The CSU is required to conduct an interactive process with a student with a disability to assess the functional impact of a person’s disability and to identify reasonable accommodation(s)",
   why: "CSU policy makes the individual duty a required process for every student who needs an accommodation."},

  // Audience determines the governing duty
  {h: "principle:audience-determines-governing-duty", g: "63c25f78f69b4bc0b0db52da6df7fec4",
   provision: "28 CFR Part 35, subpart H (preamble)", kind: "mandate",
   quote: "compliance with subpart H will not relieve title II entities of their distinct employment-related obligations under title I of the ADA",
   why: "DOJ states directly that the web rule does not reach or discharge the employment duty."},
  {h: "principle:audience-determines-governing-duty", g: "28513850e4794975925f7538fdc096ac",
   provision: "28 CFR 35.140(b)(1)", kind: "mandate",
   quote: "apply to employment in any service, program, or activity conducted by a public entity if that public entity is also subject to the jurisdiction of title I",
   why: "Title II's own regulation hands employment to Title I and the EEOC regulation."},
  {h: "principle:audience-determines-governing-duty", gt: "Americans with Disabilities Act Title I (42 U.S.C. 12111-12117)",
   provision: "42 U.S.C. 12112(b)(5)(A)", kind: "mandate",
   quote: "not making reasonable accommodations to the known physical or mental limitations of an otherwise qualified individual with a disability who is an applicant or employee, unless such covered entity can demonstrate that the accommodation would impose an undue hardship on the operation of the business of such covered entity",
   why: "Title I's duty is individual accommodation bounded by undue hardship, not conformance to a standard."},
  {h: "principle:audience-determines-governing-duty", gt: "EEOC ADA Title I Regulation (29 CFR Part 1630)",
   provision: "29 CFR 1630.2(o)(3)", kind: "mandate",
   quote: "necessary for the covered entity to initiate an informal, interactive process with the individual with a disability in need of the accommodation",
   why: "The EEOC regulation names the interactive process that finds the accommodation."},
  {h: "principle:audience-determines-governing-duty", g: "ae34235450c4443b8b4298540b677903",
   provision: "EO 1111, employee accommodation", kind: "mandate",
   quote: "Each campus and the Chancellor’s Office shall engage in a timely, good faith, interactive process with employees or applicants with disabilities to determine effective reasonable accommodations",
   why: "CSU policy runs a separate employee and applicant process alongside the student process, and its scope names human resources services and information technology."},

  // Federal funding reaches every operation
  {h: "principle:federal-funding-reaches-every-operation", g: "17825dbe87af4c01baa232ab390136b1",
   provision: "29 U.S.C. 794(b)(2)(A)", kind: "mandate",
   quote: "the term “program or activity” means all of the operations of",
   why: "The definition continues with \"a college, university, or other postsecondary institution, or a public system of higher education\", which is the CSU."},
  {h: "principle:federal-funding-reaches-every-operation", gt: "ED Section 504 Regulation (34 CFR Part 104)",
   provision: "34 CFR 104.3(k)", kind: "mandate",
   quote: "Program or activity means all of the operations of",
   why: "ED's regulation repeats the statutory definition for its recipients."},

  // California adopts Section 508
  {h: "principle:state-law-adopts-the-federal-standard", g: "247ccd3b219d4cec85ecbc2e57be154c",
   provision: "Cal. Gov. Code 7405(a)", kind: "mandate",
   quote: "in developing, procuring, maintaining, or using electronic or information technology, either indirectly or through the use of state funds by other entities, shall comply with the accessibility requirements of Section 508 of the federal Rehabilitation Act of 1973",
   why: "The state statute that makes Section 508 the requirement for state governmental entities."},
  {h: "principle:state-law-adopts-the-federal-standard", g: "849abdeb538443e8be1e93e3b280d336",
   provision: "Cal. Gov. Code 11135(d)", kind: "unverified", quote: null,
   why: "The CSU's ATI policy cites 11135 as applying Section 508 to the CSU, but the statute's own text is not in the graph; every online copy refused automated retrieval."},
  {h: "principle:state-law-adopts-the-federal-standard", g: "ae8c836ef5354e18afdedf905935ada7",
   provision: "CSU ATI Policy (2024), Background", kind: "mandate",
   quote: "California Government Code 11135 applies Section 508 of the 1973 Rehabilitation Act, as amended in 1998, to state entities and to the California State University (CSU).",
   why: "The CSU's own statement of the state-law basis. Checked against the 2021 memo text, which the 2024 policy carries forward."},
  {h: "principle:state-law-adopts-the-federal-standard", g: "2d9ef5513cca4b4a958c1f3e6a84aac6",
   provision: "29 U.S.C. 794d", kind: "interpretation", quote: null,
   why: "Section 508 itself binds federal agencies. It reaches the CSU only through Government Code 7405 and 11135, which is the point of the principle."}
] AS row
MATCH (p:Principle {handle: row.h})
MATCH (g) WHERE (row.g IS NOT NULL AND g.unique_id = row.g)
             OR (row.gt IS NOT NULL AND g.title = row.gt AND (g:Law OR g:Directive))
MERGE (p)-[r:derives_from]->(g)
SET r.provision = row.provision, r.grounding_kind = row.kind, r.quote = row.quote,
    r.rationale = row.why, r.assessed_date = date("2026-10-06");
