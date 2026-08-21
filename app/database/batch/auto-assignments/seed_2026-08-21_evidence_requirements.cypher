// Seed EvidenceRequirement nodes from the authored companion bars.
//
// Source: SuccessIndicator.established_example / managed_example / optimizing_example —
// prose bullet lists that are readable but not addressable. This decomposes them into one
// node per bar element so an is_evidence_for link can name WHICH requirement it satisfies.
// The *_example strings are NOT modified; they remain the authored source.
//
// Parsed from three text shapes found in the data:
//   A  inline labelled bullets   "- Position: text"          180 requirements
//   B  heading line then bullets  (Position on its own line)         4
//   C  lead-in then plain bullets (no element label)          51   <- element stays null
//   D  single-line labelled prose (managed/optimizing)        18
//
// element is left NULL for shape C rather than guessed. Eight indicators state their
// Established bar as unlabelled prose; `lead_in` keeps the scope sentence they hang under.
//
// Idempotent: MERGE on the unique handle, SET on every run so a re-parse can correct text.
// A re-run reports zero node creates.


// --- 1.1-com (4) ---
MATCH (si:SuccessIndicator {composite_key: "1.1-com"})
MERGE (er:EvidenceRequirement {handle: "evidence:1.1-com:established:1"})
  ON CREATE SET er.unique_id = randomUUID()
SET er.composite_key = "1.1-com", er.level = "established", er.seq = 1,
    er.element = "Position", er.requirement = "A designated individual or team is formally responsible for developing and managing campus-wide accessibility communication efforts",
    er.rubric_dimension = "resources", er.lead_in = null
MERGE (si)-[:has_evidence_requirement]->(er);
MATCH (si:SuccessIndicator {composite_key: "1.1-com"})
MERGE (er:EvidenceRequirement {handle: "evidence:1.1-com:established:2"})
  ON CREATE SET er.unique_id = randomUUID()
SET er.composite_key = "1.1-com", er.level = "established", er.seq = 2,
    er.element = "Budget", er.requirement = "Resources are allocated to support communication activities, including campaign development, tools, and outreach efforts",
    er.rubric_dimension = "resources", er.lead_in = null
MERGE (si)-[:has_evidence_requirement]->(er);
MATCH (si:SuccessIndicator {composite_key: "1.1-com"})
MERGE (er:EvidenceRequirement {handle: "evidence:1.1-com:established:3"})
  ON CREATE SET er.unique_id = randomUUID()
SET er.composite_key = "1.1-com", er.level = "established", er.seq = 3,
    er.element = "Procedures", er.requirement = "A documented communication strategy defines messaging, audiences, channels, and a recurring schedule for outreach, supported by executive endorsement",
    er.rubric_dimension = "procedures", er.lead_in = null
MERGE (si)-[:has_evidence_requirement]->(er);
MATCH (si:SuccessIndicator {composite_key: "1.1-com"})
MERGE (er:EvidenceRequirement {handle: "evidence:1.1-com:established:4"})
  ON CREATE SET er.unique_id = randomUUID()
SET er.composite_key = "1.1-com", er.level = "established", er.seq = 4,
    er.element = "Output", er.requirement = "Accessibility communication campaigns are consistently delivered across campus, with clear messaging and broad awareness of responsibilities and available resources",
    er.rubric_dimension = "documentation_evidence", er.lead_in = null
MERGE (si)-[:has_evidence_requirement]->(er);

// --- 1.1-gov (4) ---
MATCH (si:SuccessIndicator {composite_key: "1.1-gov"})
MERGE (er:EvidenceRequirement {handle: "evidence:1.1-gov:established:1"})
  ON CREATE SET er.unique_id = randomUUID()
SET er.composite_key = "1.1-gov", er.level = "established", er.seq = 1,
    er.element = "Position", er.requirement = "Accessibility responsibilities are clearly defined and formally included in relevant position descriptions across key roles (e.g., web, instructional materials, procurement, IT, communications)",
    er.rubric_dimension = "resources", er.lead_in = null
MERGE (si)-[:has_evidence_requirement]->(er);
MATCH (si:SuccessIndicator {composite_key: "1.1-gov"})
MERGE (er:EvidenceRequirement {handle: "evidence:1.1-gov:established:2"})
  ON CREATE SET er.unique_id = randomUUID()
SET er.composite_key = "1.1-gov", er.level = "established", er.seq = 2,
    er.element = "Budget", er.requirement = "Funding supports roles with explicit accessibility responsibilities, including allocated time or dedicated positions",
    er.rubric_dimension = "resources", er.lead_in = null
MERGE (si)-[:has_evidence_requirement]->(er);
MATCH (si:SuccessIndicator {composite_key: "1.1-gov"})
MERGE (er:EvidenceRequirement {handle: "evidence:1.1-gov:established:3"})
  ON CREATE SET er.unique_id = randomUUID()
SET er.composite_key = "1.1-gov", er.level = "established", er.seq = 3,
    er.element = "Procedures", er.requirement = "A standardized process ensures accessibility responsibilities are consistently incorporated into new and updated position descriptions through HR and governance workflows",
    er.rubric_dimension = "procedures", er.lead_in = null
MERGE (si)-[:has_evidence_requirement]->(er);
MATCH (si:SuccessIndicator {composite_key: "1.1-gov"})
MERGE (er:EvidenceRequirement {handle: "evidence:1.1-gov:established:4"})
  ON CREATE SET er.unique_id = randomUUID()
SET er.composite_key = "1.1-gov", er.level = "established", er.seq = 4,
    er.element = "Output", er.requirement = "Position descriptions across the institution consistently reflect assigned accessibility responsibilities, establishing clear accountability for implementation",
    er.rubric_dimension = "documentation_evidence", er.lead_in = null
MERGE (si)-[:has_evidence_requirement]->(er);

// --- 1.11-web (4) ---
MATCH (si:SuccessIndicator {composite_key: "1.11-web"})
MERGE (er:EvidenceRequirement {handle: "evidence:1.11-web:established:1"})
  ON CREATE SET er.unique_id = randomUUID()
SET er.composite_key = "1.11-web", er.level = "established", er.seq = 1,
    er.element = "Position", er.requirement = "Designated accessibility staff or trained document reviewers formally assigned responsibility for conducting and coordinating manual document evaluations.",
    er.rubric_dimension = "resources", er.lead_in = null
MERGE (si)-[:has_evidence_requirement]->(er);
MATCH (si:SuccessIndicator {composite_key: "1.11-web"})
MERGE (er:EvidenceRequirement {handle: "evidence:1.11-web:established:2"})
  ON CREATE SET er.unique_id = randomUUID()
SET er.composite_key = "1.11-web", er.level = "established", er.seq = 2,
    er.element = "Budget", er.requirement = "Allocated funding for accessibility software (e.g., Adobe Acrobat Pro) and dedicated staff time for document testing and remediation support.",
    er.rubric_dimension = "resources", er.lead_in = null
MERGE (si)-[:has_evidence_requirement]->(er);
MATCH (si:SuccessIndicator {composite_key: "1.11-web"})
MERGE (er:EvidenceRequirement {handle: "evidence:1.11-web:established:3"})
  ON CREATE SET er.unique_id = randomUUID()
SET er.composite_key = "1.11-web", er.level = "established", er.seq = 3,
    er.element = "Procedures", er.requirement = "Documented campus-wide process detailing evaluation criteria (structure, headings, alt text, tables, reading order, forms), testing steps by file type, communication protocols, and remediation timelines.",
    er.rubric_dimension = "procedures", er.lead_in = null
MERGE (si)-[:has_evidence_requirement]->(er);
MATCH (si:SuccessIndicator {composite_key: "1.11-web"})
MERGE (er:EvidenceRequirement {handle: "evidence:1.11-web:established:4"})
  ON CREATE SET er.unique_id = randomUUID()
SET er.composite_key = "1.11-web", er.level = "established", er.seq = 4,
    er.element = "Output", er.requirement = "Consistent accessibility evaluation reports for posted electronic documents, with identified issues tracked and remediated prior to or promptly after publication.",
    er.rubric_dimension = "documentation_evidence", er.lead_in = null
MERGE (si)-[:has_evidence_requirement]->(er);

// --- 1.12-pro (6) ---
MATCH (si:SuccessIndicator {composite_key: "1.12-pro"})
MERGE (er:EvidenceRequirement {handle: "evidence:1.12-pro:established:1"})
  ON CREATE SET er.unique_id = randomUUID()
SET er.composite_key = "1.12-pro", er.level = "established", er.seq = 1,
    er.element = "Position", er.requirement = "Procurement (both state-side and auxiliary) and ATI accessibility staff have defined responsibilities for reviewing ICT purchases, regardless of funding source or cost.",
    er.rubric_dimension = "resources", er.lead_in = null
MERGE (si)-[:has_evidence_requirement]->(er);
MATCH (si:SuccessIndicator {composite_key: "1.12-pro"})
MERGE (er:EvidenceRequirement {handle: "evidence:1.12-pro:established:2"})
  ON CREATE SET er.unique_id = randomUUID()
SET er.composite_key = "1.12-pro", er.level = "established", er.seq = 2,
    er.element = "Budget", er.requirement = "Allocations exist for accessibility review staffing, tools, and training for decentralized buyers.",
    er.rubric_dimension = "resources", er.lead_in = null
MERGE (si)-[:has_evidence_requirement]->(er);
MATCH (si:SuccessIndicator {composite_key: "1.12-pro"})
MERGE (er:EvidenceRequirement {handle: "evidence:1.12-pro:established:3"})
  ON CREATE SET er.unique_id = randomUUID()
SET er.composite_key = "1.12-pro", er.level = "established", er.seq = 3,
    er.element = "Procedures", er.requirement = "Documented procedures integrate accessibility checks into all procurement workflows across all university affiliates.",
    er.rubric_dimension = "procedures", er.lead_in = null
MERGE (si)-[:has_evidence_requirement]->(er);
MATCH (si:SuccessIndicator {composite_key: "1.12-pro"})
MERGE (er:EvidenceRequirement {handle: "evidence:1.12-pro:established:4"})
  ON CREATE SET er.unique_id = randomUUID()
SET er.composite_key = "1.12-pro", er.level = "established", er.seq = 4,
    er.element = "Output", er.requirement = "Comprehensive records show that accessibility review occurred for all ICT acquisitions.",
    er.rubric_dimension = "documentation_evidence", er.lead_in = null
MERGE (si)-[:has_evidence_requirement]->(er);
MATCH (si:SuccessIndicator {composite_key: "1.12-pro"})
MERGE (er:EvidenceRequirement {handle: "evidence:1.12-pro:managed:1"})
  ON CREATE SET er.unique_id = randomUUID()
SET er.composite_key = "1.12-pro", er.level = "managed", er.seq = 1,
    er.element = "Metrics", er.requirement = "Monitor acquisitions and determine if reviews are proceduralized for those other entities or free software.",
    er.rubric_dimension = "documentation_evidence", er.lead_in = null
MERGE (si)-[:has_evidence_requirement]->(er);
MATCH (si:SuccessIndicator {composite_key: "1.12-pro"})
MERGE (er:EvidenceRequirement {handle: "evidence:1.12-pro:optimizing:1"})
  ON CREATE SET er.unique_id = randomUUID()
SET er.composite_key = "1.12-pro", er.level = "optimizing", er.seq = 1,
    er.element = "Administrative Review", er.requirement = "Leadership reviews audit results to ensure equitable application of Section 508 review across all procurement pathways.",
    er.rubric_dimension = "procedures", er.lead_in = null
MERGE (si)-[:has_evidence_requirement]->(er);

// --- 1.12-web (4) ---
MATCH (si:SuccessIndicator {composite_key: "1.12-web"})
MERGE (er:EvidenceRequirement {handle: "evidence:1.12-web:established:1"})
  ON CREATE SET er.unique_id = randomUUID()
SET er.composite_key = "1.12-web", er.level = "established", er.seq = 1,
    er.element = "Position", er.requirement = "Designated accessibility staff or trained multimedia reviewers formally assigned responsibility for evaluating video and audio accessibility.",
    er.rubric_dimension = "resources", er.lead_in = null
MERGE (si)-[:has_evidence_requirement]->(er);
MATCH (si:SuccessIndicator {composite_key: "1.12-web"})
MERGE (er:EvidenceRequirement {handle: "evidence:1.12-web:established:2"})
  ON CREATE SET er.unique_id = randomUUID()
SET er.composite_key = "1.12-web", er.level = "established", er.seq = 2,
    er.element = "Budget", er.requirement = "Allocated funding for captioning services, transcription services, audio description support, and staff time for manual quality review.",
    er.rubric_dimension = "resources", er.lead_in = null
MERGE (si)-[:has_evidence_requirement]->(er);
MATCH (si:SuccessIndicator {composite_key: "1.12-web"})
MERGE (er:EvidenceRequirement {handle: "evidence:1.12-web:established:3"})
  ON CREATE SET er.unique_id = randomUUID()
SET er.composite_key = "1.12-web", er.level = "established", er.seq = 3,
    er.element = "Procedures", er.requirement = "Documented campus-wide process defining evaluation criteria (caption accuracy thresholds, transcript standards, audio description decision tree, media player testing), review workflow, and remediation timelines.",
    er.rubric_dimension = "procedures", er.lead_in = null
MERGE (si)-[:has_evidence_requirement]->(er);
MATCH (si:SuccessIndicator {composite_key: "1.12-web"})
MERGE (er:EvidenceRequirement {handle: "evidence:1.12-web:established:4"})
  ON CREATE SET er.unique_id = randomUUID()
SET er.composite_key = "1.12-web", er.level = "established", er.seq = 4,
    er.element = "Output", er.requirement = "Consistent accessibility review reports for multimedia content, with caption corrections, transcript updates, or audio descriptions completed prior to or promptly after publication.",
    er.rubric_dimension = "documentation_evidence", er.lead_in = null
MERGE (si)-[:has_evidence_requirement]->(er);

// --- 1.14-web (4) ---
MATCH (si:SuccessIndicator {composite_key: "1.14-web"})
MERGE (er:EvidenceRequirement {handle: "evidence:1.14-web:established:1"})
  ON CREATE SET er.unique_id = randomUUID()
SET er.composite_key = "1.14-web", er.level = "established", er.seq = 1,
    er.element = "Position", er.requirement = "Responsibility for distributing document accessibility evaluation results is formally assigned to a designated role or team (e.g., ATI team, digital accessibility specialist)",
    er.rubric_dimension = "resources", er.lead_in = null
MERGE (si)-[:has_evidence_requirement]->(er);
MATCH (si:SuccessIndicator {composite_key: "1.14-web"})
MERGE (er:EvidenceRequirement {handle: "evidence:1.14-web:established:2"})
  ON CREATE SET er.unique_id = randomUUID()
SET er.composite_key = "1.14-web", er.level = "established", er.seq = 2,
    er.element = "Budget", er.requirement = "Funding is allocated for tools or systems (e.g., reporting platforms, ticketing systems) that support consistent distribution and tracking of evaluation results",
    er.rubric_dimension = "resources", er.lead_in = null
MERGE (si)-[:has_evidence_requirement]->(er);
MATCH (si:SuccessIndicator {composite_key: "1.14-web"})
MERGE (er:EvidenceRequirement {handle: "evidence:1.14-web:established:3"})
  ON CREATE SET er.unique_id = randomUUID()
SET er.composite_key = "1.14-web", er.level = "established", er.seq = 3,
    er.element = "Procedures", er.requirement = "A documented, standardized process ensures evaluation results are consistently shared with responsible campus units and vendors, including clear timelines and escalation paths",
    er.rubric_dimension = "procedures", er.lead_in = null
MERGE (si)-[:has_evidence_requirement]->(er);
MATCH (si:SuccessIndicator {composite_key: "1.14-web"})
MERGE (er:EvidenceRequirement {handle: "evidence:1.14-web:established:4"})
  ON CREATE SET er.unique_id = randomUUID()
SET er.composite_key = "1.14-web", er.level = "established", er.seq = 4,
    er.element = "Output", er.requirement = "Accessibility evaluation results for electronic documents are routinely distributed in a structured, trackable format, enabling consistent remediation across campus",
    er.rubric_dimension = "documentation_evidence", er.lead_in = null
MERGE (si)-[:has_evidence_requirement]->(er);

// --- 1.15-web (4) ---
MATCH (si:SuccessIndicator {composite_key: "1.15-web"})
MERGE (er:EvidenceRequirement {handle: "evidence:1.15-web:established:1"})
  ON CREATE SET er.unique_id = randomUUID()
SET er.composite_key = "1.15-web", er.level = "established", er.seq = 1,
    er.element = "Position", er.requirement = "Responsibility for distributing document accessibility evaluation results is formally assigned to a designated role or team (e.g., ATI team, digital accessibility specialist)",
    er.rubric_dimension = "resources", er.lead_in = null
MERGE (si)-[:has_evidence_requirement]->(er);
MATCH (si:SuccessIndicator {composite_key: "1.15-web"})
MERGE (er:EvidenceRequirement {handle: "evidence:1.15-web:established:2"})
  ON CREATE SET er.unique_id = randomUUID()
SET er.composite_key = "1.15-web", er.level = "established", er.seq = 2,
    er.element = "Budget", er.requirement = "Funding is allocated for tools or systems (e.g., reporting platforms, ticketing systems) that support consistent distribution and tracking of evaluation results",
    er.rubric_dimension = "resources", er.lead_in = null
MERGE (si)-[:has_evidence_requirement]->(er);
MATCH (si:SuccessIndicator {composite_key: "1.15-web"})
MERGE (er:EvidenceRequirement {handle: "evidence:1.15-web:established:3"})
  ON CREATE SET er.unique_id = randomUUID()
SET er.composite_key = "1.15-web", er.level = "established", er.seq = 3,
    er.element = "Procedures", er.requirement = "A documented, standardized process ensures evaluation results are consistently shared with responsible campus units and vendors, including clear timelines and escalation paths",
    er.rubric_dimension = "procedures", er.lead_in = null
MERGE (si)-[:has_evidence_requirement]->(er);
MATCH (si:SuccessIndicator {composite_key: "1.15-web"})
MERGE (er:EvidenceRequirement {handle: "evidence:1.15-web:established:4"})
  ON CREATE SET er.unique_id = randomUUID()
SET er.composite_key = "1.15-web", er.level = "established", er.seq = 4,
    er.element = "Output", er.requirement = "Accessibility evaluation results for electronic documents are routinely distributed in a structured, trackable format, enabling consistent remediation across campus",
    er.rubric_dimension = "documentation_evidence", er.lead_in = null
MERGE (si)-[:has_evidence_requirement]->(er);

// --- 1.19-web (4) ---
MATCH (si:SuccessIndicator {composite_key: "1.19-web"})
MERGE (er:EvidenceRequirement {handle: "evidence:1.19-web:established:1"})
  ON CREATE SET er.unique_id = randomUUID()
SET er.composite_key = "1.19-web", er.level = "established", er.seq = 1,
    er.element = "Position", er.requirement = "Responsibility is formally assigned (e.g., accessibility office in collaboration with IT procurement and application owners).",
    er.rubric_dimension = "resources", er.lead_in = "At the Established level, the university has gone beyond awareness and put a formalized, consistent process in place:"
MERGE (si)-[:has_evidence_requirement]->(er);
MATCH (si:SuccessIndicator {composite_key: "1.19-web"})
MERGE (er:EvidenceRequirement {handle: "evidence:1.19-web:established:2"})
  ON CREATE SET er.unique_id = randomUUID()
SET er.composite_key = "1.19-web", er.level = "established", er.seq = 2,
    er.element = "Budget", er.requirement = "Allocations exist for staff time to draft and update statements, and possibly for legal/compliance review.",
    er.rubric_dimension = "resources", er.lead_in = "At the Established level, the university has gone beyond awareness and put a formalized, consistent process in place:"
MERGE (si)-[:has_evidence_requirement]->(er);
MATCH (si:SuccessIndicator {composite_key: "1.19-web"})
MERGE (er:EvidenceRequirement {handle: "evidence:1.19-web:established:3"})
  ON CREATE SET er.unique_id = randomUUID()
SET er.composite_key = "1.19-web", er.level = "established", er.seq = 3,
    er.element = "Procedures", er.requirement = "A documented procedure requires creating an application-specific accessibility statement whenever a third-party product with known accessibility barriers is adopted. Statements include vendor information, description of barriers, known workarounds, and contact information for support.",
    er.rubric_dimension = "procedures", er.lead_in = "At the Established level, the university has gone beyond awareness and put a formalized, consistent process in place:"
MERGE (si)-[:has_evidence_requirement]->(er);
MATCH (si:SuccessIndicator {composite_key: "1.19-web"})
MERGE (er:EvidenceRequirement {handle: "evidence:1.19-web:established:4"})
  ON CREATE SET er.unique_id = randomUUID()
SET er.composite_key = "1.19-web", er.level = "established", er.seq = 4,
    er.element = "Output", er.requirement = "A collection of standardized accessibility statements is maintained and accessible to campus members.",
    er.rubric_dimension = "documentation_evidence", er.lead_in = "At the Established level, the university has gone beyond awareness and put a formalized, consistent process in place:"
MERGE (si)-[:has_evidence_requirement]->(er);

// --- 1.2-com (4) ---
MATCH (si:SuccessIndicator {composite_key: "1.2-com"})
MERGE (er:EvidenceRequirement {handle: "evidence:1.2-com:established:1"})
  ON CREATE SET er.unique_id = randomUUID()
SET er.composite_key = "1.2-com", er.level = "established", er.seq = 1,
    er.element = "Position", er.requirement = "Responsibility for incorporating accessibility into onboarding and orientation is formally assigned to appropriate units (e.g., HR, faculty development, student affairs, ATI program)",
    er.rubric_dimension = "resources", er.lead_in = null
MERGE (si)-[:has_evidence_requirement]->(er);
MATCH (si:SuccessIndicator {composite_key: "1.2-com"})
MERGE (er:EvidenceRequirement {handle: "evidence:1.2-com:established:2"})
  ON CREATE SET er.unique_id = randomUUID()
SET er.composite_key = "1.2-com", er.level = "established", er.seq = 2,
    er.element = "Budget", er.requirement = "Resources are allocated to support development and delivery of onboarding materials, including training platforms and content creation",
    er.rubric_dimension = "resources", er.lead_in = null
MERGE (si)-[:has_evidence_requirement]->(er);
MATCH (si:SuccessIndicator {composite_key: "1.2-com"})
MERGE (er:EvidenceRequirement {handle: "evidence:1.2-com:established:3"})
  ON CREATE SET er.unique_id = randomUUID()
SET er.composite_key = "1.2-com", er.level = "established", er.seq = 3,
    er.element = "Procedures", er.requirement = "A documented process ensures accessibility awareness is consistently integrated into onboarding and orientation programs for all relevant audiences",
    er.rubric_dimension = "procedures", er.lead_in = null
MERGE (si)-[:has_evidence_requirement]->(er);
MATCH (si:SuccessIndicator {composite_key: "1.2-com"})
MERGE (er:EvidenceRequirement {handle: "evidence:1.2-com:established:4"})
  ON CREATE SET er.unique_id = randomUUID()
SET er.composite_key = "1.2-com", er.level = "established", er.seq = 4,
    er.element = "Output", er.requirement = "Evidence that new faculty, staff, and students consistently receive accessibility awareness information as part of onboarding, establishing clear expectations and available resources from the start",
    er.rubric_dimension = "documentation_evidence", er.lead_in = null
MERGE (si)-[:has_evidence_requirement]->(er);

// --- 1.2-gov (4) ---
MATCH (si:SuccessIndicator {composite_key: "1.2-gov"})
MERGE (er:EvidenceRequirement {handle: "evidence:1.2-gov:established:1"})
  ON CREATE SET er.unique_id = randomUUID()
SET er.composite_key = "1.2-gov", er.level = "established", er.seq = 1,
    er.element = "Position", er.requirement = "A specific individual or team is formally assigned responsibility for web accessibility evaluation and ongoing monitoring, including digital content",
    er.rubric_dimension = "resources", er.lead_in = null
MERGE (si)-[:has_evidence_requirement]->(er);
MATCH (si:SuccessIndicator {composite_key: "1.2-gov"})
MERGE (er:EvidenceRequirement {handle: "evidence:1.2-gov:established:2"})
  ON CREATE SET er.unique_id = randomUUID()
SET er.composite_key = "1.2-gov", er.level = "established", er.seq = 2,
    er.element = "Budget", er.requirement = "Resources are allocated to support the responsible body, including staff time for evaluation and monitoring",
    er.rubric_dimension = "resources", er.lead_in = null
MERGE (si)-[:has_evidence_requirement]->(er);
MATCH (si:SuccessIndicator {composite_key: "1.2-gov"})
MERGE (er:EvidenceRequirement {handle: "evidence:1.2-gov:established:3"})
  ON CREATE SET er.unique_id = randomUUID()
SET er.composite_key = "1.2-gov", er.level = "established", er.seq = 3,
    er.element = "Procedures", er.requirement = "A documented process defines how the responsible body conducts, coordinates, and maintains ongoing evaluation and monitoring activities across campus systems and content",
    er.rubric_dimension = "procedures", er.lead_in = null
MERGE (si)-[:has_evidence_requirement]->(er);
MATCH (si:SuccessIndicator {composite_key: "1.2-gov"})
MERGE (er:EvidenceRequirement {handle: "evidence:1.2-gov:established:4"})
  ON CREATE SET er.unique_id = randomUUID()
SET er.composite_key = "1.2-gov", er.level = "established", er.seq = 4,
    er.element = "Output", er.requirement = "Records or reports demonstrating that web accessibility evaluation and monitoring activities are consistently executed and coordinated by the assigned body, with clear institutional accountability",
    er.rubric_dimension = "documentation_evidence", er.lead_in = null
MERGE (si)-[:has_evidence_requirement]->(er);

// --- 1.2-ins (11) ---
MATCH (si:SuccessIndicator {composite_key: "1.2-ins"})
MERGE (er:EvidenceRequirement {handle: "evidence:1.2-ins:established:1"})
  ON CREATE SET er.unique_id = randomUUID()
SET er.composite_key = "1.2-ins", er.level = "established", er.seq = 1,
    er.element = null, er.requirement = "Position Description",
    er.rubric_dimension = null, er.lead_in = "At the Established level, the campus has implemented and operationalized a documented process to support the timely adoption of instructional materials."
MERGE (si)-[:has_evidence_requirement]->(er);
MATCH (si:SuccessIndicator {composite_key: "1.2-ins"})
MERGE (er:EvidenceRequirement {handle: "evidence:1.2-ins:established:2"})
  ON CREATE SET er.unique_id = randomUUID()
SET er.composite_key = "1.2-ins", er.level = "established", er.seq = 2,
    er.element = null, er.requirement = "Budget",
    er.rubric_dimension = null, er.lead_in = "At the Established level, the campus has implemented and operationalized a documented process to support the timely adoption of instructional materials."
MERGE (si)-[:has_evidence_requirement]->(er);
MATCH (si:SuccessIndicator {composite_key: "1.2-ins"})
MERGE (er:EvidenceRequirement {handle: "evidence:1.2-ins:established:3"})
  ON CREATE SET er.unique_id = randomUUID()
SET er.composite_key = "1.2-ins", er.level = "established", er.seq = 3,
    er.element = "Procedures", er.requirement = "The campus maintains and enforces a written, campuswide process that defines how and when instructional materials are adopted, and accounts for courses where instructors are added late by auto-adopting textbooks.",
    er.rubric_dimension = "procedures", er.lead_in = "At the Established level, the campus has implemented and operationalized a documented process to support the timely adoption of instructional materials."
MERGE (si)-[:has_evidence_requirement]->(er);
MATCH (si:SuccessIndicator {composite_key: "1.2-ins"})
MERGE (er:EvidenceRequirement {handle: "evidence:1.2-ins:established:4"})
  ON CREATE SET er.unique_id = randomUUID()
SET er.composite_key = "1.2-ins", er.level = "established", er.seq = 4,
    er.element = null, er.requirement = "Output",
    er.rubric_dimension = null, er.lead_in = "At the Established level, the campus has implemented and operationalized a documented process to support the timely adoption of instructional materials."
MERGE (si)-[:has_evidence_requirement]->(er);
MATCH (si:SuccessIndicator {composite_key: "1.2-ins"})
MERGE (er:EvidenceRequirement {handle: "evidence:1.2-ins:established:5"})
  ON CREATE SET er.unique_id = randomUUID()
SET er.composite_key = "1.2-ins", er.level = "established", er.seq = 5,
    er.element = null, er.requirement = "Roles and responsibilities are clearly assigned across academic departments, the library, instructional design, accessibility, ATI teams, bookstores, etc.",
    er.rubric_dimension = null, er.lead_in = "At the Established level, the campus has implemented and operationalized a documented process to support the timely adoption of instructional materials."
MERGE (si)-[:has_evidence_requirement]->(er);
MATCH (si:SuccessIndicator {composite_key: "1.2-ins"})
MERGE (er:EvidenceRequirement {handle: "evidence:1.2-ins:established:6"})
  ON CREATE SET er.unique_id = randomUUID()
SET er.composite_key = "1.2-ins", er.level = "established", er.seq = 6,
    er.element = null, er.requirement = "Faculty are informed of adoption timelines that allow sufficient time for accessibility review and remediation prior to the start of instruction",
    er.rubric_dimension = null, er.lead_in = "At the Established level, the campus has implemented and operationalized a documented process to support the timely adoption of instructional materials."
MERGE (si)-[:has_evidence_requirement]->(er);
MATCH (si:SuccessIndicator {composite_key: "1.2-ins"})
MERGE (er:EvidenceRequirement {handle: "evidence:1.2-ins:established:7"})
  ON CREATE SET er.unique_id = randomUUID()
SET er.composite_key = "1.2-ins", er.level = "established", er.seq = 7,
    er.element = null, er.requirement = "Staff time is explicitly allocated to manage adoption coordination and accessibility review activities",
    er.rubric_dimension = null, er.lead_in = "At the Established level, the campus has implemented and operationalized a documented process to support the timely adoption of instructional materials."
MERGE (si)-[:has_evidence_requirement]->(er);
MATCH (si:SuccessIndicator {composite_key: "1.2-ins"})
MERGE (er:EvidenceRequirement {handle: "evidence:1.2-ins:established:8"})
  ON CREATE SET er.unique_id = randomUUID()
SET er.composite_key = "1.2-ins", er.level = "established", er.seq = 8,
    er.element = null, er.requirement = "Training and guidance are regularly provided to faculty on accessible instructional materials and adoption expectations",
    er.rubric_dimension = null, er.lead_in = "At the Established level, the campus has implemented and operationalized a documented process to support the timely adoption of instructional materials."
MERGE (si)-[:has_evidence_requirement]->(er);
MATCH (si:SuccessIndicator {composite_key: "1.2-ins"})
MERGE (er:EvidenceRequirement {handle: "evidence:1.2-ins:established:9"})
  ON CREATE SET er.unique_id = randomUUID()
SET er.composite_key = "1.2-ins", er.level = "established", er.seq = 9,
    er.element = null, er.requirement = "Technology or tracking mechanisms are used to monitor adoption status and identify risks early",
    er.rubric_dimension = null, er.lead_in = "At the Established level, the campus has implemented and operationalized a documented process to support the timely adoption of instructional materials."
MERGE (si)-[:has_evidence_requirement]->(er);
MATCH (si:SuccessIndicator {composite_key: "1.2-ins"})
MERGE (er:EvidenceRequirement {handle: "evidence:1.2-ins:established:10"})
  ON CREATE SET er.unique_id = randomUUID()
SET er.composite_key = "1.2-ins", er.level = "established", er.seq = 10,
    er.element = null, er.requirement = "The process is used consistently across terms and is reviewed periodically for effectiveness and improvement",
    er.rubric_dimension = null, er.lead_in = "At the Established level, the campus has implemented and operationalized a documented process to support the timely adoption of instructional materials."
MERGE (si)-[:has_evidence_requirement]->(er);
MATCH (si:SuccessIndicator {composite_key: "1.2-ins"})
MERGE (er:EvidenceRequirement {handle: "evidence:1.2-ins:established:11"})
  ON CREATE SET er.unique_id = randomUUID()
SET er.composite_key = "1.2-ins", er.level = "established", er.seq = 11,
    er.element = null, er.requirement = "Communication from Provost, Deans, or Chairs is consistent and aligns with term planning and other dependencies.",
    er.rubric_dimension = null, er.lead_in = "At the Established level, the campus has implemented and operationalized a documented process to support the timely adoption of instructional materials."
MERGE (si)-[:has_evidence_requirement]->(er);

// --- 1.2-web (4) ---
MATCH (si:SuccessIndicator {composite_key: "1.2-web"})
MERGE (er:EvidenceRequirement {handle: "evidence:1.2-web:established:1"})
  ON CREATE SET er.unique_id = randomUUID()
SET er.composite_key = "1.2-web", er.level = "established", er.seq = 1,
    er.element = "Position", er.requirement = "A designated office (e.g., central IT or Accessibility Office) is formally responsible for maintaining the inventory.",
    er.rubric_dimension = "resources", er.lead_in = null
MERGE (si)-[:has_evidence_requirement]->(er);
MATCH (si:SuccessIndicator {composite_key: "1.2-web"})
MERGE (er:EvidenceRequirement {handle: "evidence:1.2-web:established:2"})
  ON CREATE SET er.unique_id = randomUUID()
SET er.composite_key = "1.2-web", er.level = "established", er.seq = 2,
    er.element = "Budget", er.requirement = "Resources are allocated for inventory maintenance (e.g., staffing, software).",
    er.rubric_dimension = "resources", er.lead_in = null
MERGE (si)-[:has_evidence_requirement]->(er);
MATCH (si:SuccessIndicator {composite_key: "1.2-web"})
MERGE (er:EvidenceRequirement {handle: "evidence:1.2-web:established:3"})
  ON CREATE SET er.unique_id = randomUUID()
SET er.composite_key = "1.2-web", er.level = "established", er.seq = 3,
    er.element = "Procedures", er.requirement = "There is a documented procedure requiring all departments and vendor partners to register new sites and applications before launching.",
    er.rubric_dimension = "procedures", er.lead_in = null
MERGE (si)-[:has_evidence_requirement]->(er);
MATCH (si:SuccessIndicator {composite_key: "1.2-web"})
MERGE (er:EvidenceRequirement {handle: "evidence:1.2-web:established:4"})
  ON CREATE SET er.unique_id = randomUUID()
SET er.composite_key = "1.2-web", er.level = "established", er.seq = 4,
    er.element = "Output", er.requirement = "A centralized, up-to-date inventory exists in a shared system accessible to stakeholders.",
    er.rubric_dimension = "documentation_evidence", er.lead_in = null
MERGE (si)-[:has_evidence_requirement]->(er);

// --- 1.20-web (4) ---
MATCH (si:SuccessIndicator {composite_key: "1.20-web"})
MERGE (er:EvidenceRequirement {handle: "evidence:1.20-web:established:1"})
  ON CREATE SET er.unique_id = randomUUID()
SET er.composite_key = "1.20-web", er.level = "established", er.seq = 1,
    er.element = "Position", er.requirement = "A central communications or accessibility office is tasked with maintaining the account inventory. Trained staff are tasked with manual reviews of social media accounts.",
    er.rubric_dimension = "resources", er.lead_in = "At the Established level, the university has moved beyond ad hoc awareness and has a documented, consistent practice:"
MERGE (si)-[:has_evidence_requirement]->(er);
MATCH (si:SuccessIndicator {composite_key: "1.20-web"})
MERGE (er:EvidenceRequirement {handle: "evidence:1.20-web:established:2"})
  ON CREATE SET er.unique_id = randomUUID()
SET er.composite_key = "1.20-web", er.level = "established", er.seq = 2,
    er.element = "Budget", er.requirement = "Resources exist for training, accessibility tools (e.g., captioning services, image description support), and audit support.",
    er.rubric_dimension = "resources", er.lead_in = "At the Established level, the university has moved beyond ad hoc awareness and has a documented, consistent practice:"
MERGE (si)-[:has_evidence_requirement]->(er);
MATCH (si:SuccessIndicator {composite_key: "1.20-web"})
MERGE (er:EvidenceRequirement {handle: "evidence:1.20-web:established:3"})
  ON CREATE SET er.unique_id = randomUUID()
SET er.composite_key = "1.20-web", er.level = "established", er.seq = 3,
    er.element = "Procedures", er.requirement = "Documented procedures outline how accounts are identified, registered, and periodically assessed for content accessibility. Account owners are expected to comply with accessibility posting guidelines.",
    er.rubric_dimension = "procedures", er.lead_in = "At the Established level, the university has moved beyond ad hoc awareness and has a documented, consistent practice:"
MERGE (si)-[:has_evidence_requirement]->(er);
MATCH (si:SuccessIndicator {composite_key: "1.20-web"})
MERGE (er:EvidenceRequirement {handle: "evidence:1.20-web:established:4"})
  ON CREATE SET er.unique_id = randomUUID()
SET er.composite_key = "1.20-web", er.level = "established", er.seq = 4,
    er.element = "Output", er.requirement = "A current, centralized list of social media accounts exists, and reports from periodic content accessibility reviews are logged.",
    er.rubric_dimension = "documentation_evidence", er.lead_in = "At the Established level, the university has moved beyond ad hoc awareness and has a documented, consistent practice:"
MERGE (si)-[:has_evidence_requirement]->(er);

// --- 1.21-web (4) ---
MATCH (si:SuccessIndicator {composite_key: "1.21-web"})
MERGE (er:EvidenceRequirement {handle: "evidence:1.21-web:established:1"})
  ON CREATE SET er.unique_id = randomUUID()
SET er.composite_key = "1.21-web", er.level = "established", er.seq = 1,
    er.element = "Position", er.requirement = "Responsibility for accessibility statement review is assigned (e.g., accessibility office or central IT communications team).",
    er.rubric_dimension = "resources", er.lead_in = "At the Established level, the institution has moved beyond one-off efforts and maintains a standardized, enforced practice:"
MERGE (si)-[:has_evidence_requirement]->(er);
MATCH (si:SuccessIndicator {composite_key: "1.21-web"})
MERGE (er:EvidenceRequirement {handle: "evidence:1.21-web:established:2"})
  ON CREATE SET er.unique_id = randomUUID()
SET er.composite_key = "1.21-web", er.level = "established", er.seq = 2,
    er.element = "Budget", er.requirement = "Resources allocated for staff time, compliance reviews, and technical support for statement updates.",
    er.rubric_dimension = "resources", er.lead_in = "At the Established level, the institution has moved beyond one-off efforts and maintains a standardized, enforced practice:"
MERGE (si)-[:has_evidence_requirement]->(er);
MATCH (si:SuccessIndicator {composite_key: "1.21-web"})
MERGE (er:EvidenceRequirement {handle: "evidence:1.21-web:established:3"})
  ON CREATE SET er.unique_id = randomUUID()
SET er.composite_key = "1.21-web", er.level = "established", er.seq = 3,
    er.element = "Procedures", er.requirement = "Documented procedures define where statements must appear, who maintains them, and how they are reviewed (e.g., annually or bi-annually).",
    er.rubric_dimension = "procedures", er.lead_in = "At the Established level, the institution has moved beyond one-off efforts and maintains a standardized, enforced practice:"
MERGE (si)-[:has_evidence_requirement]->(er);
MATCH (si:SuccessIndicator {composite_key: "1.21-web"})
MERGE (er:EvidenceRequirement {handle: "evidence:1.21-web:established:4"})
  ON CREATE SET er.unique_id = randomUUID()
SET er.composite_key = "1.21-web", er.level = "established", er.seq = 4,
    er.element = "Output", er.requirement = "All campus-affiliated websites, apps, and platforms have an accessibility statement posted that aligns with CSU Chancellor’s Office guidance.",
    er.rubric_dimension = "documentation_evidence", er.lead_in = "At the Established level, the institution has moved beyond one-off efforts and maintains a standardized, enforced practice:"
MERGE (si)-[:has_evidence_requirement]->(er);

// --- 1.3-com (4) ---
MATCH (si:SuccessIndicator {composite_key: "1.3-com"})
MERGE (er:EvidenceRequirement {handle: "evidence:1.3-com:established:1"})
  ON CREATE SET er.unique_id = randomUUID()
SET er.composite_key = "1.3-com", er.level = "established", er.seq = 1,
    er.element = "Position", er.requirement = "A designated individual or team is formally responsible for communicating accessibility resources and support to digital content creators",
    er.rubric_dimension = "resources", er.lead_in = null
MERGE (si)-[:has_evidence_requirement]->(er);
MATCH (si:SuccessIndicator {composite_key: "1.3-com"})
MERGE (er:EvidenceRequirement {handle: "evidence:1.3-com:established:2"})
  ON CREATE SET er.unique_id = randomUUID()
SET er.composite_key = "1.3-com", er.level = "established", er.seq = 2,
    er.element = "Budget", er.requirement = "Resources are allocated to support communication efforts, including content development, platforms, and outreach activities",
    er.rubric_dimension = "resources", er.lead_in = null
MERGE (si)-[:has_evidence_requirement]->(er);
MATCH (si:SuccessIndicator {composite_key: "1.3-com"})
MERGE (er:EvidenceRequirement {handle: "evidence:1.3-com:established:3"})
  ON CREATE SET er.unique_id = randomUUID()
SET er.composite_key = "1.3-com", er.level = "established", er.seq = 3,
    er.element = "Procedures", er.requirement = "A documented communication process ensures that information about accessibility training, help, and resources is consistently distributed to all relevant content creators",
    er.rubric_dimension = "procedures", er.lead_in = null
MERGE (si)-[:has_evidence_requirement]->(er);
MATCH (si:SuccessIndicator {composite_key: "1.3-com"})
MERGE (er:EvidenceRequirement {handle: "evidence:1.3-com:established:4"})
  ON CREATE SET er.unique_id = randomUUID()
SET er.composite_key = "1.3-com", er.level = "established", er.seq = 4,
    er.element = "Output", er.requirement = "Evidence that digital content creators across campus consistently receive clear, actionable information on where to access accessibility training, support, and resources",
    er.rubric_dimension = "documentation_evidence", er.lead_in = null
MERGE (si)-[:has_evidence_requirement]->(er);

// --- 1.3-gov (4) ---
MATCH (si:SuccessIndicator {composite_key: "1.3-gov"})
MERGE (er:EvidenceRequirement {handle: "evidence:1.3-gov:established:1"})
  ON CREATE SET er.unique_id = randomUUID()
SET er.composite_key = "1.3-gov", er.level = "established", er.seq = 1,
    er.element = "Position", er.requirement = "A designated individual or team is formally assigned responsibility for ensuring accessibility in web/mobile development, including updates and maintenance",
    er.rubric_dimension = "resources", er.lead_in = null
MERGE (si)-[:has_evidence_requirement]->(er);
MATCH (si:SuccessIndicator {composite_key: "1.3-gov"})
MERGE (er:EvidenceRequirement {handle: "evidence:1.3-gov:established:2"})
  ON CREATE SET er.unique_id = randomUUID()
SET er.composite_key = "1.3-gov", er.level = "established", er.seq = 2,
    er.element = "Budget", er.requirement = "Resources are allocated to support accessible development practices, including staff time, tools, and training",
    er.rubric_dimension = "resources", er.lead_in = null
MERGE (si)-[:has_evidence_requirement]->(er);
MATCH (si:SuccessIndicator {composite_key: "1.3-gov"})
MERGE (er:EvidenceRequirement {handle: "evidence:1.3-gov:established:3"})
  ON CREATE SET er.unique_id = randomUUID()
SET er.composite_key = "1.3-gov", er.level = "established", er.seq = 3,
    er.element = "Procedures", er.requirement = "A documented development lifecycle process ensures accessibility is consistently integrated into new builds, updates, and ongoing maintenance",
    er.rubric_dimension = "procedures", er.lead_in = null
MERGE (si)-[:has_evidence_requirement]->(er);
MATCH (si:SuccessIndicator {composite_key: "1.3-gov"})
MERGE (er:EvidenceRequirement {handle: "evidence:1.3-gov:established:4"})
  ON CREATE SET er.unique_id = randomUUID()
SET er.composite_key = "1.3-gov", er.level = "established", er.seq = 4,
    er.element = "Output", er.requirement = "Records or reports demonstrating that web and mobile applications are developed and maintained under a coordinated, accountable process led by the assigned body that consistently incorporates accessibility requirements",
    er.rubric_dimension = "documentation_evidence", er.lead_in = null
MERGE (si)-[:has_evidence_requirement]->(er);

// --- 1.3-pro (6) ---
MATCH (si:SuccessIndicator {composite_key: "1.3-pro"})
MERGE (er:EvidenceRequirement {handle: "evidence:1.3-pro:established:1"})
  ON CREATE SET er.unique_id = randomUUID()
SET er.composite_key = "1.3-pro", er.level = "established", er.seq = 1,
    er.element = "Position", er.requirement = "Responsibility for accessibility risk assessment is assigned to designated roles (e.g., ATI Procurement Lead, Buyer, or Accessibility Analyst) and reflected in job descriptions.",
    er.rubric_dimension = "resources", er.lead_in = null
MERGE (si)-[:has_evidence_requirement]->(er);
MATCH (si:SuccessIndicator {composite_key: "1.3-pro"})
MERGE (er:EvidenceRequirement {handle: "evidence:1.3-pro:established:2"})
  ON CREATE SET er.unique_id = randomUUID()
SET er.composite_key = "1.3-pro", er.level = "established", er.seq = 2,
    er.element = "Budget", er.requirement = "Resources are allocated for staff training, accessibility consultation, and maintenance of tools or tracking systems.",
    er.rubric_dimension = "resources", er.lead_in = null
MERGE (si)-[:has_evidence_requirement]->(er);
MATCH (si:SuccessIndicator {composite_key: "1.3-pro"})
MERGE (er:EvidenceRequirement {handle: "evidence:1.3-pro:established:3"})
  ON CREATE SET er.unique_id = randomUUID()
SET er.composite_key = "1.3-pro", er.level = "established", er.seq = 3,
    er.element = "Procedures", er.requirement = "A documented procedure defines how risk assessment is performed and at what point(s) in the procurement cycle it occurs. The process is communicated to all buyers and requesters.",
    er.rubric_dimension = "procedures", er.lead_in = null
MERGE (si)-[:has_evidence_requirement]->(er);
MATCH (si:SuccessIndicator {composite_key: "1.3-pro"})
MERGE (er:EvidenceRequirement {handle: "evidence:1.3-pro:established:4"})
  ON CREATE SET er.unique_id = randomUUID()
SET er.composite_key = "1.3-pro", er.level = "established", er.seq = 4,
    er.element = "Output", er.requirement = "Completed risk assessments are attached to purchase documentation and used to prioritize Section 508 evaluations and TAAP development.",
    er.rubric_dimension = "documentation_evidence", er.lead_in = null
MERGE (si)-[:has_evidence_requirement]->(er);
MATCH (si:SuccessIndicator {composite_key: "1.3-pro"})
MERGE (er:EvidenceRequirement {handle: "evidence:1.3-pro:managed:1"})
  ON CREATE SET er.unique_id = randomUUID()
SET er.composite_key = "1.3-pro", er.level = "managed", er.seq = 1,
    er.element = "Metrics", er.requirement = "Track percentage of ICT purchases reviewed for accessibility risk and percentage of high-risk items escalated for formal review or mitigation.",
    er.rubric_dimension = "documentation_evidence", er.lead_in = null
MERGE (si)-[:has_evidence_requirement]->(er);
MATCH (si:SuccessIndicator {composite_key: "1.3-pro"})
MERGE (er:EvidenceRequirement {handle: "evidence:1.3-pro:optimizing:1"})
  ON CREATE SET er.unique_id = randomUUID()
SET er.composite_key = "1.3-pro", er.level = "optimizing", er.seq = 1,
    er.element = "Administrative Review", er.requirement = "Procurement and ATI leadership periodically review risk assessment data to identify trends, training needs, and process improvements.",
    er.rubric_dimension = "procedures", er.lead_in = null
MERGE (si)-[:has_evidence_requirement]->(er);

// --- 1.4-com (4) ---
MATCH (si:SuccessIndicator {composite_key: "1.4-com"})
MERGE (er:EvidenceRequirement {handle: "evidence:1.4-com:established:1"})
  ON CREATE SET er.unique_id = randomUUID()
SET er.composite_key = "1.4-com", er.level = "established", er.seq = 1,
    er.element = "Position", er.requirement = "A designated individual or team is formally responsible for providing accessibility support and guidance for ICT procurement",
    er.rubric_dimension = "resources", er.lead_in = null
MERGE (si)-[:has_evidence_requirement]->(er);
MATCH (si:SuccessIndicator {composite_key: "1.4-com"})
MERGE (er:EvidenceRequirement {handle: "evidence:1.4-com:established:2"})
  ON CREATE SET er.unique_id = randomUUID()
SET er.composite_key = "1.4-com", er.level = "established", er.seq = 2,
    er.element = "Budget", er.requirement = "Resources are allocated to support communication efforts and staff providing procurement-related accessibility assistance",
    er.rubric_dimension = "resources", er.lead_in = null
MERGE (si)-[:has_evidence_requirement]->(er);
MATCH (si:SuccessIndicator {composite_key: "1.4-com"})
MERGE (er:EvidenceRequirement {handle: "evidence:1.4-com:established:3"})
  ON CREATE SET er.unique_id = randomUUID()
SET er.composite_key = "1.4-com", er.level = "established", er.seq = 3,
    er.element = "Procedures", er.requirement = "A documented process ensures procurement stakeholders and vendors are consistently directed to appropriate accessibility contacts, resources, and support channels",
    er.rubric_dimension = "procedures", er.lead_in = null
MERGE (si)-[:has_evidence_requirement]->(er);
MATCH (si:SuccessIndicator {composite_key: "1.4-com"})
MERGE (er:EvidenceRequirement {handle: "evidence:1.4-com:established:4"})
  ON CREATE SET er.unique_id = randomUUID()
SET er.composite_key = "1.4-com", er.level = "established", er.seq = 4,
    er.element = "Output", er.requirement = "Campus members and vendors involved in ICT procurement consistently know how to access accessibility support, resulting in more efficient and compliant procurement practices Records or reports showing that vendors and campus members are contacting the designated department or are directed appropriately",
    er.rubric_dimension = "documentation_evidence", er.lead_in = null
MERGE (si)-[:has_evidence_requirement]->(er);

// --- 1.4-gov (4) ---
MATCH (si:SuccessIndicator {composite_key: "1.4-gov"})
MERGE (er:EvidenceRequirement {handle: "evidence:1.4-gov:established:1"})
  ON CREATE SET er.unique_id = randomUUID()
SET er.composite_key = "1.4-gov", er.level = "established", er.seq = 1,
    er.element = "Position", er.requirement = "A designated individual or team is formally assigned responsibility for overseeing accessible ICT procurement processes",
    er.rubric_dimension = "resources", er.lead_in = null
MERGE (si)-[:has_evidence_requirement]->(er);
MATCH (si:SuccessIndicator {composite_key: "1.4-gov"})
MERGE (er:EvidenceRequirement {handle: "evidence:1.4-gov:established:2"})
  ON CREATE SET er.unique_id = randomUUID()
SET er.composite_key = "1.4-gov", er.level = "established", er.seq = 2,
    er.element = "Budget", er.requirement = "Resources are allocated to support accessibility review activities within procurement, including staff time and evaluation tools",
    er.rubric_dimension = "resources", er.lead_in = null
MERGE (si)-[:has_evidence_requirement]->(er);
MATCH (si:SuccessIndicator {composite_key: "1.4-gov"})
MERGE (er:EvidenceRequirement {handle: "evidence:1.4-gov:established:3"})
  ON CREATE SET er.unique_id = randomUUID()
SET er.composite_key = "1.4-gov", er.level = "established", er.seq = 3,
    er.element = "Procedures", er.requirement = "A documented procurement process consistently incorporates accessibility evaluation, roles, and decision-making criteria across acquisitions",
    er.rubric_dimension = "procedures", er.lead_in = null
MERGE (si)-[:has_evidence_requirement]->(er);
MATCH (si:SuccessIndicator {composite_key: "1.4-gov"})
MERGE (er:EvidenceRequirement {handle: "evidence:1.4-gov:established:4"})
  ON CREATE SET er.unique_id = randomUUID()
SET er.composite_key = "1.4-gov", er.level = "established", er.seq = 4,
    er.element = "Output", er.requirement = "Records or reports showing that ICT procurements are consistently reviewed for accessibility under a coordinated, accountable process led by the assigned body",
    er.rubric_dimension = "documentation_evidence", er.lead_in = null
MERGE (si)-[:has_evidence_requirement]->(er);

// --- 1.4-pro (6) ---
MATCH (si:SuccessIndicator {composite_key: "1.4-pro"})
MERGE (er:EvidenceRequirement {handle: "evidence:1.4-pro:established:1"})
  ON CREATE SET er.unique_id = randomUUID()
SET er.composite_key = "1.4-pro", er.level = "established", er.seq = 1,
    er.element = "Position", er.requirement = "Responsibility is formally assigned to a designated accessibility reviewer or procurement compliance officer.",
    er.rubric_dimension = "resources", er.lead_in = null
MERGE (si)-[:has_evidence_requirement]->(er);
MATCH (si:SuccessIndicator {composite_key: "1.4-pro"})
MERGE (er:EvidenceRequirement {handle: "evidence:1.4-pro:established:2"})
  ON CREATE SET er.unique_id = randomUUID()
SET er.composite_key = "1.4-pro", er.level = "established", er.seq = 2,
    er.element = "Budget", er.requirement = "Funding allocated for accessibility evaluation resources, tools, or third-party testers.",
    er.rubric_dimension = "resources", er.lead_in = null
MERGE (si)-[:has_evidence_requirement]->(er);
MATCH (si:SuccessIndicator {composite_key: "1.4-pro"})
MERGE (er:EvidenceRequirement {handle: "evidence:1.4-pro:established:3"})
  ON CREATE SET er.unique_id = randomUUID()
SET er.composite_key = "1.4-pro", er.level = "established", er.seq = 3,
    er.element = "Procedures", er.requirement = "Documented procedure defines clear criteria for assigning evaluation levels and/or tasks based on system criticality, audience size, and accessibility risk.",
    er.rubric_dimension = "procedures", er.lead_in = null
MERGE (si)-[:has_evidence_requirement]->(er);
MATCH (si:SuccessIndicator {composite_key: "1.4-pro"})
MERGE (er:EvidenceRequirement {handle: "evidence:1.4-pro:established:4"})
  ON CREATE SET er.unique_id = randomUUID()
SET er.composite_key = "1.4-pro", er.level = "established", er.seq = 4,
    er.element = "Output", er.requirement = "A record of evaluation determinations maintained with procurement documentation.",
    er.rubric_dimension = "documentation_evidence", er.lead_in = null
MERGE (si)-[:has_evidence_requirement]->(er);
MATCH (si:SuccessIndicator {composite_key: "1.4-pro"})
MERGE (er:EvidenceRequirement {handle: "evidence:1.4-pro:managed:1"})
  ON CREATE SET er.unique_id = randomUUID()
SET er.composite_key = "1.4-pro", er.level = "managed", er.seq = 1,
    er.element = "Metrics", er.requirement = "Track the number and types of evaluations performed, along with the timeframes for completion.",
    er.rubric_dimension = "documentation_evidence", er.lead_in = null
MERGE (si)-[:has_evidence_requirement]->(er);
MATCH (si:SuccessIndicator {composite_key: "1.4-pro"})
MERGE (er:EvidenceRequirement {handle: "evidence:1.4-pro:optimizing:1"})
  ON CREATE SET er.unique_id = randomUUID()
SET er.composite_key = "1.4-pro", er.level = "optimizing", er.seq = 1,
    er.element = "Administrative Review", er.requirement = "Leadership reviews evaluation complexity data to improve future planning and workload distribution.",
    er.rubric_dimension = "procedures", er.lead_in = null
MERGE (si)-[:has_evidence_requirement]->(er);

// --- 1.4-web (4) ---
MATCH (si:SuccessIndicator {composite_key: "1.4-web"})
MERGE (er:EvidenceRequirement {handle: "evidence:1.4-web:established:1"})
  ON CREATE SET er.unique_id = randomUUID()
SET er.composite_key = "1.4-web", er.level = "established", er.seq = 1,
    er.element = "Position", er.requirement = "A designated office or position is formally responsible for scheduling and coordinating evaluations.",
    er.rubric_dimension = "resources", er.lead_in = "At the Established level, the university has moved beyond ad hoc checks and conducts evaluations consistently and formally:"
MERGE (si)-[:has_evidence_requirement]->(er);
MATCH (si:SuccessIndicator {composite_key: "1.4-web"})
MERGE (er:EvidenceRequirement {handle: "evidence:1.4-web:established:2"})
  ON CREATE SET er.unique_id = randomUUID()
SET er.composite_key = "1.4-web", er.level = "established", er.seq = 2,
    er.element = "Budget", er.requirement = "Funding is allocated for accessibility tools (e.g., automated scanning platforms) and manual audits.",
    er.rubric_dimension = "resources", er.lead_in = "At the Established level, the university has moved beyond ad hoc checks and conducts evaluations consistently and formally:"
MERGE (si)-[:has_evidence_requirement]->(er);
MATCH (si:SuccessIndicator {composite_key: "1.4-web"})
MERGE (er:EvidenceRequirement {handle: "evidence:1.4-web:established:3"})
  ON CREATE SET er.unique_id = randomUUID()
SET er.composite_key = "1.4-web", er.level = "established", er.seq = 3,
    er.element = "Procedures", er.requirement = "Documented procedures define who conducts evaluations, how often they occur (e.g., annually, biannually), and what methods are used (automated scans, manual reviews, user testing) and how content owners are contacted about the results.",
    er.rubric_dimension = "procedures", er.lead_in = "At the Established level, the university has moved beyond ad hoc checks and conducts evaluations consistently and formally:"
MERGE (si)-[:has_evidence_requirement]->(er);
MATCH (si:SuccessIndicator {composite_key: "1.4-web"})
MERGE (er:EvidenceRequirement {handle: "evidence:1.4-web:established:4"})
  ON CREATE SET er.unique_id = randomUUID()
SET er.composite_key = "1.4-web", er.level = "established", er.seq = 4,
    er.element = "Output", er.requirement = "Evaluation reports are maintained, accessible to stakeholders, with clear findings and remediation recommendations.",
    er.rubric_dimension = "documentation_evidence", er.lead_in = "At the Established level, the university has moved beyond ad hoc checks and conducts evaluations consistently and formally:"
MERGE (si)-[:has_evidence_requirement]->(er);

// --- 1.5-gov (4) ---
MATCH (si:SuccessIndicator {composite_key: "1.5-gov"})
MERGE (er:EvidenceRequirement {handle: "evidence:1.5-gov:established:1"})
  ON CREATE SET er.unique_id = randomUUID()
SET er.composite_key = "1.5-gov", er.level = "established", er.seq = 1,
    er.element = "Position", er.requirement = "A designated individual or team is formally assigned responsibility for tracking, reporting, and distributing timely adoption metrics",
    er.rubric_dimension = "resources", er.lead_in = null
MERGE (si)-[:has_evidence_requirement]->(er);
MATCH (si:SuccessIndicator {composite_key: "1.5-gov"})
MERGE (er:EvidenceRequirement {handle: "evidence:1.5-gov:established:2"})
  ON CREATE SET er.unique_id = randomUUID()
SET er.composite_key = "1.5-gov", er.level = "established", er.seq = 2,
    er.element = "Budget", er.requirement = "Resources are allocated to support data collection, reporting tools, and staff time for managing timely adoption metrics",
    er.rubric_dimension = "resources", er.lead_in = null
MERGE (si)-[:has_evidence_requirement]->(er);
MATCH (si:SuccessIndicator {composite_key: "1.5-gov"})
MERGE (er:EvidenceRequirement {handle: "evidence:1.5-gov:established:3"})
  ON CREATE SET er.unique_id = randomUUID()
SET er.composite_key = "1.5-gov", er.level = "established", er.seq = 3,
    er.element = "Procedures", er.requirement = "A documented process defines how timely adoption data is collected, validated, reported, and distributed to stakeholders on a regular schedule",
    er.rubric_dimension = "procedures", er.lead_in = null
MERGE (si)-[:has_evidence_requirement]->(er);
MATCH (si:SuccessIndicator {composite_key: "1.5-gov"})
MERGE (er:EvidenceRequirement {handle: "evidence:1.5-gov:established:4"})
  ON CREATE SET er.unique_id = randomUUID()
SET er.composite_key = "1.5-gov", er.level = "established", er.seq = 4,
    er.element = "Output", er.requirement = "Evidence that timely adoption metrics are consistently tracked and distributed in a structured, reliable manner to inform institutional decision-making and compliance efforts",
    er.rubric_dimension = "documentation_evidence", er.lead_in = null
MERGE (si)-[:has_evidence_requirement]->(er);

// --- 1.6-gov (4) ---
MATCH (si:SuccessIndicator {composite_key: "1.6-gov"})
MERGE (er:EvidenceRequirement {handle: "evidence:1.6-gov:established:1"})
  ON CREATE SET er.unique_id = randomUUID()
SET er.composite_key = "1.6-gov", er.level = "established", er.seq = 1,
    er.element = "Position", er.requirement = "A designated individual or team is formally assigned responsibility for monitoring LMS accessibility reports and related instructional materials",
    er.rubric_dimension = "resources", er.lead_in = null
MERGE (si)-[:has_evidence_requirement]->(er);
MATCH (si:SuccessIndicator {composite_key: "1.6-gov"})
MERGE (er:EvidenceRequirement {handle: "evidence:1.6-gov:established:2"})
  ON CREATE SET er.unique_id = randomUUID()
SET er.composite_key = "1.6-gov", er.level = "established", er.seq = 2,
    er.element = "Budget", er.requirement = "Resources are allocated to support monitoring activities, including staff time and LMS-integrated accessibility tools",
    er.rubric_dimension = "resources", er.lead_in = null
MERGE (si)-[:has_evidence_requirement]->(er);
MATCH (si:SuccessIndicator {composite_key: "1.6-gov"})
MERGE (er:EvidenceRequirement {handle: "evidence:1.6-gov:established:3"})
  ON CREATE SET er.unique_id = randomUUID()
SET er.composite_key = "1.6-gov", er.level = "established", er.seq = 3,
    er.element = "Procedures", er.requirement = "A documented process defines how accessibility reports are reviewed, tracked, and communicated to stakeholders for remediation",
    er.rubric_dimension = "procedures", er.lead_in = null
MERGE (si)-[:has_evidence_requirement]->(er);
MATCH (si:SuccessIndicator {composite_key: "1.6-gov"})
MERGE (er:EvidenceRequirement {handle: "evidence:1.6-gov:established:4"})
  ON CREATE SET er.unique_id = randomUUID()
SET er.composite_key = "1.6-gov", er.level = "established", er.seq = 4,
    er.element = "Output", er.requirement = "Records demonstrating that LMS accessibility reports are consistently monitored and acted upon through a coordinated, accountable process led by the assigned body",
    er.rubric_dimension = "documentation_evidence", er.lead_in = null
MERGE (si)-[:has_evidence_requirement]->(er);

// --- 1.6-ins (5) ---
MATCH (si:SuccessIndicator {composite_key: "1.6-ins"})
MERGE (er:EvidenceRequirement {handle: "evidence:1.6-ins:established:1"})
  ON CREATE SET er.unique_id = randomUUID()
SET er.composite_key = "1.6-ins", er.level = "established", er.seq = 1,
    er.element = null, er.requirement = "Reports are generated on a predictable schedule aligned with academic terms",
    er.rubric_dimension = null, er.lead_in = "At the Established level, the campus has a consistent, documented process for producing and distributing instructional materials and adoption performance reports each semester."
MERGE (si)-[:has_evidence_requirement]->(er);
MATCH (si:SuccessIndicator {composite_key: "1.6-ins"})
MERGE (er:EvidenceRequirement {handle: "evidence:1.6-ins:established:2"})
  ON CREATE SET er.unique_id = randomUUID()
SET er.composite_key = "1.6-ins", er.level = "established", er.seq = 2,
    er.element = null, er.requirement = "Reports include meaningful metrics related to timely adoption and accessibility readiness",
    er.rubric_dimension = null, er.lead_in = "At the Established level, the campus has a consistent, documented process for producing and distributing instructional materials and adoption performance reports each semester."
MERGE (si)-[:has_evidence_requirement]->(er);
MATCH (si:SuccessIndicator {composite_key: "1.6-ins"})
MERGE (er:EvidenceRequirement {handle: "evidence:1.6-ins:established:3"})
  ON CREATE SET er.unique_id = randomUUID()
SET er.composite_key = "1.6-ins", er.level = "established", er.seq = 3,
    er.element = null, er.requirement = "Campus administration receives reports in time to take corrective or supportive action",
    er.rubric_dimension = null, er.lead_in = "At the Established level, the campus has a consistent, documented process for producing and distributing instructional materials and adoption performance reports each semester."
MERGE (si)-[:has_evidence_requirement]->(er);
MATCH (si:SuccessIndicator {composite_key: "1.6-ins"})
MERGE (er:EvidenceRequirement {handle: "evidence:1.6-ins:established:4"})
  ON CREATE SET er.unique_id = randomUUID()
SET er.composite_key = "1.6-ins", er.level = "established", er.seq = 4,
    er.element = null, er.requirement = "Responsibilities for report creation, review, and distribution are clearly defined",
    er.rubric_dimension = null, er.lead_in = "At the Established level, the campus has a consistent, documented process for producing and distributing instructional materials and adoption performance reports each semester."
MERGE (si)-[:has_evidence_requirement]->(er);
MATCH (si:SuccessIndicator {composite_key: "1.6-ins"})
MERGE (er:EvidenceRequirement {handle: "evidence:1.6-ins:established:5"})
  ON CREATE SET er.unique_id = randomUUID()
SET er.composite_key = "1.6-ins", er.level = "established", er.seq = 5,
    er.element = null, er.requirement = "Reports are used to inform planning, resourcing, and continuous improvement efforts",
    er.rubric_dimension = null, er.lead_in = "At the Established level, the campus has a consistent, documented process for producing and distributing instructional materials and adoption performance reports each semester."
MERGE (si)-[:has_evidence_requirement]->(er);

// --- 1.6-web (3) ---
MATCH (si:SuccessIndicator {composite_key: "1.6-web"})
MERGE (er:EvidenceRequirement {handle: "evidence:1.6-web:established:1"})
  ON CREATE SET er.unique_id = randomUUID()
SET er.composite_key = "1.6-web", er.level = "established", er.seq = 1,
    er.element = "Position", er.requirement = "Staff roles (central accessibility office, IT accessibility lead, or trained testers) are trained and formally tasked with conducting manual evaluations.",
    er.rubric_dimension = "resources", er.lead_in = "At the Established level, manual evaluations are not ad hoc but documented, consistent, and part of the institution’s accessibility practice:"
MERGE (si)-[:has_evidence_requirement]->(er);
MATCH (si:SuccessIndicator {composite_key: "1.6-web"})
MERGE (er:EvidenceRequirement {handle: "evidence:1.6-web:established:2"})
  ON CREATE SET er.unique_id = randomUUID()
SET er.composite_key = "1.6-web", er.level = "established", er.seq = 2,
    er.element = "Budget", er.requirement = "Resources allocated for training staff, purchasing assistive technology licenses, and/or contracting third-party evaluators.",
    er.rubric_dimension = "resources", er.lead_in = "At the Established level, manual evaluations are not ad hoc but documented, consistent, and part of the institution’s accessibility practice:"
MERGE (si)-[:has_evidence_requirement]->(er);
MATCH (si:SuccessIndicator {composite_key: "1.6-web"})
MERGE (er:EvidenceRequirement {handle: "evidence:1.6-web:established:3"})
  ON CREATE SET er.unique_id = randomUUID()
SET er.composite_key = "1.6-web", er.level = "established", er.seq = 3,
    er.element = "Procedures", er.requirement = "Documented procedures specify when manual testing occurs (e.g., annually, prior to major site launches, or as part of procurement), which methods are used, and who is responsible. Output: Written evaluation reports exist for each review, with prioritized recommendations for remediation and are available to the responsible content owner.",
    er.rubric_dimension = "procedures", er.lead_in = "At the Established level, manual evaluations are not ad hoc but documented, consistent, and part of the institution’s accessibility practice:"
MERGE (si)-[:has_evidence_requirement]->(er);

// --- 1.7-gov (4) ---
MATCH (si:SuccessIndicator {composite_key: "1.7-gov"})
MERGE (er:EvidenceRequirement {handle: "evidence:1.7-gov:established:1"})
  ON CREATE SET er.unique_id = randomUUID()
SET er.composite_key = "1.7-gov", er.level = "established", er.seq = 1,
    er.element = "Position", er.requirement = "A designated individual or team is formally assigned responsibility for accessibility training programs across the institution",
    er.rubric_dimension = "resources", er.lead_in = null
MERGE (si)-[:has_evidence_requirement]->(er);
MATCH (si:SuccessIndicator {composite_key: "1.7-gov"})
MERGE (er:EvidenceRequirement {handle: "evidence:1.7-gov:established:2"})
  ON CREATE SET er.unique_id = randomUUID()
SET er.composite_key = "1.7-gov", er.level = "established", er.seq = 2,
    er.element = "Budget", er.requirement = "Resources are allocated to support training development, delivery, and tracking, including staff time and training platforms",
    er.rubric_dimension = "resources", er.lead_in = null
MERGE (si)-[:has_evidence_requirement]->(er);
MATCH (si:SuccessIndicator {composite_key: "1.7-gov"})
MERGE (er:EvidenceRequirement {handle: "evidence:1.7-gov:established:3"})
  ON CREATE SET er.unique_id = randomUUID()
SET er.composite_key = "1.7-gov", er.level = "established", er.seq = 3,
    er.element = "Procedures", er.requirement = "A documented process ensures accessibility training is consistently developed, delivered, and updated for relevant campus audiences",
    er.rubric_dimension = "procedures", er.lead_in = null
MERGE (si)-[:has_evidence_requirement]->(er);
MATCH (si:SuccessIndicator {composite_key: "1.7-gov"})
MERGE (er:EvidenceRequirement {handle: "evidence:1.7-gov:established:4"})
  ON CREATE SET er.unique_id = randomUUID()
SET er.composite_key = "1.7-gov", er.level = "established", er.seq = 4,
    er.element = "Output", er.requirement = "Records demonstrating that accessibility training programs are delivered in a structured, coordinated manner, with clear ownership and consistent participation across key roles",
    er.rubric_dimension = "documentation_evidence", er.lead_in = null
MERGE (si)-[:has_evidence_requirement]->(er);

// --- 1.7-web (4) ---
MATCH (si:SuccessIndicator {composite_key: "1.7-web"})
MERGE (er:EvidenceRequirement {handle: "evidence:1.7-web:established:1"})
  ON CREATE SET er.unique_id = randomUUID()
SET er.composite_key = "1.7-web", er.level = "established", er.seq = 1,
    er.element = "Position", er.requirement = "Responsibility for distributing results is clearly assigned (e.g., accessibility office, IT service desk, procurement compliance).",
    er.rubric_dimension = "resources", er.lead_in = "At the Established level, the institution has a formal and consistent process for distributing evaluation results:"
MERGE (si)-[:has_evidence_requirement]->(er);
MATCH (si:SuccessIndicator {composite_key: "1.7-web"})
MERGE (er:EvidenceRequirement {handle: "evidence:1.7-web:established:2"})
  ON CREATE SET er.unique_id = randomUUID()
SET er.composite_key = "1.7-web", er.level = "established", er.seq = 2,
    er.element = "Budget", er.requirement = "Resources may support communication tools, ticketing systems, or staff capacity for managing distribution.",
    er.rubric_dimension = "resources", er.lead_in = "At the Established level, the institution has a formal and consistent process for distributing evaluation results:"
MERGE (si)-[:has_evidence_requirement]->(er);
MATCH (si:SuccessIndicator {composite_key: "1.7-web"})
MERGE (er:EvidenceRequirement {handle: "evidence:1.7-web:established:3"})
  ON CREATE SET er.unique_id = randomUUID()
SET er.composite_key = "1.7-web", er.level = "established", er.seq = 3,
    er.element = "Procedures", er.requirement = "Documented procedures define who receives results, how results are communicated (email, dashboard, shared reports, ticketing), and when (e.g., within 2 weeks of evaluation).",
    er.rubric_dimension = "procedures", er.lead_in = "At the Established level, the institution has a formal and consistent process for distributing evaluation results:"
MERGE (si)-[:has_evidence_requirement]->(er);
MATCH (si:SuccessIndicator {composite_key: "1.7-web"})
MERGE (er:EvidenceRequirement {handle: "evidence:1.7-web:established:4"})
  ON CREATE SET er.unique_id = randomUUID()
SET er.composite_key = "1.7-web", er.level = "established", er.seq = 4,
    er.element = "Output", er.requirement = "All campus-affiliated websites and applications evaluated have results shared with responsible parties (owners, maintainers, vendors).",
    er.rubric_dimension = "documentation_evidence", er.lead_in = "At the Established level, the institution has a formal and consistent process for distributing evaluation results:"
MERGE (si)-[:has_evidence_requirement]->(er);

// --- 1.9-pro (6) ---
MATCH (si:SuccessIndicator {composite_key: "1.9-pro"})
MERGE (er:EvidenceRequirement {handle: "evidence:1.9-pro:established:1"})
  ON CREATE SET er.unique_id = randomUUID()
SET er.composite_key = "1.9-pro", er.level = "established", er.seq = 1,
    er.element = "Position", er.requirement = "Procurement officers and ATI accessibility leads are tasked with coordinating vendor accessibility engagement. Coordination with, involvement in, the systemwide procurement network and sharing documentation for systemwide benefit.",
    er.rubric_dimension = "resources", er.lead_in = null
MERGE (si)-[:has_evidence_requirement]->(er);
MATCH (si:SuccessIndicator {composite_key: "1.9-pro"})
MERGE (er:EvidenceRequirement {handle: "evidence:1.9-pro:established:2"})
  ON CREATE SET er.unique_id = randomUUID()
SET er.composite_key = "1.9-pro", er.level = "established", er.seq = 2,
    er.element = "Budget", er.requirement = "Funding supports vendor engagement meetings or testing demonstrations. Perhaps a student employee tasked with procurement baseline vendor engagement tasks.",
    er.rubric_dimension = "resources", er.lead_in = null
MERGE (si)-[:has_evidence_requirement]->(er);
MATCH (si:SuccessIndicator {composite_key: "1.9-pro"})
MERGE (er:EvidenceRequirement {handle: "evidence:1.9-pro:established:3"})
  ON CREATE SET er.unique_id = randomUUID()
SET er.composite_key = "1.9-pro", er.level = "established", er.seq = 3,
    er.element = "Procedures", er.requirement = "Documented steps guide vendors through ACR review, feedback, and roadmap submission.",
    er.rubric_dimension = "procedures", er.lead_in = null
MERGE (si)-[:has_evidence_requirement]->(er);
MATCH (si:SuccessIndicator {composite_key: "1.9-pro"})
MERGE (er:EvidenceRequirement {handle: "evidence:1.9-pro:established:4"})
  ON CREATE SET er.unique_id = randomUUID()
SET er.composite_key = "1.9-pro", er.level = "established", er.seq = 4,
    er.element = "Output", er.requirement = "Accessibility improvement commitments captured in procurement files or contracts, vendor roadmaps, TAAPs.",
    er.rubric_dimension = "documentation_evidence", er.lead_in = null
MERGE (si)-[:has_evidence_requirement]->(er);
MATCH (si:SuccessIndicator {composite_key: "1.9-pro"})
MERGE (er:EvidenceRequirement {handle: "evidence:1.9-pro:managed:1"})
  ON CREATE SET er.unique_id = randomUUID()
SET er.composite_key = "1.9-pro", er.level = "managed", er.seq = 1,
    er.element = "Metrics", er.requirement = "Track the number of vendors engaged, the percentage with accessibility roadmaps, TAAPs resolved, and/or progress on remediation commitments.",
    er.rubric_dimension = "documentation_evidence", er.lead_in = null
MERGE (si)-[:has_evidence_requirement]->(er);
MATCH (si:SuccessIndicator {composite_key: "1.9-pro"})
MERGE (er:EvidenceRequirement {handle: "evidence:1.9-pro:optimizing:1"})
  ON CREATE SET er.unique_id = randomUUID()
SET er.composite_key = "1.9-pro", er.level = "optimizing", er.seq = 1,
    er.element = "Administrative Review", er.requirement = "Determine if vendor engagement is sufficient and provides the desired outcomes.",
    er.rubric_dimension = "procedures", er.lead_in = null
MERGE (si)-[:has_evidence_requirement]->(er);

// --- 1.9-web (4) ---
MATCH (si:SuccessIndicator {composite_key: "1.9-web"})
MERGE (er:EvidenceRequirement {handle: "evidence:1.9-web:established:1"})
  ON CREATE SET er.unique_id = randomUUID()
SET er.composite_key = "1.9-web", er.level = "established", er.seq = 1,
    er.element = "Position", er.requirement = "Content maintainers are expected (and sometimes required) to participate in training or orientation about the accessibility evaluation process.",
    er.rubric_dimension = "resources", er.lead_in = "At the Established level, the institution has moved beyond ad hoc awareness-building and has a formal, repeatable program to ensure understanding:"
MERGE (si)-[:has_evidence_requirement]->(er);
MATCH (si:SuccessIndicator {composite_key: "1.9-web"})
MERGE (er:EvidenceRequirement {handle: "evidence:1.9-web:established:2"})
  ON CREATE SET er.unique_id = randomUUID()
SET er.composite_key = "1.9-web", er.level = "established", er.seq = 2,
    er.element = "Budget", er.requirement = "Funds allocated for training development, workshops, or external trainers.",
    er.rubric_dimension = "resources", er.lead_in = "At the Established level, the institution has moved beyond ad hoc awareness-building and has a formal, repeatable program to ensure understanding:"
MERGE (si)-[:has_evidence_requirement]->(er);
MATCH (si:SuccessIndicator {composite_key: "1.9-web"})
MERGE (er:EvidenceRequirement {handle: "evidence:1.9-web:established:3"})
  ON CREATE SET er.unique_id = randomUUID()
SET er.composite_key = "1.9-web", er.level = "established", er.seq = 3,
    er.element = "Procedures", er.requirement = "A documented training/onboarding program explains the evaluation process and how findings are communicated and resolved. Sessions are scheduled regularly and required for key roles.",
    er.rubric_dimension = "procedures", er.lead_in = "At the Established level, the institution has moved beyond ad hoc awareness-building and has a formal, repeatable program to ensure understanding:"
MERGE (si)-[:has_evidence_requirement]->(er);
MATCH (si:SuccessIndicator {composite_key: "1.9-web"})
MERGE (er:EvidenceRequirement {handle: "evidence:1.9-web:established:4"})
  ON CREATE SET er.unique_id = randomUUID()
SET er.composite_key = "1.9-web", er.level = "established", er.seq = 4,
    er.element = "Output", er.requirement = "Majority of staff and vendors who maintain websites, applications, and digital content have completed training or certification.",
    er.rubric_dimension = "documentation_evidence", er.lead_in = "At the Established level, the institution has moved beyond ad hoc awareness-building and has a formal, repeatable program to ensure understanding:"
MERGE (si)-[:has_evidence_requirement]->(er);

// --- 2.1-gov (4) ---
MATCH (si:SuccessIndicator {composite_key: "2.1-gov"})
MERGE (er:EvidenceRequirement {handle: "evidence:2.1-gov:established:1"})
  ON CREATE SET er.unique_id = randomUUID()
SET er.composite_key = "2.1-gov", er.level = "established", er.seq = 1,
    er.element = "Position", er.requirement = "Responsibility for implementing and enforcing timely adoption policies is formally assigned to appropriate roles (e.g., academic affairs, bookstore, departments)",
    er.rubric_dimension = "resources", er.lead_in = null
MERGE (si)-[:has_evidence_requirement]->(er);
MATCH (si:SuccessIndicator {composite_key: "2.1-gov"})
MERGE (er:EvidenceRequirement {handle: "evidence:2.1-gov:established:2"})
  ON CREATE SET er.unique_id = randomUUID()
SET er.composite_key = "2.1-gov", er.level = "established", er.seq = 2,
    er.element = "Budget", er.requirement = "Resources are allocated to support systems and staff involved in managing and tracking timely adoption processes",
    er.rubric_dimension = "resources", er.lead_in = null
MERGE (si)-[:has_evidence_requirement]->(er);
MATCH (si:SuccessIndicator {composite_key: "2.1-gov"})
MERGE (er:EvidenceRequirement {handle: "evidence:2.1-gov:established:3"})
  ON CREATE SET er.unique_id = randomUUID()
SET er.composite_key = "2.1-gov", er.level = "established", er.seq = 3,
    er.element = "Procedures", er.requirement = "A formally documented policy or procedure defines deadlines, roles, enforcement mechanisms, and integration with accessibility considerations",
    er.rubric_dimension = "procedures", er.lead_in = null
MERGE (si)-[:has_evidence_requirement]->(er);
MATCH (si:SuccessIndicator {composite_key: "2.1-gov"})
MERGE (er:EvidenceRequirement {handle: "evidence:2.1-gov:established:4"})
  ON CREATE SET er.unique_id = randomUUID()
SET er.composite_key = "2.1-gov", er.level = "established", er.seq = 4,
    er.element = "Output", er.requirement = "Records or reports demonstrating that timely adoption requirements are consistently implemented across the institution, with documented compliance and predictable submission patterns",
    er.rubric_dimension = "documentation_evidence", er.lead_in = null
MERGE (si)-[:has_evidence_requirement]->(er);

// --- 2.1-web (4) ---
MATCH (si:SuccessIndicator {composite_key: "2.1-web"})
MERGE (er:EvidenceRequirement {handle: "evidence:2.1-web:established:1"})
  ON CREATE SET er.unique_id = randomUUID()
SET er.composite_key = "2.1-web", er.level = "established", er.seq = 1,
    er.element = "Position", er.requirement = "Accessibility responsibilities are identified in developer and technical lead position descriptions.",
    er.rubric_dimension = "resources", er.lead_in = null
MERGE (si)-[:has_evidence_requirement]->(er);
MATCH (si:SuccessIndicator {composite_key: "2.1-web"})
MERGE (er:EvidenceRequirement {handle: "evidence:2.1-web:established:2"})
  ON CREATE SET er.unique_id = randomUUID()
SET er.composite_key = "2.1-web", er.level = "established", er.seq = 2,
    er.element = "Budget", er.requirement = "Budget allocated for continuing education including Accessibility SMEs and developers.",
    er.rubric_dimension = "resources", er.lead_in = null
MERGE (si)-[:has_evidence_requirement]->(er);
MATCH (si:SuccessIndicator {composite_key: "2.1-web"})
MERGE (er:EvidenceRequirement {handle: "evidence:2.1-web:established:3"})
  ON CREATE SET er.unique_id = randomUUID()
SET er.composite_key = "2.1-web", er.level = "established", er.seq = 3,
    er.element = "Procedures", er.requirement = "A complete, documented development process includes required accessibility checkpoints. Accessibility validation is a standard, formal release requirement.",
    er.rubric_dimension = "procedures", er.lead_in = null
MERGE (si)-[:has_evidence_requirement]->(er);
MATCH (si:SuccessIndicator {composite_key: "2.1-web"})
MERGE (er:EvidenceRequirement {handle: "evidence:2.1-web:established:4"})
  ON CREATE SET er.unique_id = randomUUID()
SET er.composite_key = "2.1-web", er.level = "established", er.seq = 4,
    er.element = "Output", er.requirement = "Accessibility defects are tracked and remediated before production.",
    er.rubric_dimension = "documentation_evidence", er.lead_in = null
MERGE (si)-[:has_evidence_requirement]->(er);

// --- 2.10-web (4) ---
MATCH (si:SuccessIndicator {composite_key: "2.10-web"})
MERGE (er:EvidenceRequirement {handle: "evidence:2.10-web:established:1"})
  ON CREATE SET er.unique_id = randomUUID()
SET er.composite_key = "2.10-web", er.level = "established", er.seq = 1,
    er.element = "Position", er.requirement = "Responsibility for conducting accessibility reviews is formally assigned and documented in appropriate position descriptions.",
    er.rubric_dimension = "resources", er.lead_in = null
MERGE (si)-[:has_evidence_requirement]->(er);
MATCH (si:SuccessIndicator {composite_key: "2.10-web"})
MERGE (er:EvidenceRequirement {handle: "evidence:2.10-web:established:2"})
  ON CREATE SET er.unique_id = randomUUID()
SET er.composite_key = "2.10-web", er.level = "established", er.seq = 2,
    er.element = "Budget", er.requirement = "Dedicated staff time or workload allocation is identified to support ongoing accessibility review requests.",
    er.rubric_dimension = "resources", er.lead_in = null
MERGE (si)-[:has_evidence_requirement]->(er);
MATCH (si:SuccessIndicator {composite_key: "2.10-web"})
MERGE (er:EvidenceRequirement {handle: "evidence:2.10-web:established:3"})
  ON CREATE SET er.unique_id = randomUUID()
SET er.composite_key = "2.10-web", er.level = "established", er.seq = 3,
    er.element = "Procedures", er.requirement = "A complete, documented pre-publication accessibility review process aligned with WCAG 2.1 AA is required and consistently followed.",
    er.rubric_dimension = "procedures", er.lead_in = null
MERGE (si)-[:has_evidence_requirement]->(er);
MATCH (si:SuccessIndicator {composite_key: "2.10-web"})
MERGE (er:EvidenceRequirement {handle: "evidence:2.10-web:established:4"})
  ON CREATE SET er.unique_id = randomUUID()
SET er.composite_key = "2.10-web", er.level = "established", er.seq = 4,
    er.element = "Output", er.requirement = "Accessibility review is a standard, tracked step prior to publishing high-impact digital content.",
    er.rubric_dimension = "documentation_evidence", er.lead_in = null
MERGE (si)-[:has_evidence_requirement]->(er);

// --- 2.2-gov (4) ---
MATCH (si:SuccessIndicator {composite_key: "2.2-gov"})
MERGE (er:EvidenceRequirement {handle: "evidence:2.2-gov:established:1"})
  ON CREATE SET er.unique_id = randomUUID()
SET er.composite_key = "2.2-gov", er.level = "established", er.seq = 1,
    er.element = "Position", er.requirement = "Faculty roles formally include responsibility for selecting and authoring accessible instructional materials as defined in institutional policy or resolution",
    er.rubric_dimension = "resources", er.lead_in = null
MERGE (si)-[:has_evidence_requirement]->(er);
MATCH (si:SuccessIndicator {composite_key: "2.2-gov"})
MERGE (er:EvidenceRequirement {handle: "evidence:2.2-gov:established:2"})
  ON CREATE SET er.unique_id = randomUUID()
SET er.composite_key = "2.2-gov", er.level = "established", er.seq = 2,
    er.element = "Budget", er.requirement = "Resources are allocated to support faculty in meeting these responsibilities (e.g., training, instructional design support, accessibility tools)",
    er.rubric_dimension = "resources", er.lead_in = null
MERGE (si)-[:has_evidence_requirement]->(er);
MATCH (si:SuccessIndicator {composite_key: "2.2-gov"})
MERGE (er:EvidenceRequirement {handle: "evidence:2.2-gov:established:3"})
  ON CREATE SET er.unique_id = randomUUID()
SET er.composite_key = "2.2-gov", er.level = "established", er.seq = 3,
    er.element = "Procedures", er.requirement = "A formally documented policy or resolution clearly defines faculty responsibilities and is integrated into academic and instructional governance processes",
    er.rubric_dimension = "procedures", er.lead_in = null
MERGE (si)-[:has_evidence_requirement]->(er);
MATCH (si:SuccessIndicator {composite_key: "2.2-gov"})
MERGE (er:EvidenceRequirement {handle: "evidence:2.2-gov:established:4"})
  ON CREATE SET er.unique_id = randomUUID()
SET er.composite_key = "2.2-gov", er.level = "established", er.seq = 4,
    er.element = "Output", er.requirement = "Faculty responsibilities for accessibility are consistently communicated and applied across the institution, with clear expectations for accessible instructional materials The policy, resolution or procedure itself and related documentation, plus records of shared governance",
    er.rubric_dimension = "documentation_evidence", er.lead_in = null
MERGE (si)-[:has_evidence_requirement]->(er);

// --- 2.3-gov (4) ---
MATCH (si:SuccessIndicator {composite_key: "2.3-gov"})
MERGE (er:EvidenceRequirement {handle: "evidence:2.3-gov:established:1"})
  ON CREATE SET er.unique_id = randomUUID()
SET er.composite_key = "2.3-gov", er.level = "established", er.seq = 1,
    er.element = "Position", er.requirement = "Responsibility for accessible web/mobile and digital communications is formally defined and assigned through institutional policy across relevant roles and units",
    er.rubric_dimension = "resources", er.lead_in = null
MERGE (si)-[:has_evidence_requirement]->(er);
MATCH (si:SuccessIndicator {composite_key: "2.3-gov"})
MERGE (er:EvidenceRequirement {handle: "evidence:2.3-gov:established:2"})
  ON CREATE SET er.unique_id = randomUUID()
SET er.composite_key = "2.3-gov", er.level = "established", er.seq = 2,
    er.element = "Budget", er.requirement = "Resources are allocated to support implementation, including staff time, tools, and support services for accessibility compliance",
    er.rubric_dimension = "resources", er.lead_in = null
MERGE (si)-[:has_evidence_requirement]->(er);
MATCH (si:SuccessIndicator {composite_key: "2.3-gov"})
MERGE (er:EvidenceRequirement {handle: "evidence:2.3-gov:established:3"})
  ON CREATE SET er.unique_id = randomUUID()
SET er.composite_key = "2.3-gov", er.level = "established", er.seq = 3,
    er.element = "Procedures", er.requirement = "A formally documented policy or procedure defines responsibilities, scope, standards, and enforcement mechanisms for accessible digital communications",
    er.rubric_dimension = "procedures", er.lead_in = null
MERGE (si)-[:has_evidence_requirement]->(er);
MATCH (si:SuccessIndicator {composite_key: "2.3-gov"})
MERGE (er:EvidenceRequirement {handle: "evidence:2.3-gov:established:4"})
  ON CREATE SET er.unique_id = randomUUID()
SET er.composite_key = "2.3-gov", er.level = "established", er.seq = 4,
    er.element = "Output", er.requirement = "Accessibility expectations for digital communications are consistently applied across campus, with clear accountability and alignment to institutional standards The policy, resolution or procedure itself and related documentation, plus records of oversight and enforcement",
    er.rubric_dimension = "documentation_evidence", er.lead_in = null
MERGE (si)-[:has_evidence_requirement]->(er);

// --- 2.4-gov (4) ---
MATCH (si:SuccessIndicator {composite_key: "2.4-gov"})
MERGE (er:EvidenceRequirement {handle: "evidence:2.4-gov:established:1"})
  ON CREATE SET er.unique_id = randomUUID()
SET er.composite_key = "2.4-gov", er.level = "established", er.seq = 1,
    er.element = "Position", er.requirement = "Responsibility for accessible ICT procurement is formally defined and assigned through institutional policy across procurement, IT, and related roles",
    er.rubric_dimension = "resources", er.lead_in = null
MERGE (si)-[:has_evidence_requirement]->(er);
MATCH (si:SuccessIndicator {composite_key: "2.4-gov"})
MERGE (er:EvidenceRequirement {handle: "evidence:2.4-gov:established:2"})
  ON CREATE SET er.unique_id = randomUUID()
SET er.composite_key = "2.4-gov", er.level = "established", er.seq = 2,
    er.element = "Budget", er.requirement = "Resources are allocated to support accessibility review activities, including staff time, tools, and vendor engagement efforts",
    er.rubric_dimension = "resources", er.lead_in = null
MERGE (si)-[:has_evidence_requirement]->(er);
MATCH (si:SuccessIndicator {composite_key: "2.4-gov"})
MERGE (er:EvidenceRequirement {handle: "evidence:2.4-gov:established:3"})
  ON CREATE SET er.unique_id = randomUUID()
SET er.composite_key = "2.4-gov", er.level = "established", er.seq = 3,
    er.element = "Procedures", er.requirement = "A formally documented policy or procedure defines requirements, roles, standards, and enforcement mechanisms for accessible ICT procurement",
    er.rubric_dimension = "procedures", er.lead_in = null
MERGE (si)-[:has_evidence_requirement]->(er);
MATCH (si:SuccessIndicator {composite_key: "2.4-gov"})
MERGE (er:EvidenceRequirement {handle: "evidence:2.4-gov:established:4"})
  ON CREATE SET er.unique_id = randomUUID()
SET er.composite_key = "2.4-gov", er.level = "established", er.seq = 4,
    er.element = "Output", er.requirement = "Records or reports demonstrating that ICT procurements are consistently conducted under a formalized, accessibility-informed process with clear institutional accountability",
    er.rubric_dimension = "documentation_evidence", er.lead_in = null
MERGE (si)-[:has_evidence_requirement]->(er);

// --- 3.1-gov (4) ---
MATCH (si:SuccessIndicator {composite_key: "3.1-gov"})
MERGE (er:EvidenceRequirement {handle: "evidence:3.1-gov:established:1"})
  ON CREATE SET er.unique_id = randomUUID()
SET er.composite_key = "3.1-gov", er.level = "established", er.seq = 1,
    er.element = "Position", er.requirement = "The ATI Steering Committee and subcommittees are formally assigned responsibility for reviewing, revising, and approving accessibility-related plans",
    er.rubric_dimension = "resources", er.lead_in = null
MERGE (si)-[:has_evidence_requirement]->(er);
MATCH (si:SuccessIndicator {composite_key: "3.1-gov"})
MERGE (er:EvidenceRequirement {handle: "evidence:3.1-gov:established:2"})
  ON CREATE SET er.unique_id = randomUUID()
SET er.composite_key = "3.1-gov", er.level = "established", er.seq = 2,
    er.element = "Budget", er.requirement = "Resources are allocated to support planning activities, including staff time, coordination, and tools for documentation and collaboration",
    er.rubric_dimension = "resources", er.lead_in = null
MERGE (si)-[:has_evidence_requirement]->(er);
MATCH (si:SuccessIndicator {composite_key: "3.1-gov"})
MERGE (er:EvidenceRequirement {handle: "evidence:3.1-gov:established:3"})
  ON CREATE SET er.unique_id = randomUUID()
SET er.composite_key = "3.1-gov", er.level = "established", er.seq = 3,
    er.element = "Procedures", er.requirement = "A documented, recurring process defines how plans are reviewed, updated, and approved, including timelines, roles, and decision-making protocols",
    er.rubric_dimension = "procedures", er.lead_in = null
MERGE (si)-[:has_evidence_requirement]->(er);
MATCH (si:SuccessIndicator {composite_key: "3.1-gov"})
MERGE (er:EvidenceRequirement {handle: "evidence:3.1-gov:established:4"})
  ON CREATE SET er.unique_id = randomUUID()
SET er.composite_key = "3.1-gov", er.level = "established", er.seq = 4,
    er.element = "Output", er.requirement = "Accessibility is consistently incorporated into institutional planning documents, with formally reviewed and approved plans guiding campus efforts",
    er.rubric_dimension = "documentation_evidence", er.lead_in = null
MERGE (si)-[:has_evidence_requirement]->(er);

// --- 3.2-web (4) ---
MATCH (si:SuccessIndicator {composite_key: "3.2-web"})
MERGE (er:EvidenceRequirement {handle: "evidence:3.2-web:established:1"})
  ON CREATE SET er.unique_id = randomUUID()
SET er.composite_key = "3.2-web", er.level = "established", er.seq = 1,
    er.element = "Position", er.requirement = "Responsibility for verifying accessibility during updates is formally assigned and documented in appropriate roles.",
    er.rubric_dimension = "resources", er.lead_in = null
MERGE (si)-[:has_evidence_requirement]->(er);
MATCH (si:SuccessIndicator {composite_key: "3.2-web"})
MERGE (er:EvidenceRequirement {handle: "evidence:3.2-web:established:2"})
  ON CREATE SET er.unique_id = randomUUID()
SET er.composite_key = "3.2-web", er.level = "established", er.seq = 2,
    er.element = "Budget", er.requirement = "Identified staff time or workload allocation supports ongoing accessibility verification activities.",
    er.rubric_dimension = "resources", er.lead_in = null
MERGE (si)-[:has_evidence_requirement]->(er);
MATCH (si:SuccessIndicator {composite_key: "3.2-web"})
MERGE (er:EvidenceRequirement {handle: "evidence:3.2-web:established:3"})
  ON CREATE SET er.unique_id = randomUUID()
SET er.composite_key = "3.2-web", er.level = "established", er.seq = 3,
    er.element = "Procedures", er.requirement = "A complete, documented process requires accessibility validation as part of change management for digital updates.",
    er.rubric_dimension = "procedures", er.lead_in = null
MERGE (si)-[:has_evidence_requirement]->(er);
MATCH (si:SuccessIndicator {composite_key: "3.2-web"})
MERGE (er:EvidenceRequirement {handle: "evidence:3.2-web:established:4"})
  ON CREATE SET er.unique_id = randomUUID()
SET er.composite_key = "3.2-web", er.level = "established", er.seq = 4,
    er.element = "Output", er.requirement = "Accessibility verification is a standard, tracked step before publishing changes to existing digital assets.",
    er.rubric_dimension = "documentation_evidence", er.lead_in = null
MERGE (si)-[:has_evidence_requirement]->(er);

// --- 3.7-web (4) ---
MATCH (si:SuccessIndicator {composite_key: "3.7-web"})
MERGE (er:EvidenceRequirement {handle: "evidence:3.7-web:established:1"})
  ON CREATE SET er.unique_id = randomUUID()
SET er.composite_key = "3.7-web", er.level = "established", er.seq = 1,
    er.element = "Position", er.requirement = "Designated accessibility staff (or web governance body) formally assigned responsibility for coordinating automated scans and manual testing activities.",
    er.rubric_dimension = "resources", er.lead_in = null
MERGE (si)-[:has_evidence_requirement]->(er);
MATCH (si:SuccessIndicator {composite_key: "3.7-web"})
MERGE (er:EvidenceRequirement {handle: "evidence:3.7-web:established:2"})
  ON CREATE SET er.unique_id = randomUUID()
SET er.composite_key = "3.7-web", er.level = "established", er.seq = 2,
    er.element = "Budget", er.requirement = "Institutional funding allocated for enterprise scanning tools and staff time to conduct manual evaluations.",
    er.rubric_dimension = "resources", er.lead_in = null
MERGE (si)-[:has_evidence_requirement]->(er);
MATCH (si:SuccessIndicator {composite_key: "3.7-web"})
MERGE (er:EvidenceRequirement {handle: "evidence:3.7-web:established:3"})
  ON CREATE SET er.unique_id = randomUUID()
SET er.composite_key = "3.7-web", er.level = "established", er.seq = 3,
    er.element = "Procedures", er.requirement = "Documented, campus-wide process outlining scan frequency, required manual testing methods (e.g., keyboard, screen reader, form testing), documentation standards, and remediation tracking workflow.",
    er.rubric_dimension = "procedures", er.lead_in = null
MERGE (si)-[:has_evidence_requirement]->(er);
MATCH (si:SuccessIndicator {composite_key: "3.7-web"})
MERGE (er:EvidenceRequirement {handle: "evidence:3.7-web:established:4"})
  ON CREATE SET er.unique_id = randomUUID()
SET er.composite_key = "3.7-web", er.level = "established", er.seq = 4,
    er.element = "Output", er.requirement = "Regularly generated accessibility reports that combine automated scan results with documented manual testing findings and are distributed to responsible web owners for remediation.",
    er.rubric_dimension = "documentation_evidence", er.lead_in = null
MERGE (si)-[:has_evidence_requirement]->(er);

// --- 4.1-ins (5) ---
MATCH (si:SuccessIndicator {composite_key: "4.1-ins"})
MERGE (er:EvidenceRequirement {handle: "evidence:4.1-ins:established:1"})
  ON CREATE SET er.unique_id = randomUUID()
SET er.composite_key = "4.1-ins", er.level = "established", er.seq = 1,
    er.element = null, er.requirement = "Faculty receive clear guidance on using the LMS as the primary instructional platform",
    er.rubric_dimension = null, er.lead_in = "At the Established level, the campus actively promotes and supports the posting of accessible instructional materials within the university approved LMS."
MERGE (si)-[:has_evidence_requirement]->(er);
MATCH (si:SuccessIndicator {composite_key: "4.1-ins"})
MERGE (er:EvidenceRequirement {handle: "evidence:4.1-ins:established:2"})
  ON CREATE SET er.unique_id = randomUUID()
SET er.composite_key = "4.1-ins", er.level = "established", er.seq = 2,
    er.element = null, er.requirement = "Accessibility expectations for LMS-hosted content are communicated and reinforced",
    er.rubric_dimension = null, er.lead_in = "At the Established level, the campus actively promotes and supports the posting of accessible instructional materials within the university approved LMS."
MERGE (si)-[:has_evidence_requirement]->(er);
MATCH (si:SuccessIndicator {composite_key: "4.1-ins"})
MERGE (er:EvidenceRequirement {handle: "evidence:4.1-ins:established:3"})
  ON CREATE SET er.unique_id = randomUUID()
SET er.composite_key = "4.1-ins", er.level = "established", er.seq = 3,
    er.element = null, er.requirement = "Training and support resources are readily available",
    er.rubric_dimension = null, er.lead_in = "At the Established level, the campus actively promotes and supports the posting of accessible instructional materials within the university approved LMS."
MERGE (si)-[:has_evidence_requirement]->(er);
MATCH (si:SuccessIndicator {composite_key: "4.1-ins"})
MERGE (er:EvidenceRequirement {handle: "evidence:4.1-ins:established:4"})
  ON CREATE SET er.unique_id = randomUUID()
SET er.composite_key = "4.1-ins", er.level = "established", er.seq = 4,
    er.element = null, er.requirement = "LMS usage is widespread and consistent across academic units",
    er.rubric_dimension = null, er.lead_in = "At the Established level, the campus actively promotes and supports the posting of accessible instructional materials within the university approved LMS."
MERGE (si)-[:has_evidence_requirement]->(er);
MATCH (si:SuccessIndicator {composite_key: "4.1-ins"})
MERGE (er:EvidenceRequirement {handle: "evidence:4.1-ins:established:5"})
  ON CREATE SET er.unique_id = randomUUID()
SET er.composite_key = "4.1-ins", er.level = "established", er.seq = 5,
    er.element = null, er.requirement = "The process is reviewed periodically to improve adoption and accessibility outcomes",
    er.rubric_dimension = null, er.lead_in = "At the Established level, the campus actively promotes and supports the posting of accessible instructional materials within the university approved LMS."
MERGE (si)-[:has_evidence_requirement]->(er);

// --- 4.11-ins (6) ---
MATCH (si:SuccessIndicator {composite_key: "4.11-ins"})
MERGE (er:EvidenceRequirement {handle: "evidence:4.11-ins:established:1"})
  ON CREATE SET er.unique_id = randomUUID()
SET er.composite_key = "4.11-ins", er.level = "established", er.seq = 1,
    er.element = null, er.requirement = "External instructional content is identified and reviewed for accessibility",
    er.rubric_dimension = null, er.lead_in = "At the Established level, the campus has a documented process to review faculty-maintained instructional websites."
MERGE (si)-[:has_evidence_requirement]->(er);
MATCH (si:SuccessIndicator {composite_key: "4.11-ins"})
MERGE (er:EvidenceRequirement {handle: "evidence:4.11-ins:established:2"})
  ON CREATE SET er.unique_id = randomUUID()
SET er.composite_key = "4.11-ins", er.level = "established", er.seq = 2,
    er.element = null, er.requirement = "Faculty receive guidance and support for remediation",
    er.rubric_dimension = null, er.lead_in = "At the Established level, the campus has a documented process to review faculty-maintained instructional websites."
MERGE (si)-[:has_evidence_requirement]->(er);
MATCH (si:SuccessIndicator {composite_key: "4.11-ins"})
MERGE (er:EvidenceRequirement {handle: "evidence:4.11-ins:established:3"})
  ON CREATE SET er.unique_id = randomUUID()
SET er.composite_key = "4.11-ins", er.level = "established", er.seq = 3,
    er.element = null, er.requirement = "Reviews are conducted consistently and documented",
    er.rubric_dimension = null, er.lead_in = "At the Established level, the campus has a documented process to review faculty-maintained instructional websites."
MERGE (si)-[:has_evidence_requirement]->(er);
MATCH (si:SuccessIndicator {composite_key: "4.11-ins"})
MERGE (er:EvidenceRequirement {handle: "evidence:4.11-ins:established:4"})
  ON CREATE SET er.unique_id = randomUUID()
SET er.composite_key = "4.11-ins", er.level = "established", er.seq = 4,
    er.element = null, er.requirement = "Risks are tracked and addressed proactively",
    er.rubric_dimension = null, er.lead_in = "At the Established level, the campus has a documented process to review faculty-maintained instructional websites."
MERGE (si)-[:has_evidence_requirement]->(er);
MATCH (si:SuccessIndicator {composite_key: "4.11-ins"})
MERGE (er:EvidenceRequirement {handle: "evidence:4.11-ins:established:5"})
  ON CREATE SET er.unique_id = randomUUID()
SET er.composite_key = "4.11-ins", er.level = "established", er.seq = 5,
    er.element = null, er.requirement = "The process aligns with institutional accessibility standards",
    er.rubric_dimension = null, er.lead_in = "At the Established level, the campus has a documented process to review faculty-maintained instructional websites."
MERGE (si)-[:has_evidence_requirement]->(er);
MATCH (si:SuccessIndicator {composite_key: "4.11-ins"})
MERGE (er:EvidenceRequirement {handle: "evidence:4.11-ins:established:6"})
  ON CREATE SET er.unique_id = randomUUID()
SET er.composite_key = "4.11-ins", er.level = "established", er.seq = 6,
    er.element = null, er.requirement = "Methods are identified to discover faculty affiliated websites not within the campus ecosystem",
    er.rubric_dimension = null, er.lead_in = "At the Established level, the campus has a documented process to review faculty-maintained instructional websites."
MERGE (si)-[:has_evidence_requirement]->(er);

// --- 4.5-ins (5) ---
MATCH (si:SuccessIndicator {composite_key: "4.5-ins"})
MERGE (er:EvidenceRequirement {handle: "evidence:4.5-ins:established:1"})
  ON CREATE SET er.unique_id = randomUUID()
SET er.composite_key = "4.5-ins", er.level = "established", er.seq = 1,
    er.element = null, er.requirement = "Appropriate LMS roles and permissions are clearly defined",
    er.rubric_dimension = null, er.lead_in = "At the Established level, the campus has an operational process that ensures accommodation staff receive timely LMS access."
MERGE (si)-[:has_evidence_requirement]->(er);
MATCH (si:SuccessIndicator {composite_key: "4.5-ins"})
MERGE (er:EvidenceRequirement {handle: "evidence:4.5-ins:established:2"})
  ON CREATE SET er.unique_id = randomUUID()
SET er.composite_key = "4.5-ins", er.level = "established", er.seq = 2,
    er.element = null, er.requirement = "Access is granted early enough to support review and remediation",
    er.rubric_dimension = null, er.lead_in = "At the Established level, the campus has an operational process that ensures accommodation staff receive timely LMS access."
MERGE (si)-[:has_evidence_requirement]->(er);
MATCH (si:SuccessIndicator {composite_key: "4.5-ins"})
MERGE (er:EvidenceRequirement {handle: "evidence:4.5-ins:established:3"})
  ON CREATE SET er.unique_id = randomUUID()
SET er.composite_key = "4.5-ins", er.level = "established", er.seq = 3,
    er.element = null, er.requirement = "Processes are consistent across departments and terms",
    er.rubric_dimension = null, er.lead_in = "At the Established level, the campus has an operational process that ensures accommodation staff receive timely LMS access."
MERGE (si)-[:has_evidence_requirement]->(er);
MATCH (si:SuccessIndicator {composite_key: "4.5-ins"})
MERGE (er:EvidenceRequirement {handle: "evidence:4.5-ins:established:4"})
  ON CREATE SET er.unique_id = randomUUID()
SET er.composite_key = "4.5-ins", er.level = "established", er.seq = 4,
    er.element = null, er.requirement = "Faculty understand and support access requirements",
    er.rubric_dimension = null, er.lead_in = "At the Established level, the campus has an operational process that ensures accommodation staff receive timely LMS access."
MERGE (si)-[:has_evidence_requirement]->(er);
MATCH (si:SuccessIndicator {composite_key: "4.5-ins"})
MERGE (er:EvidenceRequirement {handle: "evidence:4.5-ins:established:5"})
  ON CREATE SET er.unique_id = randomUUID()
SET er.composite_key = "4.5-ins", er.level = "established", er.seq = 5,
    er.element = null, er.requirement = "The process is reviewed to address access barriers or delays",
    er.rubric_dimension = null, er.lead_in = "At the Established level, the campus has an operational process that ensures accommodation staff receive timely LMS access."
MERGE (si)-[:has_evidence_requirement]->(er);

// --- 4.6-pro (6) ---
MATCH (si:SuccessIndicator {composite_key: "4.6-pro"})
MERGE (er:EvidenceRequirement {handle: "evidence:4.6-pro:established:1"})
  ON CREATE SET er.unique_id = randomUUID()
SET er.composite_key = "4.6-pro", er.level = "established", er.seq = 1,
    er.element = "Position", er.requirement = "Responsibility for initiating, reviewing, and maintaining TAAPs is assigned to designated staff (e.g., ATI Procurement Lead, Buyer, or Accessibility Coordinator).",
    er.rubric_dimension = "resources", er.lead_in = null
MERGE (si)-[:has_evidence_requirement]->(er);
MATCH (si:SuccessIndicator {composite_key: "4.6-pro"})
MERGE (er:EvidenceRequirement {handle: "evidence:4.6-pro:established:2"})
  ON CREATE SET er.unique_id = randomUUID()
SET er.composite_key = "4.6-pro", er.level = "established", er.seq = 2,
    er.element = "Budget", er.requirement = "Resources allocated for staff time and tools supporting TAAP tracking and implementation.",
    er.rubric_dimension = "resources", er.lead_in = null
MERGE (si)-[:has_evidence_requirement]->(er);
MATCH (si:SuccessIndicator {composite_key: "4.6-pro"})
MERGE (er:EvidenceRequirement {handle: "evidence:4.6-pro:established:3"})
  ON CREATE SET er.unique_id = randomUUID()
SET er.composite_key = "4.6-pro", er.level = "established", er.seq = 3,
    er.element = "Procedures", er.requirement = "Documented procedures require a TAAP to be created whenever a product with known accessibility barriers is approved for use. The standardized CSU template is used in all cases.",
    er.rubric_dimension = "procedures", er.lead_in = null
MERGE (si)-[:has_evidence_requirement]->(er);
MATCH (si:SuccessIndicator {composite_key: "4.6-pro"})
MERGE (er:EvidenceRequirement {handle: "evidence:4.6-pro:established:4"})
  ON CREATE SET er.unique_id = randomUUID()
SET er.composite_key = "4.6-pro", er.level = "established", er.seq = 4,
    er.element = "Output", er.requirement = "All TAAPs are centrally logged, with accessible copies stored in an electronic repository and available to ATI stakeholders.",
    er.rubric_dimension = "documentation_evidence", er.lead_in = null
MERGE (si)-[:has_evidence_requirement]->(er);
MATCH (si:SuccessIndicator {composite_key: "4.6-pro"})
MERGE (er:EvidenceRequirement {handle: "evidence:4.6-pro:managed:1"})
  ON CREATE SET er.unique_id = randomUUID()
SET er.composite_key = "4.6-pro", er.level = "managed", er.seq = 1,
    er.element = "Metrics", er.requirement = "Track the number of active TAAPs, the completion rates of mitigation actions, and the average resolution time.",
    er.rubric_dimension = "documentation_evidence", er.lead_in = null
MERGE (si)-[:has_evidence_requirement]->(er);
MATCH (si:SuccessIndicator {composite_key: "4.6-pro"})
MERGE (er:EvidenceRequirement {handle: "evidence:4.6-pro:optimizing:1"})
  ON CREATE SET er.unique_id = randomUUID()
SET er.composite_key = "4.6-pro", er.level = "optimizing", er.seq = 1,
    er.element = "Administrative Review", er.requirement = "Escalation of TAAPs when the vendor fails to commit. Alternate ICT solutions implemented.",
    er.rubric_dimension = "procedures", er.lead_in = null
MERGE (si)-[:has_evidence_requirement]->(er);

// --- 5.11-ins (5) ---
MATCH (si:SuccessIndicator {composite_key: "5.11-ins"})
MERGE (er:EvidenceRequirement {handle: "evidence:5.11-ins:established:1"})
  ON CREATE SET er.unique_id = randomUUID()
SET er.composite_key = "5.11-ins", er.level = "established", er.seq = 1,
    er.element = null, er.requirement = "Accessibility requirements are addressed during creation or selection",
    er.rubric_dimension = null, er.lead_in = "At the Established level, the campus has an end-to-end process for accessible audio and video."
MERGE (si)-[:has_evidence_requirement]->(er);
MATCH (si:SuccessIndicator {composite_key: "5.11-ins"})
MERGE (er:EvidenceRequirement {handle: "evidence:5.11-ins:established:2"})
  ON CREATE SET er.unique_id = randomUUID()
SET er.composite_key = "5.11-ins", er.level = "established", er.seq = 2,
    er.element = null, er.requirement = "Remediation workflows are clearly defined and resourced",
    er.rubric_dimension = null, er.lead_in = "At the Established level, the campus has an end-to-end process for accessible audio and video."
MERGE (si)-[:has_evidence_requirement]->(er);
MATCH (si:SuccessIndicator {composite_key: "5.11-ins"})
MERGE (er:EvidenceRequirement {handle: "evidence:5.11-ins:established:3"})
  ON CREATE SET er.unique_id = randomUUID()
SET er.composite_key = "5.11-ins", er.level = "established", er.seq = 3,
    er.element = null, er.requirement = "Faculty understand their responsibilities and timelines",
    er.rubric_dimension = null, er.lead_in = "At the Established level, the campus has an end-to-end process for accessible audio and video."
MERGE (si)-[:has_evidence_requirement]->(er);
MATCH (si:SuccessIndicator {composite_key: "5.11-ins"})
MERGE (er:EvidenceRequirement {handle: "evidence:5.11-ins:established:4"})
  ON CREATE SET er.unique_id = randomUUID()
SET er.composite_key = "5.11-ins", er.level = "established", er.seq = 4,
    er.element = null, er.requirement = "Media assets are accessible by the start of instruction",
    er.rubric_dimension = null, er.lead_in = "At the Established level, the campus has an end-to-end process for accessible audio and video."
MERGE (si)-[:has_evidence_requirement]->(er);
MATCH (si:SuccessIndicator {composite_key: "5.11-ins"})
MERGE (er:EvidenceRequirement {handle: "evidence:5.11-ins:established:5"})
  ON CREATE SET er.unique_id = randomUUID()
SET er.composite_key = "5.11-ins", er.level = "established", er.seq = 5,
    er.element = null, er.requirement = "Processes are monitored and improved over time",
    er.rubric_dimension = null, er.lead_in = "At the Established level, the campus has an end-to-end process for accessible audio and video."
MERGE (si)-[:has_evidence_requirement]->(er);

// --- 5.14-ins (5) ---
MATCH (si:SuccessIndicator {composite_key: "5.14-ins"})
MERGE (er:EvidenceRequirement {handle: "evidence:5.14-ins:established:1"})
  ON CREATE SET er.unique_id = randomUUID()
SET er.composite_key = "5.14-ins", er.level = "established", er.seq = 1,
    er.element = null, er.requirement = "Emerging tools are reviewed prior to instructional use",
    er.rubric_dimension = null, er.lead_in = "At the Established level, the campus has a structured process for addressing accessibility of emerging instructional technologies."
MERGE (si)-[:has_evidence_requirement]->(er);
MATCH (si:SuccessIndicator {composite_key: "5.14-ins"})
MERGE (er:EvidenceRequirement {handle: "evidence:5.14-ins:established:2"})
  ON CREATE SET er.unique_id = randomUUID()
SET er.composite_key = "5.14-ins", er.level = "established", er.seq = 2,
    er.element = null, er.requirement = "Accessibility risks are documented and addressed",
    er.rubric_dimension = null, er.lead_in = "At the Established level, the campus has a structured process for addressing accessibility of emerging instructional technologies."
MERGE (si)-[:has_evidence_requirement]->(er);
MATCH (si:SuccessIndicator {composite_key: "5.14-ins"})
MERGE (er:EvidenceRequirement {handle: "evidence:5.14-ins:established:3"})
  ON CREATE SET er.unique_id = randomUUID()
SET er.composite_key = "5.14-ins", er.level = "established", er.seq = 3,
    er.element = null, er.requirement = "Alternate activities are developed when full accessibility is not feasible",
    er.rubric_dimension = null, er.lead_in = "At the Established level, the campus has a structured process for addressing accessibility of emerging instructional technologies."
MERGE (si)-[:has_evidence_requirement]->(er);
MATCH (si:SuccessIndicator {composite_key: "5.14-ins"})
MERGE (er:EvidenceRequirement {handle: "evidence:5.14-ins:established:4"})
  ON CREATE SET er.unique_id = randomUUID()
SET er.composite_key = "5.14-ins", er.level = "established", er.seq = 4,
    er.element = null, er.requirement = "Learning outcomes are equivalent for all students",
    er.rubric_dimension = null, er.lead_in = "At the Established level, the campus has a structured process for addressing accessibility of emerging instructional technologies."
MERGE (si)-[:has_evidence_requirement]->(er);
MATCH (si:SuccessIndicator {composite_key: "5.14-ins"})
MERGE (er:EvidenceRequirement {handle: "evidence:5.14-ins:established:5"})
  ON CREATE SET er.unique_id = randomUUID()
SET er.composite_key = "5.14-ins", er.level = "established", er.seq = 5,
    er.element = null, er.requirement = "Faculty receive guidance and support throughout the process",
    er.rubric_dimension = null, er.lead_in = "At the Established level, the campus has a structured process for addressing accessibility of emerging instructional technologies."
MERGE (si)-[:has_evidence_requirement]->(er);

// --- 5.15-ins (5) ---
MATCH (si:SuccessIndicator {composite_key: "5.15-ins"})
MERGE (er:EvidenceRequirement {handle: "evidence:5.15-ins:established:1"})
  ON CREATE SET er.unique_id = randomUUID()
SET er.composite_key = "5.15-ins", er.level = "established", er.seq = 1,
    er.element = null, er.requirement = "Accessibility is evaluated during selection and adoption",
    er.rubric_dimension = null, er.lead_in = "At the Established level, the campus has a defined process for accessible publisher content."
MERGE (si)-[:has_evidence_requirement]->(er);
MATCH (si:SuccessIndicator {composite_key: "5.15-ins"})
MERGE (er:EvidenceRequirement {handle: "evidence:5.15-ins:established:2"})
  ON CREATE SET er.unique_id = randomUUID()
SET er.composite_key = "5.15-ins", er.level = "established", er.seq = 2,
    er.element = null, er.requirement = "Publisher documentation is reviewed and tracked",
    er.rubric_dimension = null, er.lead_in = "At the Established level, the campus has a defined process for accessible publisher content."
MERGE (si)-[:has_evidence_requirement]->(er);
MATCH (si:SuccessIndicator {composite_key: "5.15-ins"})
MERGE (er:EvidenceRequirement {handle: "evidence:5.15-ins:established:3"})
  ON CREATE SET er.unique_id = randomUUID()
SET er.composite_key = "5.15-ins", er.level = "established", er.seq = 3,
    er.element = null, er.requirement = "Remediation or alternate access is planned proactively",
    er.rubric_dimension = null, er.lead_in = "At the Established level, the campus has a defined process for accessible publisher content."
MERGE (si)-[:has_evidence_requirement]->(er);
MATCH (si:SuccessIndicator {composite_key: "5.15-ins"})
MERGE (er:EvidenceRequirement {handle: "evidence:5.15-ins:established:4"})
  ON CREATE SET er.unique_id = randomUUID()
SET er.composite_key = "5.15-ins", er.level = "established", er.seq = 4,
    er.element = null, er.requirement = "Faculty are supported in making accessible choices",
    er.rubric_dimension = null, er.lead_in = "At the Established level, the campus has a defined process for accessible publisher content."
MERGE (si)-[:has_evidence_requirement]->(er);
MATCH (si:SuccessIndicator {composite_key: "5.15-ins"})
MERGE (er:EvidenceRequirement {handle: "evidence:5.15-ins:established:5"})
  ON CREATE SET er.unique_id = randomUUID()
SET er.composite_key = "5.15-ins", er.level = "established", er.seq = 5,
    er.element = null, er.requirement = "Processes align with procurement and instructional timelines",
    er.rubric_dimension = null, er.lead_in = "At the Established level, the campus has a defined process for accessible publisher content."
MERGE (si)-[:has_evidence_requirement]->(er);

// --- 5.17-ins (5) ---
MATCH (si:SuccessIndicator {composite_key: "5.17-ins"})
MERGE (er:EvidenceRequirement {handle: "evidence:5.17-ins:established:1"})
  ON CREATE SET er.unique_id = randomUUID()
SET er.composite_key = "5.17-ins", er.level = "established", er.seq = 1,
    er.element = null, er.requirement = "Accessible syllabi are available at the beginning of each term",
    er.rubric_dimension = null, er.lead_in = "At the Established level, the campus has a consistent process for accessible syllabi delivery."
MERGE (si)-[:has_evidence_requirement]->(er);
MATCH (si:SuccessIndicator {composite_key: "5.17-ins"})
MERGE (er:EvidenceRequirement {handle: "evidence:5.17-ins:established:2"})
  ON CREATE SET er.unique_id = randomUUID()
SET er.composite_key = "5.17-ins", er.level = "established", er.seq = 2,
    er.element = null, er.requirement = "Faculty use standardized templates or guidance",
    er.rubric_dimension = null, er.lead_in = "At the Established level, the campus has a consistent process for accessible syllabi delivery."
MERGE (si)-[:has_evidence_requirement]->(er);
MATCH (si:SuccessIndicator {composite_key: "5.17-ins"})
MERGE (er:EvidenceRequirement {handle: "evidence:5.17-ins:established:3"})
  ON CREATE SET er.unique_id = randomUUID()
SET er.composite_key = "5.17-ins", er.level = "established", er.seq = 3,
    er.element = null, er.requirement = "Syllabi are posted within the university approved LMS",
    er.rubric_dimension = null, er.lead_in = "At the Established level, the campus has a consistent process for accessible syllabi delivery."
MERGE (si)-[:has_evidence_requirement]->(er);
MATCH (si:SuccessIndicator {composite_key: "5.17-ins"})
MERGE (er:EvidenceRequirement {handle: "evidence:5.17-ins:established:4"})
  ON CREATE SET er.unique_id = randomUUID()
SET er.composite_key = "5.17-ins", er.level = "established", er.seq = 4,
    er.element = null, er.requirement = "Accessibility expectations are clearly communicated",
    er.rubric_dimension = null, er.lead_in = "At the Established level, the campus has a consistent process for accessible syllabi delivery."
MERGE (si)-[:has_evidence_requirement]->(er);
MATCH (si:SuccessIndicator {composite_key: "5.17-ins"})
MERGE (er:EvidenceRequirement {handle: "evidence:5.17-ins:established:5"})
  ON CREATE SET er.unique_id = randomUUID()
SET er.composite_key = "5.17-ins", er.level = "established", er.seq = 5,
    er.element = null, er.requirement = "The process supports early access and student success",
    er.rubric_dimension = null, er.lead_in = "At the Established level, the campus has a consistent process for accessible syllabi delivery."
MERGE (si)-[:has_evidence_requirement]->(er);

// --- 6.10-ins (4) ---
MATCH (si:SuccessIndicator {composite_key: "6.10-ins"})
MERGE (er:EvidenceRequirement {handle: "evidence:6.10-ins:established:1"})
  ON CREATE SET er.unique_id = randomUUID()
SET er.composite_key = "6.10-ins", er.level = "established", er.seq = 1,
    er.element = "Position", er.requirement = "Responsibility for evaluating the accessibility of LTIs and external LMS tools is formally assigned and documented across relevant roles.",
    er.rubric_dimension = "resources", er.lead_in = null
MERGE (si)-[:has_evidence_requirement]->(er);
MATCH (si:SuccessIndicator {composite_key: "6.10-ins"})
MERGE (er:EvidenceRequirement {handle: "evidence:6.10-ins:established:2"})
  ON CREATE SET er.unique_id = randomUUID()
SET er.composite_key = "6.10-ins", er.level = "established", er.seq = 2,
    er.element = "Budget", er.requirement = "Identified staff time and resources support ongoing evaluation of third-party tools used in courses.",
    er.rubric_dimension = "resources", er.lead_in = null
MERGE (si)-[:has_evidence_requirement]->(er);
MATCH (si:SuccessIndicator {composite_key: "6.10-ins"})
MERGE (er:EvidenceRequirement {handle: "evidence:6.10-ins:established:3"})
  ON CREATE SET er.unique_id = randomUUID()
SET er.composite_key = "6.10-ins", er.level = "established", er.seq = 3,
    er.element = "Procedures", er.requirement = "A complete, documented process requires accessibility evaluation of LTIs and external applications prior to approval and use, aligned with Section 508 and WCAG 2.1 AA.",
    er.rubric_dimension = "procedures", er.lead_in = null
MERGE (si)-[:has_evidence_requirement]->(er);
MATCH (si:SuccessIndicator {composite_key: "6.10-ins"})
MERGE (er:EvidenceRequirement {handle: "evidence:6.10-ins:established:4"})
  ON CREATE SET er.unique_id = randomUUID()
SET er.composite_key = "6.10-ins", er.level = "established", er.seq = 4,
    er.element = "Output", er.requirement = "Evidence showing that LMS-integrated tools are consistently reviewed, approved, and tracked based on accessibility, reducing the use of inaccessible third-party content.",
    er.rubric_dimension = "documentation_evidence", er.lead_in = null
MERGE (si)-[:has_evidence_requirement]->(er);

// --- 6.2-ins (4) ---
MATCH (si:SuccessIndicator {composite_key: "6.2-ins"})
MERGE (er:EvidenceRequirement {handle: "evidence:6.2-ins:established:1"})
  ON CREATE SET er.unique_id = randomUUID()
SET er.composite_key = "6.2-ins", er.level = "established", er.seq = 1,
    er.element = "Position", er.requirement = "Responsibility for ensuring accessibility in new course material selection and creation is formally assigned and documented across faculty support, instructional design, and procurement roles.",
    er.rubric_dimension = "resources", er.lead_in = null
MERGE (si)-[:has_evidence_requirement]->(er);
MATCH (si:SuccessIndicator {composite_key: "6.2-ins"})
MERGE (er:EvidenceRequirement {handle: "evidence:6.2-ins:established:2"})
  ON CREATE SET er.unique_id = randomUUID()
SET er.composite_key = "6.2-ins", er.level = "established", er.seq = 2,
    er.element = "Budget", er.requirement = "Identified staff time and resources support accessibility review and consultation during new course development.",
    er.rubric_dimension = "resources", er.lead_in = null
MERGE (si)-[:has_evidence_requirement]->(er);
MATCH (si:SuccessIndicator {composite_key: "6.2-ins"})
MERGE (er:EvidenceRequirement {handle: "evidence:6.2-ins:established:3"})
  ON CREATE SET er.unique_id = randomUUID()
SET er.composite_key = "6.2-ins", er.level = "established", er.seq = 3,
    er.element = "Procedures", er.requirement = "A complete, documented process requires accessibility verification of instructional materials at the point of adoption, aligned with Section 508 and WCAG 2.1 AA.",
    er.rubric_dimension = "procedures", er.lead_in = null
MERGE (si)-[:has_evidence_requirement]->(er);
MATCH (si:SuccessIndicator {composite_key: "6.2-ins"})
MERGE (er:EvidenceRequirement {handle: "evidence:6.2-ins:established:4"})
  ON CREATE SET er.unique_id = randomUUID()
SET er.composite_key = "6.2-ins", er.level = "established", er.seq = 4,
    er.element = "Output", er.requirement = "Records or reports demonstrating that new courses consistently launch with instructional materials that meet accessibility standards, minimizing the need for post hoc remediation.",
    er.rubric_dimension = "documentation_evidence", er.lead_in = null
MERGE (si)-[:has_evidence_requirement]->(er);

// --- 6.4-ins (4) ---
MATCH (si:SuccessIndicator {composite_key: "6.4-ins"})
MERGE (er:EvidenceRequirement {handle: "evidence:6.4-ins:established:1"})
  ON CREATE SET er.unique_id = randomUUID()
SET er.composite_key = "6.4-ins", er.level = "established", er.seq = 1,
    er.element = "Position", er.requirement = "Responsibility for accessibility review and remediation during course revisions is formally assigned and documented across relevant roles.",
    er.rubric_dimension = "resources", er.lead_in = null
MERGE (si)-[:has_evidence_requirement]->(er);
MATCH (si:SuccessIndicator {composite_key: "6.4-ins"})
MERGE (er:EvidenceRequirement {handle: "evidence:6.4-ins:established:2"})
  ON CREATE SET er.unique_id = randomUUID()
SET er.composite_key = "6.4-ins", er.level = "established", er.seq = 2,
    er.element = "Budget", er.requirement = "Identified staff time or resources support accessibility review and remediation activities for course updates.",
    er.rubric_dimension = "resources", er.lead_in = null
MERGE (si)-[:has_evidence_requirement]->(er);
MATCH (si:SuccessIndicator {composite_key: "6.4-ins"})
MERGE (er:EvidenceRequirement {handle: "evidence:6.4-ins:established:3"})
  ON CREATE SET er.unique_id = randomUUID()
SET er.composite_key = "6.4-ins", er.level = "established", er.seq = 3,
    er.element = "Procedures", er.requirement = "A complete, documented process requires accessibility review and remediation of course materials prior to posting during course revision.",
    er.rubric_dimension = "procedures", er.lead_in = null
MERGE (si)-[:has_evidence_requirement]->(er);
MATCH (si:SuccessIndicator {composite_key: "6.4-ins"})
MERGE (er:EvidenceRequirement {handle: "evidence:6.4-ins:established:4"})
  ON CREATE SET er.unique_id = randomUUID()
SET er.composite_key = "6.4-ins", er.level = "established", er.seq = 4,
    er.element = "Output", er.requirement = "Records or reports showing that revised course materials are consistently reviewed and remediated for accessibility before being made available to students.",
    er.rubric_dimension = "documentation_evidence", er.lead_in = null
MERGE (si)-[:has_evidence_requirement]->(er);

// --- 6.5-ins (4) ---
MATCH (si:SuccessIndicator {composite_key: "6.5-ins"})
MERGE (er:EvidenceRequirement {handle: "evidence:6.5-ins:established:1"})
  ON CREATE SET er.unique_id = randomUUID()
SET er.composite_key = "6.5-ins", er.level = "established", er.seq = 1,
    er.element = "Position", er.requirement = "Responsibility for supporting and ensuring accessibility during course redesign is formally assigned and documented across instructional design and faculty support roles.",
    er.rubric_dimension = "resources", er.lead_in = null
MERGE (si)-[:has_evidence_requirement]->(er);
MATCH (si:SuccessIndicator {composite_key: "6.5-ins"})
MERGE (er:EvidenceRequirement {handle: "evidence:6.5-ins:established:2"})
  ON CREATE SET er.unique_id = randomUUID()
SET er.composite_key = "6.5-ins", er.level = "established", er.seq = 2,
    er.element = "Budget", er.requirement = "Identified staff time and resources support accessibility-focused course redesign efforts.",
    er.rubric_dimension = "resources", er.lead_in = null
MERGE (si)-[:has_evidence_requirement]->(er);
MATCH (si:SuccessIndicator {composite_key: "6.5-ins"})
MERGE (er:EvidenceRequirement {handle: "evidence:6.5-ins:established:3"})
  ON CREATE SET er.unique_id = randomUUID()
SET er.composite_key = "6.5-ins", er.level = "established", er.seq = 3,
    er.element = "Procedures", er.requirement = "A complete, documented process integrates accessibility requirements into all stages of course redesign, aligned with Section 508 and WCAG 2.1 AA.",
    er.rubric_dimension = "procedures", er.lead_in = null
MERGE (si)-[:has_evidence_requirement]->(er);
MATCH (si:SuccessIndicator {composite_key: "6.5-ins"})
MERGE (er:EvidenceRequirement {handle: "evidence:6.5-ins:established:4"})
  ON CREATE SET er.unique_id = randomUUID()
SET er.composite_key = "6.5-ins", er.level = "established", er.seq = 4,
    er.element = "Output", er.requirement = "Pre- and post-redesign metrics or reports demonstrating that redesigned courses consistently incorporate accessibility best practices at the structural, content, and interaction levels.",
    er.rubric_dimension = "documentation_evidence", er.lead_in = null
MERGE (si)-[:has_evidence_requirement]->(er);

// --- 6.7-ins (4) ---
MATCH (si:SuccessIndicator {composite_key: "6.7-ins"})
MERGE (er:EvidenceRequirement {handle: "evidence:6.7-ins:established:1"})
  ON CREATE SET er.unique_id = randomUUID()
SET er.composite_key = "6.7-ins", er.level = "established", er.seq = 1,
    er.element = "Position", er.requirement = "Responsibility for conducting course accessibility evaluations is formally assigned and documented across relevant roles.",
    er.rubric_dimension = "resources", er.lead_in = null
MERGE (si)-[:has_evidence_requirement]->(er);
MATCH (si:SuccessIndicator {composite_key: "6.7-ins"})
MERGE (er:EvidenceRequirement {handle: "evidence:6.7-ins:established:2"})
  ON CREATE SET er.unique_id = randomUUID()
SET er.composite_key = "6.7-ins", er.level = "established", er.seq = 2,
    er.element = "Budget", er.requirement = "Identified tools and staff time are allocated to support ongoing automated and manual evaluation activities.",
    er.rubric_dimension = "resources", er.lead_in = null
MERGE (si)-[:has_evidence_requirement]->(er);
MATCH (si:SuccessIndicator {composite_key: "6.7-ins"})
MERGE (er:EvidenceRequirement {handle: "evidence:6.7-ins:established:3"})
  ON CREATE SET er.unique_id = randomUUID()
SET er.composite_key = "6.7-ins", er.level = "established", er.seq = 3,
    er.element = "Procedures", er.requirement = "A complete, documented process defines a regular evaluation schedule and required methods (automated and manual) for identifying accessibility issues.",
    er.rubric_dimension = "procedures", er.lead_in = null
MERGE (si)-[:has_evidence_requirement]->(er);
MATCH (si:SuccessIndicator {composite_key: "6.7-ins"})
MERGE (er:EvidenceRequirement {handle: "evidence:6.7-ins:established:4"})
  ON CREATE SET er.unique_id = randomUUID()
SET er.composite_key = "6.7-ins", er.level = "established", er.seq = 4,
    er.element = "Output", er.requirement = "Records or reports showing that accessibility evaluation results are consistently generated, tracked, and used to inform course remediation efforts.",
    er.rubric_dimension = "documentation_evidence", er.lead_in = null
MERGE (si)-[:has_evidence_requirement]->(er);

// --- 6.8-ins (4) ---
MATCH (si:SuccessIndicator {composite_key: "6.8-ins"})
MERGE (er:EvidenceRequirement {handle: "evidence:6.8-ins:established:1"})
  ON CREATE SET er.unique_id = randomUUID()
SET er.composite_key = "6.8-ins", er.level = "established", er.seq = 1,
    er.element = "Position", er.requirement = "Responsibility for prioritizing and remediating inaccessible course content is formally assigned and documented across relevant roles.",
    er.rubric_dimension = "resources", er.lead_in = null
MERGE (si)-[:has_evidence_requirement]->(er);
MATCH (si:SuccessIndicator {composite_key: "6.8-ins"})
MERGE (er:EvidenceRequirement {handle: "evidence:6.8-ins:established:2"})
  ON CREATE SET er.unique_id = randomUUID()
SET er.composite_key = "6.8-ins", er.level = "established", er.seq = 2,
    er.element = "Budget", er.requirement = "Identified staff time and resources are allocated to support ongoing remediation efforts.",
    er.rubric_dimension = "resources", er.lead_in = null
MERGE (si)-[:has_evidence_requirement]->(er);
MATCH (si:SuccessIndicator {composite_key: "6.8-ins"})
MERGE (er:EvidenceRequirement {handle: "evidence:6.8-ins:established:3"})
  ON CREATE SET er.unique_id = randomUUID()
SET er.composite_key = "6.8-ins", er.level = "established", er.seq = 3,
    er.element = "Procedures", er.requirement = "A complete, documented process defines how accessibility issues are prioritized and remediated based on impact, risk, and course context.",
    er.rubric_dimension = "procedures", er.lead_in = null
MERGE (si)-[:has_evidence_requirement]->(er);
MATCH (si:SuccessIndicator {composite_key: "6.8-ins"})
MERGE (er:EvidenceRequirement {handle: "evidence:6.8-ins:established:4"})
  ON CREATE SET er.unique_id = randomUUID()
SET er.composite_key = "6.8-ins", er.level = "established", er.seq = 4,
    er.element = "Output", er.requirement = "Records or reports showing that accessibility issues are consistently prioritized and remediated, with progress tracked and visible across courses or programs.",
    er.rubric_dimension = "documentation_evidence", er.lead_in = null
MERGE (si)-[:has_evidence_requirement]->(er);

// --- 6.9-ins (4) ---
MATCH (si:SuccessIndicator {composite_key: "6.9-ins"})
MERGE (er:EvidenceRequirement {handle: "evidence:6.9-ins:established:1"})
  ON CREATE SET er.unique_id = randomUUID()
SET er.composite_key = "6.9-ins", er.level = "established", er.seq = 1,
    er.element = "Position", er.requirement = "Responsibility for initiating, approving, and implementing TAAPs is formally assigned and documented across relevant roles.",
    er.rubric_dimension = "resources", er.lead_in = null
MERGE (si)-[:has_evidence_requirement]->(er);
MATCH (si:SuccessIndicator {composite_key: "6.9-ins"})
MERGE (er:EvidenceRequirement {handle: "evidence:6.9-ins:established:2"})
  ON CREATE SET er.unique_id = randomUUID()
SET er.composite_key = "6.9-ins", er.level = "established", er.seq = 2,
    er.element = "Budget", er.requirement = "Identified staff time and resources support the development and delivery of alternate access solutions.",
    er.rubric_dimension = "resources", er.lead_in = null
MERGE (si)-[:has_evidence_requirement]->(er);
MATCH (si:SuccessIndicator {composite_key: "6.9-ins"})
MERGE (er:EvidenceRequirement {handle: "evidence:6.9-ins:established:3"})
  ON CREATE SET er.unique_id = randomUUID()
SET er.composite_key = "6.9-ins", er.level = "established", er.seq = 3,
    er.element = "Procedures", er.requirement = "A complete, documented process defines when and how TAAPs are created, implemented, and tracked using a standardized template.",
    er.rubric_dimension = "procedures", er.lead_in = null
MERGE (si)-[:has_evidence_requirement]->(er);
MATCH (si:SuccessIndicator {composite_key: "6.9-ins"})
MERGE (er:EvidenceRequirement {handle: "evidence:6.9-ins:established:4"})
  ON CREATE SET er.unique_id = randomUUID()
SET er.composite_key = "6.9-ins", er.level = "established", er.seq = 4,
    er.element = "Output", er.requirement = "TAAPs are consistently used to provide timely, equivalent access for students when accessibility barriers cannot be immediately resolved. All TAAPs are centrally logged, with accessible copies stored in an electronic repository and available to ATI stakeholders.",
    er.rubric_dimension = "documentation_evidence", er.lead_in = null
MERGE (si)-[:has_evidence_requirement]->(er);

// --- 7.11-ins (4) ---
MATCH (si:SuccessIndicator {composite_key: "7.11-ins"})
MERGE (er:EvidenceRequirement {handle: "evidence:7.11-ins:established:1"})
  ON CREATE SET er.unique_id = randomUUID()
SET er.composite_key = "7.11-ins", er.level = "established", er.seq = 1,
    er.element = "Position", er.requirement = "Responsibility for ensuring accessibility of digital library assets is formally assigned and documented across library and accessibility roles.",
    er.rubric_dimension = "resources", er.lead_in = null
MERGE (si)-[:has_evidence_requirement]->(er);
MATCH (si:SuccessIndicator {composite_key: "7.11-ins"})
MERGE (er:EvidenceRequirement {handle: "evidence:7.11-ins:established:2"})
  ON CREATE SET er.unique_id = randomUUID()
SET er.composite_key = "7.11-ins", er.level = "established", er.seq = 2,
    er.element = "Budget", er.requirement = "Identified staff time and resources support accessible acquisition, digitization, and remediation of library materials.",
    er.rubric_dimension = "resources", er.lead_in = null
MERGE (si)-[:has_evidence_requirement]->(er);
MATCH (si:SuccessIndicator {composite_key: "7.11-ins"})
MERGE (er:EvidenceRequirement {handle: "evidence:7.11-ins:established:3"})
  ON CREATE SET er.unique_id = randomUUID()
SET er.composite_key = "7.11-ins", er.level = "established", er.seq = 3,
    er.element = "Procedures", er.requirement = "A complete, documented process integrates accessibility requirements into library workflows for acquiring, creating, digitizing, and maintaining instructional materials.",
    er.rubric_dimension = "procedures", er.lead_in = null
MERGE (si)-[:has_evidence_requirement]->(er);
MATCH (si:SuccessIndicator {composite_key: "7.11-ins"})
MERGE (er:EvidenceRequirement {handle: "evidence:7.11-ins:established:4"})
  ON CREATE SET er.unique_id = randomUUID()
SET er.composite_key = "7.11-ins", er.level = "established", er.seq = 4,
    er.element = "Output", er.requirement = "Records or reports demonstrating that digital library assets used in courses are consistently accessible or supported by proactive accessibility processes, reducing the need for reactive remediation.",
    er.rubric_dimension = "documentation_evidence", er.lead_in = null
MERGE (si)-[:has_evidence_requirement]->(er);

// --- 8.11-pro (6) ---
MATCH (si:SuccessIndicator {composite_key: "8.11-pro"})
MERGE (er:EvidenceRequirement {handle: "evidence:8.11-pro:established:1"})
  ON CREATE SET er.unique_id = randomUUID()
SET er.composite_key = "8.11-pro", er.level = "established", er.seq = 1,
    er.element = "Position", er.requirement = "Roles responsible for oversight include the ATI Procurement Lead, Auxiliary Procurement Managers, and campus buyers, with duties reflected in job descriptions.",
    er.rubric_dimension = "resources", er.lead_in = null
MERGE (si)-[:has_evidence_requirement]->(er);
MATCH (si:SuccessIndicator {composite_key: "8.11-pro"})
MERGE (er:EvidenceRequirement {handle: "evidence:8.11-pro:established:2"})
  ON CREATE SET er.unique_id = randomUUID()
SET er.composite_key = "8.11-pro", er.level = "established", er.seq = 2,
    er.element = "Budget", er.requirement = "Resources allocated for auxiliary training, outreach, and tracking tool integration.",
    er.rubric_dimension = "resources", er.lead_in = null
MERGE (si)-[:has_evidence_requirement]->(er);
MATCH (si:SuccessIndicator {composite_key: "8.11-pro"})
MERGE (er:EvidenceRequirement {handle: "evidence:8.11-pro:established:3"})
  ON CREATE SET er.unique_id = randomUUID()
SET er.composite_key = "8.11-pro", er.level = "established", er.seq = 3,
    er.element = "Procedures", er.requirement = "A documented, campus-wide procedure ensures that all ICT acquisitions, regardless of funding source or cost, undergo accessibility review using the same evaluation criteria.",
    er.rubric_dimension = "procedures", er.lead_in = null
MERGE (si)-[:has_evidence_requirement]->(er);
MATCH (si:SuccessIndicator {composite_key: "8.11-pro"})
MERGE (er:EvidenceRequirement {handle: "evidence:8.11-pro:established:4"})
  ON CREATE SET er.unique_id = randomUUID()
SET er.composite_key = "8.11-pro", er.level = "established", er.seq = 4,
    er.element = "Output", er.requirement = "All purchasing pathways demonstrate compliance with ATI procurement processes, evidenced by audit logs and centralized reports.",
    er.rubric_dimension = "documentation_evidence", er.lead_in = null
MERGE (si)-[:has_evidence_requirement]->(er);
MATCH (si:SuccessIndicator {composite_key: "8.11-pro"})
MERGE (er:EvidenceRequirement {handle: "evidence:8.11-pro:managed:1"})
  ON CREATE SET er.unique_id = randomUUID()
SET er.composite_key = "8.11-pro", er.level = "managed", er.seq = 1,
    er.element = "Metrics", er.requirement = "Track percentage of ICT acquisitions reviewed across all channels, and measure reductions in unreviewed or unreported procurements.",
    er.rubric_dimension = "documentation_evidence", er.lead_in = null
MERGE (si)-[:has_evidence_requirement]->(er);
MATCH (si:SuccessIndicator {composite_key: "8.11-pro"})
MERGE (er:EvidenceRequirement {handle: "evidence:8.11-pro:optimizing:1"})
  ON CREATE SET er.unique_id = randomUUID()
SET er.composite_key = "8.11-pro", er.level = "optimizing", er.seq = 1,
    er.element = "Administrative Review", er.requirement = "Annual reviews evaluate participation from auxiliary entities and document corrective actions where gaps are found.",
    er.rubric_dimension = "procedures", er.lead_in = null
MERGE (si)-[:has_evidence_requirement]->(er);

// --- 8.12-pro (6) ---
MATCH (si:SuccessIndicator {composite_key: "8.12-pro"})
MERGE (er:EvidenceRequirement {handle: "evidence:8.12-pro:established:1"})
  ON CREATE SET er.unique_id = randomUUID()
SET er.composite_key = "8.12-pro", er.level = "established", er.seq = 1,
    er.element = "Position", er.requirement = "Designated ATI Procurement Leads and system procurement liaisons are formally responsible for accessibility review coordination.",
    er.rubric_dimension = "resources", er.lead_in = null
MERGE (si)-[:has_evidence_requirement]->(er);
MATCH (si:SuccessIndicator {composite_key: "8.12-pro"})
MERGE (er:EvidenceRequirement {handle: "evidence:8.12-pro:established:2"})
  ON CREATE SET er.unique_id = randomUUID()
SET er.composite_key = "8.12-pro", er.level = "established", er.seq = 2,
    er.element = "Budget", er.requirement = "Resources allocated for staff participation in systemwide review processes, tool licenses, and cross-campus collaboration.",
    er.rubric_dimension = "resources", er.lead_in = null
MERGE (si)-[:has_evidence_requirement]->(er);
MATCH (si:SuccessIndicator {composite_key: "8.12-pro"})
MERGE (er:EvidenceRequirement {handle: "evidence:8.12-pro:established:3"})
  ON CREATE SET er.unique_id = randomUUID()
SET er.composite_key = "8.12-pro", er.level = "established", er.seq = 3,
    er.element = "Procedures", er.requirement = "Documented procedures ensure all ICT acquisitions through the CSU Systemwide platform undergo the same accessibility conformance checks as campus procurements.",
    er.rubric_dimension = "procedures", er.lead_in = null
MERGE (si)-[:has_evidence_requirement]->(er);
MATCH (si:SuccessIndicator {composite_key: "8.12-pro"})
MERGE (er:EvidenceRequirement {handle: "evidence:8.12-pro:established:4"})
  ON CREATE SET er.unique_id = randomUUID()
SET er.composite_key = "8.12-pro", er.level = "established", er.seq = 4,
    er.element = "Output", er.requirement = "Accessibility documentation (ACRs, TAAPs, Roadmaps) attached to each systemwide purchase record.",
    er.rubric_dimension = "documentation_evidence", er.lead_in = null
MERGE (si)-[:has_evidence_requirement]->(er);
MATCH (si:SuccessIndicator {composite_key: "8.12-pro"})
MERGE (er:EvidenceRequirement {handle: "evidence:8.12-pro:managed:1"})
  ON CREATE SET er.unique_id = randomUUID()
SET er.composite_key = "8.12-pro", er.level = "managed", er.seq = 1,
    er.element = "Metrics", er.requirement = "Track percentage of systemwide procurements reviewed for accessibility and time-to-completion of reviews.",
    er.rubric_dimension = "documentation_evidence", er.lead_in = null
MERGE (si)-[:has_evidence_requirement]->(er);
MATCH (si:SuccessIndicator {composite_key: "8.12-pro"})
MERGE (er:EvidenceRequirement {handle: "evidence:8.12-pro:optimizing:1"})
  ON CREATE SET er.unique_id = randomUUID()
SET er.composite_key = "8.12-pro", er.level = "optimizing", er.seq = 1,
    er.element = "Administrative Review", er.requirement = "Annual review to assess compliance and identify opportunities for standardization or improvement.",
    er.rubric_dimension = "procedures", er.lead_in = null
MERGE (si)-[:has_evidence_requirement]->(er);
