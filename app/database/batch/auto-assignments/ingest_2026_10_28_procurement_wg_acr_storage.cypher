// Ingest: Procurement Working Group 10/28 (MeetingMinutes 9d339f53d3564b4eaf096194d8bf6ac5)
// Source: app/database/ontology/raw_transcripts/Procurement Working Group transcript_2026-10-28_17.04.16.txt
//
// Scope approved by the user: ONE note, nothing more. The rest of the meeting was
// rubric design (definitions, severity, exposure, veracity) and tester feedback, which
// are not states of affairs the graph tracks, plus per-requisition TAAP work
// (The Economist, The Atlantic), excluded under the global-state-only rule.
//
// Fact (S1, Jonathan Hale, CSUEB Business Operations Specialist, with Margaret Price):
// CSUEB keeps collected ACRs/VPATs on local storage, not in the Chancellor's Office
// repository (graph: Service "CSU Wide Vendor Accessibility & Security Document
// Repository"; TAAP distribution vocabulary: "ATI Systemwide ACR Repository").
//
// Anchor: 2025-2026-1.8-pro-csueb, the process for validating accessibility conformance
// claims (ACRs). The stored ACRs are that process's records.
// Attached to the YSE and to the minutes; created_by Daniel Fontaine.

MATCH (y:YearSuccessEvidence {year_identifier: '2025-2026-1.8-pro-csueb'})
MATCH (m:MeetingMinutes {unique_id: '9d339f53d3564b4eaf096194d8bf6ac5'})
MATCH (p:Person {unique_id: 'a1d223af-c7aa-466b-bf54-47f0a199696d'})
MERGE (n:Note {name: 'acr-local-storage-oct-2026-yse:2025-2026-1.8-pro-csueb-4c7e2a91'})
ON CREATE SET n.unique_id = replace(randomUUID(), '-', ''), n.include_in_report = true, n.date_created = date('2026-10-28')
SET n.content = "CSU East Bay stores the vendor ACRs and VPATs it collects during ICT procurement reviews on local storage. They are not saved to the ATI Systemwide ACR Repository, the Chancellor's Office SharePoint site. Jonathan Hale and Margaret Price plan to move them there so the review records are kept where an audit would look for them. Jonathan Hale raised document retention as a topic to settle with Daniel Fontaine."
MERGE (y)-[:has_note]->(n)
MERGE (m)-[:has_note]->(n)
MERGE (n)-[:created_by]->(p);

MATCH (m:MeetingMinutes {unique_id: '9d339f53d3564b4eaf096194d8bf6ac5'})
SET m.ontology_ingested = true, m.ontology_ingest_date = date('2026-10-28'), m.ontology_ingest_note = "1 note (ACR/VPAT local storage, 1.8-pro CSUEB). Rest of meeting was rubric design and per-requisition TAAP work, not ingested.";
