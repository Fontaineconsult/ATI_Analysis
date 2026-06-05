import React from 'react';
import { HStack, Badge } from '@chakra-ui/react';
import GovernanceTypeBadge from '../governance/GovernanceTypeBadge';
import { GOVERNANCE_TYPE_ORDER } from '../governance/governanceTypes';

/**
 * The distinct "grounded in" tags for a principle: one governance-type badge per governance type
 * it derives from (in canonical order), plus a "Theory" tag if it's grounded in any
 * IntellectualSource. Renders null when the principle is ungrounded (the PrincipleSourceBadge
 * already signals "Ungrounded"), so it can sit additively beside that summary badge.
 */
function PrincipleGroundingTags({ principle, size = 'sm' }) {
    const governance = principle?.grounded_in?.governance || [];
    const sources = principle?.grounded_in?.intellectual_sources || [];

    const present = new Set(governance.map((g) => g.type).filter(Boolean));
    const orderedTypes = GOVERNANCE_TYPE_ORDER.filter((t) => present.has(t));

    if (orderedTypes.length === 0 && sources.length === 0) return null;

    return (
        <HStack spacing={1} flexWrap="wrap">
            {orderedTypes.map((t) => (
                <GovernanceTypeBadge key={t} type={t} size={size} />
            ))}
            {sources.length > 0 && (
                <Badge
                    colorScheme="purple"
                    fontSize={size === 'sm' ? '2xs' : 'xs'}
                    textTransform="uppercase"
                    px={2}
                    py={size === 'sm' ? 0 : 0.5}
                    borderRadius="md"
                >
                    Theory
                </Badge>
            )}
        </HStack>
    );
}

export default PrincipleGroundingTags;
