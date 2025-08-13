import { createSupabaseClient } from '../../../packages/shared/supabaseClient';
import { getUserIdFromRequest, isPlatformOwner } from '../../../packages/shared/auth';
import { withRequestLogging } from '../../../packages/shared/logging';
import { withRateLimit } from '../../../packages/shared/ratelimit';
import { withErrorHandling } from '../../../packages/shared/errors';
import { json } from '../../../packages/shared/http';

export default withRequestLogging('business-offers-coupons-get', withRateLimit('business-offers-coupons-get', { limit: 60, windowMs: 60_000 }, withErrorHandling(async (req: Request) => {
  if (req.method !== 'GET') return new Response('Method Not Allowed', { status: 405 });

  const callerUserId = getUserIdFromRequest(req);
  if (!callerUserId) return json({ ok: false, error: 'Unauthorized' }, { status: 401 });

  const supabase = createSupabaseClient(true) as any;
  const url = new URL(req.url);
  const parts = url.pathname.split('/');
  const offerId = parts[4] || '';
  const limitParam = url.searchParams.get('limit');
  const offsetParam = url.searchParams.get('offset');
  const orderParam = (url.searchParams.get('order') || '').trim(); // e.g., unique_code.asc or is_redeemed.desc
  const q = (url.searchParams.get('q') || '').trim(); // filter by unique_code contains
  const limit = (() => { const n = Number(limitParam); return Number.isFinite(n) && n > 0 && n <= 500 ? n : 100; })();
  const offset = (() => { const n = Number(offsetParam); return Number.isFinite(n) && n >= 0 ? n : 0; })();
  const allowedOrderCols = new Set(['unique_code', 'is_redeemed']);
  let orderCol = 'unique_code';
  let orderAsc = true;
  if (orderParam) {
    const [col, dir] = orderParam.split('.') as [string, string];
    if (allowedOrderCols.has(col)) {
      orderCol = col;
      orderAsc = (dir || '').toLowerCase() === 'asc';
    }
  }
  if (!offerId) return json({ ok: false, error: 'Missing offerId' }, { status: 400 });

  // Verify ownership of the offer (coupon template)
  const { data: offer } = await supabase.from('coupons').select('id, business_id').eq('id', offerId).maybeSingle();
  if (!offer) return json({ ok: false, error: 'Offer not found' }, { status: 404 });
  const { data: biz } = await supabase.from('businesses').select('id, owner_user_id').eq('id', offer.business_id).maybeSingle();
  const isOwner = biz && biz.owner_user_id === callerUserId;
  if (!isOwner && !isPlatformOwner(req)) return json({ ok: false, error: 'Forbidden' }, { status: 403 });

  // Preview coupons (unowned rows for this offer)
  let query = supabase
    .from('user_coupons')
    .select('id, coupon_id, unique_code, user_id, is_redeemed', { count: 'exact' } as any)
    .eq('coupon_id', offerId) as any;
  if (q) query = query.ilike('unique_code', `%${q}%`);
  const { data: preview, error, count } = await query
    .order(orderCol, { ascending: orderAsc } as any)
    .range(offset, Math.max(offset, offset + limit - 1));
  if (error) return json({ ok: false, error: error.message }, { status: 500 });

  return json({ ok: true, items: preview || [], total: count ?? (preview?.length || 0), limit, offset, order: `${orderCol}.${orderAsc ? 'asc' : 'desc'}` });
})));

export const config = {
  path: '/api/business/offers/:offerId/coupons',
};


