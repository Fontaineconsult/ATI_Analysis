/**
 * The dashboard's governing-authority panel. What matters here is that it reaches the
 * SAME `drives` edge from the indicator end — writes go through the /governance
 * actions with the governance type recovered from the candidate pool — and that the
 * goal-level `informs` edges stay clearly marked as inherited context, not edges on
 * this indicator.
 */
jest.mock('axios', () => ({
    __esModule: true,
    default: {
        get: jest.fn(),
        put: jest.fn(),
        defaults: { withCredentials: false, headers: { common: {} } },
        interceptors: { request: { use: jest.fn() }, response: { use: jest.fn() } },
    },
}));
jest.mock('../../../services/api/get', () => ({
    fetchGovernanceForIndicator: jest.fn(),
}));
jest.mock('../../../services/api/put', () => ({
    attachIndicatorToGovernance: jest.fn(),
    detachIndicatorFromGovernance: jest.fn(),
    updateGovernanceIndicatorCitation: jest.fn(),
}));

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ChakraProvider } from '@chakra-ui/react';
import IndicatorGovernancePanel from './IndicatorGovernancePanel';
import { fetchGovernanceForIndicator } from '../../../services/api/get';
import { attachIndicatorToGovernance, detachIndicatorFromGovernance } from '../../../services/api/put';

const PAYLOAD = {
    status: 'success',
    data: {
        unique_id: 'si-uid-1',
        composite_key: '1.1-web',
        success_indicator: 'Assigned authority for evaluation',
        goal: { unique_id: 'goal-1', goal_number: 1, name: 'Web Accessibility Evaluation Process' },
        driving: [
            { label: 'Guideline', type: 'guideline', unique_id: 'gov-9', title: 'WCAG 2.1',
              provision: 'SC 1.2.4', quote: 'Captions are provided.', note: null, added_date: '2026-08-12',
              has_raw_text: true,
              documents: [
                  { unique_id: 'd1', name: 'WCAG 2.1 Spec', uri_path: null, file_path: null,
                    file: { storage_key: 'abc', original_filename: 'wcag21.pdf', size: 2048,
                            download_url: '/ati/data-api/v1/files/abc?name=wcag21.pdf' } },
                  { unique_id: 'd2', name: 'Quick Reference', uri_path: 'www.w3.org/WAI/WCAG21/quickref',
                    file_path: null, file: null },
              ],
              webpages: [{ unique_id: 'w1', name: 'W3C WCAG landing', url: 'https://www.w3.org/WAI/' }] },
        ],
        informing_goal: [
            { label: 'ExternalPolicy', type: 'external_policy', unique_id: 'gov-3', title: 'CSU Systemwide ATI Policy',
              documents: [], webpages: [{ unique_id: 'w2', name: 'https://calstate.edu/ati', url: 'CSU ATI' }] },
        ],
        candidates: [
            { label: 'Guideline', type: 'guideline', unique_id: 'gov-9', title: 'WCAG 2.1' },
            { label: 'Guideline', type: 'guideline', unique_id: 'gov-10', title: 'WCAG 2.2' },
            { label: 'Law', type: 'law', unique_id: 'gov-1', title: 'Section 508' },
            { label: 'Law', type: 'law', unique_id: 'gov-2', title: 'Cal. Gov. Code §7405' },
        ],
    },
};

const renderPanel = () =>
    render(
        <ChakraProvider>
            <IndicatorGovernancePanel compositeKey="1.1-web" />
        </ChakraProvider>,
    );

/** The panel starts collapsed; most assertions need the body open. */
const expand = async () => {
    await userEvent.click(screen.getByRole('button', { name: /Governing Authority/ }));
    await waitFor(() => expect(fetchGovernanceForIndicator)
        .toHaveBeenCalledWith('1.1-web', true));
    // Chakra's Collapse keeps the panel out of the a11y tree until the transition
    // settles, so wait for a body control to actually be reachable before asserting.
    await screen.findByRole('button', { name: /Link an instrument/ });
};

beforeEach(() => {
    jest.clearAllMocks();
    fetchGovernanceForIndicator.mockResolvedValue(PAYLOAD);
});

it('starts collapsed, with the body hidden', async () => {
    renderPanel();
    await waitFor(() => expect(fetchGovernanceForIndicator).toHaveBeenCalled());

    expect(screen.getByRole('button', { name: /Governing Authority/ }))
        .toHaveAttribute('aria-expanded', 'false');
    // Collapsed content is out of the a11y tree, so no control is reachable.
    expect(screen.queryByRole('button', { name: 'Remove' })).not.toBeInTheDocument();
});

it('does not request the candidate pool until first expanded', async () => {
    renderPanel();

    // Initial load omits candidates — they are ~93% of the payload.
    await waitFor(() => expect(fetchGovernanceForIndicator).toHaveBeenCalledWith('1.1-web', false));

    await expand();
});

it('summarises counts in the collapsed header, so collapsing does not hide the signal', async () => {
    renderPanel();

    expect(await screen.findByText('1 driving · 1 behind goal')).toBeInTheDocument();
});

it('loads by composite key and shows the driving instrument with its citation', async () => {
    renderPanel();
    await expand();

    expect(await screen.findByText('WCAG 2.1')).toBeInTheDocument();
    expect(screen.getByText('SC 1.2.4')).toBeInTheDocument();
    expect(screen.getByText('Captions are provided.')).toBeInTheDocument();
    expect(screen.queryByText('Uncited')).not.toBeInTheDocument();
});

it('shows goal-level informs edges as inherited context, named by their goal', async () => {
    renderPanel();
    await expand();

    expect(await screen.findByText(/Behind the goal: Web Accessibility Evaluation Process/)).toBeInTheDocument();
    expect(screen.getByText('CSU Systemwide ATI Policy')).toBeInTheDocument();
    // Context only — there is no control to remove a goal-level edge from here.
    expect(screen.getAllByRole('button', { name: 'Remove' })).toHaveLength(1);
});

it('groups the instrument picker by governance type and omits already-linked ones', async () => {
    const { container } = renderPanel();
    await expand();

    await userEvent.click(screen.getByRole('button', { name: '+ Link an instrument' }));

    expect(Array.from(container.querySelectorAll('optgroup')).map((g) => g.label)).toEqual(['Guideline', 'Law']);
    const options = screen.getAllByRole('option').map((o) => o.textContent);
    expect(options).toContain('Section 508');
    expect(options).toContain('WCAG 2.2');
    expect(options).not.toContain('WCAG 2.1');   // already driving
});

it('drops a governance type whose every instrument is already linked', async () => {
    fetchGovernanceForIndicator.mockResolvedValue({
        ...PAYLOAD,
        data: {
            ...PAYLOAD.data,
            candidates: PAYLOAD.data.candidates.filter((c) => c.unique_id !== 'gov-10'),
        },
    });
    const { container } = renderPanel();
    await expand();

    await userEvent.click(screen.getByRole('button', { name: '+ Link an instrument' }));

    // WCAG 2.1 is the only Guideline and it already drives this indicator, so the
    // group is empty and must not render as a bare heading.
    expect(Array.from(container.querySelectorAll('optgroup')).map((g) => g.label)).toEqual(['Law']);
});

it('writes through the governance action, recovering the type from the candidate pool', async () => {
    attachIndicatorToGovernance.mockResolvedValue({});
    renderPanel();
    await expand();

    await userEvent.click(screen.getByRole('button', { name: '+ Link an instrument' }));
    await userEvent.selectOptions(screen.getByLabelText('Governance instrument'), 'gov-1');
    await userEvent.type(screen.getByLabelText('Provision'), '§1194.22');
    await userEvent.click(screen.getByRole('button', { name: 'Link instrument' }));

    // 'law' comes from the candidate row, not from anything the selector knows.
    await waitFor(() => expect(attachIndicatorToGovernance).toHaveBeenCalledWith(
        'law', 'gov-1', 'si-uid-1', { provision: '§1194.22', quote: '', note: '' },
    ));
    // Refetches after a successful write (mount, expand, then this).
    await waitFor(() => expect(fetchGovernanceForIndicator).toHaveBeenCalledTimes(3));
    // The refetch keeps the picker populated — it must not drop back to the
    // candidate-free payload just because the write did not go through expand().
    expect(fetchGovernanceForIndicator).toHaveBeenLastCalledWith('1.1-web', true);
});

it('detaches with the indicator on the far side of the call', async () => {
    detachIndicatorFromGovernance.mockResolvedValue({});
    renderPanel();
    await expand();

    await userEvent.click(screen.getByRole('button', { name: 'Remove' }));

    await waitFor(() => expect(detachIndicatorFromGovernance).toHaveBeenCalledWith(
        'guideline', 'gov-9', 'si-uid-1',
    ));
});

it('flags an uncited edge', async () => {
    fetchGovernanceForIndicator.mockResolvedValue({
        ...PAYLOAD,
        data: {
            ...PAYLOAD.data,
            driving: [{ label: 'Law', type: 'law', unique_id: 'gov-1', title: 'Section 508',
                        provision: null, quote: null, note: null }],
        },
    });
    renderPanel();
    // The uncited count rides in the collapsed header — that is the point of it.
    expect(await screen.findByText('1 uncited')).toBeInTheDocument();
    await expand();
    expect(screen.getByText('Uncited')).toBeInTheDocument();
});

it('omits the inherited block when the goal has no informs edges', async () => {
    fetchGovernanceForIndicator.mockResolvedValue({
        ...PAYLOAD,
        data: { ...PAYLOAD.data, informing_goal: [] },
    });
    renderPanel();
    await expand();

    await screen.findByText('WCAG 2.1');
    expect(screen.queryByText(/Behind the goal/)).not.toBeInTheDocument();
});

it('surfaces a load failure instead of rendering an empty panel', async () => {
    fetchGovernanceForIndicator.mockRejectedValue(new Error('backend down'));
    renderPanel();

    expect(await screen.findByText('backend down')).toBeInTheDocument();
});


describe('source artifacts', () => {
    it('links an uploaded file by its download url, with size', async () => {
        renderPanel();
        await expand();

        const link = await screen.findByRole('link', { name: /wcag21\.pdf/ });
        expect(link).toHaveAttribute('href', '/ati/data-api/v1/files/abc?name=wcag21.pdf');
        expect(screen.getByText('(2 KB)')).toBeInTheDocument();
    });

    it('falls back to the uri when a document has no uploaded file', async () => {
        renderPanel();
        await expand();

        // Bare domains must be promoted to https, or the browser resolves them
        // relative to the current route.
        expect(await screen.findByRole('link', { name: /Quick Reference/ }))
            .toHaveAttribute('href', 'https://www.w3.org/WAI/WCAG21/quickref');
    });

    it('handles webpages whose name and url fields are swapped', async () => {
        renderPanel();
        await expand();

        // Context row: name holds the URL, url holds the title.
        const link = await screen.findByRole('link', { name: /calstate\.edu\/ati/ });
        expect(link).toHaveAttribute('href', 'https://calstate.edu/ati');
    });

    it('says so when a cited instrument has no source artifact', async () => {
        fetchGovernanceForIndicator.mockResolvedValue({
            ...PAYLOAD,
            data: {
                ...PAYLOAD.data,
                driving: [{ ...PAYLOAD.data.driving[0], documents: [], webpages: [], has_raw_text: false }],
            },
        });
        renderPanel();
        await expand();

        expect(await screen.findByText(/No source document attached — and its text has not been captured/))
            .toBeInTheDocument();
    });

    it('does not nag about missing sources on inherited goal-level rows', async () => {
        fetchGovernanceForIndicator.mockResolvedValue({
            ...PAYLOAD,
            data: {
                ...PAYLOAD.data,
                informing_goal: [{ ...PAYLOAD.data.informing_goal[0], documents: [], webpages: [] }],
            },
        });
        renderPanel();
        await expand();

        await screen.findByText('CSU Systemwide ATI Policy');
        // The driving row still nags if it lacks sources; the context row never does.
        expect(screen.queryByText(/No source document attached/)).not.toBeInTheDocument();
    });
});
