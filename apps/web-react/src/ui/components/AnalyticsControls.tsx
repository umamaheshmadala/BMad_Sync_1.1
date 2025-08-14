import React from 'react';

export type AnalyticsControlsProps = {
  sinceDays: number;
  setSinceDays: (n: number) => void;
  tz: string;
  setTz: (v: string) => void;
  fill: boolean;
  setFill: (v: boolean) => void;
  locale?: string;
  setLocale?: (v: string) => void;
  onReset?: () => void;
};

export function AnalyticsControls({ sinceDays, setSinceDays, tz, setTz, fill, setFill, locale, setLocale, onReset }: AnalyticsControlsProps) {
  const handleReset = () => {
    try {
      setSinceDays(7);
      setTz('');
      setFill(true);
      if (setLocale) setLocale('en');
      localStorage.setItem('sync_analytics_since_days', '7');
      localStorage.setItem('sync_analytics_tz', '');
      localStorage.setItem('sync_analytics_fill', '1');
      try { localStorage.setItem('sync_analytics_locale', 'en'); } catch {}
    } catch {}
    if (onReset) onReset();
  };
  return (
    <>
      <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span className="muted text-sm">sinceDays</span>
        <input
          type="number"
          min={1 as any}
          max={365 as any}
          value={sinceDays as any}
          onChange={(e) => {
            const n = Math.max(1, Math.min(365, Number((e.target as HTMLInputElement).value || 7)));
            setSinceDays(n);
            try { localStorage.setItem('sync_analytics_since_days', String(n)); } catch {}
          }}
          style={{ width: 90 }}
          className="input"
          aria-label="sinceDays"
        />
      </label>
      <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span className="muted text-sm">tz</span>
        <select className="input" value={tz || ''} onChange={(e) => { const v=(e.target as HTMLSelectElement).value; setTz(v); try { localStorage.setItem('sync_analytics_tz', v); } catch {} }} style={{ width: 220 }} aria-label="Timezone preset">
          {(() => {
            const tzs = ['', 'UTC', 'America/Los_Angeles', 'America/New_York', 'Europe/London', 'Europe/Berlin', 'Asia/Kolkata', 'Asia/Singapore', 'Australia/Sydney'];
            return tzs.map((z) => (<option key={z || 'none'} value={z}>{z ? z : '— none —'}</option>));
          })()}
        </select>
        <input className="input" placeholder="custom tz (IANA)" value={tz} onChange={(e) => { const v=(e.target as HTMLInputElement).value; setTz(v); try { localStorage.setItem('sync_analytics_tz', v); } catch {} }} style={{ width: 180 }} aria-label="Custom timezone" />
      </label>
      <label style={{ display: 'flex', alignItems: 'center', gap: 6 }} title="Zero-fill missing days">
        <input type="checkbox" checked={fill} onChange={(e) => { const v=(e.target as HTMLInputElement).checked; setFill(v); try { localStorage.setItem('sync_analytics_fill', v ? '1' : ''); } catch {} }} /> fill
      </label>
      <label style={{ display: 'flex', alignItems: 'center', gap: 6 }} title="CSV/JSON locale">
        <span className="muted text-sm">locale</span>
        <select className="input" value={locale || ''} onChange={(e) => { const v=(e.target as HTMLSelectElement).value; if (setLocale) setLocale(v); try { localStorage.setItem('sync_analytics_locale', v); } catch {} }} style={{ width: 120 }} aria-label="Locale">
          {['en','es','fr','pt'].map(l => (<option key={l} value={l}>{l}</option>))}
        </select>
      </label>
      <button className="btn" title="Reset analytics controls" onClick={handleReset}>reset</button>
    </>
  );
}


