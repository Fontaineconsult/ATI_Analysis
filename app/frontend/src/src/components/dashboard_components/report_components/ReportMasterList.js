import React, { useContext, useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { DataContext } from "../../../context/DataContext";
import {
    Box,
    Table,
    Thead,
    Tbody,
    Tr,
    Th,
    Td,
    Button,
    Heading,
    VStack,
    Badge,
    Spinner,
    Alert,
    AlertIcon,
    Text,
    Divider,
    HStack,
    Icon,
    Tooltip,
    Flex,
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalCloseButton,
    useDisclosure,
    useToast,
    IconButton
} from "@chakra-ui/react";
import {
    TrendingUp,
    TrendingDown,
    Minus,
    HelpCircle,
    Copy
} from "lucide-react";
import {getStatusColor} from "../../../services/utils/tools";
import AtiStats from "./atistats";
import StatusLevels from "./StatusLevelDefs";
import Members from "./members";
import ApprovalMasterContainer from "../../ati_explorer_containers/ApprovalMasterContainer";


const ReportMasterList = () => {
    const { data, loading, error } = useContext(DataContext);
    const navigate = useNavigate();
    const location = useLocation();
    const { campus } = useParams();
    const { isOpen, onOpen, onClose } = useDisclosure();
    const toast = useToast();

    // Ref to store table row elements
    const rowRefs = useRef({});

    // State for modal context
    const [approvalContext, setApprovalContext] = useState({
        workingGroup: null,
        goalNumber: null,
        indicatorNumber: null
    });

    // Hash-based navigation effect
    useEffect(() => {
        if (location.hash && data) {
            // Remove the # from the hash
            const hash = location.hash.substring(1);

            // Wait for DOM to be ready
            const timer = setTimeout(() => {
                const targetRow = rowRefs.current[hash];
                if (targetRow) {
                    // Scroll to the target row
                    targetRow.scrollIntoView({ behavior: 'smooth', block: 'center' });

                    // Add highlight class
                    targetRow.classList.add('highlight-row');

                    // Remove highlight after 30 seconds
                    setTimeout(() => {
                        targetRow.classList.remove('highlight-row');
                    }, 30000);
                }
            }, 100);

            return () => clearTimeout(timer);
        }
    }, [location.hash, data]);

    // Function to open approval modal with context
    const openApprovalModal = (workingGroup, goalNumber, indicatorNumber) => {
        setApprovalContext({
            workingGroup,
            goalNumber,
            indicatorNumber
        });
        onOpen();
    };

    // Helper function to get trend data for a specific indicator
    const getTrendForIndicator = (compositeKey) => {
        if (!data?.yoyTrends) return null;

        const yearIdentifier = `${data.selectedYear || '2024-2025'}-${compositeKey}`;

        for (const [workingGroup, indicators] of Object.entries(data.yoyTrends)) {
            if (Array.isArray(indicators)) {
                const trendData = indicators.find(item =>
                    item.evidence_year_identifier === yearIdentifier ||
                    item.evidence_year_identifier?.endsWith(`-${compositeKey}`)
                );
                if (trendData) {
                    return trendData;
                }
            }
        }
        return null;
    };

    // Helper function to render trend icon and badge
    const renderTrendIndicator = (compositeKey) => {
        const trendData = getTrendForIndicator(compositeKey);

        if (!trendData) {
            return (
                <Tooltip label="No trend data available" placement="top">
                    <Box display="inline-flex" alignItems="center" justifyContent="center">
                        <Icon as={HelpCircle} color="gray.400" boxSize={3} />
                    </Box>
                </Tooltip>
            );
        }

        const { trend, past_value, current_value } = trendData;

        let icon, color, label;

        switch(trend) {
            case 'improving':
                icon = TrendingUp;
                color = 'green.500';
                label = `Improving (${past_value ?? 'N/A'} → ${current_value})`;
                break;
            case 'declining':
                icon = TrendingDown;
                color = 'red.500';
                label = `Declining (${past_value} → ${current_value})`;
                break;
            case 'static':
            default:
                icon = Minus;
                color = 'gray.500';
                label = `Static (${current_value})`;
                break;
        }

        return (
            <Tooltip label={label} placement="top">
                <Box display="inline-flex" alignItems="center" justifyContent="center">
                    <Icon as={icon} color={color} boxSize={4} />
                </Box>
            </Tooltip>
        );
    };

    // Helper function to get View URL from composite key
    const getUrlFromCompositeKey = (compositeKey) => {
        const [numbers, suffix] = compositeKey.split('-');
        const [goalNumber, indicatorNumber] = numbers.split('.');

        const workingGroupMap = {
            'web': 'web',
            'pro': 'procurement',
            'ins': 'instructional-materials'
        };

        const workingGroupSegment = workingGroupMap[suffix] || suffix;
        return `${workingGroupSegment}/${goalNumber}/${indicatorNumber}`;
    };

    // Helper function to get Edit URL for ATI Explorer
    const getEditUrlFromCompositeKey = (compositeKey) => {
        const [numbers, suffix] = compositeKey.split('-');
        const [goalNumber, indicatorNumber] = numbers.split('.');

        const workingGroupMap = {
            'web': 'web',
            'pro': 'procurement',
            'ins': 'instructional-materials'
        };

        const workingGroupSegment = workingGroupMap[suffix] || suffix;
        return `/ati-explorer/${workingGroupSegment}/goal/${goalNumber}#${compositeKey}`;
    };

    // Function to generate HTML for copying goal group to clipboard
    const generateGoalHTML = (goal, workingGroupName) => {
        const baseUrl = window.location.origin;
        const goalNumber = goal.goal?.properties?.goal_number;
        const goalName = goal.goal?.properties?.name;

        if (!goal.indicators || goal.indicators.length === 0) {
            return `<p>No indicators available for Goal ${goalNumber}: ${goalName}</p>`;
        }

        const sortedIndicators = [...goal.indicators].sort((a, b) => {
            const aNum = parseInt(a.indicator?.properties?.composite_key?.split('-')[0]?.split('.')[1] || 0);
            const bNum = parseInt(b.indicator?.properties?.composite_key?.split('-')[0]?.split('.')[1] || 0);
            return aNum - bNum;
        });

        // Start HTML
        let html = `<div style="font-family: Arial, sans-serif;">`;
        html += `<h3 style="color: #2C7A7B; margin-bottom: 10px;">Goal ${goalNumber}: ${goalName}</h3>`;
        html += `<table style="border-collapse: collapse; width: 100%; margin-bottom: 20px; font-size: 12px;">`;
        html += `<thead>`;
        html += `<tr style="background-color: #F7FAFC; border-bottom: 2px solid #E2E8F0;">`;
        html += `<th style="padding: 8px; text-align: left; font-weight: 600; color: #4A5568;">ID</th>`;
        html += `<th style="padding: 8px; text-align: left; font-weight: 600; color: #4A5568;">Description</th>`;
        html += `<th style="padding: 8px; text-align: left; font-weight: 600; color: #4A5568;">View</th>`;
        html += `<th style="padding: 8px; text-align: left; font-weight: 600; color: #4A5568;">Direct Link</th>`;
        html += `</tr>`;
        html += `</thead>`;
        html += `<tbody>`;

        sortedIndicators.forEach((indicator) => {
            const compositeKey = indicator.indicator?.properties?.composite_key;
            const indicatorNumber = compositeKey?.split('-')[0]?.split('.')[1];
            const description = indicator.indicator?.properties?.success_indicator || '';

            // Generate View URL
            const [numbers, suffix] = compositeKey.split('-');
            const [gNum, iNum] = numbers.split('.');
            const workingGroupMap = {
                'web': 'web',
                'pro': 'procurement',
                'ins': 'instructional-materials'
            };
            const workingGroupSegment = workingGroupMap[suffix] || suffix;
            const viewUrl = `${baseUrl}/ati/dashboard/reports/${workingGroupSegment}/${gNum}/${iNum}`;

            // Generate Direct Link (with hash)
            const directLinkUrl = `${baseUrl}/ati/dashboard/reports#${compositeKey}`;

            html += `<tr style="border-bottom: 1px solid #E2E8F0;">`;
            html += `<td style="padding: 8px; color: #2D3748;">${goalNumber}.${indicatorNumber}</td>`;
            html += `<td style="padding: 8px; color: #2D3748;">${description}</td>`;
            html += `<td style="padding: 8px;"><a href="${viewUrl}" style="color: #319795; text-decoration: none;">View Report</a></td>`;
            html += `<td style="padding: 8px;"><a href="${directLinkUrl}" style="color: #319795; text-decoration: none;">Direct Link</a></td>`;
            html += `</tr>`;
        });

        html += `</tbody>`;
        html += `</table>`;
        html += `</div>`;

        return html;
    };

    // Function to copy goal group to clipboard
    const copyGoalToClipboard = async (goal, workingGroupName) => {
        try {
            const html = generateGoalHTML(goal, workingGroupName);
            const plainText = `Goal ${goal.goal?.properties?.goal_number}: ${goal.goal?.properties?.name}\n\n` +
                goal.indicators.map((indicator) => {
                    const compositeKey = indicator.indicator?.properties?.composite_key;
                    const indicatorNumber = compositeKey?.split('-')[0]?.split('.')[1];
                    const description = indicator.indicator?.properties?.success_indicator || '';
                    return `${goal.goal?.properties?.goal_number}.${indicatorNumber} - ${description}`;
                }).join('\n');

            // Create ClipboardItem with both HTML and plain text
            const blob = new Blob([html], { type: 'text/html' });
            const textBlob = new Blob([plainText], { type: 'text/plain' });
            const clipboardItem = new ClipboardItem({
                'text/html': blob,
                'text/plain': textBlob
            });

            await navigator.clipboard.write([clipboardItem]);

            toast({
                title: 'Copied to clipboard',
                description: `Goal ${goal.goal?.properties?.goal_number} copied as HTML`,
                status: 'success',
                duration: 3000,
                isClosable: true,
                position: 'top'
            });
        } catch (error) {
            console.error('Failed to copy:', error);
            toast({
                title: 'Copy failed',
                description: 'Unable to copy to clipboard',
                status: 'error',
                duration: 3000,
                isClosable: true,
                position: 'top'
            });
        }
    };

    // Function to render a table for a single goal
    const renderGoalTable = (goal, workingGroupName) => {
        if (!goal.indicators || goal.indicators.length === 0) {
            return (
                <Box key={goal.goal?.id} mb={6}>
                    <Heading size="sm" color="gray.700" mb={2}>
                        Goal {goal.goal?.properties?.goal_number}: {goal.goal?.properties?.name}
                    </Heading>
                    <Text color="gray.500" fontSize="sm">No indicators available for this goal.</Text>
                </Box>
            );
        }

        const sortedIndicators = [...goal.indicators].sort((a, b) => {
            const aNum = parseInt(a.indicator?.properties?.composite_key?.split('-')[0]?.split('.')[1] || 0);
            const bNum = parseInt(b.indicator?.properties?.composite_key?.split('-')[0]?.split('.')[1] || 0);
            return aNum - bNum;
        });

        return (
            <Box
                key={goal.goal?.id}
                mb={6}
                borderWidth="1px"
                borderColor="gray.200"
                borderRadius="lg"
                p={4}
                bg="white"
                boxShadow="sm"
                _hover={{ boxShadow: "md" }}
                transition="box-shadow 0.2s"
            >
                <VStack align="stretch" spacing={3}>
                    <HStack justify="space-between" align="start">
                        <Box flex="1">
                            <Heading as="h4" size="sm" color="gray.700" mb={2}>
                                Goal {goal.goal?.properties?.goal_number}: {goal.goal?.properties?.name}
                            </Heading>
                            <Text fontSize="xs" color="gray.600">
                                {goal.goal?.properties?.goal}
                            </Text>
                        </Box>
                        <Tooltip label="Copy goal group as HTML" placement="top">
                            <IconButton
                                icon={<Icon as={Copy} />}
                                size="sm"
                                colorScheme="teal"
                                variant="ghost"
                                aria-label="Copy goal to clipboard"
                                onClick={() => copyGoalToClipboard(goal, workingGroupName)}
                            />
                        </Tooltip>
                    </HStack>

                    <Box overflowX="auto">
                        <Table variant="simple" size="sm">
                            <Thead>
                                <Tr bg="gray.50">
                                    <Th width="8%" color="gray.600" fontWeight="semibold" fontSize="xs">ID</Th>
                                    <Th width="50%" color="gray.600" fontWeight="semibold" fontSize="xs">Description</Th>
                                    <Th width="15%" color="gray.600" fontWeight="semibold" fontSize="xs">Status</Th>
                                    <Th width="7%" color="gray.600" fontWeight="semibold" fontSize="xs">Trend</Th>
                                    <Th width="20%" color="gray.600" fontWeight="semibold" fontSize="xs">Actions</Th>
                                </Tr>
                            </Thead>
                            <Tbody>
                                {sortedIndicators.map((indicator) => {
                                    const compositeKey = indicator.indicator?.properties?.composite_key;
                                    const indicatorNumber = compositeKey?.split('-')[0]?.split('.')[1];
                                    const statusLevel = indicator.evidences?.[0]?.statusLevel?.properties?.status_level;

                                    // Check for admin reviewers and evidence summary
                                    const adminReviewers = indicator.evidences?.[0]?.adminReviewers || [];
                                    const hasReviewers = adminReviewers.length > 0;

                                    // Check if evidence summary exists and has valid content
                                    const evidenceSummary = indicator.evidences?.[0]?.evidence?.properties?.admin_review_description;
                                    const hasSummary = evidenceSummary &&
                                        evidenceSummary !== "No Review" &&
                                        evidenceSummary !== "None" &&
                                        evidenceSummary.trim() !== "";

                                    // Button logic: gray if approved, yellow if no summary, green if has summary
                                    const approveButtonText = hasReviewers ? 'Approved' : 'Approve';
                                    const approveButtonColor = hasReviewers ? 'gray' : (hasSummary ? 'green' : 'yellow');
                                    const isButtonDisabled = hasReviewers;

                                    return (
                                        <Tr
                                            key={indicator.indicator?.id}
                                            _hover={{ bg: "gray.50" }}
                                            ref={(el) => {
                                                if (el && compositeKey) {
                                                    rowRefs.current[compositeKey] = el;
                                                }
                                            }}
                                            id={compositeKey}
                                        >
                                            <Td fontWeight="medium" color="gray.700" fontSize="xs">{indicatorNumber}</Td>
                                            <Td color="gray.700" fontSize="xs">{indicator.indicator?.properties?.success_indicator}</Td>
                                            <Td>
                                                <Badge
                                                    bg={getStatusColor(statusLevel)}
                                                    color="white"
                                                    fontSize="xs"
                                                    px={2}
                                                    py={1}
                                                    borderRadius="md"
                                                >
                                                    {statusLevel || 'Not Started'}
                                                </Badge>
                                            </Td>
                                            <Td textAlign="center">
                                                {renderTrendIndicator(compositeKey)}
                                            </Td>
                                            <Td>
                                                <HStack spacing={2}>
                                                    <Button
                                                        size="xs"
                                                        colorScheme="teal"
                                                        variant="solid"
                                                        onClick={() => {
                                                            const urlSegment = getUrlFromCompositeKey(compositeKey);
                                                            navigate(`/${campus}/dashboard/reports/${urlSegment}`);
                                                        }}
                                                        _hover={{ bg: "teal.600" }}
                                                    >
                                                        View
                                                    </Button>
                                                    <Button
                                                        size="xs"
                                                        colorScheme="gray"
                                                        variant="outline"
                                                        onClick={() => {
                                                            const editUrl = getEditUrlFromCompositeKey(compositeKey, campus);
                                                            const [pathname, hash] = editUrl.split('#');

                                                            navigate(pathname + '#' + hash);

                                                            setTimeout(() => {
                                                                if (hash) {
                                                                    const element = document.getElementById(hash);
                                                                    if (element) {
                                                                        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                                                    } else {
                                                                        setTimeout(() => {
                                                                            const retryElement = document.getElementById(hash);
                                                                            if (retryElement) {
                                                                                retryElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                                                            }
                                                                        }, 500);
                                                                    }
                                                                }
                                                            }, 100);
                                                        }}
                                                        _hover={{ bg: "gray.50" }}
                                                    >
                                                        Edit
                                                    </Button>
                                                    <Tooltip
                                                        label={!hasReviewers && !hasSummary ? "Summary Needed" : ""}
                                                        placement="top"
                                                        hasArrow
                                                    >
                                                        <Button
                                                            size="xs"
                                                            colorScheme={approveButtonColor}
                                                            variant="solid"
                                                            isDisabled={isButtonDisabled}
                                                            onClick={() => {
                                                                if (!isButtonDisabled) {
                                                                    const workingGroupKey = workingGroupName === "Web" ? "web" :
                                                                        workingGroupName === "Procurement" ? "procurement" :
                                                                            "instructional-materials";
                                                                    const goalNum = goal.goal?.properties?.goal_number;
                                                                    const indicatorNum = indicatorNumber;

                                                                    openApprovalModal(workingGroupKey, goalNum, indicatorNum);
                                                                }
                                                            }}
                                                            _hover={!isButtonDisabled ? { bg: `${approveButtonColor}.600` } : {}}
                                                        >
                                                            {approveButtonText}
                                                        </Button>
                                                    </Tooltip>
                                                </HStack>
                                            </Td>
                                        </Tr>
                                    );
                                })}
                            </Tbody>
                        </Table>
                    </Box>
                </VStack>
            </Box>
        );
    };

    // Function to render all goals for a working group
    const renderWorkingGroup = (workingGroupData, workingGroupName) => {
        const getAnchorId = (name) => {
            const idMap = {
                'Web': 'web-section',
                'Procurement': 'procurement-section',
                'Instructional Materials': 'instructional-materials-section'
            };
            return idMap[name] || name.toLowerCase().replace(/\s+/g, '-') + '-section';
        };

        if (!workingGroupData?.goals || workingGroupData.goals.length === 0) {
            return (
                <Box key={workingGroupName} mb={8} id={getAnchorId(workingGroupName)}>
                    <Heading as="h3" size="md" color="teal.700" mb={4}>
                        {workingGroupData?.workingGroup || workingGroupName}
                    </Heading>
                    <Text color="gray.500" fontSize="sm">No goals available for this working group.</Text>
                </Box>
            );
        }

        return (
            <Box key={workingGroupName} mb={8} id={getAnchorId(workingGroupName)}>
                <Heading as="h3" size="md" color="teal.700" mb={4}>
                    {workingGroupData.workingGroup}
                </Heading>
                <VStack align="stretch" spacing={4}>
                    {workingGroupData.goals
                        .sort((a, b) => (a.goal?.properties?.goal_number || 0) - (b.goal?.properties?.goal_number || 0))
                        .map((goal) => renderGoalTable(goal, workingGroupName))}
                </VStack>
            </Box>
        );
    };

    if (loading) {
        return (
            <Box p={8} display="flex" flexDirection="column" alignItems="center" justifyContent="center" minH="400px">
                <Spinner size="xl" color="teal.500" thickness="3px" />
                <Text mt={4} color="gray.600" fontSize="sm">Loading reports...</Text>
            </Box>
        );
    }

    if (error) {
        return (
            <Box p={8}>
                <Alert status="error" borderRadius="lg" fontSize="sm">
                    <AlertIcon />
                    Error loading data: {error}
                </Alert>
            </Box>
        );
    }

    if (!data) {
        return (
            <Box p={8}>
                <Alert status="warning" borderRadius="lg" fontSize="sm">
                    <AlertIcon />
                    No data available
                </Alert>
            </Box>
        );
    }

    return (
        <Box w="100%" p={4}>
            <style>
                {`
                    @keyframes highlight-fade {
                        0% {
                            background-color: rgba(49, 130, 206, 0.3);
                        }
                        100% {
                            background-color: transparent;
                        }
                    }

                    .highlight-row {
                        animation: highlight-fade 30s ease-out;
                    }
                `}
            </style>
            <Flex gap={6} w="100%">
                {/* Main Content - 75% width */}
                <Box
                    flex="3"
                    minW="0"
                    bg="white"
                    borderRadius="lg"
                    p={6}
                    boxShadow="sm"
                >
                    <Heading as="h2" size="lg" color="gray.800" mb={6}>
                        ATI Success Indicators Report
                    </Heading>

                    {/* Web Working Group */}

                    {data.web && renderWorkingGroup(data.web, 'Web')}
                    {data.web && data.procurement && <Divider my={6} borderColor="gray.200" />}

                    {/* Procurement Working Group */}
                    {data.procurement && renderWorkingGroup(data.procurement, 'Procurement')}
                    {data.procurement && data.instructionalMaterials && <Divider my={6} borderColor="gray.200" />}

                    {/* Instructional Materials Working Group */}
                    {data.instructionalMaterials && renderWorkingGroup(data.instructionalMaterials, 'Instructional Materials')}
                </Box>

                {/* Supporting Information Column - 25% width */}
                <Box
                    flex="2"
                    minW="0"
                    display={{ base: "none", xl: "block" }}
                >
                    <VStack spacing={4} top={6}>
                        <Box
                            bg="white"
                            borderRadius="lg"
                            p={4}
                            boxShadow="sm"
                            w="100%"
                        >
                            <Heading as="h2" size="md" color="gray.800" mb={4}>
                                Supporting Information
                            </Heading>
                            <VStack spacing={4} align="stretch">
                                <AtiStats/>
                                <StatusLevels/>
                                <Members/>
                            </VStack>
                        </Box>
                    </VStack>
                </Box>
            </Flex>

            {/* Approval Modal */}
            <Modal isOpen={isOpen} onClose={onClose} size="xl" isCentered scrollBehavior="inside">
                <ModalOverlay />
                <ModalContent
                    maxW="900px"
                    w="calc(100% - 32px)"
                    maxH="calc(100vh - 80px)"
                    overflow="hidden"
                    borderRadius="md"
                >
                    <ModalHeader>
                        Approve Success Indicator
                    </ModalHeader>
                    <ModalCloseButton />
                    <ModalBody pb={6} overflowY="auto" maxH="calc(100vh - 200px)">
                        <ApprovalMasterContainer
                            workingGroup={approvalContext.workingGroup}
                            goalNumber={approvalContext.goalNumber}
                            indicatorNumber={approvalContext.indicatorNumber}
                        />
                    </ModalBody>
                </ModalContent>
            </Modal>
        </Box>
    );
};

export default ReportMasterList;
