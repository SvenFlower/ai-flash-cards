/**
 * GET /api/flashcards - List all flashcards for user (with optional session filter)
 * POST /api/flashcards - Create new flashcard
 *
 * @see .ai/api-plan.md
 */

import type { APIRoute } from 'astro';
import { z } from 'zod';
import type {
  FlashCardsListResponse,
  CreateFlashCardRequest,
  CreateFlashCardResponse,
} from '@/lib/api-types';
import { ErrorCodes } from '@/lib/api-types';

export const prerender = false;

// ============================================================================
// Validation Schema
// ============================================================================

const createFlashCardSchema = z.object({
  session_id: z.string().uuid('Invalid session ID format'),
  front: z.string().min(1, 'Front text is required').max(1000, 'Front text must not exceed 1000 characters'),
  back: z.string().min(1, 'Back text is required').max(1000, 'Back text must not exceed 1000 characters'),
});

// ============================================================================
// GET Handler - List all flashcards (optionally filtered by session)
// ============================================================================

export const GET: APIRoute = async ({ url, locals }) => {
  // Step 1: Check authentication
  if (!locals.user) {
    return new Response(
      JSON.stringify({
        error: {
          message: 'Authentication required',
          code: ErrorCodes.AUTH_REQUIRED,
        },
      }),
      {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  // Step 2: Get optional session_id from query params
  const sessionId = url.searchParams.get('session_id');

  // Step 3: Query flashcards from database
  try {
    let query = locals.supabase
      .from('flash_cards')
      .select(
        `
        id,
        front,
        back,
        created_at,
        session_id,
        sessions!inner(user_id)
      `
      )
      .eq('sessions.user_id', locals.user.id)
      .order('created_at', { ascending: false });

    // Filter by session if provided
    if (sessionId) {
      query = query.eq('session_id', sessionId);
    }

    const { data: flashcards, error } = await query;

    if (error) {
      console.error('[FlashCards List] Database error:', error);
      return new Response(
        JSON.stringify({
          error: {
            message: 'Failed to fetch flashcards',
            code: ErrorCodes.INTERNAL_ERROR,
          },
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Step 4: Return flashcards list
    const response: FlashCardsListResponse = {
      flashcards:
        flashcards?.map((card: any) => ({
          id: card.id,
          front: card.front,
          back: card.back,
          created_at: card.created_at,
          session_id: card.session_id,
        })) || [],
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[FlashCards List] Unexpected error:', error);
    return new Response(
      JSON.stringify({
        error: {
          message: 'Failed to fetch flashcards',
          code: ErrorCodes.INTERNAL_ERROR,
        },
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};

// ============================================================================
// POST Handler - Create new flashcard
// ============================================================================

export const POST: APIRoute = async ({ request, locals }) => {
  // Step 1: Check authentication
  if (!locals.user) {
    return new Response(
      JSON.stringify({
        error: {
          message: 'Authentication required',
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
  let body: CreateFlashCardRequest;
  try {
    body = await request.json();
  } catch (error) {
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
  const validationResult = createFlashCardSchema.safeParse(body);
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

  const { session_id, front, back } = validationResult.data;

  // Step 4: Verify session ownership
  try {
    const { data: session, error: sessionError } = await locals.supabase
      .from('sessions')
      .select('id')
      .eq('id', session_id)
      .eq('user_id', locals.user.id)
      .single();

    if (sessionError || !session) {
      return new Response(
        JSON.stringify({
          error: {
            message: 'Session not found or access denied',
            code: ErrorCodes.SESSION_NOT_FOUND,
          },
        }),
        {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Step 5: Insert flashcard into database
    const { data: flashcard, error } = await locals.supabase
      .from('flash_cards')
      .insert({
        user_id: locals.user.id,
        session_id,
        front,
        back,
      })
      .select('id, front, back, created_at, session_id')
      .single();

    if (error) {
      console.error('[FlashCard Create] Database error:', error);
      return new Response(
        JSON.stringify({
          error: {
            message: 'Failed to create flashcard',
            code: ErrorCodes.INTERNAL_ERROR,
          },
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    if (!flashcard) {
      return new Response(
        JSON.stringify({
          error: {
            message: 'Failed to create flashcard - no data returned',
            code: ErrorCodes.INTERNAL_ERROR,
          },
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('[FlashCard Create] Flashcard created:', flashcard.id, 'for user:', locals.user.email);

    // Step 6: Return success response
    const response: CreateFlashCardResponse = {
      flashcard: {
        id: flashcard.id,
        front: flashcard.front,
        back: flashcard.back,
        created_at: flashcard.created_at,
        session_id: flashcard.session_id,
      },
    };

    return new Response(JSON.stringify(response), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[FlashCard Create] Unexpected error:', error);
    return new Response(
      JSON.stringify({
        error: {
          message: 'Failed to create flashcard',
          code: ErrorCodes.INTERNAL_ERROR,
        },
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
