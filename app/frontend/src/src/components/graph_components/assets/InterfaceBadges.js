import React from 'react';
import { Badge, HStack } from '@chakra-ui/react';
import {
    getKindColor, getKindLabel,
    getCoverageDomainColor, getCoverageDomainLabel,
    getAudienceColor, getAudienceLabel,
    getProvenanceColor, getProvenanceLabel,
} from './interfaceConfig';

/**
 * Colored pills for Interface metadata. Single source of color truth so the list,
 * detail, and forms render the same chip for a given kind / coverage domain /
 * audience / provenance, plus the uncovered (elevation) flag. Mirrors AssetBadges.
 */
export function KindBadge({ kind, size = 'md' }) {
    if (!kind) return null;
    return (
        <Badge
            colorScheme={getKindColor(kind)}
            fontSize={size === 'sm' ? '2xs' : 'xs'}
            textTransform="uppercase"
            px={2}
            py={size === 'sm' ? 0 : 0.5}
            borderRadius="md"
        >
            {getKindLabel(kind)}
        </Badge>
    );
}

// interface_kind is multi-valued — render one KindBadge per kind.
export function KindBadges({ kinds = [], size = 'md' }) {
    const list = Array.isArray(kinds) ? kinds : (kinds ? [kinds] : []);
    if (!list.length) return null;
    return (
        <HStack spacing={1} flexWrap="wrap">
            {list.map((k) => <KindBadge key={k} kind={k} size={size} />)}
        </HStack>
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
