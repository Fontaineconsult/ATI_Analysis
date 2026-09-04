import React from 'react';
import { Badge } from '@chakra-ui/react';

/**
 * Who owes the answer on a Query.
 *
 * `answerable_by` is an edge to Person, not a property, so a question can sit with
 * two people until one of them takes it. Both are rendered.
 *
 * Two backends serialize it differently and both reach this component:
 *   queries/query/read.py            -> [{unique_id, name, title, email}, ...]
 *   compound_queries/get_all_by_...  -> ["John Lynch", ...]
 * Normalising here rather than at each call site keeps an object from being handed
 * to React as a child, which throws rather than rendering blank.
 *
 * Renders nothing when nobody owes the answer, which is the common case and should
 * not leave an empty row behind.
 */
export default function AnswerableBy({ people, size = '2xs' }) {
    const names = (people || [])
        .map((p) => (typeof p === 'string' ? p : p?.name))
        .filter(Boolean);

    if (!names.length) return null;

    return names.map((name) => (
        <Badge
            key={name}
            colorScheme="blue"
            variant="subtle"
            fontSize={size}
            textTransform="none"
        >
            {name} owes the answer
        </Badge>
    ));
}
