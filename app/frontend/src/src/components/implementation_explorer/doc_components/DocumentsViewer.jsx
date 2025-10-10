import React, { useState, useContext } from 'react';
import {
    Box, VStack, Heading, Text, Badge, Link, HStack, Button, Input, Switch,
    FormControl, FormLabel, Flex, Collapse, useToast
} from '@chakra-ui/react';
import { ExternalLinkIcon } from '@chakra-ui/icons';
import { addDocumentToImplementation } from '../../../services/api/post';
import { updateDocument } from '../../../services/api/put';
import { DataContext } from '../../../context/DataContext';
import { useSettings } from '../../../context/SettingsContext';
import { UserContext } from '../../../context/UserContext';

function formatDate(dateString) {
    if (!dateString) return null;
    return new Date(dateString).toLocaleDateString();
}

function DocumentForm({ document, onSubmit, onCancel, isNewDocument }) {
    const { user } = useContext(UserContext);
    const [documentData, setDocumentData] = useState({
        unique_id: document?.unique_id || '',
        name: document?.name || '',
        file_path: document?.file_path || '',
        uri_path: document?.uri_path || '',
        is_administrative_review_documentation: document?.is_administrative_review_documentation || false,
        is_milestone_and_measures_documentation: document?.is_milestone_and_measures_documentation || false,
        include_in_report: document?.include_in_report ?? true,
        depreciated: document?.depreciated || false,
        depreciated_date: document?.depreciated_date || '',
        date_created: document?.date_created || new Date().toISOString().split('T')[0],
        created_by: user || {}
    });

    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setDocumentData({
            ...documentData,
            [name]: type === 'checkbox' ? checked : value,
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await onSubmit(documentData);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Box as="form" onSubmit={handleSubmit} p={4} bg="white" borderRadius="lg" borderWidth="1px" borderColor="teal.300">
            <FormControl mb={3}>
                <FormLabel fontSize="sm">Document Name</FormLabel>
                <Input size="sm" name="name" value={documentData.name} onChange={handleChange} required />
            </FormControl>

            <FormControl mb={3}>
                <FormLabel fontSize="sm">Date Created</FormLabel>
                <Input size="sm" name="date_created" type="date" value={documentData.date_created} onChange={handleChange} />
            </FormControl>

            <FormControl mb={3}>
                <FormLabel fontSize="sm">File Path</FormLabel>
                <Input size="sm" name="file_path" value={documentData.file_path} onChange={handleChange} />
            </FormControl>

            <FormControl mb={3}>
                <FormLabel fontSize="sm">URI Path</FormLabel>
                <Input size="sm" name="uri_path" value={documentData.uri_path} onChange={handleChange} />
            </FormControl>

            <Flex gap={4} mb={4}>
                <Box flex="1">
                    <FormControl mb={2}>
                        <HStack>
                            <Switch size="sm" name="is_administrative_review_documentation"
                                    isChecked={documentData.is_administrative_review_documentation} onChange={handleChange} />
                            <FormLabel fontSize="sm" mb={0}>Admin Review Doc</FormLabel>
                        </HStack>
                    </FormControl>
                    <FormControl mb={2}>
                        <HStack>
                            <Switch size="sm" name="is_milestone_and_measures_documentation"
                                    isChecked={documentData.is_milestone_and_measures_documentation} onChange={handleChange} />
                            <FormLabel fontSize="sm" mb={0}>Milestones Doc</FormLabel>
                        </HStack>
                    </FormControl>
                    <FormControl mb={2}>
                        <HStack>
                            <Switch size="sm" name="include_in_report"
                                    isChecked={documentData.include_in_report} onChange={handleChange} />
                            <FormLabel fontSize="sm" mb={0}>Include in Report</FormLabel>
                        </HStack>
                    </FormControl>
                </Box>

                <Box flex="1">
                    <FormControl mb={2}>
                        <HStack>
                            <Switch size="sm" name="depreciated"
                                    isChecked={documentData.depreciated} onChange={handleChange} />
                            <FormLabel fontSize="sm" mb={0}>Depreciated</FormLabel>
                        </HStack>
                    </FormControl>
                    {documentData.depreciated && (
                        <FormControl mb={2}>
                            <FormLabel fontSize="sm">Depreciation Date</FormLabel>
                            <Input size="sm" type="date" name="depreciated_date"
                                   value={documentData.depreciated_date} onChange={handleChange} />
                        </FormControl>
                    )}
                </Box>
            </Flex>

            <HStack spacing={2}>
                <Button size="sm" type="submit" colorScheme="teal"
                        isLoading={isSubmitting} loadingText={isNewDocument ? 'Adding...' : 'Updating...'}>
                    {isNewDocument ? 'Add Document' : 'Update Document'}
                </Button>
                <Button size="sm" variant="outline" onClick={onCancel} isDisabled={isSubmitting}>
                    Cancel
                </Button>
            </HStack>
        </Box>
    );
}

export default function DocumentsViewer({ documents = [], implementation_id, implementation_type }) {
    const [isAddingNew, setIsAddingNew] = useState(false);
    const [editingIndex, setEditingIndex] = useState(null);
    const { loadSingleWorkingGroupData } = useContext(DataContext);
    const { currentWorkingGroup } = useSettings();
    const { user } = useContext(UserContext);
    const toast = useToast();

    const handleAddDocument = async (documentData) => {
        try {
            documentData.date_created = new Date().toISOString().split('T')[0];
            const response = await addDocumentToImplementation(
                implementation_id,
                implementation_type,
                documentData,
                user?.employee_id || ''
            );

            toast({
                title: "Document added successfully",
                status: "success",
                duration: 3000,
                isClosable: true,
            });

            await loadSingleWorkingGroupData(currentWorkingGroup);
            setIsAddingNew(false);
        } catch (error) {
            toast({
                title: "Error adding document",
                description: error.message,
                status: "error",
                duration: 3000,
                isClosable: true,
            });
        }
    };

    const handleUpdateDocument = async (documentData, index) => {
        try {
            const response = await updateDocument(
                implementation_id,
                implementation_type,
                documentData,
                user?.employee_id || ''
            );

            toast({
                title: "Document updated successfully",
                status: "success",
                duration: 3000,
                isClosable: true,
            });

            await loadSingleWorkingGroupData(currentWorkingGroup);
            setEditingIndex(null);
        } catch (error) {
            toast({
                title: "Error updating document",
                description: error.message,
                status: "error",
                duration: 3000,
                isClosable: true,
            });
        }
    };

    return (
        <Box>
            <HStack justify="space-between" mb={3}>
                <Heading size="sm" color="gray.700" fontWeight="bold">
                    Documents ({documents.length || 0})
                </Heading>
                {implementation_id && implementation_type && (
                    <Button
                        size="sm"
                        colorScheme="teal"
                        onClick={() => {setIsAddingNew(true); setEditingIndex(null);}}
                        isDisabled={isAddingNew}
                    >
                        Add Document
                    </Button>
                )}
            </HStack>

            {isAddingNew && (
                <Box mb={4}>
                    <DocumentForm
                        document={null}
                        onSubmit={handleAddDocument}
                        onCancel={() => setIsAddingNew(false)}
                        isNewDocument={true}
                    />
                </Box>
            )}

            {documents.length > 0 ? (
                <VStack align="stretch" spacing={3}>
                    {documents.map((doc, index) => (
                        <Box key={doc.unique_id || index}>
                            <Collapse in={editingIndex === index} animateOpacity>
                                <Box mb={3}>
                                    <DocumentForm
                                        document={doc}
                                        onSubmit={(data) => handleUpdateDocument(data, index)}
                                        onCancel={() => setEditingIndex(null)}
                                        isNewDocument={false}
                                    />
                                </Box>
                            </Collapse>

                            <Collapse in={editingIndex !== index} animateOpacity>
                                <Box
                                    p={4}
                                    bg="teal.50"
                                    borderRadius="lg"
                                    borderWidth="1px"
                                    borderColor="gray.200"
                                >
                                    <HStack justify="space-between" align="start">
                                        <Box flex="1">
                                            <Heading as='h3' fontSize="sm" fontWeight="bold" color="gray.800">
                                                {doc.name}
                                            </Heading>

                                            {doc.description && (
                                                <Text fontSize="xs" color="gray.700" mt={2}>
                                                    {doc.description}
                                                </Text>
                                            )}

                                            {doc.file_path && (
                                                <Link fontSize="xs" color="teal.600" mt={2} display="block">
                                                    {doc.file_path}
                                                </Link>
                                            )}

                                            {doc.uri_path && (
                                                <Link href={doc.uri_path} isExternal fontSize="xs" color="teal.600" mt={2} display="block">
                                                    <HStack spacing={1}>
                                                        <Text>URI: {doc.uri_path}</Text>
                                                        <ExternalLinkIcon />
                                                    </HStack>
                                                </Link>
                                            )}

                                            <HStack mt={3} spacing={2} flexWrap="wrap">
                                                {(doc.is_administrative_review_documentation === "True" || doc.is_administrative_review_documentation === true) && (
                                                    <Badge colorScheme="purple" fontSize="xs">Admin Review</Badge>
                                                )}
                                                {(doc.is_milestone_and_measures_documentation === "True" || doc.is_milestone_and_measures_documentation === true) && (
                                                    <Badge colorScheme="blue" fontSize="xs">Milestones</Badge>
                                                )}
                                                {doc.depreciated === true && (
                                                    <Badge colorScheme="orange" fontSize="xs">Depreciated</Badge>
                                                )}
                                                {doc.include_in_report !== false && (
                                                    <Badge colorScheme="green" fontSize="xs">In Report</Badge>
                                                )}
                                            </HStack>
                                        </Box>

                                        {implementation_id && implementation_type && (
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                colorScheme="blue"
                                                onClick={() => {setEditingIndex(index); setIsAddingNew(false);}}
                                            >
                                                Edit
                                            </Button>
                                        )}
                                    </HStack>
                                </Box>
                            </Collapse>
                        </Box>
                    ))}
                </VStack>
            ) : (
                <Text fontSize="xs" color="gray.500" fontStyle="italic">
                    No documents attached
                </Text>
            )}
        </Box>
    );
}