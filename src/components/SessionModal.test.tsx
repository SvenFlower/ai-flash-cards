import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SessionModal } from './SessionModal';

describe('SessionModal Component', () => {
    const mockOnClose = vi.fn();
    const mockOnSave = vi.fn();
    const defaultName = 'Sesja 2024-12-15';

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should not render when isOpen is false', () => {
        const { container } = render(
            <SessionModal
                isOpen={false}
                onClose={mockOnClose}
                onSave={mockOnSave}
                defaultName={defaultName}
            />
        );

        expect(container.firstChild).toBeNull();
    });

    it('should render when isOpen is true', () => {
        render(
            <SessionModal
                isOpen={true}
                onClose={mockOnClose}
                onSave={mockOnSave}
                defaultName={defaultName}
            />
        );

        expect(screen.getByText('Zapisz fiszki do sesji')).toBeDefined();
        expect(screen.getByLabelText(/Nazwa sesji/i)).toBeDefined();
    });

    it('should render with default session name', () => {
        render(
            <SessionModal
                isOpen={true}
                onClose={mockOnClose}
                onSave={mockOnSave}
                defaultName={defaultName}
            />
        );

        const input = screen.getByLabelText(/Nazwa sesji/i) as HTMLInputElement;
        expect(input.value).toBe(defaultName);
    });

    it('should allow changing session name', async () => {
        const user = userEvent.setup();
        render(
            <SessionModal
                isOpen={true}
                onClose={mockOnClose}
                onSave={mockOnSave}
                defaultName={defaultName}
            />
        );

        const input = screen.getByLabelText(/Nazwa sesji/i);
        await user.clear(input);
        await user.type(input, 'Custom Session Name');

        expect((input as HTMLInputElement).value).toBe('Custom Session Name');
    });

    it('should call onClose when cancel button is clicked', () => {
        render(
            <SessionModal
                isOpen={true}
                onClose={mockOnClose}
                onSave={mockOnSave}
                defaultName={defaultName}
            />
        );

        const cancelButton = screen.getByRole('button', { name: /Anuluj/i });
        fireEvent.click(cancelButton);

        expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('should call onClose when clicking outside modal', () => {
        render(
            <SessionModal
                isOpen={true}
                onClose={mockOnClose}
                onSave={mockOnSave}
                defaultName={defaultName}
            />
        );

        const backdrop = screen.getByRole('dialog');
        fireEvent.click(backdrop);

        expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('should NOT close when clicking inside modal', () => {
        render(
            <SessionModal
                isOpen={true}
                onClose={mockOnClose}
                onSave={mockOnSave}
                defaultName={defaultName}
            />
        );

        const modalContent = screen.getByRole('document');
        fireEvent.click(modalContent);

        expect(mockOnClose).not.toHaveBeenCalled();
    });

    it('should call onSave with session name when save button is clicked', async () => {
        mockOnSave.mockResolvedValueOnce(undefined);

        render(
            <SessionModal
                isOpen={true}
                onClose={mockOnClose}
                onSave={mockOnSave}
                defaultName={defaultName}
            />
        );

        const saveButton = screen.getByRole('button', { name: 'Zapisz', exact: true });
        fireEvent.click(saveButton);

        await waitFor(() => {
            expect(mockOnSave).toHaveBeenCalledWith(defaultName);
        });
    });

    it('should show error message when session name is empty', async () => {
        const user = userEvent.setup();
        render(
            <SessionModal
                isOpen={true}
                onClose={mockOnClose}
                onSave={mockOnSave}
                defaultName={defaultName}
            />
        );

        const input = screen.getByLabelText(/Nazwa sesji/i);
        await user.clear(input);

        const saveButton = screen.getByRole('button', { name: 'Zapisz', exact: true });
        fireEvent.click(saveButton);

        await waitFor(() => {
            expect(screen.getByText(/Nazwa sesji nie może być pusta/i)).toBeDefined();
        });

        expect(mockOnSave).not.toHaveBeenCalled();
    });

    it('should show loading state when saving', async () => {
        mockOnSave.mockImplementation(() => new Promise((resolve) => setTimeout(resolve, 100)));

        render(
            <SessionModal
                isOpen={true}
                onClose={mockOnClose}
                onSave={mockOnSave}
                defaultName={defaultName}
            />
        );

        const saveButton = screen.getByRole('button', { name: 'Zapisz', exact: true });
        fireEvent.click(saveButton);

        await waitFor(() => {
            expect(screen.getByText(/Zapisywanie\.\.\./i)).toBeDefined();
        });
    });

    it('should disable inputs during save', async () => {
        mockOnSave.mockImplementation(() => new Promise((resolve) => setTimeout(resolve, 100)));

        render(
            <SessionModal
                isOpen={true}
                onClose={mockOnClose}
                onSave={mockOnSave}
                defaultName={defaultName}
            />
        );

        const saveButton = screen.getByRole('button', { name: 'Zapisz', exact: true }) as HTMLButtonElement;
        const cancelButton = screen.getByRole('button', { name: /Anuluj/i }) as HTMLButtonElement;
        const input = screen.getByLabelText(/Nazwa sesji/i) as HTMLInputElement;

        fireEvent.click(saveButton);

        await waitFor(() => {
            expect(input.disabled).toBe(true);
            expect(saveButton.disabled).toBe(true);
            expect(cancelButton.disabled).toBe(true);
        });
    });

    it('should show error message when save fails', async () => {
        mockOnSave.mockRejectedValueOnce(new Error('Save failed'));

        render(
            <SessionModal
                isOpen={true}
                onClose={mockOnClose}
                onSave={mockOnSave}
                defaultName={defaultName}
            />
        );

        const saveButton = screen.getByRole('button', { name: 'Zapisz', exact: true });
        fireEvent.click(saveButton);

        await waitFor(() => {
            expect(screen.getByText(/Save failed/i)).toBeDefined();
        });

        expect(mockOnClose).not.toHaveBeenCalled();
    });

    it('should close modal after successful save', async () => {
        mockOnSave.mockResolvedValueOnce(undefined);

        render(
            <SessionModal
                isOpen={true}
                onClose={mockOnClose}
                onSave={mockOnSave}
                defaultName={defaultName}
            />
        );

        const saveButton = screen.getByRole('button', { name: 'Zapisz', exact: true });
        fireEvent.click(saveButton);

        await waitFor(() => {
            expect(mockOnSave).toHaveBeenCalled();
            expect(mockOnClose).toHaveBeenCalled();
        });
    });

    it('should reset session name to default when closing', () => {
        const user = userEvent.setup();
        const { rerender } = render(
            <SessionModal
                isOpen={true}
                onClose={mockOnClose}
                onSave={mockOnSave}
                defaultName={defaultName}
            />
        );

        const input = screen.getByLabelText(/Nazwa sesji/i) as HTMLInputElement;
        fireEvent.change(input, { target: { value: 'Modified Name' } });

        const cancelButton = screen.getByRole('button', { name: /Anuluj/i });
        fireEvent.click(cancelButton);

        // Reopen modal
        rerender(
            <SessionModal
                isOpen={true}
                onClose={mockOnClose}
                onSave={mockOnSave}
                defaultName={defaultName}
            />
        );

        const newInput = screen.getByLabelText(/Nazwa sesji/i) as HTMLInputElement;
        expect(newInput.value).toBe(defaultName);
    });

    it('should close on Escape key press', () => {
        render(
            <SessionModal
                isOpen={true}
                onClose={mockOnClose}
                onSave={mockOnSave}
                defaultName={defaultName}
            />
        );

        const backdrop = screen.getByRole('dialog');
        fireEvent.keyDown(backdrop, { key: 'Escape', code: 'Escape' });

        expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
});
