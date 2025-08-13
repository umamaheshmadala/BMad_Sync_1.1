import { createSupabaseClient } from '../../../packages/shared/supabaseClient';
import { getUserIdFromRequest, isPlatformOwner } from '../../../packages/shared/auth';
import { withRequestLogging } from '../../../packages/shared/logging';
import { withRateLimit } from '../../../packages/shared/ratelimit';
import { withErrorHandling } from '../../../packages/shared/errors';
import { json } from '../../../packages/shared/http';

export default withRequestLogging('business-offers-get', withRateLimit('business-offers-get', { limit: 60, windowMs: 60_000 }, withErrorHandling(async (req: Request) => {
  if (req.method !== 'GET') return new Response('Method Not Allowed', { status: 405 });

  const callerUserId = getUserIdFromRequest(req);
  if (!callerUserId) return json({ ok: false, error: 'Unauthorized' }, { status: 401 });

  const supabase = createSupabaseClient(true) as any;

  // Determine business context: owner user's business ids
  const { data: myBusinesses, error: bizErr } = await supabase
    .from('businesses')
    .select('id, owner_user_id')
    .eq('owner_user_id', callerUserId);
  if (bizErr) return json({ ok: false, error: bizErr.message }, { status: 500 });

  const bizIds = Array.isArray(myBusinesses) ? myBusinesses.map((b: any) => b.id) : [];
  // Platform owner may pass x-business-id to inspect a specific business
  let targetBizIds = bizIds;
  const headerBiz = req.headers.get('x-business-id') || '';
  if (headerBiz && isPlatformOwner(req)) targetBizIds = [headerBiz];
  if (!targetBizIds.length) return json({ ok: true, items: [] });

  const { data: offers, error } = await supabase
    .from('coupons')
    .select('id, business_id, title, total_quantity, cost_per_coupon, start_date, end_date')
    .in('business_id', targetBizIds)
    .order('start_date', { ascending: false } as any);
  if (error) return json({ ok: false, error: error.message }, { status: 500 });

  return json({ ok: true, items: offers || [] });
})));

export const config = {
  path: '/api/business/offers',
};


