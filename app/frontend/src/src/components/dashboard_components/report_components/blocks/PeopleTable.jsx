import React from 'react';
import { Badge, Link, Text, Wrap, WrapItem } from '@chakra-ui/react';

import { DataTable, Dash, Empty } from './reportPrimitives';

/**
 * The implementers table — people accountable for this year's evidence, with their
 * role holdings. Takes report.people.implementers as-is.
 *
 * Rendered identically on the report and approval pages (the cells were byte-identical
 * before extraction; only the table chrome differed).
 */
const PeopleTable = ({ implementers = [] }) => {
    if (!implementers.length) return <Empty>No people assigned.</Empty>;
    return (
        <DataTable
            columns={['Name', 'Title', 'Roles', 'Email']}
            rows={implementers.map((p) => [
                <Text fontWeight="medium" color="gray.800">{p.name}</Text>,
                p.title ? <Text>{p.title}</Text> : <Dash />,
                (p.roles || []).length
                    ? (
                        <Wrap spacing={1}>
                            {p.roles.map((r) => (
                                <WrapItem key={r.handle}>
                                    <Badge colorScheme="purple" variant="subtle" fontSize="2xs">
                                        {r.name}
                                    </Badge>
                                </WrapItem>
                            ))}
                        </Wrap>
                    )
                    : <Dash />,
                p.email ? <Link href={`mailto:${p.email}`} color="teal.700">{p.email}</Link> : <Dash />,
            ])}
        />
    );
};

export default PeopleTable;
