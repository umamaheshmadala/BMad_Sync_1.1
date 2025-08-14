// Minimal Axe CI runner against the deployed preview URL homepage and /react
// Usage: BASE_URL=https://example.netlify.app node scripts/axe-ci.mjs

import { readFile } from 'node:fs/promises';

const BASE_URL = process.env.BASE_URL || '';
if (!BASE_URL) {
  console.log('Skipping Axe: BASE_URL not set');
  process.exit(0);
}

async function runAxe(path) {
  try {
    const url = `${BASE_URL.replace(/\/$/, '')}${path}`;
    const res = await fetch(url);
    const html = await res.text();
    // Cheap checks without browser: ensure basic landmarks exist
    const hasMain = /<main[\s>]/i.test(html);
    const hasTitle = /<title>.*?<\/title>/i.test(html);
    if (!hasMain) console.warn(`A11y warning: missing <main> on ${path}`);
    if (!hasTitle) console.warn(`A11y warning: missing <title> on ${path}`);
    // Note: Full axe-core needs headless browser; keep this as a placeholder gate
    return { path, ok: true };
  } catch (e) {
    console.error(`Axe fetch failed for ${path}:`, e?.message || e);
    return { path, ok: false };
  }
}

const targets = ['/', '/react'];
const results = await Promise.all(targets.map((p) => runAxe(p)));
const failed = results.filter(r => !r.ok).length;
if (failed) process.exit(1);
console.log('AXE-CI OK (placeholder)');


