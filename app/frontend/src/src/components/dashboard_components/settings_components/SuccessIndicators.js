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
import { DataContext } from '../../../context/DataContext'; // Ensure the context is properly imported
import { useColorModeValue } from '@chakra-ui/react'; // For dynamic theming

const SuccessIndicators = () => {
    const { data, refreshIndicators } = useContext(DataContext); // Access indicators from context
    const { indicators } = data; // Assuming "indicators" is the field in context

    // Modal state management
    const { isOpen, onOpen, onClose } = useDisclosure();
    const [selectedIndicator, setSelectedIndicator] = useState(null);
    const [actionType, setActionType] = useState(''); // 'Enable' or 'Disable'
    const [isLoading, setIsLoading] = useState(false); // For handling async actions

    // Handler to toggle the 'removed' status of a success indicator
    const toggleRemovedStatus = async (indicator) => {
        // Placeholder for API call to update status
        // Replace this with your actual API call logic
        try {
            setIsLoading(true);
            console.log(`API Call: Toggle status for ${indicator.composite_key}`);
            // Example:
            // await updateIndicatorStatus(indicator.id, !indicator.removed);
            // After successful API call, refresh the indicators
            refreshIndicators();
        } catch (error) {
            console.error("Failed to update indicator status:", error);
            // Optionally, display an error toast notification here
        } finally {
            setIsLoading(false);
            onClose();
            setSelectedIndicator(null);
            setActionType('');
        }
    };

    // Handler for clicking the Enable/Disable button
    const handleActionClick = (indicator) => {
        setSelectedIndicator(indicator);
        setActionType(indicator.removed ? 'Enable' : 'Disable');
        onOpen();
    };

    // Handler for status change via dropdown
    const handleStatusChange = (indicator, newStatus) => {
        // Placeholder for handling status change
        // Implement the logic to update the status here (e.g., API call)
        console.log(`Indicator ID: ${indicator.composite_key}, New Status: ${newStatus}`);
        // Example:
        // updateIndicatorStatus(indicator.id, newStatus === 'Removed').then(() => {
        //     refreshIndicators();
        // }).catch(error => {
        //     // Handle error (e.g., show a toast notification)
        // });
    };

    // Define columns for react-table
    const columns = React.useMemo(
        () => [
            {
                Header: 'Success Indicator',
                accessor: 'success_indicator', // Key for success indicator
            },
            {
                Header: 'Composite Key',
                accessor: 'composite_key', // Key for composite key
            },
            {
                Header: 'Status',
                accessor: 'status',
                Cell: ({ row }) => {
                    const currentStatus = row.original.removed ? 'Removed' : 'Active';
                    const isDisabled = row.original.yearSuccessIndicators.length === 0;

                    return (
                        <Tooltip
                            label={isDisabled ? "Cannot modify without year success indicators." : ""}
                            isDisabled={!isDisabled}
                            aria-label="Status Tooltip"
                        >
                            <Select
                                value={currentStatus}
                                onChange={(e) => handleStatusChange(row.original, e.target.value)}
                                isDisabled={isDisabled}
                                size="sm"
                                width="120px"
                            >
                                <option value="Active">Active</option>
                                <option value="Removed">Removed</option>
                            </Select>
                        </Tooltip>
                    );
                },
            },
            {
                Header: 'Actions',
                accessor: 'actions',
                Cell: ({ row }) => {
                    const isDisabled = row.original.yearSuccessIndicators.length === 0;
                    const buttonLabel = row.original.removed ? 'Enable' : 'Disable';

                    return (
                        <Tooltip
                            label={isDisabled ? "Cannot modify without year success indicators." : ""}
                            isDisabled={!isDisabled}
                            aria-label="Action Tooltip"
                        >
                            <Button
                                size="sm"
                                onClick={() => handleActionClick(row.original)}
                                isDisabled={isDisabled}
                                colorScheme={row.original.removed ? 'green' : 'red'}
                            >
                                {buttonLabel}
                            </Button>
                        </Tooltip>
                    );
                },
            },
        ],
        [refreshIndicators] // Include dependencies if any
    );

    if (!indicators) {
        return <Box>Loading...</Box>;
    }

    return (
        <Box>
            <Heading size="md" mb={4}>Success Indicators</Heading>

            {indicators.map((category) => (
                <Box key={category.name} mb={8}>
                    {/* Display the category name */}
                    <Heading size="md" mb={4}>{category.name}</Heading>

                    {/* Loop through each goal in the category */}
                    {category.goals && category.goals.length > 0 ? (
                        category.goals.map((goal) => (
                            <Box key={goal.goal_number} mb={6}>
                                {/* Display the goal number and goal name */}
                                <Heading size="sm" mb={2}>{`Goal ${goal.goal_number}: ${goal.goal}`}</Heading>
                                <p>{goal.name}</p>

                                {/* Create a table for each goal's success indicators */}
                                {goal.successIndicators && goal.successIndicators.length > 0 ? (
                                    <SuccessIndicatorTable data={goal.successIndicators} columns={columns} />
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

            {/* Confirmation Modal */}
            <Modal isOpen={isOpen} onClose={() => { onClose(); setSelectedIndicator(null); setActionType(''); }} isCentered>
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader>Confirm {actionType}</ModalHeader>
                    <ModalCloseButton />
                    <ModalBody>
                        {selectedIndicator && (
                            <Box>
                                {actionType === 'Disable' ? (
                                    <>
                                        <Heading size="sm" mb={2}>{selectedIndicator.success_indicator}</Heading>
                                        <Box>Are you sure you want to disable this success indicator? This action cannot be undone.</Box>
                                    </>
                                ) : (
                                    <>
                                        <Heading size="sm" mb={2}>{selectedIndicator.success_indicator}</Heading>
                                        <Box>Are you sure you want to enable this success indicator?</Box>
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
                            colorScheme={actionType === 'Disable' ? 'red' : 'green'}
                            onClick={() => toggleRemovedStatus(selectedIndicator)}
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

// Updated Table component for rendering success indicators using react-table
const SuccessIndicatorTable = React.memo(({ data, columns }) => {
    const {
        getTableProps,
        getTableBodyProps,
        headerGroups,
        rows,
        prepareRow,
    } = useTable({ columns, data });

    // Define colors based on the current color mode (light or dark)
    const removedRowBg = useColorModeValue('gray.100', 'gray.700');
    const removedRowText = useColorModeValue('gray.500', 'gray.400');

    return (
        <table {...getTableProps()} style={{ width: '100%', marginTop: '1rem', border: '1px solid black', borderCollapse: 'collapse' }}>
            <thead>
            {headerGroups.map((headerGroup) => {
                const { key: headerGroupKey, ...restHeaderGroupProps } = headerGroup.getHeaderGroupProps();
                return (
                    <tr key={headerGroupKey} {...restHeaderGroupProps}>
                        {headerGroup.headers.map((column) => {
                            const { key: headerKey, ...restColumnProps } = column.getHeaderProps();
                            return (
                                <th
                                    key={headerKey}
                                    {...restColumnProps}
                                    style={{
                                        borderBottom: '2px solid black',
                                        padding: '8px',
                                        textAlign: 'left',
                                        backgroundColor: '#f2f2f2',
                                    }}
                                >
                                    {column.render('Header')}
                                </th>
                            );
                        })}
                    </tr>
                );
            })}
            </thead>
            <tbody {...getTableBodyProps()}>
            {rows.map((row) => {
                prepareRow(row);
                const { key: rowKey, ...restRowProps } = row.getRowProps();

                // Determine if the row is removed
                const isRemoved = row.original.removed;

                return (
                    <tr
                        key={rowKey}
                        {...restRowProps}
                        style={{
                            backgroundColor: isRemoved ? removedRowBg : 'inherit',
                            color: isRemoved ? removedRowText : 'inherit',
                            opacity: isRemoved ? 0.6 : 1,
                            transition: 'opacity 0.3s ease, background-color 0.3s ease',
                        }}
                    >
                        {row.cells.map((cell) => {
                            const { key: cellKey, ...restCellProps } = cell.getCellProps();
                            return (
                                <td
                                    key={cellKey}
                                    {...restCellProps}
                                    style={{
                                        borderBottom: '1px solid black',
                                        padding: '8px',
                                        textAlign: 'left',
                                    }}
                                >
                                    {cell.render('Cell')}
                                </td>
                            );
                        })}
                    </tr>
                );
            })}
            </tbody>
        </table>
    );
});

export default SuccessIndicators;
