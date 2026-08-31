import React from 'react';
import { Badge, Box, HStack, Heading, Tag, Text, Wrap, WrapItem } from '@chakra-ui/react';

import ArtifactTable from './ArtifactTable';
import { SubLabel } from './reportPrimitives';

/**
 * One Temporary Alternate Access Plan, with its signatories, coverage and evidence.
 * The full card — outcome, inactive flag, description, signed-by, covers, review-due —
 * shared so no presentation quietly renders a TAAP as less than it is (the approval
 * page's standalone template had trimmed it to title + owner + covers).
 */
const TaapEntry = ({ taap }) => (
    <Box borderWidth="1px" borderColor="gray.200" borderRadius="lg" bg="white" boxShadow="sm" overflow="hidden"
        borderLeftWidth="3px" borderLeftColor="orange.400">
        {/* Header band — TAAP + name */}
        <Box bg="orange.50" borderBottomWidth="1px" borderColor="gray.200" px={4} py={2.5}>
            <HStack spacing={2.5} align="center" flexWrap="wrap">
                <Badge colorScheme="orange" variant="solid" textTransform="uppercase" fontSize="2xs" borderRadius="md">TAAP</Badge>
                <Heading as="h3" size="sm" color="gray.800">{taap.title}</Heading>
                {taap.outcome && <Badge colorScheme="gray" fontSize="2xs">{taap.outcome.replace(/_/g, ' ')}</Badge>}
                {taap.active === false && <Badge colorScheme="red" fontSize="2xs">Inactive</Badge>}
            </HStack>
        </Box>

        {/* Body */}
        <Box p={4}>
            {taap.description && <Text fontSize="xs" color="gray.700" mb={2} whiteSpace="pre-wrap">{taap.description}</Text>}
            <Wrap spacing={2} mb={3}>
                {taap.owner && <WrapItem><Tag size="sm" colorScheme="teal" variant="subtle">Owner: {taap.owner.name}</Tag></WrapItem>}
                {(taap.signed_by || []).map((s) => <WrapItem key={s.unique_id}><Tag size="sm" colorScheme="green" variant="subtle">Signed: {s.name}</Tag></WrapItem>)}
                {(taap.covers_assets || []).map((a) => <WrapItem key={a.unique_id}><Tag size="sm" colorScheme="gray" variant="subtle">Covers: {a.title}</Tag></WrapItem>)}
                {taap.review_due && <WrapItem><Tag size="sm" colorScheme="yellow" variant="subtle">Review due {taap.review_due}</Tag></WrapItem>}
            </Wrap>
            <SubLabel>Evidence</SubLabel>
            <Box mt={1}>
                <ArtifactTable emptyText="No evidence recorded." documents={taap.documents} webpages={taap.webpages} notes={taap.notes} messages={taap.messages} />
            </Box>
        </Box>
    </Box>
);

export default TaapEntry;
