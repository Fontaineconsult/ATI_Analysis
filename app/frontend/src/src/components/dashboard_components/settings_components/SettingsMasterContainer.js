import React, { useState } from 'react';
import { Box, Flex, Button, Heading, useBreakpointValue } from '@chakra-ui/react';
import Members from "./Members";
import SuccessIndicators from "./SuccessIndicators";
import StatusLevels from "./StatusLevelsControls";



function SettingsMasterContainer() {
    const [activeSetting, setActiveSetting] = useState('account'); // Manage the active setting

    // Function to render the appropriate content based on the active setting
    const renderContent = () => {
        switch (activeSetting) {
            case 'status-levels':
                return <StatusLevels />;
            case 'success-indicators':
                return <SuccessIndicators />;
            case 'members':
                return <Members />;
            default:
                return (
                    <Box>
                        <Heading size="md" mb={4}>Select a setting</Heading>
                        <p>Please choose a settings category from the left.</p>
                    </Box>
                );
        }
    };

    // Determine if the layout should be vertical based on screen size
    const isVertical = useBreakpointValue({ base: true, md: false });

    return (
        <Flex
            direction="column" // Stack elements vertically
            width="100%"
            minHeight="100vh" // Ensure the container covers at least the viewport height
            bg="gray.75" // Background color for the entire page
        >
            {/* Container with max width */}
            <Flex
                direction={isVertical ? 'column' : 'row'} // Column on small screens, row on larger

                width="100%"
                mx="0" // Remove horizontal margin
                p="0" // Remove padding around the container
                flex="1" // Allow the container to grow and fill available space
                >
                {/* Sidebar (Aside) */}
                <Box
                    as="aside"
                    width="200px" // Fixed width for sidebar
                    bg="white"
                    borderRight={isVertical ? 'none' : '1px solid #e2e8f0'} // Border only in horizontal layout
                    borderBottom={isVertical ? '1px solid #e2e8f0' : 'none'} // Border only in vertical layout
                    p={4} // Padding for the navigation box
                    mb={isVertical ? 4 : 0} // Margin bottom in vertical layout
                >
                    <Heading as="h4" size="sm" mb={4}>Settings</Heading> {/* Smaller heading */}
                    <Button
                        w="100%"
                        mb={2} // Space between buttons
                        onClick={() => setActiveSetting('status-levels')}
                        colorScheme={activeSetting === 'account' ? 'teal' : 'gray'}
                        variant={activeSetting === 'account' ? 'solid' : 'ghost'}
                        size="sm"
                    >
                        Status Levels
                    </Button>
                    <Button
                        w="100%"
                        mb={2} // Space between buttons
                        onClick={() => setActiveSetting('success-indicators')}
                        colorScheme={activeSetting === 'notifications' ? 'teal' : 'gray'}
                        variant={activeSetting === 'notifications' ? 'solid' : 'ghost'}
                        size="sm"
                    >
                        Success Indicators
                    </Button>
                    <Button
                        w="100%"
                        onClick={() => setActiveSetting('members')}
                        colorScheme={activeSetting === 'system' ? 'teal' : 'gray'}
                        variant={activeSetting === 'system' ? 'solid' : 'ghost'}
                        size="sm"
                    >
                        Members
                    </Button>
                </Box>

                {/* Main Content Area */}
                <Flex
                    flex="1" // Allow the main content to take up the remaining space
                    p={6} // Padding around the main content area
                    justifyContent="center" // Center the content horizontally within main area
                    alignItems="flex-start" // Align content to the top vertically
                    minW={"800px"} // Minimum width for the main content area
                >
                    <Box
                        bg="white"
                        border="1px solid #e2e8f0" // Subtle border around the main content
                        borderRadius="md" // Rounded corners for main content
                        boxShadow="sm" // Add a slight shadow to distinguish the content area
                        p={6} // Padding inside the main content box
                    >
                        {renderContent()}
                    </Box>
                </Flex>
            </Flex>
        </Flex>
    );
}

export default SettingsMasterContainer;
