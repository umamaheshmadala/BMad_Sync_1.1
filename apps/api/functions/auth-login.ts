import { createSupabaseClient } from '../../../packages/shared/supabaseClient';
import { isFeatureEnabled } from '../../../packages/shared/env';
import { withRateLimit } from '../../../packages/shared/ratelimit';
import { json } from '../../../packages/shared/http';

function makeUnsignedBearer(userId: string, role?: string): string {
  const header = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(JSON.stringify(role ? { sub: userId, role } : { sub: userId })).toString('base64url');
  return `Bearer ${header}.${payload}.`;
}

export default withRateLimit('auth-login', { limit: 30, windowMs: 60_000 }, async (req: Request) => {
  if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405 });
  if (!isFeatureEnabled('FEATURE_DEV_AUTH')) return new Response('Not Found', { status: 404 });
  try {
    const body = await req.json();
    const email = (body?.email || '').trim();
    const role = (body?.role || '').trim() || undefined;
    if (!email) return json({ ok: false, error: 'email required' }, { status: 400 });

    const supabase = createSupabaseClient(true) as any;
    const { data } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .maybeSingle();
    if (!data?.id) return json({ ok: false, error: 'not found' }, { status: 404 });

    return json({ ok: true, user_id: data.id as string, bearer: makeUnsignedBearer(data.id as string, role) });
  } catch (e: any) {
    return json({ ok: false, error: e?.message || 'Bad Request' }, { status: 400 });
  }
});

export const config = {
  path: '/api/auth/login',
};


