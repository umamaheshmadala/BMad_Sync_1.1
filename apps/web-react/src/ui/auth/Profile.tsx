import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

type Profile = {
  name: string;
  preferredName: string;
  avatarUrl: string;
  email: string;
  phone: string;
};

const defaultProfile: Profile = { name: '', preferredName: '', avatarUrl: '', email: '', phone: '' };

export default function ProfilePage() {
  const [p, setP] = useState<Profile>(defaultProfile);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    try {
      const raw = localStorage.getItem('sync_profile');
      if (raw) setP({ ...defaultProfile, ...JSON.parse(raw) });
    } catch {}
  }, []);

  function set<K extends keyof Profile>(key: K, value: Profile[K]) {
    setP(prev => ({ ...prev, [key]: value }));
  }

  function save(e: React.FormEvent) {
    e.preventDefault();
    try { localStorage.setItem('sync_profile', JSON.stringify(p)); setMsg('Saved'); setTimeout(() => setMsg(''), 1500); } catch {}
  }

  return (
    <div className="container" style={{ maxWidth: 600, marginTop: 24 }}>
      <h2>Profile</h2>
      <form onSubmit={save}>
        <div className="field">
          <label>Name</label>
          <input value={p.name} onChange={e => set('name', e.target.value)} />
        </div>
        <div className="field">
          <label>Preferred Name</label>
          <input value={p.preferredName} onChange={e => set('preferredName', e.target.value)} />
        </div>
        <div className="field">
          <label>Avatar URL</label>
          <input value={p.avatarUrl} onChange={e => set('avatarUrl', e.target.value)} placeholder="https://..." />
        </div>
        <div className="field">
          <label>Email</label>
          <input type="email" value={p.email} onChange={e => set('email', e.target.value)} />
        </div>
        <div className="field">
          <label>Phone</label>
          <input value={p.phone} onChange={e => set('phone', e.target.value)} />
        </div>
        {msg && <div className="note" role="status">{msg}</div>}
        <button className="btn" type="submit">Save</button>
      </form>
      <div style={{ marginTop: 12 }}>
        <Link to="/dashboard">Back to Dashboard</Link>
      </div>
    </div>
  );
}


