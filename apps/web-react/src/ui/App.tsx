import React, { useMemo, useState, useRef, useEffect } from 'react';
import { createClient as createSupabaseBrowserClient } from '@supabase/supabase-js';

function Section({ title, children }: { title: string; children: any }) {
  return (
    <section className="card mb-4">
      <h3 className="mt-0 mb-2 text-base font-semibold">{title}</h3>
      {children}
    </section>
  );
}

function CopyButton({ getText }: { getText: () => string }) {
  return (
    <button
      className="btn"
      onClick={() => {
        try { const txt = getText(); if (txt) { (navigator as any)?.clipboard?.writeText(txt); } } catch {}
      }}
      style={{ marginBottom: 6 }}
      title="Copy"
    >copy</button>
  );
}

function CopyCurlButton({ tag, getCurl }: { tag: string; getCurl: (t: string) => string | undefined }) {
  const curl = getCurl(tag) || '';
  const disabled = !curl;
  return (
    <button
      className="btn"
      disabled={disabled}
      title={disabled ? 'Run the action first to generate cURL' : 'Copy cURL'}
      onClick={() => { if (curl) { try { (navigator as any)?.clipboard?.writeText(curl); } catch {} } }}
    >copy cURL</button>
  );
}

export default function App() {
  const [token, setToken] = useState(() => {
    try { return localStorage.getItem('sync_token') || ''; } catch { return ''; }
  });
  const authHeaders = useMemo(() => (token ? { Authorization: token } : {}), [token]);

  const [storefront, setStorefront] = useState(null as any);
  const [activeTab, setActiveTab] = useState('auth');
  const [toast, setToast] = useState(null as null | { text: string; type: 'success' | 'error' });
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
  const [funnelResult, setFunnelResult] = useState(null as any);
  const [analyticsSinceDays, setAnalyticsSinceDays] = useState(7 as number);
  const [isLoadingTrends, setIsLoadingTrends] = useState(false as boolean);
  const [isLoadingFunnel, setIsLoadingFunnel] = useState(false as boolean);
	const [lastMeta, setLastMeta] = useState(null as any);
  const [lastCurl, setLastCurl] = useState('' as string);
	const [curlOpen, setCurlOpen] = useState(false as boolean);
  type CurlMap = Record<string, string>;
  const [curlByAction, setCurlByAction] = useState({} as CurlMap);
  const getCurl = (t: string) => curlByAction[t];

  function buildCurl(url: string, init?: RequestInit): string {
    try {
      const method = (init?.method || 'GET').toUpperCase();
      const absUrl = new URL(url, window.location.origin).toString();
      const headers = new Headers(init?.headers || {});
      const parts: string[] = [];
      parts.push(`curl -X ${method} "${absUrl}"`);
      headers.forEach((value, key) => {
        parts.push(`-H "${key}: ${value}"`);
      });
      const body: any = (init as any)?.body;
      if (typeof body === 'string' && body.length > 0) {
        parts.push(`--data-raw '${body}'`);
      }
      return parts.join(' ');
    } catch {
      return '';
    }
  }

  async function apiFetch(url: string, init?: RequestInit): Promise<Response> {
    const res = await fetch(url, init);
    try { setLastCurl(buildCurl(url, init)); } catch {}
    recordHeaders(res);
    return res;
  }

  async function actionFetch(tag: string, url: string, init?: RequestInit): Promise<Response> {
    const res = await apiFetch(url, init);
    try {
      const curl = buildCurl(url, init);
      setCurlByAction((prev: CurlMap) => ({ ...prev, [tag]: curl }));
    } catch {}
    return res;
  }
  function recordHeaders(res: Response) {
    try {
      const meta = {
        url: (res as any).url || '',
        status: res.status,
        x_request_id: res.headers.get('x-request-id') || '',
        ratelimit_limit: res.headers.get('RateLimit-Limit') || '',
        ratelimit_remaining: res.headers.get('RateLimit-Remaining') || '',
        ratelimit_reset: res.headers.get('RateLimit-Reset') || '',
        cache_control: res.headers.get('Cache-Control') || '',
      };
      setLastMeta(meta);
      try { (window as any).lastMeta = meta; } catch {}
    } catch {}
  }
  const [pricingResult, setPricingResult] = useState(null as any);
  const [offersResult, setOffersResult] = useState(null as any);
  const [redeemResult, setRedeemResult] = useState(null as any);
  const [revenueResult, setRevenueResult] = useState(null as any);
  const [platformConfigResult, setPlatformConfigResult] = useState(null as any);
  const [ratelimitResult, setRatelimitResult] = useState(null as any);
  const [couponAnalytics, setCouponAnalytics] = useState(null as any);
  const [healthResult, setHealthResult] = useState(null as any);
  const [authResult, setAuthResult] = useState(null as any);
  const initialSbUrl = (() => { try { const anyImport: any = (import.meta as any); return anyImport?.env?.VITE_SUPABASE_URL || ''; } catch { return ''; } })();
  const initialSbAnon = (() => { try { const anyImport: any = (import.meta as any); return anyImport?.env?.VITE_SUPABASE_ANON_KEY || ''; } catch { return ''; } })();
  const [sbUrl, setSbUrl] = useState(initialSbUrl as string);
  const [sbAnon, setSbAnon] = useState(initialSbAnon as string);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPwd, setLoginPwd] = useState('');
  type Theme = 'cosmic' | 'daylight' | 'ocean';
  const initialTheme: Theme = (() => {
    try {
      const t = (localStorage.getItem('sync_theme') as any) || 'cosmic';
      return (t === 'cosmic' || t === 'daylight' || t === 'ocean') ? (t as Theme) : 'cosmic';
    } catch { return 'cosmic'; }
  })();
  const [theme, setTheme] = useState(initialTheme as Theme);

  async function postStorefront() {
    const res = await actionFetch('storefront:post', '/api/business/storefront', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders },
      body: JSON.stringify({ description: 'React SF', theme: 'light', is_open: true }),
    });
    const j = await res.json();
    setStorefront(j);
    if (j?.storefront?.business_id) setSessionBusinessId(String(j.storefront.business_id));
    if (j?.ok) showToast('Storefront upserted', 'success');
    else showToast(j?.error || 'Storefront error', 'error');
  }

  async function signup() {
    const email = (document.getElementById('authEmail') as HTMLInputElement)?.value?.trim();
    const role = (document.getElementById('authRole') as HTMLInputElement)?.value?.trim();
    if (!email) { alert('email required'); return; }
    const res = await apiFetch('/api/auth/signup', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, role }) });
    const j = await res.json();
    setAuthResult(j);
    if (j?.bearer) {
      setToken(j.bearer);
      try { localStorage.setItem('sync_token', j.bearer); } catch {}
      showToast('Signed up', 'success');
    }
  }

  async function login() {
    const email = (document.getElementById('authEmail') as HTMLInputElement)?.value?.trim();
    const role = (document.getElementById('authRole') as HTMLInputElement)?.value?.trim();
    if (!email) { alert('email required'); return; }
    const res = await apiFetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, role }) });
    const j = await res.json();
    setAuthResult(j);
    if (j?.bearer) {
      setToken(j.bearer);
      try { localStorage.setItem('sync_token', j.bearer); } catch {}
      showToast('Logged in', 'success');
    }
  }

  function base64Url(json: string): string {
    try { return btoa(json).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, ''); } catch { return ''; }
  }

  function makeUnsignedBearer(sub: string, role?: string): string {
    const header = base64Url(JSON.stringify({ alg: 'none', typ: 'JWT' }));
    const payload = base64Url(JSON.stringify(role ? { sub, role } : { sub }));
    return `Bearer ${header}.${payload}.`;
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
    const res = await actionFetch('ads:post', '/api/business/ads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders },
      body: JSON.stringify({ title, description, image_url: image || null })
    });
    const j = await res.json();
    setAdsResult(j);
    if (j?.ok) showToast('Ad created', 'success');
    else showToast(j?.error || 'Ads create error', 'error');
  }

  async function createOffer() {
    const title = (document.getElementById('offerTitle') as HTMLInputElement)?.value?.trim();
    const qtyStr = (document.getElementById('offerQty') as HTMLInputElement)?.value?.trim();
    if (!title) { showToast('title required'); return; }
    const total_quantity = qtyStr && !Number.isNaN(Number(qtyStr)) ? Number(qtyStr) : undefined;
    const res = await actionFetch('offers:create', '/api/business/offers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders },
      body: JSON.stringify({ title, total_quantity })
    });
    const j = await res.json();
    setOffersResult(j);
    if (j?.ok) showToast('Offer created', 'success');
    else showToast(j?.error || 'Offer create error', 'error');
  }

  async function generateOfferCoupons() {
    const offerId = (document.getElementById('offerId') as HTMLInputElement)?.value?.trim();
    const qtyStr = (document.getElementById('offerGenQty') as HTMLInputElement)?.value?.trim();
    if (!offerId) { showToast('offerId required'); return; }
    const total_quantity = qtyStr && !Number.isNaN(Number(qtyStr)) ? Number(qtyStr) : undefined;
    const res = await actionFetch('offers:generate', `/api/business/offers/${offerId}/coupons`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders },
      body: JSON.stringify({ total_quantity })
    });
    const j = await res.json();
    setOffersResult(j);
    if (j?.ok) showToast('Coupons generated', 'success');
    else showToast(j?.error || 'Generate coupons error', 'error');
  }

  async function collectCoupon() {
    const couponId = (document.getElementById('collectCouponId') as HTMLInputElement)?.value?.trim();
    const userId = parseUserIdFromBearer();
    if (!userId) { showToast('Set a valid Bearer token (Auth tab)'); return; }
    if (!couponId) { showToast('coupon_id required'); return; }
    const res = await actionFetch('offers:collect', `/api/users/${userId}/coupons/collect`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders },
      body: JSON.stringify({ coupon_id: couponId })
    });
    const j = await res.json();
    setOffersResult(j);
    if (j?.ok) showToast('Collected to wallet', 'success');
    else showToast(j?.error || 'Collect error', 'error');
  }

  async function redeemAtBusiness() {
    const unique = (document.getElementById('redeemCode') as HTMLInputElement)?.value?.trim();
    const biz = (document.getElementById('redeemBizId') as HTMLInputElement)?.value?.trim();
    if (!unique || !biz) { showToast('unique_code and businessId required'); return; }
    const res = await actionFetch('offers:redeem', `/api/business/${biz}/redeem`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders },
      body: JSON.stringify({ unique_code: unique })
    });
    const j = await res.json();
    setRedeemResult(j);
    if (j?.ok) showToast('Redeemed successfully', 'success');
    else showToast(j?.error || 'Redeem error', 'error');
  }

  async function getRevenue() {
    const res = await actionFetch('platform:revenue', '/api/platform/revenue', { headers: { ...authHeaders } });
    const j = await res.json();
    setRevenueResult(j);
  }

  async function getCouponAnalytics() {
    const biz = (document.getElementById('redeemBizId') as HTMLInputElement)?.value?.trim();
    if (!biz) { showToast('businessId required'); return; }
    const res = await actionFetch('analytics:coupons', `/api/business/${biz}/analytics/coupons`, { headers: { ...authHeaders } });
    const j = await res.json();
    setCouponAnalytics(j);
  }

  async function getRateLimitDiagnostics() {
    const res = await actionFetch('platform:ratelimit', '/api/platform/ratelimit', { headers: { ...authHeaders } });
    const j = await res.json();
    setRatelimitResult(j);
    if (!j?.ok) showToast(j?.error || 'Rate limit diagnostics error');
  }

  function exportRateLimitCsv() {
    try {
      const rows: any[] = Array.isArray((ratelimitResult as any)?.top_counters) ? (ratelimitResult as any).top_counters : [];
      if (!rows.length) { showToast('No counters to export'); return; }
      const headers = Object.keys(rows[0] || {});
      const escape = (v: any) => {
        const s = v == null ? '' : String(v);
        // Use JSON.stringify for robust escaping of quotes/commas/newlines
        return JSON.stringify(s);
      };
      const lines = [headers.join(',')].concat(rows.map(r => headers.map(h => escape((r as any)[h])).join(',')));
      const csv = lines.join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ratelimit_counters_${Date.now()}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      showToast('Exported CSV', 'success');
    } catch (e: any) {
      showToast(e?.message || 'CSV export error');
    }
  }

  function exportRateLimitJson() {
    try {
      const data = ratelimitResult ?? {};
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ratelimit_${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
      showToast('Exported JSON', 'success');
    } catch (e: any) {
      showToast(e?.message || 'JSON export error');
    }
  }

  async function getPlatformConfig() {
    const res = await actionFetch('platform:config', '/api/platform/config', { headers: { ...authHeaders } });
    const j = await res.json();
    setPlatformConfigResult(j);
  }

  async function getTrends() {
    setIsLoadingTrends(true);
    const bizId = (document.getElementById('trendBizId') as HTMLInputElement)?.value?.trim();
    const group = (document.getElementById('trendGroupBiz') as HTMLInputElement)?.checked ? 'business' : '';
    const params = new URLSearchParams();
    if (bizId) params.set('businessId', bizId);
    if (group) params.set('group', group);
    if (!params.has('sinceDays')) params.set('sinceDays', String(analyticsSinceDays || 7));
    const qs = params.toString() ? `?${params.toString()}` : '';
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 10000);
    try {
      const res = await actionFetch('analytics:trends', `/api/business/analytics/trends${qs}`, { headers: { ...authHeaders }, signal: controller.signal } as any);
      recordHeaders(res);
      const j = await res.json();
      setTrendsResult(j);
      if (!j?.ok) showToast(j?.error || 'Trends fetch error');
    } catch (e: any) {
      showToast(e?.name === 'AbortError' ? 'Trends timeout' : (e?.message || 'Trends error'));
    } finally {
      clearTimeout(timer);
    }
    setIsLoadingTrends(false);
  }

  async function getFunnel() {
    setIsLoadingFunnel(true);
    const bizId = (document.getElementById('funnelBizId') as HTMLInputElement)?.value?.trim();
    const group = (document.getElementById('funnelGroupBiz') as HTMLInputElement)?.checked ? 'business' : '';
    const params = new URLSearchParams();
    if (bizId) params.set('businessId', bizId);
    if (group) params.set('group', group);
    if (!params.has('sinceDays')) params.set('sinceDays', String(analyticsSinceDays || 7));
    const qs = params.toString() ? `?${params.toString()}` : '';
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 10000);
    try {
      const res = await actionFetch('analytics:funnel', `/api/business/analytics/funnel${qs}`, { headers: { ...authHeaders }, signal: controller.signal } as any);
      recordHeaders(res);
      const j = await res.json();
      setFunnelResult(j);
      if (!j?.ok) showToast(j?.error || 'Funnel fetch error');
    } catch (e: any) {
      showToast(e?.name === 'AbortError' ? 'Funnel timeout' : (e?.message || 'Funnel error'));
    } finally {
      clearTimeout(timer);
    }
    setIsLoadingFunnel(false);
  }

  async function putPricing() {
    const txt = (document.getElementById('pricingJson') as HTMLTextAreaElement)?.value;
    let payload: any;
    try { payload = JSON.parse(txt || '{}'); } catch { alert('Invalid JSON'); return; }
    const res = await actionFetch('platform:pricing', '/api/platform/config/pricing', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...authHeaders },
      body: JSON.stringify(payload),
    });
    const j = await res.json();
    setPricingResult(j);
    if (j?.ok) showToast('Pricing updated', 'success');
    else showToast(j?.error || 'Pricing error', 'error');
  }

  async function getStorefront() {
    const res = await actionFetch('storefront:get', '/api/business/storefront', { headers: { ...authHeaders } });
    const j = await res.json();
    setStorefront(j);
    if (j?.storefront?.business_id) setSessionBusinessId(String(j.storefront.business_id));
    if (!j?.ok) showToast(j?.error || 'Storefront fetch error', 'error');
  }

  async function postReview(businessId: string) {
    const res = await actionFetch('reviews:post', `/api/business/${businessId}/reviews`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders },
      body: JSON.stringify({ recommend_status: true, review_text: 'Great place!' }),
    });
    const j = await res.json();
    setReviewResult(j);
    if (j?.ok) showToast('Review submitted', 'success');
    else showToast(j?.error || 'Review error', 'error');
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
    const res = await actionFetch('reviews:get', `/api/business/${businessId}/reviews${qs}`, { headers: { ...authHeaders } });
    const list = await res.json();
    setReviewsList(list);
    if (!list?.ok) showToast(list?.error || 'Reviews fetch error', 'error');
    // Fetch summary
    const resSum = await actionFetch('analytics:reviews', `/api/business/${businessId}/analytics/reviews`, { headers: { ...authHeaders } });
    setReviewsSummary(await resSum.json());
  }

  async function getWishlistMatches(userId: string) {
    const res = await actionFetch('wishlist:matches', `/api/users/${userId}/wishlist/matches`, { headers: { ...authHeaders } });
    const j = await res.json();
    setWishlistMatches(j);
    if (!j?.ok) showToast(j?.error || 'Matches fetch error', 'error');
  }

  async function getProducts(storefrontId: string) {
    const res = await actionFetch('products:get', `/api/storefronts/${storefrontId}/products`, { headers: { ...authHeaders } });
    const j = await res.json();
    setProducts(j);
    if (!j?.ok) showToast(j?.error || 'Products fetch error', 'error');
  }

  async function getNotifications(userId: string) {
    try {
      const res = await fetch(`/api/users/${userId}/notifications`, { headers: { ...authHeaders } });
      recordHeaders(res);
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
      recordHeaders(res);
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
    if (j?.ok) showToast('Marked all read', 'success');
    else showToast(j?.error || 'Mark read error', 'error');
  }

  async function markItemRead(userId: string, notificationId: string) {
    const res = await fetch(`/api/users/${userId}/notifications/${notificationId}/read`, { method: 'PUT', headers: { ...authHeaders } });
    const j = await res.json();
    setNotifications(j);
    await refreshUnread(userId);
    if (j?.ok) showToast('Marked read', 'success');
    else showToast(j?.error || 'Mark item read error', 'error');
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

	function showToast(message: string, type: 'success' | 'error' = 'error') {
    try { if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current as any); } catch {}
    let text = message;
    try { if (type === 'error' && lastMeta?.x_request_id) text = `${message} (req ${lastMeta.x_request_id})`; } catch {}
    setToast({ text, type });
    try { setCurlOpen(type === 'error'); } catch {}
    try {
      const id = window.setTimeout(() => setToast(null), 3000);
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
    <div className={`min-h-screen mx-auto max-w-5xl p-6 theme-${theme}`}
      data-build="funnel-theme"
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'space-between' }}>
        <h2 className="text-xl font-semibold" style={{ margin: 0 }}>SynC React UI (v0.1.8)</h2>
        <a href="/api-docs" target="_blank" rel="noreferrer" className="btn" title="Open API Docs">API Docs</a>
      </div>
      {/* Tabs */}
      <div className="flex flex-wrap gap-2 mb-3">
        {['auth','session','storefront','reviews','wishlist','notifications','products','ads','offers','trends','funnel','pricing','ratelimit','health'].map((t) => (
          <button key={t} onClick={() => setActiveTab(t as any)} className={`btn ${activeTab===t ? 'opacity-100' : 'opacity-70'}`}>{t}</button>
        ))}
      </div>
      {/* Theme selector */}
      <div className="mb-3" style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <span className="muted text-sm">Theme</span>
        <select
          className="input"
          style={{ maxWidth: 180 }}
          value={theme}
          onChange={(e) => {
            const next = (e.target as HTMLSelectElement).value as any;
            setTheme(next);
            try { localStorage.setItem('sync_theme', next); } catch {}
          }}
        >
          <option value="cosmic">Cosmic</option>
          <option value="daylight">Daylight</option>
          <option value="ocean">Ocean</option>
        </select>
      </div>

      {toast ? (
        <div className={`toast ${toast.type === 'success' ? 'toast-success' : 'toast-error'}`}>
          {toast.text}
        </div>
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
            <button className="btn" title="build unsigned owner token" onClick={() => {
              const email = (document.getElementById('authEmail') as HTMLInputElement)?.value?.trim();
              const role = (document.getElementById('authRole') as HTMLInputElement)?.value?.trim() || 'owner';
              const sub = email || '11111111-1111-1111-1111-111111111111';
              const bearer = makeUnsignedBearer(sub, role);
              setToken(bearer);
              try { localStorage.setItem('sync_token', bearer); } catch {}
              showToast('Bearer built', 'success');
            }}>build owner bearer</button>
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
        <CopyButton getText={() => JSON.stringify(authResult, null, 2)} />
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
            {lastMeta ? (
              <div className="flex" style={{ gap: 8 }}>
                <span className="badge">RL {lastMeta?.ratelimit_remaining ?? ''}/{lastMeta?.ratelimit_limit ?? ''}</span>
                <span className="badge">cache {String(lastMeta?.cache_control || 'off')}</span>
              </div>
            ) : null}
            {lastMeta ? (
              <div className="muted text-sm" style={{ marginTop: 8 }}>
                <div><strong>last request</strong>: {lastMeta?.url} → {lastMeta?.status}</div>
                <div><strong>x-request-id</strong>: {lastMeta?.x_request_id || '(n/a)'}</div>
                <div><strong>RateLimit</strong>: {lastMeta?.ratelimit_remaining}/{lastMeta?.ratelimit_limit} reset={lastMeta?.ratelimit_reset}</div>
                <div><strong>Cache-Control</strong>: {lastMeta?.cache_control || '(n/a)'}</div>
              </div>
            ) : null}
            <div className="flex gap-2" style={{ marginTop: 8 }}>
              <button className="btn" onClick={() => { if (lastCurl) { (navigator as any)?.clipboard?.writeText(lastCurl); showToast('Copied cURL'); } }} disabled={!lastCurl}>Copy last cURL</button>
            </div>
            {lastCurl ? (
              <details style={{ marginTop: 8 }} open={curlOpen} onToggle={(e) => setCurlOpen((e.target as HTMLDetailsElement).open)}>
                <summary className="muted text-sm">View last cURL</summary>
                <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>{lastCurl}</pre>
              </details>
            ) : null}
          </div>
        </>
        )}
      </Section>

      <Section title="Storefront (owner)">
        {activeTab !== 'storefront' ? null : (
        <>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={postStorefront}>POST upsert</button>
          <CopyCurlButton tag={'storefront:post'} getCurl={getCurl} />
          <button onClick={getStorefront}>GET</button>
          <CopyCurlButton tag={'storefront:get'} getCurl={getCurl} />
          <button className="btn" onClick={() => setStorefront(null as any)}>clear</button>
        </div>
        <CopyButton getText={() => JSON.stringify(storefront, null, 2)} />
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
          <CopyCurlButton tag={'reviews:post'} getCurl={getCurl} />
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
          <CopyCurlButton tag={'reviews:get'} getCurl={getCurl} />
          <button className="btn" onClick={() => { setReviewResult(null as any); setReviewsList(null as any); setReviewsSummary(null as any); }}>clear</button>
        </div>
        <CopyButton getText={() => JSON.stringify(reviewResult, null, 2)} />
        <pre>{JSON.stringify(reviewResult, null, 2)}</pre>
        {/* Reviews table */}
        {Array.isArray(reviewsList?.items) && (reviewsList.items as any[]).length ? (
          <div style={{ marginTop: 8 }}>
            <div className="flex gap-2" style={{ marginBottom: 6 }}>
              <button className="btn" onClick={() => {
                try {
                  const items = [...(reviewsList.items as any[])];
                  items.sort((a: any, b: any) => String(b.created_at || '').localeCompare(String(a.created_at || '')));
                  setReviewsList({ items });
                } catch {}
              }}>sort newest</button>
              <button className="btn" onClick={() => {
                try {
                  const items = [...(reviewsList.items as any[])];
                  items.sort((a: any, b: any) => (Number(b.recommend_status||0) - Number(a.recommend_status||0)));
                  setReviewsList({ items });
                } catch {}
              }}>sort recommend first</button>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: 'left', borderBottom: '1px solid #333', padding: '6px 8px' }}>id</th>
                    <th style={{ textAlign: 'left', borderBottom: '1px solid #333', padding: '6px 8px' }}>user</th>
                    <th style={{ textAlign: 'left', borderBottom: '1px solid #333', padding: '6px 8px' }}>created</th>
                    <th style={{ textAlign: 'center', borderBottom: '1px solid #333', padding: '6px 8px' }}>recommend</th>
                    <th style={{ textAlign: 'left', borderBottom: '1px solid #333', padding: '6px 8px' }}>text</th>
                    <th style={{ textAlign: 'left', borderBottom: '1px solid #333', padding: '6px 8px' }}>copy</th>
                  </tr>
                </thead>
                <tbody>
                  {(reviewsList.items as any[]).map((r: any) => (
                    <tr key={r.id}>
                      <td style={{ padding: '6px 8px', borderBottom: '1px solid #222', fontFamily: 'monospace' }}>{r.id}</td>
                      <td style={{ padding: '6px 8px', borderBottom: '1px solid #222', fontFamily: 'monospace' }}>{r.user_id}</td>
                      <td style={{ padding: '6px 8px', borderBottom: '1px solid #222' }}>{formatTs(r.created_at)}</td>
                      <td style={{ padding: '6px 8px', borderBottom: '1px solid #222', textAlign: 'center' }}>{r.recommend_status ? '✓' : '✗'}</td>
                      <td style={{ padding: '6px 8px', borderBottom: '1px solid #222' }}>{r.review_text || ''}</td>
                      <td style={{ padding: '6px 8px', borderBottom: '1px solid #222' }}>
                        <button className="btn" onClick={() => { try { (navigator as any)?.clipboard?.writeText(String(r.id)); showToast('copied id','success'); } catch {} }}>copy id</button>
                        <button className="btn" onClick={() => { try { (navigator as any)?.clipboard?.writeText(String(r.user_id)); showToast('copied user','success'); } catch {} }} style={{ marginLeft: 6 }}>copy user</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <>
            <CopyButton getText={() => JSON.stringify(reviewsList, null, 2)} />
            <pre>{JSON.stringify(reviewsList, null, 2)}</pre>
          </>
        )}
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
          <CopyCurlButton tag={'wishlist:matches'} getCurl={getCurl} />
          <button className="btn" onClick={() => setWishlistMatches(null as any)}>clear</button>
        </div>
        <CopyButton getText={() => JSON.stringify(wishlistMatches, null, 2)} />
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
          <button className="btn" onClick={() => { setNotifications(null as any); setUnreadCount(0 as any); }}>clear</button>
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
            <>
              <CopyButton getText={() => JSON.stringify(notifications, null, 2)} />
              <pre>{JSON.stringify(notifications, null, 2)}</pre>
            </>
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
          <CopyCurlButton tag={'products:get'} getCurl={getCurl} />
          <button className="btn" onClick={() => setProducts(null as any)}>clear</button>
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

      const res = await actionFetch('products:post', `/api/storefronts/${sfId}/products`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...authHeaders },
                body: JSON.stringify({ items: [payload] }),
              });
              const j = await res.json();
              // Refresh list after successful post
              if (j?.ok) {
                await getProducts(sfId);
                showToast('Product added', 'success');
              }
              setProducts(j);
            }}
          >
            POST product
          </button>
        </div>
        <CopyButton getText={() => JSON.stringify(products, null, 2)} />
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
          <CopyCurlButton tag={'ads:post'} getCurl={getCurl} />
          <button className="btn" onClick={() => setAdsResult(null as any)}>clear</button>
        </div>
        <CopyButton getText={() => JSON.stringify(adsResult, null, 2)} />
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
          <CopyCurlButton tag={'offers:create'} getCurl={getCurl} />
        </div>
        <div className="muted text-sm" style={{ marginTop: 4 }}>Tip: POST offer resolves your business by owner. Use owner bearer.</div>
        <div className="grid grid-cols-3 gap-2 mt-2">
          <input id="offerId" className="input" placeholder="offerId" />
          <input id="offerGenQty" className="input" placeholder="generate total_quantity (optional)" />
          <button className="btn" onClick={generateOfferCoupons}>POST generate coupons</button>
          <CopyCurlButton tag={'offers:generate'} getCurl={getCurl} />
        </div>
        <div className="muted text-sm" style={{ marginTop: 4 }}>Then collect using coupon_id below; or preview with list buttons.</div>
        <div className="flex gap-2 mt-2">
          <button className="btn" onClick={async () => {
            try {
              const res = await apiFetch('/api/business/offers', { headers: { ...authHeaders } });
              const j = await res.json();
              setOffersResult({ ...(offersResult||{}), offers_list: j });
            } catch (e: any) { showToast('offers list error', 'error'); }
          }}>GET offers (owner)</button>
          <button className="btn" onClick={async () => {
            try {
              const id = (document.getElementById('offerId') as HTMLInputElement)?.value?.trim();
              if (!id) { alert('set offerId'); return; }
              const res = await apiFetch(`/api/business/offers/${id}/coupons`, { headers: { ...authHeaders } });
              const j = await res.json();
              setOffersResult({ ...(offersResult||{}), coupons_preview: j });
            } catch (e: any) { showToast('coupons preview error', 'error'); }
          }}>GET coupons (preview)</button>
        </div>
        <div className="grid grid-cols-3 gap-2 mt-2">
          <input id="collectCouponId" className="input" placeholder="coupon_id to collect (from offer)" />
          <div></div>
          <button className="btn" onClick={collectCoupon}>COLLECT to my wallet</button>
          <CopyCurlButton tag={'offers:collect'} getCurl={getCurl} />
        </div>
        <div className="grid grid-cols-3 gap-2 mt-2">
          <input id="redeemCode" className="input" placeholder="unique_code (from collect)" />
          <input id="redeemBizId" className="input" placeholder="businessId (owner)" />
          <button className="btn" onClick={redeemAtBusiness}>POST redeem</button>
          <CopyCurlButton tag={'offers:redeem'} getCurl={getCurl} />
        </div>
        <div className="flex gap-2 mt-2">
          <button className="btn" onClick={getRevenue}>GET revenue</button>
          <CopyCurlButton tag={'platform:revenue'} getCurl={getCurl} />
          <button className="btn" onClick={getCouponAnalytics}>GET coupon analytics</button>
          <CopyCurlButton tag={'analytics:coupons'} getCurl={getCurl} />
          <button className="btn" onClick={() => { setOffersResult(null as any); setRedeemResult(null as any); setRevenueResult(null as any); setCouponAnalytics(null as any); }}>clear</button>
        </div>
        <CopyButton getText={() => JSON.stringify(offersResult, null, 2)} />
        <pre>{JSON.stringify(offersResult, null, 2)}</pre>
        <CopyButton getText={() => JSON.stringify(redeemResult, null, 2)} />
        <pre>{JSON.stringify(redeemResult, null, 2)}</pre>
        <CopyButton getText={() => JSON.stringify(revenueResult, null, 2)} />
        <pre>{JSON.stringify(revenueResult, null, 2)}</pre>
        <CopyButton getText={() => JSON.stringify(couponAnalytics, null, 2)} />
        <pre>{JSON.stringify(couponAnalytics, null, 2)}</pre>
        </>
        )}
      </Section>

      <Section title="Analytics Trends">
        {activeTab !== 'trends' ? null : (
        <>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <input id="trendBizId" placeholder="businessId (optional)" />
          <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <input type="checkbox" id="trendGroupBiz" /> group by business
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span className="muted text-sm">sinceDays</span>
            <input
              type="number"
              min={1 as any}
              max={365 as any}
              value={analyticsSinceDays as any}
              onChange={(e) => setAnalyticsSinceDays(Math.max(1, Math.min(365, Number((e.target as HTMLInputElement).value || 7))))}
              style={{ width: 90 }}
              className="input"
            />
          </label>
          <button onClick={getTrends}>GET trends</button>
          <CopyCurlButton tag={'analytics:trends'} getCurl={getCurl} />
          <button className="btn" onClick={() => { if (lastCurl) { (navigator as any)?.clipboard?.writeText(lastCurl); showToast('Copied cURL', 'success'); } }} disabled={!lastCurl}>copy last cURL</button>
          <button className="btn" onClick={() => setTrendsResult(null as any)}>clear</button>
        </div>
        {isLoadingTrends ? (
          <div className="muted text-sm" style={{ marginTop: 8 }}>Loading trends…</div>
        ) : (
          <>
            <CopyButton getText={() => JSON.stringify(trendsResult, null, 2)} />
            {/* Lightweight inline charts (no external deps) */}
            {trendsResult?.trends ? (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 16, marginTop: 8 }}>
                {['reviews','coupons'].map((series) => {
                  const data = (trendsResult.trends as any)[series] || {};
                  const entries = Object.entries(data) as Array<[string, any]>;
                  const maxY = entries.reduce((m, [_, v]) => {
                    const y = series === 'reviews' ? (v.total||0) : (v.collected||0);
                    return Math.max(m, y);
                  }, 1);
                  return (
                    <div key={series}>
                      <div className="muted text-sm" style={{ marginBottom: 4 }}>{series} per day</div>
                      <div style={{ display: 'flex', gap: 4, alignItems: 'flex-end', height: 120, borderBottom: '1px solid #333', padding: '6px 0' }}>
                        {entries.map(([day, v]) => {
                          const y = series === 'reviews' ? (v.total||0) : (v.collected||0);
                          const h = Math.max(2, Math.round((y / (maxY || 1)) * 110));
                          return (
                            <div key={day} title={`${day}: ${y}`} style={{ width: 10, height: h, background: '#7c4dff' }}></div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : null}
            <pre>{JSON.stringify(trendsResult, null, 2)}</pre>
          </>
        )}
        </>
        )}
      </Section>

      <Section title="Analytics Funnel">
        {activeTab !== 'funnel' ? null : (
        <>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <input id="funnelBizId" className="input" placeholder="businessId (optional)" />
          <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <input type="checkbox" id="funnelGroupBiz" /> group by business
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span className="muted text-sm">sinceDays</span>
            <input
              type="number"
              min={1 as any}
              max={365 as any}
              value={analyticsSinceDays as any}
              onChange={(e) => setAnalyticsSinceDays(Math.max(1, Math.min(365, Number((e.target as HTMLInputElement).value || 7))))}
              style={{ width: 90 }}
              className="input"
            />
          </label>
          <button className="btn" onClick={getFunnel}>GET funnel</button>
          <CopyCurlButton tag={'analytics:funnel'} getCurl={getCurl} />
          <button className="btn" onClick={() => { if (lastCurl) { (navigator as any)?.clipboard?.writeText(lastCurl); showToast('Copied cURL', 'success'); } }} disabled={!lastCurl}>copy last cURL</button>
          <button className="btn" onClick={() => setFunnelResult(null as any)}>clear</button>
        </div>
        {isLoadingFunnel ? (
          <div className="muted text-sm" style={{ marginTop: 8 }}>Loading funnel…</div>
        ) : funnelResult?.ok ? (
          <div style={{ marginTop: 12 }}>
            <div className="grid grid-cols-4 gap-3">
              <div className="kpi"><div className="kpi-label">Issued</div><div className="kpi-value">{funnelResult?.funnel?.issued ?? 0}</div></div>
              <div className="kpi"><div className="kpi-label">Collected</div><div className="kpi-value">{funnelResult?.funnel?.collected ?? 0}</div></div>
              <div className="kpi"><div className="kpi-label">Shared</div><div className="kpi-value">{funnelResult?.funnel?.shared ?? 0}</div></div>
              <div className="kpi"><div className="kpi-label">Redeemed</div><div className="kpi-value">{funnelResult?.funnel?.redeemed ?? 0}</div></div>
            </div>
            {/* Rates */}
            <div style={{ marginTop: 12 }}>
              {(() => {
                const c = Number(funnelResult?.funnel?.collected || 0);
                const r = Number(funnelResult?.funnel?.redeemed || 0);
                const s = Number(funnelResult?.funnel?.shared || 0);
                const redemptionRate = c > 0 ? Math.round((r / c) * 1000) / 10 : 0;
                const shareRate = c > 0 ? Math.round((s / c) * 1000) / 10 : 0;
                return (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="muted text-sm mb-1">Redemption rate</div>
                      <div className="progress"><div className="progress-bar" style={{ width: `${redemptionRate}%` }}></div></div>
                      <div className="muted text-xs mt-1">{redemptionRate}% of collected</div>
                    </div>
                    <div>
                      <div className="muted text-sm mb-1">Share rate</div>
                      <div className="progress"><div className="progress-bar" style={{ width: `${shareRate}%` }}></div></div>
                      <div className="muted text-xs mt-1">{shareRate}% of collected</div>
                    </div>
                  </div>
                );
              })()}
            </div>
            {funnelResult?.funnelByBusiness ? (
              <div style={{ marginTop: 12 }}>
                <div style={{ fontWeight: 600, marginBottom: 6 }}>By business</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 6, fontSize: 14, opacity: 0.9 }}>
                  <div className="badge">Business</div>
                  <div className="badge">Collected</div>
                  <div className="badge">Shared</div>
                  <div className="badge">Redeemed</div>
                </div>
                <div style={{ marginTop: 6 }}>
                  {Object.entries(funnelResult.funnelByBusiness as Record<string, any>).map(([bizId, c]) => (
                    <div key={bizId} style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 6, alignItems: 'center', padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
                      <div style={{ fontFamily: 'monospace' }}>{bizId}</div>
                      <div>{(c as any).collected ?? 0}</div>
                      <div>{(c as any).shared ?? 0}</div>
                      <div>{(c as any).redeemed ?? 0}</div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        ) : (
          <>
            <CopyButton getText={() => (typeof funnelResult === 'object' ? JSON.stringify(funnelResult, null, 2) : String(funnelResult ?? ''))} />
            <pre>{typeof funnelResult === 'object' ? JSON.stringify(funnelResult, null, 2) : (funnelResult ?? '')}</pre>
          </>
        )}
        </>
        )}
      </Section>

      <Section title="Platform Pricing (owner)">
        {activeTab !== 'pricing' ? null : (
        <>
        <textarea id="pricingJson" style={{ width: '100%', height: 120 }} defaultValue={'{"tiers":[{"name":"basic","price":0},{"name":"pro","price":1000}]}' as any} />
        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          <button onClick={putPricing}>PUT pricing</button>
          <CopyCurlButton tag={'platform:pricing'} getCurl={getCurl} />
          <button className="btn" onClick={() => setPricingResult(null as any)}>clear</button>
        </div>
        <CopyButton getText={() => JSON.stringify(pricingResult, null, 2)} />
        <pre>{JSON.stringify(pricingResult, null, 2)}</pre>

        <div className="muted text-sm" style={{ marginTop: 12 }}>Platform config (read-only GET)</div>
        <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
          <button className="btn" onClick={getPlatformConfig}>GET config</button>
          <CopyCurlButton tag={'platform:config'} getCurl={getCurl} />
          <button className="btn" onClick={() => setPlatformConfigResult(null as any)}>clear</button>
        </div>
        <CopyButton getText={() => JSON.stringify(platformConfigResult, null, 2)} />
        <pre>{JSON.stringify(platformConfigResult, null, 2)}</pre>
        </>
        )}
      </Section>

      <Section title="Rate Limit (owner)">
        {activeTab !== 'ratelimit' ? null : (
        <>
          <div className="flex gap-2">
            <button className="btn" onClick={getRateLimitDiagnostics}>GET ratelimit</button>
            <CopyCurlButton tag={'platform:ratelimit'} getCurl={getCurl} />
            <button className="btn" onClick={exportRateLimitJson} disabled={!ratelimitResult}>export JSON</button>
            <button className="btn" onClick={exportRateLimitCsv} disabled={!Array.isArray((ratelimitResult as any)?.top_counters) || !(ratelimitResult as any)?.top_counters?.length}>export CSV</button>
            <button className="btn" onClick={() => setRatelimitResult(null as any)}>clear</button>
          </div>
          <div className="muted text-sm" style={{ marginTop: 6 }}>Shared limiter requires table <code>public.rate_limits</code> and <code>FEATURE_SHARED_RATELIMIT=true</code>. When disabled, diagnostics run in memory mode.</div>
          {Array.isArray((ratelimitResult as any)?.top_counters) && (ratelimitResult as any)?.top_counters?.length ? (
            <div style={{ marginTop: 10, overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: 'left', borderBottom: '1px solid #333', padding: '6px 8px' }}>Key</th>
                    <th style={{ textAlign: 'right', borderBottom: '1px solid #333', padding: '6px 8px' }}>Count</th>
                    <th style={{ textAlign: 'left', borderBottom: '1px solid #333', padding: '6px 8px' }}>Window start</th>
                  </tr>
                </thead>
                <tbody>
                  {((ratelimitResult as any).top_counters as Array<any>).map((row: any, idx: number) => (
                    <tr key={idx}>
                      <td style={{ padding: '6px 8px', borderBottom: '1px solid #222', whiteSpace: 'nowrap' }}>{row?.key || ''}</td>
                      <td style={{ padding: '6px 8px', borderBottom: '1px solid #222', textAlign: 'right' }}>{row?.count ?? ''}</td>
                      <td style={{ padding: '6px 8px', borderBottom: '1px solid #222' }}>{(() => { try { const t = Number(row?.window_start || 0) * 1000; return isFinite(t) && t > 0 ? new Date(t).toLocaleString() : String(row?.window_start || ''); } catch { return String(row?.window_start || ''); } })()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
          <CopyButton getText={() => JSON.stringify(ratelimitResult, null, 2)} />
          <pre>{JSON.stringify(ratelimitResult, null, 2)}</pre>
        </>
        )}
      </Section>

      <Section title="Platform Health">
        {activeTab !== 'health' ? null : (
        <>
          <button onClick={async () => {
            const res = await apiFetch('/api/platform/health');
            const j = await res.json();
            setHealthResult(j);
          }}>GET health</button>
          <button className="btn" onClick={() => setHealthResult(null as any)}>clear</button>
          {healthResult?.features ? (
            <div style={{ marginTop: 8 }}>
              <div className="muted text-sm">Flags</div>
              <ul>
                {Object.entries(healthResult.features as Record<string, boolean>).map(([k, v]) => (
                  <li key={k}><span style={{ color: v ? '#2a2' : '#a22' }}>{v ? '●' : '○'}</span> {k}</li>
                ))}
              </ul>
            </div>
          ) : null}
          <CopyButton getText={() => JSON.stringify(healthResult, null, 2)} />
          <pre>{JSON.stringify(healthResult, null, 2)}</pre>
        </>
        )}
      </Section>
    </div>
  );
}


