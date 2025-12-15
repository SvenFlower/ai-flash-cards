/**
 * POST /api/auth/register
 *
 * Register a new user account with email and password.
 *
 * @see .ai/api-plan.md
 */

import type { APIRoute } from 'astro';
import { z } from 'zod';
import type { RegisterRequest, RegisterResponse } from '@/lib/api-types';
import { ErrorCodes } from '@/lib/api-types';

export const prerender = false;

// ============================================================================
// Validation Schema
// ============================================================================

const registerSchema = z.object({
  email: z.string().email('Invalid email format').max(255),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(72, 'Password must not exceed 72 characters'),
});

// ============================================================================
// Handler
// ============================================================================

export const POST: APIRoute = async ({ request, locals }) => {
  // Step 1: Parse request body
  let body: RegisterRequest;
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

  // Step 2: Validate with Zod
  const validationResult = registerSchema.safeParse(body);
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

  // Step 3: Register user with Supabase
  try {
    const { data, error } = await locals.supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      // Check for specific errors
      if (error.message.includes('already registered') || error.message.includes('already exists')) {
        return new Response(
          JSON.stringify({
            error: {
              message: 'Email already registered',
              code: ErrorCodes.AUTH_EMAIL_EXISTS,
            },
          }),
          {
            status: 409,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }

      console.error('[Auth Register] Supabase error:', error);
      return new Response(
        JSON.stringify({
          error: {
            message: error.message || 'Registration failed',
            code: ErrorCodes.AUTH_INVALID,
          },
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    if (!data.user) {
      return new Response(
        JSON.stringify({
          error: {
            message: 'Registration failed - no user returned',
            code: ErrorCodes.INTERNAL_ERROR,
          },
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('[Auth Register] User registered successfully:', data.user.email);

    // Step 4: Return success response
    const response: RegisterResponse = {
      user: {
        id: data.user.id,
        email: data.user.email!,
      },
    };

    return new Response(JSON.stringify(response), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[Auth Register] Unexpected error:', error);

    return new Response(
      JSON.stringify({
        error: {
          message: 'Registration failed - please try again later',
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
