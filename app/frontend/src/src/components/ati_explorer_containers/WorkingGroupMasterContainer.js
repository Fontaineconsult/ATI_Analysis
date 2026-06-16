import React, { useContext } from 'react';
import { Box, Spinner, Text } from '@chakra-ui/react';
import { Routes, Route } from 'react-router-dom';
import { DataContext } from "../../context/DataContext";
import '../../styles/App.css';
import ImplementationsArea from "../graph_components/implementation/ImplementationsArea";
import PlansAccomplishmentsManager from "../PlansAndAccomplishments/PlansAccomplishmentsManager";
import PeopleMasterContainer from "./PeopleMasterContainer";
import GovernanceArea from "./GovernanceArea";
import AssetsMasterContainer from "./AssetsMasterContainer";

function WorkingGroupMasterContainer() {
    const { loading, error } = useContext(DataContext);

    if (loading) return <Spinner size="xl" />;
    if (error) return <Text color="red.500">Error: {error}</Text>;

    return (
        <Box className="working-group-container">
            <Routes>
                {/* Implementation routes (canon area; deep-link :type/:id pre-selects) */}
                <Route
                    path="implementations/:implementationType/:implementationId"
                    element={<ImplementationsArea />}
                />
                <Route
                    path="implementations/:implementationType"
                    element={<ImplementationsArea />}
                />
                <Route
                    path="implementations"
                    element={<ImplementationsArea />}
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
                <Route path="assets/:assetTab" element={<AssetsMasterContainer />} />
                <Route path="assets/:assetTab/:itemId" element={<AssetsMasterContainer />} />
                <Route path="*" element={<Text>Please select a section.</Text>} />
            </Routes>
        </Box>
    );
}

export default WorkingGroupMasterContainer;