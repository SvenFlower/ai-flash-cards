import { createBrowserClient } from '@supabase/ssr';
import type { Database } from './database.types';

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

// Create browser client with cookie storage for SSR compatibility
export const supabaseClient = createBrowserClient<Database>(supabaseUrl, supabaseAnonKey);
