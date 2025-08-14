import React, { useState } from 'react';
import { t } from '../i18n';

export function AnalyticsCsvButton({
  endpoint,
  params,
  label = t('exportCsv'),
  filename,
  acceptLanguage,
}: {
  endpoint: string;
  params: Record<string, string | number | boolean | undefined>;
  label?: string;
  filename?: string; // hint-only; server sets filename via headers
  acceptLanguage?: string;
}) {
  const [loading, setLoading] = useState(false);
  const onClick = () => {
    try {
      const sp = new URLSearchParams();
      Object.entries(params).forEach(([k, v]) => {
        if (v == null || v === '') return;
        if (typeof v === 'boolean') { if (v === false) sp.set(k, 'false'); else sp.set(k, 'true'); }
        else sp.set(k, String(v));
      });
      sp.set('format', 'csv');
      const qs = sp.toString() ? `?${sp.toString()}` : '';
      const url = `${endpoint}${qs}`;
      if (acceptLanguage) {
        setLoading(true);
        fetch(url, { headers: { 'Accept-Language': acceptLanguage } }).then(async (r) => {
          const blob = await r.blob();
          const u = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = u;
          const cd = r.headers.get('Content-Disposition') || '';
          const match = cd.match(/filename\*=UTF-8''([^;\s]+)/i) || cd.match(/filename="?([^";]+)"?/i);
          const suggested = match ? decodeURIComponent(match[1]) : '';
          a.download = suggested || filename || `analytics_${Date.now()}.csv`;
          a.click();
          URL.revokeObjectURL(u);
        }).catch(() => { window.open(url, '_blank'); }).finally(() => setLoading(false));
      } else {
        window.open(url, '_blank');
      }
    } catch {}
  };
  return (
    <button className="btn" aria-label={label} title={filename ? `${label} (${filename})` : label} onClick={onClick} disabled={loading} aria-busy={loading ? (true as any) : (false as any)}>{loading ? '…' : label}</button>
  );
}


