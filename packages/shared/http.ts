export function json(data: unknown, init?: ResponseInit): Response {
  const headers = new Headers(init?.headers || {});
  if (!headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
  return new Response(JSON.stringify(data), { ...init, headers });
}

export function errorJson(message: string, status: number = 400, code?: string, extra?: Record<string, unknown>): Response {
  const payload: Record<string, unknown> = { ok: false, error: message };
  if (code) payload.code = code;
  if (extra) Object.assign(payload, extra);
  return json(payload, { status });
}

export function getClientIp(req: Request): string {
  try {
    const headers = new Headers((req as any).headers || {});
    const xNfIp = headers.get('x-nf-client-connection-ip');
    if (xNfIp) return xNfIp;
    const xForwardedFor = headers.get('x-forwarded-for');
    if (xForwardedFor) return xForwardedFor.split(',')[0].trim();
    const cfConnectingIp = headers.get('cf-connecting-ip');
    if (cfConnectingIp) return cfConnectingIp;
    const xRealIp = headers.get('x-real-ip');
    if (xRealIp) return xRealIp;
  } catch {}
  return 'unknown';
}


