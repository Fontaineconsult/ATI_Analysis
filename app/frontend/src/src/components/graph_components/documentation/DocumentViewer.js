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
    Select, Link,
} from '@chakra-ui/react';
import { updateDocument } from '../../../services/api/put';
import { addDocumentToImplementation } from '../../../services/api/post';
import { useToast } from '@chakra-ui/react';
import { DataContext } from '../../../context/DataContext';
import { useSettings } from '../../../context/SettingsContext';
import { UserContext } from '../../../context/UserContext';

function DocumentViewer({ documents, implementation_id, implementation_type }) {
    const [expandedIndex, setExpandedIndex] = useState(null);
    const [isAddingNewDocument, setIsAddingNewDocument] = useState(false);
    const { loadSingleWorkingGroupData, selectedYear } = useContext(DataContext);
    const { currentWorkingGroup } = useSettings();
    const { user } = useContext(UserContext);
    const toast = useToast();

    // Toggle expanded/collapsed state
    const toggleEdit = (index) => {
        setExpandedIndex(expandedIndex === index ? null : index);
    };

    // Handle form submission for both new and updated documents
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
                colorScheme="teal"
                onClick={() => {
                    setIsAddingNewDocument(true);
                    setExpandedIndex(null);
                }}
                mb={4}
            >
                Add New Document
            </Button>

            {isAddingNewDocument ? (
                <Box mb={4} border="1px solid teal" borderRadius="md" p={4} boxShadow="sm">
                    <DocumentForm
                        document={null}
                        onSubmit={(documentData) => handleFormSubmit(null, documentData, true)}
                        createdBy={user?.properties || user}
                        isNewDocument={true}
                        onCancel={() => setIsAddingNewDocument(false)}
                    />
                </Box>
            ) : documents && documents.length > 0 ? (
                documents.map((docWrapper, index) => {
                    const document = docWrapper.document || docWrapper;
                    const createdByPerson = docWrapper.created_by?.properties || document.created_by?.properties;
                    const isExpanded = expandedIndex === index;

                    return (
                        <Box
                            key={document.properties.unique_id || index}
                            mb={4}
                            border="1px solid teal"
                            borderRadius="md"
                            p={4}
                            boxShadow="sm"
                        >
                            {/* Always visible compact view with Edit button */}
                            <Flex justify="space-between" alignItems="flex-start" mb={2}>
                                <Flex flex="1" gap={4}>
                                    {/* Left side - Basic Info (2/3 width) */}
                                    <Box flex="2" fontSize="sm">
                                        <Flex mb={1} align="baseline">
                                            <Text fontWeight="bold" color="gray.600" minWidth="80px">
                                                Name:
                                            </Text>
                                            <Text>{document.properties.name || 'No name provided'}</Text>
                                        </Flex>
                                        <Flex mb={1} align="baseline">
                                            <Text fontWeight="bold" color="gray.600" minWidth="80px">
                                                File Path:
                                            </Text>
                                            {document.properties.file_path ? (
                                                <Link href={document.properties.file_path} wordBreak="break-all" isExternal>
                                                    {document.properties.file_path}
                                                </Link>
                                            ) : (
                                                <Text>No file path provided</Text>
                                            )}
                                        </Flex>
                                        <Flex mb={1} align="baseline">
                                            <Text fontWeight="bold" color="gray.600" minWidth="80px">
                                                URI Path:
                                            </Text>
                                            {document.properties.uri_path ? (
                                                <a
                                                    href={document.properties.uri_path}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    style={{ color: '#3182ce', textDecoration: 'underline', wordBreak: 'break-all' }}
                                                >
                                                    {document.properties.uri_path}
                                                </a>
                                            ) : (
                                                <Text>No URI provided</Text>
                                            )}
                                        </Flex>
                                        <Flex align="baseline">
                                            <Text fontWeight="bold" color="gray.600" minWidth="80px">
                                                Created:
                                            </Text>
                                            <Text>{document.properties.date_created || 'N/A'}</Text>
                                        </Flex>
                                    </Box>

                                    {/* Right side - Status Info (1/3 width) */}
                                    <Box flex="1" fontSize="sm" borderLeft="1px solid" borderColor="gray.200" pl={4}>
                                        <Flex mb={1} align="baseline">
                                            <Text fontWeight="bold" color="gray.600" minWidth="100px">
                                                Admin Review:
                                            </Text>
                                            <Text color={document.properties.is_administrative_review_documentation ? "green.500" : "gray.400"}>
                                                {document.properties.is_administrative_review_documentation ? 'Yes' : 'No'}
                                            </Text>
                                        </Flex>
                                        <Flex mb={1} align="baseline">
                                            <Text fontWeight="bold" color="gray.600" minWidth="100px">
                                                Milestones:
                                            </Text>
                                            <Text color={document.properties.is_milestone_and_measures_documentation ? "green.500" : "gray.400"}>
                                                {document.properties.is_milestone_and_measures_documentation ? 'Yes' : 'No'}
                                            </Text>
                                        </Flex>
                                        <Flex mb={1} align="baseline">
                                            <Text fontWeight="bold" color="gray.600" minWidth="100px">
                                                In Report:
                                            </Text>
                                            <Text color={document.properties.include_in_report ? "green.500" : "red.500"}>
                                                {document.properties.include_in_report ? 'Yes' : 'No'}
                                            </Text>
                                        </Flex>
                                        <Flex mb={1} align="baseline">
                                            <Text fontWeight="bold" color="gray.600" minWidth="100px">
                                                Depreciated:
                                            </Text>
                                            <Text color={document.properties.depreciated ? "orange.500" : "green.500"}>
                                                {document.properties.depreciated ? 'Yes' : 'No'}
                                            </Text>
                                        </Flex>
                                        {document.properties.depreciated && (
                                            <Flex align="baseline">
                                                <Text fontWeight="bold" color="gray.600" minWidth="100px">
                                                    Dep. Date:
                                                </Text>
                                                <Text>{document.properties.depreciated_date || 'N/A'}</Text>
                                            </Flex>
                                        )}
                                    </Box>
                                </Flex>
                                <Button
                                    size="sm"
                                    colorScheme={isExpanded ? "gray" : "blue"}
                                    onClick={() => toggleEdit(index)}
                                    ml={4}
                                >
                                    {isExpanded ? 'Cancel' : 'Edit'}
                                </Button>
                            </Flex>

                            <Text fontSize="xs" color="gray.500">
                                Created by: {createdByPerson ? createdByPerson.name : 'Unknown'}
                            </Text>

                            {/* Collapsible edit form */}
                            <Collapse in={isExpanded} animateOpacity>
                                <Box mt={4} pt={4} borderTop="1px solid" borderColor="gray.200">
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
                })
            ) : (
                <Text>No documents available.</Text>
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

    useEffect(() => {
        setDocumentData({
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
    }, [document, createdBy]);

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
            <FormControl mb={4}>
                <FormLabel>Document Name</FormLabel>
                <Input name="name" value={documentData.name} onChange={handleChange} required />
            </FormControl>
            <FormControl mb={4}>
                <FormLabel>Date Created</FormLabel>
                <Input
                    name="date_created"
                    type="date"
                    value={documentData.date_created}
                    onChange={handleChange}
                />
            </FormControl>
            <FormControl mb={4}>
                <FormLabel>File Path</FormLabel>
                <Input name="file_path" value={documentData.file_path} onChange={handleChange} />
            </FormControl>
            <FormControl mb={4}>
                <FormLabel>URI Path</FormLabel>
                <Input name="uri_path" value={documentData.uri_path} onChange={handleChange} />
            </FormControl>

            {/* Toggles and date fields */}
            <Flex gap={4} mb={4}>
                <Box flex="1">
                    <FormControl mb={4}>
                        <FormLabel>Administrative Review Documentation</FormLabel>
                        <Switch
                            name="is_administrative_review_documentation"
                            isChecked={documentData.is_administrative_review_documentation}
                            onChange={handleChange}
                        />
                    </FormControl>
                    <FormControl mb={4}>
                        <FormLabel>Milestone and Measures Documentation</FormLabel>
                        <Switch
                            name="is_milestone_and_measures_documentation"
                            isChecked={documentData.is_milestone_and_measures_documentation}
                            onChange={handleChange}
                        />
                    </FormControl>
                    <FormControl mb={4}>
                        <FormLabel>Include in Report</FormLabel>
                        <Switch
                            name="include_in_report"
                            isChecked={documentData.include_in_report}
                            onChange={handleChange}
                        />
                    </FormControl>
                </Box>

                <Box flex="1">
                    <FormControl mb={4}>
                        <FormLabel>Depreciated</FormLabel>
                        <Switch
                            name="depreciated"
                            isChecked={documentData.depreciated}
                            onChange={handleChange}
                        />
                    </FormControl>
                    <FormControl mb={4}>
                        <FormLabel>Depreciation Date</FormLabel>
                        <Input
                            type="date"
                            name="depreciated_date"
                            value={documentData.depreciated_date}
                            onChange={handleChange}
                        />
                    </FormControl>
                </Box>
            </Flex>

            {/* Action buttons */}
            <Flex gap={2}>
                <Button
                    type="submit"
                    colorScheme="teal"
                    isLoading={isSubmitting}
                    loadingText={isNewDocument ? 'Submitting...' : 'Updating...'}
                >
                    {isNewDocument ? 'Submit Document' : 'Update Document'}
                </Button>
                {onCancel && (
                    <Button
                        variant="outline"
                        onClick={onCancel}
                        isDisabled={isSubmitting}
                    >
                        Cancel
                    </Button>
                )}
            </Flex>
        </Box>
    );
}

export default DocumentViewer;