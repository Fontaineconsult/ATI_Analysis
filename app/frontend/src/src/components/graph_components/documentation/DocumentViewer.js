import React, { useState } from 'react';
import {
    Box,
    Button,
    Input,
    Switch,
    FormControl,
    FormLabel,
    Text,
    Flex,
    Collapse
} from '@chakra-ui/react';

function DocumentViewer({ documents, onSubmit }) {
    const [expandedIndex, setExpandedIndex] = useState(null);

    // Toggle expanded/collapsed state, allowing only one to be expanded at a time
    const toggleCollapse = (index) => {
        setExpandedIndex(expandedIndex === index ? null : index); // Toggle the selected document
    };

    const handleFormSubmit = (index, updatedDocument) => {
        onSubmit(index, updatedDocument);  // Pass the updated document data and index to the parent
        setExpandedIndex(null);  // Collapse the form after submitting
    };

    return (
        <Box>
            {documents.map((doc, index) => (
                <Box key={index} mb={4} border="1px solid teal" borderRadius="md" p={4} boxShadow="sm">
                    <Flex justify="space-between" alignItems="center" cursor="pointer" onClick={() => toggleCollapse(index)}>
                        <Text fontWeight="bold" fontSize="lg">
                            {doc.properties.name || 'Untitled Document'}
                        </Text>
                        <Button size="sm" colorScheme="teal">
                            {expandedIndex === index ? 'Collapse' : 'Expand'}
                        </Button>
                    </Flex>

                    {/* Collapsible form content */}
                    <Collapse in={expandedIndex === index} animateOpacity>
                        <Box mt={4}>
                            <DocumentForm
                                document={doc}  // Pass the current document to the form
                                onSubmit={(updatedDocument) => handleFormSubmit(index, updatedDocument)}  // Handle form submit
                            />
                        </Box>
                    </Collapse>
                </Box>
            ))}
        </Box>
    );
}

function DocumentForm({ document, onSubmit }) {
    const [documentData, setDocumentData] = useState({
        name: document.properties.name || '',
        file_path: document.properties.file_path || '',
        uri_path: document.properties.uri_path || '',
        is_administrative_review_documentation: document.properties.is_administrative_review_documentation === 'True',
        is_milestone_and_measures_documentation: document.properties.is_milestone_and_measures_documentation === 'True',
        include_in_report: document.properties.include_in_report || true,
        depreciated: document.properties.depreciated || false,
        depreciated_date: document.properties.depreciated_date || '',
    });

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setDocumentData({
            ...documentData,
            [name]: type === 'checkbox' ? checked : value,
        });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(documentData);  // Pass the updated document data to the parent
    };

    return (
        <Box as="form" onSubmit={handleSubmit}>
            <FormControl mb={4}>
                <FormLabel>Document Name</FormLabel>
                <Input name="name" value={documentData.name} onChange={handleChange} />
            </FormControl>
            <FormControl mb={4}>
                <FormLabel>File Path</FormLabel>
                <Input name="file_path" value={documentData.file_path} onChange={handleChange} />
            </FormControl>
            <FormControl mb={4}>
                <FormLabel>URI Path</FormLabel>
                <Input name="uri_path" value={documentData.uri_path} onChange={handleChange} />
            </FormControl>

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

            <Button type="submit" colorScheme="teal" mt={4}>Submit Changes</Button>
        </Box>
    );
}

export default DocumentViewer;
