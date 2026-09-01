import React from 'react';
import { Box, HStack, Spinner, Text } from '@chakra-ui/react';

/**
 * The two loading treatments from design-sense §5, as components, so the ~48
 * places that hand-roll a Spinner have one thing to converge on and the size,
 * colour and wording stop drifting.
 *
 *   Loading (inline)  HStack, Spinner size="sm" color="teal.500", "Loading …"
 *   Loading (area)    centred Spinner size="xl" + text
 *
 * ACCESSIBILITY. Both carry role="status" and aria-live="polite", so the wait is
 * announced rather than being a silent visual change. That means you must NOT
 * nest one inside another live region — the documentation list wraps its record
 * count in aria-live, so the count and the spinner swap inside ONE region rather
 * than nesting two. The spinner graphic itself is aria-hidden; the label is what
 * gets read, which is why the label should say what is loading rather than just
 * "Loading".
 */

/** Inline: use inside a panel, next to or above the content being replaced. */
export function Loading({ label = 'Loading…', live = true, ...rest }) {
    return (
        <HStack
            spacing={2}
            color="gray.600"
            role={live ? 'status' : undefined}
            aria-live={live ? 'polite' : undefined}
            {...rest}
        >
            <Spinner size="sm" color="teal.500" aria-hidden="true" />
            <Text fontSize="sm">{label}</Text>
        </HStack>
    );
}

/** Area: use when the whole region is empty and waiting. */
export function LoadingArea({ label = 'Loading…', live = true, ...rest }) {
    return (
        <Box
            py={10}
            textAlign="center"
            role={live ? 'status' : undefined}
            aria-live={live ? 'polite' : undefined}
            {...rest}
        >
            <Spinner size="xl" color="teal.500" aria-hidden="true" />
            <Text fontSize="sm" color="gray.600" mt={3}>{label}</Text>
        </Box>
    );
}

export default Loading;
