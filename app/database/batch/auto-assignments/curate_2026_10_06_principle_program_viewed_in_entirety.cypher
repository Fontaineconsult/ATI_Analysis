// =====================================================================================
// Principle: access is measured across the program, with latitude in method.
// Run 2026-10-06 by Daniel Fontaine.
//
// WHY
//   "Viewed in its entirety" appeared only inside principle:program-accessibility-as-
//   proactive-duty, as one clause of a principle about something else (proactive, not
//   on request), and as the quote on that principle's 28 CFR 35.150(a) edge. The idea
//   itself, that access is judged at the program level and the institution may choose
//   among effective methods, had no principle and no grounding. ED's Section 504
//   regulation for it (34 CFR 104.22) was not grounded anywhere. It matters for the
//   presentation because it is the 504-era latitude the 2024 Title II rule narrows for
//   web content and mobile apps.
//
// GROUNDING (quotes checked verbatim against stored raw_text before this file ran)
//   ED 34 CFR 104.22(a)       mandate          program viewed in its entirety
//   28 CFR 35.150(b)(1)       mandate          method latitude, integration priority
//   2024 rule, 28 CFR 35.202  mandate          the narrowing for web content
//
// TRIM (user decision)
//   principle:program-accessibility-as-proactive-duty is trimmed so each principle says
//   one thing. Its "viewed in their entirety" clause, its "program is the natural unit"
//   sentence, and "as a whole" in its short description move to the new principle; it
//   keeps the proactive, systemic, never-satisfied-by-accommodation claim and points to
//   the new principle for the unit of measurement. Its 28 CFR 35.150(a) edge is unchanged.
//
// VALIDATE FIRST
//   python -m app.database.cypher_runner.run_file app/database/batch/auto-assignments/curate_2026_10_06_principle_program_viewed_in_entirety.cypher
//   python -m app.database.cypher_runner.run_file app/database/batch/auto-assignments/curate_2026_10_06_principle_program_viewed_in_entirety.cypher --execute
// =====================================================================================

MERGE (p:Principle {handle: "principle:program-viewed-in-its-entirety"})
ON CREATE SET p.unique_id = replace(randomUUID(), "-", "")
SET p.name = "Access is measured across the program, with latitude in method",
    p.description_short = "The duty is to make each program accessible when viewed in its entirety, so the institution may choose among effective methods instead of making every facility or artifact accessible, with priority to the most integrated setting. For web content and mobile apps, the 2024 Title II rule narrows that latitude.",
    p.description_full = "Section 504 and Title II measure access at the level of the program. ED's regulation requires a recipient to operate its program so that, when each part is viewed in its entirety, it is readily accessible. It does not require every existing facility, or every part of one, to be accessible. A recipient may use any effective method, such as moving a class to an accessible building, and need not make structural changes where other methods work. Title II's regulation at 28 CFR 35.150 uses the same test and gives priority to methods that offer the most integrated setting appropriate. This latitude is why an alternative format or route can satisfy the duty. The 2024 Title II rule narrows it for web content and mobile apps: content must conform to WCAG 2.1 Level AA, and conforming alternate versions are allowed only where direct accessibility is not possible for technical or legal reasons. The program-level test still governs what falls outside the rule's technical scope, and it still shapes how a campus answers an individual's request.";

UNWIND [
  {gt: "ED Section 504 Regulation (34 CFR Part 104)",
   provision: "34 CFR 104.22(a)-(b)", kind: "mandate",
   quote: "A recipient shall operate its program or activity so that when each part is viewed in its entirety, it is readily accessible to handicapped persons.",
   why: "The test is program-level. 104.22(a) adds that it does not require each existing facility to be accessible, and 104.22(b) allows any effective method and excuses structural changes where other methods work."},
  {g: "28513850e4794975925f7538fdc096ac",
   provision: "28 CFR 35.150(a)-(b)(1)", kind: "mandate",
   quote: "In choosing among available methods for meeting the requirements of this section, a public entity shall give priority to those methods that offer services, programs, and activities to qualified individuals with disabilities in the most integrated setting appropriate.",
   why: "Title II's version of the same test, with method latitude and an integration priority on the choice among methods."},
  {g: "63c25f78f69b4bc0b0db52da6df7fec4",
   provision: "28 CFR 35.200(b); 28 CFR 35.202", kind: "mandate",
   quote: "only where it is not possible to make web content directly accessible due to technical or legal limitations",
   why: "For web content and mobile apps the rule replaces method latitude with conformance, and confines alternate versions to technical or legal impossibility."}
] AS row
MATCH (p:Principle {handle: "principle:program-viewed-in-its-entirety"})
MATCH (g) WHERE (row.g IS NOT NULL AND g.unique_id = row.g)
             OR (row.gt IS NOT NULL AND g.title = row.gt AND (g:Law OR g:Directive))
MERGE (p)-[r:derives_from]->(g)
SET r.provision = row.provision, r.grounding_kind = row.kind, r.quote = row.quote,
    r.rationale = row.why, r.assessed_date = date("2026-10-06");

// --- Trim the overlapping clause from the older principle ---------------------------
MATCH (p:Principle {handle: "principle:program-accessibility-as-proactive-duty"})
SET p.description_short = "The institution must make its programs, services, and activities accessible in advance, independent of any individual request.",
    p.description_full = "The institution must make its programs, services, and activities readily accessible to and usable by people with disabilities. The defining feature of this duty is that it is proactive and systemic: accessibility must be built into the institution's digital presence ahead of need and for the general population of users, not produced reactively in response to a particular person's request. Program accessibility is a standing obligation on the interfaces and assets the institution offers, distinct from and never satisfied by individual accommodation. The unit at which the duty is measured, and the latitude in method that follows from it, belong to the principle that access is measured across the program. Compliance dates and the instruments that set them belong on the governance nodes this principle derives from, never in this text.";
