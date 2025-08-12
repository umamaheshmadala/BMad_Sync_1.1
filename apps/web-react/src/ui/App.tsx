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
  const [unreadCount, setUnreadCount] = useState(0 as any);
  const [reviewsSummary, setReviewsSummary] = useState(null as any);

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
    const limit = (document.getElementById('revLimit') as HTMLInputElement)?.value || '10';
    const offset = (document.getElementById('revOffset') as HTMLInputElement)?.value || '0';
    const params = new URLSearchParams();
    if (filter) params.set('recommend', filter);
    if (limit) params.set('limit', String(limit));
    if (offset) params.set('offset', String(offset));
    const qs = params.toString() ? `?${params.toString()}` : '';
    const res = await fetch(`/api/business/${businessId}/reviews${qs}`, { headers: { ...authHeaders } });
    setReviewsList(await res.json());
    // Fetch summary
    const resSum = await fetch(`/api/business/${businessId}/analytics/reviews`, { headers: { ...authHeaders } });
    setReviewsSummary(await resSum.json());
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
    const j = await res.json();
    setNotifications(j);
    // Also refresh unread count
    await refreshUnread(userId);
  }

  async function clearNotifications(userId: string) {
    const res = await fetch(`/api/users/${userId}/notifications`, { method: 'DELETE', headers: { ...authHeaders } });
    const j = await res.json();
    setNotifications(j);
    await refreshUnread(userId);
  }

  async function markRead(userId: string) {
    const res = await fetch(`/api/users/${userId}/notifications/read`, { method: 'PUT', headers: { ...authHeaders } });
    const j = await res.json();
    setNotifications(j);
    await refreshUnread(userId);
  }

  async function markItemRead(userId: string, notificationId: string) {
    const res = await fetch(`/api/users/${userId}/notifications/${notificationId}/read`, { method: 'PUT', headers: { ...authHeaders } });
    const j = await res.json();
    setNotifications(j);
    await refreshUnread(userId);
  }

  async function refreshUnread(userId: string) {
    const res = await fetch(`/api/users/${userId}/notifications?unread=true&limit=100`, { headers: { ...authHeaders } });
    const j = await res.json();
    if (j && j.items) setUnreadCount((j.items as any[]).length);
  }

  function formatTs(ts?: string) {
    if (!ts) return '';
    try { return new Date(ts).toLocaleString(); } catch { return ts; }
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
          <input id="revLimit" placeholder="limit" defaultValue={10 as any} style={{ width: 64 }} />
          <input id="revOffset" placeholder="offset" defaultValue={0 as any} style={{ width: 72 }} />
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
        {reviewsSummary?.ok && (
          <div style={{ marginTop: 8 }}>
            <strong>Summary:</strong>{' '}
            <span style={{ color: '#2a2' }}>Recommend: {reviewsSummary.summary?.recommend ?? 0}</span>{' '}
            <span style={{ color: '#a22' }}>Not: {reviewsSummary.summary?.not_recommend ?? 0}</span>
          </div>
        )}
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

      <Section title={`Notifications${unreadCount ? ` (${unreadCount} unread)` : ''}`}>
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
          <button
            onClick={() => {
              const id = (document.getElementById('notifUserId') as HTMLInputElement)?.value;
              if (id) clearNotifications(id);
            }}
          >
            CLEAR notifications
          </button>
          <button
            onClick={() => {
              const id = (document.getElementById('notifUserId') as HTMLInputElement)?.value;
              if (id) markRead(id);
            }}
          >
            MARK ALL READ
          </button>
        </div>
        <div>
          {Array.isArray(notifications?.items) ? (
            <ul>
              {(notifications.items as any[]).map((n: any) => (
                <li key={n.id} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span>[{n.notification_type}]</span>
                  <span>{n.message}</span>
                  <span style={{ fontSize: 12, color: '#666' }}>{formatTs(n.created_at)}</span>
                  {n.read_at ? (
                    <span style={{ fontSize: 12, color: '#2a2' }}>(read)</span>
                  ) : (
                    <button
                      onClick={() => {
                        const id = (document.getElementById('notifUserId') as HTMLInputElement)?.value;
                        if (id) markItemRead(id, n.id);
                      }}
                    >
                      mark read
                    </button>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <pre>{JSON.stringify(notifications, null, 2)}</pre>
          )}
        </div>
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
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginTop: 8 }}>
          <input id="prodName" placeholder="product_name (min 2 chars)" />
          <input id="prodCat" placeholder="category" />
          <input id="prodDesc" placeholder="product_description (<= 200 chars)" />
          <input id="prodImg" placeholder="product_image_url (http...)" />
          <input id="prodSub1" placeholder="subcategory_l1" />
          <input id="prodSub2" placeholder="subcategory_l2" />
          <input id="prodOrder" placeholder="display_order (number)" />
          <label style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <input type="checkbox" id="prodTrending" /> trending
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <input type="checkbox" id="prodSuggested" /> suggested
          </label>
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          <button
            onClick={async () => {
              const sfId = (document.getElementById('sfId') as HTMLInputElement)?.value;
              const name = (document.getElementById('prodName') as HTMLInputElement)?.value?.trim();
              const cat = (document.getElementById('prodCat') as HTMLInputElement)?.value?.trim();
              const desc = (document.getElementById('prodDesc') as HTMLInputElement)?.value?.trim();
              const img = (document.getElementById('prodImg') as HTMLInputElement)?.value?.trim();
              const sub1 = (document.getElementById('prodSub1') as HTMLInputElement)?.value?.trim();
              const sub2 = (document.getElementById('prodSub2') as HTMLInputElement)?.value?.trim();
              const orderStr = (document.getElementById('prodOrder') as HTMLInputElement)?.value?.trim();
              const trending = (document.getElementById('prodTrending') as HTMLInputElement)?.checked;
              const suggested = (document.getElementById('prodSuggested') as HTMLInputElement)?.checked;

              if (!sfId) { alert('storefrontId required'); return; }
              if (!name || name.length < 2) { alert('product_name required (min 2 chars)'); return; }
              if (desc && desc.length > 200) { alert('product_description must be <= 200 chars'); return; }
              if (img && !/^https?:\/\//i.test(img)) { alert('product_image_url must start with http or https'); return; }
              const display_order = orderStr && !Number.isNaN(Number(orderStr)) ? Number(orderStr) : undefined;

              const payload: any = {
                product_name: name,
                product_description: desc || null,
                product_image_url: img || null,
                category: cat || null,
                subcategory_l1: sub1 || null,
                subcategory_l2: sub2 || null,
                display_order,
                is_trending: !!trending,
                suggested: !!suggested,
              };

              const res = await fetch(`/api/storefronts/${sfId}/products`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...authHeaders },
                body: JSON.stringify({ items: [payload] }),
              });
              const j = await res.json();
              // Refresh list after successful post
              if (j?.ok) {
                await getProducts(sfId);
              }
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


