// Anatomy LT_SSU_June2026.docx
// TAAP anatomy-lt-ssu--department-of-biology--2026 at ssu, academic year 2025-2026. Generated 2026-10-07 by
// app/database/tools/taap_import from the signed form; decisions in
// app/database/tools/taap_import/decisions/. Re-running is a no-op except that
// the TAAP's own properties are re-set from the form.
// Requesting unit 'Department of Biology' is inferred from the signers and prose, not stated on the form.

// ---- vendor
MERGE (v:Vendor {name: "ADInstruments"})
ON CREATE SET v.unique_id = replace(randomUUID(), "-", ""), v.sales_contact_name = "Jessica Nguyen", v.sales_contact_email = "j.nguyen@adinstruments.com";

// ---- asset (create_asset twin: composite identifier, campus anchor, vendor)
MATCH (c:Campus {abbreviation: "ssu"})
MERGE (a:Asset {asset_identifier: "anatomy-lt-ssu"})
ON CREATE SET a.unique_id = replace(randomUUID(), "-", ""), a.title = "Anatomy LT", a.scope = "campus",
              a.asset_class = "third_party_service", a.version = null
MERGE (a)-[:asset_at_campus]->(c)
WITH a
MATCH (v:Vendor {name: "ADInstruments"})
MERGE (a)-[:supplied_by]->(v);

// ---- requesting unit (create_org_unit twin: Department under the campus)
MATCH (c:Campus {abbreviation: "ssu"})
MERGE (u:OrgUnit {name: "Department of Biology"})
ON CREATE SET u:Department, u.unique_id = replace(randomUUID(), "-", "")
MERGE (u)-[:operates_under_campus]->(c);

// ---- signers (add_person twin: active, not a committee member; campus only when new)
MATCH (c:Campus {abbreviation: "ssu"})
MERGE (p:Person {name: "Sean Place"})
ON CREATE SET p.unique_id = replace(randomUUID(), "-", ""), p.active = true, p.can_approve_yse = false,
              p.non_committee_member_active = true
WITH p, c WHERE NOT (p)-[:works_at_campus]->()
MERGE (p)-[:works_at_campus]->(c);
MATCH (c:Campus {abbreviation: "ssu"})
MERGE (p:Person {name: "Elisabeth Wade"})
ON CREATE SET p.unique_id = replace(randomUUID(), "-", ""), p.active = true, p.can_approve_yse = false,
              p.non_committee_member_active = true
WITH p, c WHERE NOT (p)-[:works_at_campus]->()
MERGE (p)-[:works_at_campus]->(c);

// ---- signed copy (Document keyed by the PDF's SHA-256; verbatim text in raw_text)
MERGE (doc:Document {hash: "ebb28e3192a724a348fd689b30e1d1d474183a66265bbc489f3b7af5ba56f02a"})
ON CREATE SET doc.unique_id = replace(randomUUID(), "-", ""), doc.name = "Anatomy LT_SSU_June2026 (signed).pdf",
              doc.file_path = "C:\\Users\\913678186\\Box\\SFBRN ATI\\Procurement\\TAAP\\Completed TAAPs\\Anatomy LT_SSU_June2026 (signed).pdf",
              doc.description = "Signed Temporary Alternate Access Plan (CSU template 3.2 051225).",
              doc.raw_text = "       \n \n    Sonoma State University \n \nhttps://ati.calstate.edu/ati-priority-areas/procurement/temporary-alternate-access-planning \nhttps://access.sfsu.edu/ati/procurement/eeaap \nVersion 3.2 051225 \n \nContent is licensed under a Creative Commons Attribution 4.0 International license.       \n \nTemporary Alternative Access Plan (TAAP) \nFormerly, Equally Effective Alternative Access Plan (EEAAP). \nICT Product Information \nProduct Name: Anatomy LT \n  \nVersion: Click or tap here to enter text. \n \nVendor Contact: Jessica Nguyen (j.nguyen@adinstruments.com)Click or tap here to enter \ntext. \nTemporary Alternate Access Plan Creation Date: June 8th 2026 \nReferenced Documentation \nUpload the referenced documents to the ATI Systemwide ACR Repository (SharePoint Login \nCredentials Required). Create a product folder for the ICT if one does not already exist. Once \nuploaded, generate links and place them below: \n \n• \nProduct Accessibility Conformance Report (ACR) \nlink, if applicable \n• \nVendor Accessibility Demonstration Results \nlink, if applicable \n• \nManual or Automated Testing Results: \nlink, if applicable \n• \nVendor Accessibility Roadmap: \nlink, if applicable \nKnown Accessibility Barriers \nDescribe the known accessibility barriers that affect core functionality.  \nThe product has several issues that impact visually impaired users such as insufficient color \ncontrast requirements, missing alt-text for questions, keyboard traps, color as the only \ndifferentiator, the names of controls are not made available to assistive tech, text resizing does \nnot work, and status messages are not made available to assistive tech. As well as barriers for \nusers with hearing impairments such as a lack of captioning for audio tracks. Lastly, timing is \nnot adjustable for some messages, the content announced while using screen readers is \ndifferent than that shown visually,  \nAffected User Groups \nChoose all that apply. \n \n☒ Blindness \n\n \n \nhttps://ati.calstate.edu/ati-priority-areas/procurement/temporary-alternate-access-planning \nhttps://access.sfsu.edu/ati/procurement/eeaap \nVersion 3.2 051225 \n \nContent is licensed under a Creative Commons Attribution 4.0 International license.       \n \n☒ Low Vision \n☒ Deafness \n☒ Hard of Hearing \n☒ Limited Manual Dexterity \n☒ Cognitive Disability \n☐ Speech Disabilities \n☐ Photosensitivity \n☒ Limited Reach and Strength \n \nProposed Alternative \nPlease provide details on the proposed alternative solution. \n \nDescribe how the proposed alternative will address the barrier(s), describe the resources \nrequired or personnel, and name the responsible department.  \nAs this product is only used in lab settings where students are paired with partners, the \nprofessor will designate one student as the active partaker in the physical lab activities and \nanother as the note taker. Any students who have disabilities that will impair their ability to use \nthis product will already be paired with a student who will assist them should they encounter \nany difficulties in using this product alongside any additional in class supports they may already \nhave. The professor and/or teachers assistants will be available to assist as well.  \n \nProduct Specific Accessibility Statement \nDraft a concise accessibility statement tailored specifically to this product (not your general \ncampus-wide accessibility statement) that includes: \n \n☐ Known barriers in the product interface. \n☒ Impacted disability groups. \n☐ Link or reference to this document. \n☒ Add a disclaimer: best effort was made, but unknown barriers may remain. \n☒ Provide contact for further accessibility assistance. \n \n\n \n \nhttps://ati.calstate.edu/ati-priority-areas/procurement/temporary-alternate-access-planning \nhttps://access.sfsu.edu/ati/procurement/eeaap \nVersion 3.2 051225 \n \nContent is licensed under a Creative Commons Attribution 4.0 International license.       \n \n(Post this statement wherever the product is available and in use.) \nThe LT Anatomy product has been reviewed by the SFBRN ATI team and found to pose a barrier \nto users in the following disability groups: Blind, Low Vision, Deaf, Hard of Hearing, Limited \nManual Dexterity, Cognitive Disabilities, Limited Reach and Strength. It is possible that users \noutside of these disability groups may face barriers in using this product. Should a user wish to \nseek further assistance or report barriers to accessibility within the product, they should contact \nthe Department of Biology (biology@sonoma.edu; (707) 664 – 2189).  \n \nCommunication and Distribution \nThe document must be easily referenced. Indicate which of the following actions have been \ntaken: \n \n☒ Posted the Accessibility Statement in course syllabi (if applicable). \n \n☒ Posted the Accessibility Statement where the product is accessed. \n \n☒ Provided copies of this document to Requesting Department/Area. \n☐ Provided copies of this document to Disability Services Office. \n☐ Provided copies of this document to Human Resources (ADA Coordinators). \n☐ Provided copies of this document to IT Help Desk. \n☒ Saved the document in the ATI Systemwide ACR Repository (SharePoint Login \nCredentials Required) \n☐ Other: [Specify] \n \n \nReview the proposed solution to determine if it meets the following legal requirements to be \nequally effective. A non-equal alternative or individualized accommodation will be required if it \ndoes not. \n \nRequirements Checklist \nTo qualify as an Equally Effective Alternative, the plan must meet ALL the following: \n• ☒ Allows access to the same information, engagement, and services. \n• ☒ Offers the same availability as the primary solution.  \n• ☐ Can be accessed independently without additional assistance. \n\n \n \nhttps://ati.calstate.edu/ati-priority-areas/procurement/temporary-alternate-access-planning \nhttps://access.sfsu.edu/ati/procurement/eeaap \nVersion 3.2 051225 \n \nContent is licensed under a Creative Commons Attribution 4.0 International license.       \n \n• ☒ Does not result in disparate burden or impact on the user. \n• ☒ Has substantially equivalent ease of use. \n• ☒ Protects the privacy of the individuals affected. \n• ☒ Saved the document in the ATI Systemwide ACR Repository (SharePoint Login \nCredentials Required) \n• ☐ Other: [Specify] \nProcess Outcome \nBased on the assessment above, the outcome of the Temporary Alternate Access Plan is: \n \n• ☐Meets all six legal requirements: Equally Effective. The proposed solution fully \nmeets all legal requirements for equally effective access, presenting minimal risk to the \ninstitution. In general, no individual accommodations are expected to be necessary. Non-\nconforming minimal impact on access. \n \n• ☒ Meets some (1-5) legal requirements: Partially Equally Effective. While the solution \npartially addresses accessibility, it may still require supplemental assistance for users. \nThis carries a moderate risk to the institution, and staff should be prepared to provide \nadditional support for affected individuals. \n \n• ☐ Unable to provide alternative means of access: Need for Individualized \nAccommodation. If no effective alternative solution is available, individualized \naccommodations must be provided for each affected user. This requires alerting the \ndisability services and human resources offices. The department responsible for \nobtaining the product may face additional costs to cover individualized \naccommodations, and this scenario presents a high risk to the institution.  \nInstitutional Risk \n• ☐ HIGH: No alternative access provided (Supports 0 criteria) \n• ☒ MODERATE: Non-Equal Alternative Access (Supports 1-5 criteria) \n• ☐ LOW: Equally Effective Alternative Access (Supports all 6 criteria) \nAccommodation Requirements \n• ☐ HIGH: Accommodations required for all users (Supports 0 criteria) \n \n• ☒ MODERATE:  Accommodations required for some users (Supports 1-5 criteria) \n\n \n \nhttps://ati.calstate.edu/ati-priority-areas/procurement/temporary-alternate-access-planning \nhttps://access.sfsu.edu/ati/procurement/eeaap \nVersion 3.2 051225 \n \nContent is licensed under a Creative Commons Attribution 4.0 International license.       \n \n• ☐ LOW: Accommodations required for minimal number of users (Supports all 6 \ncriteria) \nAdministrative Approval \nBy signing below, each approver confirms that they have reviewed the proposed temporary \nalternative means of access, evaluated the associated institutional risks and accommodation \nrequirements, and determined that this plan serves as an acceptable interim solution for \nmeeting applicable compliance and legal obligations. \n \nRole \nName \nSignature \nDate \nDepartment Chair/Manager \nSean P. Place \n \n \nDean/Division Vice President \nDr. Elisabeth Wade \n \n \n \nNext Review \nThe document should be reviewed and updated annually or when renewing the ICT, as TAAPs \nare temporary solutions until the vendor resolves accessibility issues. \nReview of this document should occur on or before [ June 11th, 2027] \nIn the event of Vendor Non-Compliance \nTAAPs are intended to be temporary and are only valid when regularly reviewed to confirm that \nthe vendor is actively working to remediate their ICT accessibility barriers.  \n \nIf this document is under review and there is no measurable progress from the vendor, its \ncontinued validity may be questioned. Should there be no improvement at the time of the annual \nreview, a formal memo must be prepared for the requesting department and signed by the \ninstitution’s highest executive leadership. \n \nThis memo should state that the vendor has failed to meet its commitment to address the \nknown accessibility barriers in its product. It should also explain why an alternative solution is \nnot being pursued at this time.  \n \nA copy of this memo may be shared with the vendor.  \n \nThis process should be repeated annually for as long as the institution continues to accept the \nassociated high risk. \n06/11/2026\n06/11/2026\n\n \n \nhttps://ati.calstate.edu/ati-priority-areas/procurement/temporary-alternate-access-planning \nhttps://access.sfsu.edu/ati/procurement/eeaap \nVersion 3.2 051225 \n \nContent is licensed under a Creative Commons Attribution 4.0 International license.       \n \nMiscellaneous Notes \nSara M. met with Stephanie Thibault, Derek J. Girman, and Aiyana Singh to discuss the products \nuse, possible accommodations and other important details regarding the creation of the TAAP \non Jun 11th, 2026 @2pm via Zoom. Due to the incoming change in the Biology Department \nChairs, it was decided by Amanda McGowan that the current Chair Sean P. Place should sign \nthe TAAP now, then when Derek J. Girman takes the position of Chair come August, the \nagreement will be re-signed by Derek J. Girman to maintain the agreements efficacy and \nvalidity.  \nNotice to all Parties \nThe Temporary Alternate Access Plan should only serve as an interim measure while the \nvendors address the underlying barriers to full accessibility. As of April 24, 2026, Title II of the \nADA requires all ICT (Information and Communication Technology) to be fully accessible. In \nmost circumstances, Title II §35.205 also applies. \nWhile we may not yet meet every technical standard, we will use TAAPs to comply with §35.205, \nwhich deems that a public entity not in full compliance with §35.200(b) is still considered \ncompliant if the noncompliance has minimal impact on access and does not prevent individuals \nwith disabilities from: \n• \nAccessing the same information as individuals without disabilities; \n• \nEngaging in the same interactions as individuals without disabilities; \n• \nConducting the same transactions as individuals without disabilities; and \n• \nOtherwise participating in or benefiting from the same services, programs, and activities \nas individuals without disabilities. \nOur goal is 100% compliance, and we will rely on TAAPs only until these barriers are fully \nresolved. \nLegal Framework \n• \nSection 504 of the Rehabilitation Act of 1973 and Section 508 of the Rehabilitation Act \nof 1973 \n• \nAmericans with Disabilities Act Title II Regulations \n• \nCalifornia Government Code 11135 and California Government Code 7405\n\n \n \nhttps://ati.calstate.edu/ati-priority-areas/procurement/temporary-alternate-access-planning \nhttps://access.sfsu.edu/ati/procurement/eeaap \nVersion 3.2 051225 \n \nContent is licensed under a Creative Commons Attribution 4.0 International license.       \n \n \n", doc.raw_text_captured = date("2026-10-07"),
              doc.include_in_report = false, doc.depreciated = false;

// ---- the plan (create_taap twin: identifier, required edges, form fields)
MATCH (a:Asset {asset_identifier: "anatomy-lt-ssu"})
MATCH (c:Campus {abbreviation: "ssu"})
MATCH (u:OrgUnit {name: "Department of Biology"})
MERGE (t:TAAP {taap_identifier: "anatomy-lt-ssu--department-of-biology--2026"})
ON CREATE SET t.unique_id = replace(randomUUID(), "-", "")
SET t.title = "Anatomy LT",
    t.template_version = "3.2 051225",
    t.creation_date = date("2026-06-08"),
    t.vendor_contact = "Jessica Nguyen (j.nguyen@adinstruments.com)",
    t.known_barriers = "The product has several issues that impact visually impaired users such as insufficient color contrast requirements, missing alt-text for questions, keyboard traps, color as the only differentiator, the names of controls are not made available to assistive tech, text resizing does not work, and status messages are not made available to assistive tech. As well as barriers for users with hearing impairments such as a lack of captioning for audio tracks. Lastly, timing is not adjustable for some messages, the content announced while using screen readers is different than that shown visually,",
    t.affected_user_groups = ["blindness", "low_vision", "deafness", "hard_of_hearing", "limited_manual_dexterity", "cognitive_disability", "limited_reach_and_strength"],
    t.proposed_alternative = "As this product is only used in lab settings where students are paired with partners, the professor will designate one student as the active partaker in the physical lab activities and another as the note taker. Any students who have disabilities that will impair their ability to use this product will already be paired with a student who will assist them should they encounter any difficulties in using this product alongside any additional in class supports they may already have. The professor and/or teachers assistants will be available to assist as well.",
    t.accessibility_statement = "The LT Anatomy product has been reviewed by the SFBRN ATI team and found to pose a barrier to users in the following disability groups: Blind, Low Vision, Deaf, Hard of Hearing, Limited Manual Dexterity, Cognitive Disabilities, Limited Reach and Strength. It is possible that users outside of these disability groups may face barriers in using this product. Should a user wish to seek further assistance or report barriers to accessibility within the product, they should contact the Department of Biology (biology@sonoma.edu; (707) 664 – 2189).",
    t.statement_elements = ["impacted_groups", "disclaimer", "assistance_contact"],
    t.distribution_actions = ["syllabi", "point_of_access", "requesting_department", "acr_repository"],
    t.requirements_met = ["same_information", "same_availability", "no_disparate_burden", "equivalent_ease_of_use", "privacy_protected"],
    t.outcome = "non_equal_alternative",
    t.institutional_risk = "moderate",
    t.accommodation_requirement = "moderate",
    t.effective_date = null,
    t.review_due = date("2027-06-11"),
    t.misc_notes = "Sara M. met with Stephanie Thibault, Derek J. Girman, and Aiyana Singh to discuss the products use, possible accommodations and other important details regarding the creation of the TAAP on Jun 11th, 2026 @2pm via Zoom. Due to the incoming change in the Biology Department Chairs, it was decided by Amanda McGowan that the current Chair Sean P. Place should sign the TAAP now, then when Derek J. Girman takes the position of Chair come August, the agreement will be re-signed by Derek J. Girman to maintain the agreements efficacy and validity.",
    t.taap_status = "signed",
    t.active = true
MERGE (t)-[:covers_asset]->(a)
MERGE (t)-[:taap_at_campus]->(c)
MERGE (t)-[:requested_by]->(u);

MATCH (t:TAAP {taap_identifier: "anatomy-lt-ssu--department-of-biology--2026"}), (ay:AcademicYear {name: "2025-2026"})
MERGE (t)-[:taap_in_year]->(ay);
MATCH (t:TAAP {taap_identifier: "anatomy-lt-ssu--department-of-biology--2026"}), (p:Person {name: "Sara Marquez"})
MERGE (t)-[:prepared_by]->(p);
MATCH (t:TAAP {taap_identifier: "anatomy-lt-ssu--department-of-biology--2026"}), (p:Person {name: "Sean Place"})
MERGE (t)-[:owned_by]->(p);
MATCH (t:TAAP {taap_identifier: "anatomy-lt-ssu--department-of-biology--2026"}), (p:Person {name: "Sean Place"})
MERGE (t)-[r:signed_by]->(p)
SET r.role = "department_head", r.signed_date = null;
MATCH (t:TAAP {taap_identifier: "anatomy-lt-ssu--department-of-biology--2026"}), (p:Person {name: "Elisabeth Wade"})
MERGE (t)-[r:signed_by]->(p)
SET r.role = "division_executive", r.signed_date = null;
MATCH (t:TAAP {taap_identifier: "anatomy-lt-ssu--department-of-biology--2026"}), (doc:Document {hash: "ebb28e3192a724a348fd689b30e1d1d474183a66265bbc489f3b7af5ba56f02a"})
MERGE (t)-[:signed_copy]->(doc);

// ---- evidence (connect_taap_to_yse twin; internal control)
MATCH (t:TAAP {taap_identifier: "anatomy-lt-ssu--department-of-biology--2026"}), (y:YearSuccessEvidence {year_identifier: "2025-2026-8.10-pro-ssu"})
MERGE (t)-[r:is_evidence_for]->(y)
SET r.strength = 3, r.control = "internal";
MATCH (t:TAAP {taap_identifier: "anatomy-lt-ssu--department-of-biology--2026"}), (y:YearSuccessEvidence {year_identifier: "2025-2026-4.6-pro-ssu"})
MERGE (t)-[r:is_evidence_for]->(y)
SET r.strength = 2, r.control = "internal";
MATCH (t:TAAP {taap_identifier: "anatomy-lt-ssu--department-of-biology--2026"}), (y:YearSuccessEvidence {year_identifier: "2025-2026-6.9-ins-ssu"})
MERGE (t)-[r:is_evidence_for]->(y)
SET r.strength = 2, r.control = "internal";
MATCH (t:TAAP {taap_identifier: "anatomy-lt-ssu--department-of-biology--2026"}), (y:YearSuccessEvidence {year_identifier: "2025-2026-1.19-web-ssu"})
MERGE (t)-[r:is_evidence_for]->(y)
SET r.strength = 1, r.control = "internal";

