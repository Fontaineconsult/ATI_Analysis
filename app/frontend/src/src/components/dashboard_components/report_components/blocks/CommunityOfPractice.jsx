import React from 'react';
import { HStack, Tag, Text, Tooltip, VStack, Wrap, WrapItem } from '@chakra-ui/react';

import { SubHeading, SubLabel } from './reportPrimitives';

/**
 * Which communities ANSWER for this year's evidenced work, and which merely hold a stake.
 *
 * The derivation lives here so no page re-derives it: the union is over live
 * implementations only — a retired implementation's accountable community is history,
 * not accountability — deduped and sorted for a stable read. The approval page's
 * standalone template forgot both the retired filter and the sort.
 */
export function deriveAccountableCommunities(implementations = []) {
    return [...new Set(
        implementations
            .filter((im) => !im.retired)
            .flatMap((im) => im.accountable_communities || [])
    )].sort();
}

const CommunityOfPractice = ({ implementations = [], stakeholders = [] }) => {
    const accountable = deriveAccountableCommunities(implementations);
    return (
        <>
            <SubHeading>Community of practice</SubHeading>
            <VStack align="stretch" spacing={1.5} mt={2}>
                <HStack spacing={3} align="center" flexWrap="wrap">
                    <SubLabel>Accountable</SubLabel>
                    {accountable.length ? (
                        <Wrap spacing={1.5}>
                            {accountable.map((name) => (
                                <WrapItem key={name}>
                                    <Tag size="sm" colorScheme="cyan" variant="subtle">{name}</Tag>
                                </WrapItem>
                            ))}
                        </Wrap>
                    ) : (
                        <Text fontSize="xs" color="gray.600" fontStyle="italic">No community answers for the evidenced work yet.</Text>
                    )}
                </HStack>
                <HStack spacing={3} align="center" flexWrap="wrap">
                    <SubLabel>Stakeholders</SubLabel>
                    {stakeholders.length ? (
                        <Wrap spacing={1.5}>
                            {stakeholders.map((c) => (
                                <WrapItem key={c.name}>
                                    <Tooltip label={c.note || undefined} openDelay={400} isDisabled={!c.note}>
                                        <Tag size="sm" colorScheme="gray" variant="subtle">{c.name}</Tag>
                                    </Tooltip>
                                </WrapItem>
                            ))}
                        </Wrap>
                    ) : (
                        <Text fontSize="xs" color="gray.600" fontStyle="italic">No community holds a stake in this indicator.</Text>
                    )}
                </HStack>
            </VStack>
        </>
    );
};

export default CommunityOfPractice;
