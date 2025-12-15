/**
 * POST /api/auth/login
 *
 * Authenticate user and create session.
 *
 * @see .ai/api-plan.md
 */

import type { APIRoute } from 'astro';
import { z } from 'zod';
import type { LoginRequest, LoginResponse } from '@/lib/api-types';
import { ErrorCodes } from '@/lib/api-types';

export const prerender = false;

// ============================================================================
// Validation Schema
// ============================================================================

const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

// ============================================================================
// Handler
// ============================================================================

export const POST: APIRoute = async ({ request, locals, cookies: _cookies }) => {
  // Step 1: Parse request body
  let body: LoginRequest;
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

  // Step 2: Validate with Zod
  const validationResult = loginSchema.safeParse(body);
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

  const { email, password } = validationResult.data;

  // Step 3: Authenticate with Supabase
  try {
    const { data, error } = await locals.supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error('[Auth Login] Authentication failed for:', email, error.message);

      return new Response(
        JSON.stringify({
          error: {
            message: 'Invalid email or password',
            code: ErrorCodes.AUTH_INVALID,
          },
        }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    if (!data.user || !data.session) {
      return new Response(
        JSON.stringify({
          error: {
            message: 'Login failed - no session created',
            code: ErrorCodes.INTERNAL_ERROR,
          },
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Step 4: Session cookies are automatically set by Supabase SSR
    // The middleware will handle cookie management

    // Step 5: Return success response
    const response: LoginResponse = {
      user: {
        id: data.user.id,
        email: data.user.email!,
      },
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[Auth Login] Unexpected error:', error);

    return new Response(
      JSON.stringify({
        error: {
          message: 'Login failed - please try again later',
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
