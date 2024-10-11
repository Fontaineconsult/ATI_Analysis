MATCH (wg:ATIWorkingGroup)-[:responsible_for]->(goal:Goal)
  WHERE wg.name = "Web"


OPTIONAL MATCH (goal)-[:supported_by]->(indicator:SuccessIndicator)

OPTIONAL MATCH (indicator)<-[:tracks]-(evidence:YearSuccessEvidence)
                 -[:evidence_in_year]->(year:AcademicYear)
  WHERE year.name = "2022-2023"


WITH wg, goal, indicator, evidence
  WHERE evidence IS NOT NULL


OPTIONAL MATCH (evidence)<-[:implements]-(person:Person)

OPTIONAL MATCH (evidence)<-[:is_evidence_for]-(evidenceType)
  WHERE evidenceType:InternalPolicy OR
  evidenceType:Process OR
  evidenceType:Project OR
  evidenceType:Procedure OR
  evidenceType:Service OR
  evidenceType:Guidance OR
  evidenceType:Tracking


OPTIONAL MATCH (evidenceType)-[:is_documented_by]->(doc:Document)
OPTIONAL MATCH (evidenceType)-[:is_documented_by]->(web:Webpage)
OPTIONAL MATCH (evidenceType)-[:is_documented_by]->(note:Note)
OPTIONAL MATCH (evidenceType)-[:is_documented_by]->(msg:Message)
OPTIONAL MATCH (evidenceType)-[:has_metric]->(metric:Metric)


OPTIONAL MATCH (goal)<-[:advances_goal]-(accomplishment:Accomplishment)
                 -[:in_academic_year]->(accomplishmentYear:AcademicYear)
  WHERE accomplishmentYear.name = "2022-2023"

OPTIONAL MATCH (goal)<-[:furthers_goal]-(plan:Plan)
                 -[:in_academic_year]->(planYear:AcademicYear)
  WHERE planYear.name = "2022-2023"


RETURN wg, goal, indicator, evidence, evidenceType, person,
       doc, web, note, msg, metric, accomplishment, plan
