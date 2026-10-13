// =====================================================================================
// Four intellectual sources from a disability and higher education reading list.
// Run 2026-10-07 by Daniel Fontaine.
//
// WHY
//   The reading list at themightyval.com (2017-06-14) names 18 works. Four fit this
//   domain: institutional responsibility, assessment, and the social model behind
//   universal design. The rest are disability history, K-12, curriculum, employment
//   journalism, or talks. Two borderline items (Kioko and Makoelle 2014; Nichols and
//   Quaye 2009) were left out at the user's direction.
//
// WHAT WAS READ
//   Huger 2011 and Stodden, Brown and Roberts 2011: the publisher abstracts, through ERIC.
//   Full text is paywalled. Each node's url is its ERIC record, and its source text is the
//   abstract, written separately through neo4j-cli.
//   Vance, Lipsitz and Parks 2014: the publisher description, through ERIC. Same handling.
//   Shakespeare: the chapter as printed in The Disability Studies Reader, 2nd ed. (2006),
//   197-204. The copy read is an unauthorized repost, so no source text is stored and the
//   node has no url. The reading list cites the 4th edition (2013), 214-221.
//
// GROUNDINGS (all grounding_kind scholarship)
//   Huger -> institution-wide-responsibility. Huger also fits shared-responsibility-
//   requiring-coordination, which is the user's reference principle and is not touched.
//   Stodden -> capability-maturity-over-binary-compliance.
//   Vance -> universal-design-over-accommodation, from the description's stated premise.
//   Shakespeare -> universal-design-over-accommodation (the social model mandates barrier
//   removal) and parallel-duties-conformance-and-accommodation (his critique that a
//   barrier-free environment cannot be fully achieved).
//
// VALIDATE FIRST
//   python -m app.database.cypher_runner.run_file app/database/batch/auto-assignments/curate_2026_10_07_reading_list_scholarship.cypher
//   python -m app.database.cypher_runner.run_file app/database/batch/auto-assignments/curate_2026_10_07_reading_list_scholarship.cypher --execute
// =====================================================================================


// --- 1. Intellectual sources --------------------------------------------------------------
UNWIND [
  {name: "Huger, Fostering a Disability-Friendly Institutional Climate (2011)",
   author: "Marianne S. Huger", publisher: "New Directions for Student Services (Wiley)",
   citation: "Marianne S. Huger, Fostering a Disability-Friendly Institutional Climate, New Directions for Student Services, no. 134, at 3-11 (2011). doi:10.1002/ss.390.",
   url: "https://eric.ed.gov/?id=EJ935587",
   short: "Argues that a campus climate that includes students with disabilities is built by departments across the institution, not by the disability services office alone.",
   full: "Huger introduces a special issue on integrating students with disabilities into campus life. She argues that rising enrollment of students with disabilities requires institutions to rethink how they serve them, through partnership among departments. She names disability services staff, administrators in other offices, faculty, and student leaders as each having a role. Only the publisher abstract was read; the article is paywalled (doi:10.1002/ss.390)."},
  {name: "Stodden, Brown, and Roberts, Disability-Friendly University Environments: Conducting a Climate Assessment (2011)",
   author: "Robert A. Stodden; Steven E. Brown; Kelly Roberts", publisher: "New Directions for Higher Education (Wiley)",
   citation: "Robert A. Stodden, Steven E. Brown & Kelly Roberts, Disability-Friendly University Environments: Conducting a Climate Assessment, New Directions for Higher Education, no. 154, at 83-92 (2011). doi:10.1002/he.437.",
   url: "https://eric.ed.gov/?id=EJ931817",
   short: "Describes institutional climate assessment, a systematic measure of effectiveness that feeds an improvement plan, as a method for building supportive environments for students and faculty with disabilities.",
   full: "The authors draw on more than ten years of data from the Center on Disability Studies at the University of Hawaii at Manoa on supports for students with disabilities in postsecondary education. They treat climate assessment as a systematic measurement of an institution's or program's effectiveness that produces an action plan for improvement. They list its uses for accommodations: informing faculty, comparing student and staff perceptions, and deciding where and how to implement accommodations. Only the publisher abstract was read; the article is paywalled (doi:10.1002/he.437)."},
  {name: "Vance, Lipsitz, and Parks (eds.), Beyond the Americans with Disabilities Act (2014)",
   author: "Mary Lee Vance; Neal E. Lipsitz; Kaela Parks (eds.)", publisher: "NASPA - Student Affairs Administrators in Higher Education",
   citation: "Mary Lee Vance, Neal E. Lipsitz & Kaela Parks (eds.), Beyond the Americans with Disabilities Act: Inclusive Policy and Practice for Higher Education (NASPA 2014). ISBN 9780931654909.",
   url: "https://eric.ed.gov/?id=ED582133",
   short: "An edited primer for student affairs and disability services staff whose premise is that individual accommodation is insufficient and campuses should design for universal access.",
   full: "An edited volume for administrators, faculty, and staff who work with students with disabilities. Its four parts cover the ADA and changing views of disability, information and communication technology, emerging student populations, and practice in student affairs and disability services. Paul Grossman wrote a chapter on the ADA Amendments Act. The publisher description states the book's premise that accommodation and individual adjustments are insufficient, and that campuses must go beyond the law's minimum toward universal access. Only the publisher description was read."},
  {name: "Shakespeare, The Social Model of Disability",
   author: "Tom Shakespeare", publisher: "Routledge (The Disability Studies Reader, ed. Lennard J. Davis)",
   citation: "Tom Shakespeare, The Social Model of Disability, in The Disability Studies Reader 197-204 (Lennard J. Davis ed., 2d ed. 2006). Also in the 4th ed. (2013), 214-221.",
   short: "Sets out the social model of disability, in which barriers imposed by society rather than impairment are the source of disability, and then names its limits.",
   full: "Shakespeare traces the social model to the Union of the Physically Impaired Against Segregation, whose 1975 statement held that society disables people with impairments by excluding them. He describes the model's dichotomies, such as impairment as individual and disability as structural, and its practical effect: it calls for barrier removal, anti-discrimination law, and independent living. He then lists its weaknesses. These include the neglect of impairment in people's lives and the idea of a barrier-free utopia, which he argues cannot be fully achieved because some environments stay inaccessible and people with different impairments need incompatible solutions. Read in the 2nd edition (2006)."}
] AS s
MERGE (i:IntellectualSource {name: s.name})
ON CREATE SET i.unique_id = replace(randomUUID(), "-", "")
SET i.author = s.author, i.publisher = s.publisher, i.citation = s.citation, i.url = s.url,
    i.description_short = s.short, i.description_full = s.full;


// --- 2. Groundings ------------------------------------------------------------------------
UNWIND [
  {h: "principle:institution-wide-responsibility",
   src: "Huger, Fostering a Disability-Friendly Institutional Climate (2011)", prov: "Abstract",
   quote: "The job of fostering a disability-friendly institutional climate cannot be done solely by an office of disability services.",
   why: "Huger argues that serving students with disabilities requires partnership among institutional departments. She states that the disability services office cannot build an inclusive climate alone. She names administrators in other offices, faculty, and student leaders as having roles. Only the abstract was read."},
  {h: "principle:capability-maturity-over-binary-compliance",
   src: "Stodden, Brown, and Roberts, Disability-Friendly University Environments: Conducting a Climate Assessment (2011)", prov: "Abstract",
   quote: "the systematic measuring of effectiveness in an institution or program area so that an action plan for program improvement can be created and set in motion as a means of inducing change",
   why: "The authors define climate assessment as a systematic measure of effectiveness that produces an improvement plan. The definition is quoted in their abstract from another source. They apply it to how an institution supports students and faculty with disabilities. The source treats institutional support as something measured and improved over time, not as a state met or failed. Only the abstract was read."},
  {h: "principle:universal-design-over-accommodation",
   src: "Vance, Lipsitz, and Parks (eds.), Beyond the Americans with Disabilities Act (2014)", prov: "Publisher description",
   quote: "it is based on the premise that accommodation and individual adjustments are insufficient if the mission of higher education is to provide equitable learning experiences for all students",
   why: "The publisher description states that the volume does not address the accommodation process. It states the premise that individual accommodation is insufficient for equitable learning, and it points to universal design pedagogy. It says campuses must go beyond the law's minimum requirements toward universal access. Only the description was read; no chapter was."},
  {h: "principle:universal-design-over-accommodation",
   src: "Shakespeare, The Social Model of Disability", prov: "Disability Studies Reader (2d ed.), section on the social model's dichotomies",
   quote: "Social model thinking mandates barrier removal, anti-discrimination legislation, independent living and other responses to social oppression.",
   why: "Shakespeare quotes the 1975 UPIAS statement that society disables people with impairments by excluding them. He describes the social model as locating disability in social barriers rather than in impairment, so that the response is to remove barriers. This is the theory behind removing barriers in design before an individual asks. He also argues the model has limits, recorded on the parallel duties grounding."},
  {h: "principle:parallel-duties-conformance-and-accommodation",
   src: "Shakespeare, The Social Model of Disability", prov: "Disability Studies Reader (2d ed.), Weaknesses of the Social Model, item 4",
   quote: "despite the value of approaches such as Universal Design, the concept of a world in which people with impairments were free of environmental barriers is hard to operationalize",
   why: "Shakespeare names the barrier-free utopia as a weakness of the social model. He argues that some environments stay inaccessible and that people with different impairments need incompatible solutions, such as defined curbs for blind people and dropped curbs for wheelchair users. Barrier removal by design therefore cannot meet every need, and an individual response remains necessary alongside it."}
] AS row
MATCH (p:Principle {handle: row.h})
MATCH (i:IntellectualSource {name: row.src})
MERGE (p)-[r:derives_from]->(i)
SET r.provision = row.prov, r.grounding_kind = "scholarship", r.quote = row.quote,
    r.rationale = row.why, r.assessed_date = date("2026-10-07");
