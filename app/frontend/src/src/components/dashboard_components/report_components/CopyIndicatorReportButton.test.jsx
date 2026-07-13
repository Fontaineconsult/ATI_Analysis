/**
 * RTL test for CopyIndicatorReportButton — verifies it builds the export and hands it to the
 * shared clipboard helper. copyRichContent is mocked (no real clipboard in jsdom).
 */
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ChakraProvider } from '@chakra-ui/react';

jest.mock('../../../services/utils/copyToClipboard', () => ({
    __esModule: true,
    copyRichContent: jest.fn().mockResolvedValue('html'),
}));

import { copyRichContent } from '../../../services/utils/copyToClipboard';
import CopyIndicatorReportButton from './CopyIndicatorReportButton';

const REPORT = {
    indicator: { composite_key: '1.2-web', goal_number: 1, goal_name: 'G', success_indicator: 'SI', working_group: 'Web' },
    year: '2025-2026',
    campus: { abbreviation: 'sfsu', name: 'SFSU' },
    status: null, yse: {},
    people: { implementers: [{ unique_id: 'p1', name: 'Ivy', email: 'ivy@example.edu' }] },
    admin_review_notes: [],
    implementations: [], taaps: [], assets: [], interfaces: [], tools: [], vendors: [],
    plans: [], accomplishments: [], notes: [], messages: [], metrics: [],
};

const renderButton = (report = REPORT) => render(
    <ChakraProvider><CopyIndicatorReportButton report={report} /></ChakraProvider>,
);

beforeEach(() => copyRichContent.mockClear());

describe('CopyIndicatorReportButton', () => {
    it('copies the built HTML + plain text on click', async () => {
        renderButton();
        await userEvent.click(screen.getByRole('button', { name: /copy report/i }));

        await waitFor(() => expect(copyRichContent).toHaveBeenCalledTimes(1));
        const arg = copyRichContent.mock.calls[0][0];
        expect(arg.html).toContain('1.2-web');
        expect(arg.html).toContain('mailto:ivy@example.edu');
        expect(arg.plainText).toContain('1.2-web');
    });
});
