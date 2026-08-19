// Type migration: Document.is_administrative_review_documentation and
// .is_milestone_and_measures_documentation from 'True'/'False' STRINGS to booleans.
//
// WHY: both were StringProperty in graph_schema while the DocumentForm switch
// submits booleans — neomodel deflated them to 'True'/'False' strings. Besides
// the type dirt, 'False' is truthy in JS, so 56 documents rendered phantom ON
// switches in the form. The schema fields are now BooleanProperty; this
// normalizes the stored values to match.
//
// Scope check (2026-08-11): 56 Documents with 'False'/'False', 36 with no
// value, zero 'True' anywhere. Idempotent: the string predicates cannot match
// boolean values on a re-run.
MATCH (d:Document) WHERE d.is_administrative_review_documentation IN ['True', 'true'] SET d.is_administrative_review_documentation = true;
MATCH (d:Document) WHERE d.is_administrative_review_documentation IN ['False', 'false'] SET d.is_administrative_review_documentation = false;
MATCH (d:Document) WHERE d.is_milestone_and_measures_documentation IN ['True', 'true'] SET d.is_milestone_and_measures_documentation = true;
MATCH (d:Document) WHERE d.is_milestone_and_measures_documentation IN ['False', 'false'] SET d.is_milestone_and_measures_documentation = false;
