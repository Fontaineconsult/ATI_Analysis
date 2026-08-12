import React from 'react';
import { Button } from '@chakra-ui/react';
import { useNavigate, useParams } from 'react-router-dom';
import { getReportUrlFromCompositeKey } from '../../services/utils/tools';

/**
 * The dashboard's "View" action, modularized. Navigates to the read-only Report view for a
 * success indicator's composite key — the exact target the Reports table already uses — so
 * the Web / Instructional-Materials / Procurement detail panels can reuse it verbatim
 * (sitting next to "Review") instead of re-implementing the URL math.
 *
 * Props:
 *   compositeKey  e.g. "1.2-web" — required; renders nothing if absent.
 *   campus        Optional; defaults to the :campus route param.
 *   children      Optional label override (defaults to "View").
 *   ...rest       Spread onto the Chakra Button (size, variant, colorScheme, etc.).
 */
function ViewReportButton({ compositeKey, campus, children, ...rest }) {
    const navigate = useNavigate();
    const params = useParams();
    const resolvedCampus = campus || params.campus;

    if (!compositeKey) return null;

    // Unique accessible name per indicator (many of these repeat on one page).
    // Starts with the visible label so voice-control users can still match it
    // (WCAG 2.5.3 Label in Name); rest can override via its own aria-label.
    const visibleLabel = typeof children === 'string' ? children : 'View';

    return (
        <Button
            size="xs"
            colorScheme="teal"
            variant="solid"
            _hover={{ bg: 'teal.600' }}
            aria-label={`${visibleLabel} ${compositeKey}`}
            onClick={() => navigate(getReportUrlFromCompositeKey(compositeKey, resolvedCampus))}
            {...rest}
        >
            {children || 'View'}
        </Button>
    );
}

export default ViewReportButton;
