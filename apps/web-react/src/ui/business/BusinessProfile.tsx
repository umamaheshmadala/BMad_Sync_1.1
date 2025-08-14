import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

type BizProfile = {
  name: string;
  address: string;
  googleLocationUrl: string;
  phone: string;
  email: string;
  isOpen: boolean;
  holidays: string;
  logoUrl: string;
};

const defaults: BizProfile = { name: '', address: '', googleLocationUrl: '', phone: '', email: '', isOpen: true, holidays: '', logoUrl: '' };

export default function BusinessProfilePage() {
  const [p, setP] = useState<BizProfile>(defaults);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    try {
      const raw = localStorage.getItem('sync_business_profile');
      if (raw) setP({ ...defaults, ...JSON.parse(raw) });
    } catch {}
  }, []);

  function set<K extends keyof BizProfile>(key: K, value: BizProfile[K]) {
    setP(prev => ({ ...prev, [key]: value }));
  }

  function save(e: React.FormEvent) {
    e.preventDefault();
    try { localStorage.setItem('sync_business_profile', JSON.stringify(p)); setMsg('Saved'); setTimeout(() => setMsg(''), 1500); } catch {}
  }

  return (
    <div className="container" style={{ maxWidth: 720, marginTop: 24 }}>
      <h2>Business Profile</h2>
      <form onSubmit={save}>
        <div className="field"><label>Business Name</label><input value={p.name} onChange={e => set('name', e.target.value)} /></div>
        <div className="field"><label>Address</label><input value={p.address} onChange={e => set('address', e.target.value)} /></div>
        <div className="field"><label>Google Location URL</label><input value={p.googleLocationUrl} onChange={e => set('googleLocationUrl', e.target.value)} placeholder="https://maps.google..." /></div>
        <div className="field"><label>Contact Phone</label><input value={p.phone} onChange={e => set('phone', e.target.value)} /></div>
        <div className="field"><label>Contact Email</label><input type="email" value={p.email} onChange={e => set('email', e.target.value)} /></div>
        <div className="field"><label>Open</label><input type="checkbox" checked={p.isOpen} onChange={e => set('isOpen', e.target.checked)} /></div>
        <div className="field"><label>Holidays</label><input value={p.holidays} onChange={e => set('holidays', e.target.value)} placeholder="Comma-separated" /></div>
        <div className="field"><label>Logo URL</label><input value={p.logoUrl} onChange={e => set('logoUrl', e.target.value)} placeholder="https://..." /></div>
        {msg && <div className="note" role="status">{msg}</div>}
        <button className="btn" type="submit">Save</button>
      </form>
      <div style={{ marginTop: 12 }}>
        <Link to="/business/portal">Back to Business Portal</Link> · <Link to="/dashboard">Dashboard</Link>
      </div>
    </div>
  );
}


