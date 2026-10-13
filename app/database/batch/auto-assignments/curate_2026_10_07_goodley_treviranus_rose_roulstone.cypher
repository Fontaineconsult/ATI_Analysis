// =====================================================================================
// Goodley, Treviranus, Rose and Roulstone as intellectual sources, and a contested_by
// relationship for sources that argue against a principle.
// Run 2026-10-07 by Daniel Fontaine.
//
// WHY
//   The scholarship already in the graph grounds principles. Some of the strongest
//   material on these four authors argues against a principle instead: Treviranus on WCAG
//   conformance, and the evidence critiques of Universal Design for Learning. derives_from
//   cannot carry that. contested_by (Principle -> IntellectualSource) records it with the
//   same properties as a grounding: provision, quote, rationale, assessed_date.
//
// WHAT WAS READ
//   Full text: Goodley 2024, 2025, 2020 and 2026; Treviranus's three essays; the Ontario
//   2020 recommendations report; the Floe handbook page; Rose et al. 2006. Abstract only:
//   Boysen 2024 (Crossref) and Capp 2017 (ERIC). Every quote was checked verbatim.
//   Source text is written separately through neo4j-cli.
//
// SECTIONS
//   1. The contested_by descriptor.
//   2. Fourteen IntellectualSource nodes, four of them citation-only.
//   3. Eleven scholarship groundings.
//   4. Four contested_by edges.
//
// NOT DONE
//   shared-responsibility-requiring-coordination is the user's reference principle and is
//   not touched, though Goodley 2025 fits it.
//   Two contested_by edges from the proposal were dropped after reading the passages in
//   context. Goodley 2024's "absent presence" concerns disability missing as a research
//   colleague and authority, and Goodley 2025's "Access is not a parallel process" concerns
//   access staff as colleagues in research projects. Neither argues against the
//   parallel-duties principle. The proposed Goodley 2025 grounding on continuous
//   remediation was dropped for the same reason.
//   Roulstone: no full text was reachable and his work concerns employment, not
//   universities. His two works are citation-only. ATAG 2.0 and NIMAS are standards and
//   belong with governance if anywhere. CAST's UDL Guidelines are CAST's, not Rose's.
//
// VALIDATE FIRST
//   python -m app.database.cypher_runner.run_file app/database/batch/auto-assignments/curate_2026_10_07_goodley_treviranus_rose_roulstone.cypher
//   python -m app.database.cypher_runner.run_file app/database/batch/auto-assignments/curate_2026_10_07_goodley_treviranus_rose_roulstone.cypher --execute
// =====================================================================================


// --- 1. contested_by --------------------------------------------------------------------
MERGE (d:UniversalDescriptor {descriptor_handle: "rel_type:contested_by"})
ON CREATE SET d.unique_id = replace(randomUUID(), "-", ""), d.descriptor_kind = "rel_type",
              d.target_field = "contested_by", d.title = "Contested By",
              d.description_short = "Links a Principle to an intellectual source that argues against it or against the reading the framework gives it. Carries provision, quote, rationale and assessed_date, like derives_from.",
              d.description_full = "A principle derives_from the sources that ground it. It is contested_by sources that argue against it, qualify it, or show where it fails in practice. The edge records the argument, not a verdict: the principle stands, and the edge says what a reader should weigh against it. A source can ground one principle and contest another.",
              d.search_text = "contested by principle intellectual source argues against challenge critique qualification contested_by",
              d.include_in_report = false, d.last_updated = date("2026-10-07");


// --- 2. Intellectual sources --------------------------------------------------------------
UNWIND [
  {name: "Goodley, Depathologising the university (2024)", author: "Dan Goodley",
   publisher: "Pedagogy, Culture & Society (Taylor & Francis)",
   citation: "Dan Goodley, Depathologising the university, 33(3) Pedagogy, Culture & Society 1001-1018 (2024). doi:10.1080/14681366.2024.2316007. CC BY.",
   url: "https://eprints.whiterose.ac.uk/id/eprint/210654/1/Depathologising%20the%20university.pdf",
   short: "Argues that universities treat disability as a technical problem inside a person, and that disability should instead be a reason to rethink how the university works.",
   full: "Goodley argues that UK universities treat disability as pathology: a problem located in a student or staff member, to be solved through individual support and adjustments, while disability is absent as a colleague and scholarly authority. He proposes disability as authority, a basis for reshaping curricula, policy and institutional culture. He separates disablism, the exclusion disabled people meet, from ableism, the norms that shape everyone in the institution."},
  {name: "Goodley, Liddiard, and Lawthom, The depathologising university (2025)", author: "Dan Goodley; Kirsty Liddiard; Rebecca Lawthom",
   publisher: "Scandinavian Journal of Disability Research",
   citation: "Dan Goodley, Kirsty Liddiard & Rebecca Lawthom, The depathologising university, 27(1) Scandinavian Journal of Disability Research 120-133 (2025). doi:10.16993/sjdr.1240.",
   url: "https://sjdr.se/articles/10.16993/sjdr.1240",
   short: "Composite conversations from three research projects on pushing university bureaucracy toward co-production and treating access as a resourced colleague in the work.",
   full: "The authors write composite conversations drawn from three funded research projects. They describe pushing university bureaucracy toward co-production with disabled people's organisations, using the university's performance measures for anti-ableist ends, and treating access as a staffed and resourced colleague alongside researchers and professional services. They close on the civic responsibility of the university to the communities it serves, and on every member of the university having a part in that work."},
  {name: "Goodley et al., Rebooting inclusive education? New technologies and disabled people (2020)", author: "Dan Goodley; David Cameron; Kirsty Liddiard; Brian Parry; Katherine Runswick-Cole; Ben Whitburn; Meng Ee Wong",
   publisher: "Canadian Journal of Disability Studies",
   citation: "Dan Goodley, David Cameron, Kirsty Liddiard, Brian Parry, Katherine Runswick-Cole, Ben Whitburn & Meng Ee Wong, Rebooting inclusive education? New technologies and disabled people, 9(5) Canadian Journal of Disability Studies 515-549 (2020). doi:10.15353/cjds.v9i5.707.",
   url: "https://cjds.uwaterloo.ca/index.php/cjds/article/download/707/971",
   short: "Argues that new technologies do not by themselves make education inclusive, because accessibility fails wherever educational convention does not plan for it.",
   full: "A literature-based review of disability and the technologies of the fourth industrial revolution in education. The authors argue that technology can and does support disabled people, but that exclusion persists because social convention in education leaves accessibility to those who lack it. Their examples include presentations whose ordinary techniques assume sight, and the continuing negotiation disabled people carry out with organisers, teachers and funders to secure access."},
  {name: "Goodley and Lawthom, A narrative exposition of the university, disability and the non-disabled academic (2026)", author: "Dan Goodley; Rebecca Lawthom",
   publisher: "Scandinavian Journal of Disability Research",
   citation: "Dan Goodley & Rebecca Lawthom, A narrative exposition of the university, disability and the non-disabled academic, 28(1) Scandinavian Journal of Disability Research 249-264 (2026). doi:10.16993/sjdr.1411.",
   url: "https://sjdr.se/articles/10.16993/sjdr.1411",
   short: "A composite narrative finding that universities treat disability as an individual problem and fail to anticipate it, so each arrival of disability is handled as a surprise.",
   full: "A composite narrative of a non-disabled academic working on disability research. It identifies funding inequity, the university's failure to anticipate disability, the centring of disabled people's organisations, broken support systems, and alliances as its themes. The authors argue that treating disability as an individual problem fails to ask questions of the institution, and they treat university processes as a place where reform can be done."},
  {name: "Treviranus, The three dimensions of Inclusive Design, Parts one to three (2018)", author: "Jutta Treviranus",
   publisher: "Medium (FWD50); archived in the OCAD University Open Research Repository",
   citation: "Jutta Treviranus, The three dimensions of Inclusive Design, Parts one, two and three (Medium, 2018), archived at OCAD University Open Research Repository, eprints 2216, 2219 and 2218. CC BY.",
   url: "https://openresearch.ocadu.ca/id/eprint/2216/12/Treviranus_Dimensions1_2018.pdf",
   short: "Argues that accessibility cannot be one-size-fits-all, that design should adapt to each person without segregating them, and that full guideline compliance can coexist with exclusion.",
   full: "Part one argues that disability is defined by difference from the norm, so a single accessible version fails some users, and proposes adaptable one-size-fits-one design that is not separate from the mainstream product. Part two argues for an inclusive design process with people at the margins, which it holds produces more lasting change than a checklist of design criteria. Part three treats inclusion as acting within nested systems: one student's need for reconfigurable digital curriculum reaches the school board's procurement policy. It also describes an online exam that met every WCAG criterion and that a student using a single switch could operate only with far more effort than answering the questions. Part two is at eprint 2219 (Treviranus_Dimensions2_2018.pdf) and Part three at eprint 2218 (Treviranus_Dimensions3_2018.pdf)."},
  {name: "Ontario Information and Communications Standards Development Committee, 2020 Final Recommendations Report", author: "Information and Communications Standards Development Committee (members include Jutta Treviranus)",
   publisher: "Government of Ontario",
   citation: "Information and Communications Standards Development Committee, Review of the Information and Communications Standards: 2020 Final Recommendations Report (Government of Ontario, 2020).",
   url: "https://www.ontario.ca/page/review-information-and-communications-standards-2020-final-recommendations-report",
   short: "An advisory committee's recommendations for revising Ontario's accessibility standards for information and communications, including stronger accessible procurement requirements.",
   full: "The committee reviewed the Information and Communications Standards under Ontario's accessibility law and made recommendations to the government. Recommendation 14 finds the regulation's general procurement requirements too weak to produce accessible digital procurement and proposes that the government and designated public sector organizations build accessibility criteria into purchasing, including qualified third-party evaluation and certification. Jutta Treviranus of the Inclusive Design Research Centre sat on the committee. The report is advisory and does not bind."},
  {name: "Floe Inclusive Learning Design Handbook, Understanding Accessibility and Inclusivity", author: "Inclusive Design Research Centre, OCAD University (Floe Project)",
   publisher: "Inclusive Design Research Centre, OCAD University",
   citation: "Inclusive Design Research Centre, Understanding Accessibility and Inclusivity, in Inclusive Learning Design Handbook (Floe Project, undated).",
   url: "https://handbook.floeproject.org/perspectives/understanding-accessibility-and-inclusivity/",
   short: "Defines an accessible learning experience as one that matches the needs of a particular learner, so accessibility depends on context rather than being a fixed property of a resource.",
   full: "The handbook defines disability as a mismatch between a person's needs and preferences and the system or environment. It holds that a learning resource cannot be called accessible or inaccessible without knowing its context, learning goal and learner, and that a resource accessible to one group may not be to another. It recommends transforming, supplementing and remixing open educational resources to fit individual learners. The page names no individual author; the Floe Project is run by the IDRC, which Jutta Treviranus directs."},
  {name: "Rose et al., Universal Design for Learning in Postsecondary Education (2006)", author: "David H. Rose; Wendy S. Harbour; Catherine Sam Johnston; Samantha G. Daley; Linda Abarbanell",
   publisher: "Journal of Postsecondary Education and Disability (AHEAD)",
   citation: "David H. Rose, Wendy S. Harbour, Catherine Sam Johnston, Samantha G. Daley & Linda Abarbanell, Universal Design for Learning in Postsecondary Education: Reflections on Principles and their Application, 19(2) Journal of Postsecondary Education and Disability 135-151 (2006). ERIC EJ844630.",
   url: "https://files.eric.ed.gov/fulltext/EJ844630.pdf",
   short: "Distinguishes individual assistive technology from universal design, applies Universal Design for Learning to a Harvard course, and argues universities locate disability in students rather than in learning environments.",
   full: "The authors separate assistive technology, fitted to one person, from universal design, which removes barriers through the initial design. Universal Design for Learning adds accessible pedagogy to accessible information. They describe applying its principles, offered as guidelines rather than rules, to a Harvard Graduate School of Education course. They hold that both individual and universal approaches are needed, and conclude that universities place too much emphasis on disability in students and too little on disability in the learning environment."},
  {name: "Boysen, A critical analysis of the research evidence behind CAST's universal design for learning guidelines (2024)", author: "Guy A. Boysen",
   publisher: "Policy Futures in Education (SAGE)",
   citation: "Guy A. Boysen, A critical analysis of the research evidence behind CAST's universal design for learning guidelines, 22(7) Policy Futures in Education 1219-1238 (2024). doi:10.1177/14782103241255428.",
   url: "https://doi.org/10.1177/14782103241255428",
   short: "Reviews the studies CAST cites for its UDL guidelines and finds they provide little evidence for UDL's claims about choice, learning or the brain.",
   full: "Boysen sampled the studies CAST cites as evidence for three of its UDL guidelines and analyzed whether they concern learner choice, learning, and brain function. He reports that most did not offer learners a choice or measure learning, none related to brain function, and most supported single effective teaching techniques rather than multiple means. He concludes that the evidence behind the guidelines is weak and that basic and implementation research are needed. Only the abstract was read."},
  {name: "Capp, The effectiveness of universal design for learning: a meta-analysis (2017)", author: "Matthew James Capp",
   publisher: "International Journal of Inclusive Education (Taylor & Francis)",
   citation: "Matthew James Capp, The effectiveness of universal design for learning: a meta-analysis of literature between 2013 and 2016, 21(8) International Journal of Inclusive Education 791-807 (2017). doi:10.1080/13603116.2017.1325074. ERIC EJ1147229.",
   url: "https://eric.ed.gov/?id=EJ1147229",
   short: "A meta-analysis of 18 pre- and post-test studies finding that UDL improves the learning process but has not been shown to improve educational outcomes.",
   full: "Capp meta-analyzed 18 peer-reviewed studies from 2013 to 2016 with pre- and post-testing. He reports that UDL is an effective teaching methodology for improving the learning process for all students, and that its impact on educational outcomes has not been demonstrated. Only the abstract was read."},
  {name: "Goodley, Dis/ability Studies: Theorising Disablism and Ableism (2014)", author: "Dan Goodley", publisher: "Routledge",
   citation: "Dan Goodley, Dis/ability Studies: Theorising Disablism and Ableism (Routledge 2014). ISBN 9780415827225. doi:10.4324/9780203366974.",
   url: "https://www.routledge.com/Disability-Studies-Theorising-disablism-and-ableism/Goodley/p/book/9780415827225",
   short: "Goodley's theoretical account of disablism and ableism as dual processes that must be studied together.",
   full: "Recorded as a citation only. The publisher description presents disablism and ableism as dual processes, each depending on the other, and includes a chapter on inclusive education. The book was not read, and no principle grounds on it."},
  {name: "Rose and Meyer, Teaching Every Student in the Digital Age (2002)", author: "David H. Rose; Anne Meyer", publisher: "ASCD",
   citation: "David H. Rose & Anne Meyer, Teaching Every Student in the Digital Age: Universal Design for Learning (ASCD 2002). ISBN 0871205998. ERIC ED466086.",
   url: "https://eric.ed.gov/?id=ED466086",
   short: "The book that set out Universal Design for Learning for classroom teachers.",
   full: "Recorded as a citation only. The ERIC record describes a guide in two parts: the concepts behind UDL, including digital media and learner differences, and its application to goals, methods, materials and assessment. The free text CAST once posted is no longer at its old address. The book was not read, and no principle grounds on it."},
  {name: "Roulstone, Disability and Technology: An Interdisciplinary and International Approach (2016)", author: "Alan Roulstone", publisher: "Palgrave Macmillan",
   citation: "Alan Roulstone, Disability and Technology: An Interdisciplinary and International Approach (Palgrave Macmillan 2016). doi:10.1057/978-1-137-45042-5. ISBN 9781137450418.",
   url: "https://doi.org/10.1057/978-1-137-45042-5",
   short: "Roulstone's account of technology in disabled people's lives, drawing on disability studies, technology studies and clinical studies.",
   full: "Recorded as a citation only. Its publisher description holds that technology is neither inherently enabling nor disabling and that its effect depends on how it is designed, used and deployed. The book is paywalled and was not read, and no principle grounds on it."},
  {name: "Roulstone and Warren, Applying a barriers approach to monitoring disabled people's employment (2006)", author: "Alan Roulstone; John Warren", publisher: "Disability & Society (Taylor & Francis)",
   citation: "Alan Roulstone & John Warren, Applying a barriers approach to monitoring disabled people's employment: implications for the Disability Discrimination Act 2005, 21(2) Disability & Society 115-131 (2006). doi:10.1080/09687590500498036.",
   url: "https://doi.org/10.1080/09687590500498036",
   short: "A scoping study on monitoring disabled people's employment through barriers, written as the UK Disability Discrimination Act 2005 introduced more proactive duties.",
   full: "Recorded as a citation only. The article argues for monitoring employment through the barriers disabled people meet, in the context of the 2005 Act's move toward proactive duties. The full text is closed and the abstract could be read only through an index that does not preserve wording, so no principle grounds on it."}
] AS s
MERGE (i:IntellectualSource {name: s.name})
ON CREATE SET i.unique_id = replace(randomUUID(), "-", "")
SET i.author = s.author, i.publisher = s.publisher, i.citation = s.citation, i.url = s.url,
    i.description_short = s.short, i.description_full = s.full;


// --- 3. Groundings ------------------------------------------------------------------------
UNWIND [
  {h: "principle:institution-wide-responsibility", src: "Goodley, Depathologising the university (2024)", prov: "Pedagogy, Culture & Society 33(3), section on disability as authority",
   quote: "rather than a problem that has to be managed and accommodated in the university",
   why: "Goodley argues that the university treats disability as a technical problem inside a person, handled through individual support and adjustments. He asks university actors to treat disability instead as an opportunity to rethink the university. The source places the work on the institution and its practices, not on the disabled student or the office that supports them."},
  {h: "principle:institution-wide-responsibility", src: "Goodley, Liddiard, and Lawthom, The depathologising university (2025)", prov: "SJDR 27(1), abstract and conclusion",
   quote: "those of us who work in the university are the university, and we all have work to do",
   why: "The authors describe access as a resourced colleague working alongside researchers, academics, technicians and professional services. They close on the university's civic responsibility to the communities it serves. The source assigns the work to everyone who makes up the university."},
  {h: "principle:program-accessibility-as-proactive-duty", src: "Goodley et al., Rebooting inclusive education? New technologies and disabled people (2020)", prov: "CJDS 9(5), discussion of accessibility in educational practice",
   quote: "accessibility, though often easy to implement, is not assured when social convention fails to account for it.",
   why: "The authors argue that new technology does not by itself make education inclusive. Their example is a presentation whose ordinary techniques assume the audience can see. They state that educational convention leaves accessibility to those who lack it, so disabled people must negotiate it each time. The source supports building accessibility into practice before anyone asks."},
  {h: "principle:program-accessibility-as-proactive-duty", src: "Goodley and Lawthom, A narrative exposition of the university, disability and the non-disabled academic (2026)", prov: "SJDR 28(1), theme on anticipating disability",
   quote: "the university fails to anticipate the presence of disability",
   why: "The authors state that disability still tends to be treated as an individual problem that inconveniences the university. They describe each arrival of disability as handled almost as a surprise. They read this as a lack of the community capacity that would set the conditions for access in advance."},
  {h: "principle:vendor-leverage-procurement-as-accessibility-lever", src: "Treviranus, The three dimensions of Inclusive Design, Parts one to three (2018)", prov: "Part three, the student's digital curriculum example",
   quote: "This has an impact on the procurement processes and policies of the school board or district.",
   why: "Treviranus follows one student's need for reconfigurable digital curriculum outward. His teacher must source materials in an open digital format, the school must support digital resources, and so the school board's procurement policy must change. She describes the effect reaching how textbooks are designed nationally. The source places procurement at the point where one learner's access becomes a system decision."},
  {h: "principle:universal-design-over-accommodation", src: "Treviranus, The three dimensions of Inclusive Design, Parts one to three (2018)", prov: "Part one, Not Segregated or Separate",
   quote: "the one-size-fits-one design cannot be separate or segregated",
   why: "Treviranus argues that a single accessible version fails some users because disability is defined by difference. She proposes design that adapts to each user through personalization and responsive design. She requires that the adaptation be part of the mainstream product, because a separate version costs more and is less interoperable. The source supports designing for the range of users, read as adaptable rather than uniform."},
  {h: "principle:vendor-leverage-procurement-as-accessibility-lever", src: "Ontario Information and Communications Standards Development Committee, 2020 Final Recommendations Report", prov: "Recommendation 14: Procurement",
   quote: "these are not strong enough to result in accessible digital procurement.",
   why: "The committee found that Ontario's accessibility regulation had no procurement requirements specific to information and communications, and that its general procurement requirements were too weak. It recommended that the government and designated public sector organizations build accessibility criteria into purchasing, including qualified third-party evaluation and certification. The recommendation is advisory."},
  {h: "principle:equally-effective-access", src: "Floe Inclusive Learning Design Handbook, Understanding Accessibility and Inclusivity", prov: "What is Accessible?",
   quote: "An accessible learning experience is a learning experience that matches the needs of the individual learner or the learners within a group.",
   why: "The handbook defines accessibility by whether a learning experience meets a particular learner's needs. It treats disability as a mismatch between the person and the environment. The source measures access by the learner's actual experience, which is the test equally effective access applies."},
  {h: "principle:universal-design-over-accommodation", src: "Rose et al., Universal Design for Learning in Postsecondary Education (2006)", prov: "JPED 19(2), section on universal design",
   quote: "Universal design focuses on eliminating barriers through initial designs that consider the needs of diverse people, rather than overcoming barriers later through individual adaptation.",
   why: "The authors define universal design as removing barriers in the initial design rather than adapting for individuals afterward. They note that such solutions are built once and applied many times. They extend the idea from information to pedagogy as Universal Design for Learning, which they offer as guidelines rather than rules."},
  {h: "principle:program-accessibility-as-proactive-duty", src: "Rose et al., Universal Design for Learning in Postsecondary Education (2006)", prov: "JPED 19(2), conclusion",
   quote: "universities place too much emphasis on the disabilities in students, not enough on the disabilities in the learning environment.",
   why: "The authors conclude that disabilities reflect mismatches between the environment and the individual. They state that universities address accommodations and access individually rather than at the level of courses, departments or universities. The source supports a duty located in the learning environment."},
  {h: "principle:parallel-duties-conformance-and-accommodation", src: "Rose et al., Universal Design for Learning in Postsecondary Education (2006)", prov: "JPED 19(2), assistive technology and universal design",
   quote: "We believe that both approaches are important from a pedagogical standpoint.",
   why: "The authors distinguish assistive technology, fitted to an individual, from universal design, built into the environment for many. They hold that both are needed and that their intersection yields better solutions. The source keeps an individual response alongside universal design rather than replacing it."}
] AS row
MATCH (p:Principle {handle: row.h})
MATCH (i:IntellectualSource {name: row.src})
MERGE (p)-[r:derives_from]->(i)
SET r.provision = row.prov, r.grounding_kind = "scholarship", r.quote = row.quote,
    r.rationale = row.why, r.assessed_date = date("2026-10-07");


// --- 4. Contested by ----------------------------------------------------------------------
UNWIND [
  {h: "principle:conformance-to-an-external-technical-standard", src: "Treviranus, The three dimensions of Inclusive Design, Parts one to three (2018)", prov: "Part three, the online exam example; Part two, process over checklist",
   quote: "the school had met all the Web Content Accessibility Guideline criterion and was therefore fully compliant to accessibility regulations and policy.",
   why: "Treviranus describes a student who operated an online exam with a single switch, needing up to 30 selections per question. Operating the exam took far more effort than answering it, yet the school met every WCAG criterion. In Part two she argues that an inclusive design process produces more lasting change than a checklist of design criteria. The source does not reject standards. It contests treating conformance as proof of access."},
  {h: "principle:conformance-to-an-external-technical-standard", src: "Floe Inclusive Learning Design Handbook, Understanding Accessibility and Inclusivity", prov: "What is Accessible?",
   quote: "a resource cannot be labeled as accessible or inaccessible until we know the context, the learning goal and the learner",
   why: "The handbook holds that accessibility belongs to the match between a resource and a learner, not to the resource alone. A resource accessible to one group may not be to another. The source contests reading a conformance result as a fixed property of a resource."},
  {h: "principle:universal-design-over-accommodation", src: "Boysen, A critical analysis of the research evidence behind CAST's universal design for learning guidelines (2024)", prov: "Abstract",
   quote: "the cited evidence behind CAST's UDL guidelines is weak",
   why: "Boysen reviewed the studies CAST cites for three UDL guidelines. Most did not offer learners a choice or measure learning, and none concerned brain function. The source contests the principle where it rests on UDL's pedagogical claims. It does not address universal design of technology or the accessibility standards. Only the abstract was read."},
  {h: "principle:universal-design-over-accommodation", src: "Capp, The effectiveness of universal design for learning: a meta-analysis (2017)", prov: "Abstract",
   quote: "The impact on educational outcomes has not been demonstrated.",
   why: "Capp's meta-analysis of 18 studies found that UDL improves the learning process for all students. It found no demonstrated effect on educational outcomes. The finding is mixed. It qualifies claims that universal design in teaching improves results, without contesting its role in removing barriers. Only the abstract was read."}
] AS row
MATCH (p:Principle {handle: row.h})
MATCH (i:IntellectualSource {name: row.src})
MERGE (p)-[r:contested_by]->(i)
SET r.provision = row.prov, r.quote = row.quote, r.rationale = row.why,
    r.assessed_date = date("2026-10-07");
