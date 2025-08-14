import { chromium } from 'playwright';

const BASE_URL = process.env.BASE_URL || process.env.DEPLOYED_BASE_URL || '';
const FAIL = String(process.env.A11Y_FAIL || 'false').toLowerCase() === 'true';

async function runAxe(path) {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto(`${BASE_URL.replace(/\/$/, '')}${path}`);
  // Inject axe
  await page.addScriptTag({ url: 'https://unpkg.com/axe-core@4.9.1/axe.min.js' });
  const results = await page.evaluate(async () => {
    // @ts-ignore
    return await window.axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa'] } });
  });
  await browser.close();
  return results;
}

async function main() {
  if (!BASE_URL) { console.log('A11Y: BASE_URL not set, skipping'); return; }
  const targets = ['/react'];
  // Optionally expand to more routes later
  const violations = [];
  for (const t of targets) {
    const r = await runAxe(t);
    if (r.violations?.length) {
      violations.push({ path: t, count: r.violations.length, rules: r.violations.map(v => v.id) });
    }
  }
  if (violations.length) {
    console.error('A11Y violations', JSON.stringify(violations, null, 2));
    if (FAIL) process.exit(5);
  } else {
    console.log('A11Y OK');
  }
}

main().catch(e => { console.error('A11Y ERROR', e?.message || e); if (FAIL) process.exit(6); });


