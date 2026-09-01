import React from 'react';
import { HStack, Spinner, Text } from '@chakra-ui/react';

import useIsFetching from '../../hooks/useIsFetching';

/**
 * The app-wide "something is loading" indicator, mounted once.
 *
 * It answers a question no component could answer before: every read now goes
 * through the shared store, so the store knows exactly what is in flight and
 * this just subscribes to that count.
 *
 * DELIBERATELY THE BACKGROUND-UPDATE TREATMENT, not a blocking one
 * (design-sense §5: "non-blocking small spinner"). It is a corner pill, not a
 * modal or a top-of-page bar, because it fires for every fetch in the app —
 * including ones the user did not initiate and does not care about. It must
 * never take the page away from them. Areas still show their own inline
 * spinners for the data they are actually waiting on; this is peripheral
 * reassurance that the app is working, not the primary signal.
 *
 * aria-hidden, and that is the point rather than an oversight: it duplicates
 * status that the individual areas already announce through their own
 * role="status" regions. Announcing here as well would read every fetch in the
 * app twice to a screen-reader user, including background ones with no bearing
 * on what they are doing.
 *
 * It also does not render for fast requests — see the delay below — so a cached
 * read, which is now most of them, never flashes anything.
 */

/** Below this, a request finishes before a spinner would help. */
const APPEAR_AFTER_MS = 400;

function GlobalActivityIndicator() {
    const inflight = useIsFetching();
    const [visible, setVisible] = React.useState(false);

    React.useEffect(() => {
        if (!inflight) {
            setVisible(false);
            return undefined;
        }
        const timer = setTimeout(() => setVisible(true), APPEAR_AFTER_MS);
        return () => clearTimeout(timer);
    }, [inflight]);

    if (!visible) return null;

    return (
        <HStack
            position="fixed"
            bottom={4}
            right={4}
            zIndex="toast"
            spacing={2}
            bg="white"
            borderWidth="1px"
            borderColor="gray.200"
            borderRadius="full"
            boxShadow="md"
            px={3}
            py={2}
            aria-hidden="true"
            pointerEvents="none"
        >
            <Spinner size="sm" color="teal.500" />
            <Text fontSize="xs" color="gray.600">
                Loading{inflight > 1 ? ` ${inflight} things` : ''}…
            </Text>
        </HStack>
    );
}

export default GlobalActivityIndicator;
