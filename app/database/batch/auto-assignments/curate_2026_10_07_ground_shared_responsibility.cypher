// =====================================================================================
// Ground principle:shared-responsibility-requiring-coordination in law and Board policy.
// Run 2026-10-07 by Daniel Fontaine.
//
// WHY
//   The principle rested on one edge, to the 2024 ATI policy ("Implementing the ATI
//   Plan"). The policy is not the origin of the idea. EO 1111 states it first, in almost
//   the same words, and both Title II and Section 504 require a designated coordinator,
//   which is the legal floor under "a coordinating function exists to provide" the
//   coordinated effort. The 2024 memo then splits coordination from sponsorship.
//
// GROUNDING (quotes checked verbatim against stored raw_text before this file ran)
//   EO 1111 IV.C and II.B         mandate  shared responsibility; campus ADA coordinator
//   28 CFR 35.107(a)              mandate  Title II responsible employee (50+ employees)
//   34 CFR 104.7(a)               mandate  Section 504 responsible employee (15+)
//   2024 Relyea memorandum        mandate  ATI Coordinator distinct from Executive Sponsor
//   2024 ATI policy (existing)    mandate  rationale updated: steering committee membership
//
// A LIMIT RECORDED IN THE RATIONALES
//   The law requires a coordinator and the CSU requires a coordinated effort. The
//   principle's further claims, the line-versus-functional-authority distinction and the
//   second-line role, are the graph's own governance design. No source here states them.
//
// VALIDATE FIRST
//   python -m app.database.cypher_runner.run_file app/database/batch/auto-assignments/curate_2026_10_07_ground_shared_responsibility.cypher
//   python -m app.database.cypher_runner.run_file app/database/batch/auto-assignments/curate_2026_10_07_ground_shared_responsibility.cypher --execute
// =====================================================================================

UNWIND [
  {g: "ae34235450c4443b8b4298540b677903",
   provision: "EO 1111 IV.C; EO 1111 II.B", kind: "mandate",
   quote: "Ensuring accessibility is a shared responsibility and requires a coordinated, ongoing campus wide and systemwide effort to ensure its success.",
   why: "The Board-level source of the principle; the ATI policy repeats it. II.B adds that each campus shall designate an employee to coordinate compliance with the ADA and the order."},
  {g: "28513850e4794975925f7538fdc096ac",
   provision: "28 CFR 35.107(a)", kind: "mandate",
   quote: "shall designate at least one employee to coordinate its efforts to comply with and carry out its responsibilities under this part",
   why: "Title II requires a coordinating function in any public entity with 50 or more employees, and requires its contact details to be published."},
  {gt: "ED Section 504 Regulation (34 CFR Part 104)",
   provision: "34 CFR 104.7(a)", kind: "mandate",
   quote: "shall designate at least one person to coordinate its efforts to comply with this part",
   why: "Section 504 requires the same of any recipient with 15 or more employees."},
  {gt: "CSU Memorandum: Department of Justice Title II ADA Ruling and Campus Responsibilities (2024)",
   provision: "2024 memorandum, Reaffirm Your Campus Commitment to ATI", kind: "mandate",
   quote: "Confirm the designation of an ATI Coordinator. This role, distinct from the ATI Executive Sponsor, is critical for overseeing daily compliance, driving necessary changes, and improving digital accessibility.",
   why: "Separates the coordinating role from executive sponsorship. The memo also assigns remediation responsibility to LMS and web CMS owners, the distributed actors being coordinated."},
  {g: "ae8c836ef5354e18afdedf905935ada7",
   provision: "CSU ATI Policy (2024), Implementing the ATI Plan", kind: "mandate",
   quote: "Ensuring the accessibility of information technology and resources is a shared responsibility and requires a coordinated, ongoing effort to ensure its success.",
   why: "Repeats EO 1111 IV.C for technology and gives it a structure: the executive sponsor convenes an ATI Steering Committee drawn from senates, faculty development, academic technology, disability services, equity and ADA compliance. The line-versus-functional-authority reading of the principle is the graph's design, not the policy's."}
] AS row
MATCH (p:Principle {handle: "principle:shared-responsibility-requiring-coordination"})
MATCH (g) WHERE (row.g IS NOT NULL AND g.unique_id = row.g)
             OR (row.gt IS NOT NULL AND g.title = row.gt AND (g:Law OR g:Directive OR g:Memo))
MERGE (p)-[r:derives_from]->(g)
SET r.provision = row.provision, r.grounding_kind = row.kind, r.quote = row.quote,
    r.rationale = row.why, r.assessed_date = date("2026-10-07");
