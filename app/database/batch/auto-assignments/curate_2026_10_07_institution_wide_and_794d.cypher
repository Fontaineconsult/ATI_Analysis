// =====================================================================================
// Follow-ups to the rationale pass: institution-wide principle text, and 29 U.S.C. 794d.
// Run 2026-10-07 by Daniel Fontaine.
//
// 1. principle:institution-wide-responsibility had no description_full, the only one of
//    21 principles without it. The text below states where the duty sits, from sources
//    already in the graph: 42 U.S.C. 12132 (the public entity), 29 U.S.C. 794 (the
//    recipient's operations), the 2024 ATI policy's first Vision principle, and EO 1111
//    IV.C.1 (president and chancellor responsible for resourced programs). It separates
//    this principle from shared-responsibility-requiring-coordination (how the work is
//    coordinated) and closest-to-capacity (who remediates).
//    Not done: no new grounding edges and no shapes. The text names no schema element.
//
// 2. The Section 508 node (2d9ef551) had one stored source, a Section508.gov page that
//    links to 29 U.S.C. 794d without reproducing it, so four rationales said the statute's
//    text was not in the graph. Cornell LII's 794d page was fetched 2026-10-07 and its
//    text is written separately through neo4j-cli (13,948 chars). The four edges get
//    rationales, sharper provisions and verbatim quotes from that text. grounding_kind
//    is unchanged on all four. What the text shows: 794d(a)(1)(A) binds each federal
//    department or agency when it develops, procures, maintains, or uses electronic and
//    information technology, for federal employees and members of the public, unless an
//    undue burden would result; 794d(a)(1)(B) requires an alternative means of access
//    where meeting the Access Board standards is an undue burden; 794d(f) complaints run
//    against federal departments and agencies; the section does not mention states.
//
// VALIDATE FIRST
//   python -m app.database.cypher_runner.run_file app/database/batch/auto-assignments/curate_2026_10_07_institution_wide_and_794d.cypher
//   python -m app.database.cypher_runner.run_file app/database/batch/auto-assignments/curate_2026_10_07_institution_wide_and_794d.cypher --execute
// =====================================================================================


// --- 1. Institution-wide responsibility: full text ------------------------------------
MATCH (p:Principle {handle: "principle:institution-wide-responsibility"})
SET p.description_full = "The duty to provide accessible technology belongs to the institution as a whole. Title II places it on the public entity, and Section 504 places it on the recipient of federal funds across all of its operations. Neither assigns it to an office within the institution. CSU policy says the same in its own terms: technology accessibility is an institution-wide responsibility that requires commitment and involvement from leadership across the enterprise. EO 1111 makes each campus president and the chancellor responsible for accessible technology programs with adequate administrative support and resources. Two consequences follow. No single office, whether disability services, information technology, or an accessibility team, owns the duty, and giving one of them the work does not move the obligation off the institution. Because the duty reaches every program, leadership commits resources across all of them rather than treating accessibility as one unit's mandate. This principle concerns where the duty sits. How the work is divided and coordinated among the units that carry it out belongs to the principle of shared responsibility, and who remediates a given asset belongs to the principle that responsibility sits closest to capacity.";


// --- 2a. Source page for 29 U.S.C. 794d ----------------------------------------------
MERGE (w:Webpage {url: "https://www.law.cornell.edu/uscode/text/29/794d"})
ON CREATE SET w.unique_id = replace(randomUUID(), "-", ""),
              w.name = "29 U.S. Code § 794d - Electronic and information technology",
              w.include_in_report = true, w.depreciated = false, w.no_longer_exists = false
WITH w
MATCH (l:Law {unique_id: "2d9ef5513cca4b4a958c1f3e6a84aac6"})
MERGE (l)-[r:is_sourced_from]->(w)
ON CREATE SET r.added_date = date("2026-10-07");


// --- 2b. The four Section 508 edges --------------------------------------------------
UNWIND [
  {h: "principle:closest-to-capacity", provision: "29 U.S.C. 794d(a)(1)(A)",
   quote: "When developing, procuring, maintaining, or using electronic and information technology, each Federal department or agency, including the United States Postal Service, shall ensure, unless an undue burden would be imposed on the department or agency",
   why: "Section 794d(a)(1)(A) places the duty on each federal department or agency when it develops, procures, maintains, or uses electronic and information technology, unless an undue burden would result. It names the department or agency as a whole. It assigns no responsibility to any unit within it."},
  {h: "principle:program-accessibility-as-proactive-duty", provision: "29 U.S.C. 794d(a)(1)(A)",
   quote: "individuals with disabilities who are members of the public seeking information or services from a Federal department or agency to have access to and use of information and data that is comparable",
   why: "Section 794d(a)(1)(A) requires each federal department or agency, when it develops, procures, maintains, or uses electronic and information technology, to ensure that federal employees and members of the public with disabilities have access to information and data comparable to that of others. The requirement attaches to the technology, not to a request. The section names only federal departments and agencies."},
  {h: "principle:state-law-adopts-the-federal-standard", provision: "29 U.S.C. 794d(a)(1); 29 U.S.C. 794d(f)",
   quote: "each Federal department or agency, including the United States Postal Service, shall ensure",
   why: "Section 794d(a)(1) applies to each federal department or agency, including the United States Postal Service. Its complaint procedure in 794d(f) lets an individual complain that a federal department or agency has failed to comply. The section does not mention states. Government Code 7405 is the provision that applies Section 508's requirements to California state entities."},
  {h: "principle:universal-design-over-accommodation", provision: "29 U.S.C. 794d(a)(1)(A)-(B)",
   quote: "shall provide individuals with disabilities covered by paragraph (1) with the information and data involved by an alternative means of access that allows the individual to use the information and data",
   why: "Section 794d(a)(1)(A) applies the accessibility requirement when technology is developed, procured, maintained, or used, which is before any individual asks. Section 794d(a)(1)(B) requires an alternative means of access where meeting the Access Board standards would impose an undue burden. The section does not use the term universal design."}
] AS row
MATCH (p:Principle {handle: row.h})-[r:derives_from]->(:Law {unique_id: "2d9ef5513cca4b4a958c1f3e6a84aac6"})
SET r.provision = row.provision, r.quote = row.quote, r.rationale = row.why,
    r.assessed_date = date("2026-10-07");
