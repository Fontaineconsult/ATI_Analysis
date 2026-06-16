import React, { useState, useEffect, useContext } from 'react';
import {
    Box,
    Button,
    Flex,
    Heading,
    Text,
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalCloseButton,
    useDisclosure,
    Tabs,
    TabList,
    TabPanels,
    Tab,
    TabPanel,
} from '@chakra-ui/react';
import { AddIcon } from '@chakra-ui/icons';
import EvidenceTypeMasterList from '../evidence/EvidenceTypeMasterList';
import CreateImplementationModal from './CreateImplementation';
import LinkImplementationModal from './LinkImplementation';
import { DataContext } from '../../../context/DataContext';
import { useSettings } from '../../../context/SettingsContext';

const IMPLEMENTATION_TYPES = ['Tracking', 'Guidance', 'Process', 'Project', 'Procedure', 'InternalPolicy', 'Service'];

/**
 * Implementations for a single indicator's evidence — flattened for fast access (no expand/
 * collapse): the type chips (with counts) and the selected type's list are always visible, and
 * Add is one click. Used inside SuccessIndicatorDetailPanel.
 */
function ImplementationMasterContainer({ evidenceData = {}, yearIdentifier }) {
    // Drop any phantom entry with no node type (the compound query leaves one when
    // an indicator has zero implementations) so the count reads 0, not "Implementations (1)".
    const { evidenceTypes: rawEvidenceTypes = [] } = evidenceData;
    const evidenceTypes = rawEvidenceTypes.filter((et) => et && et.type);
    const [selectedType, setSelectedType] = useState(null);
    const [tabIndex, setTabIndex] = useState(0);
    const { isOpen, onOpen, onClose } = useDisclosure();
    const { loadSingleWorkingGroupData, refreshImplementations } = useContext(DataContext);
    const { currentWorkingGroup } = useSettings();

    const getTypeCount = (type) =>
        evidenceTypes.filter((et) => et.type === type || et.evidenceType?.properties?.title === type).length;
    const isTypeAvailable = (type) => getTypeCount(type) > 0;

    // Auto-select the first type that has items; reselect if the current selection empties out.
    useEffect(() => {
        if (!isTypeAvailable(selectedType)) {
            setSelectedType(IMPLEMENTATION_TYPES.find(isTypeAvailable) || null);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [evidenceTypes]);

    const filteredEvidence = evidenceTypes.filter(
        (et) => et.type === selectedType || et.evidenceType?.properties?.title === selectedType,
    );
    const totalCount = evidenceTypes.length;

    const handleOpenModal = () => { setTabIndex(0); onOpen(); };
    const handleModalClose = () => { onClose(); if (refreshImplementations) refreshImplementations(); };
    const refreshAll = () => {
        if (refreshImplementations) refreshImplementations();
        if (loadSingleWorkingGroupData && currentWorkingGroup) loadSingleWorkingGroupData(currentWorkingGroup);
    };

    return (
        <Box bg="white" borderWidth="1px" borderColor="gray.200" borderRadius="lg" boxShadow="sm" p={4}>
            <Flex justify="space-between" align="center" mb={3}>
                <Heading as="h6" size="xs" color="teal.700" textTransform="uppercase" letterSpacing="wide">
                    Implementations ({totalCount})
                </Heading>
                <Button size="xs" colorScheme="teal" leftIcon={<AddIcon />} onClick={handleOpenModal}>
                    Add
                </Button>
            </Flex>

            {/* Type chips with counts — available types are clickable, empty ones dimmed */}
            <Flex wrap="wrap" gap={2} mb={3}>
                {IMPLEMENTATION_TYPES.map((type) => {
                    const count = getTypeCount(type);
                    const available = count > 0;
                    const isSel = selectedType === type;
                    return (
                        <Button
                            key={type}
                            size="xs"
                            variant={isSel ? 'solid' : 'outline'}
                            colorScheme={isSel ? 'teal' : 'gray'}
                            isDisabled={!available}
                            opacity={available ? 1 : 0.5}
                            onClick={() => setSelectedType(type)}
                        >
                            {type}{available ? ` (${count})` : ''}
                        </Button>
                    );
                })}
            </Flex>

            {selectedType ? (
                <EvidenceTypeMasterList
                    evidence={filteredEvidence}
                    yearIdentifier={yearIdentifier}
                    onRefresh={refreshAll}
                />
            ) : (
                <Box py={4} textAlign="center">
                    <Text fontSize="sm" color="gray.500" mb={2}>No implementations yet for this indicator.</Text>
                    <Button size="xs" colorScheme="teal" leftIcon={<AddIcon />} onClick={handleOpenModal}>
                        Add the first implementation
                    </Button>
                </Box>
            )}

            {/* Add — Create new or Link existing */}
            <Modal isOpen={isOpen} onClose={handleModalClose} size="2xl">
                <ModalOverlay />
                <ModalContent borderRadius="lg">
                    <ModalHeader fontSize="md" color="gray.800" borderBottomWidth="1px" borderColor="gray.200" pb={3}>
                        Manage Implementation
                    </ModalHeader>
                    <ModalCloseButton borderRadius="lg" />
                    <ModalBody py={4}>
                        <Tabs index={tabIndex} onChange={setTabIndex} colorScheme="teal" size="sm">
                            <TabList borderBottomColor="gray.200">
                                <Tab fontSize="sm">Create New</Tab>
                                <Tab fontSize="sm">Link Existing</Tab>
                            </TabList>
                            <TabPanels>
                                <TabPanel px={0} pt={4}>
                                    <CreateImplementationModal
                                        implementationTypes={IMPLEMENTATION_TYPES}
                                        yearIdentifier={yearIdentifier}
                                        onClose={handleModalClose}
                                        onSuccess={() => {}}
                                        currentWorkingGroup={currentWorkingGroup}
                                        loadSingleWorkingGroupData={loadSingleWorkingGroupData}
                                    />
                                </TabPanel>
                                <TabPanel px={0} pt={4}>
                                    <LinkImplementationModal
                                        implementationTypes={IMPLEMENTATION_TYPES}
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
