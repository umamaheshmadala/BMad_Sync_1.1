// Supabase client factory
// Reads env from Netlify (Netlify.env) if available, otherwise process.env

import type { SupabaseClient as SupabaseJsClient } from '@supabase/supabase-js';
import { createClient } from '@supabase/supabase-js';

function readEnv(name: string): string | undefined {
  try {
    // @ts-ignore - Netlify global may exist at runtime
    if (typeof Netlify !== 'undefined' && Netlify?.env?.get) {
      // @ts-ignore
      const v = Netlify.env.get(name);
      if (v) return v as string;
    }
  } catch {}
  // Fallback
  // @ts-ignore
  return (globalThis as any)?.process?.env?.[name] as string | undefined;
}

export function createSupabaseClient(useServiceRole = false): SupabaseJsClient {
  const url = readEnv('SUPABASE_URL');
  const anon = readEnv('SUPABASE_ANON_KEY');
  const service = readEnv('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || (!anon && !service)) {
    throw new Error('Supabase env vars not set (SUPABASE_URL and key).');
  }
  const key = useServiceRole && service ? service : (anon as string);
  return createClient(url, key, {
    auth: { persistSession: false },
  });
}
