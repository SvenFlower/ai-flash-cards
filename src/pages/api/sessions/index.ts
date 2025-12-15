/**
 * GET /api/sessions - List all user sessions
 * POST /api/sessions - Create new session
 *
 * @see .ai/api-plan.md
 */

import type { APIRoute } from 'astro';
import { z } from 'zod';
import type { SessionsListResponse, CreateSessionRequest, CreateSessionResponse } from '@/lib/api-types';
import { ErrorCodes } from '@/lib/api-types';

export const prerender = false;

// ============================================================================
// Validation Schema
// ============================================================================

const createSessionSchema = z.object({
  name: z.string().min(1, 'Session name is required').max(255, 'Session name must not exceed 255 characters'),
});

// ============================================================================
// GET Handler - List all sessions for current user
// ============================================================================

export const GET: APIRoute = async ({ locals }) => {
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

  // Step 2: Query sessions from database
  try {
    const { data: sessions, error } = await locals.supabase
      .from('sessions')
      .select('id, name, created_at, updated_at')
      .eq('user_id', locals.user.id)
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('[Sessions List] Database error:', error);
      return new Response(
        JSON.stringify({
          error: {
            message: 'Failed to fetch sessions',
            code: ErrorCodes.INTERNAL_ERROR,
          },
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Step 3: Return sessions list
    const response: SessionsListResponse = {
      sessions: sessions || [],
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[Sessions List] Unexpected error:', error);
    return new Response(
      JSON.stringify({
        error: {
          message: 'Failed to fetch sessions',
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
// POST Handler - Create new session
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
  let body: CreateSessionRequest;
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
  const validationResult = createSessionSchema.safeParse(body);
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

  // Step 4: Insert session into database
  try {
    const { data: session, error } = await locals.supabase
      .from('sessions')
      .insert({
        user_id: locals.user.id,
        name,
      })
      .select('id, name, created_at, updated_at')
      .single();

    if (error) {
      console.error('[Sessions Create] Database error:', error);
      return new Response(
        JSON.stringify({
          error: {
            message: 'Failed to create session',
            code: ErrorCodes.INTERNAL_ERROR,
          },
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    if (!session) {
      return new Response(
        JSON.stringify({
          error: {
            message: 'Failed to create session - no data returned',
            code: ErrorCodes.INTERNAL_ERROR,
          },
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('[Sessions Create] Session created:', session.id, 'for user:', locals.user.email);

    // Step 5: Return success response
    const response: CreateSessionResponse = {
      session: {
        id: session.id,
        name: session.name,
        created_at: session.created_at,
        updated_at: session.updated_at,
      },
    };

    return new Response(JSON.stringify(response), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[Sessions Create] Unexpected error:', error);
    return new Response(
      JSON.stringify({
        error: {
          message: 'Failed to create session',
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
