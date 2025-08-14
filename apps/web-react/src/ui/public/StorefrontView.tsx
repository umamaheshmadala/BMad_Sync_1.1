import React, { useEffect, useState } from 'react';

type Product = { id: string; title: string; price: number; trending?: boolean };

export default function StorefrontPublicView() {
  const [items, setItems] = useState<Product[]>([]);
  useEffect(() => {
    try { const raw = localStorage.getItem('sync_products'); if (raw) setItems(JSON.parse(raw)); } catch {}
  }, []);
  return (
    <div className="container" style={{ maxWidth: 980, marginTop: 24 }}>
      <h2>Storefront</h2>
      <div className="grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12 }}>
        {items.map(p => (
          <div key={p.id} className="card">
            <div className="muted text-sm">{p.trending ? 'Trending' : ' '}</div>
            <div style={{ fontWeight: 600 }}>{p.title}</div>
            <div>₹ {p.price.toFixed(2)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}


