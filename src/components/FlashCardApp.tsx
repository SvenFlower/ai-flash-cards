import { useState } from 'react';
import { TextInput } from './TextInput';
import { FlashCardList } from './FlashCardList';
import { SessionModal } from './SessionModal';
import { AuthNav } from './AuthNav';
import { saveFlashCard, saveFlashCardsToSession } from '../lib/storage';
import type { FlashCardWithStatus } from '../lib/types.ts';
import type { GenerateFlashCardsResponse } from '../lib/api-types';

export function FlashCardApp() {
    const [inputText, setInputText] = useState('');
    const [generatedFlashCards, setGeneratedFlashCards] = useState<FlashCardWithStatus[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isSessionModalOpen, setIsSessionModalOpen] = useState(false);

    // Generate default session name: "Sesja YYYY-MM-DD"
    const getDefaultSessionName = () => {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        return `Sesja ${year}-${month}-${day}`;
    };


    const handleGenerate = async () => {
        setError(null);
        setIsLoading(true);

        try {
            // Call the new server-side API endpoint instead of direct OpenRouter call
            const response = await fetch('/api/flashcards/generate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ text: inputText }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(
                    errorData.error?.message ||
                    `Błąd generowania fiszek (${response.status})`
                );
            }

            const data: GenerateFlashCardsResponse = await response.json();
            const flashCards = data.flashcards;

            const withStatus = flashCards.map((fc) => ({
                ...fc,
                id: Math.random().toString(36).substring(7),
                status: 'pending' as const,
            }));
            setGeneratedFlashCards(withStatus);
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Nieznany błąd';
            setError(message);
            setGeneratedFlashCards([]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleAccept = async (id: string, front: string, back: string) => {
        setGeneratedFlashCards((prev) =>
            prev.map((fc) =>
                fc.id === id
                    ? { ...fc, front, back, status: 'accepted' as const }
                    : fc,
            ),
        );
    };

    const handleReject = (id: string) => {
        setGeneratedFlashCards((prev) =>
            prev.map((fc) =>
                fc.id === id ? { ...fc, status: 'rejected' as const } : fc,
            ),
        );
    };


    const handleSaveToSession = () => {
        setIsSessionModalOpen(true);
    };

    const handleSessionSave = async (sessionName: string) => {
        try {
            // Get only accepted flashcards
            const acceptedFlashCards = generatedFlashCards
                .filter((fc) => fc.status === 'accepted')
                .map(({ front, back }) => ({ front, back }));

            if (acceptedFlashCards.length === 0) {
                throw new Error('Brak zaakceptowanych fiszek do zapisania');
            }

            await saveFlashCardsToSession(acceptedFlashCards, sessionName);

            // Clear generated flashcards after successful save
            setGeneratedFlashCards([]);
            setIsSessionModalOpen(false);

            // Show success message and optionally redirect to sessions page
            const goToSessions = confirm(
                `Sesja "${sessionName}" została zapisana z ${acceptedFlashCards.length} fiszkami!\n\nCzy chcesz przejść do listy sesji?`
            );

            if (goToSessions) {
                window.location.href = '/sesje';
            }
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Błąd przy zapisywaniu sesji';
            setError(message);
            throw err;
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
            <nav className="bg-white border-b border-gray-200 mb-8">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="flex h-16 justify-between items-center">
                        <div>
                            <h1 className="text-xl font-bold text-gray-900">10x FlashCards</h1>
                        </div>
                        <div className="flex items-center gap-6">
                            <div className="flex items-center gap-4">
                                <a
                                    href="/"
                                    className="text-gray-900 font-medium"
                                >
                                    Strona główna
                                </a>
                                <a
                                    href="/sesje"
                                    data-astro-reload
                                    className="text-gray-600 hover:text-gray-900 font-medium transition-colors"
                                >
                                    Sesje
                                </a>
                            </div>
                            <AuthNav />
                        </div>
                    </div>
                </div>
            </nav>

            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
                <div className="mb-8 text-center">
                    <h2 className="text-3xl font-bold text-gray-900 mb-2">Generator Fiszek AI</h2>
                    <p className="text-gray-600">Generuj fiszki edukacyjne za pomocą AI</p>
                </div>

                <div className="max-w-4xl mx-auto">
                    <div className="mb-6">
                        <TextInput
                            value={inputText}
                            onChange={setInputText}
                            onGenerate={handleGenerate}
                            isLoading={isLoading}
                            error={error}
                        />
                    </div>

                    {generatedFlashCards.length > 0 && (
                        <FlashCardList
                            flashCards={generatedFlashCards}
                            onAccept={handleAccept}
                            onReject={handleReject}
                            onSaveToSession={handleSaveToSession}
                            isLoading={isLoading}
                        />
                    )}
                </div>
            </div>

            <SessionModal
                isOpen={isSessionModalOpen}
                onClose={() => setIsSessionModalOpen(false)}
                onSave={handleSessionSave}
                defaultName={getDefaultSessionName()}
            />
        </div>
    );
}
