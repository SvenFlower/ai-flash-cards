/**
 * GET /api/flashcards/:id - Get flashcard by ID
 * PUT /api/flashcards/:id - Update flashcard front/back
 * DELETE /api/flashcards/:id - Delete flashcard
 *
 * @see .ai/api-plan.md
 */

import type { APIRoute } from 'astro';
import { z } from 'zod';
import type {
  FlashCardDetailResponse,
  UpdateFlashCardRequest,
  UpdateFlashCardResponse,
  DeleteFlashCardResponse,
} from '@/lib/api-types';
import { ErrorCodes } from '@/lib/api-types';

export const prerender = false;

// ============================================================================
// Validation Schema
// ============================================================================

const updateFlashCardSchema = z.object({
  front: z.string().min(1, 'Front text is required').max(1000, 'Front text must not exceed 1000 characters'),
  back: z.string().min(1, 'Back text is required').max(1000, 'Back text must not exceed 1000 characters'),
});

// ============================================================================
// GET Handler - Get flashcard by ID
// ============================================================================

export const GET: APIRoute = async ({ params, locals }) => {
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

  // Step 2: Get flashcard ID from params
  const flashcardId = params.id;
  if (!flashcardId) {
    return new Response(
      JSON.stringify({
        error: {
          message: 'Flashcard ID is required',
          code: ErrorCodes.VALIDATION_FAILED,
        },
      }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  // Step 3: Query flashcard from database
  try {
    const { data: flashcard, error } = await locals.supabase
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
      .eq('id', flashcardId)
      .eq('sessions.user_id', locals.user.id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // Not found or access denied
        return new Response(
          JSON.stringify({
            error: {
              message: 'Flashcard not found',
              code: ErrorCodes.FLASHCARD_NOT_FOUND,
            },
          }),
          {
            status: 404,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }

      console.error('[FlashCard Get] Database error:', error);
      return new Response(
        JSON.stringify({
          error: {
            message: 'Failed to fetch flashcard',
            code: ErrorCodes.INTERNAL_ERROR,
          },
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Step 4: Return flashcard
    const response: FlashCardDetailResponse = {
      flashcard: {
        id: flashcard.id,
        front: flashcard.front,
        back: flashcard.back,
        created_at: flashcard.created_at,
        session_id: flashcard.session_id,
      },
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[FlashCard Get] Unexpected error:', error);
    return new Response(
      JSON.stringify({
        error: {
          message: 'Failed to fetch flashcard',
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
// PUT Handler - Update flashcard front/back
// ============================================================================

export const PUT: APIRoute = async ({ params, request, locals }) => {
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

  // Step 2: Get flashcard ID from params
  const flashcardId = params.id;
  if (!flashcardId) {
    return new Response(
      JSON.stringify({
        error: {
          message: 'Flashcard ID is required',
          code: ErrorCodes.VALIDATION_FAILED,
        },
      }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  // Step 3: Parse request body
  let body: UpdateFlashCardRequest;
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

  // Step 4: Validate with Zod
  const validationResult = updateFlashCardSchema.safeParse(body);
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

  const { front, back } = validationResult.data;

  // Step 5: Verify ownership and update flashcard
  try {
    // First verify the flashcard exists and user owns it via session
    const { data: existingCard, error: checkError } = await locals.supabase
      .from('flash_cards')
      .select(
        `
        id,
        sessions!inner(user_id)
      `
      )
      .eq('id', flashcardId)
      .eq('sessions.user_id', locals.user.id)
      .single();

    if (checkError || !existingCard) {
      return new Response(
        JSON.stringify({
          error: {
            message: 'Flashcard not found',
            code: ErrorCodes.FLASHCARD_NOT_FOUND,
          },
        }),
        {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Update the flashcard
    const { data: flashcard, error } = await locals.supabase
      .from('flash_cards')
      .update({ front, back })
      .eq('id', flashcardId)
      .select('id, front, back, created_at, session_id')
      .single();

    if (error) {
      console.error('[FlashCard Update] Database error:', error);
      return new Response(
        JSON.stringify({
          error: {
            message: 'Failed to update flashcard',
            code: ErrorCodes.INTERNAL_ERROR,
          },
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }


    // Step 6: Return updated flashcard
    const response: UpdateFlashCardResponse = {
      flashcard: {
        id: flashcard.id,
        front: flashcard.front,
        back: flashcard.back,
        created_at: flashcard.created_at,
        session_id: flashcard.session_id,
      },
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[FlashCard Update] Unexpected error:', error);
    return new Response(
      JSON.stringify({
        error: {
          message: 'Failed to update flashcard',
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
// DELETE Handler - Delete flashcard
// ============================================================================

export const DELETE: APIRoute = async ({ params, locals }) => {
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

  // Step 2: Get flashcard ID from params
  const flashcardId = params.id;
  if (!flashcardId) {
    return new Response(
      JSON.stringify({
        error: {
          message: 'Flashcard ID is required',
          code: ErrorCodes.VALIDATION_FAILED,
        },
      }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  // Step 3: Verify ownership and delete flashcard
  try {
    // First verify the flashcard exists and user owns it via session
    const { data: existingCard, error: checkError } = await locals.supabase
      .from('flash_cards')
      .select(
        `
        id,
        sessions!inner(user_id)
      `
      )
      .eq('id', flashcardId)
      .eq('sessions.user_id', locals.user.id)
      .single();

    if (checkError || !existingCard) {
      return new Response(
        JSON.stringify({
          error: {
            message: 'Flashcard not found',
            code: ErrorCodes.FLASHCARD_NOT_FOUND,
          },
        }),
        {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Delete the flashcard
    const { error } = await locals.supabase.from('flash_cards').delete().eq('id', flashcardId);

    if (error) {
      console.error('[FlashCard Delete] Database error:', error);
      return new Response(
        JSON.stringify({
          error: {
            message: 'Failed to delete flashcard',
            code: ErrorCodes.INTERNAL_ERROR,
          },
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }


    // Step 4: Return success response
    const response: DeleteFlashCardResponse = {
      success: true,
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[FlashCard Delete] Unexpected error:', error);
    return new Response(
      JSON.stringify({
        error: {
          message: 'Failed to delete flashcard',
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
