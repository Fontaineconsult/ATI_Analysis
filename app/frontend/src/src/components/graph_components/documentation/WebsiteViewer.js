// WebsiteViewer.jsx

import React, { useState, useContext, useEffect } from 'react';
import {
    Box,
    Button,
    Input,
    Textarea,
    Switch,
    FormControl,
    FormLabel,
    Text,
    Flex,
    Collapse,
} from '@chakra-ui/react';
import { updateWebpage } from '../../../services/api/put';
import { addWebpageToImplementation } from '../../../services/api/post';
import { useToast } from '@chakra-ui/react';
import { DataContext } from '../../../context/DataContext';
import { useSettings } from '../../../context/SettingsContext';
import { UserContext } from '../../../context/UserContext';

function WebsiteViewer({ websites, implementation_id, implementation_type }) {
    const [expandedIndex, setExpandedIndex] = useState(null);
    const [isAddingNewWebsite, setIsAddingNewWebsite] = useState(false);
    const { loadSingleWorkingGroupData, selectedYear } = useContext(DataContext);
    const { currentWorkingGroup } = useSettings();
    const { user } = useContext(UserContext);
    const toast = useToast();
    // Toggle expanded/collapsed state
    const toggleCollapse = (index) => {
        setExpandedIndex(expandedIndex === index ? null : index);
    };

    // Handle form submission for both new and updated websites
    const handleFormSubmit = async (index, websiteData, isNew) => {
        try {
            let response; // Declare a variable to hold the response

            if (isNew) {
                // Assume that date_created and created_by are needed for a new website
                websiteData.date_created = new Date().toISOString().split('T')[0];

                // Capture the response from the API call
                response = await addWebpageToImplementation(
                    implementation_id,
                    implementation_type,
                    websiteData,
                    user?.properties || user
                );
            } else {
                // Capture the response from the API call
                response = await updateWebpage(
                    implementation_id,
                    implementation_type,
                    websiteData,
                    user?.properties || user
                );
            }

            // Use the message from the response in the success toast

            toast({
                title: "Success",
                description: response.message || "Operation completed successfully.",
                status: "success",
                duration: 3000,
                isClosable: true,
            });

            await loadSingleWorkingGroupData(currentWorkingGroup); // Refresh data
            setExpandedIndex(null);
            setIsAddingNewWebsite(false);
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
            {/* Button to add a new website */}
            <Button
                colorScheme="teal"
                onClick={() => {
                    setIsAddingNewWebsite(true);
                    setExpandedIndex(null); // Collapse any other expanded websites
                }}
                mb={4}
            >
                Add New Website
            </Button>

            {/* Render the WebsiteForm for adding a new website if isAddingNewWebsite is true */}
            {isAddingNewWebsite ? (
                    <Box mb={4} border="1px solid teal" borderRadius="md" p={4} boxShadow="sm">
                        <WebsiteForm
                            website={null} // Pass null for a new website
                            onSubmit={(websiteData) => handleFormSubmit(null, websiteData, true)} // Pass true to indicate new website
                            createdBy={user?.properties || user} // Pass user data or null
                        />
                    </Box>
                ) : // Render existing websites if not adding a new website
                websites && websites.length > 0 ? (
                    websites.map((webWrapper, index) => {
                        const website = webWrapper.webpage || webWrapper; // Adjust based on data structure
                        const createdByPerson = webWrapper.created_by?.properties || website.created_by?.properties;

                        return (
                            <Box
                                key={website.properties.unique_id || index}
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
                                        {website.properties.name || 'Untitled Website'}
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
                                        <WebsiteForm
                                            website={website} // Pass the actual website object
                                            onSubmit={(websiteData) => handleFormSubmit(index, websiteData, false)} // Pass false to indicate update
                                            createdBy={createdByPerson}
                                        />
                                    </Box>
                                </Collapse>
                            </Box>
                        );
                    })
                ) : (
                    <Text>No websites available.</Text>
                )}
        </Box>
    );
}

function WebsiteForm({ website, onSubmit, createdBy }) {
    const [websiteData, setWebsiteData] = useState({
        unique_id: website?.properties?.unique_id || '',
        url: website?.properties?.url || '',
        name: website?.properties?.name || '',
        description: website?.properties?.description || '',
        no_longer_exists: website?.properties?.no_longer_exists || false,
        depreciated: website?.properties?.depreciated || false,
        depreciated_date: website?.properties?.depreciated_date || '',
        include_in_report: website?.properties?.include_in_report ?? true,
        date_created:
            website?.properties?.date_created || new Date().toISOString().split('T')[0],
        created_by: createdBy || {},
    });

    // New state to track submission status
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Update local state when `website` or `createdBy` prop changes
    useEffect(() => {
        setWebsiteData({
            unique_id: website?.properties?.unique_id || '',
            url: website?.properties?.url || '',
            name: website?.properties?.name || '',
            description: website?.properties?.description || '',
            no_longer_exists: website?.properties?.no_longer_exists || false,
            depreciated: website?.properties?.depreciated || false,
            depreciated_date: website?.properties?.depreciated_date || '',
            include_in_report: website?.properties?.include_in_report ?? true,
            date_created:
                website?.properties?.date_created || new Date().toISOString().split('T')[0],
            created_by: createdBy || {},
        });
    }, [website, createdBy]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setWebsiteData({
            ...websiteData,
            [name]: type === 'checkbox' ? checked : value,
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true); // Start the spinner
        try {
            await onSubmit(websiteData);
        } catch (error) {
            console.error('Error submitting website:', error);
        } finally {
            setIsSubmitting(false); // Stop the spinner
        }
    };

    return (
        <Box as="form" onSubmit={handleSubmit}>
            <FormControl mb={4}>
                <FormLabel>Website URL</FormLabel>
                <Input name="url" value={websiteData.url} onChange={handleChange} required />
            </FormControl>
            <FormControl mb={4}>
                <FormLabel>Website Name</FormLabel>
                <Input name="name" value={websiteData.name} onChange={handleChange} required />
            </FormControl>
            <FormControl mb={4}>
                <FormLabel>Description</FormLabel>
                <Textarea
                    name="description"
                    value={websiteData.description}
                    onChange={handleChange}
                />
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
                        <FormLabel>No Longer Exists</FormLabel>
                        <Switch
                            name="no_longer_exists"
                            isChecked={websiteData.no_longer_exists}
                            onChange={handleChange}
                        />
                    </FormControl>
                    <FormControl mb={4}>
                        <FormLabel>Include in Report</FormLabel>
                        <Switch
                            name="include_in_report"
                            isChecked={websiteData.include_in_report}
                            onChange={handleChange}
                        />
                    </FormControl>
                </Box>

                <Box flex="1">
                    <FormControl mb={4}>
                        <FormLabel>Depreciated</FormLabel>
                        <Switch
                            name="depreciated"
                            isChecked={websiteData.depreciated}
                            onChange={handleChange}
                        />
                    </FormControl>
                    <FormControl mb={4}>
                        <FormLabel>Depreciation Date</FormLabel>
                        <Input
                            type="date"
                            name="depreciated_date"
                            value={websiteData.depreciated_date}
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
                loadingText={website?.properties?.name ? 'Updating...' : 'Submitting...'}
            >
                {website?.properties?.name ? 'Update Website' : 'Submit Website'}
            </Button>
        </Box>
    );
}

export default WebsiteViewer;
