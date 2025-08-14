import React from 'react';
import { t } from '../i18n';

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
      <div className="flex" role="group" aria-label={t('sinceDays')} style={{ gap: 6, alignItems: 'center' }}>
        <span className="muted text-sm">{t('sinceDays')}</span>
        {[7,30,90].map((d) => (
          <button key={d} className="btn" aria-pressed={sinceDays===d ? (true as any) : (false as any)} onClick={() => { setSinceDays(d); try { localStorage.setItem('sync_analytics_since_days', String(d)); } catch {} }}>{d}</button>
        ))}
      </div>
      <label style={{ display: 'flex', alignItems: 'center', gap: 6 }} htmlFor="sinceDaysInput">
        <span className="muted text-sm">{t('sinceDays')}</span>
        <input
          id="sinceDaysInput"
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
          aria-label={t('sinceDays')}
        />
      </label>
      <label style={{ display: 'flex', alignItems: 'center', gap: 6 }} htmlFor="tzPreset">
        <span className="muted text-sm" id="tzLabel">{t('tz')}</span>
        <select id="tzPreset" className="input" aria-labelledby="tzLabel" value={tz || ''} onChange={(e) => { const v=(e.target as HTMLSelectElement).value; setTz(v); try { localStorage.setItem('sync_analytics_tz', v); } catch {} }} style={{ width: 220 }} aria-label={t('timezonePreset')}>
          {(() => {
            const tzs = ['', 'UTC', 'America/Los_Angeles', 'America/New_York', 'Europe/London', 'Europe/Berlin', 'Asia/Kolkata', 'Asia/Singapore', 'Australia/Sydney'];
            return tzs.map((z) => (<option key={z || 'none'} value={z}>{z ? z : t('none')}</option>));
          })()}
        </select>
        <input id="tzCustom" className="input" placeholder={t('customTimezone')} value={tz} onChange={(e) => { const v=(e.target as HTMLInputElement).value; setTz(v); try { localStorage.setItem('sync_analytics_tz', v); } catch {} }} style={{ width: 180 }} aria-label={t('customTimezone')} />
      </label>
      <label style={{ display: 'flex', alignItems: 'center', gap: 6 }} title="Zero-fill missing days">
        <input type="checkbox" checked={fill} onChange={(e) => { const v=(e.target as HTMLInputElement).checked; setFill(v); try { localStorage.setItem('sync_analytics_fill', v ? '1' : ''); } catch {} }} /> {t('fill')}
      </label>
      <label style={{ display: 'flex', alignItems: 'center', gap: 6 }} htmlFor="localeSelect" title={t('csvJsonLocale')}>
        <span className="muted text-sm">{t('locale')}</span>
        <select id="localeSelect" className="input" value={locale || ''} onChange={(e) => { const v=(e.target as HTMLSelectElement).value; if (setLocale) setLocale(v as any); try { localStorage.setItem('sync_analytics_locale', v); } catch {} }} style={{ width: 120 }} aria-label={t('locale')}>
          {['en','es','fr','pt'].map(l => (<option key={l} value={l}>{l}</option>))}
        </select>
      </label>
      <button className="btn" title={t('resetControls')} onClick={handleReset}>{t('reset')}</button>
    </>
  );
}


