MATCH (impl:InternalPolicy)-[r:is_documented_by]->(doc)
  WHERE (doc:Document OR doc:Webpage OR doc:Note OR doc:Message)
SET r.included_in_years = ['2021-2022', '2022-2023', '2023-2024', '2024-2025'],
r.excluded_from_years = [],
r.modified_date = date(),
r.added_date = CASE WHEN r.added_date IS NULL THEN date() ELSE r.added_date END
RETURN impl.title as implementation,
       labels(doc)[0] as doc_type,
       doc.name as document_name,
       r.included_in_years as included_years