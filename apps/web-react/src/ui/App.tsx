import React, { useMemo, useState, useRef } from 'react';
import { createClient as createSupabaseBrowserClient } from '@supabase/supabase-js';

function Section({ title, children }: { title: string; children: any }) {
  return (
    <section className="card mb-4">
      <h3 className="mt-0 mb-2 text-base font-semibold">{title}</h3>
      {children}
    </section>
  );
}

export default function App() {
  const [token, setToken] = useState(() => {
    try { return localStorage.getItem('sync_token') || ''; } catch { return ''; }
  });
  const authHeaders = useMemo(() => (token ? { Authorization: token } : {}), [token]);

  const [storefront, setStorefront] = useState(null as any);
  const [activeTab, setActiveTab] = useState('auth');
  const [toast, setToast] = useState('');
  const toastTimerRef = useRef(null as any);
  const [sessionUserId, setSessionUserId] = useState('');
  const [sessionBusinessId, setSessionBusinessId] = useState('');
  const [reviewResult, setReviewResult] = useState(null as any);
  const [reviewsList, setReviewsList] = useState(null as any);
  const [wishlistMatches, setWishlistMatches] = useState(null as any);
  const [products, setProducts] = useState(null as any);
  const [notifications, setNotifications] = useState(null as any);
  const [unreadCount, setUnreadCount] = useState(0 as any);
  const [reviewsSummary, setReviewsSummary] = useState(null as any);
  const [adsResult, setAdsResult] = useState(null as any);
  const [trendsResult, setTrendsResult] = useState(null as any);
  const [pricingResult, setPricingResult] = useState(null as any);
  const [offersResult, setOffersResult] = useState(null as any);
  const [authResult, setAuthResult] = useState(null as any);
  const initialSbUrl = (() => { try { const anyImport: any = (import.meta as any); return anyImport?.env?.VITE_SUPABASE_URL || ''; } catch { return ''; } })();
  const initialSbAnon = (() => { try { const anyImport: any = (import.meta as any); return anyImport?.env?.VITE_SUPABASE_ANON_KEY || ''; } catch { return ''; } })();
  const [sbUrl, setSbUrl] = useState(initialSbUrl as string);
  const [sbAnon, setSbAnon] = useState(initialSbAnon as string);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPwd, setLoginPwd] = useState('');

  async function postStorefront() {
    const res = await fetch('/api/business/storefront', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders },
      body: JSON.stringify({ description: 'React SF', theme: 'light', is_open: true }),
    });
    const j = await res.json();
    setStorefront(j);
    if (j?.storefront?.business_id) setSessionBusinessId(String(j.storefront.business_id));
    if (!j?.ok) showToast(j?.error || 'Storefront error');
  }

  async function signup() {
    const email = (document.getElementById('authEmail') as HTMLInputElement)?.value?.trim();
    const role = (document.getElementById('authRole') as HTMLInputElement)?.value?.trim();
    if (!email) { alert('email required'); return; }
    const res = await fetch('/api/auth/signup', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, role }) });
    const j = await res.json();
    setAuthResult(j);
    if (j?.bearer) {
      setToken(j.bearer);
      try { localStorage.setItem('sync_token', j.bearer); } catch {}
    }
  }

  async function login() {
    const email = (document.getElementById('authEmail') as HTMLInputElement)?.value?.trim();
    const role = (document.getElementById('authRole') as HTMLInputElement)?.value?.trim();
    if (!email) { alert('email required'); return; }
    const res = await fetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, role }) });
    const j = await res.json();
    setAuthResult(j);
    if (j?.bearer) {
      setToken(j.bearer);
      try { localStorage.setItem('sync_token', j.bearer); } catch {}
    }
  }

  async function loginSupabase() {
    try {
      const url = sbUrl?.trim();
      const anon = sbAnon?.trim();
      if (!url || !anon) { alert('Set Supabase URL and Anon key first'); return; }
      const email = loginEmail.trim();
      const password = loginPwd.trim();
      if (!email || !password) { alert('Enter email and password'); return; }
      const supa = createSupabaseBrowserClient(url, anon, { auth: { persistSession: false } });
      const { data, error } = await supa.auth.signInWithPassword({ email, password });
      if (error) { setAuthResult({ ok: false, error: error.message }); return; }
      const access = data?.session?.access_token;
      if (!access) { setAuthResult({ ok: false, error: 'No access_token' }); return; }
      const bearer = `Bearer ${access}`;
      setAuthResult({ ok: true, mode: 'supabase', user_id: data.user?.id });
      if (data?.user?.id) setSessionUserId(String(data.user.id));
      setToken(bearer);
      try { localStorage.setItem('sync_token', bearer); } catch {}
    } catch (e: any) {
      setAuthResult({ ok: false, error: e?.message || 'Login error' });
      showToast(e?.message || 'Login error');
    }
  }

  async function postAd() {
    const title = (document.getElementById('adTitle') as HTMLInputElement)?.value?.trim();
    const description = (document.getElementById('adDesc') as HTMLInputElement)?.value?.trim();
    const image = (document.getElementById('adImg') as HTMLInputElement)?.value?.trim();
    if (!title) { alert('title required'); return; }
    const res = await fetch('/api/business/ads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders },
      body: JSON.stringify({ title, description, image_url: image || null })
    });
    setAdsResult(await res.json());
  }

  async function createOffer() {
    const title = (document.getElementById('offerTitle') as HTMLInputElement)?.value?.trim();
    const qtyStr = (document.getElementById('offerQty') as HTMLInputElement)?.value?.trim();
    if (!title) { showToast('title required'); return; }
    const total_quantity = qtyStr && !Number.isNaN(Number(qtyStr)) ? Number(qtyStr) : undefined;
    const res = await fetch('/api/business/offers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders },
      body: JSON.stringify({ title, total_quantity })
    });
    const j = await res.json();
    setOffersResult(j);
    if (!j?.ok) showToast(j?.error || 'Offer create error');
  }

  async function generateOfferCoupons() {
    const offerId = (document.getElementById('offerId') as HTMLInputElement)?.value?.trim();
    const qtyStr = (document.getElementById('offerGenQty') as HTMLInputElement)?.value?.trim();
    if (!offerId) { showToast('offerId required'); return; }
    const total_quantity = qtyStr && !Number.isNaN(Number(qtyStr)) ? Number(qtyStr) : undefined;
    const res = await fetch(`/api/business/offers/${offerId}/coupons`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders },
      body: JSON.stringify({ total_quantity })
    });
    const j = await res.json();
    setOffersResult(j);
    if (!j?.ok) showToast(j?.error || 'Generate coupons error');
  }

  async function getTrends() {
    const bizId = (document.getElementById('trendBizId') as HTMLInputElement)?.value?.trim();
    const group = (document.getElementById('trendGroupBiz') as HTMLInputElement)?.checked ? 'business' : '';
    const params = new URLSearchParams();
    if (bizId) params.set('businessId', bizId);
    if (group) params.set('group', group);
    const qs = params.toString() ? `?${params.toString()}` : '';
    const res = await fetch(`/api/business/analytics/trends${qs}`, { headers: { ...authHeaders } });
    const j = await res.json();
    setTrendsResult(j);
    if (!j?.ok) showToast(j?.error || 'Trends fetch error');
  }

  async function putPricing() {
    const txt = (document.getElementById('pricingJson') as HTMLTextAreaElement)?.value;
    let payload: any;
    try { payload = JSON.parse(txt || '{}'); } catch { alert('Invalid JSON'); return; }
    const res = await fetch('/api/platform/config/pricing', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...authHeaders },
      body: JSON.stringify(payload),
    });
    const j = await res.json();
    setPricingResult(j);
    if (!j?.ok) showToast(j?.error || 'Pricing error');
  }

  async function getStorefront() {
    const res = await fetch('/api/business/storefront', { headers: { ...authHeaders } });
    const j = await res.json();
    setStorefront(j);
    if (j?.storefront?.business_id) setSessionBusinessId(String(j.storefront.business_id));
    if (!j?.ok) showToast(j?.error || 'Storefront fetch error');
  }

  async function postReview(businessId: string) {
    const res = await fetch(`/api/business/${businessId}/reviews`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders },
      body: JSON.stringify({ recommend_status: true, review_text: 'Great place!' }),
    });
    const j = await res.json();
    setReviewResult(j);
    if (!j?.ok) showToast(j?.error || 'Review error');
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
    const list = await res.json();
    setReviewsList(list);
    if (!list?.ok) showToast(list?.error || 'Reviews fetch error');
    // Fetch summary
    const resSum = await fetch(`/api/business/${businessId}/analytics/reviews`, { headers: { ...authHeaders } });
    setReviewsSummary(await resSum.json());
  }

  async function getWishlistMatches(userId: string) {
    const res = await fetch(`/api/users/${userId}/wishlist/matches`, { headers: { ...authHeaders } });
    const j = await res.json();
    setWishlistMatches(j);
    if (!j?.ok) showToast(j?.error || 'Matches fetch error');
  }

  async function getProducts(storefrontId: string) {
    const res = await fetch(`/api/storefronts/${storefrontId}/products`, { headers: { ...authHeaders } });
    const j = await res.json();
    setProducts(j);
    if (!j?.ok) showToast(j?.error || 'Products fetch error');
  }

  async function getNotifications(userId: string) {
    try {
      const res = await fetch(`/api/users/${userId}/notifications`, { headers: { ...authHeaders } });
      const text = await res.text();
      let j: any;
      try { j = text ? JSON.parse(text) : { ok: false, error: 'Empty response', status: res.status }; }
      catch { j = { ok: false, error: text || 'Non-JSON response', status: res.status }; }
      setNotifications(j);
      // Also refresh unread count
      await refreshUnread(userId);
    } catch (e: any) {
      setNotifications({ ok: false, error: e?.message || 'Fetch error' });
    }
  }

  async function clearNotifications(userId: string) {
    try {
      const res = await fetch(`/api/users/${userId}/notifications`, { method: 'DELETE', headers: { ...authHeaders } });
      const text = await res.text();
      let j: any;
      try { j = text ? JSON.parse(text) : { ok: false, error: 'Empty response', status: res.status }; }
      catch { j = { ok: false, error: text || 'Non-JSON response', status: res.status }; }
      setNotifications(j);
      await refreshUnread(userId);
    } catch (e: any) {
      setNotifications({ ok: false, error: e?.message || 'Fetch error' });
    }
  }

  async function markRead(userId: string) {
    const res = await fetch(`/api/users/${userId}/notifications/read`, { method: 'PUT', headers: { ...authHeaders } });
    const j = await res.json();
    setNotifications(j);
    await refreshUnread(userId);
    if (!j?.ok) showToast(j?.error || 'Mark read error');
  }

  async function markItemRead(userId: string, notificationId: string) {
    const res = await fetch(`/api/users/${userId}/notifications/${notificationId}/read`, { method: 'PUT', headers: { ...authHeaders } });
    const j = await res.json();
    setNotifications(j);
    await refreshUnread(userId);
    if (!j?.ok) showToast(j?.error || 'Mark item read error');
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

  function showToast(message: string) {
    try { if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current as any); } catch {}
    setToast(message);
    try {
      const id = window.setTimeout(() => setToast(''), 3000);
      // @ts-ignore
      toastTimerRef.current = id as any;
    } catch {}
  }

  function parseUserIdFromBearer(): string {
    try {
      const prefix = 'Bearer ';
      if (!token || !token.startsWith(prefix)) return sessionUserId || '';
      const parts = token.slice(prefix.length).split('.');
      if (parts.length < 2) return sessionUserId || '';
      const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
      return String(payload?.sub || '') || sessionUserId || '';
    } catch { return sessionUserId || ''; }
  }

  return (
    <div className="min-h-screen mx-auto max-w-5xl p-6">
      <h2 className="text-xl font-semibold">SynC React UI (v0.1.5)</h2>
      {/* Tabs */}
      <div className="flex flex-wrap gap-2 mb-3">
        {['auth','session','storefront','reviews','wishlist','notifications','products','ads','offers','trends','pricing','health'].map((t) => (
          <button key={t} onClick={() => setActiveTab(t as any)} className={`btn ${activeTab===t ? 'opacity-100' : 'opacity-70'}`}>{t}</button>
        ))}
      </div>
      {toast ? (
        <div style={{ background:'#fee', color:'#900', padding: 8, border: '1px solid #f99', borderRadius: 6, marginBottom: 12 }}>{toast}</div>
      ) : null}

      <Section title="Auth">
        {activeTab !== 'auth' ? null : (
        <>
        <label>
          Bearer token:
          <input
            style={{ width: '100%' }}
            placeholder="Bearer header value (e.g., Bearer <header>.<payload>.)"
            value={token}
            onChange={(e: any) => {
              const v = (e.target as HTMLInputElement).value;
              setToken(v);
              try { if (v) localStorage.setItem('sync_token', v); else localStorage.removeItem('sync_token'); } catch {}
            }}
          />
        </label>
        <div className="grid grid-cols-3 gap-2 mt-2">
          <input id="authEmail" placeholder="email for signup/login" className="input" />
          <input id="authRole" placeholder="role (optional, e.g., owner)" className="input" />
          <div className="flex gap-2">
            <button className="btn" onClick={signup}>signup</button>
            <button className="btn" onClick={login}>login</button>
          </div>
        </div>
        <div className="mt-2 p-2 border border-dashed border-[color:var(--border)] rounded-md">
          <div style={{ marginBottom: 4, fontWeight: 600 }}>Real Supabase Auth (recommended)</div>
          <div className="grid grid-cols-2 gap-2">
            <input className="input" placeholder="VITE_SUPABASE_URL (or paste here)" value={sbUrl} onChange={(e) => setSbUrl((e.target as HTMLInputElement).value)} />
            <input className="input" placeholder="VITE_SUPABASE_ANON_KEY (or paste here)" value={sbAnon} onChange={(e) => setSbAnon((e.target as HTMLInputElement).value)} />
          </div>
          <div className="grid grid-cols-3 gap-2 mt-2">
            <input className="input" placeholder="email" value={loginEmail} onChange={(e) => setLoginEmail((e.target as HTMLInputElement).value)} />
            <input className="input" placeholder="password" type="password" value={loginPwd} onChange={(e) => setLoginPwd((e.target as HTMLInputElement).value)} />
            <div className="flex gap-2">
              <button className="btn" onClick={loginSupabase}>login with Supabase</button>
              <button className="btn" onClick={() => { setToken(''); try { localStorage.removeItem('sync_token'); } catch {} }}>sign out</button>
            </div>
          </div>
        </div>
        <pre>{JSON.stringify(authResult, null, 2)}</pre>
        </>
        )}
      </Section>

      <Section title="Session info">
        {activeTab !== 'session' ? null : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 6 }}>
            <div><strong>userId</strong>: {parseUserIdFromBearer() || sessionUserId || '(not set)'}</div>
            <div><strong>businessId</strong>: {sessionBusinessId || '(fetch storefront)'}</div>
          </div>
        </>
        )}
      </Section>

      <Section title="Storefront (owner)">
        {activeTab !== 'storefront' ? null : (
        <>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={postStorefront}>POST upsert</button>
          <button onClick={getStorefront}>GET</button>
        </div>
        <pre>{JSON.stringify(storefront, null, 2)}</pre>
        </>
        )}
      </Section>

      <Section title="Reviews">
        {activeTab !== 'reviews' ? null : (
        <>
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
        </>
        )}
      </Section>

      <Section title="Wishlist Matches">
        {activeTab !== 'wishlist' ? null : (
        <>
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
        </>
        )}
      </Section>

      <Section title={`Notifications${unreadCount ? ` (${unreadCount} unread)` : ''}`}>
        {activeTab !== 'notifications' ? null : (
        <>
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
            (notifications.items as any[]).length ? (
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
              <div style={{ color: '#666' }}>(no notifications)</div>
            )
          ) : (
            <pre>{JSON.stringify(notifications, null, 2)}</pre>
          )}
        </div>
        </>
        )}
      </Section>

      <Section title="Storefront Products">
        {activeTab !== 'products' ? null : (
        <>
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
        </>
        )}
      </Section>

      <Section title="Ads (owner)">
        {activeTab !== 'ads' ? null : (
        <>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
          <input id="adTitle" placeholder="title" />
          <input id="adDesc" placeholder="description" />
          <input id="adImg" placeholder="image_url (http...)" />
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          <button onClick={postAd}>POST ad</button>
        </div>
        <pre>{JSON.stringify(adsResult, null, 2)}</pre>
        </>
        )}
      </Section>

      <Section title="Offers (owner)">
        {activeTab !== 'offers' ? null : (
        <>
        <div className="grid grid-cols-3 gap-2">
          <input id="offerTitle" className="input" placeholder="offer title" />
          <input id="offerQty" className="input" placeholder="total_quantity (optional)" />
          <button className="btn" onClick={createOffer}>POST offer</button>
        </div>
        <div className="grid grid-cols-3 gap-2 mt-2">
          <input id="offerId" className="input" placeholder="offerId" />
          <input id="offerGenQty" className="input" placeholder="generate total_quantity (optional)" />
          <button className="btn" onClick={generateOfferCoupons}>POST generate coupons</button>
        </div>
        <pre>{JSON.stringify(offersResult, null, 2)}</pre>
        </>
        )}
      </Section>

      <Section title="Analytics Trends">
        {activeTab !== 'trends' ? null : (
        <>
        <div style={{ display: 'flex', gap: 8 }}>
          <input id="trendBizId" placeholder="businessId (optional)" />
          <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <input type="checkbox" id="trendGroupBiz" /> group by business
          </label>
          <button onClick={getTrends}>GET trends</button>
        </div>
        <pre>{JSON.stringify(trendsResult, null, 2)}</pre>
        </>
        )}
      </Section>

      <Section title="Platform Pricing (owner)">
        {activeTab !== 'pricing' ? null : (
        <>
        <textarea id="pricingJson" style={{ width: '100%', height: 120 }} defaultValue={'{"tiers":[{"name":"basic","price":0},{"name":"pro","price":1000}]}' as any} />
        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          <button onClick={putPricing}>PUT pricing</button>
        </div>
        <pre>{JSON.stringify(pricingResult, null, 2)}</pre>
        </>
        )}
      </Section>

      <Section title="Platform Health">
        {activeTab !== 'health' ? null : (
        <>
          <button onClick={async () => {
            const res = await fetch('/api/platform/health');
            const j = await res.json();
            setPricingResult(j);
          }}>GET health</button>
          <pre>{JSON.stringify(pricingResult, null, 2)}</pre>
        </>
        )}
      </Section>
    </div>
  );
}


