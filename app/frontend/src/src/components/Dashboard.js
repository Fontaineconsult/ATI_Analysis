import React from 'react';
import { Box, Heading } from '@chakra-ui/react';
import { Routes, Route } from 'react-router-dom';
import ReportOverviewMasterContainer from './dashboard_components/report_components/ReportOverviewMasterContainer';
import ImplementationsMasterContainer from './dashboard_components/implementation_components/ImplementationsMasterContainer';
import SettingsMasterContainer from './dashboard_components/settings_components/SettingsMasterContainer';

function Dashboard() {
    return (
        <Box maxW="1400px" mx="0" p={4} textAlign="center">
            <Routes>
                <Route path="report-overview" element={<ReportOverviewMasterContainer />} />
                <Route path="implementations" element={<ImplementationsMasterContainer />} />
                <Route path="settings" element={<SettingsMasterContainer />} />
                <Route path="" element={<p>Select a section from the dashboard.</p>} />
            </Routes>
        </Box>
    );
}

export default Dashboard;
