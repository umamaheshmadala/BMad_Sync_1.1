export type RequestHandler = (req: Request) => Promise<Response> | Response;

export function withRequestLogging(name: string, handler: RequestHandler): RequestHandler {
  return async (req: Request) => {
    const start = Date.now();
    try {
      const res = await handler(req);
      const ms = Date.now() - start;
      try {
        const path = safePath(req);
        // eslint-disable-next-line no-console
        console.log(`[fn] ${name} ${req.method} ${path} -> ${res.status} ${ms}ms`);
      } catch {}
      return res;
    } catch (e: any) {
      const ms = Date.now() - start;
      try {
        const path = safePath(req);
        // eslint-disable-next-line no-console
        console.error(`[fn] ${name} ${req.method} ${path} -> error ${ms}ms`, e?.message || e);
      } catch {}
      return new Response(
        JSON.stringify({ ok: false, error: e?.message || 'Unexpected error' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
  };
}

function safePath(req: Request): string {
  try { return new URL(req.url).pathname; } catch { return ''; }
}


