import { useState } from 'react';
import type { RegisterResponse } from '../lib/api-types';

export function RegisterForm() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccess(false);

        // Validation
        if (!email || !password || !confirmPassword) {
            setError('Wszystkie pola są wymagane');
            return;
        }

        if (password.length < 8) {
            setError('Hasło musi mieć minimum 8 znaków');
            return;
        }

        if (password !== confirmPassword) {
            setError('Hasła nie są takie same');
            return;
        }

        setIsLoading(true);

        try {
            // Call new API endpoint
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(
                    errorData.error?.message || `Błąd rejestracji (${response.status})`
                );
            }

            const data: RegisterResponse = await response.json();

            if (data.user) {
                setSuccess(true);
                // Redirect to login after 2 seconds
                setTimeout(() => {
                    window.location.href = '/logowanie';
                }, 2000);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Błąd rejestracji');
        } finally {
            setIsLoading(false);
        }
    };

    if (success) {
        return (
            <div className="rounded-lg border border-green-200 bg-green-50 p-6">
                <h3 className="mb-2 text-lg font-semibold text-green-900">Rejestracja udana!</h3>
                <p className="text-green-800">
                    Twoje konto zostało utworzone. Za chwilę zostaniesz przekierowany do strony logowania...
                </p>
            </div>
        );
    }

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
                    placeholder="Minimum 8 znaków"
                    disabled={isLoading}
                    required
                    minLength={8}
                />
            </div>

            <div>
                <label
                    htmlFor="confirmPassword"
                    className="mb-2 block text-sm font-medium text-gray-700"
                >
                    Potwierdź hasło
                </label>
                <input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Powtórz hasło"
                    disabled={isLoading}
                    required
                    minLength={8}
                />
            </div>

            <button
                type="submit"
                disabled={isLoading}
                className="w-full rounded-lg bg-blue-600 px-4 py-3 font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
                {isLoading ? 'Rejestrowanie...' : 'Zarejestruj się'}
            </button>

            <div className="text-center text-sm text-gray-600">
                Masz już konto?{' '}
                <a href="/logowanie" className="font-medium text-blue-600 hover:text-blue-700">
                    Zaloguj się
                </a>
            </div>
        </form>
    );
}
