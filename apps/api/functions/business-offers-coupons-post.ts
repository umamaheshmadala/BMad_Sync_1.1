import { createSupabaseClient } from '../../../packages/shared/supabaseClient';
import { getUserIdFromRequest, isPlatformOwner } from '../../../packages/shared/auth';
import { withRequestLogging } from '../../../packages/shared/logging';

export default withRequestLogging('business-offers-coupons-post', async (req: Request) => {
  if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405 });

  try {
    const callerUserId = getUserIdFromRequest(req);
    if (!callerUserId) return new Response(JSON.stringify({ ok: false, error: 'Unauthorized' }), { status: 401 });
    const supabase = createSupabaseClient(true) as any;

    // Extract offerId
    const url = new URL(req.url);
    const parts = url.pathname.split('/');
    const offerId = parts[4] || '';
    if (!offerId) return new Response(JSON.stringify({ ok: false, error: 'Missing offerId' }), { status: 400 });

    // Lookup coupon (offer) and business
    const { data: offer } = await supabase.from('coupons').select('id, business_id, total_quantity').eq('id', offerId).maybeSingle();
    if (!offer) return new Response(JSON.stringify({ ok: false, error: 'Offer not found' }), { status: 404 });

    // Verify ownership
    const { data: biz } = await supabase
      .from('businesses')
      .select('id, owner_user_id')
      .eq('id', offer.business_id)
      .maybeSingle();
    const isOwner = biz && biz.owner_user_id === callerUserId;
    if (!isOwner && !isPlatformOwner(req)) return new Response(JSON.stringify({ ok: false, error: 'Forbidden' }), { status: 403 });

    const body = await req.json().catch(() => ({}));
    const total = Number.isFinite(Number(body?.total_quantity)) ? Number(body.total_quantity) : Number(offer.total_quantity || 0);
    const terms = typeof body?.terms_and_conditions === 'string' ? body.terms_and_conditions.trim() : undefined;

    // Create N user_coupon placeholders without owner (to be collected later)
    const rows: any[] = [];
    for (let i = 0; i < Math.max(0, total); i += 1) {
      rows.push({ coupon_id: offer.id, unique_code: `${offer.id}-${i + 1}` });
    }
    if (rows.length) {
      const { error: insErr } = await supabase.from('user_coupons').insert(rows);
      if (insErr) return new Response(JSON.stringify({ ok: false, error: insErr.message }), { status: 500 });
    }

    // Optionally update T&Cs on base coupon
    if (typeof terms === 'string') {
      await supabase.from('coupons').update({ terms_and_conditions: terms }).eq('id', offer.id);
    }

    return new Response(JSON.stringify({ ok: true, generated: rows.length }), { headers: { 'Content-Type': 'application/json' } });
  } catch (e: any) {
    return new Response(JSON.stringify({ ok: false, error: e?.message || 'Bad Request' }), { status: 400 });
  }
});

export const config = {
  path: '/api/business/offers/:offerId/coupons',
};


