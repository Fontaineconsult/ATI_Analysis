import React, { useContext, useState } from 'react';
import { Button, useToast } from '@chakra-ui/react';
import { CopyIcon } from '@chakra-ui/icons';
import { DataContext } from '../../../context/DataContext';
import { useSettings } from '../../../context/SettingsContext';
import { buildWorkingGroupStatusReport } from '../../../services/utils/workingGroupStatusReport';
import { copyRichContent } from '../../../services/utils/copyToClipboard';

/**
 * Copies a compact, Outlook-safe HTML status report for the active campus + year —
 * every working group's success indicators with their implementations and notes,
 * each deep-linked into the ATI database — onto the clipboard, ready to paste into
 * an email asking a third party to confirm/update the info. Plain-text fallback
 * included for clients that strip HTML. Reads DataContext + SettingsContext, so it
 * drops in anywhere on a loaded reports/dashboard view. Extra props pass through to
 * the Button (size, variant, etc.).
 */
export default function CopyStatusReportButton(props) {
    const { data } = useContext(DataContext);
    const { currentAcademicYear, currentCampus } = useSettings();
    const toast = useToast();
    const [busy, setBusy] = useState(false);

    const handleCopy = async () => {
        setBusy(true);
        try {
            const { html, plainText, rowCount, sectionCount } = buildWorkingGroupStatusReport(data, {
                campus: currentCampus,
                year: currentAcademicYear,
                origin: window.location.origin,
            });
            if (!rowCount) {
                toast({
                    title: 'Nothing to copy',
                    description: 'No working-group evidence is loaded for this campus and year.',
                    status: 'info', duration: 2500, isClosable: true,
                });
                return;
            }
            const fmt = await copyRichContent({ html, plainText });
            const plain = fmt.startsWith('text');
            toast({
                title: 'Status report copied',
                description: `${rowCount} indicator${rowCount === 1 ? '' : 's'} across ${sectionCount} group${sectionCount === 1 ? '' : 's'} — paste into an email${plain ? ' (plain text only)' : ''}.`,
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
            title="Copy a compact status report (implementations + notes per indicator, with database links) to paste into an email"
            {...props}
        >
            Copy status report for email
        </Button>
    );
}
