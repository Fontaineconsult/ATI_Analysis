MERGE (g:Goal {name: row.GoalName})
  ON CREATE SET
  g.goal = row.Goal,
  g.goal_number = toInteger(row.GoalNumber),
  g.date_added = date(split(row.GoalDateAdded, "T")[0]), // Convert datetime to date
  g.removed = row.GoalRemoved = 'true'

// Create Relationship between ATISubCommittee and Goal
MERGE (sc)-[:is_a_subcommittee_goal]->(g)

// Import SuccessIndicator
MERGE (si:SuccessIndicator {composite_key: row.SuccessIndicatorCompositeKey})
  ON CREATE SET
  si.number = toInteger(row.SuccessIndicatorNumber),
  si.success_indicator = row.SuccessIndicator,
  si.date_added = date(split(row.SuccessIndicatorDateAdded, "T")[0]), // Convert datetime to date
  si.removed = row.SuccessIndicatorRemoved = 'true'

// Create Relationship between Goal and SuccessIndicator
MERGE (g)-[:is_a_success_indicator_for]->(si)

// Import YearSuccessEvidence
MERGE (yse:YearSuccessEvidence {year_identifier: row.YearIdentifier})

// Create Relationship between SuccessIndicator and YearSuccessEvidence
MERGE (si)-[:success_indicator_is]->(yse)

// Import StatusLevel
MERGE (sl:StatusLevel {status_level: row.StatusLevel})
  ON CREATE SET
  sl.description_of_procedures = row.DescriptionOfProcedures,
  sl.description_of_documentation = row.DescriptionOfDocumentation,
  sl.description_of_documentation_evidence = row.DescriptionOfDocumentationEvidence,
  sl.description_of_resources = row.DescriptionOfResources,
  sl.status_value = row.StatusValue

// Create Relationship between YearSuccessEvidence and StatusLevel
MERGE (yse)-[:status_is]->(sl)