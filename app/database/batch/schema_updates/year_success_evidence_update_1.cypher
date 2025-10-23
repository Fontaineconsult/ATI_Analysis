MATCH (n:YearSuccessEvidence)
SET n.admin_reviewer_note = "No Review"
SET n.admin_review_description = "No Review"
SET n.ready_for_admin_review = False

RETURN count(n) as updated_count