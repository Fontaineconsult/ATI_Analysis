import React, { useContext } from 'react';
import { Box, Flex, Heading, Text, Button } from '@chakra-ui/react';
import DropdownSelect from '../../functional_components/DropdownSelect';
import { useStatusLevels } from '../../../hooks/useStatusLevels';
import { UserContext } from '../../../context/UserContext';  // Import UserContext

// StatusLevel Component
function StatusLevel({ statusLevelDetails }) {
    return (
        <Box>
            <Text textAlign="right">
                <strong>Status Level:</strong> {statusLevelDetails.status_level}
            </Text>
        </Box>
    );
}

// SuccessIndicator Component
function SuccessIndicator({ indicatorData, evidenceData }) {
    const { statusLevels, updateStatus } = useStatusLevels();  // Access status levels and update function
    const { user } = useContext(UserContext);  // Access the current user from the context
    const { success_indicator, date_added, composite_key } = indicatorData.properties;
    const { year_identifier } = evidenceData.evidence.properties;
    const { status_level } = evidenceData.statusLevel.properties;

    const adminReviewer = evidenceData.adminReviewer; // Access adminReviewer
    const currentUserId = user?.employee_id || null;  // Get current user's employee ID

    // Handle status level change
    const handleStatusChange = (newStatus) => {
        updateStatus(year_identifier, newStatus);  // Update status level via context
    };

    // Handle approve action
    const handleApprove = () => {
        if (currentUserId) {
            // Call the backend API to set the current user as AdminReviewer
            // You should implement this in your API call logic
            console.log(`Setting ${currentUserId} as admin reviewer for ${year_identifier}`);
        }
    };

    // Determine button label and state based on adminReviewer
    let approveButtonText = 'Approve';
    let approveButtonColor = 'yellow';
    let isButtonDisabled = !user;  // Disable button if no user is logged in

    if (adminReviewer && adminReviewer.some((reviewer) => reviewer.employee_id === currentUserId)) {
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
