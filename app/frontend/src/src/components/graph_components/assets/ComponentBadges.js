import React from 'react';
import { Badge } from '@chakra-ui/react';
import { getComponentKindColor, getComponentKindLabel } from './componentConfig';

/**
 * Colored pill for a Component's kind (the WCAG-grain functional role). Single source of
 * color truth so the list, detail, and form render the same chip. Mirrors the badges in
 * InterfaceBadges / AssetBadges.
 */
export function ComponentKindBadge({ kind, size = 'md' }) {
    if (!kind) return null;
    return (
        <Badge
            colorScheme={getComponentKindColor(kind)}
            fontSize={size === 'sm' ? '2xs' : 'xs'}
            textTransform="uppercase"
            px={2}
            py={size === 'sm' ? 0 : 0.5}
            borderRadius="md"
        >
            {getComponentKindLabel(kind)}
        </Badge>
    );
}
