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
    Link
} from '@chakra-ui/react';
import { EditIcon, CheckIcon, CloseIcon, ExternalLinkIcon } from '@chakra-ui/icons';
import { updateImplementation } from '../../services/api/put';
import { DataContext } from '../../context/DataContext';

function ImplementationTypeOverview({ implementationType }) {
    const { data, refreshImplementations } = useContext(DataContext);
    const [selectedImpl, setSelectedImpl] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState({ title: '', description: '' });
    const toast = useToast();

    // Get implementations from context
    const implementations = data.implementations?.[implementationType] || [];

    useEffect(() => {
        if (implementations.length > 0 && !selectedImpl) {
            setSelectedImpl(implementations[0]);
        }
    }, [implementations, implementationType]);

    const handleEdit = () => {
        setEditForm({
            title: selectedImpl.title,
            description: selectedImpl.description
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
                title: "Success",
                description: "Implementation updated successfully",
                status: "success",
                duration: 3000,
            });
            setIsEditing(false);
            await refreshImplementations();
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to update implementation",
                status: "error",
                duration: 3000,
            });
        }
    };

    const handleCancel = () => {
        setIsEditing(false);
        setEditForm({ title: '', description: '' });
    };

    // Count total relationships
    const getTotalRelationships = (impl) => {
        if (!impl) return 0;
        return (impl.supporting_documents?.length || 0) +
            (impl.supporting_webpages?.length || 0) +
            (impl.supporting_notes?.length || 0) +
            (impl.supporting_messages?.length || 0) +
            (impl.supporting_metrics?.length || 0) +
            (impl.is_evidence_for?.length || 0);
    };

    return (
        <Flex h="700px" gap={4}>
            {/* Left Panel - Implementation List */}
            <Box
                w="35%"
                borderWidth="1px"
                borderRadius="md"
                p={4}
                overflowY="auto"
            >
                <Heading size="sm" mb={4}>
                    {implementationType}s ({implementations.length})
                </Heading>
                <VStack align="stretch" spacing={2}>
                    {implementations.map((impl) => (
                        <Button
                            key={impl.unique_id}
                            variant={selectedImpl?.unique_id === impl.unique_id ? "solid" : "outline"}
                            colorScheme={selectedImpl?.unique_id === impl.unique_id ? "teal" : "gray"}
                            size="sm"
                            justifyContent="space-between"
                            onClick={() => setSelectedImpl(impl)}
                            textAlign="left"
                            whiteSpace="normal"
                            h="auto"
                            py={2}
                            px={3}
                        >
                            <VStack align="start" spacing={1} flex="1">
                                <Text fontSize="sm" noOfLines={2}>
                                    {impl.title}
                                </Text>
                                <HStack spacing={2}>
                                    <Badge colorScheme="blue" fontSize="xs">
                                        {impl.is_evidence_for?.length || 0} YSE
                                    </Badge>
                                </HStack>
                            </VStack>
                        </Button>
                    ))}
                </VStack>
            </Box>

            {/* Right Panel - Details and Relationships */}
            <Box
                flex="1"
                borderWidth="1px"
                borderRadius="md"
                p={6}
                overflowY="auto"
            >
                {selectedImpl ? (
                    <Tabs>
                        <TabList>
                            <Tab>Details</Tab>
                            <Tab>Evidence For ({selectedImpl.is_evidence_for?.length || 0})</Tab>
                            <Tab>Supporting Docs ({
                                (selectedImpl.supporting_documents?.length || 0) +
                                (selectedImpl.supporting_webpages?.length || 0) +
                                (selectedImpl.supporting_messages?.length || 0) +
                                (selectedImpl.supporting_notes?.length || 0) +
                                (selectedImpl.supporting_metrics?.length || 0)
                            })</Tab>
                        </TabList>

                        <TabPanels>
                            {/* Details Tab */}
                            <TabPanel>
                                <VStack align="stretch" spacing={4}>
                                    <Flex justify="space-between" align="center">
                                        <Heading size="md">Details</Heading>
                                        {!isEditing ? (
                                            <IconButton
                                                icon={<EditIcon />}
                                                size="sm"
                                                colorScheme="blue"
                                                variant="outline"
                                                onClick={handleEdit}
                                                aria-label="Edit"
                                            />
                                        ) : (
                                            <HStack>
                                                <IconButton
                                                    icon={<CheckIcon />}
                                                    size="sm"
                                                    colorScheme="green"
                                                    onClick={handleSave}
                                                    aria-label="Save"
                                                />
                                                <IconButton
                                                    icon={<CloseIcon />}
                                                    size="sm"
                                                    colorScheme="red"
                                                    variant="outline"
                                                    onClick={handleCancel}
                                                    aria-label="Cancel"
                                                />
                                            </HStack>
                                        )}
                                    </Flex>

                                    <Divider />

                                    <FormControl>
                                        <FormLabel>Title</FormLabel>
                                        {isEditing ? (
                                            <Input
                                                value={editForm.title}
                                                onChange={(e) => setEditForm({
                                                    ...editForm,
                                                    title: e.target.value
                                                })}
                                            />
                                        ) : (
                                            <Text>{selectedImpl.title}</Text>
                                        )}
                                    </FormControl>

                                    <FormControl>
                                        <FormLabel>Description</FormLabel>
                                        {isEditing ? (
                                            <Textarea
                                                value={editForm.description}
                                                onChange={(e) => setEditForm({
                                                    ...editForm,
                                                    description: e.target.value
                                                })}
                                                rows={6}
                                            />
                                        ) : (
                                            <Text whiteSpace="pre-wrap">{selectedImpl.description}</Text>
                                        )}
                                    </FormControl>

                                    <Box>
                                        <Badge colorScheme="purple">ID: {selectedImpl.unique_id}</Badge>
                                    </Box>
                                </VStack>
                            </TabPanel>

                            {/* Evidence For Tab */}
                            <TabPanel>
                                <VStack align="stretch" spacing={3}>
                                    <Heading size="sm">Success Indicators This Evidences</Heading>
                                    {selectedImpl.is_evidence_for?.length > 0 ? (
                                        selectedImpl.is_evidence_for.map((yse) => (
                                            <Box
                                                key={yse.unique_id}
                                                p={3}
                                                borderWidth="1px"
                                                borderRadius="md"
                                                bg="gray.50"
                                            >
                                                <Text fontWeight="bold" fontSize="sm">
                                                    {yse.year_identifier}
                                                </Text>
                                                <Text fontSize="xs" color="gray.600">
                                                    ID: {yse.unique_id}
                                                </Text>
                                            </Box>
                                        ))
                                    ) : (
                                        <Text color="gray.500">No success indicators linked</Text>
                                    )}
                                </VStack>
                            </TabPanel>

                            {/* Supporting Documentation Tab */}
                            <TabPanel>
                                <VStack align="stretch" spacing={4}>
                                    {/* Documents */}
                                    {selectedImpl.supporting_documents?.length > 0 && (
                                        <Box>
                                            <Heading size="xs" mb={2}>Documents</Heading>
                                            <VStack align="stretch" spacing={2}>
                                                {selectedImpl.supporting_documents.map((doc) => (
                                                    <HStack key={doc.unique_id} p={2} bg="blue.50" borderRadius="md">
                                                        <Text fontSize="sm">{doc.name}</Text>
                                                    </HStack>
                                                ))}
                                            </VStack>
                                        </Box>
                                    )}

                                    {/* Webpages */}
                                    {selectedImpl.supporting_webpages?.length > 0 && (
                                        <Box>
                                            <Heading size="xs" mb={2}>Webpages</Heading>
                                            <VStack align="stretch" spacing={2}>
                                                {selectedImpl.supporting_webpages.map((wp) => (
                                                    <HStack key={wp.unique_id} p={2} bg="green.50" borderRadius="md">
                                                        <Link href={wp.url} isExternal color="blue.600">
                                                            <HStack>
                                                                <Text fontSize="sm">{wp.name || wp.url}</Text>
                                                                <ExternalLinkIcon />
                                                            </HStack>
                                                        </Link>
                                                    </HStack>
                                                ))}
                                            </VStack>
                                        </Box>
                                    )}

                                    {/* Notes */}
                                    {selectedImpl.supporting_notes?.length > 0 && (
                                        <Box>
                                            <Heading size="xs" mb={2}>Notes</Heading>
                                            <VStack align="stretch" spacing={2}>
                                                {selectedImpl.supporting_notes.map((note) => (
                                                    <HStack key={note.unique_id} p={2} bg="yellow.50" borderRadius="md">
                                                        <Text fontSize="sm">{note.name}</Text>
                                                    </HStack>
                                                ))}
                                            </VStack>
                                        </Box>
                                    )}

                                    {/* Messages */}
                                    {selectedImpl.supporting_messages?.length > 0 && (
                                        <Box>
                                            <Heading size="xs" mb={2}>Messages</Heading>
                                            <VStack align="stretch" spacing={2}>
                                                {selectedImpl.supporting_messages.map((msg) => (
                                                    <HStack key={msg.unique_id} p={2} bg="purple.50" borderRadius="md">
                                                        <Text fontSize="sm">{msg.name}</Text>
                                                    </HStack>
                                                ))}
                                            </VStack>
                                        </Box>
                                    )}

                                    {/* Metrics */}
                                    {selectedImpl.supporting_metrics?.length > 0 && (
                                        <Box>
                                            <Heading size="xs" mb={2}>Metrics</Heading>
                                            <VStack align="stretch" spacing={2}>
                                                {selectedImpl.supporting_metrics.map((metric) => (
                                                    <HStack key={metric.unique_id} p={2} bg="orange.50" borderRadius="md">
                                                        <Text fontSize="sm">{metric.name}</Text>
                                                    </HStack>
                                                ))}
                                            </VStack>
                                        </Box>
                                    )}

                                    {getTotalRelationships(selectedImpl) === (selectedImpl.is_evidence_for?.length || 0) && (
                                        <Text color="gray.500">No supporting documentation</Text>
                                    )}
                                </VStack>
                            </TabPanel>
                        </TabPanels>
                    </Tabs>
                ) : (
                    <Text color="gray.500">Select an implementation to view details</Text>
                )}
            </Box>
        </Flex>
    );
}

export default ImplementationTypeOverview;