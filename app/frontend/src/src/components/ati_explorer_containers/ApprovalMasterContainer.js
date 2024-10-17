import React, { useContext, useState } from 'react';
import { Box, Button, Text, Spinner, useToast, Heading } from '@chakra-ui/react';
import { UserContext } from '../../context/UserContext';
import { assignApprover } from '../../services/api/put';
import { GenerateReportComponent } from '../../services/report_constructor';
import StatusLevelDetails from "../graph_components/indicators/StatusLevelDetails";
import { DataContext } from '../../context/DataContext';
import {useSettings} from "../../context/SettingsContext";  // Import the DataContext

// ApprovalMasterContainer component
function ApprovalMasterContainer({ evidenceData }) {
    const { user } = useContext(UserContext);  // Get the current user
    const { loadSingleWorkingGroupData } = useContext(DataContext);  // Access the data context
    const [loading, setLoading] = useState(false);  // Loading state
    const { currentWorkingGroup } = useSettings();
    const toast = useToast();  // Toast for notifications

    const { year_identifier } = evidenceData.evidence.properties;  // Extract the year identifier
    const currentUserId = user?.employee_id;  // Get the current user's employee ID

    // Handle the approval action
    const handleApprove = async () => {
        if (!currentUserId) return;  // Exit if no user

        setLoading(true);
        try {
            await assignApprover(currentUserId, year_identifier);

            // Trigger refresh or success handler for the current working group
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
        <Box textAlign="left" p={4} bg="gray.50" borderRadius="md" border="1px solid" borderColor="gray.200">
            <Text mb={4}>
                Approve success indicator for the academic year: <strong>{year_identifier}</strong>
            </Text>
            <Text mb={4}>
                By approving this indicator, you are confirming that the evidence provided meets the required standards.
            </Text>

            {/* Status Details Here */}
            <StatusLevelDetails statusDetails={evidenceData.statusLevel.properties} />  {/* Pass statusDetails directly */}

            <Heading as="h5" size="md" mb={4}>Report Output</Heading>
            <Box mb={4} p={4} bg="white" border="1px solid teal" borderRadius="md" maxHeight="400px" overflowY="auto">
                <GenerateReportComponent evidenceItem={evidenceData} />  {/* Pass evidenceData directly */}
            </Box>

            {loading ? (
                <Spinner size="lg" />
            ) : (
                <Button colorScheme="teal" onClick={handleApprove}>
                    Approve
                </Button>
            )}
        </Box>
    );
}

export default ApprovalMasterContainer;
