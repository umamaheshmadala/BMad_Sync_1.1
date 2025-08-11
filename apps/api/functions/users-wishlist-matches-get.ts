import { createSupabaseClient } from '../../../packages/shared/supabaseClient';
import { getUserIdFromRequest, isPlatformOwner } from '../../../packages/shared/auth';

export default async (req: Request) => {
  if (req.method !== 'GET') return new Response('Method Not Allowed', { status: 405 });
  const url = new URL(req.url);
  const parts = url.pathname.split('/');
  const userId = parts[3] || '';
  if (!userId) return new Response(JSON.stringify({ ok: false, error: 'Missing userId' }), { status: 400 });

  const callerId = getUserIdFromRequest(req);
  if (!callerId) return new Response(JSON.stringify({ ok: false, error: 'Unauthorized' }), { status: 401 });
  if (callerId !== userId && !isPlatformOwner(req)) {
    return new Response(JSON.stringify({ ok: false, error: 'Forbidden' }), { status: 403 });
  }

  const supabase = createSupabaseClient(true) as any;

  // For MVP, compute simple matches: wishlist category equals any storefront_product category for any business
  // In real DB we'd do SQL joins; in tests our mock returns arrays filtered by .from().select().
  const { data: wishlist } = await supabase.from('wishlist_items').select('*').eq('user_id', userId);
  const { data: products } = await supabase.from('storefront_products').select('*');

  const matches: Array<any> = [];
  for (const w of (wishlist as any[]) || []) {
    for (const p of (products as any[]) || []) {
      if (!w.category || !p.category) continue;
      if (String(w.category).toLowerCase() === String(p.category).toLowerCase()) {
        matches.push({ wishlist_item_id: w.id, storefront_product_id: p.id, category: w.category });
      }
    }
  }

  return new Response(
    JSON.stringify({ ok: true, count: matches.length, matches }),
    { headers: { 'Content-Type': 'application/json' } }
  );
};

export const config = {
  path: '/api/users/:userId/wishlist/matches',
};


