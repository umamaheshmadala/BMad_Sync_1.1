import { createSupabaseClient } from '../../../packages/shared/supabaseClient';
import { getUserIdFromRequest } from '../../../packages/shared/auth';

export default async (req: Request) => {
  const method = req.method || 'GET';
  const supabase = createSupabaseClient(true);
  // Derive business by owner user id
  const ownerUserId = getUserIdFromRequest(req);
  let businessId = '';
  if (ownerUserId) {
    const { data: biz, error } = await supabase
      .from('businesses')
      .select('id')
      .eq('owner_user_id', ownerUserId)
      .limit(1)
      .maybeSingle();
    if (!error && biz?.id) businessId = biz.id as string;
  }
  // Fallback header for MVP manual testing
  if (!businessId) businessId = req.headers.get('x-business-id') || '';
  if (!businessId) return new Response(JSON.stringify({ ok: false, error: 'Missing business context' }), { status: 400 });

  if (method === 'POST') {
    try {
      const body = await req.json();
      const { description, theme, is_open } = body || {};
      const { data: existing } = await supabase
        .from('storefronts')
        .select('id')
        .eq('business_id', businessId)
        .maybeSingle();
      if (existing?.id) {
        const { error } = await supabase
          .from('storefronts')
          .update({ description, theme, is_open: !!is_open })
          .eq('id', existing.id as string);
        if (error) return new Response(JSON.stringify({ ok: false, error: error.message }), { status: 500 });
      } else {
        const { error } = await supabase
          .from('storefronts')
          .insert({ business_id: businessId, description, theme, is_open: !!is_open });
        if (error) return new Response(JSON.stringify({ ok: false, error: error.message }), { status: 500 });
      }
      return new Response(JSON.stringify({ ok: true }), { headers: { 'Content-Type': 'application/json' } });
    } catch (e: any) {
      return new Response(JSON.stringify({ ok: false, error: e?.message || 'Bad Request' }), { status: 400 });
    }
  }
  if (method === 'GET') {
    const { data, error } = await supabase
      .from('storefronts')
      .select('*')
      .eq('business_id', businessId)
      .single();
    if (error && error.code !== 'PGRST116') {
      return new Response(JSON.stringify({ ok: false, error: error.message }), { status: 500 });
    }
    return new Response(JSON.stringify({ ok: true, storefront: data || null }), { headers: { 'Content-Type': 'application/json' } });
  }
  return new Response('Method Not Allowed', { status: 405 });
};

export const config = {
  path: '/api/business/storefront',
};
