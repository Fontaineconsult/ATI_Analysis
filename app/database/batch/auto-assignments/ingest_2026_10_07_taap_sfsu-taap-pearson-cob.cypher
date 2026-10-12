// SFSU_TAAP_Pearson_COB.pdf
// TAAP pearson-revel-sfsu--lam-family-college-of-business--2025 at sfsu, academic year 2025-2026. Generated 2026-10-07 by
// app/database/tools/taap_import from the signed form; decisions in
// app/database/tools/taap_import/decisions/. Re-running is a no-op except that
// the TAAP's own properties are re-set from the form.
// Requesting unit 'Lam Family College of Business' is inferred from the signers and prose, not stated on the form.

// ---- vendor
MERGE (v:Vendor {name: "Pearson"})
ON CREATE SET v.unique_id = replace(randomUUID(), "-", "");

// ---- asset (create_asset twin: composite identifier, campus anchor, vendor)
MATCH (c:Campus {abbreviation: "sfsu"})
MERGE (a:Asset {asset_identifier: "pearson-revel-sfsu"})
ON CREATE SET a.unique_id = replace(randomUUID(), "-", ""), a.title = "Pearson Revel", a.scope = "campus",
              a.asset_class = "third_party_service", a.version = "1"
MERGE (a)-[:asset_at_campus]->(c)
WITH a
MATCH (v:Vendor {name: "Pearson"})
MERGE (a)-[:supplied_by]->(v);

// ---- requesting unit (create_org_unit twin: Department under the campus)
MATCH (c:Campus {abbreviation: "sfsu"})
MERGE (u:OrgUnit {name: "Lam Family College of Business"})
ON CREATE SET u:Department, u.unique_id = replace(randomUUID(), "-", "")
MERGE (u)-[:operates_under_campus]->(c);

// ---- signers (add_person twin: active, not a committee member; campus only when new)
MATCH (c:Campus {abbreviation: "sfsu"})
MERGE (p:Person {name: "Ryan Smith"})
ON CREATE SET p.unique_id = replace(randomUUID(), "-", ""), p.active = true, p.can_approve_yse = false,
              p.non_committee_member_active = true
WITH p, c WHERE NOT (p)-[:works_at_campus]->()
MERGE (p)-[:works_at_campus]->(c);
MATCH (c:Campus {abbreviation: "sfsu"})
MERGE (p:Person {name: "Eugene Sivadas"})
ON CREATE SET p.unique_id = replace(randomUUID(), "-", ""), p.active = true, p.can_approve_yse = false,
              p.non_committee_member_active = true
WITH p, c WHERE NOT (p)-[:works_at_campus]->()
MERGE (p)-[:works_at_campus]->(c);
MATCH (c:Campus {abbreviation: "sfsu"})
MERGE (p:Person {name: "Ingrid Williams"})
ON CREATE SET p.unique_id = replace(randomUUID(), "-", ""), p.active = true, p.can_approve_yse = false,
              p.non_committee_member_active = true
WITH p, c WHERE NOT (p)-[:works_at_campus]->()
MERGE (p)-[:works_at_campus]->(c);

// ---- signed copy (Document keyed by the PDF's SHA-256; verbatim text in raw_text)
MERGE (doc:Document {hash: "8cb2ab277c6f53751879f1eb6f99bb9717b0996626dfebe7ff944c97f3e0376b"})
ON CREATE SET doc.unique_id = replace(randomUUID(), "-", ""), doc.name = "SFSU_TAAP_Pearson_COB.pdf",
              doc.file_path = "C:\\Users\\913678186\\Box\\SFBRN ATI\\Procurement\\TAAP\\Completed TAAPs\\SFSU_TAAP_Pearson_COB.pdf",
              doc.description = "Signed Temporary Alternate Access Plan (CSU template 3.2 051225).",
              doc.raw_text = "https://ati.calstate.edu/ati-priority-areas/procurement/temporary-alternate-access-planning \nhttps://access.sfsu.edu/ati/procurement/eeaap \nVersion 3.2 051225 \nContent is licensed under a Creative Commons Attribution 4.0 International license.      \nTemporary Alternative Access Plan (TAAP) \nFormerly, Equally Effective Alternative Access Plan (EEAAP). \nICT Product Information \nProduct Name: Pearson Revel \nVersion: 1 \nVendor Contact: N/A \nTemporary Alternate Access Plan Creation Date: 9/25/2025 \nReferenced Documentation \nUpload the referenced documents to the ATI Systemwide ACR Repository (SharePoint Login \nCredentials Required). Create a product folder for the ICT if one does not already exist. Once \nuploaded, generate links and place them below: \n• \nProduct Accessibility Conformance Report (ACR) \nlink, if applicable \n• \nVendor Accessibility Demonstration Results \nlink, if applicable \n• \nManual or Automated Testing Results: \nlink, if applicable \n• \nVendor Accessibility Roadmap: \nlink, if applicable \nKnown Accessibility Barriers \nDescribe the known accessibility barriers that affect core functionality. \nStudents who rely on keyboard navigation or screen readers face significant barriers that prevent them \nfrom completing core academic tasks in Pearson Revel. A blind student using a screen reader cannot \naccurately identify images, buttons, or form fields due to missing or incorrect labels, making it \nimpossible to navigate course content or submit assignments reliably. Students with motor disabilities \nwho cannot use a mouse are unable to access drag-and-drop activities, certain scrollable content areas, \nand may become trapped in specific interface sections, effectively blocking them from completing \ninteractive exercises or moving between course modules. When students with low vision magnify their \nscreens to 200% or use mobile devices in portrait orientation, essential content and controls disappear \nor overlap, preventing them from reading materials or accessing submission buttons. Additionally, the \ninconsistent focus indicators and illogical navigation order mean that keyboard users often lose track of \ntheir position on the page, making it nearly impossible to complete timed assessments or navigate \ncomplex course materials efficiently. \nDocusign Envelope ID: A1AD12E6-AFE8-40E0-A534-86552C42A69B\n\nhttps://ati.calstate.edu/ati-priority-areas/procurement/temporary-alternate-access-planning \nhttps://access.sfsu.edu/ati/procurement/eeaap \nVersion 3.2 051225 \nContent is licensed under a Creative Commons Attribution 4.0 International license.  \nAffected User Groups \nChoose all that apply. \n☒\nBlindness\n☒\nLow Vision\n☐\nDeafness\n☐\nHard of Hearing\n☐\nLimited Manual Dexterity\n☐\nCognitive Disability\n☐\nSpeech Disabilities\n☐\nPhotosensitivity\n☐\nLimited Reach and Strength\nProposed Alternative \nPlease provide details on the proposed alternative solution. \nDescribe how the proposed alternative will address the barrier(s), describe the resources \nrequired or personnel, and name the responsible department.  \nIf a student cannot access the Pearson Revel interactive material, the instructor, Mehmet Ergul \n(mergul@sfsu.edu), must facilitate access to alternative assignments from the textbook that mirror \nthe interactive content's learning outcomes, with modifications based on individual access needs. \nFor students using screen readers, the instructor must provide materials in fully accessible \nformats (Word documents or HTML with proper heading structure). For keyboard-only users, the \ninstructor must replace all drag-and-drop or mouse-dependent activities with keyboard-accessible \nalternatives such as multiple-choice questions or text-based responses. \nThese modifications should be made in conjunction with the Disability Programs and Resource \nCenter by notifying both the student and the department as early as possible. \nProduct Specific Accessibility Statement \nDraft a concise accessibility statement tailored specifically to this product (not your general \ncampus-wide accessibility statement) that includes: \nDocusign Envelope ID: A1AD12E6-AFE8-40E0-A534-86552C42A69B\n\nhttps://ati.calstate.edu/ati-priority-areas/procurement/temporary-alternate-access-planning \nhttps://access.sfsu.edu/ati/procurement/eeaap \nVersion 3.2 051225 \nContent is licensed under a Creative Commons Attribution 4.0 International license.  \n☒\nKnown barriers in the product interface.\n☒\nImpacted disability groups.\n☐\nLink or reference to this document.\n☒\nAdd a disclaimer: best effort was made, but unknown barriers may remain.\n☒\nProvide contact for further accessibility assistance.\n(Post this statement wherever the product is available and in use.) \nPearson Revel has documented accessibility barriers for students who are blind, have low vision, \nor rely on keyboard navigation, preventing access to some interactive content and assignments. \nStudents experiencing barriers should contact Professor Ergul (mergul@sfsu.edu) for equivalent \nalternative assignments and should register with DPRC (dprc@sfsu.edu) for formal \naccommodations. Report access issues when you encountering them—do not wait until deadlines. \nCommunication and Distribution \nThe document must be easily referenced. Indicate which of the following actions have been \ntaken: \n☒\nPosted the Accessibility Statement in course syllabi (if applicable).\n☒\nPosted the Accessibility Statement where the product is accessed.\n☒\nProvided copies of this document to Requesting Department/Area.\n☒\nProvided copies of this document to Disability Services Office.\n☒\nProvided copies of this document to Human Resources (ADA Coordinators).\n☐\nProvided copies of this document to IT Help Desk.\n☒\nSaved the document in the ATI Systemwide ACR Repository (SharePoint Login\nCredentials Required)\n☐\nOther: [Specify]\nReview the proposed solution to determine if it meets the following legal requirements to be \nequally effective. A non-equal alternative or individualized accommodation will be required if it \ndoes not. \nDocusign Envelope ID: A1AD12E6-AFE8-40E0-A534-86552C42A69B\n\nhttps://ati.calstate.edu/ati-priority-areas/procurement/temporary-alternate-access-planning \nhttps://access.sfsu.edu/ati/procurement/eeaap \nVersion 3.2 051225 \nContent is licensed under a Creative Commons Attribution 4.0 International license.  \nRequirements Checklist \nTo qualify as an Equally Effective Alternative, the plan must meet ALL the following: \n• ☒ Allows access to the same information, engagement, and services.\n• ☐ Offers the same availability as the primary solution.\n• ☒ Can be accessed independently without additional assistance.\n• ☐ Does not result in disparate burden or impact on the user.\n• ☒ Has substantially equivalent ease of use.\n• ☒ Protects the privacy of the individuals affected.\n• ☐ Saved the document in the ATI Systemwide ACR Repository (SharePoint Login\nCredentials Required) \n• ☐ Other: [Specify]\nProcess Outcome \nBased on the assessment above, the outcome of the Temporary Alternate Access Plan is: \n•\n☐Meets all six legal requirements: Equally Effective. The proposed solution fully\nmeets all legal requirements for equally effective access, presenting minimal risk to the\ninstitution. In general, no individual accommodations are expected to be necessary.\nNon-conforming minimal impact on access.\n•\n☒ Meets some (1-5) legal requirements: Partially Equally Effective. While the solution\npartially addresses accessibility, it may still require supplemental assistance for users.\nThis carries a moderate risk to the institution, and staff should be prepared to provide\nadditional support for affected individuals.\n•\n☐ Unable to provide alternative means of access: Need for Individualized\nAccommodation. If no effective alternative solution is available, individualized\naccommodations must be provided for each affected user. This requires alerting the\ndisability services and human resources offices. The department responsible for\nobtaining the product may face additional costs to cover individualized\naccommodations, and this scenario presents a high risk to the institution.\nDocusign Envelope ID: A1AD12E6-AFE8-40E0-A534-86552C42A69B\n\nhttps://ati.calstate.edu/ati-priority-areas/procurement/temporary-alternate-access-planning \nhttps://access.sfsu.edu/ati/procurement/eeaap \nVersion 3.2 051225 \nContent is licensed under a Creative Commons Attribution 4.0 International license.  \nInstitutional Risk \n•\n☐ HIGH: No alternative access provided (Supports 0 criteria)\n•\n☒ MODERATE: Non-Equal Alternative Access (Supports 1-5 criteria)\n•\n☐ LOW: Equally Effective Alternative Access (Supports all 6 criteria)\nAccommodation Requirements \n•\n☐ HIGH: Accommodations required for all users (Supports 0 criteria)\n•\n☒ MODERATE:  Accommodations required for some users (Supports 1-5 criteria)\n•\n☐ LOW: Accommodations required for minimal number of users (Supports all 6\ncriteria)\nAdministrative Approval \nBy signing below, each approver confirms that they have reviewed the proposed temporary \nalternative means of access, evaluated the associated institutional risks and accommodation \nrequirements, and determined that this plan serves as an acceptable interim solution for \nmeeting applicable compliance and legal obligations. \nRole \nName \nSignature \nDate \nDepartment Chair/Manager \nRyan Smith \nDean/Division Vice President \nEugene Sivadas \nADA Compliance Officer \nIngrid Williams \nNext Review \nThe document should be reviewed and updated annually or when renewing the ICT, as TAAPs \nare temporary solutions until the vendor resolves accessibility issues. \nReview of this document should occur on or before [insert date] \nIn the event of Vendor Non-Compliance \nTAAPs are intended to be temporary and are only valid when regularly reviewed to confirm that \nthe vendor is actively working to remediate their ICT accessibility barriers.  \nIf this document is under review and there is no measurable progress from the vendor, its \ncontinued validity may be questioned. Should there be no improvement at the time of the annual \nreview, a formal memo must be prepared for the requesting department and signed by the \ninstitution’s highest executive leadership. \nDocusign Envelope ID: A1AD12E6-AFE8-40E0-A534-86552C42A69B\n10/03/2025 | 3:10 PM PDT\n10/03/2025 | 3:12 PM PDT\n10/08/2025 | 1:25 PM PDT\n\nhttps://ati.calstate.edu/ati-priority-areas/procurement/temporary-alternate-access-planning \nhttps://access.sfsu.edu/ati/procurement/eeaap \nVersion 3.2 051225 \nContent is licensed under a Creative Commons Attribution 4.0 International license.  \nThis memo should state that the vendor has failed to meet its commitment to address the \nknown accessibility barriers in its product. It should also explain why an alternative solution is \nnot being pursued at this time.  \nA copy of this memo may be shared with the vendor. \nThis process should be repeated annually for as long as the institution continues to accept the \nassociated high risk. \nMiscellaneous Notes \nThis box will expand. If pasting content, paste it as plain text to maintain box formatting. \nNotice to all Parties \nThe Temporary Alternate Access Plan should only serve as an interim measure while the \nvendors address the underlying barriers to full accessibility. As of April 24, 2026, Title II of the \nADA requires all ICT (Information and Communication Technology) to be fully accessible. In \nmost circumstances, Title II §35.205 also applies. \nWhile we may not yet meet every technical standard, we will use TAAPs to comply with §35.205, \nwhich deems that a public entity not in full compliance with §35.200(b) is still considered \ncompliant if the noncompliance has minimal impact on access and does not prevent individuals \nwith disabilities from: \n•\nAccessing the same information as individuals without disabilities;\n•\nEngaging in the same interactions as individuals without disabilities;\n•\nConducting the same transactions as individuals without disabilities; and\n•\nOtherwise participating in or benefiting from the same services, programs, and activities\nas individuals without disabilities.\nOur goal is 100% compliance, and we will rely on TAAPs only until these barriers are fully \nresolved. \nDocusign Envelope ID: A1AD12E6-AFE8-40E0-A534-86552C42A69B\n\nhttps://ati.calstate.edu/ati-priority-areas/procurement/temporary-alternate-access-planning \nhttps://access.sfsu.edu/ati/procurement/eeaap \nVersion 3.2 051225 \nContent is licensed under a Creative Commons Attribution 4.0 International license.  \nLegal Framework \n•\nSection 504 of the Rehabilitation Act of 1973 and Section 508 of the Rehabilitation Act\nof 1973 \n•\nAmericans with Disabilities Act Title II Regulations\n•\nCalifornia Government Code 11135 and California Government Code 7405\nDocusign Envelope ID: A1AD12E6-AFE8-40E0-A534-86552C42A69B\n", doc.raw_text_captured = date("2026-10-07"),
              doc.include_in_report = false, doc.depreciated = false;

// ---- the plan (create_taap twin: identifier, required edges, form fields)
MATCH (a:Asset {asset_identifier: "pearson-revel-sfsu"})
MATCH (c:Campus {abbreviation: "sfsu"})
MATCH (u:OrgUnit {name: "Lam Family College of Business"})
MERGE (t:TAAP {taap_identifier: "pearson-revel-sfsu--lam-family-college-of-business--2025"})
ON CREATE SET t.unique_id = replace(randomUUID(), "-", "")
SET t.title = "Pearson Revel",
    t.template_version = "3.2 051225",
    t.creation_date = date("2025-09-25"),
    t.vendor_contact = null,
    t.known_barriers = "Students who rely on keyboard navigation or screen readers face significant barriers that prevent them \nfrom completing core academic tasks in Pearson Revel. A blind student using a screen reader cannot \naccurately identify images, buttons, or form fields due to missing or incorrect labels, making it \nimpossible to navigate course content or submit assignments reliably. Students with motor disabilities \nwho cannot use a mouse are unable to access drag-and-drop activities, certain scrollable content areas, \nand may become trapped in specific interface sections, effectively blocking them from completing \ninteractive exercises or moving between course modules. When students with low vision magnify their \nscreens to 200% or use mobile devices in portrait orientation, essential content and controls disappear \nor overlap, preventing them from reading materials or accessing submission buttons. Additionally, the \ninconsistent focus indicators and illogical navigation order mean that keyboard users often lose track of \ntheir position on the page, making it nearly impossible to complete timed assessments or navigate \ncomplex course materials efficiently.",
    t.affected_user_groups = ["blindness", "low_vision"],
    t.proposed_alternative = "If a student cannot access the Pearson Revel interactive material, the instructor, Mehmet Ergul \n(mergul@sfsu.edu), must facilitate access to alternative assignments from the textbook that mirror \nthe interactive content's learning outcomes, with modifications based on individual access needs. \nFor students using screen readers, the instructor must provide materials in fully accessible \nformats (Word documents or HTML with proper heading structure). For keyboard-only users, the \ninstructor must replace all drag-and-drop or mouse-dependent activities with keyboard-accessible \nalternatives such as multiple-choice questions or text-based responses. \nThese modifications should be made in conjunction with the Disability Programs and Resource \nCenter by notifying both the student and the department as early as possible.",
    t.accessibility_statement = "Pearson Revel has documented accessibility barriers for students who are blind, have low vision, \nor rely on keyboard navigation, preventing access to some interactive content and assignments. \nStudents experiencing barriers should contact Professor Ergul (mergul@sfsu.edu) for equivalent \nalternative assignments and should register with DPRC (dprc@sfsu.edu) for formal \naccommodations. Report access issues when you encountering them—do not wait until deadlines.",
    t.statement_elements = ["known_barriers", "impacted_groups", "disclaimer", "assistance_contact"],
    t.distribution_actions = ["syllabi", "point_of_access", "requesting_department", "disability_services", "human_resources", "acr_repository"],
    t.requirements_met = ["same_information", "independent_access", "equivalent_ease_of_use", "privacy_protected"],
    t.outcome = "non_equal_alternative",
    t.institutional_risk = "moderate",
    t.accommodation_requirement = "moderate",
    t.effective_date = date("2025-10-08"),
    t.review_due = null,
    t.misc_notes = null,
    t.taap_status = "signed",
    t.active = true
MERGE (t)-[:covers_asset]->(a)
MERGE (t)-[:taap_at_campus]->(c)
MERGE (t)-[:requested_by]->(u);

MATCH (t:TAAP {taap_identifier: "pearson-revel-sfsu--lam-family-college-of-business--2025"}), (ay:AcademicYear {name: "2025-2026"})
MERGE (t)-[:taap_in_year]->(ay);
MATCH (t:TAAP {taap_identifier: "pearson-revel-sfsu--lam-family-college-of-business--2025"}), (p:Person {name: "Ryan Smith"})
MERGE (t)-[:owned_by]->(p);
MATCH (t:TAAP {taap_identifier: "pearson-revel-sfsu--lam-family-college-of-business--2025"}), (p:Person {name: "Ryan Smith"})
MERGE (t)-[r:signed_by]->(p)
SET r.role = "department_head", r.signed_date = date("2025-10-03");
MATCH (t:TAAP {taap_identifier: "pearson-revel-sfsu--lam-family-college-of-business--2025"}), (p:Person {name: "Eugene Sivadas"})
MERGE (t)-[r:signed_by]->(p)
SET r.role = "division_executive", r.signed_date = date("2025-10-03");
MATCH (t:TAAP {taap_identifier: "pearson-revel-sfsu--lam-family-college-of-business--2025"}), (p:Person {name: "Ingrid Williams"})
MERGE (t)-[r:signed_by]->(p)
SET r.role = "ada_coordinator", r.signed_date = date("2025-10-08");
MATCH (t:TAAP {taap_identifier: "pearson-revel-sfsu--lam-family-college-of-business--2025"}), (doc:Document {hash: "8cb2ab277c6f53751879f1eb6f99bb9717b0996626dfebe7ff944c97f3e0376b"})
MERGE (t)-[:signed_copy]->(doc);

// ---- evidence (connect_taap_to_yse twin; internal control)
MATCH (t:TAAP {taap_identifier: "pearson-revel-sfsu--lam-family-college-of-business--2025"}), (y:YearSuccessEvidence {year_identifier: "2025-2026-8.10-pro-sfsu"})
MERGE (t)-[r:is_evidence_for]->(y)
SET r.strength = 3, r.control = "internal";
MATCH (t:TAAP {taap_identifier: "pearson-revel-sfsu--lam-family-college-of-business--2025"}), (y:YearSuccessEvidence {year_identifier: "2025-2026-4.6-pro-sfsu"})
MERGE (t)-[r:is_evidence_for]->(y)
SET r.strength = 2, r.control = "internal";
MATCH (t:TAAP {taap_identifier: "pearson-revel-sfsu--lam-family-college-of-business--2025"}), (y:YearSuccessEvidence {year_identifier: "2025-2026-6.9-ins-sfsu"})
MERGE (t)-[r:is_evidence_for]->(y)
SET r.strength = 2, r.control = "internal";
MATCH (t:TAAP {taap_identifier: "pearson-revel-sfsu--lam-family-college-of-business--2025"}), (y:YearSuccessEvidence {year_identifier: "2025-2026-1.19-web-sfsu"})
MERGE (t)-[r:is_evidence_for]->(y)
SET r.strength = 1, r.control = "internal";

