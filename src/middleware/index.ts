import { defineMiddleware } from 'astro:middleware';
import { supabaseClient } from '../db/supabase.client';

export const onRequest = defineMiddleware(async (context, next) => {
  // Add Supabase client to context
  context.locals.supabase = supabaseClient;

  // Get auth session and user (only if env vars are available)
  try {
    const {
      data: { session },
    } = await supabaseClient.auth.getSession();

    context.locals.session = session;
    context.locals.user = session?.user ?? null;
  } catch (error) {
    // During build or if env vars are missing, set null values
    context.locals.session = null;
    context.locals.user = null;
  }

  return next();
});
