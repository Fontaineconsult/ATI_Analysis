import React from 'react';
import { Badge, Box, HStack, Heading, Tag, Text, VStack, Wrap, WrapItem } from '@chakra-ui/react';

import { strengthConfig, controlConfig } from '../../../graph_components/implementation/implementationConfig';
import ArtifactTable from './ArtifactTable';
import { DataTable, Dash, SubLabel } from './reportPrimitives';

/**
 * One implementation, as evidence for an indicator — the card both the report and the
 * approval page render.
 *
 * The differences between the two pages are independent axes, so they are explicit
 * boolean/callback props rather than a variant string:
 *
 *   onOpenImplementation   report lens: makes the title navigate to the implementation
 *                          page. Absent → a plain, non-interactive heading.
 *   showRationale          review lens: the "Why this is evidence here" callout — the
 *                          rel's argument for the link, distinct from the description,
 *                          which is identical wherever the implementation appears.
 *   showClaimedRequirements review lens: the claimed companion-bar requirements as a
 *                          visible list (the report keeps them in the badge tooltip).
 *   showUnratedBadge       review lens: an explicit "unrated" badge when strength is
 *                          null — an unrated link is an unqualified claim, which a
 *                          reviewer needs pointed out and a report reader does not.
 *
 * Retired renders via the `.retired` CSS class (grayscale, AA-safe) — never opacity.
 */
const ImplementationCard = ({
    impl,
    requirementsByHandle = {},
    onOpenImplementation,
    showRationale = false,
    showClaimedRequirements = false,
    showUnratedBadge = false,
}) => {
    const noActiveDocs = Boolean(impl.no_active_documents);
    const undocumented = Boolean(impl.undocumented);
    const accent = (noActiveDocs || undocumented) ? 'orange' : 'teal';
    const participants = impl.participants || [];
    const claims = impl.satisfies || [];
    const remediates = (impl.remediates_interfaces || []).map((i) => i.title).filter(Boolean).join(', ');
    const unrated = impl.strength === null || impl.strength === undefined;

    return (
        <Box borderWidth="1px" borderColor="gray.200" borderRadius="lg" bg="white" boxShadow="sm" overflow="hidden"
            borderLeftWidth="3px" borderLeftColor={`${accent}.400`}
            className={impl.retired ? 'retired' : undefined}>
            {/* Header band — implementation type + name */}
            <Box bg={`${accent}.50`} borderBottomWidth="1px" borderColor="gray.200" px={4} py={2.5}>
                <HStack spacing={2.5} align="center" flexWrap="wrap">
                    <Badge colorScheme={accent} variant="solid" textTransform="uppercase" fontSize="2xs" borderRadius="md">
                        {impl.type}
                    </Badge>
                    {onOpenImplementation ? (
                        <Heading as="h3" size="sm" color="gray.800" cursor="pointer"
                            _hover={{ color: 'teal.700', textDecoration: 'underline' }}
                            onClick={() => impl.unique_id && onOpenImplementation(impl)}>
                            {impl.title}
                        </Heading>
                    ) : (
                        <Heading as="h3" size="sm" color="gray.800">{impl.title}</Heading>
                    )}
                    {strengthConfig(impl.strength) && (
                        <Badge
                            colorScheme={strengthConfig(impl.strength).colorScheme}
                            variant="subtle"
                            fontSize="2xs"
                            title={strengthConfig(impl.strength).description}
                        >
                            {strengthConfig(impl.strength).label}
                        </Badge>
                    )}
                    {showUnratedBadge && unrated && (
                        <Badge colorScheme="gray" variant="outline" fontSize="2xs"
                            title="This link carries no strength rating — an unqualified claim.">
                            unrated
                        </Badge>
                    )}
                    {claims.length > 0 && (
                        <Badge
                            colorScheme="green"
                            variant="solid"
                            fontSize="2xs"
                            title={claims
                                .map((h) => requirementsByHandle[h]?.requirement || h)
                                .join('\n\n')}
                        >
                            ✓ Satisfies {claims.length}
                        </Badge>
                    )}
                    {impl.control === 'external' && (
                        <Badge
                            colorScheme="purple"
                            variant="subtle"
                            fontSize="2xs"
                            title={controlConfig('external').description}
                        >
                            External
                        </Badge>
                    )}
                    {impl.retired && (
                        <Badge
                            colorScheme="gray"
                            variant="solid"
                            fontSize="2xs"
                            title={impl.retired_note || 'This implementation has been retired'}
                        >
                            Retired{impl.retired_date ? ` ${impl.retired_date}` : ''}
                        </Badge>
                    )}
                    {noActiveDocs && (
                        <Badge colorScheme="orange" variant="solid" fontSize="2xs" title="Every document on this implementation is depreciated — no active documentation">
                            ⚠ No active documentation
                        </Badge>
                    )}
                    {undocumented && (
                        <Badge colorScheme="orange" variant="outline" fontSize="2xs" title="No documents or webpages are attached to this implementation at all (notes and messages don't count as documentation)">
                            ⚠ Undocumented
                        </Badge>
                    )}
                </HStack>
            </Box>

            {/* Body */}
            <Box p={4}>
                {impl.description && <Text fontSize="xs" color="gray.700" mb={2} whiteSpace="pre-wrap">{impl.description}</Text>}

                {showRationale && impl.rationale && (
                    <Box mb={3} p={2} bg="teal.50" borderLeftWidth="2px" borderLeftColor="teal.300" borderRadius="sm">
                        <SubLabel>Why this is evidence here</SubLabel>
                        <Text fontSize="xs" color="gray.700" whiteSpace="pre-wrap" mt={0.5}>
                            {impl.rationale}
                        </Text>
                    </Box>
                )}

                {showClaimedRequirements && claims.length > 0 && (
                    <Box mb={3}>
                        <SubLabel>Requirements claimed</SubLabel>
                        <VStack align="stretch" spacing={0.5} mt={1}>
                            {claims.map((h) => (
                                <Text key={h} fontSize="2xs" color="gray.700">
                                    • {requirementsByHandle[h]?.requirement || h}
                                </Text>
                            ))}
                        </VStack>
                    </Box>
                )}

                <Wrap spacing={2} mb={2}>
                    {impl.owner && <WrapItem><Tag size="sm" colorScheme="teal" variant="subtle">Owner: {impl.owner.name}</Tag></WrapItem>}
                    {((impl.accountable_communities || []).length > 0 || impl.accountable_working_group) && (
                        <WrapItem>
                            <Tag size="sm" colorScheme="cyan" variant="subtle">
                                Accountable: {(impl.accountable_communities || []).length
                                    ? impl.accountable_communities.join(', ')
                                    : impl.accountable_working_group}
                            </Tag>
                        </WrapItem>
                    )}
                    {(impl.dimensions || []).map((d) => <WrapItem key={d.handle}><Tag size="sm" colorScheme="orange" variant="subtle">{d.name}</Tag></WrapItem>)}
                    {remediates && <WrapItem><Tag size="sm" colorScheme="blue" variant="outline">Remediates: {remediates}</Tag></WrapItem>}
                </Wrap>

                {participants.length > 0 && (
                    <Box mb={3}>
                        <SubLabel>Worked on by</SubLabel>
                        <Box mt={1}>
                            <DataTable
                                columns={['Person', 'Role', 'Note']}
                                rows={participants.map((p) => [
                                    <Text color="gray.800">{p.person?.name}</Text>,
                                    p.role_handle ? <Text>{p.role_handle.replace(/^role:/, '')}</Text> : <Dash />,
                                    p.note ? <Text fontStyle="italic" color="gray.700">{p.note}</Text> : <Dash />,
                                ])}
                            />
                        </Box>
                    </Box>
                )}

                <Box>
                    <SubLabel>Evidence</SubLabel>
                    <Box mt={1}>
                        <ArtifactTable
                            emptyText="No evidence recorded."
                            documents={impl.documents}
                            webpages={impl.webpages}
                            notes={impl.notes}
                            messages={impl.messages}
                            metrics={impl.metrics}
                        />
                    </Box>
                </Box>
            </Box>
        </Box>
    );
};

export default ImplementationCard;
