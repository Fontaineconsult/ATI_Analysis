// SAS_ SSU_ July 2026.docx
// TAAP sas-ssu--department-of-mathematics-and-statistics--2026 at ssu, academic year 2026-2027. Generated 2026-10-07 by
// app/database/tools/taap_import from the signed form; decisions in
// app/database/tools/taap_import/decisions/. Re-running is a no-op except that
// the TAAP's own properties are re-set from the form.
// Requesting unit 'Department of Mathematics and Statistics' is inferred from the signers and prose, not stated on the form.

// ---- vendor
MERGE (v:Vendor {name: "SAS Institute"})
ON CREATE SET v.unique_id = replace(randomUUID(), "-", "");

// ---- asset (create_asset twin: composite identifier, campus anchor, vendor)
MATCH (c:Campus {abbreviation: "ssu"})
MERGE (a:Asset {asset_identifier: "sas-ssu"})
ON CREATE SET a.unique_id = replace(randomUUID(), "-", ""), a.title = "SAS", a.scope = "campus",
              a.asset_class = "third_party_service", a.version = null
MERGE (a)-[:asset_at_campus]->(c)
WITH a
MATCH (v:Vendor {name: "SAS Institute"})
MERGE (a)-[:supplied_by]->(v);

// ---- requesting unit (create_org_unit twin: Department under the campus)
MATCH (c:Campus {abbreviation: "ssu"})
MERGE (u:OrgUnit {name: "Department of Mathematics and Statistics"})
ON CREATE SET u:Department, u.unique_id = replace(randomUUID(), "-", "")
MERGE (u)-[:operates_under_campus]->(c);

// ---- signers (add_person twin: active, not a committee member; campus only when new)
MATCH (c:Campus {abbreviation: "ssu"})
MERGE (p:Person {name: "Martha Shott"})
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
MERGE (doc:Document {hash: "f1aa8b55b31ec08e5a12d632d21551d77c874fc148957e8b61df23b8cdf2c176"})
ON CREATE SET doc.unique_id = replace(randomUUID(), "-", ""), doc.name = "SAS_ SSU_ July 2026(signed).pdf",
              doc.file_path = "C:\\Users\\913678186\\Box\\SFBRN ATI\\Procurement\\TAAP\\Completed TAAPs\\SAS_ SSU_ July 2026(signed).pdf",
              doc.description = "Signed Temporary Alternate Access Plan (CSU template 3.2 051225).",
              doc.raw_text = "       \n \n    Sonoma State University \n \nhttps://ati.calstate.edu/ati-priority-areas/procurement/temporary-alternate-access-planning \nhttps://access.sfsu.edu/ati/procurement/eeaap \nVersion 3.2 051225 \n \nContent is licensed under a Creative Commons Attribution 4.0 International license.       \n \nTemporary Alternative Access Plan (TAAP) \nFormerly, Equally Effective Alternative Access Plan (EEAAP). \nICT Product Information \nProduct Name: SAS \nClick or tap here to enter text. \nVendor Contact: Click or tap here to enter text. \nTemporary Alternate Access Plan Creation Date: July 28, 2026 \nReferenced Documentation \nUpload the referenced documents to the ATI Systemwide ACR Repository (SharePoint Login \nCredentials Required). Create a product folder for the ICT if one does not already exist. Once \nuploaded, generate links and place them below: \n \n• \nProduct Accessibility Conformance Report (ACR) \nlink, if applicable \n• \nVendor Accessibility Demonstration Results \nlink, if applicable \n• \nManual or Automated Testing Results: \nlink, if applicable \n• \nVendor Accessibility Roadmap: \nlink, if applicable \nKnown Accessibility Barriers \nDescribe the known accessibility barriers that affect core functionality.  \nSome content lacks appropriate text alternative, some content lacks text alternative when \nshown in presentation, some features and tools are impossible or difficult to reach via keyboard \nalone, keyboard traps are present in the new file shortcut, focus is lost or travels in the wrong \ndirection for some areas, focus may change unexpectedly when navigating some controls, \nsome parsing errors are present, some fields are misidentified or misread, text is truncated or \nmisplaced when text is resized, language markup is unavailable, color contrast is insufficient, \nscreen readers may encounter roadblocks in some instances.  \nAffected User Groups \nChoose all that apply. \n \n☒ Blindness \n☐ Low Vision \n\n \n \nhttps://ati.calstate.edu/ati-priority-areas/procurement/temporary-alternate-access-planning \nhttps://access.sfsu.edu/ati/procurement/eeaap \nVersion 3.2 051225 \n \nContent is licensed under a Creative Commons Attribution 4.0 International license.       \n \n☐ Deafness \n☐ Hard of Hearing \n☒ Limited Manual Dexterity \n☒ Cognitive Disability \n☐ Speech Disabilities \n☐ Photosensitivity \n☒ Limited Reach and Strength \n \nProposed Alternative \nPlease provide details on the proposed alternative solution. \n \nDescribe how the proposed alternative will address the barrier(s), describe the resources \nrequired or personnel, and name the responsible department.  \n \nStudents will use this product in class setting with partners, where they will not be required to \ndirectly interact with the product and will be given the opportunity to serve as the “navigator” rather \nthan the “driver”. The professor will place a notice on the course LMS notifying students of the \nbarriers and possible affected student groups and that they will be given this option and will not be \nrequired to disclose their disability to their peers.  \n \n \nProduct Specific Accessibility Statement \nDraft a concise accessibility statement tailored specifically to this product (not your general \ncampus-wide accessibility statement) that includes: \n \n☒ Known barriers in the product interface. \n☒ Impacted disability groups. \n☐ Link or reference to this document. \n☒ Add a disclaimer: best effort was made, but unknown barriers may remain. \n☒ Provide contact for further accessibility assistance. \n \n\n \n \nhttps://ati.calstate.edu/ati-priority-areas/procurement/temporary-alternate-access-planning \nhttps://access.sfsu.edu/ati/procurement/eeaap \nVersion 3.2 051225 \n \nContent is licensed under a Creative Commons Attribution 4.0 International license.       \n \n(Post this statement wherever the product is available and in use.) \nThis product has been reviewed by the San Francisco Bay Regional Network’s Accessibility \nTechnology Initiative (SFBRN ATI) team and has been found to pose a barrier to users without \nvision, with limited manipulation, with limited reach and strength, and with limited language, \ncognitive, and learning abilities. These user groups were identified however other users' groups \nmay be impacted. Users may face barriers performing keyboard navigation, focus following a \nlogical order, color contrast and more. If you face any barriers using this product please speak \nto your professor (insert email@sonomal.edu). You are not required to disclose your disability to \nseek support in your use of this product.  \n \nCommunication and Distribution \nThe document must be easily referenced. Indicate which of the following actions have been \ntaken: \n \n☒ Posted the Accessibility Statement in course syllabi (if applicable). \n \n☒ Posted the Accessibility Statement where the product is accessed. \n \n☒ Provided copies of this document to Requesting Department/Area. \n☐ Provided copies of this document to Disability Services Office. \n☐ Provided copies of this document to Human Resources (ADA Coordinators). \n☐ Provided copies of this document to IT Help Desk. \n☒ Saved the document in the ATI Systemwide ACR Repository (SharePoint Login \nCredentials Required) \n☐ Other: [Specify] \n \n \nReview the proposed solution to determine if it meets the following legal requirements to be \nequally effective. A non-equal alternative or individualized accommodation will be required if it \ndoes not. \n \nRequirements Checklist \nTo qualify as an Equally Effective Alternative, the plan must meet ALL the following: \n• ☒ Allows access to the same information, engagement, and services. \n\n \n \nhttps://ati.calstate.edu/ati-priority-areas/procurement/temporary-alternate-access-planning \nhttps://access.sfsu.edu/ati/procurement/eeaap \nVersion 3.2 051225 \n \nContent is licensed under a Creative Commons Attribution 4.0 International license.       \n \n• ☒ Offers the same availability as the primary solution.  \n• ☐ Can be accessed independently without additional assistance. \n• ☒ Does not result in disparate burden or impact on the user. \n• ☒ Has substantially equivalent ease of use. \n• ☒ Protects the privacy of the individuals affected. \n• ☒ Saved the document in the ATI Systemwide ACR Repository (SharePoint Login \nCredentials Required) \n• ☐ Other: [Specify] \nProcess Outcome \nBased on the assessment above, the outcome of the Temporary Alternate Access Plan is: \n \n• ☐Meets all six legal requirements: Equally Effective. The proposed solution fully \nmeets all legal requirements for equally effective access, presenting minimal risk to the \ninstitution. In general, no individual accommodations are expected to be necessary. \nNon-conforming minimal impact on access. \n \n• ☒ Meets some (1-5) legal requirements: Partially Equally Effective. While the solution \npartially addresses accessibility, it may still require supplemental assistance for users. \nThis carries a moderate risk to the institution, and staff should be prepared to provide \nadditional support for affected individuals. \n \n• ☐ Unable to provide alternative means of access: Need for Individualized \nAccommodation. If no effective alternative solution is available, individualized \naccommodations must be provided for each affected user. This requires alerting the \ndisability services and human resources offices. The department responsible for \nobtaining the product may face additional costs to cover individualized \naccommodations, and this scenario presents a high risk to the institution.  \nInstitutional Risk \n• ☐ HIGH: No alternative access provided (Supports 0 criteria) \n• ☒ MODERATE: Non-Equal Alternative Access (Supports 1-5 criteria) \n• ☐ LOW: Equally Effective Alternative Access (Supports all 6 criteria) \n\n \n \nhttps://ati.calstate.edu/ati-priority-areas/procurement/temporary-alternate-access-planning \nhttps://access.sfsu.edu/ati/procurement/eeaap \nVersion 3.2 051225 \n \nContent is licensed under a Creative Commons Attribution 4.0 International license.       \n \nAccommodation Requirements \n• ☐ HIGH: Accommodations required for all users (Supports 0 criteria) \n \n• ☒ MODERATE:  Accommodations required for some users (Supports 1-5 criteria) \n• ☐ LOW: Accommodations required for minimal number of users (Supports all 6 \ncriteria) \nAdministrative Approval \nBy signing below, each approver confirms that they have reviewed the proposed temporary \nalternative means of access, evaluated the associated institutional risks and accommodation \nrequirements, and determined that this plan serves as an acceptable interim solution for \nmeeting applicable compliance and legal obligations. \n \nRole \nName \nSignature \nDate \nDepartment Chair/Manager \nMartha Shott \n \n \nDean/Division Vice President \nElisabeth Wade \n \n \n \nNext Review \nThe document should be reviewed and updated annually or when renewing the ICT, as TAAPs \nare temporary solutions until the vendor resolves accessibility issues. \nReview of this document should occur on or before [July 28, 2027] \nIn the event of Vendor Non-Compliance \nTAAPs are intended to be temporary and are only valid when regularly reviewed to confirm that \nthe vendor is actively working to remediate their ICT accessibility barriers.  \n \nIf this document is under review and there is no measurable progress from the vendor, its \ncontinued validity may be questioned. Should there be no improvement at the time of the annual \nreview, a formal memo must be prepared for the requesting department and signed by the \ninstitution’s highest executive leadership. \n \nThis memo should state that the vendor has failed to meet its commitment to address the \nknown accessibility barriers in its product. It should also explain why an alternative solution is \nnot being pursued at this time.  \n \nA copy of this memo may be shared with the vendor.  \n \nThis process should be repeated annually for as long as the institution continues to accept the \nassociated high risk. \n07/28/2026\n\n \n \nhttps://ati.calstate.edu/ati-priority-areas/procurement/temporary-alternate-access-planning \nhttps://access.sfsu.edu/ati/procurement/eeaap \nVersion 3.2 051225 \n \nContent is licensed under a Creative Commons Attribution 4.0 International license.       \n \nMiscellaneous Notes \n \nSara M. and Mantsha L met with Martha Shott via Zoom on July 22nd and discussed the use \ncase, the barriers to users, and possible accommodations for this product. All statements and \naccommodations listed above were agreed to by all parties.  \n \n \n \nNotice to all Parties \nThe Temporary Alternate Access Plan should only serve as an interim measure while the \nvendors address the underlying barriers to full accessibility. As of April 24, 2026, Title II of the \nADA requires all ICT (Information and Communication Technology) to be fully accessible. In \nmost circumstances, Title II §35.205 also applies. \nWhile we may not yet meet every technical standard, we will use TAAPs to comply with §35.205, \nwhich deems that a public entity not in full compliance with §35.200(b) is still considered \ncompliant if the noncompliance has minimal impact on access and does not prevent individuals \nwith disabilities from: \n• \nAccessing the same information as individuals without disabilities; \n• \nEngaging in the same interactions as individuals without disabilities; \n• \nConducting the same transactions as individuals without disabilities; and \n• \nOtherwise participating in or benefiting from the same services, programs, and activities \nas individuals without disabilities. \nOur goal is 100% compliance, and we will rely on TAAPs only until these barriers are fully \nresolved. \nLegal Framework \n• \nSection 504 of the Rehabilitation Act of 1973 and Section 508 of the Rehabilitation Act \nof 1973 \n• \nAmericans with Disabilities Act Title II Regulations \n• \nCalifornia Government Code 11135 and California Government Code 7405\n\n \n \nhttps://ati.calstate.edu/ati-priority-areas/procurement/temporary-alternate-access-planning \nhttps://access.sfsu.edu/ati/procurement/eeaap \nVersion 3.2 051225 \n \nContent is licensed under a Creative Commons Attribution 4.0 International license.       \n \n \n", doc.raw_text_captured = date("2026-10-07"),
              doc.include_in_report = false, doc.depreciated = false;

// ---- the plan (create_taap twin: identifier, required edges, form fields)
MATCH (a:Asset {asset_identifier: "sas-ssu"})
MATCH (c:Campus {abbreviation: "ssu"})
MATCH (u:OrgUnit {name: "Department of Mathematics and Statistics"})
MERGE (t:TAAP {taap_identifier: "sas-ssu--department-of-mathematics-and-statistics--2026"})
ON CREATE SET t.unique_id = replace(randomUUID(), "-", "")
SET t.title = "SAS",
    t.template_version = "3.2 051225",
    t.creation_date = date("2026-07-28"),
    t.vendor_contact = null,
    t.known_barriers = "Some content lacks appropriate text alternative, some content lacks text alternative when shown in presentation, some features and tools are impossible or difficult to reach via keyboard alone, keyboard traps are present in the new file shortcut, focus is lost or travels in the wrong direction for some areas, focus may change unexpectedly when navigating some controls, some parsing errors are present, some fields are misidentified or misread, text is truncated or misplaced when text is resized, language markup is unavailable, color contrast is insufficient, screen readers may encounter roadblocks in some instances.",
    t.affected_user_groups = ["blindness", "limited_manual_dexterity", "cognitive_disability", "limited_reach_and_strength"],
    t.proposed_alternative = "Students will use this product in class setting with partners, where they will not be required to directly interact with the product and will be given the opportunity to serve as the “navigator” rather than the “driver”. The professor will place a notice on the course LMS notifying students of the barriers and possible affected student groups and that they will be given this option and will not be required to disclose their disability to their peers.",
    t.accessibility_statement = "This product has been reviewed by the San Francisco Bay Regional Network’s Accessibility Technology Initiative (SFBRN ATI) team and has been found to pose a barrier to users without vision, with limited manipulation, with limited reach and strength, and with limited language, cognitive, and learning abilities. These user groups were identified however other users' groups may be impacted. Users may face barriers performing keyboard navigation, focus following a logical order, color contrast and more. If you face any barriers using this product please speak to your professor (insert email@sonomal.edu). You are not required to disclose your disability to seek support in your use of this product.",
    t.statement_elements = ["known_barriers", "impacted_groups", "disclaimer", "assistance_contact"],
    t.distribution_actions = ["syllabi", "point_of_access", "requesting_department", "acr_repository"],
    t.requirements_met = ["same_information", "same_availability", "no_disparate_burden", "equivalent_ease_of_use", "privacy_protected"],
    t.outcome = "non_equal_alternative",
    t.institutional_risk = "moderate",
    t.accommodation_requirement = "moderate",
    t.effective_date = null,
    t.review_due = date("2027-07-28"),
    t.misc_notes = "Sara M. and Mantsha L met with Martha Shott via Zoom on July 22nd and discussed the use case, the barriers to users, and possible accommodations for this product. All statements and accommodations listed above were agreed to by all parties.",
    t.taap_status = "signed",
    t.active = true
MERGE (t)-[:covers_asset]->(a)
MERGE (t)-[:taap_at_campus]->(c)
MERGE (t)-[:requested_by]->(u);

MATCH (t:TAAP {taap_identifier: "sas-ssu--department-of-mathematics-and-statistics--2026"}), (ay:AcademicYear {name: "2026-2027"})
MERGE (t)-[:taap_in_year]->(ay);
MATCH (t:TAAP {taap_identifier: "sas-ssu--department-of-mathematics-and-statistics--2026"}), (p:Person {name: "Sara Marquez"})
MERGE (t)-[:prepared_by]->(p);
MATCH (t:TAAP {taap_identifier: "sas-ssu--department-of-mathematics-and-statistics--2026"}), (p:Person {name: "Martha Shott"})
MERGE (t)-[:owned_by]->(p);
MATCH (t:TAAP {taap_identifier: "sas-ssu--department-of-mathematics-and-statistics--2026"}), (p:Person {name: "Martha Shott"})
MERGE (t)-[r:signed_by]->(p)
SET r.role = "department_head", r.signed_date = null;
MATCH (t:TAAP {taap_identifier: "sas-ssu--department-of-mathematics-and-statistics--2026"}), (p:Person {name: "Elisabeth Wade"})
MERGE (t)-[r:signed_by]->(p)
SET r.role = "division_executive", r.signed_date = null;
MATCH (t:TAAP {taap_identifier: "sas-ssu--department-of-mathematics-and-statistics--2026"}), (doc:Document {hash: "f1aa8b55b31ec08e5a12d632d21551d77c874fc148957e8b61df23b8cdf2c176"})
MERGE (t)-[:signed_copy]->(doc);

// ---- evidence (connect_taap_to_yse twin; internal control)
MATCH (t:TAAP {taap_identifier: "sas-ssu--department-of-mathematics-and-statistics--2026"}), (y:YearSuccessEvidence {year_identifier: "2026-2027-8.10-pro-ssu"})
MERGE (t)-[r:is_evidence_for]->(y)
SET r.strength = 3, r.control = "internal";
MATCH (t:TAAP {taap_identifier: "sas-ssu--department-of-mathematics-and-statistics--2026"}), (y:YearSuccessEvidence {year_identifier: "2026-2027-4.6-pro-ssu"})
MERGE (t)-[r:is_evidence_for]->(y)
SET r.strength = 2, r.control = "internal";
MATCH (t:TAAP {taap_identifier: "sas-ssu--department-of-mathematics-and-statistics--2026"}), (y:YearSuccessEvidence {year_identifier: "2026-2027-6.9-ins-ssu"})
MERGE (t)-[r:is_evidence_for]->(y)
SET r.strength = 2, r.control = "internal";
MATCH (t:TAAP {taap_identifier: "sas-ssu--department-of-mathematics-and-statistics--2026"}), (y:YearSuccessEvidence {year_identifier: "2026-2027-1.19-web-ssu"})
MERGE (t)-[r:is_evidence_for]->(y)
SET r.strength = 1, r.control = "internal";

