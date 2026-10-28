import React, { useContext, useState } from 'react';
import { Button, useToast } from '@chakra-ui/react';
import { CopyIcon } from '@chakra-ui/icons';
import { DataContext } from '../../../context/DataContext';
import { useSettings } from '../../../context/SettingsContext';
import { buildReadyForReviewReport } from '../../../services/utils/readyForReviewReport';
import { copyRichContent } from '../../../services/utils/copyToClipboard';

/**
 * Copies an email-ready table of one working group's indicators that are marked ready
 * for review and not yet approved: indicator, status, and review link.
 *
 * Reads the working group from DataContext rather than taking the report's filtered
 * tree, so an active report filter never drops a ready indicator from the email.
 *
 * Props:
 *   dataKey  DataContext key for the working group (e.g. 'instructionalMaterials')
 *   slug     the working group's URL segment (e.g. 'instructional-materials')
 *   name     working group display name (button label and toast subject)
 */
export default function CopyReadyForReviewButton({ dataKey, slug, name, ...props }) {
    const { data } = useContext(DataContext);
    const { currentAcademicYear, currentCampus } = useSettings();
    const toast = useToast();
    const [busy, setBusy] = useState(false);

    const handleCopy = async () => {
        setBusy(true);
        try {
            const { html, plainText, rowCount } = buildReadyForReviewReport(data?.[dataKey], {
                campus: currentCampus,
                slug,
                name,
                year: currentAcademicYear,
                origin: window.location.origin,
            });
            if (!rowCount) {
                toast({
                    title: 'Nothing to copy',
                    description: `No ${name} indicators are waiting for review.`,
                    status: 'info', duration: 2500, isClosable: true,
                });
                return;
            }
            const fmt = await copyRichContent({ html, plainText });
            toast({
                title: `${name} review list copied`,
                description: `${rowCount} indicator${rowCount === 1 ? '' : 's'} ready for review. Paste into an email${fmt.startsWith('text') ? ' (plain text only)' : ''}.`,
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
            leftIcon={<CopyIcon />}
            isLoading={busy}
            loadingText="Copying…"
            onClick={handleCopy}
            aria-label={`Copy ${name} indicators ready for review, for email`}
            {...props}
        >
            Copy ready for review
        </Button>
    );
}
