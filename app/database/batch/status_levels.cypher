MATCH (sl:StatusLevel)
OPTIONAL MATCH (sl)-[:is_a_procedure_description]->(pd:ProcedureDescription)
OPTIONAL MATCH (sl)-[:is_a_procedure_requirement]->(pr:ProcedureRequirement)
OPTIONAL MATCH (sl)-[:is_a_resource_description]->(rd:ResourceDescription)
OPTIONAL MATCH (sl)-[:is_a_resource_requirement]->(rr:ResourceRequirement)
OPTIONAL MATCH (sl)-[:is_a_documentation_description]->(dd:DocumentationDescription)
OPTIONAL MATCH (sl)-[:is_a_documentation_requirement]->(dr:DocumentationRequirement)
OPTIONAL MATCH (sl)-[:is_a_documentation_evidence_description]->(ded:DocumentationEvidenceDescription)
OPTIONAL MATCH (sl)-[:is_a_documentation_evidence_requirement]->(der:DocumentationEvidenceRequirement)
OPTIONAL MATCH (sl)-[:has_note]->(note:Note)
WITH sl,
     collect(DISTINCT pd) AS procedure_descriptions,
     collect(DISTINCT pr) AS procedure_requirements,
     collect(DISTINCT rd) AS resource_descriptions,
     collect(DISTINCT rr) AS resource_requirements,
     collect(DISTINCT dd) AS documentation_descriptions,
     collect(DISTINCT dr) AS documentation_requirements,
     collect(DISTINCT ded) AS documentation_evidence_descriptions,
     collect(DISTINCT der) AS documentation_evidence_requirements,
     collect(DISTINCT note) AS notes
RETURN sl {
       .*,
         procedure_descriptions: [pd IN procedure_descriptions | pd {.*}],
         procedure_requirements: [pr IN procedure_requirements | pr {.*}],
         resource_descriptions: [rd IN resource_descriptions | rd {.*}],
         resource_requirements: [rr IN resource_requirements | rr {.*}],
         documentation_descriptions: [dd IN documentation_descriptions | dd {.*}],
         documentation_requirements: [dr IN documentation_requirements | dr {.*}],
         documentation_evidence_descriptions: [ded IN documentation_evidence_descriptions | ded {.*}],
         documentation_evidence_requirements: [der IN documentation_evidence_requirements | der {.*}],
         notes: [n IN notes | n {.*}]
       } AS status_level_data;
