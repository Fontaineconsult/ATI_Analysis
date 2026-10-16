import React, { useContext, useState } from 'react';
import { Button, useToast } from '@chakra-ui/react';
import { CopyIcon } from '@chakra-ui/icons';
import { DataContext } from '../../../context/DataContext';
import { useSettings } from '../../../context/SettingsContext';
import { buildWorkingGroupStatusTable } from '../../../services/utils/workingGroupStatusTable';
import { copyRichContent } from '../../../services/utils/copyToClipboard';

/**
 * Copies a three-column table (SI, Name, Status) for ONE working group of the
 * active campus + year onto the clipboard, as Outlook-safe HTML with a tab-separated
 * plain-text fallback. The slim sibling of CopyStatusReportButton: no links,
 * implementations, people, or notes.
 *
 * Props:
 *   workingGroup  a WORKING_GROUP_LIST dataKey ('web' | 'instructionalMaterials' | ...)
 *   label         working-group display name for the toast (e.g. 'Web')
 *   data          optional override of the DataContext tree (the report tables pass
 *                 the filtered tree so the copy matches what is on screen)
 *   ...props      pass through to the Chakra Button.
 */
export default function CopyWorkingGroupTableButton({ workingGroup, label, data: dataProp, ...props }) {
    const { data: contextData } = useContext(DataContext);
    const { currentAcademicYear, currentCampus } = useSettings();
    const toast = useToast();
    const [busy, setBusy] = useState(false);
    const data = dataProp || contextData;
    const subject = label || 'Working group';

    const handleCopy = async () => {
        setBusy(true);
        try {
            const { html, plainText, rowCount } = buildWorkingGroupStatusTable(data, {
                workingGroup,
                campus: currentCampus,
                year: currentAcademicYear,
            });
            if (!rowCount) {
                toast({
                    title: 'Nothing to copy',
                    description: `No success indicators for ${subject} in this campus and year.`,
                    status: 'info', duration: 2500, isClosable: true,
                });
                return;
            }
            const fmt = await copyRichContent({ html, plainText });
            const plain = fmt.startsWith('text');
            toast({
                title: `${subject} table copied`,
                description: `${rowCount} indicator${rowCount === 1 ? '' : 's'} with name and status${plain ? ' (plain text only)' : ''}.`,
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
            aria-label={`Copy ${subject} table`}
            title={`Copy a table of ${subject} success indicators (SI, name, status) to the clipboard`}
            {...props}
        >
            Copy table
        </Button>
    );
}
