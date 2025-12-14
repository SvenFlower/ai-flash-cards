import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LoginForm } from './LoginForm';
import * as auth from '../lib/auth';

// Mock auth module
vi.mock('../lib/auth', () => ({
    login: vi.fn(),
}));

// Mock window.location
delete (window as any).location;
window.location = { href: '' } as any;

describe('LoginForm', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        window.location.href = '';
    });

    it('should render login form with all fields', () => {
        render(<LoginForm />);

        expect(screen.getByLabelText(/Email/i)).toBeTruthy();
        expect(screen.getByLabelText(/Hasło/i)).toBeTruthy();
        expect(screen.getByRole('button', { name: /Zaloguj się/i })).toBeTruthy();
    });

    it('should show link to registration page', () => {
        render(<LoginForm />);

        const registerLink = screen.getByRole('link', { name: /Zarejestruj się/i });
        expect(registerLink).toBeTruthy();
        expect(registerLink.getAttribute('href')).toBe('/rejestracja');
    });

    it('should show validation error when fields are empty', async () => {
        const user = userEvent.setup();
        render(<LoginForm />);

        const submitButton = screen.getByRole('button', { name: /Zaloguj się/i });
        await user.click(submitButton);

        await waitFor(() => {
            expect(screen.getByText(/Email i hasło są wymagane/i)).toBeTruthy();
        });
    });

    it('should call login function with correct credentials', async () => {
        const user = userEvent.setup();
        const mockLogin = vi.mocked(auth.login);

        mockLogin.mockResolvedValue({
            user: { id: 'user-123', email: 'test@example.com' },
            error: null,
        });

        render(<LoginForm />);

        const emailInput = screen.getByLabelText(/Email/i);
        const passwordInput = screen.getByLabelText(/Hasło/i);
        const submitButton = screen.getByRole('button', { name: /Zaloguj się/i });

        await user.type(emailInput, 'test@example.com');
        await user.type(passwordInput, 'password123');
        await user.click(submitButton);

        await waitFor(() => {
            expect(mockLogin).toHaveBeenCalledWith('test@example.com', 'password123');
        });
    });

    it('should redirect to home page after successful login', async () => {
        const user = userEvent.setup();
        const mockLogin = vi.mocked(auth.login);

        mockLogin.mockResolvedValue({
            user: { id: 'user-123', email: 'test@example.com' },
            error: null,
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

    it('should display error message when login fails', async () => {
        const user = userEvent.setup();
        const mockLogin = vi.mocked(auth.login);

        mockLogin.mockResolvedValue({
            user: null,
            error: { message: 'Invalid credentials' },
        });

        render(<LoginForm />);

        const emailInput = screen.getByLabelText(/Email/i);
        const passwordInput = screen.getByLabelText(/Hasło/i);
        const submitButton = screen.getByRole('button', { name: /Zaloguj się/i });

        await user.type(emailInput, 'test@example.com');
        await user.type(passwordInput, 'wrongpassword');
        await user.click(submitButton);

        await waitFor(() => {
            expect(screen.getByText('Invalid credentials')).toBeTruthy();
        });
    });

    it('should disable form during submission', async () => {
        const user = userEvent.setup();
        const mockLogin = vi.mocked(auth.login);

        // Simulate slow login
        mockLogin.mockImplementation(
            () =>
                new Promise((resolve) => {
                    setTimeout(() => {
                        resolve({
                            user: { id: 'user-123', email: 'test@example.com' },
                            error: null,
                        });
                    }, 100);
                }),
        );

        render(<LoginForm />);

        const emailInput = screen.getByLabelText(/Email/i);
        const passwordInput = screen.getByLabelText(/Hasło/i);
        const submitButton = screen.getByRole('button', { name: /Zaloguj się/i });

        await user.type(emailInput, 'test@example.com');
        await user.type(passwordInput, 'password123');
        await user.click(submitButton);

        // Button should show loading state
        expect(screen.getByText(/Logowanie.../i)).toBeTruthy();

        // Inputs should be disabled
        expect(emailInput).toHaveProperty('disabled', true);
        expect(passwordInput).toHaveProperty('disabled', true);
    });

    it('should handle network errors gracefully', async () => {
        const user = userEvent.setup();
        const mockLogin = vi.mocked(auth.login);

        mockLogin.mockRejectedValue(new Error('Network error'));

        render(<LoginForm />);

        const emailInput = screen.getByLabelText(/Email/i);
        const passwordInput = screen.getByLabelText(/Hasło/i);
        const submitButton = screen.getByRole('button', { name: /Zaloguj się/i });

        await user.type(emailInput, 'test@example.com');
        await user.type(passwordInput, 'password123');
        await user.click(submitButton);

        await waitFor(() => {
            expect(screen.getByText(/Błąd logowania/i)).toBeTruthy();
        });
    });
});
