import React, { useContext } from 'react';
import { useParams } from 'react-router-dom';
import { DataContext } from "../../../context/DataContext";
import { Spinner, Text, Box, Alert, AlertIcon } from "@chakra-ui/react";
import {GenerateReportComponent} from "../../../services/report_constructor";
import {SettingsContext} from "../../../context/SettingsContext";


const SingleReportMasterContainer = ({ workingGroup: propWorkingGroup,
                                         goalNumber: propGoalNumber,
                                         indicatorNumber: propIndicatorNumber }) => {
    const { data, loading, error } = useContext(DataContext);
    const { currentAcademicYear } = useContext(SettingsContext);
    const { workingGroup: urlWorkingGroup, goalNumber: urlGoalNumber, indicatorNumber: urlIndicatorNumber } = useParams();

    // Use props if provided, otherwise fall back to URL params
    const workingGroup = propWorkingGroup || urlWorkingGroup;
    const goalNumber = propGoalNumber || urlGoalNumber;
    const indicatorNumber = propIndicatorNumber || urlIndicatorNumber;

    if (loading) {
        return (
            <Box className="single-report-container" p={4}>
                <Spinner size="xl" />
                <Text mt={2}>Loading report...</Text>
            </Box>
        );
    }

    if (error) {
        return (
            <Box className="single-report-container" p={4}>
                <Alert status="error">
                    <AlertIcon />
                    Error: {error}
                </Alert>
            </Box>
        );
    }

    // Get the appropriate data based on working group
    const getWorkingGroupData = () => {
        switch(workingGroup) {
            case 'web':
                return data.web;
            case 'instructional-materials':
                return data.instructionalMaterials;
            case 'procurement':
                return data.procurement;
            default:
                return null;
        }
    };

    const workingGroupData = getWorkingGroupData();

    if (!workingGroupData) {
        return (
            <Box className="single-report-container" p={4}>
                <Alert status="warning">
                    <AlertIcon />
                    Working group "{workingGroup}" not found
                </Alert>
            </Box>
        );
    }

    // Find the specific goal by goal_number
    const specificGoal = workingGroupData.goals?.find(g =>
        g.goal?.properties?.goal_number === parseInt(goalNumber)
    );

    if (!specificGoal) {
        return (
            <Box className="single-report-container" p={4}>
                <Alert status="warning">
                    <AlertIcon />
                    Goal {goalNumber} not found in {workingGroupData.workingGroup}
                </Alert>
            </Box>
        );
    }

    // Find the specific indicator
    const specificIndicator = specificGoal.indicators?.find(ind => {
        // Extract the indicator number from composite_key (e.g., "1.2-ins" -> 2)
        const compositeKey = ind.indicator?.properties?.composite_key;
        if (!compositeKey) return false;

        const parts = compositeKey.split('-')[0].split('.');
        const indicatorNum = parseInt(parts[1]);
        return indicatorNum === parseInt(indicatorNumber);
    });

    if (!specificIndicator) {
        return (
            <Box className="single-report-container" p={4}>
                <Alert status="warning">
                    <AlertIcon />
                    Success Indicator {indicatorNumber} not found in Goal {goalNumber}
                </Alert>
            </Box>
        );
    }

    // Find the evidence data for the indicator
    // The structure shows evidences is an array with evidence items
    const evidenceItem = specificIndicator.evidences?.[0] || {};

    // Prepare the data structure that GenerateReportComponent expects
    const reportData = {
        indicator: specificIndicator.indicator,
        evidence: evidenceItem.evidence,
        statusLevel: evidenceItem.statusLevel,
        persons: evidenceItem.persons || [],
        adminReviewers: evidenceItem.adminReviewers || [],
        has_notes: evidenceItem.has_notes || [],
        has_messages: evidenceItem.has_messages || [],
        has_metrics: evidenceItem.has_metrics || [],
        evidenceTypes: evidenceItem.evidenceTypes || [],
        plans: evidenceItem.plans || [],
        accomplishments: evidenceItem.accomplishments || [],
        currentAcademicYear: currentAcademicYear

    };

    return (
        <Box className="single-report-container">
            <GenerateReportComponent evidenceItem={reportData} />
        </Box>
    );
};

export default SingleReportMasterContainer;