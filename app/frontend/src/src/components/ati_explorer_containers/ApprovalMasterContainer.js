import React, { useContext, useState } from 'react';
import { Box, Button, Text, Spinner, useToast, Heading, Alert, AlertIcon, VStack, HStack, Divider, Tooltip } from '@chakra-ui/react';
import { UserContext } from '../../context/UserContext';
import { assignApprover } from '../../services/api/put';
import { GenerateReportComponent } from '../../services/report_constructor';
import StatusLevelDetails from "../graph_components/indicators/StatusLevelDetails";
import { DataContext } from '../../context/DataContext';
import { useSettings } from "../../context/SettingsContext";
import SingleReportMasterContainer from "../dashboard_components/report_components/SingleReportMasterContainer";
import AdminSummaryForm from "../dashboard_components/report_components/AdminSummaryForm";
import AdminFeedbackForm from "../dashboard_components/report_components/AdminFeedbackForm";

function ApprovalMasterContainer({
                                     evidenceData: propEvidenceData,
                                     workingGroup: propWorkingGroup,
                                     goalNumber: propGoalNumber,
                                     indicatorNumber: propIndicatorNumber
                                 }) {
    const { user } = useContext(UserContext);
    const { data, loadSingleWorkingGroupData } = useContext(DataContext);
    const [loading, setLoading] = useState(false);
    const { currentWorkingGroup } = useSettings();
    const toast = useToast();

    // Get evidence data - either from direct prop or by looking it up
    const getEvidenceData = () => {
        // If evidenceData is provided directly, use it
        if (propEvidenceData) {
            return propEvidenceData;
        }

        // Otherwise, require all three params to look it up
        if (!propWorkingGroup || !propGoalNumber || !propIndicatorNumber) {
            return null;
        }

        const getWorkingGroupData = () => {
            switch(propWorkingGroup) {
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
        if (!workingGroupData) return null;

        // Find the specific goal by goal_number
        const specificGoal = workingGroupData.goals?.find(g =>
            g.goal?.properties?.goal_number === parseInt(propGoalNumber)
        );
        if (!specificGoal) return null;

        // Find the specific indicator
        // The indicator number is embedded in the composite_key (e.g., "7.6-web")
        const specificIndicator = specificGoal.indicators?.find(ind => {
            const compositeKey = ind.indicator?.properties?.composite_key;
            if (!compositeKey) return false;

            // Parse composite key format: "7.6-web" where 7 is goal number and 6 is indicator number
            const parts = compositeKey.split('-')[0].split('.');
            if (parts.length < 2) return false;

            const indicatorNum = parseInt(parts[1]);
            return indicatorNum === parseInt(propIndicatorNumber);
        });

        if (!specificIndicator) return null;

        // Get the first evidence item (most recent year)
        const evidence = specificIndicator.evidences?.[0];
        if (!evidence) return null;

        // Return the complete evidence object with all its properties
        return evidence;
    };

    const evidenceData = getEvidenceData();

    // Local state for tracking admin review description
    const [adminDescription, setAdminDescription] = useState(
        evidenceData?.evidence?.properties?.admin_review_description || "No Review"
    );

    if (!evidenceData) {
        return (
            <Box p={4}>
                <Alert status="warning">
                    <AlertIcon />
                    Evidence data not found. Provide either evidenceData or workingGroup, goalNumber, and indicatorNumber.
                </Alert>
            </Box>
        );
    }

    const { year_identifier, administrative_review_complete } = evidenceData.evidence.properties;
    const currentUserId = user?.employee_id;
    const isApproved = administrative_review_complete === true;

    const handleApprove = async () => {
        if (!currentUserId || isApproved) return;

        setLoading(true);
        try {
            await assignApprover(currentUserId, year_identifier);
            await loadSingleWorkingGroupData(currentWorkingGroup);

            toast({
                title: "Approval Successful",
                description: "The success indicator has been approved",
                status: "success",
                duration: 5000,
                isClosable: true,
            });
        } catch (error) {
            console.error('Approval failed:', error);
            toast({
                title: "Approval Failed",
                description: "There was an issue with approving the success indicator.",
                status: "error",
                duration: 5000,
                isClosable: true,
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box
            bg="white"
            borderRadius="lg"
            borderWidth="1px"
            borderColor="gray.200"
            boxShadow="sm"
            p={6}
        >
            {/* Header Section */}
            <VStack align="stretch" spacing={4} mb={6}>
                <Heading as="h3" size="lg" color="gray.800">
                    Administrative Review
                </Heading>
                <Box
                    bg="teal.50"
                    borderLeft="3px solid"
                    borderLeftColor="teal.400"
                    p={4}
                    borderRadius="md"
                >
                    <Text fontSize="sm" color="gray.700" mb={2}>
                        <strong>Academic Year:</strong> {year_identifier}
                    </Text>
                    <Text fontSize="sm" color="gray.600">
                        By approving this indicator, you are confirming that the evidence provided meets the required standards.
                    </Text>
                </Box>
            </VStack>

            {/* Status Level Section */}
            <Box mb={6}>
                <StatusLevelDetails statusDetails={evidenceData.statusLevel.properties} />
            </Box>

            <Divider borderColor="gray.200" my={6} />

            {/* Evidence Summary Section */}
            <Box mb={6}>
                <Heading as="h4" size="md" color="teal.700" mb={4}>
                    Evidence Summary
                </Heading>

                <VStack align="stretch" spacing={4}>
                    {/* Admin Review Description Form */}
                    <AdminSummaryForm
                        yearIdentifier={year_identifier}
                        currentValue={adminDescription}
                        onUpdate={(newDescription) => {
                            setAdminDescription(newDescription);
                            loadSingleWorkingGroupData(currentWorkingGroup);
                        }}
                    />

                    {/* Admin Reviewer Notes Form */}
                    <AdminFeedbackForm
                        yearIdentifier={year_identifier}
                        adminReviewNotes={evidenceData.adminReviewNotes || []}
                        onUpdate={() => {
                            loadSingleWorkingGroupData(currentWorkingGroup);
                        }}
                    />

                    {/* Admin Review Status */}
                    <Box
                        p={4}
                        bg={evidenceData.evidence?.properties?.administrative_review_complete ? "green.50" : "orange.50"}
                        borderRadius="lg"
                        borderWidth="1px"
                        borderColor={evidenceData.evidence?.properties?.administrative_review_complete ? "green.200" : "orange.200"}
                    >
                        <Text fontSize="xs" fontWeight="semibold" color="gray.600" textTransform="uppercase" mb={2}>
                            Review Status
                        </Text>
                        <HStack spacing={2}>
                            <Text
                                fontSize="sm"
                                fontWeight="bold"
                                color={evidenceData.evidence?.properties?.administrative_review_complete ? "green.600" : "orange.600"}
                            >
                                {evidenceData.evidence?.properties?.administrative_review_complete ? "✓ Review Complete" : "⏳ Review Pending"}
                            </Text>
                        </HStack>
                    </Box>
                </VStack>
            </Box>

            <Divider borderColor="gray.200" my={6} />

            {/* Report Output Section */}
            <Box mb={6}>
                <Heading as="h4" size="md" color="teal.700" mb={4}>
                    Report Output
                </Heading>
                <Box
                    p={4}
                    bg="gray.50"
                    borderWidth="1px"
                    borderColor="teal.300"
                    borderRadius="lg"
                    maxHeight="500px"
                    overflowY="auto"
                >
                    {propEvidenceData ? (
                        <GenerateReportComponent evidenceItem={evidenceData} />
                    ) : (
                        <SingleReportMasterContainer
                            workingGroup={propWorkingGroup}
                            goalNumber={propGoalNumber}
                            indicatorNumber={propIndicatorNumber}
                        />
                    )}
                </Box>
            </Box>

            {/* Approval Action */}
            <HStack justify="flex-end" pt={4}>
                {loading ? (
                    <Spinner size="lg" color="teal.500" thickness="3px" />
                ) : (
                    <Tooltip
                        label={
                            !currentUserId
                                ? "Please select a user to approve this indicator"
                                : isApproved
                                    ? "This indicator has already been approved"
                                    : "Click to approve this indicator"
                        }
                        placement="top"
                        hasArrow
                    >
                        <Button
                            colorScheme={isApproved ? "green" : "teal"}
                            size="md"
                            onClick={handleApprove}
                            isDisabled={isApproved || !currentUserId}
                            boxShadow="sm"
                            _hover={!isApproved && currentUserId ? { boxShadow: "md" } : {}}
                            transition="box-shadow 0.2s"
                            leftIcon={isApproved ? <Text>✓</Text> : null}
                        >
                            {isApproved ? "Approved" : "Approve Indicator"}
                        </Button>
                    </Tooltip>
                )}
            </HStack>
        </Box>
    );
}

export default ApprovalMasterContainer;