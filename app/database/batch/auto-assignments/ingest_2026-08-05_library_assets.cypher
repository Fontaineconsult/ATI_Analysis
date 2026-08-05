// =============================================================================
// INGEST — SF State Library ICT assets, §508 stewardship
// Date:   2026-08-05
// Target: 2025-2026 reporting year, SFSU, Instructional Materials (ins)
// =============================================================================
//
// SOURCE
//   Message node "Re: BuyIT / CSU Buy reviews" (type e-mail, date_created
//   2026-08-05, unique_id bf3b0defbe0941f8b866ff7c4f38a7de), attached via
//   has_message to YSE 2025-2026-7.11-ins-sfsu. Author: Dean Christy Stevens
//   (signed "Christy"). Signal tier: S1 — the Dean enumerating her own unit's
//   platform inventory in writing.
//
//   SI 7.11-ins: "Developed a process that incorporates accessibility when
//   acquiring, converting, digitizing, creating, and maintaining library assets."
//   SFSU status: Initiated.
//
// RECON FINDINGS
//   - Asset label held 8 nodes (Adobe Acrobat Sign, Canvas LMS x3, Diva CMS,
//     DocuSign, Drupal Web CMS x2). NONE of the platforms named in the message
//     existed as Assets. No collisions on the identifiers created below.
//   - Department {name:"Library"} exists at SFSU (uid dd656a40-f4bf-4064-ad7f-
//     5db4790b4c59), employs Alex Cherian / Christopher Novak / Deborah Masters,
//     operates_under_campus -> sfsu.
//   - All 18 :Department nodes carried ZERO :OrgUnit labels (the back-label
//     migration noted in graph_schema.OrgUnit is still deferred). Asset
//     stewardship accessors are RelationshipTo("OrgUnit", ...), so without the
//     label the app's asset detail projection would report stewardship:{} and
//     is_stewarded:false. Statement 1 adds :OrgUnit to the Library node only —
//     the other 17 departments are untouched, that migration remains deferred.
//   - constraint_unique_OrgUnit_name exists, so a bare :OrgUnit node (the
//     Chancellor's Office) is protected by the same uniqueness guarantee.
//   - queries/assets/read.py::_holders reads only unique_id and name off the
//     unit side, so a bare :OrgUnit that is not a :Department is safe to read.
//   - No Vendor node exists for Ex Libris / Adam Matthew / Springshare.
//
// JUDGMENT CALLS
//   1. RENAME, not duplicate. The user asked to add "J. Paul Leonard Library"
//      as an org unit under SFSU. A Department {name:"Library"} at SFSU is the
//      same entity and already carries 3 employs edges, so statement 1 renames
//      it rather than creating a second node that would fragment stewardship.
//      Reversible: SET lib.name = "Library" and REMOVE lib:OrgUnit.
//   2. CSU Office of the Chancellor is modeled as a bare :OrgUnit with NO
//      operates_under_campus edge. That absence IS the systemwide signal, exactly
//      as a systemwide Asset carries no asset_at_campus edge. OrgUnit does not
//      require a campus (plain RelationshipTo, no cardinality), so the schema
//      supports this without modification. Its `location` (401 Golden Shore,
//      Long Beach) is public reference data, NOT from the source message.
//   3. Alma/Primo is ONE asset, not two. The source treats them as a single
//      centrally managed unit and remediation authority does not split between
//      them. Primo (the public discovery surface) is a candidate Interface
//      presented_by this asset — deliberately NOT minted here.
//   4. Springshare is ONE asset. The source names the family and its three
//      functions but not the individual products. Not invented.
//   5. developed_by / maintained_by are NEVER wired to the Library. This is the
//      substantive claim of the source, not an omission: "we do not control the
//      underlying code, interfaces, or accessibility of commercial databases and
//      ebook platforms, and we are not in a position to remediate products we did
//      not create and cannot modify." With no remediating Implementation, all
//      five assets will read elevation_signal:true — the correct modeled result.
//   6. maintained_by -> Chancellor's Office is wired for the three central
//      platforms on the strength of "CSU centrally managed platforms". This goes
//      one step beyond the user's instruction (which named procurement only) and
//      is flagged for veto — remove the three maintained_by statements to drop it.
//
// DELIBERATELY EXCLUDED
//   - "over 200 licensed research databases and content platforms" — not
//     delineable from the source. This is the largest elevation-signal surface
//     and needs its own modeling decision (one aggregate Asset vs. enumeration).
//   - GOBI — named as a purchasing bottleneck blocking fall course reserves, but
//     absent from the Dean's platform inventory. Offered and not taken up.
//   - BuyIT / CSUBUY — a procurement process, not a library asset. Already
//     modeled as Procedure "SFBRN CSUBuy IT Accessibility Review Procedure".
//   - supplied_by (Vendor) edges — the message names no vendors. Ex Libris /
//     Adam Matthew / Springshare LLC would be inference, not evidence.
//   - Any is_evidence_for edge — Asset deliberately has no such relationship.
//     Assets reach evidence through the Implementations that remediate them.
//   - Any change to the YSE status_is edge.
// =============================================================================


// -----------------------------------------------------------------------------
// 1. Org units
// -----------------------------------------------------------------------------

// Rename the SFSU Library department to its proper name and back-label it as an
// OrgUnit so Asset stewardship edges resolve. Idempotent: a re-run finds no
// Department named "Library" at sfsu and is a no-op.
MATCH (lib:Department {name: "Library"})-[:operates_under_campus]->(:Campus {abbreviation: "sfsu"})
SET lib:OrgUnit, lib.name = "J. Paul Leonard Library";

// The Chancellor's Office as a systemwide org unit. No operates_under_campus
// edge — the absence is what marks it systemwide.
MERGE (co:OrgUnit {name: "CSU Office of the Chancellor"})
ON CREATE SET co.unique_id = randomUUID(),
              co.location = "401 Golden Shore, Long Beach, CA 90802";


// -----------------------------------------------------------------------------
// 2. Assets — CSU centrally managed (systemwide scope, no campus anchor)
// -----------------------------------------------------------------------------

MERGE (a:Asset {asset_identifier: "alma-primo-systemwide"})
ON CREATE SET a.unique_id = randomUUID(),
              a.title = "Alma / Primo",
              a.scope = "systemwide",
              a.asset_class = "institutional_system",
              a.description = "CSU centrally managed library services platform (Alma) and discovery layer (Primo). Named by the SF State Library as a principal platform. The campus Library selects resources and reports problems but does not develop, host, or control the platform. Primo, the public-facing discovery surface, is a candidate Interface backed by this asset and is not modeled yet. Source: Dean Christy Stevens, e-mail Re: BuyIT / CSU Buy reviews, 2026-08-05.";

MERGE (a:Asset {asset_identifier: "scholarworks-systemwide"})
ON CREATE SET a.unique_id = randomUUID(),
              a.title = "ScholarWorks",
              a.scope = "systemwide",
              a.asset_class = "institutional_system",
              a.description = "CSU centrally managed institutional repository. The SF State Library deposits electronic theses and dissertations to ScholarWorks and maintains accessibility workflows and accessible thesis and dissertation templates for that deposit process. Source: Dean Christy Stevens, e-mail Re: BuyIT / CSU Buy reviews, 2026-08-05.";

MERGE (a:Asset {asset_identifier: "csu-digital-archives-systemwide"})
ON CREATE SET a.unique_id = randomUUID(),
              a.title = "CSU Digital Archives",
              a.scope = "systemwide",
              a.asset_class = "institutional_system",
              a.description = "The California State University Digital Archives, a CSU centrally managed platform named among the SF State Library principal platforms. Source: Dean Christy Stevens, e-mail Re: BuyIT / CSU Buy reviews, 2026-08-05.";


// -----------------------------------------------------------------------------
// 3. Assets — campus-subscribed, vendor-hosted
// -----------------------------------------------------------------------------

MERGE (a:Asset {asset_identifier: "quartex-sfsu"})
ON CREATE SET a.unique_id = randomUUID(),
              a.title = "Quartex",
              a.scope = "campus",
              a.asset_class = "third_party_service",
              a.description = "Vendor-hosted digital collections platform subscribed to by the SF State Library. Hosts the Bay Area Television Archives, whose 2226 streaming clips carry closed captions and transcript downloads. Transcripts are converted to WebVTT and loaded into DIVA. The Library holds no code or interface access to the platform. Source: Dean Christy Stevens, e-mail Re: BuyIT / CSU Buy reviews, 2026-08-05.";

MERGE (a:Asset {asset_identifier: "springshare-sfsu"})
ON CREATE SET a.unique_id = randomUUID(),
              a.title = "Springshare",
              a.scope = "campus",
              a.asset_class = "third_party_service",
              a.description = "Vendor-hosted Springshare product family used by the SF State Library for research assistance, statistics, and scheduling. The individual products are not enumerated in the source and are deliberately not inferred. Source: Dean Christy Stevens, e-mail Re: BuyIT / CSU Buy reviews, 2026-08-05.";


// -----------------------------------------------------------------------------
// 4. Campus anchors (campus-scoped assets only)
// -----------------------------------------------------------------------------

MATCH (a:Asset), (c:Campus {abbreviation: "sfsu"})
WHERE a.asset_identifier IN ["quartex-sfsu", "springshare-sfsu"]
MERGE (a)-[:asset_at_campus]->(c);


// -----------------------------------------------------------------------------
// 5. §508 stewardship — the Library USES all five
// -----------------------------------------------------------------------------
// "We subscribe to vendor-hosted platforms that provide access to content or
//  support library services. Library employees select resources, obtain vendor
//  documentation, submit purchasing requests, communicate with vendors, and
//  report problems."

MATCH (a:Asset), (lib:OrgUnit {name: "J. Paul Leonard Library"})
WHERE a.asset_identifier IN ["alma-primo-systemwide", "scholarworks-systemwide", "csu-digital-archives-systemwide", "quartex-sfsu", "springshare-sfsu"]
MERGE (a)-[:used_by]->(lib);


// -----------------------------------------------------------------------------
// 6. §508 stewardship — who PROCURES
// -----------------------------------------------------------------------------
// The Library submits purchasing requests for what it subscribes to directly.

MATCH (a:Asset), (lib:OrgUnit {name: "J. Paul Leonard Library"})
WHERE a.asset_identifier IN ["quartex-sfsu", "springshare-sfsu"]
MERGE (a)-[:procured_by]->(lib);

// The centrally managed platforms are procured systemwide, not by the campus.

MATCH (a:Asset), (co:OrgUnit {name: "CSU Office of the Chancellor"})
WHERE a.asset_identifier IN ["alma-primo-systemwide", "scholarworks-systemwide", "csu-digital-archives-systemwide"]
MERGE (a)-[:procured_by]->(co);


// -----------------------------------------------------------------------------
// 7. §508 stewardship — who MAINTAINS  [FLAGGED — see judgment call 6]
// -----------------------------------------------------------------------------
// "our principal platforms include the following CSU centrally managed
//  platforms--Alma/Primo, ScholarWorks, and the California State University
//  Digital Archives". Delete this block to drop the claim.

MATCH (a:Asset), (co:OrgUnit {name: "CSU Office of the Chancellor"})
WHERE a.asset_identifier IN ["alma-primo-systemwide", "scholarworks-systemwide", "csu-digital-archives-systemwide"]
MERGE (a)-[:maintained_by]->(co);


// -----------------------------------------------------------------------------
// NOT WRITTEN, ON PURPOSE
// -----------------------------------------------------------------------------
// No developed_by or maintained_by edge to the J. Paul Leonard Library, for any
// of the five assets. The Library disclaims exactly this capacity, and its
// absence — with no remediating Implementation on any of these assets — is what
// produces elevation_signal:true, the Title II 35.205 responsibility heuristic.
// =============================================================================
