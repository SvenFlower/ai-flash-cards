import { useState } from 'react';
import { Check, X, Edit2, Save } from 'lucide-react';
import type { FlashCardWithStatus } from '../lib/types.ts';

interface FlashCardCardProps {
    flashCard: FlashCardWithStatus;
    onAccept: (id: string, front: string, back: string) => void;
    onReject: (id: string) => void;
}

export function FlashCard({ flashCard, onAccept, onReject }: FlashCardCardProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [editedFront, setEditedFront] = useState(flashCard.front);
    const [editedBack, setEditedBack] = useState(flashCard.back);
    const [isFlipped, setIsFlipped] = useState(false);

    const handleSave = () => {
        if (editedFront.trim() && editedBack.trim()) {
            onAccept(flashCard.id, editedFront, editedBack);
            setIsEditing(false);
        }
    };

    return (
        <div className="mb-4 rounded-lg border border-gray-200 bg-white shadow-sm transition-all hover:shadow-md">
            <div
                className="relative h-40 cursor-pointer"
                onClick={() => setIsFlipped(!isFlipped)}
            >
                <div
                    className="absolute inset-0 flex items-center justify-center rounded-lg bg-gradient-to-br from-blue-50 to-indigo-50 p-4 transition-opacity"
                    style={{ opacity: isFlipped ? 0 : 1, pointerEvents: isFlipped ? 'none' : 'auto' }}
                >
                    {isEditing && !isFlipped ? (
                        <textarea
                            value={editedFront}
                            onChange={(e) => setEditedFront(e.target.value)}
                            className="h-full w-full resize-none rounded border border-blue-300 bg-white p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            onClick={(e) => e.stopPropagation()}
                        />
                    ) : (
                        <div className="text-center">
                            <p className="text-xs font-medium text-gray-500 mb-2">Przód</p>
                            <p className="text-base font-semibold text-gray-800">{editedFront}</p>
                        </div>
                    )}
                </div>

                <div
                    className="absolute inset-0 flex items-center justify-center rounded-lg bg-gradient-to-br from-green-50 to-emerald-50 p-4 transition-opacity"
                    style={{ opacity: isFlipped ? 1 : 0, pointerEvents: isFlipped ? 'auto' : 'none' }}
                >
                    {isEditing && isFlipped ? (
                        <textarea
                            value={editedBack}
                            onChange={(e) => setEditedBack(e.target.value)}
                            className="h-full w-full resize-none rounded border border-green-300 bg-white p-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                            onClick={(e) => e.stopPropagation()}
                        />
                    ) : (
                        <div className="text-center">
                            <p className="text-xs font-medium text-gray-500 mb-2">Tył</p>
                            <p className="text-sm text-gray-700">{editedBack}</p>
                        </div>
                    )}
                </div>

                <div className="absolute right-2 top-2 rounded-full bg-white px-2 py-1 text-xs font-medium text-gray-600 shadow-sm">
                    {isFlipped ? 'Tył' : 'Przód'}
                </div>
            </div>

            <div className="flex gap-2 border-t border-gray-200 bg-gray-50 p-3">
                {!isEditing ? (
                    <>
                        <button
                            onClick={() => handleSave()}
                            disabled={flashCard.status === 'accepted'}
                            className="flex flex-1 items-center justify-center gap-1 rounded-md bg-green-500 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-green-600 disabled:bg-gray-300"
                        >
                            <Check size={16} />
                            <span className="hidden sm:inline">Akceptuj</span>
                        </button>

                        <button
                            onClick={() => setIsEditing(true)}
                            disabled={flashCard.status === 'accepted'}
                            className="flex items-center justify-center gap-1 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 disabled:opacity-50"
                        >
                            <Edit2 size={16} />
                            <span className="hidden sm:inline">Edytuj</span>
                        </button>

                        <button
                            onClick={() => onReject(flashCard.id)}
                            className="flex items-center justify-center gap-1 rounded-md bg-red-500 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-red-600"
                        >
                            <X size={16} />
                            <span className="hidden sm:inline">Odrzuć</span>
                        </button>
                    </>
                ) : (
                    <>
                        <button
                            onClick={handleSave}
                            className="flex flex-1 items-center justify-center gap-1 rounded-md bg-blue-500 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-600"
                        >
                            <Save size={16} />
                            <span>Zapisz</span>
                        </button>
                        <button
                            onClick={() => {
                                setIsEditing(false);
                                setEditedFront(flashCard.front);
                                setEditedBack(flashCard.back);
                                setIsFlipped(false);
                            }}
                            className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100"
                        >
                            Anuluj
                        </button>
                    </>
                )}
            </div>
        </div>
    );
}
