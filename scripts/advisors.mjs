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
    // Attempt to open/update a GitHub issue labeled 'advisors'
    await createOrUpdateAdvisorsIssue(issues).catch((e) => console.warn('Advisors issue update failed:', e?.message || e));
    if (STRICT) {
      console.error('STRICT mode: failing due to advisors findings');
      process.exit(1);
    }
  } else {
    console.log('Advisors OK (no issues reported).');
    // Optionally close existing advisors issue if present
    await closeAdvisorsIssueIfAny().catch(() => {});
  }
}

main().catch((e) => { console.error('Advisors error:', e?.message || e); if (STRICT) process.exit(1); });


async function createOrUpdateAdvisorsIssue(issues) {
  const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
  const repoFull = process.env.GITHUB_REPOSITORY; // owner/repo
  if (!token || !repoFull) return;
  const [owner, repo] = repoFull.split('/');
  const api = 'https://api.github.com';

  const title = 'Supabase Advisors Findings';
  const body = buildIssueBody(issues);

  // Find existing open issue with label 'advisors'
  const listUrl = `${api}/repos/${owner}/${repo}/issues?labels=${encodeURIComponent('advisors')}&state=open&per_page=1`;
  const existing = await fetch(listUrl, { headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json' } }).then(r => r.ok ? r.json() : []);
  if (Array.isArray(existing) && existing.length) {
    const issue = existing[0];
    const patchUrl = `${api}/repos/${owner}/${repo}/issues/${issue.number}`;
    await fetch(patchUrl, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json', 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, body, labels: Array.from(new Set([...(issue.labels || []).map(l => l.name || l), 'advisors'])) }),
    });
    return;
  }
  // Create new issue
  const createUrl = `${api}/repos/${owner}/${repo}/issues`;
  await fetch(createUrl, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json', 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, body, labels: ['advisors'] }),
  });
}

async function closeAdvisorsIssueIfAny() {
  const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
  const repoFull = process.env.GITHUB_REPOSITORY;
  if (!token || !repoFull) return;
  const [owner, repo] = repoFull.split('/');
  const api = 'https://api.github.com';
  const listUrl = `${api}/repos/${owner}/${repo}/issues?labels=${encodeURIComponent('advisors')}&state=open&per_page=1`;
  const existing = await fetch(listUrl, { headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json' } }).then(r => r.ok ? r.json() : []);
  if (Array.isArray(existing) && existing.length) {
    const issue = existing[0];
    const patchUrl = `${api}/repos/${owner}/${repo}/issues/${issue.number}`;
    await fetch(patchUrl, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json', 'Content-Type': 'application/json' },
      body: JSON.stringify({ state: 'closed' }),
    });
  }
}

function buildIssueBody(issues) {
  const lines = [];
  lines.push('## Supabase Advisors Findings');
  const counts = issues.reduce((acc, i) => { const sev = String(i.severity || 'unknown').toLowerCase(); acc[sev] = (acc[sev]||0)+1; return acc; }, {});
  lines.push('');
  lines.push(Object.entries(counts).map(([k,v]) => `- ${k}: ${v}`).join('\n'));
  lines.push('');
  lines.push('| Type | Title | Severity | Remediation |');
  lines.push('|------|-------|----------|-------------|');
  for (const i of issues) {
    const link = i.remediation ? `[link](${i.remediation})` : '';
    lines.push(`| ${i.type} | ${escapePipes(i.title)} | ${i.severity} | ${link} |`);
  }
  lines.push('');
  lines.push('_This issue is auto-managed by CI._');
  return lines.join('\n');
}

function escapePipes(s='') { return String(s).replace(/\|/g, '\\|'); }


