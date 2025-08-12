// Auth helpers — parse Supabase JWT from Authorization header (Bearer)
import { createSupabaseClient } from './supabaseClient';

function decodeBase64Url(input: string): string {
  // Replace URL-safe chars and pad
  input = input.replace(/-/g, '+').replace(/_/g, '/');
  const pad = input.length % 4;
  if (pad) input = input + '='.repeat(4 - pad);
  if (typeof atob !== 'undefined') return atob(input);
  // Node fallback
  // @ts-ignore
  return Buffer.from(input, 'base64').toString('binary');
}

function parseJwtPayload(token: string): any | null {
  const parts = token.split('.');
  if (parts.length < 2) return null;
  try {
    const json = decodeBase64Url(parts[1]);
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export function getUserIdFromRequest(req: Request): string | null {
  const auth = req.headers.get('authorization') || req.headers.get('Authorization');
  if (!auth || !auth.toLowerCase().startsWith('bearer ')) return null;
  const token = auth.slice(7).trim();
  const payload = parseJwtPayload(token);
  const sub = payload?.sub || payload?.user_id || null;
  return typeof sub === 'string' ? sub : null;
}

export function isPlatformOwner(req: Request): boolean {
  const auth = req.headers.get('authorization') || req.headers.get('Authorization');
  if (!auth || !auth.toLowerCase().startsWith('bearer ')) return false;
  const token = auth.slice(7).trim();
  const payload = parseJwtPayload(token);
  const role = payload?.role || payload?.app_metadata?.claims_role || null;
  return role === 'owner';
}

// Feature-flagged Supabase Auth verification (non-breaking). When enabled via FEATURE_SUPABASE_AUTH=true,
// we will attempt to verify the bearer using Supabase's auth.getUser(). Falls back to unsigned token parsing.
export async function getUserIdFromRequestAsync(req: Request): Promise<string | null> {
  const authHeader = req.headers.get('authorization') || req.headers.get('Authorization');
  if (!authHeader || !authHeader.toLowerCase().startsWith('bearer ')) return null;
  const token = authHeader.slice(7).trim();
  if (shouldUseSupabaseAuth()) {
    try {
      const supabase = createSupabaseClient(true) as any;
      const { data, error } = await supabase.auth.getUser(token);
      if (!error && data?.user?.id) return String(data.user.id);
    } catch {}
  }
  // Fallback to unsigned parsing
  return getUserIdFromRequest(req);
}

export async function isPlatformOwnerAsync(req: Request): Promise<boolean> {
  if (shouldUseSupabaseAuth()) {
    try {
      const authHeader = req.headers.get('authorization') || req.headers.get('Authorization');
      if (!authHeader || !authHeader.toLowerCase().startsWith('bearer ')) return false;
      const token = authHeader.slice(7).trim();
      const supabase = createSupabaseClient(true) as any;
      const { data } = await supabase.auth.getUser(token);
      // In real setups, role typically comes from app_metadata
      const role = (data?.user?.app_metadata as any)?.claims_role || (data?.user?.user_metadata as any)?.role;
      if (role === 'owner') return true;
    } catch {}
  }
  return isPlatformOwner(req);
}

function shouldUseSupabaseAuth(): boolean {
  try {
    // @ts-ignore
    const v = (globalThis as any)?.process?.env?.FEATURE_SUPABASE_AUTH;
    return String(v || '').toLowerCase() === 'true';
  } catch {
    return false;
  }
}
