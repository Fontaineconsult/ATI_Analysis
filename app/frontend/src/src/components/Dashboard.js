import React, { useEffect } from 'react';
import { Box, Heading } from '@chakra-ui/react';
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import ReportOverviewMasterContainer from './dashboard_components/report_components/ReportOverviewMasterContainer';
import ImplementationsMasterContainer from './dashboard_components/implementation_components/ImplementationsMasterContainer';
import SettingsMasterContainer from './dashboard_components/settings_components/SettingsMasterContainer';
import SingleReportMasterContainer from "./dashboard_components/report_components/SingleReportMasterContainer";
import ReportMasterList from "./dashboard_components/report_components/ReportMasterList";
import ImplementationTypeOverviewWrapper from './implementation_explorer/ImplementationTypeOverviewWrapper';
import PlansAccomplishmentsManager from "./PlansAndAccomplishments/PlansAccomplishmentsManager";

// Main Dashboard component containing route-based subcomponents
function Dashboard() {
    const location = useLocation();
    const navigate = useNavigate();

    // Redirect from /dashboard to /dashboard/reports
    useEffect(() => {
        if (location.pathname === '/dashboard' || location.pathname === '/dashboard/') {
            navigate('/dashboard/reports', { replace: true });
        }
    }, [location.pathname, navigate]);

    return (
        <Box className="dashboard-container" ml={0} mx="auto" p={4} textAlign="center">
            <Routes>
                <Route path="report-overview" element={<ReportOverviewMasterContainer />} />
                <Route
                    path="reports/:workingGroup/:goalNumber/:indicatorNumber"
                    element={<SingleReportMasterContainer />}
                />
                <Route
                    path="reports"
                    element={<ReportMasterList />}
                />

                {/* Implementation routes */}
                <Route path="implementations" element={<ImplementationsMasterContainer />} />
                <Route
                    path="implementations/:implementationType/:implementationId"
                    element={<ImplementationsMasterContainer />}
                />
                <Route path="plans" element={<PlansAccomplishmentsManager />} />


                <Route
                    path="implementations/:implementationType"
                    element={<ImplementationsMasterContainer />}
                />

                <Route path="settings" element={<SettingsMasterContainer />} />
                <Route path="/" element={<ReportMasterList />} />

            </Routes>
        </Box>
    );
}

export default Dashboard;