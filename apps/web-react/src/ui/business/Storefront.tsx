import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

type Storefront = {
  description: string;
  theme: 'cosmic' | 'daylight' | 'ocean';
  isOpen: boolean;
  bannerUrl: string;
};

const defaults: Storefront = { description: '', theme: 'cosmic', isOpen: true, bannerUrl: '' };

export default function StorefrontPage() {
  const [s, setS] = useState<Storefront>(defaults);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    try { const raw = localStorage.getItem('sync_storefront'); if (raw) setS({ ...defaults, ...JSON.parse(raw) }); } catch {}
  }, []);

  function set<K extends keyof Storefront>(key: K, value: Storefront[K]) {
    setS(prev => ({ ...prev, [key]: value }));
  }

  function save(e: React.FormEvent) {
    e.preventDefault();
    try { localStorage.setItem('sync_storefront', JSON.stringify(s)); setMsg('Saved'); setTimeout(() => setMsg(''), 1500); } catch {}
  }

  return (
    <div className="container" style={{ maxWidth: 720, marginTop: 24 }}>
      <h2>Storefront</h2>
      <form onSubmit={save}>
        <div className="field"><label>Description</label><input value={s.description} onChange={e => set('description', e.target.value)} /></div>
        <div className="field">
          <label>Theme</label>
          <select value={s.theme} onChange={e => set('theme', e.target.value as any)}>
            <option value="cosmic">Cosmic</option>
            <option value="daylight">Daylight</option>
            <option value="ocean">Ocean</option>
          </select>
        </div>
        <div className="field"><label>Open</label><input type="checkbox" checked={s.isOpen} onChange={e => set('isOpen', e.target.checked)} /></div>
        <div className="field"><label>Banner Image URL</label><input value={s.bannerUrl} onChange={e => set('bannerUrl', e.target.value)} placeholder="https://..." /></div>
        {msg && <div className="note" role="status">{msg}</div>}
        <button className="btn" type="submit">Save</button>
      </form>
      <div style={{ marginTop: 12 }}>
        <Link to="/business/portal">Back to Business Portal</Link> · <Link to="/dashboard">Dashboard</Link>
      </div>
    </div>
  );
}


