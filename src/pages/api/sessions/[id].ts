import type { APIRoute } from 'astro';
import { deleteSession } from '../../../lib/storage';

export const prerender = false;

export const DELETE: APIRoute = async ({ params }) => {
  const { id } = params;

  if (!id) {
    return new Response(JSON.stringify({ error: 'Session ID is required' }), {
      status: 400,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  try {
    await deleteSession(id);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Error deleting session:', error);

    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Failed to delete session',
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      },
    );
  }
};
