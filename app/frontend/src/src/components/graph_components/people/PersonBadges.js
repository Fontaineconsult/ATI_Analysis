import { INVOLVEMENT_LABELS } from '../../../services/utils/personInvolvement';
import React from 'react';
import { Badge } from '@chakra-ui/react';
import { getWorkingGroupColor, getWorkingGroupAbbrev } from './peopleConfig';

/**
 * Colored pills for person metadata. Single source of color truth so the list,
 * header, and detail render the same chip for a given working group / flag.
 * Mirrors AssetBadges / GovernanceTypeBadge.
 */

export function WorkingGroupBadge({ name, size = 'md', abbreviated = false }) {
    if (!name) return null;
    return (
        <Badge
            variant="subtle"
            colorScheme={getWorkingGroupColor(name)}
            fontSize={size === 'sm' ? '2xs' : 'xs'}
            px={2}
            py={size === 'sm' ? 0 : 0.5}
            borderRadius="md"
            title={abbreviated ? name : undefined}
        >
            {abbreviated ? getWorkingGroupAbbrev(name) : name}
        </Badge>
    );
}

export function ApproverBadge({ size = 'md' }) {
    return (
        <Badge
            colorScheme="teal"
            variant="solid"
            fontSize={size === 'sm' ? '2xs' : 'xs'}
            px={2}
            borderRadius="md"
        >
            Approver
        </Badge>
    );
}

export function CampusBadge({ campus, size = 'md' }) {
    if (!campus) return null;
    return (
        <Badge
            colorScheme="teal"
            variant="outline"
            textTransform="uppercase"
            fontSize={size === 'sm' ? '2xs' : 'xs'}
            px={2}
            borderRadius="md"
        >
            {campus}
        </Badge>
    );
}

// A person on no ATI working group — the roster's red-at-zero treatment.
export function NoWorkingGroupBadge({ size = 'sm' }) {
    return (
        <Badge
            colorScheme="red"
            variant="subtle"
            fontSize={size === 'sm' ? '2xs' : 'xs'}
            px={2}
            borderRadius="md"
        >
            no WG
        </Badge>
    );
}

// How the person takes part in the ATI. Members carry working-group badges instead,
// so this renders only for contributors and contacts.
export function InvolvementBadge({ involvement, size = 'md' }) {
    if (!involvement || involvement === 'member') return null;
    return (
        <Badge
            colorScheme="gray"
            variant={involvement === 'contact' ? 'outline' : 'subtle'}
            fontSize={size === 'sm' ? '2xs' : 'xs'}
            px={2}
            borderRadius="md"
        >
            {INVOLVEMENT_LABELS[involvement] || involvement}
        </Badge>
    );
}

// Does a role that is not in their position description — invisible labor.
export function NotInPdBadge({ size = 'md' }) {
    return (
        <Badge
            colorScheme="orange"
            variant="subtle"
            fontSize={size === 'sm' ? '2xs' : 'xs'}
            px={2}
            borderRadius="md"
            title="Does this role but it is not in their position description — invisible accessibility labor"
        >
            ⚠ not in PD
        </Badge>
    );
}
