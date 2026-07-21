import React, { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
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
    Text,
    Divider,
    HStack,
    Icon,
    Tooltip,
    IconButton,
    useToast,
} from '@chakra-ui/react';
import { TrendingUp, TrendingDown, Minus, HelpCircle, Copy } from 'lucide-react';
import { navigateToIndicator } from '../../../services/utils/tools';
import { getStatusColor, getStatusBackgroundColor, getStatusTextColor } from '../../../services/utils/statusColors';
import { getIndicatorSummary } from '../../graph_components/indicators/indicatorHelpers';
import ViewReportButton from '../../functional_components/ViewReportButton';
import { findTrendForIndicator } from './reportMetrics';

/*
 * The "ATI Success Indicators Report" tables — the per-working-group goal tables that make
 * up the bottom of the View Reports landing. Extracted verbatim from ReportMasterList so the
 * landing shell stays thin; behaviour is preserved (View / Edit / Approve, YoY trend icons,
 * hash-deep-link scroll + highlight, copy-goal-to-clipboard). The only visual change is
 * goal-card headings moving to the SFBRN brand accent (teal.700) per the canon.
 *
 * Props:
 *   data              DataContext data (web / procurement / instructionalMaterials trees + yoyTrends)
 *   campus            current campus abbreviation
 *   navigate          react-router navigate (for Edit)
 *   openApprovalModal (workingGroup, goalNumber, indicatorNumber) => void — opens the parent's modal
 */
const SuccessIndicatorReportTables = ({ data, campus, navigate, openApprovalModal }) => {
    const location = useLocation();
    const toast = useToast();

    // Ref to store table row elements for hash-based deep linking.
    const rowRefs = useRef({});

    // Hash-based navigation: scroll to and briefly highlight the targeted indicator row.
    useEffect(() => {
        if (location.hash && data) {
            const hash = location.hash.substring(1);
            const timer = setTimeout(() => {
                const targetRow = rowRefs.current[hash];
                if (targetRow) {
                    targetRow.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    targetRow.classList.add('highlight-row');
                    setTimeout(() => {
                        targetRow.classList.remove('highlight-row');
                    }, 30000);
                }
            }, 100);
            return () => clearTimeout(timer);
        }
    }, [location.hash, data]);

    // Trend icon + tooltip for an indicator (shared lookup with the metrics overview).
    const renderTrendIndicator = (compositeKey) => {
        const trendData = findTrendForIndicator(data?.yoyTrends, compositeKey);

        if (!trendData) {
            return (
                <Tooltip label="No trend data available" placement="top">
                    <Box display="inline-flex" alignItems="center" justifyContent="center">
                        <Icon as={HelpCircle} color="gray.600" boxSize={3} />
                    </Box>
                </Tooltip>
            );
        }

        const { trend, past_value, current_value } = trendData;
        let icon, color, label;
        switch (trend) {
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

    // HTML for copying a goal group to the clipboard (email-pasteable table).
    const generateGoalHTML = (goal) => {
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

        let html = `<div style="font-family: Arial, sans-serif;">`;
        html += `<h3 style="color: #354A7A; margin-bottom: 10px;">Goal ${goalNumber}: ${goalName}</h3>`;
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

            const [numbers, suffix] = compositeKey.split('-');
            const [gNum, iNum] = numbers.split('.');
            const workingGroupMap = {
                'web': 'web',
                'pro': 'procurement',
                'ins': 'instructional-materials',
            };
            const workingGroupSegment = workingGroupMap[suffix] || suffix;
            const viewUrl = `${baseUrl}/ati/dashboard/reports/${workingGroupSegment}/${gNum}/${iNum}`;
            const directLinkUrl = `${baseUrl}/ati/dashboard/reports#${compositeKey}`;

            html += `<tr style="border-bottom: 1px solid #E2E8F0;">`;
            html += `<td style="padding: 8px; color: #2D3748;">${goalNumber}.${indicatorNumber}</td>`;
            html += `<td style="padding: 8px; color: #2D3748;">${description}</td>`;
            html += `<td style="padding: 8px;"><a href="${viewUrl}" style="color: #40598F; text-decoration: none;">View Report</a></td>`;
            html += `<td style="padding: 8px;"><a href="${directLinkUrl}" style="color: #40598F; text-decoration: none;">Direct Link</a></td>`;
            html += `</tr>`;
        });

        html += `</tbody>`;
        html += `</table>`;
        html += `</div>`;
        return html;
    };

    const copyGoalToClipboard = async (goal) => {
        try {
            const html = generateGoalHTML(goal);
            const plainText = `Goal ${goal.goal?.properties?.goal_number}: ${goal.goal?.properties?.name}\n\n` +
                goal.indicators.map((indicator) => {
                    const compositeKey = indicator.indicator?.properties?.composite_key;
                    const indicatorNumber = compositeKey?.split('-')[0]?.split('.')[1];
                    const description = indicator.indicator?.properties?.success_indicator || '';
                    return `${goal.goal?.properties?.goal_number}.${indicatorNumber} - ${description}`;
                }).join('\n');

            const blob = new Blob([html], { type: 'text/html' });
            const textBlob = new Blob([plainText], { type: 'text/plain' });
            const clipboardItem = new ClipboardItem({
                'text/html': blob,
                'text/plain': textBlob,
            });

            await navigator.clipboard.write([clipboardItem]);

            toast({
                title: 'Copied to clipboard',
                description: `Goal ${goal.goal?.properties?.goal_number} copied as HTML`,
                status: 'success',
                duration: 3000,
                isClosable: true,
                position: 'top',
            });
        } catch (error) {
            console.error('Failed to copy:', error);
            toast({
                title: 'Copy failed',
                description: 'Unable to copy to clipboard',
                status: 'error',
                duration: 3000,
                isClosable: true,
                position: 'top',
            });
        }
    };

    // A single goal's indicator table.
    const renderGoalTable = (goal, workingGroupName) => {
        if (!goal.indicators || goal.indicators.length === 0) {
            return (
                <Box key={goal.goal?.id} mb={6}>
                    <Heading size="sm" color="teal.700" mb={2}>
                        Goal {goal.goal?.properties?.goal_number}: {goal.goal?.properties?.name}
                    </Heading>
                    <Text color="gray.600" fontSize="sm">No indicators available for this goal.</Text>
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
                _hover={{ boxShadow: 'md' }}
                transition="box-shadow 0.2s"
            >
                <VStack align="stretch" spacing={3}>
                    <HStack justify="space-between" align="start">
                        <Box flex="1">
                            <Heading as="h4" size="sm" color="teal.700" mb={2}>
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
                                onClick={() => copyGoalToClipboard(goal)}
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

                                    // Documentation/implementation diagnostics (same source as the SI list).
                                    const diag = getIndicatorSummary(indicator);

                                    const adminReviewers = indicator.evidences?.[0]?.adminReviewers || [];
                                    const hasReviewers = adminReviewers.length > 0;

                                    const evidenceSummary = indicator.evidences?.[0]?.evidence?.properties?.admin_review_description;
                                    const hasSummary = evidenceSummary &&
                                        evidenceSummary !== "No Review" &&
                                        evidenceSummary !== "None" &&
                                        evidenceSummary.trim() !== "";

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
                                            <Td color="gray.700" fontSize="xs">
                                                <Text fontSize="xs">{indicator.indicator?.properties?.success_indicator}</Text>
                                                {diag.allImplsRetired && (
                                                    <Badge
                                                        mt={1}
                                                        mr={1}
                                                        colorScheme="orange"
                                                        variant="solid"
                                                        fontSize="2xs"
                                                        borderRadius="full"
                                                        px={2}
                                                        title="Every implementation linked to this indicator is retired — no active work addresses it"
                                                    >
                                                        ⚠ Imps retired
                                                    </Badge>
                                                )}
                                                {diag.noActiveDocs && (
                                                    <Badge
                                                        mt={1}
                                                        colorScheme="orange"
                                                        variant="solid"
                                                        fontSize="2xs"
                                                        borderRadius="full"
                                                        px={2}
                                                        title="This indicator's implementations have documents, but every one is depreciated — no active documentation"
                                                    >
                                                        ⚠ No active documentation
                                                    </Badge>
                                                )}
                                                {diag.flagMissingImplementation && (
                                                    <Text mt={1} fontSize="2xs" color="gray.600" fontStyle="italic">
                                                        No implementations assigned
                                                    </Text>
                                                )}
                                            </Td>
                                            <Td>
                                                <Badge
                                                    bg={getStatusBackgroundColor(statusLevel)}
                                                    color={getStatusTextColor(statusLevel)}
                                                    borderLeftWidth="3px"
                                                    borderLeftColor={getStatusColor(statusLevel)}
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
                                                    <ViewReportButton compositeKey={compositeKey} campus={campus} size="xs" />
                                                    <Button
                                                        size="xs"
                                                        colorScheme="gray"
                                                        variant="outline"
                                                        onClick={() => navigateToIndicator(navigate, compositeKey, campus)}
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

    // All goals for one working group.
    const renderWorkingGroup = (workingGroupData, workingGroupName) => {
        const getAnchorId = (name) => {
            const idMap = {
                'Web': 'web-section',
                'Procurement': 'procurement-section',
                'Instructional Materials': 'instructional-materials-section',
            };
            return idMap[name] || name.toLowerCase().replace(/\s+/g, '-') + '-section';
        };

        if (!workingGroupData?.goals || workingGroupData.goals.length === 0) {
            return (
                <Box key={workingGroupName} mb={8} id={getAnchorId(workingGroupName)}>
                    <Heading as="h3" size="md" color="teal.700" mb={4}>
                        {workingGroupData?.workingGroup || workingGroupName}
                    </Heading>
                    <Text color="gray.600" fontSize="sm">No goals available for this working group.</Text>
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

    if (!data) return null;

    return (
        <Box>
            {data.web && renderWorkingGroup(data.web, 'Web')}
            {data.web && data.procurement && <Divider my={6} borderColor="gray.200" />}

            {data.procurement && renderWorkingGroup(data.procurement, 'Procurement')}
            {data.procurement && data.instructionalMaterials && <Divider my={6} borderColor="gray.200" />}

            {data.instructionalMaterials && renderWorkingGroup(data.instructionalMaterials, 'Instructional Materials')}
        </Box>
    );
};

export default SuccessIndicatorReportTables;
