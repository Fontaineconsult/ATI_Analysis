import React from 'react';
import { Badge, HStack } from '@chakra-ui/react';
import {
    getFunctionColor, getFunctionLabel,
    getCoverageDomainColor, getCoverageDomainLabel,
    getAudienceColor, getAudienceLabel,
    getProvenanceColor, getProvenanceLabel,
} from './interfaceConfig';

/**
 * Colored pills for Interface metadata. Single source of color truth so the list,
 * detail, and forms render the same chip for a given function / coverage domain /
 * audience / provenance, plus the uncovered (elevation) flag. Mirrors AssetBadges.
 * (Kind moved to Component — see ComponentBadges.)
 */
export function FunctionBadge({ fn, size = 'md' }) {
    if (!fn) return null;
    return (
        <Badge
            colorScheme={getFunctionColor(fn)}
            fontSize={size === 'sm' ? '2xs' : 'xs'}
            textTransform="uppercase"
            px={2}
            py={size === 'sm' ? 0 : 0.5}
            borderRadius="md"
            title="Institutional purpose this interface serves (identity coordinate)"
        >
            {getFunctionLabel(fn)}
        </Badge>
    );
}

export function CoverageDomainBadge({ domain, size = 'md' }) {
    if (!domain) return null;
    return (
        <Badge
            variant="subtle"
            colorScheme={getCoverageDomainColor(domain)}
            fontSize={size === 'sm' ? '2xs' : 'xs'}
            px={2}
            py={size === 'sm' ? 0 : 0.5}
            borderRadius="md"
        >
            {getCoverageDomainLabel(domain)}
        </Badge>
    );
}

// coverage_domains is multi-valued — render one subtle pill per value.
export function CoverageDomainBadges({ domains = [], size = 'md' }) {
    const list = Array.isArray(domains) ? domains : (domains ? [domains] : []);
    if (!list.length) return null;
    return (
        <HStack spacing={1} flexWrap="wrap">
            {list.map((d) => <CoverageDomainBadge key={d} domain={d} size={size} />)}
        </HStack>
    );
}

export function ProvenanceBadge({ provenance, size = 'md' }) {
    if (!provenance) return null;
    return (
        <Badge
            variant="outline"
            colorScheme={getProvenanceColor(provenance)}
            fontSize={size === 'sm' ? '2xs' : 'xs'}
            px={2}
            py={size === 'sm' ? 0 : 0.5}
            borderRadius="md"
            title="How this interface became known to the ATI"
        >
            {getProvenanceLabel(provenance)}
        </Badge>
    );
}

// audience is multi-valued — render one subtle pill per value.
export function AudienceBadges({ audience = [], size = 'md' }) {
    const list = Array.isArray(audience) ? audience : [];
    if (!list.length) return null;
    return (
        <HStack spacing={1} flexWrap="wrap">
            {list.map((a) => (
                <Badge
                    key={a}
                    variant="subtle"
                    colorScheme={getAudienceColor(a)}
                    fontSize={size === 'sm' ? '2xs' : 'xs'}
                    px={2}
                    py={size === 'sm' ? 0 : 0.5}
                    borderRadius="md"
                >
                    {getAudienceLabel(a)}
                </Badge>
            ))}
        </HStack>
    );
}

// No remediation reaches this interface (specific or asset-backed): the Title II
// §35.205 elevation signal for interaction points.
export function UncoveredBadge({ size = 'md' }) {
    return (
        <Badge
            colorScheme="red"
            fontSize={size === 'sm' ? '2xs' : 'xs'}
            textTransform="uppercase"
            px={2}
            py={size === 'sm' ? 0 : 0.5}
            borderRadius="md"
            title="No remediation reaches this interface — the duty for this interaction point is unmet (Title II §35.205)."
        >
            ⚠ Uncovered
        </Badge>
    );
}
