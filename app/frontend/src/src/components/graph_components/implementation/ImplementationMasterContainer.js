import React, { useState, useEffect, useContext } from 'react';
import {
    Box,
    Button,
    Flex,
    Heading,
    Collapse,
    Text,
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    ModalCloseButton,
    FormControl,
    FormLabel,
    Input,
    Textarea,
    Select,
    useDisclosure,
    useToast,
    IconButton,
    Tabs,
    TabList,
    TabPanels,
    Tab,
    TabPanel,
    VStack,
    HStack,
    Divider
} from '@chakra-ui/react';
import { AddIcon } from '@chakra-ui/icons';
import EvidenceTypeMasterList from '../evidence/EvidenceTypeMasterList';
import { createImplementation } from '../../../services/api/post';
import { assignImplementationToYSE } from '../../../services/api/put';
import { fetchImplementationsByType } from '../../../services/api/get';
import { DataContext } from '../../../context/DataContext';
import { useSettings } from '../../../context/SettingsContext';

function ImplementationMasterContainer({ evidenceData = {}, compositeKey, yearIdentifier }) {
    const { evidenceTypes = [] } = evidenceData;
    const [selectedImplementationType, setSelectedImplementationType] = useState(null);
    const [isExpanded, setIsExpanded] = useState(false);

    // Modal state
    const { isOpen, onOpen, onClose } = useDisclosure();
    const [tabIndex, setTabIndex] = useState(0);
    const [selectedType, setSelectedType] = useState('');
    const [existingImplementations, setExistingImplementations] = useState([]);
    const [selectedExisting, setSelectedExisting] = useState('');
    const [newImplementation, setNewImplementation] = useState({
        title: '',
        description: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoadingExisting, setIsLoadingExisting] = useState(false);
    const [selectedDescription, setSelectedDescription] = useState('');
    const toast = useToast();
    const { loadSingleWorkingGroupData } = useContext(DataContext);
    const { currentWorkingGroup } = useSettings();


    console.log("SDFDSFSDFDF", yearIdentifier)


    const implementationTypes = [
        'Tracking',
        'Guidance',
        'Process',
        'Project',
        'Procedure',
        'InternalPolicy',
        'Service',
    ];

    useEffect(() => {
        if (!evidenceTypes.length) {
            setSelectedImplementationType(null);
        } else if (!isTypeAvailable(selectedImplementationType)) {
            setSelectedImplementationType(null);
        }
    }, [evidenceTypes, selectedImplementationType]);

    useEffect(() => {
        if (isExpanded && evidenceTypes.length && !selectedImplementationType) {
            const firstAvailableType = implementationTypes.find(isTypeAvailable);
            if (firstAvailableType) {
                setSelectedImplementationType(firstAvailableType);
            }
        }
    }, [isExpanded, evidenceTypes]);

    // Load existing implementations when type changes
    useEffect(() => {
        if (selectedType && tabIndex === 1) {
            loadExistingImplementations(selectedType);
        }
    }, [selectedType, tabIndex]);

    const toggleExpand = () => {
        setIsExpanded(!isExpanded);
    };

    const isTypeAvailable = (type) => {
        return evidenceTypes.some(evidenceType => {
            const directTypeMatch = evidenceType.type && evidenceType.type === type;
            const nestedTypeMatch = evidenceType.evidenceType?.properties?.title === type;
            return directTypeMatch || nestedTypeMatch;
        });
    };

    const filteredEvidence = evidenceTypes.filter(evidenceType => {
        const directTypeMatch = evidenceType.type && evidenceType.type === selectedImplementationType;
        const nestedTypeMatch = evidenceType.evidenceType?.properties?.title === selectedImplementationType;
        return directTypeMatch || nestedTypeMatch;
    });

    const loadExistingImplementations = async (type) => {
        setIsLoadingExisting(true);
        try {
            const response = await fetchImplementationsByType(type);
            // Fix: Access nested data correctly
            const implementations = response?.status?.data || response?.data || [];
            setExistingImplementations(implementations);
        } catch (error) {
            console.error('Error loading implementations:', error);
            setExistingImplementations([]);
        } finally {
            setIsLoadingExisting(false);
        }
    };

    const handleOpenModal = () => {
        setTabIndex(0);
        setSelectedType('');
        setSelectedExisting('');
        setSelectedDescription('');  // Add this
        setNewImplementation({ title: '', description: '' });
        setExistingImplementations([]);
        onOpen();
    };

    const handleCreateNew = async () => {
        if (!selectedType || !newImplementation.title || !newImplementation.description) {
            toast({
                title: "Missing fields",
                description: "All fields are required.",
                status: "warning",
                duration: 3000,
                isClosable: true,
            });
            return;
        }

        setIsSubmitting(true);
        try {
            // Create new implementation with auto-assignment
            await createImplementation(
                selectedType,
                newImplementation.title,
                newImplementation.description,
                yearIdentifier  // This handles both creation and assignment
            );

            toast({
                title: "Success",
                description: `${selectedType} created and assigned.`,
                status: "success",
                duration: 3000,
                isClosable: true,
            });

            if (currentWorkingGroup) {
                await loadSingleWorkingGroupData(currentWorkingGroup);
            }

            onClose();
        } catch (error) {
            toast({
                title: "Error",
                description: error.response?.data?.error || "Failed to create implementation.",
                status: "error",
                duration: 3000,
                isClosable: true,
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleLinkExisting = async () => {
        if (!selectedType || !selectedExisting) {
            toast({
                title: "Missing selection",
                description: "Please select an implementation.",
                status: "warning",
                duration: 3000,
                isClosable: true,
            });
            return;
        }

        setIsSubmitting(true);
        try {
            await assignImplementationToYSE(
                yearIdentifier,
                selectedType,
                selectedExisting
            );

            toast({
                title: "Success",
                description: "Implementation linked successfully.",
                status: "success",
                duration: 3000,
                isClosable: true,
            });

            if (currentWorkingGroup) {
                await loadSingleWorkingGroupData(currentWorkingGroup);
            }

            onClose();
        } catch (error) {
            toast({
                title: "Error",
                description: error.response?.data?.error || "Failed to link implementation.",
                status: "error",
                duration: 3000,
                isClosable: true,
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Box
            tabIndex={0}
            role="region"
            aria-labelledby="implementation-container-heading"
            aria-expanded={isExpanded}
            border="1px solid teal"
            borderRadius="md"
            mt={6}
        >
            <Flex justify="space-between" align="center" bg="teal.600" color="white" p={4} borderTopRadius="md">
                <Heading
                    as="h5"
                    size="md"
                    textAlign="center"
                    flex="1"
                    id="implementation-container-heading"
                >
                    Implementation Details for {compositeKey}
                </Heading>
                <Button
                    size="sm"
                    onClick={toggleExpand}
                    colorScheme="whiteAlpha"
                    variant="outline"
                    aria-controls="implementation-content"
                    aria-expanded={isExpanded}
                    ml={4}
                >
                    {isExpanded ? 'Collapse' : 'Expand'}
                </Button>
            </Flex>

            <Collapse in={isExpanded} animateOpacity id="implementation-content">
                <Box p={4}>
                    <Flex justify="space-between" align="center" mb={4}>
                        <Flex wrap="wrap" gap={4}>
                            {implementationTypes.map((type) => (
                                <Button
                                    key={type}
                                    onClick={() => setSelectedImplementationType(type)}
                                    colorScheme={selectedImplementationType === type ? 'teal' : 'gray'}
                                    aria-pressed={selectedImplementationType === type ? 'true' : 'false'}
                                    variant={selectedImplementationType === type ? 'solid' : 'outline'}
                                    isDisabled={!isTypeAvailable(type)}
                                >
                                    {type}
                                </Button>
                            ))}
                        </Flex>
                        <IconButton
                            aria-label="Add or link implementation"
                            icon={<AddIcon />}
                            size="sm"
                            colorScheme="green"
                            variant="solid"
                            onClick={handleOpenModal}
                            ml={4}
                        />
                    </Flex>

                    {selectedImplementationType ? (
                        <Heading as="h6" size="sm" mb={2}>
                            Currently Viewing: {selectedImplementationType}
                        </Heading>
                    ) : (
                        <Text>No Implementation Type Selected</Text>
                    )}

                    <Box>
                        {filteredEvidence.length > 0 ? (
                            <EvidenceTypeMasterList evidence={filteredEvidence} />
                        ) : (
                            <Text>No Implementation Assigned to this Success Indicator</Text>
                        )}
                    </Box>
                </Box>
            </Collapse>

            <Modal isOpen={isOpen} onClose={onClose} size="xl">
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader>Manage Implementation</ModalHeader>
                    <ModalCloseButton />
                    <ModalBody>
                        <Tabs index={tabIndex} onChange={setTabIndex}>
                            <TabList>
                                <Tab>Create New</Tab>
                                <Tab>Link Existing</Tab>
                            </TabList>

                            <TabPanels>
                                <TabPanel>
                                    <VStack spacing={4}>
                                        <FormControl isRequired>
                                            <FormLabel>Type</FormLabel>
                                            <Select
                                                placeholder="Select implementation type"
                                                value={selectedType}
                                                onChange={(e) => setSelectedType(e.target.value)}
                                            >
                                                {implementationTypes.map((type) => (
                                                    <option key={type} value={type}>{type}</option>
                                                ))}
                                            </Select>
                                        </FormControl>
                                        <FormControl isRequired>
                                            <FormLabel>Title</FormLabel>
                                            <Input
                                                placeholder="Enter title"
                                                value={newImplementation.title}
                                                onChange={(e) => setNewImplementation({
                                                    ...newImplementation,
                                                    title: e.target.value
                                                })}
                                            />
                                        </FormControl>
                                        <FormControl isRequired>
                                            <FormLabel>Description</FormLabel>
                                            <Textarea
                                                placeholder="Enter description"
                                                value={newImplementation.description}
                                                onChange={(e) => setNewImplementation({
                                                    ...newImplementation,
                                                    description: e.target.value
                                                })}
                                                rows={4}
                                            />
                                        </FormControl>
                                    </VStack>
                                </TabPanel>

                                <TabPanel>
                                    <VStack spacing={4}>
                                        <FormControl isRequired>
                                            <FormLabel>Type</FormLabel>
                                            <Select
                                                placeholder="Select implementation type"
                                                value={selectedType}
                                                onChange={(e) => {
                                                    setSelectedType(e.target.value);
                                                    setSelectedExisting('');
                                                }}
                                            >
                                                {implementationTypes.map((type) => (
                                                    <option key={type} value={type}>{type}</option>
                                                ))}
                                            </Select>
                                        </FormControl>
                                        <FormControl isRequired>
                                            <FormLabel>Select Existing</FormLabel>
                                            <Select
                                                placeholder={isLoadingExisting ? "Loading..." : "Select implementation"}
                                                value={selectedExisting}
                                                onChange={(e) => {
                                                    setSelectedExisting(e.target.value);
                                                    const selected = existingImplementations.find(impl => impl.title === e.target.value);
                                                    setSelectedDescription(selected?.description || '');
                                                }}
                                                isDisabled={!selectedType || isLoadingExisting}
                                            >
                                                {existingImplementations.map((impl) => (
                                                    <option key={impl.unique_id} value={impl.title}>
                                                        {impl.title}
                                                    </option>
                                                ))}
                                            </Select>
                                        </FormControl>
                                        {selectedDescription && (
                                            <Box p={3} bg="gray.50" borderRadius="md" borderWidth="1px" borderColor="gray.200">
                                                <Text fontSize="sm" color="gray.700">
                                                    <Text as="span" fontWeight="bold">Description:</Text> {selectedDescription}
                                                </Text>
                                            </Box>
                                        )}
                                    </VStack>
                                </TabPanel>
                            </TabPanels>
                        </Tabs>
                    </ModalBody>
                    <ModalFooter>
                        <Button variant="ghost" mr={3} onClick={onClose} isDisabled={isSubmitting}>
                            Cancel
                        </Button>
                        {tabIndex === 0 ? (
                            <>
                                <Button
                                    colorScheme="blue"
                                    variant="outline"
                                    onClick={async () => {
                                        if (!selectedType || !newImplementation.title || !newImplementation.description) {
                                            toast({
                                                title: "Missing fields",
                                                description: "All fields are required.",
                                                status: "warning",
                                                duration: 3000,
                                                isClosable: true,
                                            });
                                            return;
                                        }
                                        setIsSubmitting(true);
                                        try {
                                            await createImplementation(
                                                selectedType,
                                                newImplementation.title,
                                                newImplementation.description
                                                // No yearIdentifier - just create
                                            );
                                            toast({
                                                title: "Success",
                                                description: `${selectedType} created.`,
                                                status: "success",
                                                duration: 3000,
                                                isClosable: true,
                                            });
                                            onClose();
                                        } catch (error) {
                                            toast({
                                                title: "Error",
                                                description: error.response?.data?.error || "Failed to create.",
                                                status: "error",
                                                duration: 3000,
                                                isClosable: true,
                                            });
                                        } finally {
                                            setIsSubmitting(false);
                                        }
                                    }}
                                    isLoading={isSubmitting}
                                    loadingText="Creating..."
                                    mr={2}
                                >
                                    Create Only
                                </Button>
                                <Button
                                    colorScheme="teal"
                                    onClick={handleCreateNew}
                                    isLoading={isSubmitting}
                                    loadingText="Creating..."
                                >
                                    Create & Assign
                                </Button>
                            </>
                        ) : (
                            <Button
                                colorScheme="teal"
                                onClick={handleLinkExisting}
                                isLoading={isSubmitting}
                                loadingText="Linking..."
                            >
                                Link
                            </Button>
                        )}
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </Box>
    );
}

export default ImplementationMasterContainer;