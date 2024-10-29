import React from 'react';
import { Box, Heading } from '@chakra-ui/react';
import { Routes, Route } from 'react-router-dom';
import ReportOverviewMasterContainer from './dashboard_components/report_components/ReportOverviewMasterContainer';
import ImplementationsMasterContainer from './dashboard_components/implementation_components/ImplementationsMasterContainer';
import SettingsMasterContainer from './dashboard_components/settings_components/SettingsMasterContainer';

// Main Dashboard component containing route-based subcomponents
function Dashboard() {
    return (
        <Box className="dashboard-container" maxW="1200px" mx="auto" p={4} textAlign="center">
            <Heading as="h2" size="lg" mb={4}>
                Dashboard
            </Heading>
            <Routes>
                <Route path="report-overview" element={<ReportOverviewMasterContainer />} />
                <Route path="implementations" element={<ImplementationsMasterContainer />} />
                <Route path="settings" element={<SettingsMasterContainer />} />
                <Route path="/" element={<p>Select a section from the dashboard.</p>} />
            </Routes>
        </Box>
    );
}

export default Dashboard;
