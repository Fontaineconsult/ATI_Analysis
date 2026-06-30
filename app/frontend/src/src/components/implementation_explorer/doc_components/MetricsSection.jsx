import React, { useState, useContext } from 'react';
import { Badge, Box, Collapse, Flex, Text, VStack, WrapItem, useToast } from '@chakra-ui/react';
import { addMetricToImplementation, unlinkDocumentationFromImplementation } from '../../../services/api/post';
import { updateMetric } from '../../../services/api/put';
import { DataContext } from '../../../context/DataContext';
import { useSettings } from '../../../context/SettingsContext';
import { UserContext } from '../../../context/UserContext';
import {
    AddRow, EmptyText, Field, FieldLabel, FileDownload, FormActions, FormShell,
    ItemShell, MetaLine, PathLinks, ReportBadges, SwitchRow,
} from './docPrimitives';
import FileUploadField from './FileUploadField';

const metricTypes = ['tabular', 'graphical', 'descriptive'];

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
        created_by: user || {},
        storage_key: metric?.file?.storage_key || '',
        original_filename: metric?.file?.original_filename || '',
        content_type: metric?.file?.content_type || '',
        size: metric?.file?.size ?? null,
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setMetricData({ ...metricData, [name]: type === 'checkbox' ? checked : value });
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

    const typeOptions = metricTypes.map((t) => <option key={t} value={t}>{t}</option>);

    return (
        <FormShell onSubmit={handleSubmit}>
            <Field label="Metric Name" name="name" value={metricData.name} onChange={handleChange} isRequired />
            <Flex gap={3}>
                <Field as="select" label="Metric Type" name="metric_type" value={metricData.metric_type} onChange={handleChange} options={typeOptions} />
                <Field label="Single Value" name="single_value" value={metricData.single_value} onChange={handleChange} />
            </Flex>
            <Field as="textarea" label="Description" name="description" value={metricData.description} onChange={handleChange} rows={2} />
            <Field as="textarea" label="Comment" name="comment" value={metricData.comment} onChange={handleChange} rows={2} />
            <Field label="Composite Key" name="composite_key" value={metricData.composite_key} onChange={handleChange} />
            <Flex gap={3}>
                <Field label="File Path" name="file_path" value={metricData.file_path} onChange={handleChange} />
                <Field label="URI Path" name="uri_path" value={metricData.uri_path} onChange={handleChange} />
            </Flex>
            <FileUploadField
                value={metricData}
                onUploaded={(f) => setMetricData({ ...metricData, ...f })}
                onClear={() => setMetricData({ ...metricData, storage_key: '', original_filename: '', content_type: '', size: null })}
            />
            <Box>
                <FieldLabel mb={2}>Flags</FieldLabel>
                <VStack align="stretch" spacing={1.5}>
                    <SwitchRow name="include_in_report" label="Include in report" isChecked={metricData.include_in_report} onChange={handleChange} />
                    <SwitchRow name="depreciated" label="Depreciated" isChecked={metricData.depreciated} onChange={handleChange} colorScheme="orange" />
                </VStack>
                {metricData.depreciated && (
                    <Box mt={2}>
                        <Field label="Depreciation Date" name="depreciated_date" type="date" value={metricData.depreciated_date} onChange={handleChange} />
                    </Box>
                )}
            </Box>
            <FormActions isSubmitting={isSubmitting} onCancel={onCancel} submitLabel={isNewMetric ? 'Add Metric' : 'Update Metric'} loadingText={isNewMetric ? 'Adding…' : 'Updating…'} />
        </FormShell>
    );
}

export default function MetricsViewer({ metrics = [], implementation_id, implementation_type }) {
    const [isAddingNew, setIsAddingNew] = useState(false);
    const [editingIndex, setEditingIndex] = useState(null);
    const { refreshImplementations } = useContext(DataContext);
    const { user } = useContext(UserContext);
    const toast = useToast();
    const canManage = Boolean(implementation_id && implementation_type);

    const handleAddMetric = async (metricData) => {
        try {
            await addMetricToImplementation(implementation_id, implementation_type, metricData, user?.employee_id || '');
            toast({ title: 'Metric added', status: 'success', duration: 3000, isClosable: true });
            await refreshImplementations();
            setIsAddingNew(false);
        } catch (error) {
            toast({ title: 'Error adding metric', description: error.message, status: 'error', duration: 3000, isClosable: true });
        }
    };

    const handleUpdateMetric = async (metricData, index) => {
        try {
            await updateMetric(implementation_id, implementation_type, metricData, user?.employee_id || '');
            toast({ title: 'Metric updated', status: 'success', duration: 3000, isClosable: true });
            await refreshImplementations();
            setEditingIndex(null);
        } catch (error) {
            toast({ title: 'Error updating metric', description: error.message, status: 'error', duration: 3000, isClosable: true });
        }
    };

    const handleUnlink = async (metric) => {
        if (!window.confirm(`Unlink "${metric.name || 'this metric'}" from this implementation? It won't be deleted.`)) return;
        try {
            await unlinkDocumentationFromImplementation(implementation_id, implementation_type, 'metric', metric.unique_id);
            toast({ title: 'Metric unlinked', status: 'success', duration: 3000, isClosable: true });
            await refreshImplementations();
        } catch (error) {
            toast({ title: 'Error unlinking metric', description: error.message, status: 'error', duration: 3000, isClosable: true });
        }
    };

    return (
        <Box>
            <AddRow onAdd={() => { setIsAddingNew(true); setEditingIndex(null); }} label="Add Metric" canAdd={canManage} isAdding={isAddingNew} />

            {isAddingNew && (
                <Box mb={3}>
                    <MetricForm metric={null} onSubmit={handleAddMetric} onCancel={() => setIsAddingNew(false)} isNewMetric />
                </Box>
            )}

            {metrics.length > 0 ? (
                <VStack align="stretch" spacing={2}>
                    {metrics.map((metric, index) => (
                        <Box key={metric.unique_id || index}>
                            <Collapse in={editingIndex === index} animateOpacity>
                                <Box mb={2}>
                                    <MetricForm metric={metric} onSubmit={(data) => handleUpdateMetric(data, index)} onCancel={() => setEditingIndex(null)} isNewMetric={false} />
                                </Box>
                            </Collapse>
                            <Collapse in={editingIndex !== index} animateOpacity>
                                <ItemShell
                                    titleNode={<Text fontSize="sm" fontWeight="semibold" color="gray.800" noOfLines={1}>{metric.name}</Text>}
                                    badge={metric.metric_type && <Badge colorScheme="orange" fontSize="2xs">{metric.metric_type}</Badge>}
                                    onEdit={() => { setEditingIndex(index); setIsAddingNew(false); }}
                                    canEdit={canManage}
                                    onUnlink={() => handleUnlink(metric)}
                                    canUnlink={canManage}
                                >
                                    {metric.single_value && (
                                        <Text fontSize="xs" color="gray.800" fontWeight="semibold">Value: {metric.single_value}</Text>
                                    )}
                                    {metric.description && <Text fontSize="xs" color="gray.600" noOfLines={2}>{metric.description}</Text>}
                                    {metric.comment && <Text fontSize="2xs" color="gray.500" fontStyle="italic" mt={1}>{metric.comment}</Text>}
                                    <PathLinks filePath={metric.file_path} uriPath={metric.uri_path} />
                                    <FileDownload file={metric.file} />
                                    {metric.composite_key && (
                                        <MetaLine><Text as="span" fontFamily="mono">{metric.composite_key}</Text></MetaLine>
                                    )}
                                    <ReportBadges
                                        depreciated={metric.depreciated === true}
                                        extra={metric.include_in_report !== false && <WrapItem><Badge colorScheme="green" fontSize="2xs">In Report</Badge></WrapItem>}
                                    />
                                </ItemShell>
                            </Collapse>
                        </Box>
                    ))}
                </VStack>
            ) : (
                <EmptyText>No metrics attached.</EmptyText>
            )}
        </Box>
    );
}
