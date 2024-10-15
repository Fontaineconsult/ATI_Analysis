import React from 'react';
import { Box, Heading, Text, Spinner } from '@chakra-ui/react';
import WorkingGroupMasterContainer from './ati_explorer_containers/WorkingGroupMasterContainer';
import { useData } from '../hooks/useData';
import { useLocation } from "react-router-dom";

function AtiExplorer() {
    const location = useLocation();
    const { data, loading, updating, error, selectedYear } = useData();  // Access data, loading, updating, and error states

    // Check if all data fields are null, indicating an empty state
    const isDataEmpty = !data.web && !data.instructionalMaterials && !data.procurement;

    // Render initial loading spinner when loading for the first time
    if (loading) {
        return (
            <Box maxW="1200px" mx="auto" p={4} textAlign="center">
                <Spinner size="xl" />
                <Text>Loading data for {selectedYear}...</Text>
            </Box>
        );
    }

    // Render fallback message when data is empty and loading is complete
    if (!loading && isDataEmpty) {
        return (
            <Box maxW="1200px" mx="auto" p={4}>
                <Heading as="h2" size="xl" mb={6} textAlign="center">
                    Data Not Available
                </Heading>
                <Text textAlign="center">
                    There is no data available for the selected year. Please select a different year.
                </Text>
            </Box>
        );
    }

    // Render error message if there was an error fetching data
    if (error) {
        return <Text color="red.500" textAlign="center">Error: {error}</Text>;
    }

    return (
        <Box maxW="1200px" mx="auto" p={4}>
            {location.pathname === '/ati-explorer' && <AtiExplorerLanding />}

            {/* Render the WorkingGroupMasterContainer */}
            <WorkingGroupMasterContainer />

            {/* Show a subtle spinner if background updates are happening */}
            {updating && (
                <Box textAlign="center" mt={4}>
                    <Spinner size="sm" />
                    <Text>Updating data in the background...</Text>
                </Box>
            )}
        </Box>
    );
}

function AtiExplorerLanding() {
    return (
        <Box maxW="1200px" mx="auto" p={4}>
            <Heading as="h2" size="xl" mb={6} textAlign="center">
                Welcome to the ATI Explorer
            </Heading>
            <Text textAlign="center">
                Select a year to view data for that academic year.
            </Text>
        </Box>
    );
}

export default AtiExplorer;
