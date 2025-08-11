// Auth helpers — parse Supabase JWT from Authorization header (Bearer)

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
