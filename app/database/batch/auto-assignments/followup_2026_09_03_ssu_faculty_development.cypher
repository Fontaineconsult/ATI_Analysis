// =====================================================================================
// Follow-up: Sonoma State Instructional Materials, 3 September 2026
// Faculty Development x SSU. Saved as a DRAFT. Not sent.
//
// Meeting minutes 1b2bb494575a4f30b012f2d4878868ed
// Interview guide  102bec0f46184989b7315fc25f283fd4
// Recipients: John Lynch, Sandra Ayala, Tim Hensel (the guide's room)
//
// Two asks in this message had no Query node behind them, because they came from the
// interview guide's bar elements rather than from anything said in the room. They are
// created here so the chase stays measurable:
//   - the Canvas Remediation Manual link (8.3 Documentation, empty at Established)
//   - the owner of the Canvas professional development sequence (8.12 Resources)
//
// Recommendation 2b3fc644 (RTP recognition) is mentioned in the message but NOT wired,
// because it is stated for John's awareness rather than asked. Only asks are wired.
// =====================================================================================


// --- New Query: the Canvas Remediation Manual link ---
MATCH (wgp:WorkingGroupPlan {plan_identifier: "2025-2026-ssu-ins"})
MERGE (q:Query {question: "Can you send the Canvas Remediation Manual link, or an export of it?"})-[:raised_under_plan]->(wgp)
ON CREATE SET q.unique_id = replace(randomUUID(), "-", ""),
              q.status = "open",
              q.category = "artifact_request",
              q.date_raised = date("2026-09-03"),
              q.detail = "8.3-ins is graded Established and the Canvas Remediation Manual is the training material carrying it, but the node has no documentation and no link. It is a Canvas course, so nobody outside CTET can reach it, and Established asks that documentation sit in a campus electronic location. A June 2026 note records the manual being updated for the Ally to UDOIT and YuJa to Panopto tool changes, so the version in use may differ from the version described. Raised from the interview guide bar sweep rather than in the room."
WITH q
MATCH (y:YearSuccessEvidence {year_identifier: "2025-2026-8.3-ins-ssu"})
MERGE (q)-[:addresses_evidence]->(y)
WITH q
MATCH (a:Person {name: "Tim Hensel"})
MERGE (q)-[:answerable_by]->(a);

// --- New Query: who owns the Canvas professional development sequence ---
MATCH (wgp:WorkingGroupPlan {plan_identifier: "2025-2026-ssu-ins"})
MERGE (q:Query {question: "Who owns the Canvas professional development sequence, and is running it in their position description?"})-[:raised_under_plan]->(wgp)
ON CREATE SET q.unique_id = replace(randomUUID(), "-", ""),
              q.status = "open",
              q.category = "information_gap",
              q.date_raised = date("2026-09-03"),
              q.detail = "8.12-ins is graded Established on the three-tier sequence and its stipends. Established also requires ATI tasks in campus job descriptions, and the sequence has no owner recorded on either the professional development node or CTET QLT Certification. Tim Hensel position description now covers accessible instructional materials, which answers the requirement for the remediation work but not for the faculty development sequence. Raised from the interview guide bar sweep rather than in the room."
WITH q
MATCH (y:YearSuccessEvidence {year_identifier: "2025-2026-8.12-ins-ssu"})
MERGE (q)-[:addresses_evidence]->(y)
WITH q
MATCH (a:Person {name: "John Lynch"})
MERGE (q)-[:answerable_by]->(a);


// --- The follow-up ---
MERGE (f:FollowUp {subject: "Follow-up: Sonoma State Instructional Materials, 3 September (Faculty Development \u00b7 SSU)"})
ON CREATE SET f.unique_id = replace(randomUUID(), "-", ""),
              f.status = "draft",
              f.date_created = date("2026-09-03"),
              f.generated_at = "2026-09-03T00:00:00"
SET f.body_markdown = "Hi John, Sandy, Tim,\n\nThank you for the time on 3 September. I have put the conversation into the record, and Tim's position description landing the day before turned out to matter more than it looked, so there is a note on that below.\n\n## Action items\n\n| Action | Who | About |\n| --- | --- | --- |\n| Send the New Faculty Orientation agenda | **John** | 8.11-ins |\n| Tell me who owns the Canvas professional development sequence, and whether running it is in their position description | **John** | 8.12-ins |\n| Tell me who would own a training path for staff | **John** | 8.14-ins |\n| Send the Canvas Remediation Manual link, or an export of it | **Tim** | 8.3-ins |\n| Send a before-and-after PDF pair once you have one | **Tim** | 7.3-ins |\n| Send prior years of the President's Report materials | **Sandy** | 9.2-ins |\n\n---\n\n## 8.11-ins: accessibility in faculty orientation\n\nGraded **Defined**. [Public record](https://dprc-server.ad.sfsu.edu/ati/reports/public/ssu/2025-2026/instructional-materials/8/11)\n\n| Implementation Evidence | Documentation |\n| --- | --- |\n| [New Faculty Orientation Accessibility Segment](https://dprc-server.ad.sfsu.edu/ati/reports/public/implementation/Process/70208061c96c46f98ec7b4ee61baefce) | None on file |\n\n**John, please send the New Faculty Orientation agenda.**\n\nYou described the segment fully enough that it is now on the record as a practice with you named as responsible: your fifteen minutes on what accessibility means and how to implement it in Canvas, the separate hour Disability Services delivers on compliance obligations, and the textbook ordering deadlines covered alongside. What is not on the record is a single document. The agenda fixes that. An attendance list from the August cycle would go further, because it shows the segment reaches people rather than that it exists.\n\n---\n\n## 8.12-ins: accessibility in faculty development\n\nGraded **Established**. [Public record](https://dprc-server.ad.sfsu.edu/ati/reports/public/ssu/2025-2026/instructional-materials/8/12)\n\n| Implementation Evidence | Documentation |\n| --- | --- |\n| [Canvas Professional Development sequence, Levels 1-3](https://dprc-server.ad.sfsu.edu/ati/reports/public/implementation/Service/407119b5316d45f69710530392f1a027) | [Online and hybrid teaching](https://ctet.sonoma.edu/teaching/online-hybrid-teaching) |\n| [CTET QLT Certification](https://dprc-server.ad.sfsu.edu/ati/reports/public/implementation/Service/c95d683baf15466a82335b5db607ca5e) | [QLT at CTET](https://ctet.sonoma.edu/quality-learning-teaching-qlt) \u00b7 [QLT rubric](https://ocs.calstate.edu/rubrics/qlt) |\n| [CTET Accessibility Workshop Series](https://dprc-server.ad.sfsu.edu/ati/reports/public/implementation/Service/c6bc5bce8b4441698e0c4b7ab4911504) | None on file |\n\n**John, who owns the Canvas professional development sequence, and is running it written into that person's position description?**\n\nThe grade rests on the three tiers and the stipends, which you confirmed still hold at 300, 300 and 400 dollars with the 750 dollar external QLT review paid by SSU. Established also asks that ATI tasks appear in job descriptions, and that is the one element here with nothing behind it. Tim's position description now covers accessible instructional materials, which answers it for the remediation side, but the sequence itself has no owner recorded. A name and a line in a position description settles this without further argument.\n\nSandy's standing recommendation, that accessibility work should count in RTP evaluation rather than rest on goodwill, is recorded here and open.\n\n---\n\n## 8.3-ins: training materials for creating, adopting and remediating\n\nGraded **Established**. [Public record](https://dprc-server.ad.sfsu.edu/ati/reports/public/ssu/2025-2026/instructional-materials/8/3)\n\n| Implementation Evidence | Documentation |\n| --- | --- |\n| [Canvas Remediation Manual](https://dprc-server.ad.sfsu.edu/ati/reports/public/implementation/Guidance/7e6f7331-e420-4a48-9196-dae2cea14047) | None on file |\n| [Instructional Materials Subcommittee](https://dprc-server.ad.sfsu.edu/ati/reports/public/implementation/Process/66fad208a0684554b5d8c8f6d4ad2dc5) | None on file |\n| [Accessible Syllabus Policy](https://dprc-server.ad.sfsu.edu/ati/reports/public/implementation/InternalPolicy/d16bd34bec49433dab9f470f978f2d1e) | [SSU syllabus policy](https://catalog.sonoma.edu/content.php?catoid=8&navoid=926#syllabus-policy) \u00b7 [Instructional materials accessibility](https://accessibility.sonoma.edu/instructional-materials) |\n| [Accessible Syllabus Template](https://dprc-server.ad.sfsu.edu/ati/reports/public/implementation/Service/74e8d022ab6947459d4f020bac84be5f) | [Template page](https://accessibility.sonoma.edu/instructional-materials/accessible-syllabus-template) \u00b7 [Word file](https://accessibility.sonoma.edu/sites/default/files/2025-01/accessible_syllabus_template_2025.docx) |\n| [ATI Faculty Responsibilities Video](https://dprc-server.ad.sfsu.edu/ati/reports/public/implementation/Guidance/1cf80e736e604855856b3709ab1cedb9) | None on file |\n\n**Tim, please send the Canvas Remediation Manual link, or an export of it.**\n\nThis indicator is graded Established and the manual is the training material carrying it, but it is a Canvas course with no link on file, so nobody outside CTET can open it. Established asks that documentation sit somewhere the campus can reach. A June note also records the manual being rewritten for the Ally to UDOIT and YuJa to Panopto changes, so I cannot tell whether the version in use matches the version described.\n\nJohn, separately, if the source file behind Sandy's printed ATI orientation piece turns up, send that too. The copy in circulation is a photograph rather than text.\n\n---\n\n## 8.14-ins: ongoing development for staff with these responsibilities\n\nGraded **Defined**. [Public record](https://dprc-server.ad.sfsu.edu/ati/reports/public/ssu/2025-2026/instructional-materials/8/14)\n\n| Implementation Evidence | Documentation |\n| --- | --- |\n| [CTET Student Worker Accessibility Training](https://dprc-server.ad.sfsu.edu/ati/reports/public/implementation/Process/9eaa486ec37742ec845a7996bf486bd7) | None on file |\n| [Canvas Professional Development sequence, Levels 1-3](https://dprc-server.ad.sfsu.edu/ati/reports/public/implementation/Service/407119b5316d45f69710530392f1a027) | [Online and hybrid teaching](https://ctet.sonoma.edu/teaching/online-hybrid-teaching) |\n\n**John, who would own a training path for staff who carry these responsibilities?**\n\nThe student side holds up. Tim runs checklist-based training against set competencies and enrols students in outside coursework as it appears, including the Cityscape and University of Utah courses over the summer. You were direct that there is no equivalent for staff, who pursue opportunities as they arise, as when Tim was funded for the Monterey conference. I have recorded that as an open gap with nobody owning it rather than as a plan, because no fix was named, and I would rather it sit there honestly than be dressed up.\n\nRead the indicator narrowly. It asks about employees with accessible instructional materials responsibilities, not about faculty, which is why the faculty workshops are not wired here.\n\n---\n\n## 7.3-ins: examples of accessible instructional materials\n\nGraded **Established**. [Public record](https://dprc-server.ad.sfsu.edu/ati/reports/public/ssu/2025-2026/instructional-materials/7/3)\n\n| Implementation Evidence | Documentation |\n| --- | --- |\n| [Accessible Syllabus Template](https://dprc-server.ad.sfsu.edu/ati/reports/public/implementation/Service/74e8d022ab6947459d4f020bac84be5f) | [Template page](https://accessibility.sonoma.edu/instructional-materials/accessible-syllabus-template) \u00b7 [Word file](https://accessibility.sonoma.edu/sites/default/files/2025-01/accessible_syllabus_template_2025.docx) |\n| [Accessible Canvas Template](https://dprc-server.ad.sfsu.edu/ati/reports/public/implementation/Service/530dfa0eae8c4094b82d0134cb48afa4) | [Canvas Commons](https://lor.instructure.com/resources/93fa0ab09d4c4b4aab7d16b09e500056?shared) |\n| [CTET Accessibility Guidance](https://dprc-server.ad.sfsu.edu/ati/reports/public/implementation/Guidance/7f494374946644c181ce970a6fb11762) | [Faculty accessibility guide](https://accessibility.sonoma.edu/faculty-accessibility-guide) \u00b7 [Documents and multimedia](https://accessibility.sonoma.edu/documents-multimedia) |\n\n**Tim, please send a before-and-after PDF pair once you have one.**\n\nYour suggestion was to keep an as-found file alongside its remediated version out of work the students already do, including the handwritten document in progress. That is precisely what this indicator asks for and it costs almost nothing to produce.\n\nI have recommended lowering this indicator from Established to Defined until such a pair exists. John was direct that Sonoma does not produce comparative examples, and that current guidance is closer to use this template or use a Canvas page instead of a PDF. A template is a good thing that is not the thing this indicator names. One stored pair takes it back up, so I expect the downgrade to be short-lived. Tell me if you read it differently.\n\n---\n\n## 9.2-ins: review and approval of the annual instructional materials plan\n\nGraded **Defined**. [Public record](https://dprc-server.ad.sfsu.edu/ati/reports/public/ssu/2025-2026/instructional-materials/9/2)\n\n| Implementation Evidence | Documentation |\n| --- | --- |\n| [SSU ATI Program Overview](https://dprc-server.ad.sfsu.edu/ati/reports/public/implementation/Guidance/50e075e9146a47c7b75f9bec239e34ea) | [ATI at Sonoma State](https://accessibility.sonoma.edu/accessible-technology-initiative-sonoma-state) \u00b7 [What can I do?](https://accessibility.sonoma.edu/what-can-i-do) |\n\n**Sandy, please send prior years of the President's Report materials.**\n\nThey show what Sonoma has been reporting and in what shape, which matters while it is still unsettled whether Sonoma keeps producing its own report. Your description of the format moving from freeform narrative to bullet-pointed markers against the year's expectations is the part I most want to see, because that structure is close to what this system already holds.\n\nJohn's point that the annual plan needs an executive committee to approve it, and that neither Sonoma nor SFBRN has one, is on the record as an open gap. That one is going to Amanda rather than to any of you.\n\nOne correction while I am here. The program overview page still names Justin Lipp as leading the Ambassador Program. If someone has taken that on, tell me who.\n\n---\n\nFour things I am chasing elsewhere, so you know they are moving:\n\n- Whether CTET gets a Verbit site license, and separately whether anyone has formally determined that automated captions meet accessibility standards. Both go to Brent, and the second decides the first.\n- Whether each campus still needs a named executive sponsor, and who holds it at Sonoma. That goes to Amanda, along with whether Sonoma keeps producing its own President's Report.\n- The California Community College training link, which Tim still needs and which I owe him.\n- The sixth of the six key components in Sandy's faculty video, which John prompted as the accessible syllabus but which did not quite land on the recording.\n\nIf any of the above misrepresents what you actually do, tell me and I will change it.\n\nThanks,\nDaniel Fontaine\n";

MATCH (f:FollowUp {subject: "Follow-up: Sonoma State Instructional Materials, 3 September (Faculty Development \u00b7 SSU)"})
MATCH (mm:MeetingMinutes {unique_id: "1b2bb494575a4f30b012f2d4878868ed"})
MERGE (f)-[:follows_up_on]->(mm);

MATCH (f:FollowUp {subject: "Follow-up: Sonoma State Instructional Materials, 3 September (Faculty Development \u00b7 SSU)"})
MATCH (g:InterviewGuide {unique_id: "102bec0f46184989b7315fc25f283fd4"})
MERGE (f)-[:derived_from]->(g);

MATCH (f:FollowUp {subject: "Follow-up: Sonoma State Instructional Materials, 3 September (Faculty Development \u00b7 SSU)"})
MATCH (c:CommunityOfPractice {name: "Faculty Development"})
MERGE (f)-[:pertains_to]->(c);

MATCH (f:FollowUp {subject: "Follow-up: Sonoma State Instructional Materials, 3 September (Faculty Development \u00b7 SSU)"})
MATCH (camp:Campus {abbreviation: "ssu"})
MERGE (f)-[:for_campus]->(camp);

MATCH (f:FollowUp {subject: "Follow-up: Sonoma State Instructional Materials, 3 September (Faculty Development \u00b7 SSU)"})
MATCH (p:Person) WHERE p.name IN ["John Lynch", "Sandra Ayala", "Tim Hensel"]
MERGE (f)-[:addressed_to]->(p);

MATCH (f:FollowUp {subject: "Follow-up: Sonoma State Instructional Materials, 3 September (Faculty Development \u00b7 SSU)"})
MATCH (d:Person {name: "Daniel Fontaine"})
MERGE (f)-[:created_by]->(d);

MATCH (f:FollowUp {subject: "Follow-up: Sonoma State Instructional Materials, 3 September (Faculty Development \u00b7 SSU)"})
MATCH (y:YearSuccessEvidence) WHERE y.year_identifier IN ["2025-2026-8.11-ins-ssu", "2025-2026-8.12-ins-ssu", "2025-2026-8.3-ins-ssu", "2025-2026-8.14-ins-ssu", "2025-2026-7.3-ins-ssu", "2025-2026-9.2-ins-ssu"]
MERGE (f)-[:covers_evidence]->(y);

MATCH (f:FollowUp {subject: "Follow-up: Sonoma State Instructional Materials, 3 September (Faculty Development \u00b7 SSU)"})
MATCH (q:Query) WHERE q.unique_id IN ["dfa6fd62ce214cfe95df5c81510e6d40", "04658f616f8448448ae7d0a1eaa495f6", "4af0ce22ec31416c9c1b9cdbdc5ced47"]
MERGE (f)-[:includes_query]->(q);

MATCH (f:FollowUp {subject: "Follow-up: Sonoma State Instructional Materials, 3 September (Faculty Development \u00b7 SSU)"})
MATCH (q:Query) WHERE q.question IN ["Can you send the Canvas Remediation Manual link, or an export of it?", "Who owns the Canvas professional development sequence, and is running it in their position description?"]
MERGE (f)-[:includes_query]->(q);

MATCH (f:FollowUp {subject: "Follow-up: Sonoma State Instructional Materials, 3 September (Faculty Development \u00b7 SSU)"})
MATCH (r:Recommendation {unique_id: "7c8b303937fa49b2b78f30dbb74cb2cd"})
MERGE (f)-[:includes_recommendation]->(r);

MATCH (f:FollowUp {subject: "Follow-up: Sonoma State Instructional Materials, 3 September (Faculty Development \u00b7 SSU)"})
MATCH (c:Concern {unique_id: "dfca1cc3aa4844009593cb67370fc699"})
MERGE (f)-[:includes_concern]->(c);
