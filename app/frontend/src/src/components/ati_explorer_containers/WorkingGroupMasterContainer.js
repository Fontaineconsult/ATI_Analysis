import React, { useContext } from 'react';
import { Box, Spinner, Text } from '@chakra-ui/react';
import { Routes, Route } from 'react-router-dom';
import { DataContext } from "../../context/DataContext";
import GoalNavigator from './GoalNavigator';
import '../../styles/App.css';

function WorkingGroupMasterContainer() {
    const { data, loading, error } = useContext(DataContext);

    if (loading) return <Spinner size="xl" />;
    if (error) return <Text color="red.500">Error: {error}</Text>;

    return (
        <Box className="working-group-container">
            <Routes>
                {/* Routes for each working group with optional goal */}
                <Route path=":workingGroup" element={<GoalNavigator data={data} />} />
                <Route path=":workingGroup/goal/:goalId" element={<GoalNavigator data={data} />} />

                {/* Fallback Route */}
                <Route path="*" element={<Text className="fallback-text">Please select a working group.</Text>} />
            </Routes>
        </Box>
    );
}

export default WorkingGroupMasterContainer;