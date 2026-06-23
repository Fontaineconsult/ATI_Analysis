import React, { useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { Alert, AlertIcon, Box, Text } from '@chakra-ui/react';
import { useData } from '../../hooks/useData';
import { useSettings } from '../../context/SettingsContext';
import { selectionHasYse } from '../dashboard_components/report_components/reportMetrics';

/*
 * Global "no Year Success Evidence" banner. The header's campus + year selectors are app-wide
 * and DataContext reloads the campus-scoped working-group trees on every change, so "does this
 * campus+year have any YSE?" is a single app-wide signal — surface it once here rather than in
 * each view. Mounted once in App's content area (above the routed views), it appears on every
 * YSE-displaying page when the selection is empty, and renders nothing otherwise.
 *
 * Suppressed on routes that aren't year-scoped YSE data (config / catalog / help), where a
 * year-based "no evidence" notice would be noise. Adjust SUPPRESSED_SEGMENTS to taste.
 */
const SUPPRESSED_SEGMENTS = [
    '/settings',
    '/governance',
    '/principles',
    '/assets',
    '/people',
    '/glossary',
    '/adding-data',
];

function YseAvailabilityBanner() {
    const { data, loading, selectedYear } = useData();
    const { currentCampus, getCampusName } = useSettings();
    const location = useLocation();

    const hasYse = useMemo(() => selectionHasYse(data), [data]);

    // Don't flash during the (campus/year) reload, before a campus is resolved, or when
    // evidence exists; and stay quiet on non-YSE routes.
    if (loading || !currentCampus || hasYse) return null;
    if (SUPPRESSED_SEGMENTS.some((seg) => location.pathname.includes(seg))) return null;

    const campusName = getCampusName(currentCampus) || currentCampus;

    return (
        <Alert status="warning" borderRadius="lg" alignItems="flex-start" py={4} mb={6}>
            <AlertIcon mt={1} />
            <Box>
                <Text fontWeight="semibold" mb={1}>No Year Success Evidence for this selection</Text>
                <Text fontSize="sm" color="gray.700">
                    No Year Success Evidence exists for <strong>{selectedYear}</strong> at{' '}
                    <strong>{campusName}</strong>. There's nothing to show for this academic year —
                    choose another year from the header, or add evidence for this one.
                </Text>
            </Box>
        </Alert>
    );
}

export default YseAvailabilityBanner;
