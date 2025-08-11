export default async () => {
  const summary = {
    coupon_revenue: 0,
    banner_revenue: 0,
    search_revenue: 0,
    push_revenue: 0,
  };
  return new Response(JSON.stringify(summary), { headers: { 'Content-Type': 'application/json' } });
};

export const config = {
  path: '/api/platform/revenue',
};
