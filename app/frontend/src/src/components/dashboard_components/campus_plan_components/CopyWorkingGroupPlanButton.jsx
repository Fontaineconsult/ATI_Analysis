import React, { useState } from 'react';
import { Button, useToast } from '@chakra-ui/react';
import { CopyIcon } from '@chakra-ui/icons';
import { buildWorkingGroupPlanReport } from '../../../services/utils/workingGroupPlanReport';
import { copyRichContent } from '../../../services/utils/copyToClipboard';

/**
 * Copies an Outlook-safe HTML summary of one working-group card onto the
 * clipboard (group name, leads and members, prioritized indicators, communities
 * of practice), ready to paste into an email. Plain-text fallback included.
 * Mirrors CopyCommunityStakesButton; shared clipboard mechanics in
 * services/utils/copyToClipboard.
 *
 * Props:
 *   report    the input to buildWorkingGroupPlanReport (already campus-filtered)
 *   ...props  pass through to the Chakra Button
 */
export default function CopyWorkingGroupPlanButton({ report, ...props }) {
    const toast = useToast();
    const [busy, setBusy] = useState(false);
    const subject = report?.workingGroup || 'Working group';

    const handleCopy = async () => {
        setBusy(true);
        try {
            const { html, plainText, rowCount } = buildWorkingGroupPlanReport(report);
            if (!rowCount) {
                toast({
                    title: 'Nothing to copy',
                    description: `${subject} has no people, indicators or communities yet.`,
                    status: 'info', duration: 2500, isClosable: true,
                });
                return;
            }
            const fmt = await copyRichContent({ html, plainText });
            const plain = fmt.startsWith('text');
            toast({
                title: `${subject} copied`,
                description: `Leads, members, indicators and communities as tables. Paste into an email${plain ? ' (plain text only)' : ''}.`,
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
            size="xs"
            colorScheme="teal"
            variant="outline"
            bg="white"
            leftIcon={<CopyIcon boxSize={2.5} />}
            isLoading={busy}
            loadingText="Copying…"
            onClick={handleCopy}
            title={`Copy ${subject} as an email-ready table`}
            aria-label={`Copy ${subject} as an email-ready table`}
            {...props}
        >
            Copy table
        </Button>
    );
}
