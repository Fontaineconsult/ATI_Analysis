import React, { useState } from 'react';
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
    Select,
    HStack,
    VStack,
    Badge,
    IconButton,
    Grid,
    GridItem,
    Link
} from '@chakra-ui/react';
import { EditIcon, ExternalLinkIcon } from '@chakra-ui/icons';
import FileUploadField from '../../implementation_explorer/doc_components/FileUploadField';

const metricTypes = ["tabular", "graphical", "descriptive"];

const metricTypeColors = {
    tabular: 'blue',
    graphical: 'green',
    descriptive: 'purple'
};

function MetricViewer({ metrics, onSubmit }) {
    const [expandedIndex, setExpandedIndex] = useState(null);

    const toggleCollapse = (index) => {
        setExpandedIndex(expandedIndex === index ? null : index);
    };

    const handleFormSubmit = (index, updatedMetric) => {
        onSubmit(index, updatedMetric);
        setExpandedIndex(null);
    };

    return (
        <Box>
            {metrics && metrics.length > 0 ? (
                <VStack spacing={2} align="stretch">
                    {metrics.map((metricWrapper, index) => {
                        const metric = metricWrapper.metric || metricWrapper;
                        const isExpanded = expandedIndex === index;

                        return (
                            <Box
                                key={metric.properties?.unique_id || index}
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
                                        {/* Title row with badges */}
                                        <HStack spacing={2} width="full">
                                            <Text fontWeight="bold" fontSize="sm" color="gray.800">
                                                {metric.properties?.name || 'Untitled Metric'}
                                            </Text>
                                            <Badge
                                                colorScheme={metricTypeColors[metric.properties?.metric_type] || 'gray'}
                                                fontSize="10px"
                                            >
                                                {metric.properties?.metric_type || 'unknown'}
                                            </Badge>
                                            {metric.properties?.include_in_report && (
                                                <Badge colorScheme="green" fontSize="10px">In Report</Badge>
                                            )}
                                            {metric.properties?.depreciated && (
                                                <Badge colorScheme="orange" fontSize="10px">Deprecated</Badge>
                                            )}
                                        </HStack>

                                        {/* Key info row */}
                                        <HStack spacing={3} fontSize="xs">
                                            {metric.properties?.single_value && (
                                                <Text color="teal.600" fontWeight="semibold">
                                                    Value: {metric.properties.single_value}
                                                </Text>
                                            )}
                                            {metric.properties?.composite_key && (
                                                <Text color="gray.600">
                                                    Key: {metric.properties.composite_key}
                                                </Text>
                                            )}
                                            {(metric.properties?.file_path || metric.properties?.uri_path) && (
                                                <HStack spacing={1}>
                                                    <Text color="teal.600">Link</Text>
                                                    <ExternalLinkIcon w={3} h={3} color="teal.600" />
                                                </HStack>
                                            )}
                                            {metric.properties?.file?.download_url && (
                                                <Link
                                                    href={metric.properties.file.download_url}
                                                    isExternal
                                                    color="teal.600"
                                                    display="flex"
                                                    alignItems="center"
                                                >
                                                    {metric.properties.file.original_filename || 'Download'} <ExternalLinkIcon ml={1} w={3} h={3} />
                                                </Link>
                                            )}
                                        </HStack>

                                        {/* Description preview */}
                                        {metric.properties?.description && (
                                            <Text fontSize="xs" color="gray.600" noOfLines={1}>
                                                {metric.properties.description}
                                            </Text>
                                        )}
                                    </VStack>

                                    <IconButton
                                        aria-label="Edit metric"
                                        icon={<EditIcon />}
                                        size="xs"
                                        colorScheme={isExpanded ? "gray" : "teal"}
                                        variant={isExpanded ? "solid" : "ghost"}
                                        onClick={() => toggleCollapse(index)}
                                        ml={2}
                                    />
                                </Flex>

                                {/* Collapsible form */}
                                <Collapse in={isExpanded} animateOpacity>
                                    <Box mt={3} pt={3} borderTop="1px solid" borderColor="gray.200">
                                        <MetricForm
                                            metric={metric}
                                            onSubmit={(updatedMetric) => handleFormSubmit(index, updatedMetric)}
                                            onCancel={() => toggleCollapse(index)}
                                        />
                                    </Box>
                                </Collapse>
                            </Box>
                        );
                    })}
                </VStack>
            ) : (
                <Text color="gray.500" fontSize="sm">No metrics available.</Text>
            )}
        </Box>
    );
}

function MetricForm({ metric, onSubmit, onCancel }) {
    const [metricData, setMetricData] = useState({
        unique_id: metric.properties?.unique_id || '',
        name: metric.properties?.name || '',
        composite_key: metric.properties?.composite_key || '',
        metric_type: metric.properties?.metric_type || metricTypes[0],
        file_path: metric.properties?.file_path || '',
        uri_path: metric.properties?.uri_path || '',
        storage_key: metric.properties?.file?.storage_key || '',
        original_filename: metric.properties?.file?.original_filename || '',
        content_type: metric.properties?.file?.content_type || '',
        size: metric.properties?.file?.size ?? null,
        description: metric.properties?.description || '',
        single_value: metric.properties?.single_value || '',
        value_dict: JSON.stringify(metric.properties?.value_dict || {}),
        comment: metric.properties?.comment || '',
        depreciated: metric.properties?.depreciated || false,
        depreciated_date: metric.properties?.depreciated_date || '',
        include_in_report: metric.properties?.include_in_report ?? true,
    });

    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setMetricData({
            ...metricData,
            [name]: type === 'checkbox' ? checked : value,
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await onSubmit({ ...metricData, value_dict: JSON.parse(metricData.value_dict) });
        } catch (error) {
            console.error('Error submitting metric:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Box as="form" onSubmit={handleSubmit}>
            <Grid templateColumns="repeat(2, 1fr)" gap={3}>
                <FormControl>
                    <FormLabel fontSize="xs">Metric Name</FormLabel>
                    <Input size="sm" name="name" value={metricData.name} onChange={handleChange} required />
                </FormControl>

                <FormControl>
                    <FormLabel fontSize="xs">Metric Type</FormLabel>
                    <Select size="sm" name="metric_type" value={metricData.metric_type} onChange={handleChange}>
                        {metricTypes.map((type) => (
                            <option key={type} value={type}>{type}</option>
                        ))}
                    </Select>
                </FormControl>

                <FormControl>
                    <FormLabel fontSize="xs">Composite Key</FormLabel>
                    <Input size="sm" name="composite_key" value={metricData.composite_key} onChange={handleChange} />
                </FormControl>

                <FormControl>
                    <FormLabel fontSize="xs">Single Value</FormLabel>
                    <Input size="sm" name="single_value" value={metricData.single_value} onChange={handleChange} />
                </FormControl>

                <FormControl>
                    <FormLabel fontSize="xs">File Path</FormLabel>
                    <Input size="sm" name="file_path" value={metricData.file_path} onChange={handleChange} />
                </FormControl>

                <FormControl>
                    <FormLabel fontSize="xs">URI Path</FormLabel>
                    <Input size="sm" name="uri_path" value={metricData.uri_path} onChange={handleChange} />
                </FormControl>

                <GridItem colSpan={2}>
                    <FileUploadField
                        value={metricData}
                        onUploaded={(f) => setMetricData({ ...metricData, ...f })}
                        onClear={() => setMetricData({
                            ...metricData,
                            storage_key: '', original_filename: '', content_type: '', size: null,
                        })}
                    />
                </GridItem>

                <GridItem colSpan={2}>
                    <FormControl>
                        <FormLabel fontSize="xs">Description</FormLabel>
                        <Textarea size="sm" name="description" value={metricData.description} onChange={handleChange} rows={2} />
                    </FormControl>
                </GridItem>

                <GridItem colSpan={2}>
                    <FormControl>
                        <FormLabel fontSize="xs">Value Dictionary (JSON)</FormLabel>
                        <Textarea size="sm" name="value_dict" value={metricData.value_dict} onChange={handleChange} rows={2} placeholder="Enter valid JSON" />
                    </FormControl>
                </GridItem>

                <GridItem colSpan={2}>
                    <FormControl>
                        <FormLabel fontSize="xs">Comment</FormLabel>
                        <Textarea size="sm" name="comment" value={metricData.comment} onChange={handleChange} rows={2} />
                    </FormControl>
                </GridItem>

                <FormControl>
                    <FormLabel fontSize="xs">Depreciation Date</FormLabel>
                    <Input size="sm" type="date" name="depreciated_date" value={metricData.depreciated_date} onChange={handleChange} />
                </FormControl>
            </Grid>

            {/* Toggle switches */}
            <HStack spacing={4} mt={3}>
                <FormControl display="flex" alignItems="center">
                    <FormLabel fontSize="xs" mb="0" flex="1">Include in Report</FormLabel>
                    <Switch size="sm" name="include_in_report" isChecked={metricData.include_in_report} onChange={handleChange} />
                </FormControl>

                <FormControl display="flex" alignItems="center">
                    <FormLabel fontSize="xs" mb="0" flex="1">Deprecated</FormLabel>
                    <Switch size="sm" name="depreciated" isChecked={metricData.depreciated} onChange={handleChange} />
                </FormControl>
            </HStack>

            {/* Action buttons */}
            <HStack mt={3} spacing={2}>
                <Button
                    type="submit"
                    size="xs"
                    colorScheme="teal"
                    isLoading={isSubmitting}
                    loadingText="Updating..."
                >
                    Update
                </Button>
                {onCancel && (
                    <Button size="xs" variant="outline" onClick={onCancel} isDisabled={isSubmitting}>
                        Cancel
                    </Button>
                )}
            </HStack>
        </Box>
    );
}

export default MetricViewer;