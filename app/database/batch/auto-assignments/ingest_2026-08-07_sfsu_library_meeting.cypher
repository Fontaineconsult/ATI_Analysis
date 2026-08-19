// =============================================================================
// INGEST — SF State Library meeting, 2026-08-07
// Source: MeetingMinutes "Meeting Notes: SF State Library — Accessibility
//         Processes and ICT Tracking" (fdeb8af16d204c818d85ac017fa84af6)
// Target: 2025-2026 · sfsu · Instructional Materials (7.11-ins)
// =============================================================================
//
// PARTICIPANTS / IDENTITY
//   Daniel Fontaine · Christy Stevens · Ya Wang · Matthew James Martin
//   ("Matt Martin" in the minutes) · Michael McCourt. All already in the graph.
//   "Montasha" in the minutes resolves to Mantasha Lakdawala, Accessible
//   Procurement Analyst — already present, no node created.
//   "Devin" is first-name only and peripheral (Matt's colleague on the internal
//   workflow). Kept in Note prose, no Person node, per the identity protocol.
//   David Walker (Chancellor's Office) is from the prior email thread, not this
//   meeting, and is deliberately left for that source's own ingest.
//
// ROUTING DECISIONS TAKEN BY THE USER
//   - The "Stage 1 / Stage 2" internal remediation workflow is NOT a new node.
//     It is the existing Process "Accessibility Process for Electronic Theses
//     and Dissertations". Matt is recorded as its owner instead.
//   - https://library.sfsu.edu/databases is the source of record for the ICT
//     inventory. Created as a Webpage here. The aggregate Asset over the 200+
//     databases is NOT created — see OPEN below.
//   - MeetingMinutes edges are already correct. Not touched.
//
// SIGNAL GRADING
//   S1 (operating practice, first person): vendor ticket handling via Ya's
//   team, Ask a Librarian intake, VPAT collection at acquisition, ETD templates
//   in active use, BATV remediation underway.
//   Spoken figures ($900k SDLC, ~80% of ~3,000 videos, "very few" tickets) are
//   Note content, not Metrics — no artifact is in hand.
//
//   NO Plans and NO Query are created (user decision). The action items and the
//   open SpringShare conformance question stay in the minutes and in the Notes
//   below rather than becoming tracked nodes.
//
// OPEN / NOT DONE HERE
//   - Aggregate Asset for the 200+ databases. The meeting established that
//     roughly two-thirds are procured centrally (ECC + SDLC opt-in) and a third
//     locally, so a single aggregate stewarded by the Library would repeat the
//     SpringShare error. Needs a split decision first.
//   - Quartex is still scoped campus/sfsu from the 2026-08-05 ingest. The
//     meeting did not address how it is procured. Unverified, left alone.
//   - BATV is ~80% complete, so it is NOT an Accomplishment yet.
// =============================================================================


// -----------------------------------------------------------------------------
// 1. Webpage — the ICT inventory source of record
// -----------------------------------------------------------------------------

MERGE (w:Webpage {url: "https://library.sfsu.edu/databases"})
ON CREATE SET w.unique_id = randomUUID(),
              w.name = "SF State Library Databases A-Z",
              w.description = "Public list of the 200+ databases the Library subscribes to, purchases, or makes available. Filterable A-Z or viewable in full. Established in the 2026-08-07 meeting as the source of record for the Library ICT inventory: anything with an accessibility-relevant interface (text, video, audio, interactive elements, images, charts) is reachable from this page. Note on terminology recorded by Ya Wang: a library database is a collection of content accessed through a vendor website, not licensed software in the IT sense.",
              w.no_longer_exists = false,
              w.depreciated = false,
              w.include_in_report = true;

MATCH (w:Webpage {url: "https://library.sfsu.edu/databases"}), (p:Process {title: "The Library's Electronic Resource Acquisitions Procedure "})
MERGE (p)-[:is_documented_by]->(w);


// -----------------------------------------------------------------------------
// 2. SpringShare — corrected identity (systemwide, Chancellor's Office procured)
// -----------------------------------------------------------------------------
// The 2026-08-05 ingest created springshare-sfsu as campus scope procured by the
// Library, inferred from the Dean's platform list. Ya corrected this in the
// meeting: SpringShare is procured centrally through the Chancellor's Office and
// its VPAT is held at system level. Scope is part of asset identity, so this is a
// new node rather than an edit. The superseded node is removed in section 7.

MERGE (a:Asset {asset_identifier: "springshare-systemwide"})
ON CREATE SET a.unique_id = randomUUID(),
              a.title = "Springshare",
              a.scope = "systemwide",
              a.asset_class = "third_party_service",
              a.description = "Vendor-hosted platform family used by the SF State Library for the Ask a Librarian chat service, scheduling, calendaring, and statistics. Procured centrally through the Chancellor's Office rather than through campus purchasing, so the vendor conformance report is held and tracked at system level and is viewable by campuses through the Chancellor's Office system. Used by nearly every academic library in the US. The chat service it provides is the Library's primary accessibility-request intake channel, operating 24/7 with coverage shared across institutions.";

MATCH (a:Asset {asset_identifier: "springshare-systemwide"}), (co:OrgUnit {name: "CSU Office of the Chancellor"})
MERGE (a)-[:procured_by]->(co);

MATCH (a:Asset {asset_identifier: "springshare-systemwide"}), (lib:OrgUnit {name: "J. Paul Leonard Library"})
MERGE (a)-[:used_by]->(lib);


// -----------------------------------------------------------------------------
// 3. People — the coordination structure agreed in the meeting
// -----------------------------------------------------------------------------
// Christy responsible owner (already implements this YSE), Matt operational
// contact, Ya supplies acquisition-side documentation but is explicitly not a
// VPAT analyst.

MATCH (p:Person {unique_id: "9580b840524d478eb0c1d5028b54f28c"}), (y:YearSuccessEvidence {year_identifier: "2025-2026-7.11-ins-sfsu"})
MERGE (p)-[:implements]->(y);

MATCH (p:Person {unique_id: "9580b840524d478eb0c1d5028b54f28c"}), (i:Process {title: "Accessibility Process for Electronic Theses and Dissertations"})
MERGE (i)-[:owned_by]->(p);

MATCH (p:Person {unique_id: "5a28e0383bcf42b6ab77acc184e2f64b"}), (i:Process {title: "The Library's Electronic Resource Acquisitions Procedure "})
MERGE (p)-[r:worked_on {role_handle: "role:procurement-team"}]->(i)
ON CREATE SET r.added_date = date("2026-08-07"),
              r.note = "Electronic Resources. Collects vendor conformance documentation at acquisition and opens vendor tickets when a patron reports an accessibility barrier.";

MATCH (p:Person {unique_id: "9580b840524d478eb0c1d5028b54f28c"}), (i:Process {title: "Accessibility Request Intake and Referral (J. Paul Leonard Library)"})
MERGE (i)-[:owned_by]->(p);


// -----------------------------------------------------------------------------
// 4. Notes — attached to both the YSE and the MeetingMinutes
// -----------------------------------------------------------------------------

MERGE (n:Note {name: "library-vpat-review-role-aug-2026-yse:2025-2026-7.11-ins-sfsu-3b7d1a04"})
ON CREATE SET n.unique_id = randomUUID(),
              n.date_created = date("2026-08-07"),
              n.include_in_report = true,
              n.depreciated = false,
              n.content = "The Library performs no substantive review of vendor accessibility conformance reports. Ya Wang was explicit: a report can run to roughly 40 pages of vendor-supplied testing detail, and the Library has no independent capacity to verify those claims. Most vendors report conformance to a recent WCAG version, but the team is not positioned to assess whether that claim is accurate. Documentation is collected because a purchase cannot proceed without it, not as an evaluation. Christy Stevens confirmed her understanding that a purchase generally cannot go through without a conformance report on file. Daniel Fontaine noted workarounds exist (manual testing, an alternate access plan) but confirmed the document is the default prerequisite. This settles the question the Library raised about what is expected of it beyond obtaining the document.";

MERGE (n:Note {name: "library-acquisition-pathways-aug-2026-yse:2025-2026-7.11-ins-sfsu-8c2e6f11"})
ON CREATE SET n.unique_id = randomUUID(),
              n.date_created = date("2026-08-07"),
              n.include_in_report = true,
              n.depreciated = false,
              n.content = "Three pathways put a resource on the Library databases page. First, local subscription or purchase, which is the majority of individual entries, covering e-books, e-journals and streaming media plus some outright purchases. Second, open-access additions made at a subject liaison librarian's discretion where a resource is standard in their discipline. Third, Chancellor's Office central purchasing, which splits into the Electronic Core Collection available to all 22 campuses and SDLC resources negotiated centrally that campuses opt into individually. Ya Wang estimated roughly two thirds of acquisitions come through the Chancellor's Office. Michael McCourt put SF State's SDLC spend at approximately 900,000 dollars last year, which he estimated at just under half the relevant acquisitions budget. Historically the Library had dispensation to direct-pay smaller publisher purchases before the current P2P system. SDLC purchases do not pass through local procurement at all, appearing later in campus data warehouse reporting. This matters for stewardship modeling: centrally purchased products are procured by the Chancellor's Office, not by the Library.";

MERGE (n:Note {name: "library-vendor-ticket-handling-aug-2026-yse:2025-2026-7.11-ins-sfsu-d419b7c3"})
ON CREATE SET n.unique_id = randomUUID(),
              n.date_created = date("2026-08-07"),
              n.include_in_report = true,
              n.depreciated = false,
              n.content = "When a patron reports an accessibility problem tied to a specific vendor product, the request arrives through the Library chat or email service and is routed to Ya Wang's Electronic Resources team, who contact the vendor directly. Example given: a Spanish-language film in the streaming collection was missing English captions, and a ticket was opened with the vendor to have captions added. There is no fixed service level. Resolution time depends on the vendor, of which the Library holds contracts with hundreds, and larger vendors tend to respond faster. Vendors generally treat accessibility issues as a priority. The team follows up when a ticket sits unresolved. Ya Wang was clear that accessibility-related tickets are rare in absolute terms, describing them as very few. That volume is the basis for not building formal alternate access plans around ordinary partially conformant purchases.";

MERGE (n:Note {name: "batv-captioning-status-aug-2026-yse:2025-2026-7.11-ins-sfsu-6a05e2d8"})
ON CREATE SET n.unique_id = randomUUID(),
              n.date_created = date("2026-08-07"),
              n.include_in_report = true,
              n.depreciated = false,
              n.content = "Matthew James Martin reported the Bay Area Television Archives captioning and remediation work at approximately 80 percent complete against roughly 3,000 videos, and expects completion well ahead of the April 2027 deadline, likely within a couple of months. Supersedes the December 2024 figure of 2,226 clips. Not recorded as an accomplishment while the work is incomplete.";

MERGE (n:Note {name: "library-accessibility-libguide-aug-2026-yse:2025-2026-7.11-ins-sfsu-f27a9b56"})
ON CREATE SET n.unique_id = randomUUID(),
              n.date_created = date("2026-08-07"),
              n.include_in_report = true,
              n.depreciated = false,
              n.content = "An accessibility-focused LibGuide exists, surfaced by Christy Stevens while preparing for the meeting and shared on the call. Matthew James Martin confirmed it exists and holds useful material but could not recall its current content and said it could use a refresh. Current content and last-update date are unverified. The internal staff-side remediation workflow Matt and his colleague Devin have used is separate from the templates Graduate Studies distributes, and is covered by the existing electronic theses and dissertations process rather than modeled separately.";

MERGE (n:Note {name: "co-central-vpat-review-coming-aug-2026-yse:2025-2026-7.11-ins-sfsu-1d8c4e70"})
ON CREATE SET n.unique_id = randomUUID(),
              n.date_created = date("2026-08-07"),
              n.include_in_report = true,
              n.depreciated = false,
              n.content = "A centralized manual review of vendor accessibility conformance reports is being stood up at the Chancellor's Office. Daniel Fontaine expects this to improve the quality and reliability of vendor accessibility documentation over time, particularly for centrally purchased products, and also to raise the bar campuses are expected to meet. Forward-looking and not yet in effect. Relevant because roughly two thirds of Library acquisitions are centrally purchased and would fall under it.";

// Attach every note created above to the YSE, the minutes, and the author.
MATCH (n:Note), (y:YearSuccessEvidence {year_identifier: "2025-2026-7.11-ins-sfsu"})
WHERE n.name ENDS WITH "yse:2025-2026-7.11-ins-sfsu-3b7d1a04" OR n.name ENDS WITH "yse:2025-2026-7.11-ins-sfsu-8c2e6f11" OR n.name ENDS WITH "yse:2025-2026-7.11-ins-sfsu-d419b7c3" OR n.name ENDS WITH "yse:2025-2026-7.11-ins-sfsu-6a05e2d8" OR n.name ENDS WITH "yse:2025-2026-7.11-ins-sfsu-f27a9b56" OR n.name ENDS WITH "yse:2025-2026-7.11-ins-sfsu-1d8c4e70"
MERGE (y)-[:has_note]->(n);

MATCH (n:Note), (m:MeetingMinutes {unique_id: "fdeb8af16d204c818d85ac017fa84af6"})
WHERE n.name CONTAINS "yse:2025-2026-7.11-ins-sfsu-" AND n.date_created = date("2026-08-07")
MERGE (m)-[:has_note]->(n);

MATCH (n:Note), (p:Person {unique_id: "a1d223af-c7aa-466b-bf54-47f0a199696d"})
WHERE n.name CONTAINS "yse:2025-2026-7.11-ins-sfsu-" AND n.date_created = date("2026-08-07")
MERGE (n)-[:created_by]->(p);


// -----------------------------------------------------------------------------
// 5. Document the intake process against what the meeting established
// -----------------------------------------------------------------------------
// The node was created 2026-08-06 from the Dean's email, which described the
// intake channel but not the staffing, the platform, the escalation route, the
// turnaround, or the volume. The meeting supplied all five, plus the fact that
// the Dean does not personally handle these requests. Rewritten as a complete
// literal rather than appended, so a re-run does not duplicate text.

MATCH (i:Process {title: "Accessibility Request Intake and Referral (J. Paul Leonard Library)"})
SET i.description = "How the Library receives and routes reports of content a user cannot access, as described by Library staff in August 2026.

INTAKE. Deliberately general rather than accessibility-specific. Every page of the Library website carries an Ask a Librarian chat button, and if a visitor stays on a page for about a minute without interacting the chat window opens on its own. Individual OneSearch records additionally carry a link for reporting a problem with that item, which gives a second point-of-use route. The Dean described the chat placement as the most comprehensive and most consistently placed contact mechanism she has seen anywhere at the university. The design intent is that a user never has to classify their own problem as an accessibility issue, and never has to know the name of a particular contact.

STAFFING AND PLATFORM. The chat runs 24 hours a day. SF State staff cover part of the rotation and librarians at other institutions cover the remainder, because the underlying service is shared. A question submitted overnight is logged and picked up when staff come online rather than answered immediately. The service runs on Springshare, which also provides the Library's scheduling, calendaring and statistics tools, and which is procured centrally through the Chancellor's Office rather than locally.

TRIAGE. Requests are monitored by many Library faculty and staff and routed to one of four outcomes: resolved directly, referred to the DPRC for an accommodation, met by producing an accessible format such as printing or locating an OCRed PDF, or escalated to the vendor. Vendor escalations go to the Electronic Resources team under Ya Wang, who open a ticket with the vendor directly. The example given was a Spanish-language film in the streaming collection missing English captions. DPRC referrals have no dedicated routing path and go to a general DPRC email address, through the chat, or in person at a service desk.

TURNAROUND AND VOLUME. There is no fixed service level for vendor escalations. Resolution time depends on the vendor, of which the Library holds contracts with hundreds, and larger vendors tend to respond faster. Vendors generally treat accessibility issues as a priority to act on, and the team follows up when a ticket sits unresolved. Accessibility-related requests are rare in absolute terms, described by Electronic Resources as very few. That volume is the basis for not building formal alternate access plans around ordinary partially conformant purchases.

WHAT IS ABSENT. Four gaps, which are the agreed improvement targets this node exists to track. The triage rule is established practice rather than a documented routing procedure, and the Dean noted she does not personally handle these requests. Accessibility requests are not tagged or counted, so no volume, turnaround or pattern is visible, though a rough count of DPRC referrals could be obtained by searching the Springshare statistics for DPRC. No turnaround is stated to users. The vendor-escalation outcome does not report back to campus procurement, where a record of which vendors generate barriers would carry weight at renewal.";

// The vendor-handling note documents this process specifically, not just the YSE.
MATCH (i:Process {title: "Accessibility Request Intake and Referral (J. Paul Leonard Library)"}), (n:Note {name: "library-vendor-ticket-handling-aug-2026-yse:2025-2026-7.11-ins-sfsu-d419b7c3"})
MERGE (i)-[:is_documented_by]->(n);


// -----------------------------------------------------------------------------
// 6. DESTRUCTIVE — remove the superseded SpringShare asset
// -----------------------------------------------------------------------------
// springshare-sfsu was created 2026-08-05 with the wrong scope and the wrong
// procuring party. Scope is part of asset identity so it cannot be corrected in
// place. Its only edges are the three created in that same ingest
// (procured_by, used_by, asset_at_campus) — no evidence, TAAP, or interface
// depends on it. Section 2 above must have run first.
// Run the file without this statement if you would rather retire it by hand.

MATCH (a:Asset {asset_identifier: "springshare-sfsu"})
DETACH DELETE a;
