import React from 'react';
import { Box, Spinner } from '@chakra-ui/react';
import { useData } from '../../hooks/useData';
import GoalNavigator from '../ati_explorer_containers/GoalNavigator';
import '../../styles/App.css';

/**
 * Dashboard view for a working group's goals (Web / Instructional Materials / Procurement).
 * The working-group selectors moved here from the ATI Explorer; the data is already loaded
 * app-wide by DataProvider, so this just gates on loading/empty and hands `data` to the shared
 * GoalNavigator (which reads :workingGroup / :goalId from the route).
 */
function WorkingGroupGoalsView() {
    const { data, loading, updating, error, selectedYear } = useData();

    const isDataEmpty = !data.web && !data.instructionalMaterials && !data.procurement;

    if (loading) {
        return (
            <Box className="centered-container">
                <Spinner size="xl" />
                <p className="ati-explorer-text">Loading data for {selectedYear}...</p>
            </Box>
        );
    }

    if (!loading && isDataEmpty) {
        return (
            <Box className="centered-container">
                <h2 className="ati-explorer-heading">Data Not Available</h2>
                <p className="ati-explorer-text">
                    There is no data available for the selected year. Please select a different year.
                </p>
            </Box>
        );
    }

    if (error) {
        return <p className="ati-explorer-text" style={{ color: 'red' }}>Error: {error}</p>;
    }

    return (
        <Box maxW="1400px" mx="auto" p={4}>
            <GoalNavigator data={data} />

            {updating && (
                <Box className="update-spinner">
                    <Spinner size="sm" />
                    <p className="ati-explorer-text">Updating data in the background...</p>
                </Box>
            )}
        </Box>
    );
}

export default WorkingGroupGoalsView;
