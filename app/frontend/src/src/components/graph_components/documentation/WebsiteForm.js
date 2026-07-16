import React, { useMemo, useState } from 'react';
import {
    Box,
    Button,
    FormControl,
    FormErrorMessage,
    FormHelperText,
    FormLabel,
    Grid,
    HStack,
    Input,
    Switch,
    Textarea,
    VStack,
} from '@chakra-ui/react';

// Live URL validation. Returns one of:
//   { ok: true,  normalized }   — URL is parseable (scheme-less inputs get
//                                 https:// prepended so URL() can validate).
//   { ok: false, reason }       — describes the problem for the user.
// An empty string is treated as "no opinion yet" — the required check fires
// only on submit, so the field doesn't shout at users mid-type.
function validateUrl(raw) {
    if (raw === null || raw === undefined) return { ok: false, reason: 'URL is required.' };
    const trimmed = String(raw).trim();
    if (!trimmed) return { ok: false, reason: 'URL is required.' };
    if (/\s/.test(trimmed)) return { ok: false, reason: 'URLs cannot contain spaces.' };
    const candidate = /^(https?|ftp):\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
    try {
        const parsed = new URL(candidate);
        // URL() will happily accept "https://." — require something
        // resembling a domain to keep junk values out.
        if (!parsed.hostname || !parsed.hostname.includes('.')) {
            return { ok: false, reason: 'Enter a full URL (e.g. https://example.com/page).' };
        }
        return { ok: true, normalized: candidate };
    } catch {
        return { ok: false, reason: 'Enter a full URL (e.g. https://example.com/page).' };
    }
}

/**
 * Webpage field editor. Originally lived inside WebsiteViewer.js — extracted
 * here so it can be reused for governance "Create new webpage" flows and any
 * other surface that needs the same field set.
 *
 * Props mirror DocumentForm: `website`, `onSubmit(data)`, `createdBy`,
 * `isNewWebsite`, optional `onCancel`.
 */
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
        date_created: website?.properties?.date_created || new Date().toISOString().split('T')[0],
        created_by: createdBy || {},
    });

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [urlTouched, setUrlTouched] = useState(false);

    const urlValidation = useMemo(() => validateUrl(websiteData.url), [websiteData.url]);
    // Only complain about the URL once the user has interacted with it — keeps
    // the form quiet on first render but lights up while they type / on blur.
    const urlIsInvalid = urlTouched && !urlValidation.ok;

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setWebsiteData({
            ...websiteData,
            [name]: type === 'checkbox' ? checked : value,
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!urlValidation.ok) {
            setUrlTouched(true);
            return;
        }
        setIsSubmitting(true);
        try {
            // Submit the normalized URL (https:// prepended if it was missing)
            // so downstream storage is consistent.
            await onSubmit({ ...websiteData, url: urlValidation.normalized });
        } catch (error) {
            console.error('Error submitting website:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Box as="form" onSubmit={handleSubmit}>
            <VStack spacing={3}>
                <FormControl isRequired isInvalid={urlIsInvalid}>
                    <FormLabel fontSize="xs">Website URL</FormLabel>
                    <Input
                        size="sm"
                        type="url"
                        name="url"
                        value={websiteData.url}
                        onChange={handleChange}
                        onBlur={() => setUrlTouched(true)}
                        placeholder="https://example.com/page"
                        required
                    />
                    {urlIsInvalid ? (
                        <FormErrorMessage fontSize="xs">{urlValidation.reason}</FormErrorMessage>
                    ) : (
                        <FormHelperText fontSize="xs" color="gray.600">
                            Full URL. Missing https:// will be added on save.
                        </FormHelperText>
                    )}
                </FormControl>

                <Grid templateColumns="repeat(2, 1fr)" gap={3} width="full">
                    <FormControl>
                        <FormLabel fontSize="xs">Website Name</FormLabel>
                        <Input
                            size="sm"
                            name="name"
                            value={websiteData.name}
                            onChange={handleChange}
                            required
                        />
                    </FormControl>

                    <FormControl>
                        <FormLabel fontSize="xs">Depreciation Date</FormLabel>
                        <Input
                            size="sm"
                            type="date"
                            name="depreciated_date"
                            value={websiteData.depreciated_date}
                            onChange={handleChange}
                        />
                    </FormControl>
                </Grid>

                <FormControl>
                    <FormLabel fontSize="xs">Description</FormLabel>
                    <Textarea
                        size="sm"
                        name="description"
                        value={websiteData.description}
                        onChange={handleChange}
                        rows={2}
                    />
                </FormControl>

                <Grid templateColumns="repeat(2, 1fr)" gap={3} width="full">
                    <FormControl display="flex" alignItems="center">
                        <FormLabel fontSize="xs" mb="0" flex="1">404/Dead Link</FormLabel>
                        <Switch
                            size="sm"
                            name="no_longer_exists"
                            isChecked={websiteData.no_longer_exists}
                            onChange={handleChange}
                        />
                    </FormControl>

                    <FormControl display="flex" alignItems="center">
                        <FormLabel fontSize="xs" mb="0" flex="1">Include in Report</FormLabel>
                        <Switch
                            size="sm"
                            name="include_in_report"
                            isChecked={websiteData.include_in_report}
                            onChange={handleChange}
                        />
                    </FormControl>

                    <FormControl display="flex" alignItems="center">
                        <FormLabel fontSize="xs" mb="0" flex="1">Deprecated</FormLabel>
                        <Switch
                            size="sm"
                            name="depreciated"
                            isChecked={websiteData.depreciated}
                            onChange={handleChange}
                        />
                    </FormControl>
                </Grid>
            </VStack>

            <HStack mt={4} spacing={2}>
                <Button
                    type="submit"
                    size="xs"
                    colorScheme="teal"
                    isLoading={isSubmitting}
                    loadingText={isNewWebsite ? 'Submitting...' : 'Updating...'}
                    isDisabled={!urlValidation.ok}
                >
                    {isNewWebsite ? 'Submit' : 'Update'}
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

export default WebsiteForm;
