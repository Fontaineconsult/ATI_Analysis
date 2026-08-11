// =============================================================================
// INGEST — CSU East Bay meeting, 2026-08-07
// Source: MeetingMinutes "Meeting Notes: CSU East Bay — Video Captioning
//         Automation, ATI Tracking Walkthrough, and Textbook Adoption
//         Expansion" (78bbbc13a1204aa1a20946ef4bc7bbf7), already wired to
//         WorkingGroupPlan 2025-2026-csueb-ins.
// Target: 2025-2026 · csueb
// =============================================================================
//
// FIRST-PASS DECISIONS (taken here rather than referred back)
//
// 1. INDICATOR CORRECTION — the meeting pointed at the wrong indicator.
//    Zach asked to elevate 6.7-ins on the strength of the captioning pipeline.
//    6.7-ins reads: "conduct regularly scheduled accessibility EVALUATIONS
//    using automated tools and manual techniques to IDENTIFY course content
//    that requires remediation." The captioning automation does not evaluate or
//    identify anything — it applies a remediation to new content. It is routed
//    instead to 5.11-ins ("creating, selecting, adopting, and remediating audio
//    and video assets", csueb Defined), with a secondary link to 2.6-web
//    ("video and audio meet Section 508 standards before publication").
//    The thing that DOES satisfy 6.7-ins is the UDOIT scorecard, which already
//    exists on that YSE as Tracking "Instructional Materials Remediation
//    Dashboard". So there are two separate elevation cases, not one.
//
// 2. CAPTIONING PIPELINE = Process, not Project. Building it was a project;
//    what operates is a nightly watchdog with no endpoint.
//
// 3. LTI WORKFLOW indicator identified. The minutes say only that it "shows as
//    not started". 1.8-pro at csueb is Not Started and reads "validating
//    accessibility conformance claims (ACRs, Roadmaps, ... testing
//    documentation)", which is exactly Zach reviewing the VPAT and completing
//    the ICT questionnaire. Primary at strength 3, with 5.9-pro (working
//    collaboratively with vendors during procurement, also Not Started) at
//    strength 2.
//
// 4. FIGURES STAY NOTES. 72% required-materials coverage, the 45-47% adoption
//    baseline, and 12+ LTI denials all came off a screen-shared dashboard. No
//    number set is in hand, so none becomes a Metric. Requesting the export
//    converts them.
//
// 5. NO Plans and NO Query nodes, matching the decision taken on the SF State
//    file. Action items remain in the minutes text.
//
// 6. NO STATUS CHANGES. Two elevations are argued for in the minutes and one
//    reduction is contemplated — all three are admin-review actions.
//    Flagged in notes below, not applied.
//
// IDENTITY
//   Zach Oshri exists (titled "ATI Coordinator"; the minutes describe him as
//   Online Campus / Academic Technology — flagged, not changed, he may hold
//   both). Misty Nicholson and Joyce Bold are created as Follett contacts.
//   "Jay" is load-bearing but single-token: NOT created, recorded in the LTI
//   process description with a verify flag, pending his full name.
//   "Mark" (authored the companion guidance) and "Leslie" (interested party)
//   are peripheral — prose only, no nodes.
// =============================================================================


// -----------------------------------------------------------------------------
// 1. Vendor spelling fix  [DROP THIS STATEMENT IF YOU WANT TO HANDLE IT SEPARATELY]
// -----------------------------------------------------------------------------
// The Vendor node is spelled "Follet" with one t. The company is Follett.
// Renaming is safe — edges reference the node, not the string.

MATCH (v:Vendor {name: "Follet"})
SET v.name = "Follett";


// -----------------------------------------------------------------------------
// 2. Follett contacts
// -----------------------------------------------------------------------------

MERGE (p:Person {name: "Misty Nicholson"})
ON CREATE SET p.unique_id = randomUUID(), p.active = true,
              p.can_approve_yse = false, p.non_committee_member_active = false,
              p.title = "Account Contact, Follett",
              p.ati_role = "";

MERGE (p:Person {name: "Joyce Bold"})
ON CREATE SET p.unique_id = randomUUID(), p.active = true,
              p.can_approve_yse = false, p.non_committee_member_active = false,
              p.title = "Account Contact, Follett",
              p.ati_role = "";

MATCH (v:Vendor {name: "Follett"}), (p:Person) WHERE p.name IN ["Misty Nicholson", "Joyce Bold"]
MERGE (v)-[:employs]->(p);


// -----------------------------------------------------------------------------
// 3. Automated Verbit captioning activation  (NEW Process)
// -----------------------------------------------------------------------------

MERGE (i:Process {title: "Automated Verbit Captioning Activation (CSUEB Online Campus)"})
ON CREATE SET i.unique_id = randomUUID(),
              i.retired = false,
              i.description = "A Python service that activates Verbit captioning on every new Canvas course shell without staff intervention, replacing a per-course manual toggle that had become unsustainable under caption-request volume. It scrapes East Bay's Canvas provisioning tables to obtain course IDs and instructor associations, drives a headless browser into the course shell and its Panopto folder, completes the OAuth handshake, and sets the captioning provider through Panopto's own API. It runs nightly as a watchdog, so any shell that appears is configured in the background. Faculty are unaware of it and take no action. Panopto maintains the connection to Verbit, so the automation touches only the Canvas and Panopto side. The workaround exists because Panopto offers no site-wide setting to force all folders to a given captioning provider, which East Bay was told will not be enabled at the platform level. Scripts and process documentation are already public. Built and operated by Zach Oshri.";

MATCH (i:Process {title: "Automated Verbit Captioning Activation (CSUEB Online Campus)"}), (y:YearSuccessEvidence {year_identifier: "2025-2026-5.11-ins-csueb"})
MERGE (i)-[r:is_evidence_for]->(y)
ON CREATE SET r.strength = 3;

MATCH (i:Process {title: "Automated Verbit Captioning Activation (CSUEB Online Campus)"}), (y:YearSuccessEvidence {year_identifier: "2025-2026-2.6-web-csueb"})
MERGE (i)-[r:is_evidence_for]->(y)
ON CREATE SET r.strength = 2;

MATCH (i:Process {title: "Automated Verbit Captioning Activation (CSUEB Online Campus)"}), (p:Person {name: "Zach Oshri"})
MERGE (i)-[:owned_by]->(p);


// -----------------------------------------------------------------------------
// 4. LTI accessibility review gate  (NEW Process)
// -----------------------------------------------------------------------------

MERGE (i:Process {title: "LTI Accessibility Review and Approval Gate (CSUEB Online Campus)"})
ON CREATE SET i.unique_id = randomUUID(),
              i.retired = false,
              i.description = "How East Bay reviews learning tools interoperability integrations that faculty request, before they can enter Canvas. When a request arrives, two staff independently approach the vendor for conformance documentation, and because the colleague's workload is heavier Zach Oshri frequently receives the vendor response first. Zach reviews the conformance report and completes an ICT questionnaire. The colleague enters that completed questionnaire into P2P for procurement processing. The gate is hard: an integration that fails East Bay's accessibility checks does not go into Canvas at all, and at least twelve integrations were denied on accessibility grounds during the current year. VERIFY: the second staff member is recorded in the source only as \"Jay\", a single given name, so no Person node was created for him. Obtain his full name and title, then wire him to this process.";

MATCH (i:Process {title: "LTI Accessibility Review and Approval Gate (CSUEB Online Campus)"}), (y:YearSuccessEvidence {year_identifier: "2025-2026-1.8-pro-csueb"})
MERGE (i)-[r:is_evidence_for]->(y)
ON CREATE SET r.strength = 3;

MATCH (i:Process {title: "LTI Accessibility Review and Approval Gate (CSUEB Online Campus)"}), (y:YearSuccessEvidence {year_identifier: "2025-2026-5.9-pro-csueb"})
MERGE (i)-[r:is_evidence_for]->(y)
ON CREATE SET r.strength = 2;

MATCH (i:Process {title: "LTI Accessibility Review and Approval Gate (CSUEB Online Campus)"}), (p:Person {name: "Zach Oshri"})
MERGE (i)-[:owned_by]->(p);


// -----------------------------------------------------------------------------
// 5. Enrich what already exists — no duplicates created
// -----------------------------------------------------------------------------

MATCH (i:Tracking {title: "Instructional Materials Remediation Dashboard"})
SET i.description = "A dashboard that pulls UDOIT reports nightly and produces a department-level accessibility scorecard, showing how each department is trending week over week. Where the scorecard flags a department performing badly, Zach Oshri contacts that department directly to work on making their instructional materials more accessible, and a substantial amount of that outreach was done over the past year. This is the process that satisfies the requirement for regularly scheduled evaluations using automated tools to identify content requiring remediation. The evaluation runs without a manual trigger and the outreach that follows is an established practice rather than an ad hoc response, which is the basis for the maturity elevation argued for in the 2026-08-07 meeting.";

MATCH (i:Process {title: "CSUEB Textbook Adoption Monitoring Platform"})
SET i.description = "A platform that combines textbook adoption data with library holdings to show what students are already covered for. A nightly data feed from Follett supplies adoption data by ISBN. Those ISBNs are cross-referenced against the library's Alma system through Alma's API, which returns Primo links to the library's own holding for each title where one exists online. From the combined set the platform produces an approximate dollar figure for what library coverage saves students, and a coverage percentage, currently 72 percent for required materials, with recommended materials tracked separately and excluded from that figure. Where a needed title is not held at all, the platform surfaces it as a purchase suggestion so the library can act without further research. A separate view breaks licensing usage down by fiscal year and department to inform upgrade and downgrade decisions. The platform now also sends faculty a direct Canvas message containing the exact link needed to complete a textbook adoption, which submits to Follett and returns to the platform, closing the loop without staff chasing adoptions manually. Overall adoption rate, meaning the share of course sections with any adoption on file, was roughly 45 to 47 percent when Zach Oshri took on the role and has been improved manually since. Built and operated by Zach Oshri.";


// -----------------------------------------------------------------------------
// 6. Notes
// -----------------------------------------------------------------------------

MERGE (n:Note {name: "captioning-platform-limitation-aug-2026-yse:2025-2026-5.11-ins-csueb-4e91c2a7"})
ON CREATE SET n.unique_id = randomUUID(), n.date_created = date("2026-08-07"),
              n.include_in_report = true, n.depreciated = false,
              n.content = "Context for why the captioning automation exists. Panopto provides no native site-wide setting to force all folders to a chosen captioning provider, and East Bay was told directly it will not be enabled at platform level. SF State faces the identical limitation on Canvas Studio, where Verbit captions also have to be activated per course. Both Canvas Studio and Verbit expose their own APIs, and Daniel Fontaine has previously built a system integrating directly with the Verbit API to move caption files, which he suggested as an alternative to routing everything through Panopto. His broader reading is that vendors tend not to provide a flag or webhook that would let an institution detect new content automatically, because supporting one would generate substantial work on the vendor side, leaving institutions to build workarounds for equivalent functionality. He regards East Bay's automation as a net positive for compliance notwithstanding that vendors are generally wary of institutional scripting.";

MERGE (n:Note {name: "maturity-elevation-candidates-aug-2026-yse:2025-2026-6.7-ins-csueb-b70d5f38"})
ON CREATE SET n.unique_id = randomUUID(), n.date_created = date("2026-08-07"),
              n.include_in_report = false, n.depreciated = false,
              n.content = "Two separate maturity elevations were argued in the 2026-08-07 meeting, and the meeting conflated them. Zach Oshri asked to raise the indicator covering regularly scheduled evaluations on the strength of the captioning automation. That automation applies a remediation rather than evaluating or identifying content, so it does not evidence this indicator. What does evidence it is the UDOIT scorecard dashboard already recorded here, which runs nightly without a manual trigger and drives departmental outreach. The captioning automation instead supports the audio and video creation and remediation indicator, where it is now recorded. Both elevations were assessed against the companion guides attached to each indicator, originally derived from material presented by a colleague named Mark, and in both cases the described practice appeared to meet the established bar because it operates repeatably without staff intervention. NO STATUS CHANGE HAS BEEN MADE. Both remain pending Zach uploading his scripts and process documentation, and pending admin review. Also unresolved: the meeting recorded this indicator as having been Defined in the prior year, while the current year reads Initiated, which should be reconciled before any elevation.";

MERGE (n:Note {name: "lti-gate-volume-and-roles-aug-2026-yse:2025-2026-1.8-pro-csueb-c5a8e610"})
ON CREATE SET n.unique_id = randomUUID(), n.date_created = date("2026-08-07"),
              n.include_in_report = true, n.depreciated = false,
              n.content = "At least twelve learning tools interoperability integrations were denied on accessibility grounds at East Bay during the current year. The gate is absolute rather than advisory: an integration failing accessibility checks does not enter Canvas. This indicator was showing as Not Started despite the work running actively, which is the pattern Daniel Fontaine addressed on the call — accurate low status is unproblematic, but an unlogged process leaves nothing to build from. Guidance given was to log whatever documentation exists, however informal, so status can be set accurately and revised as evidence accumulates. The twelve-denial figure would evidence the ICT reviews count indicator if a reviewed-and-denied list were exported.";

MERGE (n:Note {name: "textbook-platform-cross-campus-aug-2026-yse:2025-2026-1.1-ins-csueb-9f24b1d5"})
ON CREATE SET n.unique_id = randomUUID(), n.date_created = date("2026-08-07"),
              n.include_in_report = true, n.depreciated = false,
              n.content = "Zach Oshri intends to extend the textbook adoption platform to other CSU campuses, beginning with the SFBRN institutions, and then assemble a master cross-campus view. His reasoning is that Alma data shows a meaningful gap between what a single institution licenses and what is available through the shared CSU network zone, so identifying systemwide savings could support larger consolidated contracts and stop campuses paying for duplicate licenses — an argument he attributes to the Dean of Libraries. The blocker is per-campus data access: he needs each campus's Follett store number and permission from that campus before he can request its data. He also maintains a candidate list of courses that appear to qualify as zero-cost or low-cost from Follett data but are not marked as such in PeopleSoft, since instructor reporting is incomplete and skews adoption figures. Daniel Fontaine agreed a systemwide version would be valuable but noted libraries and bookstores across campuses operate independently, making it a heavy lift, and that SFBRN's own textbook adoption programme is only now restarting. Follett contact has changed from Joyce Bold, who handles the broader SFBRN-area account and is likely the contact other campuses already work with, to Misty Nicholson, who granted the nightly data feed access. Whether the two are functionally distinct contacts or work the same account differently is unresolved and matters if other SFBRN campuses need looping in.";

MERGE (n:Note {name: "eeaap-lms-evidence-gap-aug-2026-yse:2025-2026-6.9-ins-csueb-a3c7d284"})
ON CREATE SET n.unique_id = randomUUID(), n.date_created = date("2026-08-07"),
              n.include_in_report = false, n.depreciated = false,
              n.content = "This indicator carries no supporting documentation and no implementation evidencing it, while holding one of the higher maturity ratings in the campus set. Daniel Fontaine checked it during the 2026-08-07 meeting and found nothing logged. His stated inclination is to lower it rather than leave a rating unsupported by evidence, and he raised the possibility of an assisted sweep across all indicators lacking documentation, defaulting unsupported items to Not Started as a baseline and rebuilding upward as real evidence arrives. NO STATUS CHANGE HAS BEEN MADE HERE — this is an admin-review action. Recorded so the exposure is visible rather than discovered at reporting time. Relevant adjacency: the LTI accessibility review gate now recorded against the procurement conformance indicator governs which integrations enter the LMS at all, which is closely related subject matter but is a gate rather than an alternate access plan.";

// Attach every note above to its YSE, the minutes, and the author.
MATCH (n:Note), (y:YearSuccessEvidence)
WHERE n.date_created = date("2026-08-07") AND n.name CONTAINS "-csueb-"
  AND n.name CONTAINS ("yse:" + y.year_identifier + "-")
MERGE (y)-[:has_note]->(n);

MATCH (n:Note), (m:MeetingMinutes {unique_id: "78bbbc13a1204aa1a20946ef4bc7bbf7"})
WHERE n.date_created = date("2026-08-07") AND n.name CONTAINS "-csueb-"
MERGE (m)-[:has_note]->(n);

MATCH (n:Note), (p:Person {unique_id: "a1d223af-c7aa-466b-bf54-47f0a199696d"})
WHERE n.date_created = date("2026-08-07") AND n.name CONTAINS "-csueb-"
MERGE (n)-[:created_by]->(p);
