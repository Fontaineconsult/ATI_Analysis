/*
 * Artifact configuration shared by every rendering of the get_indicator_report payload.
 *
 * Config-module pattern (see implementationConfig.js, assetConfig.js): the taxonomy and
 * the link-resolution rule live here so no presentation re-derives them. The approval
 * page's first standalone template re-derived both and got both subtly wrong — dropped
 * the FILE/URL and WEB/GONE distinctions, and de-linked webpages that were merely
 * deprecated. This module is why that cannot recur.
 */

// Canonical artifact link resolution: uploaded (managed) files carry their link at
// file.download_url — the flat file_path/uri_path are null for them, which is why a plain
// `file_path || uri_path` produced dead links. Mirrors FileDownload in docPrimitives.jsx.
export const resolveArtifactHref = (node) =>
    node?.file?.download_url || node?.uri_path || node?.file_path || null;

export const ARTIFACT_TAG = {
    FILE:   { scheme: 'teal',   variant: 'solid' },
    URL:    { scheme: 'blue',   variant: 'solid' },
    WEB:    { scheme: 'blue',   variant: 'outline' },
    GONE:   { scheme: 'red',    variant: 'solid' },
    NOTE:   { scheme: 'purple', variant: 'subtle' },
    MSG:    { scheme: 'cyan',   variant: 'subtle' },
    METRIC: { scheme: 'green',  variant: 'subtle' },
};

/** "date · size KB" for an uploaded file, or null when there is nothing to say. */
export const fileMeta = (file) => {
    if (!file) return null;
    const kb = file.size != null ? `${Math.max(1, Math.round(file.size / 1024))} KB` : null;
    return [file.uploaded_date, kb].filter(Boolean).join(' · ') || null;
};

/** Boolean flags arrive as true or the legacy string "True". */
export const isTrue = (v) => v === true || v === 'True';
