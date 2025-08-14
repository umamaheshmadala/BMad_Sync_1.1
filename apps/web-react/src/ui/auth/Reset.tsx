import React, { useState } from 'react';
import { Link } from 'react-router-dom';

export default function Reset() {
  const [email, setEmail] = useState('');
  const [info, setInfo] = useState('');

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) { setInfo('Enter your email'); return; }
    // Placeholder for reset flow
    setInfo('If this were wired, a reset email would be sent.');
  }

  return (
    <div className="container" style={{ maxWidth: 480, marginTop: 40 }}>
      <h2>Reset password</h2>
      <form onSubmit={submit}>
        <div className="field">
          <label>Email</label>
          <input value={email} onChange={e => setEmail(e.target.value)} type="email" placeholder="you@example.com" />
        </div>
        {info && <div className="note">{info}</div>}
        <button className="btn" type="submit">Send reset link</button>
      </form>
      <div style={{ marginTop: 12 }}>
        <Link to="/auth/login">Back to login</Link>
      </div>
    </div>
  );
}


