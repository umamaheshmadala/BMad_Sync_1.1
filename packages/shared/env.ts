export function readEnv(name: string): string | undefined {
  try {
    // @ts-ignore Netlify runtime
    if (typeof Netlify !== 'undefined' && Netlify?.env?.get) {
      // @ts-ignore
      const v = Netlify.env.get(name);
      if (v) return v as string;
    }
  } catch {}
  // Fallback (Node / local)
  // @ts-ignore
  return (globalThis as any)?.process?.env?.[name] as string | undefined;
}

export function isFeatureEnabled(name: string): boolean {
  return String(readEnv(name) || '').toLowerCase() === 'true';
}


