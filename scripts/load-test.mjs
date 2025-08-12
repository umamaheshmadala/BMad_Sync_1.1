// Simple HTTP load probe for key endpoints (Node 20+)
// Usage:
//   BASE_URL=http://localhost:8888 TOKEN="Bearer <jwt>" node scripts/load-test.mjs
//   BASE_URL=https://tiny-bombolone-8f8acf.netlify.app TOKEN="Bearer <jwt>" node scripts/load-test.mjs

const BASE_URL = process.env.BASE_URL || 'http://localhost:8888';
const TOKEN = process.env.TOKEN || '';
const CONCURRENCY = Number(process.env.CONCURRENCY || 10);
const ITERATIONS = Number(process.env.ITERATIONS || 200);

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function timedFetch(path) {
  const url = `${BASE_URL}${path}`;
  const headers = TOKEN ? { Authorization: TOKEN } : {};
  const start = performance.now();
  const res = await fetch(url, { headers });
  const end = performance.now();
  // Consume body to avoid leaked handles
  try { await res.text(); } catch {}
  return end - start;
}

function p95(values) {
  const sorted = [...values].sort((a, b) => a - b);
  const idx = Math.ceil(sorted.length * 0.95) - 1;
  return Math.max(0, Math.round(sorted[idx]));
}

async function runLoad(label, path) {
  const latencies = [];
  let inFlight = 0;
  let completed = 0;
  async function worker() {
    while (completed < ITERATIONS) {
      const myIndex = completed++;
      if (myIndex >= ITERATIONS) break;
      inFlight++;
      try {
        const ms = await timedFetch(path);
        latencies.push(ms);
      } catch (_) {
        latencies.push(9999);
      } finally {
        inFlight--;
      }
    }
  }
  const workers = Array.from({ length: CONCURRENCY }, () => worker());
  await Promise.all(workers);
  console.log(`${label}: p95=${p95(latencies)}ms  n=${latencies.length}`);
}

(async () => {
  console.log(`Base: ${BASE_URL}  Concurrency: ${CONCURRENCY}  Iterations: ${ITERATIONS}`);
  await runLoad('GET /api/platform/health', '/api/platform/health');
  await sleep(200);
  await runLoad('GET /api/business/analytics/trends', '/api/business/analytics/trends');
  await sleep(200);
  // Funnel requires auth; run only if token present
  if (TOKEN) {
    await runLoad('GET /api/business/analytics/funnel', '/api/business/analytics/funnel');
  } else {
    console.log('Skipping /api/business/analytics/funnel (no TOKEN provided)');
  }
})();


