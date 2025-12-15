import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AuthNav } from './AuthNav';

describe('AuthNav Component', () => {
    const originalFetch = global.fetch;
    const mockFetch = vi.fn();
    const originalLocation = window.location;

    beforeEach(() => {
        vi.clearAllMocks();
        global.fetch = mockFetch;
        delete (window as { location?: Location }).location;
        window.location = { ...originalLocation, href: '' } as Location;

        // Mock console.error to avoid cluttering test output
        vi.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
        global.fetch = originalFetch;
        window.location = originalLocation;
        vi.restoreAllMocks();
    });

    it('should show loading state initially', () => {
        // Don't resolve the promise immediately
        mockFetch.mockImplementation(() => new Promise(() => {}));

        render(<AuthNav />);

        // Check for loading skeleton
        const loadingElement = document.querySelector('.animate-pulse');
        expect(loadingElement).toBeDefined();
    });

    it('should show authenticated state when user is logged in', async () => {
        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                user: { id: '123', email: 'test@example.com' },
            }),
        });

        render(<AuthNav />);

        await waitFor(() => {
            expect(screen.getByText('test@example.com')).toBeDefined();
            expect(screen.getByRole('button', { name: /Wyloguj/i })).toBeDefined();
        });

        expect(mockFetch).toHaveBeenCalledWith('/api/auth/me');
    });

    it('should show unauthenticated state when user is not logged in', async () => {
        mockFetch.mockResolvedValueOnce({
            ok: false,
            status: 401,
        });

        render(<AuthNav />);

        await waitFor(() => {
            expect(screen.getByText(/Logowanie/i)).toBeDefined();
            expect(screen.getByText(/Rejestracja/i)).toBeDefined();
        });
    });

    it('should show login and register links when unauthenticated', async () => {
        mockFetch.mockResolvedValueOnce({
            ok: false,
            status: 401,
        });

        render(<AuthNav />);

        await waitFor(() => {
            const loginLink = screen.getByText(/Logowanie/i).closest('a');
            const registerLink = screen.getByText(/Rejestracja/i).closest('a');

            expect(loginLink).toHaveProperty('href', expect.stringContaining('/logowanie'));
            expect(registerLink).toHaveProperty('href', expect.stringContaining('/rejestracja'));
        });
    });

    it('should handle logout successfully', async () => {
        // First call for loading user
        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                user: { id: '123', email: 'test@example.com' },
            }),
        });

        render(<AuthNav />);

        await waitFor(() => {
            expect(screen.getByText('test@example.com')).toBeDefined();
        });

        // Second call for logout
        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ success: true }),
        });

        const logoutButton = screen.getByRole('button', { name: /Wyloguj/i });
        fireEvent.click(logoutButton);

        await waitFor(() => {
            expect(mockFetch).toHaveBeenCalledWith('/api/auth/logout', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
            });
            expect(window.location.href).toBe('/');
        });
    });

    it('should handle logout error gracefully', async () => {
        // First call for loading user
        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                user: { id: '123', email: 'test@example.com' },
            }),
        });

        render(<AuthNav />);

        await waitFor(() => {
            expect(screen.getByText('test@example.com')).toBeDefined();
        });

        // Second call for logout - simulate error
        mockFetch.mockResolvedValueOnce({
            ok: false,
            status: 500,
            json: async () => ({
                error: { message: 'Logout failed' },
            }),
        });

        const logoutButton = screen.getByRole('button', { name: /Wyloguj/i });
        fireEvent.click(logoutButton);

        await waitFor(() => {
            expect(console.error).toHaveBeenCalledWith('Logout failed:', 'Logout failed');
        });
    });

    it('should handle network error when loading user', async () => {
        mockFetch.mockRejectedValueOnce(new Error('Network error'));

        render(<AuthNav />);

        await waitFor(() => {
            // Should show unauthenticated state on error
            expect(screen.getByText(/Logowanie/i)).toBeDefined();
            expect(screen.getByText(/Rejestracja/i)).toBeDefined();
        });

        expect(console.error).toHaveBeenCalledWith('Failed to load user:', expect.any(Error));
    });

    it('should handle network error when logging out', async () => {
        // First call for loading user
        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                user: { id: '123', email: 'test@example.com' },
            }),
        });

        render(<AuthNav />);

        await waitFor(() => {
            expect(screen.getByText('test@example.com')).toBeDefined();
        });

        // Second call for logout - simulate network error
        mockFetch.mockRejectedValueOnce(new Error('Network error'));

        const logoutButton = screen.getByRole('button', { name: /Wyloguj/i });
        fireEvent.click(logoutButton);

        await waitFor(() => {
            expect(console.error).toHaveBeenCalledWith('Logout error:', expect.any(Error));
        });
    });
});
