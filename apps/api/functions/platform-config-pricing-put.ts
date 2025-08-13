import { createSupabaseClient } from '../../../packages/shared/supabaseClient';
import { isPlatformOwner, isPlatformOwnerAsync } from '../../../packages/shared/auth';
import { withRequestLogging } from '../../../packages/shared/logging';
import { withErrorHandling } from '../../../packages/shared/errors';
import { json } from '../../../packages/shared/http';

export default withRequestLogging('platform-config-pricing-put', withErrorHandling(async (req: Request) => {
  if (req.method !== 'PUT') return new Response('Method Not Allowed', { status: 405 });
  const allow = (await isPlatformOwnerAsync(req)) || isPlatformOwner(req);
  if (!allow) return json({ ok: false, error: 'Forbidden' }, { status: 403 });
  try {
    const body = await req.json();
    const pricing = typeof body === 'object' && body ? body : {};
    const supabase = createSupabaseClient(true) as any;
    const { error } = await supabase
      .from('platform_config')
      .upsert({ key_name: 'pricing.table', config_value: pricing }, { onConflict: 'key_name' } as any);
    if (error) return json({ ok: false, error: error.message }, { status: 500 });
    return json({ ok: true });
  } catch (e: any) {
    return json({ ok: false, error: e?.message || 'Bad Request' }, { status: 400 });
  }
}));

export const config = {
  path: '/api/platform/config/pricing',
};


