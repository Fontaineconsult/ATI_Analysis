import React, { useEffect } from 'react';
import { Box, Heading } from '@chakra-ui/react';
import { Routes, Route, useLocation, useNavigate, useParams } from 'react-router-dom';
import ReportOverviewMasterContainer from './dashboard_components/report_components/ReportOverviewMasterContainer';
import ImplementationsMasterContainer from './dashboard_components/implementation_components/ImplementationsMasterContainer';
import SettingsMasterContainer from './dashboard_components/settings_components/SettingsMasterContainer';
import SingleReportMasterContainer from "./dashboard_components/report_components/SingleReportMasterContainer";
import ReportMasterList from "./dashboard_components/report_components/ReportMasterList";
import ImplementationTypeOverviewWrapper from './implementation_explorer/ImplementationTypeOverviewWrapper';
import PlansAccomplishmentsManager from "./PlansAndAccomplishments/PlansAccomplishmentsManager";
import CampusPlanContainer from "./dashboard_components/campus_plan_components/CampusPlanContainer";
import WorkingGroupGoalsView from "./dashboard_components/WorkingGroupGoalsView";

// Main Dashboard component containing route-based subcomponents
function Dashboard() {
    const location = useLocation();
    const navigate = useNavigate();
    const { campus } = useParams();

    // Redirect from /campus/dashboard to /campus/dashboard/reports
    useEffect(() => {
        const dashBase = `/${campus}/dashboard`;
        if (location.pathname === dashBase || location.pathname === `${dashBase}/`) {
            navigate(`${dashBase}/reports`, { replace: true });
        }
    }, [location.pathname, navigate, campus]);

    return (
        <Box className="dashboard-container" ml={0} mx="auto" p={4} textAlign="center">
            <Routes>
                {/* Working-group goal views (moved here from the ATI Explorer). The literal
                    `goal` segment keeps this from clashing with implementations/:type/:id. */}
                <Route path=":workingGroup/goal/:goalId" element={<WorkingGroupGoalsView />} />
                <Route path=":workingGroup/goal/:goalId/:indicatorNumber" element={<WorkingGroupGoalsView />} />

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
                <Route path="plans/:planId" element={<PlansAccomplishmentsManager />} />


                <Route
                    path="implementations/:implementationType"
                    element={<ImplementationsMasterContainer />}
                />

                <Route path="campus-plan" element={<CampusPlanContainer />} />

                <Route path="settings" element={<SettingsMasterContainer />} />
                <Route path="settings/:section" element={<SettingsMasterContainer />} />
                <Route path="/" element={<ReportMasterList />} />

            </Routes>
        </Box>
    );
}

export default Dashboard;