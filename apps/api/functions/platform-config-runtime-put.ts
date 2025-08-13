import { writePlatformConfig } from '../../../packages/shared/config';
import { withErrorHandling } from '../../../packages/shared/errors';
import { json } from '../../../packages/shared/http';

export default withErrorHandling(async (req: Request) => {
  if (req.method !== 'PUT') return new Response('Method Not Allowed', { status: 405 });
  try {
    const body = await req.json();
    await writePlatformConfig(body);
    return json({ ok: true });
  } catch {
    return json({ ok: false, error: 'Bad Request' }, { status: 400 });
  }
});

export const config = {
  path: '/api/platform/config/runtime',
};
