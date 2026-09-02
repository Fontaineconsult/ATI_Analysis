import React from 'react';
import { Badge, Tooltip } from '@chakra-ui/react';

import {
    getTypeColor,
    getTypeLabel,
    isDeprecated,
    isDeprecationUnset,
    sourceTextState,
    truthyFlag,
    describeIntegrityCode,
} from './documentationConfig';

/**
 * Badges for the Documentation area. All colour comes from the domain config via
 * colorScheme — never a hand-set hex — so theme.js keeps its AA re-shading
 * (design-sense §4.2).
 */

export function TypeBadge({ docType, size = 'sm' }) {
    return (
        <Badge
            colorScheme={getTypeColor(docType)}
            borderRadius="md"
            fontSize={size === 'sm' ? '2xs' : 'xs'}
            textTransform="uppercase"
        >
            {getTypeLabel(docType)}
        </Badge>
    );
}

/**
 * Report visibility. Three states, not two — "never set" is a distinct audit
 * answer from "explicitly excluded", and collapsing them hides the difference
 * between a decision and a default.
 */
export function ReportBadge({ item }) {
    if (item?.include_in_report === false) {
        return (
            <Tooltip label="Explicitly excluded — the report will not show this record.">
                <Badge colorScheme="red" borderRadius="full" fontSize="2xs">Hidden</Badge>
            </Tooltip>
        );
    }
    if (item?.include_in_report_set === false) {
        return (
            <Tooltip label="Never set. Defaults to included, but nobody has decided.">
                <Badge colorScheme="gray" borderRadius="full" fontSize="2xs">Report flag unset</Badge>
            </Tooltip>
        );
    }
    return null;
}

/** Deprecation, tri-state. Renders nothing for an explicit, assessed false. */
export function DeprecationBadge({ item }) {
    if (isDeprecated(item)) {
        return (
            <Tooltip label="No longer used to direct or describe an implementation, but kept as historical evidence.">
                <Badge colorScheme="orange" borderRadius="full" fontSize="2xs">Deprecated</Badge>
            </Tooltip>
        );
    }
    if (isDeprecationUnset(item)) {
        return (
            <Tooltip label="Never assessed — this is not the same as 'not deprecated'.">
                <Badge colorScheme="gray" borderRadius="full" fontSize="2xs" variant="outline">
                    Not assessed
                </Badge>
            </Tooltip>
        );
    }
    return null;
}

export function GoneBadge({ item }) {
    if (!truthyFlag(item?.no_longer_exists)) return null;
    return (
        <Tooltip label="The page at this URL no longer exists.">
            <Badge colorScheme="red" borderRadius="full" fontSize="2xs">Dead link</Badge>
        </Tooltip>
    );
}

export function NoLocationBadge({ item }) {
    if (item?.has_location !== false) return null;
    return (
        <Tooltip label="No URL, file path or uploaded file — nothing can reach this record.">
            <Badge colorScheme="red" borderRadius="full" fontSize="2xs">No location</Badge>
        </Tooltip>
    );
}

export function OrphanBadge({ item }) {
    if ((item?.reference_count || 0) > 0) return null;
    return (
        <Tooltip label="Nothing in the graph points at this record, by any relationship.">
            <Badge colorScheme="orange" borderRadius="full" fontSize="2xs">Orphan</Badge>
        </Tooltip>
    );
}

/**
 * Fan-out. The number quoted is parent_count — records, not edges — because that
 * is what changes if the record is edited.
 */
export function SharedBadge({ item }) {
    const count = item?.parent_count || 0;
    if (count <= 1) return null;
    return (
        <Tooltip label={`Attached to ${count} records. One node, shared — it cannot be changed for just one of them.`}>
            <Badge colorScheme="purple" borderRadius="full" fontSize="2xs">
                Shared × {count}
            </Badge>
        </Tooltip>
    );
}

/**
 * Whether the agent-readable source mirror has been captured.
 *
 * BOTH STATES SHOW, which is unlike every other badge here — the rest announce
 * an exception and render nothing when a record is fine. This one is a coverage
 * signal rather than a fault: 29 of 418 artifacts have their source text today,
 * so "missing" is the norm and the badge is how you see the backlog while
 * scanning, and how you confirm a capture landed without opening the record.
 *
 * Silent on Notes, Messages and Metrics. Those classes have no `raw_text` at
 * all, so reporting them as missing it would announce an absence the schema
 * makes impossible.
 */
export function SourceTextBadge({ item }) {
    const state = sourceTextState(item);
    if (!state) return null;

    if (state === 'present') {
        return (
            <Tooltip
                label={item?.raw_text_captured
                    ? `Source text captured ${item.raw_text_captured}. The published source stays authoritative; this is a snapshot.`
                    : 'The source text has been mirrored onto this record.'}
            >
                <Badge colorScheme="green" borderRadius="full" fontSize="2xs">Source text</Badge>
            </Tooltip>
        );
    }

    return (
        <Tooltip label="No source text captured — the link is titled but not readable without fetching it.">
            <Badge colorScheme="gray" borderRadius="full" fontSize="2xs" variant="outline">
                No source text
            </Badge>
        </Tooltip>
    );
}

/**
 * Data-integrity codes from the server. These exist because the read layer
 * coerces defective values rather than passing them through — and coercing
 * silently would make the defect invisible, which is the opposite of what a
 * reconciliation view is for.
 */
export function IntegrityBadges({ item }) {
    const codes = item?.integrity || [];
    if (!codes.length) return null;
    return (
        <>
            {codes.map((code) => (
                <Tooltip key={code} label={describeIntegrityCode(code)}>
                    <Badge colorScheme="yellow" borderRadius="full" fontSize="2xs">
                        Data issue
                    </Badge>
                </Tooltip>
            ))}
        </>
    );
}

/** The badge row used on list rows and at the top of the detail panel. */
export function DocumentationBadgeRow({ item, includeType = false }) {
    return (
        <>
            {includeType && <TypeBadge docType={item?.doc_type} />}
            <ReportBadge item={item} />
            <SourceTextBadge item={item} />
            <DeprecationBadge item={item} />
            <GoneBadge item={item} />
            <NoLocationBadge item={item} />
            <OrphanBadge item={item} />
            <SharedBadge item={item} />
            <IntegrityBadges item={item} />
        </>
    );
}
