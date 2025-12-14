import { defineMiddleware } from 'astro:middleware';
import { supabaseClient } from '../db/supabase.client';

export const onRequest = defineMiddleware(async (context, next) => {
  // Add Supabase client to context
  context.locals.supabase = supabaseClient;

  // Get auth session and user
  const {
    data: { session },
  } = await supabaseClient.auth.getSession();

  context.locals.session = session;
  context.locals.user = session?.user ?? null;

  return next();
});
