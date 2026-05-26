import React from 'react';
import { Badge } from '@chakra-ui/react';
import { getGovernanceTypeColorScheme, getGovernanceTypeLabel } from './governanceTypes';

/**
 * Colored pill for a governance type. Single source of color truth so any
 * surface (list, detail, picker) renders the same chip for a given type.
 */
function GovernanceTypeBadge({ type, size = 'md' }) {
    if (!type) return null;
    return (
        <Badge
            colorScheme={getGovernanceTypeColorScheme(type)}
            fontSize={size === 'sm' ? '2xs' : 'xs'}
            textTransform="uppercase"
            px={2}
            py={size === 'sm' ? 0 : 0.5}
            borderRadius="md"
        >
            {getGovernanceTypeLabel(type)}
        </Badge>
    );
}

export default GovernanceTypeBadge;
