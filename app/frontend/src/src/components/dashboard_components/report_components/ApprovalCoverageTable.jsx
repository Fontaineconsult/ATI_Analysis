import React from 'react';
import {
    Badge,
    Box,
    HStack,
    Table,
    Tbody,
    Td,
    Text,
    Th,
    Thead,
    Tooltip,
    Tr,
    VStack,
} from '@chakra-ui/react';

const LEVEL_ORDER = ['established', 'managed', 'optimizing'];
const LEVEL_COLOR = { established: 'teal', managed: 'purple', optimizing: 'orange' };
const byLevel = (a, b) => {
    const ai = LEVEL_ORDER.indexOf(a);
    const bi = LEVEL_ORDER.indexOf(b);
    return (ai === -1 ? LEVEL_ORDER.length : ai) - (bi === -1 ? LEVEL_ORDER.length : bi);
};

/**
 * The companion bar as a reviewer needs to read it — deliberately not the same table the
 * report renders.
 *
 * The report states what is claimed. An approver has to judge whether the claim holds, so
 * this adds the two things that make a claim checkable: the rationale argued on each link,
 * and a flag on claims that are probably wrong. Position and Budget are answered by position
 * descriptions and allocation records rather than by an implementation, so an implementation
 * claiming one is a likely overclaim and is marked rather than counted as coverage.
 */
const ApprovalCoverageTable = ({ coverage }) => {
    const requirements = coverage?.requirements || [];

    if (!requirements.length) {
        return (
            <Text fontSize="sm" color="gray.600">
                No companion-bar requirements are authored for this indicator, so there is no
                bar to grade against. Judge the evidence on the generic rubric.
            </Text>
        );
    }

    const rows = [...requirements].sort(
        (a, b) => byLevel(a.level, b.level) || (a.seq || 0) - (b.seq || 0)
    );

    return (
        <Box overflowX="auto">
            <Table size="sm" variant="simple">
                <Thead bg="gray.50">
                    <Tr>
                        <Th fontSize="2xs" w="90px">Level</Th>
                        <Th fontSize="2xs">Requirement</Th>
                        <Th fontSize="2xs" w="130px">State</Th>
                        <Th fontSize="2xs" w="34%">Claimed by / why</Th>
                    </Tr>
                </Thead>
                <Tbody>
                    {rows.map((r) => {
                        const claims = r.satisfied_by || [];
                        // A claim on a requirement that isn't implementation-evidenced is the
                        // pattern most likely to be wrong, so it is surfaced, not hidden.
                        const overclaimRisk = claims.length > 0 && !r.implementation_evidenced;
                        return (
                            <Tr key={r.handle} bg={overclaimRisk ? 'orange.50' : undefined}>
                                <Td verticalAlign="top">
                                    <Badge
                                        colorScheme={LEVEL_COLOR[r.level] || 'gray'}
                                        variant="subtle"
                                        fontSize="2xs"
                                    >
                                        {r.level}
                                    </Badge>
                                </Td>
                                <Td verticalAlign="top" whiteSpace="normal">
                                    <Text fontSize="xs" color="gray.700">{r.requirement}</Text>
                                    {r.element && (
                                        <Text fontSize="2xs" color="gray.500" mt={0.5}>{r.element}</Text>
                                    )}
                                </Td>
                                <Td verticalAlign="top">
                                    {overclaimRisk ? (
                                        <Tooltip
                                            label="Claimed by an implementation, but this element is normally answered by position descriptions or allocation records. Check the claim before approving."
                                            hasArrow
                                        >
                                            <Badge colorScheme="orange" variant="solid" fontSize="2xs">
                                                ⚠ Check claim
                                            </Badge>
                                        </Tooltip>
                                    ) : r.satisfied ? (
                                        <Badge colorScheme="green" variant="solid" fontSize="2xs">Satisfied</Badge>
                                    ) : r.implementation_evidenced ? (
                                        <Badge colorScheme="orange" variant="outline" fontSize="2xs">Bare</Badge>
                                    ) : (
                                        <Tooltip
                                            label="Answered by position descriptions or allocation records rather than by an implementation — graded outside the coverage ratio."
                                            hasArrow
                                        >
                                            <Badge colorScheme="gray" variant="outline" fontSize="2xs">Not counted</Badge>
                                        </Tooltip>
                                    )}
                                </Td>
                                <Td verticalAlign="top" whiteSpace="normal">
                                    {claims.length ? (
                                        <VStack align="stretch" spacing={2}>
                                            {claims.map((im) => (
                                                <Box key={`${im.type}-${im.unique_id}`}>
                                                    <HStack spacing={1.5} align="baseline" flexWrap="wrap">
                                                        <Text fontSize="2xs" fontWeight="semibold" color="gray.800">
                                                            {im.title}
                                                        </Text>
                                                        {im.retired && (
                                                            <Badge colorScheme="gray" variant="solid" fontSize="2xs">
                                                                retired
                                                            </Badge>
                                                        )}
                                                        {im.strength === null || im.strength === undefined ? (
                                                            <Badge colorScheme="gray" variant="outline" fontSize="2xs">
                                                                unrated
                                                            </Badge>
                                                        ) : (
                                                            <Badge colorScheme="blue" variant="subtle" fontSize="2xs">
                                                                s={im.strength}
                                                            </Badge>
                                                        )}
                                                    </HStack>
                                                    {/* The argument being made. Without it a reviewer can only
                                                        guess why the tick is there. */}
                                                    {im.rationale ? (
                                                        <Text fontSize="2xs" color="gray.600" mt={0.5}>
                                                            {im.rationale}
                                                        </Text>
                                                    ) : (
                                                        <Text fontSize="2xs" color="orange.600" mt={0.5}>
                                                            No rationale recorded.
                                                        </Text>
                                                    )}
                                                </Box>
                                            ))}
                                        </VStack>
                                    ) : (
                                        <Text fontSize="2xs" color="gray.400">—</Text>
                                    )}
                                </Td>
                            </Tr>
                        );
                    })}
                </Tbody>
            </Table>
        </Box>
    );
};

export default ApprovalCoverageTable;
