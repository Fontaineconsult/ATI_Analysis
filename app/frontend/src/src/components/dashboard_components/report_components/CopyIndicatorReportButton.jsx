import React, { useState } from 'react';
import { Button, useToast } from '@chakra-ui/react';
import { CopyIcon } from '@chakra-ui/icons';

import { buildIndicatorReport } from '../../../services/utils/indicatorReportExport';
import { copyRichContent } from '../../../services/utils/copyToClipboard';

/**
 * Copies a clean, Outlook-safe table export of ONE single-indicator evidence report onto the
 * clipboard — the same information IndicatorReportView shows (status, people, implementations
 * and their evidence, ICT footprint, TAAPs, plans, notes), ready to paste into an email, a Word
 * doc, or a spreadsheet. Plain-text fallback included. Mirrors CopyStatusReportButton.
 *
 * Props:
 *   report   the get_indicator_report payload IndicatorReportView receives.
 *   ...props pass through to the Chakra Button.
 */
export default function CopyIndicatorReportButton({ report, ...props }) {
    const toast = useToast();
    const [busy, setBusy] = useState(false);

    const handleCopy = async () => {
        if (!report?.indicator) return;
        setBusy(true);
        try {
            const { html, plainText } = buildIndicatorReport(report, { origin: window.location.origin });
            const fmt = await copyRichContent({ html, plainText });
            const plain = fmt.startsWith('text');
            toast({
                title: 'Report copied',
                description: `${report.indicator.composite_key} — paste into an email or document${plain ? ' (plain text only)' : ''}.`,
                status: 'success', duration: 3500, isClosable: true,
            });
        } catch (e) {
            toast({
                title: 'Copy failed',
                description: 'Could not access the clipboard. Try again, or use a Chromium browser over HTTPS.',
                status: 'error', duration: 4000, isClosable: true,
            });
        } finally {
            setBusy(false);
        }
    };

    return (
        <Button
            size="sm"
            variant="outline"
            colorScheme="teal"
            leftIcon={<CopyIcon />}
            isLoading={busy}
            loadingText="Copying…"
            onClick={handleCopy}
            title="Copy this indicator's full report as a table for email / documents"
            {...props}
        >
            Copy report
        </Button>
    );
}
