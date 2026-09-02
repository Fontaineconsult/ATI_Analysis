import React, { useState } from 'react';
import { Button, useToast } from '@chakra-ui/react';
import { CopyIcon } from '@chakra-ui/icons';
import { buildFollowUpReport } from '../../../services/utils/followUpReport';
import { copyRichContent } from '../../../services/utils/copyToClipboard';

/**
 * Copies one follow-up's stored markdown onto the clipboard as Outlook-safe
 * HTML, with a plain-text fallback, ready to paste into an email. Mirrors
 * CopyCommunityReportButton; the clipboard mechanics live in
 * services/utils/copyToClipboard.
 *
 * Renders from the SAVED markdown, so a follow-up edited before sending copies
 * as the edited version rather than regenerating from the graph.
 *
 * Props:
 *   markdown  the follow-up body.
 *   subject   used in the toast so it is clear which one was copied.
 *   ...props  pass through to the Chakra Button.
 */
export default function CopyFollowUpButton({ markdown, subject = 'Follow-up', ...props }) {
    const toast = useToast();
    const [busy, setBusy] = useState(false);

    const handleCopy = async () => {
        setBusy(true);
        try {
            const { html, plainText, blockCount } = buildFollowUpReport(markdown);
            if (!blockCount) {
                toast({
                    title: 'Nothing to copy',
                    description: 'This follow-up has no content yet.',
                    status: 'info', duration: 2500, isClosable: true,
                });
                return;
            }
            const fmt = await copyRichContent({ html, plainText });
            const plain = fmt.startsWith('text');
            toast({
                title: 'Follow-up copied',
                description: `Paste into an email${plain ? ' (plain text only)' : ''}.`,
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
            title={`Copy "${subject}" as an email-ready message`}
            {...props}
        >
            Copy
        </Button>
    );
}
