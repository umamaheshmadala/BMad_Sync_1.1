export function computeTtlFromSinceDays(sinceDays: number): number {
  const days = Math.max(1, Math.min(365, Number(sinceDays || 7)));
  return Math.min(300, Math.max(30, days * 5));
}

export function weakEtagForObject(obj: unknown): string | undefined {
  try {
    const key = JSON.stringify(obj);
    let h = 2166136261 >>> 0;
    for (let i = 0; i < key.length; i++) { h ^= key.charCodeAt(i); h = Math.imul(h, 16777619); }
    return 'W/"' + (h >>> 0).toString(16) + '"';
  } catch {
    return undefined;
  }
}

export function deriveLastModifiedFromKeys(keys: string[] | undefined): string {
  try {
    const last = (keys || []).sort().pop();
    return last ? new Date(`${last}T23:59:59Z`).toUTCString() : new Date().toUTCString();
  } catch {
    return new Date().toUTCString();
  }
}


