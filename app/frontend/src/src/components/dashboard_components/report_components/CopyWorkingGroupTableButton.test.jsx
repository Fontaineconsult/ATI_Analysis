/**
 * RTL test for CopyWorkingGroupTableButton: builds the three-column table from the
 * working-group tree and hands it to the shared clipboard helper (mocked; jsdom has
 * no clipboard).
 */
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ChakraProvider } from '@chakra-ui/react';

jest.mock('../../../services/utils/copyToClipboard', () => ({
    __esModule: true,
    copyRichContent: jest.fn().mockResolvedValue('html'),
}));
jest.mock('../../../context/SettingsContext', () => ({
    __esModule: true,
    useSettings: () => ({ currentAcademicYear: '2026-2027', currentCampus: 'ssu' }),
}));

import { copyRichContent } from '../../../services/utils/copyToClipboard';
import { DataContext } from '../../../context/DataContext';
import CopyWorkingGroupTableButton from './CopyWorkingGroupTableButton';

const DATA = {
    web: {
        goals: [{
            goal: { properties: { goal_number: 1 } },
            indicators: [
                {
                    indicator: { properties: { composite_key: '1.2-web', success_indicator: 'Top pages meet WCAG.' } },
                    evidences: [{ statusLevel: { properties: { status_level: 'Defined' } } }],
                },
                {
                    indicator: { properties: { composite_key: '1.1-web', success_indicator: 'Policy published.' } },
                    evidences: [{ statusLevel: { properties: { status_level: 'Established' } } }],
                },
            ],
        }],
    },
};

const renderButton = (props = {}, data = DATA) => render(
    <ChakraProvider>
        <DataContext.Provider value={{ data }}>
            <CopyWorkingGroupTableButton workingGroup="web" label="Web" {...props} />
        </DataContext.Provider>
    </ChakraProvider>,
);

beforeEach(() => copyRichContent.mockClear());

describe('CopyWorkingGroupTableButton', () => {
    it('copies SI, name and status for the working group on click', async () => {
        renderButton();
        await userEvent.click(screen.getByRole('button', { name: /copy web table/i }));

        await waitFor(() => expect(copyRichContent).toHaveBeenCalledTimes(1));
        const { html, plainText } = copyRichContent.mock.calls[0][0];
        expect(html).toContain('1.1-web');
        expect(html).toContain('Policy published.');
        expect(html).toContain('Established');
        expect(html).toContain('SSU');
        expect(html).toContain('2026-2027');
        expect(plainText).toContain('1.2-web\tTop pages meet WCAG.\tDefined');
        // Sorted by indicator number, not by load order.
        expect(plainText.indexOf('1.1-web')).toBeLessThan(plainText.indexOf('1.2-web'));
    });

    it('prefers an explicit data prop over the context tree', async () => {
        const filtered = {
            web: { goals: [{ goal: { properties: { goal_number: 1 } }, indicators: [DATA.web.goals[0].indicators[0]] }] },
        };
        renderButton({ data: filtered });
        await userEvent.click(screen.getByRole('button', { name: /copy web table/i }));

        await waitFor(() => expect(copyRichContent).toHaveBeenCalledTimes(1));
        const { plainText } = copyRichContent.mock.calls[0][0];
        expect(plainText).toContain('1.2-web');
        expect(plainText).not.toContain('1.1-web');
    });

    it('does not touch the clipboard when the group has no indicators', async () => {
        renderButton({}, { web: { goals: [] } });
        await userEvent.click(screen.getByRole('button', { name: /copy web table/i }));
        await screen.findByText(/nothing to copy/i);
        expect(copyRichContent).not.toHaveBeenCalled();
    });
});
