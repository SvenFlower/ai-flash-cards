import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { FlashCard } from './FlashCard';
import type { FlashCardWithStatus } from '../lib/types';

describe('FlashCard Component', () => {
    const mockFlashCard: FlashCardWithStatus = {
        id: '1',
        front: 'What is React?',
        back: 'A JavaScript library for building user interfaces',
        status: 'pending',
    };

    const mockOnAccept = vi.fn();
    const mockOnReject = vi.fn();

    it('should render flashcard front by default', () => {
        render(
            <FlashCard
                flashCard={mockFlashCard}
                onAccept={mockOnAccept}
                onReject={mockOnReject}
            />
        );

        expect(screen.getByText('What is React?')).toBeDefined();
        expect(screen.getAllByText('Przód')).toHaveLength(2); // Label and badge
    });

    it('should flip to show back when clicked', () => {
        render(
            <FlashCard
                flashCard={mockFlashCard}
                onAccept={mockOnAccept}
                onReject={mockOnReject}
            />
        );

        const cardBody = screen.getByText('What is React?').closest('.relative');
        fireEvent.click(cardBody!);

        expect(screen.getAllByText('Tył')).toHaveLength(2); // Label and badge
    });

    it('should call onReject when reject button is clicked', () => {
        render(
            <FlashCard
                flashCard={mockFlashCard}
                onAccept={mockOnAccept}
                onReject={mockOnReject}
            />
        );

        const rejectButton = screen.getByRole('button', { name: /Odrzuć/i });
        fireEvent.click(rejectButton);

        expect(mockOnReject).toHaveBeenCalledWith('1');
    });

    it('should call onAccept when accept button is clicked', () => {
        render(
            <FlashCard
                flashCard={mockFlashCard}
                onAccept={mockOnAccept}
                onReject={mockOnReject}
            />
        );

        const acceptButton = screen.getByRole('button', { name: /Akceptuj/i });
        fireEvent.click(acceptButton);

        expect(mockOnAccept).toHaveBeenCalledWith('1', 'What is React?', 'A JavaScript library for building user interfaces');
    });

    it('should enter edit mode when edit button is clicked', () => {
        render(
            <FlashCard
                flashCard={mockFlashCard}
                onAccept={mockOnAccept}
                onReject={mockOnReject}
            />
        );

        const editButton = screen.getByRole('button', { name: /Edytuj/i });
        fireEvent.click(editButton);

        expect(screen.getByRole('button', { name: /Zapisz/i })).toBeDefined();
        expect(screen.getByRole('button', { name: /Anuluj/i })).toBeDefined();
    });

    it('should allow editing front text', () => {
        render(
            <FlashCard
                flashCard={mockFlashCard}
                onAccept={mockOnAccept}
                onReject={mockOnReject}
            />
        );

        const editButton = screen.getByRole('button', { name: /Edytuj/i });
        fireEvent.click(editButton);

        const textarea = screen.getByDisplayValue('What is React?');
        fireEvent.change(textarea, { target: { value: 'What is Vue?' } });

        expect(textarea).toHaveValue('What is Vue?');
    });

    it('should save edited text when save button is clicked', () => {
        render(
            <FlashCard
                flashCard={mockFlashCard}
                onAccept={mockOnAccept}
                onReject={mockOnReject}
            />
        );

        const editButton = screen.getByRole('button', { name: /Edytuj/i });
        fireEvent.click(editButton);

        const textarea = screen.getByDisplayValue('What is React?');
        fireEvent.change(textarea, { target: { value: 'What is Vue?' } });

        const saveButton = screen.getByRole('button', { name: /Zapisz/i });
        fireEvent.click(saveButton);

        expect(mockOnAccept).toHaveBeenCalledWith('1', 'What is Vue?', 'A JavaScript library for building user interfaces');
    });

    it('should cancel editing when cancel button is clicked', () => {
        render(
            <FlashCard
                flashCard={mockFlashCard}
                onAccept={mockOnAccept}
                onReject={mockOnReject}
            />
        );

        const editButton = screen.getByRole('button', { name: /Edytuj/i });
        fireEvent.click(editButton);

        const textarea = screen.getByDisplayValue('What is React?');
        fireEvent.change(textarea, { target: { value: 'What is Vue?' } });

        const cancelButton = screen.getByRole('button', { name: /Anuluj/i });
        fireEvent.click(cancelButton);

        expect(screen.getByText('What is React?')).toBeDefined();
        expect(screen.queryByRole('button', { name: /Zapisz/i })).toBeNull();
    });

    it('should disable accept and edit buttons when status is accepted', () => {
        const acceptedFlashCard: FlashCardWithStatus = {
            ...mockFlashCard,
            status: 'accepted',
        };

        render(
            <FlashCard
                flashCard={acceptedFlashCard}
                onAccept={mockOnAccept}
                onReject={mockOnReject}
            />
        );

        const acceptButton = screen.getByRole('button', { name: /Akceptuj/i });
        const editButton = screen.getByRole('button', { name: /Edytuj/i });

        expect(acceptButton).toHaveProperty('disabled', true);
        expect(editButton).toHaveProperty('disabled', true);
    });
});
