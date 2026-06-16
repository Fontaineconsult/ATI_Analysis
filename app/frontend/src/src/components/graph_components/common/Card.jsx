import React from 'react';
import { Box, Flex, Heading } from '@chakra-ui/react';

/**
 * Canon titled white surface (design-sense §3.3). Shared primitive so areas
 * inherit the card chrome instead of re-inlining it (the §8 debt #1 aspiration).
 *
 * Props:
 *   title    Optional heading (rendered size="sm" teal.700).
 *   action   Optional node rendered at the right of the title row (e.g. an Edit
 *            IconButton). Title row is omitted entirely when both are absent.
 *   ...rest  Forwarded to the outer Box (override p, bg, etc. as needed).
 */
export default function Card({ title, action, children, ...rest }) {
    return (
        <Box
            bg="white"
            borderWidth="1px"
            borderColor="gray.200"
            borderRadius="lg"
            boxShadow="sm"
            p={5}
            {...rest}
        >
            {(title || action) && (
                <Flex justify="space-between" align="center" mb={3}>
                    {title ? (
                        <Heading as="h3" size="sm" color="teal.700">
                            {title}
                        </Heading>
                    ) : <Box />}
                    {action}
                </Flex>
            )}
            {children}
        </Box>
    );
}
