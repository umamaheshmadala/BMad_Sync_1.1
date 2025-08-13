import { createSupabaseClient } from '../../../packages/shared/supabaseClient';
import { getUserIdFromRequest, isPlatformOwner } from '../../../packages/shared/auth';
import { withRequestLogging } from '../../../packages/shared/logging';
import { withErrorHandling } from '../../../packages/shared/errors';
import { withRateLimit } from '../../../packages/shared/ratelimit';
import { json } from '../../../packages/shared/http';
import { BusinessOfferPayloadSchema } from '../../../packages/shared/validation';

export default withRequestLogging('business-offers-post', withRateLimit('business-offers-post', { limit: 60, windowMs: 60_000 }, withErrorHandling(async (req: Request) => {
  if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405 });

  try {
    const callerUserId = getUserIdFromRequest(req);
    if (!callerUserId) return json({ ok: false, error: 'Unauthorized' }, { status: 401 });

    const supabase = createSupabaseClient(true) as any;

    // Resolve business by owner user id (or allow platform owner to specify via header for admin tooling)
    let businessId = '';
    const { data: biz } = await supabase
      .from('businesses')
      .select('id, owner_user_id')
      .eq('owner_user_id', callerUserId)
      .maybeSingle();
    if (biz?.id) businessId = biz.id as string;
    if (!businessId && isPlatformOwner(req)) {
      businessId = req.headers.get('x-business-id') || '';
    }
    if (!businessId) return json({ ok: false, error: 'Missing business context' }, { status: 400 });

    const body = await req.json().catch(() => ({}));
    const parsed = BusinessOfferPayloadSchema.safeParse(body);
    if (!parsed.success) return json({ ok: false, error: 'Invalid payload', details: parsed.error.flatten() }, { status: 400 });
    const { title, description = null, terms_and_conditions = null, value = null, total_quantity = 0, cost_per_coupon = 2, start_date = null, end_date = null } = parsed.data as any;
    const terms = terms_and_conditions;
    const totalQuantity = total_quantity;
    const costPerCoupon = cost_per_coupon;
    const startDate = start_date;
    const endDate = end_date;
    
    const insertPayload: any = {
      business_id: businessId,
      title,
      description,
      terms_and_conditions: terms,
      value,
      total_quantity: totalQuantity || null,
      cost_per_coupon: costPerCoupon,
      start_date: startDate,
      end_date: endDate,
    };

    const { data: created, error } = await supabase
      .from('coupons')
      .insert(insertPayload)
      .select('id')
      .maybeSingle();
    if (error) return json({ ok: false, error: error.message }, { status: 500 });

    return json({ ok: true, offer_id: created?.id || null });
  } catch (e: any) {
    return json({ ok: false, error: e?.message || 'Bad Request' }, { status: 400 });
  }
})));

export const config = {
  path: '/api/business/offers',
};


