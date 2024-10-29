import React, { useState } from 'react';
import { Box, Button, Input, Textarea, Switch, FormControl, FormLabel, Text, Link, Flex, Collapse } from '@chakra-ui/react';

function WebsiteViewer({ websites, onSubmit }) {
    const [expandedIndex, setExpandedIndex] = useState(null);

    // Toggle expanded/collapsed state, allowing only one to be expanded at a time
    const toggleCollapse = (index) => {
        setExpandedIndex(expandedIndex === index ? null : index); // Toggle the selected website
    };

    const handleFormSubmit = (index, updatedWebsite) => {
        onSubmit(index, updatedWebsite);  // Pass the updated website data and index to the parent
        setExpandedIndex(null);  // Collapse the form after submitting
    };

    return (
        <Box>
            {websites.map((web, index) => (
                <Box key={index} mb={4} border="1px solid teal" borderRadius="md" p={4} boxShadow="sm">
                    <Flex justify="space-between" alignItems="center" cursor="pointer" onClick={() => toggleCollapse(index)}>
                        <Text fontWeight="bold" fontSize="lg">
                            {web.properties.name || 'Untitled Website'}
                        </Text>
                        <Button size="sm" colorScheme="teal">
                            {expandedIndex === index ? 'Collapse' : 'Expand'}
                        </Button>
                    </Flex>

                    {/* Collapsible form content */}
                    <Collapse in={expandedIndex === index} animateOpacity>
                        <Box mt={4}>
                            <WebsiteForm
                                website={web}  // Pass the current website to the form
                                onSubmit={(updatedWebsite) => handleFormSubmit(index, updatedWebsite)}  // Handle form submit
                            />
                        </Box>
                    </Collapse>
                </Box>
            ))}
        </Box>
    );
}

function WebsiteForm({ website, onSubmit }) {
    const [websiteData, setWebsiteData] = useState({
        unique_id: website.properties.unique_id || '',
        url: website.properties.url || '',
        name: website.properties.name || '',
        description: website.properties.description || '',
        no_longer_exists: website.properties.no_longer_exists || false,
        depreciated: website.properties.depreciated || false,
        depreciated_date: website.properties.depreciated_date || '',
        include_in_report: website.properties.include_in_report || true,
    });

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setWebsiteData({
            ...websiteData,
            [name]: type === 'checkbox' ? checked : value,
        });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(websiteData);  // Pass the updated website data to the parent
    };

    return (
        <Box as="form" onSubmit={handleSubmit}>
            <FormControl mb={4}>
                <FormLabel>Website URL</FormLabel>
                <Input name="url" value={websiteData.url} onChange={handleChange} />
            </FormControl>
            <FormControl mb={4}>
                <FormLabel>Website Name</FormLabel>
                <Input name="name" value={websiteData.name} onChange={handleChange} />
            </FormControl>
            <FormControl mb={4}>
                <FormLabel>Description</FormLabel>
                <Textarea name="description" value={websiteData.description} onChange={handleChange} />
            </FormControl>

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

            <Button type="submit" colorScheme="teal" mt={4}>Submit Changes</Button>
        </Box>
    );
}

export default WebsiteViewer;
