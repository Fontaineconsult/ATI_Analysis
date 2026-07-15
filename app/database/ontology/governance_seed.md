# Governance Seed — CSU Accessible Technology Initiative (ATI) Knowledge Graph

## Conversion Contract

> Each entity below is a fenced ```yaml block. The `type` field is the Neo4j label. Nodes are created idempotently with `MERGE (n:<type> {title: <title>}) SET n += <properties>`. Keys under `properties` map directly to node properties; `date`-typed properties (`effective_date`, `last_updated`, `authored_date`) are wrapped in Cypher `date("YYYY-MM-DD")`. The `sources`, `confidence`, and `notes` keys are provenance metadata and are NOT written to the node.

## Coverage Summary

| Node type | Count |
|---|---|
| Law | 16 |
| Case | 16 |
| Directive | 7 |
| ExternalPolicy | 4 |
| Memo | 7 |
| Guideline | 11 |
| **Total** | **61** |

## Laws

### Americans with Disabilities Act of 1990

```yaml
type: Law
merge_key: title
properties:
  title: "Americans with Disabilities Act of 1990"
  description: "Comprehensive civil rights law prohibiting discrimination based on disability. Title II (state and local government) and Title III (public accommodations) underpin accessibility obligations for public universities and their digital and physical services."
  effective_date: "1990-07-26"
  last_updated: "2008-09-25"
  relevant_sections: "Title II (public entities, incl. public colleges); Title III (public accommodations); Title I (employment)"
  legislative_authority: "United States Congress"
sources:
  - url: "https://www.ada.gov/law-and-regs/ada/"
    title: "ADA.gov — Law & Regulations (Americans with Disabilities Act)"
    accessed: "2026-07-10"
  - url: "https://en.wikipedia.org/wiki/Americans_with_Disabilities_Act_of_1990"
    title: "Americans with Disabilities Act of 1990 — Wikipedia"
    accessed: "2026-07-10"
confidence: high
notes: "effective_date = date signed by President George H.W. Bush (Pub. L. 101-336). Title II regulations became effective 1992-01-26 (18 months after enactment). last_updated reflects the ADA Amendments Act of 2008 (signed 2008-09-25), which broadened the definition of disability. informs-hint: Titles II and III are the primary federal legal basis for CSU digital and physical accessibility obligations."
```

### ADA Amendments Act of 2008

```yaml
type: Law
merge_key: title
properties:
  title: "ADA Amendments Act of 2008"
  description: "Amended the Americans with Disabilities Act to broaden the definition of 'disability' and reverse restrictive U.S. Supreme Court interpretations, directing courts to focus on whether discrimination occurred rather than on narrow disability definitions."
  effective_date: "2009-01-01"
  relevant_sections: "Amendments to ADA definitions of 'disability' (42 U.S.C. 12102); rules of construction"
  legislative_authority: "United States Congress"
sources:
  - url: "https://www.congress.gov/110/plaws/publ325/PLAW-110publ325.pdf"
    title: "Public Law 110-325 — ADA Amendments Act of 2008 (congress.gov)"
    accessed: "2026-07-10"
  - url: "https://www.eeoc.gov/statutes/ada-amendments-act-2008"
    title: "ADA Amendments Act of 2008 — U.S. EEOC"
    accessed: "2026-07-10"
confidence: high
notes: "Public Law 110-325, signed 2008-09-25; provisions took effect 2009-01-01 (used as effective_date per the law's operative date). last_updated omitted: the statute has not been further amended by Congress (later 2016 changes were to implementing regulations, not the law). Kept as its own node distinct from the ADA of 1990 per instructions. informs-hint: expands who is protected under the ADA, broadening the population entitled to accessible technology and accommodations."
```

### Rehabilitation Act of 1973, Section 504

```yaml
type: Law
merge_key: title
properties:
  title: "Rehabilitation Act of 1973, Section 504"
  description: "Prohibits discrimination on the basis of disability in any program or activity receiving federal financial assistance or conducted by a federal agency. It is a primary basis for accessibility obligations of colleges and universities that receive federal funds."
  effective_date: "1973-09-26"
  relevant_sections: "Section 504 (29 U.S.C. 794)"
  legislative_authority: "United States Congress"
sources:
  - url: "https://www.dol.gov/agencies/oasam/centers-offices/civil-rights-center/statutes/section-504-rehabilitation-act-of-1973"
    title: "Section 504, Rehabilitation Act of 1973 — U.S. Department of Labor"
    accessed: "2026-07-10"
  - url: "https://www.govinfo.gov/content/pkg/COMPS-799/pdf/COMPS-799.pdf"
    title: "Rehabilitation Act of 1973 (Public Law 93-112) — govinfo.gov"
    accessed: "2026-07-10"
confidence: high
notes: "effective_date = enactment date of Pub. L. 93-112 (87 Stat. 355). last_updated omitted: Section 504's core text has been amended through subsequent Rehabilitation Act reauthorizations, but no single most-significant amendment date could be verified for this section specifically without risk of error. informs-hint: federal-funding condition requiring accessible programs, services, and technology at CSU."
```

### Rehabilitation Act of 1973, Section 508

```yaml
type: Law
merge_key: title
properties:
  title: "Rehabilitation Act of 1973, Section 508"
  description: "Requires federal agencies to make their electronic and information technology accessible to people with disabilities. Its accessibility standards are widely referenced by California law and higher-education procurement requirements."
  effective_date: "1998-08-07"
  relevant_sections: "Section 508 (29 U.S.C. 794d)"
  legislative_authority: "United States Congress"
sources:
  - url: "https://www.section508.gov/manage/laws-and-policies/section-508-law/"
    title: "Section 508 of the Rehabilitation Act, as amended — Section508.gov"
    accessed: "2026-07-10"
  - url: "https://www.dol.gov/agencies/oasam/regulatory/statutes/section-508-rehabilitation-act-of-1973"
    title: "Section 508, Rehabilitation Act of 1973 — U.S. Department of Labor"
    accessed: "2026-07-10"
confidence: medium
notes: "Section 508 was originally added in 1986, then substantially rewritten by the Rehabilitation Act Amendments of 1998 (within the Workforce Investment Act of 1998), signed 1998-08-07 — used as effective_date since that is the modern enforceable form. The Access Board's implementing standards took effect in June 2001 and were refreshed (effective 2018) via regulation, not statute. last_updated omitted to avoid conflating regulatory refreshes with statutory amendment. informs-hint: source of the accessibility standard that California Gov. Code 7405 incorporates by reference for state entities including CSU."
```

### Rehabilitation Act of 1973, Section 501

```yaml
type: Law
merge_key: title
properties:
  title: "Rehabilitation Act of 1973, Section 501"
  description: "Prohibits disability discrimination in federal-sector employment and requires federal executive agencies to take affirmative action to hire, place, and advance individuals with disabilities. Enforced by the U.S. EEOC."
  effective_date: "1973-09-26"
  relevant_sections: "Section 501 (29 U.S.C. 791)"
  legislative_authority: "United States Congress"
sources:
  - url: "https://www.eeoc.gov/rehabilitation-act-1973"
    title: "Rehabilitation Act of 1973 — U.S. EEOC"
    accessed: "2026-07-10"
  - url: "https://www.govinfo.gov/content/pkg/COMPS-799/pdf/COMPS-799.pdf"
    title: "Rehabilitation Act of 1973 (Public Law 93-112) — govinfo.gov"
    accessed: "2026-07-10"
confidence: high
notes: "effective_date = enactment of Pub. L. 93-112. last_updated omitted: no single most-significant statutory amendment date verified for this section. Section 501 applies to federal-sector employment rather than to CSU directly, but is part of the Rehabilitation Act framework."
```

### Rehabilitation Act of 1973, Section 503

```yaml
type: Law
merge_key: title
properties:
  title: "Rehabilitation Act of 1973, Section 503"
  description: "Prohibits disability discrimination in employment by federal contractors and subcontractors and requires affirmative action to recruit, hire, promote, and retain individuals with disabilities. Enforced by the U.S. Department of Labor's OFCCP."
  effective_date: "1973-09-26"
  relevant_sections: "Section 503 (29 U.S.C. 793)"
  legislative_authority: "United States Congress"
sources:
  - url: "https://www.dol.gov/agencies/ofccp/section-503"
    title: "Section 503 — U.S. Department of Labor, OFCCP"
    accessed: "2026-07-10"
  - url: "https://www.dol.gov/agencies/ofccp/section-503/law"
    title: "Section 503 of the Rehabilitation Act of 1973, as Amended — U.S. DOL"
    accessed: "2026-07-10"
confidence: high
notes: "effective_date = enactment of Pub. L. 93-112. In 2014, DOL regulations strengthened Section 503 (7% utilization goal and self-identification), but that was a regulatory update; no statutory amendment date is asserted as last_updated. Applies to entities holding federal contracts of $10,000 or more."
```

### Telecommunications Act of 1996, Section 255

```yaml
type: Law
merge_key: title
properties:
  title: "Telecommunications Act of 1996, Section 255"
  description: "Requires manufacturers of telecommunications equipment and providers of telecommunications services to make their equipment and services accessible to and usable by people with disabilities where readily achievable. Enforced by the FCC."
  effective_date: "1996-02-08"
  relevant_sections: "Section 255 (47 U.S.C. 255)"
  legislative_authority: "United States Congress"
sources:
  - url: "https://www.congress.gov/104/plaws/publ104/PLAW-104publ104.pdf"
    title: "Public Law 104-104 — Telecommunications Act of 1996 (congress.gov)"
    accessed: "2026-07-10"
  - url: "https://www.access-board.gov/about/law/ta.html"
    title: "Telecommunications Act — U.S. Access Board"
    accessed: "2026-07-10"
confidence: high
notes: "effective_date = date the Telecommunications Act of 1996 (Pub. L. 104-104) was signed into law. last_updated omitted: no verified single statutory amendment date for Section 255 (the CVAA of 2010 extended related accessibility obligations through separate provisions)."
```

### 21st Century Communications and Video Accessibility Act of 2010

```yaml
type: Law
merge_key: title
properties:
  title: "21st Century Communications and Video Accessibility Act of 2010"
  description: "Updated federal communications law (amending the Communications Act of 1934) to require accessibility of modern digital, broadband, and mobile communications and video programming, including advanced communications services and captioning of internet-delivered video."
  effective_date: "2010-10-08"
  relevant_sections: "Title I (communications access / advanced communications services); Title II (video programming accessibility)"
  legislative_authority: "United States Congress"
sources:
  - url: "https://www.fcc.gov/consumers/guides/21st-century-communications-and-video-accessibility-act-cvaa"
    title: "21st Century Communications and Video Accessibility Act (CVAA) — FCC"
    accessed: "2026-07-10"
  - url: "https://www.govinfo.gov/link/plaw/111/public/260"
    title: "Public Law 111-260 — govinfo.gov"
    accessed: "2026-07-10"
confidence: high
notes: "effective_date = date Public Law 111-260 was signed by President Obama. last_updated omitted: implementation has proceeded through FCC rulemakings rather than a single significant statutory amendment. informs-hint: supports accessibility of captioned video and communications tools used in higher-education instruction."
```

### Assistive Technology Act of 1998

```yaml
type: Law
merge_key: title
properties:
  title: "Assistive Technology Act of 1998"
  description: "Establishes formula grants to states to support statewide assistive technology programs that increase access to, availability of, and funding for assistive technology for individuals with disabilities."
  effective_date: "1998-11-13"
  last_updated: "2004-10-25"
  relevant_sections: "Statewide AT programs; state grant provisions (29 U.S.C. 3001 et seq.)"
  legislative_authority: "United States Congress"
sources:
  - url: "https://www.congress.gov/105/plaws/publ394/PLAW-105publ394.pdf"
    title: "Public Law 105-394 — Assistive Technology Act of 1998 (congress.gov)"
    accessed: "2026-07-10"
  - url: "https://www.govinfo.gov/content/pkg/PLAW-108publ364/html/PLAW-108publ364.htm"
    title: "Public Law 108-364 — Assistive Technology Act of 2004 (govinfo.gov)"
    accessed: "2026-07-10"
confidence: high
notes: "effective_date = date Pub. L. 105-394 was signed. last_updated = date the Assistive Technology Act of 2004 (Pub. L. 108-364) was signed, reauthorizing and revising the program and removing its sunset. informs-hint: supports AT programs relevant to students and employees with disabilities in the CSU system."
```

### Individuals with Disabilities Education Act

```yaml
type: Law
merge_key: title
properties:
  title: "Individuals with Disabilities Education Act"
  description: "Federal law guaranteeing eligible children with disabilities a free appropriate public education with special education and related services, including provision of accessible instructional materials and assistive technology through the individualized education program (IEP)."
  effective_date: "1990-10-30"
  last_updated: "2004-12-03"
  relevant_sections: "Part B (school-age services); IEP, related services, and assistive technology provisions (20 U.S.C. 1400 et seq.)"
  legislative_authority: "United States Congress"
sources:
  - url: "https://sites.ed.gov/idea/IDEA-History"
    title: "A History of the Individuals with Disabilities Education Act — U.S. Dept. of Education"
    accessed: "2026-07-10"
  - url: "https://en.wikipedia.org/wiki/Individuals_with_Disabilities_Education_Act"
    title: "Individuals with Disabilities Education Act — Wikipedia"
    accessed: "2026-07-10"
confidence: high
notes: "effective_date = 1990-10-30, when Pub. L. 101-476 renamed the Education of the Handicapped Act (predecessor Education for All Handicapped Children Act, Pub. L. 94-142, 1975) as IDEA. last_updated = 2004-12-03, when the Individuals with Disabilities Education Improvement Act (Pub. L. 108-446) was signed; most of its provisions took effect 2005-07-01. Primarily governs K-12; relevant to CSU as a pipeline and via accessible-materials expectations."
```

### California Government Code Section 7405

```yaml
type: Law
merge_key: title
properties:
  title: "California Government Code Section 7405"
  description: "Requires California state governmental entities, when developing, procuring, maintaining, or using electronic or information technology, to comply with the accessibility requirements of Section 508 of the federal Rehabilitation Act and its implementing standards; also obligates contractors to resolve accessibility complaints."
  effective_date: "2017-01-01"
  relevant_sections: "Gov. Code 7405(a) (Section 508 compliance); 7405(b) (contractor complaint resolution)"
  legislative_authority: "California State Legislature"
sources:
  - url: "https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=GOV&sectionNum=7405."
    title: "California Government Code Section 7405 — California Legislative Information"
    accessed: "2026-07-10"
  - url: "https://codes.findlaw.com/ca/government-code/gov-sect-7405/"
    title: "California Government Code - GOV Section 7405 — FindLaw"
    accessed: "2026-07-10"
confidence: medium
notes: "effective_date reflects the current section as reorganized/added by SB 1442 (Stats. 2016, Ch. 870), reported effective 2017-01-01; California statewide EIT accessibility provisions incorporating Section 508 existed in earlier form before this consolidation. Exact original enactment date of the predecessor language was not independently verified, so only the current-form effective date is given. informs-hint: makes federal Section 508 standards binding on CSU as a California state entity."
```

### California Government Code Section 11135

```yaml
type: Law
merge_key: title
properties:
  title: "California Government Code Section 11135"
  description: "Prohibits discrimination and denial of full and equal access, on the basis of disability and other protected characteristics, in any program or activity conducted, operated, administered by, or funded by the State of California; disability provisions require meeting the protections of ADA Title II."
  effective_date: "1977-01-01"
  last_updated: "2017-01-01"
  relevant_sections: "Gov. Code 11135(a) (nondiscrimination in state-funded programs); 11135(b) (ADA Title II protections); 11135(d) (electronic and information technology accessibility)"
  legislative_authority: "California State Legislature"
sources:
  - url: "https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=GOV&sectionNum=11135."
    title: "California Government Code Section 11135 — California Legislative Information"
    accessed: "2026-07-10"
  - url: "https://law.justia.com/codes/california/code-gov/title-2/division-3/part-1/chapter-1/article-9-5/section-11135/"
    title: "California Government Code Section 11135 (2025) — Justia"
    accessed: "2026-07-10"
confidence: medium
notes: "effective_date is year-only: originally added by Stats. 1977, ch. 972; exact effective date not independently verified, so 1977-01-01 is used as a year-only placeholder. last_updated reflects the most recent significant amendment via SB 1442 (Stats. 2016, Ch. 870), effective 2017-01-01; the section was amended many times (1992, 1994, 2001, 2002, 2003, 2005, 2006, 2011, 2016). informs-hint: California-law basis extending ADA Title II protections (and EIT accessibility) to CSU programs and state-funded activities."
```

### California Government Code Section 11546.7

```yaml
type: Law
merge_key: title
properties:
  title: "California Government Code Section 11546.7"
  description: "Requires each California state agency or entity director and CIO to post, biennially, a signed certification on the agency website home page that the site complies with Government Code Sections 7405 and 11135 and with the Web Content Accessibility Guidelines (WCAG) 2.0 or later at minimum Level AA."
  effective_date: "2018-01-01"
  relevant_sections: "Gov. Code 11546.7 (biennial website accessibility certification)"
  legislative_authority: "California State Legislature"
sources:
  - url: "https://leginfo.legislature.ca.gov/faces/billNavClient.xhtml?bill_id=201720180AB434"
    title: "AB-434 State Web accessibility: standard and reports — California Legislative Information"
    accessed: "2026-07-10"
  - url: "https://www.adatitleiii.com/2017/12/california-passes-website-accessibility-requirements-applicable-to-state-agencies/"
    title: "California Passes Website Accessibility Requirements Applicable to State Agencies — ADA Title III blog"
    accessed: "2026-07-10"
confidence: medium
notes: "Added by AB 434 (2017), signed by Governor Brown on 2017-10-14 (Chapter 780, Statutes of 2017); as a non-urgency 2017 statute it took effect 2018-01-01 (used as effective_date). The first certification was due before 2019-07-01 and biennially thereafter. informs-hint: drives WCAG 2.0 AA (or later) compliance certification obligations relevant to CSU public websites."
```

### California Assembly Bill 434 (2017)

```yaml
type: Law
merge_key: title
properties:
  title: "California Assembly Bill 434 (2017)"
  description: "California legislation that created Government Code Section 11546.7, establishing a biennial requirement for state agencies to certify that their websites comply with specified state accessibility standards and WCAG 2.0 (or later) Level AA."
  effective_date: "2018-01-01"
  relevant_sections: "Adds Gov. Code 11546.7; references Gov. Code 7405 and 11135; WCAG 2.0 AA standard"
  legislative_authority: "California State Legislature"
sources:
  - url: "https://leginfo.legislature.ca.gov/faces/billNavClient.xhtml?bill_id=201720180AB434"
    title: "AB-434 State Web accessibility: standard and reports — California Legislative Information"
    accessed: "2026-07-10"
  - url: "https://www.boia.org/blog/what-is-californias-ab-434-accessibility-law-and-why-it-matters"
    title: "What Is California's AB 434 Accessibility Law? — Bureau of Internet Accessibility"
    accessed: "2026-07-10"
confidence: medium
notes: "AB 434 was signed by Governor Brown on 2017-10-14 and chaptered as Chapter 780, Statutes of 2017; effective_date 2018-01-01 reflects the standard effective date for non-urgency 2017 statutes. Enacted as its own node per instructions; its operative provision is codified at Gov. Code 11546.7. informs-hint: legislative origin of California's state-website WCAG certification mandate."
```

### Unruh Civil Rights Act (California Civil Code Section 51)

```yaml
type: Law
merge_key: title
properties:
  title: "Unruh Civil Rights Act (California Civil Code Section 51)"
  description: "California civil rights law guaranteeing full and equal accommodations, advantages, facilities, privileges, and services in all business establishments regardless of disability and other protected characteristics; a violation of the federal ADA also constitutes a violation of this Act."
  effective_date: "1959-01-01"
  relevant_sections: "Civil Code 51 (full and equal access); ADA violations deemed Unruh Act violations"
  legislative_authority: "California State Legislature"
sources:
  - url: "https://www.dor.ca.gov/Home/UnruhCivilRightsAct"
    title: "Unruh Civil Rights Act — California Department of Rehabilitation"
    accessed: "2026-07-10"
  - url: "https://codes.findlaw.com/ca/civil-code/civ-sect-51/"
    title: "California Civil Code Section 51 — FindLaw"
    accessed: "2026-07-10"
confidence: medium
notes: "effective_date is year-only: the Unruh Civil Rights Act was enacted in 1959; a precise effective date was not independently verified, so 1959-01-01 is a year-only placeholder. last_updated omitted: the provision making an ADA violation also an Unruh Act violation was added by a later amendment (Stats. 1992, ch. 913 / AB 1077), but an exact verified effective date is not asserted here. informs-hint: gives disability-access (including ADA-based) violations a California enforcement and damages remedy."
```

### California Education Code Section 67302

```yaml
type: Law
merge_key: title
properties:
  title: "California Education Code Section 67302"
  description: "Requires publishers and manufacturers of instructional materials used by California postsecondary students to provide electronic versions of printed materials so that they can be converted into accessible alternate formats (such as braille, large print, audio, and e-text) for students with disabilities."
  effective_date: "2000-01-01"
  relevant_sections: "Ed. Code 67302 (publisher provision of electronic instructional materials; alternate media for students with disabilities)"
  legislative_authority: "California State Legislature"
sources:
  - url: "https://codes.findlaw.com/ca/education-code/edc-sect-67302.html"
    title: "California Education Code Section 67302 — FindLaw"
    accessed: "2026-07-10"
  - url: "https://www.leginfo.ca.gov/pub/99-00/bill/asm/ab_0401-0450/ab_422_bill_19990915_chaptered.html"
    title: "AB 422 (chaptered 1999-09-15) — California Legislative Information"
    accessed: "2026-07-10"
confidence: medium
notes: "Section 67302 was added by AB 422, chaptered 1999-09-15; as a non-urgency 1999 statute it took effect 2000-01-01 (used as effective_date). last_updated omitted: the section has been amended in later sessions (e.g., 2009), but a specific most-significant amendment date affecting 67302 could not be verified without risk of error. informs-hint: supports provision of accessible instructional/alternate-media materials to CSU students with print disabilities."
```

## Cases

### Payan v. Los Angeles Community College District (9th Cir. 2021)

```yaml
type: Case
merge_key: title
properties:
  title: "Payan v. Los Angeles Community College District (9th Cir. 2021)"
  description: "Blind students sued LACCD under Title II of the ADA and Section 504 of the Rehabilitation Act over inaccessible course materials, websites, and instructional technology. The Ninth Circuit reinstated the students' verdict and clarified the standards for disability discrimination claims against public colleges."
  effective_date: "2021-08-24"
  ruling: "The Ninth Circuit held that disparate-impact disability discrimination claims are cognizable through a private right of action under Title II of the ADA and Section 504, and that a public college must proactively ensure equal access to its educational programs and technology."
  legislative_authority: "U.S. Court of Appeals for the Ninth Circuit"
sources:
  - url: "https://cdn.ca9.uscourts.gov/datastore/opinions/2021/08/24/19-56111.pdf"
    title: "Payan v. Los Angeles Community College District opinion (No. 19-56111)"
    accessed: "2026-07-10"
  - url: "https://law.justia.com/cases/federal/appellate-courts/ca9/19-56111/19-56111-2021-08-24.html"
    title: "Payan v. LACCD, No. 19-56111 (9th Cir. 2021) :: Justia"
    accessed: "2026-07-10"
confidence: high
notes: "informs-hint: highly CSU/California-relevant public higher-education accessibility precedent. A later Ninth Circuit decision (No. 24-1809, 2026-03-11) addressed damages on remand and held emotional-distress damages unavailable under Title II per Cummings v. Premier Rehab Keller; that is a distinct ruling not captured in this node."
```

### Robles v. Domino's Pizza LLC (9th Cir. 2019)

```yaml
type: Case
merge_key: title
properties:
  title: "Robles v. Domino's Pizza LLC (9th Cir. 2019)"
  description: "A blind plaintiff sued over Domino's website and mobile app being inaccessible to screen-reader users, in violation of ADA Title III and California's Unruh Civil Rights Act. The Ninth Circuit reversed dismissal and allowed the case to proceed."
  effective_date: "2019-01-15"
  ruling: "The Ninth Circuit held that ADA Title III applies to the website and mobile app of a business with a nexus to its physical places of public accommodation, and that the lack of formal DOJ web regulations did not deny the company fair notice."
  legislative_authority: "U.S. Court of Appeals for the Ninth Circuit"
sources:
  - url: "https://cdn.ca9.uscourts.gov/datastore/opinions/2019/01/15/17-55504.pdf"
    title: "Robles v. Domino's Pizza, LLC opinion (No. 17-55504)"
    accessed: "2026-07-10"
  - url: "https://law.justia.com/cases/federal/appellate-courts/ca9/17-55504/17-55504-2019-01-15.html"
    title: "Robles v. Domino's Pizza, LLC, No. 17-55504 (9th Cir. 2019) :: Justia"
    accessed: "2026-07-10"
confidence: high
notes: "Citation 913 F.3d 898. The U.S. Supreme Court denied certiorari on 2019-10-07, leaving the Ninth Circuit ruling in place."
```

### National Federation of the Blind v. Target Corp. (N.D. Cal.)

```yaml
type: Case
merge_key: title
properties:
  title: "National Federation of the Blind v. Target Corp. (N.D. Cal.)"
  description: "The NFB and blind plaintiffs sued Target under the ADA and California civil rights laws alleging Target.com was inaccessible to screen-reader users. The court's 2006 ruling on the motion to dismiss and the 2008 class-action settlement were early landmarks for website accessibility."
  effective_date: "2006-09-06"
  ruling: "The district court held that a retailer's website with a sufficient nexus to its physical stores must be accessible under the ADA and California law, denying in relevant part Target's motion to dismiss."
  legislative_authority: "U.S. District Court for the Northern District of California"
sources:
  - url: "https://law.justia.com/cases/federal/district-courts/california/candce/3:2006cv01802/177622/210/"
    title: "National Federation of the Blind et al v. Target Corporation, Doc. 210 (N.D. Cal. 2009) :: Justia"
    accessed: "2026-07-10"
  - url: "https://nfb.org/national-federation-blind-and-target-agree-class-action-settlement"
    title: "National Federation of the Blind and Target Agree to Class Action Settlement (NFB)"
    accessed: "2026-07-10"
confidence: high
notes: "effective_date is the 2006-09-06 ruling on the motion to dismiss (452 F. Supp. 2d 946). The parties reached a class-action settlement in August 2008 (including a $6 million California class fund and NFB accessibility certification/monitoring); the exact final-approval day in 2009 was not independently verified here, so the verifiable landmark ruling date is used."
```

### National Association of the Deaf v. Netflix (D. Mass. 2012)

```yaml
type: Case
merge_key: title
properties:
  title: "National Association of the Deaf v. Netflix (D. Mass. 2012)"
  description: "The NAD sued Netflix under ADA Title III alleging its 'Watch Instantly' streaming service lacked closed captions for deaf and hard-of-hearing users. The district court's ruling and subsequent consent decree required captioning of streaming content."
  effective_date: "2012-06-19"
  ruling: "The district court held that Netflix's web-based 'Watch Instantly' streaming service is a place of public accommodation subject to ADA Title III, even though it has no physical location."
  legislative_authority: "U.S. District Court for the District of Massachusetts"
sources:
  - url: "https://dredf.org/nad-v-netflix/"
    title: "NAD v. Netflix (DREDF case page)"
    accessed: "2026-07-10"
  - url: "https://dredf.org/wp-content/uploads/2011/06/netflix-consent-decree-10-10-12.pdf"
    title: "NAD v. Netflix Consent Decree (Oct. 2012)"
    accessed: "2026-07-10"
confidence: high
notes: "effective_date is the 2012-06-19 district court ruling on public-accommodation status. A consent decree entered in October 2012 required 100% captioning of U.S. streaming content by 2014; the court retained jurisdiction for four years."
```

### National Association of the Deaf v. Harvard University (D. Mass.)

```yaml
type: Case
merge_key: title
properties:
  title: "National Association of the Deaf v. Harvard University (D. Mass.)"
  description: "The NAD and deaf/hard-of-hearing plaintiffs sued Harvard under the ADA and Section 504 for failing to caption publicly available online content, including courses, lectures, and podcasts. The case ended in a court-approved settlement requiring comprehensive captioning."
  effective_date: "2020-02-27"
  ruling: "Under the approved settlement, Harvard agreed to provide high-quality captioning for university online content published on its platforms; an earlier 2019 ruling reaffirmed such content is covered by the ADA and Section 504 while finding Communications Decency Act immunity for certain third-party content."
  legislative_authority: "U.S. District Court for the District of Massachusetts"
sources:
  - url: "https://disabilitylawunited.org/case/online-content-lawsuit-harvard-mit/"
    title: "NAD v. Harvard and NAD v. MIT (Disability Law United)"
    accessed: "2026-07-10"
  - url: "https://www.cohenmilstein.com/case-study/national-association-deaf-et-al-v-harvard-and-mit/"
    title: "NAD et al. v. Harvard and MIT (Cohen Milstein)"
    accessed: "2026-07-10"
confidence: high
notes: "effective_date is the settlement approval date (2020-02-27). Distinct node from NAD v. MIT."
```

### National Association of the Deaf v. Massachusetts Institute of Technology (D. Mass.)

```yaml
type: Case
merge_key: title
properties:
  title: "National Association of the Deaf v. Massachusetts Institute of Technology (D. Mass.)"
  description: "Parallel to the Harvard action, the NAD sued MIT under the ADA and Section 504 for failing to caption publicly available online content. The case ended in a court-approved settlement requiring comprehensive captioning of university online content."
  effective_date: "2020-07-21"
  ruling: "Under the approved settlement, MIT agreed to provide high-quality captioning for university online content across its and university-sponsored online platforms."
  legislative_authority: "U.S. District Court for the District of Massachusetts"
sources:
  - url: "https://clearinghouse.net/case/14353/"
    title: "NAD v. Massachusetts Institute of Technology, 3:15-cv-30024 (Civil Rights Litigation Clearinghouse)"
    accessed: "2026-07-10"
  - url: "https://disabilitylawunited.org/case/online-content-lawsuit-harvard-mit/"
    title: "NAD v. Harvard and NAD v. MIT (Disability Law United)"
    accessed: "2026-07-10"
confidence: high
notes: "effective_date is the settlement approval date (2020-07-21). Distinct node from NAD v. Harvard."
```

### Enyart v. National Conference of Bar Examiners (9th Cir. 2011)

```yaml
type: Case
merge_key: title
properties:
  title: "Enyart v. National Conference of Bar Examiners (9th Cir. 2011)"
  description: "A blind law graduate sought to use assistive screen-reader and screen-magnification software to take the Multistate Bar Exam and MPRE. The Ninth Circuit affirmed a preliminary injunction requiring the testing entity to provide her chosen assistive technology."
  effective_date: "2011-01-04"
  ruling: "The Ninth Circuit held that under ADA Title III a testing entity must offer examinations in a manner and with auxiliary aids that best ensure the exam measures the test-taker's aptitude rather than the effects of disability, upholding the plaintiff's requested assistive technology."
  legislative_authority: "U.S. Court of Appeals for the Ninth Circuit"
sources:
  - url: "https://caselaw.findlaw.com/court/us-9th-circuit/1551247.html"
    title: "Enyart v. National Conference of Bar Examiners, Inc. (9th Cir. 2011) :: FindLaw"
    accessed: "2026-07-10"
  - url: "https://dralegal.org/case/enyart-v-national-conference-of-bar-examiners-ncbe/"
    title: "Enyart v. NCBE (Disability Rights Advocates)"
    accessed: "2026-07-10"
confidence: high
notes: "Citation 630 F.3d 1153. Opinion filed 2011-01-04 and later amended (Justia lists an amended version dated 2011-02-25); effective_date uses the original filing date."
```

### Gil v. Winn-Dixie Stores, Inc. (11th Cir. 2021)

```yaml
type: Case
merge_key: title
properties:
  title: "Gil v. Winn-Dixie Stores, Inc. (11th Cir. 2021)"
  description: "A blind customer sued Winn-Dixie under ADA Title III over a website incompatible with screen readers. A three-judge panel issued a decision, which the Eleventh Circuit later vacated as moot."
  effective_date: "2021-04-07"
  ruling: "The panel held that websites are not 'places of public accommodation' under ADA Title III, which it read to cover only physical places; the panel opinion was later vacated and the appeal dismissed as moot."
  legislative_authority: "U.S. Court of Appeals for the Eleventh Circuit"
sources:
  - url: "https://law.justia.com/cases/federal/appellate-courts/ca11/17-13467/17-13467-2021-04-07.html"
    title: "Gil v. Winn-Dixie Stores, Inc., No. 17-13467 (11th Cir. 2021) :: Justia"
    accessed: "2026-07-10"
  - url: "https://www.hklaw.com/en/insights/publications/2022/01/11th-circuit-vacates-opinion-holding-that-websites-are-not-ada-public"
    title: "Eleventh Circuit Vacates Opinion Holding Websites Are Not ADA Public Accommodations (Holland & Knight)"
    accessed: "2026-07-10"
confidence: high
notes: "Citation 993 F.3d 1266 (11th Cir. 2021). The panel opinion was vacated on 2021-12-28 (21 F.4th 775) and the appeal dismissed as moot, so it holds no precedential value; included to represent the circuit split on website coverage. effective_date is the original panel decision date."
```

### Authors Guild, Inc. v. HathiTrust (2d Cir. 2014)

```yaml
type: Case
merge_key: title
properties:
  title: "Authors Guild, Inc. v. HathiTrust (2d Cir. 2014)"
  description: "Authors challenged the mass digitization of library books into the HathiTrust Digital Library, which enabled full-text search and provided accessible formats to print-disabled patrons. The Second Circuit largely affirmed a fair-use finding."
  effective_date: "2014-06-10"
  ruling: "The Second Circuit held that providing full-text search and giving print-disabled users access to digitized copies of copyrighted works are fair uses under Section 107 of the Copyright Act."
  legislative_authority: "U.S. Court of Appeals for the Second Circuit"
sources:
  - url: "https://law.justia.com/cases/federal/appellate-courts/ca2/12-4547/12-4547-2014-06-10.html"
    title: "Authors Guild, Inc. v. HathiTrust, No. 12-4547 (2d Cir. 2014) :: Justia"
    accessed: "2026-07-10"
  - url: "https://www.copyright.gov/fair-use/summaries/authorsguild-hathitrust-2dcir2014.pdf"
    title: "Authors Guild, Inc. v. HathiTrust, 755 F.3d 87 (2d Cir. 2014) (U.S. Copyright Office summary)"
    accessed: "2026-07-10"
confidence: high
notes: "Citation 755 F.3d 87. informs-hint: relevant to accessible instructional materials / print-disabled access in higher education."
```

### United States v. Miami University (S.D. Ohio consent decree, 2016)

```yaml
type: Case
merge_key: title
properties:
  title: "United States v. Miami University (S.D. Ohio consent decree, 2016)"
  description: "Following blind student Aleeha Dudley's suit, the DOJ intervened and alleged Miami University's web content and classroom/instructional technologies violated ADA Title II. The parties resolved the case through a comprehensive consent decree."
  effective_date: "2016-10-17"
  ruling: "Under the consent decree, Miami University agreed to make its websites, learning management systems, and instructional technologies conform to WCAG 2.0 Level AA, adopt accessible procurement practices, train faculty and staff, and pay $25,000 in compensation."
  legislative_authority: "U.S. Department of Justice (U.S. District Court for the Southern District of Ohio)"
sources:
  - url: "https://www.justice.gov/archives/opa/pr/miami-university-agrees-overhaul-critical-technologies-settle-disability-discrimination"
    title: "Miami University Agrees to Overhaul Critical Technologies to Settle Disability Discrimination Lawsuit (DOJ)"
    accessed: "2026-07-10"
  - url: "https://archive.ada.gov/miami_university_cd.html"
    title: "Consent Decree: Aleeha Dudley and the United States v. Miami University (ADA.gov archive)"
    accessed: "2026-07-10"
confidence: high
notes: "effective_date is the DOJ announcement/lodging date of the consent decree (2016-10-17); the exact court-entry date was not separately confirmed here."
```

### United States v. Louisiana Tech University (DOJ settlement, 2013)

```yaml
type: Case
merge_key: title
properties:
  title: "United States v. Louisiana Tech University (DOJ settlement, 2013)"
  description: "The DOJ investigated a complaint by a blind student who was effectively excluded from a course because the required MyOMLab online learning product was inaccessible. The matter was resolved by a settlement agreement under ADA Title II."
  effective_date: "2013-07-12"
  ruling: "The DOJ determined that requiring a blind student to use an inaccessible online learning product violated ADA Title II, and the settlement required the university to adopt technology meeting WCAG 2.0 Level AA, train instructors and administrators, and pay $23,543 in damages."
  legislative_authority: "U.S. Department of Justice"
sources:
  - url: "https://archive.ada.gov/louisiana-tech.htm"
    title: "Settlement Agreement between the United States and Louisiana Tech University (ADA.gov archive)"
    accessed: "2026-07-10"
  - url: "https://www.justice.gov/archives/opa/pr/justice-department-settles-louisiana-tech-university-over-inaccessible-course-materials"
    title: "Justice Department Settles with Louisiana Tech University Over Inaccessible Course Materials (DOJ)"
    accessed: "2026-07-10"
confidence: high
notes: "effective_date is the settlement agreement date (2013-07-12); the DOJ press release announcing it was dated 2013-07-23."
```

### United States v. Regents of the University of California (Berkeley) (consent decree, 2022)

```yaml
type: Case
merge_key: title
properties:
  title: "United States v. Regents of the University of California (Berkeley) (consent decree, 2022)"
  description: "After a DOJ investigation into UC Berkeley's free online content (MOOCs, YouTube, podcasts, and web content) that began with a 2014 NAD complaint about missing captions, the parties entered a consent decree requiring the content to be made accessible."
  effective_date: "2022-11-21"
  ruling: "Under the consent decree, UC Berkeley agreed to bring its free online content into conformance with WCAG 2.0 Level AA on phased timelines, including captions, audio description, and alternative text, and to designate a web accessibility coordinator and engage an independent auditor."
  legislative_authority: "U.S. Department of Justice (U.S. District Court for the Northern District of California)"
sources:
  - url: "https://www.justice.gov/d9/case-documents/attachments/2022/11/21/consent_decree_-_u.s._v._uc_berkeley.pdf"
    title: "Consent Decree, United States v. UC Berkeley (DOJ)"
    accessed: "2026-07-10"
  - url: "https://www.justice.gov/archives/opa/pr/justice-department-secures-agreement-university-california-berkeley-make-online-content"
    title: "Justice Department Secures Agreement with UC Berkeley to Make Online Content Accessible (DOJ)"
    accessed: "2026-07-10"
confidence: high
notes: "effective_date is the consent decree filing date (2022-11-21); it was court-approved on 2022-12-02. informs-hint: California higher-ed relevant. A predecessor 2016 DOJ Letter of Findings (issued 2016-08-30) found the earlier online content non-compliant and prompted Berkeley's threat to remove free content; that findings letter is a distinct action not separately noded here."
```

### National Federation of the Blind v. Pennsylvania State University (OCR resolution, 2011)

```yaml
type: Case
merge_key: title
properties:
  title: "National Federation of the Blind v. Pennsylvania State University (OCR resolution, 2011)"
  description: "The NFB filed a complaint with the U.S. Department of Education's Office for Civil Rights alleging Penn State's electronic and information technology was inaccessible to blind students, faculty, and staff. The parties reached a resolution agreement."
  ruling: "Penn State agreed to make its electronic and information technology, including course management systems, websites, classroom technology, and library resources, fully accessible, and to adopt a policy requiring conformance with WCAG 2.0 Level AA."
  legislative_authority: "U.S. Department of Education, Office for Civil Rights"
sources:
  - url: "https://nfb.org/about-us/press-room/national-federation-blind-and-penn-state-resolve-accessibility-complaint"
    title: "National Federation of the Blind and Penn State Resolve Accessibility Complaint (NFB)"
    accessed: "2026-07-10"
  - url: "https://accessibility.psu.edu/nfbpsusettlement/"
    title: "Settlement Between Penn State University and National Federation of the Blind (Penn State)"
    accessed: "2026-07-10"
confidence: medium
notes: "effective_date omitted: sources place the resolution in October 2011 but an exact execution/signature day was not verified, so no ISO date is asserted rather than guessing. The agreement set 2012 corrective-action milestones."
```

### South Carolina Technical College System (OCR Compliance Review No. 11-11-6002, 2013)

```yaml
type: Case
merge_key: title
properties:
  title: "South Carolina Technical College System (OCR Compliance Review No. 11-11-6002, 2013)"
  description: "The Department of Education's Office for Civil Rights conducted a compliance review of the South Carolina Technical College System's websites (including course management systems and library resources) and found them not readily accessible to users of assistive technology. The System entered a voluntary resolution agreement."
  effective_date: "2013-03-08"
  ruling: "OCR found the System's websites not in compliance with Section 504 and ADA Title II because they were not usable by people requiring assistive technology in an equally effective and integrated manner, and the System agreed to remediate its sites, conduct annual accessibility reviews, and report to OCR."
  legislative_authority: "U.S. Department of Education, Office for Civil Rights"
sources:
  - url: "https://www.ed.gov/media/document/11116002-apdf-31104.pdf"
    title: "OCR Resolution Letter, South Carolina Technical College System (Compliance Review No. 11-11-6002)"
    accessed: "2026-07-10"
  - url: "https://www.ed.gov/sites/ed/files/about/offices/list/ocr/docs/investigations/11116002-b.pdf"
    title: "Resolution Agreement, South Carolina Technical College System"
    accessed: "2026-07-10"
confidence: high
notes: "effective_date is the OCR resolution letter date (2013-03-08). Review focused on the system office plus Florence-Darlington Technical College and Horry-Georgetown Technical College."
```

### California State University, Long Beach (OCR Docket No. 09-99-2041, 1999)

```yaml
type: Case
merge_key: title
properties:
  title: "California State University, Long Beach (OCR Docket No. 09-99-2041, 1999)"
  description: "OCR investigated a complaint that CSU Long Beach failed to provide a blind student with accommodations needed to access the College of Business curriculum, including adaptive computer technology and accessible course materials. The University resolved the matter through a voluntary resolution plan."
  effective_date: "1999-04-20"
  ruling: "OCR accepted the University's voluntary resolution plan, under which CSU Long Beach committed to procedures for installing and maintaining adaptive workstations, considering accessibility in technology purchasing, and ensuring campus web pages are designed for accessibility to users with disabilities."
  legislative_authority: "U.S. Department of Education, Office for Civil Rights"
sources:
  - url: "http://www.southwestada.org/html/topical/FAPSI/OCR/csu-lb.html"
    title: "OCR Letter: California State University - Long Beach (Docket 09-99-2041)"
    accessed: "2026-07-10"
confidence: high
notes: "effective_date is the OCR resolution letter date (1999-04-20); the University's voluntary resolution plan was received 1999-04-01. informs-hint: directly CSU-campus relevant, and an early example of OCR treating web accessibility as a Title II/Section 504 obligation."
```

### California State University, Los Angeles (OCR Docket No. 09-97-2002, 1997)

```yaml
type: Case
merge_key: title
properties:
  title: "California State University, Los Angeles (OCR Docket No. 09-97-2002, 1997)"
  description: "OCR investigated a complaint that CSU Los Angeles failed to provide blind and low-vision students access to library resources, campus publications, and open computer laboratories, and provided insufficient adaptive-technology training. The University elected voluntary resolution."
  effective_date: "1997-04-07"
  ruling: "OCR accepted the University's written commitment to resolve the issues, applying Title II's requirement that communications with people with disabilities (including printed and Internet-based information) be as effective as those with others and that primary consideration be given to the individual's requested auxiliary aids."
  legislative_authority: "U.S. Department of Education, Office for Civil Rights"
sources:
  - url: "http://www.southwestada.org/html/topical/FAPSI/OCR/csu-la.html"
    title: "OCR Letter: California State University - Los Angeles (Docket 09-97-2002)"
    accessed: "2026-07-10"
confidence: high
notes: "effective_date is the OCR letter-of-findings issue date (1997-04-07); resolution rested on the University's 1997-03-14 written commitment interpreted against OCR's 1997-02-06 proposed resolution. informs-hint: directly CSU-campus relevant early OCR accessibility resolution."
```

## Directives

### DOJ Title II Web and Mobile Accessibility Final Rule (2024)

```yaml
type: Directive
merge_key: title
properties:
  title: "DOJ Title II Web and Mobile Accessibility Final Rule (2024)"
  description: "Final rule amending the ADA Title II regulation (28 CFR Part 35) to require web content and mobile apps of state and local government entities to conform to WCAG 2.1 Level AA. Published April 24, 2024 (89 FR 31320); compliance phased by entity population."
  effective_date: "2024-06-24"
  last_updated: "2026-04-20"
  source_institution: "U.S. Department of Justice"
sources:
  - url: "https://www.federalregister.gov/documents/2024/04/24/2024-07758/nondiscrimination-on-the-basis-of-disability-accessibility-of-web-information-and-services-of-state"
    title: "Nondiscrimination on the Basis of Disability; Accessibility of Web Information and Services of State and Local Government Entities"
    accessed: "2026-07-10"
  - url: "https://www.ada.gov/resources/2024-03-08-web-rule/"
    title: "Fact Sheet: New Rule on the Accessibility of Web Content and Mobile Apps"
    accessed: "2026-07-10"
  - url: "https://www.federalregister.gov/documents/2026/04/20/2026-07663/extension-of-compliance-dates-for-nondiscrimination-on-the-basis-of-disability-accessibility-of-web"
    title: "Extension of Compliance Dates (interim final rule)"
    accessed: "2026-07-10"
confidence: high
notes: "Effective date June 24, 2024 (60 days after April 24, 2024 publication). last_updated reflects the April 20, 2026 interim final rule extending compliance dates (large-entity date moved from April 24, 2026 to April 26, 2027). informs-hint: primary standard driving current CSU/state-government web and mobile accessibility obligations. HUMAN-VERIFY the 2026 compliance-date extension before load."
```

### Revised Section 508 Standards and Section 255 Guidelines (ICT Refresh)

```yaml
type: Directive
merge_key: title
properties:
  title: "Revised Section 508 Standards and Section 255 Guidelines (ICT Refresh)"
  description: "U.S. Access Board final rule (36 CFR Part 1194) updating and reorganizing the Section 508 Standards and Section 255 Guidelines for information and communication technology, incorporating WCAG 2.0 Level AA by reference. Published January 18, 2017 (82 FR 5790)."
  effective_date: "2017-03-21"
  last_updated: "2018-01-18"
  source_institution: "U.S. Access Board"
sources:
  - url: "https://www.access-board.gov/ict/"
    title: "Revised 508 Standards and 255 Guidelines"
    accessed: "2026-07-10"
  - url: "https://www.federalregister.gov/documents/2017/03/02/2017-04059/information-and-communication-technology-ict-standards-and-guidelines"
    title: "Information and Communication Technology (ICT) Standards and Guidelines"
    accessed: "2026-07-10"
confidence: high
notes: "Published Jan 18, 2017; rule effective date delayed to March 21, 2017; compliance with the Section 508-based standards required beginning January 18, 2018 (used as last_updated). Overlaps conceptually with the Guideline node 'Revised Section 508 Standards (36 CFR Part 1194) (2017)' — see Open Questions. informs-hint: WCAG 2.0 AA baseline referenced throughout CSU ATI and campus ICT policies."
```

### ADA Title II Regulation (28 CFR Part 35), 2010 Revision

```yaml
type: Directive
merge_key: title
properties:
  title: "ADA Title II Regulation (28 CFR Part 35), 2010 Revision"
  description: "U.S. Department of Justice regulation implementing Title II of the Americans with Disabilities Act, governing nondiscrimination on the basis of disability by state and local government entities. 2010 revised regulation published September 15, 2010, adopting the 2010 ADA Standards for Accessible Design."
  effective_date: "2011-03-15"
  last_updated: "2024-06-24"
  source_institution: "U.S. Department of Justice"
sources:
  - url: "https://www.ada.gov/law-and-regs/regulations/title-ii-2010-regulations/"
    title: "Americans with Disabilities Act Title II Regulations"
    accessed: "2026-07-10"
confidence: high
notes: "Originally issued 1991; 2010 revised regulation published Sept 15, 2010 and used beginning March 15, 2011 (effective_date). last_updated reflects the 2024 DOJ web/mobile final rule amending Part 35. informs-hint: statutory-regulatory basis for the 2024 web accessibility rule."
```

### ADA Title III Regulation (28 CFR Part 36), 2010 Revision

```yaml
type: Directive
merge_key: title
properties:
  title: "ADA Title III Regulation (28 CFR Part 36), 2010 Revision"
  description: "U.S. Department of Justice regulation implementing Title III of the Americans with Disabilities Act, governing nondiscrimination by public accommodations and commercial facilities. 2010 revised regulation published September 15, 2010, adopting the 2010 ADA Standards for Accessible Design."
  effective_date: "2011-03-15"
  last_updated: "2010-09-15"
  source_institution: "U.S. Department of Justice"
sources:
  - url: "https://www.ada.gov/law-and-regs/regulations/title-iii-regulations/"
    title: "Americans with Disabilities Act Title III Regulations"
    accessed: "2026-07-10"
confidence: high
notes: "Originally issued 1991; 2010 revised regulation published Sept 15, 2010 and used beginning March 15, 2011 (effective_date). informs-hint: applies to public accommodations; relevant to CSU auxiliary/third-party contexts."
```

### CSU Executive Order 926: Policy on Disability Support and Accommodations

```yaml
type: Directive
merge_key: title
properties:
  title: "CSU Executive Order 926: Policy on Disability Support and Accommodations"
  description: "California State University systemwide executive order establishing the CSU Policy on Disability Support and Accommodations, providing the framework for disability access and inclusion across all campuses and the Office of the Chancellor. Superseded by Executive Order 1111 in 2018."
  effective_date: "2005-01-01"
  source_institution: "California State University, Office of the Chancellor"
sources:
  - url: "https://www.sjsu.edu/accessibility/docs/PD_2007-02.pdf"
    title: "SJSU Presidential Directive 2007-02 (references EO 926 issuance)"
    accessed: "2026-07-10"
  - url: "https://www.calstatela.edu/sites/default/files/eo-1111.pdf"
    title: "Executive Order 1111 (states it supersedes EO 926)"
    accessed: "2026-07-10"
confidence: medium
notes: "Month/year of issuance (January 2005) verified via SJSU Presidential Directive 2007-02, a primary CSU campus source ('In January of 2005, the CSU issued Executive Order 926'); exact day not verified, so YYYY-01-01 used (year-only). last_updated omitted as unverifiable. Some secondary sources say 2004; primary campus source supports January 2005. Superseded by EO 1111 (2018-05-23). informs-hint: predecessor to EO 1111."
```

### CSU Executive Order 1111: Board of Trustees Policy on Disability Support and Accommodations

```yaml
type: Directive
merge_key: title
properties:
  title: "CSU Executive Order 1111: Board of Trustees Policy on Disability Support and Accommodations"
  description: "California State University systemwide executive order setting the CSU Board of Trustees Policy on Disability Support and Accommodations, covering physical access, information resources and technology access (the Accessible Technology Initiative), and disability accommodation for students, employees, and contracting. Supersedes Executive Order 926."
  effective_date: "2018-05-23"
  last_updated: "2018-05-23"
  source_institution: "California State University, Office of the Chancellor"
sources:
  - url: "https://www.calstatela.edu/sites/default/files/eo-1111.pdf"
    title: "Executive Order 1111 (full text, signed by Chancellor Timothy P. White)"
    accessed: "2026-07-10"
confidence: high
notes: "Effective date May 23, 2018 confirmed in the executive order's own header and signature block. Current governing CSU EO on disability support and accommodations; no verified successor EO as of the accessed date. informs-hint: directs issuance of ATI Coded Memoranda and campus ICT accessibility obligations."
```

### Executive Order 13548: Increasing Federal Employment of Individuals with Disabilities (2010)

```yaml
type: Directive
merge_key: title
properties:
  title: "Executive Order 13548: Increasing Federal Employment of Individuals with Disabilities (2010)"
  description: "Federal executive order signed by President Barack Obama on the 20th anniversary of the ADA, directing federal agencies to improve hiring and retention of individuals with disabilities, including through accessible technology and reasonable accommodation. Published in the Federal Register July 30, 2010."
  effective_date: "2010-07-26"
  last_updated: "2010-07-26"
  source_institution: "President of the United States (Executive Office of the President)"
sources:
  - url: "https://www.federalregister.gov/documents/2010/07/30/2010-18988/increasing-federal-employment-of-individuals-with-disabilities"
    title: "Increasing Federal Employment of Individuals With Disabilities"
    accessed: "2026-07-10"
confidence: high
notes: "Signed July 26, 2010; published in the Federal Register July 30, 2010. Federal-workforce focus rather than ICT-specific; included as a verifiable federal executive order on disability. informs-hint: contextual federal disability-employment directive, not a direct source of CSU web-accessibility requirements."
```

## External Policies

### CSU Systemwide Accessible Technology Initiative (ATI) Policy

```yaml
type: ExternalPolicy
merge_key: title
properties:
  title: "CSU Systemwide Accessible Technology Initiative (ATI) Policy"
  description: "California State University systemwide policy and program requiring information and communication technology used across the CSU to be accessible to students, employees, and the public with disabilities, structured around three priority areas: web, instructional materials, and procurement. Governed by CSU Coded Memorandum AA-2013-03 and its amendment AA-2015-22, under the authority of Executive Order 1111."
  effective_date: "2006-09-28"
  last_updated: "2013-01-29"
sources:
  - url: "https://ati.calstate.edu/"
    title: "Accessible Technology Initiative (ATI)"
    accessed: "2026-07-10"
  - url: "https://www.calstate.edu/csu-system/administration/codedmemos/Academic%20Affairs%20Coded%20Memos/AA-2013-03.pdf"
    title: "Coded Memorandum AA-2013-03: Accessible Technology Initiative"
    accessed: "2026-07-10"
  - url: "https://www.sjsu.edu/accessibility/docs/PD_2007-02.pdf"
    title: "SJSU PD 2007-02 (documents ATI initiation via AA-2006-41, Sept 28 2006)"
    accessed: "2026-07-10"
confidence: medium
notes: "effective_date reflects ATI initiation via Coded Memorandum AA-2006-41 (September 28, 2006), verified through the SJSU primary source. last_updated reflects the current governing memo AA-2013-03 (January 29, 2013); further amended by AA-2015-22 (2015). informs-hint: operationalizes EO 1111 Section IV."
```

### CSU Board of Trustees Policy on Disability Support and Accommodations

```yaml
type: ExternalPolicy
merge_key: title
properties:
  title: "CSU Board of Trustees Policy on Disability Support and Accommodations"
  description: "California State University Board of Trustees policy ensuring equal access and reasonable accommodation for individuals with disabilities across academic programs, student services, employment, information technology, procurement, and physical facilities. Embodied in and enacted through Executive Order 1111."
  effective_date: "2018-05-23"
  last_updated: "2018-05-23"
sources:
  - url: "https://www.calstatela.edu/sites/default/files/eo-1111.pdf"
    title: "Executive Order 1111 (Board of Trustees Policy on Disability Support and Accommodations)"
    accessed: "2026-07-10"
confidence: high
notes: "This policy is the substantive content of EO 1111 (the enacting directive); represented here as the organizational policy node while the EO itself is represented as a Directive. Effective May 23, 2018 per the EO text. See Open Questions re: possible overlap. informs-hint: policy instantiated by Directive 'CSU Executive Order 1111.'"
```

### San José State University Access to Electronic and Information Technology Policy for Persons with Disabilities (Presidential Directive 2007-02)

```yaml
type: ExternalPolicy
merge_key: title
properties:
  title: "San José State University Access to Electronic and Information Technology Policy for Persons with Disabilities (Presidential Directive 2007-02)"
  description: "Representative CSU campus policy establishing SJSU's requirements and guidelines for accessible electronic and information technology, including web content, instructional materials, and ICT procurement, in compliance with Section 508, the ADA, California Government Code 11135, and CSU ATI Coded Memoranda. Issued as Presidential Directive 2007-02."
  effective_date: "2007-03-12"
  last_updated: "2007-03-12"
sources:
  - url: "https://www.sjsu.edu/accessibility/docs/PD_2007-02.pdf"
    title: "SJSU Presidential Directive 2007-02"
    accessed: "2026-07-10"
confidence: high
notes: "Dated March 12, 2007 in the directive's own memorandum header, signed by President Don W. Kassing. Representative named-campus ICT/EIT accessibility policy. informs-hint: campus-level implementation of CSU ATI and EO 926/1111."
```

### University of California IT Accessibility Policy (IMT-1300)

```yaml
type: ExternalPolicy
merge_key: title
properties:
  title: "University of California IT Accessibility Policy (IMT-1300)"
  description: "University of California systemwide policy establishing requirements for accessible information technology across UC locations, referencing WCAG and Section 508-aligned standards, to ensure individuals with disabilities have comparable access to electronic information and IT services. Included as a peer-system reference policy."
  effective_date: "2013-08-27"
  last_updated: "2026-03-17"
sources:
  - url: "https://policy.ucop.edu/doc/7000611"
    title: "University of California Policy IMT-1300, IT Accessibility"
    accessed: "2026-07-10"
  - url: "https://www.ucop.edu/electronic-accessibility/initiative/policy.html"
    title: "UC Electronic Accessibility Policy"
    accessed: "2026-07-10"
confidence: high
notes: "Originally approved August 27, 2013 (effective_date). Most recent revision effective March 17, 2026 (last_updated) — HUMAN-VERIFY this 2026 revision date before load. Peer/reference policy from the University of California system, not CSU. informs-hint: comparator for CSU ATI systemwide policy."
```

## Memos

### CSU Coded Memorandum AA-2007-04: Access to Electronic and Information Technology for Persons with Disabilities (2007)

```yaml
type: Memo
merge_key: title
properties:
  title: "CSU Coded Memorandum AA-2007-04: Access to Electronic and Information Technology for Persons with Disabilities (2007)"
  description: "CSU Chancellor's Office coded memorandum that set revised timelines, tasks, and deliverables for implementing the Accessible Technology Initiative (ATI) across web accessibility, instructional materials, and procurement, replacing Sections III and IV of AA-2006-41. Signed by Executive Vice Chancellors Gary W. Reichard and Richard P. West."
  authored_date: "2007-02-09"
sources:
  - url: "http://web.archive.org/web/2015/http://www.calstate.edu/AcadAff/codedmemos/AA-2007-04.pdf"
    title: "CSU Coded Memorandum AA-2007-04 (PDF, via Internet Archive)"
    accessed: "2026-07-10"
  - url: "https://www.csuchico.edu/ati/chancellor-policies.shtml"
    title: "Chancellor Policies - Accessible Technology Initiative (CSU Chico)"
    accessed: "2026-07-10"
confidence: high
notes: "Date verified from the memo header (DATE: February 9, 2007). Live calstate.edu PDF is behind bot protection; date confirmed via Internet Archive capture. informs-hint: foundational ATI directive that later memos (AA-2010-13, AA-2013-03) revise."
```

### CSU Coded Memorandum AA-2010-13: Revision of Accessible Technology Initiative Coded Memo (2010)

```yaml
type: Memo
merge_key: title
properties:
  title: "CSU Coded Memorandum AA-2010-13: Revision of Accessible Technology Initiative Coded Memo (2010)"
  description: "CSU Chancellor's Office coded memorandum revising the overall approach, tasks, and timelines of AA-2007-04 after three years of ATI experience, adding guidance on ATI governance and roles and reframing implementation as a continuous activity. Signed under Executive Vice Chancellor for Academic Affairs."
  authored_date: "2010-06-14"
sources:
  - url: "http://web.archive.org/web/2018/https://www.calstate.edu/acadaff/codedmemos/AA-2010-13.shtml"
    title: "AA-2010-13: Revision of Accessible Technology Initiative (ATI) (via Internet Archive)"
    accessed: "2026-07-10"
confidence: high
notes: "Date and subject verified from the archived coded-memo page (Code: AA-2010-13; Date: June 14, 2010; Subject: Revision of Accessible Technology Initiative Coded Memo)."
```

### CSU Coded Memorandum AA-2013-03: Accessible Technology Initiative (2013)

```yaml
type: Memo
merge_key: title
properties:
  title: "CSU Coded Memorandum AA-2013-03: Accessible Technology Initiative (2013)"
  description: "CSU Chancellor's Office coded memorandum that updated and consolidated ATI policy, reaffirming the three ATI priority areas (web accessibility, instructional materials, and procurement) and superseding prior ATI coded memoranda. Signed by Executive Vice Chancellor and Chief Academic Officer Ephraim P. Smith."
  authored_date: "2013-01-29"
sources:
  - url: "http://web.archive.org/web/2016/http://www.calstate.edu/AcadAff/codedmemos/AA-2013-03.pdf"
    title: "CSU Coded Memorandum AA-2013-03 (PDF, via Internet Archive)"
    accessed: "2026-07-10"
confidence: high
notes: "Date verified from the memo header (Date: January 29, 2013; Subject: Accessible Technology Initiative). informs-hint: current ATI framework together with addendum AA-2015-22."
```

### CSU Coded Memorandum AA-2015-22: Accessible Technology Initiative Addendum (2015)

```yaml
type: Memo
merge_key: title
properties:
  title: "CSU Coded Memorandum AA-2015-22: Accessible Technology Initiative Addendum (2015)"
  description: "CSU Chancellor's Office coded memorandum issued as an addendum to AA-2013-03 that replaces the Implementation section of that memo, directing campuses to develop and update ATI plans to reflect current practices."
  authored_date: "2015-12-02"
sources:
  - url: "http://web.archive.org/web/2018/http://www.calstate.edu/AcadAff/codedmemos/AA-2015-22.pdf"
    title: "CSU Coded Memorandum AA-2015-22 (PDF, via Internet Archive)"
    accessed: "2026-07-10"
confidence: high
notes: "Date verified from the memo header (DATE: December 2, 2015). informs-hint: addendum to AA-2013-03; together they form the current CSU ATI coded-memo set."
```

### CSU Memorandum: Recommended Campus Actions to Improve Accessibility of Online Education (2013)

```yaml
type: Memo
merge_key: title
properties:
  title: "CSU Memorandum: Recommended Campus Actions to Improve Accessibility of Online Education (2013)"
  description: "CSU Chancellor's Office memorandum to presidents outlining recommended campus responsibilities for accessibility in online courses, referencing recent legal settlements and the future direction of the ATI. Signed by Executive Vice Chancellor Ephraim P. Smith."
  authored_date: "2013-08-13"
sources:
  - url: "https://access.sfsu.edu/sites/default/files/documents/Memo%20to%20Pres%20-%20Accessibility%20and%20Online%20Education%208-2013.pdf"
    title: "Campus Accessibility Strategy for Online Education (PDF, hosted by SF State)"
    accessed: "2026-07-10"
confidence: medium
notes: "Date verified from the memo (August 13, 2013). This is a Chancellor's Office guidance memo, not a numbered coded memorandum; no coded-memo number was confirmed."
```

### Joint Dear Colleague Letter on Electronic Book Readers (2010)

```yaml
type: Memo
merge_key: title
properties:
  title: "Joint Dear Colleague Letter on Electronic Book Readers (2010)"
  description: "Joint U.S. Department of Justice and Department of Education Office for Civil Rights letter reminding colleges and universities that requiring students to use e-book readers inaccessible to blind or low-vision students may violate Title II/III of the ADA and Section 504 of the Rehabilitation Act."
  authored_date: "2010-06-29"
sources:
  - url: "https://archive.ada.gov/kindle_ltr_eddoj.htm"
    title: "Joint DOJ/DOE Dear Colleague Letter on Electronic Book Readers (ADA.gov archive)"
    accessed: "2026-07-10"
  - url: "https://www.ed.gov/sites/ed/files/about/offices/list/ocr/letters/colleague-20100629.pdf"
    title: "Dear Colleague Letter: Electronic Book Readers (PDF, ED OCR)"
    accessed: "2026-07-10"
confidence: high
notes: "Date verified from ADA.gov and ED OCR primary copies (June 29, 2010). informs-hint: foundational federal guidance on inaccessible instructional technology in higher education."
```

### OCR Frequently Asked Questions on the June 29, 2010 Dear Colleague Letter (Electronic Book Readers) (2011)

```yaml
type: Memo
merge_key: title
properties:
  title: "OCR Frequently Asked Questions on the June 29, 2010 Dear Colleague Letter (Electronic Book Readers) (2011)"
  description: "U.S. Department of Education Office for Civil Rights follow-up guidance answering frequently asked questions about the June 29, 2010 electronic book reader Dear Colleague Letter, clarifying its application to emerging technology, online courses, print disabilities, and K-12 as well as postsecondary settings. Designated a 'significant guidance document.'"
  authored_date: "2011-05-26"
sources:
  - url: "https://www.ed.gov/sites/ed/files/about/offices/list/ocr/docs/dcl-ebook-faq-201105.pdf"
    title: "FAQ About the June 29, 2010 Dear Colleague Letter (PDF, ED OCR)"
    accessed: "2026-07-10"
  - url: "https://www.ed.gov/laws-and-policy/civil-rights-laws/disability-discrimination/faqs-about-june-29-2010-dear-colleague-letter-disability-discrimination"
    title: "FAQs about the June 29, 2010, Dear Colleague Letter (ED OCR)"
    accessed: "2026-07-10"
confidence: high
notes: "Date verified from the FAQ PDF header (May 26, 2011). informs-hint: follow-up to the 2010 Dear Colleague Letter on Electronic Book Readers."
```

## Guidelines

### Web Content Accessibility Guidelines (WCAG) 2.0

```yaml
type: Guideline
merge_key: title
properties:
  title: "Web Content Accessibility Guidelines (WCAG) 2.0"
  description: "W3C Recommendation defining how to make web content more accessible to people with disabilities, organized under the four principles Perceivable, Operable, Understandable, and Robust with conformance levels A, AA, and AAA. Also standardized internationally as ISO/IEC 40500."
  effective_date: "2008-12-11"
  last_updated: "2008-12-11"
sources:
  - url: "https://www.w3.org/TR/WCAG20/"
    title: "Web Content Accessibility Guidelines (WCAG) 2.0 (W3C Recommendation)"
    accessed: "2026-07-10"
confidence: high
notes: "W3C Recommendation dated 11 December 2008, verified from the specification status. informs-hint: baseline standard incorporated by the Revised Section 508 Standards and referenced across CSU ATI."
```

### Web Content Accessibility Guidelines (WCAG) 2.1

```yaml
type: Guideline
merge_key: title
properties:
  title: "Web Content Accessibility Guidelines (WCAG) 2.1"
  description: "W3C Recommendation extending WCAG 2.0 with additional success criteria addressing mobile accessibility, low vision, and cognitive/learning disabilities; content conforming to WCAG 2.1 also conforms to WCAG 2.0."
  effective_date: "2018-06-05"
  last_updated: "2025-05-06"
sources:
  - url: "https://www.w3.org/TR/WCAG21/"
    title: "Web Content Accessibility Guidelines (WCAG) 2.1 (W3C Recommendation)"
    accessed: "2026-07-10"
confidence: high
notes: "First published as a W3C Recommendation 5 June 2018; the current page reflects a revised/republished edition dated 6 May 2025 (last_updated). informs-hint: the standard required by the DOJ 2024 Title II web/mobile rule."
```

### Web Content Accessibility Guidelines (WCAG) 2.2

```yaml
type: Guideline
merge_key: title
properties:
  title: "Web Content Accessibility Guidelines (WCAG) 2.2"
  description: "W3C Recommendation extending WCAG 2.1 with additional success criteria (e.g., focus appearance, dragging movements, accessible authentication); content conforming to WCAG 2.2 also conforms to WCAG 2.0 and 2.1."
  effective_date: "2023-10-05"
  last_updated: "2024-12-12"
sources:
  - url: "https://www.w3.org/TR/WCAG22/"
    title: "Web Content Accessibility Guidelines (WCAG) 2.2 (W3C Recommendation)"
    accessed: "2026-07-10"
confidence: high
notes: "First published as a W3C Recommendation 5 October 2023; the current page reflects a revised edition dated 12 December 2024 (last_updated)."
```

### Accessible Rich Internet Applications (WAI-ARIA) 1.2

```yaml
type: Guideline
merge_key: title
properties:
  title: "Accessible Rich Internet Applications (WAI-ARIA) 1.2"
  description: "W3C Recommendation defining an ontology of roles, states, and properties for making dynamic web content and web applications (especially those built with scripting) more accessible to assistive technologies."
  effective_date: "2023-06-06"
  last_updated: "2023-06-06"
sources:
  - url: "https://www.w3.org/TR/wai-aria-1.2/"
    title: "Accessible Rich Internet Applications (WAI-ARIA) 1.2 (W3C Recommendation)"
    accessed: "2026-07-10"
confidence: high
notes: "W3C Recommendation dated 6 June 2023, verified from the specification status."
```

### Authoring Tool Accessibility Guidelines (ATAG) 2.0

```yaml
type: Guideline
merge_key: title
properties:
  title: "Authoring Tool Accessibility Guidelines (ATAG) 2.0"
  description: "W3C Recommendation providing guidelines for designing authoring tools that are themselves accessible to authors with disabilities (Part A) and that support and encourage authors to produce accessible web content (Part B)."
  effective_date: "2015-09-24"
  last_updated: "2015-09-24"
sources:
  - url: "https://www.w3.org/TR/ATAG20/"
    title: "Authoring Tool Accessibility Guidelines (ATAG) 2.0 (W3C Recommendation)"
    accessed: "2026-07-10"
confidence: high
notes: "W3C Recommendation dated 24 September 2015, verified from the specification status."
```

### User Agent Accessibility Guidelines (UAAG) 2.0

```yaml
type: Guideline
merge_key: title
properties:
  title: "User Agent Accessibility Guidelines (UAAG) 2.0"
  description: "W3C guidance for making user agents (browsers, media players, and similar) accessible to users with disabilities and improving their interoperability with assistive technologies."
  effective_date: "2015-12-15"
  last_updated: "2015-12-15"
sources:
  - url: "https://www.w3.org/TR/UAAG20/"
    title: "User Agent Accessibility Guidelines (UAAG) 2.0 (W3C Working Group Note)"
    accessed: "2026-07-10"
confidence: high
notes: "Published as a W3C Working Group Note (not a Recommendation) dated 15 December 2015; the Recommendation-track work closed before Candidate Recommendation due to insufficient resources for formal testing. effective_date reflects the Note publication date."
```

### Revised Section 508 Standards (36 CFR Part 1194) (2017)

```yaml
type: Guideline
merge_key: title
properties:
  title: "Revised Section 508 Standards (36 CFR Part 1194) (2017)"
  description: "U.S. Access Board's Information and Communication Technology (ICT) Standards and Guidelines, which refreshed the Section 508 standards and Section 255 guidelines and incorporated WCAG 2.0 Level A and AA by reference as the technical requirements for web, software, and electronic content."
  effective_date: "2017-01-18"
  last_updated: "2018-01-22"
sources:
  - url: "https://www.access-board.gov/ict/"
    title: "Revised 508 Standards and 255 Guidelines (U.S. Access Board)"
    accessed: "2026-07-10"
  - url: "https://www.section508.gov/manage/laws-and-policies/"
    title: "IT Accessibility Laws and Policies (Section508.gov)"
    accessed: "2026-07-10"
confidence: medium
notes: "Final rule published in the Federal Register 18 January 2017 (effective_date); a technical correction was published 22 January 2018 (last_updated); the general compliance date was 18 January 2018. Ambiguity: Section 508 functions primarily as a federal regulatory directive rather than a voluntary guideline; it is included here in its 'referenced technical standard' sense and OVERLAPS with the Directive node 'Revised Section 508 Standards and Section 255 Guidelines (ICT Refresh)' — see Open Questions. Dates from Access Board / Section508.gov summaries; exact correction date not re-verified against the Federal Register in this pass."
```

### PDF/UA (ISO 14289-1)

```yaml
type: Guideline
merge_key: title
properties:
  title: "PDF/UA (ISO 14289-1)"
  description: "ISO standard specifying requirements for accessible PDF documents and readers/assistive technology ('Universal Accessibility'), defining how tagged PDF structures, metadata, and semantics support access by people with disabilities."
  effective_date: "2012-07-15"
  last_updated: "2014-12-15"
sources:
  - url: "https://www.iso.org/standard/64599.html"
    title: "ISO 14289-1:2014 Document management applications — file format enhancement for accessibility — Part 1 (PDF/UA-1)"
    accessed: "2026-07-10"
confidence: medium
notes: "First edition ISO 14289-1:2012; current second edition ISO 14289-1:2014 (last_updated). Dates reflect standard general knowledge; iso.org catalog pages were not directly retrievable in this pass to confirm the exact day of publication, so day precision is approximate — HUMAN-VERIFY exact publication days before load."
```

### EPUB Accessibility 1.0

```yaml
type: Guideline
merge_key: title
properties:
  title: "EPUB Accessibility 1.0"
  description: "IDPF Recommended Specification defining accessibility requirements and discoverability metadata for EPUB publications, including conformance to WCAG and the provision of accessibility metadata."
  effective_date: "2017-01-05"
  last_updated: "2017-01-05"
sources:
  - url: "https://idpf.org/epub/a11y/accessibility-20170105.html"
    title: "EPUB Accessibility 1.0 (IDPF Recommended Specification)"
    accessed: "2026-07-10"
confidence: high
notes: "IDPF Recommended Specification dated 5 January 2017 (referenced from the W3C EPUB Accessibility 1.1 specification metadata). Superseded by EPUB Accessibility 1.1."
```

### EPUB Accessibility 1.1

```yaml
type: Guideline
merge_key: title
properties:
  title: "EPUB Accessibility 1.1"
  description: "W3C Recommendation specifying accessibility requirements and discoverability metadata for EPUB publications, updating EPUB Accessibility 1.0 and aligning with the EPUB 3.3 specification family."
  effective_date: "2023-05-25"
  last_updated: "2024-10-17"
sources:
  - url: "https://www.w3.org/TR/epub-a11y-11/"
    title: "EPUB Accessibility 1.1 (W3C Recommendation)"
    accessed: "2026-07-10"
confidence: high
notes: "First published as a W3C Recommendation 25 May 2023 (previousPublishDate); the current page reflects a revised edition dated 17 October 2024 (last_updated)."
```

### EN 301 549 (V3.2.1, 2021)

```yaml
type: Guideline
merge_key: title
properties:
  title: "EN 301 549 (V3.2.1, 2021)"
  description: "European harmonised standard specifying functional accessibility requirements for ICT products and services, including test procedures and evaluation methodology for procurement; it incorporates WCAG 2.1 Level AA and underpins the EU Web Accessibility Directive and European Accessibility Act."
  effective_date: "2021-03-01"
  last_updated: "2021-03-01"
sources:
  - url: "https://www.etsi.org/deliver/etsi_en/301500_301599/301549/03.02.01_60/en_301549v030201p.pdf"
    title: "ETSI EN 301 549 V3.2.1 (2021-03) Harmonised European Standard (PDF)"
    accessed: "2026-07-10"
confidence: high
notes: "Current version V3.2.1 dated 2021-03; day set to 01 because the ETSI version stamp gives month/year only (year/month-only precision). Version history: first ETSI standard 2014 (V1.1.1), adopted as EN in 2015, V2.1.2 (2018-08), V3.1.1 (2019-11), V3.2.1 (2021-03). Included as an international reference; not directly binding on CSU."
```

## Open Questions / Low-Confidence Items

A human should verify the following before loading into Neo4j:

1. **Section 508 represented as both a Directive and a Guideline.** The ICT Refresh appears twice under deliberately distinct titles — "Revised Section 508 Standards and Section 255 Guidelines (ICT Refresh)" (Directive) and "Revised Section 508 Standards (36 CFR Part 1194) (2017)" (Guideline). Titles differ, so there is no MERGE-key collision, but they describe the same instrument. Decide whether to keep both (regulatory instrument vs. referenced technical standard) or collapse to one node.

2. **EO 1111 vs. Board of Trustees Policy.** "CSU Executive Order 1111" (Directive) and "CSU Board of Trustees Policy on Disability Support and Accommodations" (ExternalPolicy) are the enacting instrument and its substantive policy content. Confirm you want both nodes; if not, keep the Directive and drop the ExternalPolicy (or vice versa).

3. **CSU EO 926 date.** Issuance verified as January 2005 (day unknown) via a CSU campus primary source; some secondary sources say 2004. `effective_date` is year-only (2005-01-01). Confirm exact issuance date from the Chancellor's Office EO archive.

4. **CSU coded memoranda dates rely on Internet Archive captures** (AA-2007-04, AA-2010-13, AA-2013-03, AA-2015-22) because the live calstate.edu PDFs are behind bot protection. Header dates were read from archived copies and are high-confidence, but confirm against the official Chancellor's Office coded-memo library. Note AA-2006-41 (the original ATI initiation memo, 2006-09-28) is referenced but not itself noded — consider adding it.

5. **DOJ 2024 rule compliance-date extension (2026-04-20).** The `last_updated` reflects a reported April 2026 interim final rule extending large-entity compliance to April 2027. This post-dates the assistant's core knowledge; verify the Federal Register citation directly.

6. **UC IMT-1300 `last_updated` of 2026-03-17** should be re-verified against policy.ucop.edu, as it is a very recent revision date.

7. **NFB v. Penn State (2011)** has no `effective_date` because an exact execution day could not be verified (only "October 2011"). Supply the signed-agreement date if available.

8. **PDF/UA (ISO 14289-1) exact publication days** are approximate (iso.org catalog pages were not retrievable). Confirm 2012 first-edition and 2014 second-edition publication dates.

9. **California statutory `effective_date` placeholders.** Gov. Code 11135 (1977-01-01) and Unruh Civil Rights Act (1959-01-01) use year-only placeholders. Some California EIT provisions were consolidated by SB 1442 (2016) effective 2017 — confirm the original vs. current-form dates match your intended modeling.

10. **NFB v. Target settlement final-approval date.** The node uses the verifiable 2006-09-06 motion-to-dismiss ruling; the 2008–2009 class settlement final-approval day was not pinned down. Add it if the settlement is the intended anchor.
