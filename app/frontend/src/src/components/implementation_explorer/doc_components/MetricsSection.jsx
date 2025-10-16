import React, { useState, useContext } from 'react';
import {
    Box, VStack, Heading, Text, Badge, Link, HStack, Button, Input, Switch,
    FormControl, FormLabel, Flex, Collapse, useToast, Textarea, Select
} from '@chakra-ui/react';
import { ExternalLinkIcon } from '@chakra-ui/icons';
import { addMetricToImplementation } from '../../../services/api/post';
import { updateMetric } from '../../../services/api/put';
import { DataContext } from '../../../context/DataContext';
import { useSettings } from '../../../context/SettingsContext';
import { UserContext } from '../../../context/UserContext';

const metricTypes = ["tabular", "graphical", "descriptive"];

function MetricForm({ metric, onSubmit, onCancel, isNewMetric }) {
    const { user } = useContext(UserContext);
    const { currentAcademicYear } = useSettings();
    const [metricData, setMetricData] = useState({
        unique_id: metric?.unique_id || '',
        name: metric?.name || '',
        composite_key: metric?.composite_key || '',
        metric_type: metric?.metric_type || metricTypes[0],
        file_path: metric?.file_path || '',
        uri_path: metric?.uri_path || '',
        description: metric?.description || '',
        single_value: metric?.single_value || '',
        comment: metric?.comment || '',
        depreciated: metric?.depreciated || false,
        depreciated_date: metric?.depreciated_date || '',
        include_in_report: metric?.include_in_report ?? true,
        date_created: metric?.date_created || new Date().toISOString().split('T')[0],
        academic_year: metric?.academic_year || currentAcademicYear,
        created_by: user || {}
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
            await onSubmit(metricData);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Box as="form" onSubmit={handleSubmit} p={4} bg="white" borderRadius="lg" borderWidth="1px" borderColor="teal.300">
            <FormControl mb={3}>
                <FormLabel fontSize="sm">Metric Name</FormLabel>
                <Input size="sm" name="name" value={metricData.name} onChange={handleChange} required />
            </FormControl>

            <Flex gap={4} mb={3}>
                <FormControl flex="1">
                    <FormLabel fontSize="sm">Metric Type</FormLabel>
                    <Select size="sm" name="metric_type" value={metricData.metric_type} onChange={handleChange}>
                        {metricTypes.map((type) => (
                            <option key={type} value={type}>{type}</option>
                        ))}
                    </Select>
                </FormControl>

                <FormControl flex="1">
                    <FormLabel fontSize="sm">Single Value</FormLabel>
                    <Input size="sm" name="single_value" value={metricData.single_value} onChange={handleChange} />
                </FormControl>
            </Flex>

            <FormControl mb={3}>
                <FormLabel fontSize="sm">Description</FormLabel>
                <Textarea size="sm" name="description" value={metricData.description} onChange={handleChange} rows={2} />
            </FormControl>

            <FormControl mb={3}>
                <FormLabel fontSize="sm">Comment</FormLabel>
                <Textarea size="sm" name="comment" value={metricData.comment} onChange={handleChange} rows={2} />
            </FormControl>

            <FormControl mb={3}>
                <FormLabel fontSize="sm">Composite Key</FormLabel>
                <Input size="sm" name="composite_key" value={metricData.composite_key} onChange={handleChange} />
            </FormControl>

            <Flex gap={4} mb={3}>
                <FormControl flex="1">
                    <FormLabel fontSize="sm">File Path</FormLabel>
                    <Input size="sm" name="file_path" value={metricData.file_path} onChange={handleChange} />
                </FormControl>

                <FormControl flex="1">
                    <FormLabel fontSize="sm">URI Path</FormLabel>
                    <Input size="sm" name="uri_path" value={metricData.uri_path} onChange={handleChange} />
                </FormControl>
            </Flex>

            <Flex gap={4} mb={4}>
                <Box flex="1">
                    <FormControl mb={2}>
                        <HStack>
                            <Switch size="sm" name="include_in_report"
                                    isChecked={metricData.include_in_report} onChange={handleChange} />
                            <FormLabel fontSize="sm" mb={0}>Include in Report</FormLabel>
                        </HStack>
                    </FormControl>
                    <FormControl mb={2}>
                        <HStack>
                            <Switch size="sm" name="depreciated"
                                    isChecked={metricData.depreciated} onChange={handleChange} />
                            <FormLabel fontSize="sm" mb={0}>Depreciated</FormLabel>
                        </HStack>
                    </FormControl>
                </Box>

                <Box flex="1">
                    {metricData.depreciated && (
                        <FormControl>
                            <FormLabel fontSize="sm">Depreciation Date</FormLabel>
                            <Input size="sm" type="date" name="depreciated_date"
                                   value={metricData.depreciated_date} onChange={handleChange} />
                        </FormControl>
                    )}
                </Box>
            </Flex>

            <HStack spacing={2}>
                <Button size="sm" type="submit" colorScheme="teal"
                        isLoading={isSubmitting} loadingText={isNewMetric ? 'Adding...' : 'Updating...'}>
                    {isNewMetric ? 'Add Metric' : 'Update Metric'}
                </Button>
                <Button size="sm" variant="outline" onClick={onCancel} isDisabled={isSubmitting}>
                    Cancel
                </Button>
            </HStack>
        </Box>
    );
}

const MetricsViewer = ({ metrics = [], implementation_id, implementation_type }) => {
    const [isAddingNew, setIsAddingNew] = useState(false);
    const [editingIndex, setEditingIndex] = useState(null);
    const { refreshImplementations } = useContext(DataContext);
    const { user } = useContext(UserContext);
    const toast = useToast();

    const handleAddMetric = async (metricData) => {
        try {
            await addMetricToImplementation(
                implementation_id,
                implementation_type,
                metricData,
                user?.employee_id || ''
            );

            toast({
                title: "Metric added successfully",
                status: "success",
                duration: 3000,
                isClosable: true,
            });

            await refreshImplementations()
            setIsAddingNew(false);
        } catch (error) {
            toast({
                title: "Error adding metric",
                description: error.message,
                status: "error",
                duration: 3000,
                isClosable: true,
            });
        }
    };

    const handleUpdateMetric = async (metricData, index) => {
        try {
            await updateMetric(
                implementation_id,
                implementation_type,
                metricData,
                user?.employee_id || ''
            );

            toast({
                title: "Metric updated successfully",
                status: "success",
                duration: 3000,
                isClosable: true,
            });

            await refreshImplementations()
            setEditingIndex(null);
        } catch (error) {
            toast({
                title: "Error updating metric",
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
                    Metrics ({metrics.length})
                </Heading>
                {implementation_id && implementation_type && (
                    <Button
                        size="sm"
                        colorScheme="teal"
                        onClick={() => {setIsAddingNew(true); setEditingIndex(null);}}
                        isDisabled={isAddingNew}
                    >
                        Add Metric
                    </Button>
                )}
            </HStack>

            {isAddingNew && (
                <Box mb={4}>
                    <MetricForm
                        metric={null}
                        onSubmit={handleAddMetric}
                        onCancel={() => setIsAddingNew(false)}
                        isNewMetric={true}
                    />
                </Box>
            )}

            {metrics.length > 0 ? (
                <VStack align="stretch" spacing={3}>
                    {metrics.map((metric, index) => (
                        <Box key={metric.unique_id || index}>
                            <Collapse in={editingIndex === index} animateOpacity>
                                <Box mb={3}>
                                    <MetricForm
                                        metric={metric}
                                        onSubmit={(data) => handleUpdateMetric(data, index)}
                                        onCancel={() => setEditingIndex(null)}
                                        isNewMetric={false}
                                    />
                                </Box>
                            </Collapse>

                            <Collapse in={editingIndex !== index} animateOpacity>
                                <Box
                                    p={4}
                                    bg="white"
                                    borderRadius="lg"
                                    borderWidth="1px"
                                    borderColor="gray.200"
                                    boxShadow="sm"
                                    _hover={{ boxShadow: 'md' }}
                                    transition="box-shadow 0.2s"
                                >
                                    <HStack justify="space-between" align="start">
                                        <Box flex="1">
                                            <HStack justify="space-between" mb={2}>
                                                <Text fontSize="sm" fontWeight="bold" color="gray.800">
                                                    {metric.name}
                                                </Text>
                                                {metric.metric_type && (
                                                    <Badge colorScheme="orange" fontSize="xs">
                                                        {metric.metric_type}
                                                    </Badge>
                                                )}
                                            </HStack>

                                            {metric.description && (
                                                <Text fontSize="xs" color="gray.700" mt={2}>
                                                    {metric.description}
                                                </Text>
                                            )}

                                            {metric.single_value && (
                                                <Text fontSize="sm" color="gray.800" fontWeight="semibold" mt={2}>
                                                    Value: {metric.single_value}
                                                </Text>
                                            )}

                                            {metric.comment && (
                                                <Text fontSize="xs" color="gray.600" mt={2} fontStyle="italic">
                                                    {metric.comment}
                                                </Text>
                                            )}

                                            {metric.file_path && (
                                                <Link fontSize="xs" color="teal.600" mt={2} display="block">
                                                    File: {metric.file_path}
                                                </Link>
                                            )}

                                            {metric.uri_path && (
                                                <Link href={metric.uri_path} isExternal fontSize="xs" color="teal.600" mt={2} display="block">
                                                    <HStack spacing={1}>
                                                        <Text>URI: {metric.uri_path}</Text>
                                                        <ExternalLinkIcon />
                                                    </HStack>
                                                </Link>
                                            )}

                                            {metric.composite_key && (
                                                <Text fontSize="xs" color="gray.500" mt={2}>
                                                    Key: {metric.composite_key}
                                                </Text>
                                            )}

                                            <HStack mt={3} spacing={2}>
                                                {metric.include_in_report !== false && (
                                                    <Badge colorScheme="green" fontSize="xs">In Report</Badge>
                                                )}
                                                {metric.depreciated === true && (
                                                    <Badge colorScheme="orange" fontSize="xs">Depreciated</Badge>
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
                    No metrics attached
                </Text>
            )}
        </Box>
    );
};

export default MetricsViewer;