import React, { useMemo, useState } from 'react';

function Section({ title, children }: { title: string; children: any }) {
  return (
    <section style={{ border: '1px solid #ddd', borderRadius: 8, padding: 16, marginBottom: 16 }}>
      <h3 style={{ marginTop: 0 }}>{title}</h3>
      {children}
    </section>
  );
}

export default function App() {
  const [token, setToken] = useState('');
  const authHeaders = useMemo(() => (token ? { Authorization: token } : {}), [token]);

  const [storefront, setStorefront] = useState(null as any);
  const [reviewResult, setReviewResult] = useState(null as any);
  const [reviewsList, setReviewsList] = useState(null as any);
  const [wishlistMatches, setWishlistMatches] = useState(null as any);
  const [products, setProducts] = useState(null as any);
  const [notifications, setNotifications] = useState(null as any);

  async function postStorefront() {
    const res = await fetch('/api/business/storefront', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders },
      body: JSON.stringify({ description: 'React SF', theme: 'light', is_open: true }),
    });
    setStorefront(await res.json());
  }

  async function getStorefront() {
    const res = await fetch('/api/business/storefront', { headers: { ...authHeaders } });
    setStorefront(await res.json());
  }

  async function postReview(businessId: string) {
    const res = await fetch(`/api/business/${businessId}/reviews`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders },
      body: JSON.stringify({ recommend_status: true, review_text: 'Great place!' }),
    });
    setReviewResult(await res.json());
  }

  async function getReviews(businessId: string) {
    const filter = (document.getElementById('revFilter') as HTMLSelectElement)?.value;
    const qs = filter ? `?recommend=${encodeURIComponent(filter)}` : '';
    const res = await fetch(`/api/business/${businessId}/reviews${qs}`, { headers: { ...authHeaders } });
    setReviewsList(await res.json());
  }

  async function getWishlistMatches(userId: string) {
    const res = await fetch(`/api/users/${userId}/wishlist/matches`, { headers: { ...authHeaders } });
    setWishlistMatches(await res.json());
  }

  async function getProducts(storefrontId: string) {
    const res = await fetch(`/api/storefronts/${storefrontId}/products`, { headers: { ...authHeaders } });
    setProducts(await res.json());
  }

  async function getNotifications(userId: string) {
    const res = await fetch(`/api/users/${userId}/notifications`, { headers: { ...authHeaders } });
    setNotifications(await res.json());
  }

  return (
    <div style={{ fontFamily: 'system-ui, Arial, sans-serif', padding: 24, maxWidth: 900, margin: '0 auto' }}>
      <h2>SynC React UI (v0.1.4)</h2>
      <Section title="Auth">
        <label>
          Bearer token:
          <input
            style={{ width: '100%' }}
            placeholder="Bearer header value (e.g., Bearer <header>.<payload>.)"
            value={token}
            onChange={(e: any) => setToken((e.target as HTMLInputElement).value)}
          />
        </label>
      </Section>

      <Section title="Storefront (owner)">
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={postStorefront}>POST upsert</button>
          <button onClick={getStorefront}>GET</button>
        </div>
        <pre>{JSON.stringify(storefront, null, 2)}</pre>
      </Section>

      <Section title="Reviews">
        <div style={{ display: 'flex', gap: 8 }}>
          <input id="bizId" placeholder="businessId" />
          <button
            onClick={() => {
              const id = (document.getElementById('bizId') as HTMLInputElement)?.value;
              if (id) postReview(id);
            }}
          >
            POST review
          </button>
          <select id="revFilter" defaultValue="">
            <option value="">all</option>
            <option value="true">recommend</option>
            <option value="false">not recommend</option>
          </select>
          <button
            onClick={() => {
              const id = (document.getElementById('bizId') as HTMLInputElement)?.value;
              if (id) getReviews(id);
            }}
          >
            GET reviews
          </button>
        </div>
        <pre>{JSON.stringify(reviewResult, null, 2)}</pre>
        <pre>{JSON.stringify(reviewsList, null, 2)}</pre>
      </Section>

      <Section title="Wishlist Matches">
        <div style={{ display: 'flex', gap: 8 }}>
          <input id="userId" placeholder="userId" />
          <button
            onClick={() => {
              const id = (document.getElementById('userId') as HTMLInputElement)?.value;
              if (id) getWishlistMatches(id);
            }}
          >
            GET matches
          </button>
        </div>
        <pre>{JSON.stringify(wishlistMatches, null, 2)}</pre>
      </Section>

      <Section title="Notifications">
        <div style={{ display: 'flex', gap: 8 }}>
          <input id="notifUserId" placeholder="userId" />
          <button
            onClick={() => {
              const id = (document.getElementById('notifUserId') as HTMLInputElement)?.value;
              if (id) getNotifications(id);
            }}
          >
            GET notifications
          </button>
        </div>
        <pre>{JSON.stringify(notifications, null, 2)}</pre>
      </Section>

      <Section title="Storefront Products">
        <div style={{ display: 'flex', gap: 8 }}>
          <input id="sfId" placeholder="storefrontId" />
          <button
            onClick={() => {
              const id = (document.getElementById('sfId') as HTMLInputElement)?.value;
              if (id) getProducts(id);
            }}
          >
            GET products
          </button>
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          <input id="prodName" placeholder="product_name" />
          <input id="prodCat" placeholder="category" />
          <button
            onClick={async () => {
              const sfId = (document.getElementById('sfId') as HTMLInputElement)?.value;
              const name = (document.getElementById('prodName') as HTMLInputElement)?.value;
              const cat = (document.getElementById('prodCat') as HTMLInputElement)?.value;
              if (!sfId) { alert('storefrontId required'); return; }
              if (!name || name.trim().length < 2) { alert('product_name required (min 2 chars)'); return; }
              const res = await fetch(`/api/storefronts/${sfId}/products`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...authHeaders },
                body: JSON.stringify({ items: [{ product_name: name, category: cat || null }] }),
              });
              const j = await res.json();
              setProducts(j);
            }}
          >
            POST product
          </button>
        </div>
        <pre>{JSON.stringify(products, null, 2)}</pre>
      </Section>
    </div>
  );
}


