import React, { useContext, useState } from 'react';
import {
    Box,
    Heading,
    Button,
    Select,
    useDisclosure,
} from '@chakra-ui/react';
import { useTable } from 'react-table';
import { DataContext } from '../../../context/DataContext';
import { useColorModeValue } from '@chakra-ui/react';
import { updateRemovedStatus, attachYearSuccessEvidence, detachYearSuccessEvidence } from '../../../services/api/put';
import { sortGoals, sortSuccessIndicators } from "../../../services/utils/sorters";
import AddIndicator from './AddIndicator';  // Import the AddIndicator component

const SuccessIndicators = () => {
    const { data, refreshIndicators } = useContext(DataContext);
    const { indicators } = data;

    const [openModals, setOpenModals] = useState({});
    const [selectedIndicator, setSelectedIndicator] = useState(null);
    const [actionType, setActionType] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // Open modal for adding an indicator to a specific category
    const onAddOpen = (categoryName) => {
        setOpenModals((prev) => ({ ...prev, [categoryName]: true }));
    };

    // Close modal for adding an indicator to a specific category
    const onAddClose = (categoryName) => {
        setOpenModals((prev) => ({ ...prev, [categoryName]: false }));
    };

    const handleStatusChange = async (indicator, newStatus) => {
        const originalRemovedStatus = indicator.removed;
        const newRemovedStatus = newStatus === 'Removed';

        indicator.removed = newRemovedStatus;
        refreshIndicators();

        try {
            setIsLoading(true);
            await updateRemovedStatus(indicator.composite_key, newRemovedStatus);
            refreshIndicators();
        } catch (error) {
            console.error("Failed to update status:", error);
            indicator.removed = originalRemovedStatus;
            refreshIndicators();
        } finally {
            setIsLoading(false);
        }
    };

    const toggleYearSuccessEvidence = async (indicator) => {
        const action = indicator.yearSuccessIndicators.length > 0 ? "detach" : "attach";
        setIsLoading(true);

        try {
            if (action === "attach") {
                await attachYearSuccessEvidence(indicator.composite_key);
            } else {
                await detachYearSuccessEvidence(indicator.composite_key);
            }
            refreshIndicators();
        } catch (error) {
            console.error(`Failed to ${action} year success evidence:`, error);
        } finally {
            setIsLoading(false);
            setSelectedIndicator(null);
            setActionType('');
        }
    };

    const handleActionClick = (indicator) => {
        setSelectedIndicator(indicator);
        setActionType(indicator.yearSuccessIndicators.length > 0 ? 'Detach YSE' : 'Attach YSE');
    };

    const handleAddIndicatorSubmit = (indicatorData) => {
        console.log("New indicator data:", indicatorData);
        // Add API call to save the indicator data
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

            {indicators
                .sort(sortGoals)
                .map((category) => (
                    <Box key={category.name} mb={8}>
                        <Heading size="md" mb={4}>{category.name}</Heading>

                        <AddIndicator
                            indicators={category}
                            wg={category.name}
                            isOpen={openModals[category.name] || false}
                            onClose={() => onAddClose(category.name)}
                            onSubmit={handleAddIndicatorSubmit}
                        />

                        <Button colorScheme="blue" onClick={() => onAddOpen(category.name)} mb={4}>Add Indicator</Button>

                        {category.goals && category.goals.length > 0 ? (
                            category.goals
                                .sort(sortGoals)
                                .map((goal) => (
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
