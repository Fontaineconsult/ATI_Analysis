import React from 'react';
import { ChakraProvider } from '@chakra-ui/react';
import { fireEvent, render, screen, within } from '@testing-library/react';

import MetricDisplay from './MetricDisplay';

const SNAPSHOT = {
    schema: 'popetech-metric-snapshot/1',
    org: { campus: 'sfsu', name: 'San Francisco State University' },
    as_of: '2026-10-12',
    has_data: true,
    coverage: { pages: 21960, pages_delta: -2294 },
    errors: {
        excl_contrast: 11168,
        excl_contrast_per_page: 0.5086,
        categories: { contrast: { count: 54881 }, images: { count: 80 } },
        types: [{ name: 'Very low contrast', category: 'contrast', count: 54881, pages: 14207 }],
    },
    alerts: { total: 398576 },
};

// As the implementations Metrics tab receives it: the JSON still a string.
const IMPLEMENTATION_METRIC = {
    name: 'Pope Tech WAVE errors (sfsu)',
    value_dict: JSON.stringify(SNAPSHOT),
    value_schema: 'popetech-metric-snapshot/1',
    measured_on: '2026-10-12',
    description: 'Pope Tech WAVE scan of SFSU.',
    uri_path: 'https://pope.tech/report',
};

const renderDisplay = (props) => render(<ChakraProvider><MetricDisplay {...props} /></ChakraProvider>);

describe('MetricDisplay', () => {
    it('renders a templated metric from a raw implementation payload', () => {
        renderDisplay({ metric: IMPLEMENTATION_METRIC });

        expect(screen.getByText('Errors per page, excluding contrast')).toBeInTheDocument();
        expect(screen.getByText('0.51')).toBeInTheDocument();
        expect(screen.getByText('Pope Tech scan snapshot')).toBeInTheDocument();
        expect(screen.getByText('-2,294')).toBeInTheDocument();

        const table = screen.getByRole('table', { name: 'Errors by category' });
        const rows = within(table).getAllByRole('row');
        expect(within(rows[1]).getByRole('rowheader')).toHaveTextContent('Contrast');
    });

    it('keeps detail behind a toggle and opens it on request', () => {
        renderDisplay({ metric: IMPLEMENTATION_METRIC });
        const toggle = screen.getByRole('button', { name: 'More detail' });
        expect(toggle).toHaveAttribute('aria-expanded', 'false');
        expect(screen.queryByRole('table', { name: 'Errors by type' })).not.toBeInTheDocument();

        fireEvent.click(toggle);
        expect(screen.getByRole('table', { name: 'Errors by type' })).toBeInTheDocument();
        expect(screen.getByLabelText('Stored value as JSON')).toBeInTheDocument();
    });

    it('starts open in the full variant', () => {
        renderDisplay({ metric: IMPLEMENTATION_METRIC, variant: 'full' });
        expect(screen.getByRole('button', { name: 'Less detail' })).toHaveAttribute('aria-expanded', 'true');
    });

    it('shows record fields unless the host already does', () => {
        const { unmount } = renderDisplay({ metric: IMPLEMENTATION_METRIC });
        expect(screen.getByText('Pope Tech WAVE scan of SFSU.')).toBeInTheDocument();
        expect(screen.getByRole('link', { name: /pope\.tech\/report/ })).toHaveAttribute('href', 'https://pope.tech/report');
        unmount();

        renderDisplay({ metric: IMPLEMENTATION_METRIC, showRecord: false });
        expect(screen.queryByText('Pope Tech WAVE scan of SFSU.')).not.toBeInTheDocument();
    });

    it('renders a single value with no JSON', () => {
        renderDisplay({ metric: { single_value: '4444' } });
        expect(screen.getByText('4,444')).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'More detail' })).not.toBeInTheDocument();
    });

    it('lays out JSON with no template and says so in the details', () => {
        renderDisplay({ metric: { data: { score: 87.5, site: 'library' }, value_schema: 'unknown/1' } });
        expect(screen.getByText('87.5')).toBeInTheDocument();
        fireEvent.click(screen.getByRole('button', { name: 'More detail' }));
        expect(screen.getByText(/No template for this value/)).toBeInTheDocument();
    });

    it('states an empty value', () => {
        renderDisplay({ metric: { value_dict: '' } });
        expect(screen.getByText('No stored value.')).toBeInTheDocument();
    });

    it('fits on one line in the row variant', () => {
        renderDisplay({ metric: IMPLEMENTATION_METRIC, variant: 'row' });
        expect(screen.getByText('0.51')).toBeInTheDocument();
        expect(screen.queryByRole('table')).not.toBeInTheDocument();
    });
});
