/// <reference types="astro/client" />

import type { SupabaseClient, Session, User } from '@supabase/supabase-js';
import type { Database } from './db/database.types';

type Runtime = import("@astrojs/cloudflare").Runtime<Env>;

declare namespace App {
  interface Locals extends Runtime {
    supabase: SupabaseClient<Database>;
    session: Session | null;
    user: User | null;
  }
}

interface ImportMetaEnv {
  readonly PUBLIC_SUPABASE_URL: string;
  readonly PUBLIC_SUPABASE_ANON_KEY: string;
  readonly OPENROUTER_API_KEY: string;
  readonly PUBLIC_OPENROUTER_API_KEY: string;
  readonly E2E_USER: string;
  readonly E2E_USER_2: string;
  readonly E2E_PASS: string;
  readonly E2E_PASS_2: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
