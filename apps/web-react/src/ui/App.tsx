import React, { useMemo, useState } from 'react';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
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

  const [storefront, setStorefront] = useState<any>(null);
  const [reviewResult, setReviewResult] = useState<any>(null);
  const [wishlistMatches, setWishlistMatches] = useState<any>(null);
  const [products, setProducts] = useState<any>(null);

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

  async function getWishlistMatches(userId: string) {
    const res = await fetch(`/api/users/${userId}/wishlist/matches`, { headers: { ...authHeaders } });
    setWishlistMatches(await res.json());
  }

  async function getProducts(storefrontId: string) {
    const res = await fetch(`/api/storefronts/${storefrontId}/products`, { headers: { ...authHeaders } });
    setProducts(await res.json());
  }

  return (
    <div style={{ fontFamily: 'system-ui, Arial, sans-serif', padding: 24, maxWidth: 900, margin: '0 auto' }}>
      <h2>SynC React UI (v0.1.3)</h2>
      <Section title="Auth">
        <label>
          Bearer token:
          <input
            style={{ width: '100%' }}
            placeholder="Bearer header value (e.g., Bearer <header>.<payload>.)"
            value={token}
            onChange={(e) => setToken(e.target.value)}
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
        </div>
        <pre>{JSON.stringify(reviewResult, null, 2)}</pre>
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
        <pre>{JSON.stringify(products, null, 2)}</pre>
      </Section>
    </div>
  );
}


