import React from 'react';
import { render, screen } from '@testing-library/react';
import { ChakraProvider } from '@chakra-ui/react';
import Markdown from './Markdown';

const renderWithChakra = (ui) => render(<ChakraProvider>{ui}</ChakraProvider>);

describe('Markdown', () => {
    it('renders headings and list items from Markdown', () => {
        renderWithChakra(<Markdown>{'# Agenda\n\n- First item\n- Second item'}</Markdown>);
        expect(screen.getByRole('heading', { name: 'Agenda' })).toBeInTheDocument();
        expect(screen.getByText('First item')).toBeInTheDocument();
        expect(screen.getByText('Second item')).toBeInTheDocument();
    });

    it('renders nothing for empty content', () => {
        renderWithChakra(<Markdown>{''}</Markdown>);
        expect(screen.queryByRole('heading')).toBeNull();
    });
});
