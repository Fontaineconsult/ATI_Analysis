CALL apoc.export.csv.query(
"MATCH (sc:ATISubCommittee)-[:is_a_subcommittee_goal]->(g:Goal)-[:is_a_success_indicator_for]->(si:SuccessIndicator)-[:success_indicator_is]-(yse:YearSuccessEvidence)-[:status_is]->(sl:StatusLevel)
   RETURN sc.name AS ATISubCommitteeName,
          g.name AS GoalName, g.goal AS Goal, g.goal_number AS GoalNumber, g.date_added AS GoalDateAdded, g.removed AS GoalRemoved,
          si.number AS SuccessIndicatorNumber, si.success_indicator AS SuccessIndicator, si.composite_key AS SuccessIndicatorCompositeKey, si.date_added AS SuccessIndicatorDateAdded, si.removed AS SuccessIndicatorRemoved,
          yse.year_identifier AS YearIdentifier,
          sl.status_level AS StatusLevel, sl.description_of_procedures AS DescriptionOfProcedures, sl.description_of_documentation AS DescriptionOfDocumentation, sl.description_of_documentation_evidence AS DescriptionOfDocumentationEvidence, sl.description_of_resources AS DescriptionOfResources, sl.status_value AS StatusValue",
    "atisubcommittee_goal_successindicator_yearsuccessevidence_status.csv",
  {batchSize: 10000}
)