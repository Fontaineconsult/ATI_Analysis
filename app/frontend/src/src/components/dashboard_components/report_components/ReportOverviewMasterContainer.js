// ReportOverviewMasterContainer.js
import React, { useState } from 'react';
import { Box, Heading, Spinner, Text, Button, ButtonGroup, VStack } from '@chakra-ui/react';
import { useData } from "../../../hooks/useData";
import WorkingGroupReportContainer from "./WorkingGroupReportContainer";
import { WORKING_GROUP_LIST } from "../../../styles/workingGroupIdentity";

function ReportOverviewMasterContainer() {
    const { data, loading, error } = useData();
    const [selectedReport, setSelectedReport] = useState(WORKING_GROUP_LIST[0]?.dataKey || 'web');

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
                    <Heading as="h1" size="lg" color="gray.800" mb={4}>
                        Report Overview
                    </Heading>

                    <ButtonGroup size="sm" mb={6}>
                        {WORKING_GROUP_LIST.map((wg) => (
                            <Button
                                key={wg.dataKey}
                                variant={selectedReport === wg.dataKey ? 'solid' : 'outline'}
                                colorScheme="teal"
                                onClick={() => setSelectedReport(wg.dataKey)}
                            >
                                {wg.name}
                            </Button>
                        ))}
                    </ButtonGroup>

                    {WORKING_GROUP_LIST.map((wg) => (
                        selectedReport === wg.dataKey && (
                            <WorkingGroupReportContainer key={wg.dataKey} data={data[wg.dataKey]} name={wg.name} />
                        )
                    ))}
                </Box>
            </VStack>
        </Box>
    );
}

export default ReportOverviewMasterContainer;