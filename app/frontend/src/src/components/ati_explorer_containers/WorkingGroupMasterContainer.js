import React from 'react';
import { Box, Heading, Spinner, Text } from '@chakra-ui/react';
import { useData } from '../../hooks/useData';  // Import the custom hook to fetch data

// Subcomponents for different data categories
import WebData from './WebData';
import InstructionalMaterialsData from './InstructionalMaterialsData';
import ProcurementData from './ProcurementData';

function WorkingGroupMasterContainer() {
    const { data, loading, error } = useData();  // Access the data from DataContext

    // Show loading spinner while fetching data
    if (loading) return <Spinner size="xl" />;

    // Show error message if there was an issue fetching data
    if (error) return <Text color="red.500">Error: {error}</Text>;

    return (
        <Box maxW="1200px" mx="auto" p={4}>
            <Heading as="h2" size="xl" mb={6} textAlign="center">
                Working Group Data Overview
            </Heading>

            {/* Render Web Data subcomponent */}
            <WebData webData={data.web} />

            {/* Render Instructional Materials Data subcomponent */}
            <InstructionalMaterialsData instructionalData={data.instructionalMaterials} />

            {/* Render Procurement Data subcomponent */}
            <ProcurementData procurementData={data.procurement} />
        </Box>
    );
}

export default WorkingGroupMasterContainer;
