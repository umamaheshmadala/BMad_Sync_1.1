import { createSupabaseClient } from '../../../packages/shared/supabaseClient';
import { withRequestLogging } from '../../../packages/shared/logging';
import { getUserIdFromRequest, isPlatformOwner } from '../../../packages/shared/auth';
import { withRateLimit } from '../../../packages/shared/ratelimit';
import { json } from '../../../packages/shared/http';
import { withErrorHandling } from '../../../packages/shared/errors';

export default withRequestLogging('users-notifications-read-all', withRateLimit('users-notifications-read-all', { limit: 60, windowMs: 60_000 }, withErrorHandling(async (req: Request) => {
  if (req.method !== 'PUT') return new Response('Method Not Allowed', { status: 405 });
  const url = new URL(req.url);
  const parts = url.pathname.split('/');
  const userId = parts[3] || '';
  if (!userId) return json({ ok: false, error: 'Missing userId' }, { status: 400 });

  const callerId = getUserIdFromRequest(req);
  if (!callerId) return json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  if (callerId !== userId && !isPlatformOwner(req)) {
    return json({ ok: false, error: 'Forbidden' }, { status: 403 });
  }

  const supabase = createSupabaseClient(true) as any;
  const now = new Date().toISOString();
  const { error } = await supabase
    .from('notifications')
    .update({ read_at: now })
    .eq('recipient_user_id', userId)
    .is('read_at', null);
  if (error) return json({ ok: false, error: error.message }, { status: 500 });

  return json({ ok: true });
})));

export const config = {
  path: '/api/users/:userId/notifications/read',
};


