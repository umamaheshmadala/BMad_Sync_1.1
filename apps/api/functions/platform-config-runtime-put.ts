import { writePlatformConfig } from '../../../packages/shared/config';
import { withErrorHandling } from '../../../packages/shared/errors';
import { json } from '../../../packages/shared/http';
import { PlatformRuntimeConfigShapeSchema } from '../../../packages/shared/validation';

export default withErrorHandling(async (req: Request) => {
  if (req.method !== 'PUT') return new Response('Method Not Allowed', { status: 405 });
  try {
    const body = await req.json();
    const parsed = PlatformRuntimeConfigShapeSchema.safeParse(body);
    if (!parsed.success) return json({ ok: false, error: 'Invalid payload', details: parsed.error.flatten() }, { status: 400 });
    await writePlatformConfig(parsed.data);
    return json({ ok: true });
  } catch {
    return json({ ok: false, error: 'Bad Request' }, { status: 400 });
  }
});

export const config = {
  path: '/api/platform/config/runtime',
};
