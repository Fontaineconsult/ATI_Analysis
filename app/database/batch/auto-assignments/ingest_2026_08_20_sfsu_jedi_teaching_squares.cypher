// ============================================================================
// Ingest: 2026-08-20 (follow-up) — CEETL JEDI Teaching Squares, and correction
//         of the JEDI certificate structure.
//
// SOURCE: app/database/ontology/misc/jedipie-squares.md — CEETL's published
//         "2026-2027 Workshops & Events" and "2026-2027 Programs & Courses"
//         catalog. A faculty-facing published artifact (carries registration
//         QR code and bit.ly links), which makes it documentation, not notes.
//         Supplemented by the 2026-08-20 interview minutes
//         (uid d72a1344ff2f4595a0f6b9e14f040d3b).
//
// WHY THIS FOLLOW-UP EXISTS: the first pass routed the Teaching Square as a
//   Plan on the strength of the interview alone ("a Teaching Square is rolling
//   out this fall" — future tense, so committed intent rather than current
//   practice). The catalog changes that judgment. The JEDI Teaching Square is
//   a published, defined offering with a fixed structure, a participant cap,
//   a stipend, and stated prerequisites. That is a standing programme, so it
//   is modeled as Guidance. The Plan is kept and enriched: it remains the
//   correct record of THIS cohort's rollout.
//
// >>> YEAR ANCHORING — USER DECISION, 2026-08-20 <<<
//   Wired to the 2025-2026 YSEs, on the interviewer's explicit instruction.
//   Recorded plainly because the tension is real and a future reader deserves
//   it: the source is CEETL's 2026-2027 catalog, and the Fall UDL 3.0 square
//   runs in fall 2026, which is academic year 2026-2027. The square had not
//   run during the 2025-2026 reporting year.
//   The counter-case, which is why the interviewer chose 2025-2026: the
//   programme was designed, staffed, funded and published to faculty during
//   the 2025-2026 cycle, and the certificate it completes ran that year.
//   The exposure to watch: a reviewer asking "did this operate in 2025-2026"
//   will find that it did not. If this indicator's status is ever challenged
//   on that basis, the answer is the catalog plus the cohort funding, not a
//   participation record — because none exists yet.
//   The JEDI certificate's two asynchronous courses DID run in 2025-2026
//   (~50 faculty completed the UD 3.0 module), so JEDI Faculty Training keeps
//   its existing 2025-2026 wiring untouched.
//
// OTHER TEACHING SQUARES IN THE CATALOG — deliberately NOT created:
//   - AI Teaching Square. The catalog's "faculty who participated in 2025-26
//     not eligible" confirms AI Teaching Squares already ran, so the format is
//     established at CEETL rather than new. But the subject is AI pedagogy,
//     not accessibility, so it is not evidence for any accessibility
//     indicator. Carried as context in a Note.
//   - Mindfulness & Well-Being FLC Teaching Square. Wellness, not
//     accessibility. Context only.
//   Their existence matters as corroboration that Teaching Square is a
//   standing CEETL format, which is part of why the JEDI square reads as a
//   programme rather than a one-off experiment.
//
// NAMING: the implementation "JEDI Faculty Training" keeps its title because
//   it is the MERGE key and is referenced from eight indicators, the interview
//   guide, and prior notes. The official programme name, "Return of the JEDI
//   PIE Certificate Series", now leads its description. Rename is available as
//   a separate, deliberate change if wanted.
//
// Idempotent. unique_id uses replace(randomUUID(),'-','').
// ============================================================================


// ---------------------------------------------------------------------------
// 1. THE CATALOG AS A DOCUMENT
// ---------------------------------------------------------------------------

MERGE (d:Document {name: "CEETL 2026-2027 Workshops, Events, Programs and Courses"})
  ON CREATE SET d.unique_id = replace(randomUUID(), '-', ''),
                d.depreciated = false,
                d.is_milestone_and_measures_documentation = false,
                d.is_administrative_review_documentation = false
  SET d.include_in_report = true,
      d.description = "CEETL's published faculty-facing catalog of 2026-2027 workshops, events, programs and courses. Documents the Return of the JEDI PIE certificate series and its Teaching Square component, the JEDI Workshop series including a Disability Justice topic, Excellence in Online Pedagogies delivered jointly with Academic Technology, and the AI and Mindfulness Teaching Squares. Distributed to faculty with registration links.";


// ---------------------------------------------------------------------------
// 2. NEW GUIDANCE — JEDI Teaching Square
// ---------------------------------------------------------------------------

MERGE (ts:Guidance {title: "JEDI Teaching Square (CEETL)"})
  ON CREATE SET ts.unique_id = replace(randomUUID(), '-', ''),
                ts.retired = false
  SET ts.description = "The final component of CEETL's Return of the JEDI PIE certificate series, and the collaborative faculty-to-faculty half of it. Two squares run per year: a Fall UDL 3.0 Teaching Square and a Spring TILT Teaching Square, each open to the first 20 participants. A stipend is available for 10 hours of learning. Participants may enrol in only one JEDI Teaching Square. Completion of both asynchronous courses, Slice 1 A New Hope and Slice 2 Do or Do Not, is a prerequisite, and Slice 1 plus Slice 2 plus a Teaching Square earns the certificate. The Fall square is where faculty apply Universal Design for Learning 3.0 collaboratively to their own teaching, making it the applied counterpart to the UDL module taught in the coursework. Co-led by Julie Paulson, Director of Disability Studies, with a second faculty lead. The leads hold a separate grant with CSU Stanislaus focused on neurodivergence and course-redesign accessibility, which funds stipends for 12 participants, with CEETL funding roughly 8 more to reach the cohort of 20.";

MATCH (ts:Guidance {title: "JEDI Teaching Square (CEETL)"})
MATCH (ac:Person {name: "Anoshua Chaudhuri"})
MERGE (ts)-[:owned_by]->(ac);

MATCH (ts:Guidance {title: "JEDI Teaching Square (CEETL)"})
MATCH (jp:Person {name: "Julie Paulson"})
MERGE (jp)-[w:worked_on]->(ts)
  ON CREATE SET w.role_handle = "role:instructor-trainer",
                w.note = "Co-leads the JEDI Teaching Square.",
                w.added_date = date('2026-08-20');

MATCH (ts:Guidance {title: "JEDI Teaching Square (CEETL)"})
MATCH (d:Document {name: "CEETL 2026-2027 Workshops, Events, Programs and Courses"})
MERGE (ts)-[:is_documented_by]->(d);

// Evidence wiring lands on 2025-2026, per the interviewer's decision.
// See the YEAR ANCHORING block in the header.
MATCH (ts:Guidance {title: "JEDI Teaching Square (CEETL)"})
MATCH (y:YearSuccessEvidence)
WHERE y.year_identifier IN ['2025-2026-6.5-ins-sfsu', '2025-2026-8.12-ins-sfsu']
MERGE (ts)-[r:is_evidence_for]->(y)
  ON CREATE SET r.control = 'internal';


// ---------------------------------------------------------------------------
// 3. CORRECT THE JEDI CERTIFICATE STRUCTURE
// ---------------------------------------------------------------------------

MATCH (j {unique_id: '6d71107d0f0d410199999a222dcb2528'})
SET j.description = "Return of the JEDI PIE Certificate Series - CEETL's faculty certificate programme, and a substantial revision of the 2020 JEDI PIE certificate rather than a continuation of it. It focuses on culturally responsive and historically aware teaching, with disability justice as a core evidence-based component alongside gender and racial justice. UDL is framed as the practical classroom implementation of disability justice. The series has three parts. Slice 1, A New Hope, and Slice 2, Do or Do Not, are asynchronous online courses with discussion forums, each earning a badge on completion, and Slice 1 is required first. Slice 2 carries a practical module on Universal Design 3.0, completed by approximately 50 faculty as of August 2026. Both courses are prerequisites for the third part, a JEDI Teaching Square, and all three together earn the certificate. Digital accessibility content is embedded in the online coursework, sourced from SFBRN material and curated with the Teaching Square leads from ATI websites across the CSU system.";

MATCH (j {unique_id: '6d71107d0f0d410199999a222dcb2528'})
MATCH (d:Document {name: "CEETL 2026-2027 Workshops, Events, Programs and Courses"})
MERGE (j)-[:is_documented_by]->(d);


// ---------------------------------------------------------------------------
// 4. ENRICH THE ROLLOUT PLAN with the now-published structure
// ---------------------------------------------------------------------------

MATCH (p:Plan {name: "SFSU: CEETL Teaching Square rollout"})
SET p.description = "CEETL is rolling out the JEDI Teaching Square, the final component of the Return of the JEDI PIE certificate series, beginning with a Fall UDL 3.0 square and continuing with a Spring TILT square. Each is capped at the first 20 participants with a stipend for 10 hours of learning, and participants may enrol in only one. It is co-led by two faculty who separately hold a grant with CSU Stanislaus focused on neurodivergence and general course-redesign accessibility. CEETL receives none of that grant funding and does not pay the two leads, who are compensated through the grant. The grant funds stipends for 12 participants and CEETL is funding approximately 8 more to reach the cohort of 20. CEETL intends to fold in digital accessibility material supplied by Academic Technology so that coverage is built into the curriculum rather than added ad hoc.";


// ---------------------------------------------------------------------------
// 5. NOTES
// ---------------------------------------------------------------------------

MATCH (m:MeetingMinutes {unique_id: 'd72a1344ff2f4595a0f6b9e14f040d3b'})
MATCH (df:Person {name: "Daniel Fontaine"})
MATCH (y:YearSuccessEvidence {year_identifier: '2025-2026-8.12-ins-sfsu'})
MERGE (n:Note {name: "sfsu-teaching-square-format-established-aug-2026-yse:2025-2026-8.12-ins-sfsu-5a91e6d4"})
  ON CREATE SET n.unique_id = replace(randomUUID(), '-', ''),
                n.include_in_report = true,
                n.depreciated = false,
                n.date_created = date('2026-08-20')
  SET n.content = "Teaching Square is an established CEETL format, not a new experiment (source: CEETL 2026-2027 catalog). Alongside the JEDI Teaching Square, the catalog lists an AI Teaching Square and a Mindfulness and Well-Being Teaching Square, and states that faculty who took part in AI Teaching Squares in 2025-26 are not eligible again - which confirms squares already ran that year. Neither of those two is accessibility subject matter, so neither is wired as evidence, but their existence is why the JEDI square reads as a standing programme rather than a one-off. The Fall AI Institute also reports findings from AI teaching squares, so the format has an established reporting-out path CEETL could reuse for the JEDI square's UDL findings."
MERGE (y)-[:has_note]->(n)
MERGE (m)-[:has_note]->(n)
MERGE (n)-[:created_by]->(df);

MATCH (m:MeetingMinutes {unique_id: 'd72a1344ff2f4595a0f6b9e14f040d3b'})
MATCH (df:Person {name: "Daniel Fontaine"})
MATCH (y:YearSuccessEvidence {year_identifier: '2025-2026-6.5-ins-sfsu'})
MERGE (n:Note {name: "sfsu-jedi-square-year-anchoring-aug-2026-yse:2025-2026-6.5-ins-sfsu-cf07b2a8"})
  ON CREATE SET n.unique_id = replace(randomUUID(), '-', ''),
                n.include_in_report = false,
                n.depreciated = false,
                n.date_created = date('2026-08-20')
  SET n.content = "Year-anchoring note for the JEDI Teaching Square (2026-08-20). The square is wired as evidence for the 2025-2026 YSEs by decision of the interviewer, on the basis that the programme was designed, staffed, funded and published to faculty during the 2025-2026 cycle and completes a certificate that ran that year. The countervailing fact, recorded so it is not lost: the source is CEETL's 2026-2027 catalog and the first Fall UDL 3.0 square runs in fall 2026, so the square had not yet operated during 2025-2026. If this evidence is ever challenged, what supports it is the published catalog and the cohort funding, not a participation record - none exists yet. Once the fall square runs, its participation records and any UDL findings it reports out become genuine Output evidence for 6.5-ins, which is the bar element that indicator most lacks, and they should be attached then."
MERGE (y)-[:has_note]->(n)
MERGE (m)-[:has_note]->(n)
MERGE (n)-[:created_by]->(df);

MATCH (m:MeetingMinutes {unique_id: 'd72a1344ff2f4595a0f6b9e14f040d3b'})
MATCH (df:Person {name: "Daniel Fontaine"})
MATCH (y:YearSuccessEvidence {year_identifier: '2025-2026-8.12-ins-sfsu'})
MERGE (n:Note {name: "sfsu-ceetl-2627-catalog-accessibility-content-aug-2026-yse:2025-2026-8.12-ins-sfsu-e38c4b19"})
  ON CREATE SET n.unique_id = replace(randomUUID(), '-', ''),
                n.include_in_report = true,
                n.depreciated = false,
                n.date_created = date('2026-08-20')
  SET n.content = "Accessibility content in CEETL's published 2026-2027 catalog: the JEDI Workshop series lists Disability Justice as a named topic alongside What's in a Name, Active Learning, Escape Room, and AI and Social Justice. Excellence in Online Pedagogies is delivered jointly by Academic Technology and CEETL and awards a digital badge. The Return of the JEDI PIE series is described as culturally responsive and historically aware teaching. This is the first published CEETL artifact in the graph that names accessibility subject matter in the programme catalog itself rather than in a solidarity statement or a course description."
MERGE (y)-[:has_note]->(n)
MERGE (m)-[:has_note]->(n)
MERGE (n)-[:created_by]->(df);
