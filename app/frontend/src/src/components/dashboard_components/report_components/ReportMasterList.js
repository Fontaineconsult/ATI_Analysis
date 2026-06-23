import React, { useContext, useState, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
    Box,
    Heading,
    Spinner,
    Text,
    Alert,
    AlertIcon,
    Divider,
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalCloseButton,
    useDisclosure,
} from '@chakra-ui/react';
import { DataContext } from '../../../context/DataContext';
import Card from '../../graph_components/common/Card';
import { computeReportMetrics } from './reportMetrics';
import ReportMetricsOverview from './ReportMetricsOverview';
import ReportReferenceRow from './ReportReferenceRow';
import SuccessIndicatorReportTables from './SuccessIndicatorReportTables';
import ApprovalMasterContainer from '../../ati_explorer_containers/ApprovalMasterContainer';

/*
 * "View Reports" landing — the dashboard's default area. A campus-wide overview shell:
 *   1. ReportMetricsOverview  — high-level status + evidence-quality metrics (top, full width)
 *   2. ReportReferenceRow     — collapsible status-level legend + committee roster
 *   3. SuccessIndicatorReportTables — the full per-working-group SI report (bottom, full width)
 * This component owns only the contexts, the page states, and the Approve modal; each section
 * is a controlled child. The campus-wide metrics are memoized off the loaded DataContext tree.
 */
const ReportMasterList = () => {
    const { data, loading, error } = useContext(DataContext);
    const navigate = useNavigate();
    const { campus } = useParams();
    const { isOpen, onOpen, onClose } = useDisclosure();

    // Approval modal context — set by the SI table's Approve buttons.
    const [approvalContext, setApprovalContext] = useState({
        workingGroup: null,
        goalNumber: null,
        indicatorNumber: null,
    });

    const openApprovalModal = (workingGroup, goalNumber, indicatorNumber) => {
        setApprovalContext({ workingGroup, goalNumber, indicatorNumber });
        onOpen();
    };

    // Campus-wide + per-working-group metrics, recomputed only when the data changes (it's
    // replaced wholesale on each load — including a year switch — so keying on `data` is
    // enough; not dataVersion, which churns on unrelated background refreshes). Single pass
    // over a small dataset.
    const metrics = useMemo(() => computeReportMetrics(data), [data]);

    return (
        <Box w="100%" maxW="1400px" mx="auto" p={4} textAlign="left">
            <style>
                {`
                    @keyframes highlight-fade {
                        0% { background-color: rgba(49, 130, 206, 0.3); }
                        100% { background-color: transparent; }
                    }
                    .highlight-row { animation: highlight-fade 30s ease-out; }
                `}
            </style>

            {loading ? (
                <Box p={8} display="flex" flexDirection="column" alignItems="center" justifyContent="center" minH="400px">
                    <Spinner size="xl" color="teal.500" thickness="3px" />
                    <Text mt={4} color="gray.600" fontSize="sm">Loading reports...</Text>
                </Box>
            ) : error ? (
                <Box p={8}>
                    <Alert status="error" borderRadius="lg" fontSize="sm">
                        <AlertIcon />
                        Error loading data: {error}
                    </Alert>
                </Box>
            ) : !data ? (
                <Box p={8}>
                    <Alert status="warning" borderRadius="lg" fontSize="sm">
                        <AlertIcon />
                        No data available
                    </Alert>
                </Box>
            ) : (
                <>
                    {/* TOP — campus-wide metrics overview. The "no Year Success Evidence"
                        empty state is handled globally by <YseAvailabilityBanner/> (App.js). */}
                    <ReportMetricsOverview metrics={metrics} loading={loading} />

                    {/* Reference material (legend + committee), collapsed by default */}
                    <ReportReferenceRow />

                    <Divider my={6} borderColor="gray.200" />

                    {/* BOTTOM — full-width SI report */}
                    <Card>
                        <Heading as="h2" size="lg" color="gray.800" mb={6}>
                            ATI Success Indicators Report
                        </Heading>
                        <SuccessIndicatorReportTables
                            data={data}
                            campus={campus}
                            navigate={navigate}
                            openApprovalModal={openApprovalModal}
                        />
                    </Card>
                </>
            )}

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
