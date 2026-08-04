// ============================================================================
// Community -> SuccessIndicator stakes (has_stake_in) — PASS 2: full 2026-2027
// coverage. Assigns every SI visible in 2026-2027 that pass 1 left uncovered
// (82 of 122), by subject-matter ground; several SIs get two stakeholder
// communities where the ground is genuinely shared (e.g. timely adoption =
// Library + Auxiliary Enterprises). Idempotent MERGEs; ON CREATE only, so
// pass-1 notes are never overwritten. Review before executing.
// ============================================================================

MATCH (c:CommunityOfPractice {name:'Executive Leadership'})
MATCH (si:SuccessIndicator) WHERE si.composite_key IN ['1.1-gov', '1.2-gov', '1.3-gov', '1.4-gov', '1.5-gov', '1.6-gov', '1.7-gov', '2.1-gov', '2.2-gov', '2.3-gov', '2.4-gov', '3.1-gov', '7.5-web', '7.6-web', '9.1-pro', '9.2-ins', '9.2-pro', '9.3-ins']
MERGE (c)-[r:has_stake_in]->(si)
  ON CREATE SET r.added_date = date('2026-08-04'),
                r.note = "Governance: assigned authority, formal policy, planning cycles, and steering/subcommittee review are executive-level ground.";

MATCH (c:CommunityOfPractice {name:'Human Resources'})
MATCH (si:SuccessIndicator) WHERE si.composite_key IN ['1.1-gov', '2.5-com', '5.14-web', '5.6-pro', '6.3-web', '6.4-web', '6.5-web']
MERGE (c)-[r:has_stake_in]->(si)
  ON CREATE SET r.added_date = date('2026-08-04'),
                r.note = "Position descriptions, onboarding/orientation integration, and ongoing professional development for ATI-responsible employees.";

MATCH (c:CommunityOfPractice {name:'Faculty Affairs'})
MATCH (si:SuccessIndicator) WHERE si.composite_key IN ['2.2-gov', '7.1-ins']
MERGE (c)-[r:has_stake_in]->(si)
  ON CREATE SET r.added_date = date('2026-08-04'),
                r.note = "Formally documented faculty responsibility (policy/resolution) runs through faculty governance.";

MATCH (c:CommunityOfPractice {name:'Faculty Development'})
MATCH (si:SuccessIndicator) WHERE si.composite_key IN ['1.7-gov', '2.2-com', '2.3-com', '7.3-ins', '7.5-ins', '8.3-ins']
MERGE (c)-[r:has_stake_in]->(si)
  ON CREATE SET r.added_date = date('2026-08-04'),
                r.note = "Faculty training programs, accessible-materials examples, resources, and training content.";

MATCH (c:CommunityOfPractice {name:'Faculty & Instructional Staff'})
MATCH (si:SuccessIndicator) WHERE si.composite_key IN ['2.2-com', '5.17-ins', '6.2-ins', '7.1-ins']
MERGE (c)-[r:has_stake_in]->(si)
  ON CREATE SET r.added_date = date('2026-08-04'),
                r.note = "Faculty-owned ground: syllabi, selecting/authoring course materials, and their documented responsibility.";

MATCH (c:CommunityOfPractice {name:'Academic Technology'})
MATCH (si:SuccessIndicator) WHERE si.composite_key IN ['2.3-com', '4.1-ins', '4.3-ins', '5.14-ins', '5.15-ins', '5.17-ins', '6.10-ins']
MERGE (c)-[r:has_stake_in]->(si)
  ON CREATE SET r.added_date = date('2026-08-04'),
                r.note = "LMS posting/guidelines, emerging instructional tech, publisher content, syllabi in the LMS, LTI evaluation, and academic-technology training.";

MATCH (c:CommunityOfPractice {name:'Library'})
MATCH (si:SuccessIndicator) WHERE si.composite_key IN ['1.1-ins', '1.2-ins', '1.6-ins', '5.12-ins', '5.15-ins']
MERGE (c)-[r:has_stake_in]->(si)
  ON CREATE SET r.added_date = date('2026-08-04'),
                r.note = "Timely adoption (library works the adoption data), course readers/reserves, and publisher content acquisition.";

MATCH (c:CommunityOfPractice {name:'Auxiliary Enterprises'})
MATCH (si:SuccessIndicator) WHERE si.composite_key IN ['1.1-ins', '1.2-ins', '1.5-gov', '1.6-ins', '8.11-pro']
MERGE (c)-[r:has_stake_in]->(si)
  ON CREATE SET r.added_date = date('2026-08-04'),
                r.note = "Bookstore-side timely textbook adoption and auxiliary/affiliated-entity procurement channels.";

MATCH (c:CommunityOfPractice {name:'Alternative Media'})
MATCH (si:SuccessIndicator) WHERE si.composite_key IN ['5.12-ins']
MERGE (c)-[r:has_stake_in]->(si)
  ON CREATE SET r.added_date = date('2026-08-04'),
                r.note = "Course readers are core alt-media conversion work.";

MATCH (c:CommunityOfPractice {name:'Disability Services'})
MATCH (si:SuccessIndicator) WHERE si.composite_key IN ['6.9-ins']
MERGE (c)-[r:has_stake_in]->(si)
  ON CREATE SET r.added_date = date('2026-08-04'),
                r.note = "EEAAPs for equal access to course content.";

MATCH (c:CommunityOfPractice {name:'Procurement'})
MATCH (si:SuccessIndicator) WHERE si.composite_key IN ['1.4-gov', '2.4-com', '5.9-pro', '6.10-ins', '6.2-ins', '8.12-pro']
MERGE (c)-[r:has_stake_in]->(si)
  ON CREATE SET r.added_date = date('2026-08-04'),
                r.note = "Procuring course materials and LTIs, vendor collaboration, platform-agnostic review, purchaser training, and procurement authority.";

MATCH (c:CommunityOfPractice {name:'Administrative Support'})
MATCH (si:SuccessIndicator) WHERE si.composite_key IN ['2.4-com', '5.2-pro', '5.5-pro']
MERGE (c)-[r:has_stake_in]->(si)
  ON CREATE SET r.added_date = date('2026-08-04'),
                r.note = "Purchase requestors, administrative support staff, and purchase-card holders.";

MATCH (c:CommunityOfPractice {name:'Accounts Payable & Fiscal Services'})
MATCH (si:SuccessIndicator) WHERE si.composite_key IN ['5.5-pro']
MERGE (c)-[r:has_stake_in]->(si)
  ON CREATE SET r.added_date = date('2026-08-04'),
                r.note = "Purchase-card processes cross the fiscal-services desk.";

MATCH (c:CommunityOfPractice {name:'Marketing & Communications'})
MATCH (si:SuccessIndicator) WHERE si.composite_key IN ['1.21-web', '5.10-pro', '5.12-web', '5.13-web', '6.1-web', '6.2-web', '8.1-ins']
MERGE (c)-[r:has_stake_in]->(si)
  ON CREATE SET r.added_date = date('2026-08-04'),
                r.note = "Campus communication campaigns, social-media and marketing-material training, communication authority, and accessibility statements.";

MATCH (c:CommunityOfPractice {name:'Web & Mobile Development'})
MATCH (si:SuccessIndicator) WHERE si.composite_key IN ['1.11-web', '1.14-web', '1.2-gov', '1.21-web', '1.3-gov', '2.1-com', '2.1-web', '2.2-web', '3.2-web', '3.7-web', '4.11-ins', '5.14-web', '5.4-web']
MERGE (c)-[r:has_stake_in]->(si)
  ON CREATE SET r.added_date = date('2026-08-04'),
                r.note = "Developing/evaluating sites and applications, verifying changes, combined automated+manual testing, developer training and professional development.";

MATCH (c:CommunityOfPractice {name:'Web Content Contributors'})
MATCH (si:SuccessIndicator) WHERE si.composite_key IN ['1.15-web', '2.1-com', '2.10-web', '2.5-web', '3.6-web', '5.5-web', '5.6-web', '6.7-web', '6.8-web']
MERGE (c)-[r:has_stake_in]->(si)
  ON CREATE SET r.added_date = date('2026-08-04'),
                r.note = "Content creators/maintainers: document processes, requested reviews, change verification, and contributor training.";

MATCH (c:CommunityOfPractice {name:'Multimedia & Video Production'})
MATCH (si:SuccessIndicator) WHERE si.composite_key IN ['1.12-web', '2.6-web', '5.7-web']
MERGE (c)-[r:has_stake_in]->(si)
  ON CREATE SET r.added_date = date('2026-08-04'),
                r.note = "Multimedia evaluation, pre-publication video/audio accessibility, and media training.";

MATCH (c:CommunityOfPractice {name:'Information Technology'})
MATCH (si:SuccessIndicator) WHERE si.composite_key IN ['1.1-web', '1.19-web', '2.9-web', '3.1-web', '3.5-web', '5.1-web', '5.2-web']
MERGE (c)-[r:has_stake_in]->(si)
  ON CREATE SET r.added_date = date('2026-08-04'),
                r.note = "Assigned authority for evaluation/development/monitoring/training processes and application support.";

MATCH (c:CommunityOfPractice {name:'Technical Support'})
MATCH (si:SuccessIndicator) WHERE si.composite_key IN ['1.19-web']
MERGE (c)-[r:has_stake_in]->(si)
  ON CREATE SET r.added_date = date('2026-08-04'),
                r.note = "Application support processes with published accessibility support statements.";
