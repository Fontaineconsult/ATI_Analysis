import React from 'react';
import { Badge } from '@chakra-ui/react';
import { getScopeColor, getScopeLabel, getClassColor, getClassLabel } from './assetConfig';

/**
 * Colored pills for asset metadata. Single source of color truth so the list,
 * detail, and forms render the same chip for a given scope / class, plus the
 * elevation-signal flag. Mirrors GovernanceTypeBadge.
 */
export function ScopeBadge({ scope, size = 'md' }) {
    if (!scope) return null;
    return (
        <Badge
            colorScheme={getScopeColor(scope)}
            fontSize={size === 'sm' ? '2xs' : 'xs'}
            textTransform="uppercase"
            px={2}
            py={size === 'sm' ? 0 : 0.5}
            borderRadius="md"
        >
            {getScopeLabel(scope)}
        </Badge>
    );
}

export function ClassBadge({ assetClass, size = 'md' }) {
    if (!assetClass) return null;
    return (
        <Badge
            variant="subtle"
            colorScheme={getClassColor(assetClass)}
            fontSize={size === 'sm' ? '2xs' : 'xs'}
            px={2}
            py={size === 'sm' ? 0 : 0.5}
            borderRadius="md"
        >
            {getClassLabel(assetClass)}
        </Badge>
    );
}

// Stewarded-but-unremediated: responsibility has elevated to the institution.
export function ElevationBadge({ size = 'md' }) {
    return (
        <Badge
            colorScheme="red"
            fontSize={size === 'sm' ? '2xs' : 'xs'}
            textTransform="uppercase"
            px={2}
            py={size === 'sm' ? 0 : 0.5}
            borderRadius="md"
            title="Stewarded but not yet remediated — responsibility has elevated to the institution (Title II §35.205)."
        >
            ⚠ Elevation
        </Badge>
    );
}
