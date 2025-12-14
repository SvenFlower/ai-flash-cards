import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TextInput } from './TextInput';

describe('TextInput Component', () => {
    const mockOnChange = vi.fn();
    const mockOnGenerate = vi.fn();

    it('should render textarea with placeholder', () => {
        render(
            <TextInput
                value=""
                onChange={mockOnChange}
                onGenerate={mockOnGenerate}
                isLoading={false}
                error={null}
            />
        );

        const textarea = screen.getByPlaceholderText(/Wklej tutaj tekst/i);
        expect(textarea).toBeDefined();
    });

    it('should display character count', () => {
        const text = 'a'.repeat(500);
        render(
            <TextInput
                value={text}
                onChange={mockOnChange}
                onGenerate={mockOnGenerate}
                isLoading={false}
                error={null}
            />
        );

        expect(screen.getByText(/500 \/ 10000 znaków/i)).toBeDefined();
    });

    it('should show warning when text is too short', () => {
        const text = 'a'.repeat(500);
        render(
            <TextInput
                value={text}
                onChange={mockOnChange}
                onGenerate={mockOnGenerate}
                isLoading={false}
                error={null}
            />
        );

        expect(screen.getByText(/Potrzebujesz jeszcze 500 znaków/i)).toBeDefined();
    });

    it('should show warning when text is too long', () => {
        const text = 'a'.repeat(10500);
        render(
            <TextInput
                value={text}
                onChange={mockOnChange}
                onGenerate={mockOnGenerate}
                isLoading={false}
                error={null}
            />
        );

        expect(screen.getByText(/Tekst jest za długi/i)).toBeDefined();
    });

    it('should show ready badge when text length is valid', () => {
        const text = 'a'.repeat(1500);
        render(
            <TextInput
                value={text}
                onChange={mockOnChange}
                onGenerate={mockOnGenerate}
                isLoading={false}
                error={null}
            />
        );

        expect(screen.getByText(/Gotowe do generowania/i)).toBeDefined();
    });

    it('should disable button when text is too short', () => {
        const text = 'a'.repeat(500);
        render(
            <TextInput
                value={text}
                onChange={mockOnChange}
                onGenerate={mockOnGenerate}
                isLoading={false}
                error={null}
            />
        );

        const button = screen.getByRole('button', { name: /Generuj fiszki/i });
        expect(button).toHaveProperty('disabled', true);
    });

    it('should enable button when text length is valid', () => {
        const text = 'a'.repeat(1500);
        render(
            <TextInput
                value={text}
                onChange={mockOnChange}
                onGenerate={mockOnGenerate}
                isLoading={false}
                error={null}
            />
        );

        const button = screen.getByRole('button', { name: /Generuj fiszki/i });
        expect(button).toHaveProperty('disabled', false);
    });

    it('should show loading state when isLoading is true', () => {
        const text = 'a'.repeat(1500);
        render(
            <TextInput
                value={text}
                onChange={mockOnChange}
                onGenerate={mockOnGenerate}
                isLoading={true}
                error={null}
            />
        );

        expect(screen.getByText(/Generowanie fiszek/i)).toBeDefined();
    });

    it('should display error message when error is provided', () => {
        render(
            <TextInput
                value=""
                onChange={mockOnChange}
                onGenerate={mockOnGenerate}
                isLoading={false}
                error="Something went wrong"
            />
        );

        expect(screen.getByText('Something went wrong')).toBeDefined();
    });

    it('should call onChange when textarea value changes', () => {
        render(
            <TextInput
                value=""
                onChange={mockOnChange}
                onGenerate={mockOnGenerate}
                isLoading={false}
                error={null}
            />
        );

        const textarea = screen.getByPlaceholderText(/Wklej tutaj tekst/i);
        fireEvent.change(textarea, { target: { value: 'new text' } });

        expect(mockOnChange).toHaveBeenCalledWith('new text');
    });

    it('should call onGenerate when button is clicked', () => {
        const text = 'a'.repeat(1500);
        render(
            <TextInput
                value={text}
                onChange={mockOnChange}
                onGenerate={mockOnGenerate}
                isLoading={false}
                error={null}
            />
        );

        const button = screen.getByRole('button', { name: /Generuj fiszki/i });
        fireEvent.click(button);

        expect(mockOnGenerate).toHaveBeenCalled();
    });
});
