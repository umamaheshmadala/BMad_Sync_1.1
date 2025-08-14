import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';

export default function Login() {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('user');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const redirectTo = params.get('redirectTo') || '/dashboard';

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!email) { setError('Email required'); return; }
    try {
      const res = await fetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, role }) });
      const j = await res.json();
      if (j?.bearer) {
        try { localStorage.setItem('sync_token', j.bearer); } catch {}
        navigate(redirectTo || '/dashboard', { replace: true });
      } else {
        setError(j?.error || 'Login failed');
      }
    } catch (e: any) {
      setError(e?.message || 'Login error');
    }
  }

  return (
    <div className="container" style={{ maxWidth: 480, marginTop: 40 }}>
      <h2>Login</h2>
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
        <button className="btn" type="submit">Login</button>
      </form>
      <div style={{ marginTop: 12 }}>
        <Link to="/auth/signup">Create account</Link> · <Link to="/auth/reset">Reset password</Link>
      </div>
    </div>
  );
}


