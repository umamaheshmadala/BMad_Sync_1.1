import { createSupabaseClient } from '../../../packages/shared/supabaseClient';

export default async () => {
  const supabase = createSupabaseClient(true) as any;
  // Fetch coupons and user_coupons; compute revenue as cost_per_coupon * redeemed_count
  const [{ data: coupons, error: coupErr }, { data: userCoupons, error: ucErr }] = await Promise.all([
    supabase.from('coupons').select('id, cost_per_coupon'),
    supabase.from('user_coupons').select('coupon_id, is_redeemed'),
  ]);

  if (coupErr || ucErr) {
    const summary = { coupon_revenue: 0, banner_revenue: 0, search_revenue: 0, push_revenue: 0 };
    return new Response(JSON.stringify(summary), { headers: { 'Content-Type': 'application/json' } });
  }

  const costByCoupon: Record<string, number> = Object.create(null);
  for (const c of (coupons as any[]) || []) {
    const cost = typeof c.cost_per_coupon === 'number' ? c.cost_per_coupon : Number(c.cost_per_coupon) || 0;
    costByCoupon[c.id as string] = cost;
  }
  let couponRevenue = 0;
  for (const uc of (userCoupons as any[]) || []) {
    if (!uc.is_redeemed) continue;
    const cost = costByCoupon[uc.coupon_id as string] || 0;
    couponRevenue += cost;
  }

  const summary = {
    coupon_revenue: couponRevenue,
    banner_revenue: 0,
    search_revenue: 0,
    push_revenue: 0,
  };
  return new Response(JSON.stringify(summary), { headers: { 'Content-Type': 'application/json' } });
};

export const config = {
  path: '/api/platform/revenue',
};
