import React from 'react';
import { Badge, Box, Heading, HStack, Text, VStack, Wrap, WrapItem } from '@chakra-ui/react';

/**
 * Compact header for the People Explorer right panel. Pure presentational —
 * pass in a person object (rich detail from get_person_implementation_details
 * or any equivalently-shaped object).
 *
 * Reused anywhere a person's summary needs to be shown above a detail body.
 */
function PersonHeader({ person }) {
    if (!person) return null;

    return (
        <Box
            bg="white"
            borderWidth="1px"
            borderColor="gray.200"
            borderRadius="lg"
            p={4}
            boxShadow="sm"
        >
            <VStack align="stretch" spacing={2}>
                <HStack justify="space-between" align="baseline">
                    <Heading as="h2" size="md" color="gray.800">
                        {person.name}
                    </Heading>
                    {person.host_campus && (
                        <Badge colorScheme="teal" textTransform="uppercase" fontSize="xs">
                            {person.host_campus}
                        </Badge>
                    )}
                </HStack>

                {person.title && (
                    <Text fontSize="sm" color="gray.700">
                        {person.title}
                    </Text>
                )}
                {person.ati_role && (
                    <Text fontSize="xs" color="gray.500" fontStyle="italic">
                        {person.ati_role}
                    </Text>
                )}
                {person.email && (
                    <Text fontSize="xs" color="gray.500">
                        {person.email}
                    </Text>
                )}

                {Array.isArray(person.workingGroups) && person.workingGroups.length > 0 && (
                    <Wrap spacing={2} pt={1}>
                        {person.workingGroups.map((wg) => (
                            <WrapItem key={typeof wg === 'string' ? wg : wg.name}>
                                <Badge colorScheme="purple" variant="subtle" fontSize="2xs">
                                    {typeof wg === 'string' ? wg : wg.name}
                                </Badge>
                            </WrapItem>
                        ))}
                    </Wrap>
                )}
            </VStack>
        </Box>
    );
}

export default PersonHeader;
