import React, { useContext, useEffect, useState } from 'react';
import {
    Box,
    Button,
    Input,
    Switch,
    FormControl,
    FormLabel,
    Text,
    Flex,
    Collapse,
    Link,
    HStack,
    VStack,
    Badge,
    IconButton,
    Grid,
    GridItem
} from '@chakra-ui/react';
import { EditIcon, ExternalLinkIcon } from '@chakra-ui/icons';
import { updateDocument } from '../../../services/api/put';
import { addDocumentToImplementation } from '../../../services/api/post';
import { useToast } from '@chakra-ui/react';
import { DataContext } from '../../../context/DataContext';
import { useSettings } from '../../../context/SettingsContext';
import { UserContext } from '../../../context/UserContext';

function DocumentViewer({ documents, implementation_id, implementation_type }) {
    const [expandedIndex, setExpandedIndex] = useState(null);
    const [isAddingNewDocument, setIsAddingNewDocument] = useState(false);
    const { loadSingleWorkingGroupData } = useContext(DataContext);
    const { currentWorkingGroup } = useSettings();
    const { user } = useContext(UserContext);
    const toast = useToast();

    const toggleEdit = (index) => {
        setExpandedIndex(expandedIndex === index ? null : index);
    };

    const handleFormSubmit = async (index, documentData, isNew) => {
        try {
            let response;

            if (isNew) {
                documentData.date_created = new Date().toISOString().split('T')[0];
                response = await addDocumentToImplementation(
                    implementation_id,
                    implementation_type,
                    documentData,
                    user?.employee_id || ''
                );
            } else {
                response = await updateDocument(
                    implementation_id,
                    implementation_type,
                    documentData,
                    user?.employee_id || ''
                );
            }

            toast({
                title: "Success",
                description: response?.message || "Operation completed successfully.",
                status: "success",
                duration: 3000,
                isClosable: true,
            });

            await loadSingleWorkingGroupData(currentWorkingGroup);
            setExpandedIndex(null);
            setIsAddingNewDocument(false);
        } catch (error) {
            toast({
                title: "Error",
                description: error.response?.data?.error || "An unexpected error occurred.",
                status: "error",
                duration: 3000,
                isClosable: true,
            });
        }
    };

    return (
        <Box>
            <Button
                size="xs"
                colorScheme="teal"
                onClick={() => {
                    setIsAddingNewDocument(true);
                    setExpandedIndex(null);
                }}
                mb={3}
            >
                Add New Document
            </Button>

            {isAddingNewDocument && (
                <Box mb={3} borderWidth="1px" borderColor="teal.300" borderRadius="md" p={3} bg="teal.50">
                    <DocumentForm
                        document={null}
                        onSubmit={(documentData) => handleFormSubmit(null, documentData, true)}
                        createdBy={user?.properties || user}
                        isNewDocument={true}
                        onCancel={() => setIsAddingNewDocument(false)}
                    />
                </Box>
            )}

            {documents && documents.length > 0 ? (
                <VStack spacing={2} align="stretch">
                    {documents.map((docWrapper, index) => {
                        const document = docWrapper.document || docWrapper;
                        const createdByPerson = docWrapper.created_by?.properties || document.created_by?.properties;
                        const isExpanded = expandedIndex === index;

                        return (
                            <Box
                                key={document.properties.unique_id || index}
                                borderWidth="1px"
                                borderColor="gray.200"
                                borderRadius="md"
                                p={3}
                                bg="white"
                                _hover={{ borderColor: 'teal.300', bg: 'gray.50' }}
                                transition="all 0.2s"
                            >
                                {/* Compact view */}
                                <Flex justify="space-between" align="start">
                                    <VStack align="start" spacing={1} flex="1">
                                        {/* Title row with status badges */}
                                        <HStack spacing={2} width="full">
                                            <Text fontWeight="bold" fontSize="sm" color="gray.800">
                                                {document.properties.name || 'Untitled Document'}
                                            </Text>
                                            {document.properties.include_in_report && (
                                                <Badge colorScheme="green" fontSize="10px">In Report</Badge>
                                            )}
                                            {document.properties.depreciated && (
                                                <Badge colorScheme="orange" fontSize="10px">Deprecated</Badge>
                                            )}
                                            {document.properties.is_administrative_review_documentation && (
                                                <Badge colorScheme="blue" fontSize="10px">Admin</Badge>
                                            )}
                                            {document.properties.is_milestone_and_measures_documentation && (
                                                <Badge colorScheme="purple" fontSize="10px">Milestone</Badge>
                                            )}
                                        </HStack>

                                        {/* Links row */}
                                        <HStack spacing={3} fontSize="xs">
                                            {document.properties.file_path && (
                                                <Link
                                                    href={document.properties.file_path}
                                                    isExternal
                                                    color="teal.600"
                                                    display="flex"
                                                    alignItems="center"
                                                >
                                                    File <ExternalLinkIcon ml={1} />
                                                </Link>
                                            )}
                                            {document.properties.uri_path && (
                                                <Link
                                                    href={document.properties.uri_path}
                                                    isExternal
                                                    color="teal.600"
                                                    display="flex"
                                                    alignItems="center"
                                                >
                                                    URI <ExternalLinkIcon ml={1} />
                                                </Link>
                                            )}
                                            <Text color="gray.500">
                                                Created: {document.properties.date_created || 'N/A'}
                                            </Text>
                                            {createdByPerson && (
                                                <Text color="gray.500">
                                                    By: {createdByPerson.name}
                                                </Text>
                                            )}
                                        </HStack>
                                    </VStack>

                                    <IconButton
                                        aria-label="Edit document"
                                        icon={<EditIcon />}
                                        size="xs"
                                        colorScheme={isExpanded ? "gray" : "teal"}
                                        variant={isExpanded ? "solid" : "ghost"}
                                        onClick={() => toggleEdit(index)}
                                        ml={2}
                                    />
                                </Flex>

                                {/* Collapsible edit form */}
                                <Collapse in={isExpanded} animateOpacity>
                                    <Box mt={3} pt={3} borderTop="1px solid" borderColor="gray.200">
                                        <DocumentForm
                                            document={document}
                                            onSubmit={(documentData) => handleFormSubmit(index, documentData, false)}
                                            createdBy={createdByPerson}
                                            isNewDocument={false}
                                            onCancel={() => toggleEdit(index)}
                                        />
                                    </Box>
                                </Collapse>
                            </Box>
                        );
                    })}
                </VStack>
            ) : (
                <Text color="gray.500" fontSize="sm">No documents available.</Text>
            )}
        </Box>
    );
}

function DocumentForm({ document, onSubmit, createdBy, isNewDocument, onCancel }) {
    const [documentData, setDocumentData] = useState({
        unique_id: document?.properties?.unique_id || '',
        name: document?.properties?.name || '',
        file_path: document?.properties?.file_path || '',
        uri_path: document?.properties?.uri_path || '',
        is_administrative_review_documentation:
            document?.properties?.is_administrative_review_documentation || false,
        is_milestone_and_measures_documentation:
            document?.properties?.is_milestone_and_measures_documentation || false,
        include_in_report: document?.properties?.include_in_report ?? true,
        depreciated: document?.properties?.depreciated || false,
        depreciated_date: document?.properties?.depreciated_date || '',
        date_created:
            document?.properties?.date_created ||
            new Date().toISOString().split('T')[0],
        created_by: createdBy || {},
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
        } catch (error) {
            console.error('Error submitting document:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Box as="form" onSubmit={handleSubmit}>
            <Grid templateColumns="repeat(2, 1fr)" gap={3}>
                <GridItem colSpan={2}>
                    <FormControl size="sm">
                        <FormLabel fontSize="xs">Document Name</FormLabel>
                        <Input size="sm" name="name" value={documentData.name} onChange={handleChange} required />
                    </FormControl>
                </GridItem>

                <GridItem>
                    <FormControl>
                        <FormLabel fontSize="xs">Date Created</FormLabel>
                        <Input size="sm" name="date_created" type="date" value={documentData.date_created} onChange={handleChange} />
                    </FormControl>
                </GridItem>

                <GridItem>
                    <FormControl>
                        <FormLabel fontSize="xs">Depreciation Date</FormLabel>
                        <Input size="sm" type="date" name="depreciated_date" value={documentData.depreciated_date} onChange={handleChange} />
                    </FormControl>
                </GridItem>

                <GridItem colSpan={2}>
                    <FormControl>
                        <FormLabel fontSize="xs">File Path</FormLabel>
                        <Input size="sm" name="file_path" value={documentData.file_path} onChange={handleChange} />
                    </FormControl>
                </GridItem>

                <GridItem colSpan={2}>
                    <FormControl>
                        <FormLabel fontSize="xs">URI Path</FormLabel>
                        <Input size="sm" name="uri_path" value={documentData.uri_path} onChange={handleChange} />
                    </FormControl>
                </GridItem>
            </Grid>

            {/* Toggle switches in a compact grid */}
            <Grid templateColumns="repeat(2, 1fr)" gap={3} mt={4}>
                <FormControl display="flex" alignItems="center">
                    <FormLabel fontSize="xs" mb="0" flex="1">Admin Review</FormLabel>
                    <Switch size="sm" name="is_administrative_review_documentation" isChecked={documentData.is_administrative_review_documentation} onChange={handleChange} />
                </FormControl>

                <FormControl display="flex" alignItems="center">
                    <FormLabel fontSize="xs" mb="0" flex="1">Milestone Docs</FormLabel>
                    <Switch size="sm" name="is_milestone_and_measures_documentation" isChecked={documentData.is_milestone_and_measures_documentation} onChange={handleChange} />
                </FormControl>

                <FormControl display="flex" alignItems="center">
                    <FormLabel fontSize="xs" mb="0" flex="1">Include in Report</FormLabel>
                    <Switch size="sm" name="include_in_report" isChecked={documentData.include_in_report} onChange={handleChange} />
                </FormControl>

                <FormControl display="flex" alignItems="center">
                    <FormLabel fontSize="xs" mb="0" flex="1">Deprecated</FormLabel>
                    <Switch size="sm" name="depreciated" isChecked={documentData.depreciated} onChange={handleChange} />
                </FormControl>
            </Grid>

            {/* Action buttons */}
            <HStack mt={4} spacing={2}>
                <Button
                    type="submit"
                    size="xs"
                    colorScheme="teal"
                    isLoading={isSubmitting}
                    loadingText={isNewDocument ? 'Submitting...' : 'Updating...'}
                >
                    {isNewDocument ? 'Submit' : 'Update'}
                </Button>
                {onCancel && (
                    <Button
                        size="xs"
                        variant="outline"
                        onClick={onCancel}
                        isDisabled={isSubmitting}
                    >
                        Cancel
                    </Button>
                )}
            </HStack>
        </Box>
    );
}

export default DocumentViewer;