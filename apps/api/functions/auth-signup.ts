import { createSupabaseClient } from '../../../packages/shared/supabaseClient';
import { isFeatureEnabled } from '../../../packages/shared/env';
import { withRateLimit } from '../../../packages/shared/ratelimit';
import { json } from '../../../packages/shared/http';

function makeUnsignedBearer(userId: string, role?: string): string {
  const header = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(JSON.stringify(role ? { sub: userId, role } : { sub: userId })).toString('base64url');
  return `Bearer ${header}.${payload}.`;
}

export default withRateLimit('auth-signup', { limit: 15, windowMs: 60_000 }, async (req: Request) => {
  if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405 });
  if (!isFeatureEnabled('FEATURE_DEV_AUTH')) return new Response('Not Found', { status: 404 });
  try {
    const body = await req.json();
    const email = (body?.email || '').trim();
    const desiredId = (body?.user_id || '').trim();
    const role = (body?.role || '').trim() || undefined;
    if (!email) return json({ ok: false, error: 'email required' }, { status: 400 });

    const supabase = createSupabaseClient(true) as any;
    let userId = desiredId;
    if (desiredId) {
      await supabase.from('users').upsert({ id: desiredId, email }, { onConflict: 'id' } as any);
    } else {
      const { data, error } = await supabase
        .from('users')
        .insert({ email })
        .select('id')
        .single();
      if (error) return json({ ok: false, error: error.message }, { status: 500 });
      userId = data?.id as string;
    }

    return json({ ok: true, user_id: userId, bearer: makeUnsignedBearer(userId, role) });
  } catch (e: any) {
    return json({ ok: false, error: e?.message || 'Bad Request' }, { status: 400 });
  }
});

export const config = {
  path: '/api/auth/signup',
};


