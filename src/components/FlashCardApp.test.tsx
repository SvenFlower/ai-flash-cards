import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { FlashCardApp } from './FlashCardApp';
import apiClient from '../lib/api-client';

// Mock the API client
vi.mock('../lib/api-client', () => ({
    default: {
        sessions: {
            create: vi.fn(),
        },
        flashcards: {
            create: vi.fn(),
        },
    },
}));

// Mock AuthNav component to avoid auth complexity in tests
vi.mock('./AuthNav', () => ({
    AuthNav: () => <div data-testid="auth-nav">Auth Nav</div>,
}));

describe('FlashCardApp Component', () => {
    const originalFetch = global.fetch;
    const mockFetch = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        global.fetch = mockFetch;
        // Mock window.confirm
        vi.spyOn(window, 'confirm').mockReturnValue(false);
    });

    afterEach(() => {
        global.fetch = originalFetch;
        vi.restoreAllMocks();
    });

    it('should render the app with title and description', () => {
        render(<FlashCardApp />);

        expect(screen.getByText('10x FlashCards')).toBeDefined();
        expect(screen.getByText('Generator Fiszek AI')).toBeDefined();
        expect(screen.getByText('Generuj fiszki edukacyjne za pomocą AI')).toBeDefined();
    });

    it('should render TextInput component', () => {
        render(<FlashCardApp />);

        expect(screen.getByPlaceholderText(/Wklej tutaj tekst/i)).toBeDefined();
    });

    it('should render navigation links', () => {
        render(<FlashCardApp />);

        expect(screen.getByText('Strona główna')).toBeDefined();
        expect(screen.getByText('Sesje')).toBeDefined();
    });

    it('should generate flashcards when button is clicked', async () => {
        const mockFlashCards = [
            { front: 'Q1', back: 'A1' },
            { front: 'Q2', back: 'A2' },
        ];

        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ flashcards: mockFlashCards }),
        });

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

        expect(mockFetch).toHaveBeenCalledWith('/api/flashcards/generate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ text: longText }),
        });
    });

    it('should handle generation errors from API', async () => {
        mockFetch.mockResolvedValueOnce({
            ok: false,
            status: 500,
            json: async () => ({
                error: { message: 'API Error' },
            }),
        });

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

    it('should handle network errors', async () => {
        mockFetch.mockRejectedValueOnce(new Error('Network Error'));

        render(<FlashCardApp />);

        const textarea = screen.getByPlaceholderText(/Wklej tutaj tekst/i);
        const longText = 'a'.repeat(1500);
        fireEvent.change(textarea, { target: { value: longText } });

        const generateButton = screen.getByRole('button', { name: /Generuj fiszki/i });
        fireEvent.click(generateButton);

        await waitFor(() => {
            expect(screen.getByText('Network Error')).toBeDefined();
        });
    });

    it('should accept a flashcard', async () => {
        const mockFlashCards = [
            { front: 'Q1', back: 'A1' },
        ];

        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ flashcards: mockFlashCards }),
        });

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
            expect(acceptButton).toBeDisabled();
        });
    });

    it('should reject a flashcard', async () => {
        const mockFlashCards = [
            { front: 'Q1', back: 'A1' },
        ];

        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ flashcards: mockFlashCards }),
        });

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

        // Should still be visible but marked as rejected
        await waitFor(() => {
            expect(screen.getByText('Q1')).toBeDefined();
        });
    });

    it('should show loading state when generating flashcards', async () => {
        mockFetch.mockImplementation(
            () => new Promise((resolve) => setTimeout(() => resolve({
                ok: true,
                json: async () => ({ flashcards: [] }),
            }), 100))
        );

        render(<FlashCardApp />);

        const textarea = screen.getByPlaceholderText(/Wklej tutaj tekst/i);
        const longText = 'a'.repeat(1500);
        fireEvent.change(textarea, { target: { value: longText } });

        const generateButton = screen.getByRole('button', { name: /Generuj fiszki/i });
        fireEvent.click(generateButton);

        expect(screen.getByText(/Generowanie fiszek/i)).toBeDefined();
    });

    it('should open session modal when save button is clicked', async () => {
        const mockFlashCards = [
            { front: 'Q1', back: 'A1' },
        ];

        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ flashcards: mockFlashCards }),
        });

        render(<FlashCardApp />);

        const textarea = screen.getByPlaceholderText(/Wklej tutaj tekst/i);
        const longText = 'a'.repeat(1500);
        fireEvent.change(textarea, { target: { value: longText } });

        const generateButton = screen.getByRole('button', { name: /Generuj fiszki/i });
        fireEvent.click(generateButton);

        await waitFor(() => {
            expect(screen.getByText('Q1')).toBeDefined();
        });

        // Accept the flashcard first
        const acceptButton = screen.getByRole('button', { name: /Akceptuj/i });
        fireEvent.click(acceptButton);

        // Click save to session button
        const saveButton = screen.getByRole('button', { name: /Zapisz do sesji/i });
        fireEvent.click(saveButton);

        // Modal should appear
        await waitFor(() => {
            expect(screen.getByText('Zapisz fiszki do sesji')).toBeDefined();
        });
    });

    it('should save session with accepted flashcards', async () => {
        const mockFlashCards = [
            { front: 'Q1', back: 'A1' },
            { front: 'Q2', back: 'A2' },
        ];

        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ flashcards: mockFlashCards }),
        });

        vi.mocked(apiClient.sessions.create).mockResolvedValue({
            data: { session: { id: 'session-1', name: 'Test Session', created_at: new Date().toISOString() } },
            error: null,
        });

        vi.mocked(apiClient.flashcards.create).mockResolvedValue({
            data: { flashcard: { id: 'fc-1', front: 'Q1', back: 'A1', session_id: 'session-1', created_at: new Date().toISOString() } },
            error: null,
        });

        render(<FlashCardApp />);

        const textarea = screen.getByPlaceholderText(/Wklej tutaj tekst/i);
        const longText = 'a'.repeat(1500);
        fireEvent.change(textarea, { target: { value: longText } });

        const generateButton = screen.getByRole('button', { name: /Generuj fiszki/i });
        fireEvent.click(generateButton);

        await waitFor(() => {
            expect(screen.getByText('Q1')).toBeDefined();
        });

        // Accept first flashcard
        const acceptButtons = screen.getAllByRole('button', { name: /Akceptuj/i });
        fireEvent.click(acceptButtons[0]);

        // Click save to session
        const saveButton = screen.getByRole('button', { name: /Zapisz do sesji/i });
        fireEvent.click(saveButton);

        await waitFor(() => {
            expect(screen.getByText('Zapisz fiszki do sesji')).toBeDefined();
        });

        // Enter session name and save
        const sessionInput = screen.getByLabelText(/Nazwa sesji/i);
        fireEvent.change(sessionInput, { target: { value: 'My Test Session' } });

        const modalSaveButton = screen.getByRole('button', { name: 'Zapisz', exact: true });
        fireEvent.click(modalSaveButton);

        await waitFor(() => {
            expect(apiClient.sessions.create).toHaveBeenCalledWith({
                name: 'My Test Session',
            });
        });
    });
});
