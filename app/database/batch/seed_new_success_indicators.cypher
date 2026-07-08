// ============================================================================
//  SEED: New Success Indicators (CMM Companion draft 2) — effective 2026-2027
// ============================================================================
//
//  Source of truth for the text: app/database/ontology/new-success-indicators.md
//  Extracted cohort: 31 new SIs across 5 priority areas.
//
//  WHAT THIS FILE DOES (in dependency order):
//    Section 1  Create the two NEW working groups (Communication & Training,
//               Governance, Planning, and Policies).
//    Section 2  Create / attach the Goals the new SIs hang off (all 5 areas).
//    Section 3  Create the 31 SuccessIndicators with the new fields:
//                 - examples_of_evidence  (native list<string>)
//                 - level_examples        (JSON STRING — see note below)
//                 - introduced_in_year    = '2026-2027'   (the year gate)
//    Section 4  [GUARDED] Create 2026-2027 YearSuccessEvidence across campuses.
//
//  HOW TO RUN
//    cypher-shell -f app/database/batch/seed_new_success_indicators.cypher
//    (or paste into Neo4j Browser). Requires APOC.
//
//  IMPORTANT NOTES / THINGS WE'RE WORKSHOPPING
//    * level_examples is stored as a JSON STRING to match neomodel's JSONProperty
//      (which json.dumps() the dict into a string column). We build it with
//      apoc.convert.toJson({...}) so the Cypher stays readable and the stored
//      value is valid JSON the app can json.loads(). Keys are status-level LABELS
//      only ("Established"/"Managed"/"Optimizing") — NOT edges to StatusLevel.
//    * Keys use the data_config spelling "Optimizing" (not "Optimized").
//    * WG composite-key abbrevs below are PROVISIONAL: com = Communication &
//      Training, gov = Governance. These must also be registered in
//      app/data_config.py (working_group_names + compsite_key_wg_names) and the
//      FE working-group registry before the app create-path / reads work. <-- DECIDE
//    * Idempotent: MERGE on identity keys (WG name / goal_number+WG / composite_key).
//      ON CREATE SET protects unique_id, date_added, and EXISTING goals' text.
//      Content fields are re-SET every run so we can workshop the text and re-apply.
//    * Six SIs have NO authored companion content yet (IM 7.12; Comm&Training
//      2.1–2.5): seeded with empty examples_of_evidence / level_examples.
//    * Rich text below is FULLY populated for one exemplar per area (Web 1.20,
//      IM 5.17, Procurement 1.12, C&T 1.1, Gov 1.1) to lock the pattern; the
//      remaining SIs carry identity + `// TODO paste from new-success-indicators.md`.
//    * Section 4 (YSE) is GUARDED — run only AFTER the 2026-2027 rollover has
//      created the AcademicYear node. It is a live write; needs explicit auth.
// ============================================================================


// ============================================================================
//  SECTION 1 — New working groups
// ============================================================================

MERGE (wg:ATIWorkingGroup {name: 'Communication & Training'})
  ON CREATE SET wg.unique_id  = randomUUID(),
                wg.description = 'ATI priority area (NEW): promote a campus-wide culture of accessibility and deliver ongoing, role-specific accessibility training.';

MERGE (wg:ATIWorkingGroup {name: 'Governance, Planning, and Policies'})
  ON CREATE SET wg.unique_id  = randomUUID(),
                wg.description = 'ATI priority area (NEW): clear roles and responsibilities, formalized accessibility policies, and accessibility embedded in institutional planning cycles.';


// ============================================================================
//  SECTION 2 — Goals (MERGE within each working group by goal_number)
//  Existing-area goals (Web/IM/Procurement) are MERGE + ON CREATE SET, so real
//  goal text is NOT overwritten if the goal already exists.
// ============================================================================

// --- Web (existing WG) ---
MATCH (wg:ATIWorkingGroup {name: 'Web'})
MERGE (wg)-[:responsible_for]->(g:Goal {goal_number: 1})
  ON CREATE SET g.unique_id = randomUUID(), g.removed = false, g.date_added = date('2026-07-01'),
                g.name = 'Web Accessibility Evaluation Process',
                g.goal = 'Web Accessibility Evaluation Process';
MATCH (wg:ATIWorkingGroup {name: 'Web'})
MERGE (wg)-[:responsible_for]->(g:Goal {goal_number: 2})
  ON CREATE SET g.unique_id = randomUUID(), g.removed = false, g.date_added = date('2026-07-01'),
                g.name = 'New Website/Web Application and Digital Content Design and Development Process',
                g.goal = 'New Website/Web Application and Digital Content Design and Development Process';
MATCH (wg:ATIWorkingGroup {name: 'Web'})
MERGE (wg)-[:responsible_for]->(g:Goal {goal_number: 3})
  ON CREATE SET g.unique_id = randomUUID(), g.removed = false, g.date_added = date('2026-07-01'),
                g.name = 'Ongoing Monitoring Process',
                g.goal = 'Ongoing Monitoring Process';

// --- Instructional Materials (existing WG) ---
MATCH (wg:ATIWorkingGroup {name: 'Instructional Materials'})
MERGE (wg)-[:responsible_for]->(g:Goal {goal_number: 5})
  ON CREATE SET g.unique_id = randomUUID(), g.removed = false, g.date_added = date('2026-07-01'),
                g.name = 'Accessibility Requirements for Multimedia, Interactive Content, and Emerging Instructional Technologies',
                g.goal = 'Accessibility Requirements for Multimedia, Interactive Content, and Emerging Instructional Technologies';
MATCH (wg:ATIWorkingGroup {name: 'Instructional Materials'})
MERGE (wg)-[:responsible_for]->(g:Goal {goal_number: 6})
  ON CREATE SET g.unique_id = randomUUID(), g.removed = false, g.date_added = date('2026-07-01'),
                g.name = 'Accessibility Requirements for Course Review and Remediation',
                g.goal = 'Accessibility Requirements for Course Review and Remediation';
MATCH (wg:ATIWorkingGroup {name: 'Instructional Materials'})
MERGE (wg)-[:responsible_for]->(g:Goal {goal_number: 7})
  ON CREATE SET g.unique_id = randomUUID(), g.removed = false, g.date_added = date('2026-07-01'),
                g.name = 'Creation and Adoption of Accessible Instructional Materials',
                g.goal = 'Creation and Adoption of Accessible Instructional Materials';

// --- Procurement (existing WG) ---
MATCH (wg:ATIWorkingGroup {name: 'Procurement'})
MERGE (wg)-[:responsible_for]->(g:Goal {goal_number: 1})
  ON CREATE SET g.unique_id = randomUUID(), g.removed = false, g.date_added = date('2026-07-01'),
                g.name = 'Procurement Processes',
                g.goal = 'Procurement Processes';
MATCH (wg:ATIWorkingGroup {name: 'Procurement'})
MERGE (wg)-[:responsible_for]->(g:Goal {goal_number: 8})
  ON CREATE SET g.unique_id = randomUUID(), g.removed = false, g.date_added = date('2026-07-01'),
                g.name = 'Experience/Implementation',
                g.goal = 'Experience/Implementation';

// --- Communication & Training (NEW WG) ---
MATCH (wg:ATIWorkingGroup {name: 'Communication & Training'})
MERGE (wg)-[:responsible_for]->(g:Goal {goal_number: 1})
  ON CREATE SET g.unique_id = randomUUID(), g.removed = false, g.date_added = date('2026-07-01'),
                g.name = 'Promote a Campus-Wide Culture of Accessibility',
                g.goal = 'Promote a Campus-Wide Culture of Accessibility';
MATCH (wg:ATIWorkingGroup {name: 'Communication & Training'})
MERGE (wg)-[:responsible_for]->(g:Goal {goal_number: 2})
  ON CREATE SET g.unique_id = randomUUID(), g.removed = false, g.date_added = date('2026-07-01'),
                g.name = 'Ongoing Role-Specific Accessibility Training',
                g.goal = 'Ongoing Role-Specific Accessibility Training';

// --- Governance, Planning, and Policies (NEW WG) ---
MATCH (wg:ATIWorkingGroup {name: 'Governance, Planning, and Policies'})
MERGE (wg)-[:responsible_for]->(g:Goal {goal_number: 1})
  ON CREATE SET g.unique_id = randomUUID(), g.removed = false, g.date_added = date('2026-07-01'),
                g.name = 'Establish Clear Roles and Responsibilities for Accessibility Oversight',
                g.goal = 'Establish Clear Roles and Responsibilities for Accessibility Oversight';
MATCH (wg:ATIWorkingGroup {name: 'Governance, Planning, and Policies'})
MERGE (wg)-[:responsible_for]->(g:Goal {goal_number: 2})
  ON CREATE SET g.unique_id = randomUUID(), g.removed = false, g.date_added = date('2026-07-01'),
                g.name = 'Formalize Accessibility-Related Policies and Procedures',
                g.goal = 'Formalize Accessibility-Related Policies and Procedures';
MATCH (wg:ATIWorkingGroup {name: 'Governance, Planning, and Policies'})
MERGE (wg)-[:responsible_for]->(g:Goal {goal_number: 3})
  ON CREATE SET g.unique_id = randomUUID(), g.removed = false, g.date_added = date('2026-07-01'),
                g.name = 'Embed Accessibility into Institutional Planning Cycles',
                g.goal = 'Embed Accessibility into Institutional Planning Cycles';


// ============================================================================
//  SECTION 3 — Success Indicators
//  Pattern per SI:
//    MATCH the parent goal (by WG name + goal_number)
//    MERGE the SI by composite_key
//    SET fields (content re-applied each run)
//    MERGE the Goal-[:supported_by]->SI edge
// ============================================================================

// ---------------------------------------------------------------------------
//  WEB
// ---------------------------------------------------------------------------

// 1.20 — social media accounts inventory + accessibility  (FULLY POPULATED EXEMPLAR)
MATCH (:ATIWorkingGroup {name: 'Web'})-[:responsible_for]->(g:Goal {goal_number: 1})
MERGE (si:SuccessIndicator {composite_key: '1.20-web'})
  ON CREATE SET si.unique_id = randomUUID(), si.date_added = date('2026-07-01')
  SET si.number = 20,
      si.success_indicator = "Establish a process to identify all campus-affiliated social media accounts and assess the accessibility of their shared content in alignment with recognized standards.",
      si.removed = false,
      si.override_implementation_requirement = false,
      si.introduced_in_year = '2026-2027',
      si.examples_of_evidence = [
        "An inventory or registry of official campus-affiliated social media accounts.",
        "Policies or guidelines requiring new accounts to be registered centrally.",
        "Accessibility checklists for social media content (e.g., use of alt text, captions, hashtags, contrast, effective communication).",
        "Training materials or workshops for social media managers.",
        "Sample audit reports documenting accessibility findings on posts or campaigns.",
        "Documentation of outreach to account owners with accessibility recommendations.",
        "Workflows or checklists built into posting processes (e.g., reminders for alt text and captions)."
      ],
      si.level_examples = apoc.convert.toJson({
        Established: "At the Established level, the university has moved beyond ad hoc awareness and has a documented, consistent practice.\n\n- Position Descriptions: A central communications or accessibility office is tasked with maintaining the account inventory. Trained staff are tasked with manual reviews of social media accounts.\n- Budget: Resources exist for training, accessibility tools (e.g., captioning services, image description support), and audit support.\n- Process: Documented procedures outline how accounts are identified, registered, and periodically assessed for content accessibility. Account owners are expected to comply with accessibility posting guidelines.\n- Output: A current, centralized list of social media accounts exists, and reports from periodic content accessibility reviews are logged."
      })
MERGE (g)-[:supported_by]->(si);

// 1.21 — accessibility statements aligned to CSU CO guidance
MATCH (:ATIWorkingGroup {name: 'Web'})-[:responsible_for]->(g:Goal {goal_number: 1})
MERGE (si:SuccessIndicator {composite_key: '1.21-web'})
  ON CREATE SET si.unique_id = randomUUID(), si.date_added = date('2026-07-01')
  SET si.number = 21,
      si.success_indicator = "Develop a process to implement and regularly review accessibility statements in alignment with CSU Chancellor's Office guidance, ensuring statements are clearly posted on all campus-affiliated websites, applications, and digital platforms.",
      si.removed = false,
      si.override_implementation_requirement = false,
      si.introduced_in_year = '2026-2027',
      si.examples_of_evidence = [],   // TODO paste from new-success-indicators.md
      si.level_examples = apoc.convert.toJson({})  // TODO Established example
MERGE (g)-[:supported_by]->(si);

// 2.10 — pre-publication accessibility review request
MATCH (:ATIWorkingGroup {name: 'Web'})-[:responsible_for]->(g:Goal {goal_number: 2})
MERGE (si:SuccessIndicator {composite_key: '2.10-web'})
  ON CREATE SET si.unique_id = randomUUID(), si.date_added = date('2026-07-01')
  SET si.number = 10,
      si.success_indicator = "Establish a process for content editors to request an accessibility review of new web content, electronic documents, audio/video materials, and social media posts prior to publication, ensuring compliance with WCAG 2.1 AA standards.",
      si.removed = false,
      si.override_implementation_requirement = false,
      si.introduced_in_year = '2026-2027',
      si.examples_of_evidence = [],   // TODO
      si.level_examples = apoc.convert.toJson({})  // TODO
MERGE (g)-[:supported_by]->(si);

// 3.7 — automated + manual testing combined
MATCH (:ATIWorkingGroup {name: 'Web'})-[:responsible_for]->(g:Goal {goal_number: 3})
MERGE (si:SuccessIndicator {composite_key: '3.7-web'})
  ON CREATE SET si.unique_id = randomUUID(), si.date_added = date('2026-07-01')
  SET si.number = 7,
      si.success_indicator = "Develop a process that combines automated web accessibility scanning tools with manual testing methods to identify accessibility barriers.",
      si.removed = false,
      si.override_implementation_requirement = false,
      si.introduced_in_year = '2026-2027',
      si.examples_of_evidence = [],   // TODO
      si.level_examples = apoc.convert.toJson({})  // TODO
MERGE (g)-[:supported_by]->(si);

// ---------------------------------------------------------------------------
//  INSTRUCTIONAL MATERIALS
// ---------------------------------------------------------------------------

// 5.17 — accessible syllabi each term  (FULLY POPULATED EXEMPLAR)
MATCH (:ATIWorkingGroup {name: 'Instructional Materials'})-[:responsible_for]->(g:Goal {goal_number: 5})
MERGE (si:SuccessIndicator {composite_key: '5.17-ins'})
  ON CREATE SET si.unique_id = randomUUID(), si.date_added = date('2026-07-01')
  SET si.number = 17,
      si.success_indicator = "Develop a process to provide accessible course syllabi at the beginning of each term and promote use of the university-approved LMS.",
      si.removed = false,
      si.override_implementation_requirement = false,
      si.introduced_in_year = '2026-2027',
      si.examples_of_evidence = [
        "Syllabus accessibility guidelines or templates",
        "Faculty communications outlining syllabus expectations",
        "LMS course shell requirements or defaults",
        "Training on accessible syllabus creation",
        "Monitoring or spot checks of syllabus accessibility",
        "Support resources for faculty remediation"
      ],
      si.level_examples = apoc.convert.toJson({
        Established: "At the Established level, the campus has a consistent process for accessible syllabi delivery.\n\n- Accessible syllabi are available at the beginning of each term\n- Faculty use standardized templates or guidance\n- Syllabi are posted within the university-approved LMS\n- Accessibility expectations are clearly communicated\n- The process supports early access and student success"
      })
MERGE (g)-[:supported_by]->(si);

// 6.10 — accessibility of LTIs / external LMS tools
MATCH (:ATIWorkingGroup {name: 'Instructional Materials'})-[:responsible_for]->(g:Goal {goal_number: 6})
MERGE (si:SuccessIndicator {composite_key: '6.10-ins'})
  ON CREATE SET si.unique_id = randomUUID(), si.date_added = date('2026-07-01')
  SET si.number = 10,
      si.success_indicator = "The campus has established a process to evaluate the accessibility of Learning Tools Interoperability (LTI) integrations and external applications used within the campus Learning Management System (LMS), including publisher courseware and digital learning platforms.",
      si.removed = false,
      si.override_implementation_requirement = false,
      si.introduced_in_year = '2026-2027',
      si.examples_of_evidence = [],   // TODO
      si.level_examples = apoc.convert.toJson({})  // TODO
MERGE (g)-[:supported_by]->(si);

// 7.12 — faculty development centers training  (NO COMPANION CONTENT YET)
MATCH (:ATIWorkingGroup {name: 'Instructional Materials'})-[:responsible_for]->(g:Goal {goal_number: 7})
MERGE (si:SuccessIndicator {composite_key: '7.12-ins'})
  ON CREATE SET si.unique_id = randomUUID(), si.date_added = date('2026-07-01')
  SET si.number = 12,
      si.success_indicator = "Develop a process with faculty development centers for training and resources that support faculty and instructional staff in designing accessible instructional materials and content.",
      si.removed = false,
      si.override_implementation_requirement = false,
      si.introduced_in_year = '2026-2027',
      si.examples_of_evidence = [],   // content not yet authored
      si.level_examples = apoc.convert.toJson({})  // content not yet authored
MERGE (g)-[:supported_by]->(si);

// ---------------------------------------------------------------------------
//  PROCUREMENT
// ---------------------------------------------------------------------------

// 1.12 — risk-informed 508 review for ALL acquisitions  (FULLY POPULATED — MULTI-LEVEL EXEMPLAR)
MATCH (:ATIWorkingGroup {name: 'Procurement'})-[:responsible_for]->(g:Goal {goal_number: 1})
MERGE (si:SuccessIndicator {composite_key: '1.12-pro'})
  ON CREATE SET si.unique_id = randomUUID(), si.date_added = date('2026-07-01')
  SET si.number = 12,
      si.success_indicator = "Develop a risk-informed process to evaluate Section 508 compliance for acquisitions, regardless of procurement method or cost (e.g., competitive and non-competitive bids, purchase card transactions, auxiliary, technology that students are required to purchase, LTIs, MEAs).",
      si.removed = false,
      si.override_implementation_requirement = false,
      si.introduced_in_year = '2026-2027',
      si.examples_of_evidence = [
        "Written procedures or policies requiring accessibility review for all ICT acquisitions.",
        "Documentation of accessibility conformance processes/procedures at the procurement level.",
        "Communication outreach to campus auxiliaries, providing input on ICT procurement business processes.",
        "Policies or procedures for auxiliaries; procedures for inclusion of LTIs in Canvas that involve a review process.",
        "Accessibility review logs showing evaluations across procurement types (e.g., competitive bids, direct purchases, renewals, auxiliary purchases).",
        "Training records for P-Card holders and department buyers on accessibility compliance.",
        "Documentation showing accessibility review incorporated into purchase requisition or approval workflows.",
        "Reports summarizing Section 508 compliance rates across procurement methods."
      ],
      si.level_examples = apoc.convert.toJson({
        Established: "- Position: Procurement (both state-side and auxiliary) and ATI accessibility staff have defined responsibilities for reviewing ICT purchases, regardless of funding source or cost.\n- Budget: Allocations exist for accessibility review staffing, tools, and training for decentralized buyers.\n- Procedures: Documented procedures integrate accessibility checks into all procurement workflows across all university affiliates.\n- Output: Comprehensive records show that accessibility review occurred for all ICT acquisitions.",
        Managed: "Metrics: Monitor acquisitions and determine if reviews are proceduralized for those other entities or free software.",
        Optimizing: "Administrative Review: Leadership reviews audit results to ensure equitable application of Section 508 review across all procurement pathways."
      })
MERGE (g)-[:supported_by]->(si);

// 8.11 — close gaps across all procurement channels
MATCH (:ATIWorkingGroup {name: 'Procurement'})-[:responsible_for]->(g:Goal {goal_number: 8})
MERGE (si:SuccessIndicator {composite_key: '8.11-pro'})
  ON CREATE SET si.unique_id = randomUUID(), si.date_added = date('2026-07-01')
  SET si.number = 11,
      si.success_indicator = "The campus, including auxiliaries and affiliated entities, systematically identifies and addresses gaps across all procurement channels to ensure all acquired ICT undergoes accessibility validation.",
      si.removed = false,
      si.override_implementation_requirement = false,
      si.introduced_in_year = '2026-2027',
      si.examples_of_evidence = [],   // TODO
      si.level_examples = apoc.convert.toJson({})  // TODO (Established/Managed/Optimizing)
MERGE (g)-[:supported_by]->(si);

// 8.12 — platform-agnostic systemwide review
MATCH (:ATIWorkingGroup {name: 'Procurement'})-[:responsible_for]->(g:Goal {goal_number: 8})
MERGE (si:SuccessIndicator {composite_key: '8.12-pro'})
  ON CREATE SET si.unique_id = randomUUID(), si.date_added = date('2026-07-01')
  SET si.number = 12,
      si.success_indicator = "Follow a platform-agnostic process to ensure that all ICT purchases undergo a consistent ATI accessibility conformance review, regardless of procurement method or system used.",
      si.removed = false,
      si.override_implementation_requirement = false,
      si.introduced_in_year = '2026-2027',
      si.examples_of_evidence = [],   // TODO
      si.level_examples = apoc.convert.toJson({})  // TODO (Established/Managed/Optimizing)
MERGE (g)-[:supported_by]->(si);

// ---------------------------------------------------------------------------
//  COMMUNICATION & TRAINING  (all NEW)
// ---------------------------------------------------------------------------

// 1.1 — campus-wide communication campaign  (FULLY POPULATED EXEMPLAR)
MATCH (:ATIWorkingGroup {name: 'Communication & Training'})-[:responsible_for]->(g:Goal {goal_number: 1})
MERGE (si:SuccessIndicator {composite_key: '1.1-com'})
  ON CREATE SET si.unique_id = randomUUID(), si.date_added = date('2026-07-01')
  SET si.number = 1,
      si.success_indicator = "Develop a structured, ongoing campus-wide communication campaign (with executive support) to raise awareness about digital accessibility responsibilities and resources.",
      si.removed = false,
      si.override_implementation_requirement = false,
      si.introduced_in_year = '2026-2027',
      si.examples_of_evidence = [
        "Documented communication plan outlining goals, audiences, messaging, channels, and frequency",
        "Executive sponsorship or endorsements (e.g., messages from campus leadership, strategic priorities)",
        "Campus-wide campaigns (e.g., accessibility awareness month, targeted outreach initiatives)",
        "Use of multiple communication channels (e.g., email, websites, social media, LMS announcements, events)",
        "Messaging tailored to different roles (e.g., faculty, staff, developers, procurement personnel, students)",
        "Centralized accessibility website or hub with resources, guidance, and support information",
        "Metrics or analytics tracking engagement with communication efforts (e.g., email open rates, event participation)"
      ],
      si.level_examples = apoc.convert.toJson({
        Established: "- Position: A designated individual or team is formally responsible for developing and managing campus-wide accessibility communication efforts\n- Budget: Resources are allocated to support communication activities, including campaign development, tools, and outreach efforts\n- Procedures: A documented communication strategy defines messaging, audiences, channels, and a recurring schedule for outreach, supported by executive endorsement\n- Output: Accessibility communication campaigns are consistently delivered across campus, with clear messaging and broad awareness of responsibilities and available resources"
      })
MERGE (g)-[:supported_by]->(si);

// 1.2 — accessibility in onboarding/orientation
MATCH (:ATIWorkingGroup {name: 'Communication & Training'})-[:responsible_for]->(g:Goal {goal_number: 1})
MERGE (si:SuccessIndicator {composite_key: '1.2-com'})
  ON CREATE SET si.unique_id = randomUUID(), si.date_added = date('2026-07-01')
  SET si.number = 2,
      si.success_indicator = "Incorporate digital accessibility awareness into onboarding and orientation programs for new faculty, staff, students, and student employees.",
      si.removed = false,
      si.override_implementation_requirement = false,
      si.introduced_in_year = '2026-2027',
      si.examples_of_evidence = [],   // TODO
      si.level_examples = apoc.convert.toJson({})  // TODO
MERGE (g)-[:supported_by]->(si);

// 1.3 — content creators know where to get help
MATCH (:ATIWorkingGroup {name: 'Communication & Training'})-[:responsible_for]->(g:Goal {goal_number: 1})
MERGE (si:SuccessIndicator {composite_key: '1.3-com'})
  ON CREATE SET si.unique_id = randomUUID(), si.date_added = date('2026-07-01')
  SET si.number = 3,
      si.success_indicator = "Develop a communication process to ensure all digital content creators (e.g., those who create web, instructional materials, marketing, social media, electronic documents, video, audio) know where to get training, help, and resources for accessibility compliance.",
      si.removed = false,
      si.override_implementation_requirement = false,
      si.introduced_in_year = '2026-2027',
      si.examples_of_evidence = [],   // TODO
      si.level_examples = apoc.convert.toJson({})  // TODO
MERGE (g)-[:supported_by]->(si);

// 1.4 — procurement stakeholders know who to contact
MATCH (:ATIWorkingGroup {name: 'Communication & Training'})-[:responsible_for]->(g:Goal {goal_number: 1})
MERGE (si:SuccessIndicator {composite_key: '1.4-com'})
  ON CREATE SET si.unique_id = randomUUID(), si.date_added = date('2026-07-01')
  SET si.number = 4,
      si.success_indicator = "Develop a process so that vendors and campus members involved in ICT procurements know who to contact for assistance, resources, and support.",
      si.removed = false,
      si.override_implementation_requirement = false,
      si.introduced_in_year = '2026-2027',
      si.examples_of_evidence = [],   // TODO
      si.level_examples = apoc.convert.toJson({})  // TODO
MERGE (g)-[:supported_by]->(si);

// 2.1 — training for developers/designers/communicators  (NO COMPANION CONTENT YET)
MATCH (:ATIWorkingGroup {name: 'Communication & Training'})-[:responsible_for]->(g:Goal {goal_number: 2})
MERGE (si:SuccessIndicator {composite_key: '2.1-com'})
  ON CREATE SET si.unique_id = randomUUID(), si.date_added = date('2026-07-01')
  SET si.number = 1,
      si.success_indicator = "Develop a comprehensive training process for web and mobile developers, designers, content contributors, and digital communicators (e.g., document creators, social media managers, and marketing staff) that covers Section 508 standards and campus-specific monitoring processes.",
      si.removed = false,
      si.override_implementation_requirement = false,
      si.introduced_in_year = '2026-2027',
      si.examples_of_evidence = [],   // content not yet authored
      si.level_examples = apoc.convert.toJson({})  // content not yet authored
MERGE (g)-[:supported_by]->(si);

// 2.2 — faculty IM training  (NO COMPANION CONTENT YET)
MATCH (:ATIWorkingGroup {name: 'Communication & Training'})-[:responsible_for]->(g:Goal {goal_number: 2})
MERGE (si:SuccessIndicator {composite_key: '2.2-com'})
  ON CREATE SET si.unique_id = randomUUID(), si.date_added = date('2026-07-01')
  SET si.number = 2,
      si.success_indicator = "Develop a training process (with varied content and modalities) for faculty and instructional staff on the creation, adoption, and remediation of accessible instructional materials.",
      si.removed = false,
      si.override_implementation_requirement = false,
      si.introduced_in_year = '2026-2027',
      si.examples_of_evidence = [],   // content not yet authored
      si.level_examples = apoc.convert.toJson({})  // content not yet authored
MERGE (g)-[:supported_by]->(si);

// 2.3 — accessibility in academic tech training  (NO COMPANION CONTENT YET)
MATCH (:ATIWorkingGroup {name: 'Communication & Training'})-[:responsible_for]->(g:Goal {goal_number: 2})
MERGE (si:SuccessIndicator {composite_key: '2.3-com'})
  ON CREATE SET si.unique_id = randomUUID(), si.date_added = date('2026-07-01')
  SET si.number = 3,
      si.success_indicator = "Integrate accessibility into ongoing academic technology training through faculty support centers.",
      si.removed = false,
      si.override_implementation_requirement = false,
      si.introduced_in_year = '2026-2027',
      si.examples_of_evidence = [],   // content not yet authored
      si.level_examples = apoc.convert.toJson({})  // content not yet authored
MERGE (g)-[:supported_by]->(si);

// 2.4 — training for purchasers  (NO COMPANION CONTENT YET)
MATCH (:ATIWorkingGroup {name: 'Communication & Training'})-[:responsible_for]->(g:Goal {goal_number: 2})
MERGE (si:SuccessIndicator {composite_key: '2.4-com'})
  ON CREATE SET si.unique_id = randomUUID(), si.date_added = date('2026-07-01')
  SET si.number = 4,
      si.success_indicator = "Develop training to ensure everyone purchasing IT products and services understands relevant policies, procedures, and accessibility requirements (this can include purchase requestors, administrative support staff, technology support staff, buyers, procurement officers, and purchase cardholders).",
      si.removed = false,
      si.override_implementation_requirement = false,
      si.introduced_in_year = '2026-2027',
      si.examples_of_evidence = [],   // content not yet authored
      si.level_examples = apoc.convert.toJson({})  // content not yet authored
MERGE (g)-[:supported_by]->(si);

// 2.5 — role-specific professional development  (NO COMPANION CONTENT YET)
MATCH (:ATIWorkingGroup {name: 'Communication & Training'})-[:responsible_for]->(g:Goal {goal_number: 2})
MERGE (si:SuccessIndicator {composite_key: '2.5-com'})
  ON CREATE SET si.unique_id = randomUUID(), si.date_added = date('2026-07-01')
  SET si.number = 5,
      si.success_indicator = "Develop a process to ensure that employees with explicit ATI accessibility responsibilities in each priority area (Web, Instructional Materials, and Procurement) are prioritized for ongoing, role-specific professional development to meet evolving accessibility standards and campus goals.",
      si.removed = false,
      si.override_implementation_requirement = false,
      si.introduced_in_year = '2026-2027',
      si.examples_of_evidence = [],   // content not yet authored
      si.level_examples = apoc.convert.toJson({})  // content not yet authored
MERGE (g)-[:supported_by]->(si);

// ---------------------------------------------------------------------------
//  GOVERNANCE, PLANNING, AND POLICIES  (all NEW)
// ---------------------------------------------------------------------------

// 1.1 — accessibility in position descriptions  (FULLY POPULATED EXEMPLAR)
MATCH (:ATIWorkingGroup {name: 'Governance, Planning, and Policies'})-[:responsible_for]->(g:Goal {goal_number: 1})
MERGE (si:SuccessIndicator {composite_key: '1.1-gov'})
  ON CREATE SET si.unique_id = randomUUID(), si.date_added = date('2026-07-01')
  SET si.number = 1,
      si.success_indicator = "Assigned authority and responsibility for accessibility documented in appropriate position descriptions.",
      si.removed = false,
      si.override_implementation_requirement = false,
      si.introduced_in_year = '2026-2027',
      si.examples_of_evidence = [
        "Position descriptions that explicitly include digital accessibility responsibilities (e.g., web content creators, instructional designers, procurement staff, IT leadership)",
        "Standard language or competencies related to accessibility included in HR classification or job templates",
        "Organizational charts or role matrices showing accessibility responsibilities across departments",
        "Performance evaluation criteria tied to accessibility-related duties",
        "Documentation aligning accessibility responsibilities with specific ATI priority areas or success indicators",
        "HR or governance policies requiring inclusion of accessibility in relevant roles"
      ],
      si.level_examples = apoc.convert.toJson({
        Established: "- Position: Accessibility responsibilities are clearly defined and formally included in relevant position descriptions across key roles (e.g., web, instructional materials, procurement, IT, communications)\n- Budget: Funding supports roles with explicit accessibility responsibilities, including allocated time or dedicated positions\n- Procedures: A standardized process ensures accessibility responsibilities are consistently incorporated into new and updated position descriptions through HR and governance workflows\n- Output: Position descriptions across the institution consistently reflect assigned accessibility responsibilities, establishing clear accountability for implementation"
      })
MERGE (g)-[:supported_by]->(si);

// 1.2 — authority for web evaluation + monitoring
MATCH (:ATIWorkingGroup {name: 'Governance, Planning, and Policies'})-[:responsible_for]->(g:Goal {goal_number: 1})
MERGE (si:SuccessIndicator {composite_key: '1.2-gov'})
  ON CREATE SET si.unique_id = randomUUID(), si.date_added = date('2026-07-01')
  SET si.number = 2,
      si.success_indicator = "Assigned authority and responsibility for the web evaluation process and ongoing monitoring (to include digital content) to a body (person(s) or business entity).",
      si.removed = false,
      si.override_implementation_requirement = false,
      si.introduced_in_year = '2026-2027',
      si.examples_of_evidence = [],   // TODO
      si.level_examples = apoc.convert.toJson({})  // TODO
MERGE (g)-[:supported_by]->(si);

// 1.3 — authority for new web/mobile development
MATCH (:ATIWorkingGroup {name: 'Governance, Planning, and Policies'})-[:responsible_for]->(g:Goal {goal_number: 1})
MERGE (si:SuccessIndicator {composite_key: '1.3-gov'})
  ON CREATE SET si.unique_id = randomUUID(), si.date_added = date('2026-07-01')
  SET si.number = 3,
      si.success_indicator = "Assigned authority and responsibility for the new web/mobile development process (to include updates and maintenance) to a body (person(s) or business entity).",
      si.removed = false,
      si.override_implementation_requirement = false,
      si.introduced_in_year = '2026-2027',
      si.examples_of_evidence = [],   // TODO
      si.level_examples = apoc.convert.toJson({})  // TODO
MERGE (g)-[:supported_by]->(si);

// 1.4 — authority for accessible ICT procurement
MATCH (:ATIWorkingGroup {name: 'Governance, Planning, and Policies'})-[:responsible_for]->(g:Goal {goal_number: 1})
MERGE (si:SuccessIndicator {composite_key: '1.4-gov'})
  ON CREATE SET si.unique_id = randomUUID(), si.date_added = date('2026-07-01')
  SET si.number = 4,
      si.success_indicator = "Assigned authority and responsibility for the accessible ICT procurement process to a body (person(s) or business entity).",
      si.removed = false,
      si.override_implementation_requirement = false,
      si.introduced_in_year = '2026-2027',
      si.examples_of_evidence = [],   // TODO
      si.level_examples = apoc.convert.toJson({})  // TODO
MERGE (g)-[:supported_by]->(si);

// 1.5 — authority for timely adoption metrics
MATCH (:ATIWorkingGroup {name: 'Governance, Planning, and Policies'})-[:responsible_for]->(g:Goal {goal_number: 1})
MERGE (si:SuccessIndicator {composite_key: '1.5-gov'})
  ON CREATE SET si.unique_id = randomUUID(), si.date_added = date('2026-07-01')
  SET si.number = 5,
      si.success_indicator = "Assigned authority and responsibility for tracking, reporting, and distributing timely adoption metrics for instructional material.",
      si.removed = false,
      si.override_implementation_requirement = false,
      si.introduced_in_year = '2026-2027',
      si.examples_of_evidence = [],   // TODO
      si.level_examples = apoc.convert.toJson({})  // TODO
MERGE (g)-[:supported_by]->(si);

// 1.6 — authority for LMS accessibility monitoring
MATCH (:ATIWorkingGroup {name: 'Governance, Planning, and Policies'})-[:responsible_for]->(g:Goal {goal_number: 1})
MERGE (si:SuccessIndicator {composite_key: '1.6-gov'})
  ON CREATE SET si.unique_id = randomUUID(), si.date_added = date('2026-07-01')
  SET si.number = 6,
      si.success_indicator = "Assigned authority and responsibility for ongoing monitoring of accessibility reports on instructional material within the LMS to a body (person(s) or business entity).",
      si.removed = false,
      si.override_implementation_requirement = false,
      si.introduced_in_year = '2026-2027',
      si.examples_of_evidence = [],   // TODO
      si.level_examples = apoc.convert.toJson({})  // TODO
MERGE (g)-[:supported_by]->(si);

// 1.7 — authority for accessibility training programs
MATCH (:ATIWorkingGroup {name: 'Governance, Planning, and Policies'})-[:responsible_for]->(g:Goal {goal_number: 1})
MERGE (si:SuccessIndicator {composite_key: '1.7-gov'})
  ON CREATE SET si.unique_id = randomUUID(), si.date_added = date('2026-07-01')
  SET si.number = 7,
      si.success_indicator = "Assigned authority and responsibility for accessibility training program(s) to a body (person(s) or business entities).",
      si.removed = false,
      si.override_implementation_requirement = false,
      si.introduced_in_year = '2026-2027',
      si.examples_of_evidence = [],   // TODO
      si.level_examples = apoc.convert.toJson({})  // TODO
MERGE (g)-[:supported_by]->(si);

// 2.1 — documented timely-adoption process
MATCH (:ATIWorkingGroup {name: 'Governance, Planning, and Policies'})-[:responsible_for]->(g:Goal {goal_number: 2})
MERGE (si:SuccessIndicator {composite_key: '2.1-gov'})
  ON CREATE SET si.unique_id = randomUUID(), si.date_added = date('2026-07-01')
  SET si.number = 1,
      si.success_indicator = "Campus has formally documented (e.g., Policy, Resolution, or Procedure) a process to ensure the timely adoption of textbooks and other instructional materials.",
      si.removed = false,
      si.override_implementation_requirement = false,
      si.introduced_in_year = '2026-2027',
      si.examples_of_evidence = [],   // TODO
      si.level_examples = apoc.convert.toJson({})  // TODO
MERGE (g)-[:supported_by]->(si);

// 2.2 — documented faculty responsibility for accessible IM
MATCH (:ATIWorkingGroup {name: 'Governance, Planning, and Policies'})-[:responsible_for]->(g:Goal {goal_number: 2})
MERGE (si:SuccessIndicator {composite_key: '2.2-gov'})
  ON CREATE SET si.unique_id = randomUUID(), si.date_added = date('2026-07-01')
  SET si.number = 2,
      si.success_indicator = "Campus has formally documented (through Policy or Resolution) faculty responsibility for selecting and authoring accessible instructional materials.",
      si.removed = false,
      si.override_implementation_requirement = false,
      si.introduced_in_year = '2026-2027',
      si.examples_of_evidence = [],   // TODO
      si.level_examples = apoc.convert.toJson({})  // TODO
MERGE (g)-[:supported_by]->(si);

// 2.3 — documented responsibility for accessible web/digital comms
MATCH (:ATIWorkingGroup {name: 'Governance, Planning, and Policies'})-[:responsible_for]->(g:Goal {goal_number: 2})
MERGE (si:SuccessIndicator {composite_key: '2.3-gov'})
  ON CREATE SET si.unique_id = randomUUID(), si.date_added = date('2026-07-01')
  SET si.number = 3,
      si.success_indicator = "The campus has formally documented (through Policy, Resolution, or Procedure) responsibility for accessible web/mobile and digital communications.",
      si.removed = false,
      si.override_implementation_requirement = false,
      si.introduced_in_year = '2026-2027',
      si.examples_of_evidence = [],   // TODO
      si.level_examples = apoc.convert.toJson({})  // TODO
MERGE (g)-[:supported_by]->(si);

// 2.4 — documented responsibility for procuring accessible ICT
MATCH (:ATIWorkingGroup {name: 'Governance, Planning, and Policies'})-[:responsible_for]->(g:Goal {goal_number: 2})
MERGE (si:SuccessIndicator {composite_key: '2.4-gov'})
  ON CREATE SET si.unique_id = randomUUID(), si.date_added = date('2026-07-01')
  SET si.number = 4,
      si.success_indicator = "The campus has formally documented (through Policy, Resolution, or Procedure) responsibility for procuring accessible ICT.",
      si.removed = false,
      si.override_implementation_requirement = false,
      si.introduced_in_year = '2026-2027',
      si.examples_of_evidence = [],   // TODO
      si.level_examples = apoc.convert.toJson({})  // TODO
MERGE (g)-[:supported_by]->(si);

// 3.1 — ATI Steering annual plan review/approval
MATCH (:ATIWorkingGroup {name: 'Governance, Planning, and Policies'})-[:responsible_for]->(g:Goal {goal_number: 3})
MERGE (si:SuccessIndicator {composite_key: '3.1-gov'})
  ON CREATE SET si.unique_id = randomUUID(), si.date_added = date('2026-07-01')
  SET si.number = 1,
      si.success_indicator = "Develop a process for the ATI Steering Committee and subcommittees to review, revise, and approve the updated Annual Campus Accessible Technology Plan.",
      si.removed = false,
      si.override_implementation_requirement = false,
      si.introduced_in_year = '2026-2027',
      si.examples_of_evidence = [],   // TODO
      si.level_examples = apoc.convert.toJson({})  // TODO
MERGE (g)-[:supported_by]->(si);


// ============================================================================
//  SECTION 4 — [GUARDED] 2026-2027 YearSuccessEvidence across campuses
//  RUN ONLY AFTER the 2026-2027 rollover has created (:AcademicYear {name:'2026-2027'}).
//  Selects exactly the new cohort via introduced_in_year, fans out over all
//  campuses, and builds year_identifier = '<year>-<composite_key>-<campus_abbrev>'
//  (matches app/database/identifiers.py make_yse_identifier).
//  NOTE: MATCH (c:Campus) hits ALL campuses — add a filter here if any campus
//  (e.g. a test/sentinel campus) should be excluded. <-- DECIDE
// ============================================================================

// MATCH (ay:AcademicYear {name: '2026-2027'})
// MATCH (si:SuccessIndicator {introduced_in_year: '2026-2027'})
// MATCH (c:Campus)
// MERGE (yse:YearSuccessEvidence {year_identifier: '2026-2027-' + si.composite_key + '-' + c.abbreviation})
//   ON CREATE SET yse.unique_id = randomUUID(),
//                 yse.administrative_review_complete = false,
//                 yse.ready_for_admin_review = false,
//                 yse.worked_on_in_current_year = false,
//                 yse.will_work_on_next_year = false
// MERGE (yse)-[:tracks]->(si)
// MERGE (yse)-[:evidence_in_year]->(ay)
// MERGE (yse)-[:evidence_at_campus]->(c)
// WITH yse
// MATCH (sl:StatusLevel {status_level: 'Not Started'})
// MERGE (yse)-[:status_is]->(sl);
