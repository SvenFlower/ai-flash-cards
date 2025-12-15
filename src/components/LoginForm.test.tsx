import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LoginForm } from './LoginForm';

describe('LoginForm Component', () => {
    const originalFetch = global.fetch;
    const mockFetch = vi.fn();
    const originalLocation = window.location;

    beforeEach(() => {
        vi.clearAllMocks();
        global.fetch = mockFetch;
        // Mock window.location.href
        delete (window as { location?: Location }).location;
        window.location = { ...originalLocation, href: '' } as Location;
    });

    afterEach(() => {
        global.fetch = originalFetch;
        window.location = originalLocation;
        vi.restoreAllMocks();
    });

    it('should render login form', () => {
        render(<LoginForm />);

        expect(screen.getByLabelText(/Email/i)).toBeDefined();
        expect(screen.getByLabelText(/Hasło/i)).toBeDefined();
        expect(screen.getByRole('button', { name: /Zaloguj się/i })).toBeDefined();
    });

    it('should render registration link', () => {
        render(<LoginForm />);

        const registerLink = screen.getByText(/Zarejestruj się/i);
        expect(registerLink).toBeDefined();
        expect(registerLink.closest('a')).toHaveProperty('href', expect.stringContaining('/rejestracja'));
    });

    it('should have required fields', () => {
        render(<LoginForm />);

        const emailInput = screen.getByLabelText(/Email/i) as HTMLInputElement;
        const passwordInput = screen.getByLabelText(/Hasło/i) as HTMLInputElement;

        expect(emailInput.required).toBe(true);
        expect(passwordInput.required).toBe(true);
    });

    it('should call login API with correct credentials', async () => {
        const user = userEvent.setup();
        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                user: { id: '123', email: 'test@example.com' },
            }),
        });

        render(<LoginForm />);

        const emailInput = screen.getByLabelText(/Email/i);
        const passwordInput = screen.getByLabelText(/Hasło/i);
        const submitButton = screen.getByRole('button', { name: /Zaloguj się/i });

        await user.type(emailInput, 'test@example.com');
        await user.type(passwordInput, 'password123');
        await user.click(submitButton);

        await waitFor(() => {
            expect(mockFetch).toHaveBeenCalledWith('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: 'test@example.com',
                    password: 'password123',
                }),
            });
        });
    });

    it('should redirect to home page on successful login', async () => {
        const user = userEvent.setup();
        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                user: { id: '123', email: 'test@example.com' },
            }),
        });

        render(<LoginForm />);

        const emailInput = screen.getByLabelText(/Email/i);
        const passwordInput = screen.getByLabelText(/Hasło/i);
        const submitButton = screen.getByRole('button', { name: /Zaloguj się/i });

        await user.type(emailInput, 'test@example.com');
        await user.type(passwordInput, 'password123');
        await user.click(submitButton);

        await waitFor(() => {
            expect(window.location.href).toBe('/');
        });
    });

    it('should show error message on failed login', async () => {
        const user = userEvent.setup();
        mockFetch.mockResolvedValueOnce({
            ok: false,
            status: 401,
            json: async () => ({
                error: { message: 'Invalid credentials' },
            }),
        });

        render(<LoginForm />);

        const emailInput = screen.getByLabelText(/Email/i);
        const passwordInput = screen.getByLabelText(/Hasło/i);
        const submitButton = screen.getByRole('button', { name: /Zaloguj się/i });

        await user.type(emailInput, 'test@example.com');
        await user.type(passwordInput, 'wrongpassword');
        await user.click(submitButton);

        await waitFor(() => {
            expect(screen.getByText(/Invalid credentials/i)).toBeDefined();
        });
    });

    it('should show error message on network error', async () => {
        const user = userEvent.setup();
        mockFetch.mockRejectedValueOnce(new Error('Network Error'));

        render(<LoginForm />);

        const emailInput = screen.getByLabelText(/Email/i);
        const passwordInput = screen.getByLabelText(/Hasło/i);
        const submitButton = screen.getByRole('button', { name: /Zaloguj się/i });

        await user.type(emailInput, 'test@example.com');
        await user.type(passwordInput, 'password123');
        await user.click(submitButton);

        await waitFor(() => {
            expect(screen.getByText(/Network Error/i)).toBeDefined();
        });
    });

    it('should show loading state during login', async () => {
        mockFetch.mockImplementation(
            () => new Promise((resolve) => setTimeout(() => resolve({
                ok: true,
                json: async () => ({ user: { id: '123', email: 'test@example.com' } }),
            }), 100))
        );

        render(<LoginForm />);

        const emailInput = screen.getByLabelText(/Email/i);
        const passwordInput = screen.getByLabelText(/Hasło/i);
        const submitButton = screen.getByRole('button', { name: /Zaloguj się/i });

        fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
        fireEvent.change(passwordInput, { target: { value: 'password123' } });
        fireEvent.click(submitButton);

        expect(screen.getByText(/Logowanie\.\.\./i)).toBeDefined();
    });

    it('should disable form inputs during login', async () => {
        mockFetch.mockImplementation(
            () => new Promise((resolve) => setTimeout(() => resolve({
                ok: true,
                json: async () => ({ user: { id: '123', email: 'test@example.com' } }),
            }), 100))
        );

        render(<LoginForm />);

        const emailInput = screen.getByLabelText(/Email/i) as HTMLInputElement;
        const passwordInput = screen.getByLabelText(/Hasło/i) as HTMLInputElement;
        const submitButton = screen.getByRole('button', { name: /Zaloguj się/i }) as HTMLButtonElement;

        fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
        fireEvent.change(passwordInput, { target: { value: 'password123' } });
        fireEvent.click(submitButton);

        await waitFor(() => {
            expect(emailInput.disabled).toBe(true);
            expect(passwordInput.disabled).toBe(true);
            expect(submitButton.disabled).toBe(true);
        });
    });
});
