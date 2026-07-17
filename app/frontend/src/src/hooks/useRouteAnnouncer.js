import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * SPA wayfinding for route changes (design-sense §6.1, APG Landmarks):
 *  - keeps document.title in sync with the current page,
 *  - moves focus to <main id="main-content"> when the *page* changes (so keyboard
 *    users don't re-tab through the whole header after every navigation),
 *  - returns an announcement string for an aria-live region (screen readers get
 *    told where they landed — React Router announces nothing by itself).
 *
 * "Page" identity is the campus + area + section URL segments. Deeper param
 * changes (selecting an indicator inside a goal view, opening a detail row)
 * deliberately do NOT steal focus — those are in-page selections, not navigation.
 */

const SEGMENT_LABELS = {
    'ati-explorer': 'ATI Explorer',
    dashboard: 'Dashboard',
    about: 'About',
    web: 'Web',
    'instructional-materials': 'Instructional Materials',
    procurement: 'Procurement',
    reports: 'View Reports',
    'report-overview': 'Copy Report',
    'campus-plan': 'Campus Plan',
    settings: 'Settings',
    implementations: 'Implementations',
    plans: 'Plans',
    people: 'People',
    governance: 'Governance',
    principles: 'Principles',
    assets: 'Assets',
    overview: 'Overview',
    'executive-summary': 'Executive Summary',
    'core-model': 'Core Model',
    evidence: 'Evidence & Implementations',
    'adding-data': 'Adding Data',
    glossary: 'Glossary',
};

export function pageInfoFromPath(pathname) {
    // Path shape: /:campus/:area/:section?/... (basename /ati already stripped).
    const segments = pathname.split('/').filter(Boolean);
    const [, area, section] = segments;
    const parts = [SEGMENT_LABELS[area], SEGMENT_LABELS[section]].filter(Boolean);
    const pageName = parts.join(' · ');
    return {
        pageKey: segments.slice(0, 3).join('/'),
        pageName,
        title: pageName ? `${pageName} — ATI Annual Report` : 'ATI Annual Report',
    };
}

export default function useRouteAnnouncer() {
    const location = useLocation();
    const [announcement, setAnnouncement] = useState('');
    const prevPageKey = useRef(null);

    useEffect(() => {
        const { pageKey, pageName, title } = pageInfoFromPath(location.pathname);
        document.title = title;

        // First render = initial load; the browser already puts focus at the top
        // of the document, so only intervene on subsequent page-level changes.
        // The <body> guard skips redirect-on-arrival (e.g. /dashboard →
        // /dashboard/reports): no user interaction happened, so focus must stay
        // at the document start where the skip link is the first tab stop.
        if (prevPageKey.current !== null && prevPageKey.current !== pageKey) {
            if (document.activeElement && document.activeElement !== document.body) {
                document.getElementById('main-content')?.focus();
            }
            setAnnouncement(pageName || 'Page');
        }
        prevPageKey.current = pageKey;
    }, [location.pathname]);

    return announcement;
}
