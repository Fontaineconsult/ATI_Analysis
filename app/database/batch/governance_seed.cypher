// governance_seed.cypher
// GENERATED from app/database/ontology/governance_seed.md by
//   app/database/tools/generate_governance_cypher.py — do not edit by hand.
//
// Idempotent: MERGE on `title` (unique_index in graph_schema.py); node
// properties are re-applied on every run; `unique_id` is minted once ON
// CREATE (neomodel-compatible 32-char hex) so these nodes carry the id the
// app expects. Provenance (confidence/notes) is intentionally omitted; the
// `sources` are attached separately by governance_sources.cypher.
//
// Nodes: 61 total — Law 16, Case 16, Directive 7, ExternalPolicy 4, Memo 7, Guideline 11
// Requires Neo4j 4.3+ for randomUUID(). No relationships are created --
// the `informs` edges (informs-hints in the seed) are left for a later pass.

// ---- Law (16) ---------------------------------------------------------

MERGE (n:Law {title: "Americans with Disabilities Act of 1990"})
ON CREATE SET n.unique_id = replace(randomUUID(), '-', '')
SET
  n.description = "Comprehensive civil rights law prohibiting discrimination based on disability. Title II (state and local government) and Title III (public accommodations) underpin accessibility obligations for public universities and their digital and physical services.",
  n.effective_date = date("1990-07-26"),
  n.last_updated = date("2008-09-25"),
  n.relevant_sections = "Title II (public entities, incl. public colleges); Title III (public accommodations); Title I (employment)",
  n.legislative_authority = "United States Congress";

MERGE (n:Law {title: "ADA Amendments Act of 2008"})
ON CREATE SET n.unique_id = replace(randomUUID(), '-', '')
SET
  n.description = "Amended the Americans with Disabilities Act to broaden the definition of 'disability' and reverse restrictive U.S. Supreme Court interpretations, directing courts to focus on whether discrimination occurred rather than on narrow disability definitions.",
  n.effective_date = date("2009-01-01"),
  n.relevant_sections = "Amendments to ADA definitions of 'disability' (42 U.S.C. 12102); rules of construction",
  n.legislative_authority = "United States Congress";

MERGE (n:Law {title: "Rehabilitation Act of 1973, Section 504"})
ON CREATE SET n.unique_id = replace(randomUUID(), '-', '')
SET
  n.description = "Prohibits discrimination on the basis of disability in any program or activity receiving federal financial assistance or conducted by a federal agency. It is a primary basis for accessibility obligations of colleges and universities that receive federal funds.",
  n.effective_date = date("1973-09-26"),
  n.relevant_sections = "Section 504 (29 U.S.C. 794)",
  n.legislative_authority = "United States Congress";

MERGE (n:Law {title: "Rehabilitation Act of 1973, Section 508"})
ON CREATE SET n.unique_id = replace(randomUUID(), '-', '')
SET
  n.description = "Requires federal agencies to make their electronic and information technology accessible to people with disabilities. Its accessibility standards are widely referenced by California law and higher-education procurement requirements.",
  n.effective_date = date("1998-08-07"),
  n.relevant_sections = "Section 508 (29 U.S.C. 794d)",
  n.legislative_authority = "United States Congress";

MERGE (n:Law {title: "Rehabilitation Act of 1973, Section 501"})
ON CREATE SET n.unique_id = replace(randomUUID(), '-', '')
SET
  n.description = "Prohibits disability discrimination in federal-sector employment and requires federal executive agencies to take affirmative action to hire, place, and advance individuals with disabilities. Enforced by the U.S. EEOC.",
  n.effective_date = date("1973-09-26"),
  n.relevant_sections = "Section 501 (29 U.S.C. 791)",
  n.legislative_authority = "United States Congress";

MERGE (n:Law {title: "Rehabilitation Act of 1973, Section 503"})
ON CREATE SET n.unique_id = replace(randomUUID(), '-', '')
SET
  n.description = "Prohibits disability discrimination in employment by federal contractors and subcontractors and requires affirmative action to recruit, hire, promote, and retain individuals with disabilities. Enforced by the U.S. Department of Labor's OFCCP.",
  n.effective_date = date("1973-09-26"),
  n.relevant_sections = "Section 503 (29 U.S.C. 793)",
  n.legislative_authority = "United States Congress";

MERGE (n:Law {title: "Telecommunications Act of 1996, Section 255"})
ON CREATE SET n.unique_id = replace(randomUUID(), '-', '')
SET
  n.description = "Requires manufacturers of telecommunications equipment and providers of telecommunications services to make their equipment and services accessible to and usable by people with disabilities where readily achievable. Enforced by the FCC.",
  n.effective_date = date("1996-02-08"),
  n.relevant_sections = "Section 255 (47 U.S.C. 255)",
  n.legislative_authority = "United States Congress";

MERGE (n:Law {title: "21st Century Communications and Video Accessibility Act of 2010"})
ON CREATE SET n.unique_id = replace(randomUUID(), '-', '')
SET
  n.description = "Updated federal communications law (amending the Communications Act of 1934) to require accessibility of modern digital, broadband, and mobile communications and video programming, including advanced communications services and captioning of internet-delivered video.",
  n.effective_date = date("2010-10-08"),
  n.relevant_sections = "Title I (communications access / advanced communications services); Title II (video programming accessibility)",
  n.legislative_authority = "United States Congress";

MERGE (n:Law {title: "Assistive Technology Act of 1998"})
ON CREATE SET n.unique_id = replace(randomUUID(), '-', '')
SET
  n.description = "Establishes formula grants to states to support statewide assistive technology programs that increase access to, availability of, and funding for assistive technology for individuals with disabilities.",
  n.effective_date = date("1998-11-13"),
  n.last_updated = date("2004-10-25"),
  n.relevant_sections = "Statewide AT programs; state grant provisions (29 U.S.C. 3001 et seq.)",
  n.legislative_authority = "United States Congress";

MERGE (n:Law {title: "Individuals with Disabilities Education Act"})
ON CREATE SET n.unique_id = replace(randomUUID(), '-', '')
SET
  n.description = "Federal law guaranteeing eligible children with disabilities a free appropriate public education with special education and related services, including provision of accessible instructional materials and assistive technology through the individualized education program (IEP).",
  n.effective_date = date("1990-10-30"),
  n.last_updated = date("2004-12-03"),
  n.relevant_sections = "Part B (school-age services); IEP, related services, and assistive technology provisions (20 U.S.C. 1400 et seq.)",
  n.legislative_authority = "United States Congress";

MERGE (n:Law {title: "California Government Code Section 7405"})
ON CREATE SET n.unique_id = replace(randomUUID(), '-', '')
SET
  n.description = "Requires California state governmental entities, when developing, procuring, maintaining, or using electronic or information technology, to comply with the accessibility requirements of Section 508 of the federal Rehabilitation Act and its implementing standards; also obligates contractors to resolve accessibility complaints.",
  n.effective_date = date("2017-01-01"),
  n.relevant_sections = "Gov. Code 7405(a) (Section 508 compliance); 7405(b) (contractor complaint resolution)",
  n.legislative_authority = "California State Legislature";

MERGE (n:Law {title: "California Government Code Section 11135"})
ON CREATE SET n.unique_id = replace(randomUUID(), '-', '')
SET
  n.description = "Prohibits discrimination and denial of full and equal access, on the basis of disability and other protected characteristics, in any program or activity conducted, operated, administered by, or funded by the State of California; disability provisions require meeting the protections of ADA Title II.",
  n.effective_date = date("1977-01-01"),
  n.last_updated = date("2017-01-01"),
  n.relevant_sections = "Gov. Code 11135(a) (nondiscrimination in state-funded programs); 11135(b) (ADA Title II protections); 11135(d) (electronic and information technology accessibility)",
  n.legislative_authority = "California State Legislature";

MERGE (n:Law {title: "California Government Code Section 11546.7"})
ON CREATE SET n.unique_id = replace(randomUUID(), '-', '')
SET
  n.description = "Requires each California state agency or entity director and CIO to post, biennially, a signed certification on the agency website home page that the site complies with Government Code Sections 7405 and 11135 and with the Web Content Accessibility Guidelines (WCAG) 2.0 or later at minimum Level AA.",
  n.effective_date = date("2018-01-01"),
  n.relevant_sections = "Gov. Code 11546.7 (biennial website accessibility certification)",
  n.legislative_authority = "California State Legislature";

MERGE (n:Law {title: "California Assembly Bill 434 (2017)"})
ON CREATE SET n.unique_id = replace(randomUUID(), '-', '')
SET
  n.description = "California legislation that created Government Code Section 11546.7, establishing a biennial requirement for state agencies to certify that their websites comply with specified state accessibility standards and WCAG 2.0 (or later) Level AA.",
  n.effective_date = date("2018-01-01"),
  n.relevant_sections = "Adds Gov. Code 11546.7; references Gov. Code 7405 and 11135; WCAG 2.0 AA standard",
  n.legislative_authority = "California State Legislature";

MERGE (n:Law {title: "Unruh Civil Rights Act (California Civil Code Section 51)"})
ON CREATE SET n.unique_id = replace(randomUUID(), '-', '')
SET
  n.description = "California civil rights law guaranteeing full and equal accommodations, advantages, facilities, privileges, and services in all business establishments regardless of disability and other protected characteristics; a violation of the federal ADA also constitutes a violation of this Act.",
  n.effective_date = date("1959-01-01"),
  n.relevant_sections = "Civil Code 51 (full and equal access); ADA violations deemed Unruh Act violations",
  n.legislative_authority = "California State Legislature";

MERGE (n:Law {title: "California Education Code Section 67302"})
ON CREATE SET n.unique_id = replace(randomUUID(), '-', '')
SET
  n.description = "Requires publishers and manufacturers of instructional materials used by California postsecondary students to provide electronic versions of printed materials so that they can be converted into accessible alternate formats (such as braille, large print, audio, and e-text) for students with disabilities.",
  n.effective_date = date("2000-01-01"),
  n.relevant_sections = "Ed. Code 67302 (publisher provision of electronic instructional materials; alternate media for students with disabilities)",
  n.legislative_authority = "California State Legislature";

// ---- Case (16) --------------------------------------------------------

MERGE (n:Case {title: "Payan v. Los Angeles Community College District (9th Cir. 2021)"})
ON CREATE SET n.unique_id = replace(randomUUID(), '-', '')
SET
  n.description = "Blind students sued LACCD under Title II of the ADA and Section 504 of the Rehabilitation Act over inaccessible course materials, websites, and instructional technology. The Ninth Circuit reinstated the students' verdict and clarified the standards for disability discrimination claims against public colleges.",
  n.effective_date = date("2021-08-24"),
  n.ruling = "The Ninth Circuit held that disparate-impact disability discrimination claims are cognizable through a private right of action under Title II of the ADA and Section 504, and that a public college must proactively ensure equal access to its educational programs and technology.",
  n.legislative_authority = "U.S. Court of Appeals for the Ninth Circuit";

MERGE (n:Case {title: "Robles v. Domino's Pizza LLC (9th Cir. 2019)"})
ON CREATE SET n.unique_id = replace(randomUUID(), '-', '')
SET
  n.description = "A blind plaintiff sued over Domino's website and mobile app being inaccessible to screen-reader users, in violation of ADA Title III and California's Unruh Civil Rights Act. The Ninth Circuit reversed dismissal and allowed the case to proceed.",
  n.effective_date = date("2019-01-15"),
  n.ruling = "The Ninth Circuit held that ADA Title III applies to the website and mobile app of a business with a nexus to its physical places of public accommodation, and that the lack of formal DOJ web regulations did not deny the company fair notice.",
  n.legislative_authority = "U.S. Court of Appeals for the Ninth Circuit";

MERGE (n:Case {title: "National Federation of the Blind v. Target Corp. (N.D. Cal.)"})
ON CREATE SET n.unique_id = replace(randomUUID(), '-', '')
SET
  n.description = "The NFB and blind plaintiffs sued Target under the ADA and California civil rights laws alleging Target.com was inaccessible to screen-reader users. The court's 2006 ruling on the motion to dismiss and the 2008 class-action settlement were early landmarks for website accessibility.",
  n.effective_date = date("2006-09-06"),
  n.ruling = "The district court held that a retailer's website with a sufficient nexus to its physical stores must be accessible under the ADA and California law, denying in relevant part Target's motion to dismiss.",
  n.legislative_authority = "U.S. District Court for the Northern District of California";

MERGE (n:Case {title: "National Association of the Deaf v. Netflix (D. Mass. 2012)"})
ON CREATE SET n.unique_id = replace(randomUUID(), '-', '')
SET
  n.description = "The NAD sued Netflix under ADA Title III alleging its 'Watch Instantly' streaming service lacked closed captions for deaf and hard-of-hearing users. The district court's ruling and subsequent consent decree required captioning of streaming content.",
  n.effective_date = date("2012-06-19"),
  n.ruling = "The district court held that Netflix's web-based 'Watch Instantly' streaming service is a place of public accommodation subject to ADA Title III, even though it has no physical location.",
  n.legislative_authority = "U.S. District Court for the District of Massachusetts";

MERGE (n:Case {title: "National Association of the Deaf v. Harvard University (D. Mass.)"})
ON CREATE SET n.unique_id = replace(randomUUID(), '-', '')
SET
  n.description = "The NAD and deaf/hard-of-hearing plaintiffs sued Harvard under the ADA and Section 504 for failing to caption publicly available online content, including courses, lectures, and podcasts. The case ended in a court-approved settlement requiring comprehensive captioning.",
  n.effective_date = date("2020-02-27"),
  n.ruling = "Under the approved settlement, Harvard agreed to provide high-quality captioning for university online content published on its platforms; an earlier 2019 ruling reaffirmed such content is covered by the ADA and Section 504 while finding Communications Decency Act immunity for certain third-party content.",
  n.legislative_authority = "U.S. District Court for the District of Massachusetts";

MERGE (n:Case {title: "National Association of the Deaf v. Massachusetts Institute of Technology (D. Mass.)"})
ON CREATE SET n.unique_id = replace(randomUUID(), '-', '')
SET
  n.description = "Parallel to the Harvard action, the NAD sued MIT under the ADA and Section 504 for failing to caption publicly available online content. The case ended in a court-approved settlement requiring comprehensive captioning of university online content.",
  n.effective_date = date("2020-07-21"),
  n.ruling = "Under the approved settlement, MIT agreed to provide high-quality captioning for university online content across its and university-sponsored online platforms.",
  n.legislative_authority = "U.S. District Court for the District of Massachusetts";

MERGE (n:Case {title: "Enyart v. National Conference of Bar Examiners (9th Cir. 2011)"})
ON CREATE SET n.unique_id = replace(randomUUID(), '-', '')
SET
  n.description = "A blind law graduate sought to use assistive screen-reader and screen-magnification software to take the Multistate Bar Exam and MPRE. The Ninth Circuit affirmed a preliminary injunction requiring the testing entity to provide her chosen assistive technology.",
  n.effective_date = date("2011-01-04"),
  n.ruling = "The Ninth Circuit held that under ADA Title III a testing entity must offer examinations in a manner and with auxiliary aids that best ensure the exam measures the test-taker's aptitude rather than the effects of disability, upholding the plaintiff's requested assistive technology.",
  n.legislative_authority = "U.S. Court of Appeals for the Ninth Circuit";

MERGE (n:Case {title: "Gil v. Winn-Dixie Stores, Inc. (11th Cir. 2021)"})
ON CREATE SET n.unique_id = replace(randomUUID(), '-', '')
SET
  n.description = "A blind customer sued Winn-Dixie under ADA Title III over a website incompatible with screen readers. A three-judge panel issued a decision, which the Eleventh Circuit later vacated as moot.",
  n.effective_date = date("2021-04-07"),
  n.ruling = "The panel held that websites are not 'places of public accommodation' under ADA Title III, which it read to cover only physical places; the panel opinion was later vacated and the appeal dismissed as moot.",
  n.legislative_authority = "U.S. Court of Appeals for the Eleventh Circuit";

MERGE (n:Case {title: "Authors Guild, Inc. v. HathiTrust (2d Cir. 2014)"})
ON CREATE SET n.unique_id = replace(randomUUID(), '-', '')
SET
  n.description = "Authors challenged the mass digitization of library books into the HathiTrust Digital Library, which enabled full-text search and provided accessible formats to print-disabled patrons. The Second Circuit largely affirmed a fair-use finding.",
  n.effective_date = date("2014-06-10"),
  n.ruling = "The Second Circuit held that providing full-text search and giving print-disabled users access to digitized copies of copyrighted works are fair uses under Section 107 of the Copyright Act.",
  n.legislative_authority = "U.S. Court of Appeals for the Second Circuit";

MERGE (n:Case {title: "United States v. Miami University (S.D. Ohio consent decree, 2016)"})
ON CREATE SET n.unique_id = replace(randomUUID(), '-', '')
SET
  n.description = "Following blind student Aleeha Dudley's suit, the DOJ intervened and alleged Miami University's web content and classroom/instructional technologies violated ADA Title II. The parties resolved the case through a comprehensive consent decree.",
  n.effective_date = date("2016-10-17"),
  n.ruling = "Under the consent decree, Miami University agreed to make its websites, learning management systems, and instructional technologies conform to WCAG 2.0 Level AA, adopt accessible procurement practices, train faculty and staff, and pay $25,000 in compensation.",
  n.legislative_authority = "U.S. Department of Justice (U.S. District Court for the Southern District of Ohio)";

MERGE (n:Case {title: "United States v. Louisiana Tech University (DOJ settlement, 2013)"})
ON CREATE SET n.unique_id = replace(randomUUID(), '-', '')
SET
  n.description = "The DOJ investigated a complaint by a blind student who was effectively excluded from a course because the required MyOMLab online learning product was inaccessible. The matter was resolved by a settlement agreement under ADA Title II.",
  n.effective_date = date("2013-07-12"),
  n.ruling = "The DOJ determined that requiring a blind student to use an inaccessible online learning product violated ADA Title II, and the settlement required the university to adopt technology meeting WCAG 2.0 Level AA, train instructors and administrators, and pay $23,543 in damages.",
  n.legislative_authority = "U.S. Department of Justice";

MERGE (n:Case {title: "United States v. Regents of the University of California (Berkeley) (consent decree, 2022)"})
ON CREATE SET n.unique_id = replace(randomUUID(), '-', '')
SET
  n.description = "After a DOJ investigation into UC Berkeley's free online content (MOOCs, YouTube, podcasts, and web content) that began with a 2014 NAD complaint about missing captions, the parties entered a consent decree requiring the content to be made accessible.",
  n.effective_date = date("2022-11-21"),
  n.ruling = "Under the consent decree, UC Berkeley agreed to bring its free online content into conformance with WCAG 2.0 Level AA on phased timelines, including captions, audio description, and alternative text, and to designate a web accessibility coordinator and engage an independent auditor.",
  n.legislative_authority = "U.S. Department of Justice (U.S. District Court for the Northern District of California)";

MERGE (n:Case {title: "National Federation of the Blind v. Pennsylvania State University (OCR resolution, 2011)"})
ON CREATE SET n.unique_id = replace(randomUUID(), '-', '')
SET
  n.description = "The NFB filed a complaint with the U.S. Department of Education's Office for Civil Rights alleging Penn State's electronic and information technology was inaccessible to blind students, faculty, and staff. The parties reached a resolution agreement.",
  n.ruling = "Penn State agreed to make its electronic and information technology, including course management systems, websites, classroom technology, and library resources, fully accessible, and to adopt a policy requiring conformance with WCAG 2.0 Level AA.",
  n.legislative_authority = "U.S. Department of Education, Office for Civil Rights";

MERGE (n:Case {title: "South Carolina Technical College System (OCR Compliance Review No. 11-11-6002, 2013)"})
ON CREATE SET n.unique_id = replace(randomUUID(), '-', '')
SET
  n.description = "The Department of Education's Office for Civil Rights conducted a compliance review of the South Carolina Technical College System's websites (including course management systems and library resources) and found them not readily accessible to users of assistive technology. The System entered a voluntary resolution agreement.",
  n.effective_date = date("2013-03-08"),
  n.ruling = "OCR found the System's websites not in compliance with Section 504 and ADA Title II because they were not usable by people requiring assistive technology in an equally effective and integrated manner, and the System agreed to remediate its sites, conduct annual accessibility reviews, and report to OCR.",
  n.legislative_authority = "U.S. Department of Education, Office for Civil Rights";

MERGE (n:Case {title: "California State University, Long Beach (OCR Docket No. 09-99-2041, 1999)"})
ON CREATE SET n.unique_id = replace(randomUUID(), '-', '')
SET
  n.description = "OCR investigated a complaint that CSU Long Beach failed to provide a blind student with accommodations needed to access the College of Business curriculum, including adaptive computer technology and accessible course materials. The University resolved the matter through a voluntary resolution plan.",
  n.effective_date = date("1999-04-20"),
  n.ruling = "OCR accepted the University's voluntary resolution plan, under which CSU Long Beach committed to procedures for installing and maintaining adaptive workstations, considering accessibility in technology purchasing, and ensuring campus web pages are designed for accessibility to users with disabilities.",
  n.legislative_authority = "U.S. Department of Education, Office for Civil Rights";

MERGE (n:Case {title: "California State University, Los Angeles (OCR Docket No. 09-97-2002, 1997)"})
ON CREATE SET n.unique_id = replace(randomUUID(), '-', '')
SET
  n.description = "OCR investigated a complaint that CSU Los Angeles failed to provide blind and low-vision students access to library resources, campus publications, and open computer laboratories, and provided insufficient adaptive-technology training. The University elected voluntary resolution.",
  n.effective_date = date("1997-04-07"),
  n.ruling = "OCR accepted the University's written commitment to resolve the issues, applying Title II's requirement that communications with people with disabilities (including printed and Internet-based information) be as effective as those with others and that primary consideration be given to the individual's requested auxiliary aids.",
  n.legislative_authority = "U.S. Department of Education, Office for Civil Rights";

// ---- Directive (7) ---------------------------------------------------

MERGE (n:Directive {title: "DOJ Title II Web and Mobile Accessibility Final Rule (2024)"})
ON CREATE SET n.unique_id = replace(randomUUID(), '-', '')
SET
  n.description = "Final rule amending the ADA Title II regulation (28 CFR Part 35) to require web content and mobile apps of state and local government entities to conform to WCAG 2.1 Level AA. Published April 24, 2024 (89 FR 31320); compliance phased by entity population.",
  n.effective_date = date("2024-06-24"),
  n.last_updated = date("2026-04-20"),
  n.source_institution = "U.S. Department of Justice";

MERGE (n:Directive {title: "Revised Section 508 Standards and Section 255 Guidelines (ICT Refresh)"})
ON CREATE SET n.unique_id = replace(randomUUID(), '-', '')
SET
  n.description = "U.S. Access Board final rule (36 CFR Part 1194) updating and reorganizing the Section 508 Standards and Section 255 Guidelines for information and communication technology, incorporating WCAG 2.0 Level AA by reference. Published January 18, 2017 (82 FR 5790).",
  n.effective_date = date("2017-03-21"),
  n.last_updated = date("2018-01-18"),
  n.source_institution = "U.S. Access Board";

MERGE (n:Directive {title: "ADA Title II Regulation (28 CFR Part 35), 2010 Revision"})
ON CREATE SET n.unique_id = replace(randomUUID(), '-', '')
SET
  n.description = "U.S. Department of Justice regulation implementing Title II of the Americans with Disabilities Act, governing nondiscrimination on the basis of disability by state and local government entities. 2010 revised regulation published September 15, 2010, adopting the 2010 ADA Standards for Accessible Design.",
  n.effective_date = date("2011-03-15"),
  n.last_updated = date("2024-06-24"),
  n.source_institution = "U.S. Department of Justice";

MERGE (n:Directive {title: "ADA Title III Regulation (28 CFR Part 36), 2010 Revision"})
ON CREATE SET n.unique_id = replace(randomUUID(), '-', '')
SET
  n.description = "U.S. Department of Justice regulation implementing Title III of the Americans with Disabilities Act, governing nondiscrimination by public accommodations and commercial facilities. 2010 revised regulation published September 15, 2010, adopting the 2010 ADA Standards for Accessible Design.",
  n.effective_date = date("2011-03-15"),
  n.last_updated = date("2010-09-15"),
  n.source_institution = "U.S. Department of Justice";

MERGE (n:Directive {title: "CSU Executive Order 926: Policy on Disability Support and Accommodations"})
ON CREATE SET n.unique_id = replace(randomUUID(), '-', '')
SET
  n.description = "California State University systemwide executive order establishing the CSU Policy on Disability Support and Accommodations, providing the framework for disability access and inclusion across all campuses and the Office of the Chancellor. Superseded by Executive Order 1111 in 2018.",
  n.effective_date = date("2005-01-01"),
  n.source_institution = "California State University, Office of the Chancellor";

MERGE (n:Directive {title: "CSU Executive Order 1111: Board of Trustees Policy on Disability Support and Accommodations"})
ON CREATE SET n.unique_id = replace(randomUUID(), '-', '')
SET
  n.description = "California State University systemwide executive order setting the CSU Board of Trustees Policy on Disability Support and Accommodations, covering physical access, information resources and technology access (the Accessible Technology Initiative), and disability accommodation for students, employees, and contracting. Supersedes Executive Order 926.",
  n.effective_date = date("2018-05-23"),
  n.last_updated = date("2018-05-23"),
  n.source_institution = "California State University, Office of the Chancellor";

MERGE (n:Directive {title: "Executive Order 13548: Increasing Federal Employment of Individuals with Disabilities (2010)"})
ON CREATE SET n.unique_id = replace(randomUUID(), '-', '')
SET
  n.description = "Federal executive order signed by President Barack Obama on the 20th anniversary of the ADA, directing federal agencies to improve hiring and retention of individuals with disabilities, including through accessible technology and reasonable accommodation. Published in the Federal Register July 30, 2010.",
  n.effective_date = date("2010-07-26"),
  n.last_updated = date("2010-07-26"),
  n.source_institution = "President of the United States (Executive Office of the President)";

// ---- ExternalPolicy (4) ----------------------------------------------

MERGE (n:ExternalPolicy {title: "CSU Systemwide Accessible Technology Initiative (ATI) Policy"})
ON CREATE SET n.unique_id = replace(randomUUID(), '-', '')
SET
  n.description = "California State University systemwide policy and program requiring information and communication technology used across the CSU to be accessible to students, employees, and the public with disabilities, structured around three priority areas: web, instructional materials, and procurement. Governed by CSU Coded Memorandum AA-2013-03 and its amendment AA-2015-22, under the authority of Executive Order 1111.",
  n.effective_date = date("2006-09-28"),
  n.last_updated = date("2013-01-29");

MERGE (n:ExternalPolicy {title: "CSU Board of Trustees Policy on Disability Support and Accommodations"})
ON CREATE SET n.unique_id = replace(randomUUID(), '-', '')
SET
  n.description = "California State University Board of Trustees policy ensuring equal access and reasonable accommodation for individuals with disabilities across academic programs, student services, employment, information technology, procurement, and physical facilities. Embodied in and enacted through Executive Order 1111.",
  n.effective_date = date("2018-05-23"),
  n.last_updated = date("2018-05-23");

MERGE (n:ExternalPolicy {title: "San José State University Access to Electronic and Information Technology Policy for Persons with Disabilities (Presidential Directive 2007-02)"})
ON CREATE SET n.unique_id = replace(randomUUID(), '-', '')
SET
  n.description = "Representative CSU campus policy establishing SJSU's requirements and guidelines for accessible electronic and information technology, including web content, instructional materials, and ICT procurement, in compliance with Section 508, the ADA, California Government Code 11135, and CSU ATI Coded Memoranda. Issued as Presidential Directive 2007-02.",
  n.effective_date = date("2007-03-12"),
  n.last_updated = date("2007-03-12");

MERGE (n:ExternalPolicy {title: "University of California IT Accessibility Policy (IMT-1300)"})
ON CREATE SET n.unique_id = replace(randomUUID(), '-', '')
SET
  n.description = "University of California systemwide policy establishing requirements for accessible information technology across UC locations, referencing WCAG and Section 508-aligned standards, to ensure individuals with disabilities have comparable access to electronic information and IT services. Included as a peer-system reference policy.",
  n.effective_date = date("2013-08-27"),
  n.last_updated = date("2026-03-17");

// ---- Memo (7) --------------------------------------------------------

MERGE (n:Memo {title: "CSU Coded Memorandum AA-2007-04: Access to Electronic and Information Technology for Persons with Disabilities (2007)"})
ON CREATE SET n.unique_id = replace(randomUUID(), '-', '')
SET
  n.description = "CSU Chancellor's Office coded memorandum that set revised timelines, tasks, and deliverables for implementing the Accessible Technology Initiative (ATI) across web accessibility, instructional materials, and procurement, replacing Sections III and IV of AA-2006-41. Signed by Executive Vice Chancellors Gary W. Reichard and Richard P. West.",
  n.authored_date = date("2007-02-09");

MERGE (n:Memo {title: "CSU Coded Memorandum AA-2010-13: Revision of Accessible Technology Initiative Coded Memo (2010)"})
ON CREATE SET n.unique_id = replace(randomUUID(), '-', '')
SET
  n.description = "CSU Chancellor's Office coded memorandum revising the overall approach, tasks, and timelines of AA-2007-04 after three years of ATI experience, adding guidance on ATI governance and roles and reframing implementation as a continuous activity. Signed under Executive Vice Chancellor for Academic Affairs.",
  n.authored_date = date("2010-06-14");

MERGE (n:Memo {title: "CSU Coded Memorandum AA-2013-03: Accessible Technology Initiative (2013)"})
ON CREATE SET n.unique_id = replace(randomUUID(), '-', '')
SET
  n.description = "CSU Chancellor's Office coded memorandum that updated and consolidated ATI policy, reaffirming the three ATI priority areas (web accessibility, instructional materials, and procurement) and superseding prior ATI coded memoranda. Signed by Executive Vice Chancellor and Chief Academic Officer Ephraim P. Smith.",
  n.authored_date = date("2013-01-29");

MERGE (n:Memo {title: "CSU Coded Memorandum AA-2015-22: Accessible Technology Initiative Addendum (2015)"})
ON CREATE SET n.unique_id = replace(randomUUID(), '-', '')
SET
  n.description = "CSU Chancellor's Office coded memorandum issued as an addendum to AA-2013-03 that replaces the Implementation section of that memo, directing campuses to develop and update ATI plans to reflect current practices.",
  n.authored_date = date("2015-12-02");

MERGE (n:Memo {title: "CSU Memorandum: Recommended Campus Actions to Improve Accessibility of Online Education (2013)"})
ON CREATE SET n.unique_id = replace(randomUUID(), '-', '')
SET
  n.description = "CSU Chancellor's Office memorandum to presidents outlining recommended campus responsibilities for accessibility in online courses, referencing recent legal settlements and the future direction of the ATI. Signed by Executive Vice Chancellor Ephraim P. Smith.",
  n.authored_date = date("2013-08-13");

MERGE (n:Memo {title: "Joint Dear Colleague Letter on Electronic Book Readers (2010)"})
ON CREATE SET n.unique_id = replace(randomUUID(), '-', '')
SET
  n.description = "Joint U.S. Department of Justice and Department of Education Office for Civil Rights letter reminding colleges and universities that requiring students to use e-book readers inaccessible to blind or low-vision students may violate Title II/III of the ADA and Section 504 of the Rehabilitation Act.",
  n.authored_date = date("2010-06-29");

MERGE (n:Memo {title: "OCR Frequently Asked Questions on the June 29, 2010 Dear Colleague Letter (Electronic Book Readers) (2011)"})
ON CREATE SET n.unique_id = replace(randomUUID(), '-', '')
SET
  n.description = "U.S. Department of Education Office for Civil Rights follow-up guidance answering frequently asked questions about the June 29, 2010 electronic book reader Dear Colleague Letter, clarifying its application to emerging technology, online courses, print disabilities, and K-12 as well as postsecondary settings. Designated a 'significant guidance document.'",
  n.authored_date = date("2011-05-26");

// ---- Guideline (11) ---------------------------------------------------

MERGE (n:Guideline {title: "Web Content Accessibility Guidelines (WCAG) 2.0"})
ON CREATE SET n.unique_id = replace(randomUUID(), '-', '')
SET
  n.description = "W3C Recommendation defining how to make web content more accessible to people with disabilities, organized under the four principles Perceivable, Operable, Understandable, and Robust with conformance levels A, AA, and AAA. Also standardized internationally as ISO/IEC 40500.",
  n.effective_date = date("2008-12-11"),
  n.last_updated = date("2008-12-11");

MERGE (n:Guideline {title: "Web Content Accessibility Guidelines (WCAG) 2.1"})
ON CREATE SET n.unique_id = replace(randomUUID(), '-', '')
SET
  n.description = "W3C Recommendation extending WCAG 2.0 with additional success criteria addressing mobile accessibility, low vision, and cognitive/learning disabilities; content conforming to WCAG 2.1 also conforms to WCAG 2.0.",
  n.effective_date = date("2018-06-05"),
  n.last_updated = date("2025-05-06");

MERGE (n:Guideline {title: "Web Content Accessibility Guidelines (WCAG) 2.2"})
ON CREATE SET n.unique_id = replace(randomUUID(), '-', '')
SET
  n.description = "W3C Recommendation extending WCAG 2.1 with additional success criteria (e.g., focus appearance, dragging movements, accessible authentication); content conforming to WCAG 2.2 also conforms to WCAG 2.0 and 2.1.",
  n.effective_date = date("2023-10-05"),
  n.last_updated = date("2024-12-12");

MERGE (n:Guideline {title: "Accessible Rich Internet Applications (WAI-ARIA) 1.2"})
ON CREATE SET n.unique_id = replace(randomUUID(), '-', '')
SET
  n.description = "W3C Recommendation defining an ontology of roles, states, and properties for making dynamic web content and web applications (especially those built with scripting) more accessible to assistive technologies.",
  n.effective_date = date("2023-06-06"),
  n.last_updated = date("2023-06-06");

MERGE (n:Guideline {title: "Authoring Tool Accessibility Guidelines (ATAG) 2.0"})
ON CREATE SET n.unique_id = replace(randomUUID(), '-', '')
SET
  n.description = "W3C Recommendation providing guidelines for designing authoring tools that are themselves accessible to authors with disabilities (Part A) and that support and encourage authors to produce accessible web content (Part B).",
  n.effective_date = date("2015-09-24"),
  n.last_updated = date("2015-09-24");

MERGE (n:Guideline {title: "User Agent Accessibility Guidelines (UAAG) 2.0"})
ON CREATE SET n.unique_id = replace(randomUUID(), '-', '')
SET
  n.description = "W3C guidance for making user agents (browsers, media players, and similar) accessible to users with disabilities and improving their interoperability with assistive technologies.",
  n.effective_date = date("2015-12-15"),
  n.last_updated = date("2015-12-15");

MERGE (n:Guideline {title: "Revised Section 508 Standards (36 CFR Part 1194) (2017)"})
ON CREATE SET n.unique_id = replace(randomUUID(), '-', '')
SET
  n.description = "U.S. Access Board's Information and Communication Technology (ICT) Standards and Guidelines, which refreshed the Section 508 standards and Section 255 guidelines and incorporated WCAG 2.0 Level A and AA by reference as the technical requirements for web, software, and electronic content.",
  n.effective_date = date("2017-01-18"),
  n.last_updated = date("2018-01-22");

MERGE (n:Guideline {title: "PDF/UA (ISO 14289-1)"})
ON CREATE SET n.unique_id = replace(randomUUID(), '-', '')
SET
  n.description = "ISO standard specifying requirements for accessible PDF documents and readers/assistive technology ('Universal Accessibility'), defining how tagged PDF structures, metadata, and semantics support access by people with disabilities.",
  n.effective_date = date("2012-07-15"),
  n.last_updated = date("2014-12-15");

MERGE (n:Guideline {title: "EPUB Accessibility 1.0"})
ON CREATE SET n.unique_id = replace(randomUUID(), '-', '')
SET
  n.description = "IDPF Recommended Specification defining accessibility requirements and discoverability metadata for EPUB publications, including conformance to WCAG and the provision of accessibility metadata.",
  n.effective_date = date("2017-01-05"),
  n.last_updated = date("2017-01-05");

MERGE (n:Guideline {title: "EPUB Accessibility 1.1"})
ON CREATE SET n.unique_id = replace(randomUUID(), '-', '')
SET
  n.description = "W3C Recommendation specifying accessibility requirements and discoverability metadata for EPUB publications, updating EPUB Accessibility 1.0 and aligning with the EPUB 3.3 specification family.",
  n.effective_date = date("2023-05-25"),
  n.last_updated = date("2024-10-17");

MERGE (n:Guideline {title: "EN 301 549 (V3.2.1, 2021)"})
ON CREATE SET n.unique_id = replace(randomUUID(), '-', '')
SET
  n.description = "European harmonised standard specifying functional accessibility requirements for ICT products and services, including test procedures and evaluation methodology for procurement; it incorporates WCAG 2.1 Level AA and underpins the EU Web Accessibility Directive and European Accessibility Act.",
  n.effective_date = date("2021-03-01"),
  n.last_updated = date("2021-03-01");
