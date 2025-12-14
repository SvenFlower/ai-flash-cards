import type { GeneratedFlashCard } from './types';

const API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const MODEL = 'openai/gpt-4o-mini';
const TIMEOUT_MS = 30000;

interface OpenRouterResponse {
    choices: Array<{
        message: {
            content: string;
        };
    }>;
}

function createPrompt(text: string): string {
    return `Jesteś ekspertem w tworzeniu fiszek edukacyjnych. Na podstawie poniższego tekstu wygeneruj 5-10 fiszek (flashCards).

Zasady:
- Każda fiszka ma "front" (pytanie/pojęcie) i "back" (odpowiedź/wyjaśnienie)
- Front powinien być zwięzły (max 100 znaków)
- Back powinien być konkretny i edukacyjny (max 300 znaków)
- Unikaj fiszek zbyt ogólnych lub trywialnych

Tekst źródłowy:
${text}

Zwróć TYLKO JSON w formacie:
{"flashCards": [{"front": "...", "back": "..."}, ...]}`;
}

export async function generateFlashCards(text: string): Promise<GeneratedFlashCard[]> {
    const apiKey = import.meta.env.PUBLIC_OPENROUTER_API_KEY;

    if (!apiKey) {
        throw new Error('OpenRouter API key is not configured. Please set PUBLIC_OPENROUTER_API_KEY in .env');
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
                'HTTP-Referer': typeof window !== 'undefined' ? window.location.origin : 'https://10x-cards.local',
                'X-Title': '10x-cards-poc',
            },
            body: JSON.stringify({
                model: MODEL,
                messages: [
                    {
                        role: 'user',
                        content: createPrompt(text),
                    },
                ],
                temperature: 0.7,
                max_tokens: 2000,
            }),
            signal: controller.signal,
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new Error(
                `API error: ${response.status} - ${error.error?.message || 'Unknown error'}`,
            );
        }

        const data = (await response.json()) as OpenRouterResponse;
        const content = data.choices[0]?.message.content;

        if (!content) {
            throw new Error('Invalid response format from API');
        }

        // Remove markdown code blocks if present
        let cleanedContent = content.trim();

        // Match content between ```json and ``` (or just ``` and ```)
        const codeBlockMatch = cleanedContent.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
        if (codeBlockMatch) {
            cleanedContent = codeBlockMatch[1].trim();
        }

        const parsed = JSON.parse(cleanedContent);

        if (!parsed.flashCards || !Array.isArray(parsed.flashCards)) {
            throw new Error('Invalid flashCards format in response');
        }

        return parsed.flashCards.filter(
            (fc: Record<string, unknown>) => fc.front && fc.back,
        ) as GeneratedFlashCard[];
    } catch (error) {
        if (error instanceof Error) {
            if (error.name === 'AbortError') {
                throw new Error('Request timeout: AI service took too long to respond');
            }
            throw error;
        }
        throw new Error('Unknown error occurred');
    } finally {
        clearTimeout(timeoutId);
    }
}
