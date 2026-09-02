import React from 'react';
import { Box, Tabs, TabList, TabPanels, Tab, TabPanel, HStack, Text, Badge } from '@chakra-ui/react';
import NoteViewer from './NoteViewer';
import MessageViewer from './MessageViewer';
import MetricViewer from './MetricViewer';
import PlanViewer from '../implementation/PlanViewer';
import QueryViewer from './QueryViewer';
import RecommendationsPanel from '../../dashboard_components/report_components/RecommendationsPanel';
import ConcernsPanel from '../../dashboard_components/report_components/ConcernsPanel';

// Short helper per type (the old verbose paragraph is condensed to one line).
const HELP = {
    Note: 'General observations / documentation — do not count toward implementation evidence.',
    Message: 'Communications (e.g. emails) about the ATI — do not count toward implementation evidence.',
    Metric: 'Quantitative measures (counts, percentages, survey results) recorded for this indicator.',
    Plan: 'Specific actions, timelines, and responsibilities for this indicator.',
    Recommendation: 'End-of-review-cycle improvements — what should change before the next cycle. Items resolve (addressed/dismissed), never delete.',
    Concern: 'Issues raised with no path to resolution yet — each should become a recommendation or a plan, or be dismissed with a reason.',
    Query: 'Pending questions whose answer would unblock this evidence. Raised under a working-group plan, so they are read-only here — settle them in the Queries area.',
};

const TabLabel = ({ label, count }) => (
    <HStack spacing={1.5}>
        <Text>{label}</Text>
        <Badge colorScheme="teal" borderRadius="full" fontSize="2xs">{count}</Badge>
    </HStack>
);

/**
 * Annotations for a YSE: Notes / Messages / Plans as tabs with live counts (so you can see what's
 * there at a glance and reach each in one click). Each tab renders its viewer, which handles
 * add/edit inline.
 */
function YSEAnnotationMasterContainer({ hasNotes, hasMessages, hasMetrics, plans, recommendations, concerns, queries, year_identifier, onRecommendationsChange }) {
    const notes = hasNotes?.filter((item) => item.note?.labels?.includes('Note')) || [];
    const messages = hasMessages?.filter((item) => item.message?.labels?.includes('Message')) || [];
    const metrics = hasMetrics?.filter((item) => item.metric?.labels?.includes('Metric')) || [];
    const planItems = plans?.filter((item) => item.labels?.includes('Plan')) || [];
    const recItems = recommendations?.filter((item) => item.recommendation) || [];
    const concernItems = concerns?.filter((item) => item.concern) || [];
    // Pattern-comprehension rows from the working-group query — already flat
    // maps, so no .properties unwrapping like the note/message collections.
    const queryItems = queries?.filter((item) => item?.question) || [];
    // The count that matters is what is still outstanding; a settled question is
    // history, and counting it would make the tab look busier than the work is.
    const openQueryCount = queryItems.filter((q) => q.status !== 'settled').length;

    return (
        <Box aria-label="Annotations">
            <Tabs colorScheme="teal" size="sm" variant="enclosed" isLazy>
                <TabList>
                    <Tab><TabLabel label="Notes" count={notes.length} /></Tab>
                    <Tab><TabLabel label="Messages" count={messages.length} /></Tab>
                    <Tab><TabLabel label="Metrics" count={metrics.length} /></Tab>
                    <Tab><TabLabel label="Plans" count={planItems.length} /></Tab>
                    <Tab><TabLabel label="Concerns" count={concernItems.length} /></Tab>
                    <Tab><TabLabel label="Recommendations" count={recItems.length} /></Tab>
                    <Tab><TabLabel label="Queries" count={openQueryCount} /></Tab>
                </TabList>
                <TabPanels>
                    <TabPanel px={0}>
                        <Text fontSize="xs" color="gray.600" mb={2}>{HELP.Note}</Text>
                        <NoteViewer notes={notes} onSubmit={() => {}} yearSuccessEvidence={year_identifier} />
                    </TabPanel>
                    <TabPanel px={0}>
                        <Text fontSize="xs" color="gray.600" mb={2}>{HELP.Message}</Text>
                        <MessageViewer messages={messages} onSubmit={() => {}} yearSuccessEvidence={year_identifier} />
                    </TabPanel>
                    <TabPanel px={0}>
                        <Text fontSize="xs" color="gray.600" mb={2}>{HELP.Metric}</Text>
                        <MetricViewer metrics={metrics} onSubmit={() => {}} />
                    </TabPanel>
                    <TabPanel px={0}>
                        <Text fontSize="xs" color="gray.600" mb={2}>{HELP.Plan}</Text>
                        <PlanViewer plans={planItems} onSubmit={() => {}} yearSuccessEvidence={year_identifier} />
                    </TabPanel>
                    <TabPanel px={0}>
                        <Text fontSize="xs" color="gray.600" mb={2}>{HELP.Concern}</Text>
                        <ConcernsPanel
                            yearIdentifier={year_identifier}
                            concerns={concernItems}
                            onUpdate={onRecommendationsChange}
                        />
                    </TabPanel>
                    <TabPanel px={0}>
                        <Text fontSize="xs" color="gray.600" mb={2}>{HELP.Recommendation}</Text>
                        <RecommendationsPanel
                            yearIdentifier={year_identifier}
                            recommendations={recItems}
                            onUpdate={onRecommendationsChange}
                        />
                    </TabPanel>
                    <TabPanel px={0}>
                        <Text fontSize="xs" color="gray.600" mb={2}>{HELP.Query}</Text>
                        <QueryViewer queries={queryItems} />
                    </TabPanel>
                </TabPanels>
            </Tabs>
        </Box>
    );
}

export default YSEAnnotationMasterContainer;
