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
import GovernanceMasterContainer from "./GovernanceMasterContainer";
import AssetsMasterContainer from "./AssetsMasterContainer";
import SchemaElementMasterContainer from "./SchemaElementMasterContainer";
import PrincipleMasterContainer from "./PrincipleMasterContainer";

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

                <Route path="governance" element={<GovernanceMasterContainer />} />

                {/* Meta-scaffold — URL-driven selection (optional :handle param). A handle is one
                    path segment containing ':' / '.' (e.g. 'label:Tool', 'field:Asset.scope',
                    'principle:closest-to-capacity'); navigate() encodeURIComponent-encodes it and
                    useParams() decodes it back, so a plain `:handle` param is correct. */}
                <Route path="schema-elements" element={<SchemaElementMasterContainer />} />
                <Route path="schema-elements/:handle" element={<SchemaElementMasterContainer />} />
                <Route path="principles" element={<PrincipleMasterContainer />} />
                <Route path="principles/:handle" element={<PrincipleMasterContainer />} />

                <Route path="assets" element={<AssetsMasterContainer />} />
                <Route path="*" element={<Text>Please select a working group.</Text>} />
            </Routes>
        </Box>
    );
}

export default WorkingGroupMasterContainer;