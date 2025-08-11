import { createSupabaseClient } from '../../../packages/shared/supabaseClient';

export default async (req: Request) => {
  if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405 });
  const url = new URL(req.url);
  const parts = url.pathname.split('/');
  const userId = parts[3] || '';
  try {
    const body = await req.json();
    const { coupon_id } = body || {};
    if (!userId || typeof coupon_id !== 'string') {
      return new Response(JSON.stringify({ ok: false, error: 'Invalid payload' }), { status: 400 });
    }
    const supabase = createSupabaseClient(true);
    // Generate a simple unique code
    const unique_code = `UC-${coupon_id}-${Date.now()}`;
    const { error } = await supabase
      .from('user_coupons')
      .insert({ coupon_id, user_id: userId, unique_code, current_owner_id: userId });
    if (error) return new Response(JSON.stringify({ ok: false, error: error.message }), { status: 500 });
    return new Response(JSON.stringify({ ok: true, userId, coupon_id, unique_code }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ ok: false, error: e?.message || 'Bad Request' }), { status: 400 });
  }
};

export const config = {
  path: '/api/users/:userId/coupons/collect',
};
