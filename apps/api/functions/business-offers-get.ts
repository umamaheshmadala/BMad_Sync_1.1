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
  const url = new URL(req.url);
  const q = (url.searchParams.get('q') || '').trim();
  const limitParam = url.searchParams.get('limit');
  const offsetParam = url.searchParams.get('offset');
  const orderParam = (url.searchParams.get('order') || '').trim(); // e.g., title.asc or start_date.desc
  const limit = (() => { const n = Number(limitParam); return Number.isFinite(n) && n > 0 && n <= 200 ? n : 10; })();
  const offset = (() => { const n = Number(offsetParam); return Number.isFinite(n) && n >= 0 ? n : 0; })();
  const allowedOrderCols = new Set(['title', 'start_date']);
  let orderCol = 'start_date';
  let orderAsc = false;
  if (orderParam) {
    const [col, dir] = orderParam.split('.') as [string, string];
    if (allowedOrderCols.has(col)) {
      orderCol = col;
      orderAsc = (dir || '').toLowerCase() === 'asc';
    }
  }

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

  let query = supabase
    .from('coupons')
    .select('id, business_id, title, total_quantity, cost_per_coupon, start_date, end_date', { count: 'exact' } as any)
    .in('business_id', targetBizIds) as any;
  if (q) {
    // Optional search by title (case-insensitive, contains)
    query = query.ilike('title', `%${q}%`);
  }
  const { data: offers, error, count } = await query
    .order(orderCol, { ascending: orderAsc } as any)
    .range(offset, Math.max(offset, offset + limit - 1));
  if (error) return json({ ok: false, error: error.message }, { status: 500 });

  return json({ ok: true, items: offers || [], total: count ?? (offers?.length || 0), limit, offset, order: `${orderCol}.${orderAsc ? 'asc' : 'desc'}` });
})));

export const config = {
  path: '/api/business/offers',
};


