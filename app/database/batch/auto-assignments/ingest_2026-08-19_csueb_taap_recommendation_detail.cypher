// ===========================================================================
// Rename + detail for the recommendation on 2025-2026-4.6-pro-csueb
// (uid 10c46f5fe07d4e58a6a866e7b11ba836, raised 2026-08-19 by Daniel Fontaine).
//
//   was: "CSUEB DSS Must it Involved in the TAAP Authoring Flow"
//   now: "CSUEB DSS Must Be Involved in the TAAP authoring flow"
//
// SOURCE
//   MeetingMinutes ba53adcab7b04e1e989039633f170b33 — "CSU East Bay Disability
//   Services — TAP Process, Alt Media Workflow, and Textbook Adoption",
//   2026-08-19, Daniel Fontaine + Pamela Baird.
//
// DETAIL SCOPE — Recommendation.detail is "what closing it looks like", not the
// history that produced the ask. The background (the VPAT-review split and its
// collapse into ITS, EEAAPs defaulting to Accessibility Services, Pamela's
// pushback, the centralized SFBRN procurement structure) already lives in two
// notes from the same meeting and is deliberately NOT repeated here:
//   - csueb-taap-boundary-history-aug-2026-yse:2025-2026-4.6-pro-csueb-c81f3e05
//   - taap-signing-flow-dsg-involvement-aug-2026-plan:912f6236-4b1e77a0
//     (progress update on plan "Finalize the updated TAAP authoring workflow.")
//
// Status, dates and the created_by edge are left untouched.
// ===========================================================================

MATCH (rec:Recommendation {unique_id: "10c46f5fe07d4e58a6a866e7b11ba836"})
SET rec.recommendation = "CSUEB DSS Must Be Involved in the TAAP authoring flow",
    rec.detail = "Disability Services should sit in the TAAP signing flow rather than the drafting one, receiving a mostly complete TAAP to approve or push back. Drafting stays with the procuring side. An optional consultation path should run alongside it, available on request rather than by default, so Disability Services can weigh in before a TAAP is finalized when a case warrants it. Routing should notify Disability Services whenever a TAAP is raised, restoring the visibility the older EAP workflow provided. Daniel Fontaine is bringing the model to Amanda McGowan as centralized SFBRN procurement is designed.";
