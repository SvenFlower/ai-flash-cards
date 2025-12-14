import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { FlashCardList } from './FlashCardList';
import type { FlashCardWithStatus } from '../lib/types';

describe('FlashCardList Component', () => {
    const mockOnAccept = vi.fn();
    const mockOnReject = vi.fn();

    it('should show empty state when no flashcards', () => {
        render(
            <FlashCardList
                flashCards={[]}
                onAccept={mockOnAccept}
                onReject={mockOnReject}
            />
        );

        expect(screen.getByText(/Wprowadź tekst i kliknij/i)).toBeDefined();
    });

    it('should show loading message when isLoading is true', () => {
        render(
            <FlashCardList
                flashCards={[]}
                onAccept={mockOnAccept}
                onReject={mockOnReject}
                isLoading={true}
            />
        );

        expect(screen.getByText('Generowanie fiszek...')).toBeDefined();
    });

    it('should render flashcards when provided', () => {
        const flashCards: FlashCardWithStatus[] = [
            {
                id: '1',
                front: 'Question 1',
                back: 'Answer 1',
                status: 'pending',
            },
            {
                id: '2',
                front: 'Question 2',
                back: 'Answer 2',
                status: 'pending',
            },
        ];

        render(
            <FlashCardList
                flashCards={flashCards}
                onAccept={mockOnAccept}
                onReject={mockOnReject}
            />
        );

        expect(screen.getByText('Question 1')).toBeDefined();
        expect(screen.getByText('Question 2')).toBeDefined();
    });

    it('should display correct counts for pending, accepted, and rejected', () => {
        const flashCards: FlashCardWithStatus[] = [
            {
                id: '1',
                front: 'Q1',
                back: 'A1',
                status: 'pending',
            },
            {
                id: '2',
                front: 'Q2',
                back: 'A2',
                status: 'accepted',
            },
            {
                id: '3',
                front: 'Q3',
                back: 'A3',
                status: 'rejected',
            },
        ];

        render(
            <FlashCardList
                flashCards={flashCards}
                onAccept={mockOnAccept}
                onReject={mockOnReject}
            />
        );

        expect(screen.getByText('Oczekujące: 1')).toBeDefined();
        expect(screen.getByText('Zaakceptowane: 1')).toBeDefined();
        expect(screen.getByText('Odrzucone: 1')).toBeDefined();
    });

    it('should render header with title', () => {
        const flashCards: FlashCardWithStatus[] = [
            {
                id: '1',
                front: 'Q1',
                back: 'A1',
                status: 'pending',
            },
        ];

        render(
            <FlashCardList
                flashCards={flashCards}
                onAccept={mockOnAccept}
                onReject={mockOnReject}
            />
        );

        expect(screen.getByText('Wygenerowane fiszki')).toBeDefined();
    });

    it('should apply correct styling for accepted flashcards', () => {
        const flashCards: FlashCardWithStatus[] = [
            {
                id: '1',
                front: 'Q1',
                back: 'A1',
                status: 'accepted',
            },
        ];

        const { container } = render(
            <FlashCardList
                flashCards={flashCards}
                onAccept={mockOnAccept}
                onReject={mockOnReject}
            />
        );

        const flashCardContainer = container.querySelector('.border-l-green-500');
        expect(flashCardContainer).not.toBeNull();
    });

    it('should apply correct styling for rejected flashcards', () => {
        const flashCards: FlashCardWithStatus[] = [
            {
                id: '1',
                front: 'Q1',
                back: 'A1',
                status: 'rejected',
            },
        ];

        const { container } = render(
            <FlashCardList
                flashCards={flashCards}
                onAccept={mockOnAccept}
                onReject={mockOnReject}
            />
        );

        const flashCardContainer = container.querySelector('.border-l-red-500');
        expect(flashCardContainer).not.toBeNull();
    });
});
