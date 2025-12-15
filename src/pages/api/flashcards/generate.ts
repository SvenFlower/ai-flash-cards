/**
 * POST /api/flashcards/generate
 *
 * Generate flashcards from educational text using AI (OpenRouter API).
 *
 * SECURITY: This endpoint moves the OpenRouter API call from client-side to server-side,
 * preventing exposure of the API key to the browser.
 *
 * @see .ai/generate-flashcards-implementation-plan.md
 */

import type { APIRoute } from 'astro';
import { z } from 'zod';
import type {
  GenerateFlashCardsRequest,
  GenerateFlashCardsResponse,
  GeneratedFlashCard,
} from '@/lib/api-types';
import { ErrorCodes } from '@/lib/api-types';

// Disable prerendering for this dynamic API route
export const prerender = false;

// ============================================================================
// Validation Schema
// ============================================================================

const generateFlashCardsSchema = z.object({
  text: z
    .string()
    .min(100, 'Text must be at least 100 characters')
    .max(10000, 'Text must not exceed 10,000 characters')
    .refine((val) => val.trim().length >= 100, {
      message: 'Text must contain at least 100 non-whitespace characters',
    }),
});

// ============================================================================
// System Prompt for OpenRouter
// ============================================================================

const SYSTEM_PROMPT = `You are a helpful assistant that creates educational flashcards from provided text.

Your task:
1. Analyze the educational content provided
2. Extract key concepts, definitions, facts, and relationships
3. Create high-quality flashcards that help learning and retention
4. Generate 5-15 flashcards based on the complexity and length of the content

Format your response as JSON:
{
  "flashcards": [
    {"front": "Question or prompt", "back": "Answer or explanation"},
    {"front": "Another question", "back": "Another answer"}
  ]
}

Guidelines:
- Questions should be clear and specific
- Answers should be concise but complete
- Include various types: definitions, examples, comparisons, applications
- Avoid yes/no questions - prefer "what", "how", "why" questions
- Make connections between concepts when relevant`;

// ============================================================================
// OpenRouter API Types
// ============================================================================

interface OpenRouterMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface OpenRouterRequest {
  model: string;
  messages: OpenRouterMessage[];
  response_format?: {
    type: 'json_object';
  };
}

interface OpenRouterResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

interface OpenRouterFlashCardsContent {
  flashcards: Array<{
    front: string;
    back: string;
  }>;
}

// ============================================================================
// Main Handler
// ============================================================================

export const POST: APIRoute = async ({ request, locals }) => {
  // Step 1: Authentication check
  if (!locals.user) {
    return new Response(
      JSON.stringify({
        error: {
          message: 'Unauthorized - authentication required',
          code: ErrorCodes.AUTH_REQUIRED,
        },
      }),
      {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  // Step 2: Parse request body
  let body: GenerateFlashCardsRequest;
  try {
    body = await request.json();
  } catch (_error) {
    return new Response(
      JSON.stringify({
        error: {
          message: 'Invalid JSON in request body',
          code: ErrorCodes.VALIDATION_FAILED,
        },
      }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  // Step 3: Validate with Zod
  const validationResult = generateFlashCardsSchema.safeParse(body);
  if (!validationResult.success) {
    return new Response(
      JSON.stringify({
        error: {
          message: 'Validation failed',
          code: ErrorCodes.VALIDATION_FAILED,
          fields: validationResult.error.flatten().fieldErrors,
        },
      }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  const { text } = validationResult.data;

  // Step 4: Call OpenRouter API
  try {
    const openrouterRequest: OpenRouterRequest = {
      model: 'openai/gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: SYSTEM_PROMPT,
        },
        {
          role: 'user',
          content: text,
        },
      ],
      response_format: {
        type: 'json_object',
      },
    };

    const openrouterResponse = await fetch(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${import.meta.env.OPENROUTER_API_KEY}`,
          'HTTP-Referer': 'https://ai-flash-cards.gstachniuk.workers.dev',
          'X-Title': '10x FlashCards',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(openrouterRequest),
        signal: AbortSignal.timeout(30000), // 30 second timeout
      }
    );

    if (!openrouterResponse.ok) {
      const errorText = await openrouterResponse.text();
      console.error(
        '[Generate FlashCards] OpenRouter API error:',
        openrouterResponse.status,
        errorText
      );

      throw new Error(`OpenRouter API error: ${openrouterResponse.status}`);
    }

    const openrouterData = (await openrouterResponse.json()) as OpenRouterResponse;

    // Step 5: Parse AI response
    if (
      !openrouterData.choices ||
      !openrouterData.choices[0] ||
      !openrouterData.choices[0].message
    ) {
      console.error('[Generate FlashCards] Invalid OpenRouter response structure:', openrouterData);
      throw new Error('Invalid response structure from OpenRouter');
    }

    const messageContent = openrouterData.choices[0].message.content;
    const content: OpenRouterFlashCardsContent = JSON.parse(messageContent);

    if (!content.flashcards || !Array.isArray(content.flashcards)) {
      console.error('[Generate FlashCards] Invalid flashcards structure:', content);
      throw new Error('Invalid flashcards structure in AI response');
    }

    // Transform and validate flashcards
    const flashcards: GeneratedFlashCard[] = content.flashcards
      .filter((card) => card.front && card.back) // Filter out invalid cards
      .map((card) => ({
        front: String(card.front).trim(),
        back: String(card.back).trim(),
      }));

    if (flashcards.length === 0) {
      console.error('[Generate FlashCards] No valid flashcards generated');
      throw new Error('No valid flashcards were generated');
    }

    // Step 6: Return success response
    const response: GenerateFlashCardsResponse = { flashcards };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[Generate FlashCards] Error:', error);

    // Timeout error
    if (
      error instanceof Error &&
      (error.name === 'AbortError' || error.name === 'TimeoutError')
    ) {
      return new Response(
        JSON.stringify({
          error: {
            message: 'AI generation timed out - please try again with shorter text',
            code: ErrorCodes.AI_SERVICE_TIMEOUT,
          },
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Parse error
    if (
      error instanceof SyntaxError ||
      (error instanceof Error && error.message.includes('Invalid flashcards structure'))
    ) {
      return new Response(
        JSON.stringify({
          error: {
            message: 'Failed to parse AI response - please try again',
            code: ErrorCodes.AI_PARSE_ERROR,
          },
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Generic error
    return new Response(
      JSON.stringify({
        error: {
          message: 'Failed to generate flashcards - please try again later',
          code: ErrorCodes.AI_SERVICE_ERROR,
        },
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
