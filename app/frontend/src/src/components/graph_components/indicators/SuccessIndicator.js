import React, { useContext, useEffect, useState } from 'react';
import {
    Box,
    Flex,
    Heading,
    Text,
    Button,
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalCloseButton,
    useDisclosure,
    useToast,
    Table,
    Thead,
    Tbody,
    Tr,
    Th,
    Td,
    Select
} from '@chakra-ui/react';
import { FaUser } from 'react-icons/fa';
import DropdownSelect from '../../functional_components/DropdownSelect';
import { useStatusLevels } from '../../../hooks/useStatusLevels';
import { UserContext } from '../../../context/UserContext';
import { SettingsContext, useSettings } from '../../../context/SettingsContext';
import ImplementationMasterContainer from '../implementation/ImplementationMasterContainer';
import YSEAnnotationMasterContainer from '../documentation/YSEAnnotationMasterContainer';
import ApprovalMasterContainer from '../../ati_explorer_containers/ApprovalMasterContainer';
import { updateStatusLevel, assignPersonAsImplementor, unassignPersonAsImplementor } from '../../../services/api/put';
import { DataContext } from '../../../context/DataContext';

function SuccessIndicator({ indicatorData, evidenceData, bgColor }) {
    const { statusLevels, updateStatus } = useStatusLevels();
    const { user } = useContext(UserContext);
    const { currentAcademicYear } = useContext(SettingsContext);
    const { success_indicator, date_added, composite_key } = indicatorData?.properties || {};
    const { currentWorkingGroup } = useSettings();
    const yearIdentifier = evidenceData?.evidence?.properties?.year_identifier;
    const statusLevel = evidenceData?.statusLevel?.properties?.status_level;
    const adminReviewers = evidenceData?.adminReviewers || [];
    const currentUserId = user?.employee_id || null;



    const handleStatusChange = (newStatus) => {
        updateStatus(yearIdentifier, newStatus);
    };

    // Rest of your component code remains the same
    if (!yearIdentifier) {
        return (
            <Box padding={4} bg="red.50" border="1px solid" borderColor="red.200" borderRadius="md">
                <Text color="red.700" fontWeight="bold">
                    No YearSuccessEvidence node attached for {success_indicator}
                </Text>
            </Box>
        );
    }

    let approveButtonText = 'Review';
    let approveButtonColor = 'yellow';
    let isButtonDisabled = !user;

    if (adminReviewers.some((reviewer) => reviewer.properties.employee_id === currentUserId)) {
        approveButtonText = 'Approved';
        approveButtonColor = 'green';
        isButtonDisabled = true;
    }

    return (
        <Box as="section" mb={4} p={4} border="1px solid teal" borderRadius="md" bg={bgColor} tabIndex={0} aria-labelledby={`indicator-${composite_key}`} aria-describedby={`indicator-details-${composite_key}`}>
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
                plans={evidenceData.plans}
                yearIdentifier={yearIdentifier}
                currentWorkingGroup={currentWorkingGroup}
                evidenceData={evidenceData}
            />
            <IndicatorDetails description={success_indicator} persons={evidenceData.persons} compositeKey={composite_key} />
            <ImplementationMasterContainer evidenceData={evidenceData} compositeKey={composite_key} />
        </Box>
    );
}

function IndicatorHeader({
                             compositeKey,
                             statusLevels,
                             statusLevel: initialStatusLevel,
                             onStatusChange,
                             approveButtonText,
                             approveButtonColor,
                             isButtonDisabled,
                             notes,
                             messages,
                             metrics,
                             plans,
                             yearIdentifier,
                             currentWorkingGroup,
                             evidenceData,
                         }) {
    const { isOpen: isNotesOpen, onOpen: onNotesOpen, onClose: onNotesClose } = useDisclosure();
    const { isOpen: isApprovalOpen, onOpen: onApprovalOpen, onClose: onApprovalClose } = useDisclosure();
    const { isOpen: isImplementingPersonsOpen, onOpen: onImplementingPersonsOpen, onClose: onImplementingPersonsClose } = useDisclosure();
    const [localStatusLevel, setLocalStatusLevel] = useState(initialStatusLevel);
    const toast = useToast();
    const { loadSingleWorkingGroupData } = useContext(DataContext);

    const annotationCount = (notes?.length || 0) + (messages?.length || 0) + (metrics?.length || 0) + (plans?.length || 0);



    useEffect(() => {
        setLocalStatusLevel(initialStatusLevel);
    }, [initialStatusLevel]);

    const handleStatusChange = async (newStatus) => {
        setLocalStatusLevel(newStatus);
        try {
            await updateStatusLevel(yearIdentifier, newStatus);
            toast({ title: "Status updated.", description: "The status level was updated successfully.", status: "success", duration: 3000, isClosable: true });
            onStatusChange(newStatus);
            loadSingleWorkingGroupData(currentWorkingGroup);
        } catch (error) {
            toast({ title: "Error updating status.", description: "There was an error updating the status level. Please try again.", status: "error", duration: 3000, isClosable: true });
            setLocalStatusLevel(initialStatusLevel);
        }
    };

    return (
        <Flex justify="space-between" align="center" mb={2}>
            <Heading as="h6" size="sm" id={`indicator-${compositeKey}`}>
                Indicator: {compositeKey}
            </Heading>

            <Flex align="center">
                <Button mr={4} onClick={onNotesOpen} colorScheme="teal" aria-label="View Notes" padding="15px">
                    Annotations ({annotationCount})
                </Button>

                <Button
                    rightIcon={<FaUser />}
                    colorScheme="blue"
                    variant="outline"
                    aria-label="Implementing Persons"
                    onClick={onImplementingPersonsOpen}
                    mr={4}
                >
                    Persons
                </Button>

                <Box width="170px">
                    <DropdownSelect
                        options={statusLevels.map((level) => level.status_level)}
                        initialValue={localStatusLevel}
                        onChange={handleStatusChange}
                    />
                </Box>

                <Button ml={4} colorScheme={approveButtonColor} onClick={onApprovalOpen} isDisabled={isButtonDisabled}>
                    {approveButtonText}
                </Button>
            </Flex>

            <Modal isOpen={isNotesOpen} onClose={onNotesClose} size="xl">
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader>Annotations for {compositeKey}</ModalHeader>
                    <ModalCloseButton />
                    <ModalBody>
                        <YSEAnnotationMasterContainer hasNotes={notes} hasMessages={messages} hasMetrics={metrics} plans={plans} year_identifier={yearIdentifier} />
                    </ModalBody>
                </ModalContent>
            </Modal>

            <Modal isOpen={isImplementingPersonsOpen} onClose={onImplementingPersonsClose} size="lg">
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader>Implementing Persons</ModalHeader>
                    <ModalCloseButton />
                    <ModalBody>
                        <ImplementingPersonsManager yearIdentifier={yearIdentifier} />
                    </ModalBody>
                </ModalContent>
            </Modal>

            <Modal isOpen={isApprovalOpen} onClose={onApprovalClose} size="2xl">
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader>Approval Process</ModalHeader>
                    <ModalCloseButton />
                    <ModalBody>
                        <ApprovalMasterContainer evidenceData={evidenceData} currentWorkingGroup={currentWorkingGroup} />
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
            <Text as='h3' id={`indicator-details-${compositeKey}`}><strong>Description:</strong> {description}</Text>
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

const ImplementingPersonsManager = React.memo(({ yearIdentifier }) => {
    const { data, loadAllIndividuals, loadSingleWorkingGroupData } = useContext(DataContext);
    const { currentWorkingGroup } = useSettings();
    const [selectedPerson, setSelectedPerson] = useState('');
    const toast = useToast();
    const assignedPersons = data.individuals?.filter(person => person.yearSuccessEvidences.some(yse => yse.year_identifier === yearIdentifier)) || [];

    useEffect(() => {
        if (!data.individuals) {
            loadAllIndividuals();
        }
    }, [data.individuals, loadAllIndividuals]);

    const handleAssignPerson = async () => {
        if (!selectedPerson) return;
        try {
            await assignPersonAsImplementor(selectedPerson, yearIdentifier);
            toast({ title: "Person assigned successfully", status: "success", duration: 2000, isClosable: true });
            loadSingleWorkingGroupData(currentWorkingGroup);
            setSelectedPerson('');
        } catch (error) {
            toast({ title: "Error assigning person", description: error.message, status: "error", duration: 3000, isClosable: true });
        }
    };

    const handleRemovePerson = async (personId) => {
        try {
            await unassignPersonAsImplementor(personId, yearIdentifier);
            toast({ title: "Person unassigned successfully", status: "success", duration: 2000, isClosable: true });
            loadSingleWorkingGroupData(currentWorkingGroup);
        } catch (error) {
            toast({ title: "Error removing person", description: error.message, status: "error", duration: 3000, isClosable: true });
        }
    };

    // Filter out individuals with the 'active' flag set to false
    const availableIndividuals = data.individuals?.filter(individual => individual.active) || [];

    return (
        <Box>
            <Select placeholder="Select person to assign" value={selectedPerson} onChange={(e) => setSelectedPerson(e.target.value)} mb={4}>
                {availableIndividuals.map((individual) => (
                    <option key={individual.unique_id} value={individual.unique_id}>
                        {individual.name} - {individual.title}
                    </option>
                ))}
            </Select>
            <Button colorScheme="teal" onClick={handleAssignPerson}>
                Assign
            </Button>
            <Table variant="simple">
                <Thead>
                    <Tr>
                        <Th>Name</Th>
                        <Th>Title</Th>
                        <Th>Actions</Th>
                    </Tr>
                </Thead>
                <Tbody>
                    {assignedPersons.map((person) => (
                        <Tr key={person.unique_id}>
                            <Td>{person.name}</Td>
                            <Td>{person.title}</Td>
                            <Td>
                                <Button colorScheme="red" size="sm" onClick={() => handleRemovePerson(person.unique_id)}>
                                    Remove
                                </Button>
                            </Td>
                        </Tr>
                    ))}
                </Tbody>
            </Table>
        </Box>
    );
});
export default SuccessIndicator;