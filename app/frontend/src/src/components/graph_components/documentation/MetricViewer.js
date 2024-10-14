import React, { useState } from 'react';
import { Box, Button, Input, Textarea, Switch, FormControl, FormLabel, Text, Flex, Collapse, Select } from '@chakra-ui/react';

// Predefined metric types
const metricTypes = ["tabular", "graphical", "descriptive"];

function MetricViewer({ metrics, onSubmit }) {
    const [expandedIndex, setExpandedIndex] = useState(null);

    // Toggle expanded/collapsed state, allowing only one to be expanded at a time
    const toggleCollapse = (index) => {
        setExpandedIndex(expandedIndex === index ? null : index); // Toggle the selected metric
    };

    const handleFormSubmit = (index, updatedMetric) => {
        onSubmit(index, updatedMetric);  // Pass the updated metric data and index to the parent
        setExpandedIndex(null);  // Collapse the form after submitting
    };

    return (
        <Box>
            {metrics.map((metric, index) => (
                <Box key={index} mb={4} border="1px solid teal" borderRadius="md" p={4} boxShadow="sm">
                    <Flex justify="space-between" alignItems="center" cursor="pointer" onClick={() => toggleCollapse(index)}>
                        <Text fontWeight="bold" fontSize="lg">
                            {metric.properties.name || 'Untitled Metric'}
                        </Text>
                        <Button size="sm" colorScheme="teal">
                            {expandedIndex === index ? 'Collapse' : 'Expand'}
                        </Button>
                    </Flex>

                    {/* Collapsible form content */}
                    <Collapse in={expandedIndex === index} animateOpacity>
                        <Box mt={4}>
                            <MetricForm
                                metric={metric}  // Pass the current metric to the form
                                onSubmit={(updatedMetric) => handleFormSubmit(index, updatedMetric)}  // Handle form submit
                            />
                        </Box>
                    </Collapse>
                </Box>
            ))}
        </Box>
    );
}

function MetricForm({ metric, onSubmit }) {
    const [metricData, setMetricData] = useState({
        name: metric.properties.name || '',
        composite_key: metric.properties.composite_key || '',
        metric_type: metric.properties.metric_type || '',
        file_path: metric.properties.file_path || '',
        uri_path: metric.properties.uri_path || '',
        description: metric.properties.description || '',
        single_value: metric.properties.single_value || '',
        value_dict: JSON.stringify(metric.properties.value_dict || {}), // Convert value_dict to JSON string for input
        comment: metric.properties.comment || '',
        depreciated: metric.properties.depreciated || false,
        depreciated_date: metric.properties.depreciated_date || '',
        include_in_report: metric.properties.include_in_report || true,
    });

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setMetricData({
            ...metricData,
            [name]: type === 'checkbox' ? checked : value,
        });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit({ ...metricData, value_dict: JSON.parse(metricData.value_dict) });  // Parse JSON value_dict on submit
    };

    return (
        <Box as="form" onSubmit={handleSubmit}>
            <FormControl mb={4}>
                <FormLabel>Metric Name</FormLabel>
                <Input name="name" value={metricData.name} onChange={handleChange} />
            </FormControl>
            <FormControl mb={4}>
                <FormLabel>Composite Key</FormLabel>
                <Input name="composite_key" value={metricData.composite_key} onChange={handleChange} />
            </FormControl>
            <FormControl mb={4}>
                <FormLabel>Metric Type</FormLabel>
                <Select name="metric_type" value={metricData.metric_type} onChange={handleChange}>
                    {metricTypes.map((type) => (
                        <option key={type} value={type}>
                            {type}
                        </option>
                    ))}
                </Select>
            </FormControl>
            <FormControl mb={4}>
                <FormLabel>File Path</FormLabel>
                <Input name="file_path" value={metricData.file_path} onChange={handleChange} />
            </FormControl>
            <FormControl mb={4}>
                <FormLabel>URI Path</FormLabel>
                <Input name="uri_path" value={metricData.uri_path} onChange={handleChange} />
            </FormControl>
            <FormControl mb={4}>
                <FormLabel>Description</FormLabel>
                <Textarea name="description" value={metricData.description} onChange={handleChange} />
            </FormControl>
            <FormControl mb={4}>
                <FormLabel>Single Value</FormLabel>
                <Input name="single_value" value={metricData.single_value} onChange={handleChange} />
            </FormControl>
            <FormControl mb={4}>
                <FormLabel>Value Dictionary (JSON)</FormLabel>
                <Textarea
                    name="value_dict"
                    value={metricData.value_dict}
                    onChange={handleChange}
                    placeholder="Enter valid JSON"
                />
            </FormControl>
            <FormControl mb={4}>
                <FormLabel>Comment</FormLabel>
                <Textarea name="comment" value={metricData.comment} onChange={handleChange} />
            </FormControl>

            {/* Flex box to split the toggles and date fields into two columns */}
            <Flex gap={4} mb={4}>
                <Box flex="1">
                    <FormControl mb={4}>
                        <FormLabel>Depreciated</FormLabel>
                        <Switch
                            name="depreciated"
                            isChecked={metricData.depreciated}
                            onChange={handleChange}
                        />
                    </FormControl>
                    <FormControl mb={4}>
                        <FormLabel>Include in Report</FormLabel>
                        <Switch
                            name="include_in_report"
                            isChecked={metricData.include_in_report}
                            onChange={handleChange}
                        />
                    </FormControl>
                </Box>

                <Box flex="1">
                    <FormControl mb={4}>
                        <FormLabel>Depreciation Date</FormLabel>
                        <Input
                            type="date"
                            name="depreciated_date"
                            value={metricData.depreciated_date}
                            onChange={handleChange}
                        />
                    </FormControl>
                </Box>
            </Flex>

            <Button type="submit" colorScheme="teal" mt={4}>Submit Changes</Button>
        </Box>
    );
}

export default MetricViewer;
