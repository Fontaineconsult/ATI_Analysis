import React, { useCallback, useEffect, useState } from 'react';
import {
    Box,
    Button,
    Heading,
    HStack,
    Link,
    Spinner,
    Text,
    VStack,
} from '@chakra-ui/react';

import { useSettings } from '../../../context/SettingsContext';
import { fetchCampusPlan } from '../../../services/api/get';
import { createCampusPlan } from '../../../services/api/post';
import WorkingGroupPlan from './WorkingGroupPlan';

function isNotFoundError(error) {
    // axios throws on 4xx/5xx — check the underlying response status when present.
    return error?.response?.status === 404;
}

function CampusPlanContainer() {
    const { currentCampus, currentAcademicYear } = useSettings();

    const [plan, setPlan] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [notFound, setNotFound] = useState(false);
    const [creating, setCreating] = useState(false);

    const loadPlan = useCallback(async () => {
        if (!currentCampus || !currentAcademicYear) return;

        setLoading(true);
        setError(null);
        setNotFound(false);
        try {
            const response = await fetchCampusPlan(currentCampus, currentAcademicYear);
            setPlan(response.data);
        } catch (err) {
            if (isNotFoundError(err)) {
                setNotFound(true);
                setPlan(null);
            } else {
                setError(err.message || 'Failed to load campus plan.');
            }
        } finally {
            setLoading(false);
        }
    }, [currentCampus, currentAcademicYear]);

    useEffect(() => {
        loadPlan();
    }, [loadPlan]);

    const handleCreate = async () => {
        setCreating(true);
        setError(null);
        try {
            await createCampusPlan(currentCampus, currentAcademicYear);
            await loadPlan();
        } catch (err) {
            setError(err.message || 'Failed to create campus plan.');
        } finally {
            setCreating(false);
        }
    };

    if (loading) {
        return (
            <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" minH="400px">
                <Spinner size="xl" color="teal.500" thickness="3px" />
                <Text mt={4} color="gray.600" fontSize="sm">Loading campus plan…</Text>
            </Box>
        );
    }

    if (error) {
        return (
            <Box p={8}>
                <Text color="red.500" fontSize="sm">Error: {error}</Text>
            </Box>
        );
    }

    if (notFound) {
        return (
            <Box maxW="1200px" mx="auto" p={6}>
                <Box bg="white" borderRadius="lg" p={6} boxShadow="sm" textAlign="center">
                    <Heading as="h1" size="lg" color="gray.800" mb={3}>
                        Campus Plan
                    </Heading>
                    <Text color="gray.600" mb={6}>
                        No plan exists yet for {currentCampus} in {currentAcademicYear}.
                    </Text>
                    <Button
                        colorScheme="teal"
                        onClick={handleCreate}
                        isLoading={creating}
                        loadingText="Creating…"
                    >
                        Create Campus Plan
                    </Button>
                </Box>
            </Box>
        );
    }

    if (!plan) return null;

    return (
        <Box maxW="1200px" mx="auto" p={6}>
            <VStack align="stretch" spacing={6}>
                <Box bg="white" borderRadius="lg" p={6} boxShadow="sm">
                    <Heading as="h1" size="lg" color="gray.800" mb={2}>
                        Campus Plan
                    </Heading>
                    <Text fontSize="sm" color="gray.600" mb={4}>
                        {plan.campus?.name || currentCampus} · {plan.academic_year} · <Text as="span" fontFamily="mono">{plan.plan_identifier}</Text>
                    </Text>
                    {plan.executive_summary && (
                        <Text color="gray.700" mb={4}>{plan.executive_summary}</Text>
                    )}

                    <Box mt={4}>
                        <Heading as="h3" size="xs" color="gray.700" mb={2} textTransform="uppercase" letterSpacing="wide">
                            Executive Sponsors
                        </Heading>
                        {plan.executive_sponsors.length === 0 ? (
                            <Text fontSize="sm" color="gray.500" fontStyle="italic">None assigned.</Text>
                        ) : (
                            <VStack align="stretch" spacing={1}>
                                {plan.executive_sponsors.map((person) => (
                                    <HStack key={person.unique_id} spacing={2}>
                                        <Text fontSize="sm" fontWeight="medium" color="gray.800">{person.name}</Text>
                                        {person.title && (
                                            <Text fontSize="sm" color="gray.500">— {person.title}</Text>
                                        )}
                                    </HStack>
                                ))}
                            </VStack>
                        )}
                    </Box>

                    <Box mt={4}>
                        <Heading as="h3" size="xs" color="gray.700" mb={2} textTransform="uppercase" letterSpacing="wide">
                            President's Report
                        </Heading>
                        {plan.presidents_report ? (
                            <Link
                                href={plan.presidents_report.uri_path || plan.presidents_report.file_path}
                                color="teal.600"
                                fontSize="sm"
                                isExternal
                            >
                                {plan.presidents_report.name || 'View report'}
                            </Link>
                        ) : (
                            <Text fontSize="sm" color="gray.500" fontStyle="italic">
                                No president's report yet.
                            </Text>
                        )}
                    </Box>
                </Box>

                <Box bg="white" borderRadius="lg" p={6} boxShadow="sm">
                    <Heading as="h2" size="md" color="gray.800" mb={4}>
                        Working Group Plans
                    </Heading>
                    <VStack align="stretch" spacing={3}>
                        {plan.working_group_plans.map((wgp) => (
                            <WorkingGroupPlan key={wgp.plan_identifier} wgp={wgp} />
                        ))}
                    </VStack>
                </Box>
            </VStack>
        </Box>
    );
}

export default CampusPlanContainer;
