// Procurement community of practice claims every Procurement working-group indicator.
//
// Decided 2026-08-14. Before this, the Procurement CoP held 15 of 25 live Procurement
// WG indicators. The 10 gaps were not oversights — each had been assigned instead to
// the community being acted upon:
//
//     4.6-pro    Disability Services                              (alternate access)
//     5.1-pro    Human Resources                                  (training audience)
//     5.2-pro    Administrative Support                                    "
//     5.3-pro    Technical Support                                         "
//     5.5-pro    Accounts Payable & Fiscal Services, Admin Support         "
//     5.10-pro   Marketing & Communications                                "
//     5.6-pro    NOBODY  (the one true orphan)
//     8.11-pro   Auxiliary Enterprises
//     9.1-pro    Executive Leadership                             (Steering process)
//     9.2-pro    Executive Leadership                                      "
//
// The rule being applied: the working group's own community holds EVERY indicator in
// its working group. Procurement plainly has a stake in training its own purchasers,
// even where the audience being trained is another community.
//
// ADDITIVE. has_stake_in is many-to-many, so nothing is displaced — Disability
// Services keeps 4.6-pro, Executive Leadership keeps 9.1/9.2, and so on. This adds
// Procurement alongside them.
//
// DATA-DRIVEN rather than a list of ten keys: it MERGEs over the working-group
// traversal, so re-running it after new Procurement indicators are authored closes
// those gaps too. Removed indicators are excluded — a retired indicator is history,
// not a stake.
//
// Idempotent: MERGE + ON CREATE SET, matching queries/communities/update.add_community_stake.
// Re-running matches existing edges and leaves their notes alone.
//
//   Validate:  python -m app.database.cypher_runner.run_file app/database/batch/auto-assignments/2026-08-14_procurement_cop_claims_all_pro_indicators.cypher
//   Execute:   ... --execute

// Guard: fail loudly if either anchor is missing, rather than silently matching nothing.
MATCH (cop:CommunityOfPractice {name: 'Procurement'})
RETURN count(cop) AS procurement_community_found;

MATCH (wg:ATIWorkingGroup {name: 'Procurement'})
RETURN count(wg) AS procurement_working_group_found;

// The assignment.
MATCH (cop:CommunityOfPractice {name: 'Procurement'})
MATCH (:ATIWorkingGroup {name: 'Procurement'})-[:responsible_for]->(:Goal)-[:supported_by]->(si:SuccessIndicator)
WHERE si.removed IS NULL OR si.removed = false
MERGE (cop)-[r:has_stake_in]->(si)
ON CREATE SET r.added_date = date(),
              r.note = 'Procurement working-group indicator. The procurement community holds every indicator in its own working group, alongside any other community with a stake in it (blanket assignment, 2026-08-14).'
RETURN count(r) AS procurement_stakes_total;
