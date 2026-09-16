import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ChakraProvider } from '@chakra-ui/react';

jest.mock('axios', () => ({
    __esModule: true,
    default: { get: jest.fn(), post: jest.fn(), put: jest.fn() },
}));
jest.mock('../../../services/api/put', () => ({
    updateWebpageSourceText: jest.fn(),
}));

import { updateWebpageSourceText } from '../../../services/api/put';
import SourcePageTextModal from './SourcePageTextModal';

const PAGE = {
    unique_id: 'w1',
    name: 'ICT Procurement Procedures (Michigan Technological University)',
    url: 'https://www.mtu.edu/accessibility/policies/procedures/procurement/',
    raw_text: null,
    raw_text_captured: null,
};

const renderModal = (props = {}) =>
    render(
        <ChakraProvider>
            <SourcePageTextModal isOpen page={PAGE} onClose={jest.fn()} onSaved={jest.fn()} {...props} />
        </ChakraProvider>,
    );

beforeEach(() => jest.clearAllMocks());

describe('SourcePageTextModal', () => {
    it('renders no dialog without a page', () => {
        render(
            <ChakraProvider>
                <SourcePageTextModal isOpen page={null} onClose={jest.fn()} />
            </ChakraProvider>,
        );
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
        expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    });

    it('shows the page name and links out to the live page', () => {
        renderModal();
        expect(screen.getByText(/ICT Procurement Procedures/)).toBeInTheDocument();
        expect(screen.getByRole('link', { name: /mtu\.edu/ })).toHaveAttribute('href', PAGE.url);
    });

    /**
     * The whole point of the narrow write: the six-argument updateWebpage would also
     * reassign a maintainer and add year-inclusion and YSE edges. A text edit sends the
     * id and the text, nothing else.
     */
    it('saves only the id and the text', async () => {
        updateWebpageSourceText.mockResolvedValue({});
        const onSaved = jest.fn();
        const onClose = jest.fn();
        renderModal({ onSaved, onClose });

        fireEvent.change(screen.getByRole('textbox'), { target: { value: 'the page text' } });
        fireEvent.click(screen.getByRole('button', { name: /save text/i }));

        await waitFor(() => expect(onSaved).toHaveBeenCalled());
        expect(updateWebpageSourceText).toHaveBeenCalledWith('w1', 'the page text');
        expect(updateWebpageSourceText).toHaveBeenCalledTimes(1);
        expect(onClose).toHaveBeenCalled();
    });

    it('will not re-save unchanged text, so the capture date cannot be refreshed for nothing', () => {
        renderModal({ page: { ...PAGE, raw_text: 'already here', raw_text_captured: '2026-09-16' } });
        expect(screen.getByRole('button', { name: /no changes/i })).toBeDisabled();
        expect(screen.getByText(/last captured 2026-09-16/i)).toBeInTheDocument();
    });

    it('allows clearing the text', async () => {
        updateWebpageSourceText.mockResolvedValue({});
        renderModal({ page: { ...PAGE, raw_text: 'remove me' } });

        fireEvent.change(screen.getByRole('textbox'), { target: { value: '' } });
        fireEvent.click(screen.getByRole('button', { name: /save text/i }));

        await waitFor(() => expect(updateWebpageSourceText).toHaveBeenCalledWith('w1', ''));
    });

    it('stays open when the save fails', async () => {
        updateWebpageSourceText.mockRejectedValue(new Error('nope'));
        const onClose = jest.fn();
        renderModal({ onClose });

        fireEvent.change(screen.getByRole('textbox'), { target: { value: 'x' } });
        fireEvent.click(screen.getByRole('button', { name: /save text/i }));

        await waitFor(() => expect(updateWebpageSourceText).toHaveBeenCalled());
        expect(onClose).not.toHaveBeenCalled();
    });
});
