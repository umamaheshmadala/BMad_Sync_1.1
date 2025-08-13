import { createSupabaseClient } from '../../../packages/shared/supabaseClient';
import { isPlatformOwner, isPlatformOwnerAsync } from '../../../packages/shared/auth';
import { withErrorHandling } from '../../../packages/shared/errors';
import { withRateLimit } from '../../../packages/shared/ratelimit';
import { json } from '../../../packages/shared/http';
import { isFeatureEnabled } from '../../../packages/shared/env';

export default withRateLimit('platform-ratelimit-get', { limit: 60, windowMs: 60_000 }, withErrorHandling(async (req: Request) => {
  if (req.method !== 'GET') return new Response('Method Not Allowed', { status: 405 });
  const allow = (await isPlatformOwnerAsync(req)) || isPlatformOwner(req);
  if (!allow) return json({ ok: false, error: 'Forbidden' }, { status: 403 });

  const shared = isFeatureEnabled('FEATURE_SHARED_RATELIMIT');
  if (!shared) {
    return json({ ok: true, mode: 'memory', message: 'Shared Postgres-backed limiter disabled. Memory counters are per-instance and not centrally observable.', top_counters: [] });
  }

  const supabase = createSupabaseClient(true) as any;
  const { data, error } = await supabase
    .from('rate_limits')
    .select('key, window_start, count')
    .order('count', { ascending: false } as any)
    .limit(50);
  if (error) return json({ ok: false, error: error.message }, { status: 500 });
  return json({ ok: true, mode: 'shared', top_counters: data || [] });
}));

export const config = {
  path: '/api/platform/ratelimit',
};


