MATCH (yse:YearSuccessEvidence)-[:evidence_in_year]->(ay:AcademicYear),
      (yse)-[:has_note]->(note:Note)
  WHERE ay.name = '2023-2024'
RETURN note, yse;