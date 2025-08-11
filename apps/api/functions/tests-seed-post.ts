import { createSupabaseClient } from '../../../packages/shared/supabaseClient';
import { createClient } from '@supabase/supabase-js';

export default async (req: Request) => {
  if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405 });
  // Allow overriding Supabase connection via request body for local dev
  let supabase: any;
  try {
    const maybe = await req.text();
    if (maybe) {
      try {
        const parsed = JSON.parse(maybe);
        const url = parsed?.supabase_url as string | undefined;
        const service = parsed?.service_key as string | undefined;
        if (url && service) {
          supabase = createClient(url, service, { auth: { persistSession: false } }) as any;
        }
      } catch {}
    }
    if (!supabase) {
      supabase = createSupabaseClient(true);
    }
    const user1 = '11111111-1111-1111-1111-111111111111';
    const user2 = '22222222-2222-2222-2222-222222222222';
    const biz1 = '33333333-3333-3333-3333-333333333333';
    const coupon1 = '44444444-4444-4444-4444-444444444444';

    await supabase.from('users').upsert({ id: user1, email: 'user1@test.local', city: 'Bengaluru', interests: ['Shopping'] });
    await supabase.from('users').upsert({ id: user2, email: 'user2@test.local', city: 'Bengaluru', interests: [] });
    await supabase.from('businesses').upsert({ id: biz1, owner_user_id: user1, email: 'biz@test.local', business_name: 'Test Biz' });
    await supabase.from('storefronts').upsert({ business_id: biz1, description: 'Seeded', theme: 'light', is_open: true }, { onConflict: 'business_id' } as any);
    await supabase
      .from('coupons')
      .upsert({ id: coupon1, business_id: biz1, title: '10% OFF', description: 'Seed coupon', total_quantity: 100, value: 10 });

    return new Response(
      JSON.stringify({ ok: true, users: [user1, user2], business_id: biz1, coupon_id: coupon1 }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (e: any) {
    return new Response(JSON.stringify({ ok: false, error: e?.message || 'Seed error' }), { status: 500 });
  }
};

export const config = {
  path: '/api/tests/seed',
};


