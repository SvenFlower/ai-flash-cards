import { useState } from 'react';
import { login } from '../lib/auth';

export function LoginForm() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        // Validation
        if (!email || !password) {
            setError('Email i hasło są wymagane');
            return;
        }

        setIsLoading(true);

        try {
            const { user, error: authError } = await login(email, password);

            if (authError) {
                setError(authError.message);
                return;
            }

            if (user) {
                // Redirect to home page
                window.location.href = '/';
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Błąd logowania');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
                    {error}
                </div>
            )}

            <div>
                <label htmlFor="email" className="mb-2 block text-sm font-medium text-gray-700">
                    Email
                </label>
                <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="twoj@email.pl"
                    disabled={isLoading}
                    required
                />
            </div>

            <div>
                <label htmlFor="password" className="mb-2 block text-sm font-medium text-gray-700">
                    Hasło
                </label>
                <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Twoje hasło"
                    disabled={isLoading}
                    required
                />
            </div>

            <button
                type="submit"
                disabled={isLoading}
                className="w-full rounded-lg bg-blue-600 px-4 py-3 font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
                {isLoading ? 'Logowanie...' : 'Zaloguj się'}
            </button>

            <div className="text-center text-sm text-gray-600">
                Nie masz konta?{' '}
                <a href="/rejestracja" className="font-medium text-blue-600 hover:text-blue-700">
                    Zarejestruj się
                </a>
            </div>
        </form>
    );
}
