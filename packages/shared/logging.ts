export type RequestHandler = (req: Request) => Promise<Response> | Response;

export function withRequestLogging(name: string, handler: RequestHandler): RequestHandler {
  return async (req: Request) => {
    const start = Date.now();
    const requestId = (Math.random().toString(36).slice(2) + Date.now().toString(36)).slice(0, 16);
    try {
      // Attach reqId to Sentry scope if available
      try {
        // @ts-ignore
        const Sentry = (await import('@sentry/node')).default || null;
        // @ts-ignore
        const hub = (Sentry as any)?.getCurrentHub?.();
        if (hub) hub?.setTags?.({ 'x-request-id': requestId, function: name });
      } catch {}
      const res = await handler(req);
      const ms = Date.now() - start;
      try {
        const path = safePath(req);
        // eslint-disable-next-line no-console
        console.log(`[fn] ${name} ${req.method} ${path} reqId=${requestId} -> ${res.status} ${ms}ms`);
      } catch {}
      const headers = new Headers(res.headers);
      headers.set('x-request-id', requestId);
      const body = await (res as any).text?.() ?? undefined;
      return new Response(body, { status: res.status, headers });
    } catch (e: any) {
      const ms = Date.now() - start;
      try {
        const path = safePath(req);
        // eslint-disable-next-line no-console
        console.error(`[fn] ${name} ${req.method} ${path} reqId=${requestId} -> error ${ms}ms`, e?.message || e);
        try {
          // @ts-ignore
          const Sentry = (await import('@sentry/node')).default || null;
          if (Sentry && (Sentry as any).captureException) {
            (Sentry as any).captureException(e, { tags: { 'x-request-id': requestId, function: name } });
          }
        } catch {}
      } catch {}
      return new Response(
        JSON.stringify({ ok: false, error: e?.message || 'Unexpected error', request_id: requestId }),
        { status: 500, headers: { 'Content-Type': 'application/json', 'x-request-id': requestId } }
      );
    }
  };
}

function safePath(req: Request): string {
  try { return new URL(req.url).pathname; } catch { return ''; }
}


