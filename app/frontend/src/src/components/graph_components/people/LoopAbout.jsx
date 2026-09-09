import React from 'react';
import { Badge, Box, Flex, Text } from '@chakra-ui/react';
import {
    AboutPage, Card, Section, Para, CodePattern, TermDef,
} from '../../dashboard_components/about_components/aboutPrimitives';

// Prose on this page follows app/database/ontology/writing-style.md.

const SkillBadge = ({ name }) => (
    <Badge fontFamily="mono" fontSize="2xs" colorScheme="purple" variant="subtle"
           textTransform="none" ml={2}>
        {name}
    </Badge>
);

const OwnerBadge = ({ owner }) => (
    <Badge fontSize="2xs" colorScheme={owner === 'skill' ? 'purple' : 'teal'}
           variant="outline" textTransform="uppercase" ml={2}>
        {owner === 'skill' ? 'Claude Code skill' : 'this app'}
    </Badge>
);

/** One stage of the loop: a numbered card with who runs it. */
const Stage = ({ number, title, owner, skill, children }) => (
    <Card>
        <Flex align="center" gap={2} mb={2}>
            <Flex
                align="center" justify="center" flexShrink={0}
                w="22px" h="22px" borderRadius="full"
                bg="teal.700" color="white" fontSize="xs" fontWeight="bold"
                aria-hidden="true"
            >
                {number}
            </Flex>
            <Text as="h3" fontSize="sm" fontWeight="bold" color="teal.700">
                {title}
            </Text>
            <OwnerBadge owner={owner} />
            {skill && <SkillBadge name={skill} />}
        </Flex>
        {children}
    </Card>
);

/**
 * The About tab for the People area: what the prep / record / chase loop is,
 * which artifact each stage leaves in the graph, and where the Claude Code
 * skills do their part. Display only; nothing here writes.
 */
export default function LoopAbout() {
    return (
        <AboutPage
            title="The interview loop"
            lede="How an interview becomes evidence: the prep, record, and chase cycle
                  this area manages, and where each Claude Code skill does its part."
        >
            <Card title="The loop at a glance">
                <Para>
                    Evidence for a success indicator rarely arrives on its own. Someone
                    plans an interview, holds it, records what was said, and then chases
                    what the room left open. The graph gives each of those steps an
                    artifact, so the cycle leaves a record instead of a trail of email.
                </Para>
                <CodePattern>
{`InterviewGuide -[resulted_in]-> MeetingMinutes <-[follows_up_on]- FollowUp
     prep                            record                          chase

FollowUp -[includes_query / includes_recommendation / includes_concern]-> the tasks it carries`}
                </CodePattern>
                <Para mb={0}>
                    The tabs of this area are the loop in order: Interview Guides holds
                    the preps, Follow-ups holds the chases, and People and Communities
                    hold the stakeholders both are aimed at.
                </Para>
            </Card>

            <Stage number={1} title="Prepare" owner="skill" skill="/stakeholder-interview">
                <Para mb={0}>
                    Given a stakeholder, a campus, and a topic, the skill reads the graph
                    and writes an interview guide. Each target indicator is decomposed
                    into the elements of its maturity bar, and every element gets the
                    question that settles it and the artifact that would evidence it. The
                    prep is saved as an InterviewGuide and listed on the Interview Guides
                    tab, with its closure state against the meeting it produced.
                </Para>
            </Stage>

            <Stage number={2} title="Record" owner="skill" skill="/ontology-ingest">
                <Para>
                    The meeting produces a transcript, and the skill turns the transcript
                    into graph writes: a Note for each thing said that matters, and a
                    Query, Recommendation, or Concern for each ask the room produced.
                    Every proposed write is presented for approval before anything lands.
                </Para>
                <Para mb={0}>
                    A Note attaches to both the MeetingMinutes and the evidence it
                    discusses, which is how the app later derives which indicators a
                    meeting touched: no extra bookkeeping, just the shared notes.
                </Para>
            </Stage>

            <Stage number={3} title="Chase" owner="skill" skill="/follow-up">
                <Para>
                    The skill composes one follow-up per community of practice at each
                    campus, because that is the audience which shares the ground being
                    chased. It reads the gap table plus the prose the table cannot see:
                    note bodies, source text, and artifacts a stakeholder offered in the
                    room but never sent.
                </Para>
                <Para mb={0}>
                    The message is saved as a FollowUp wired to the asks it carries. The
                    app never composes these; it displays them, timestamps them so
                    staleness is visible, and copies one to the clipboard as an email.
                </Para>
            </Stage>

            <Stage number={4} title="Track and resolve" owner="app">
                <Para>
                    Sending is recorded with Mark sent on the Follow-ups board. From then
                    on the chase is measured by resolving its tasks, not by counting
                    replies, because many replies can settle nothing and one can settle
                    everything. Settle a Query with the answer that came back, mark a
                    Recommendation addressed or dismissed, and mark a Concern converted
                    or dismissed, all from the board.
                </Para>
                <Para mb={0}>
                    When nobody answers, schedule the next contact: a date, the person to
                    nudge, and a note about what to say. Chases with a due contact lead
                    the board, and the Contacts due count turns red when one is waiting.
                </Para>
            </Stage>

            <Stage number={5} title="Close the cycle" owner="skill" skill="/maturity-status-reviewer">
                <Para mb={0}>
                    Settled answers and delivered artifacts strengthen the evidence behind
                    each indicator. The reviewer skill compares that evidence against the
                    six-level status rubric and recommends a grade, refusing the higher
                    level when the record does not match the bar. The next guide is
                    prepared against the stronger graph, so the loop is meant to run more
                    than once per indicator.
                </Para>
            </Stage>

            <Card title="What the app owns, and what the skills own">
                <Para>
                    Composition lives with the skills because the strongest material is
                    prose: a note body, a page of source text, an offer made in the room.
                    A template in the app could only merge the structured fields, and it
                    would miss all of that.
                </Para>
                <Para mb={0}>
                    The app owns the rest of the loop: the live gap table beside each
                    saved message, the generation timestamps, the copy-to-email
                    rendering, sent state, task resolution, and the next-contact
                    reminders. Replies that come back are ingested as Messages and linked
                    to the chase they answer, so what came back sits beside what was
                    asked.
                </Para>
            </Card>

            <Section title="The artifacts">
                <Box>
                    <TermDef term="InterviewGuide">
                        The prep. It targets indicators, names the people to interview,
                        and holds the questions built from each indicator's maturity bar.
                    </TermDef>
                    <TermDef term="MeetingMinutes">
                        The record of a meeting that happened. Notes attach to it, and a
                        FollowUp anchors to it by follows_up_on.
                    </TermDef>
                    <TermDef term="Note">
                        A thing said that matters, attached to both the meeting and the
                        evidence it discusses.
                    </TermDef>
                    <TermDef term="Query" badge="task">
                        A question somebody owes an answer to. Settling it requires
                        recording the answer, so the record shows what came back.
                    </TermDef>
                    <TermDef term="Recommendation" badge="task">
                        An improvement identified for the evidence. Resolved by marking it
                        addressed or dismissed.
                    </TermDef>
                    <TermDef term="Concern" badge="task">
                        The holding pen between a problem being raised and anyone deciding
                        what would close it. Resolved by converting it into something
                        actionable or dismissing it.
                    </TermDef>
                    <TermDef term="FollowUp">
                        The message that chases what a meeting left open. It is wired to
                        the tasks it carries, and it holds the sent state and the
                        next-contact reminder.
                    </TermDef>
                    <TermDef term="Message">
                        A communication that came back. A reply links to the FollowUp it
                        answers by replies_to, with the sender recorded.
                    </TermDef>
                </Box>
            </Section>
        </AboutPage>
    );
}
