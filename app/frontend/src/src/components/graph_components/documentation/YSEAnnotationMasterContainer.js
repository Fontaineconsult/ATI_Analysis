import React, { useState } from 'react';
import { Box, Button, Flex, Text } from '@chakra-ui/react';
import NoteViewer from './NoteViewer';
import MessageViewer from './MessageViewer';
import PlanViewer from "../implementation/PlanViewer";

function YSEAnnotationMasterContainer({ hasNotes, hasMessages, hasMetrics, plans, year_identifier }) {
    const [selectedType, setSelectedType] = useState('Note');

    const descriptions = {
        Note: "Notes are general observations, insights, or documentation about the success indicator's progress. They help track important details and context over time. They do not count toward documented implementation evidence.",
        Message: "Messages are communications between 2 or more parties; for example, emails. They should include details about the ATI. They do not count toward documented implementation evidence.",
        Plan: "Plans outline specific actions, timelines, and responsibilities for achieving the success indicator. They help track what needs to be done and who is responsible."
    };

    // Filter notes based on the labels
    const filteredNotes = hasNotes?.filter((item) =>
        item.note?.labels?.includes('Note')
    );

    // Filter messages based on the labels
    const filteredMessages = hasMessages?.filter((item) =>
        item.message?.labels?.includes('Message')
    );

    // Filter plans based on the labels
    const filteredPlans = plans?.filter((item) =>
        item.labels?.includes('Plan')
    );

    return (
        <Box mt={4} aria-label="YSEAnnotationMasterContainer">
            {/* Buttons for selecting between Notes, Messages, and Plans */}
            <Flex mb={4}>
                <Button
                    mr={2}
                    onClick={() => setSelectedType('Note')}
                    colorScheme={selectedType === 'Note' ? 'teal' : 'gray'}
                    aria-pressed={selectedType === 'Note'}
                >
                    View Notes
                </Button>
                <Button
                    mr={2}
                    onClick={() => setSelectedType('Message')}
                    colorScheme={selectedType === 'Message' ? 'teal' : 'gray'}
                    aria-pressed={selectedType === 'Message'}
                >
                    View Messages
                </Button>
                <Button
                    onClick={() => setSelectedType('Plan')}
                    colorScheme={selectedType === 'Plan' ? 'teal' : 'gray'}
                    aria-pressed={selectedType === 'Plan'}
                >
                    View Plans
                </Button>
            </Flex>

            {/* Description box */}
            <Box
                p={4}
                bg="gray.50"
                borderRadius="md"
                mb={4}
                border="1px"
                borderColor="gray.200"
            >
                <Text fontSize="sm" color="gray.600">
                    {descriptions[selectedType]}
                </Text>
            </Box>

            {/* Render Notes, Messages, or Plans Viewer based on the selection */}
            {selectedType === 'Note' && (
                <NoteViewer
                    notes={filteredNotes}
                    onSubmit={(index, updatedNote) => console.log(updatedNote)}
                    yearSuccessEvidence={year_identifier}
                />
            )}
            {selectedType === 'Message' && (
                <MessageViewer
                    messages={filteredMessages}
                    onSubmit={(index, updatedMessage) => console.log(updatedMessage)}
                    yearSuccessEvidence={year_identifier}
                />
            )}
            {selectedType === 'Plan' && (
                <PlanViewer
                    plans={filteredPlans}
                    onSubmit={(index, updatedPlan) => console.log(updatedPlan)}
                    yearSuccessEvidence={year_identifier}
                />
            )}
        </Box>
    );
}

export default YSEAnnotationMasterContainer