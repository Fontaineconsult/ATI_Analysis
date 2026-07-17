import React from 'react';
import { List, ListItem } from '@chakra-ui/react';
import { useSettings } from '../../../context/SettingsContext';
import { AboutPage, Card, Section, Para, CodePattern, VocabTable } from './aboutPrimitives';

const TRAJECTORY_NOTES = {
    improving: 'Status is actively moving up — work is landing and maturity is rising.',
    on_track: 'Progressing as planned for the year; no intervention needed.',
    stagnant: 'No meaningful movement; the item needs attention or re-prioritization.',
    at_risk: 'Obstacles threaten the year’s outcome — flag for committee discussion.',
    failing: 'The planned approach is not working; escalate or re-plan.',
};

const PLAN_STATUS_NOTES = {
    'Not Started': 'Committed to, but no work yet.',
    'In Progress': 'Actively being worked.',
    'Complete': 'Done — record the completion year and notes.',
    'On Hold': 'Paused deliberately; expected to resume.',
    'Abandoned': 'Will not be completed — record why, so the decision is auditable.',
};

// The annual planning layer: campus plan → working-group plans → prioritized
// indicators → dated progress updates.
function PlansProgressTab() {
    const { vocab } = useSettings();

    return (
        <AboutPage
            title="Plans & Progress"
            lede="How the campus commits to a year of work, tracks its trajectory, and records what was accomplished."
        >
            <Card title="The campus plan structure">
                <Para>
                    Each campus produces one <b>Campus Plan</b> per academic year — the document
                    the executive sponsor signs and campus leadership sees. It always has exactly
                    three children, one <b>Working Group Plan</b> per committee:
                </Para>
                <CodePattern>
{`CampusPlan ("2025-2026-sfsu")
 ├── executive_summary, has_executive_sponsor ──▶ Person
 ├── has_presidents_report ──▶ Document (optional)
 ├── WorkingGroupPlan "2025-2026-sfsu-web"   ─┐
 ├── WorkingGroupPlan "2025-2026-sfsu-ins"    ├─ one per working group
 └── WorkingGroupPlan "2025-2026-sfsu-pro"   ─┘
      ├── has_group_lead ──────────────────▶ Person
      ├── prioritizes_success_indicator ───▶ SuccessIndicator
      ├── rationale_for_prioritization ────▶ Note
      └── includes_plan ───────────────────▶ Plan (concrete work items)`}
                </CodePattern>
                <Para>
                    The plan is created whole — a campus plan never exists without its three
                    working-group children — and is identified by year and campus, so each
                    year&apos;s plan is a distinct historical record.
                </Para>
            </Card>

            <Card title="Prioritized indicators">
                <Para>
                    A working group cannot push every indicator forward every year. Each
                    working-group plan names the <b>success indicators it prioritizes</b> for the
                    year and records a rationale note explaining the choice. The campus-plan view
                    then surfaces, per prioritized indicator: its current status level, its
                    previous-year status (so movement is visible), the companion plans attached to
                    it, and its progress updates.
                </Para>
            </Card>

            <Card title="Progress updates and trajectory">
                <Para>
                    Through the year, anyone working an item adds dated <b>progress updates</b> —
                    an append-only history, never edited in place. Each update carries a note, its
                    author, the evidence (YSE) it is about, and a <b>trajectory</b>: the direction
                    of travel, deliberately separate from the absolute status level. An indicator
                    can sit at &quot;Initiated&quot; and still be <i>improving</i>, or at
                    &quot;Established&quot; and be <i>at risk</i>.
                </Para>
                <Section title="Trajectory values">
                    <VocabTable label="Trajectory choices" vocab={vocab?.trajectory_choices} notes={TRAJECTORY_NOTES} />
                </Section>
            </Card>

            <Card title="Plans (work items) and their lifecycle">
                <Para>
                    A <b>Plan</b> node is a concrete intended piece of work — &quot;stand up
                    automated scanning for the top 50 sites&quot; — that furthers a goal and can be
                    included in a working-group plan. Key plans can be flagged as such. A plan
                    carries a lifecycle status:
                </Para>
                <Section title="Plan statuses">
                    <VocabTable label="Plan statuses" vocab={vocab?.plan_statuses} notes={PLAN_STATUS_NOTES} keyHeader="Status" />
                </Section>
                <Para mt={2}>
                    Completion and abandonment both record the year and explanatory notes, so the
                    plan history reads as decisions, not disappearances. Plans can also mirror an
                    Asana task: subtasks, assignees, and completion state sync read-only from
                    Asana, keeping day-to-day task management where people already work.
                </Para>
            </Card>

            <Card title="Accomplishments">
                <Para>
                    An <b>Accomplishment</b> is a named, documented achievement in a given academic
                    year — the &quot;what we actually delivered&quot; record used in annual
                    reporting. It links to the goals it advances, the evidence it supports, the
                    plans it was achieved through, and any metrics or documents that substantiate
                    it.
                </Para>
            </Card>

            <Card title="The year rollover">
                <Para>
                    When a new academic year begins, a migration rolls the workspace forward:
                </Para>
                <List spacing={1} pl={5} styleType="disc" fontSize="sm" color="gray.700">
                    <ListItem>a new AcademicYear node is created;</ListItem>
                    <ListItem>
                        every campus&apos;s YearSuccessEvidence is duplicated into the new year
                        with its relationships intact (status carries forward as the starting
                        point);
                    </ListItem>
                    <ListItem>administrative-review flags are reset;</ListItem>
                    <ListItem>
                        fresh CampusPlan and WorkingGroupPlan stubs are created for each campus;
                    </ListItem>
                    <ListItem>the app&apos;s default year advances.</ListItem>
                </List>
                <Para mt={2}>
                    Nothing from prior years is modified — every year remains a complete,
                    self-contained snapshot.
                </Para>
            </Card>
        </AboutPage>
    );
}

export default PlansProgressTab;
