import React from 'react';
import { Box, Text } from '@chakra-ui/react';

import { DataTable, Dash, Empty } from './reportPrimitives';

/**
 * The remediation-reached assets table — report.assets, each with its mono identifier.
 * `showDescription` lets a denser presentation (the approval page) drop the last column
 * without dropping the identifier, which is how an asset is looked up everywhere else.
 */
const AssetsTable = ({ assets = [], showDescription = true, emptyText = 'No assets reached.' }) => {
    if (!assets.length) return <Empty>{emptyText}</Empty>;
    const columns = showDescription
        ? ['Asset', 'Class', 'Scope', 'Reached via', 'Description']
        : ['Asset', 'Class', 'Scope', 'Reached via'];
    return (
        <DataTable
            columns={columns}
            rows={assets.map((a) => {
                const cells = [
                    <Box>
                        <Text fontWeight="semibold" color="gray.800">{a.title}</Text>
                        <Text fontSize="2xs" color="gray.600" fontFamily="mono">{a.asset_identifier}</Text>
                    </Box>,
                    a.asset_class ? <Text>{a.asset_class.replace(/_/g, ' ')}</Text> : <Dash />,
                    a.scope ? <Text>{a.scope}</Text> : <Dash />,
                    (a.reached_via || []).length ? <Text>{a.reached_via.join(', ')}</Text> : <Dash />,
                ];
                if (showDescription) {
                    cells.push(a.description
                        ? <Text color="gray.600" whiteSpace="pre-wrap">{a.description}</Text>
                        : <Dash />);
                }
                return cells;
            })}
        />
    );
};

export default AssetsTable;
