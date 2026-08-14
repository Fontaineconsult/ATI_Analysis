/**
 * Filter state lives in the URL so a narrowed report can be pasted into an email.
 * These tests are about that contract: what the URL says, what the hook reads back,
 * and what it leaves alone.
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import useReportFilters from './useReportFilters';

// Probe: renders the hook's state and the live URL so assertions can read both.
function Probe() {
    const { active, isActive, toggle, clear } = useReportFilters();
    const location = useLocation();
    // MemoryRouter keeps its own history stack; window.history.back() does not drive it.
    const navigate = useNavigate();
    return (
        <div>
            <span data-testid="active">{active.join('|')}</span>
            <span data-testid="search">{location.search}</span>
            <span data-testid="hash">{location.hash}</span>
            <span data-testid="ready-active">{String(isActive('ready-for-review'))}</span>
            <button onClick={() => toggle('ready-for-review')}>toggle ready</button>
            <button onClick={() => toggle('unassigned')}>toggle unassigned</button>
            <button onClick={clear}>clear</button>
            <button onClick={() => navigate(-1)}>back</button>
        </div>
    );
}

const renderAt = (entry) =>
    render(
        <MemoryRouter initialEntries={[entry]}>
            <Routes><Route path="/reports" element={<Probe />} /></Routes>
        </MemoryRouter>,
    );

const active = () => screen.getByTestId('active').textContent;
const search = () => screen.getByTestId('search').textContent;

it('starts empty with no query string', () => {
    renderAt('/reports');
    expect(active()).toBe('');
    expect(search()).toBe('');
});

it('reads filters out of the URL on load — the shared-link case', () => {
    renderAt('/reports?attention=ready-for-review');
    expect(active()).toBe('ready-for-review');
    expect(screen.getByTestId('ready-active')).toHaveTextContent('true');
});

it('reads several, in canonical order regardless of how they were written', () => {
    renderAt('/reports?attention=ready-for-review,unassigned');
    expect(active()).toBe('unassigned|ready-for-review');
});

it('ignores an unknown token instead of breaking the page', () => {
    renderAt('/reports?attention=unassigned,fictional');
    expect(active()).toBe('unassigned');
});

it('writes a toggled filter into the query string', async () => {
    renderAt('/reports');
    await userEvent.click(screen.getByRole('button', { name: 'toggle ready' }));
    expect(search()).toBe('?attention=ready-for-review');
    expect(active()).toBe('ready-for-review');
});

it('toggles the same filter back off and drops the param entirely', async () => {
    renderAt('/reports?attention=ready-for-review');
    await userEvent.click(screen.getByRole('button', { name: 'toggle ready' }));
    expect(search()).toBe('');
});

it('clear removes everything', async () => {
    renderAt('/reports?attention=unassigned,ready-for-review');
    await userEvent.click(screen.getByRole('button', { name: 'clear' }));
    expect(search()).toBe('');
    expect(active()).toBe('');
});

it('leaves unrelated query params alone', async () => {
    renderAt('/reports?campus=sfsu');
    await userEvent.click(screen.getByRole('button', { name: 'toggle ready' }));
    expect(search()).toContain('campus=sfsu');
    expect(search()).toContain('attention=ready-for-review');
});

it('leaves the hash alone, so row deep links survive filtering', async () => {
    renderAt('/reports#1.1-web');
    await userEvent.click(screen.getByRole('button', { name: 'toggle ready' }));
    expect(screen.getByTestId('hash')).toHaveTextContent('#1.1-web');
    expect(search()).toBe('?attention=ready-for-review');
});

it('pushes history, so Back undoes one filter at a time', async () => {
    renderAt('/reports');
    await userEvent.click(screen.getByRole('button', { name: 'toggle ready' }));
    await userEvent.click(screen.getByRole('button', { name: 'toggle unassigned' }));
    expect(active()).toBe('unassigned|ready-for-review');

    await userEvent.click(screen.getByRole('button', { name: 'back' }));
    expect(active()).toBe('ready-for-review');
});

describe('status, trend and search facets in the URL', () => {
    function FacetProbe() {
        const { state, toggleStatus, toggleTrend, setSearch, clear } = useReportFilters(['Defined', 'Managed']);
        const location = useLocation();
        return (
            <div>
                <span data-testid="status">{state.status.join('|')}</span>
                <span data-testid="trend">{state.trend.join('|')}</span>
                <span data-testid="q">{state.q}</span>
                <span data-testid="search">{location.search}</span>
                <button onClick={() => toggleStatus('Defined')}>toggle Defined</button>
                <button onClick={() => toggleTrend('declining')}>toggle declining</button>
                <button onClick={() => setSearch('captioning')}>search</button>
                <button onClick={clear}>clear all</button>
            </div>
        );
    }

    const renderFacets = (entry) =>
        render(
            <MemoryRouter initialEntries={[entry]}>
                <Routes><Route path="/reports" element={<FacetProbe />} /></Routes>
            </MemoryRouter>,
        );

    it('reads all four facets from a shared link', () => {
        renderFacets('/reports?attention=unassigned&status=Defined&trend=declining&q=captioning');
        expect(screen.getByTestId('status')).toHaveTextContent('Defined');
        expect(screen.getByTestId('trend')).toHaveTextContent('declining');
        expect(screen.getByTestId('q')).toHaveTextContent('captioning');
    });

    it('drops a status value outside the supplied vocabulary', () => {
        renderFacets('/reports?status=Defined,Ascended');
        expect(screen.getByTestId('status')).toHaveTextContent('Defined');
    });

    it('drops an unknown trend key', () => {
        renderFacets('/reports?trend=sideways');
        expect(screen.getByTestId('trend').textContent).toBe('');
    });

    it('writes status and trend as their own params', async () => {
        renderFacets('/reports');
        await userEvent.click(screen.getByRole('button', { name: 'toggle Defined' }));
        await userEvent.click(screen.getByRole('button', { name: 'toggle declining' }));
        expect(screen.getByTestId('search').textContent).toContain('status=Defined');
        expect(screen.getByTestId('search').textContent).toContain('trend=declining');
    });

    it('toggles a value back off', async () => {
        renderFacets('/reports?status=Defined');
        await userEvent.click(screen.getByRole('button', { name: 'toggle Defined' }));
        expect(screen.getByTestId('search').textContent).not.toContain('status');
    });

    it('trims the search term and drops the param when it is blank', async () => {
        renderFacets('/reports?q=old');
        await userEvent.click(screen.getByRole('button', { name: 'search' }));
        expect(screen.getByTestId('search').textContent).toContain('q=captioning');
    });

    it('clear all removes every facet at once', async () => {
        renderFacets('/reports?attention=unassigned&status=Defined&trend=declining&q=captioning');
        await userEvent.click(screen.getByRole('button', { name: 'clear all' }));
        expect(screen.getByTestId('search').textContent).toBe('');
    });

    it('clear all leaves unrelated params alone', async () => {
        renderFacets('/reports?campus=sfsu&status=Defined');
        await userEvent.click(screen.getByRole('button', { name: 'clear all' }));
        expect(screen.getByTestId('search').textContent).toBe('?campus=sfsu');
    });
});
