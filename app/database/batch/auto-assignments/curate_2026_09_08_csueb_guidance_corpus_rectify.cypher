// =====================================================================================
// CSUEB Guidance corpus rectify — documentation coverage and accountable community
// 2026-09-08. Curation pass, not an ingest. No new source material beyond live pages.
//
// WHY
//   First run of Corpus mode in .claude/skills/implementation-rectify/SKILL.md: take a
//   whole set from the /implementations context, refresh the Source Text behind it, read
//   the set against itself for members describing the same work, and sweep the hosts it
//   already cites for pages it does not.
//
//   Set: the 13 Guidance implementations evidencing a YSE at CSU East Bay. 11 live,
//   2 retired (ICT Training Materials & Supplemental Documentation; Tutorials for
//   creating accessible content). Retired members carry no changes here.
//
// WHAT THE SWEEP FOUND
//   The /ati/ section publishes a nine-page web-accessibility subtree — principles,
//   page titles, headings, alternate text, navigation, captions and transcripts,
//   keyboard accessibility, meaningful markup, colour and styling. General Web
//   Accessibility Guidance already described that checklist in its own description
//   while citing only the parent page. All nine were fetched on 2026-09-08 and each
//   confirmed on subject: every one addresses "web developers and content creators"
//   against WCAG 2.1 Level AA. They are attached here.
//
//   /ati/procurement/index.html is the ATI-side account of accessible ICT purchasing
//   (review request, VPAT collection, WCAG 2.1 AA). About ICT Purchases - VPAT cited
//   only the ICT-office side of the same process. Attached here.
//
//   No downloadable file was found on any swept page. The only files linked on
//   csueastbay.edu pages are four sitewide footer PDFs (viewbook, annual security
//   report, campus safety plan, non-discrimination notice), which are chrome.
//
// OVERLAP
//   Three shared-documentation pairs, no same-campus duplicate. The one live-live pair
//   is .../ati/instructional-materials/faculty-staff.html on both Instructional
//   Materials - ATI and Accessibility Compliance for Digital Teaching & Learning. Their
//   mirrors read as different subjects (the ATI instructional-materials priority vs the
//   Online Campus page on the April 2026 DOJ Title II rule), so the shared page is a
//   legitimate cross-reference. Nothing is consolidated.
//
// WHAT IS DELIBERATELY NOT IN THIS FILE
//   - raw_text. Source Text was filled on Tips and Resources for Faculty and Staff
//     (1a9175f0f1974b8190263c7c65d71539) through update_webpage in
//     queries/documentation/update.py, because that query layer stamps
//     raw_text_captured and raw Cypher does not. Never write raw_text from a batch file.
//   - Informal Accessible Course Content Guidelines
//     (fd50218af00c4380aed5ad1d8c214025). Empty description, its sole source is a Google
//     Doc already flagged no_longer_exists, no owner, no community, and it evidences
//     4.3-ins in three years. It needs a decision, not a guess.
//   - ATI Overview (77c3cc2b8b414006ab988243af0719cc). No owner, and the only unit its
//     text names is the ATI itself, which is not a community. Undecidable; the fix is
//     naming an owner.
//   - The ScreenSteps description, which names UDOIT and accessibility guides its
//     1.5k landing-page mirror does not evidence. Either the collections get mirrored
//     or the description gets softened. Not decided here.
//
// SECTIONS
//   1. Web accessibility subtree -> General Web Accessibility Guidance
//   2. ATI procurement page -> About ICT Purchases - VPAT
//   3. Accountable community assignments
// =====================================================================================


// -------------------------------------------------------------------------------------
// 1. WEB ACCESSIBILITY SUBTREE -> General Web Accessibility Guidance
//    b84b0f46b2f64332b67abd5014efe725
//    No academic_year is set on these edges, so included_in_years stays empty and the
//    pages show in every report year — matching the member's primary page
//    (.../ati/web-accessibility.html), which also carries no year curation. These are
//    standing guidance, not year-scoped artifacts.
// -------------------------------------------------------------------------------------

MERGE (w:Webpage {url: "https://www.csueastbay.edu/ati/principles-best-practices.html"})
ON CREATE SET w.unique_id = replace(randomUUID(), "-", ""),
              w.name = "CSUEB ATI - Accessibility Principles & Best Practices",
              w.description = "Foundational accessibility principles and best practices for CSUEB digital content, addressed to faculty, staff, developers and content creators.",
              w.include_in_report = true;

MATCH (i {unique_id: "b84b0f46b2f64332b67abd5014efe725"})
MATCH (w:Webpage {url: "https://www.csueastbay.edu/ati/principles-best-practices.html"})
MERGE (i)-[r:is_documented_by]->(w)
ON CREATE SET r.added_date = date("2026-09-08");

MERGE (w:Webpage {url: "https://www.csueastbay.edu/ati/page-titles.html"})
ON CREATE SET w.unique_id = replace(randomUUID(), "-", ""),
              w.name = "CSUEB ATI - Page Titles",
              w.description = "Guidance on writing unique, descriptive page titles, addressed to web developers and content creators working in the Cascade CMS.",
              w.include_in_report = true;

MATCH (i {unique_id: "b84b0f46b2f64332b67abd5014efe725"})
MATCH (w:Webpage {url: "https://www.csueastbay.edu/ati/page-titles.html"})
MERGE (i)-[r:is_documented_by]->(w)
ON CREATE SET r.added_date = date("2026-09-08");

MERGE (w:Webpage {url: "https://www.csueastbay.edu/ati/headings.html"})
ON CREATE SET w.unique_id = replace(randomUUID(), "-", ""),
              w.name = "CSUEB ATI - Headings",
              w.description = "Guidance on semantic heading structure and hierarchy, and how headings support screen reader navigation. Addressed to web developers and content creators.",
              w.include_in_report = true;

MATCH (i {unique_id: "b84b0f46b2f64332b67abd5014efe725"})
MATCH (w:Webpage {url: "https://www.csueastbay.edu/ati/headings.html"})
MERGE (i)-[r:is_documented_by]->(w)
ON CREATE SET r.added_date = date("2026-09-08");

MERGE (w:Webpage {url: "https://www.csueastbay.edu/ati/alternate-text.html"})
ON CREATE SET w.unique_id = replace(randomUUID(), "-", ""),
              w.name = "CSUEB ATI - Alternate Text",
              w.description = "Guidance on writing alternative text for images, addressed to faculty, staff and anyone publishing web content at CSUEB.",
              w.include_in_report = true;

MATCH (i {unique_id: "b84b0f46b2f64332b67abd5014efe725"})
MATCH (w:Webpage {url: "https://www.csueastbay.edu/ati/alternate-text.html"})
MERGE (i)-[r:is_documented_by]->(w)
ON CREATE SET r.added_date = date("2026-09-08");

MERGE (w:Webpage {url: "https://www.csueastbay.edu/ati/navigation.html"})
ON CREATE SET w.unique_id = replace(randomUUID(), "-", ""),
              w.name = "CSUEB ATI - Navigation",
              w.description = "Guidance on accessible site navigation under WCAG 2.1 Level AA: skip links, consistent menus, keyboard access and descriptive link text.",
              w.include_in_report = true;

MATCH (i {unique_id: "b84b0f46b2f64332b67abd5014efe725"})
MATCH (w:Webpage {url: "https://www.csueastbay.edu/ati/navigation.html"})
MERGE (i)-[r:is_documented_by]->(w)
ON CREATE SET r.added_date = date("2026-09-08");

MERGE (w:Webpage {url: "https://www.csueastbay.edu/ati/captions-and-transcripts.html"})
ON CREATE SET w.unique_id = replace(randomUUID(), "-", ""),
              w.name = "CSUEB ATI - Captions and Transcripts",
              w.description = "Guidance on when captions and transcripts are required for audio and video, and the campus resources that support captioning.",
              w.include_in_report = true;

MATCH (i {unique_id: "b84b0f46b2f64332b67abd5014efe725"})
MATCH (w:Webpage {url: "https://www.csueastbay.edu/ati/captions-and-transcripts.html"})
MERGE (i)-[r:is_documented_by]->(w)
ON CREATE SET r.added_date = date("2026-09-08");

MERGE (w:Webpage {url: "https://www.csueastbay.edu/ati/keyboard-accessibility.html"})
ON CREATE SET w.unique_id = replace(randomUUID(), "-", ""),
              w.name = "CSUEB ATI - Keyboard Accessibility",
              w.description = "Guidance on making interactive elements operable by keyboard alone, under WCAG 2.1 Level AA. Addressed to developers and content creators.",
              w.include_in_report = true;

MATCH (i {unique_id: "b84b0f46b2f64332b67abd5014efe725"})
MATCH (w:Webpage {url: "https://www.csueastbay.edu/ati/keyboard-accessibility.html"})
MERGE (i)-[r:is_documented_by]->(w)
ON CREATE SET r.added_date = date("2026-09-08");

MERGE (w:Webpage {url: "https://www.csueastbay.edu/ati/meaningful-markup.html"})
ON CREATE SET w.unique_id = replace(randomUUID(), "-", ""),
              w.name = "CSUEB ATI - Meaningful Markup",
              w.description = "Guidance on semantic HTML markup for accessible pages under WCAG 2.1 Level AA, addressed to CSUEB staff, faculty and web content contributors.",
              w.include_in_report = true;

MATCH (i {unique_id: "b84b0f46b2f64332b67abd5014efe725"})
MATCH (w:Webpage {url: "https://www.csueastbay.edu/ati/meaningful-markup.html"})
MERGE (i)-[r:is_documented_by]->(w)
ON CREATE SET r.added_date = date("2026-09-08");

MERGE (w:Webpage {url: "https://www.csueastbay.edu/ati/color-and-styling.html"})
ON CREATE SET w.unique_id = replace(randomUUID(), "-", ""),
              w.name = "CSUEB ATI - Color and Styling",
              w.description = "Guidance on accessible colour use and styling: colour is not the sole means of conveying information, and normal text carries a contrast ratio of at least 4.5:1.",
              w.include_in_report = true;

MATCH (i {unique_id: "b84b0f46b2f64332b67abd5014efe725"})
MATCH (w:Webpage {url: "https://www.csueastbay.edu/ati/color-and-styling.html"})
MERGE (i)-[r:is_documented_by]->(w)
ON CREATE SET r.added_date = date("2026-09-08");


// -------------------------------------------------------------------------------------
// 2. ATI PROCUREMENT PAGE -> About ICT Purchases - VPAT
//    86d96d17d43d44cd84c0c637265abd23
// -------------------------------------------------------------------------------------

MERGE (w:Webpage {url: "https://www.csueastbay.edu/ati/procurement/index.html"})
ON CREATE SET w.unique_id = replace(randomUUID(), "-", ""),
              w.name = "CSUEB ATI - Procurement",
              w.description = "The ATI-side account of accessible ICT purchasing: submitting an ICT review request, collecting vendor accessibility documentation including VPATs, and planning ahead against WCAG 2.1 Level AA and ADA requirements.",
              w.include_in_report = true;

MATCH (i {unique_id: "86d96d17d43d44cd84c0c637265abd23"})
MATCH (w:Webpage {url: "https://www.csueastbay.edu/ati/procurement/index.html"})
MERGE (i)-[r:is_documented_by]->(w)
ON CREATE SET r.added_date = date("2026-09-08");


// -------------------------------------------------------------------------------------
// 3. ACCOUNTABLE COMMUNITY
//
// A stake is not ownership, so each of these is justified by a signal on the node
// itself, strongest first, and the reasoning is recorded per assignment. Six of the
// eight previously unassigned live members are covered; ATI Overview and Informal
// Accessible Course Content Guidelines are left unassigned on purpose (see header).
//
// accountable_community is an additive edge — assign connects, it does not replace —
// so the two members carrying a pair below keep both.
// -------------------------------------------------------------------------------------

// Signal 1: owner Vanessa Lopez is a member of Marketing & Communications, whose
// practice area is accessible public-facing content.
MATCH (g:Guidance {unique_id: "5184d8abb7a44b688c324eb0db5452ff"})
MATCH (c:CommunityOfPractice {name: "Marketing & Communications"})
MERGE (g)-[:accountable_community]->(c);

// Signal 3: the Procurement community's practice is "buyers and contract specialists
// who review VPATs/ACRs", a direct match to this node's subject.
MATCH (g:Guidance {unique_id: "86d96d17d43d44cd84c0c637265abd23"})
MATCH (c:CommunityOfPractice {name: "Procurement"})
MERGE (g)-[:accountable_community]->(c);

// Signal 3: the Alternative Media community's practice names captioning. Multimedia &
// Video Production also names it but has no members at any campus.
MATCH (g:Guidance {unique_id: "f6df870190d64e2089f6c985c46f5d1d"})
MATCH (c:CommunityOfPractice {name: "Alternative Media"})
MERGE (g)-[:accountable_community]->(c);

// Signals 1+3: owner Zach Oshri is a member of Academic Technology, and the content is
// Canvas/LMS faculty guides.
MATCH (g:Guidance {unique_id: "5bdfb2fe90d0419cb1359ff2de48edae"})
MATCH (c:CommunityOfPractice {name: "Academic Technology"})
MERGE (g)-[:accountable_community]->(c);

// Signal 3, both halves: all nine subject pages attached in section 1 address "web
// developers and content creators", which is exactly the split between these two
// communities. Assigning one alone would drop the audience the pages name.
MATCH (g:Guidance {unique_id: "b84b0f46b2f64332b67abd5014efe725"})
MATCH (c:CommunityOfPractice {name: "Web & Mobile Development"})
MERGE (g)-[:accountable_community]->(c);

MATCH (g:Guidance {unique_id: "b84b0f46b2f64332b67abd5014efe725"})
MATCH (c:CommunityOfPractice {name: "Web Content Contributors"})
MERGE (g)-[:accountable_community]->(c);

// Signal 1, both halves: owner Zach Oshri is a member of both, and the node is the ATI
// instructional-materials priority overview, which is broader than either alone. The
// sibling Accessibility Compliance for Digital Teaching & Learning already carries a
// pair, so a pair is precedented on this set.
MATCH (g:Guidance {unique_id: "4d43f6f74e0f4d29bd351db948a6d9fa"})
MATCH (c:CommunityOfPractice {name: "Academic Technology"})
MERGE (g)-[:accountable_community]->(c);

MATCH (g:Guidance {unique_id: "4d43f6f74e0f4d29bd351db948a6d9fa"})
MATCH (c:CommunityOfPractice {name: "Alternative Media"})
MERGE (g)-[:accountable_community]->(c);
