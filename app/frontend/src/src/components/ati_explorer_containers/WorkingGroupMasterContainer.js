import React, { useContext } from 'react';
import { Box, Spinner, Text } from '@chakra-ui/react';
import { Routes, Route } from 'react-router-dom';
import { DataContext } from "../../context/DataContext";
import GoalNavigator from './GoalNavigator';
import '../../styles/App.css';
import ImplementationMasterContainer from "../implementation_explorer/ImplementationMasterContainer";

function WorkingGroupMasterContainer() {
    const { data, loading, error } = useContext(DataContext);

    if (loading) return <Spinner size="xl" />;
    if (error) return <Text color="red.500">Error: {error}</Text>;

    return (
        <Box className="working-group-container">
            <Routes>
                <Route path=":workingGroup" element={<GoalNavigator data={data} />} />
                <Route path=":workingGroup/goal/:goalId" element={<GoalNavigator data={data} />} />
                <Route path="implementations" element={<ImplementationMasterContainer />} />
                <Route path="implementations/:implementationType" element={<ImplementationMasterContainer />} />
                <Route path="governance" element={<Text>This area will display the governance category</Text>} />
                <Route path="*" element={<Text>Please select a working group.</Text>} />
            </Routes>
        </Box>
    );
}

export default WorkingGroupMasterContainer;