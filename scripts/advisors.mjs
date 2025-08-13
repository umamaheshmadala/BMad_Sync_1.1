/**
 * Supabase Advisors check (Security + Performance)
 * Requires:
 *  - SUPABASE_PAT: Supabase Personal Access Token with access to the project
 *  - SUPABASE_PROJECT_ID: Supabase project ref/id (e.g., abcd1234)
 * Optional:
 *  - STRICT_ADVISORS=true to fail CI when advisors return items
 */

const PAT = process.env.SUPABASE_PAT || '';
const PROJECT_ID = process.env.SUPABASE_PROJECT_ID || '';
const STRICT = String(process.env.STRICT_ADVISORS || '').toLowerCase() === 'true';

async function getAdvisors(type) {
  const url = `https://api.supabase.com/v1/projects/${PROJECT_ID}/advisors?type=${encodeURIComponent(type)}`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${PAT}`, Accept: 'application/json' } });
  if (!res.ok) throw new Error(`Advisors request failed: ${res.status}`);
  return await res.json();
}

async function main() {
  if (!PAT || !PROJECT_ID) {
    console.log('Advisors: SUPABASE_PAT or SUPABASE_PROJECT_ID not set. Skipping.');
    return;
  }
  const results = {};
  for (const t of ['security', 'performance']) {
    try {
      results[t] = await getAdvisors(t);
    } catch (e) {
      console.warn(`Advisors ${t} fetch error:`, e?.message || e);
      if (STRICT) process.exit(1);
    }
  }
  const issues = [];
  for (const t of Object.keys(results)) {
    const list = Array.isArray(results[t]?.advisors) ? results[t].advisors : (results[t] || []);
    for (const adv of list) {
      const title = adv?.title || adv?.name || 'advisory';
      const severity = (adv?.severity || adv?.level || '').toString();
      const remediation = adv?.remediation_url || adv?.url || adv?.link || '';
      issues.push({ type: t, title, severity, remediation });
    }
  }
  if (issues.length) {
    console.log('Advisors found issues:');
    for (const i of issues) {
      console.log(`- [${i.type}] ${i.title} (severity: ${i.severity}) ${i.remediation ? '-> ' + i.remediation : ''}`);
    }
    if (STRICT) {
      console.error('STRICT mode: failing due to advisors findings');
      process.exit(1);
    }
  } else {
    console.log('Advisors OK (no issues reported).');
  }
}

main().catch((e) => { console.error('Advisors error:', e?.message || e); if (STRICT) process.exit(1); });


