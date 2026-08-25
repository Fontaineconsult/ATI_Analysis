import React from 'react';
import { Badge, HStack, Link, Text, Wrap, WrapItem } from '@chakra-ui/react';

import { ARTIFACT_TAG, resolveArtifactHref, fileMeta, isTrue } from './artifactConfig';
import { DataTable, Dash, Empty } from './reportPrimitives';

/*
 * The artifact table — every document, webpage, note, message and metric attached to an
 * implementation, TAAP, or the year's evidence, as [Kind, Item, Details] rows.
 *
 * Behavioral contract (the parts that have been gotten wrong before):
 *  - Documents split FILE (uploaded, download_url) from URL (external location), carry
 *    fileMeta and the Admin Review / Milestones / Deprecated badges.
 *  - Only `no_longer_exists` de-links a webpage (struck through, GONE tag). A page that
 *    is merely deprecated stays a working link with a Deprecated badge — deprecation is
 *    an editorial status, link rot is a fact about the URL.
 *  - Messages render their attachment link when they carry a file.
 */

export const TagBadge = ({ tag }) => {
    const cfg = ARTIFACT_TAG[tag] || { scheme: 'gray', variant: 'subtle' };
    return <Badge colorScheme={cfg.scheme} variant={cfg.variant} fontSize="2xs">{tag}</Badge>;
};

/** Build [Kind, Item, Details] rows for a set of documents/webpages/notes/messages/metrics. */
export function artifactRows({ documents = [], webpages = [], notes = [], messages = [], metrics = [] }) {
    const rows = [];

    documents.forEach((d) => {
        const href = resolveArtifactHref(d);
        const flags = (
            <Wrap spacing={1}>
                {fileMeta(d.file) && <WrapItem><Text fontSize="2xs" color="gray.600">{fileMeta(d.file)}</Text></WrapItem>}
                {isTrue(d.is_administrative_review_documentation) && <WrapItem><Badge colorScheme="purple" fontSize="2xs">Admin Review</Badge></WrapItem>}
                {isTrue(d.is_milestone_and_measures_documentation) && <WrapItem><Badge colorScheme="blue" fontSize="2xs">Milestones</Badge></WrapItem>}
                {isTrue(d.depreciated) && <WrapItem><Badge colorScheme="orange" fontSize="2xs">Deprecated</Badge></WrapItem>}
            </Wrap>
        );
        rows.push([
            <TagBadge tag={d.file?.download_url ? 'FILE' : 'URL'} />,
            href ? <Link href={href} isExternal color="teal.600">{d.name || 'Document'}</Link> : <Text>{d.name || 'Document'}</Text>,
            flags,
        ]);
    });

    webpages.forEach((w) => {
        const gone = isTrue(w.no_longer_exists);
        rows.push([
            <TagBadge tag={gone ? 'GONE' : 'WEB'} />,
            gone
                ? <Text as="s" aria-label={`${w.name || w.url} (no longer available)`}>{w.name || w.url}</Text>
                : <Link href={w.url} isExternal color="teal.600">{w.name || w.url}</Link>,
            isTrue(w.depreciated) ? <Badge colorScheme="orange" fontSize="2xs">Deprecated</Badge> : <Dash />,
        ]);
    });

    notes.forEach((n) => rows.push([
        <TagBadge tag="NOTE" />, <Text>{n.content}</Text>,
        (n.dateCreated || n.date_created) ? <Text fontSize="2xs" color="gray.600">{n.dateCreated || n.date_created}</Text> : <Dash />,
    ]));

    messages.forEach((m) => {
        const href = resolveArtifactHref(m);
        rows.push([
            <TagBadge tag="MSG" />, <Text>{m.content || m.name}</Text>,
            <HStack spacing={2}>
                {href && <Link href={href} isExternal color="teal.600" fontSize="2xs">attachment</Link>}
                {m.date_created && <Text fontSize="2xs" color="gray.600">{m.date_created}</Text>}
                {!href && !m.date_created && <Dash />}
            </HStack>,
        ]);
    });

    metrics.forEach((m) => {
        const extra = [m.comment, m.academic_year].filter(Boolean).join(' · ');
        rows.push([
            <TagBadge tag="METRIC" />,
            <Text><Text as="span" fontWeight="semibold">{m.name}:</Text> {m.single_value ?? '—'}</Text>,
            extra ? <Text fontSize="2xs" color="gray.600">{extra}</Text> : <Dash />,
        ]);
    });

    return rows;
}

const ArtifactTable = ({ emptyText = 'None recorded.', ...lists }) => {
    const rows = artifactRows(lists);
    if (!rows.length) return <Empty>{emptyText}</Empty>;
    return <DataTable columns={['Kind', 'Item', 'Details']} rows={rows} />;
};

export default ArtifactTable;
