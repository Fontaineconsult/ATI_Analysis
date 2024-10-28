import React from 'react';
import { Box, Heading } from '@chakra-ui/react';
import {Route, Routes} from "react-router-dom";
import ReportOverviewMasterContainer from "./dashboard_components/report_components/ReportOverviewMasterContainer";
import AtiOverview from "./dashboard_components/about_components/AtiOverview";


function About() {
    return (
        <Box maxW="800px" mx="auto" p={4} textAlign="center">
            <Routes>
                <Route path="sf-state-ati-overview" element={<AtiOverview />} />
                <Route path="" element={<p>Select a section from the dashboard.</p>} />
            </Routes>
        </Box>
    );
}

export default About;
