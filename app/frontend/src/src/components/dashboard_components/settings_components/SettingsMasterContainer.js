import React, { useState } from 'react';
import {
    Box,
    Flex,
    Button,
    Heading,
    VStack,
    Text,
    useBreakpointValue
} from '@chakra-ui/react';
import Members from "./Members";
import SuccessIndicators from "./SuccessIndicators";
import StatusLevels from "./StatusLevelsControls";

function SettingsMasterContainer() {
    const [activeSetting, setActiveSetting] = useState('members');
    const isSmallScreen = useBreakpointValue({ base: true, lg: false });

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
                    <Box p={6}>
                        <Heading size="md" mb={4} color="gray.800">
                            Select a setting
                        </Heading>
                        <Text color="gray.600">
                            Please choose a settings category from the left.
                        </Text>
                    </Box>
                );
        }
    };

    const menuItems = [
        { id: 'members', label: 'Members' },
        { id: 'status-levels', label: 'Status Levels' },
        { id: 'success-indicators', label: 'Success Indicators' },
    ];

    return (
        <Flex
            h="calc(100vh - 64px)"
            bg="gray.50"
            direction={isSmallScreen ? "column" : "row"}
        >
            {/* Sidebar */}
            <Box
                w={isSmallScreen ? "100%" : "240px"}
                bg="white"
                borderRightWidth={isSmallScreen ? "0" : "1px"}
                borderBottomWidth={isSmallScreen ? "1px" : "0"}
                borderColor="gray.200"
                flexShrink={0}
            >
                <Box p={4}>
                    <Heading
                        size="sm"
                        mb={4}
                        color="gray.700"
                        textTransform="uppercase"
                        fontSize="xs"
                        fontWeight="semibold"
                        letterSpacing="wider"
                    >
                        Settings
                    </Heading>
                    <VStack spacing={1} align="stretch">
                        {menuItems.map((item) => (
                            <Button
                                key={item.id}
                                onClick={() => setActiveSetting(item.id)}
                                variant="ghost"
                                justifyContent="flex-start"
                                size="sm"
                                fontWeight={activeSetting === item.id ? "semibold" : "normal"}
                                bg={activeSetting === item.id ? "teal.50" : "transparent"}
                                color={activeSetting === item.id ? "teal.700" : "gray.600"}
                                borderLeftWidth="3px"
                                borderLeftColor={activeSetting === item.id ? "teal.500" : "transparent"}
                                borderRadius="0"
                                _hover={{
                                    bg: activeSetting === item.id ? "teal.50" : "gray.50",
                                    color: activeSetting === item.id ? "teal.700" : "gray.700"
                                }}
                                px={3}
                                py={2}
                                transition="all 0.2s"
                            >
                                {item.label}
                            </Button>
                        ))}
                    </VStack>
                </Box>
            </Box>

            {/* Main Content Area */}
            <Box
                flex={1}
                overflow="auto"
                bg="gray.50"
            >
                <Box
                    maxW="1400px"
                    mx="auto"
                    p={6}
                    w="100%"
                >
                    {renderContent()}
                </Box>
            </Box>
        </Flex>
    );
}

export default SettingsMasterContainer;