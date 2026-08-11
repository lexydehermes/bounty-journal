// ============================================
// SUPABASE CLIENT CONFIG
// Bounty Journal — Lexy Dehermes
// ============================================
// NOTE: anon_key is SAFE to expose publicly. It only allows
// READ access (per RLS policy). Write requires authenticated login.

const SUPABASE_CONFIG = {
  url: "https://xdnzkiaoxvajjewvxhuy.supabase.co",
  anonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhkbnpraWFveHZhampld3Z4aHV5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY0NjI4MTYsImV4cCI6MjEwMjAzODgxNn0.t_b3MInTpgDdN-TE50lfkgLJx8KusIlwgBbmu3W3C0w",
  table: "bounty_entries"
};

// REST helper — read entries (public, uses anon key)
async function fetchEntries() {
  const url = `${SUPABASE_CONFIG.url}/rest/v1/${SUPABASE_CONFIG.table}?select=*&order=date.desc`;
  const res = await fetch(url, {
    headers: {
      apikey: SUPABASE_CONFIG.anonKey,
      Authorization: `Bearer ${SUPABASE_CONFIG.anonKey}`
    }
  });
  if (!res.ok) throw new Error(`Supabase fetch failed: ${res.status}`);
  const rows = await res.json();
  // Normalize DB row -> frontend entry shape
  return rows.map(r => ({
    id: r.slug,
    dbId: r.id,
    title: r.title,
    severity: r.severity,
    target: r.target,
    date: r.date,
    bounty: r.bounty || 0,
    cve: r.cve,
    cvss: r.cvss,
    technique: r.technique || '',
    description: r.description || '',
    steps: r.steps || '',
    impact: r.impact || '',
    remediation: r.remediation || '',
    status: r.status || 'Resolved',
    references: Array.isArray(r.refs) ? r.refs : []
  }));
}
