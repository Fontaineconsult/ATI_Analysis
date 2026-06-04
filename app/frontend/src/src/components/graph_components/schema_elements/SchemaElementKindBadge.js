import React from 'react';
import { Badge } from '@chakra-ui/react';
import { getSchemaElementKindColorScheme, humanizeKind } from './schemaElementTypes';
import { useDescriptors } from '../../../hooks/useDescriptors';

/**
 * Colored pill for a SchemaElement's element_kind. Color is structural (registry); the LABEL
 * is sourced from the descriptor layer (field_value descriptor for element_kind), with a
 * humanized fallback when no descriptor is seeded yet. Single source of color truth.
 */
function SchemaElementKindBadge({ kind, size = 'md' }) {
    const { describeFieldValue } = useDescriptors();
    if (!kind) return null;
    const label = describeFieldValue('element_kind', kind)?.title || humanizeKind(kind);
    return (
        <Badge
            colorScheme={getSchemaElementKindColorScheme(kind)}
            fontSize={size === 'sm' ? '2xs' : 'xs'}
            textTransform="uppercase"
            px={2}
            py={size === 'sm' ? 0 : 0.5}
            borderRadius="md"
        >
            {label}
        </Badge>
    );
}

export default SchemaElementKindBadge;
