import React, { useContext } from 'react';
import { Box, Flex, Heading, Text, Button } from '@chakra-ui/react';
import DropdownSelect from '../../functional_components/DropdownSelect';
import { useStatusLevels } from '../../../hooks/useStatusLevels';
import { UserContext } from '../../../context/UserContext';
import {assignApprover} from "../../../services/api/put";
import {fetchPrimaryData} from "../../../services/api/get";
import {SettingsContext} from "../../../context/SettingsContext";  // Import UserContext



// SuccessIndicator Component
function SuccessIndicator({ indicatorData, evidenceData, workingGroup, onSuccessRefresh }) {
    const { statusLevels, updateStatus } = useStatusLevels();  // Access status levels and update function
    const { user } = useContext(UserContext);  // Access the current user from the context
    const { currentAcademicYear } = useContext(SettingsContext);  // Access the current year from SettingsContext
    const { success_indicator, date_added, composite_key } = indicatorData.properties;
    const { year_identifier } = evidenceData.evidence.properties;
    const { status_level } = evidenceData.statusLevel.properties;

    const adminReviewer = evidenceData.adminReviewers; // Access adminReviewer
    const currentUserId = user?.employee_id || null;  // Get current user's employee ID

    // Handle status level change
    const handleStatusChange = (newStatus) => {
        updateStatus(year_identifier, newStatus);  // Update status level via context
    };

    // Handle approve action and refresh
    const handleApprove = async () => {
        if (currentUserId) {
            try {
                // Assign the approver by hitting the backend API
                await assignApprover(currentUserId, year_identifier);

                // After assigning approver, refresh the data
                const refreshedData = await fetchPrimaryData(workingGroup, currentAcademicYear);
                onSuccessRefresh(refreshedData);  // Call parent function to refresh data
            } catch (error) {
                console.error('Error approving success indicator:', error);
            }
        }
    };

    // Determine button label and state based on adminReviewer
    let approveButtonText = 'Approve';
    let approveButtonColor = 'yellow';
    let isButtonDisabled = !user;  // Disable button if no user is logged in

    if (adminReviewer?.some((reviewer) => reviewer.properties.employee_id === currentUserId)) {
        approveButtonText = 'Approved';
        approveButtonColor = 'green';
        isButtonDisabled = true;  // Disable the button if already approved by the current user
    } else if (!user) {
        isButtonDisabled = true;  // Disable the button if there's no active user
    }

    return (
        <Box mb={4} p={4} border="1px solid teal" borderRadius="md" bg="gray.50">
            {/* Horizontal layout for indicator and status level */}
            <Flex justify="space-between" align="center" mb={2}>
                {/* Indicator Heading on the Left */}
                <Heading as="h6" size="sm">
                    Indicator: {composite_key}
                </Heading>

                {/* Status Level Dropdown and Approve Button on the Right */}
                <Flex align="center">
                    <DropdownSelect
                        options={statusLevels.map((level) => level.status_level)}  // Provide status levels as options
                        initialValue={status_level}  // Initial status level
                        onChange={handleStatusChange}  // Handle status change
                    />
                    {/* Approve Button */}
                    <Button
                        ml={4}
                        colorScheme={approveButtonColor}
                        onClick={handleApprove}
                        isDisabled={isButtonDisabled}  // Disable the button based on user and approval status
                    >
                        {approveButtonText}
                    </Button>
                </Flex>
            </Flex>

            {/* Indicator Details */}
            <Text><strong>Description:</strong> {success_indicator}</Text>
            <Text><strong>Date Added:</strong> {new Date(date_added).toLocaleDateString()}</Text>
        </Box>
    );
}

export default SuccessIndicator;
