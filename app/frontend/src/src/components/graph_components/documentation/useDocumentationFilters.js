import { useCallback, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { DOC_FILTERS, DOC_SORTS, DOC_TYPE_ORDER } from './documentationConfig';

/**
 * Documentation filter state, held in the URL rather than in component state.
 *
 *   ?filter=orphaned            one of the diagnostic filters
 *   ?type=documents,webpages    narrow to some types within the open group
 *   ?attached=Process,Law       narrow to what the record is attached to
 *   ?sort=locator               ordering
 *   ?q=minutes                  free text over names, locators, content, parents
 *
 * The URL is the only place this can live if a filtered view is to be shareable,
 * and for this area that matters more than most: "here are the 45 orphaned
 * documents that all point at example.edu" is a reconciliation finding someone
 * needs to send to somebody else. Component state does not survive being pasted
 * into an email.
 *
 * Changes PUSH a history entry so Back undoes one step, EXCEPT the search box,
 * which REPLACES — a pushed entry per keystroke would bury the page in history
 * and make Back useless for anything else. That behaviour is copied deliberately
 * from useReportFilters, along with preserving the hash.
 *
 * DELIBERATE DUPLICATION. This does not extend useReportFilters: that hook is
 * bound to report vocabulary (status buckets, trends, communities) and sits on
 * the highest-traffic page in the app. A ~90-line local copy costs less than a
 * shared abstraction over two genuinely different facet sets, and carries no
 * regression risk for reports. If a third consumer appears, extract then.
 */

const FILTER_PARAM = 'filter';
const TYPE_PARAM = 'type';
const ATTACHED_PARAM = 'attached';
const SORT_PARAM = 'sort';
const SEARCH_PARAM = 'q';

/** Unknown tokens are dropped rather than being fatal — a stale link still opens. */
function parseList(raw, allowed) {
    if (!raw) return [];
    const seen = new Set(String(raw).split(',').map((t) => t.trim()).filter(Boolean));
    return allowed.filter((v) => seen.has(v));
}

function serializeList(values, allowed) {
    const seen = new Set(values || []);
    return allowed.filter((v) => seen.has(v)).join(',');
}

/**
 * Attachment labels are NOT validated against an allowlist, unlike types.
 *
 * The facet is built from whatever parent labels the data actually holds, so a
 * label the config has not been taught about is still selectable via the "Other"
 * family — validating here would silently drop exactly those from a shared link.
 * The tokens are only ever used for an equality check against
 * `reference_labels`, so an unknown one matches nothing and is harmless. The
 * shape guard keeps arbitrary junk out of the URL we write back.
 */
const LABEL_SHAPE = /^[A-Za-z][A-Za-z0-9_]{0,63}$/;

function parseLabels(raw) {
    if (!raw) return [];
    const seen = String(raw).split(',').map((t) => t.trim()).filter((t) => LABEL_SHAPE.test(t));
    return [...new Set(seen)];
}

export default function useDocumentationFilters() {
    const navigate = useNavigate();
    const location = useLocation();

    const params = useMemo(
        () => new URLSearchParams(location.search),
        [location.search],
    );

    const state = useMemo(() => {
        const rawFilter = params.get(FILTER_PARAM);
        const rawSort = params.get(SORT_PARAM);
        return {
            filter: rawFilter && DOC_FILTERS[rawFilter] ? rawFilter : 'all',
            types: parseList(params.get(TYPE_PARAM), DOC_TYPE_ORDER),
            attached: parseLabels(params.get(ATTACHED_PARAM)),
            sort: rawSort && DOC_SORTS[rawSort] ? rawSort : 'name',
            search: params.get(SEARCH_PARAM) || '',
        };
    }, [params]);

    const isActive = Boolean(
        state.filter !== 'all' || state.types.length || state.attached.length || state.search
        || (params.get(SORT_PARAM) && state.sort !== 'name'),
    );

    const apply = useCallback((mutate, { replace = false } = {}) => {
        const next = new URLSearchParams(location.search);
        mutate(next);
        const search = next.toString();
        navigate(
            // Preserve the hash explicitly — navigating search-only would drop it.
            `${location.pathname}${search ? `?${search}` : ''}${location.hash || ''}`,
            { replace },
        );
    }, [navigate, location.pathname, location.search, location.hash]);

    const setFilter = useCallback((filterKey) => {
        apply((p) => {
            if (!filterKey || filterKey === 'all' || !DOC_FILTERS[filterKey]) {
                p.delete(FILTER_PARAM);
            } else {
                p.set(FILTER_PARAM, filterKey);
            }
        });
    }, [apply]);

    const toggleType = useCallback((type) => {
        if (!DOC_TYPE_ORDER.includes(type)) return;
        apply((p) => {
            const current = parseList(p.get(TYPE_PARAM), DOC_TYPE_ORDER);
            const next = current.includes(type)
                ? current.filter((t) => t !== type)
                : [...current, type];
            const serialized = serializeList(next, DOC_TYPE_ORDER);
            if (serialized) p.set(TYPE_PARAM, serialized); else p.delete(TYPE_PARAM);
        });
    }, [apply]);

    const clearTypes = useCallback(() => {
        apply((p) => p.delete(TYPE_PARAM));
    }, [apply]);

    const toggleAttachment = useCallback((parentLabel) => {
        if (!LABEL_SHAPE.test(parentLabel || '')) return;
        apply((p) => {
            const current = parseLabels(p.get(ATTACHED_PARAM));
            const next = current.includes(parentLabel)
                ? current.filter((l) => l !== parentLabel)
                : [...current, parentLabel];
            if (next.length) p.set(ATTACHED_PARAM, next.join(',')); else p.delete(ATTACHED_PARAM);
        });
    }, [apply]);

    /** Whole-family toggle: selecting a family means selecting its members, so the
     *  chips stay the single representation of what is selected. */
    const toggleAttachmentGroup = useCallback((parentLabels) => {
        const group = (parentLabels || []).filter((l) => LABEL_SHAPE.test(l));
        if (!group.length) return;
        apply((p) => {
            const current = parseLabels(p.get(ATTACHED_PARAM));
            const allOn = group.every((l) => current.includes(l));
            const next = allOn
                ? current.filter((l) => !group.includes(l))
                : [...new Set([...current, ...group])];
            if (next.length) p.set(ATTACHED_PARAM, next.join(',')); else p.delete(ATTACHED_PARAM);
        });
    }, [apply]);

    const clearAttachments = useCallback(() => {
        apply((p) => p.delete(ATTACHED_PARAM));
    }, [apply]);

    const setSort = useCallback((sortKey) => {
        apply((p) => {
            if (!sortKey || sortKey === 'name' || !DOC_SORTS[sortKey]) p.delete(SORT_PARAM);
            else p.set(SORT_PARAM, sortKey);
        });
    }, [apply]);

    // Replaces rather than pushes: one history entry per keystroke would make
    // the Back button useless for anything else.
    const setSearch = useCallback((value) => {
        apply((p) => {
            if (value) p.set(SEARCH_PARAM, value); else p.delete(SEARCH_PARAM);
        }, { replace: true });
    }, [apply]);

    const clear = useCallback(() => {
        apply((p) => {
            [FILTER_PARAM, TYPE_PARAM, ATTACHED_PARAM, SORT_PARAM, SEARCH_PARAM]
                .forEach((k) => p.delete(k));
        });
    }, [apply]);

    return {
        state,
        isActive,
        setFilter,
        toggleType,
        clearTypes,
        toggleAttachment,
        toggleAttachmentGroup,
        clearAttachments,
        setSort,
        setSearch,
        clear,
    };
}
