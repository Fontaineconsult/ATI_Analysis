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
    TabPanel
} from '@chakra-ui/react';
import { AddIcon } from '@chakra-ui/icons';
import EvidenceTypeMasterList from '../evidence/EvidenceTypeMasterList';
import CreateImplementationModal from './CreateImplementation';
import LinkImplementationModal from './LinkImplementation';
import { DataContext } from '../../../context/DataContext';
import { useSettings } from '../../../context/SettingsContext';

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

    return (
        <Box
            tabIndex={0}
            role="region"
            aria-labelledby="implementation-container-heading"
            aria-expanded={isExpanded}
            borderWidth="1px"
            borderColor="teal.300"
            borderRadius="lg"
            mt={6}
            bg="white"
            boxShadow="sm"
            transition="all 0.2s"
            _hover={{ boxShadow: 'md' }}
        >
            <Flex
                justify="space-between"
                align="center"
                bg="teal.600"
                color="white"
                p={4}
                borderTopRadius="lg"
            >
                <Heading
                    as="h5"
                    size="md"
                    textAlign="center"
                    flex="1"
                    id="implementation-container-heading"
                    fontWeight="bold"
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
                    borderRadius="lg"
                    _hover={{ bg: 'whiteAlpha.200' }}
                    transition="all 0.2s"
                >
                    {isExpanded ? 'Collapse' : 'Expand'}
                </Button>
            </Flex>

            <Collapse in={isExpanded} animateOpacity id="implementation-content">
                <Box p={6}>
                    <Flex justify="space-between" align="center" mb={4}>
                        <Flex wrap="wrap" gap={3}>
                            {implementationTypes.map((type) => (
                                <Button
                                    key={type}
                                    onClick={() => setSelectedImplementationType(type)}
                                    colorScheme={selectedImplementationType === type ? 'teal' : 'gray'}
                                    aria-pressed={selectedImplementationType === type ? 'true' : 'false'}
                                    variant={selectedImplementationType === type ? 'solid' : 'outline'}
                                    isDisabled={!isTypeAvailable(type)}
                                    size="sm"
                                    borderRadius="lg"
                                    _hover={{
                                        boxShadow: 'md',
                                        transform: 'translateY(-1px)'
                                    }}
                                    transition="all 0.2s"
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
                            borderRadius="lg"
                            _hover={{
                                boxShadow: 'md',
                                transform: 'scale(1.05)'
                            }}
                            transition="all 0.2s"
                        />
                    </Flex>

                    {selectedImplementationType ? (
                        <Heading
                            as="h6"
                            size="sm"
                            mb={3}
                            color="teal.700"
                            fontWeight="semibold"
                        >
                            Currently Viewing: {selectedImplementationType}
                        </Heading>
                    ) : (
                        <Text color="gray.600" fontSize="sm">
                            No Implementation Type Selected
                        </Text>
                    )}

                    <Box
                        p={4}
                        bg="gray.50"
                        borderRadius="lg"
                        borderWidth="1px"
                        borderColor="gray.200"
                    >
                        {filteredEvidence.length > 0 ? (
                            <EvidenceTypeMasterList evidence={filteredEvidence} />
                        ) : (
                            <Text color="gray.500" fontSize="sm">
                                No Implementation Assigned to this Success Indicator
                            </Text>
                        )}
                    </Box>
                </Box>
            </Collapse>

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
                                <Tab
                                    _selected={{
                                        color: 'teal.600',
                                        borderBottomColor: 'teal.500',
                                        fontWeight: 'semibold'
                                    }}
                                    fontSize="sm"
                                >
                                    Create New
                                </Tab>
                                <Tab
                                    _selected={{
                                        color: 'teal.600',
                                        borderBottomColor: 'teal.500',
                                        fontWeight: 'semibold'
                                    }}
                                    fontSize="sm"
                                >
                                    Link Existing
                                </Tab>
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