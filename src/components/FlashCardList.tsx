import { FlashCard } from './FlashCard';
import type { FlashCardWithStatus } from '../lib/types.ts';

interface FlashCardListProps {
    flashCards: FlashCardWithStatus[];
    onAccept: (id: string, front: string, back: string) => void;
    onReject: (id: string) => void;
    onSaveToSession?: () => void;
    isLoading?: boolean;
}

export function FlashCardList({
                                  flashCards,
                                  onAccept,
                                  onReject,
                                  onSaveToSession,
                                  isLoading = false,
                              }: FlashCardListProps) {
    const acceptedCount = flashCards.filter((fc) => fc.status === 'accepted').length;
    const rejectedCount = flashCards.filter((fc) => fc.status === 'rejected').length;
    const pendingFlashCards = flashCards.filter((fc) => fc.status === 'pending');

    if (flashCards.length === 0) {
        return (
            <div className="rounded-lg border border-gray-200 bg-white p-6 text-center shadow-sm">
                <p className="text-gray-500">
                    {isLoading
                        ? 'Generowanie fiszek...'
                        : 'Wprowadź tekst i kliknij "Generuj fiszki", aby zobaczyć wyniki tutaj'}
                </p>
            </div>
        );
    }

    return (
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                    <h2 className="text-xl font-bold text-gray-900">Wygenerowane fiszki</h2>
                    {acceptedCount > 0 && onSaveToSession && (
                        <button
                            onClick={onSaveToSession}
                            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                        >
                            Zapisz do sesji ({acceptedCount})
                        </button>
                    )}
                </div>
                <div className="flex gap-4 text-sm">
          <span className="inline-flex items-center gap-2 rounded-full bg-blue-100 px-3 py-1 font-medium text-blue-800">
            <span>Oczekujące: {pendingFlashCards.length}</span>
          </span>
                    <span className="inline-flex items-center gap-2 rounded-full bg-green-100 px-3 py-1 font-medium text-green-800">
            <span>Zaakceptowane: {acceptedCount}</span>
          </span>
                    <span className="inline-flex items-center gap-2 rounded-full bg-red-100 px-3 py-1 font-medium text-red-800">
            <span>Odrzucone: {rejectedCount}</span>
          </span>
                </div>
            </div>

            <div className="space-y-4">
                {flashCards.map((flashCard) => (
                    <div
                        key={flashCard.id}
                        className={`rounded-lg border-l-4 ${
                            flashCard.status === 'accepted'
                                ? 'border-l-green-500 bg-green-50'
                                : flashCard.status === 'rejected'
                                    ? 'border-l-red-500 bg-red-50 opacity-60'
                                    : 'border-l-blue-500'
                        }`}
                    >
                        <FlashCard
                            flashCard={flashCard}
                            onAccept={onAccept}
                            onReject={onReject}
                        />
                    </div>
                ))}
            </div>
        </div>
    );
}
