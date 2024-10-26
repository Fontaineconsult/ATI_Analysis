import React, { useContext } from 'react';
import { Box, Flex, Heading, Text, Button, Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalCloseButton, useDisclosure } from '@chakra-ui/react';
import DropdownSelect from '../../functional_components/DropdownSelect';
import { useStatusLevels } from '../../../hooks/useStatusLevels';
import { UserContext } from '../../../context/UserContext';
import { SettingsContext } from '../../../context/SettingsContext';
import ImplementationMasterContainer from "../implementation/ImplementationMasterContainer";
import YSENoteMasterContainer from "../documentation/YSENoteMasterContainer";
import ApprovalMasterContainer from "../../ati_explorer_containers/ApprovalMasterContainer";

// Main SuccessIndicator Component
function SuccessIndicator({ indicatorData, evidenceData, workingGroup, onSuccessRefresh, bgColor }) {
    const { statusLevels, updateStatus } = useStatusLevels();
    const { user } = useContext(UserContext);
    const { currentAcademicYear } = useContext(SettingsContext);
    const { success_indicator, date_added, composite_key } = indicatorData?.properties || {};

    // Check if evidenceData and its properties exist
    const yearIdentifier = evidenceData?.evidence?.properties?.year_identifier;
    const statusLevel = evidenceData?.statusLevel?.properties?.status_level;
    const adminReviewers = evidenceData?.adminReviewers || [];
    const currentUserId = user?.employee_id || null;

    // Handle status level change
    const handleStatusChange = (newStatus) => {
        updateStatus(yearIdentifier, newStatus);
    };

    // Fallback for when there is no YearSuccessEvidence attached
    if (!yearIdentifier) {
        return (
            <Box padding={4} bg="red.50" border="1px solid" borderColor="red.200" borderRadius="md">
                <Text color="red.700" fontWeight="bold">
                    No YearSuccessEvidence node attached for {success_indicator}
                </Text>
            </Box>
        );
    }

    // Determine button states based on reviewer status
    let approveButtonText = 'Review';
    let approveButtonColor = 'yellow';
    let isButtonDisabled = !user;

    if (adminReviewers.some((reviewer) => reviewer.properties.employee_id === currentUserId)) {
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
            bg={bgColor}
            tabIndex={0}
            aria-labelledby={`indicator-${composite_key}`}
            aria-describedby={`indicator-details-${composite_key}`}
        >
            <IndicatorHeader
                compositeKey={composite_key}
                statusLevels={statusLevels}
                statusLevel={statusLevel}
                onStatusChange={handleStatusChange}
                approveButtonText={approveButtonText}
                approveButtonColor={approveButtonColor}
                isButtonDisabled={isButtonDisabled}
                notes={evidenceData.has_notes}
                messages={evidenceData.has_messages}
                metrics={evidenceData.has_metrics}
                yearIdentifier={yearIdentifier}
                workingGroup={workingGroup}
                evidenceData={evidenceData}
                onSuccessRefresh={onSuccessRefresh}
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
                             notes,
                             messages,
                             metrics,
                             yearIdentifier,
                             workingGroup,
                             evidenceData,
                             onSuccessRefresh
                         }) {
    const { isOpen: isNotesOpen, onOpen: onNotesOpen, onClose: onNotesClose } = useDisclosure();
    const { isOpen: isApprovalOpen, onOpen: onApprovalOpen, onClose: onApprovalClose } = useDisclosure();

    return (
        <Flex justify="space-between" align="center" mb={2}>
            {/* Indicator Heading on the Left */}
            <Heading as="h6" size="sm" id={`indicator-${compositeKey}`}>
                Indicator: {compositeKey}
            </Heading>

            {/* Status Level Dropdown and Approve Button on the Right */}
            <Flex align="center">
                <Button
                    mr={4}
                    onClick={onNotesOpen}
                    colorScheme="teal"
                    aria-label="View Notes"
                    padding={"15px"}
                >
                    Annotations
                </Button>

                <Box width={"170px"}>
                    <DropdownSelect
                        options={statusLevels.map((level) => level.status_level)}
                        initialValue={statusLevel}
                        onChange={onStatusChange}
                    />
                </Box>

                <Button
                    ml={4}
                    colorScheme={approveButtonColor}
                    onClick={onApprovalOpen}
                    isDisabled={isButtonDisabled}
                >
                    {approveButtonText}
                </Button>
            </Flex>

            {/* Modal for Viewing Notes */}
            <Modal isOpen={isNotesOpen} onClose={onNotesClose} size="xl">
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader>Notes Viewer</ModalHeader>
                    <ModalCloseButton />
                    <ModalBody>
                        <Text>
                            A Note in the Accessible Technology Initiative (ATI) represents an annotation that provides additional insights, observations, or feedback related to ATI efforts. Notes added here apply directly to this academic year success indicator.
                        </Text>
                        <YSENoteMasterContainer hasNotes={notes} hasMessages={messages} hasMetrics={metrics} year_identifier={yearIdentifier}/>
                    </ModalBody>
                </ModalContent>
            </Modal>

            {/* Modal for Approving Success Indicator */}
            <Modal isOpen={isApprovalOpen} onClose={onApprovalClose} size="2xl">
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader>Approval Process</ModalHeader>
                    <ModalCloseButton />
                    <ModalBody>
                        <ApprovalMasterContainer
                            evidenceData={evidenceData}
                            workingGroup={workingGroup}
                            onSuccessRefresh={onSuccessRefresh}
                        />
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
