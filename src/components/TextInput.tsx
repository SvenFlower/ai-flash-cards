import { Loader2 } from 'lucide-react';

interface TextInputProps {
    value: string;
    onChange: (value: string) => void;
    onGenerate: () => void;
    isLoading: boolean;
    error: string | null;
}

export function TextInput({ value, onChange, onGenerate, isLoading, error }: TextInputProps) {
    const charCount = value.length;
    const isValid = charCount >= 1000 && charCount <= 10000;

    return (
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <div className="mb-4">
                <label htmlFor="input-text" className="block text-sm font-semibold text-gray-900 mb-2">
                    Wprowadź tekst do generowania fiszek
                </label>
                <textarea
                    id="input-text"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder="Wklej tutaj tekst, z którego chcesz wygenerować fiszki (minimum 1000 znaków)..."
                    maxLength={10000}
                    className="w-full h-48 p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-gray-900 placeholder-gray-400"
                />
            </div>

            <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
          <span className={`text-sm font-medium ${
              charCount < 1000 ? 'text-orange-600' :
                  charCount > 10000 ? 'text-red-600' :
                      'text-green-600'
          }`}>
            {charCount} / 10000 znaków
          </span>
                    {isValid && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-800">
              ✓ Gotowe do generowania
            </span>
                    )}
                </div>
            </div>

            {error && (
                <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4">
                    <p className="text-sm font-medium text-red-800">{error}</p>
                </div>
            )}

            <button
                onClick={onGenerate}
                disabled={!isValid || isLoading}
                className="w-full rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
                {isLoading ? (
                    <>
                        <Loader2 size={20} className="animate-spin" />
                        Generowanie fiszek...
                    </>
                ) : (
                    'Generuj fiszki'
                )}
            </button>

            {charCount < 1000 && charCount > 0 && (
                <p className="mt-2 text-xs text-gray-500">
                    Potrzebujesz jeszcze {1000 - charCount} znaków.
                </p>
            )}
            {charCount > 10000 && (
                <p className="mt-2 text-xs text-red-500">
                    Tekst jest za długi. Usuń co najmniej {charCount - 10000} znaków.
                </p>
            )}
        </div>
    );
}
