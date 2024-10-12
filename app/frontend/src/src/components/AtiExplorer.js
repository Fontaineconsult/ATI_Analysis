import React from 'react';
import { Box, Heading, Text } from '@chakra-ui/react';
import WorkingGroupMasterContainer from './ati_explorer_containers/WorkingGroupMasterContainer';  // Import the container
import { useData } from '../hooks/useData';
import WebData from "./ati_explorer_containers/WebData";
import {useLocation} from "react-router-dom";


function AtiExplorer() {
    const location = useLocation();  // Get the current route path
    const { data, loading, error, selectedYear } = useData(); // Access data and selected year

    if (loading) return <Text>Loading data for {selectedYear}...</Text>;
    if (error) return <Text>Error: {error}</Text>;

    return (
        <Box maxW="1200px" mx="auto" p={4}>
            {location.pathname === '/ati-explorer' && <AtiExplorerLanding />}

            {/* Render the WorkingGroupMasterContainer inside ATI Explorer */}
            <WorkingGroupMasterContainer />
        </Box>
    );
}

function AtiExplorerLanding() {
    return (
        <Box maxW="1200px" mx="auto" p={4}>
            <Heading as="h2" size="xl" mb={6} textAlign="center">
                Welcome to the ATI Explorer
            </Heading>
            <Text>
                Select a year to view data for that academic year.
            </Text>
        </Box>
    );
}


export default AtiExplorer;
