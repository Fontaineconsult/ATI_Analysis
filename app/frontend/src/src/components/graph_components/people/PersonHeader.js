import React from 'react';
import { Button, Heading, HStack, Text, VStack, Wrap, WrapItem } from '@chakra-ui/react';
import { EditIcon } from '@chakra-ui/icons';
import Card from '../common/Card';
import { personWorkingGroups } from './peopleConfig';
import { ApproverBadge, CampusBadge, InvolvementBadge, WorkingGroupBadge } from './PersonBadges';
import { involvementOf } from '../../../services/utils/personInvolvement';

/**
 * Identity header for the People Explorer right panel. Pure presentational —
 * pass a person object (rich detail from get_person_implementation_details or
 * any equivalently-shaped object). The identity card carries the Edit action
 * when the container supplies onEdit (canon §3.3).
 */
function PersonHeader({ person, onEdit }) {
    if (!person) return null;

    const workingGroups = personWorkingGroups(person);

    return (
        <Card>
            <VStack align="stretch" spacing={2}>
                <HStack justify="space-between" align="start">
                    <Heading as="h2" size="md" color="gray.800" minW={0}>
                        {person.name}
                    </Heading>
                    <HStack spacing={2} flexShrink={0}>
                        {person.can_approve_yse && <ApproverBadge size="sm" />}
                        <CampusBadge campus={person.host_campus} size="sm" />
                        {onEdit && (
                            <Button
                                size="xs"
                                variant="outline"
                                colorScheme="teal"
                                leftIcon={<EditIcon boxSize={2.5} />}
                                onClick={onEdit}
                            >
                                Edit
                            </Button>
                        )}
                    </HStack>
                </HStack>

                {person.title && <Text fontSize="sm" color="gray.700">{person.title}</Text>}
                {person.ati_role && <Text fontSize="xs" color="gray.600" fontStyle="italic">{person.ati_role}</Text>}
                {person.email && <Text fontSize="xs" color="gray.600">{person.email}</Text>}

                {(workingGroups.length > 0 || involvementOf(person) !== 'member') && (
                    <Wrap spacing={2} pt={1}>
                        {workingGroups.map((wg) => (
                            <WrapItem key={wg}>
                                <WorkingGroupBadge name={wg} size="sm" />
                            </WrapItem>
                        ))}
                        {involvementOf(person) !== 'member' && (
                            <WrapItem>
                                <InvolvementBadge involvement={involvementOf(person)} size="sm" />
                            </WrapItem>
                        )}
                    </Wrap>
                )}
            </VStack>
        </Card>
    );
}

export default PersonHeader;
