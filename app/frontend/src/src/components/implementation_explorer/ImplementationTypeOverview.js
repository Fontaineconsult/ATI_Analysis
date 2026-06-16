import React, { useState, useEffect, useContext } from 'react';
import {
    Box,
    Flex,
    VStack,
    HStack,
    Text,
    Button,
    Heading,
    FormControl,
    FormLabel,
    Input,
    Textarea,
    IconButton,
    Badge,
    CheckboxGroup,
    Checkbox,
    Wrap,
    WrapItem,
    Tooltip,
    Divider,
    useToast,
    useDisclosure,
    Tabs,
    TabList,
    TabPanels,
    Tab,
    TabPanel,
    Link,
    Alert,
    AlertIcon,
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalCloseButton,
    ModalBody,
    ModalFooter,
} from '@chakra-ui/react';
import { EditIcon, CheckIcon, CloseIcon, LinkIcon } from '@chakra-ui/icons';
import { useNavigate, useParams } from 'react-router-dom';
import {
    updateImplementation,
    assignPersonAsOwner,
    unassignPersonAsOwner,
    setImplementationDimensions,
} from '../../services/api/put';
import { fetchAllDimensions } from '../../services/api/get';
import { useDescriptors } from '../../hooks/useDescriptors';
import ParticipantsEditor from './ParticipantsEditor';
import { DataContext } from '../../context/DataContext';
import { SettingsContext } from '../../context/SettingsContext';
import { UserContext } from '../../context/UserContext';
import PersonAssignmentSelector from '../functional_components/PersonAssignmentSelector';

// New sub-viewers (same folder as this file)
import DocumentsViewer from './doc_components/DocumentsViewer';
import WebpagesViewer from './doc_components/WebpagesViewer';
import NotesViewer from './doc_components/NotesViewer';
import MessagesViewer from './doc_components/MessagesViewer';
import MetricsViewer from './doc_components/MetricsSection';
import YseAssignmentSelector from '../functional_components/YseAssignmentSelector';
import {navigateToIndicator} from "../../services/utils/tools";

// Implementation types that carry the classified_under edge to Dimension.
const DIMENSION_TYPES = ['Process', 'Project', 'Procedure', 'Service', 'InternalPolicy', 'Guidance'];
// The four doing-implementations carry the worked_on participant edge (the working team).
const PARTICIPANT_TYPES = ['Process', 'Project', 'Procedure', 'Service'];

function ImplementationTypeOverview({ implementationType, initialImplementationId }) {
    const { data, refreshImplementations } = useContext(DataContext);
    const { currentAcademicYear } = useContext(SettingsContext);
    const { individuals, loadAllIndividuals } = useContext(UserContext);
    const { describeField } = useDescriptors();

    const isDimensioned = DIMENSION_TYPES.includes(implementationType);
    const isParticipantType = PARTICIPANT_TYPES.includes(implementationType);
    const [dimensionOptions, setDimensionOptions] = useState([]);

    // Make sure the individuals list is loaded for the Owners tab dropdown.
    useEffect(() => {
        if (!individuals && loadAllIndividuals) {
            loadAllIndividuals();
        }
    }, [individuals, loadAllIndividuals]);

    // Load the seven AMM dimension options for the Details multi-select (doing-impls only).
    useEffect(() => {
        if (!isDimensioned) return;
        let cancelled = false;
        (async () => {
            try {
                const resp = await fetchAllDimensions();
                if (!cancelled) setDimensionOptions(resp?.data?.items || []);
            } catch (_) { /* non-fatal: the control just shows no options */ }
        })();
        return () => { cancelled = true; };
    }, [isDimensioned]);

    const [selectedImplId, setSelectedImplId] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState({ title: '', description: '', dimensions: [] });
    const toast = useToast();
    const navigate = useNavigate();
    const { campus } = useParams();
    const {
        isOpen: isManageYsesOpen,
        onOpen: onManageYsesOpen,
        onClose: onManageYsesClose,
    } = useDisclosure();

    const implementations = data.implementations?.[implementationType] || [];

    // Derive the *current* selected implementation from the freshest data
    const selectedImpl = selectedImplId
        ? implementations.find(i => i.unique_id === selectedImplId) || null
        : null;

    // Initial selection + keep selection valid across data refreshes
    useEffect(() => {
        if (implementations.length === 0) {
            setSelectedImplId(null);
            return;
        }

        // Prefer explicit ID from URL if present and exists
        if (initialImplementationId) {
            const fromParam = implementations.find(i => i.unique_id === initialImplementationId);
            if (fromParam) {
                setSelectedImplId(fromParam.unique_id);
                return;
            }
        }

        // Preserve previous selection if still present
        if (selectedImplId) {
            const stillExists = implementations.some(i => i.unique_id === selectedImplId);
            if (stillExists) return;
        }

        // Fallback to first item
        setSelectedImplId(implementations[0].unique_id);
    }, [implementations, initialImplementationId]); // eslint-disable-line react-hooks/exhaustive-deps

    // Update URL when implementation is selected
    const handleImplementationSelect = (impl) => {
        setSelectedImplId(impl.unique_id);
        navigate(`/${campus}/ati-explorer/implementations/${implementationType}/${impl.unique_id}`,
            { replace: true }
        );
    };

    // Copy link function
    const copyImplementationLink = () => {
        if (!selectedImpl) return;
        const url = `${window.location.origin}/ati/${campus}/ati-explorer/implementations/${implementationType}/${selectedImpl.unique_id}`;

        navigator.clipboard.writeText(url);
        toast({
            title: "Link copied!",
            description: "Direct link to this implementation copied to clipboard",
            status: "success",
            duration: 2000,
            isClosable: true,
        });
    };

    const handleEdit = () => {
        if (!selectedImpl) return;
        setEditForm({
            title: selectedImpl.title,
            description: selectedImpl.description,
            dimensions: (selectedImpl.dimensions || []).map((d) => d.handle),
        });
        setIsEditing(true);
    };

    const handleSave = async () => {
        if (!selectedImpl) return;
        try {
            await updateImplementation(
                implementationType,
                selectedImpl.unique_id,
                editForm.title,
                editForm.description
            );
            if (isDimensioned) {
                await setImplementationDimensions(
                    implementationType,
                    selectedImpl.unique_id,
                    editForm.dimensions || []
                );
            }
            toast({
                title: 'Success',
                description: 'Implementation updated successfully',
                status: 'success',
                duration: 3000,
                position: 'top-right',
                isClosable: true,
            });
            setIsEditing(false);
            await refreshImplementations(); // Re-render pulls fresh data; selectedImpl re-derives
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to update implementation',
                status: 'error',
                duration: 3000,
                position: 'top-right',
                isClosable: true,
            });
        }
    };

    const handleCancel = () => {
        setIsEditing(false);
        setEditForm({ title: '', description: '', dimensions: [] });
    };

    const formatDate = (dateString) => {
        if (!dateString) return null;
        return new Date(dateString).toLocaleDateString();
    };

    // Cards on the Evidence For tab show only YSEs at the currently-viewed campus.
    // Cross-campus visibility lives in the Manage Linked YSEs modal.
    const ysesAtCurrentCampus = (selectedImpl?.is_evidence_for || []).filter(
        (yse) => yse.campus?.abbreviation === campus
    );

    const totalSupporting =
        (selectedImpl?.supporting_documents?.length || 0) +
        (selectedImpl?.supporting_webpages?.length || 0) +
        (selectedImpl?.supporting_messages?.length || 0) +
        (selectedImpl?.supporting_notes?.length || 0) +
        (selectedImpl?.supporting_metrics?.length || 0);

    return (
        <Flex h="80vh" gap={6}>
            {/* Left Panel - Implementation List */}
            <Box
                flex="1"
                minW="0"
                borderWidth="1px"
                borderColor="gray.200"
                borderRadius="lg"
                bg="white"
                p={4}
                overflowY="auto"
                boxShadow="sm"
            >
                <Heading size="md" color="teal.700" mb={4} fontWeight="bold">
                    {implementationType}s ({implementations.length})
                </Heading>
                {implementations.length > 0 ? (
                    <VStack align="stretch" spacing={2} role="listbox" aria-label={`${implementationType} list`}>
                        {implementations.map((impl) => {
                            const isSelected = selectedImpl?.unique_id === impl.unique_id;
                            return (
                                <Box
                                    key={impl.unique_id}
                                    role="option"
                                    aria-selected={isSelected}
                                    onClick={() => handleImplementationSelect(impl)}
                                    cursor="pointer"
                                    bg={isSelected ? 'teal.50' : 'white'}
                                    borderWidth="1px"
                                    borderColor={isSelected ? 'teal.400' : 'gray.200'}
                                    borderLeftWidth="3px"
                                    borderLeftColor={isSelected ? 'teal.500' : 'transparent'}
                                    borderRadius="md"
                                    boxShadow="sm"
                                    px={3}
                                    py={2}
                                    _hover={{ borderColor: isSelected ? 'teal.400' : 'gray.300', boxShadow: 'md' }}
                                    transition="all 0.15s"
                                >
                                    <Text fontSize="sm" fontWeight={isSelected ? 'semibold' : 'medium'} color="gray.800" noOfLines={2}>
                                        {impl.title}
                                    </Text>
                                    <HStack spacing={1} flexWrap="wrap" mt={1}>
                                        <Badge colorScheme="teal" variant="subtle" fontSize="2xs" px={2} borderRadius="full">
                                            {impl.is_evidence_for?.length || 0} YSE
                                        </Badge>
                                        {Array.isArray(impl.campuses) && impl.campuses.map((abbrev) => (
                                            <Badge
                                                key={abbrev}
                                                colorScheme="gray"
                                                variant="subtle"
                                                fontSize="2xs"
                                                px={2}
                                                borderRadius="full"
                                                textTransform="uppercase"
                                            >
                                                {abbrev}
                                            </Badge>
                                        ))}
                                    </HStack>
                                </Box>
                            );
                        })}
                    </VStack>
                ) : (
                    <Text fontSize="sm" color="gray.500" fontStyle="italic">
                        No {implementationType}s yet.
                    </Text>
                )}
            </Box>

            {/* Right Panel - Details and Relationships */}
            <Box
                flex="2"
                minW="0"
                borderWidth="1px"
                borderColor="gray.200"
                borderRadius="lg"
                bg="white"
                p={5}
                overflowY="auto"
                boxShadow="sm"
            >
                {selectedImpl ? (
                    <Tabs colorScheme="teal">
                        <TabList>
                            <Tab
                                fontSize="sm"
                                fontWeight="semibold"
                                color="gray.600"
                                _selected={{ color: 'teal.600', borderColor: 'teal.500' }}
                            >
                                Details
                            </Tab>
                            <Tab
                                fontSize="sm"
                                fontWeight="semibold"
                                color="gray.600"
                                _selected={{ color: 'teal.600', borderColor: 'teal.500' }}
                            >
                                Evidence For ({ysesAtCurrentCampus.length})
                            </Tab>
                            <Tab
                                fontSize="sm"
                                fontWeight="semibold"
                                color="gray.600"
                                _selected={{ color: 'teal.600', borderColor: 'teal.500' }}
                            >
                                {`Supporting Docs (${totalSupporting})`}
                            </Tab>
                            <Tab
                                fontSize="sm"
                                fontWeight="semibold"
                                color="gray.600"
                                _selected={{ color: 'teal.600', borderColor: 'teal.500' }}
                            >
                                {`Owners (${selectedImpl.owned_by?.length || 0})`}
                            </Tab>
                        </TabList>

                        <TabPanels>
                            {/* Details Tab */}
                            <TabPanel px={0} py={4}>
                                <VStack align="stretch" spacing={6}>
                                    <Flex justify="space-between" align="center">
                                        <Heading size="md" color="teal.700" fontWeight="bold">
                                            Details
                                        </Heading>
                                        {!isEditing ? (
                                            <IconButton
                                                icon={<EditIcon />}
                                                size="xs"
                                                colorScheme="teal"
                                                variant="outline"
                                                onClick={handleEdit}
                                                aria-label="Edit"
                                            />
                                        ) : (
                                            <HStack spacing={2}>
                                                <IconButton
                                                    icon={<CheckIcon />}
                                                    size="xs"
                                                    colorScheme="teal"
                                                    onClick={handleSave}
                                                    aria-label="Save"
                                                />
                                                <IconButton
                                                    icon={<CloseIcon />}
                                                    size="xs"
                                                    colorScheme="gray"
                                                    variant="outline"
                                                    onClick={handleCancel}
                                                    aria-label="Cancel"
                                                />
                                            </HStack>
                                        )}
                                    </Flex>

                                    <Divider borderColor="gray.200" />

                                    <FormControl>
                                        <FormLabel fontSize="xs" color="gray.600" fontWeight="semibold">
                                            Title
                                        </FormLabel>
                                        {isEditing ? (
                                            <Input
                                                value={editForm.title}
                                                onChange={(e) =>
                                                    setEditForm({
                                                        ...editForm,
                                                        title: e.target.value,
                                                    })
                                                }
                                                size="sm"
                                                borderColor="gray.200"
                                                _hover={{ borderColor: 'gray.300' }}
                                                _focus={{ borderColor: 'teal.500', boxShadow: '0 0 0 1px teal.500' }}
                                            />
                                        ) : (
                                            <Text fontSize="sm" color="gray.700">
                                                {selectedImpl.title}
                                            </Text>
                                        )}
                                    </FormControl>

                                    <FormControl>
                                        <FormLabel fontSize="xs" color="gray.600" fontWeight="semibold">
                                            Description
                                        </FormLabel>
                                        {isEditing ? (
                                            <Textarea
                                                value={editForm.description}
                                                onChange={(e) =>
                                                    setEditForm({
                                                        ...editForm,
                                                        description: e.target.value,
                                                    })
                                                }
                                                rows={6}
                                                size="sm"
                                                borderColor="gray.200"
                                                _hover={{ borderColor: 'gray.300' }}
                                                _focus={{ borderColor: 'teal.500', boxShadow: '0 0 0 1px teal.500' }}
                                            />
                                        ) : (
                                            <Text fontSize="sm" color="gray.700" whiteSpace="pre-wrap">
                                                {selectedImpl.description}
                                            </Text>
                                        )}
                                    </FormControl>

                                    {isDimensioned && (
                                        <FormControl>
                                            <FormLabel fontSize="xs" color="gray.600" fontWeight="semibold">
                                                {describeField?.('Implementation', 'dimensions')?.title || 'Dimensions'}
                                            </FormLabel>
                                            {isEditing ? (
                                                <>
                                                    <CheckboxGroup
                                                        value={editForm.dimensions}
                                                        onChange={(vals) =>
                                                            setEditForm({ ...editForm, dimensions: vals })
                                                        }
                                                    >
                                                        <Wrap spacing={3}>
                                                            {dimensionOptions.map((d) => (
                                                                <WrapItem key={d.handle}>
                                                                    <Tooltip label={d.description} hasArrow openDelay={300}>
                                                                        <Box>
                                                                            <Checkbox size="sm" value={d.handle}>
                                                                                {d.name}
                                                                            </Checkbox>
                                                                        </Box>
                                                                    </Tooltip>
                                                                </WrapItem>
                                                            ))}
                                                        </Wrap>
                                                    </CheckboxGroup>
                                                    {describeField?.('Implementation', 'dimensions')?.description_short && (
                                                        <Text fontSize="2xs" color="gray.400" mt={1}>
                                                            {describeField('Implementation', 'dimensions').description_short}
                                                        </Text>
                                                    )}
                                                </>
                                            ) : (
                                                Array.isArray(selectedImpl.dimensions) && selectedImpl.dimensions.length > 0 ? (
                                                    <HStack spacing={1} flexWrap="wrap">
                                                        {selectedImpl.dimensions.map((d) => (
                                                            <Badge
                                                                key={d.handle}
                                                                colorScheme="purple"
                                                                fontSize="xs"
                                                                px={2}
                                                                py={1}
                                                                borderRadius="md"
                                                            >
                                                                {d.name}
                                                            </Badge>
                                                        ))}
                                                    </HStack>
                                                ) : (
                                                    <Text fontSize="xs" color="gray.500" fontStyle="italic">
                                                        No AMM dimensions assigned.
                                                    </Text>
                                                )
                                            )}
                                        </FormControl>
                                    )}

                                    <FormControl>
                                        <FormLabel fontSize="xs" color="gray.600" fontWeight="semibold">
                                            Campuses
                                        </FormLabel>
                                        {Array.isArray(selectedImpl.campuses) && selectedImpl.campuses.length > 0 ? (
                                            <HStack spacing={1} flexWrap="wrap">
                                                {selectedImpl.campuses.map((abbrev) => (
                                                    <Badge
                                                        key={abbrev}
                                                        colorScheme="teal"
                                                        fontSize="xs"
                                                        px={2}
                                                        py={1}
                                                        borderRadius="md"
                                                        textTransform="uppercase"
                                                    >
                                                        {abbrev}
                                                    </Badge>
                                                ))}
                                            </HStack>
                                        ) : (
                                            <Text fontSize="xs" color="gray.500" fontStyle="italic">
                                                Not yet wired to any campus's evidence.
                                            </Text>
                                        )}
                                    </FormControl>

                                    {isParticipantType && (
                                        <FormControl>
                                            <FormLabel fontSize="xs" color="gray.600" fontWeight="semibold">
                                                Assets it applies to
                                            </FormLabel>
                                            {Array.isArray(selectedImpl.assets) && selectedImpl.assets.length > 0 ? (
                                                <VStack align="stretch" spacing={1}>
                                                    {selectedImpl.assets.map((a) => (
                                                        <HStack
                                                            key={a.unique_id}
                                                            spacing={2}
                                                            flexWrap="wrap"
                                                            borderWidth="1px"
                                                            borderColor="gray.200"
                                                            borderRadius="md"
                                                            px={3}
                                                            py={1.5}
                                                            bg="white"
                                                        >
                                                            <Text fontSize="sm" color="gray.800" fontWeight="medium">{a.title}</Text>
                                                            {a.scope && (
                                                                <Badge colorScheme="gray" fontSize="2xs">{a.scope}</Badge>
                                                            )}
                                                            {a.asset_class && (
                                                                <Badge colorScheme="teal" fontSize="2xs">
                                                                    {a.asset_class.replace(/_/g, ' ')}
                                                                </Badge>
                                                            )}
                                                            {(a.reach || []).map((r) => (
                                                                <Badge
                                                                    key={r}
                                                                    colorScheme={r === 'direct' ? 'green' : 'blue'}
                                                                    variant="subtle"
                                                                    fontSize="2xs"
                                                                >
                                                                    {r === 'direct' ? 'remediated' : 'via interface'}
                                                                </Badge>
                                                            ))}
                                                            <Text fontSize="2xs" color="gray.400" fontFamily="mono">
                                                                {a.asset_identifier}
                                                            </Text>
                                                        </HStack>
                                                    ))}
                                                </VStack>
                                            ) : (
                                                <Text fontSize="xs" color="gray.500" fontStyle="italic">
                                                    Not linked to any remediated asset or interface.
                                                </Text>
                                            )}
                                        </FormControl>
                                    )}

                                    {isParticipantType && (
                                        <FormControl>
                                            <FormLabel fontSize="xs" color="gray.600" fontWeight="semibold">
                                                Participants (working team)
                                            </FormLabel>
                                            <ParticipantsEditor
                                                implementationType={implementationType}
                                                implementationUniqueId={selectedImpl.unique_id}
                                                participants={selectedImpl.participants || []}
                                                individuals={individuals || []}
                                                onSaved={refreshImplementations}
                                            />
                                        </FormControl>
                                    )}
                                </VStack>
                            </TabPanel>

                            {/* Evidence For Tab */}
                            <TabPanel px={0} py={4}>
                                <VStack align="stretch" spacing={4}>
                                    <Flex justify="space-between" align="center">
                                        <Heading size="sm" color="teal.700" fontWeight="bold">
                                            Success Indicators This Evidences
                                        </Heading>
                                        <Button
                                            size="xs"
                                            colorScheme="teal"
                                            variant="outline"
                                            onClick={onManageYsesOpen}
                                        >
                                            Manage Linked YSEs
                                        </Button>
                                    </Flex>
                                    {ysesAtCurrentCampus.length > 0 ? (
                                        ysesAtCurrentCampus.map((yse) => (
                                            <Box
                                                key={yse.unique_id}
                                                p={4}
                                                borderWidth="1px"
                                                borderColor="gray.200"
                                                borderRadius="lg"
                                                bg="white"
                                                boxShadow="sm"
                                                _hover={{ boxShadow: 'md' }}
                                                transition="box-shadow 0.2s"
                                            >
                                                <VStack align="stretch" spacing={3}>
                                                    <HStack spacing={2} align="baseline" flexWrap="wrap">
                                                        <Text
                                                            fontWeight="bold"
                                                            fontSize="sm"
                                                            color="teal.700"
                                                            cursor="pointer"
                                                            _hover={{ color: 'teal.600', textDecoration: 'underline' }}
                                                            onClick={() => navigateToIndicator(navigate, yse.indicator_composite_key, campus)}
                                                        >
                                                            {yse.year_identifier}
                                                        </Text>
                                                        {yse.campus?.abbreviation && (
                                                            <Badge
                                                                colorScheme="teal"
                                                                fontSize="xs"
                                                                px={2}
                                                                py={0.5}
                                                                borderRadius="md"
                                                                textTransform="uppercase"
                                                            >
                                                                {yse.campus.abbreviation}
                                                            </Badge>
                                                        )}
                                                    </HStack>

                                                    {yse.success_indicator && (
                                                        <Box>
                                                            <Text
                                                                fontSize="xs"
                                                                color="teal.600"
                                                                fontWeight="semibold"
                                                                textTransform="uppercase"
                                                                mb={1}
                                                            >
                                                                Success Indicator
                                                            </Text>
                                                            <Text fontSize="sm" color="gray.700">
                                                                {yse.indicator_number ? `${yse.indicator_number}. ` : ''}
                                                                {yse.success_indicator}
                                                            </Text>
                                                        </Box>
                                                    )}
                                                </VStack>
                                            </Box>
                                        ))
                                    ) : (
                                        <Text fontSize="xs" color="gray.500" fontStyle="italic">
                                            No success indicators linked to this {implementationType} at {(campus || '').toUpperCase()}.
                                            {(selectedImpl.is_evidence_for?.length || 0) > 0 && (
                                                <> It is linked at other campuses — open “Manage Linked YSEs” to see and add.</>
                                            )}
                                        </Text>
                                    )}
                                </VStack>
                            </TabPanel>

                            {/* Supporting Documentation Tab */}
                            <TabPanel px={0} py={4}>
                                <VStack align="stretch" spacing={6}>
                                    <DocumentsViewer
                                        documents={selectedImpl.supporting_documents || []}
                                        implementation_id={selectedImpl.unique_id}
                                        implementation_type={implementationType}
                                        formatDate={formatDate}
                                    />

                                    <Divider borderColor="gray.200" />

                                    <WebpagesViewer
                                        webpages={selectedImpl.supporting_webpages || []}
                                        implementation_id={selectedImpl.unique_id}
                                        implementation_type={implementationType}
                                        formatDate={formatDate}
                                    />

                                    <Divider borderColor="gray.200" />

                                    <NotesViewer
                                        notes={selectedImpl.supporting_notes || []}
                                        implementation_id={selectedImpl.unique_id}
                                        implementation_type={implementationType}
                                        formatDate={formatDate}
                                    />

                                    <Divider borderColor="gray.200" />

                                    <MessagesViewer
                                        messages={selectedImpl.supporting_messages || []}
                                        implementation_id={selectedImpl.unique_id}
                                        implementation_type={implementationType}
                                        formatDate={formatDate}
                                    />

                                    <Divider borderColor="gray.200" />

                                    <MetricsViewer
                                        metrics={selectedImpl.supporting_metrics || []}
                                        implementation_id={selectedImpl.unique_id}
                                        implementation_type={implementationType}
                                    />
                                </VStack>
                            </TabPanel>

                            {/* Owners Tab — manage who owns this implementation */}
                            <TabPanel px={0} py={4}>
                                <VStack align="stretch" spacing={4}>
                                    <Heading size="md" color="teal.700" fontWeight="bold">
                                        Owners
                                    </Heading>
                                    <Text fontSize="sm" color="gray.600">
                                        People who own this {implementationType}. Owners are accountable
                                        for the work but may delegate execution.
                                    </Text>
                                    <Divider borderColor="gray.200" />
                                    <PersonAssignmentSelector
                                        assignedPersons={selectedImpl.owned_by || []}
                                        candidatePersons={(individuals || []).filter((i) => i.active)}
                                        onAssign={(personUniqueId) =>
                                            assignPersonAsOwner(
                                                implementationType,
                                                selectedImpl.unique_id,
                                                personUniqueId,
                                            )
                                        }
                                        onUnassign={(personUniqueId) =>
                                            unassignPersonAsOwner(
                                                implementationType,
                                                selectedImpl.unique_id,
                                                personUniqueId,
                                            )
                                        }
                                        afterChange={refreshImplementations}
                                        placeholder="Select person to assign as owner"
                                        assignLabel="Assign as Owner"
                                    />
                                </VStack>
                            </TabPanel>
                        </TabPanels>
                    </Tabs>
                ) : (
                    <Alert status="info" borderRadius="lg" fontSize="sm">
                        <AlertIcon />
                        Select an implementation to view details
                    </Alert>
                )}
            </Box>

            {/* Manage Linked YSEs modal — inverse-mount of the YSE-side attach flow */}
            <Modal isOpen={isManageYsesOpen} onClose={onManageYsesClose} size="3xl" scrollBehavior="inside">
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader fontSize="md" color="teal.700">
                        Manage Linked YSEs
                        {selectedImpl?.title && (
                            <Text as="span" fontSize="sm" color="gray.500" fontWeight="normal" ml={2}>
                                — {selectedImpl.title}
                            </Text>
                        )}
                    </ModalHeader>
                    <ModalCloseButton />
                    <ModalBody pb={6}>
                        {selectedImpl && (
                            <YseAssignmentSelector
                                entityType="Implementation"
                                entityTitle={selectedImpl.title}
                                implementationType={implementationType}
                                academicYear={currentAcademicYear}
                                currentLinks={selectedImpl.is_evidence_for || []}
                                scopeCampus={campus}
                                onChange={refreshImplementations}
                            />
                        )}
                    </ModalBody>
                    <ModalFooter>
                        <Button size="sm" colorScheme="teal" onClick={onManageYsesClose}>
                            Done
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </Flex>
    );
}

export default ImplementationTypeOverview;
