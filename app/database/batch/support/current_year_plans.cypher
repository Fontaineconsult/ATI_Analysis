MATCH (p:Plan)-[r_in_ay:in_academic_year]->(ay:AcademicYear {name: '2023-2024'})
OPTIONAL MATCH (p)-[r_fy:furthers_yse]->(yse:YearSuccessEvidence)
OPTIONAL MATCH (p)-[r_fg:furthers_goal]->(g:Goal)
RETURN p, r_in_ay, ay, r_fy, yse, r_fg, g