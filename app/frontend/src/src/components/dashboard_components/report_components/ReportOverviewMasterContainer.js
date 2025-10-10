// ReportOverviewMasterContainer.js
import React, { useState } from 'react';
import { Box, Heading, Spinner, Text, Button, ButtonGroup, VStack } from '@chakra-ui/react';
import { useData } from "../../../hooks/useData";
import ProcurementReportContainer from "./ProcurementReportContainer";
import WebReportContainer from "./WebReportContainer";
import InstructionalMaterialsReportContainer from "./InstructionalMaterialsReportContainer";

function ReportOverviewMasterContainer() {
    const { data, loading, error } = useData();
    const [selectedReport, setSelectedReport] = useState('web');

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
                        <Button
                            variant={selectedReport === 'web' ? 'solid' : 'outline'}
                            colorScheme="teal"
                            onClick={() => setSelectedReport('web')}
                        >
                            Web
                        </Button>
                        <Button
                            variant={selectedReport === 'instructionalMaterials' ? 'solid' : 'outline'}
                            colorScheme="teal"
                            onClick={() => setSelectedReport('instructionalMaterials')}
                        >
                            Instructional Materials
                        </Button>
                        <Button
                            variant={selectedReport === 'procurement' ? 'solid' : 'outline'}
                            colorScheme="teal"
                            onClick={() => setSelectedReport('procurement')}
                        >
                            Procurement
                        </Button>
                    </ButtonGroup>

                    {selectedReport === 'web' && <WebReportContainer webData={data.web} />}
                    {selectedReport === 'instructionalMaterials' &&
                        <InstructionalMaterialsReportContainer instructionalMaterialsData={data.instructionalMaterials}/>
                    }
                    {selectedReport === 'procurement' && <ProcurementReportContainer procurementData={data.procurement} />}
                </Box>
            </VStack>
        </Box>
    );
}

export default ReportOverviewMasterContainer;