import { createSupabaseClient } from '../../../packages/shared/supabaseClient';
import { getUserIdFromRequest, getUserIdFromRequestAsync, isPlatformOwner, isPlatformOwnerAsync } from '../../../packages/shared/auth';
import { withRequestLogging } from '../../../packages/shared/logging';

export default withRequestLogging('users-wishlist-matches-get', async (req: Request) => {
  if (req.method !== 'GET') return new Response('Method Not Allowed', { status: 405 });
  const url = new URL(req.url);
  const parts = url.pathname.split('/');
  const userId = parts[3] || '';
  if (!userId) return new Response(JSON.stringify({ ok: false, error: 'Missing userId' }), { status: 400 });

  const callerId = await getUserIdFromRequestAsync(req);
  if (!callerId) return new Response(JSON.stringify({ ok: false, error: 'Unauthorized' }), { status: 401 });
  if (callerId !== userId && !(await isPlatformOwnerAsync(req))) {
    return new Response(JSON.stringify({ ok: false, error: 'Forbidden' }), { status: 403 });
  }

  const supabase = createSupabaseClient(true) as any;

  // Compute matches: category or subcategory overlaps
  const { data: wishlist } = await supabase.from('wishlist_items').select('*').eq('user_id', userId);
  const { data: products } = await supabase.from('storefront_products').select('*');

  const matches: Array<any> = [];
  for (const w of (wishlist as any[]) || []) {
    for (const p of (products as any[]) || []) {
      const wCats = [w.category, w.subcategory_l1, w.subcategory_l2].filter(Boolean).map((x: any) => String(x).toLowerCase());
      const pCats = [p.category, p.subcategory_l1, p.subcategory_l2].filter(Boolean).map((x: any) => String(x).toLowerCase());
      if (wCats.length === 0 || pCats.length === 0) continue;
      const overlap = wCats.some((c: string) => pCats.includes(c));
      if (overlap) {
        matches.push({ wishlist_item_id: w.id, storefront_product_id: p.id, category: w.category, subcategory_l1: w.subcategory_l1, subcategory_l2: w.subcategory_l2 });
      }
    }
  }

  // Persist a notification for the user when matches exist
  if (matches.length > 0) {
    await (supabase as any)
      .from('notifications')
      .insert({
        recipient_user_id: userId,
        notification_type: 'wishlist_match',
        message: `Found ${matches.length} wishlist matches`,
        deep_link_url: null,
      });
  }

  return new Response(
    JSON.stringify({ ok: true, count: matches.length, matches }),
    { headers: { 'Content-Type': 'application/json' } }
  );
});

export const config = {
  path: '/api/users/:userId/wishlist/matches',
};


