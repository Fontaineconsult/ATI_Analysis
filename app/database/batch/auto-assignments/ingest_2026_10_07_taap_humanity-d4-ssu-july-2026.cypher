// Humanity D4_SSU_July 2026.docx
// TAAP humanity-ssu--humanity-d4-requesting-department--2026 at ssu, academic year 2026-2027. Generated 2026-10-07 by
// app/database/tools/taap_import from the signed form; decisions in
// app/database/tools/taap_import/decisions/. Re-running is a no-op except that
// the TAAP's own properties are re-set from the form.
// Requesting unit 'Humanity D4 Requesting Department' is inferred from the signers and prose, not stated on the form.

// ---- vendor
MERGE (v:Vendor {name: "TCP Software"})
ON CREATE SET v.unique_id = replace(randomUUID(), "-", ""), v.sales_contact_email = "CBeebe@tcpsoftware.com";

// ---- asset (create_asset twin: composite identifier, campus anchor, vendor)
MATCH (c:Campus {abbreviation: "ssu"})
MERGE (a:Asset {asset_identifier: "humanity-ssu"})
ON CREATE SET a.unique_id = replace(randomUUID(), "-", ""), a.title = "Humanity", a.scope = "campus",
              a.asset_class = "third_party_service", a.version = null
MERGE (a)-[:asset_at_campus]->(c)
WITH a
MATCH (v:Vendor {name: "TCP Software"})
MERGE (a)-[:supplied_by]->(v);

// ---- requesting unit (create_org_unit twin: Department under the campus)
MATCH (c:Campus {abbreviation: "ssu"})
MERGE (u:OrgUnit {name: "Humanity D4 Requesting Department"})
ON CREATE SET u:Department, u.unique_id = replace(randomUUID(), "-", "")
MERGE (u)-[:operates_under_campus]->(c);

// ---- signers (add_person twin: active, not a committee member; campus only when new)
MATCH (c:Campus {abbreviation: "ssu"})
MERGE (p:Person {name: "Jessica Way"})
ON CREATE SET p.unique_id = replace(randomUUID(), "-", ""), p.active = true, p.can_approve_yse = false,
              p.non_committee_member_active = true
WITH p, c WHERE NOT (p)-[:works_at_campus]->()
MERGE (p)-[:works_at_campus]->(c);
MATCH (c:Campus {abbreviation: "ssu"})
MERGE (p:Person {name: "Jeff Wilson"})
ON CREATE SET p.unique_id = replace(randomUUID(), "-", ""), p.active = true, p.can_approve_yse = false,
              p.non_committee_member_active = true
WITH p, c WHERE NOT (p)-[:works_at_campus]->()
MERGE (p)-[:works_at_campus]->(c);

// ---- signed copy (Document keyed by the PDF's SHA-256; verbatim text in raw_text)
MERGE (doc:Document {hash: "ff7b74e2b1fa62a29051014818a133ea029aee3967f4b34dfb98f0e79287a0d8"})
ON CREATE SET doc.unique_id = replace(randomUUID(), "-", ""), doc.name = "Humanity D4_SSU_July 2026 (signed).pdf",
              doc.file_path = "C:\\Users\\913678186\\Box\\SFBRN ATI\\Procurement\\TAAP\\Completed TAAPs\\Humanity D4_SSU_July 2026 (signed).pdf",
              doc.description = "Signed Temporary Alternate Access Plan (CSU template 3.2 051225).",
              doc.raw_text = "       \n \n    Sonoma State University \n \nhttps://ati.calstate.edu/ati-priority-areas/procurement/temporary-alternate-access-planning \nhttps://access.sfsu.edu/ati/procurement/eeaap \nVersion 3.2 051225 \n \nContent is licensed under a Creative Commons Attribution 4.0 International license.       \n \nTemporary Alternative Access Plan (TAAP) \nFormerly, Equally Effective Alternative Access Plan (EEAAP). \nICT Product Information \nProduct Name: Humanity \n  \nVersion: Click or tap here to enter text. \n \nVendor Contact: CBeebe@tcpsoftware.com \nTemporary Alternate Access Plan Creation Date: July 29, 2026 \nReferenced Documentation \nUpload the referenced documents to the ATI Systemwide ACR Repository (SharePoint Login \nCredentials Required). Create a product folder for the ICT if one does not already exist. Once \nuploaded, generate links and place them below: \n \n• \nProduct Accessibility Conformance Report (ACR) \nlink, if applicable \n• \nVendor Accessibility Demonstration Results \nlink, if applicable \n• \nManual or Automated Testing Results: \nlink, if applicable \n• \nVendor Accessibility Roadmap: \nlink, if applicable \nKnown Accessibility Barriers \nDescribe the known accessibility barriers that affect core functionality.  \nThe VPAT identifies significant accessibility barriers affecting core product functionality. Users \nwho rely on keyboard navigation cannot consistently complete essential tasks due to \ninaccessible controls, non-functional keyboard interactions, keyboard traps within calendar and \nselection components, and inefficient navigation of scheduling interfaces. Screen reader users \nencounter incorrect or missing accessible names, roles, states, labels, headings, table markup, \nand dialog titles, resulting in inaccurate announcements, improper reading order, inaccessible \nforms, and ambiguous controls. Focus management is inconsistent, with focus unexpectedly \nshifting or failing to remain within dialogs, disrupting task completion. Interactive controls \nfrequently rely on hover-only content, lack visible or accessible labels, or require color alone to \ncommunicate important information such as scheduling conflicts. The application does not \nadequately support content reflow at increased zoom levels, requiring horizontal scrolling and \nobscuring critical interface elements. Interactive components also fail minimum non-text \ncontrast requirements, reducing usability for users with low vision. Additionally, status \nmessages, confirmations, and the results of user actions are not consistently announced to \n\n \n \nhttps://ati.calstate.edu/ati-priority-areas/procurement/temporary-alternate-access-planning \nhttps://access.sfsu.edu/ati/procurement/eeaap \nVersion 3.2 051225 \n \nContent is licensed under a Creative Commons Attribution 4.0 International license.       \n \nassistive technologies, preventing users from reliably determining whether actions such as \nuploads, exports, or other operations have completed successfully. \nAffected User Groups \nChoose all that apply. \n \n☒ Blindness \n☒ Low Vision \n☐ Deafness \n☐ Hard of Hearing \n☒ Limited Manual Dexterity \n☒ Cognitive Disability \n☐ Speech Disabilities \n☐ Photosensitivity \n☒ Limited Reach and Strength \n \nProposed Alternative \nPlease provide details on the proposed alternative solution. \n \nDescribe how the proposed alternative will address the barrier(s), describe the resources \nrequired or personnel, and name the responsible department.  \nStaff and other users may perform scheduling-related tasks through direct communication with \ntheir supervisor or designated manager using email, text message, telephone, or other \naccessible communication methods. Users are not required to disclose the nature of their \ndisability to utilize this accommodation, and all requests will be handled confidentially. \n \nProduct Specific Accessibility Statement \nDraft a concise accessibility statement tailored specifically to this product (not your general \ncampus-wide accessibility statement) that includes: \n \n☒ Known barriers in the product interface. \n\n \n \nhttps://ati.calstate.edu/ati-priority-areas/procurement/temporary-alternate-access-planning \nhttps://access.sfsu.edu/ati/procurement/eeaap \nVersion 3.2 051225 \n \nContent is licensed under a Creative Commons Attribution 4.0 International license.       \n \n☒ Impacted disability groups. \n☐ Link or reference to this document. \n☒ Add a disclaimer: best effort was made, but unknown barriers may remain. \n☒ Provide contact for further accessibility assistance. \n \n(Post this statement wherever the product is available and in use.) \nThis product has been reviewed by the San Francisco Bay Regional Network’s Accessible \nTechnology Initiative (ATI) team. It was found to pose a barrier to users without vision, with \nlimited or impaired vision, with limited manual dexterity, with limited reach and strength, and \nwith cognitive disabilities. Barriers impact scheduling abilities, import/export abilities, and more. \nIt is possible other barriers may lie within this product. If you need assistance in scheduling, \nplease reach out to your direct supervisor (Insert number here). You are not required to disclose \nyour disability to obtain help in scheduling.  \n \nCommunication and Distribution \nThe document must be easily referenced. Indicate which of the following actions have been \ntaken: \n \n☐ Posted the Accessibility Statement in course syllabi (if applicable). \n \n☒ Posted the Accessibility Statement where the product is accessed. \n \n☒ Provided copies of this document to Requesting Department/Area. \n☐ Provided copies of this document to Disability Services Office. \n☐ Provided copies of this document to Human Resources (ADA Coordinators). \n☐ Provided copies of this document to IT Help Desk. \n☒ Saved the document in the ATI Systemwide ACR Repository (SharePoint Login \nCredentials Required) \n☐ Other: [Specify] \n \n \nReview the proposed solution to determine if it meets the following legal requirements to be \nequally effective. A non-equal alternative or individualized accommodation will be required if it \ndoes not. \n \n\n \n \nhttps://ati.calstate.edu/ati-priority-areas/procurement/temporary-alternate-access-planning \nhttps://access.sfsu.edu/ati/procurement/eeaap \nVersion 3.2 051225 \n \nContent is licensed under a Creative Commons Attribution 4.0 International license.       \n \nRequirements Checklist \nTo qualify as an Equally Effective Alternative, the plan must meet ALL the following: \n• ☒ Allows access to the same information, engagement, and services. \n• ☐ Offers the same availability as the primary solution.  \n• ☐ Can be accessed independently without additional assistance. \n• ☒ Does not result in disparate burden or impact on the user. \n• ☒ Has substantially equivalent ease of use. \n• ☒ Protects the privacy of the individuals affected. \n• ☒ Saved the document in the ATI Systemwide ACR Repository (SharePoint Login \nCredentials Required) \n• ☐ Other: [Specify] \nProcess Outcome \nBased on the assessment above, the outcome of the Temporary Alternate Access Plan is: \n \n• ☐Meets all six legal requirements: Equally Effective. The proposed solution fully \nmeets all legal requirements for equally effective access, presenting minimal risk to the \ninstitution. In general, no individual accommodations are expected to be necessary. \nNon-conforming minimal impact on access. \n \n• ☒ Meets some (1-5) legal requirements: Partially Equally Effective. While the solution \npartially addresses accessibility, it may still require supplemental assistance for users. \nThis carries a moderate risk to the institution, and staff should be prepared to provide \nadditional support for affected individuals. \n \n• ☐ Unable to provide alternative means of access: Need for Individualized \nAccommodation. If no effective alternative solution is available, individualized \naccommodations must be provided for each affected user. This requires alerting the \ndisability services and human resources offices. The department responsible for \nobtaining the product may face additional costs to cover individualized \naccommodations, and this scenario presents a high risk to the institution.  \nInstitutional Risk \n• ☐ HIGH: No alternative access provided (Supports 0 criteria) \n• ☒ MODERATE: Non-Equal Alternative Access (Supports 1-5 criteria) \n\n \n \nhttps://ati.calstate.edu/ati-priority-areas/procurement/temporary-alternate-access-planning \nhttps://access.sfsu.edu/ati/procurement/eeaap \nVersion 3.2 051225 \n \nContent is licensed under a Creative Commons Attribution 4.0 International license.       \n \n• ☐ LOW: Equally Effective Alternative Access (Supports all 6 criteria) \nAccommodation Requirements \n• ☐ HIGH: Accommodations required for all users (Supports 0 criteria) \n \n• ☒ MODERATE:  Accommodations required for some users (Supports 1-5 criteria) \n• ☐ LOW: Accommodations required for minimal number of users (Supports all 6 \ncriteria) \nAdministrative Approval \nBy signing below, each approver confirms that they have reviewed the proposed temporary \nalternative means of access, evaluated the associated institutional risks and accommodation \nrequirements, and determined that this plan serves as an acceptable interim solution for \nmeeting applicable compliance and legal obligations. \n \nRole \nName \nSignature \nDate \nDepartment Chair/Manager \nJessica Way \n \n \nDean/Division Vice President \nJeffery Wilson \n \n \n \nNext Review \nThe document should be reviewed and updated annually or when renewing the ICT, as TAAPs \nare temporary solutions until the vendor resolves accessibility issues. \nReview of this document should occur on or before [ August 20th, 2027] \nIn the event of Vendor Non-Compliance \nTAAPs are intended to be temporary and are only valid when regularly reviewed to confirm that \nthe vendor is actively working to remediate their ICT accessibility barriers.  \n \nIf this document is under review and there is no measurable progress from the vendor, its \ncontinued validity may be questioned. Should there be no improvement at the time of the annual \nreview, a formal memo must be prepared for the requesting department and signed by the \ninstitution’s highest executive leadership. \n \nThis memo should state that the vendor has failed to meet its commitment to address the \nknown accessibility barriers in its product. It should also explain why an alternative solution is \nnot being pursued at this time.  \n \nA copy of this memo may be shared with the vendor.  \n08/21/2026\nJeff Wilson (Aug 25, 2026 22:12:31 PDT)\n08/25/2026\n\n \n \nhttps://ati.calstate.edu/ati-priority-areas/procurement/temporary-alternate-access-planning \nhttps://access.sfsu.edu/ati/procurement/eeaap \nVersion 3.2 051225 \n \nContent is licensed under a Creative Commons Attribution 4.0 International license.       \n \n \nThis process should be repeated annually for as long as the institution continues to accept the \nassociated high risk. \nMiscellaneous Notes \nSara M. created this document based on previous accommodations and confirmed with the \nproduct requestor to confirm that this accommodation was still viable.  \n \n \n \n \nNotice to all Parties \nThe Temporary Alternate Access Plan should only serve as an interim measure while the \nvendors address the underlying barriers to full accessibility. As of April 24, 2026, Title II of the \nADA requires all ICT (Information and Communication Technology) to be fully accessible. In \nmost circumstances, Title II §35.205 also applies. \nWhile we may not yet meet every technical standard, we will use TAAPs to comply with §35.205, \nwhich deems that a public entity not in full compliance with §35.200(b) is still considered \ncompliant if the noncompliance has minimal impact on access and does not prevent individuals \nwith disabilities from: \n• \nAccessing the same information as individuals without disabilities; \n• \nEngaging in the same interactions as individuals without disabilities; \n• \nConducting the same transactions as individuals without disabilities; and \n• \nOtherwise participating in or benefiting from the same services, programs, and activities \nas individuals without disabilities. \nOur goal is 100% compliance, and we will rely on TAAPs only until these barriers are fully \nresolved. \nLegal Framework \n• \nSection 504 of the Rehabilitation Act of 1973 and Section 508 of the Rehabilitation Act \nof 1973 \n• \nAmericans with Disabilities Act Title II Regulations \n• \nCalifornia Government Code 11135 and California Government Code 7405\n\n \n \nhttps://ati.calstate.edu/ati-priority-areas/procurement/temporary-alternate-access-planning \nhttps://access.sfsu.edu/ati/procurement/eeaap \nVersion 3.2 051225 \n \nContent is licensed under a Creative Commons Attribution 4.0 International license.       \n \n \n", doc.raw_text_captured = date("2026-10-07"),
              doc.include_in_report = false, doc.depreciated = false;

// ---- the plan (create_taap twin: identifier, required edges, form fields)
MATCH (a:Asset {asset_identifier: "humanity-ssu"})
MATCH (c:Campus {abbreviation: "ssu"})
MATCH (u:OrgUnit {name: "Humanity D4 Requesting Department"})
MERGE (t:TAAP {taap_identifier: "humanity-ssu--humanity-d4-requesting-department--2026"})
ON CREATE SET t.unique_id = replace(randomUUID(), "-", "")
SET t.title = "Humanity",
    t.template_version = "3.2 051225",
    t.creation_date = date("2026-07-29"),
    t.vendor_contact = "CBeebe@tcpsoftware.com",
    t.known_barriers = "The VPAT identifies significant accessibility barriers affecting core product functionality. Users who rely on keyboard navigation cannot consistently complete essential tasks due to inaccessible controls, non-functional keyboard interactions, keyboard traps within calendar and selection components, and inefficient navigation of scheduling interfaces. Screen reader users encounter incorrect or missing accessible names, roles, states, labels, headings, table markup, and dialog titles, resulting in inaccurate announcements, improper reading order, inaccessible forms, and ambiguous controls. Focus management is inconsistent, with focus unexpectedly shifting or failing to remain within dialogs, disrupting task completion. Interactive controls frequently rely on hover-only content, lack visible or accessible labels, or require color alone to communicate important information such as scheduling conflicts. The application does not adequately support content reflow at increased zoom levels, requiring horizontal scrolling and obscuring critical interface elements. Interactive components also fail minimum non-text contrast requirements, reducing usability for users with low vision. Additionally, status messages, confirmations, and the results of user actions are not consistently announced to assistive technologies, preventing users from reliably determining whether actions such as uploads, exports, or other operations have completed successfully.",
    t.affected_user_groups = ["blindness", "low_vision", "limited_manual_dexterity", "cognitive_disability", "limited_reach_and_strength"],
    t.proposed_alternative = "Staff and other users may perform scheduling-related tasks through direct communication with their supervisor or designated manager using email, text message, telephone, or other accessible communication methods. Users are not required to disclose the nature of their disability to utilize this accommodation, and all requests will be handled confidentially.",
    t.accessibility_statement = "This product has been reviewed by the San Francisco Bay Regional Network’s Accessible Technology Initiative (ATI) team. It was found to pose a barrier to users without vision, with limited or impaired vision, with limited manual dexterity, with limited reach and strength, and with cognitive disabilities. Barriers impact scheduling abilities, import/export abilities, and more. It is possible other barriers may lie within this product. If you need assistance in scheduling, please reach out to your direct supervisor (Insert number here). You are not required to disclose your disability to obtain help in scheduling.",
    t.statement_elements = ["known_barriers", "impacted_groups", "disclaimer", "assistance_contact"],
    t.distribution_actions = ["point_of_access", "requesting_department", "acr_repository"],
    t.requirements_met = ["same_information", "no_disparate_burden", "equivalent_ease_of_use", "privacy_protected"],
    t.outcome = "non_equal_alternative",
    t.institutional_risk = "moderate",
    t.accommodation_requirement = "moderate",
    t.effective_date = date("2026-08-25"),
    t.review_due = date("2027-08-20"),
    t.misc_notes = "Sara M. created this document based on previous accommodations and confirmed with the product requestor to confirm that this accommodation was still viable.",
    t.taap_status = "signed",
    t.active = true
MERGE (t)-[:covers_asset]->(a)
MERGE (t)-[:taap_at_campus]->(c)
MERGE (t)-[:requested_by]->(u);

MATCH (t:TAAP {taap_identifier: "humanity-ssu--humanity-d4-requesting-department--2026"}), (ay:AcademicYear {name: "2026-2027"})
MERGE (t)-[:taap_in_year]->(ay);
MATCH (t:TAAP {taap_identifier: "humanity-ssu--humanity-d4-requesting-department--2026"}), (p:Person {name: "Sara Marquez"})
MERGE (t)-[:prepared_by]->(p);
MATCH (t:TAAP {taap_identifier: "humanity-ssu--humanity-d4-requesting-department--2026"}), (p:Person {name: "Jessica Way"})
MERGE (t)-[:owned_by]->(p);
MATCH (t:TAAP {taap_identifier: "humanity-ssu--humanity-d4-requesting-department--2026"}), (p:Person {name: "Jessica Way"})
MERGE (t)-[r:signed_by]->(p)
SET r.role = "department_head", r.signed_date = null;
MATCH (t:TAAP {taap_identifier: "humanity-ssu--humanity-d4-requesting-department--2026"}), (p:Person {name: "Jeff Wilson"})
MERGE (t)-[r:signed_by]->(p)
SET r.role = "division_executive", r.signed_date = date("2026-08-25");
MATCH (t:TAAP {taap_identifier: "humanity-ssu--humanity-d4-requesting-department--2026"}), (doc:Document {hash: "ff7b74e2b1fa62a29051014818a133ea029aee3967f4b34dfb98f0e79287a0d8"})
MERGE (t)-[:signed_copy]->(doc);

// ---- evidence (connect_taap_to_yse twin; internal control)
MATCH (t:TAAP {taap_identifier: "humanity-ssu--humanity-d4-requesting-department--2026"}), (y:YearSuccessEvidence {year_identifier: "2026-2027-8.10-pro-ssu"})
MERGE (t)-[r:is_evidence_for]->(y)
SET r.strength = 3, r.control = "internal";
MATCH (t:TAAP {taap_identifier: "humanity-ssu--humanity-d4-requesting-department--2026"}), (y:YearSuccessEvidence {year_identifier: "2026-2027-4.6-pro-ssu"})
MERGE (t)-[r:is_evidence_for]->(y)
SET r.strength = 2, r.control = "internal";
MATCH (t:TAAP {taap_identifier: "humanity-ssu--humanity-d4-requesting-department--2026"}), (y:YearSuccessEvidence {year_identifier: "2026-2027-1.19-web-ssu"})
MERGE (t)-[r:is_evidence_for]->(y)
SET r.strength = 1, r.control = "internal";

// ---- open question: the form leaves the requesting department unnamed
MERGE (qn:Query {question: "Which department requested the Humanity scheduling plan signed by Jessica Way (Humanity D4, July 2026)?"})
ON CREATE SET qn.unique_id = replace(randomUUID(), "-", ""), qn.status = "open", qn.category = "information_gap",
              qn.date_raised = date("2026-10-07"), qn.detail = "The signed form names the product, the signers (Jessica Way, Jeff Wilson) and the alternative, but not the requesting department. The plan is stored under the placeholder unit 'Humanity D4 Requesting Department'; renaming the unit re-identifies the plan, so settle this before the annual review."
WITH qn
OPTIONAL MATCH (wgp:WorkingGroupPlan {plan_identifier: "2026-2027-ssu-pro"})
FOREACH (_ IN CASE WHEN wgp IS NULL THEN [] ELSE [1] END | MERGE (qn)-[:raised_under_plan]->(wgp))
WITH qn
OPTIONAL MATCH (y:YearSuccessEvidence {year_identifier: "2026-2027-8.10-pro-ssu"})
FOREACH (_ IN CASE WHEN y IS NULL THEN [] ELSE [1] END | MERGE (qn)-[:addresses_evidence]->(y))
WITH qn
OPTIONAL MATCH (p:Person {name: "Sara Marquez"})
FOREACH (_ IN CASE WHEN p IS NULL THEN [] ELSE [1] END | MERGE (qn)-[:answerable_by]->(p))
;

