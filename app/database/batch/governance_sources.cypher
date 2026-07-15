// governance_sources.cypher
// GENERATED from app/database/ontology/governance_seed.md by
//   app/database/tools/generate_governance_cypher.py — do not edit by hand.
//
// RUN AFTER governance_seed.cypher — each statement MATCHes an existing
// governance node, then MERGEs the source (Document for .pdf URLs by
// Document.hash, else Webpage by url) and the (gov)-[:is_sourced_from]->(src)
// edge. Idempotent + deduped: a URL cited by several nodes is one node with
// several edges. `unique_id` minted ON CREATE; edge.added_date = source's
// `accessed` date.
//
// 102 edges -> 21 Document + 73 Webpage unique source nodes.
// Requires Neo4j 4.3+ for randomUUID().

// ==== Law ===============================================================

// Americans with Disabilities Act of 1990
MATCH (n:Law {title: "Americans with Disabilities Act of 1990"})
MERGE (s:Webpage {url: "https://www.ada.gov/law-and-regs/ada/"})
ON CREATE SET s.unique_id = replace(randomUUID(), '-', ''),
    s.name = "ADA.gov — Law & Regulations (Americans with Disabilities Act)",
    s.include_in_report = true
MERGE (n)-[r:is_sourced_from]->(s)
ON CREATE SET r.added_date = date("2026-07-10");

MATCH (n:Law {title: "Americans with Disabilities Act of 1990"})
MERGE (s:Webpage {url: "https://en.wikipedia.org/wiki/Americans_with_Disabilities_Act_of_1990"})
ON CREATE SET s.unique_id = replace(randomUUID(), '-', ''),
    s.name = "Americans with Disabilities Act of 1990 — Wikipedia",
    s.include_in_report = true
MERGE (n)-[r:is_sourced_from]->(s)
ON CREATE SET r.added_date = date("2026-07-10");

// ADA Amendments Act of 2008
MATCH (n:Law {title: "ADA Amendments Act of 2008"})
MERGE (s:Document {hash: "77b42de28dfd5dba570c8ce723d04e9c793df20e"})
ON CREATE SET s.unique_id = replace(randomUUID(), '-', ''),
    s.name = "Public Law 110-325 — ADA Amendments Act of 2008 (congress.gov)",
    s.uri_path = "https://www.congress.gov/110/plaws/publ325/PLAW-110publ325.pdf",
    s.include_in_report = true
MERGE (n)-[r:is_sourced_from]->(s)
ON CREATE SET r.added_date = date("2026-07-10");

MATCH (n:Law {title: "ADA Amendments Act of 2008"})
MERGE (s:Webpage {url: "https://www.eeoc.gov/statutes/ada-amendments-act-2008"})
ON CREATE SET s.unique_id = replace(randomUUID(), '-', ''),
    s.name = "ADA Amendments Act of 2008 — U.S. EEOC",
    s.include_in_report = true
MERGE (n)-[r:is_sourced_from]->(s)
ON CREATE SET r.added_date = date("2026-07-10");

// Rehabilitation Act of 1973, Section 504
MATCH (n:Law {title: "Rehabilitation Act of 1973, Section 504"})
MERGE (s:Webpage {url: "https://www.dol.gov/agencies/oasam/centers-offices/civil-rights-center/statutes/section-504-rehabilitation-act-of-1973"})
ON CREATE SET s.unique_id = replace(randomUUID(), '-', ''),
    s.name = "Section 504, Rehabilitation Act of 1973 — U.S. Department of Labor",
    s.include_in_report = true
MERGE (n)-[r:is_sourced_from]->(s)
ON CREATE SET r.added_date = date("2026-07-10");

MATCH (n:Law {title: "Rehabilitation Act of 1973, Section 504"})
MERGE (s:Document {hash: "fe413a3d71a81dfa3bb5c8072e49e5a8dd89727b"})
ON CREATE SET s.unique_id = replace(randomUUID(), '-', ''),
    s.name = "Rehabilitation Act of 1973 (Public Law 93-112) — govinfo.gov",
    s.uri_path = "https://www.govinfo.gov/content/pkg/COMPS-799/pdf/COMPS-799.pdf",
    s.include_in_report = true
MERGE (n)-[r:is_sourced_from]->(s)
ON CREATE SET r.added_date = date("2026-07-10");

// Rehabilitation Act of 1973, Section 508
MATCH (n:Law {title: "Rehabilitation Act of 1973, Section 508"})
MERGE (s:Webpage {url: "https://www.section508.gov/manage/laws-and-policies/section-508-law/"})
ON CREATE SET s.unique_id = replace(randomUUID(), '-', ''),
    s.name = "Section 508 of the Rehabilitation Act, as amended — Section508.gov",
    s.include_in_report = true
MERGE (n)-[r:is_sourced_from]->(s)
ON CREATE SET r.added_date = date("2026-07-10");

MATCH (n:Law {title: "Rehabilitation Act of 1973, Section 508"})
MERGE (s:Webpage {url: "https://www.dol.gov/agencies/oasam/regulatory/statutes/section-508-rehabilitation-act-of-1973"})
ON CREATE SET s.unique_id = replace(randomUUID(), '-', ''),
    s.name = "Section 508, Rehabilitation Act of 1973 — U.S. Department of Labor",
    s.include_in_report = true
MERGE (n)-[r:is_sourced_from]->(s)
ON CREATE SET r.added_date = date("2026-07-10");

// Rehabilitation Act of 1973, Section 501
MATCH (n:Law {title: "Rehabilitation Act of 1973, Section 501"})
MERGE (s:Webpage {url: "https://www.eeoc.gov/rehabilitation-act-1973"})
ON CREATE SET s.unique_id = replace(randomUUID(), '-', ''),
    s.name = "Rehabilitation Act of 1973 — U.S. EEOC",
    s.include_in_report = true
MERGE (n)-[r:is_sourced_from]->(s)
ON CREATE SET r.added_date = date("2026-07-10");

MATCH (n:Law {title: "Rehabilitation Act of 1973, Section 501"})
MERGE (s:Document {hash: "fe413a3d71a81dfa3bb5c8072e49e5a8dd89727b"})
ON CREATE SET s.unique_id = replace(randomUUID(), '-', ''),
    s.name = "Rehabilitation Act of 1973 (Public Law 93-112) — govinfo.gov",
    s.uri_path = "https://www.govinfo.gov/content/pkg/COMPS-799/pdf/COMPS-799.pdf",
    s.include_in_report = true
MERGE (n)-[r:is_sourced_from]->(s)
ON CREATE SET r.added_date = date("2026-07-10");

// Rehabilitation Act of 1973, Section 503
MATCH (n:Law {title: "Rehabilitation Act of 1973, Section 503"})
MERGE (s:Webpage {url: "https://www.dol.gov/agencies/ofccp/section-503"})
ON CREATE SET s.unique_id = replace(randomUUID(), '-', ''),
    s.name = "Section 503 — U.S. Department of Labor, OFCCP",
    s.include_in_report = true
MERGE (n)-[r:is_sourced_from]->(s)
ON CREATE SET r.added_date = date("2026-07-10");

MATCH (n:Law {title: "Rehabilitation Act of 1973, Section 503"})
MERGE (s:Webpage {url: "https://www.dol.gov/agencies/ofccp/section-503/law"})
ON CREATE SET s.unique_id = replace(randomUUID(), '-', ''),
    s.name = "Section 503 of the Rehabilitation Act of 1973, as Amended — U.S. DOL",
    s.include_in_report = true
MERGE (n)-[r:is_sourced_from]->(s)
ON CREATE SET r.added_date = date("2026-07-10");

// Telecommunications Act of 1996, Section 255
MATCH (n:Law {title: "Telecommunications Act of 1996, Section 255"})
MERGE (s:Document {hash: "912e4e55d1a89efe3964780b4abdda169fa8965c"})
ON CREATE SET s.unique_id = replace(randomUUID(), '-', ''),
    s.name = "Public Law 104-104 — Telecommunications Act of 1996 (congress.gov)",
    s.uri_path = "https://www.congress.gov/104/plaws/publ104/PLAW-104publ104.pdf",
    s.include_in_report = true
MERGE (n)-[r:is_sourced_from]->(s)
ON CREATE SET r.added_date = date("2026-07-10");

MATCH (n:Law {title: "Telecommunications Act of 1996, Section 255"})
MERGE (s:Webpage {url: "https://www.access-board.gov/about/law/ta.html"})
ON CREATE SET s.unique_id = replace(randomUUID(), '-', ''),
    s.name = "Telecommunications Act — U.S. Access Board",
    s.include_in_report = true
MERGE (n)-[r:is_sourced_from]->(s)
ON CREATE SET r.added_date = date("2026-07-10");

// 21st Century Communications and Video Accessibility Act of 2010
MATCH (n:Law {title: "21st Century Communications and Video Accessibility Act of 2010"})
MERGE (s:Webpage {url: "https://www.fcc.gov/consumers/guides/21st-century-communications-and-video-accessibility-act-cvaa"})
ON CREATE SET s.unique_id = replace(randomUUID(), '-', ''),
    s.name = "21st Century Communications and Video Accessibility Act (CVAA) — FCC",
    s.include_in_report = true
MERGE (n)-[r:is_sourced_from]->(s)
ON CREATE SET r.added_date = date("2026-07-10");

MATCH (n:Law {title: "21st Century Communications and Video Accessibility Act of 2010"})
MERGE (s:Webpage {url: "https://www.govinfo.gov/link/plaw/111/public/260"})
ON CREATE SET s.unique_id = replace(randomUUID(), '-', ''),
    s.name = "Public Law 111-260 — govinfo.gov",
    s.include_in_report = true
MERGE (n)-[r:is_sourced_from]->(s)
ON CREATE SET r.added_date = date("2026-07-10");

// Assistive Technology Act of 1998
MATCH (n:Law {title: "Assistive Technology Act of 1998"})
MERGE (s:Document {hash: "8a1d903a3b94d02f70f547cbc5677f333bcb7e9a"})
ON CREATE SET s.unique_id = replace(randomUUID(), '-', ''),
    s.name = "Public Law 105-394 — Assistive Technology Act of 1998 (congress.gov)",
    s.uri_path = "https://www.congress.gov/105/plaws/publ394/PLAW-105publ394.pdf",
    s.include_in_report = true
MERGE (n)-[r:is_sourced_from]->(s)
ON CREATE SET r.added_date = date("2026-07-10");

MATCH (n:Law {title: "Assistive Technology Act of 1998"})
MERGE (s:Webpage {url: "https://www.govinfo.gov/content/pkg/PLAW-108publ364/html/PLAW-108publ364.htm"})
ON CREATE SET s.unique_id = replace(randomUUID(), '-', ''),
    s.name = "Public Law 108-364 — Assistive Technology Act of 2004 (govinfo.gov)",
    s.include_in_report = true
MERGE (n)-[r:is_sourced_from]->(s)
ON CREATE SET r.added_date = date("2026-07-10");

// Individuals with Disabilities Education Act
MATCH (n:Law {title: "Individuals with Disabilities Education Act"})
MERGE (s:Webpage {url: "https://sites.ed.gov/idea/IDEA-History"})
ON CREATE SET s.unique_id = replace(randomUUID(), '-', ''),
    s.name = "A History of the Individuals with Disabilities Education Act — U.S. Dept. of Education",
    s.include_in_report = true
MERGE (n)-[r:is_sourced_from]->(s)
ON CREATE SET r.added_date = date("2026-07-10");

MATCH (n:Law {title: "Individuals with Disabilities Education Act"})
MERGE (s:Webpage {url: "https://en.wikipedia.org/wiki/Individuals_with_Disabilities_Education_Act"})
ON CREATE SET s.unique_id = replace(randomUUID(), '-', ''),
    s.name = "Individuals with Disabilities Education Act — Wikipedia",
    s.include_in_report = true
MERGE (n)-[r:is_sourced_from]->(s)
ON CREATE SET r.added_date = date("2026-07-10");

// California Government Code Section 7405
MATCH (n:Law {title: "California Government Code Section 7405"})
MERGE (s:Webpage {url: "https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=GOV&sectionNum=7405."})
ON CREATE SET s.unique_id = replace(randomUUID(), '-', ''),
    s.name = "California Government Code Section 7405 — California Legislative Information",
    s.include_in_report = true
MERGE (n)-[r:is_sourced_from]->(s)
ON CREATE SET r.added_date = date("2026-07-10");

MATCH (n:Law {title: "California Government Code Section 7405"})
MERGE (s:Webpage {url: "https://codes.findlaw.com/ca/government-code/gov-sect-7405/"})
ON CREATE SET s.unique_id = replace(randomUUID(), '-', ''),
    s.name = "California Government Code - GOV Section 7405 — FindLaw",
    s.include_in_report = true
MERGE (n)-[r:is_sourced_from]->(s)
ON CREATE SET r.added_date = date("2026-07-10");

// California Government Code Section 11135
MATCH (n:Law {title: "California Government Code Section 11135"})
MERGE (s:Webpage {url: "https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=GOV&sectionNum=11135."})
ON CREATE SET s.unique_id = replace(randomUUID(), '-', ''),
    s.name = "California Government Code Section 11135 — California Legislative Information",
    s.include_in_report = true
MERGE (n)-[r:is_sourced_from]->(s)
ON CREATE SET r.added_date = date("2026-07-10");

MATCH (n:Law {title: "California Government Code Section 11135"})
MERGE (s:Webpage {url: "https://law.justia.com/codes/california/code-gov/title-2/division-3/part-1/chapter-1/article-9-5/section-11135/"})
ON CREATE SET s.unique_id = replace(randomUUID(), '-', ''),
    s.name = "California Government Code Section 11135 (2025) — Justia",
    s.include_in_report = true
MERGE (n)-[r:is_sourced_from]->(s)
ON CREATE SET r.added_date = date("2026-07-10");

// California Government Code Section 11546.7
MATCH (n:Law {title: "California Government Code Section 11546.7"})
MERGE (s:Webpage {url: "https://leginfo.legislature.ca.gov/faces/billNavClient.xhtml?bill_id=201720180AB434"})
ON CREATE SET s.unique_id = replace(randomUUID(), '-', ''),
    s.name = "AB-434 State Web accessibility: standard and reports — California Legislative Information",
    s.include_in_report = true
MERGE (n)-[r:is_sourced_from]->(s)
ON CREATE SET r.added_date = date("2026-07-10");

MATCH (n:Law {title: "California Government Code Section 11546.7"})
MERGE (s:Webpage {url: "https://www.adatitleiii.com/2017/12/california-passes-website-accessibility-requirements-applicable-to-state-agencies/"})
ON CREATE SET s.unique_id = replace(randomUUID(), '-', ''),
    s.name = "California Passes Website Accessibility Requirements Applicable to State Agencies — ADA Title III blog",
    s.include_in_report = true
MERGE (n)-[r:is_sourced_from]->(s)
ON CREATE SET r.added_date = date("2026-07-10");

// California Assembly Bill 434 (2017)
MATCH (n:Law {title: "California Assembly Bill 434 (2017)"})
MERGE (s:Webpage {url: "https://leginfo.legislature.ca.gov/faces/billNavClient.xhtml?bill_id=201720180AB434"})
ON CREATE SET s.unique_id = replace(randomUUID(), '-', ''),
    s.name = "AB-434 State Web accessibility: standard and reports — California Legislative Information",
    s.include_in_report = true
MERGE (n)-[r:is_sourced_from]->(s)
ON CREATE SET r.added_date = date("2026-07-10");

MATCH (n:Law {title: "California Assembly Bill 434 (2017)"})
MERGE (s:Webpage {url: "https://www.boia.org/blog/what-is-californias-ab-434-accessibility-law-and-why-it-matters"})
ON CREATE SET s.unique_id = replace(randomUUID(), '-', ''),
    s.name = "What Is California's AB 434 Accessibility Law? — Bureau of Internet Accessibility",
    s.include_in_report = true
MERGE (n)-[r:is_sourced_from]->(s)
ON CREATE SET r.added_date = date("2026-07-10");

// Unruh Civil Rights Act (California Civil Code Section 51)
MATCH (n:Law {title: "Unruh Civil Rights Act (California Civil Code Section 51)"})
MERGE (s:Webpage {url: "https://www.dor.ca.gov/Home/UnruhCivilRightsAct"})
ON CREATE SET s.unique_id = replace(randomUUID(), '-', ''),
    s.name = "Unruh Civil Rights Act — California Department of Rehabilitation",
    s.include_in_report = true
MERGE (n)-[r:is_sourced_from]->(s)
ON CREATE SET r.added_date = date("2026-07-10");

MATCH (n:Law {title: "Unruh Civil Rights Act (California Civil Code Section 51)"})
MERGE (s:Webpage {url: "https://codes.findlaw.com/ca/civil-code/civ-sect-51/"})
ON CREATE SET s.unique_id = replace(randomUUID(), '-', ''),
    s.name = "California Civil Code Section 51 — FindLaw",
    s.include_in_report = true
MERGE (n)-[r:is_sourced_from]->(s)
ON CREATE SET r.added_date = date("2026-07-10");

// California Education Code Section 67302
MATCH (n:Law {title: "California Education Code Section 67302"})
MERGE (s:Webpage {url: "https://codes.findlaw.com/ca/education-code/edc-sect-67302.html"})
ON CREATE SET s.unique_id = replace(randomUUID(), '-', ''),
    s.name = "California Education Code Section 67302 — FindLaw",
    s.include_in_report = true
MERGE (n)-[r:is_sourced_from]->(s)
ON CREATE SET r.added_date = date("2026-07-10");

MATCH (n:Law {title: "California Education Code Section 67302"})
MERGE (s:Webpage {url: "https://www.leginfo.ca.gov/pub/99-00/bill/asm/ab_0401-0450/ab_422_bill_19990915_chaptered.html"})
ON CREATE SET s.unique_id = replace(randomUUID(), '-', ''),
    s.name = "AB 422 (chaptered 1999-09-15) — California Legislative Information",
    s.include_in_report = true
MERGE (n)-[r:is_sourced_from]->(s)
ON CREATE SET r.added_date = date("2026-07-10");

// ==== Case ==============================================================

// Payan v. Los Angeles Community College District (9th Cir. 2021)
MATCH (n:Case {title: "Payan v. Los Angeles Community College District (9th Cir. 2021)"})
MERGE (s:Document {hash: "1519a483db4b6baf930c711bafbe5e3b5991e671"})
ON CREATE SET s.unique_id = replace(randomUUID(), '-', ''),
    s.name = "Payan v. Los Angeles Community College District opinion (No. 19-56111)",
    s.uri_path = "https://cdn.ca9.uscourts.gov/datastore/opinions/2021/08/24/19-56111.pdf",
    s.include_in_report = true
MERGE (n)-[r:is_sourced_from]->(s)
ON CREATE SET r.added_date = date("2026-07-10");

MATCH (n:Case {title: "Payan v. Los Angeles Community College District (9th Cir. 2021)"})
MERGE (s:Webpage {url: "https://law.justia.com/cases/federal/appellate-courts/ca9/19-56111/19-56111-2021-08-24.html"})
ON CREATE SET s.unique_id = replace(randomUUID(), '-', ''),
    s.name = "Payan v. LACCD, No. 19-56111 (9th Cir. 2021) :: Justia",
    s.include_in_report = true
MERGE (n)-[r:is_sourced_from]->(s)
ON CREATE SET r.added_date = date("2026-07-10");

// Robles v. Domino's Pizza LLC (9th Cir. 2019)
MATCH (n:Case {title: "Robles v. Domino's Pizza LLC (9th Cir. 2019)"})
MERGE (s:Document {hash: "ad1a29a729be373dcf03df0d054a51d654451d39"})
ON CREATE SET s.unique_id = replace(randomUUID(), '-', ''),
    s.name = "Robles v. Domino's Pizza, LLC opinion (No. 17-55504)",
    s.uri_path = "https://cdn.ca9.uscourts.gov/datastore/opinions/2019/01/15/17-55504.pdf",
    s.include_in_report = true
MERGE (n)-[r:is_sourced_from]->(s)
ON CREATE SET r.added_date = date("2026-07-10");

MATCH (n:Case {title: "Robles v. Domino's Pizza LLC (9th Cir. 2019)"})
MERGE (s:Webpage {url: "https://law.justia.com/cases/federal/appellate-courts/ca9/17-55504/17-55504-2019-01-15.html"})
ON CREATE SET s.unique_id = replace(randomUUID(), '-', ''),
    s.name = "Robles v. Domino's Pizza, LLC, No. 17-55504 (9th Cir. 2019) :: Justia",
    s.include_in_report = true
MERGE (n)-[r:is_sourced_from]->(s)
ON CREATE SET r.added_date = date("2026-07-10");

// National Federation of the Blind v. Target Corp. (N.D. Cal.)
MATCH (n:Case {title: "National Federation of the Blind v. Target Corp. (N.D. Cal.)"})
MERGE (s:Webpage {url: "https://law.justia.com/cases/federal/district-courts/california/candce/3:2006cv01802/177622/210/"})
ON CREATE SET s.unique_id = replace(randomUUID(), '-', ''),
    s.name = "National Federation of the Blind et al v. Target Corporation, Doc. 210 (N.D. Cal. 2009) :: Justia",
    s.include_in_report = true
MERGE (n)-[r:is_sourced_from]->(s)
ON CREATE SET r.added_date = date("2026-07-10");

MATCH (n:Case {title: "National Federation of the Blind v. Target Corp. (N.D. Cal.)"})
MERGE (s:Webpage {url: "https://nfb.org/national-federation-blind-and-target-agree-class-action-settlement"})
ON CREATE SET s.unique_id = replace(randomUUID(), '-', ''),
    s.name = "National Federation of the Blind and Target Agree to Class Action Settlement (NFB)",
    s.include_in_report = true
MERGE (n)-[r:is_sourced_from]->(s)
ON CREATE SET r.added_date = date("2026-07-10");

// National Association of the Deaf v. Netflix (D. Mass. 2012)
MATCH (n:Case {title: "National Association of the Deaf v. Netflix (D. Mass. 2012)"})
MERGE (s:Webpage {url: "https://dredf.org/nad-v-netflix/"})
ON CREATE SET s.unique_id = replace(randomUUID(), '-', ''),
    s.name = "NAD v. Netflix (DREDF case page)",
    s.include_in_report = true
MERGE (n)-[r:is_sourced_from]->(s)
ON CREATE SET r.added_date = date("2026-07-10");

MATCH (n:Case {title: "National Association of the Deaf v. Netflix (D. Mass. 2012)"})
MERGE (s:Document {hash: "44065801d26064593fa75f64d24e392c074697d3"})
ON CREATE SET s.unique_id = replace(randomUUID(), '-', ''),
    s.name = "NAD v. Netflix Consent Decree (Oct. 2012)",
    s.uri_path = "https://dredf.org/wp-content/uploads/2011/06/netflix-consent-decree-10-10-12.pdf",
    s.include_in_report = true
MERGE (n)-[r:is_sourced_from]->(s)
ON CREATE SET r.added_date = date("2026-07-10");

// National Association of the Deaf v. Harvard University (D. Mass.)
MATCH (n:Case {title: "National Association of the Deaf v. Harvard University (D. Mass.)"})
MERGE (s:Webpage {url: "https://disabilitylawunited.org/case/online-content-lawsuit-harvard-mit/"})
ON CREATE SET s.unique_id = replace(randomUUID(), '-', ''),
    s.name = "NAD v. Harvard and NAD v. MIT (Disability Law United)",
    s.include_in_report = true
MERGE (n)-[r:is_sourced_from]->(s)
ON CREATE SET r.added_date = date("2026-07-10");

MATCH (n:Case {title: "National Association of the Deaf v. Harvard University (D. Mass.)"})
MERGE (s:Webpage {url: "https://www.cohenmilstein.com/case-study/national-association-deaf-et-al-v-harvard-and-mit/"})
ON CREATE SET s.unique_id = replace(randomUUID(), '-', ''),
    s.name = "NAD et al. v. Harvard and MIT (Cohen Milstein)",
    s.include_in_report = true
MERGE (n)-[r:is_sourced_from]->(s)
ON CREATE SET r.added_date = date("2026-07-10");

// National Association of the Deaf v. Massachusetts Institute of Technology (D. Mass.)
MATCH (n:Case {title: "National Association of the Deaf v. Massachusetts Institute of Technology (D. Mass.)"})
MERGE (s:Webpage {url: "https://clearinghouse.net/case/14353/"})
ON CREATE SET s.unique_id = replace(randomUUID(), '-', ''),
    s.name = "NAD v. Massachusetts Institute of Technology, 3:15-cv-30024 (Civil Rights Litigation Clearinghouse)",
    s.include_in_report = true
MERGE (n)-[r:is_sourced_from]->(s)
ON CREATE SET r.added_date = date("2026-07-10");

MATCH (n:Case {title: "National Association of the Deaf v. Massachusetts Institute of Technology (D. Mass.)"})
MERGE (s:Webpage {url: "https://disabilitylawunited.org/case/online-content-lawsuit-harvard-mit/"})
ON CREATE SET s.unique_id = replace(randomUUID(), '-', ''),
    s.name = "NAD v. Harvard and NAD v. MIT (Disability Law United)",
    s.include_in_report = true
MERGE (n)-[r:is_sourced_from]->(s)
ON CREATE SET r.added_date = date("2026-07-10");

// Enyart v. National Conference of Bar Examiners (9th Cir. 2011)
MATCH (n:Case {title: "Enyart v. National Conference of Bar Examiners (9th Cir. 2011)"})
MERGE (s:Webpage {url: "https://caselaw.findlaw.com/court/us-9th-circuit/1551247.html"})
ON CREATE SET s.unique_id = replace(randomUUID(), '-', ''),
    s.name = "Enyart v. National Conference of Bar Examiners, Inc. (9th Cir. 2011) :: FindLaw",
    s.include_in_report = true
MERGE (n)-[r:is_sourced_from]->(s)
ON CREATE SET r.added_date = date("2026-07-10");

MATCH (n:Case {title: "Enyart v. National Conference of Bar Examiners (9th Cir. 2011)"})
MERGE (s:Webpage {url: "https://dralegal.org/case/enyart-v-national-conference-of-bar-examiners-ncbe/"})
ON CREATE SET s.unique_id = replace(randomUUID(), '-', ''),
    s.name = "Enyart v. NCBE (Disability Rights Advocates)",
    s.include_in_report = true
MERGE (n)-[r:is_sourced_from]->(s)
ON CREATE SET r.added_date = date("2026-07-10");

// Gil v. Winn-Dixie Stores, Inc. (11th Cir. 2021)
MATCH (n:Case {title: "Gil v. Winn-Dixie Stores, Inc. (11th Cir. 2021)"})
MERGE (s:Webpage {url: "https://law.justia.com/cases/federal/appellate-courts/ca11/17-13467/17-13467-2021-04-07.html"})
ON CREATE SET s.unique_id = replace(randomUUID(), '-', ''),
    s.name = "Gil v. Winn-Dixie Stores, Inc., No. 17-13467 (11th Cir. 2021) :: Justia",
    s.include_in_report = true
MERGE (n)-[r:is_sourced_from]->(s)
ON CREATE SET r.added_date = date("2026-07-10");

MATCH (n:Case {title: "Gil v. Winn-Dixie Stores, Inc. (11th Cir. 2021)"})
MERGE (s:Webpage {url: "https://www.hklaw.com/en/insights/publications/2022/01/11th-circuit-vacates-opinion-holding-that-websites-are-not-ada-public"})
ON CREATE SET s.unique_id = replace(randomUUID(), '-', ''),
    s.name = "Eleventh Circuit Vacates Opinion Holding Websites Are Not ADA Public Accommodations (Holland & Knight)",
    s.include_in_report = true
MERGE (n)-[r:is_sourced_from]->(s)
ON CREATE SET r.added_date = date("2026-07-10");

// Authors Guild, Inc. v. HathiTrust (2d Cir. 2014)
MATCH (n:Case {title: "Authors Guild, Inc. v. HathiTrust (2d Cir. 2014)"})
MERGE (s:Webpage {url: "https://law.justia.com/cases/federal/appellate-courts/ca2/12-4547/12-4547-2014-06-10.html"})
ON CREATE SET s.unique_id = replace(randomUUID(), '-', ''),
    s.name = "Authors Guild, Inc. v. HathiTrust, No. 12-4547 (2d Cir. 2014) :: Justia",
    s.include_in_report = true
MERGE (n)-[r:is_sourced_from]->(s)
ON CREATE SET r.added_date = date("2026-07-10");

MATCH (n:Case {title: "Authors Guild, Inc. v. HathiTrust (2d Cir. 2014)"})
MERGE (s:Document {hash: "a06c50c6766785e54170a403f5cba66d0fe68d77"})
ON CREATE SET s.unique_id = replace(randomUUID(), '-', ''),
    s.name = "Authors Guild, Inc. v. HathiTrust, 755 F.3d 87 (2d Cir. 2014) (U.S. Copyright Office summary)",
    s.uri_path = "https://www.copyright.gov/fair-use/summaries/authorsguild-hathitrust-2dcir2014.pdf",
    s.include_in_report = true
MERGE (n)-[r:is_sourced_from]->(s)
ON CREATE SET r.added_date = date("2026-07-10");

// United States v. Miami University (S.D. Ohio consent decree, 2016)
MATCH (n:Case {title: "United States v. Miami University (S.D. Ohio consent decree, 2016)"})
MERGE (s:Webpage {url: "https://www.justice.gov/archives/opa/pr/miami-university-agrees-overhaul-critical-technologies-settle-disability-discrimination"})
ON CREATE SET s.unique_id = replace(randomUUID(), '-', ''),
    s.name = "Miami University Agrees to Overhaul Critical Technologies to Settle Disability Discrimination Lawsuit (DOJ)",
    s.include_in_report = true
MERGE (n)-[r:is_sourced_from]->(s)
ON CREATE SET r.added_date = date("2026-07-10");

MATCH (n:Case {title: "United States v. Miami University (S.D. Ohio consent decree, 2016)"})
MERGE (s:Webpage {url: "https://archive.ada.gov/miami_university_cd.html"})
ON CREATE SET s.unique_id = replace(randomUUID(), '-', ''),
    s.name = "Consent Decree: Aleeha Dudley and the United States v. Miami University (ADA.gov archive)",
    s.include_in_report = true
MERGE (n)-[r:is_sourced_from]->(s)
ON CREATE SET r.added_date = date("2026-07-10");

// United States v. Louisiana Tech University (DOJ settlement, 2013)
MATCH (n:Case {title: "United States v. Louisiana Tech University (DOJ settlement, 2013)"})
MERGE (s:Webpage {url: "https://archive.ada.gov/louisiana-tech.htm"})
ON CREATE SET s.unique_id = replace(randomUUID(), '-', ''),
    s.name = "Settlement Agreement between the United States and Louisiana Tech University (ADA.gov archive)",
    s.include_in_report = true
MERGE (n)-[r:is_sourced_from]->(s)
ON CREATE SET r.added_date = date("2026-07-10");

MATCH (n:Case {title: "United States v. Louisiana Tech University (DOJ settlement, 2013)"})
MERGE (s:Webpage {url: "https://www.justice.gov/archives/opa/pr/justice-department-settles-louisiana-tech-university-over-inaccessible-course-materials"})
ON CREATE SET s.unique_id = replace(randomUUID(), '-', ''),
    s.name = "Justice Department Settles with Louisiana Tech University Over Inaccessible Course Materials (DOJ)",
    s.include_in_report = true
MERGE (n)-[r:is_sourced_from]->(s)
ON CREATE SET r.added_date = date("2026-07-10");

// United States v. Regents of the University of California (Berkeley) (consent decree, 2022)
MATCH (n:Case {title: "United States v. Regents of the University of California (Berkeley) (consent decree, 2022)"})
MERGE (s:Document {hash: "8dde69444f469f712e47ca297fa52a61ff9445a5"})
ON CREATE SET s.unique_id = replace(randomUUID(), '-', ''),
    s.name = "Consent Decree, United States v. UC Berkeley (DOJ)",
    s.uri_path = "https://www.justice.gov/d9/case-documents/attachments/2022/11/21/consent_decree_-_u.s._v._uc_berkeley.pdf",
    s.include_in_report = true
MERGE (n)-[r:is_sourced_from]->(s)
ON CREATE SET r.added_date = date("2026-07-10");

MATCH (n:Case {title: "United States v. Regents of the University of California (Berkeley) (consent decree, 2022)"})
MERGE (s:Webpage {url: "https://www.justice.gov/archives/opa/pr/justice-department-secures-agreement-university-california-berkeley-make-online-content"})
ON CREATE SET s.unique_id = replace(randomUUID(), '-', ''),
    s.name = "Justice Department Secures Agreement with UC Berkeley to Make Online Content Accessible (DOJ)",
    s.include_in_report = true
MERGE (n)-[r:is_sourced_from]->(s)
ON CREATE SET r.added_date = date("2026-07-10");

// National Federation of the Blind v. Pennsylvania State University (OCR resolution, 2011)
MATCH (n:Case {title: "National Federation of the Blind v. Pennsylvania State University (OCR resolution, 2011)"})
MERGE (s:Webpage {url: "https://nfb.org/about-us/press-room/national-federation-blind-and-penn-state-resolve-accessibility-complaint"})
ON CREATE SET s.unique_id = replace(randomUUID(), '-', ''),
    s.name = "National Federation of the Blind and Penn State Resolve Accessibility Complaint (NFB)",
    s.include_in_report = true
MERGE (n)-[r:is_sourced_from]->(s)
ON CREATE SET r.added_date = date("2026-07-10");

MATCH (n:Case {title: "National Federation of the Blind v. Pennsylvania State University (OCR resolution, 2011)"})
MERGE (s:Webpage {url: "https://accessibility.psu.edu/nfbpsusettlement/"})
ON CREATE SET s.unique_id = replace(randomUUID(), '-', ''),
    s.name = "Settlement Between Penn State University and National Federation of the Blind (Penn State)",
    s.include_in_report = true
MERGE (n)-[r:is_sourced_from]->(s)
ON CREATE SET r.added_date = date("2026-07-10");

// South Carolina Technical College System (OCR Compliance Review No. 11-11-6002, 2013)
MATCH (n:Case {title: "South Carolina Technical College System (OCR Compliance Review No. 11-11-6002, 2013)"})
MERGE (s:Document {hash: "70dfd3d1b39e550bbd2acedcee30f360a4c3deae"})
ON CREATE SET s.unique_id = replace(randomUUID(), '-', ''),
    s.name = "OCR Resolution Letter, South Carolina Technical College System (Compliance Review No. 11-11-6002)",
    s.uri_path = "https://www.ed.gov/media/document/11116002-apdf-31104.pdf",
    s.include_in_report = true
MERGE (n)-[r:is_sourced_from]->(s)
ON CREATE SET r.added_date = date("2026-07-10");

MATCH (n:Case {title: "South Carolina Technical College System (OCR Compliance Review No. 11-11-6002, 2013)"})
MERGE (s:Document {hash: "3aad38a13dc1a9467d1da0ce49ea259c662cae42"})
ON CREATE SET s.unique_id = replace(randomUUID(), '-', ''),
    s.name = "Resolution Agreement, South Carolina Technical College System",
    s.uri_path = "https://www.ed.gov/sites/ed/files/about/offices/list/ocr/docs/investigations/11116002-b.pdf",
    s.include_in_report = true
MERGE (n)-[r:is_sourced_from]->(s)
ON CREATE SET r.added_date = date("2026-07-10");

// California State University, Long Beach (OCR Docket No. 09-99-2041, 1999)
MATCH (n:Case {title: "California State University, Long Beach (OCR Docket No. 09-99-2041, 1999)"})
MERGE (s:Webpage {url: "http://www.southwestada.org/html/topical/FAPSI/OCR/csu-lb.html"})
ON CREATE SET s.unique_id = replace(randomUUID(), '-', ''),
    s.name = "OCR Letter: California State University - Long Beach (Docket 09-99-2041)",
    s.include_in_report = true
MERGE (n)-[r:is_sourced_from]->(s)
ON CREATE SET r.added_date = date("2026-07-10");

// California State University, Los Angeles (OCR Docket No. 09-97-2002, 1997)
MATCH (n:Case {title: "California State University, Los Angeles (OCR Docket No. 09-97-2002, 1997)"})
MERGE (s:Webpage {url: "http://www.southwestada.org/html/topical/FAPSI/OCR/csu-la.html"})
ON CREATE SET s.unique_id = replace(randomUUID(), '-', ''),
    s.name = "OCR Letter: California State University - Los Angeles (Docket 09-97-2002)",
    s.include_in_report = true
MERGE (n)-[r:is_sourced_from]->(s)
ON CREATE SET r.added_date = date("2026-07-10");

// ==== Directive =========================================================

// DOJ Title II Web and Mobile Accessibility Final Rule (2024)
MATCH (n:Directive {title: "DOJ Title II Web and Mobile Accessibility Final Rule (2024)"})
MERGE (s:Webpage {url: "https://www.federalregister.gov/documents/2024/04/24/2024-07758/nondiscrimination-on-the-basis-of-disability-accessibility-of-web-information-and-services-of-state"})
ON CREATE SET s.unique_id = replace(randomUUID(), '-', ''),
    s.name = "Nondiscrimination on the Basis of Disability; Accessibility of Web Information and Services of State and Local Government Entities",
    s.include_in_report = true
MERGE (n)-[r:is_sourced_from]->(s)
ON CREATE SET r.added_date = date("2026-07-10");

MATCH (n:Directive {title: "DOJ Title II Web and Mobile Accessibility Final Rule (2024)"})
MERGE (s:Webpage {url: "https://www.ada.gov/resources/2024-03-08-web-rule/"})
ON CREATE SET s.unique_id = replace(randomUUID(), '-', ''),
    s.name = "Fact Sheet: New Rule on the Accessibility of Web Content and Mobile Apps",
    s.include_in_report = true
MERGE (n)-[r:is_sourced_from]->(s)
ON CREATE SET r.added_date = date("2026-07-10");

MATCH (n:Directive {title: "DOJ Title II Web and Mobile Accessibility Final Rule (2024)"})
MERGE (s:Webpage {url: "https://www.federalregister.gov/documents/2026/04/20/2026-07663/extension-of-compliance-dates-for-nondiscrimination-on-the-basis-of-disability-accessibility-of-web"})
ON CREATE SET s.unique_id = replace(randomUUID(), '-', ''),
    s.name = "Extension of Compliance Dates (interim final rule)",
    s.include_in_report = true
MERGE (n)-[r:is_sourced_from]->(s)
ON CREATE SET r.added_date = date("2026-07-10");

// Revised Section 508 Standards and Section 255 Guidelines (ICT Refresh)
MATCH (n:Directive {title: "Revised Section 508 Standards and Section 255 Guidelines (ICT Refresh)"})
MERGE (s:Webpage {url: "https://www.access-board.gov/ict/"})
ON CREATE SET s.unique_id = replace(randomUUID(), '-', ''),
    s.name = "Revised 508 Standards and 255 Guidelines",
    s.include_in_report = true
MERGE (n)-[r:is_sourced_from]->(s)
ON CREATE SET r.added_date = date("2026-07-10");

MATCH (n:Directive {title: "Revised Section 508 Standards and Section 255 Guidelines (ICT Refresh)"})
MERGE (s:Webpage {url: "https://www.federalregister.gov/documents/2017/03/02/2017-04059/information-and-communication-technology-ict-standards-and-guidelines"})
ON CREATE SET s.unique_id = replace(randomUUID(), '-', ''),
    s.name = "Information and Communication Technology (ICT) Standards and Guidelines",
    s.include_in_report = true
MERGE (n)-[r:is_sourced_from]->(s)
ON CREATE SET r.added_date = date("2026-07-10");

// ADA Title II Regulation (28 CFR Part 35), 2010 Revision
MATCH (n:Directive {title: "ADA Title II Regulation (28 CFR Part 35), 2010 Revision"})
MERGE (s:Webpage {url: "https://www.ada.gov/law-and-regs/regulations/title-ii-2010-regulations/"})
ON CREATE SET s.unique_id = replace(randomUUID(), '-', ''),
    s.name = "Americans with Disabilities Act Title II Regulations",
    s.include_in_report = true
MERGE (n)-[r:is_sourced_from]->(s)
ON CREATE SET r.added_date = date("2026-07-10");

// ADA Title III Regulation (28 CFR Part 36), 2010 Revision
MATCH (n:Directive {title: "ADA Title III Regulation (28 CFR Part 36), 2010 Revision"})
MERGE (s:Webpage {url: "https://www.ada.gov/law-and-regs/regulations/title-iii-regulations/"})
ON CREATE SET s.unique_id = replace(randomUUID(), '-', ''),
    s.name = "Americans with Disabilities Act Title III Regulations",
    s.include_in_report = true
MERGE (n)-[r:is_sourced_from]->(s)
ON CREATE SET r.added_date = date("2026-07-10");

// CSU Executive Order 926: Policy on Disability Support and Accommodations
MATCH (n:Directive {title: "CSU Executive Order 926: Policy on Disability Support and Accommodations"})
MERGE (s:Document {hash: "58b919eb24b6dbdcb073c0168af85371a3189a08"})
ON CREATE SET s.unique_id = replace(randomUUID(), '-', ''),
    s.name = "SJSU Presidential Directive 2007-02 (references EO 926 issuance)",
    s.uri_path = "https://www.sjsu.edu/accessibility/docs/PD_2007-02.pdf",
    s.include_in_report = true
MERGE (n)-[r:is_sourced_from]->(s)
ON CREATE SET r.added_date = date("2026-07-10");

MATCH (n:Directive {title: "CSU Executive Order 926: Policy on Disability Support and Accommodations"})
MERGE (s:Document {hash: "d1ce43995ed3a8ba7af13579137a1f2da119e71c"})
ON CREATE SET s.unique_id = replace(randomUUID(), '-', ''),
    s.name = "Executive Order 1111 (states it supersedes EO 926)",
    s.uri_path = "https://www.calstatela.edu/sites/default/files/eo-1111.pdf",
    s.include_in_report = true
MERGE (n)-[r:is_sourced_from]->(s)
ON CREATE SET r.added_date = date("2026-07-10");

// CSU Executive Order 1111: Board of Trustees Policy on Disability Support and Accommodations
MATCH (n:Directive {title: "CSU Executive Order 1111: Board of Trustees Policy on Disability Support and Accommodations"})
MERGE (s:Document {hash: "d1ce43995ed3a8ba7af13579137a1f2da119e71c"})
ON CREATE SET s.unique_id = replace(randomUUID(), '-', ''),
    s.name = "Executive Order 1111 (full text, signed by Chancellor Timothy P. White)",
    s.uri_path = "https://www.calstatela.edu/sites/default/files/eo-1111.pdf",
    s.include_in_report = true
MERGE (n)-[r:is_sourced_from]->(s)
ON CREATE SET r.added_date = date("2026-07-10");

// Executive Order 13548: Increasing Federal Employment of Individuals with Disabilities (2010)
MATCH (n:Directive {title: "Executive Order 13548: Increasing Federal Employment of Individuals with Disabilities (2010)"})
MERGE (s:Webpage {url: "https://www.federalregister.gov/documents/2010/07/30/2010-18988/increasing-federal-employment-of-individuals-with-disabilities"})
ON CREATE SET s.unique_id = replace(randomUUID(), '-', ''),
    s.name = "Increasing Federal Employment of Individuals With Disabilities",
    s.include_in_report = true
MERGE (n)-[r:is_sourced_from]->(s)
ON CREATE SET r.added_date = date("2026-07-10");

// ==== ExternalPolicy ====================================================

// CSU Systemwide Accessible Technology Initiative (ATI) Policy
MATCH (n:ExternalPolicy {title: "CSU Systemwide Accessible Technology Initiative (ATI) Policy"})
MERGE (s:Webpage {url: "https://ati.calstate.edu/"})
ON CREATE SET s.unique_id = replace(randomUUID(), '-', ''),
    s.name = "Accessible Technology Initiative (ATI)",
    s.include_in_report = true
MERGE (n)-[r:is_sourced_from]->(s)
ON CREATE SET r.added_date = date("2026-07-10");

MATCH (n:ExternalPolicy {title: "CSU Systemwide Accessible Technology Initiative (ATI) Policy"})
MERGE (s:Document {hash: "aa1e4ed35c29cfdb651bb99fd09f5ab3251ea8f6"})
ON CREATE SET s.unique_id = replace(randomUUID(), '-', ''),
    s.name = "Coded Memorandum AA-2013-03: Accessible Technology Initiative",
    s.uri_path = "https://www.calstate.edu/csu-system/administration/codedmemos/Academic%20Affairs%20Coded%20Memos/AA-2013-03.pdf",
    s.include_in_report = true
MERGE (n)-[r:is_sourced_from]->(s)
ON CREATE SET r.added_date = date("2026-07-10");

MATCH (n:ExternalPolicy {title: "CSU Systemwide Accessible Technology Initiative (ATI) Policy"})
MERGE (s:Document {hash: "58b919eb24b6dbdcb073c0168af85371a3189a08"})
ON CREATE SET s.unique_id = replace(randomUUID(), '-', ''),
    s.name = "SJSU PD 2007-02 (documents ATI initiation via AA-2006-41, Sept 28 2006)",
    s.uri_path = "https://www.sjsu.edu/accessibility/docs/PD_2007-02.pdf",
    s.include_in_report = true
MERGE (n)-[r:is_sourced_from]->(s)
ON CREATE SET r.added_date = date("2026-07-10");

// CSU Board of Trustees Policy on Disability Support and Accommodations
MATCH (n:ExternalPolicy {title: "CSU Board of Trustees Policy on Disability Support and Accommodations"})
MERGE (s:Document {hash: "d1ce43995ed3a8ba7af13579137a1f2da119e71c"})
ON CREATE SET s.unique_id = replace(randomUUID(), '-', ''),
    s.name = "Executive Order 1111 (Board of Trustees Policy on Disability Support and Accommodations)",
    s.uri_path = "https://www.calstatela.edu/sites/default/files/eo-1111.pdf",
    s.include_in_report = true
MERGE (n)-[r:is_sourced_from]->(s)
ON CREATE SET r.added_date = date("2026-07-10");

// San José State University Access to Electronic and Information Technology Policy for Persons with Disabilities (Presidential Directive 2007-02)
MATCH (n:ExternalPolicy {title: "San José State University Access to Electronic and Information Technology Policy for Persons with Disabilities (Presidential Directive 2007-02)"})
MERGE (s:Document {hash: "58b919eb24b6dbdcb073c0168af85371a3189a08"})
ON CREATE SET s.unique_id = replace(randomUUID(), '-', ''),
    s.name = "SJSU Presidential Directive 2007-02",
    s.uri_path = "https://www.sjsu.edu/accessibility/docs/PD_2007-02.pdf",
    s.include_in_report = true
MERGE (n)-[r:is_sourced_from]->(s)
ON CREATE SET r.added_date = date("2026-07-10");

// University of California IT Accessibility Policy (IMT-1300)
MATCH (n:ExternalPolicy {title: "University of California IT Accessibility Policy (IMT-1300)"})
MERGE (s:Webpage {url: "https://policy.ucop.edu/doc/7000611"})
ON CREATE SET s.unique_id = replace(randomUUID(), '-', ''),
    s.name = "University of California Policy IMT-1300, IT Accessibility",
    s.include_in_report = true
MERGE (n)-[r:is_sourced_from]->(s)
ON CREATE SET r.added_date = date("2026-07-10");

MATCH (n:ExternalPolicy {title: "University of California IT Accessibility Policy (IMT-1300)"})
MERGE (s:Webpage {url: "https://www.ucop.edu/electronic-accessibility/initiative/policy.html"})
ON CREATE SET s.unique_id = replace(randomUUID(), '-', ''),
    s.name = "UC Electronic Accessibility Policy",
    s.include_in_report = true
MERGE (n)-[r:is_sourced_from]->(s)
ON CREATE SET r.added_date = date("2026-07-10");

// ==== Memo ==============================================================

// CSU Coded Memorandum AA-2007-04: Access to Electronic and Information Technology for Persons with Disabilities (2007)
MATCH (n:Memo {title: "CSU Coded Memorandum AA-2007-04: Access to Electronic and Information Technology for Persons with Disabilities (2007)"})
MERGE (s:Document {hash: "ca022565a7934761247ea016228d29dbd1e1c92c"})
ON CREATE SET s.unique_id = replace(randomUUID(), '-', ''),
    s.name = "CSU Coded Memorandum AA-2007-04 (PDF, via Internet Archive)",
    s.uri_path = "http://web.archive.org/web/2015/http://www.calstate.edu/AcadAff/codedmemos/AA-2007-04.pdf",
    s.include_in_report = true
MERGE (n)-[r:is_sourced_from]->(s)
ON CREATE SET r.added_date = date("2026-07-10");

MATCH (n:Memo {title: "CSU Coded Memorandum AA-2007-04: Access to Electronic and Information Technology for Persons with Disabilities (2007)"})
MERGE (s:Webpage {url: "https://www.csuchico.edu/ati/chancellor-policies.shtml"})
ON CREATE SET s.unique_id = replace(randomUUID(), '-', ''),
    s.name = "Chancellor Policies - Accessible Technology Initiative (CSU Chico)",
    s.include_in_report = true
MERGE (n)-[r:is_sourced_from]->(s)
ON CREATE SET r.added_date = date("2026-07-10");

// CSU Coded Memorandum AA-2010-13: Revision of Accessible Technology Initiative Coded Memo (2010)
MATCH (n:Memo {title: "CSU Coded Memorandum AA-2010-13: Revision of Accessible Technology Initiative Coded Memo (2010)"})
MERGE (s:Webpage {url: "http://web.archive.org/web/2018/https://www.calstate.edu/acadaff/codedmemos/AA-2010-13.shtml"})
ON CREATE SET s.unique_id = replace(randomUUID(), '-', ''),
    s.name = "AA-2010-13: Revision of Accessible Technology Initiative (ATI) (via Internet Archive)",
    s.include_in_report = true
MERGE (n)-[r:is_sourced_from]->(s)
ON CREATE SET r.added_date = date("2026-07-10");

// CSU Coded Memorandum AA-2013-03: Accessible Technology Initiative (2013)
MATCH (n:Memo {title: "CSU Coded Memorandum AA-2013-03: Accessible Technology Initiative (2013)"})
MERGE (s:Document {hash: "b464893508dbe19665868eb75fe311e158460a6c"})
ON CREATE SET s.unique_id = replace(randomUUID(), '-', ''),
    s.name = "CSU Coded Memorandum AA-2013-03 (PDF, via Internet Archive)",
    s.uri_path = "http://web.archive.org/web/2016/http://www.calstate.edu/AcadAff/codedmemos/AA-2013-03.pdf",
    s.include_in_report = true
MERGE (n)-[r:is_sourced_from]->(s)
ON CREATE SET r.added_date = date("2026-07-10");

// CSU Coded Memorandum AA-2015-22: Accessible Technology Initiative Addendum (2015)
MATCH (n:Memo {title: "CSU Coded Memorandum AA-2015-22: Accessible Technology Initiative Addendum (2015)"})
MERGE (s:Document {hash: "d03ddd1f44d4c8eca1362a77c3609f03cdea30b5"})
ON CREATE SET s.unique_id = replace(randomUUID(), '-', ''),
    s.name = "CSU Coded Memorandum AA-2015-22 (PDF, via Internet Archive)",
    s.uri_path = "http://web.archive.org/web/2018/http://www.calstate.edu/AcadAff/codedmemos/AA-2015-22.pdf",
    s.include_in_report = true
MERGE (n)-[r:is_sourced_from]->(s)
ON CREATE SET r.added_date = date("2026-07-10");

// CSU Memorandum: Recommended Campus Actions to Improve Accessibility of Online Education (2013)
MATCH (n:Memo {title: "CSU Memorandum: Recommended Campus Actions to Improve Accessibility of Online Education (2013)"})
MERGE (s:Document {hash: "33a2653a855e15bf5f2bb88114ca841d677ada3a"})
ON CREATE SET s.unique_id = replace(randomUUID(), '-', ''),
    s.name = "Campus Accessibility Strategy for Online Education (PDF, hosted by SF State)",
    s.uri_path = "https://access.sfsu.edu/sites/default/files/documents/Memo%20to%20Pres%20-%20Accessibility%20and%20Online%20Education%208-2013.pdf",
    s.include_in_report = true
MERGE (n)-[r:is_sourced_from]->(s)
ON CREATE SET r.added_date = date("2026-07-10");

// Joint Dear Colleague Letter on Electronic Book Readers (2010)
MATCH (n:Memo {title: "Joint Dear Colleague Letter on Electronic Book Readers (2010)"})
MERGE (s:Webpage {url: "https://archive.ada.gov/kindle_ltr_eddoj.htm"})
ON CREATE SET s.unique_id = replace(randomUUID(), '-', ''),
    s.name = "Joint DOJ/DOE Dear Colleague Letter on Electronic Book Readers (ADA.gov archive)",
    s.include_in_report = true
MERGE (n)-[r:is_sourced_from]->(s)
ON CREATE SET r.added_date = date("2026-07-10");

MATCH (n:Memo {title: "Joint Dear Colleague Letter on Electronic Book Readers (2010)"})
MERGE (s:Document {hash: "b922af51f3315fd25c0bef075f7ac6ef71730e88"})
ON CREATE SET s.unique_id = replace(randomUUID(), '-', ''),
    s.name = "Dear Colleague Letter: Electronic Book Readers (PDF, ED OCR)",
    s.uri_path = "https://www.ed.gov/sites/ed/files/about/offices/list/ocr/letters/colleague-20100629.pdf",
    s.include_in_report = true
MERGE (n)-[r:is_sourced_from]->(s)
ON CREATE SET r.added_date = date("2026-07-10");

// OCR Frequently Asked Questions on the June 29, 2010 Dear Colleague Letter (Electronic Book Readers) (2011)
MATCH (n:Memo {title: "OCR Frequently Asked Questions on the June 29, 2010 Dear Colleague Letter (Electronic Book Readers) (2011)"})
MERGE (s:Document {hash: "6c993241b2b799128595fe405b1f34ec9bc007bb"})
ON CREATE SET s.unique_id = replace(randomUUID(), '-', ''),
    s.name = "FAQ About the June 29, 2010 Dear Colleague Letter (PDF, ED OCR)",
    s.uri_path = "https://www.ed.gov/sites/ed/files/about/offices/list/ocr/docs/dcl-ebook-faq-201105.pdf",
    s.include_in_report = true
MERGE (n)-[r:is_sourced_from]->(s)
ON CREATE SET r.added_date = date("2026-07-10");

MATCH (n:Memo {title: "OCR Frequently Asked Questions on the June 29, 2010 Dear Colleague Letter (Electronic Book Readers) (2011)"})
MERGE (s:Webpage {url: "https://www.ed.gov/laws-and-policy/civil-rights-laws/disability-discrimination/faqs-about-june-29-2010-dear-colleague-letter-disability-discrimination"})
ON CREATE SET s.unique_id = replace(randomUUID(), '-', ''),
    s.name = "FAQs about the June 29, 2010, Dear Colleague Letter (ED OCR)",
    s.include_in_report = true
MERGE (n)-[r:is_sourced_from]->(s)
ON CREATE SET r.added_date = date("2026-07-10");

// ==== Guideline =========================================================

// Web Content Accessibility Guidelines (WCAG) 2.0
MATCH (n:Guideline {title: "Web Content Accessibility Guidelines (WCAG) 2.0"})
MERGE (s:Webpage {url: "https://www.w3.org/TR/WCAG20/"})
ON CREATE SET s.unique_id = replace(randomUUID(), '-', ''),
    s.name = "Web Content Accessibility Guidelines (WCAG) 2.0 (W3C Recommendation)",
    s.include_in_report = true
MERGE (n)-[r:is_sourced_from]->(s)
ON CREATE SET r.added_date = date("2026-07-10");

// Web Content Accessibility Guidelines (WCAG) 2.1
MATCH (n:Guideline {title: "Web Content Accessibility Guidelines (WCAG) 2.1"})
MERGE (s:Webpage {url: "https://www.w3.org/TR/WCAG21/"})
ON CREATE SET s.unique_id = replace(randomUUID(), '-', ''),
    s.name = "Web Content Accessibility Guidelines (WCAG) 2.1 (W3C Recommendation)",
    s.include_in_report = true
MERGE (n)-[r:is_sourced_from]->(s)
ON CREATE SET r.added_date = date("2026-07-10");

// Web Content Accessibility Guidelines (WCAG) 2.2
MATCH (n:Guideline {title: "Web Content Accessibility Guidelines (WCAG) 2.2"})
MERGE (s:Webpage {url: "https://www.w3.org/TR/WCAG22/"})
ON CREATE SET s.unique_id = replace(randomUUID(), '-', ''),
    s.name = "Web Content Accessibility Guidelines (WCAG) 2.2 (W3C Recommendation)",
    s.include_in_report = true
MERGE (n)-[r:is_sourced_from]->(s)
ON CREATE SET r.added_date = date("2026-07-10");

// Accessible Rich Internet Applications (WAI-ARIA) 1.2
MATCH (n:Guideline {title: "Accessible Rich Internet Applications (WAI-ARIA) 1.2"})
MERGE (s:Webpage {url: "https://www.w3.org/TR/wai-aria-1.2/"})
ON CREATE SET s.unique_id = replace(randomUUID(), '-', ''),
    s.name = "Accessible Rich Internet Applications (WAI-ARIA) 1.2 (W3C Recommendation)",
    s.include_in_report = true
MERGE (n)-[r:is_sourced_from]->(s)
ON CREATE SET r.added_date = date("2026-07-10");

// Authoring Tool Accessibility Guidelines (ATAG) 2.0
MATCH (n:Guideline {title: "Authoring Tool Accessibility Guidelines (ATAG) 2.0"})
MERGE (s:Webpage {url: "https://www.w3.org/TR/ATAG20/"})
ON CREATE SET s.unique_id = replace(randomUUID(), '-', ''),
    s.name = "Authoring Tool Accessibility Guidelines (ATAG) 2.0 (W3C Recommendation)",
    s.include_in_report = true
MERGE (n)-[r:is_sourced_from]->(s)
ON CREATE SET r.added_date = date("2026-07-10");

// User Agent Accessibility Guidelines (UAAG) 2.0
MATCH (n:Guideline {title: "User Agent Accessibility Guidelines (UAAG) 2.0"})
MERGE (s:Webpage {url: "https://www.w3.org/TR/UAAG20/"})
ON CREATE SET s.unique_id = replace(randomUUID(), '-', ''),
    s.name = "User Agent Accessibility Guidelines (UAAG) 2.0 (W3C Working Group Note)",
    s.include_in_report = true
MERGE (n)-[r:is_sourced_from]->(s)
ON CREATE SET r.added_date = date("2026-07-10");

// Revised Section 508 Standards (36 CFR Part 1194) (2017)
MATCH (n:Guideline {title: "Revised Section 508 Standards (36 CFR Part 1194) (2017)"})
MERGE (s:Webpage {url: "https://www.access-board.gov/ict/"})
ON CREATE SET s.unique_id = replace(randomUUID(), '-', ''),
    s.name = "Revised 508 Standards and 255 Guidelines (U.S. Access Board)",
    s.include_in_report = true
MERGE (n)-[r:is_sourced_from]->(s)
ON CREATE SET r.added_date = date("2026-07-10");

MATCH (n:Guideline {title: "Revised Section 508 Standards (36 CFR Part 1194) (2017)"})
MERGE (s:Webpage {url: "https://www.section508.gov/manage/laws-and-policies/"})
ON CREATE SET s.unique_id = replace(randomUUID(), '-', ''),
    s.name = "IT Accessibility Laws and Policies (Section508.gov)",
    s.include_in_report = true
MERGE (n)-[r:is_sourced_from]->(s)
ON CREATE SET r.added_date = date("2026-07-10");

// PDF/UA (ISO 14289-1)
MATCH (n:Guideline {title: "PDF/UA (ISO 14289-1)"})
MERGE (s:Webpage {url: "https://www.iso.org/standard/64599.html"})
ON CREATE SET s.unique_id = replace(randomUUID(), '-', ''),
    s.name = "ISO 14289-1:2014 Document management applications — file format enhancement for accessibility — Part 1 (PDF/UA-1)",
    s.include_in_report = true
MERGE (n)-[r:is_sourced_from]->(s)
ON CREATE SET r.added_date = date("2026-07-10");

// EPUB Accessibility 1.0
MATCH (n:Guideline {title: "EPUB Accessibility 1.0"})
MERGE (s:Webpage {url: "https://idpf.org/epub/a11y/accessibility-20170105.html"})
ON CREATE SET s.unique_id = replace(randomUUID(), '-', ''),
    s.name = "EPUB Accessibility 1.0 (IDPF Recommended Specification)",
    s.include_in_report = true
MERGE (n)-[r:is_sourced_from]->(s)
ON CREATE SET r.added_date = date("2026-07-10");

// EPUB Accessibility 1.1
MATCH (n:Guideline {title: "EPUB Accessibility 1.1"})
MERGE (s:Webpage {url: "https://www.w3.org/TR/epub-a11y-11/"})
ON CREATE SET s.unique_id = replace(randomUUID(), '-', ''),
    s.name = "EPUB Accessibility 1.1 (W3C Recommendation)",
    s.include_in_report = true
MERGE (n)-[r:is_sourced_from]->(s)
ON CREATE SET r.added_date = date("2026-07-10");

// EN 301 549 (V3.2.1, 2021)
MATCH (n:Guideline {title: "EN 301 549 (V3.2.1, 2021)"})
MERGE (s:Document {hash: "3bde26030b8884f06cfbccfff06a6913629decde"})
ON CREATE SET s.unique_id = replace(randomUUID(), '-', ''),
    s.name = "ETSI EN 301 549 V3.2.1 (2021-03) Harmonised European Standard (PDF)",
    s.uri_path = "https://www.etsi.org/deliver/etsi_en/301500_301599/301549/03.02.01_60/en_301549v030201p.pdf",
    s.include_in_report = true
MERGE (n)-[r:is_sourced_from]->(s)
ON CREATE SET r.added_date = date("2026-07-10");
