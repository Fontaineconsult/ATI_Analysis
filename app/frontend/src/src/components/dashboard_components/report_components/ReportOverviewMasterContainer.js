// ReportOverviewMasterContainer.js
import React, { useState } from 'react';
import { Box, Heading, Spinner, Text, Button, ButtonGroup, VStack } from '@chakra-ui/react';
import { useData } from "../../../hooks/useData";
import WorkingGroupReportContainer from "./WorkingGroupReportContainer";
import { workingGroupsForYear } from "../../../styles/workingGroupIdentity";

function ReportOverviewMasterContainer() {
    const { data, loading, error, selectedYear } = useData();
    // Year-gated groups (com/gov) only offer a report when the selected year has
    // them; if the year switches away from a gated selection, fall back to the
    // first active group.
    const groups = workingGroupsForYear(selectedYear);
    const [selectedReport, setSelectedReport] = useState(groups[0].dataKey);
    const currentReport = groups.some((w) => w.dataKey === selectedReport)
        ? selectedReport
        : groups[0].dataKey;

    if (loading) {
        return (
            <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" minH="400px">
                <Spinner size="xl" color="teal.500" thickness="3px" />
                <Text mt={4} color="gray.600" fontSize="sm">Loading reports...</Text>
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

    return (
        <Box maxW="1200px" mx="auto" p={6}>
            <VStack align="stretch" spacing={6}>
                <Box bg="white" borderRadius="lg" p={6} boxShadow="sm">
                    <Heading as="h2" size="lg" color="gray.800" mb={4}>
                        Report Overview
                    </Heading>

                    <ButtonGroup size="sm" mb={6}>
                        {groups.map((w) => (
                            <Button
                                key={w.dataKey}
                                variant={currentReport === w.dataKey ? 'solid' : 'outline'}
                                colorScheme="teal"
                                onClick={() => setSelectedReport(w.dataKey)}
                            >
                                {w.name}
                            </Button>
                        ))}
                    </ButtonGroup>

                    {groups.map((w) => (
                        currentReport === w.dataKey && (
                            <WorkingGroupReportContainer key={w.dataKey} data={data[w.dataKey]} name={w.name} />
                        )
                    ))}
                </Box>
            </VStack>
        </Box>
    );
}

export default ReportOverviewMasterContainer;