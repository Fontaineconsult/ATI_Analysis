// Clear unreviewed evidence summaries written prematurely.
// Keeps Goal 4 (reviewed) and the 9 pre-existing ones.

MATCH (yse:YearSuccessEvidence {year_identifier: '2025-2026-1.5-ins-sfsu'})
SET yse.admin_review_description = null;

MATCH (yse:YearSuccessEvidence {year_identifier: '2025-2026-2.4-ins-sfsu'})
SET yse.admin_review_description = null;

MATCH (yse:YearSuccessEvidence {year_identifier: '2025-2026-5.11-ins-sfsu'})
SET yse.admin_review_description = null;

MATCH (yse:YearSuccessEvidence {year_identifier: '2025-2026-5.12-ins-sfsu'})
SET yse.admin_review_description = null;

MATCH (yse:YearSuccessEvidence {year_identifier: '2025-2026-5.13-ins-sfsu'})
SET yse.admin_review_description = null;

MATCH (yse:YearSuccessEvidence {year_identifier: '2025-2026-5.14-ins-sfsu'})
SET yse.admin_review_description = null;

MATCH (yse:YearSuccessEvidence {year_identifier: '2025-2026-5.15-ins-sfsu'})
SET yse.admin_review_description = null;

MATCH (yse:YearSuccessEvidence {year_identifier: '2025-2026-5.16-ins-sfsu'})
SET yse.admin_review_description = null;

MATCH (yse:YearSuccessEvidence {year_identifier: '2025-2026-6.2-ins-sfsu'})
SET yse.admin_review_description = null;

MATCH (yse:YearSuccessEvidence {year_identifier: '2025-2026-6.4-ins-sfsu'})
SET yse.admin_review_description = null;

MATCH (yse:YearSuccessEvidence {year_identifier: '2025-2026-6.5-ins-sfsu'})
SET yse.admin_review_description = null;

MATCH (yse:YearSuccessEvidence {year_identifier: '2025-2026-6.7-ins-sfsu'})
SET yse.admin_review_description = null;

MATCH (yse:YearSuccessEvidence {year_identifier: '2025-2026-6.8-ins-sfsu'})
SET yse.admin_review_description = null;

MATCH (yse:YearSuccessEvidence {year_identifier: '2025-2026-6.9-ins-sfsu'})
SET yse.admin_review_description = null;

MATCH (yse:YearSuccessEvidence {year_identifier: '2025-2026-7.1-ins-sfsu'})
SET yse.admin_review_description = null;

MATCH (yse:YearSuccessEvidence {year_identifier: '2025-2026-8.1-ins-sfsu'})
SET yse.admin_review_description = null;

MATCH (yse:YearSuccessEvidence {year_identifier: '2025-2026-8.13-ins-sfsu'})
SET yse.admin_review_description = null;

MATCH (yse:YearSuccessEvidence {year_identifier: '2025-2026-8.14-ins-sfsu'})
SET yse.admin_review_description = null;

MATCH (yse:YearSuccessEvidence {year_identifier: '2025-2026-9.1-ins-sfsu'})
SET yse.admin_review_description = null;

MATCH (yse:YearSuccessEvidence {year_identifier: '2025-2026-9.2-ins-sfsu'})
SET yse.admin_review_description = null;

MATCH (yse:YearSuccessEvidence {year_identifier: '2025-2026-9.3-ins-sfsu'})
SET yse.admin_review_description = null;
