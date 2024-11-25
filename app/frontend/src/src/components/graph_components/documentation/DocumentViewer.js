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
    Select,
} from '@chakra-ui/react';
import { updateDocument } from '../../../services/api/put';
import { addDocumentToImplementation } from '../../../services/api/post';

import { DataContext } from '../../../context/DataContext';
import { useSettings } from '../../../context/SettingsContext';
import { UserContext } from '../../../context/UserContext';


function DocumentViewer({ documents, implementation_id, implementation_type }) {
    const [expandedIndex, setExpandedIndex] = useState(null);
    const [isAddingNewDocument, setIsAddingNewDocument] = useState(false);
    const { loadSingleWorkingGroupData, selectedYear } = useContext(DataContext);
    const { currentWorkingGroup } = useSettings();
    const { user } = useContext(UserContext);

    // Toggle expanded/collapsed state
    const toggleCollapse = (index) => {
        setExpandedIndex(expandedIndex === index ? null : index);
    };

    // Handle form submission for both new and updated documents
    const handleFormSubmit = async (index, documentData, isNew) => {
        try {
            if (isNew) {
                // Assume that date_created and created_by are needed for a new document
                documentData.date_created = new Date().toISOString().split('T')[0];
                console.log("DDSD",user)
                await addDocumentToImplementation(implementation_id, implementation_type, documentData, user?.employee_id || '');
            } else {
                await updateDocument(implementation_id, implementation_type, documentData, user?.employee_id || '');
            }
            await loadSingleWorkingGroupData(currentWorkingGroup); // Refresh data
            setExpandedIndex(null);
            setIsAddingNewDocument(false);
        } catch (error) {
            console.error('Error submitting document:', error);
        }
    };

    return (
        <Box>
            {/* Button to add a new document */}
            <Button
                colorScheme="teal"
                onClick={() => {
                    setIsAddingNewDocument(true);
                    setExpandedIndex(null); // Collapse any other expanded documents
                }}
                mb={4}
            >
                Add New Document
            </Button>

            {/* Render the DocumentForm for adding a new document if isAddingNewDocument is true */}
            {isAddingNewDocument ? (
                    <Box mb={4} border="1px solid teal" borderRadius="md" p={4} boxShadow="sm">
                        <DocumentForm
                            document={null} // Pass null for a new document
                            onSubmit={(documentData) => handleFormSubmit(null, documentData, true)} // Pass true to indicate new document
                            createdBy={user?.properties || user} // Pass user data or null
                        />
                    </Box>
                ) : // Render existing documents if not adding a new document
                documents && documents.length > 0 ? (
                    documents.map((docWrapper, index) => {
                        const document = docWrapper.document || docWrapper; // Adjust based on data structure
                        const createdByPerson = docWrapper.created_by?.properties || document.created_by?.properties;


                        return (
                            <Box
                                key={document.properties.unique_id || index}
                                mb={4}
                                border="1px solid teal"
                                borderRadius="md"
                                p={4}
                                boxShadow="sm"
                            >
                                <Flex
                                    justify="space-between"
                                    alignItems="center"
                                    cursor="pointer"
                                    onClick={() => toggleCollapse(index)}
                                >
                                    <Text fontWeight="bold" fontSize="sm">
                                        {document.properties.name || 'Untitled Document'}
                                    </Text>
                                    <Button size="sm" colorScheme="teal">
                                        {expandedIndex === index ? 'Collapse' : 'Expand'}
                                    </Button>
                                </Flex>

                                <Text fontSize="sm" color="gray.600" mt={2}>
                                    Created by: {createdByPerson ? createdByPerson.name : 'Unknown Author'}
                                </Text>

                                <Collapse in={expandedIndex === index} animateOpacity>
                                    <Box mt={4}>
                                        <DocumentForm
                                            document={document} // Pass the actual document object
                                            onSubmit={(documentData) => handleFormSubmit(index, documentData, false)} // Pass false to indicate update
                                            createdBy={createdByPerson}
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

function DocumentForm({ document, onSubmit, createdBy }) {
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
            new Date().toISOString().split('T')[0], // Default to today's date if new
        created_by: createdBy || {},
    });

    // New state to track submission status
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Update local state when `document` or `createdBy` prop changes
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
        setIsSubmitting(true); // Start the spinner
        try {
            await onSubmit(documentData);
        } catch (error) {
            console.error('Error submitting document:', error);
        } finally {
            setIsSubmitting(false); // Stop the spinner
        }
    };

    return (
        <Box as="form" onSubmit={handleSubmit}>
            <FormControl mb={4}>
                <FormLabel>Document Name</FormLabel>
                <Input name="name" value={documentData.name} onChange={handleChange} />
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

            {/* Display created_by person details */}
            {createdBy?.name ? (
                <Box mb={4}>
                    <Text fontSize="sm" color="gray.600">
                        Created by: {createdBy.name} ({createdBy.title || 'Unknown Title'})
                    </Text>
                </Box>
            ) : (
                <Text fontSize="sm" color="gray.600">Created by: Unknown</Text>
            )}

            {/* Flex box to split the toggles and date fields into two columns */}
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

            <Button
                type="submit"
                colorScheme="teal"
                mt={4}
                isLoading={isSubmitting} // Chakra UI prop to show spinner
                loadingText={document?.properties?.name ? 'Updating...' : 'Submitting...'}
            >
                {document?.properties?.name ? 'Update Document' : 'Submit Document'}
            </Button>
        </Box>
    );
}

export default DocumentViewer;
