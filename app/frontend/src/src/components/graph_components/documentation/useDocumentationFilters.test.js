/**
 * The filter hook's contract is the URL, so these tests assert on the URL.
 *
 * The attachment facet is the part worth pinning: unlike types, its tokens are
 * NOT validated against an allowlist, because the facet is built from whatever
 * parent labels the data holds and an allowlist would silently delete exactly
 * the unknown ones a shared link was sent to show.
 */
import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';

import useDocumentationFilters from './useDocumentationFilters';

/** Render the hook at a URL and expose the live location alongside its state. */
const at = (url) => {
    const wrapper = ({ children }) => (
        <MemoryRouter initialEntries={[url]}>
            <Routes>
                <Route path="/documentation/:docGroup" element={children} />
            </Routes>
        </MemoryRouter>
    );
    return renderHook(() => ({ ...useDocumentationFilters(), location: useLocation() }), { wrapper });
};

const search = (result) => result.current.location.search;

describe('useDocumentationFilters — attachment facet', () => {
    it('reads the labels out of the URL', () => {
        const { result } = at('/documentation/artifacts?attached=Process,Law');
        expect(result.current.state.attached).toEqual(['Process', 'Law']);
        expect(result.current.isActive).toBe(true);
    });

    it('defaults to nothing selected', () => {
        const { result } = at('/documentation/artifacts');
        expect(result.current.state.attached).toEqual([]);
        expect(result.current.isActive).toBe(false);
    });

    it('keeps a label the config has never heard of', () => {
        // The whole reason there is no allowlist here: the facet's "Other"
        // family exists to surface these, so dropping them would make a shared
        // link show the wrong list without saying so.
        const { result } = at('/documentation/artifacts?attached=SomeFutureNode');
        expect(result.current.state.attached).toEqual(['SomeFutureNode']);
    });

    it('drops tokens that are not label-shaped, and de-duplicates', () => {
        const { result } = at('/documentation/artifacts?attached=Process,,%20bad%20token,Process');
        expect(result.current.state.attached).toEqual(['Process']);
    });

    it('adds and removes one label', () => {
        const { result } = at('/documentation/artifacts');

        act(() => result.current.toggleAttachment('Process'));
        expect(search(result)).toBe('?attached=Process');

        act(() => result.current.toggleAttachment('Law'));
        expect(search(result)).toBe('?attached=Process%2CLaw');

        act(() => result.current.toggleAttachment('Process'));
        expect(search(result)).toBe('?attached=Law');
    });

    it('drops the param entirely when the last label is removed', () => {
        const { result } = at('/documentation/artifacts?attached=Process');
        act(() => result.current.toggleAttachment('Process'));
        expect(search(result)).toBe('');
    });

    it('refuses a label that is not label-shaped', () => {
        const { result } = at('/documentation/artifacts');
        act(() => result.current.toggleAttachment('not a label'));
        expect(search(result)).toBe('');
    });

    it('turns a whole family on, then off, without disturbing the rest', () => {
        const { result } = at('/documentation/artifacts?attached=Law');

        act(() => result.current.toggleAttachmentGroup(['Process', 'Service']));
        expect(result.current.state.attached).toEqual(['Law', 'Process', 'Service']);

        act(() => result.current.toggleAttachmentGroup(['Process', 'Service']));
        expect(result.current.state.attached).toEqual(['Law']);
    });

    it('completes a partly-selected family rather than clearing it', () => {
        const { result } = at('/documentation/artifacts?attached=Process');
        act(() => result.current.toggleAttachmentGroup(['Process', 'Service']));
        expect(result.current.state.attached).toEqual(['Process', 'Service']);
    });

    it('clears only the attachments', () => {
        const { result } = at('/documentation/artifacts?filter=orphaned&attached=Process&q=minutes');
        act(() => result.current.clearAttachments());
        expect(result.current.state.attached).toEqual([]);
        expect(result.current.state.filter).toBe('orphaned');
        expect(result.current.state.search).toBe('minutes');
    });

    it('is swept up by clear() with everything else', () => {
        const { result } = at('/documentation/artifacts?filter=orphaned&attached=Process&type=documents&q=x');
        act(() => result.current.clear());
        expect(search(result)).toBe('');
    });

    it('leaves the other facets alone when toggling', () => {
        const { result } = at('/documentation/artifacts?filter=shared&sort=locator');
        act(() => result.current.toggleAttachment('Process'));
        expect(result.current.state.filter).toBe('shared');
        expect(result.current.state.sort).toBe('locator');
        expect(result.current.state.attached).toEqual(['Process']);
    });
});
