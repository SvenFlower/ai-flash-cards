/**
 * POST /api/auth/logout
 *
 * End user session and clear cookies.
 *
 * @see .ai/api-plan.md
 */

import type { APIRoute } from 'astro';
import type { LogoutResponse } from '@/lib/api-types';
import { ErrorCodes } from '@/lib/api-types';

export const prerender = false;

// ============================================================================
// Handler
// ============================================================================

export const POST: APIRoute = async ({ locals }) => {
  // Step 1: Check if user is authenticated
  if (!locals.user) {
    return new Response(
      JSON.stringify({
        error: {
          message: 'Not authenticated',
          code: ErrorCodes.AUTH_REQUIRED,
        },
      }),
      {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  // Step 2: Sign out with Supabase
  try {
    const { error } = await locals.supabase.auth.signOut();

    if (error) {
      console.error('[Auth Logout] Supabase error:', error);

      return new Response(
        JSON.stringify({
          error: {
            message: 'Logout failed',
            code: ErrorCodes.INTERNAL_ERROR,
          },
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }


    // Step 3: Cookies are automatically cleared by Supabase SSR

    // Step 4: Return success response
    const response: LogoutResponse = { success: true };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[Auth Logout] Unexpected error:', error);

    return new Response(
      JSON.stringify({
        error: {
          message: 'Logout failed - please try again',
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
