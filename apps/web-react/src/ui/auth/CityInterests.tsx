import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

type Profile = {
  city?: string;
  interests?: string[];
};

export default function CityInterestsPage() {
  const [city, setCity] = useState('');
  const [interests, setInterests] = useState<string[]>([]);
  const [msg, setMsg] = useState('');

  const [cities, setCities] = useState<string[]>([]);
  const [interestsList, setInterestsList] = useState<string[]>([]);
  useEffect(() => {
    (async () => {
      try {
        const base = (import.meta as any)?.env?.BASE_URL || '/';
        const cRes = await fetch(`${base}configs/cities.json`);
        const cJson = await cRes.json();
        const tiers = cJson?.tiers || {};
        setCities([...(tiers.tier1 || []), ...(tiers.tier2 || []), ...(tiers.tier3 || [])]);
      } catch {}
      try {
        const base = (import.meta as any)?.env?.BASE_URL || '/';
        const iRes = await fetch(`${base}configs/interests.json`);
        const iJson = await iRes.json();
        setInterestsList(iJson?.categories || []);
      } catch {}
    })();
  }, []);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('sync_profile');
      if (raw) {
        const p: Profile = JSON.parse(raw);
        if (p.city) setCity(p.city);
        if (Array.isArray(p.interests)) setInterests(p.interests);
      }
    } catch {}
  }, []);

  function toggleInterest(name: string) {
    setInterests(prev => prev.includes(name) ? prev.filter(i => i !== name) : [...prev, name]);
  }

  function save(e: React.FormEvent) {
    e.preventDefault();
    if (!city) { setMsg('Select a city'); return; }
    if (interests.length < 5) { setMsg('Select at least 5 interests'); return; }
    try {
      const raw = localStorage.getItem('sync_profile');
      const prev = raw ? JSON.parse(raw) : {};
      const next = { ...prev, city, interests, updatedAt: new Date().toISOString() };
      localStorage.setItem('sync_profile', JSON.stringify(next));
      setMsg('Saved');
      setTimeout(() => setMsg(''), 1500);
    } catch {}
  }

  return (
    <div className="container" style={{ maxWidth: 820, marginTop: 24 }}>
      <h2>City & Interests</h2>
      <form onSubmit={save}>
        <div className="field">
          <label>City</label>
          <select value={city} onChange={e => setCity((e.target as HTMLSelectElement).value)}>
            <option value="">Select…</option>
            {cities.map(c => (<option key={c} value={c}>{c}</option>))}
          </select>
        </div>
        <div className="field">
          <label>Interests (select at least 5)</label>
          <div className="grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 8 }}>
            {interestsList.map(name => (
              <label key={name} className="card" style={{ padding: 8, display: 'flex', gap: 8, alignItems: 'center' }}>
                <input type="checkbox" checked={interests.includes(name)} onChange={() => toggleInterest(name)} />
                <span>{name}</span>
              </label>
            ))}
          </div>
        </div>
        {msg && <div className="note" role="status">{msg}</div>}
        <button className="btn" type="submit" disabled={!city || interests.length < 5}>Save</button>
      </form>
      <div style={{ marginTop: 12 }}>
        <Link to="/dashboard/profile">Back to Profile</Link> · <Link to="/dashboard">Dashboard</Link>
      </div>
    </div>
  );
}


