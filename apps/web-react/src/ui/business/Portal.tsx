import React from 'react';
import { Link } from 'react-router-dom';

export default function BusinessPortal() {
  return (
    <div className="container" style={{ maxWidth: 800, marginTop: 24 }}>
      <h2>Business Portal</h2>
      <p className="muted">Minimal shell. Manage your storefront, offers, and analytics here.</p>
      <ul>
        <li><Link to="/dashboard">Back to Dashboard</Link></li>
      </ul>
    </div>
  );
}


