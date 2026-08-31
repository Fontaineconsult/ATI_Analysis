import React from 'react';
import { Badge, Text } from '@chakra-ui/react';

/*
 * Shared pieces of the two companion-bar coverage tables.
 *
 * The tables themselves stay separate on purpose: the report's EvidenceCoverage states
 * what is claimed, the approval page's ApprovalCoverageTable interrogates the claims
 * (rationale per claim, Bare / Not counted vocabulary). Only what is identical between
 * them lives here — the level ordering/palette and the requirement cell — so the two
 * lenses cannot drift on the parts that are not lenses.
 */

// Alphabetical level order happens to be rubric order, but say it explicitly rather
// than relying on the coincidence.
export const LEVEL_ORDER = ['established', 'managed', 'optimizing'];
export const LEVEL_COLOR = { established: 'teal', managed: 'purple', optimizing: 'orange' };

export const byLevel = (a, b) => {
    const ai = LEVEL_ORDER.indexOf(a);
    const bi = LEVEL_ORDER.indexOf(b);
    return (ai === -1 ? LEVEL_ORDER.length : ai) - (bi === -1 ? LEVEL_ORDER.length : bi);
};

export const LevelBadge = ({ level }) => (
    <Badge colorScheme={LEVEL_COLOR[level] || 'gray'} variant="subtle" fontSize="2xs">
        {level}
    </Badge>
);

/** Requirement text with its optional element sub-line — identical in both tables. */
export const RequirementCell = ({ requirement, element }) => (
    <>
        <Text fontSize="xs" color="gray.700">{requirement}</Text>
        {element && <Text fontSize="2xs" color="gray.700" mt={0.5}>{element}</Text>}
    </>
);
