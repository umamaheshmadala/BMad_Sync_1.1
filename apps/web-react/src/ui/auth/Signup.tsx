import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

export default function Signup() {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('user');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!email) { setError('Email required'); return; }
    try {
      const res = await fetch('/api/auth/signup', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, role }) });
      const j = await res.json();
      if (j?.bearer) {
        try { localStorage.setItem('sync_token', j.bearer); } catch {}
        navigate('/dashboard', { replace: true });
      } else {
        setError(j?.error || 'Signup failed');
      }
    } catch (e: any) {
      setError(e?.message || 'Signup error');
    }
  }

  return (
    <div className="container" style={{ maxWidth: 480, marginTop: 40 }}>
      <h2>Sign up</h2>
      <form onSubmit={submit}>
        <div className="field">
          <label>Email</label>
          <input value={email} onChange={e => setEmail(e.target.value)} type="email" placeholder="you@example.com" />
        </div>
        <div className="field">
          <label>Role</label>
          <input value={role} onChange={e => setRole(e.target.value)} placeholder="user|business|owner" />
        </div>
        {error && <div className="error" role="alert">{error}</div>}
        <button className="btn" type="submit">Create account</button>
      </form>
      <div style={{ marginTop: 12 }}>
        <Link to="/auth/login">Already have an account? Login</Link>
      </div>
    </div>
  );
}


