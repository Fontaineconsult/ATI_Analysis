import React, { useState } from 'react';
import { Box, Button, Flex } from '@chakra-ui/react';
import NoteViewer from './NoteViewer';  // Import the NoteViewer component
import MessageViewer from './MessageViewer';  // Import the MessageViewer component
import PlanViewer from "../implementation/PlanViewer";  // Import the PlanViewer component

function YSEAnnotationMasterContainer({ hasNotes, hasMessages, hasMetrics, plans, year_identifier }) {
    const [selectedType, setSelectedType] = useState('Note');  // Default to 'Note'

    // Filter notes based on the labels
    const filteredNotes = hasNotes?.filter((item) =>
        item.note?.labels?.includes('Note') // Accessing labels inside the note object
    );

    // Filter messages based on the labels
    const filteredMessages = hasMessages?.filter((item) =>
        item.message?.labels?.includes('Message') // Accessing labels inside the message object
    );


    // Filter plans based on the labels
    const filteredPlans = plans?.filter((item) =>
        item.labels?.includes('Plan') // Accessing labels inside the plan object
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

export default YSEAnnotationMasterContainer;
