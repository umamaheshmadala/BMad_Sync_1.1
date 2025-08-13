import { readPlatformConfig } from '../../../packages/shared/config';
import { json } from '../../../packages/shared/http';
import { withErrorHandling } from '../../../packages/shared/errors';

export default withErrorHandling(async () => {
  const cfg = await readPlatformConfig();
  return json(cfg);
});

export const config = {
  path: '/api/platform/config',
};
