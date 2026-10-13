// Add Chloe Pearson to the graph and place her in the Marketing & Communications
// community of practice.
//
// Campus:     SFSU
// Department: Strategic Marketing and Communication (the graph's spelling)
// Community:  Marketing & Communications
//
// employee_id is a SYNTHETIC placeholder requested in place of the real number.
// It is checked clear of collisions but it is not her payroll id.
//
// Idempotent. Person.name carries the uniqueness constraint, so it is the MERGE key.
// unique_id is set on create because the app reads that property, and a node seeded
// by raw Cypher without it reads back as null.

MERGE (p:Person {name: 'Chloe Pearson'})
ON CREATE SET p.unique_id = replace(randomUUID(), '-', '')
SET p.email = 'csotomayor@sfsu.edu',
    p.employee_id = '917430582',
    p.title = 'Web and Digital Design Content Specialist',
    p.active = true,
    p.can_approve_yse = false,
    p.non_committee_member_active = true;

MATCH (p:Person {name: 'Chloe Pearson'})
MATCH (c:Campus {abbreviation: 'sfsu'})
MERGE (p)-[:works_at_campus]->(c);

MATCH (p:Person {name: 'Chloe Pearson'})
MATCH (d:Department {name: 'Strategic Marketing and Communication'})
MERGE (d)-[:employs]->(p);

MATCH (p:Person {name: 'Chloe Pearson'})
MATCH (com:CommunityOfPractice {name: 'Marketing & Communications'})
MERGE (p)-[m:member_of_community]->(com)
ON CREATE SET m.added_date = '2026-09-28';
