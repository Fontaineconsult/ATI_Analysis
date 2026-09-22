import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ChakraProvider } from '@chakra-ui/react';

jest.mock('axios', () => ({
    __esModule: true,
    default: { get: jest.fn(), post: jest.fn(), put: jest.fn() },
}));

import SourceTextModal from './SourceTextModal';

const ITEM = {
    unique_id: 'w1',
    name: 'ICT Procurement Procedures (Michigan Technological University)',
    url: 'https://www.mtu.edu/accessibility/policies/procedures/procurement/',
    raw_text: null,
    raw_text_captured: null,
};

const renderModal = (props = {}) =>
    render(
        <ChakraProvider>
            <SourceTextModal isOpen item={ITEM} onClose={jest.fn()} onSave={jest.fn()} {...props} />
        </ChakraProvider>,
    );

beforeEach(() => jest.clearAllMocks());

describe('SourceTextModal', () => {
    it('renders no dialog without an item', () => {
        render(
            <ChakraProvider>
                <SourceTextModal isOpen item={null} onClose={jest.fn()} onSave={jest.fn()} />
            </ChakraProvider>,
        );
        expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    });

    it('shows the name and links out to the live source', () => {
        renderModal();
        expect(screen.getByText(/ICT Procurement Procedures/)).toBeInTheDocument();
        expect(screen.getByRole('link', { name: /mtu\.edu/ })).toHaveAttribute('href', ITEM.url);
    });

    /**
     * The caller supplies the writer, which is what lets one component serve webpages under
     * an intellectual source and documents under a governance instrument.
     */
    it('saves through the caller-supplied writer', async () => {
        const onSave = jest.fn().mockResolvedValue({});
        const onSaved = jest.fn();
        const onClose = jest.fn();
        renderModal({ onSave, onSaved, onClose });

        fireEvent.change(screen.getByRole('textbox'), { target: { value: 'the page text' } });
        fireEvent.click(screen.getByRole('button', { name: /save text/i }));

        await waitFor(() => expect(onSaved).toHaveBeenCalled());
        expect(onSave).toHaveBeenCalledWith('w1', 'the page text');
        expect(onClose).toHaveBeenCalled();
    });

    it('will not re-save unchanged text, so the capture date cannot be refreshed for nothing', () => {
        renderModal({ item: { ...ITEM, raw_text: 'already here', raw_text_captured: '2026-09-16' } });
        expect(screen.getByRole('button', { name: /no changes/i })).toBeDisabled();
        expect(screen.getByText(/last captured 2026-09-16/i)).toBeInTheDocument();
    });

    it('allows clearing the text', async () => {
        const onSave = jest.fn().mockResolvedValue({});
        renderModal({ item: { ...ITEM, raw_text: 'remove me' }, onSave });

        fireEvent.change(screen.getByRole('textbox'), { target: { value: '' } });
        fireEvent.click(screen.getByRole('button', { name: /save text/i }));

        await waitFor(() => expect(onSave).toHaveBeenCalledWith('w1', ''));
    });

    it('stays open when the save fails', async () => {
        const onSave = jest.fn().mockRejectedValue(new Error('nope'));
        const onClose = jest.fn();
        renderModal({ onSave, onClose });

        fireEvent.change(screen.getByRole('textbox'), { target: { value: 'x' } });
        fireEvent.click(screen.getByRole('button', { name: /save text/i }));

        await waitFor(() => expect(onSave).toHaveBeenCalled());
        expect(onClose).not.toHaveBeenCalled();
    });

    // --- the loader path, which is what governance uses -------------------------------

    it('fetches the current text when a loader is supplied', async () => {
        const loadText = jest.fn().mockResolvedValue('text fetched on open');
        renderModal({ item: { ...ITEM, raw_text: undefined }, loadText });

        await waitFor(() => expect(screen.getByRole('textbox')).toHaveValue('text fetched on open'));
        expect(loadText).toHaveBeenCalledWith('w1');
        // Loaded text is the baseline, so an untouched box is not a change.
        expect(screen.getByRole('button', { name: /no changes/i })).toBeDisabled();
    });

    /**
     * The important one. Presenting an empty box after a failed fetch would let a save wipe
     * text the fetch simply could not reach.
     */
    it('closes rather than showing an empty box when the load fails', async () => {
        const loadText = jest.fn().mockRejectedValue(new Error('network'));
        const onClose = jest.fn();
        const onSave = jest.fn();
        renderModal({ item: { ...ITEM, raw_text: undefined }, loadText, onClose, onSave });

        await waitFor(() => expect(onClose).toHaveBeenCalled());
        expect(onSave).not.toHaveBeenCalled();
    });
});
