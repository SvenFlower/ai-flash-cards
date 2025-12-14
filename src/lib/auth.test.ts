import { describe, it, expect, vi, beforeEach } from 'vitest';
import { register, login, logout, getCurrentUser, isAuthenticated } from './auth';
import { supabaseClient } from '../db/supabase.client';

// Mock Supabase client
vi.mock('../db/supabase.client', () => ({
    supabaseClient: {
        auth: {
            signUp: vi.fn(),
            signInWithPassword: vi.fn(),
            signOut: vi.fn(),
            getUser: vi.fn(),
            getSession: vi.fn(),
        },
    },
}));

describe('Auth utilities', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('register', () => {
        it('should successfully register a new user', async () => {
            const mockUser = {
                id: 'user-123',
                email: 'test@example.com',
            };

            vi.mocked(supabaseClient.auth.signUp).mockResolvedValue({
                data: { user: mockUser, session: null },
                error: null,
            });

            const result = await register('test@example.com', 'password123');

            expect(result.user).toEqual({
                id: 'user-123',
                email: 'test@example.com',
            });
            expect(result.error).toBeNull();
            expect(supabaseClient.auth.signUp).toHaveBeenCalledWith({
                email: 'test@example.com',
                password: 'password123',
            });
        });

        it('should return error when registration fails', async () => {
            vi.mocked(supabaseClient.auth.signUp).mockResolvedValue({
                data: { user: null, session: null },
                error: { message: 'Email already exists' } as any,
            });

            const result = await register('test@example.com', 'password123');

            expect(result.user).toBeNull();
            expect(result.error).toEqual({ message: 'Email already exists' });
        });

        it('should handle no user returned', async () => {
            vi.mocked(supabaseClient.auth.signUp).mockResolvedValue({
                data: { user: null, session: null },
                error: null,
            });

            const result = await register('test@example.com', 'password123');

            expect(result.user).toBeNull();
            expect(result.error).toEqual({ message: 'Nie udało się utworzyć konta' });
        });
    });

    describe('login', () => {
        it('should successfully login a user', async () => {
            const mockUser = {
                id: 'user-123',
                email: 'test@example.com',
            };

            vi.mocked(supabaseClient.auth.signInWithPassword).mockResolvedValue({
                data: { user: mockUser, session: {} as any },
                error: null,
            });

            const result = await login('test@example.com', 'password123');

            expect(result.user).toEqual({
                id: 'user-123',
                email: 'test@example.com',
            });
            expect(result.error).toBeNull();
            expect(supabaseClient.auth.signInWithPassword).toHaveBeenCalledWith({
                email: 'test@example.com',
                password: 'password123',
            });
        });

        it('should return error when login fails', async () => {
            vi.mocked(supabaseClient.auth.signInWithPassword).mockResolvedValue({
                data: { user: null, session: null },
                error: { message: 'Invalid credentials' } as any,
            });

            const result = await login('test@example.com', 'wrongpassword');

            expect(result.user).toBeNull();
            expect(result.error).toEqual({ message: 'Invalid credentials' });
        });
    });

    describe('logout', () => {
        it('should successfully logout a user', async () => {
            vi.mocked(supabaseClient.auth.signOut).mockResolvedValue({
                error: null,
            });

            const result = await logout();

            expect(result.error).toBeNull();
            expect(supabaseClient.auth.signOut).toHaveBeenCalled();
        });

        it('should return error when logout fails', async () => {
            vi.mocked(supabaseClient.auth.signOut).mockResolvedValue({
                error: { message: 'Network error' } as any,
            });

            const result = await logout();

            expect(result.error).toEqual({ message: 'Network error' });
        });
    });

    describe('getCurrentUser', () => {
        it('should return current user when authenticated', async () => {
            const mockUser = {
                id: 'user-123',
                email: 'test@example.com',
            };

            vi.mocked(supabaseClient.auth.getUser).mockResolvedValue({
                data: { user: mockUser },
                error: null,
            });

            const result = await getCurrentUser();

            expect(result).toEqual({
                id: 'user-123',
                email: 'test@example.com',
            });
        });

        it('should return null when not authenticated', async () => {
            vi.mocked(supabaseClient.auth.getUser).mockResolvedValue({
                data: { user: null },
                error: null,
            });

            const result = await getCurrentUser();

            expect(result).toBeNull();
        });

        it('should return null when error occurs', async () => {
            vi.mocked(supabaseClient.auth.getUser).mockRejectedValue(
                new Error('Network error'),
            );

            const result = await getCurrentUser();

            expect(result).toBeNull();
        });
    });

    describe('isAuthenticated', () => {
        it('should return true when user is authenticated', async () => {
            vi.mocked(supabaseClient.auth.getUser).mockResolvedValue({
                data: { user: { id: 'user-123', email: 'test@example.com' } },
                error: null,
            });

            const result = await isAuthenticated();

            expect(result).toBe(true);
        });

        it('should return false when user is not authenticated', async () => {
            vi.mocked(supabaseClient.auth.getUser).mockResolvedValue({
                data: { user: null },
                error: null,
            });

            const result = await isAuthenticated();

            expect(result).toBe(false);
        });
    });
});
