import React, { useMemo, useState, useRef, useEffect } from 'react';
import { MiniBars } from './components/MiniBars';
import { AnalyticsControls } from './components/AnalyticsControls';
import { AnalyticsCsvButton } from './components/AnalyticsCsvButton';
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

// MiniBars moved to components/MiniBars.tsx

export default function App() {
  const [token, setToken] = useState(() => {
    try { return localStorage.getItem('sync_token') || ''; } catch { return ''; }
  });
  const authHeaders = useMemo(() => (token ? { Authorization: token } : {}), [token]);

  const [storefront, setStorefront] = useState(null as any);
  const initialTab = (() => { try { return localStorage.getItem('sync_active_tab') || 'auth'; } catch { return 'auth'; } })();
  const [activeTab, setActiveTab] = useState(initialTab as string);
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
  const initialSinceDays = (() => { try { const v = Number(localStorage.getItem('sync_analytics_since_days') || '7'); return Math.max(1, Math.min(365, isFinite(v) ? v : 7)); } catch { return 7; } })();
  const [analyticsSinceDays, setAnalyticsSinceDays] = useState(initialSinceDays as number);
  const initialAnalyticsTz = (() => { try { return localStorage.getItem('sync_analytics_tz') || ''; } catch { return ''; } })();
  const [analyticsTz, setAnalyticsTz] = useState(initialAnalyticsTz as string);
  const initialAnalyticsFill = (() => { try { return (localStorage.getItem('sync_analytics_fill') || '1') === '1'; } catch { return true; } })();
  const [analyticsFill, setAnalyticsFill] = useState(initialAnalyticsFill as boolean);
  const [isLoadingTrends, setIsLoadingTrends] = useState(false as boolean);
  const [isLoadingFunnel, setIsLoadingFunnel] = useState(false as boolean);
  const [trendsError, setTrendsError] = useState('' as string);
  const [funnelError, setFunnelError] = useState('' as string);
  const [isLoadingOffers, setIsLoadingOffers] = useState(false as boolean);
  const [isLoadingCoupons, setIsLoadingCoupons] = useState(false as boolean);
	const [lastMeta, setLastMeta] = useState(null as any);
  const [lastCurl, setLastCurl] = useState('' as string);
	const [curlOpen, setCurlOpen] = useState(false as boolean);
  type CurlMap = Record<string, string>;
  const [curlByAction, setCurlByAction] = useState({} as CurlMap);
  const getCurl = (t: string) => curlByAction[t];
  const initialCompact = (() => { try { return (localStorage.getItem('sync_compact_rows') || '') === '1'; } catch { return false; } })();
  const [compactRows, setCompactRows] = useState(initialCompact as boolean);
  const offersDebounceRef = useRef(null as any);
  const couponsDebounceRef = useRef(null as any);
  useEffect(() => {
    // Prefill common ids
    try {
      const trendBiz = localStorage.getItem('sync_trend_biz_id') || '';
      const funnelBiz = localStorage.getItem('sync_funnel_biz_id') || '';
      const offerId = localStorage.getItem('sync_offer_id') || '';
      const bizId = localStorage.getItem('sync_reviews_biz_id') || '';
      const trendGroup = (localStorage.getItem('sync_trend_group') || '') === '1';
      const funnelGroup = (localStorage.getItem('sync_funnel_group') || '') === '1';
      if (trendBiz) { const el = document.getElementById('trendBizId') as HTMLInputElement | null; if (el) el.value = trendBiz; }
      if (funnelBiz) { const el = document.getElementById('funnelBizId') as HTMLInputElement | null; if (el) el.value = funnelBiz; }
      if (offerId) { const el = document.getElementById('offerId') as HTMLInputElement | null; if (el) el.value = offerId; }
      if (bizId) { const el = document.getElementById('bizId') as HTMLInputElement | null; if (el) el.value = bizId; }
      try { const tg = document.getElementById('trendGroupBiz') as HTMLInputElement | null; if (tg) tg.checked = trendGroup; } catch {}
      try { const fg = document.getElementById('funnelGroupBiz') as HTMLInputElement | null; if (fg) fg.checked = funnelGroup; } catch {}
    } catch {}
  }, []);

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
  const [features, setFeatures] = useState({} as any);
  const initialKbShortcuts = (() => { try { return (localStorage.getItem('sync_kb_shortcuts') || '1') === '1'; } catch { return true; } })();
  const [kbShortcuts, setKbShortcuts] = useState(initialKbShortcuts as boolean);
  const initialTooltips = (() => { try { return (localStorage.getItem('sync_tooltips') || '1') === '1'; } catch { return true; } })();
  const [showTooltips, setShowTooltips] = useState(initialTooltips as boolean);
  const [authResult, setAuthResult] = useState(null as any);
  const initialOffersSearch = (() => { try { return localStorage.getItem('sync_offers_search') || ''; } catch { return ''; } })();
  const [offersSearch, setOffersSearch] = useState(initialOffersSearch as string);
  const initialOffersSort = (() => { try { return localStorage.getItem('sync_offers_sort') || ''; } catch { return ''; } })();
  const [offersSort, setOffersSort] = useState(initialOffersSort as any);
  const initialCouponsSort = (() => { try { return localStorage.getItem('sync_coupons_sort') || ''; } catch { return ''; } })();
  const [couponsSort, setCouponsSort] = useState(initialCouponsSort as any);
  const initialOffersOrder = (() => { try { return localStorage.getItem('sync_offers_order') || (initialOffersSort==='title' ? 'title.asc' : 'start_date.desc'); } catch { return 'start_date.desc'; } })();
  const [offersOrder, setOffersOrder] = useState(initialOffersOrder as string);
  const initialCouponsOrder = (() => { try { return localStorage.getItem('sync_coupons_order') || (initialCouponsSort==='code' ? 'unique_code.asc' : 'is_redeemed.desc'); } catch { return 'unique_code.asc'; } })();
  const [couponsOrder, setCouponsOrder] = useState(initialCouponsOrder as string);
  const initialCouponsPage = (() => { try { return Number(localStorage.getItem('sync_coupons_page') || '1') || 1; } catch { return 1; } })();
  const initialCouponsPageSize = (() => { try { return Number(localStorage.getItem('sync_coupons_page_size') || '10') || 10; } catch { return 10; } })();
  const initialCouponsSearch = (() => { try { return localStorage.getItem('sync_coupons_search') || ''; } catch { return ''; } })();
  const [couponsPage, setCouponsPage] = useState(initialCouponsPage as number);
  const [couponsPageSize, setCouponsPageSize] = useState(initialCouponsPageSize as number);
  const [couponsSearch, setCouponsSearch] = useState(initialCouponsSearch as string);
  const [lastPreviewOfferId, setLastPreviewOfferId] = useState('' as string);
  const initialOffersPage = (() => { try { return Number(localStorage.getItem('sync_offers_page') || '1') || 1; } catch { return 1; } })();
  const initialOffersPageSize = (() => { try { return Number(localStorage.getItem('sync_offers_page_size') || '10') || 10; } catch { return 10; } })();
  const [offersPage, setOffersPage] = useState(initialOffersPage as number);
  const [offersPageSize, setOffersPageSize] = useState(initialOffersPageSize as number);
  const initialReviewsPage = (() => { try { return Number(localStorage.getItem('sync_reviews_page') || '1') || 1; } catch { return 1; } })();
  const initialReviewsPageSize = (() => { try { return Number(localStorage.getItem('sync_reviews_page_size') || '10') || 10; } catch { return 10; } })();
  const [reviewsPage, setReviewsPage] = useState(initialReviewsPage as number);
  const [reviewsPageSize, setReviewsPageSize] = useState(initialReviewsPageSize as number);
  const [rateKeyFilter, setRateKeyFilter] = useState('' as string);
  const initialReviewsFilter = (() => { try { return localStorage.getItem('sync_reviews_filter') || ''; } catch { return ''; } })();
  const [reviewsFilterText, setReviewsFilterText] = useState(initialReviewsFilter as string);
  const initialReviewsOrder = (() => { try { return localStorage.getItem('sync_reviews_order') || 'created_at.desc'; } catch { return 'created_at.desc'; } })();
  const [reviewsOrder, setReviewsOrder] = useState(initialReviewsOrder as string);
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

  useEffect(() => {
    // Prefetch platform health to get feature flags for gating UI bits
    (async () => {
      try {
        const res = await apiFetch('/api/platform/health');
        const j = await res.json();
        setHealthResult((prev: any) => prev || j);
        if (j?.features) setFeatures(j.features);
      } catch {}
    })();
  }, []);

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

  async function fetchOffers() {
    try {
      setIsLoadingOffers(true);
      const params = new URLSearchParams();
      if (offersSearch && offersSearch.trim()) params.set('q', offersSearch.trim());
      params.set('limit', String(offersPageSize));
      params.set('offset', String((offersPage - 1) * offersPageSize));
      if (offersOrder) params.set('order', offersOrder);
      const qs = params.toString() ? `?${params.toString()}` : '';
      const res = await apiFetch(`/api/business/offers${qs}`, { headers: { ...authHeaders } });
      const j = await res.json();
      setOffersResult({ ...(offersResult||{}), offers_list: { ...(j||{}) } });
    } catch (e: any) { showToast('offers list error', 'error'); }
    finally { setIsLoadingOffers(false); }
  }

  async function fetchCoupons() {
    try {
      const id = (document.getElementById('offerId') as HTMLInputElement)?.value?.trim();
      if (!id) { alert('set offerId'); return; }
      setLastPreviewOfferId(id);
      setIsLoadingCoupons(true);
      const params = new URLSearchParams();
      if (couponsOrder) params.set('order', couponsOrder);
      if (couponsSearch && couponsSearch.trim()) params.set('q', couponsSearch.trim());
      params.set('limit', String(couponsPageSize));
      params.set('offset', String((couponsPage - 1) * couponsPageSize));
      const qs = params.toString() ? `?${params.toString()}` : '';
      const res = await apiFetch(`/api/business/offers/${id}/coupons${qs}`, { headers: { ...authHeaders } });
      const j = await res.json();
      setOffersResult({ ...(offersResult||{}), coupons_preview: { ...(j||{}) } });
    } catch (e: any) { showToast('coupons preview error', 'error'); }
    finally { setIsLoadingCoupons(false); }
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
    setTrendsError('');
    const bizId = (document.getElementById('trendBizId') as HTMLInputElement)?.value?.trim();
    const group = (document.getElementById('trendGroupBiz') as HTMLInputElement)?.checked ? 'business' : '';
    const params = new URLSearchParams();
    if (bizId) params.set('businessId', bizId);
    if (group) params.set('group', group);
    if (!params.has('sinceDays')) params.set('sinceDays', String(analyticsSinceDays || 7));
    if (analyticsTz) params.set('tz', analyticsTz);
    if (!analyticsFill) params.set('fill', 'false');
    if (analyticsTz) params.set('tz', analyticsTz);
    if (!analyticsFill) params.set('fill', 'false');
    const qs = params.toString() ? `?${params.toString()}` : '';
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 10000);
    try {
      const res = await actionFetch('analytics:trends', `/api/business/analytics/trends${qs}`, { headers: { ...authHeaders }, signal: controller.signal } as any);
      recordHeaders(res);
      if (res.status === 400) {
        const err = await res.json().catch(() => ({}));
        const msg = String(err?.error || 'Bad Request: adjust sinceDays or tz');
        setTrendsError(msg);
        showToast(msg, 'error');
        return;
      }
      const j = await res.json();
      setTrendsResult(j);
      if (!j?.ok) showToast(j?.error || 'Trends fetch error', 'error');
    } catch (e: any) {
      showToast(e?.name === 'AbortError' ? 'Trends timeout' : (e?.message || 'Trends error'));
    } finally {
      clearTimeout(timer);
    }
    setIsLoadingTrends(false);
  }

  async function getFunnel() {
    setIsLoadingFunnel(true);
    setFunnelError('');
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
      if (res.status === 400) {
        const err = await res.json().catch(() => ({}));
        const msg = String(err?.error || 'Bad Request: adjust sinceDays or tz');
        setFunnelError(msg);
        showToast(msg, 'error');
        return;
      }
      const j = await res.json();
      setFunnelResult(j);
      if (!j?.ok) showToast(j?.error || 'Funnel fetch error', 'error');
      // Also refresh trends in background for mini chart (collected/redeemed by day)
      try {
        const tParams = new URLSearchParams();
        if (bizId) tParams.set('businessId', bizId);
        if (!tParams.has('sinceDays')) tParams.set('sinceDays', String(analyticsSinceDays || 7));
        const tQs = tParams.toString() ? `?${tParams.toString()}` : '';
        const tres = await actionFetch('analytics:trends', `/api/business/analytics/trends${tQs}`, { headers: { ...authHeaders } });
        const tj = await tres.json();
        setTrendsResult(tj);
      } catch {}
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
    const params = new URLSearchParams();
    if (filter) params.set('recommend', filter);
    params.set('limit', String(reviewsPageSize));
    params.set('offset', String((reviewsPage - 1) * reviewsPageSize));
    if (reviewsOrder) params.set('order', reviewsOrder);
    const qs = params.toString() ? `?${params.toString()}` : '';
    const res = await actionFetch('reviews:get', `/api/business/${businessId}/reviews${qs}`, { headers: { ...authHeaders } });
    const list = await res.json();
    setReviewsList(list);
    if (!list?.ok) showToast(list?.error || 'Reviews fetch error', 'error');
    // Fetch summary and trends for mini-chart
    const resSum = await actionFetch('analytics:reviews', `/api/business/${businessId}/analytics/reviews`, { headers: { ...authHeaders } });
    setReviewsSummary(await resSum.json());
    try {
      const tParams = new URLSearchParams();
      tParams.set('businessId', businessId);
      const tQs = `?${tParams.toString()}`;
      const tres = await actionFetch('analytics:trends', `/api/business/analytics/trends${tQs}`, { headers: { ...authHeaders } });
      const tj = await tres.json();
      setTrendsResult(tj);
    } catch {}
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

  function parseOrder(order: string): { col: string; dir: 'asc' | 'desc' } {
    try { const [c, d] = String(order||'').split('.') as [string, any]; return { col: c||'', dir: (d==='asc'?'asc':'desc') as 'asc'|'desc' }; } catch { return { col: '', dir: 'asc' }; }
  }

  function toggleOrder(current: string, col: string, defaultDir: 'asc' | 'desc') {
    const { col: curCol, dir } = parseOrder(current);
    if (curCol !== col) return `${col}.${defaultDir}`;
    return `${col}.${dir==='asc' ? 'desc' : 'asc'}`;
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
      {/* Keyboard shortcuts toggle */}
      <div className="mb-2" style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <input type="checkbox" checked={kbShortcuts} onChange={(e) => { const v = (e.target as HTMLInputElement).checked; setKbShortcuts(v); try { localStorage.setItem('sync_kb_shortcuts', v ? '1' : ''); } catch {} }} />
          <span className="muted text-sm">Keyboard shortcuts: Enter=apply, Esc=clear</span>
        </label>
      </div>
      {/* Tabs */}
      <div className="flex flex-wrap gap-2 mb-3">
        {['auth','session','storefront','reviews','wishlist','notifications','products','ads','offers','trends','funnel','issued','pricing','ratelimit','health'].map((t) => (
          <button key={t} onClick={() => { setActiveTab(t as any); try { localStorage.setItem('sync_active_tab', String(t)); } catch {} }} className={`btn ${activeTab===t ? 'opacity-100' : 'opacity-70'}`}>{t}</button>
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
            {features?.FEATURE_SUPABASE_AUTH ? null : (
              <button className="btn" title="build unsigned owner token" onClick={() => {
                const email = (document.getElementById('authEmail') as HTMLInputElement)?.value?.trim();
                const role = (document.getElementById('authRole') as HTMLInputElement)?.value?.trim() || 'owner';
                const sub = email || '11111111-1111-1111-1111-111111111111';
                const bearer = makeUnsignedBearer(sub, role);
                setToken(bearer);
                try { localStorage.setItem('sync_token', bearer); } catch {}
                showToast('Bearer built', 'success');
              }}>build owner bearer</button>
            )}
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
          <input id="bizId" placeholder="businessId" onChange={(e) => { try { localStorage.setItem('sync_reviews_biz_id', (e.target as HTMLInputElement).value || ''); } catch {} }} />
          <select className="input" value={reviewsPageSize as any} onChange={(e) => {
            const n = Number((e.target as HTMLSelectElement).value || 10);
            setReviewsPageSize(n);
            setReviewsPage(1);
            try { localStorage.setItem('sync_reviews_page_size', String(n)); localStorage.setItem('sync_reviews_page', '1'); } catch {}
          }}>
            {[10,20,50,100].map(n => (<option key={n} value={n as any}>{n} / page</option>))}
          </select>
            <div className="flex" style={{ gap: 6, alignItems: 'center' }}>
            <button className="btn" onClick={() => { const n = Math.max(1, reviewsPage - 1); setReviewsPage(n); try { localStorage.setItem('sync_reviews_page', String(n)); } catch {} }} disabled={reviewsPage <= 1}>&lt;</button>
            <span className="muted text-sm">page {reviewsPage}{(() => {
              try {
                const total = Number(reviewsList?.total || 0);
                const pages = Math.max(1, Math.ceil(total / (reviewsPageSize || 10)));
                return ` of ${pages} (total ${total})`;
              } catch { return ''; }
            })()}</span>
            <button className="btn" onClick={() => { const n = reviewsPage + 1; setReviewsPage(n); try { localStorage.setItem('sync_reviews_page', String(n)); } catch {} }} disabled={(() => {
              try {
                const total = Number(reviewsList?.total || 0);
                const pages = Math.max(1, Math.ceil(total / (reviewsPageSize || 10)));
                return reviewsPage >= pages;
              } catch { return false; }
            })()}>&gt;</button>
              {(() => {
                const total = Number(reviewsList?.total || 0);
                const pages = Math.max(1, Math.ceil(total / (reviewsPageSize || 10)));
                if (total) {
                  return (
                    <>
                      <button className="btn" onClick={() => { const n=1; setReviewsPage(n); try { localStorage.setItem('sync_reviews_page', String(n)); } catch {} }} disabled={reviewsPage<=1} title="first">«</button>
                      <button className="btn" onClick={() => { const n=pages; setReviewsPage(n); try { localStorage.setItem('sync_reviews_page', String(n)); } catch {} }} disabled={reviewsPage>=pages} title="last">»</button>
                    </>
                  );
                }
                return null;
              })()}
          </div>
          {/* Go to page (reviews) */}
          <div className="flex" style={{ gap: 6, alignItems: 'center', marginTop: 6 }}>
          <input id="reviewsGoto" className="input" placeholder="go to page" style={{ width: 110 }} onKeyDown={(e) => { const k=(e as any).key; if (k === 'Enter') { (document.getElementById('reviewsGoBtn') as HTMLButtonElement)?.click(); } if (kbShortcuts && k==='Escape'){ (document.getElementById('reviewsGoto') as HTMLInputElement).value=''; } }} />
            <button id="reviewsGoBtn" className="btn" title="go" onClick={() => {
              try {
                const total = Number(reviewsList?.total || 0);
                const pages = Math.max(1, Math.ceil(total / (reviewsPageSize || 10)));
                const raw = (document.getElementById('reviewsGoto') as HTMLInputElement)?.value || '';
                const n = Math.max(1, Math.min(pages, Number(raw || 1)));
                setReviewsPage(n);
                try { localStorage.setItem('sync_reviews_page', String(n)); } catch {}
              } catch {}
            }}>go</button>
          </div>
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
              <span className="muted text-sm" style={{ alignSelf: 'center' }}>click headers to sort</span>
              <input className="input" placeholder="filter text" title={kbShortcuts ? 'Enter = re-fetch, Esc = clear' : ''} value={reviewsFilterText} onChange={(e) => { const v=(e.target as HTMLInputElement).value; setReviewsFilterText(v); try { localStorage.setItem('sync_reviews_filter', v); } catch {} }} onKeyDown={(e) => { if (!kbShortcuts) return; const k=(e as any).key; if (k==='Escape'){ setReviewsFilterText(''); try { localStorage.setItem('sync_reviews_filter',''); } catch {} } if (k==='Enter'){ const id=(document.getElementById('bizId') as HTMLInputElement)?.value; if (id) getReviews(id); } }} style={{ maxWidth: 220 }} />
              <button className="btn" onClick={() => {
                // CSV export for reviews table
                try {
                  const rows: any[] = Array.isArray(reviewsList?.items) ? (reviewsList.items as any[]) : [];
                  if (!rows.length) { showToast('No reviews to export'); return; }
                  const headers = ['id','user_id','created_at','recommend_status','review_text'];
                  const escape = (v: any) => JSON.stringify(v == null ? '' : String(v));
                  const onlyVisible = (document.getElementById('revExportVisible') as HTMLInputElement)?.checked;
                  const filtered = rows.filter((r: any) => {
                    const q = (reviewsFilterText || '').trim().toLowerCase();
                    if (!q) return true;
                    try { const hay = `${r?.review_text||''} ${r?.user_id||''} ${r?.id||''}`.toLowerCase(); return hay.includes(q); } catch { return true; }
                  });
                  const pageStart = (reviewsPage - 1) * reviewsPageSize;
                  const pageEnd = pageStart + reviewsPageSize;
                  const source = onlyVisible ? filtered.slice(pageStart, pageEnd) : filtered;
                  const lines = [headers.join(',')].concat(source.map(r => headers.map(h => escape((r as any)[h])).join(',')));
                  const csv = lines.join('\n');
                  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `reviews_${Date.now()}.csv`;
                  a.click();
                  URL.revokeObjectURL(url);
                  showToast('Exported CSV', 'success');
                } catch (e: any) { showToast(e?.message || 'CSV export error'); }
              }}>export CSV</button>
              <label className="muted text-xs" title="Export only current page after filtering"><input id="revExportVisible" type="checkbox" style={{ marginLeft: 6, marginRight: 4 }} /> visible only</label>
              <button className="btn" onClick={() => {
                // JSON export for reviews
                try {
                  const data = reviewsList ?? {};
                  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json;charset=utf-8;' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `reviews_${Date.now()}.json`;
                  a.click();
                  URL.revokeObjectURL(url);
                  showToast('Exported JSON', 'success');
                } catch (e: any) { showToast(e?.message || 'JSON export error'); }
              }}>export JSON</button>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }} className={compactRows ? 'compact' : ''}>
                <thead>
                  <tr>
                    <th style={{ position: 'sticky', top: 0, zIndex: 1, background: 'var(--card)', textAlign: 'left', borderBottom: '1px solid #333', padding: '6px 8px' }}>id</th>
                    <th style={{ position: 'sticky', top: 0, zIndex: 1, background: 'var(--card)', textAlign: 'left', borderBottom: '1px solid #333', padding: '6px 8px' }}>user</th>
                    <th style={{ position: 'sticky', top: 0, zIndex: 1, background: 'var(--card)', textAlign: 'left', borderBottom: '1px solid #333', padding: '6px 8px', cursor: 'pointer' }} title="Sort by created" onClick={() => { const next = toggleOrder(reviewsOrder, 'created_at', 'desc'); setReviewsOrder(next); try { localStorage.setItem('sync_reviews_order', next); } catch {} }}>
                      {(() => { const { col, dir } = parseOrder(reviewsOrder); return `created${col==='created_at' ? (dir==='asc' ? ' ▲' : ' ▼') : ''}`; })()}
                    </th>
                    <th style={{ position: 'sticky', top: 0, zIndex: 1, background: 'var(--card)', textAlign: 'center', borderBottom: '1px solid #333', padding: '6px 8px', cursor: 'pointer' }} title="Sort by recommend" onClick={() => { const next = toggleOrder(reviewsOrder, 'recommend_status', 'desc'); setReviewsOrder(next); try { localStorage.setItem('sync_reviews_order', next); } catch {} }}>
                      {(() => { const { col, dir } = parseOrder(reviewsOrder); return `recommend${col==='recommend_status' ? (dir==='asc' ? ' ▲' : ' ▼') : ''}`; })()}
                    </th>
                    <th style={{ position: 'sticky', top: 0, zIndex: 1, background: 'var(--card)', textAlign: 'left', borderBottom: '1px solid #333', padding: '6px 8px' }}>text</th>
                    <th style={{ position: 'sticky', top: 0, zIndex: 1, background: 'var(--card)', textAlign: 'left', borderBottom: '1px solid #333', padding: '6px 8px' }}>copy</th>
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    const all = Array.isArray(reviewsList?.items) ? (reviewsList.items as any[]) : [];
                    const q = (reviewsFilterText || '').trim().toLowerCase();
                    let filtered = all.filter((r: any) => {
                      if (!q) return true;
                      try { const hay = `${r?.review_text||''} ${r?.user_id||''} ${r?.id||''}`.toLowerCase(); return hay.includes(q); } catch { return true; }
                    });
                    try {
                      const { col, dir } = parseOrder(reviewsOrder);
                      if (col === 'created_at') {
                        filtered = filtered.sort((a: any, b: any) => String((dir==='asc'?a:b).created_at||'').localeCompare(String((dir==='asc'?b:a).created_at||'')));
                      } else if (col === 'recommend_status') {
                        filtered = filtered.sort((a: any, b: any) => (Number((dir==='asc'?a:b).recommend_status||0) - Number((dir==='asc'?b:a).recommend_status||0)));
                      }
                    } catch {}
                    const start = (reviewsPage - 1) * reviewsPageSize;
                    const end = start + reviewsPageSize;
                    return filtered.slice(start, end).map((r: any) => (
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
                    ));
                  })()}
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
        {/* Mini chart: Reviews by day (recommend vs not) */}
        {trendsResult?.trends ? (
          <div style={{ marginTop: 12 }}>
            <div className="muted text-sm" style={{ marginBottom: 4 }}>Reviews by day (recommend vs not)</div>
            <div className="muted text-xs" style={{ marginBottom: 4 }}>
              <span style={{ display: 'inline-block', width: 8, height: 8, background: '#2e7d32', marginRight: 4 }}></span>recommend
              <span style={{ display: 'inline-block', width: 8, height: 8, background: '#c62828', margin: '0 4px 0 8px' }}></span>not
              <button className="btn" style={{ marginLeft: 8 }} onClick={async () => {
                try {
                  const bizId = (document.getElementById('bizId') as HTMLInputElement)?.value?.trim();
                  if (!bizId) { showToast('set businessId'); return; }
                  const params = new URLSearchParams();
                  if (analyticsSinceDays) params.set('sinceDays', String(analyticsSinceDays));
                  if (analyticsTz) params.set('tz', analyticsTz);
                  if (!analyticsFill) params.set('fill', 'false');
                  params.set('businessId', bizId);
                  params.set('format', 'csv');
                  window.open(`/api/business/analytics/reviews-summary?${params.toString()}`, '_blank');
                } catch {}
              }}>export CSV</button>
            </div>
            <div className="muted text-xs" style={{ marginBottom: 4 }}>
              <span style={{ display: 'inline-block', width: 8, height: 8, background: '#2e7d32', marginRight: 4 }}></span>recommend
              <span style={{ display: 'inline-block', width: 8, height: 8, background: '#c62828', margin: '0 4px 0 8px' }}></span>not
            </div>
            {(() => {
              const entries = Object.entries((trendsResult.trends as any).reviews || {}) as Array<[string, any]>;
              if (!entries.length) return (<div className="muted text-sm">(no data)</div>);
              const maxY = entries.reduce((m, [_, v]) => {
                const rec = Number((v as any).recommend || 0);
                const nrec = Math.max(0, Number((v as any).total || 0) - rec);
                return Math.max(m, rec, nrec);
              }, 1);
              return (
                <div style={{ display: 'flex', gap: 6, alignItems: 'flex-end', height: 120, borderBottom: '1px solid #333', padding: '6px 0' }}>
                  {entries.map(([day, v]) => {
                    const rec = Number((v as any).recommend || 0);
                    const nrec = Math.max(0, Number((v as any).total || 0) - rec);
                    const rh = Math.max(2, Math.round((rec / (maxY || 1)) * 110));
                    const nh = Math.max(2, Math.round((nrec / (maxY || 1)) * 110));
                    const total = rec + nrec;
                    const pr = total > 0 ? Math.round((rec / total) * 100) : 0;
                    const pn = total > 0 ? Math.round((nrec / total) * 100) : 0;
                    return (
                      <div key={day} title={`${day}: ${reviewsPct ? `✓=${pr}% ✗=${pn}%` : `✓=${rec} ✗=${nrec}`}`} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 16 }}>
                        <div style={{ width: 6, height: nh, background: '#c62828', marginBottom: 2 }}></div>
                        <div style={{ width: 6, height: rh, background: '#2e7d32' }}></div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>
        ) : null}
        <div className="muted text-xs" style={{ marginTop: 4 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <input type="checkbox" checked={reviewsPct} onChange={(e) => { const v=(e.target as HTMLInputElement).checked; setReviewsPct(v); try { localStorage.setItem('sync_reviews_pct', v ? '1' : ''); } catch {} }} /> show percentages
          </label>
        </div>
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
          <input
            className="input"
            placeholder="search title"
            value={offersSearch}
            onChange={(e) => {
              const v = (e.target as HTMLInputElement).value;
              setOffersSearch(v);
              try { localStorage.setItem('sync_offers_search', v); } catch {}
              try {
                if (offersDebounceRef.current) window.clearTimeout(offersDebounceRef.current as any);
                offersDebounceRef.current = window.setTimeout(() => { fetchOffers(); }, 400);
              } catch {}
            }}
            onKeyDown={(e) => {
              if (!kbShortcuts) return;
              const k = (e as any).key;
              if (k === 'Enter') { e.preventDefault(); fetchOffers(); }
              if (k === 'Escape') { setOffersSearch(''); try { localStorage.setItem('sync_offers_search', ''); } catch {}; fetchOffers(); }
            }}
            style={{ maxWidth: 200 }}
          />
          <select className="input" value={offersPageSize as any} onChange={(e) => {
            const n = Number((e.target as HTMLSelectElement).value || 10);
            setOffersPageSize(n);
            setOffersPage(1);
            try { localStorage.setItem('sync_offers_page_size', String(n)); localStorage.setItem('sync_offers_page', '1'); } catch {}
          }}>
            {[10,20,50,100].map(n => (<option key={n} value={n as any}>{n} / page</option>))}
          </select>
            <div className="flex" style={{ gap: 6, alignItems: 'center' }}>
            <button className="btn" onClick={() => {
              const n = Math.max(1, offersPage - 1);
              setOffersPage(n);
              try { localStorage.setItem('sync_offers_page', String(n)); } catch {}
            }} disabled={offersPage <= 1}>&lt;</button>
            <span className="muted text-sm">page {offersPage}{(() => {
              try {
                const total = Number(offersResult?.offers_list?.total || 0);
                const pages = Math.max(1, Math.ceil(total / (offersPageSize || 10)));
                return ` of ${pages} (total ${total})`;
              } catch { return ''; }
            })()}</span>
            <button className="btn" onClick={() => {
              const n = offersPage + 1;
              setOffersPage(n);
              try { localStorage.setItem('sync_offers_page', String(n)); } catch {}
            }} disabled={(() => {
              try {
                const total = Number(offersResult?.offers_list?.total || 0);
                const pages = Math.max(1, Math.ceil(total / (offersPageSize || 10)));
                return offersPage >= pages;
              } catch { return false; }
            })()}>&gt;</button>
              {(() => {
                const total = Number(offersResult?.offers_list?.total || 0);
                const pages = Math.max(1, Math.ceil(total / (offersPageSize || 10)));
                if (total) {
                  return (
                    <>
                      <button className="btn" title="first" onClick={() => { const n=1; setOffersPage(n); try { localStorage.setItem('sync_offers_page', String(n)); } catch {} }} disabled={offersPage<=1}>«</button>
                      <button className="btn" title="last" onClick={() => { const n=pages; setOffersPage(n); try { localStorage.setItem('sync_offers_page', String(n)); } catch {} }} disabled={offersPage>=pages}>»</button>
                    </>
                  );
                }
                return null;
              })()}
          </div>
          {/* Go to page (offers) */}
          <div className="flex" style={{ gap: 6, alignItems: 'center', marginTop: 6 }}>
          <input id="offersGoto" className="input" placeholder="go to page" style={{ width: 110 }} onKeyDown={(e) => { const k=(e as any).key; if (k === 'Enter') { (document.getElementById('offersGoBtn') as HTMLButtonElement)?.click(); } if (kbShortcuts && k==='Escape'){ (document.getElementById('offersGoto') as HTMLInputElement).value=''; } }} />
            <button id="offersGoBtn" className="btn" title="go" onClick={() => {
              try {
                const total = Number(offersResult?.offers_list?.total || 0);
                const pages = Math.max(1, Math.ceil(total / (offersPageSize || 10)));
                const raw = (document.getElementById('offersGoto') as HTMLInputElement)?.value || '';
                const n = Math.max(1, Math.min(pages, Number(raw || 1)));
                setOffersPage(n);
                try { localStorage.setItem('sync_offers_page', String(n)); } catch {}
              } catch {}
            }}>go</button>
          </div>
          <button className="btn" onClick={fetchOffers}>GET offers (owner)</button>
          <input
            className="input"
            placeholder="search code"
            value={couponsSearch}
            onChange={(e) => {
              const v = (e.target as HTMLInputElement).value;
              setCouponsSearch(v);
              try { localStorage.setItem('sync_coupons_search', v); } catch {}
              try {
                if (couponsDebounceRef.current) window.clearTimeout(couponsDebounceRef.current as any);
                couponsDebounceRef.current = window.setTimeout(() => { fetchCoupons(); }, 400);
              } catch {}
            }}
            onKeyDown={(e) => {
              if (!kbShortcuts) return;
              const k = (e as any).key;
              if (k === 'Enter') { e.preventDefault(); fetchCoupons(); }
              if (k === 'Escape') { setCouponsSearch(''); try { localStorage.setItem('sync_coupons_search', ''); } catch {}; fetchCoupons(); }
            }}
            style={{ maxWidth: 200 }}
          />
          <select className="input" value={couponsPageSize as any} onChange={(e) => {
            const n = Number((e.target as HTMLSelectElement).value || 10);
            setCouponsPageSize(n);
            setCouponsPage(1);
            try { localStorage.setItem('sync_coupons_page_size', String(n)); localStorage.setItem('sync_coupons_page', '1'); } catch {}
          }}>
            {[10,20,50,100].map(n => (<option key={n} value={n as any}>{n} / page</option>))}
          </select>
            <div className="flex" style={{ gap: 6, alignItems: 'center' }}>
            <button className="btn" onClick={() => {
              const n = Math.max(1, couponsPage - 1);
              setCouponsPage(n);
              try { localStorage.setItem('sync_coupons_page', String(n)); } catch {}
            }} disabled={couponsPage <= 1}>&lt;</button>
            <span className="muted text-sm">page {couponsPage}{(() => {
              try {
                const total = Number(offersResult?.coupons_preview?.total || 0);
                const pages = Math.max(1, Math.ceil(total / (couponsPageSize || 10)));
                return ` of ${pages} (total ${total})`;
              } catch { return ''; }
            })()}</span>
            <button className="btn" onClick={() => {
              const n = couponsPage + 1;
              setCouponsPage(n);
              try { localStorage.setItem('sync_coupons_page', String(n)); } catch {}
            }} disabled={(() => {
              try {
                const total = Number(offersResult?.coupons_preview?.total || 0);
                const pages = Math.max(1, Math.ceil(total / (couponsPageSize || 10)));
                return couponsPage >= pages;
              } catch { return false; }
            })()}>&gt;</button>
              {(() => {
                const total = Number(offersResult?.coupons_preview?.total || 0);
                const pages = Math.max(1, Math.ceil(total / (couponsPageSize || 10)));
                if (total) {
                  return (
                    <>
                      <button className="btn" title="first" onClick={() => { const n=1; setCouponsPage(n); try { localStorage.setItem('sync_coupons_page', String(n)); } catch {} }} disabled={couponsPage<=1}>«</button>
                      <button className="btn" title="last" onClick={() => { const n=pages; setCouponsPage(n); try { localStorage.setItem('sync_coupons_page', String(n)); } catch {} }} disabled={couponsPage>=pages}>»</button>
                    </>
                  );
                }
                return null;
              })()}
          </div>
          {/* Go to page (coupons preview) */}
          <div className="flex" style={{ gap: 6, alignItems: 'center', marginTop: 6 }}>
            <input id="couponsGoto" className="input" placeholder="go to page" style={{ width: 110 }} onKeyDown={(e) => { if ((e as any).key === 'Enter') { (document.getElementById('couponsGoBtn') as HTMLButtonElement)?.click(); } }} />
            <button id="couponsGoBtn" className="btn" title="go" onClick={() => {
              try {
                const total = Number(offersResult?.coupons_preview?.total || 0);
                const pages = Math.max(1, Math.ceil(total / (couponsPageSize || 10)));
                const raw = (document.getElementById('couponsGoto') as HTMLInputElement)?.value || '';
                const n = Math.max(1, Math.min(pages, Number(raw || 1)));
                setCouponsPage(n);
                try { localStorage.setItem('sync_coupons_page', String(n)); } catch {}
              } catch {}
            }}>go</button>
          </div>
          <button className="btn" onClick={fetchCoupons}>GET coupons (preview)</button>
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
          <label className="flex items-center gap-1 muted text-sm" title="Compact row density">
            <input type="checkbox" checked={compactRows} onChange={(e) => { const v=(e.target as HTMLInputElement).checked; setCompactRows(v); try { localStorage.setItem('sync_compact_rows',''+(v?1:0)); } catch {} }} />
            compact rows
          </label>
          <button className="btn" onClick={() => { setOffersResult(null as any); setRedeemResult(null as any); setRevenueResult(null as any); setCouponAnalytics(null as any); }}>clear</button>
        </div>
        {/* Offers list table */}
        {Array.isArray(offersResult?.offers_list?.items) && (offersResult.offers_list.items as any[]).length ? (
          <div style={{ marginTop: 10 }}>
            <div className="flex gap-2" style={{ marginBottom: 6 }}>
              <span className="muted text-sm" style={{ alignSelf: 'center' }}>{isLoadingOffers ? 'loading…' : 'click column headers to sort'}</span>
              <button className="btn" onClick={() => {
                // CSV export for offers
                try {
                  const rows: any[] = Array.isArray(offersResult?.offers_list?.items) ? (offersResult.offers_list.items as any[]) : [];
                  if (!rows.length) { showToast('No offers to export'); return; }
                  const headers = ['id','business_id','title','total_quantity','cost_per_coupon','start_date','end_date'];
                  const escape = (v: any) => JSON.stringify(v == null ? '' : String(v));
                  const lines = [headers.join(',')].concat(rows.map(r => headers.map(h => escape((r as any)[h])).join(',')));
                  const csv = lines.join('\n');
                  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `offers_${Date.now()}.csv`;
                  a.click();
                  URL.revokeObjectURL(url);
                  showToast('Exported CSV', 'success');
                } catch (e: any) { showToast(e?.message || 'CSV export error'); }
              }}>export CSV</button>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }} className={compactRows ? 'compact' : ''}>
                <thead>
                  <tr>
                    <th style={{ position: 'sticky', top: 0, zIndex: 1, background: 'var(--card)', textAlign: 'left', borderBottom: '1px solid #333', padding: '6px 8px' }}>id</th>
                    <th style={{ position: 'sticky', top: 0, zIndex: 1, background: 'var(--card)', textAlign: 'left', borderBottom: '1px solid #333', padding: '6px 8px', cursor: 'pointer' }} title="Sort by title" onClick={() => {
                      const next = toggleOrder(offersOrder, 'title', 'asc');
                      setOffersOrder(next); setOffersSort('title');
                      try { localStorage.setItem('sync_offers_order', next); localStorage.setItem('sync_offers_sort', 'title'); } catch {}
                      fetchOffers();
                    }}>title{(() => { const { col, dir } = parseOrder(offersOrder); return col==='title' ? (dir==='asc' ? ' ▲' : ' ▼') : ''; })()}</th>
                    <th style={{ position: 'sticky', top: 0, zIndex: 1, background: 'var(--card)', textAlign: 'right', borderBottom: '1px solid #333', padding: '6px 8px' }}>qty</th>
                    <th style={{ position: 'sticky', top: 0, zIndex: 1, background: 'var(--card)', textAlign: 'right', borderBottom: '1px solid #333', padding: '6px 8px' }}>cost</th>
                    <th style={{ position: 'sticky', top: 0, zIndex: 1, background: 'var(--card)', textAlign: 'left', borderBottom: '1px solid #333', padding: '6px 8px', cursor: 'pointer' }} title="Sort by start date" onClick={() => {
                      const next = toggleOrder(offersOrder, 'start_date', 'desc');
                      setOffersOrder(next); setOffersSort('start_date');
                      try { localStorage.setItem('sync_offers_order', next); localStorage.setItem('sync_offers_sort', 'start_date'); } catch {}
                      fetchOffers();
                    }}>start{(() => { const { col, dir } = parseOrder(offersOrder); return col==='start_date' ? (dir==='asc' ? ' ▲' : ' ▼') : ''; })()}</th>
                    <th style={{ position: 'sticky', top: 0, zIndex: 1, background: 'var(--card)', textAlign: 'left', borderBottom: '1px solid #333', padding: '6px 8px' }}>end</th>
                    <th style={{ position: 'sticky', top: 0, zIndex: 1, background: 'var(--card)', textAlign: 'left', borderBottom: '1px solid #333', padding: '6px 8px' }}>copy</th>
                  </tr>
                </thead>
                <tbody>
                  {(offersResult.offers_list.items as any[]).map((o: any) => (
                    <tr key={o.id}>
                      <td style={{ padding: '6px 8px', borderBottom: '1px solid #222', fontFamily: 'monospace' }}>{o.id}</td>
                      <td style={{ padding: '6px 8px', borderBottom: '1px solid #222' }}>{o.title || ''}</td>
                      <td style={{ padding: '6px 8px', borderBottom: '1px solid #222', textAlign: 'right' }}>{o.total_quantity ?? ''}</td>
                      <td style={{ padding: '6px 8px', borderBottom: '1px solid #222', textAlign: 'right' }}>{o.cost_per_coupon ?? ''}</td>
                      <td style={{ padding: '6px 8px', borderBottom: '1px solid #222' }}>{o.start_date || ''}</td>
                      <td style={{ padding: '6px 8px', borderBottom: '1px solid #222' }}>{o.end_date || ''}</td>
                      <td style={{ padding: '6px 8px', borderBottom: '1px solid #222' }}>
                        <button className="btn" onClick={() => { try { (navigator as any)?.clipboard?.writeText(String(o.id)); showToast('copied offer id','success'); } catch {} }}>copy id</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : null}
        {/* Coupons preview table */}
        {Array.isArray(offersResult?.coupons_preview?.items) && (offersResult.coupons_preview.items as any[]).length ? (
          <div style={{ marginTop: 10 }}>
            <div className="flex gap-2" style={{ marginBottom: 6 }}>
              <span className="muted text-sm" style={{ alignSelf: 'center' }}>{isLoadingCoupons ? 'loading…' : 'click column headers to sort'}</span>
              <button className="btn" onClick={() => {
                // CSV export for coupons preview
                try {
                  const rows: any[] = Array.isArray(offersResult?.coupons_preview?.items) ? (offersResult.coupons_preview.items as any[]) : [];
                  if (!rows.length) { showToast('No coupons to export'); return; }
                  const headers = ['id','coupon_id','unique_code','user_id','is_redeemed'];
                  const escape = (v: any) => JSON.stringify(v == null ? '' : String(v));
                  const lines = [headers.join(',')].concat(rows.map(r => headers.map(h => escape((r as any)[h])).join(',')));
                  const csv = lines.join('\n');
                  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `coupons_${Date.now()}.csv`;
                  a.click();
                  URL.revokeObjectURL(url);
                  showToast('Exported CSV', 'success');
                } catch (e: any) { showToast(e?.message || 'CSV export error'); }
              }}>export CSV</button>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }} className={compactRows ? 'compact' : ''}>
                <thead>
                  <tr>
                    <th style={{ position: 'sticky', top: 0, zIndex: 1, background: 'var(--card)', textAlign: 'left', borderBottom: '1px solid #333', padding: '6px 8px' }}>id</th>
                    <th style={{ position: 'sticky', top: 0, zIndex: 1, background: 'var(--card)', textAlign: 'left', borderBottom: '1px solid #333', padding: '6px 8px' }}>coupon_id</th>
                    <th style={{ position: 'sticky', top: 0, zIndex: 1, background: 'var(--card)', textAlign: 'left', borderBottom: '1px solid #333', padding: '6px 8px', cursor: 'pointer' }} title="Sort by code" onClick={() => { const next = toggleOrder(couponsOrder, 'unique_code', 'asc'); setCouponsOrder(next); setCouponsSort('code'); try { localStorage.setItem('sync_coupons_order', next); localStorage.setItem('sync_coupons_sort', 'code'); } catch {}; fetchCoupons(); }}>unique_code{(() => { const { col, dir } = parseOrder(couponsOrder); return col==='unique_code' ? (dir==='asc' ? ' ▲' : ' ▼') : ''; })()}</th>
                    <th style={{ position: 'sticky', top: 0, zIndex: 1, background: 'var(--card)', textAlign: 'left', borderBottom: '1px solid #333', padding: '6px 8px' }}>user_id</th>
                    <th style={{ position: 'sticky', top: 0, zIndex: 1, background: 'var(--card)', textAlign: 'center', borderBottom: '1px solid #333', padding: '6px 8px', cursor: 'pointer' }} title="Sort by redeemed" onClick={() => { const next = toggleOrder(couponsOrder, 'is_redeemed', 'desc'); setCouponsOrder(next); setCouponsSort('redeemed'); try { localStorage.setItem('sync_coupons_order', next); localStorage.setItem('sync_coupons_sort', 'redeemed'); } catch {}; fetchCoupons(); }}>redeemed{(() => { const { col, dir } = parseOrder(couponsOrder); return col==='is_redeemed' ? (dir==='asc' ? ' ▲' : ' ▼') : ''; })()}</th>
                    <th style={{ position: 'sticky', top: 0, zIndex: 1, background: 'var(--card)', textAlign: 'left', borderBottom: '1px solid #333', padding: '6px 8px' }}>copy</th>
                  </tr>
                </thead>
                <tbody>
                  {(offersResult.coupons_preview.items as any[]).map((c: any) => (
                    <tr key={c.id}>
                      <td style={{ padding: '6px 8px', borderBottom: '1px solid #222', fontFamily: 'monospace' }}>{c.id}</td>
                      <td style={{ padding: '6px 8px', borderBottom: '1px solid #222', fontFamily: 'monospace' }}>{c.coupon_id}</td>
                      <td style={{ padding: '6px 8px', borderBottom: '1px solid #222', fontFamily: 'monospace' }}>{c.unique_code}</td>
                      <td style={{ padding: '6px 8px', borderBottom: '1px solid #222', fontFamily: 'monospace' }}>{c.user_id || ''}</td>
                      <td style={{ padding: '6px 8px', borderBottom: '1px solid #222', textAlign: 'center' }}>{c.is_redeemed ? '✓' : '✗'}</td>
                      <td style={{ padding: '6px 8px', borderBottom: '1px solid #222' }}>
                        <button className="btn" onClick={() => { try { (navigator as any)?.clipboard?.writeText(String(c.unique_code)); showToast('copied code','success'); } catch {} }}>copy code</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : null}
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
          <input id="trendBizId" placeholder="businessId (optional)" aria-label="Trends businessId" onChange={(e) => { try { localStorage.setItem('sync_trend_biz_id', (e.target as HTMLInputElement).value || ''); } catch {} }} />
          <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <input type="checkbox" id="trendGroupBiz" aria-label="Group trends by business" onChange={(e) => { try { localStorage.setItem('sync_trend_group', (e.target as HTMLInputElement).checked ? '1' : ''); } catch {} }} /> group by business
          </label>
          <AnalyticsControls sinceDays={analyticsSinceDays} setSinceDays={setAnalyticsSinceDays} tz={analyticsTz} setTz={setAnalyticsTz} fill={analyticsFill} setFill={setAnalyticsFill} locale={(() => { try { const p=new URL(window.location.href).searchParams.get('locale'); return p || localStorage.getItem('sync_analytics_locale') || 'en'; } catch { return 'en'; } })()} setLocale={(v) => { try { localStorage.setItem('sync_analytics_locale', v); const u=new URL(window.location.href); if (v) u.searchParams.set('locale', v); else u.searchParams.delete('locale'); window.history.replaceState(null, '', u.toString()); } catch {} }} onReset={() => { /* no-op additional */ }} />
          <label className="muted text-sm" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <input type="checkbox" checked={showTooltips} onChange={(e) => { const v=(e.target as HTMLInputElement).checked; setShowTooltips(v); try { localStorage.setItem('sync_tooltips', v ? '1' : ''); } catch {} }} /> tooltips
          </label>
          <button onClick={getTrends}>GET trends</button>
          {trendsError ? (
            <div className="badge" style={{ background: 'var(--error-bg)', color: 'var(--error-fg)' }}>
              {trendsError}
              <button className="btn" style={{ marginLeft: 6 }} onClick={() => { setAnalyticsSinceDays(180); try { localStorage.setItem('sync_analytics_since_days', '180'); } catch {}; }}>use 180</button>
              <button className="btn" style={{ marginLeft: 6 }} onClick={() => { setAnalyticsTz(''); try { localStorage.setItem('sync_analytics_tz', ''); } catch {}; }}>clear tz</button>
            </div>
          ) : null}
          {/* Reset now handled by AnalyticsControls */}
          <AnalyticsCsvButton endpoint={'/api/business/analytics/trends'} params={{ businessId: (document.getElementById('trendBizId') as HTMLInputElement)?.value?.trim() || '', group: (document.getElementById('trendGroupBiz') as HTMLInputElement)?.checked ? 'business' : '', sinceDays: analyticsSinceDays, tz: analyticsTz, fill: analyticsFill }} acceptLanguage={(() => { try { const p=new URL(window.location.href).searchParams.get('locale'); return p || localStorage.getItem('sync_analytics_locale') || 'en'; } catch { return 'en'; } })()} />
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
                    if (series === 'reviews') {
                      const rec = Number((v as any).recommend || 0);
                      const nrec = Math.max(0, Number((v as any).total || 0) - rec);
                      return Math.max(m, rec + nrec);
                    }
                    const y = Number((v as any).collected || 0);
                    return Math.max(m, y);
                  }, 1);
                  const legend = series === 'reviews'
                    ? (<div className="muted text-xs"><span style={{ display: 'inline-block', width: 8, height: 8, background: '#2e7d32', marginRight: 4 }}></span>recommend <span style={{ display: 'inline-block', width: 8, height: 8, background: '#c62828', margin: '0 4px 0 8px' }}></span>not</div>)
                    : (<div className="muted text-xs"><span style={{ display: 'inline-block', width: 8, height: 8, background: '#7c4dff', marginRight: 4 }}></span>collected</div>);
                  return (
                    <div key={series}>
                      <div className="muted text-sm" style={{ marginBottom: 2 }}>{series} per day</div>
                       <MiniBars
                        entries={entries}
                        maxY={maxY}
                         showTooltips={showTooltips}
                        legend={legend}
                        renderBar={(day, v, scaled) => (
                          series === 'reviews' ? (
                            (() => {
                              const rec = Number((v as any).recommend || 0);
                              const nrec = Math.max(0, Number((v as any).total || 0) - rec);
                              const rh = scaled(rec);
                              const nh = scaled(nrec);
                              return (
                                 <div title={showTooltips ? `${day}: ✓=${rec} ✗=${nrec}` : undefined}>
                                  <div style={{ width: 8, height: nh, background: '#c62828', marginBottom: 2 }}></div>
                                  <div style={{ width: 8, height: rh, background: '#2e7d32' }}></div>
                                </div>
                              );
                            })()
                          ) : (
                            (() => {
                              const y = Number((v as any).collected || 0);
                              const h = scaled(y);
                               return (<div title={showTooltips ? `${day}: ${y}` : undefined} style={{ width: 10, height: h, background: '#7c4dff' }}></div>);
                            })()
                          )
                        )}
                      />
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
          <input id="funnelBizId" className="input" placeholder="businessId (optional)" aria-label="Funnel businessId" onChange={(e) => { try { localStorage.setItem('sync_funnel_biz_id', (e.target as HTMLInputElement).value || ''); } catch {} }} />
          <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <input type="checkbox" id="funnelGroupBiz" aria-label="Group funnel by business" onChange={(e) => { try { localStorage.setItem('sync_funnel_group', (e.target as HTMLInputElement).checked ? '1' : ''); } catch {} }} /> group by business
          </label>
          <AnalyticsControls sinceDays={analyticsSinceDays} setSinceDays={setAnalyticsSinceDays} tz={analyticsTz} setTz={setAnalyticsTz} fill={analyticsFill} setFill={setAnalyticsFill} locale={(() => { try { const p=new URL(window.location.href).searchParams.get('locale'); return p || localStorage.getItem('sync_analytics_locale') || 'en'; } catch { return 'en'; } })()} setLocale={(v) => { try { localStorage.setItem('sync_analytics_locale', v); const u=new URL(window.location.href); if (v) u.searchParams.set('locale', v); else u.searchParams.delete('locale'); window.history.replaceState(null, '', u.toString()); } catch {} }} onReset={() => { /* no-op */ }} />
          <button className="btn" onClick={getFunnel}>GET funnel</button>
          {funnelError ? (
            <div className="badge" style={{ background: 'var(--error-bg)', color: 'var(--error-fg)' }}>
              {funnelError}
              <button className="btn" style={{ marginLeft: 6 }} onClick={() => { setAnalyticsSinceDays(180); try { localStorage.setItem('sync_analytics_since_days', '180'); } catch {}; }}>use 180</button>
              <button className="btn" style={{ marginLeft: 6 }} onClick={() => { setAnalyticsTz(''); try { localStorage.setItem('sync_analytics_tz', ''); } catch {}; }}>clear tz</button>
            </div>
          ) : null}
          <button className="btn" title="Reset analytics controls" onClick={() => { setAnalyticsSinceDays(7); setAnalyticsTz(''); setAnalyticsFill(true); try { localStorage.setItem('sync_analytics_since_days','7'); localStorage.setItem('sync_analytics_tz',''); localStorage.setItem('sync_analytics_fill','1'); } catch {} }}>reset</button>
          <AnalyticsCsvButton endpoint={'/api/business/analytics/funnel'} params={{ businessId: (document.getElementById('funnelBizId') as HTMLInputElement)?.value?.trim() || '', group: (document.getElementById('funnelGroupBiz') as HTMLInputElement)?.checked ? 'business' : '', sinceDays: analyticsSinceDays, tz: analyticsTz, fill: analyticsFill }} acceptLanguage={(() => { try { const p=new URL(window.location.href).searchParams.get('locale'); return p || localStorage.getItem('sync_analytics_locale') || 'en'; } catch { return 'en'; } })()} />
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
            {/* Mini chart: Collected vs Redeemed per day (bars) */}
            {trendsResult?.trends ? (
              <div style={{ marginTop: 12 }}>
                <div className="muted text-sm" style={{ marginBottom: 4 }}>Funnel by day (collected vs redeemed)</div>
                <div className="muted text-xs" style={{ marginBottom: 4 }}>
                  <span style={{ display: 'inline-block', width: 8, height: 8, background: '#7c4dff', marginRight: 4 }}></span>collected
                  <span style={{ display: 'inline-block', width: 8, height: 8, background: '#26a69a', margin: '0 4px 0 8px' }}></span>redeemed
                </div>
                 {(() => {
                  const entries = Object.entries((trendsResult.trends as any).coupons || {}) as Array<[string, any]>;
                  if (!entries.length) return (<div className="muted text-sm">(no data)</div>);
                  const maxY = entries.reduce((m, [_, v]) => Math.max(m, Number((v as any).collected||0), Number((v as any).redeemed||0)), 1);
                  return (
                    <div style={{ display: 'flex', gap: 6, alignItems: 'flex-end', height: 120, borderBottom: '1px solid #333', padding: '6px 0' }}>
                      {entries.map(([day, v]) => {
                        const c = Number((v as any).collected||0);
                        const r = Number((v as any).redeemed||0);
                        const ch = Math.max(2, Math.round((c / (maxY || 1)) * 110));
                        const rh = Math.max(2, Math.round((r / (maxY || 1)) * 110));
                        return (
                           <div key={day} title={showTooltips ? `${day}: C=${c} R=${r}` : undefined} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 16 }}>
                            <div style={{ width: 6, height: rh, background: '#26a69a', marginBottom: 2 }}></div>
                            <div style={{ width: 6, height: ch, background: '#7c4dff' }}></div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>
            ) : null}
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
            {/* Tiny bars by business if grouped */}
            {funnelResult?.funnelByBusiness ? (
              <div style={{ marginTop: 12 }}>
                <div className="muted text-sm" style={{ marginBottom: 4 }}>Collected by business</div>
                 {(() => {
                  const entries = Object.entries(funnelResult.funnelByBusiness as Record<string, any>);
                  const maxY = entries.reduce((m, [_, v]) => Math.max(m, Number((v as any).collected||0)), 1);
                  return (
                    <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', height: 120, borderBottom: '1px solid #333', padding: '6px 0' }}>
                      {entries.map(([bizId, v]) => {
                        const y = Number((v as any).collected||0);
                        const h = Math.max(2, Math.round((y / (maxY || 1)) * 110));
                        return (
                          <div key={bizId} title={`${bizId}: ${y}`} style={{ width: 16, height: h, background: '#36c', position: 'relative' }}>
                            <div style={{ position: 'absolute', bottom: -16, left: -8, width: 32, textAlign: 'center', fontSize: 10, opacity: 0.7, fontFamily: 'monospace' }}>{String(bizId).slice(0,4)}</div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>
            ) : null}
          </div>
        ) : (
          <>
            <CopyButton getText={() => (typeof funnelResult === 'object' ? JSON.stringify(funnelResult, null, 2) : String(funnelResult ?? ''))} />
            <pre>{typeof funnelResult === 'object' ? JSON.stringify(funnelResult, null, 2) : (funnelResult ?? '')}</pre>
            {trendsResult?.trends ? (
              <>
                <div className="muted text-sm" style={{ marginTop: 12 }}>Funnel by day (collected vs redeemed)</div>
                {(() => {
                  const entries = Object.entries((trendsResult.trends as any).coupons || {}) as Array<[string, any]>;
                  if (!entries.length) return (<div className="muted text-sm">(no data)</div>);
                  const maxY = entries.reduce((m, [_, v]) => Math.max(m, Number((v as any).collected||0), Number((v as any).redeemed||0)), 1);
                  return (
                    <div style={{ display: 'flex', gap: 6, alignItems: 'flex-end', height: 120, borderBottom: '1px solid #333', padding: '6px 0' }}>
                      {entries.map(([day, v]) => {
                        const c = Number((v as any).collected||0);
                        const r = Number((v as any).redeemed||0);
                        const ch = Math.max(2, Math.round((c / (maxY || 1)) * 110));
                        const rh = Math.max(2, Math.round((r / (maxY || 1)) * 110));
                        return (
                          <div key={day} title={`${day}: C=${c} R=${r}`} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 16 }}>
                            <div style={{ width: 6, height: rh, background: '#26a69a', marginBottom: 2 }}></div>
                            <div style={{ width: 6, height: ch, background: '#7c4dff' }}></div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </>
            ) : null}
          </>
        )}
        </>
        )}
      </Section>

      <Section title="Coupons Issued (owner)">
        {activeTab !== 'issued' ? null : (
        <>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <input id="issuedBizId" className="input" placeholder="businessId (optional)" aria-label="Issued businessId" />
          <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <input type="checkbox" id="issuedGroupBiz" aria-label="Group issued by business" /> group by business
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span className="muted text-sm">order</span>
            <select id="issuedOrder" className="input" defaultValue={((): string => { try { return localStorage.getItem('sync_issued_order') || 'total.desc'; } catch { return 'total.desc'; } })()} onChange={(e) => { try { localStorage.setItem('sync_issued_order', (e.target as HTMLSelectElement).value); } catch {} }}>
              <option value="total.desc">total.desc</option>
              <option value="total.asc">total.asc</option>
              <option value="avgPerDay.desc">avgPerDay.desc</option>
              <option value="avgPerDay.asc">avgPerDay.asc</option>
              <option value="businessId.asc">businessId.asc</option>
              <option value="businessId.desc">businessId.desc</option>
              <option value="businessName.asc">businessName.asc</option>
              <option value="businessName.desc">businessName.desc</option>
              <option value="firstDay.asc">firstDay.asc</option>
              <option value="firstDay.desc">firstDay.desc</option>
              <option value="lastDay.asc">lastDay.asc</option>
              <option value="lastDay.desc">lastDay.desc</option>
            </select>
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span className="muted text-sm">limit</span>
            <input id="issuedLimit" className="input" type="number" min={1 as any} max={500 as any} defaultValue={((): any => { try { return Number(localStorage.getItem('sync_issued_limit')||20); } catch { return 20; } })()} onChange={(e) => { try { localStorage.setItem('sync_issued_limit', String(Math.max(1, Math.min(500, Number((e.target as HTMLInputElement).value||20))))); } catch {} }} style={{ width: 90 }} aria-label="Issued limit" />
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span className="muted text-sm">offset</span>
            <input id="issuedOffset" className="input" type="number" min={0 as any} defaultValue={((): any => { try { return Number(localStorage.getItem('sync_issued_offset')||0); } catch { return 0; } })()} onChange={(e) => { try { localStorage.setItem('sync_issued_offset', String(Math.max(0, Number((e.target as HTMLInputElement).value||0)))); } catch {} }} style={{ width: 90 }} aria-label="Issued offset" />
          </label>
          <AnalyticsControls sinceDays={analyticsSinceDays} setSinceDays={setAnalyticsSinceDays} tz={analyticsTz} setTz={setAnalyticsTz} fill={analyticsFill} setFill={setAnalyticsFill} locale={(() => { try { const p=new URL(window.location.href).searchParams.get('locale'); return p || localStorage.getItem('sync_analytics_locale') || 'en'; } catch { return 'en'; } })()} setLocale={(v) => { try { localStorage.setItem('sync_analytics_locale', v); const u=new URL(window.location.href); if (v) u.searchParams.set('locale', v); else u.searchParams.delete('locale'); window.history.replaceState(null, '', u.toString()); } catch {} }} onReset={() => { /* no-op */ }} />
          <div className="flex gap-2" role="navigation" aria-label="pagination" tabIndex={0 as any} onKeyDown={(e) => {
            try {
              const lim = Math.max(1, Math.min(500, Number((document.getElementById('issuedLimit') as HTMLInputElement)?.value || 20)));
              const el = (document.getElementById('issuedOffset') as HTMLInputElement);
              const cur = Math.max(0, Number(el.value||0));
              if ((e as any).key === 'ArrowLeft') {
                const next = Math.max(0, cur - lim); el.value = String(next); localStorage.setItem('sync_issued_offset', String(next));
              } else if ((e as any).key === 'ArrowRight') {
                const next = cur + lim; el.value = String(next); localStorage.setItem('sync_issued_offset', String(next));
              }
            } catch {}
          }}>
            {(() => {
              const total = Number(((window as any).issuedResult?.total) || 0);
              const lim = Math.max(1, Math.min(500, Number((document.getElementById('issuedLimit') as HTMLInputElement)?.value || 20)));
              const curOff = Math.max(0, Number((document.getElementById('issuedOffset') as HTMLInputElement)?.value || 0));
              const curPage = Math.floor(curOff / lim) + 1;
              const maxPage = total > 0 ? Math.max(1, Math.ceil(total / lim)) : undefined;
              const canPrev = curOff > 0;
              const canNext = maxPage ? curPage < maxPage : true;
              return (
                <>
                  <button className="btn" disabled={!canPrev} aria-disabled={!canPrev} onClick={() => { try { (document.getElementById('issuedOffset') as HTMLInputElement).value = '0'; localStorage.setItem('sync_issued_offset','0'); } catch {} }}>First</button>
                  <button className="btn" disabled={!canPrev} aria-disabled={!canPrev} onClick={() => { try { const el = (document.getElementById('issuedOffset') as HTMLInputElement); const cur = Math.max(0, Number(el.value||0)); const next = Math.max(0, cur - lim); el.value = String(next); localStorage.setItem('sync_issued_offset', String(next)); } catch {} }}>Prev</button>
                  <button className="btn" disabled={!canNext} aria-disabled={!canNext} onClick={() => { try { const el = (document.getElementById('issuedOffset') as HTMLInputElement); const cur = Math.max(0, Number(el.value||0)); const next = cur + lim; el.value = String(next); localStorage.setItem('sync_issued_offset', String(next)); } catch {} }}>Next</button>
                  <button className="btn" disabled={!maxPage || !canNext} aria-disabled={!maxPage || !canNext} onClick={() => { try { const el = (document.getElementById('issuedOffset') as HTMLInputElement); const lastPage = Math.max(1, Number(maxPage||1)); const lastOffset = (lastPage - 1) * lim; el.value = String(lastOffset); localStorage.setItem('sync_issued_offset', String(lastOffset)); } catch {} }}>Last</button>
                  <span className="muted text-sm" role="status" aria-live="polite" style={{ marginLeft: 6 }}>{maxPage ? `Page ${curPage} of ${maxPage}` : `Page ${curPage}`}{total ? ` • Total ${total}` : ''}</span>
                  <label className="muted text-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginLeft: 8 }}>
                    <span>Go to</span>
                    <input id="issuedGoPage" className="input" type="number" min={1 as any} style={{ width: 80 }} aria-label="Go to page" defaultValue={curPage as any} />
                    <button className="btn" onClick={() => {
                      try {
                        const total = Number(((window as any).issuedResult?.total) || 0);
                        const lim = Math.max(1, Math.min(500, Number((document.getElementById('issuedLimit') as HTMLInputElement)?.value || 20)));
                        const maxPage = total > 0 ? Math.max(1, Math.ceil(total / lim)) : undefined;
                        const el = (document.getElementById('issuedGoPage') as HTMLInputElement);
                        let p = Math.max(1, Number(el.value || 1));
                        if (maxPage) p = Math.min(p, maxPage);
                        const newOffset = (p - 1) * lim;
                        (document.getElementById('issuedOffset') as HTMLInputElement).value = String(newOffset);
                        try { localStorage.setItem('sync_issued_offset', String(newOffset)); } catch {}
                      } catch {}
                    }}>Go</button>
                  </label>
                  <button className="btn" onClick={() => { try { (document.getElementById('issuedOffset') as HTMLInputElement).value = '0'; localStorage.setItem('sync_issued_offset','0'); } catch {} }}>Reset paging</button>
                </>
              );
            })()}
          </div>
          <button className="btn" onClick={async () => {
            try {
              const bizId = (document.getElementById('issuedBizId') as HTMLInputElement)?.value?.trim();
              const group = (document.getElementById('issuedGroupBiz') as HTMLInputElement)?.checked ? 'business' : '';
              const order = (document.getElementById('issuedOrder') as HTMLSelectElement)?.value || '';
              const limit = Number((document.getElementById('issuedLimit') as HTMLInputElement)?.value || '') || undefined;
              const offset = Number((document.getElementById('issuedOffset') as HTMLInputElement)?.value || '') || undefined;
              const params = new URLSearchParams();
              if (bizId) params.set('businessId', bizId);
              if (group) params.set('group', group);
              if (order) params.set('order', order);
              if (limit != null) params.set('limit', String(limit));
              if (offset != null) params.set('offset', String(offset));
              if (analyticsSinceDays) params.set('sinceDays', String(analyticsSinceDays));
              if (analyticsTz) params.set('tz', analyticsTz);
              if (!analyticsFill) params.set('fill', 'false');
              const qs = params.toString() ? `?${params.toString()}` : '';
              const res = await actionFetch('analytics:issued', `/api/business/analytics/coupons-issued${qs}`, { headers: { ...authHeaders } });
              const j = await res.json();
              (window as any).issuedResult = j; // for quick inspection
              showToast(j?.ok ? 'Loaded' : (j?.error || 'Error'));
            } catch (e: any) { showToast(e?.message || 'Error', 'error'); }
          }}>GET issued</button>
          <AnalyticsCsvButton endpoint={'/api/business/analytics/coupons-issued'} params={{ businessId: (document.getElementById('issuedBizId') as HTMLInputElement)?.value?.trim() || '', group: (document.getElementById('issuedGroupBiz') as HTMLInputElement)?.checked ? 'business' : '', order: (document.getElementById('issuedOrder') as HTMLSelectElement)?.value || '', limit: (document.getElementById('issuedLimit') as HTMLInputElement)?.value || '', offset: (document.getElementById('issuedOffset') as HTMLInputElement)?.value || '', sinceDays: analyticsSinceDays, tz: analyticsTz, fill: analyticsFill }} acceptLanguage={(() => { try { const p=new URL(window.location.href).searchParams.get('locale'); return p || localStorage.getItem('sync_analytics_locale') || 'en'; } catch { return 'en'; } })()} />
          <CopyCurlButton tag={'analytics:issued'} getCurl={getCurl} />
          <button className="btn" onClick={() => { if (lastCurl) { (navigator as any)?.clipboard?.writeText(lastCurl); showToast('Copied cURL', 'success'); } }} disabled={!lastCurl}>copy last cURL</button>
        </div>
        {/* Grouped table when byBusiness present */}
        {(() => {
          const r: any = (window as any).issuedResult;
          const byBiz: Record<string, Record<string, { issued: number }>> = r?.byBusiness || {};
          const bizMap: Record<string, { business_name?: string }> = r?.businesses || {};
          const hasServerGrouped = Array.isArray(r?.grouped);
          if (!hasServerGrouped && Object.keys(byBiz || {}).length === 0) return null;
          type Row = { businessId: string; total: number; days: number; avgPerDay: number; firstDay?: string; lastDay?: string };
          const rows: Row[] = hasServerGrouped ? (r.grouped as Row[]) : ((): Row[] => {
            const bizIds = Object.keys(byBiz || {});
            return bizIds.map((biz) => {
              const days = Object.keys(byBiz[biz] || {}).sort();
              const total = days.reduce((m, d) => m + Number((byBiz[biz][d] as any)?.issued || 0), 0);
              const nDays = Math.max(1, days.length);
              const avg = Math.round((total / nDays) * 10) / 10;
              return { businessId: biz, total, days: nDays, avgPerDay: avg, firstDay: days[0], lastDay: days[days.length - 1] };
            });
          })();
          const [sortCol, setSortCol] = React.useState<'businessId'|'total'|'avgPerDay'|'firstDay'|'lastDay'>('total');
          const [sortDir, setSortDir] = React.useState<'asc'|'desc'>('desc');
          const sorted = [...rows].sort((a, b) => {
            const key = sortCol;
            const av = (a as any)[key];
            const bv = (b as any)[key];
            if (av === bv) return 0;
            const cmp = av > bv ? 1 : -1;
            return sortDir === 'asc' ? cmp : -cmp;
          });
          const toggle = (col: typeof sortCol) => {
            if (sortCol === col) setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
            else { setSortCol(col); setSortDir(col === 'businessId' ? 'asc' : 'desc'); }
          };
          const sortCaret = (col: typeof sortCol) => sortCol === col ? (sortDir === 'asc' ? ' ▲' : ' ▼') : '';
          const exportGroupedCsv = () => {
            try {
              const headers = ['businessId','total','avgPerDay','firstDay','lastDay'];
              const escape = (v: any) => JSON.stringify(v == null ? '' : String(v));
              const lines = [headers.join(',')].concat(sorted.map(r => headers.map(h => escape((r as any)[h])).join(',')));
              const csv = lines.join('\n');
              const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
              const u = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = u;
              a.download = `issued_grouped_${Date.now()}.csv`;
              a.click();
              URL.revokeObjectURL(u);
              showToast('Exported grouped CSV', 'success');
            } catch (e: any) { showToast(e?.message || 'CSV export error', 'error'); }
          };
          return (
            <div style={{ marginTop: 12 }}>
              <div className="flex gap-2" style={{ marginBottom: 6 }}>
                <span className="muted text-sm">Grouped by business</span>
                <button className="btn" onClick={exportGroupedCsv}>export grouped CSV</button>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }} className={compactRows ? 'compact' : ''}>
                  <thead>
                    <tr>
                      <th aria-sort={sortCol==='businessId' ? (sortDir==='asc'?'ascending':'descending') : 'none'} style={{ position: 'sticky', top: 0, zIndex: 1, background: 'var(--card)', textAlign: 'left', borderBottom: '1px solid #333', padding: '6px 8px', cursor: 'pointer' }} onClick={() => toggle('businessId')}>business{sortCaret('businessId')}</th>
                      <th aria-sort={sortCol==='total' ? (sortDir==='asc'?'ascending':'descending') : 'none'} style={{ position: 'sticky', top: 0, zIndex: 1, background: 'var(--card)', textAlign: 'right', borderBottom: '1px solid #333', padding: '6px 8px', cursor: 'pointer' }} onClick={() => toggle('total')}>total{sortCaret('total')}</th>
                      <th aria-sort={sortCol==='avgPerDay' ? (sortDir==='asc'?'ascending':'descending') : 'none'} style={{ position: 'sticky', top: 0, zIndex: 1, background: 'var(--card)', textAlign: 'right', borderBottom: '1px solid #333', padding: '6px 8px', cursor: 'pointer' }} onClick={() => toggle('avgPerDay')}>issued/day{sortCaret('avgPerDay')}</th>
                      <th aria-sort={sortCol==='firstDay' ? (sortDir==='asc'?'ascending':'descending') : 'none'} style={{ position: 'sticky', top: 0, zIndex: 1, background: 'var(--card)', textAlign: 'left', borderBottom: '1px solid #333', padding: '6px 8px', cursor: 'pointer' }} onClick={() => toggle('firstDay')}>first{sortCaret('firstDay')}</th>
                      <th aria-sort={sortCol==='lastDay' ? (sortDir==='asc'?'ascending':'descending') : 'none'} style={{ position: 'sticky', top: 0, zIndex: 1, background: 'var(--card)', textAlign: 'left', borderBottom: '1px solid #333', padding: '6px 8px', cursor: 'pointer' }} onClick={() => toggle('lastDay')}>last{sortCaret('lastDay')}</th>
                      <th style={{ position: 'sticky', top: 0, zIndex: 1, background: 'var(--card)', textAlign: 'left', borderBottom: '1px solid #333', padding: '6px 8px' }}>copy</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sorted.map((row) => (
                      <tr key={row.businessId}>
                        <td style={{ padding: '6px 8px', borderBottom: '1px solid #222' }}>
                          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                            <span style={{ fontFamily: 'monospace' }}>{row.businessId}</span>
                            {bizMap[row.businessId]?.business_name ? (<span className="muted text-xs">{bizMap[row.businessId]?.business_name}</span>) : null}
                          </div>
                        </td>
                        <td style={{ padding: '6px 8px', borderBottom: '1px solid #222', textAlign: 'right' }}>{row.total}</td>
                        <td style={{ padding: '6px 8px', borderBottom: '1px solid #222', textAlign: 'right' }}>{row.avgPerDay}</td>
                        <td style={{ padding: '6px 8px', borderBottom: '1px solid #222' }}>{row.firstDay || ''}</td>
                        <td style={{ padding: '6px 8px', borderBottom: '1px solid #222' }}>{row.lastDay || ''}</td>
                        <td style={{ padding: '6px 8px', borderBottom: '1px solid #222' }}>
                          <button className="btn" onClick={() => { try { (navigator as any)?.clipboard?.writeText(row.businessId); showToast('copied business id','success'); } catch {} }}>copy id</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })()}
        {/* Tiny chart for issued per day using trends if available */}
        {(() => {
          const series = ((window as any).issuedResult?.byDay || []) as Array<{ day: string; issued: number }>;
          if (!Array.isArray(series) || series.length === 0) return null;
          const data = Object.fromEntries(series.map(r => [r.day, { issued: Number(r.issued||0) }]));
          const entries = Object.entries(data) as Array<[string, any]>;
          const maxY = entries.reduce((m, [, v]) => Math.max(m, Number((v as any).issued||0)), 1);
          return (
            <div style={{ marginTop: 12 }}>
              <div className="muted text-sm" style={{ marginBottom: 4 }}>Issued per day</div>
              <MiniBars
                entries={entries}
                maxY={maxY}
                showTooltips={showTooltips}
                legend={<div className="muted text-xs"><span style={{ display: 'inline-block', width: 8, height: 8, background: '#8e24aa', marginRight: 4 }}></span>issued</div>}
                renderBar={(day, v, scaled) => {
                  const y = Number((v as any).issued || 0);
                  const h = scaled(y);
                  return (<div title={showTooltips ? `${day}: ${y}` : undefined} style={{ width: 10, height: h, background: '#8e24aa' }}></div>);
                }}
              />
            </div>
          );
        })()}
        <div className="muted text-xs" style={{ marginTop: 6 }}>Use an owner bearer token for group=business.</div>
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


