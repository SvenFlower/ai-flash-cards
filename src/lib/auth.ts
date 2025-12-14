import { supabaseClient } from '../db/supabase.client';

export interface AuthUser {
    id: string;
    email: string;
}

export interface AuthError {
    message: string;
}

export interface AuthResponse {
    user: AuthUser | null;
    error: AuthError | null;
}

// Register a new user
export async function register(email: string, password: string): Promise<AuthResponse> {
    try {
        const { data, error } = await supabaseClient.auth.signUp({
            email,
            password,
            options: {
                emailRedirectTo: `${new URL(request.url).origin}/logowanie`,
            },
        });

        if (error) {
            return { user: null, error: { message: error.message } };
        }

        if (!data.user) {
            return { user: null, error: { message: 'Nie udało się utworzyć konta' } };
        }

        return {
            user: {
                id: data.user.id,
                email: data.user.email || '',
            },
            error: null,
        };
    } catch (error) {
        return {
            user: null,
            error: { message: error instanceof Error ? error.message : 'Nieznany błąd' },
        };
    }
}

// Login existing user
export async function login(email: string, password: string): Promise<AuthResponse> {
    try {
        const { data, error } = await supabaseClient.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            return { user: null, error: { message: error.message } };
        }

        if (!data.user) {
            return { user: null, error: { message: 'Nie udało się zalogować' } };
        }

        return {
            user: {
                id: data.user.id,
                email: data.user.email || '',
            },
            error: null,
        };
    } catch (error) {
        return {
            user: null,
            error: { message: error instanceof Error ? error.message : 'Nieznany błąd' },
        };
    }
}

// Logout current user
export async function logout(): Promise<{ error: AuthError | null }> {
    try {
        const { error } = await supabaseClient.auth.signOut();

        if (error) {
            return { error: { message: error.message } };
        }

        return { error: null };
    } catch (error) {
        return {
            error: { message: error instanceof Error ? error.message : 'Nieznany błąd' },
        };
    }
}

// Get current user
export async function getCurrentUser(): Promise<AuthUser | null> {
    try {
        const {
            data: { user },
        } = await supabaseClient.auth.getUser();

        if (!user) {
            return null;
        }

        return {
            id: user.id,
            email: user.email || '',
        };
    } catch (error) {
        console.error('Error getting current user:', error);
        return null;
    }
}

// Check if user is authenticated
export async function isAuthenticated(): Promise<boolean> {
    const user = await getCurrentUser();
    return user !== null;
}

// Get auth session
export async function getSession() {
    try {
        const {
            data: { session },
        } = await supabaseClient.auth.getSession();
        return session;
    } catch (error) {
        console.error('Error getting session:', error);
        return null;
    }
}
