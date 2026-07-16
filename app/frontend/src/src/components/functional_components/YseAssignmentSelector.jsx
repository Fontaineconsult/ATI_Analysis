import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
    Alert,
    AlertIcon,
    Badge,
    Box,
    Checkbox,
    Heading,
    HStack,
    Spinner,
    Text,
    VStack,
    useToast,
} from '@chakra-ui/react';

import { fetchYsesByCampusForYear } from '../../services/api/get';
import {
    assignImplementationToYSE,
    assignPersonAsImplementor,
    unassignPersonAsImplementor,
} from '../../services/api/put';
import { unassignImplementationFromYSE } from '../../services/api/delete';

/**
 * Inverse-mount of the YSE-side attach flow. Given an entity (Implementation,
 * Person, or in future a Plan), shows YSEs for the current academic year
 * grouped by campus + working group; toggling a row writes the appropriate
 * edge (is_evidence_for for Implementation, implements for Person).
 *
 * Optimistic update with toast feedback. On failure the local state reverts.
 *
 * Props:
 *   entityType         "Implementation" | "Person" (Plan support stubbed)
 *   entityTitle        Required for Implementation — backend keys on title.
 *   implementationType e.g. "Process" — only used when entityType === "Implementation"
 *   personEmployeeId   Required when entityType === "Person".
 *   academicYear       The year whose YSEs to show.
 *   currentLinks       Array of link objects this entity is already linked to.
 *                      Each: { year_identifier, indicator_composite_key, campus: { abbreviation } }
 *                      Used both to render initial checkbox state and to compute
 *                      peer-campus badges per row.
 *   scopeCampus        Optional campus abbreviation. When set, the selector
 *                      renders only YSEs at that campus; per-row badges then
 *                      surface any other campuses where this entity is linked
 *                      to the same indicator (composite_key).
 *   onChange           Called after every successful link/unlink so the parent
 *                      can refetch.
 */
function YseAssignmentSelector({
                                   entityType,
                                   entityTitle,
                                   implementationType,
                                   personEmployeeId,
                                   academicYear,
                                   currentLinks = [],
                                   scopeCampus,
                                   onChange,
                               }) {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Optimistic local state — initialized from props, mutated on toggle.
    const initialIdentifiers = useMemo(
        () => currentLinks.map((l) => l.year_identifier).filter(Boolean),
        [currentLinks],
    );
    const [linkedSet, setLinkedSet] = useState(() => new Set(initialIdentifiers));
    const [pendingIds, setPendingIds] = useState(() => new Set());
    const toast = useToast();

    useEffect(() => {
        setLinkedSet(new Set(initialIdentifiers));
    }, [initialIdentifiers]);

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        setError(null);
        fetchYsesByCampusForYear(academicYear)
            .then((response) => {
                if (cancelled) return;
                setData(response?.data || null);
            })
            .catch((err) => {
                if (cancelled) return;
                setError(err.message || 'Failed to load YSEs');
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });
        return () => { cancelled = true; };
    }, [academicYear]);

    // composite_key -> Set of campus abbreviations currently linked to this entity.
    // Drives the peer-campus badges shown per row.
    const linkedCampusesByCompositeKey = useMemo(() => {
        const m = new Map();
        for (const link of currentLinks) {
            const key = link.indicator_composite_key;
            const abbrev = link.campus?.abbreviation;
            if (!key || !abbrev) continue;
            if (!m.has(key)) m.set(key, new Set());
            m.get(key).add(abbrev);
        }
        return m;
    }, [currentLinks]);

    const link = useCallback(async (yearIdentifier) => {
        if (entityType === 'Implementation') {
            await assignImplementationToYSE(yearIdentifier, implementationType, entityTitle);
            return;
        }
        if (entityType === 'Person') {
            await assignPersonAsImplementor(personEmployeeId, yearIdentifier);
            return;
        }
        throw new Error(`Linking not yet implemented for entityType=${entityType}`);
    }, [entityType, entityTitle, implementationType, personEmployeeId]);

    const unlink = useCallback(async (yearIdentifier) => {
        if (entityType === 'Implementation') {
            await unassignImplementationFromYSE(yearIdentifier, implementationType, entityTitle);
            return;
        }
        if (entityType === 'Person') {
            await unassignPersonAsImplementor(personEmployeeId, yearIdentifier);
            return;
        }
        throw new Error(`Unlinking not yet implemented for entityType=${entityType}`);
    }, [entityType, entityTitle, implementationType, personEmployeeId]);

    const handleToggle = useCallback(async (yearIdentifier, nextChecked) => {
        // Optimistic update
        setLinkedSet((prev) => {
            const next = new Set(prev);
            if (nextChecked) next.add(yearIdentifier);
            else next.delete(yearIdentifier);
            return next;
        });
        setPendingIds((prev) => new Set(prev).add(yearIdentifier));

        try {
            if (nextChecked) {
                await link(yearIdentifier);
            } else {
                await unlink(yearIdentifier);
            }
            toast({
                title: nextChecked ? 'Linked to YSE' : 'Unlinked from YSE',
                description: yearIdentifier,
                status: 'success',
                duration: 2000,
                isClosable: true,
                position: 'top-right',
            });
            if (onChange) onChange();
        } catch (err) {
            // Revert
            setLinkedSet((prev) => {
                const next = new Set(prev);
                if (nextChecked) next.delete(yearIdentifier);
                else next.add(yearIdentifier);
                return next;
            });
            toast({
                title: nextChecked ? 'Failed to link' : 'Failed to unlink',
                description: err.message || 'Please try again.',
                status: 'error',
                duration: 4000,
                isClosable: true,
                position: 'top-right',
            });
        } finally {
            setPendingIds((prev) => {
                const next = new Set(prev);
                next.delete(yearIdentifier);
                return next;
            });
        }
    }, [link, unlink, onChange, toast]);

    const visibleCampuses = useMemo(() => {
        if (!data?.campuses) return [];
        if (!scopeCampus) return data.campuses;
        return data.campuses.filter((c) => c.abbreviation === scopeCampus);
    }, [data, scopeCampus]);

    const linkedCount = useMemo(() => {
        let count = 0;
        for (const c of visibleCampuses) {
            for (const wg of c.working_groups) {
                for (const yse of wg.yses) {
                    if (linkedSet.has(yse.year_identifier)) count++;
                }
            }
        }
        return count;
    }, [visibleCampuses, linkedSet]);

    if (loading) {
        return (
            <HStack py={6} justify="center">
                <Spinner size="sm" color="teal.500" />
                <Text fontSize="sm" color="gray.600">Loading YSEs for {academicYear}…</Text>
            </HStack>
        );
    }

    if (error) {
        return (
            <Alert status="error" borderRadius="md" fontSize="sm">
                <AlertIcon />
                {error}
            </Alert>
        );
    }

    if (visibleCampuses.length === 0) {
        return (
            <Alert status="info" borderRadius="md" fontSize="sm">
                <AlertIcon />
                {scopeCampus
                    ? `No YSEs found for ${scopeCampus.toUpperCase()} in ${academicYear}.`
                    : `No YSEs found for ${academicYear}.`}
            </Alert>
        );
    }

    return (
        <VStack align="stretch" spacing={5}>
            <HStack justify="space-between">
                <Text fontSize="xs" color="gray.600">
                    Toggle YSEs this {entityType.toLowerCase()} is evidence for. Changes save immediately.
                </Text>
                <Badge colorScheme="teal" fontSize="xs">
                    {linkedCount} linked
                </Badge>
            </HStack>

            {visibleCampuses.map((campus) => (
                <Box
                    key={campus.abbreviation}
                    borderWidth="1px"
                    borderColor="gray.200"
                    borderRadius="lg"
                    p={4}
                    bg="white"
                >
                    <HStack mb={3} spacing={2} align="baseline">
                        <Badge
                            colorScheme="teal"
                            fontSize="xs"
                            textTransform="uppercase"
                            px={2}
                            py={1}
                            borderRadius="md"
                        >
                            {campus.abbreviation}
                        </Badge>
                        <Heading as="h4" size="xs" color="gray.700" fontWeight="bold">
                            {campus.name}
                        </Heading>
                    </HStack>

                    <VStack align="stretch" spacing={3}>
                        {campus.working_groups.map((wg) => (
                            <Box key={wg.name}>
                                <Text
                                    fontSize="xs"
                                    color="teal.600"
                                    fontWeight="semibold"
                                    textTransform="uppercase"
                                    mb={1}
                                >
                                    {wg.name}
                                </Text>
                                <VStack align="stretch" spacing={1} pl={2}>
                                    {wg.yses.map((yse) => {
                                        const isLinked = linkedSet.has(yse.year_identifier);
                                        const isPending = pendingIds.has(yse.year_identifier);
                                        const peerCampuses = [
                                            ...(linkedCampusesByCompositeKey.get(yse.indicator_composite_key) || []),
                                        ]
                                            .filter((abbr) => abbr !== campus.abbreviation)
                                            .sort();
                                        return (
                                            <Checkbox
                                                key={yse.year_identifier}
                                                size="sm"
                                                colorScheme="teal"
                                                isChecked={isLinked}
                                                isDisabled={isPending}
                                                onChange={(e) => handleToggle(yse.year_identifier, e.target.checked)}
                                            >
                                                <HStack spacing={2} align="baseline" flexWrap="wrap">
                                                    <Text as="span" fontSize="xs" fontFamily="mono" color="gray.600">
                                                        {yse.indicator_composite_key}
                                                    </Text>
                                                    <Text as="span" fontSize="xs" color="gray.700">
                                                        {yse.indicator_description}
                                                    </Text>
                                                    {peerCampuses.length > 0 && (
                                                        <HStack spacing={1} align="baseline">
                                                            <Text as="span" fontSize="2xs" color="gray.600">
                                                                also at
                                                            </Text>
                                                            {peerCampuses.map((abbr) => (
                                                                <Badge
                                                                    key={abbr}
                                                                    colorScheme="purple"
                                                                    variant="subtle"
                                                                    fontSize="2xs"
                                                                    px={1.5}
                                                                    py={0}
                                                                    borderRadius="md"
                                                                    textTransform="uppercase"
                                                                >
                                                                    {abbr}
                                                                </Badge>
                                                            ))}
                                                        </HStack>
                                                    )}
                                                </HStack>
                                            </Checkbox>
                                        );
                                    })}
                                </VStack>
                            </Box>
                        ))}
                    </VStack>
                </Box>
            ))}
        </VStack>
    );
}

export default YseAssignmentSelector;
