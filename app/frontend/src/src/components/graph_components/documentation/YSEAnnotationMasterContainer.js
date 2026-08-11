import React from 'react';
import { Box, Tabs, TabList, TabPanels, Tab, TabPanel, HStack, Text, Badge } from '@chakra-ui/react';
import NoteViewer from './NoteViewer';
import MessageViewer from './MessageViewer';
import MetricViewer from './MetricViewer';
import PlanViewer from '../implementation/PlanViewer';

// Short helper per type (the old verbose paragraph is condensed to one line).
const HELP = {
    Note: 'General observations / documentation — do not count toward implementation evidence.',
    Message: 'Communications (e.g. emails) about the ATI — do not count toward implementation evidence.',
    Metric: 'Quantitative measures (counts, percentages, survey results) recorded for this indicator.',
    Plan: 'Specific actions, timelines, and responsibilities for this indicator.',
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
function YSEAnnotationMasterContainer({ hasNotes, hasMessages, hasMetrics, plans, year_identifier }) {
    const notes = hasNotes?.filter((item) => item.note?.labels?.includes('Note')) || [];
    const messages = hasMessages?.filter((item) => item.message?.labels?.includes('Message')) || [];
    const metrics = hasMetrics?.filter((item) => item.metric?.labels?.includes('Metric')) || [];
    const planItems = plans?.filter((item) => item.labels?.includes('Plan')) || [];

    return (
        <Box aria-label="Annotations">
            <Tabs colorScheme="teal" size="sm" variant="enclosed" isLazy>
                <TabList>
                    <Tab><TabLabel label="Notes" count={notes.length} /></Tab>
                    <Tab><TabLabel label="Messages" count={messages.length} /></Tab>
                    <Tab><TabLabel label="Metrics" count={metrics.length} /></Tab>
                    <Tab><TabLabel label="Plans" count={planItems.length} /></Tab>
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
                </TabPanels>
            </Tabs>
        </Box>
    );
}

export default YSEAnnotationMasterContainer;
