import { useState } from 'react';

interface SessionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (sessionName: string) => Promise<void>;
    defaultName: string;
}

export function SessionModal({ isOpen, onClose, onSave, defaultName }: SessionModalProps) {
    const [sessionName, setSessionName] = useState(defaultName);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    if (!isOpen) return null;

    const handleSave = async () => {
        if (!sessionName.trim()) {
            setError('Nazwa sesji nie może być pusta');
            return;
        }

        setIsSaving(true);
        setError(null);

        try {
            await onSave(sessionName);
            onClose();
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Błąd przy zapisywaniu sesji';
            setError(message);
        } finally {
            setIsSaving(false);
        }
    };

    const handleClose = () => {
        if (!isSaving) {
            setError(null);
            setSessionName(defaultName);
            onClose();
        }
    };

    return (
        // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
            onClick={handleClose}
            onKeyDown={(e) => {
                if (e.key === 'Escape') {
                    handleClose();
                }
            }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
        >
            {/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions */}
            <div
                className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl"
                onClick={(e) => e.stopPropagation()}
                onKeyDown={(e) => e.stopPropagation()}
                role="document"
            >
                <h2 id="modal-title" className="mb-4 text-2xl font-bold text-gray-900">Zapisz fiszki do sesji</h2>

                <div className="mb-4">
                    <label
                        htmlFor="session-name"
                        className="mb-2 block text-sm font-medium text-gray-700"
                    >
                        Nazwa sesji
                    </label>
                    <input
                        id="session-name"
                        type="text"
                        value={sessionName}
                        onChange={(e) => setSessionName(e.target.value)}
                        className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="np. Sesja 2024-12-14"
                        disabled={isSaving}
                    />
                </div>

                {error && (
                    <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-800">
                        {error}
                    </div>
                )}

                <div className="flex gap-3">
                    <button
                        onClick={handleClose}
                        disabled={isSaving}
                        className="flex-1 rounded-lg border border-gray-300 px-4 py-2 font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        Anuluj
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="flex-1 rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {isSaving ? 'Zapisywanie...' : 'Zapisz'}
                    </button>
                </div>
            </div>
        </div>
    );
}
