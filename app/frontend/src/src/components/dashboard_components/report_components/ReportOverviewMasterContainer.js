import React, { useState } from 'react';
import { Box, Heading, Spinner, Text, Button, ButtonGroup } from '@chakra-ui/react';
import { useData } from "../../../hooks/useData";

import ProcurementReportContainer from "./ProcurementReportContainer";
import WebReportContainer from "./WebReportContainer";
import InstructionalMaterialsReportContainer from "./InstructionalMaterialsReportContainer";

function ReportOverviewMasterContainer() {
    const { data, loading, error } = useData();  // Access data from context
    const [selectedReport, setSelectedReport] = useState('web');  // State to manage selected report

    if (loading) return <Spinner size="xl" />;
    if (error) return <Text color="red.500">Error: {error}</Text>;

    return (
        <Box maxW="800px" mx="auto" p={4}>
            <Heading as="h3" size="lg" mb={4}>
                Report Overview
            </Heading>

            {/* Button group to switch between reports */}
            <ButtonGroup mb={4} isAttached>
                <Button
                    colorScheme={selectedReport === 'web' ? 'blue' : 'gray'}
                    onClick={() => setSelectedReport('web')}
                >
                    Web
                </Button>
                <Button
                    colorScheme={selectedReport === 'instructionalMaterials' ? 'blue' : 'gray'}
                    onClick={() => setSelectedReport('instructionalMaterials')}
                >
                    Instructional Materials
                </Button>
                <Button
                    colorScheme={selectedReport === 'procurement' ? 'blue' : 'gray'}
                    onClick={() => setSelectedReport('procurement')}
                >
                    Procurement
                </Button>
            </ButtonGroup>

            {/* Conditionally render the report container based on selection */}
            {selectedReport === 'web' && <WebReportContainer webData={data.web} />}
            {selectedReport === 'instructionalMaterials' && <InstructionalMaterialsReportContainer instructionalMaterialsData={data.instructionalMaterials}/>}
            {selectedReport === 'procurement' && <ProcurementReportContainer procurementData={data.procurement} />}
        </Box>
    );
}

export default ReportOverviewMasterContainer;
