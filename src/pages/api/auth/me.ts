/**
 * GET /api/auth/me
 *
 * Get current authenticated user.
 *
 * @see .ai/api-plan.md
 */

import type { APIRoute } from 'astro';
import type { MeResponse } from '@/lib/api-types';

export const prerender = false;

// ============================================================================
// Handler
// ============================================================================

export const GET: APIRoute = async ({ locals }) => {
  // Return current user from session (can be null)
  const response: MeResponse = {
    user: locals.user
      ? {
          id: locals.user.id,
          email: locals.user.email!,
        }
      : null,
  };

  return new Response(JSON.stringify(response), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
