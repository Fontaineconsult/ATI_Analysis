import React, { useContext } from 'react';
import { Box, Flex, Heading, Text, Button, Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalCloseButton, useDisclosure } from '@chakra-ui/react';
import DropdownSelect from '../../functional_components/DropdownSelect';
import { useStatusLevels } from '../../../hooks/useStatusLevels';
import { UserContext } from '../../../context/UserContext';
import { assignApprover } from '../../../services/api/put';
import { fetchPrimaryData } from '../../../services/api/get';
import { SettingsContext } from '../../../context/SettingsContext';
import ImplementationMasterContainer from "../implementation/ImplementationMasterContainer";
import YSENoteMasterContainer from "../documentation/YSENoteMasterContainer";


// Main SuccessIndicator Component
function SuccessIndicator({ indicatorData, evidenceData, workingGroup, onSuccessRefresh, bgColor }) {
    const { statusLevels, updateStatus } = useStatusLevels();
    const { user } = useContext(UserContext);
    const { currentAcademicYear } = useContext(SettingsContext);

    const { success_indicator, date_added, composite_key } = indicatorData.properties;
    const { year_identifier } = evidenceData.evidence.properties;
    const { status_level } = evidenceData.statusLevel.properties;

    const adminReviewers = evidenceData.adminReviewers;
    const currentUserId = user?.employee_id || null;

    // Handle status level change
    const handleStatusChange = (newStatus) => {
        updateStatus(year_identifier, newStatus);
    };

    // Handle approve action and refresh
    const handleApprove = async () => {
        if (currentUserId) {
            try {
                await assignApprover(currentUserId, year_identifier);
                const refreshedData = await fetchPrimaryData(workingGroup, currentAcademicYear);
                onSuccessRefresh(refreshedData);
            } catch (error) {
                console.error('Error approving success indicator:', error);
            }
        }
    };

    let approveButtonText = 'Approve';
    let approveButtonColor = 'yellow';
    let isButtonDisabled = !user;

    if (adminReviewers?.some((reviewer) => reviewer.properties.employee_id === currentUserId)) {
        approveButtonText = 'Approved';
        approveButtonColor = 'green';
        isButtonDisabled = true;
    }

    return (
        <Box
            as={"section"}
            mb={4}
            p={4}
            border="1px solid teal"
            borderRadius="md"
            bg={bgColor}  // Apply the background color passed as a prop
            tabIndex={0}
            aria-labelledby={`indicator-${composite_key}`}
            aria-describedby={`indicator-details-${composite_key}`}
        >
            <IndicatorHeader
                compositeKey={composite_key}
                statusLevels={statusLevels}
                statusLevel={status_level}
                onStatusChange={handleStatusChange}
                approveButtonText={approveButtonText}
                approveButtonColor={approveButtonColor}
                isButtonDisabled={isButtonDisabled}
                onApprove={handleApprove}
                notes={evidenceData.has_notes}
                year_identifier={year_identifier}
            />
            <IndicatorDetails
                description={success_indicator}
                persons={evidenceData.persons}
                compositeKey={composite_key}
            />
            <ImplementationMasterContainer evidenceData={evidenceData} compositeKey={composite_key} />
        </Box>
    );
}


// IndicatorHeader Component
function IndicatorHeader({
                             compositeKey,
                             statusLevels,
                             statusLevel,
                             onStatusChange,
                             approveButtonText,
                             approveButtonColor,
                             isButtonDisabled,
                             onApprove,
                             notes,
                             year_identifier
                         }) {
    const { isOpen, onOpen, onClose } = useDisclosure();  // Control modal state

    return (
        <Flex justify="space-between" align="center" mb={2}>
            {/* Indicator Heading on the Left */}
            <Heading as="h6" size="sm" id={`indicator-${compositeKey}`}>
                Indicator: {compositeKey}
            </Heading>

            {/* Status Level Dropdown and Approve Button on the Right */}
            <Flex align="center">
                {/* View Notes Button */}
                <Button
                    mr={4}
                    onClick={onOpen}
                    colorScheme="teal"
                    aria-label="View Notes"
                    padding={"15px"}
                >
                    View Notes
                </Button>

                {/* Status Level Dropdown */}
                <Box width={"170px"} >
                    <DropdownSelect
                        options={statusLevels.map((level) => level.status_level)}  // Provide status levels as options
                        initialValue={statusLevel}  // Initial status level
                        onChange={onStatusChange}  // Handle status change
                         // Set dropdown width to half the button width
                    />

                </Box>

                {/* Approve Button */}
                <Button
                    ml={4}
                    colorScheme={approveButtonColor}
                    onClick={onApprove}
                    isDisabled={isButtonDisabled}  // Disable the button based on user and approval status

                >
                    {approveButtonText}
                </Button>
            </Flex>

            {/* Modal for Viewing Notes */}
            <Modal isOpen={isOpen} onClose={onClose} size="xl">
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader>Notes Viewer</ModalHeader>
                    <ModalCloseButton />
                    <ModalBody>
                        <YSENoteMasterContainer hasNotes={notes} year_identifier={year_identifier}/>  {/* Pass the notes to the modal */}
                    </ModalBody>
                </ModalContent>
            </Modal>
        </Flex>
    );
}

// IndicatorDetails Component
function IndicatorDetails({ description, persons, compositeKey }) {
    return (
        <>
            <Text id={`indicator-details-${compositeKey}`}><strong>Description:</strong> {description}</Text>
            <ResponsiblePersons persons={persons} compositeKey={compositeKey} />
        </>
    );
}

// ResponsiblePersons Component
function ResponsiblePersons({ persons, compositeKey }) {
    if (!persons || persons.length === 0) {
        return <Text color="red.500" fontWeight="bold" mt={4}>No responsible persons assigned.</Text>;
    }

    return (
        <Box mt={4} aria-labelledby={`responsible-persons-heading-${compositeKey}`}>
            <Heading as="h6" size="sm" mb={2} id={`responsible-persons-heading-${compositeKey}`}>
                Responsible Persons:
            </Heading>
            <Flex wrap="wrap" gap={4} aria-label="List of responsible persons">
                {persons.map((person) => (
                    <Box key={person.id} as="span" aria-labelledby={`person-${person.id}`}>
                        <Text id={`person-name-${person.id}`} fontSize="sm"><strong>Name:</strong> {person.properties.name}</Text>
                        <Text id={`person-title-${person.id}`} fontSize="sm"><strong>Title:</strong> {person.properties.title}</Text>
                    </Box>
                ))}
            </Flex>
        </Box>
    );
}

export default SuccessIndicator;
