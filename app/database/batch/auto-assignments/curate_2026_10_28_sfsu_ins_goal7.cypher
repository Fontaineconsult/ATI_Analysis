// Goal 7 status correction and evidence summaries for SFSU IM 2025-2026.

// 7.1-ins: Not Started -> Initiated
// Reason: 3 implementations wired (AIM Initiative, Course Syllabus Policies,
// Academic Continuity Plan), Andrew Roderick implements, faculty encouraged
// through website/orientation/AIM. Ad hoc activity that falls short of the
// formal policy the indicator requires, but activity beyond zero.
MATCH (yse:YearSuccessEvidence {year_identifier: '2025-2026-7.1-ins-sfsu'})-[r:status_is]->(:StatusLevel)
DELETE r
WITH yse
MATCH (sl:StatusLevel {status_level: 'Initiated'})
MERGE (yse)-[:status_is]->(sl);

// Evidence summaries for all Goal 7 YSEs.

MATCH (yse:YearSuccessEvidence {year_identifier: '2025-2026-7.1-ins-sfsu'})
SET yse.admin_review_description = "Three implementations touch this indicator: the Affordable Instructional Materials Initiative, the campus course syllabus policies, and the SF State Academic Continuity Plan. The syllabus policy references DPRC but does not address faculty responsibility for selecting or authoring accessible materials. Faculty receive encouragement through the website, orientation, new course proposals, and the AIM program. Andrew Roderick implements. No formal policy, resolution, or procedure documents faculty responsibility for accessible instructional materials. A plan for a senate policy rooted in the Title II update was abandoned. No one in Academic Affairs has been assigned ownership.";

MATCH (yse:YearSuccessEvidence {year_identifier: '2025-2026-7.3-ins-sfsu'})
SET yse.admin_review_description = "Five implementations provide tools and guidance adjacent to this indicator: the Accessible Media Quick Converter, the Accessible Syllabus Tool, CEETL courses, the DesignPLUS rollout, and public Canvas accessibility guidance. None contains what the indicator asks for: actual examples of accessible instructional materials. No process exists to create, distribute, or update such examples. The Accessible Syllabus Tool is supported but not promoted. AT treats DesignPLUS as an emergent, roughly three-year project with no written documentation. The DesignPLUS pilot with 12 faculty produced showcase videos of redesigned courses. The SFBRN ATI website is proposed to host examples in a future phase. A plan for CEETL to publish course-redesign accessibility guidance to YouTube is not started. Cristian Alvarado, Daniel Fontaine, and Kevin Connor implement.";

MATCH (yse:YearSuccessEvidence {year_identifier: '2025-2026-7.5-ins-sfsu'})
SET yse.admin_review_description = "Eight active implementations provide resources for creating accessible instructional content: JEDI PIE, New Faculty Foundation orientation, AT's Canvas remediation process, CEETL courses, the Accessible Syllabus Tool, the Accessible Media Quick Converter, public Canvas accessibility guidance, and CPaGE processes. CPaGE maintains four job aids and targets 85% accessibility on course shells. AT's remediation program covers about 4,000 courses per term with UDOIT scores trending in the mid-to-high 80s. Kevin Connor runs day-to-day remediation with six student workers. Andrew Roderick, Anoshua Chaudhuri, Ash Klein, Cristian Alvarado, and Daniel Fontaine implement, but only two of eight implementations have an assigned owner. Three retired guidance implementations are still linked as evidence. SF State's accessibility page is planned as the central hub, and AT is building a faculty-facing documentation catalog (in progress, Andrew Roderick owns). No single documented pathway ties the resources together for a faculty member. No output evidence or metrics exist.";

MATCH (yse:YearSuccessEvidence {year_identifier: '2025-2026-7.11-ins-sfsu'})
SET yse.admin_review_description = "Six active implementations address library accessibility across the asset lifecycle. Electronic theses and dissertations go through a staged process with templates and quality control before publication in ScholarWorks. The Bay Area Television Archives captioning project is roughly 80% complete against about 3,000 clips, with completion expected ahead of the April 2027 deadline. The electronic resource acquisitions procedure requires vendor accessibility documentation before purchase, with VPATs kept on file. The Library does not independently review VPAT claims; a centralized review at the Chancellor's Office is in development. When a patron reports an accessibility problem, the request arrives through Library chat or email and is routed to Ya Wang's Electronic Resources team, who contact the vendor directly. The SFBRN CSUBuy IT Accessibility Review Procedure handles procurement-level accessibility review with documented queue rules, SLAs, and communication templates. Christy Stevens, Matthew James Martin, Michael McCourt, and Ya Wang implement with no position-description flags. The intake triage runs on convention rather than written procedure, and requests are not tagged or counted. An accessibility LibGuide exists but needs a refresh.";
