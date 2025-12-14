import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { FlashCardApp } from './FlashCardApp';
import * as openrouter from '../lib/openrouter';
import * as storage from '../lib/storage';

vi.mock('../lib/openrouter');
vi.mock('../lib/storage');

describe('FlashCardApp Component', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(storage.getFlashCards).mockReturnValue([]);
    });

    it('should render the app with title and description', () => {
        render(<FlashCardApp />);

        expect(screen.getByText('10x FlashCards')).toBeDefined();
        expect(screen.getByText('Generuj fiszki edukacyjne za pomocą AI')).toBeDefined();
    });

    it('should render TextInput component', () => {
        render(<FlashCardApp />);

        expect(screen.getByPlaceholderText(/Wklej tutaj tekst/i)).toBeDefined();
    });

    it('should render SavedFlashCards component', () => {
        render(<FlashCardApp />);

        expect(screen.getByText(/Brak zapisanych fiszek/i)).toBeDefined();
    });

    it('should generate flashcards when button is clicked', async () => {
        const mockGeneratedCards = [
            { front: 'Q1', back: 'A1' },
            { front: 'Q2', back: 'A2' },
        ];

        vi.mocked(openrouter.generateFlashCards).mockResolvedValue(mockGeneratedCards);

        render(<FlashCardApp />);

        const textarea = screen.getByPlaceholderText(/Wklej tutaj tekst/i);
        const longText = 'a'.repeat(1500);
        fireEvent.change(textarea, { target: { value: longText } });

        const generateButton = screen.getByRole('button', { name: /Generuj fiszki/i });
        fireEvent.click(generateButton);

        await waitFor(() => {
            expect(screen.getByText('Q1')).toBeDefined();
            expect(screen.getByText('Q2')).toBeDefined();
        });
    });

    it('should handle generation errors', async () => {
        vi.mocked(openrouter.generateFlashCards).mockRejectedValue(
            new Error('API Error')
        );

        render(<FlashCardApp />);

        const textarea = screen.getByPlaceholderText(/Wklej tutaj tekst/i);
        const longText = 'a'.repeat(1500);
        fireEvent.change(textarea, { target: { value: longText } });

        const generateButton = screen.getByRole('button', { name: /Generuj fiszki/i });
        fireEvent.click(generateButton);

        await waitFor(() => {
            expect(screen.getByText('API Error')).toBeDefined();
        });
    });

    it('should save flashcard when accepted', async () => {
        const mockGeneratedCards = [
            { front: 'Q1', back: 'A1' },
        ];

        vi.mocked(openrouter.generateFlashCards).mockResolvedValue(mockGeneratedCards);
        vi.mocked(storage.saveFlashCard).mockReturnValue({
            id: '1',
            front: 'Q1',
            back: 'A1',
            createdAt: '2024-01-01T00:00:00.000Z',
        });
        vi.mocked(storage.getFlashCards).mockReturnValue([
            {
                id: '1',
                front: 'Q1',
                back: 'A1',
                createdAt: '2024-01-01T00:00:00.000Z',
            },
        ]);

        render(<FlashCardApp />);

        const textarea = screen.getByPlaceholderText(/Wklej tutaj tekst/i);
        const longText = 'a'.repeat(1500);
        fireEvent.change(textarea, { target: { value: longText } });

        const generateButton = screen.getByRole('button', { name: /Generuj fiszki/i });
        fireEvent.click(generateButton);

        await waitFor(() => {
            expect(screen.getByText('Q1')).toBeDefined();
        });

        const acceptButton = screen.getByRole('button', { name: /Akceptuj/i });
        fireEvent.click(acceptButton);

        await waitFor(() => {
            expect(storage.saveFlashCard).toHaveBeenCalledWith({
                front: 'Q1',
                back: 'A1',
            });
        });
    });

    it('should delete saved flashcard when delete button is clicked', async () => {
        vi.mocked(storage.getFlashCards).mockReturnValue([
            {
                id: '1',
                front: 'Saved Q1',
                back: 'Saved A1',
                createdAt: '2024-01-01T00:00:00.000Z',
            },
        ]);

        render(<FlashCardApp />);

        const deleteButton = screen.getByRole('button', { name: /Usuń fiszką/i });
        fireEvent.click(deleteButton);

        expect(storage.deleteFlashCard).toHaveBeenCalledWith('1');
    });

    it('should show loading state when generating flashcards', async () => {
        vi.mocked(openrouter.generateFlashCards).mockImplementation(
            () => new Promise((resolve) => setTimeout(() => resolve([]), 100))
        );

        render(<FlashCardApp />);

        const textarea = screen.getByPlaceholderText(/Wklej tutaj tekst/i);
        const longText = 'a'.repeat(1500);
        fireEvent.change(textarea, { target: { value: longText } });

        const generateButton = screen.getByRole('button', { name: /Generuj fiszki/i });
        fireEvent.click(generateButton);

        expect(screen.getByText(/Generowanie fiszek/i)).toBeDefined();
    });

    it('should reject flashcard when reject button is clicked', async () => {
        const mockGeneratedCards = [
            { front: 'Q1', back: 'A1' },
        ];

        vi.mocked(openrouter.generateFlashCards).mockResolvedValue(mockGeneratedCards);

        render(<FlashCardApp />);

        const textarea = screen.getByPlaceholderText(/Wklej tutaj tekst/i);
        const longText = 'a'.repeat(1500);
        fireEvent.change(textarea, { target: { value: longText } });

        const generateButton = screen.getByRole('button', { name: /Generuj fiszki/i });
        fireEvent.click(generateButton);

        await waitFor(() => {
            expect(screen.getByText('Q1')).toBeDefined();
        });

        const rejectButton = screen.getByRole('button', { name: /Odrzuć/i });
        fireEvent.click(rejectButton);

        const flashCardContainer = screen.getByText('Q1').closest('.border-l-red-500');
        expect(flashCardContainer).not.toBeNull();
    });
});
