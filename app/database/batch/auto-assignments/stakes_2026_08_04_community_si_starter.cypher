// ============================================================================
// Community -> SuccessIndicator starter stakes (has_stake_in) — PASS 1
// Approved manifest 2026-08-04 (12 communities, 39 edges incl. the flagged
// Web Content Contributors row). Idempotent MERGEs; per-community rationale
// on the edge note. Edges are SI-level: campus- and year-agnostic by design.
// ============================================================================

MATCH (c:CommunityOfPractice {name:'Library'})
MATCH (si:SuccessIndicator) WHERE si.composite_key IN ['7.11-ins']
MERGE (c)-[r:has_stake_in]->(si)
  ON CREATE SET r.added_date = date('2026-08-04'),
                r.note = "Library-assets lifecycle is this community's own ground.";

MATCH (c:CommunityOfPractice {name:'Alternative Media'})
MATCH (si:SuccessIndicator) WHERE si.composite_key IN ['4.5-ins', '7.11-ins']
MERGE (c)-[r:has_stake_in]->(si)
  ON CREATE SET r.added_date = date('2026-08-04'),
                r.note = "Alt-media production: timely access to instructional materials; shared stake in library-asset accessibility.";

MATCH (c:CommunityOfPractice {name:'Faculty Development'})
MATCH (si:SuccessIndicator) WHERE si.composite_key IN ['8.11-ins', '8.12-ins', '8.14-ins', '7.12-ins']
MERGE (c)-[r:has_stake_in]->(si)
  ON CREATE SET r.added_date = date('2026-08-04'),
                r.note = "Faculty orientations, faculty development, ongoing professional development, and faculty-development-center partnerships.";

MATCH (c:CommunityOfPractice {name:'Multimedia & Video Production'})
MATCH (si:SuccessIndicator) WHERE si.composite_key IN ['5.11-ins']
MERGE (c)-[r:has_stake_in]->(si)
  ON CREATE SET r.added_date = date('2026-08-04'),
                r.note = "Audio and video asset creation/remediation lifecycle.";

MATCH (c:CommunityOfPractice {name:'Disability Services'})
MATCH (si:SuccessIndicator) WHERE si.composite_key IN ['4.5-ins', '4.4-pro', '4.6-pro']
MERGE (c)-[r:has_stake_in]->(si)
  ON CREATE SET r.added_date = date('2026-08-04'),
                r.note = "Accommodation delivery, alt-media access, and equally-effective alternate access (TAAP/EEAAP).";

MATCH (c:CommunityOfPractice {name:'Academic Technology'})
MATCH (si:SuccessIndicator) WHERE si.composite_key IN ['6.4-ins', '6.5-ins', '6.7-ins', '6.8-ins', '5.13-ins', '5.16-ins', '8.13-ins']
MERGE (c)-[r:has_stake_in]->(si)
  ON CREATE SET r.added_date = date('2026-08-04'),
                r.note = "LMS course review/redesign/evaluation/remediation, digital documents, learning tools, and academic-technology activities.";

MATCH (c:CommunityOfPractice {name:'Procurement'})
MATCH (si:SuccessIndicator) WHERE si.composite_key IN ['1.3-pro', '1.4-pro', '1.5-pro', '1.7-pro', '1.8-pro', '1.9-pro', '1.10-pro', '1.11-pro', '1.12-pro', '5.4-pro', '8.8-pro', '8.9-pro', '8.10-pro']
MERGE (c)-[r:has_stake_in]->(si)
  ON CREATE SET r.added_date = date('2026-08-04'),
                r.note = "The 508 review pipeline end to end: impact, evaluation depth, ACR validation, consortial adoptions, contacts, assigned authority, risk-informed process, buyer training, and the count metrics.";

MATCH (c:CommunityOfPractice {name:'Technical Support'})
MATCH (si:SuccessIndicator) WHERE si.composite_key IN ['5.3-pro']
MERGE (c)-[r:has_stake_in]->(si)
  ON CREATE SET r.added_date = date('2026-08-04'),
                r.note = "Training for technology support staff (ITCs).";

MATCH (c:CommunityOfPractice {name:'Human Resources'})
MATCH (si:SuccessIndicator) WHERE si.composite_key IN ['5.1-pro']
MERGE (c)-[r:has_stake_in]->(si)
  ON CREATE SET r.added_date = date('2026-08-04'),
                r.note = "Accessible-procurement information in new-employee orientation.";

MATCH (c:CommunityOfPractice {name:'Marketing & Communications'})
MATCH (si:SuccessIndicator) WHERE si.composite_key IN ['1.20-web', '1.1-com', '1.2-com', '1.3-com', '1.4-com']
MERGE (c)-[r:has_stake_in]->(si)
  ON CREATE SET r.added_date = date('2026-08-04'),
                r.note = "Social-media accessibility and the campus-wide accessibility communication campaign.";

MATCH (c:CommunityOfPractice {name:'Web & Mobile Development'})
MATCH (si:SuccessIndicator) WHERE si.composite_key IN ['1.2-web', '1.4-web', '1.6-web', '1.7-web']
MERGE (c)-[r:has_stake_in]->(si)
  ON CREATE SET r.added_date = date('2026-08-04'),
                r.note = "Web/application inventory, scheduled and manual evaluations, and evaluation-result distribution.";

MATCH (c:CommunityOfPractice {name:'Web Content Contributors'})
MATCH (si:SuccessIndicator) WHERE si.composite_key IN ['1.9-web']
MERGE (c)-[r:has_stake_in]->(si)
  ON CREATE SET r.added_date = date('2026-08-04'),
                r.note = "Campus members maintaining web content understanding the accessibility evaluation process.";
