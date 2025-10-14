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
    Select,
    HStack,
    Badge
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
import {getUrlFromCompositeKey} from '../../../services/utils/tools';
import { useNavigate } from 'react-router-dom';


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

    // Error state for missing evidence
    if (!yearIdentifier) {
        return (
            <Box
                p={4}
                bg="red.50"
                borderWidth="1px"
                borderColor="red.300"
                borderRadius="lg"
                boxShadow="sm"
            >
                <Text color="red.700" fontWeight="semibold" fontSize="sm">
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
        <Box
            id={`${composite_key}`}
            as="section"
            mb={6}
            p={5}
            borderWidth="2px"
            borderColor="teal.300"
            borderRadius="lg"
            bg={bgColor || "white"}
            boxShadow="sm"
            _hover={{ boxShadow: "md", borderColor: "teal.400" }}
            transition="all 0.2s"
            tabIndex={0}
            aria-labelledby={`indicator-${composite_key}`}
            aria-describedby={`indicator-details-${composite_key}`}
            scrollMarginTop="120px"
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
                plans={evidenceData.plans}
                yearIdentifier={yearIdentifier}
                currentWorkingGroup={currentWorkingGroup}
                evidenceData={evidenceData}
            />
            <IndicatorDetails
                description={success_indicator}
                persons={evidenceData.persons}
                compositeKey={composite_key}
                evidenceData={evidenceData}
            />
            <ImplementationMasterContainer evidenceData={evidenceData} compositeKey={composite_key} yearIdentifier={yearIdentifier} />
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
            toast({
                title: "Status updated",
                description: "The status level was updated successfully.",
                status: "success",
                duration: 3000,
                isClosable: true,
                position: "top-right"
            });
            onStatusChange(newStatus);
            loadSingleWorkingGroupData(currentWorkingGroup);
        } catch (error) {
            toast({
                title: "Error updating status",
                description: "Please try again.",
                status: "error",
                duration: 3000,
                isClosable: true,
                position: "top-right"
            });
            setLocalStatusLevel(initialStatusLevel);
        }
    };

    return (
        <Box>
            <Flex justify="space-between" align="center" mb={4}>
                <Heading size="sm" color="teal.700" id={`indicator-${compositeKey}`}>
                    Indicator: {compositeKey}
                </Heading>

                <HStack spacing={3}>
                    <Button
                        size="sm"
                        onClick={onNotesOpen}
                        colorScheme="teal"
                        variant="solid"
                        aria-label="View Notes"
                        _hover={{ bg: "teal.600" }}
                    >
                        Annotations
                        <Badge ml={2} bg="white" color="teal.600" fontSize="xs">
                            {annotationCount}
                        </Badge>
                    </Button>

                    <Button
                        size="sm"
                        rightIcon={<FaUser />}
                        colorScheme="blue"
                        variant="outline"
                        aria-label="Implementing Persons"
                        onClick={onImplementingPersonsOpen}
                        _hover={{ bg: "blue.50" }}
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

                    <Button
                        size="sm"
                        colorScheme={approveButtonColor}
                        onClick={onApprovalOpen}
                        isDisabled={isButtonDisabled}
                        variant={approveButtonText === 'Approved' ? 'solid' : 'outline'}
                    >
                        {approveButtonText}
                    </Button>
                </HStack>
            </Flex>

            {/* Modals */}
            <Modal isOpen={isNotesOpen} onClose={onNotesClose} size="3xl">
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader fontSize="lg" color="teal.700">
                        Annotations for {compositeKey}
                    </ModalHeader>
                    <ModalCloseButton />
                    <ModalBody>
                        <YSEAnnotationMasterContainer
                            hasNotes={notes}
                            hasMessages={messages}
                            hasMetrics={metrics}
                            plans={plans}
                            year_identifier={yearIdentifier}
                        />
                    </ModalBody>
                </ModalContent>
            </Modal>

            <Modal isOpen={isImplementingPersonsOpen} onClose={onImplementingPersonsClose} size="lg">
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader fontSize="lg" color="teal.700">
                        Implementing Persons
                    </ModalHeader>
                    <ModalCloseButton />
                    <ModalBody>
                        <ImplementingPersonsManager yearIdentifier={yearIdentifier} />
                    </ModalBody>
                </ModalContent>
            </Modal>

            <Modal isOpen={isApprovalOpen} onClose={onApprovalClose} size="2xl">
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader fontSize="lg" color="teal.700">
                        Approval Process
                    </ModalHeader>
                    <ModalCloseButton />
                    <ModalBody>
                        <ApprovalMasterContainer
                            evidenceData={evidenceData}
                            currentWorkingGroup={currentWorkingGroup}
                        />
                    </ModalBody>
                </ModalContent>
            </Modal>
        </Box>
    );
}

// IndicatorDetails Component
function IndicatorDetails({ description, persons, compositeKey, evidenceData }) {
    return (
        <Box>
            <Text fontSize="sm" color="gray.700" mb={3} id={`indicator-details-${compositeKey}`}>
                <Text as="span" fontWeight="bold" color="gray.800">Description:</Text> {description}
            </Text>
            <ResponsiblePersons persons={persons} compositeKey={compositeKey} evidenceData={evidenceData} />
        </Box>
    );
}

// ResponsiblePersons Component with Table
function ResponsiblePersons({ persons, compositeKey, evidenceData }) {
    const navigate = useNavigate();

    // Count implementation types from evidenceTypes
    const implementationCounts = {
        Tracker: 0,
        Guidance: 0,
        Process: 0,
        Project: 0,
        Procedure: 0,
        InternalPolicy: 0,
        Service: 0
    };

    // Count the evidenceTypes which represent the actual implementations
    if (evidenceData && evidenceData.evidenceTypes) {
        evidenceData.evidenceTypes.forEach(evidenceType => {
            if (evidenceType.type && implementationCounts.hasOwnProperty(evidenceType.type)) {
                implementationCounts[evidenceType.type]++;
            }
        });
    }

    return (
        <Box mt={4} aria-labelledby={`responsible-persons-heading-${compositeKey}`}>
            <Heading size="xs" color="teal.700" mb={3} id={`responsible-persons-heading-${compositeKey}`}>
                Responsible Persons:
            </Heading>

            <Flex gap={4}>
                {/* Left side - Table (50% width) */}
                <Box
                    flex="1"
                    maxWidth="50%"
                    borderWidth="1px"
                    borderColor="teal.300"
                    borderRadius="lg"
                    overflow="hidden"
                    boxShadow="sm"
                >
                    {(!persons || persons.length === 0) ? (
                        <Box p={4} bg="red.50">
                            <Text color="red.500" fontWeight="bold" fontSize="sm" textAlign="center">
                                No responsible persons assigned.
                            </Text>
                        </Box>
                    ) : (
                        <Table variant="striped" colorScheme="teal" size="sm" aria-label="List of responsible persons">
                            <Thead bg="teal.50">
                                <Tr>
                                    <Th borderBottom="2px solid" borderColor="teal.200" color="teal.700" fontSize="xs">
                                        Name
                                    </Th>
                                    <Th borderBottom="2px solid" borderColor="teal.200" color="teal.700" fontSize="xs">
                                        Title
                                    </Th>
                                    <Th borderBottom="2px solid" borderColor="teal.200" color="teal.700" fontSize="xs">
                                        Type
                                    </Th>
                                </Tr>
                            </Thead>
                            <Tbody>
                                {persons.map((person) => (
                                    <Tr key={person.id}>
                                        <Td color="gray.700" fontSize="xs" borderBottom="1px solid" borderColor="gray.100">
                                            {person.properties.name}
                                        </Td>
                                        <Td color="gray.600" fontSize="xs" borderBottom="1px solid" borderColor="gray.100">
                                            {person.properties.title}
                                        </Td>
                                        <Td color="gray.600" fontSize="xs" borderBottom="1px solid" borderColor="gray.100">
                                            {person.properties.active ? "Member" : "Support"}
                                        </Td>
                                    </Tr>
                                ))}
                            </Tbody>
                        </Table>
                    )}
                </Box>

                {/* Right side - Implementation Overview (50% width) - Always displayed */}
                <Box
                    flex="1"
                    maxWidth="50%"
                    borderWidth="1px"
                    borderColor="teal.300"
                    borderRadius="lg"
                    p={4}
                    bg="white"
                    boxShadow="sm"
                >
                    <Flex gap={4}>
                        {/* Left section - Implementation counts */}
                        <Box flex="2">
                            <Text fontWeight="bold" fontSize="xs" mb={2} color="teal.700" textTransform="uppercase">
                                Implementation Overview
                            </Text>
                            <Flex flexWrap="wrap" gap={2} as="dl" aria-label="Implementation types and counts">
                                {Object.entries(implementationCounts).map(([type, count]) => (
                                    <Box key={type} flexBasis="calc(50% - 4px)" pl={2}>
                                        <Flex justify="space-between" fontSize="xs">
                                            <Text as="dt" color="gray.600">{type}:</Text>
                                            <Text
                                                as="dd"
                                                fontWeight="bold"
                                                color={count > 0 ? "teal.600" : "gray.400"}
                                                ml={2}
                                            >
                                                {count}
                                            </Text>
                                        </Flex>
                                    </Box>
                                ))}
                            </Flex>
                        </Box>

                        {/* Right section - View Evidence button */}
                        <Flex
                            flex="1"
                            align="center"
                            borderLeftWidth="1px"
                            borderColor="gray.200"
                            pl={4}
                        >
                            <Button
                                size="sm"
                                colorScheme="blue"
                                width="100%"
                                onClick={() => {
                                    const urlSegment = getUrlFromCompositeKey(compositeKey);
                                    navigate(`/dashboard/reports/${urlSegment}`);
                                }}
                                _hover={{ bg: "blue.600" }}
                            >
                                View Evidence
                            </Button>
                        </Flex>
                    </Flex>
                </Box>
            </Flex>
        </Box>
    );
}

const ImplementingPersonsManager = React.memo(({ yearIdentifier }) => {
    const { loadSingleWorkingGroupData } = useContext(DataContext);
    const { refreshAllIndividuals, individuals } = useContext(UserContext);
    const { currentWorkingGroup } = useSettings();
    const [selectedPerson, setSelectedPerson] = useState('');
    const [isAssigning, setIsAssigning] = useState(false);
    const [removingPersonId, setRemovingPersonId] = useState(null);
    const toast = useToast();

    const assignedPersons = individuals?.filter(
        person => person.yearSuccessEvidences.some(yse => yse.year_identifier === yearIdentifier)
    ) || [];

    useEffect(() => {
        if (!individuals) {
            refreshAllIndividuals();
        }
    }, [individuals, refreshAllIndividuals]);

    const handleAssignPerson = async () => {
        if (!selectedPerson) return;
        setIsAssigning(true);
        try {
            await assignPersonAsImplementor(selectedPerson, yearIdentifier);
            toast({
                title: "Person assigned successfully",
                status: "success",
                duration: 2000,
                isClosable: true,
                position: "top-right"
            });

            // Refresh both data sources
            await Promise.all([
                loadSingleWorkingGroupData(currentWorkingGroup),
                refreshAllIndividuals()
            ]);

            setSelectedPerson('');
        } catch (error) {
            toast({
                title: "Error assigning person",
                description: error.message,
                status: "error",
                duration: 3000,
                isClosable: true,
                position: "top-right"
            });
        } finally {
            setIsAssigning(false);
        }
    };

    const handleRemovePerson = async (personId) => {
        setRemovingPersonId(personId);
        try {
            await unassignPersonAsImplementor(personId, yearIdentifier);
            toast({
                title: "Person unassigned successfully",
                status: "success",
                duration: 2000,
                isClosable: true,
                position: "top-right"
            });

            // Refresh both data sources
            await Promise.all([
                loadSingleWorkingGroupData(currentWorkingGroup),
                refreshAllIndividuals()
            ]);

        } catch (error) {
            toast({
                title: "Error removing person",
                description: error.message,
                status: "error",
                duration: 3000,
                isClosable: true,
                position: "top-right"
            });
        } finally {
            setRemovingPersonId(null);
        }
    };

    // Filter out individuals with the 'active' flag set to false
    const availableIndividuals = individuals?.filter(individual => individual.active || individual.non_committee_member_active) || [];

    return (
        <Box>
            <Flex gap={2} mb={4}>
                <Select
                    size="sm"
                    placeholder="Select person to assign"
                    value={selectedPerson}
                    onChange={(e) => setSelectedPerson(e.target.value)}
                    fontSize="sm"
                    borderColor="teal.300"
                    isDisabled={isAssigning}
                    _hover={{ borderColor: "teal.400" }}
                    _focus={{ borderColor: "teal.500", boxShadow: "0 0 0 1px teal.500" }}
                >
                    {availableIndividuals.map((individual) => (
                        <option key={individual.unique_id} value={individual.unique_id}>
                            {individual.name} - {individual.title}
                        </option>
                    ))}
                </Select>
                <Button
                    size="sm"
                    colorScheme="teal"
                    onClick={handleAssignPerson}
                    isLoading={isAssigning}
                    loadingText="Assigning..."
                    isDisabled={!selectedPerson || isAssigning}
                >
                    Assign
                </Button>
            </Flex>

            <Table variant="simple" size="sm">
                <Thead>
                    <Tr bg="teal.50">
                        <Th color="teal.700" fontWeight="semibold" fontSize="xs">Name</Th>
                        <Th color="teal.700" fontWeight="semibold" fontSize="xs">Title</Th>
                        <Th color="teal.700" fontWeight="semibold" fontSize="xs">Actions</Th>
                    </Tr>
                </Thead>
                <Tbody>
                    {assignedPersons.map((person) => (
                        <Tr key={person.unique_id} _hover={{ bg: "gray.50" }}>
                            <Td color="gray.700" fontSize="xs">{person.name}</Td>
                            <Td color="gray.600" fontSize="xs">{person.title}</Td>
                            <Td>
                                <Button
                                    size="xs"
                                    colorScheme="red"
                                    variant="solid"
                                    onClick={() => handleRemovePerson(person.unique_id)}
                                    isLoading={removingPersonId === person.unique_id}
                                    loadingText="Removing..."
                                    isDisabled={removingPersonId !== null}
                                    _hover={{ bg: "red.600" }}
                                >
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