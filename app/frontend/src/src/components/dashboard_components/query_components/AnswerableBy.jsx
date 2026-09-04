import React from 'react';
import { Badge } from '@chakra-ui/react';

/**
 * Who owes the answer on a Query, one pill per person.
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
 *
 * `textTransform="none"` departs from the uppercase default deliberately: these pills
 * carry a person's name, and the surrounding rows print names in mixed case.
 */
export default function AnswerableBy({ people, size = 'md' }) {
    const names = (people || [])
        .map((p) => (typeof p === 'string' ? p : p?.name))
        .filter(Boolean);

    if (!names.length) return null;

    return names.map((name) => (
        <Badge
            key={name}
            variant="subtle"
            colorScheme="blue"
            fontSize={size === 'sm' ? '2xs' : 'xs'}
            textTransform="none"
            px={2}
            py={size === 'sm' ? 0 : 0.5}
            borderRadius="md"
            title={`${name} owes the answer on this question.`}
        >
            {name}
        </Badge>
    ));
}
