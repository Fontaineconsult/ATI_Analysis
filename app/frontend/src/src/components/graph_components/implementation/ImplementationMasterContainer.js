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
    ModalCloseButton,
    useDisclosure,
    IconButton,
    Tabs,
    TabList,
    TabPanels,
    Tab,
    TabPanel,
    VStack,
    HStack,
    Badge
} from '@chakra-ui/react';
import { AddIcon, ChevronDownIcon, ChevronUpIcon } from '@chakra-ui/icons';
import EvidenceTypeMasterList from '../evidence/EvidenceTypeMasterList';
import CreateImplementationModal from './CreateImplementation';
import LinkImplementationModal from './LinkImplementation';
import { DataContext } from '../../../context/DataContext';
import { useSettings } from '../../../context/SettingsContext';
import { getDefinition } from '../../../context/definitions';

function ImplementationMasterContainer({ evidenceData = {}, compositeKey, yearIdentifier }) {
    const { evidenceTypes = [] } = evidenceData;
    const [selectedImplementationType, setSelectedImplementationType] = useState(null);
    const [isExpanded, setIsExpanded] = useState(false);
    const [tabIndex, setTabIndex] = useState(0);

    const { isOpen, onOpen, onClose } = useDisclosure();
    const { loadSingleWorkingGroupData, refreshImplementations } = useContext(DataContext);
    const { currentWorkingGroup } = useSettings();

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

    const handleOpenModal = () => {
        setTabIndex(0);
        onOpen();
    };

    const handleModalClose = () => {
        onClose();
        if (refreshImplementations) {
            refreshImplementations();
        }
    };

    const selectedTypeDefinition = selectedImplementationType ? getDefinition(selectedImplementationType) : null;

    // Count implementations by type
    const getTypeCount = (type) => {
        return evidenceTypes.filter(evidenceType => {
            const directTypeMatch = evidenceType.type && evidenceType.type === type;
            const nestedTypeMatch = evidenceType.evidenceType?.properties?.title === type;
            return directTypeMatch || nestedTypeMatch;
        }).length;
    };

    return (
        <Box
            borderWidth="1px"
            borderColor="gray.200"
            borderRadius="lg"
            mt={6}
            bg="white"
            boxShadow="sm"
            transition="all 0.2s"
            _hover={{ boxShadow: 'md' }}
        >
            {/* Header Section */}
            <Flex
                justify="space-between"
                align="center"
                p={4}
                borderTopRadius="lg"
                borderBottom="1px"
                borderColor="gray.200"
                bg="teal.400"
                transition="background-color 0.2s"
            >
                <HStack spacing={3}>
                    <Heading
                        size="sm"
                        color="white"
                        fontWeight="bold"
                    >
                        Implementation Details
                    </Heading>
                </HStack>
                <Button
                    size="xs"
                    onClick={toggleExpand}
                    bg="whiteAlpha.200"
                    color="white"
                    borderWidth="1px"
                    borderColor="whiteAlpha.400"
                    rightIcon={isExpanded ? <ChevronUpIcon /> : <ChevronDownIcon />}
                    _hover={{
                        bg: 'whiteAlpha.300',
                        borderColor: 'whiteAlpha.600'
                    }}
                >
                    {isExpanded ? 'Collapse' : 'Expand'}
                </Button>
            </Flex>

            <Collapse in={isExpanded} animateOpacity>
                <VStack align="stretch" spacing={4} p={6}>
                    {/* Implementation Type Selector */}
                    <Box>
                        <Flex justify="space-between" align="center" mb={3}>
                            <Text fontSize="xs" color="gray.600" fontWeight="semibold" textTransform="uppercase">
                                Select Implementation Type
                            </Text>
                            <IconButton
                                aria-label="Add or link implementation"
                                icon={<AddIcon />}
                                size="xs"
                                colorScheme="teal"
                                onClick={handleOpenModal}
                                borderRadius="md"
                            />
                        </Flex>

                        <Flex wrap="wrap" gap={2}>
                            {implementationTypes.map((type) => {
                                const count = getTypeCount(type);
                                const isAvailable = isTypeAvailable(type);
                                const isSelected = selectedImplementationType === type;

                                return (
                                    <Button
                                        key={type}
                                        onClick={() => setSelectedImplementationType(type)}
                                        size="sm"
                                        variant={isSelected ? 'solid' : 'outline'}
                                        colorScheme={isSelected ? 'teal' : 'gray'}
                                        isDisabled={!isAvailable}
                                        borderRadius="md"
                                        position="relative"
                                        pr={count > 1 ? 10 : 5}
                                        px={6}
                                        py={3}
                                        opacity={!isAvailable ? 0.5 : 1}
                                        _disabled={{
                                            opacity: 0.5,
                                            cursor: 'not-allowed',
                                            _hover: {
                                                bg: isSelected ? 'teal.500' : 'transparent'
                                            }
                                        }}
                                    >
                                        {type}
                                    </Button>
                                );
                            })}
                        </Flex>
                    </Box>

                    {/* Definition Box */}
                    {selectedTypeDefinition && (
                        <Box
                            p={4}
                            bg="gray.50"
                            borderRadius="lg"
                            borderLeft="3px solid"
                            borderLeftColor="teal.500"
                        >
                            <Text fontSize="xs" color="teal.600" fontWeight="semibold" textTransform="uppercase" mb={2}>
                                {selectedTypeDefinition.name} Definition
                            </Text>
                            <Text fontSize="sm" color="gray.700">
                                {selectedTypeDefinition.description}
                            </Text>
                        </Box>
                    )}

                    {/* Evidence List Section */}
                    <Box
                        p={3}
                        bg="gray.50"
                        borderRadius="lg"
                        borderWidth="1px"
                        borderColor="gray.200"
                    >
                        {!selectedImplementationType ? (
                            <Text color="gray.500" fontSize="sm" textAlign="center" py={3}>
                                Select an implementation type to view details
                            </Text>
                        ) : (
                            <>
                                <Flex justify="space-between" align="center" mb={2}>
                                    <Text fontSize="xs" color="gray.600" fontWeight="semibold" textTransform="uppercase">
                                        {selectedImplementationType} ({filteredEvidence.length})
                                    </Text>
                                    {filteredEvidence.length === 0 && (
                                        <Button
                                            size="xs"
                                            colorScheme="teal"
                                            onClick={handleOpenModal}
                                            leftIcon={<AddIcon />}
                                        >
                                            Add First
                                        </Button>
                                    )}
                                </Flex>

                                {filteredEvidence.length > 0 ? (
                                    <EvidenceTypeMasterList evidence={filteredEvidence} />
                                ) : (
                                    <Text color="gray.500" fontSize="sm" textAlign="center" py={2}>
                                        No implementations found
                                    </Text>
                                )}
                            </>
                        )}
                    </Box>
                </VStack>
            </Collapse>

            {/* Modal remains the same */}
            <Modal isOpen={isOpen} onClose={handleModalClose} size="2xl">
                <ModalOverlay />
                <ModalContent borderRadius="lg">
                    <ModalHeader
                        fontSize="md"
                        color="gray.800"
                        borderBottomWidth="1px"
                        borderColor="gray.200"
                        pb={3}
                    >
                        Manage Implementation
                    </ModalHeader>
                    <ModalCloseButton borderRadius="lg" />
                    <ModalBody py={4}>
                        <Tabs
                            index={tabIndex}
                            onChange={setTabIndex}
                            colorScheme="teal"
                            size="sm"
                        >
                            <TabList borderBottomColor="gray.200">
                                <Tab fontSize="sm">Create New</Tab>
                                <Tab fontSize="sm">Link Existing</Tab>
                            </TabList>

                            <TabPanels>
                                <TabPanel px={0} pt={4}>
                                    <CreateImplementationModal
                                        implementationTypes={implementationTypes}
                                        yearIdentifier={yearIdentifier}
                                        onClose={handleModalClose}
                                        onSuccess={() => {}}
                                        currentWorkingGroup={currentWorkingGroup}
                                        loadSingleWorkingGroupData={loadSingleWorkingGroupData}
                                    />
                                </TabPanel>

                                <TabPanel px={0} pt={4}>
                                    <LinkImplementationModal
                                        implementationTypes={implementationTypes}
                                        yearIdentifier={yearIdentifier}
                                        onClose={handleModalClose}
                                        onSuccess={() => {}}
                                        currentWorkingGroup={currentWorkingGroup}
                                        loadSingleWorkingGroupData={loadSingleWorkingGroupData}
                                    />
                                </TabPanel>
                            </TabPanels>
                        </Tabs>
                    </ModalBody>
                </ModalContent>
            </Modal>
        </Box>
    );
}

export default ImplementationMasterContainer;