import React from 'react';
import { Badge } from '@chakra-ui/react';
import { deriveGroundingKind, GROUNDING_KIND_META } from './principleTypes';

/**
 * Pill showing a principle's DERIVED grounding kind (law-grounded / theory-grounded / mixed /
 * ungrounded) — computed from `grounded_in`, never stored. Single source of color truth.
 */
function PrincipleSourceBadge({ principle, size = 'md' }) {
    const meta = GROUNDING_KIND_META[deriveGroundingKind(principle)] || GROUNDING_KIND_META.ungrounded;
    return (
        <Badge
            colorScheme={meta.color}
            fontSize={size === 'sm' ? '2xs' : 'xs'}
            textTransform="uppercase"
            px={2}
            py={size === 'sm' ? 0 : 0.5}
            borderRadius="md"
        >
            {meta.label}
        </Badge>
    );
}

export default PrincipleSourceBadge;
