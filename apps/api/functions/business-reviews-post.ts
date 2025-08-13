import { createSupabaseClient } from '../../../packages/shared/supabaseClient';
import { getUserIdFromRequest, getUserIdFromRequestAsync, isPlatformOwner, isPlatformOwnerAsync } from '../../../packages/shared/auth';
import { ReviewPayloadSchema } from '../../../packages/shared/validation';
import { withErrorHandling } from '../../../packages/shared/errors';
import { withRateLimit } from '../../../packages/shared/ratelimit';
import { json } from '../../../packages/shared/http';

export default withRateLimit('business-reviews', { limit: 120, windowMs: 60_000 }, withErrorHandling(async (req: Request) => {
  const url = new URL(req.url);
  const parts = url.pathname.split('/');
  const businessId = parts[3] || '';
  if (!businessId) return json({ ok: false, error: 'Missing businessId' }, { status: 400 });

  const callerId = await getUserIdFromRequestAsync(req);
  if (!callerId) return json({ ok: false, error: 'Unauthorized' }, { status: 401 });

  const supabase = createSupabaseClient(true) as any;

  if (req.method === 'GET') {
    // Only business owner or platform owner may list reviews
    const { data: biz } = await supabase
      .from('businesses')
      .select('id, owner_user_id')
      .eq('id', businessId)
      .maybeSingle();
    const isOwner = biz && biz.owner_user_id === callerId;
    if (!isOwner && !(await isPlatformOwnerAsync(req))) {
      return json({ ok: false, error: 'Forbidden' }, { status: 403 });
    }

    const limit = Math.max(1, Math.min(100, Number(url.searchParams.get('limit') || 50)));
    const offset = Math.max(0, Number(url.searchParams.get('offset') || 0));
    const recommendParam = url.searchParams.get('recommend');
    let query = supabase
      .from('business_reviews')
      .select('id, user_id, recommend_status, review_text, checked_in_at, created_at')
      .eq('business_id', businessId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    if (recommendParam === 'true' || recommendParam === 'false') {
      const recommend = recommendParam === 'true';
      query = query.eq('recommend_status', recommend);
    }
    const { data, error } = await query;
    if (error) return json({ ok: false, error: error.message }, { status: 500 });
    return json({ ok: true, items: (data as any[]) || [] });
  }

  if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405 });

  try {
    const body = await req.json();
    const parsed = ReviewPayloadSchema.safeParse(body);
    if (!parsed.success) {
      return json({ ok: false, error: 'Invalid payload', details: parsed.error.flatten() }, { status: 400 });
    }
    const { recommend_status, review_text, checked_in_at } = parsed.data as any;

    const { error } = await supabase
      .from('business_reviews')
      .insert({
        business_id: businessId,
        user_id: callerId,
        recommend_status: !!recommend_status,
        review_text: typeof review_text === 'string' ? review_text : null,
        checked_in_at: checked_in_at ?? null,
      })
      .single();
    if (error) return json({ ok: false, error: error.message }, { status: 500 });

    return json({ ok: true });
  } catch (e: any) {
    return json({ ok: false, error: e?.message || 'Bad Request' }, { status: 400 });
  }
}));

export const config = {
  path: '/api/business/:businessId/reviews',
};


