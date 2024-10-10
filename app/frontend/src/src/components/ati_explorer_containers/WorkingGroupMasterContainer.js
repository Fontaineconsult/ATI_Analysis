import React from 'react';
import { Box, Heading, Spinner, Text } from '@chakra-ui/react';
import { useData } from '../../hooks/useData';  // Import the custom hook to fetch data

// Subcomponents for different data categories
import WebData from './WebData';
import InstructionalMaterialsData from './InstructionalMaterialsData';
import ProcurementData from './ProcurementData';


function WorkingGroupMasterContainer() {
    const { data, loading, error } = useData();  // Access data from context

    if (loading) return <Spinner size="xl" />;
    if (error) return <Text color="red.500">Error: {error}</Text>;

    return (
        <Box maxW="1200px" mx="auto" p={4}>
            <Heading as="h2" size="xl" mb={6} textAlign="center">
                Working Group Data Overview
            </Heading>

            {/* Render Web Data */}
            <WebData webData={data.web} />

            {/* Render Instructional Materials Data */}
            <InstructionalMaterialsData instructionalMaterialsData={data.instructionalMaterials} />

            {/* Render Procurement Data */}
            <ProcurementData procurementData={data.procurement} />
        </Box>
    );
}

export default WorkingGroupMasterContainer;
