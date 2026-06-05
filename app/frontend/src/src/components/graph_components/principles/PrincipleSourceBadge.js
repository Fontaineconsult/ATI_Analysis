import React from 'react';
import { Badge } from '@chakra-ui/react';

/**
 * Grounding-status badge: "Grounded" if the principle derives from ANY governance or
 * intellectual source, else "Ungrounded". The specific grounding TYPES (Law, Directive,
 * Theory, …) are shown separately by PrincipleGroundingTags.
 */
function PrincipleSourceBadge({ principle, size = 'md' }) {
    const groundedCount =
        (principle?.grounded_in?.governance?.length || 0) +
        (principle?.grounded_in?.intellectual_sources?.length || 0);
    const grounded = groundedCount > 0;

    return (
        <Badge
            colorScheme={grounded ? 'green' : 'gray'}
            fontSize={size === 'sm' ? '2xs' : 'xs'}
            textTransform="uppercase"
            px={2}
            py={size === 'sm' ? 0 : 0.5}
            borderRadius="md"
        >
            {grounded ? 'Grounded' : 'Ungrounded'}
        </Badge>
    );
}

export default PrincipleSourceBadge;
