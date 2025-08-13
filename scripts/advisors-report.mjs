/**
 * Fetch Supabase Advisors and open/update a GitHub issue with findings.
 * Env:
 *  - SUPABASE_PAT, SUPABASE_PROJECT_ID
 *  - GITHUB_TOKEN, GITHUB_REPOSITORY
 */

const PAT = process.env.SUPABASE_PAT || '';
const PROJECT_ID = process.env.SUPABASE_PROJECT_ID || '';
const GH_TOKEN = process.env.GITHUB_TOKEN || '';
const GH_REPO = process.env.GITHUB_REPOSITORY || '';

if (!PAT || !PROJECT_ID || !GH_TOKEN || !GH_REPO) {
  console.log('advisors-report: missing env (SUPABASE_PAT/PROJECT_ID or GITHUB_TOKEN/REPOSITORY). Skipping.');
  process.exit(0);
}

async function getAdvisors(type) {
  const url = `https://api.supabase.com/v1/projects/${PROJECT_ID}/advisors?type=${encodeURIComponent(type)}`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${PAT}`, Accept: 'application/json' } });
  if (!res.ok) throw new Error(`Advisors request failed: ${res.status}`);
  return await res.json();
}

function mdForIssues(issues) {
  if (!issues.length) return '';
  const lines = ['### Supabase Advisors Findings', '', '| Type | Title | Severity | Link |', '| --- | --- | --- | --- |'];
  for (const i of issues) {
    const link = i.remediation ? `[remediation](${i.remediation})` : '';
    lines.push(`| ${i.type} | ${i.title} | ${i.severity} | ${link} |`);
  }
  return lines.join('\n');
}

async function ghRequest(path, init) {
  const res = await fetch(`https://api.github.com/repos/${GH_REPO}${path}`, {
    ...(init || {}),
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${GH_TOKEN}`,
      ...(init?.headers || {}),
    },
  });
  if (!res.ok) throw new Error(`GitHub request failed: ${res.status} ${await res.text()}`);
  return res.json();
}

async function main() {
  const findings = [];
  for (const t of ['security', 'performance']) {
    try {
      const r = await getAdvisors(t);
      const list = Array.isArray(r?.advisors) ? r.advisors : (r || []);
      for (const adv of list) {
        findings.push({ type: t, title: adv?.title || adv?.name || 'advisory', severity: String(adv?.severity || adv?.level || ''), remediation: adv?.remediation_url || adv?.url || adv?.link || '' });
      }
    } catch (e) {
      // continue
    }
  }
  if (!findings.length) {
    console.log('advisors-report: no findings');
    return;
  }
  const title = 'Supabase Advisors findings';
  const body = mdForIssues(findings);
  try {
    const existing = await ghRequest(`/issues?labels=advisors&state=open&per_page=5`);
    const match = existing.find((i) => i.title === title);
    if (match) {
      await ghRequest(`/issues/${match.number}`, { method: 'PATCH', body: JSON.stringify({ body }) });
      console.log('advisors-report: updated existing issue #', match.number);
      return;
    }
  } catch {}
  const created = await ghRequest(`/issues`, { method: 'POST', body: JSON.stringify({ title, body, labels: ['advisors'] }) });
  console.log('advisors-report: created issue #', created.number);
}

main().catch((e) => { console.error('advisors-report error:', e?.message || e); process.exit(0); });


