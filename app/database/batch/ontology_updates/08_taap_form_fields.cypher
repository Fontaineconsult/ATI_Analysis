// 08_taap_form_fields.cypher
// Describe the TAAP node's form-derived fields and vocabularies so the graph can
// explain itself. Source: the CSU Temporary Alternative Access Plan form, template
// "Version 3.2 051225", read from the 26 signed plans in the SFBRN TAAP folder.
//
// Conventions follow README.md: node_type prose is appended under a guard; field
// and field_value descriptors are MERGEd by handle (identifiers.make_field_handle /
// make_field_value_handle) with absolute SETs, so a re-run is a no-op; every
// statement recomputes search_text and stamps last_updated.

// ==== taap-node-type: form mapping ======================================
MATCH (d:UniversalDescriptor {descriptor_handle: "node_type:TAAP"})
WHERE NOT coalesce(d.description_full, "") CONTAINS "template 3.2 051225"
SET d.description_full = coalesce(d.description_full, "") + "\n\nForm mapping (template 3.2 051225). The node stores the CSU TAAP form section by section. ICT Product Information: title, creation_date, vendor_contact; the product version lives on the covered Asset. Referenced Documentation: `references` edges to Document or Webpage carrying a kind (acr, vendor_demo, testing_results, vendor_roadmap). Known Accessibility Barriers: known_barriers text plus affected_user_groups keys. Proposed Alternative: proposed_alternative text plus the `alternative_provided_by` unit. Product Specific Accessibility Statement: accessibility_statement text plus statement_elements keys. Communication and Distribution: distribution_actions keys. Requirements Checklist: requirements_met keys, six legal criteria. Process Outcome, Institutional Risk, Accommodation Requirements: outcome, institutional_risk, accommodation_requirement. Administrative Approval: `signed_by` edges carrying role and signed_date; effective_date is the last signature. Next Review: review_due. Miscellaneous Notes: misc_notes. The vendor non-compliance clause and the legal framework are boilerplate and are not stored. Identity is taap_identifier = asset + requesting unit + creation year, because one product can carry one plan per requesting department at a campus. Lifecycle is taap_status; an annual renewal is a new node that `supersedes` the old one.",
    d.last_updated = date()
WITH d
SET d.search_text = toLower(reduce(s = "", p IN [x IN [d.title, d.description_short, d.description_full, d.target_label, d.target_field, d.target_value] WHERE x IS NOT NULL AND trim(x) <> ""] | s + CASE WHEN s = "" THEN "" ELSE " " END + trim(p)));

// ==== outcome values: quote the form's grading ==========================
UNWIND [
  {value: "equally_effective",     form: "Meets all six legal requirements: Equally Effective. The proposed solution fully meets all legal requirements for equally effective access, presenting minimal risk to the institution. In general, no individual accommodations are expected to be necessary."},
  {value: "non_equal_alternative", form: "Meets some (1-5) legal requirements: Partially Equally Effective. While the solution partially addresses accessibility, it may still require supplemental assistance for users. This carries a moderate risk to the institution, and staff should be prepared to provide additional support for affected individuals."},
  {value: "referral",              form: "Unable to provide alternative means of access: Need for Individualized Accommodation. If no effective alternative solution is available, individualized accommodations must be provided for each affected user. This requires alerting the disability services and human resources offices."}
] AS row
MATCH (d:UniversalDescriptor {descriptor_handle: "field_value:outcome." + row.value})
WHERE NOT coalesce(d.description_full, "") CONTAINS "Form wording"
SET d.description_full = coalesce(d.description_full, "") + "\n\nForm wording (Process Outcome, template 3.2 051225): \"" + row.form + "\"",
    d.last_updated = date()
WITH d
SET d.search_text = toLower(reduce(s = "", p IN [x IN [d.title, d.description_short, d.description_full, d.target_label, d.target_field, d.target_value] WHERE x IS NOT NULL AND trim(x) <> ""] | s + CASE WHEN s = "" THEN "" ELSE " " END + trim(p)));

// ==== field descriptors =================================================
UNWIND [
  {field: "taap_identifier", title: "TAAP Identifier",
   short: "Composite identity: covered asset, requesting unit, creation year.",
   full: "Format '<asset_identifier>--<requesting_unit_slug>--<YYYY>', built by identifiers.make_taap_identifier(). Title cannot carry identity: Sonoma State holds four Humanity plans, one per department, all titled Humanity. The unique index is on this property; title is indexed but not unique."},
  {field: "template_version", title: "Template Version",
   short: "The CSU form version the plan was written on, as printed in its footer.",
   full: "Every plan in the SFBRN folder as of October 2026 reads 'Version 3.2 051225'. Stored so a later template revision can be told apart when fields move."},
  {field: "creation_date", title: "Creation Date",
   short: "The form's 'Temporary Alternate Access Plan Creation Date'.",
   full: "The date the reviewer wrote the plan, as entered on the form. Distinct from effective_date (the last signature) and review_due (one year on). The identifier's year coordinate comes from this date."},
  {field: "vendor_contact", title: "Vendor Contact",
   short: "The vendor contact as written on the form.",
   full: "A snapshot string, not a Person. The Vendor node reaches the plan through the covered Asset's supplied_by edge; this field keeps what the form said even when that edge is missing."},
  {field: "known_barriers", title: "Known Accessibility Barriers",
   short: "The form's description of barriers that affect core functionality.",
   full: "Free text from the 'Known Accessibility Barriers' section. The reviewer's own prose, usually drawn from the ACR's Partially Supports and Does Not Support rows. Quoted material; not edited on ingest."},
  {field: "affected_user_groups", title: "Affected User Groups",
   short: "Which of the form's nine disability groups were checked.",
   full: "Array of taap_user_groups keys. The form says 'choose all that apply'. Five of the 26 plans surveyed have none checked, so an empty array means unanswered, not unaffected."},
  {field: "proposed_alternative", title: "Proposed Alternative",
   short: "How the alternative addresses the barriers, with resources and the responsible department.",
   full: "Free text from the 'Proposed Alternative' section. The department named here is also wired as the alternative_provided_by unit when it can be resolved."},
  {field: "accessibility_statement", title: "Product Specific Accessibility Statement",
   short: "The statement drafted for posting where the product is used.",
   full: "Free text. The form asks for known barriers, impacted groups, a link to the plan, a best-effort disclaimer, and an assistance contact; which of those the statement includes is recorded in statement_elements."},
  {field: "statement_elements", title: "Statement Elements",
   short: "Which of the five required statement contents were checked.",
   full: "Array of taap_statement_elements keys. A statement missing link_to_plan is the most common gap in the plans surveyed."},
  {field: "distribution_actions", title: "Communication and Distribution",
   short: "Which distribution actions the form records as taken.",
   full: "Array of taap_distribution_actions keys. Posting the statement where the product is accessed is also evidence toward indicator 1.19-web."},
  {field: "requirements_met", title: "Requirements Checklist",
   short: "Which of the six legal requirements for an equally effective alternative were checked.",
   full: "Array of taap_requirements keys. The form grades outcome from this count: all six is equally effective, one to five is partially, none is individualized accommodation. The stored outcome is what the form says; the read path flags disagreement rather than correcting it. The form's 'Saved the document in the ATI Systemwide ACR Repository' line under this heading is a distribution action, not a requirement."},
  {field: "institutional_risk", title: "Institutional Risk",
   short: "High, moderate or low, as graded on the form.",
   full: "The form ties the level to the requirements count: high supports 0 criteria (no alternative access), moderate supports 1 to 5 (non-equal alternative), low supports all 6 (equally effective)."},
  {field: "accommodation_requirement", title: "Accommodation Requirements",
   short: "High, moderate or low: how many users will still need individual accommodation.",
   full: "The form's companion grade to institutional risk on the same scale: high means accommodations for all users, moderate for some, low for a minimal number."},
  {field: "effective_date", title: "Effective Date",
   short: "The date the last required signature landed.",
   full: "Taken from the e-signature stamps (Adobe Sign at Sonoma State, DocuSign at SF State). Null while a signature is pending; the per-signer dates live on the signed_by edges."},
  {field: "review_due", title: "Review Due",
   short: "The form's 'Review of this document should occur on or before' date.",
   full: "Normally one year after creation. The annual-review worklist and the taaps_due_for_review registry query read this field. Six of 26 plans surveyed left it blank and three dated it before the creation date, so a null or implausible value is a curation finding, not an error."},
  {field: "misc_notes", title: "Miscellaneous Notes",
   short: "The form's free-text notes section.",
   full: "Often the only place the form names who prepared the plan and whom they met, which is how prepared_by gets resolved."},
  {field: "taap_status", title: "TAAP Status",
   short: "Where the plan is in its lifecycle.",
   full: "One of taap_statuses. A renewal is a new node that supersedes this one and moves it to renewed; retired means the vendor resolved the barriers and no plan is needed."}
] AS row
MERGE (d:UniversalDescriptor {descriptor_handle: "field:TAAP." + row.field})
ON CREATE SET d.unique_id = replace(randomUUID(), "-", ""),
              d.descriptor_kind = "field",
              d.include_in_report = false
SET d.target_label = "TAAP",
    d.target_field = row.field,
    d.title = row.title,
    d.description_short = row.short,
    d.description_full = row.full,
    d.last_updated = date()
WITH d
SET d.search_text = toLower(reduce(s = "", p IN [x IN [d.title, d.description_short, d.description_full, d.target_label, d.target_field, d.target_value] WHERE x IS NOT NULL AND trim(x) <> ""] | s + CASE WHEN s = "" THEN "" ELSE " " END + trim(p)));

// ==== field_value descriptors: checkbox and grade vocabularies ==========
// Labels quote the form. Keys match app/data_config.py.
UNWIND [
  // affected_user_groups
  {field: "affected_user_groups", value: "blindness",                  title: "Blindness"},
  {field: "affected_user_groups", value: "low_vision",                 title: "Low Vision"},
  {field: "affected_user_groups", value: "deafness",                   title: "Deafness"},
  {field: "affected_user_groups", value: "hard_of_hearing",            title: "Hard of Hearing"},
  {field: "affected_user_groups", value: "limited_manual_dexterity",   title: "Limited Manual Dexterity"},
  {field: "affected_user_groups", value: "cognitive_disability",       title: "Cognitive Disability"},
  {field: "affected_user_groups", value: "speech_disabilities",        title: "Speech Disabilities"},
  {field: "affected_user_groups", value: "photosensitivity",           title: "Photosensitivity"},
  {field: "affected_user_groups", value: "limited_reach_and_strength", title: "Limited Reach and Strength"},
  // requirements_met
  {field: "requirements_met", value: "same_information",       title: "Allows access to the same information, engagement, and services."},
  {field: "requirements_met", value: "same_availability",      title: "Offers the same availability as the primary solution."},
  {field: "requirements_met", value: "independent_access",     title: "Can be accessed independently without additional assistance."},
  {field: "requirements_met", value: "no_disparate_burden",    title: "Does not result in disparate burden or impact on the user."},
  {field: "requirements_met", value: "equivalent_ease_of_use", title: "Has substantially equivalent ease of use."},
  {field: "requirements_met", value: "privacy_protected",      title: "Protects the privacy of the individuals affected."},
  // statement_elements
  {field: "statement_elements", value: "known_barriers",     title: "Known barriers in the product interface."},
  {field: "statement_elements", value: "impacted_groups",    title: "Impacted disability groups."},
  {field: "statement_elements", value: "link_to_plan",       title: "Link or reference to this document."},
  {field: "statement_elements", value: "disclaimer",         title: "Disclaimer: best effort was made, but unknown barriers may remain."},
  {field: "statement_elements", value: "assistance_contact", title: "Contact for further accessibility assistance."},
  // distribution_actions
  {field: "distribution_actions", value: "syllabi",               title: "Posted the Accessibility Statement in course syllabi."},
  {field: "distribution_actions", value: "point_of_access",       title: "Posted the Accessibility Statement where the product is accessed."},
  {field: "distribution_actions", value: "requesting_department", title: "Provided copies of this document to Requesting Department/Area."},
  {field: "distribution_actions", value: "disability_services",   title: "Provided copies of this document to Disability Services Office."},
  {field: "distribution_actions", value: "human_resources",       title: "Provided copies of this document to Human Resources (ADA Coordinators)."},
  {field: "distribution_actions", value: "it_help_desk",          title: "Provided copies of this document to IT Help Desk."},
  {field: "distribution_actions", value: "acr_repository",        title: "Saved the document in the ATI Systemwide ACR Repository."},
  {field: "distribution_actions", value: "other",                 title: "Other"},
  // institutional_risk
  {field: "institutional_risk", value: "high",     title: "HIGH: No alternative access provided (Supports 0 criteria)"},
  {field: "institutional_risk", value: "moderate", title: "MODERATE: Non-Equal Alternative Access (Supports 1-5 criteria)"},
  {field: "institutional_risk", value: "low",      title: "LOW: Equally Effective Alternative Access (Supports all 6 criteria)"},
  // accommodation_requirement
  {field: "accommodation_requirement", value: "high",     title: "HIGH: Accommodations required for all users (Supports 0 criteria)"},
  {field: "accommodation_requirement", value: "moderate", title: "MODERATE: Accommodations required for some users (Supports 1-5 criteria)"},
  {field: "accommodation_requirement", value: "low",      title: "LOW: Accommodations required for minimal number of users (Supports all 6 criteria)"},
  // taap_status
  {field: "taap_status", value: "draft",              title: "Draft: written, not yet routed for signature."},
  {field: "taap_status", value: "awaiting_signature", title: "Awaiting Signature: routed, at least one required signature pending."},
  {field: "taap_status", value: "signed",             title: "Signed: every required signature has landed; the plan is in force."},
  {field: "taap_status", value: "under_review",       title: "Under Review: the annual review is open and the vendor's progress is being checked."},
  {field: "taap_status", value: "renewed",            title: "Renewed: a newer plan supersedes this one."},
  {field: "taap_status", value: "expired",            title: "Expired: review_due has passed with no renewal and no retirement."},
  {field: "taap_status", value: "retired",            title: "Retired: the vendor resolved the barriers; no plan is needed."}
] AS row
MERGE (d:UniversalDescriptor {descriptor_handle: "field_value:" + row.field + "." + row.value})
ON CREATE SET d.unique_id = replace(randomUUID(), "-", ""),
              d.descriptor_kind = "field_value",
              d.include_in_report = false
SET d.target_label = "TAAP",
    d.target_field = row.field,
    d.target_value = row.value,
    d.title = row.title,
    d.description_short = row.title,
    d.description_full = row.title,
    d.last_updated = date()
WITH d
SET d.search_text = toLower(reduce(s = "", p IN [x IN [d.title, d.description_short, d.description_full, d.target_label, d.target_field, d.target_value] WHERE x IS NOT NULL AND trim(x) <> ""] | s + CASE WHEN s = "" THEN "" ELSE " " END + trim(p)));

// ==== relationship-type descriptors for the new edges ===================
UNWIND [
  {rel: "taap_at_campus", title: "TAAP At Campus",
   short: "Anchors a TAAP to the campus whose purchase it covers.",
   full: "Required on every TAAP, wired by create_taap. The covered asset may be campus-scoped too, but the plan's campus is its own fact: a systemwide asset can carry a campus plan."},
  {rel: "taap_in_year", title: "TAAP In Year",
   short: "The academic year a TAAP was created in.",
   full: "Derived from creation_date at the July boundary unless given. This is the edge indicator 8.10-pro ('Total number of EEAAPs completed') counts per campus per year."},
  {rel: "prepared_by", title: "Prepared By",
   short: "The ATI reviewer who wrote the plan.",
   full: "The form has no field for its author; the preparer is named in the notes or known from the folder. Distinct from owned_by (the accountable department head) and signed_by (the approvers)."},
  {rel: "requested_by", title: "Requested By",
   short: "The unit whose purchase the plan covers.",
   full: "Required on every TAAP and part of its identity. Created as a Department under the campus when the form names a unit the graph does not hold."},
  {rel: "alternative_provided_by", title: "Alternative Provided By",
   short: "The unit the proposed alternative names as delivering it.",
   full: "Often the requesting unit, sometimes another (a Career Center supporting a department's product). Optional; set when the proposed alternative names the unit."},
  {rel: "references", title: "References",
   short: "A document or page the plan was written from: ACR, vendor demo, testing results, or vendor roadmap.",
   full: "Carries kind (taap_reference_kinds) and an optional note. Distinct from is_documented_by, which is year-scoped evidence documentation."},
  {rel: "signed_copy", title: "Signed Copy",
   short: "The Document holding the signed form, with its full text in raw_text.",
   full: "At most one per plan. The Document carries the PDF through the file store and the form's text through raw_text, so the plan is readable without opening the file."},
  {rel: "supersedes", title: "Supersedes",
   short: "This plan is the annual renewal of the one it points at.",
   full: "Setting it moves the previous plan to taap_status renewed and inactive. Following the chain answers how long a product has been under a plan."}
] AS row
MERGE (d:UniversalDescriptor {descriptor_handle: "rel_type:" + row.rel})
ON CREATE SET d.unique_id = replace(randomUUID(), "-", ""),
              d.descriptor_kind = "rel_type",
              d.include_in_report = false
SET d.target_field = row.rel,
    d.title = row.title,
    d.description_short = row.short,
    d.description_full = row.full,
    d.last_updated = date()
WITH d
SET d.search_text = toLower(reduce(s = "", p IN [x IN [d.title, d.description_short, d.description_full, d.target_label, d.target_field, d.target_value] WHERE x IS NOT NULL AND trim(x) <> ""] | s + CASE WHEN s = "" THEN "" ELSE " " END + trim(p)));
