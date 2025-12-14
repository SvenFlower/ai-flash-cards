import { useState, useEffect } from 'react';
import { getCurrentUser, logout, type AuthUser } from '../lib/auth';

export function AuthNav() {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadUser = async () => {
            const currentUser = await getCurrentUser();
            setUser(currentUser);
            setIsLoading(false);
        };
        loadUser();
    }, []);

    const handleLogout = async () => {
        try {
            await logout();
            window.location.href = '/';
        } catch (error) {
            console.error('Logout error:', error);
        }
    };

    if (isLoading) {
        return <div className="h-9 w-24 animate-pulse rounded bg-gray-200"></div>;
    }

    if (user) {
        return (
            <div className="flex items-center gap-3">
                <span className="text-sm text-gray-600">{user.email}</span>
                <button
                    onClick={handleLogout}
                    className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                    Wyloguj
                </button>
            </div>
        );
    }

    return (
        <div className="flex items-center gap-2">
            <a
                href="/logowanie"
                className="rounded-lg px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
            >
                Logowanie
            </a>
            <a
                href="/rejestracja"
                className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
            >
                Rejestracja
            </a>
        </div>
    );
}
