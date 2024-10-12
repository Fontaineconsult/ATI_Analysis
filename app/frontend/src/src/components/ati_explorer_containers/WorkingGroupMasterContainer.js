import React from 'react';
import { Box, Heading, Spinner, Text } from '@chakra-ui/react';
import { useLocation } from 'react-router-dom';  // Import useLocation to get the current path
import { useData } from '../../hooks/useData';  // Import the custom hook to fetch data

// Subcomponents for different data categories
import WebData from './WebData';
import InstructionalMaterialsData from './InstructionalMaterialsData';
import ProcurementData from './ProcurementData';

function WorkingGroupMasterContainer() {
    const { data, loading, error } = useData();  // Access data from context
    const location = useLocation();  // Get the current route path

    if (loading) return <Spinner size="xl" />;
    if (error) return <Text color="red.500">Error: {error}</Text>;

    return (
        <Box maxW="1200px" mx="auto" p={4}>
            {/* Conditionally render components based on the route */}
            {location.pathname === '/ati-explorer/web' && <WebData webData={data.web} />}
            {location.pathname === '/ati-explorer/instructional-materials' && (
                <InstructionalMaterialsData instructionalMaterialsData={data.instructionalMaterials} />
            )}
            {location.pathname === '/ati-explorer/procurement' && (
                <ProcurementData procurementData={data.procurement} />
            )}
        </Box>
    );
}

export default WorkingGroupMasterContainer;
