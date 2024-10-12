import React, { useContext } from 'react';
import { Box, Flex, Heading, Text, Button } from '@chakra-ui/react';
import DropdownSelect from '../../functional_components/DropdownSelect';
import { useStatusLevels } from '../../../hooks/useStatusLevels';
import { UserContext } from '../../../context/UserContext';
import { assignApprover } from '../../../services/api/put';
import { fetchPrimaryData } from '../../../services/api/get';
import { SettingsContext } from '../../../context/SettingsContext';
import ImplementationMasterContainer from "../implementation/ImplementationMasterContainer";

// Main SuccessIndicator Component
function SuccessIndicator({ indicatorData, evidenceData, workingGroup, onSuccessRefresh }) {
    const { statusLevels, updateStatus } = useStatusLevels();  // Access status levels and update function
    const { user } = useContext(UserContext);  // Access the current user from the context
    const { currentAcademicYear } = useContext(SettingsContext);  // Access the current year from SettingsContext

    // Destructure properties from indicatorData and evidenceData
    const { success_indicator, date_added, composite_key } = indicatorData.properties;
    const { year_identifier } = evidenceData.evidence.properties;
    const { status_level } = evidenceData.statusLevel.properties;

    const adminReviewers = evidenceData.adminReviewers; // Access adminReviewers (note the plural)
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

    // Determine button label and state based on adminReviewers
    let approveButtonText = 'Approve';
    let approveButtonColor = 'yellow';
    let isButtonDisabled = !user;  // Disable button if no user is logged in

    if (adminReviewers?.some((reviewer) => reviewer.properties.employee_id === currentUserId)) {
        approveButtonText = 'Approved';
        approveButtonColor = 'green';
        isButtonDisabled = true;  // Disable the button if already approved by the current user
    }

    return (
        <Box as={"section"} mb={4} p={4} border="1px solid teal" borderRadius="md" bg="gray.50" aria-label={`Indicator: ${composite_key}`} >
            <IndicatorHeader
                compositeKey={composite_key}
                statusLevels={statusLevels}
                statusLevel={status_level}
                onStatusChange={handleStatusChange}
                approveButtonText={approveButtonText}
                approveButtonColor={approveButtonColor}
                isButtonDisabled={isButtonDisabled}
                onApprove={handleApprove}
            />
            <IndicatorDetails
                description={success_indicator}
                dateAdded={date_added}
            />
            <ImplementationMasterContainer evidenceData={evidenceData} />
        </Box>
    );
}

// IndicatorHeader Component
function IndicatorHeader({
                             compositeKey,
                             statusLevels,
                             statusLevel,
                             onStatusChange,
                             approveButtonText,
                             approveButtonColor,
                             isButtonDisabled,
                             onApprove,
                         }) {
    return (
        <Flex justify="space-between" align="center" mb={2}>
            {/* Indicator Heading on the Left */}
            <Heading as="h6" size="sm">
                Indicator: {compositeKey}
            </Heading>

            {/* Status Level Dropdown and Approve Button on the Right */}
            <Flex align="center">
                <DropdownSelect
                    options={statusLevels.map((level) => level.status_level)}  // Provide status levels as options
                    initialValue={statusLevel}  // Initial status level
                    onChange={onStatusChange}  // Handle status change
                />
                {/* Approve Button */}
                <Button
                    ml={4}
                    colorScheme={approveButtonColor}
                    onClick={onApprove}
                    isDisabled={isButtonDisabled}  // Disable the button based on user and approval status
                >
                    {approveButtonText}
                </Button>
            </Flex>
        </Flex>
    );
}

// IndicatorDetails Component
function IndicatorDetails({ description, dateAdded }) {
    return (
        <>
            <Text><strong>Description:</strong> {description}</Text>
            <Text><strong>Date Added:</strong> {new Date(dateAdded).toLocaleDateString()}</Text>
        </>
    );
}

export default SuccessIndicator;
