/**
 * GET /api/sessions/:id - Get session by ID
 * PUT /api/sessions/:id - Update session name
 * DELETE /api/sessions/:id - Delete session (cascades to flashcards)
 *
 * @see .ai/api-plan.md
 */

import type { APIRoute } from 'astro';
import { z } from 'zod';
import type {
  SessionDetailResponse,
  UpdateSessionRequest,
  UpdateSessionResponse,
  DeleteSessionResponse,
} from '@/lib/api-types';
import { ErrorCodes } from '@/lib/api-types';

export const prerender = false;

// ============================================================================
// Validation Schema
// ============================================================================

const updateSessionSchema = z.object({
  name: z.string().min(1, 'Session name is required').max(255, 'Session name must not exceed 255 characters'),
});

// ============================================================================
// Helper - Verify session ownership
// ============================================================================

async function verifySessionOwnership(supabase: any, sessionId: string, userId: string) {
  const { data: session, error } = await supabase
    .from('sessions')
    .select('id')
    .eq('id', sessionId)
    .eq('user_id', userId)
    .single();

  if (error || !session) {
    return false;
  }

  return true;
}

// ============================================================================
// GET Handler - Get session by ID with flashcards
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

  // Step 2: Get session ID from params
  const sessionId = params.id;
  if (!sessionId) {
    return new Response(
      JSON.stringify({
        error: {
          message: 'Session ID is required',
          code: ErrorCodes.VALIDATION_FAILED,
        },
      }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  // Step 3: Query session with flashcards
  try {
    const { data: session, error } = await locals.supabase
      .from('sessions')
      .select(
        `
        id,
        name,
        created_at,
        updated_at,
        flash_cards (
          id,
          front,
          back,
          created_at
        )
      `
      )
      .eq('id', sessionId)
      .eq('user_id', locals.user.id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // Not found or access denied
        return new Response(
          JSON.stringify({
            error: {
              message: 'Session not found',
              code: ErrorCodes.SESSION_NOT_FOUND,
            },
          }),
          {
            status: 404,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }

      console.error('[Session Get] Database error:', error);
      return new Response(
        JSON.stringify({
          error: {
            message: 'Failed to fetch session',
            code: ErrorCodes.INTERNAL_ERROR,
          },
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Step 4: Return session with flashcards
    const response: SessionDetailResponse = {
      session: {
        id: session.id,
        name: session.name,
        created_at: session.created_at,
        updated_at: session.updated_at,
        flashcards: (session.flash_cards || []).map((card: any) => ({
          id: card.id,
          front: card.front,
          back: card.back,
          created_at: card.created_at,
        })),
      },
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[Session Get] Unexpected error:', error);
    return new Response(
      JSON.stringify({
        error: {
          message: 'Failed to fetch session',
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
// PUT Handler - Update session name
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

  // Step 2: Get session ID from params
  const sessionId = params.id;
  if (!sessionId) {
    return new Response(
      JSON.stringify({
        error: {
          message: 'Session ID is required',
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
  let body: UpdateSessionRequest;
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

  // Step 4: Validate with Zod
  const validationResult = updateSessionSchema.safeParse(body);
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

  const { name } = validationResult.data;

  // Step 5: Update session in database
  try {
    const { data: session, error } = await locals.supabase
      .from('sessions')
      .update({ name })
      .eq('id', sessionId)
      .eq('user_id', locals.user.id)
      .select('id, name, created_at, updated_at')
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // Not found or access denied
        return new Response(
          JSON.stringify({
            error: {
              message: 'Session not found',
              code: ErrorCodes.SESSION_NOT_FOUND,
            },
          }),
          {
            status: 404,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }

      console.error('[Session Update] Database error:', error);
      return new Response(
        JSON.stringify({
          error: {
            message: 'Failed to update session',
            code: ErrorCodes.INTERNAL_ERROR,
          },
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('[Session Update] Session updated:', sessionId, 'for user:', locals.user.email);

    // Step 6: Return updated session
    const response: UpdateSessionResponse = {
      session: {
        id: session.id,
        name: session.name,
        created_at: session.created_at,
        updated_at: session.updated_at,
      },
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[Session Update] Unexpected error:', error);
    return new Response(
      JSON.stringify({
        error: {
          message: 'Failed to update session',
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
// DELETE Handler - Delete session (cascades to flashcards)
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

  // Step 2: Get session ID from params
  const sessionId = params.id;
  if (!sessionId) {
    return new Response(
      JSON.stringify({
        error: {
          message: 'Session ID is required',
          code: ErrorCodes.VALIDATION_FAILED,
        },
      }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  // Step 3: Delete session from database (cascades to flashcards)
  try {
    const { error } = await locals.supabase
      .from('sessions')
      .delete()
      .eq('id', sessionId)
      .eq('user_id', locals.user.id);

    if (error) {
      console.error('[Session Delete] Database error:', error);
      return new Response(
        JSON.stringify({
          error: {
            message: 'Failed to delete session',
            code: ErrorCodes.INTERNAL_ERROR,
          },
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('[Session Delete] Session deleted:', sessionId, 'for user:', locals.user.email);

    // Step 4: Return success response
    const response: DeleteSessionResponse = {
      success: true,
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[Session Delete] Unexpected error:', error);
    return new Response(
      JSON.stringify({
        error: {
          message: 'Failed to delete session',
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
