/**
 * The two governance -> indicator-framework cards. The behaviour worth pinning is
 * that the two edges stay visibly distinct: `informs` is property-free, `drives`
 * shows its citation, and a drives edge with neither a provision nor a quote is
 * flagged as Uncited — the decay the two-edge split exists to prevent.
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
jest.mock('../../../services/api/put', () => ({
    attachGoalToGovernance: jest.fn(),
    detachGoalFromGovernance: jest.fn(),
    attachIndicatorToGovernance: jest.fn(),
    detachIndicatorFromGovernance: jest.fn(),
    updateGovernanceIndicatorCitation: jest.fn(),
}));

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ChakraProvider } from '@chakra-ui/react';
import GovernanceIndicatorLinks from './GovernanceIndicatorLinks';
import { attachIndicatorToGovernance, updateGovernanceIndicatorCitation } from '../../../services/api/put';

const TARGETS = {
    goals: [
        { unique_id: 'g1', goal_number: 1, name: 'Web Accessibility Evaluation Process',
          goal: 'Identify and repair inaccessible websites', working_group: 'Web' },
        { unique_id: 'g2', goal_number: 1, name: 'Procurement Processes',
          goal: 'Procurement follows Section 508', working_group: 'Procurement' },
    ],
    success_indicators: [
        { unique_id: 's1', composite_key: '1.1-web', success_indicator: 'Inventory of campus websites',
          working_group: 'Web', goal_number: 1, goal_name: 'Web Accessibility Evaluation Process' },
        { unique_id: 's2', composite_key: '1.4-web', success_indicator: 'Live captioning coverage',
          working_group: 'Web', goal_number: 1, goal_name: 'Web Accessibility Evaluation Process' },
        { unique_id: 's3', composite_key: '2.1-web', success_indicator: 'New sites meet 508',
          working_group: 'Web', goal_number: 2, goal_name: 'New Website Development Process' },
        { unique_id: 's4', composite_key: '1.1-pro', success_indicator: 'Procurement follows 508',
          working_group: 'Procurement', goal_number: 1, goal_name: 'Procurement Processes' },
    ],
};

const item = (overrides = {}) => ({
    type: 'guideline',
    unique_id: 'gov-1',
    goals: [],
    success_indicators: [],
    ...overrides,
});

const renderLinks = (props) =>
    render(
        <ChakraProvider>
            <GovernanceIndicatorLinks targets={TARGETS} onChanged={jest.fn()} {...props} />
        </ChakraProvider>,
    );

beforeEach(() => jest.clearAllMocks());

it('renders both cards with their empty states', () => {
    renderLinks({ item: item() });

    expect(screen.getByRole('heading', { name: 'Informs Goals' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Drives Success Indicators/ })).toBeInTheDocument();
    expect(screen.getByText('No goals informed yet.')).toBeInTheDocument();
    expect(screen.getByText('No indicators driven yet.')).toBeInTheDocument();
});

it('labels goals by working group, since goal_number repeats across groups', () => {
    renderLinks({ item: item() });

    // Both goals are goal_number 1; the working group is what tells them apart.
    expect(screen.getByRole('option', { name: /^Web · 1\./ })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: /^Procurement · 1\./ })).toBeInTheDocument();
});

it('shows a drives citation and does not flag it as uncited', () => {
    renderLinks({
        item: item({
            success_indicators: [{
                unique_id: 's1', composite_key: '1.1-web', success_indicator: 'Inventory of campus websites',
                provision: 'SC 1.2.4', quote: 'Captions are provided for all live audio content.',
                note: 'live-caption coverage', added_date: '2026-08-12',
            }],
        }),
    });

    expect(screen.getByText('SC 1.2.4')).toBeInTheDocument();
    expect(screen.getByText('Captions are provided for all live audio content.')).toBeInTheDocument();
    expect(screen.getByText('live-caption coverage')).toBeInTheDocument();
    expect(screen.queryByText('Uncited')).not.toBeInTheDocument();
});

it('flags a drives edge carrying neither provision nor quote', () => {
    renderLinks({
        item: item({
            success_indicators: [{
                unique_id: 's1', composite_key: '1.1-web', success_indicator: 'Inventory of campus websites',
                provision: null, quote: null, note: null,
            }],
        }),
    });

    expect(screen.getByText('Uncited')).toBeInTheDocument();
    expect(screen.getByText('1 uncited')).toBeInTheDocument();
});

it('links an indicator with its citation', async () => {
    attachIndicatorToGovernance.mockResolvedValue({});
    const onChanged = jest.fn();
    renderLinks({ item: item(), onChanged });

    await userEvent.click(screen.getByRole('button', { name: '+ Link an indicator' }));
    await userEvent.selectOptions(screen.getByLabelText('Success indicator'), 's2');
    await userEvent.type(screen.getByLabelText('Provision'), 'SC 1.2.4');
    await userEvent.type(screen.getByLabelText('Quote'), 'Captions are provided.');
    await userEvent.click(screen.getByRole('button', { name: 'Link indicator' }));

    await waitFor(() => expect(attachIndicatorToGovernance).toHaveBeenCalledWith(
        'guideline', 'gov-1', 's2',
        { provision: 'SC 1.2.4', quote: 'Captions are provided.', note: '' },
    ));
    expect(onChanged).toHaveBeenCalled();
});

it('excludes already-driven indicators from the picker', async () => {
    renderLinks({
        item: item({
            success_indicators: [{ unique_id: 's1', composite_key: '1.1-web', success_indicator: 'Inventory' }],
        }),
    });

    await userEvent.click(screen.getByRole('button', { name: '+ Link an indicator' }));
    const options = screen.getAllByRole('option').map((o) => o.textContent);
    expect(options.some((t) => t.startsWith('1.4-web'))).toBe(true);
    expect(options.some((t) => t.startsWith('1.1-web'))).toBe(false);
});

it('groups the picker by working group then goal, in backend order', async () => {
    const { container } = renderLinks({ item: item() });

    await userEvent.click(screen.getByRole('button', { name: '+ Link an indicator' }));

    // A native <select> nests only one level, so the top two levels of the framework
    // tree are folded into the optgroup label.
    const groups = Array.from(container.querySelectorAll('optgroup')).map((g) => g.label);
    expect(groups).toEqual([
        'Web › 1. Web Accessibility Evaluation Process',
        'Web › 2. New Website Development Process',
        'Procurement › 1. Procurement Processes',
    ]);

    // Indicators sit under their own goal, not pooled.
    const firstGroup = container.querySelector('optgroup');
    const keys = Array.from(firstGroup.querySelectorAll('option')).map((o) => o.textContent.split(' — ')[0]);
    expect(keys).toEqual(['1.1-web', '1.4-web']);
});

it('falls back to Unassigned for an indicator with no working group', async () => {
    const { container } = renderLinks({
        item: item(),
        targets: { goals: [], success_indicators: [{ unique_id: 'sx', composite_key: '9.9-xxx', success_indicator: 'Orphan' }] },
    });

    await userEvent.click(screen.getByRole('button', { name: '+ Link an indicator' }));
    expect(Array.from(container.querySelectorAll('optgroup')).map((g) => g.label)).toEqual(['Unassigned']);
});

it('edits a citation in place', async () => {
    updateGovernanceIndicatorCitation.mockResolvedValue({});
    renderLinks({
        item: item({
            success_indicators: [{
                unique_id: 's1', composite_key: '1.1-web', success_indicator: 'Inventory',
                provision: 'SC 1.1.1', quote: 'Original quote.', note: '',
            }],
        }),
    });

    await userEvent.click(screen.getByRole('button', { name: 'Edit' }));
    const provision = screen.getByLabelText('Provision');
    await userEvent.clear(provision);
    await userEvent.type(provision, 'SC 9.9.9');
    await userEvent.click(screen.getByRole('button', { name: 'Save indicator' }));

    await waitFor(() => expect(updateGovernanceIndicatorCitation).toHaveBeenCalledWith(
        'guideline', 'gov-1', 's1',
        { provision: 'SC 9.9.9', quote: 'Original quote.', note: '' },
    ));
});
