import React from 'react';
import { HStack, Link, Text, VStack, Wrap, WrapItem } from '@chakra-ui/react';
import { ExternalLinkIcon } from '@chakra-ui/icons';

/**
 * An instrument's source artifacts — its `is_sourced_from` Documents (with any
 * uploaded file) and Webpages.
 *
 * A `drives` edge claims the instrument states the indicator's requirement. That
 * claim is only as checkable as the artifact behind it is reachable, so wherever an
 * instrument is cited the reviewer needs a way to open it without going hunting.
 *
 * Compact by design: this renders inside dense stacked rows, so it is a single
 * wrapped line of links rather than the full document cards the Governance area
 * shows.
 */

// Some Webpage nodes have the URL in `name` and the title in `url` (fields swapped).
// Same guard GovernanceDetailPanel uses — pick whichever field is actually a URL.
function looksLikeUrl(s) {
    if (!s || typeof s !== 'string') return false;
    const t = s.trim();
    if (!t) return false;
    if (/^(https?|mailto|tel|ftp):/i.test(t)) return true;
    if (t.startsWith('//')) return true;
    if (!/\s/.test(t) && /\./.test(t)) return true;
    return false;
}

function normalizeHref(href) {
    if (!looksLikeUrl(href)) return null;
    const s = href.trim();
    if (/^(https?|mailto|tel|ftp):/i.test(s)) return s;
    if (s.startsWith('//')) return `https:${s}`;
    return `https://${s}`;
}

function SourceLink({ href, children, isFile }) {
    if (!href) {
        return <Text fontSize="xs" color="gray.600" noOfLines={1}>{children}</Text>;
    }
    return (
        <Link
            href={href}
            isExternal
            fontSize="xs"
            color="teal.600"
            display="inline-flex"
            alignItems="center"
            maxW="100%"
        >
            <Text as="span" noOfLines={1}>{isFile ? '📎 ' : ''}{children}</Text>
            <ExternalLinkIcon ml={1} boxSize={2.5} flexShrink={0} />
        </Link>
    );
}

function GovernanceSources({ documents = [], webpages = [], hasRawText, emptyHint = true }) {
    const items = [];

    documents.forEach((d) => {
        // Preference order matches what actually opens the artifact: the managed
        // upload first, then a URI, then a bare path (which is not a link at all).
        const label = d.file?.original_filename || d.name || 'Document';
        const href = d.file?.download_url || normalizeHref(d.uri_path) || null;
        items.push({
            key: `d-${d.unique_id}`,
            href,
            label,
            isFile: Boolean(d.file?.download_url),
            size: d.file?.size,
            // A document with neither an upload nor a URI is a record of a thing we
            // do not actually hold — worth showing, but it is not a link.
            unreachable: !href && !d.file_path,
        });
    });

    webpages.forEach((w) => {
        const href = normalizeHref(w.url) || normalizeHref(w.name);
        items.push({
            key: `w-${w.unique_id}`,
            href,
            label: w.name && !looksLikeUrl(w.name) ? w.name : (href || w.name || 'Webpage'),
            isFile: false,
        });
    });

    if (items.length === 0) {
        if (!emptyHint) return null;
        return (
            <Text fontSize="xs" color="gray.600" fontStyle="italic" mt={2}>
                No source document attached
                {hasRawText === false ? ' — and its text has not been captured' : ''}.
            </Text>
        );
    }

    return (
        <VStack align="stretch" spacing={0} mt={2}>
            <Wrap spacing={3} shouldWrapChildren>
                {items.map((it) => (
                    <WrapItem key={it.key} maxW="100%">
                        <HStack spacing={1} maxW="100%">
                            <SourceLink href={it.href} isFile={it.isFile}>{it.label}</SourceLink>
                            {it.size != null ? (
                                <Text fontSize="2xs" color="gray.600" flexShrink={0}>
                                    ({Math.max(1, Math.round(it.size / 1024))} KB)
                                </Text>
                            ) : null}
                            {it.unreachable ? (
                                <Text fontSize="2xs" color="gray.600" flexShrink={0}>(no file)</Text>
                            ) : null}
                        </HStack>
                    </WrapItem>
                ))}
            </Wrap>
        </VStack>
    );
}

export default GovernanceSources;
