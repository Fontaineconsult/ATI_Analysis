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
    const toggleEdit = (index) => {
        setExpandedIndex(expandedIndex === index ? null : index);
    };

    // Handle form submission for both new and updated websites
    const handleFormSubmit = async (index, websiteData, isNew) => {
        try {
            let response;

            if (isNew) {
                websiteData.date_created = new Date().toISOString().split('T')[0];
                response = await addWebpageToImplementation(
                    implementation_id,
                    implementation_type,
                    websiteData,
                    user?.properties || user
                );
            } else {
                response = await updateWebpage(
                    implementation_id,
                    implementation_type,
                    websiteData,
                    user?.properties || user
                );
            }

            toast({
                title: "Success",
                description: response.message || "Operation completed successfully.",
                status: "success",
                duration: 3000,
                isClosable: true,
            });

            await loadSingleWorkingGroupData(currentWorkingGroup);
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
            <Button
                colorScheme="teal"
                onClick={() => {
                    setIsAddingNewWebsite(true);
                    setExpandedIndex(null);
                }}
                mb={4}
            >
                Add New Website
            </Button>

            {isAddingNewWebsite ? (
                <Box mb={4} border="1px solid teal" borderRadius="md" p={4} boxShadow="sm">
                    <WebsiteForm
                        website={null}
                        onSubmit={(websiteData) => handleFormSubmit(null, websiteData, true)}
                        createdBy={user?.properties || user}
                        isNewWebsite={true}
                        onCancel={() => setIsAddingNewWebsite(false)}
                    />
                </Box>
            ) : websites && websites.length > 0 ? (
                websites.map((webWrapper, index) => {
                    const website = webWrapper.webpage || webWrapper;
                    const createdByPerson = webWrapper.created_by?.properties || website.created_by?.properties;
                    const isExpanded = expandedIndex === index;

                    return (
                        <Box
                            key={website.properties.unique_id || index}
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
                                            <Text fontWeight="bold" color="gray.600" minWidth="50px">
                                                URL:
                                            </Text>
                                            <a
                                                href={website.properties.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                style={{ color: '#3182ce', textDecoration: 'underline', wordBreak: 'break-all' }}
                                            >
                                                {website.properties.url || 'No URL provided'}
                                            </a>
                                        </Flex>
                                        <Flex mb={1} align="baseline">
                                            <Text fontWeight="bold" color="gray.600" minWidth="50px">
                                                Name:
                                            </Text>
                                            <Text>{website.properties.name || 'No name provided'}</Text>
                                        </Flex>
                                        <Flex align="baseline">
                                            <Text fontWeight="bold" color="gray.600" minWidth="50px">
                                                Desc:
                                            </Text>
                                            <Text>{website.properties.description || 'No description provided'}</Text>
                                        </Flex>
                                    </Box>

                                    {/* Right side - Status Info (1/3 width) */}
                                    <Box flex="1" fontSize="sm" borderLeft="1px solid" borderColor="gray.200" pl={4}>
                                        <Flex mb={1} align="baseline">
                                            <Text fontWeight="bold" color="gray.600" minWidth="120px">
                                                No Longer Exists:
                                            </Text>
                                            <Text color={website.properties.no_longer_exists ? "red.500" : "green.500"}>
                                                {website.properties.no_longer_exists ? 'True' : 'False'}
                                            </Text>
                                        </Flex>
                                        <Flex mb={1} align="baseline">
                                            <Text fontWeight="bold" color="gray.600" minWidth="120px">
                                                Include in Report:
                                            </Text>
                                            <Text color={website.properties.include_in_report ? "green.500" : "red.500"}>
                                                {website.properties.include_in_report ? 'True' : 'False'}
                                            </Text>
                                        </Flex>
                                        <Flex mb={1} align="baseline">
                                            <Text fontWeight="bold" color="gray.600" minWidth="120px">
                                                Depreciated:
                                            </Text>
                                            <Text color={website.properties.depreciated ? "orange.500" : "green.500"}>
                                                {website.properties.depreciated ? 'True' : 'False'}
                                            </Text>
                                        </Flex>
                                        <Flex align="baseline">
                                            <Text fontWeight="bold" color="gray.600" minWidth="120px">
                                                Depreciation Date:
                                            </Text>
                                            <Text>{website.properties.depreciated_date || 'N/A'}</Text>
                                        </Flex>
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
                                    <WebsiteForm
                                        website={website}
                                        onSubmit={(websiteData) => handleFormSubmit(index, websiteData, false)}
                                        createdBy={createdByPerson}
                                        isNewWebsite={false}
                                        onCancel={() => toggleEdit(index)}
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

function WebsiteForm({ website, onSubmit, createdBy, isNewWebsite, onCancel }) {
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

    const [isSubmitting, setIsSubmitting] = useState(false);

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
        setIsSubmitting(true);
        try {
            await onSubmit(websiteData);
        } catch (error) {
            console.error('Error submitting website:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Box as="form" onSubmit={handleSubmit}>
            {/* Show input fields only when editing or for new websites */}
            <FormControl mb={4}>
                <FormLabel>Website URL</FormLabel>
                <Input
                    name="url"
                    value={websiteData.url}
                    onChange={handleChange}
                    required
                />
            </FormControl>
            <FormControl mb={4}>
                <FormLabel>Website Name</FormLabel>
                <Input
                    name="name"
                    value={websiteData.name}
                    onChange={handleChange}
                    required
                />
            </FormControl>
            <FormControl mb={4}>
                <FormLabel>Description</FormLabel>
                <Textarea
                    name="description"
                    value={websiteData.description}
                    onChange={handleChange}
                />
            </FormControl>

            {/* Toggles and date fields */}
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

            {/* Action buttons */}
            <Flex gap={2}>
                <Button
                    type="submit"
                    colorScheme="teal"
                    isLoading={isSubmitting}
                    loadingText={isNewWebsite ? 'Submitting...' : 'Updating...'}
                >
                    {isNewWebsite ? 'Submit Website' : 'Update Website'}
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

export default WebsiteViewer;