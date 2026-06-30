/**
 * Adapt the YSE-evidence "documentation" bundle (wrapped graph nodes) to the FLAT
 * shape the canonical doc_components viewers expect.
 *
 * The evidence bundle is `{ docs, webs, notes, msgs, metrics, evidenceType, type }`
 * where each list item is a raw graph node (`{ properties: {...} }`, sometimes nested
 * under a per-type key like `{ document: {...} }`). The canonical viewers want flat
 * objects (`doc.name`, `doc.file?.download_url`) plus the implementation id/type that
 * the evidence node represents (so add/edit/unlink route correctly).
 *
 * NOTE: these nodes come from a Cypher/driver query, not neomodel `.serialize()`, so
 * `properties` carries stored fields only — the computed `file` block is absent until
 * the evidence query is taught to serialize it (a backend follow-up). `FileDownload`
 * degrades to nothing when `file` is missing; uploads still attach to the real node.
 */

const INNER_KEY = {
    docs: 'document',
    webs: 'webpage',
    notes: 'note',
    msgs: 'message',
    metrics: 'metric',
};

function flatten(list, innerKey) {
    return (Array.isArray(list) ? list : []).map((item) => {
        const node = (item && item[innerKey]) || item || {};
        const props = node.properties || node;
        return { ...props, relationship: item && item.relationship };
    });
}

export default function normalizeWrappedDocs(documentation) {
    const d = documentation || {};
    return {
        documents: flatten(d.docs, INNER_KEY.docs),
        webpages: flatten(d.webs, INNER_KEY.webs),
        notes: flatten(d.notes, INNER_KEY.notes),
        messages: flatten(d.msgs, INNER_KEY.msgs),
        metrics: flatten(d.metrics, INNER_KEY.metrics),
        implementation_id: d.evidenceType?.properties?.unique_id,
        implementation_type: d.evidenceType?.labels?.[0] || d.type,
    };
}
