import React, { useContext, useState } from 'react';
import { Button, useToast } from '@chakra-ui/react';
import { CopyIcon } from '@chakra-ui/icons';
import { DataContext } from '../../../context/DataContext';
import { useSettings } from '../../../context/SettingsContext';
import { buildWorkingGroupStatusReport } from '../../../services/utils/workingGroupStatusReport';
import { copyRichContent } from '../../../services/utils/copyToClipboard';

/**
 * Copies a compact, Outlook-safe HTML status report for a SINGLE working group of the
 * active campus + year — its success indicators with their implementations and notes,
 * each deep-linked into the ATI database — onto the clipboard, ready to paste into an
 * email asking a third party to confirm/update the info. Plain-text fallback included.
 *
 * Props:
 *   workingGroup  'web' | 'instructionalMaterials' | 'procurement' (omit for all three)
 *   label         button text + toast subject (e.g. 'Web')
 *   ...props      pass through to the Chakra Button.
 */
export default function CopyStatusReportButton({ workingGroup, label, ...props }) {
    const { data } = useContext(DataContext);
    const { currentAcademicYear, currentCampus } = useSettings();
    const toast = useToast();
    const [busy, setBusy] = useState(false);
    const subject = label || 'Status report';

    const handleCopy = async () => {
        setBusy(true);
        try {
            const { html, plainText, rowCount } = buildWorkingGroupStatusReport(data, {
                campus: currentCampus,
                year: currentAcademicYear,
                origin: window.location.origin,
                workingGroup,
            });
            if (!rowCount) {
                toast({
                    title: 'Nothing to copy',
                    description: `No evidence for ${subject} in this campus and year.`,
                    status: 'info', duration: 2500, isClosable: true,
                });
                return;
            }
            const fmt = await copyRichContent({ html, plainText });
            const plain = fmt.startsWith('text');
            toast({
                title: `${subject} report copied`,
                description: `${rowCount} indicator${rowCount === 1 ? '' : 's'} — paste into an email${plain ? ' (plain text only)' : ''}.`,
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
            colorScheme="teal"
            variant="outline"
            leftIcon={<CopyIcon />}
            isLoading={busy}
            loadingText="Copying…"
            onClick={handleCopy}
            title={`Copy the ${subject} status report (implementations + notes per indicator, with database links) for email`}
            {...props}
        >
            {label || 'Copy status report'}
        </Button>
    );
}
