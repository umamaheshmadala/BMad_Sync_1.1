import { withRequestLogging } from '../../../packages/shared/logging';
import { getUserIdFromRequest, isPlatformOwner } from '../../../packages/shared/auth';
import { createSupabaseClient } from '../../../packages/shared/supabaseClient';
import { withErrorHandling } from '../../../packages/shared/errors';
import { withRateLimit } from '../../../packages/shared/ratelimit';
import { json } from '../../../packages/shared/http';
import { GpsCheckinPayloadSchema } from '../../../packages/shared/validation';

export default withRequestLogging('users-checkin-gps-post', withRateLimit('users-checkin-gps-post', { limit: 60, windowMs: 60_000 }, withErrorHandling(async (req: Request) => {
  if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405 });
  const url = new URL(req.url);
  const parts = url.pathname.split('/');
  const userId = parts[3] || '';
  if (!userId) return json({ ok: false, error: 'Missing userId' }, { status: 400 });

  const callerId = getUserIdFromRequest(req);
  if (!callerId) return json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  if (callerId !== userId && !isPlatformOwner(req)) {
    return json({ ok: false, error: 'Forbidden' }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const parsed = GpsCheckinPayloadSchema.safeParse(body);
  if (!parsed.success) {
    return json({ ok: false, error: 'Invalid payload', details: parsed.error.flatten() }, { status: 400 });
  }
  const { business_id: businessId, lat, lng } = parsed.data as any;

  const supabase = createSupabaseClient(true) as any;
  const { error } = await supabase
    .from('user_activities')
    .insert({
      user_id: userId,
      business_id: businessId,
      activity_type: 'gps_checkin',
      activity_data: { lat, lng },
    })
    .single();
  if (error) return json({ ok: false, error: error.message }, { status: 500 });
  return json({ ok: true });
})));

export const config = {
  path: '/api/users/:userId/checkin/gps',
};


