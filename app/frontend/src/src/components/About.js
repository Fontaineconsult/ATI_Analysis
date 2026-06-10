import React from 'react';
import { Box } from '@chakra-ui/react';
import { Navigate, Route, Routes } from 'react-router-dom';
import OverviewTab from './dashboard_components/about_components/OverviewTab';
import CoreModelTab from './dashboard_components/about_components/CoreModelTab';
import EvidenceImplementationsTab from './dashboard_components/about_components/EvidenceImplementationsTab';
import PlansProgressTab from './dashboard_components/about_components/PlansProgressTab';
import AssetsInterfacesTab from './dashboard_components/about_components/AssetsInterfacesTab';
import AddingDataTab from './dashboard_components/about_components/AddingDataTab';
import GlossaryTab from './dashboard_components/about_components/GlossaryTab';

function About() {
    return (
        <Box maxW="1000px" mx="auto" p={4}>
            <Routes>
                <Route path="overview" element={<OverviewTab />} />
                <Route path="core-model" element={<CoreModelTab />} />
                <Route path="evidence" element={<EvidenceImplementationsTab />} />
                <Route path="plans" element={<PlansProgressTab />} />
                <Route path="assets" element={<AssetsInterfacesTab />} />
                <Route path="adding-data" element={<AddingDataTab />} />
                <Route path="glossary" element={<GlossaryTab />} />
                {/* Legacy path from the original single-page About */}
                <Route path="sf-state-ati-overview" element={<Navigate to="../overview" replace />} />
                <Route path="" element={<Navigate to="overview" replace />} />
            </Routes>
        </Box>
    );
}

export default About;
