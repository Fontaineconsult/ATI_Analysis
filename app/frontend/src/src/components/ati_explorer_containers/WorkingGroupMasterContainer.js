import React, { useContext } from 'react';
import { Box, Spinner, Text } from '@chakra-ui/react';
import { Routes, Route } from 'react-router-dom';
import { DataContext } from "../../context/DataContext";
import GoalNavigator from './GoalNavigator';
import '../../styles/App.css';
import ImplementationMasterContainer from "../implementation_explorer/ImplementationMasterContainer";
import ImplementationTypeOverviewWrapper from "../implementation_explorer/ImplementationTypeOverviewWrapper";
import PlansAccomplishmentsManager from "../PlansAndAccomplishments/PlansAccomplishmentsManager";
import PeopleMasterContainer from "./PeopleMasterContainer";
import GovernanceArea from "./GovernanceArea";
import AssetsMasterContainer from "./AssetsMasterContainer";

function WorkingGroupMasterContainer() {
    const { data, loading, error } = useContext(DataContext);

    if (loading) return <Spinner size="xl" />;
    if (error) return <Text color="red.500">Error: {error}</Text>;

    return (
        <Box className="working-group-container">
            <Routes>
                <Route path=":workingGroup" element={<GoalNavigator data={data} />} />
                <Route path=":workingGroup/goal/:goalId" element={<GoalNavigator data={data} />} />

                {/* Implementation routes */}
                <Route
                    path="implementations/:implementationType/:implementationId"
                    element={<ImplementationMasterContainer />}
                />
                <Route
                    path="implementations/:implementationType"
                    element={<ImplementationMasterContainer />}
                />
                <Route
                    path="implementations"
                    element={<ImplementationMasterContainer />}
                />

                <Route path="plans" element={<PlansAccomplishmentsManager />} />
                <Route path="plans/:planId" element={<PlansAccomplishmentsManager />} />

                <Route path="people" element={<PeopleMasterContainer />} />

                {/* Governance area = Governance items + Principles (tabbed). URL-driven: the
                    route picks the active tab, and the optional selection param deep-links an
                    item (governance unique_id / principle handle). Same useParams+navigate
                    pattern as the implementations routes above. */}
                <Route path="governance" element={<GovernanceArea activeTab="governance" />} />
                <Route path="governance/:governanceId" element={<GovernanceArea activeTab="governance" />} />
                <Route path="principles" element={<GovernanceArea activeTab="principles" />} />
                <Route path="principles/:principleSlug" element={<GovernanceArea activeTab="principles" />} />

                <Route path="assets" element={<AssetsMasterContainer />} />
                <Route path="*" element={<Text>Please select a working group.</Text>} />
            </Routes>
        </Box>
    );
}

export default WorkingGroupMasterContainer;