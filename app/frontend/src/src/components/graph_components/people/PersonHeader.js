import React from 'react';
import { Badge, Heading, HStack, Text, VStack, Wrap, WrapItem } from '@chakra-ui/react';
import Card from '../common/Card';

/**
 * Identity header for the People Explorer right panel. Pure presentational —
 * pass a person object (rich detail from get_person_implementation_details or
 * any equivalently-shaped object).
 */
function PersonHeader({ person }) {
    if (!person) return null;

    const workingGroups = Array.isArray(person.workingGroups) ? person.workingGroups : [];

    return (
        <Card>
            <VStack align="stretch" spacing={2}>
                <HStack justify="space-between" align="start">
                    <Heading as="h2" size="md" color="gray.800" minW={0}>
                        {person.name}
                    </Heading>
                    <HStack spacing={2} flexShrink={0}>
                        {person.can_approve_yse && (
                            <Badge colorScheme="teal" variant="solid" fontSize="2xs">Approver</Badge>
                        )}
                        {person.host_campus && (
                            <Badge colorScheme="teal" variant="outline" textTransform="uppercase" fontSize="2xs">
                                {person.host_campus}
                            </Badge>
                        )}
                    </HStack>
                </HStack>

                {person.title && <Text fontSize="sm" color="gray.700">{person.title}</Text>}
                {person.ati_role && <Text fontSize="xs" color="gray.600" fontStyle="italic">{person.ati_role}</Text>}
                {person.email && <Text fontSize="xs" color="gray.600">{person.email}</Text>}

                {(workingGroups.length > 0 || person.non_committee_member_active) && (
                    <Wrap spacing={2} pt={1}>
                        {workingGroups.map((wg) => (
                            <WrapItem key={typeof wg === 'string' ? wg : wg.name}>
                                <Badge colorScheme="purple" variant="subtle" fontSize="2xs">
                                    {typeof wg === 'string' ? wg : wg.name}
                                </Badge>
                            </WrapItem>
                        ))}
                        {workingGroups.length === 0 && person.non_committee_member_active && (
                            <WrapItem>
                                <Badge colorScheme="gray" variant="subtle" fontSize="2xs">Non-committee active</Badge>
                            </WrapItem>
                        )}
                    </Wrap>
                )}
            </VStack>
        </Card>
    );
}

export default PersonHeader;
