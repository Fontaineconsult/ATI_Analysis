import React, { useState } from 'react';
import {
    Box,
    Button,
    FormControl,
    FormLabel,
    Grid,
    GridItem,
    HStack,
    Input,
    Switch,
} from '@chakra-ui/react';
import FileUploadField from '../../implementation_explorer/doc_components/FileUploadField';

/**
 * Document field editor. Originally lived inside DocumentViewer.js — extracted
 * here so it can be reused for governance "Create new document" flows and any
 * other surface that needs the same field set.
 *
 * Props:
 *   document         Existing document (null/undefined for create mode).
 *   onSubmit(data)   Async; receives the form payload. Caller decides whether
 *                    this is a create or update by inspecting `document` /
 *                    `isNewDocument`.
 *   createdBy        Optional Person reference attached to the payload.
 *   isNewDocument    Controls submit button label.
 *   onCancel         Optional; renders a Cancel button.
 */
function DocumentForm({ document, onSubmit, createdBy, isNewDocument, onCancel }) {
    const [documentData, setDocumentData] = useState({
        unique_id: document?.properties?.unique_id || '',
        name: document?.properties?.name || '',
        file_path: document?.properties?.file_path || '',
        uri_path: document?.properties?.uri_path || '',
        storage_key: document?.properties?.file?.storage_key || '',
        original_filename: document?.properties?.file?.original_filename || '',
        content_type: document?.properties?.file?.content_type || '',
        size: document?.properties?.file?.size ?? null,
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
            <Grid templateColumns="repeat(2, 1fr)" gap={3}>
                <GridItem colSpan={2}>
                    <FormControl size="sm">
                        <FormLabel fontSize="xs">Document Name</FormLabel>
                        <Input size="sm" name="name" value={documentData.name} onChange={handleChange} required />
                    </FormControl>
                </GridItem>

                <GridItem colSpan={2}>
                    <FileUploadField
                        value={documentData}
                        onUploaded={(f) => setDocumentData({ ...documentData, ...f })}
                        onClear={() => setDocumentData({
                            ...documentData,
                            storage_key: '', original_filename: '', content_type: '', size: null,
                        })}
                    />
                </GridItem>

                <GridItem>
                    <FormControl>
                        <FormLabel fontSize="xs">Date Created</FormLabel>
                        <Input size="sm" name="date_created" type="date" value={documentData.date_created} onChange={handleChange} />
                    </FormControl>
                </GridItem>

                <GridItem>
                    <FormControl>
                        <FormLabel fontSize="xs">Depreciation Date</FormLabel>
                        <Input size="sm" type="date" name="depreciated_date" value={documentData.depreciated_date} onChange={handleChange} />
                    </FormControl>
                </GridItem>

                <GridItem colSpan={2}>
                    <FormControl>
                        <FormLabel fontSize="xs">File Path</FormLabel>
                        <Input size="sm" name="file_path" value={documentData.file_path} onChange={handleChange} />
                    </FormControl>
                </GridItem>

                <GridItem colSpan={2}>
                    <FormControl>
                        <FormLabel fontSize="xs">URI Path</FormLabel>
                        <Input size="sm" name="uri_path" value={documentData.uri_path} onChange={handleChange} />
                    </FormControl>
                </GridItem>
            </Grid>

            <Grid templateColumns="repeat(2, 1fr)" gap={3} mt={4}>
                <FormControl display="flex" alignItems="center">
                    <FormLabel fontSize="xs" mb="0" flex="1">Admin Review</FormLabel>
                    <Switch size="sm" name="is_administrative_review_documentation" isChecked={documentData.is_administrative_review_documentation} onChange={handleChange} />
                </FormControl>

                <FormControl display="flex" alignItems="center">
                    <FormLabel fontSize="xs" mb="0" flex="1">Milestone Docs</FormLabel>
                    <Switch size="sm" name="is_milestone_and_measures_documentation" isChecked={documentData.is_milestone_and_measures_documentation} onChange={handleChange} />
                </FormControl>

                <FormControl display="flex" alignItems="center">
                    <FormLabel fontSize="xs" mb="0" flex="1">Include in Report</FormLabel>
                    <Switch size="sm" name="include_in_report" isChecked={documentData.include_in_report} onChange={handleChange} />
                </FormControl>

                <FormControl display="flex" alignItems="center">
                    <FormLabel fontSize="xs" mb="0" flex="1">Deprecated</FormLabel>
                    <Switch size="sm" name="depreciated" isChecked={documentData.depreciated} onChange={handleChange} />
                </FormControl>
            </Grid>

            <HStack mt={4} spacing={2}>
                <Button
                    type="submit"
                    size="xs"
                    colorScheme="teal"
                    isLoading={isSubmitting}
                    loadingText={isNewDocument ? 'Submitting...' : 'Updating...'}
                >
                    {isNewDocument ? 'Submit' : 'Update'}
                </Button>
                {onCancel && (
                    <Button
                        size="xs"
                        variant="outline"
                        onClick={onCancel}
                        isDisabled={isSubmitting}
                    >
                        Cancel
                    </Button>
                )}
            </HStack>
        </Box>
    );
}

export default DocumentForm;
