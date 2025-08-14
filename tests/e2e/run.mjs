// Playwright + fetch E2E covering analytics flows
import { chromium } from 'playwright';
import { writeFile, mkdir } from 'node:fs/promises';

const BASE_URL = process.env.BASE_URL || process.env.DEPLOYED_BASE_URL || 'http://localhost:5173';
const OWNER = process.env.TOKEN || process.env.OWNER_BEARER || '';
const ART_DIR = 'e2e-artifacts';

function url(p) { return `${BASE_URL.replace(/\/$/, '')}${p}`; }

async function save(name, content) {
  try { await mkdir(ART_DIR, { recursive: true }); await writeFile(`${ART_DIR}/${name}`, content); } catch {}
}

async function get(path, headers = {}) {
  const res = await fetch(url(path), { headers });
  const text = await res.text();
  let json; try { json = JSON.parse(text); } catch {}
  return { res, text, json };
}

async function csvChecks(path, lang) {
  const h = Object.assign({}, (lang?{'Accept-Language':lang}:{}), (OWNER?{Authorization:OWNER}:{}));
  const r1 = await get(path, h);
  if (!r1.res.ok) throw new Error(`CSV status ${r1.res.status}`);
  const cd = r1.res.headers.get('Content-Disposition') || '';
  const vary = r1.res.headers.get('Vary') || '';
  const cl = r1.res.headers.get('Content-Language') || '';
  if (!cd.toLowerCase().includes('filename*=')) throw new Error('Missing filename*');
  if (!vary.includes('Accept-Language')) throw new Error('Missing Vary');
  if (lang && !cl) throw new Error('Missing Content-Language');
  await save(path.replaceAll(/[\/?&=]/g,'_') + '.csv', r1.text);
  const et = r1.res.headers.get('ETag');
  if (et) {
    const h2 = Object.assign({}, h, { 'If-None-Match': et });
    const r2 = await fetch(url(path), { headers: h2 });
    if (r2.status !== 304) throw new Error('Expected 304 on ETag');
  }
  // Basic CSV safety: ensure no formula injection lines start with dangerous characters unless quoted
  const firstLine = r1.text.split('\n')[1] || '';
  if (/^[=+\-@]/.test(firstLine)) throw new Error('CSV may be vulnerable to formula injection');
}

async function jsonChecks(path) {
  const r = await get(path, OWNER ? { Authorization: OWNER } : {});
  if (!r.res.ok) throw new Error(`JSON status ${r.res.status}`);
  await save(path.replaceAll(/[\/?&=]/g,'_') + '.json', JSON.stringify(r.json || {}, null, 2));
}

async function main() {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto(url('/react'));
  await page.waitForSelector('body');
  await browser.close();

  // JSON flows
  await jsonChecks('/api/business/analytics/trends?sinceDays=1');
  // CSV flows (localized + 304)
  await csvChecks('/api/business/analytics/trends?sinceDays=1&format=csv', 'fr');
  await csvChecks('/api/business/analytics/funnel?sinceDays=1&format=csv', 'es');
  // Owner-only grouped issued (CSV): only when token set
  if (OWNER) {
    await csvChecks('/api/business/analytics/coupons-issued?group=business&sinceDays=1&order=total.desc&limit=2&offset=0&format=csv');
  } else {
    // Negative: expect 403 when accessing owner-only grouping without token
    const r = await get('/api/business/analytics/coupons-issued?group=business&sinceDays=1');
    if (r.res.status !== 403 && r.res.status !== 401) throw new Error('Expected 401/403 for owner-only');
  }
  // Pagination/negative params
  const bad = await get('/api/business/analytics/coupons-issued?group=business&sinceDays=9999');
  if (bad.res.status !== 400) throw new Error('Expected 400 for range_exceeds_cap');
  const badTz = await get('/api/business/analytics/trends?tz=Not/AZone');
  if (badTz.res.status !== 400) throw new Error('Expected 400 for invalid tz');
}

main().catch((e) => { console.error('E2E FAIL', e?.message || e); process.exit(2); });


