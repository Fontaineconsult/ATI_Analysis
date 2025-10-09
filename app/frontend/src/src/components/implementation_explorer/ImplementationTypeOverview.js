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
    Divider,
    useToast,
    Tabs,
    TabList,
    TabPanels,
    Tab,
    TabPanel,
    Link,
    Alert,
    AlertIcon,
} from '@chakra-ui/react';
import { EditIcon, CheckIcon, CloseIcon, LinkIcon } from '@chakra-ui/icons';
import { useNavigate } from 'react-router-dom';
import { updateImplementation } from '../../services/api/put';
import { DataContext } from '../../context/DataContext';

// New sub-viewers (same folder as this file)
import DocumentsViewer from './doc_components/DocumentsViewer';
import WebpagesViewer from './doc_components/WebpagesViewer';
import NotesViewer from './doc_components/NotesViewer';
import MessagesViewer from './doc_components/MessagesViewer';
import MetricsViewer from './doc_components/MetricsSection';

function ImplementationTypeOverview({ implementationType, initialImplementationId }) {
    const { data, refreshImplementations } = useContext(DataContext);
    const [selectedImpl, setSelectedImpl] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState({ title: '', description: '' });
    const toast = useToast();
    const navigate = useNavigate();

    const implementations = data.implementations?.[implementationType] || [];

    // Handle initial selection based on URL parameter
    useEffect(() => {
        if (implementations.length > 0) {
            let implToSelect = null;

            if (initialImplementationId) {
                // Find implementation by unique_id
                implToSelect = implementations.find(impl =>
                    impl.unique_id === initialImplementationId
                );
            }

            // Default to first implementation if none found or no ID provided
            if (!implToSelect && implementations.length > 0) {
                implToSelect = implementations[0];
            }

            if (implToSelect && (!selectedImpl || selectedImpl.unique_id !== implToSelect.unique_id)) {
                setSelectedImpl(implToSelect);
            }
        }
    }, [implementations, initialImplementationId]); // eslint-disable-line react-hooks/exhaustive-deps

    // Update URL when implementation is selected
    const handleImplementationSelect = (impl) => {
        setSelectedImpl(impl);
        // Update URL with the unique_id
        navigate(`/ati-explorer/implementations/${implementationType}/${impl.unique_id}`,
            { replace: true }
        );
    };

    // Copy link function
    const copyImplementationLink = () => {
        const url = `${window.location.origin}/ati-explorer/implementations/${implementationType}/${selectedImpl.unique_id}`;

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
        setEditForm({
            title: selectedImpl.title,
            description: selectedImpl.description,
        });
        setIsEditing(true);
    };

    const handleSave = async () => {
        try {
            await updateImplementation(
                implementationType,
                selectedImpl.unique_id,
                editForm.title,
                editForm.description
            );
            toast({
                title: 'Success',
                description: 'Implementation updated successfully',
                status: 'success',
                duration: 3000,
                position: 'top-right',
                isClosable: true,
            });
            setIsEditing(false);
            await refreshImplementations();
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
        setEditForm({ title: '', description: '' });
    };

    const formatDate = (dateString) => {
        if (!dateString) return null;
        return new Date(dateString).toLocaleDateString();
    };

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
                w="35%"
                borderWidth="1px"
                borderColor="gray.200"
                borderRadius="lg"
                bg="white"
                p={6}
                overflowY="auto"
                boxShadow="sm"
            >
                <Heading size="md" color="teal.700" mb={4} fontWeight="bold">
                    {implementationType}s ({implementations.length})
                </Heading>
                {implementations.length > 0 ? (
                    <VStack align="stretch" spacing={3}>
                        {implementations.map((impl) => (
                            <Button
                                key={impl.unique_id}
                                variant={
                                    selectedImpl?.unique_id === impl.unique_id ? 'solid' : 'outline'
                                }
                                colorScheme="teal"
                                size="sm"
                                justifyContent="space-between"
                                onClick={() => handleImplementationSelect(impl)}
                                textAlign="left"
                                whiteSpace="normal"
                                h="auto"
                                py={3}
                                px={4}
                                bg={
                                    selectedImpl?.unique_id === impl.unique_id ? 'teal.500' : 'white'
                                }
                                _hover={{
                                    bg:
                                        selectedImpl?.unique_id === impl.unique_id
                                            ? 'teal.600'
                                            : 'gray.50',
                                    boxShadow: 'md',
                                }}
                                transition="all 0.2s"
                            >
                                <VStack align="start" spacing={1} flex="1">
                                    <Text
                                        fontSize="sm"
                                        color={
                                            selectedImpl?.unique_id === impl.unique_id
                                                ? 'white'
                                                : 'gray.700'
                                        }
                                        noOfLines={2}
                                    >
                                        {impl.title}
                                    </Text>
                                    <Badge colorScheme="teal" fontSize="xs" px={2} py={1} borderRadius="md">
                                        {impl.is_evidence_for?.length || 0} YSE
                                    </Badge>
                                </VStack>
                            </Button>
                        ))}
                    </VStack>
                ) : (
                    <Alert status="info" borderRadius="lg" fontSize="sm">
                        <AlertIcon />
                        No {implementationType}s found
                    </Alert>
                )}
            </Box>

            {/* Right Panel - Details and Relationships */}
            <Box
                flex="1"
                borderWidth="1px"
                borderColor="gray.200"
                borderRadius="lg"
                bg="white"
                p={6}
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
                                Evidence For ({selectedImpl.is_evidence_for?.length || 0})
                            </Tab>
                            <Tab
                                fontSize="sm"
                                fontWeight="semibold"
                                color="gray.600"
                                _selected={{ color: 'teal.600', borderColor: 'teal.500' }}
                            >
                                {`Supporting Docs (${totalSupporting})`}
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
                                </VStack>
                            </TabPanel>

                            {/* Evidence For Tab */}
                            <TabPanel px={0} py={4}>
                                <VStack align="stretch" spacing={4}>
                                    <Heading size="sm" color="gray.700" fontWeight="bold">
                                        Success Indicators This Evidences
                                    </Heading>
                                    {selectedImpl.is_evidence_for?.length > 0 ? (
                                        selectedImpl.is_evidence_for.map((yse) => (
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
                                                    <Text fontWeight="bold" fontSize="sm" color="teal.700">
                                                        {yse.year_identifier}
                                                    </Text>

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
                                            No success indicators linked to this {implementationType}
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
                        </TabPanels>
                    </Tabs>
                ) : (
                    <Alert status="info" borderRadius="lg" fontSize="sm">
                        <AlertIcon />
                        Select an implementation to view details
                    </Alert>
                )}
            </Box>
        </Flex>
    );
}

export default ImplementationTypeOverview;