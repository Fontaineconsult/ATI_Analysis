MATCH (wg:ATIWorkingGroup)-[:responsible_for]->(goal:Goal)
WHERE wg.name = $working_group
OPTIONAL MATCH (goal)-[:supported_by]->(indicator:SuccessIndicator)
OPTIONAL MATCH (indicator)<-[:tracks]-(evidence:YearSuccessEvidence)-[:evidence_in_year]->(year:AcademicYear)
WHERE year.name = $academic_year
OPTIONAL MATCH (internalPolicy:InternalPolicy)-[:is_evidence_for]->(evidence)
OPTIONAL MATCH (process:Process)-[:is_evidence_for]->(evidence)
OPTIONAL MATCH (project:Project)-[:is_evidence_for]->(evidence)
OPTIONAL MATCH (procedure:Procedure)-[:is_evidence_for]->(evidence)
OPTIONAL MATCH (service:Service)-[:is_evidence_for]->(evidence)
OPTIONAL MATCH (guidance:Guidance)-[:is_evidence_for]->(evidence)
OPTIONAL MATCH (tracking:Tracking)-[:is_evidence_for]->(evidence)

OPTIONAL MATCH (internalPolicy)-[:is_documented_by]->(doc:Document)
OPTIONAL MATCH (internalPolicy)-[:is_documented_by]->(web:Webpage)
OPTIONAL MATCH (internalPolicy)-[:is_documented_by]->(note:Note)
OPTIONAL MATCH (internalPolicy)-[:is_documented_by]->(msg:Message)
OPTIONAL MATCH (internalPolicy)-[:has_metric]->(metric:Metric)

OPTIONAL MATCH (process)-[:is_documented_by]->(docProcess:Document)
OPTIONAL MATCH (process)-[:is_documented_by]->(webProcess:Webpage)
OPTIONAL MATCH (process)-[:is_documented_by]->(noteProcess:Note)
OPTIONAL MATCH (process)-[:is_documented_by]->(msgProcess:Message)
OPTIONAL MATCH (process)-[:has_metric]->(metricProcess:Metric)

OPTIONAL MATCH (project)-[:is_documented_by]->(docProject:Document)
OPTIONAL MATCH (project)-[:is_documented_by]->(webProject:Webpage)
OPTIONAL MATCH (project)-[:is_documented_by]->(noteProject:Note)
OPTIONAL MATCH (project)-[:is_documented_by]->(msgProject:Message)
OPTIONAL MATCH (project)-[:has_metric]->(metricProject:Metric)

OPTIONAL MATCH (procedure)-[:is_documented_by]->(docProcedure:Document)
OPTIONAL MATCH (procedure)-[:is_documented_by]->(webProcedure:Webpage)
OPTIONAL MATCH (procedure)-[:is_documented_by]->(noteProcedure:Note)
OPTIONAL MATCH (procedure)-[:is_documented_by]->(msgProcedure:Message)
OPTIONAL MATCH (procedure)-[:has_metric]->(metricProcedure:Metric)

OPTIONAL MATCH (service)-[:is_documented_by]->(docService:Document)
OPTIONAL MATCH (service)-[:is_documented_by]->(webService:Webpage)
OPTIONAL MATCH (service)-[:is_documented_by]->(noteService:Note)
OPTIONAL MATCH (service)-[:is_documented_by]->(msgService:Message)
OPTIONAL MATCH (service)-[:has_metric]->(metricService:Metric)

OPTIONAL MATCH (guidance)-[:is_documented_by]->(docGuidance:Document)
OPTIONAL MATCH (guidance)-[:is_documented_by]->(webGuidance:Webpage)
OPTIONAL MATCH (guidance)-[:is_documented_by]->(noteGuidance:Note)
OPTIONAL MATCH (guidance)-[:is_documented_by]->(msgGuidance:Message)
OPTIONAL MATCH (guidance)-[:has_metric]->(metricGuidance:Metric)

OPTIONAL MATCH (tracking)-[:is_documented_by]->(docTracking:Document)
OPTIONAL MATCH (tracking)-[:is_documented_by]->(webTracking:Webpage)
OPTIONAL MATCH (tracking)-[:is_documented_by]->(noteTracking:Note)
OPTIONAL MATCH (tracking)-[:is_documented_by]->(msgTracking:Message)
OPTIONAL MATCH (tracking)-[:has_metric]->(metricTracking:Metric)

OPTIONAL MATCH (person:Person)-[:implements]->(evidence)
OPTIONAL MATCH (accomplishment:Accomplishment)-[:advances_goal]->(goal)
OPTIONAL MATCH (plan:Plan)-[:furthers_goal]->(goal)

RETURN goal, indicator, evidence,
       internalPolicy, process, project, procedure, service, guidance, tracking,
       doc, web, note, msg, metric,
       docProcess, webProcess, noteProcess, msgProcess, metricProcess,
       docProject, webProject, noteProject, msgProject, metricProject,
       docProcedure, webProcedure, noteProcedure, msgProcedure, metricProcedure,
       docService, webService, noteService, msgService, metricService,
       docGuidance, webGuidance, noteGuidance, msgGuidance, metricGuidance,
       docTracking, webTracking, noteTracking, msgTracking, metricTracking,
       person, accomplishment, plan
