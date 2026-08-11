// =============================================================================
// INGEST — Library accessibility request intake/referral as a named Process
// Date:   2026-08-07
// Target: 2025-2026 reporting year, SFSU, Instructional Materials (ins)
// =============================================================================
//
// SOURCE
//   Email from Dean Christy Stevens, 2026-08-07, describing how the Library
//   currently handles accessibility problems, sent in reply to the question
//   "if a student encounters information they cannot access, who do they go to
//   at the library, and how do they know that?" The email also forwards an
//   April 2026 request from David Walker (Director, Systemwide Digital Library
//   Services, Chancellor's Office) asking every CSU library to name an
//   accessibility contact, driven by Rapido resource sharing and the Title II
//   deadline.
//
// ROUTING
//   Implementation / Process. Signal is S1 — the Dean describing current,
//   operating practice in the first person ("most Library questions ... are
//   funneled through our Chat and Email services"), not intent. Sub-routed to
//   Process rather than Service because what is being recorded is the
//   repeatable intake-and-triage workflow, which has no endpoint. Ask a
//   Librarian is the standing service the workflow runs through, and is named
//   in the description rather than modeled separately. Not a Procedure: the
//   routing rule is established practice, not a documented method.
//
//   Evidence strength 2 (Partial) against 7.11-ins. The indicator covers
//   acquiring, converting, digitizing, creating, and maintaining library
//   assets. This process directly addresses converting and maintaining
//   (producing accessible formats on request, keeping access working) and does
//   not touch acquiring, digitizing, or creating. Matches the strength given to
//   the ETD process, which has the same partial reach.
//
// SCOPE HELD DELIBERATELY NARROW
//   Wired to 7.11-ins only, per instruction. This process is also live evidence
//   for 6.8-web (ensuring people know who to contact) and 1.19-web (a method to
//   report and address issues) — both one-line additions, held for approval
//   rather than assumed.
//
//   No Message node is created for the source email, and David Walker and
//   Rapido are not created as nodes. Those belong with the meeting-transcript
//   ingest so provenance lands together.
//
// OWNERSHIP
//   owned_by Christy Stevens, who is accountable today and already `implements`
//   this YSE. The purpose of the pending meeting is to designate a maintainer,
//   at which point that person is added (or replaces her) on this node.
// =============================================================================


MERGE (p:Process {title: "Accessibility Request Intake and Referral (J. Paul Leonard Library)"})
ON CREATE SET p.unique_id = randomUUID(),
              p.retired = false,
              p.description = "How the Library receives and routes reports of content a user cannot access. Intake is deliberately general rather than accessibility-specific. Users reach the Library through Ask a Librarian chat and email, displayed throughout the Library website and offered by a timed pop-up, and through a report-a-problem link carried on individual OneSearch records. Chat and email are monitored by many Library faculty and staff, who triage each request to one of four outcomes: resolve it directly, refer the user to the DPRC for an accommodation, produce an accessible format such as printing or locating an OCRed PDF, or contact the vendor about the barrier. The design intent is that a user never has to classify their own problem as an accessibility issue or know the name of a particular contact, and most CSU libraries reported operating the same model. Recorded as described by the Dean in August 2026. Four things are absent and are the agreed improvement targets this node exists to track: the triage rule is established practice rather than a documented routing procedure, accessibility requests are not tagged or counted so no volume or pattern is visible, no turnaround is stated, and the vendor-contact outcome does not report back to campus procurement where it would carry weight at renewal.";

MATCH (p:Process {title: "Accessibility Request Intake and Referral (J. Paul Leonard Library)"}), (y:YearSuccessEvidence {year_identifier: "2025-2026-7.11-ins-sfsu"})
MERGE (p)-[r:is_evidence_for]->(y)
ON CREATE SET r.strength = 2;

MATCH (p:Process {title: "Accessibility Request Intake and Referral (J. Paul Leonard Library)"}), (person:Person {unique_id: "d36bdc1040d44e7eb9ccbb9d39b8ab21"})
MERGE (p)-[:owned_by]->(person);
