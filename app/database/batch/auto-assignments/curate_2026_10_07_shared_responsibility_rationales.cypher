// =====================================================================================
// Rewrite the rationales on principle:shared-responsibility-requiring-coordination.
// Run 2026-10-07 by Daniel Fontaine. Follows curate_2026_10_07_ground_shared_responsibility.
//
// WHY
//   The first rationales summarized why each source fits. These state what each source
//   provides, read from the stored raw_text around the quoted passage: who carries the
//   responsibility, the thresholds, and the duties the provision pairs with coordination.
//   Only `rationale` changes; provision, grounding_kind, quote and the edges are untouched.
//
// MOVED OUT OF THE RATIONALES
//   The earlier note that the principle's line-versus-functional-authority reading and its
//   second-line role are the graph's governance design, stated by no source. That remains
//   true; it is commentary on the principle, not content of any source, so it lives here.
//
// SOURCE PASSAGES READ
//   EO 1111 II.A-D and IV.C (calstatela.edu PDF); 28 CFR 35.107(a)-(b) and 34 CFR
//   104.7(a)-(b) (eCFR); 2024 Relyea memorandum, "Reaffirm Your Campus Commitment to ATI";
//   2024 ATI policy, "Campus and Chancellor's Office ATI Responsibilities" and
//   "Implementing the ATI Plan".
//
// VALIDATE FIRST
//   python -m app.database.cypher_runner.run_file app/database/batch/auto-assignments/curate_2026_10_07_shared_responsibility_rationales.cypher
//   python -m app.database.cypher_runner.run_file app/database/batch/auto-assignments/curate_2026_10_07_shared_responsibility_rationales.cypher --execute
// =====================================================================================

UNWIND [
  {g: "ae34235450c4443b8b4298540b677903",
   why: "Section IV.C states the shared responsibility and assigns it. Each campus president and the chancellor establish technology programs with adequate administrative support and resources to achieve the ATI's goals. Each appoints an ATI Executive Sponsor, who convenes a campus ATI Steering Committee to ensure compliance with the coded memoranda. Section II.B requires each campus to designate an employee to coordinate compliance with the ADA and the order and to post that employee's contact information, and II.C requires each campus and the Chancellor's Office to provide funding, resources and training for compliance."},
  {g: "28513850e4794975925f7538fdc096ac",
   why: "Section 35.107(a) requires a public entity with 50 or more employees to designate at least one employee to coordinate its compliance with Part 35, including investigating complaints of noncompliance. The entity must make the coordinator's name, office address and telephone number available to all interested individuals. Section 35.107(b) pairs the coordinator with published grievance procedures for the prompt and equitable resolution of complaints."},
  {gt: "ED Section 504 Regulation (34 CFR Part 104)",
   why: "Section 104.7(a) requires a recipient with fifteen or more employees to designate at least one person to coordinate its compliance with Part 104. Section 104.7(b) pairs the coordinator with grievance procedures that incorporate appropriate due process standards. Those procedures need not cover complaints from applicants for employment or for admission to postsecondary institutions."},
  {gt: "CSU Memorandum: Department of Justice Title II ADA Ruling and Campus Responsibilities (2024)",
   why: "The memorandum asks presidents to confirm an ATI Coordinator, a role it distinguishes from the ATI Executive Sponsor and charges with overseeing daily compliance, driving necessary changes and improving digital accessibility. It names the coordinator with the steering committee and subcommittees as the people who align the campus plan with the capability maturity model. It gives the Executive Sponsor the task of promoting awareness at the highest levels of campus leadership. It also asks campuses to assign responsibility for digital content remediation within the LMS and the web CMS."},
  {g: "ae8c836ef5354e18afdedf905935ada7",
   why: "The policy repeats EO 1111's shared-responsibility statement for information technology and places leadership of the effort with the executive sponsor. The sponsor attends monthly Executive Sponsors Steering Committee meetings and convenes an ATI Steering Committee drawn from executive administrators, academic and faculty senates, Centers for Faculty Development, the Academic Technology Office, the Disability Services Office, the Equity and Diversity Office and ADA Compliance. The committee reviews the ATI plan, meets baseline timelines, implements projects and documents progress through the annual report. The sponsor holds committee meetings no less than twice a year and channels ATI communications to the appropriate parties."}
] AS row
MATCH (p:Principle {handle: "principle:shared-responsibility-requiring-coordination"})
MATCH (p)-[r:derives_from]->(g)
WHERE (row.g IS NOT NULL AND g.unique_id = row.g)
   OR (row.gt IS NOT NULL AND g.title = row.gt)
SET r.rationale = row.why, r.assessed_date = date("2026-10-07");
