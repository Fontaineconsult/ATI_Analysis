// Backfill Plan.plan_status = 'Not Started' where it is NULL.
//
// Precondition (verified 2026-09-09): every non-null plan_status in the live
// graph is already one of the five canonical values in
// data_config.plan_statuses; the historic 'Complete' variant was normalized
// by the earlier update_plan fix. This backfill makes the remaining NULLs
// explicit, matching what every frontend surface already renders for them
// (plan_status || 'Not Started'), so the schema can constrain the property
// to the vocabulary without a read-time surprise.
//
// Idempotent: a second run matches nothing.
MATCH (p:Plan)
WHERE p.plan_status IS NULL
SET p.plan_status = 'Not Started';
