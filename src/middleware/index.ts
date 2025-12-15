import { defineMiddleware } from 'astro:middleware';
import { createServerClient } from '@supabase/ssr';
import type { Database } from '../db/database.types';

export const onRequest = defineMiddleware(async (context, next) => {
  // Skip authentication for prerendered pages (blog, about, RSS)
  // These pages don't need auth and are static
  const prerenderPaths = ['/blog', '/about', '/rss.xml'];
  const shouldSkipAuth = prerenderPaths.some(path => context.url.pathname.startsWith(path));

  if (shouldSkipAuth) {
    // Set null auth for prerendered pages
    context.locals.supabase = null as any;
    context.locals.session = null;
    context.locals.user = null;
    return next();
  }

  // Create server-side Supabase client that can read/write cookies
  const supabase = createServerClient<Database>(
    import.meta.env.PUBLIC_SUPABASE_URL,
    import.meta.env.PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        get(key) {
          return context.cookies.get(key)?.value;
        },
        set(key, value, options) {
          context.cookies.set(key, value, options);
        },
        remove(key, options) {
          context.cookies.delete(key, options);
        },
      },
    }
  );

  // Add Supabase client to context
  context.locals.supabase = supabase;

  // Get auth session and user from cookies
  const {
    data: { session },
  } = await supabase.auth.getSession();

  context.locals.session = session;
  context.locals.user = session?.user ?? null;

  return next();
});
