import { Trash2 } from 'lucide-react';
import type { FlashCard } from '../lib/types.ts';

interface SavedFlashCardsProps {
    flashCards: FlashCard[];
    onDelete: (id: string) => void;
}

export function SavedFlashCards({ flashCards, onDelete }: SavedFlashCardsProps) {
    if (flashCards.length === 0) {
        return (
            <div className="rounded-lg border border-gray-200 bg-white p-6 text-center shadow-sm">
                <p className="text-gray-500">Brak zapisanych fiszek. Zaakceptuj fiszki aby je zapisać.</p>
            </div>
        );
    }

    return (
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
                Zapisane fiszki ({flashCards.length})
            </h2>

            <div className="space-y-3">
                {flashCards.map((flashCard) => (
                    <div
                        key={flashCard.id}
                        className="flex items-start justify-between rounded-lg border border-gray-200 bg-gray-50 p-4 hover:bg-gray-100 transition-colors"
                    >
                        <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 mb-1 break-words">{flashCard.front}</p>
                            <p className="text-sm text-gray-600 break-words">{flashCard.back}</p>
                            <p className="text-xs text-gray-400 mt-2">
                                {new Date(flashCard.createdAt).toLocaleDateString('pl-PL', {
                                    year: 'numeric',
                                    month: '2-digit',
                                    day: '2-digit',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                })}
                            </p>
                        </div>

                        <button
                            onClick={() => onDelete(flashCard.id)}
                            className="ml-3 flex-shrink-0 rounded-md bg-red-100 p-2 text-red-600 transition-colors hover:bg-red-200"
                            title="Usuń fiszką"
                        >
                            <Trash2 size={18} />
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}
