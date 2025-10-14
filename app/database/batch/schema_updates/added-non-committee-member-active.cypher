MATCH (p:Person)
  WHERE p.non_committee_member_active IS NULL
SET p.non_committee_member_active = false
RETURN count(p) AS updated_count;