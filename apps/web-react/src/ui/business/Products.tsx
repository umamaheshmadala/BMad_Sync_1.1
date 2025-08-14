import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

type Product = { id: string; title: string; price: number; trending?: boolean };

function uid() { return Math.random().toString(36).slice(2, 10); }

export default function BusinessProductsPage() {
  const [items, setItems] = useState<Product[]>([]);
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [trending, setTrending] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    try { const raw = localStorage.getItem('sync_products'); if (raw) setItems(JSON.parse(raw)); } catch {}
  }, []);

  function persist(next: Product[]) {
    setItems(next);
    try { localStorage.setItem('sync_products', JSON.stringify(next)); setMsg('Saved'); setTimeout(() => setMsg(''), 1200); } catch {}
  }

  function addItem(e: React.FormEvent) {
    e.preventDefault();
    const t = title.trim(); const p = Number(price);
    if (!t || Number.isNaN(p)) return;
    persist([{ id: uid(), title: t, price: p, trending }, ...items]);
    setTitle(''); setPrice(''); setTrending(false);
  }

  function remove(id: string) { persist(items.filter(i => i.id !== id)); }
  function toggleTrending(id: string) { persist(items.map(i => i.id === id ? { ...i, trending: !i.trending } : i)); }

  return (
    <div className="container" style={{ maxWidth: 860, marginTop: 24 }}>
      <h2>Business Products</h2>
      <form onSubmit={addItem} style={{ marginBottom: 12 }}>
        <div className="field"><label>Title</label><input value={title} onChange={e => setTitle(e.target.value)} /></div>
        <div className="field"><label>Price</label><input value={price} onChange={e => setPrice(e.target.value)} /></div>
        <div className="field"><label>Trending</label><input type="checkbox" checked={trending} onChange={e => setTrending(e.target.checked)} /></div>
        <button className="btn" type="submit">Add</button>
        {msg && <span className="note" style={{ marginLeft: 8 }}>{msg}</span>}
      </form>
      <table className="table" style={{ width: '100%' }}>
        <thead><tr><th>Title</th><th>Price</th><th>Trending</th><th>Actions</th></tr></thead>
        <tbody>
          {items.map(i => (
            <tr key={i.id}>
              <td>{i.title}</td>
              <td>{i.price.toFixed(2)}</td>
              <td>{i.trending ? 'Yes' : 'No'}</td>
              <td>
                <button className="btn" onClick={() => toggleTrending(i.id)}>toggle trending</button>
                <button className="btn" onClick={() => remove(i.id)} style={{ marginLeft: 6 }}>remove</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div style={{ marginTop: 12 }}>
        <Link to="/business/portal">Back to Business Portal</Link> · <Link to="/react/storefront">View Storefront</Link>
      </div>
    </div>
  );
}


