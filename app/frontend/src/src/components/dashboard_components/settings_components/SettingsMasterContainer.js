import React, { useState } from 'react';
import { Box, Flex, Button, Heading, useBreakpointValue } from '@chakra-ui/react';
import Members from "./Members";
import SuccessIndicators from "./SuccessIndicators";
import StatusLevels from "./StatusLevelsControls";
import '../../../styles/App.css';

function SettingsMasterContainer() {
    const [activeSetting, setActiveSetting] = useState('account');

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

    const isVertical = useBreakpointValue({ base: true, md: false });

    return (
        <Flex className="settings-container">
            <Flex className={`settings-content ${isVertical ? 'vertical' : ''}`}>
                <Box as="aside" className={`settings-sidebar ${isVertical ? 'vertical' : ''}`}>
                    <Heading as="h4">Settings</Heading>
                    <Button
                        onClick={() => setActiveSetting('status-levels')}
                        className={`settings-button ${activeSetting === 'status-levels' ? 'active' : 'inactive'}`}
                    >
                        Status Levels
                    </Button>
                    <Button
                        onClick={() => setActiveSetting('success-indicators')}
                        className={`settings-button ${activeSetting === 'success-indicators' ? 'active' : 'inactive'}`}
                    >
                        Success Indicators
                    </Button>
                    <Button
                        onClick={() => setActiveSetting('members')}
                        className={`settings-button ${activeSetting === 'members' ? 'active' : 'inactive'}`}
                    >
                        Members
                    </Button>
                </Box>

                <Flex className="settings-main">
                    <Box className="settings-box">
                        {renderContent()}
                    </Box>
                </Flex>
            </Flex>
        </Flex>
    );
}

export default SettingsMasterContainer;
