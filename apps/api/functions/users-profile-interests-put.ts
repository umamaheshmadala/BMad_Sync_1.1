import { createSupabaseClient } from '../../../packages/shared/supabaseClient';
import { getUserIdFromRequest, getUserIdFromRequestAsync, isPlatformOwner, isPlatformOwnerAsync } from '../../../packages/shared/auth';
import { withRequestLogging } from '../../../packages/shared/logging';
import { withErrorHandling } from '../../../packages/shared/errors';
import { withRateLimit } from '../../../packages/shared/ratelimit';
import { json } from '../../../packages/shared/http';
import { UserProfileInterestsPayloadSchema } from '../../../packages/shared/validation';

export default withRequestLogging('users-profile-interests-put', withRateLimit('users-profile-interests-put', { limit: 60, windowMs: 60_000 }, withErrorHandling(async (req: Request) => {
  if (req.method !== 'PUT') return new Response('Method Not Allowed', { status: 405 });
  const url = new URL(req.url);
  const parts = url.pathname.split('/');
  const userId = parts[3] || '';
  try {
    const callerId = await getUserIdFromRequestAsync(req);
    if (!callerId) return json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    if (callerId !== userId && !(await isPlatformOwnerAsync(req))) {
      return json({ ok: false, error: 'Forbidden' }, { status: 403 });
    }
    const body = await req.json();
    const parsed = UserProfileInterestsPayloadSchema.safeParse(body);
    if (!parsed.success || !userId) {
      return json({ ok: false, error: 'Invalid payload', details: parsed.error?.flatten?.() }, { status: 400 });
    }
    const { city, interests } = parsed.data as any;
    const supabase = createSupabaseClient(true);
    const { error } = await supabase
      .from('users')
      .update({ city, interests })
      .eq('id', userId);
    if (error) {
      return json({ ok: false, error: error.message }, { status: 500 });
    }
    return json({ ok: true, userId, city, interests });
  } catch (e: any) {
    return json({ ok: false, error: e?.message || 'Bad Request' }, { status: 400 });
  }
})));

export const config = {
  path: '/api/users/:userId/profile/interests',
};
