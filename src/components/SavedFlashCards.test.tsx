import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SavedFlashCards } from './SavedFlashCards';
import type { FlashCard } from '../lib/types';

describe('SavedFlashCards Component', () => {
    const mockOnDelete = vi.fn();

    it('should show empty state when no saved flashcards', () => {
        render(<SavedFlashCards flashCards={[]} onDelete={mockOnDelete} />);

        expect(screen.getByText(/Brak zapisanych fiszek/i)).toBeDefined();
    });

    it('should render saved flashcards', () => {
        const flashCards: FlashCard[] = [
            {
                id: '1',
                front: 'Saved Question 1',
                back: 'Saved Answer 1',
                createdAt: '2024-01-01T10:00:00.000Z',
            },
            {
                id: '2',
                front: 'Saved Question 2',
                back: 'Saved Answer 2',
                createdAt: '2024-01-02T11:00:00.000Z',
            },
        ];

        render(<SavedFlashCards flashCards={flashCards} onDelete={mockOnDelete} />);

        expect(screen.getByText('Saved Question 1')).toBeDefined();
        expect(screen.getByText('Saved Answer 1')).toBeDefined();
        expect(screen.getByText('Saved Question 2')).toBeDefined();
        expect(screen.getByText('Saved Answer 2')).toBeDefined();
    });

    it('should display correct count in header', () => {
        const flashCards: FlashCard[] = [
            {
                id: '1',
                front: 'Q1',
                back: 'A1',
                createdAt: '2024-01-01T10:00:00.000Z',
            },
            {
                id: '2',
                front: 'Q2',
                back: 'A2',
                createdAt: '2024-01-02T11:00:00.000Z',
            },
        ];

        render(<SavedFlashCards flashCards={flashCards} onDelete={mockOnDelete} />);

        expect(screen.getByText('Zapisane fiszki (2)')).toBeDefined();
    });

    it('should call onDelete when delete button is clicked', () => {
        const flashCards: FlashCard[] = [
            {
                id: '1',
                front: 'Q1',
                back: 'A1',
                createdAt: '2024-01-01T10:00:00.000Z',
            },
        ];

        render(<SavedFlashCards flashCards={flashCards} onDelete={mockOnDelete} />);

        const deleteButton = screen.getByRole('button', { name: /Usuń fiszką/i });
        fireEvent.click(deleteButton);

        expect(mockOnDelete).toHaveBeenCalledWith('1');
    });

    it('should display creation date in Polish format', () => {
        const flashCards: FlashCard[] = [
            {
                id: '1',
                front: 'Q1',
                back: 'A1',
                createdAt: '2024-01-15T14:30:00.000Z',
            },
        ];

        render(<SavedFlashCards flashCards={flashCards} onDelete={mockOnDelete} />);

        const dateElement = screen.getByText(/15\.01\.2024/i);
        expect(dateElement).toBeDefined();
    });

    it('should render multiple delete buttons for multiple flashcards', () => {
        const flashCards: FlashCard[] = [
            {
                id: '1',
                front: 'Q1',
                back: 'A1',
                createdAt: '2024-01-01T10:00:00.000Z',
            },
            {
                id: '2',
                front: 'Q2',
                back: 'A2',
                createdAt: '2024-01-02T11:00:00.000Z',
            },
            {
                id: '3',
                front: 'Q3',
                back: 'A3',
                createdAt: '2024-01-03T12:00:00.000Z',
            },
        ];

        render(<SavedFlashCards flashCards={flashCards} onDelete={mockOnDelete} />);

        const deleteButtons = screen.getAllByRole('button', { name: /Usuń fiszką/i });
        expect(deleteButtons).toHaveLength(3);
    });
});
