import React from 'react';
import { Box, Flex, Heading } from '@chakra-ui/react';

/**
 * Denser inner block with the signature uppercase teal heading (design-sense §3.3).
 * Use inside a detail panel for sub-sections under the identity Card.
 *
 * Props:
 *   title    Section heading (rendered size="xs" uppercase wide teal.700).
 *   action   Optional node at the right of the heading row.
 *   ...rest  Forwarded to the outer Box.
 */
export default function Section({ title, action, children, ...rest }) {
    return (
        <Box
            bg="white"
            borderWidth="1px"
            borderColor="gray.200"
            borderRadius="lg"
            boxShadow="sm"
            p={3}
            {...rest}
        >
            {(title || action) && (
                <Flex justify="space-between" align="center" mb={2}>
                    {title ? (
                        <Heading
                            as="h4"
                            size="xs"
                            color="teal.700"
                            textTransform="uppercase"
                            letterSpacing="wide"
                        >
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
