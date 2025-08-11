import { createSupabaseClient } from '../../../packages/shared/supabaseClient';
import { getUserIdFromRequest } from '../../../packages/shared/auth';

export default async (req: Request) => {
  if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405 });
  const url = new URL(req.url);
  const parts = url.pathname.split('/');
  const businessId = parts[3] || '';
  if (!businessId) return new Response(JSON.stringify({ ok: false, error: 'Missing businessId' }), { status: 400 });

  const callerId = getUserIdFromRequest(req);
  if (!callerId) return new Response(JSON.stringify({ ok: false, error: 'Unauthorized' }), { status: 401 });

  try {
    const body = await req.json();
    const { recommend_status, review_text, checked_in_at } = body || {};
    if (typeof recommend_status !== 'boolean') {
      return new Response(JSON.stringify({ ok: false, error: 'Invalid payload' }), { status: 400 });
    }

    const supabase = createSupabaseClient(true) as any;
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
    if (error) return new Response(JSON.stringify({ ok: false, error: error.message }), { status: 500 });

    return new Response(JSON.stringify({ ok: true }), { headers: { 'Content-Type': 'application/json' } });
  } catch (e: any) {
    return new Response(JSON.stringify({ ok: false, error: e?.message || 'Bad Request' }), { status: 400 });
  }
};

export const config = {
  path: '/api/business/:businessId/reviews',
};


