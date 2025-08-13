import { createSupabaseClient } from '../../../packages/shared/supabaseClient';
import { getUserIdFromRequest, getUserIdFromRequestAsync } from '../../../packages/shared/auth';
import { withErrorHandling } from '../../../packages/shared/errors';
import { withRateLimit } from '../../../packages/shared/ratelimit';
import { json } from '../../../packages/shared/http';
import { StorefrontUpdatePayloadSchema } from '../../../packages/shared/validation';

export default withRateLimit('business-storefront', { limit: 120, windowMs: 60_000 }, withErrorHandling(async (req: Request) => {
  const method = req.method || 'GET';
  const supabase = createSupabaseClient(true);
  // Derive business by owner user id
  const ownerUserId = await getUserIdFromRequestAsync(req);
  if (!ownerUserId) return json({ ok: false, error: 'Unauthorized' }, { status: 401 });
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
  if (!businessId) return json({ ok: false, error: 'Missing business context' }, { status: 400 });

  if (method === 'POST') {
    try {
      const body = await req.json();
      const parsed = StorefrontUpdatePayloadSchema.safeParse(body);
      if (!parsed.success) return json({ ok: false, error: 'Invalid payload', details: parsed.error.flatten() }, { status: 400 });
      const { description, theme, is_open } = parsed.data as any;
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
        if (error) return json({ ok: false, error: error.message }, { status: 500 });
      } else {
        const { error } = await supabase
          .from('storefronts')
          .insert({ business_id: businessId, description, theme, is_open: !!is_open });
        if (error) return json({ ok: false, error: error.message }, { status: 500 });
      }
      return json({ ok: true });
    } catch (e: any) {
      return json({ ok: false, error: e?.message || 'Bad Request' }, { status: 400 });
    }
  }
  if (method === 'GET') {
    const { data, error } = await supabase
      .from('storefronts')
      .select('*')
      .eq('business_id', businessId)
      .single();
    if (error && error.code !== 'PGRST116') {
      return json({ ok: false, error: error.message }, { status: 500 });
    }
    return json({ ok: true, storefront: data || null });
  }
  return new Response('Method Not Allowed', { status: 405 });
}));

export const config = {
  path: '/api/business/storefront',
};
