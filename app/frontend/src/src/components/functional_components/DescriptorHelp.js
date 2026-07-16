import React from 'react';
import { Tooltip, Box, HStack, Text, Icon } from '@chakra-ui/react';
import { InfoOutlineIcon } from '@chakra-ui/icons';
import { useDescriptors } from '../../hooks/useDescriptors';

/**
 * Thread ontology descriptions (UniversalDescriptor.description_short) through the app as
 * tooltips and inline help, resolved from the app-wide DescriptorContext (one fetch, cached,
 * refreshed live after edits — see EditDescriptor). Nothing renders for an undescribed
 * element, so these never add noise where there's no help to give.
 *
 * Target any ontology element by the same coordinates the backend keys on:
 *   <HelpTip nodeType="Asset" />
 *   <HelpTip field={['Asset', 'scope']} />
 *   <HelpTip fieldValue={['function', 'teaching-and-learning']} />
 *   <HelpTip relType="remediates" />
 *   <HelpTip handle="node_type:Asset" />          // escape hatch
 *   <HelpBox field={['Interface', 'function']} /> // inline help box variant
 */

// Resolve a target to its descriptor handle — mirrors app/database/identifiers.py.
function targetHandle({ handle, nodeType, field, fieldValue, relType }) {
    if (handle) return handle;
    if (nodeType) return `node_type:${nodeType}`;
    if (field) return `field:${field[0]}.${field[1]}`;
    if (fieldValue) return `field_value:${fieldValue[0]}.${fieldValue[1]}`;
    if (relType) return `rel_type:${relType}`;
    return null;
}

// Hook form — for callers that want the raw text (e.g. a FormLabel's help, a placeholder).
export function useDescription(target = {}) {
    const { byHandle } = useDescriptors();
    const handle = targetHandle(target);
    const d = handle ? byHandle[handle] : null;
    return {
        handle,
        descriptor: d || null,
        short: d?.description_short || null,
        full: d?.description_full || null,
        title: d?.title || null,
    };
}

// An ⓘ icon with the element's short description as a tooltip. Renders nothing when the
// element has no description, unless `showMissing` (then a faint disabled icon).
export function HelpTip({ showMissing = false, placement = 'top', ...target }) {
    const { short, full } = useDescription(target);
    const label = short || full;

    if (!label) {
        return showMissing
            ? <Icon as={InfoOutlineIcon} boxSize={3} color="gray.300" aria-label="No description available" />
            : null;
    }

    return (
        <Tooltip label={label} hasArrow placement={placement} openDelay={200}
                 maxW="320px" fontSize="xs" borderRadius="md" p={2}>
            <Box as="span" display="inline-flex" alignItems="center" tabIndex={0} ml={1}
                 cursor="help" role="note" aria-label={`Description: ${label}`}
                 _focusVisible={{ outline: '2px solid', outlineColor: 'teal.500', borderRadius: 'sm' }}>
                <Icon as={InfoOutlineIcon} boxSize={3} color="gray.600" />
            </Box>
        </Tooltip>
    );
}

// An inline help box rendering the short description — for under a form field or beneath a
// section heading. Renders nothing when undescribed.
export function HelpBox({ ...target }) {
    const { short } = useDescription(target);
    if (!short) return null;
    return (
        <HStack align="start" spacing={2} bg="teal.50" borderRadius="md" px={3} py={2} mt={1}
                role="note">
            <Icon as={InfoOutlineIcon} boxSize={3.5} color="teal.500" mt="2px" flexShrink={0} />
            <Text fontSize="xs" color="gray.700">{short}</Text>
        </HStack>
    );
}

export default HelpTip;
