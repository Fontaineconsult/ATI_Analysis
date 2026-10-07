// =====================================================================================
// Colker and Grossman scholarship as intellectual sources, and a principle of earned
// deference.
// Run 2026-10-07 by Daniel Fontaine.
//
// WHY
//   No principle grounded in scholarship. Ruth Colker (Ohio State, Moritz) and Paul D.
//   Grossman (OCR San Francisco chief regional attorney for more than twenty years, later
//   AHEAD executive counsel) are the two authors the field reads on disability law in
//   higher education, and they co-wrote its standard reference. Their work was searched on
//   2026-10-07. Every quote below was checked verbatim against the full text, except #3,
//   which was checked against the vLex excerpt.
//
// GROUNDING KIND
//   `scholarship` is new. The existing kinds (mandate, interpretation, design_choice,
//   unverified) describe how a principle relates to law. A scholarly source carries no
//   authority (see IntellectualSource in graph_schema.py), so its edges get their own kind.
//
// SECTIONS
//   1. Eight IntellectualSource nodes. MERGE on name, the unique index.
//   2. A new principle: principle:deference-earned-through-documented-process.
//   3. Its groundings: 34 CFR 104.44(a) and 28 CFR 35.130(b)(7)(i) (mandate), and
//      Grossman #5 and #6 (scholarship).
//   4. Scholarship groundings on five existing principles.
//
// SOURCE TEXT
//   Source text for #1, #2, #4, #5 and #7 (all openly posted) is written separately
//   through neo4j-cli, as Webpage and Document text is.
//
// NOT DONE
//   #3: first page 1813 or 1814 is unverified, so the citation omits it.
//   #8: no pages read, so it is recorded as a citation with no groundings.
//   #7 is an auto-generated transcript with transcription errors ("peon" for Payan).
//   Its quote was checked against that transcript.
//   Held back: Colker's testing articles and "The A in DEIA" (no text reachable), her
//   two NYU Press books (off subject), and the 2022 Grossman and Axelrod deck, which bars
//   redistribution. The case law (Wynne v. Tufts, 932 F.2d 19 (1st Cir. 1991)) is not a
//   node; the new principle names it through Grossman's account. No shapes: the new
//   principle names no schema element.
//
// VALIDATE FIRST
//   python -m app.database.cypher_runner.run_file app/database/batch/auto-assignments/curate_2026_10_07_colker_grossman_scholarship.cypher
//   python -m app.database.cypher_runner.run_file app/database/batch/auto-assignments/curate_2026_10_07_colker_grossman_scholarship.cypher --execute
// =====================================================================================


// --- 1. Intellectual sources --------------------------------------------------------------
UNWIND [
  {name: "Colker, The Americans with Disabilities Act Is Outdated (2015)",
   author: "Ruth Colker", publisher: "Drake Law Review",
   citation: "Ruth Colker, The Americans with Disabilities Act Is Outdated, 63 Drake L. Rev. 787 (2015).",
   url: "https://cpb-us-w2.wpmucdn.com/u.osu.edu/dist/3/106474/files/2021/09/Americans-with-Disabilities-Act-is-Outdated.pdf",
   short: "Argues that the ADA should treat information technology decisions like new construction, so that accessibility is built in rather than retrofitted.",
   full: "Colker examines how inaccessible information technology, chiefly software, excludes people with disabilities in employment and education. Her cases include Reyazuddin v. Montgomery County, where a county bought call-center software that did not work with a screen reader, and a university student whose access problems followed from the course software the university chose. She argues that the ADA and its regulations do not address information technology adequately. Her remedy is to bind software decisions by the ADA's rules for new construction and alterations, so that accessibility is a requirement of the purchase rather than an accommodation after it."},
  {name: "Colker, Universal Design: Stop Banning Laptops! (2017)",
   author: "Ruth Colker", publisher: "Cardozo Law Review",
   citation: "Ruth Colker, Universal Design: Stop Banning Laptops!, 39 Cardozo L. Rev. 483 (2017).",
   url: "https://cardozolawreview.com/wp-content/uploads/2018/08/COLKER.39.2.pdf",
   short: "Argues that faculty should remove needless barriers to instruction for every student instead of requiring disabled students to identify themselves and ask.",
   full: "Colker argues that many practices treated as accommodations, such as sharing notes or slides, are good teaching that every student should receive. She treats classroom laptop bans and artificial exam time limits as needless barriers with a disparate impact on students with disabilities. She asks faculty to apply principles of Universal Design to their own courses, so that fewer students must come forward as disabled to get access."},
  {name: "Colker, The Americans with Disabilities Act's Unreasonable Focus on the Individual (2022)",
   author: "Ruth Colker", publisher: "University of Pennsylvania Law Review",
   citation: "Ruth Colker, The Americans with Disabilities Act's Unreasonable Focus on the Individual, 170 U. Pa. L. Rev. (No. 7) (2022).",
   url: "https://law-journals-books.vlex.com/vid/the-americans-with-disabilities-923932773",
   short: "Argues that the ADA's individual accommodation model produces after-the-fact remedies for one person and makes structural remedies hard to obtain.",
   full: "Colker argues that the ADA ties its rights to an individual who identifies as disabled and requests a modification. Under that model a defendant can defend an inaccessible structure as too costly to change for one person, and a winning plaintiff often secures a change that benefits only that person. She contrasts this with structural changes, such as a permanent ramp, that serve everyone. The article argues for duties that anticipate disabled people rather than respond to them one at a time. Only an excerpt was read; the first page of the article (1813 or 1814) is unverified."},
  {name: "Colker, The Reactive Model of Reasonable Accommodation (2022)",
   author: "Ruth Colker", publisher: "LPE Project",
   citation: "Ruth Colker, The Reactive Model of Reasonable Accommodation, LPE Project (Oct. 11, 2022).",
   url: "https://lpeproject.org/blog/the-reactive-model-of-reasonable-accommodation/",
   date: "2022-10-11",
   short: "A short statement of Colker's argument that the ADA and the IDEA wait for an individual to ask, and so make group remedies hard to obtain.",
   full: "Colker argues that covered entities, public entities included, may leave inaccessibility in place until an individual requests a change. The IDEA follows the same pattern for children, who receive help only after they are identified. Her example is Montgomery County's purchase of call-center software that a blind employee's screen reader could not use, after she had asked the county to buy accessible software. She argues that software should have to meet accessibility standards before it can be sold."},
  {name: "Grossman, Making Accommodations: The Legal World of Students with Disabilities (2001)",
   author: "Paul D. Grossman", publisher: "Academe (American Association of University Professors)",
   citation: "Paul D. Grossman, Making Accommodations: The Legal World of Students with Disabilities, Academe, Nov.-Dec. 2001, at 41.",
   url: "https://dro.equalopportunity.ncsu.edu/faculty-staff/making-accommodations/",
   short: "An OCR regional chief attorney's account for faculty of what Section 504 and the ADA require of colleges, including access to websites and distance education, and when courts defer to academic judgment.",
   full: "Grossman wrote this for faculty while chief regional attorney of OCR's San Francisco office. He states that Section 504 and the ADA require equal access to information and communication, including college websites, other Internet resources, and distance education, and that a public college must provide communication as effective as that provided to others. Describing the case of a medical student who asked for essay examinations in place of multiple choice, he says the college had to show that its relevant officials considered alternatives, their feasibility, cost, and effect on the program, and reached a rationally justifiable conclusion. He reads the result as deference that the institution earns through an affirmative and thorough consideration process involving faculty and academic administrators. The URL is a reprint on the NC State equal opportunity site; ERIC lists the original as EJ641349."},
  {name: "Grossman and Axelrod, Individualization, the Interactive Process and Fundamental Alteration (AHEAD 2019)",
   author: "Paul D. Grossman; Jamie Axelrod", publisher: "Association on Higher Education and Disability (AHEAD)",
   citation: "Paul D. Grossman & Jamie Axelrod, 2.6: Individualization, The Interactive Process and Fundamental Alteration (conference handout, AHEAD Conference, Boston, 2019).",
   url: "https://higherlogicdownload.s3.amazonaws.com/AHEAD/38b602f4-ec53-451c-9be0-5c0bf5d27c0a/UploadedImages/CONFERNCES/2019_AHEAD/2019_HANDOUTS/2.6/2_6-Boston-process__process__process-concurrent.pdf",
   short: "A conference handout tracing the Wynne v. Tufts and Guckenberger line, in which academic deference depends on a documented, individualized, diligent process.",
   full: "The handout walks through Wynne v. Tufts University School of Medicine, 932 F.2d 19 (1st Cir. 1991) and 976 F.2d 791 (1st Cir. 1992), and Guckenberger v. Boston University. It states that academic institutions making academic decisions within their expertise have received substantial deference from courts and OCR. It lists what forfeits that deference, including an unsupported assertion offered as its own proof, the absence of diligent consideration such as consulting other faculty or licensing bodies, and a failure to consider technological advances. It compiles OCR language on what counts as a fundamental alteration."},
  {name: "A Conversation with Paul Grossman (504 at 50 oral history)",
   author: "Paul D. Grossman", publisher: "Southeast ADA Center",
   citation: "A Conversation with Paul Grossman, 504 at 50 Oral History Project (Southeast ADA Center, transcript posted Feb. 2025).",
   url: "https://adaanniversary.org/wp-content/uploads/2025/02/paul-grossman-transcript.pdf",
   short: "An oral history in which Grossman argues that disparate impact, not individual accommodation, is the tool for systemic inaccessibility such as inaccessible digital platforms.",
   full: "Grossman traces disability law's development from race discrimination law, and in particular from disparate impact: an unnecessary barrier to equal opportunity may be illegal without any intent to exclude. He applies this to colleges that select digital platforms, courseware, or web tools that students with sensory impairments cannot use. He argues that systemic problems such as inaccessible websites call for a change in how the institution does business, not a series of individual accommodations. The transcript is auto-generated and contains transcription errors."},
  {name: "Colker and Grossman, The Law of Disability Discrimination for Higher Education Professionals (2014)",
   author: "Ruth Colker; Paul D. Grossman", publisher: "Carolina Academic Press",
   citation: "Ruth Colker & Paul D. Grossman, The Law of Disability Discrimination for Higher Education Professionals (Carolina Academic Press 2014). ISBN 9781632807632.",
   url: "https://cap-press.com/books/isbn/9781632807632/The-Law-of-Disability-Discrimination-for-Higher-Education-Professionals",
   short: "The two authors' casebook on disability discrimination law, adapted for disability services and ADA staff in higher education.",
   full: "A version of Colker and Grossman's law school casebook, The Law of Disability Discrimination, refocused for disability services directors, ADA officers, and other higher education professionals. Recorded as a citation only. Its contents were not read, and no principle grounds on it."}
] AS s
MERGE (i:IntellectualSource {name: s.name})
ON CREATE SET i.unique_id = replace(randomUUID(), "-", "")
SET i.author = s.author, i.publisher = s.publisher, i.citation = s.citation, i.url = s.url,
    i.description_short = s.short, i.description_full = s.full,
    i.published_date = CASE WHEN s.date IS NULL THEN i.published_date ELSE date(s.date) END;


// --- 2. New principle: deference is earned -------------------------------------------------
MERGE (p:Principle {handle: "principle:deference-earned-through-documented-process"})
ON CREATE SET p.unique_id = randomUUID()
SET p.name = "Deference is earned through a documented, individualized process",
    p.description_short = "Courts and OCR defer to an institution's judgment that a requirement is essential or that a change would fundamentally alter a program only when a record shows the responsible officials considered the individual and the alternatives.",
    p.description_full = "Courts and OCR defer to a college's judgment that an academic requirement is essential or that a modification would fundamentally alter a program. That deference is conditional. The Section 504 regulation treats an academic requirement as non-discriminatory only if the recipient can demonstrate that it is essential, and the Title II regulation excuses a modification only if the public entity can demonstrate a fundamental alteration. Courts have read that burden as a process requirement. In Wynne v. Tufts University School of Medicine, the institution had to show that its relevant officials considered alternative means, their feasibility, cost, and effect on the program, and reached a rationally justifiable conclusion. An assertion with no record behind it receives no deference. Two consequences follow. A fundamental alteration determination about a course is made by the faculty and academic administrators responsible for it, after an individualized look at the student and the alternatives, and the record of that look is kept. A claim that an accessible version of a platform or material cannot be provided needs the same documented consideration, including whether technology has changed what is feasible. This principle concerns how a limit is established. Where the limits sit belongs to the principle that undue burden and fundamental alteration bound the duty.";


// --- 3. Groundings for the new principle ---------------------------------------------------
MATCH (p:Principle {handle: "principle:deference-earned-through-documented-process"})
MATCH (g:Directive {unique_id: "99d4a68d95e7413eac49fb5c8083bf2a"})
MERGE (p)-[r:derives_from]->(g)
SET r.provision = "34 CFR 104.44(a)", r.grounding_kind = "mandate",
    r.quote = "Academic requirements that the recipient can demonstrate are essential to the instruction being pursued by such student or to any directly related licensing requirement will not be regarded as discriminatory within the meaning of this section.",
    r.rationale = "Section 104.44(a) requires a recipient to modify academic requirements that discriminate against a qualified student with a disability. It exempts a requirement only where the recipient can demonstrate that the requirement is essential to the instruction or to a directly related licensing requirement. The burden of demonstration sits with the institution. The section lists changes in time to degree, course substitution, and adaptation of how courses are conducted as modifications it may require.",
    r.assessed_date = date("2026-10-07");

MATCH (p:Principle {handle: "principle:deference-earned-through-documented-process"})
MATCH (g:Directive {unique_id: "28513850e4794975925f7538fdc096ac"})
MERGE (p)-[r:derives_from]->(g)
SET r.provision = "28 CFR 35.130(b)(7)(i)", r.grounding_kind = "mandate",
    r.quote = "unless the public entity can demonstrate that making the modifications would fundamentally alter the nature of the service, program, or activity",
    r.rationale = "Section 35.130(b)(7)(i) requires a public entity to make reasonable modifications in policies, practices, or procedures when they are necessary to avoid disability discrimination. The only exception is a modification the public entity can demonstrate would fundamentally alter the service, program, or activity. The burden of demonstration sits with the public entity.",
    r.assessed_date = date("2026-10-07");

UNWIND [
  {src: "Grossman, Making Accommodations: The Legal World of Students with Disabilities (2001)",
   prov: "Academe 87(6), section on academic deference",
   quote: "colleges were entitled to deference in academic decisions, but only after such deference was earned",
   why: "Grossman describes a medical student's request for essay examinations in place of multiple choice. He states that the college had to show its relevant officials considered alternative means, their feasibility, cost, and effect on the program, and reached a rationally justifiable conclusion. He reads the holding as deference earned through an affirmative and thorough consideration process. He notes that the court expected faculty and academic administrators to take part."},
  {src: "Grossman and Axelrod, Individualization, the Interactive Process and Fundamental Alteration (AHEAD 2019)",
   prov: "Handout, What is a Fundamental Alteration; Wynne v. Tufts",
   quote: "Academic institutions, making academic decisions within their areas of expertise, have received substantial deference from the courts and OCR",
   why: "The handout cites Wynne v. Tufts, 932 F.2d 19 (1st Cir. 1991) and 976 F.2d 791 (1st Cir. 1992). It states that institutions making academic decisions within their expertise receive substantial deference from courts and OCR. It lists what loses that deference: an unsupported assertion, the absence of diligent consideration such as consulting other faculty or licensing bodies, and a failure to consider technological advances."}
] AS row
MATCH (p:Principle {handle: "principle:deference-earned-through-documented-process"})
MATCH (i:IntellectualSource {name: row.src})
MERGE (p)-[r:derives_from]->(i)
SET r.provision = row.prov, r.grounding_kind = "scholarship", r.quote = row.quote,
    r.rationale = row.why, r.assessed_date = date("2026-10-07");


// --- 4. Scholarship groundings on existing principles --------------------------------------
UNWIND [
  {h: "principle:vendor-leverage-procurement-as-accessibility-lever",
   src: "Colker, The Americans with Disabilities Act Is Outdated (2015)", prov: "63 Drake L. Rev. 787, Part IV",
   quote: "When entities make software decisions, they should be bound by the new construction or substantial renovation requirements in the ADA",
   why: "Colker argues that software decisions should carry the ADA's new-construction duty, so that accessibility is a condition of the purchase. Her cases show inaccessibility caused by procurement: a county's call-center software and a university's course software. The article argues for this as a change in the law, not as a reading of current law."},
  {h: "principle:program-accessibility-as-proactive-duty",
   src: "Colker, The Americans with Disabilities Act Is Outdated (2015)", prov: "63 Drake L. Rev. 787, Abstract",
   quote: "accessible information technology should be a required component of all new construction and alterations so that retrofitting is not required after the fact",
   why: "Colker argues that information technology accessibility should be built in when technology is acquired or changed, so that it need not be retrofitted. She argues that the ADA does not yet require this for technology. The source supports the principle as an argument for an anticipatory duty, and it disputes that current law already imposes one fully."},
  {h: "principle:program-accessibility-as-proactive-duty",
   src: "Colker, The Reactive Model of Reasonable Accommodation (2022)", prov: "LPE Project post",
   quote: "the ADA sets up a reactive rather than pro-active model, which makes it very difficult to seek group-based remedies",
   why: "Colker argues that the ADA lets a covered entity leave inaccessibility in place until an individual asks, and that this makes group remedies hard to obtain. She describes the IDEA as working the same way for children. The source names the reactive model that the principle stands against. It describes the law as reactive, so it grounds the principle as a position, not as a reading of the statute."},
  {h: "principle:parallel-duties-conformance-and-accommodation",
   src: "Colker, The Americans with Disabilities Act's Unreasonable Focus on the Individual (2022)", prov: "170 U. Pa. L. Rev., Introduction",
   quote: "it often means that exactly one person has benefitted from a post hoc modification of the environment",
   why: "Colker argues that an individual accommodation claim, even when it succeeds, often changes the environment for one person after the fact. She contrasts it with structural changes, such as a permanent ramp, that serve everyone. The source supports the principle's claim that accommodating one person does not discharge the duty to make the program accessible."},
  {h: "principle:universal-design-over-accommodation",
   src: "Colker, Universal Design: Stop Banning Laptops! (2017)", prov: "39 Cardozo L. Rev. 483, Introduction",
   quote: "Rather than force students to come forward and identify themselves as disabled, teachers should be expected to ask what needless barriers to instruction are present in their classroom",
   why: "Colker argues that sharing notes or slides with every student is good teaching rather than an accommodation for documented students. She asks faculty to find and remove needless barriers in their own courses using principles of Universal Design. She names laptop bans and artificial exam time limits as such barriers."},
  {h: "principle:equally-effective-access",
   src: "Grossman, Making Accommodations: The Legal World of Students with Disabilities (2001)", prov: "Academe 87(6), section on access to information",
   quote: "equal access to information and to the avenues of communication, including Web sites operated by colleges, other Internet resources, distance education programs",
   why: "Grossman states that Section 504 and the ADA require equal access to information and communication, and he names college websites, other Internet resources, and distance education. He states that the ADA requires a public college to provide students with disabilities communication as effective as that provided to others. He wrote this in 2001 as OCR's San Francisco chief regional attorney."},
  {h: "principle:vendor-leverage-procurement-as-accessibility-lever",
   src: "A Conversation with Paul Grossman (504 at 50 oral history)", prov: "Transcript, disparate impact discussion",
   quote: "how many colleges and universities select a digital platform or digital courseware or web tools that are inaccessible",
   why: "Grossman applies disparate impact reasoning to technology selection. An unnecessary barrier to equal opportunity can be illegal without intent, and he names a college's choice of inaccessible platforms, courseware, and web tools as such a barrier. He argues that systemic inaccessibility calls for changing how the institution does business. The transcript is auto-generated."}
] AS row
MATCH (p:Principle {handle: row.h})
MATCH (i:IntellectualSource {name: row.src})
MERGE (p)-[r:derives_from]->(i)
SET r.provision = row.prov, r.grounding_kind = "scholarship", r.quote = row.quote,
    r.rationale = row.why, r.assessed_date = date("2026-10-07");
