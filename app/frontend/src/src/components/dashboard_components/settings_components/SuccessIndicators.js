import React, { useContext, useState } from 'react';
import {
    Box,
    Heading,
    Button,
    Select,
    Tooltip,
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    ModalCloseButton,
    useDisclosure,
} from '@chakra-ui/react';
import { useTable } from 'react-table';
import { DataContext } from '../../../context/DataContext';
import { useColorModeValue } from '@chakra-ui/react';
import { updateRemovedStatus, attachYearSuccessEvidence, detachYearSuccessEvidence } from '../../../services/api/put';
import {sortSuccessIndicators} from "../../../services/utils/sorters";


const SuccessIndicators = () => {
    const { data, refreshIndicators } = useContext(DataContext);
    const { indicators } = data;

    const { isOpen, onOpen, onClose } = useDisclosure();
    const [selectedIndicator, setSelectedIndicator] = useState(null);
    const [actionType, setActionType] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // Optimistically update the "removed" status on the Status dropdown
    const handleStatusChange = async (indicator, newStatus) => {
        const originalRemovedStatus = indicator.removed;
        const newRemovedStatus = newStatus === 'Removed';

        indicator.removed = newRemovedStatus;
        refreshIndicators(); // Update the view optimistically

        try {
            setIsLoading(true);
            await updateRemovedStatus(indicator.composite_key, newRemovedStatus);
            refreshIndicators(); // Confirm changes with fresh data on success
        } catch (error) {
            console.error("Failed to update status:", error);
            indicator.removed = originalRemovedStatus; // Revert change on error
            refreshIndicators();
        } finally {
            setIsLoading(false);
        }
    };

    // Attach or Detach YSE node based on current state
    const toggleYearSuccessEvidence = async (indicator) => {
        const action = indicator.yearSuccessIndicators.length > 0 ? "detach" : "attach";
        setIsLoading(true);

        try {
            if (action === "attach") {
                await attachYearSuccessEvidence(indicator.composite_key); // API to attach YSE node
            } else {
                await detachYearSuccessEvidence(indicator.composite_key); // API to detach YSE node
            }
            refreshIndicators(); // Refresh indicators to reflect new YSE state
        } catch (error) {
            console.error(`Failed to ${action} year success evidence:`, error);
        } finally {
            setIsLoading(false);
            onClose();
            setSelectedIndicator(null);
            setActionType('');
        }
    };

    // Handle Attach/Detach button action
    const handleActionClick = (indicator) => {
        setSelectedIndicator(indicator);
        setActionType(indicator.yearSuccessIndicators.length > 0 ? 'Detach YSE' : 'Attach YSE');
        onOpen();
    };

    const columns = React.useMemo(
        () => [
            {
                Header: 'Success Indicator',
                accessor: 'success_indicator',
            },
            {
                Header: 'Composite Key',
                accessor: 'composite_key',
            },
            {
                Header: 'Status',
                accessor: 'status',
                Cell: ({ row }) => {
                    const currentStatus = row.original.removed ? 'Removed' : 'Active';

                    return (
                        <Select
                            value={currentStatus}
                            onChange={(e) => handleStatusChange(row.original, e.target.value)}
                            size="sm"
                            width="120px"
                        >
                            <option value="Active">Active</option>
                            <option value="Removed">Removed</option>
                        </Select>
                    );
                },
            },
            {
                Header: 'Actions',
                accessor: 'actions',
                Cell: ({ row }) => {
                    const buttonLabel = row.original.yearSuccessIndicators.length > 0 ? 'Detach YSE' : 'Attach YSE';

                    return (
                        <Button
                            size="sm"
                            onClick={() => handleActionClick(row.original)}
                            colorScheme={row.original.yearSuccessIndicators.length > 0 ? 'red' : 'green'}
                        >
                            {buttonLabel}
                        </Button>
                    );
                },
            },
        ],
        [refreshIndicators]
    );

    if (!indicators) {
        return <Box>Loading...</Box>;
    }

    return (
        <Box>
            <Heading size="md" mb={4}>Success Indicators</Heading>

            {indicators.map((category) => (
                <Box key={category.name} mb={8}>
                    <Heading size="md" mb={4}>{category.name}</Heading>

                    {category.goals && category.goals.length > 0 ? (
                        category.goals.map((goal) => (
                            <Box key={goal.goal_number} mb={6}>
                                <Heading size="sm" mb={2}>{`Goal ${goal.goal_number}: ${goal.goal}`}</Heading>
                                <p>{goal.name}</p>

                                {goal.successIndicators && goal.successIndicators.length > 0 ? (
                                    <SuccessIndicatorTable
                                        data={goal.successIndicators.sort(sortSuccessIndicators)}
                                        columns={columns}
                                    />
                                ) : (
                                    <Box>No success indicators available.</Box>
                                )}
                            </Box>
                        ))
                    ) : (
                        <Box>No goals available for {category.name}.</Box>
                    )}
                </Box>
            ))}

            <Modal isOpen={isOpen} onClose={() => { onClose(); setSelectedIndicator(null); setActionType(''); }} isCentered>
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader>Confirm {actionType}</ModalHeader>
                    <ModalCloseButton />
                    <ModalBody>
                        {selectedIndicator && (
                            <Box>
                                {actionType === 'Detach YSE' ? (
                                    <>
                                        <Heading size="sm" mb={2}>{selectedIndicator.success_indicator}</Heading>
                                        <Box>Are you sure you want to detach this evidence node from the success indicator? This action cannot be undone.</Box>
                                    </>
                                ) : (
                                    <>
                                        <Heading size="sm" mb={2}>{selectedIndicator.success_indicator}</Heading>
                                        <Box>Are you sure you want to attach an evidence node to this success indicator?</Box>
                                    </>
                                )}
                            </Box>
                        )}
                    </ModalBody>
                    <ModalFooter>
                        <Button variant="ghost" mr={3} onClick={() => { onClose(); setSelectedIndicator(null); setActionType(''); }}>
                            Cancel
                        </Button>
                        <Button
                            colorScheme={actionType === 'Detach YSE' ? 'red' : 'green'}
                            onClick={() => toggleYearSuccessEvidence(selectedIndicator)}
                            isLoading={isLoading}
                        >
                            Confirm
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </Box>
    );
};

const SuccessIndicatorTable = React.memo(({ data, columns }) => {
    const {
        getTableProps,
        getTableBodyProps,
        headerGroups,
        rows,
        prepareRow,
    } = useTable({ columns, data });

    const removedRowBg = useColorModeValue('gray.100', 'gray.700');
    const removedRowText = useColorModeValue('gray.500', 'gray.400');

    return (
        <table {...getTableProps()} style={{ width: '100%', marginTop: '1rem', border: '1px solid black', borderCollapse: 'collapse' }}>
            <thead>
            {headerGroups.map(headerGroup => (
                <tr {...headerGroup.getHeaderGroupProps()}>
                    {headerGroup.headers.map(column => (
                        <th {...column.getHeaderProps()} style={{ borderBottom: '2px solid black', padding: '8px', textAlign: 'left', backgroundColor: '#f2f2f2' }}>
                            {column.render('Header')}
                        </th>
                    ))}
                </tr>
            ))}
            </thead>
            <tbody {...getTableBodyProps()}>
            {rows.map(row => {
                prepareRow(row);
                const isRemoved = row.original.removed;

                return (
                    <tr
                        {...row.getRowProps()}
                        style={{
                            backgroundColor: isRemoved ? removedRowBg : 'inherit',
                            color: isRemoved ? removedRowText : 'inherit',
                            opacity: isRemoved ? 0.6 : 1,
                            transition: 'opacity 0.3s ease, background-color 0.3s ease',
                        }}
                    >
                        {row.cells.map(cell => (
                            <td {...cell.getCellProps()} style={{ borderBottom: '1px solid black', padding: '8px', textAlign: 'left' }}>
                                {cell.render('Cell')}
                            </td>
                        ))}
                    </tr>
                );
            })}
            </tbody>
        </table>
    );
});

export default SuccessIndicators;
