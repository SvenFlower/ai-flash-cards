import { useState, useEffect } from 'react';
import { TextInput } from './TextInput';
import { FlashCardList } from './FlashCardList';
import { SavedFlashCards } from './SavedFlashCards';
import { generateFlashCards } from '../lib/openrouter';
import { saveFlashCard, getFlashCards, deleteFlashCard } from '../lib/storage';
import type { FlashCardWithStatus, FlashCard } from '../lib/types.ts';

export function FlashCardApp() {
    const [inputText, setInputText] = useState('');
    const [generatedFlashCards, setGeneratedFlashCards] = useState<FlashCardWithStatus[]>([]);
    const [savedFlashCards, setSavedFlashCards] = useState<FlashCard[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        setSavedFlashCards(getFlashCards());
    }, []);

    const handleGenerate = async () => {
        setError(null);
        setIsLoading(true);

        try {
            const flashCards = await generateFlashCards(inputText);
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

    const handleAccept = (id: string, front: string, back: string) => {
        setGeneratedFlashCards((prev) =>
            prev.map((fc) =>
                fc.id === id
                    ? { ...fc, front, back, status: 'accepted' as const }
                    : fc,
            ),
        );

        try {
            saveFlashCard({ front, back });
            setSavedFlashCards(getFlashCards());
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Błąd przy zapisie';
            setError(message);
        }
    };

    const handleReject = (id: string) => {
        setGeneratedFlashCards((prev) =>
            prev.map((fc) =>
                fc.id === id ? { ...fc, status: 'rejected' as const } : fc,
            ),
        );
    };

    const handleDeleteSaved = (id: string) => {
        try {
            deleteFlashCard(id);
            setSavedFlashCards(getFlashCards());
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Błąd przy usuwaniu';
            setError(message);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-8">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="mb-8 text-center">
                    <h1 className="text-4xl font-bold text-gray-900 mb-2">10x FlashCards</h1>
                    <p className="text-gray-600">Generuj fiszki edukacyjne za pomocą AI</p>
                </div>

                <div className="grid gap-8 lg:grid-cols-3">
                    <div className="lg:col-span-2">
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
                                isLoading={isLoading}
                            />
                        )}
                    </div>

                    <div>
                        <SavedFlashCards
                            flashCards={savedFlashCards}
                            onDelete={handleDeleteSaved}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
