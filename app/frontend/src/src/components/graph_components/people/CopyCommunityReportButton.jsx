import React, { useState } from 'react';
import { Button, useToast } from '@chakra-ui/react';
import { CopyIcon } from '@chakra-ui/icons';
import { buildCommunityReport } from '../../../services/utils/communityReport';
import { copyRichContent } from '../../../services/utils/copyToClipboard';

/**
 * Copies an Outlook-safe HTML table of ONE community of practice — its member
 * roster and indicator stakes — onto the clipboard, ready to paste into an
 * email. Plain-text fallback included. Mirrors CopyStatusReportButton; the
 * shared clipboard mechanics live in services/utils/copyToClipboard.
 *
 * Props:
 *   detail    the loaded community detail ({name, description, members, stakes}).
 *   ...props  pass through to the Chakra Button.
 */
export default function CopyCommunityReportButton({ detail, ...props }) {
    const toast = useToast();
    const [busy, setBusy] = useState(false);
    const subject = detail?.name || 'Community';

    const handleCopy = async () => {
        setBusy(true);
        try {
            const { html, plainText, rowCount } = buildCommunityReport(detail);
            if (!rowCount) {
                toast({
                    title: 'Nothing to copy',
                    description: `${subject} has no members or indicator stakes yet.`,
                    status: 'info', duration: 2500, isClosable: true,
                });
                return;
            }
            const fmt = await copyRichContent({ html, plainText });
            const plain = fmt.startsWith('text');
            toast({
                title: `${subject} copied`,
                description: `Members + indicator stakes — paste into an email${plain ? ' (plain text only)' : ''}.`,
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
            leftIcon={<CopyIcon boxSize={2.5} />}
            isLoading={busy}
            loadingText="Copying…"
            onClick={handleCopy}
            title={`Copy ${subject} (members + indicator stakes) as an email-ready table`}
            {...props}
        >
            Copy
        </Button>
    );
}
