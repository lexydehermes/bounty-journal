// ============================================
// BOUNTY JOURNAL — Admin Panel Logic
// Auth (Supabase Auth) + CRUD on bounty_entries
// ============================================

const SB_URL = "https://xdnzkiaoxvajjewvxhuy.supabase.co";
const SB_ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhkbnpraWFveHZhampld3Z4aHV5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY0NjI4MTYsImV4cCI6MjEwMjAzODgxNn0.t_b3MInTpgDdN-TE50lfkgLJx8KusIlwgBbmu3W3C0w";
const TABLE = "bounty_entries";

const sb = supabase.createClient(SB_URL, SB_ANON);

// DOM
const $ = (id) => document.getElementById(id);
const loginView = $('loginView');
const adminView = $('adminView');
const editorOverlay = $('editorOverlay');

const SEV_COLORS = {
  critical: '#ff4d6a', high: '#ff8c42', medium: '#f0c040', low: '#4caf50', info: '#42a5f5'
};

function showMsg(el, text, type) {
  el.textContent = text;
  el.className = 'msg ' + (type === 'ok' ? 'ok' : 'err');
  if (type === 'ok') setTimeout(() => { el.className = 'msg'; }, 3000);
}

// ---------- AUTH ----------
async function checkSession() {
  const { data } = await sb.auth.getSession();
  if (data.session) {
    showAdmin();
  } else {
    loginView.classList.remove('hidden');
    adminView.classList.add('hidden');
  }
}

async function login() {
  const email = $('email').value.trim();
  const password = $('password').value;
  if (!email || !password) { showMsg($('loginMsg'), 'Isi email & password.', 'err'); return; }
  $('loginBtn').textContent = 'Signing in…';
  $('loginBtn').disabled = true;
  const { error } = await sb.auth.signInWithPassword({ email, password });
  $('loginBtn').textContent = 'Sign In';
  $('loginBtn').disabled = false;
  if (error) { showMsg($('loginMsg'), error.message, 'err'); return; }
  showAdmin();
}

async function logout() {
  await sb.auth.signOut();
  location.reload();
}

function showAdmin() {
  loginView.classList.add('hidden');
  adminView.classList.remove('hidden');
  loadEntries();
}

// ---------- CRUD ----------
async function loadEntries() {
  const list = $('entryList');
  list.innerHTML = '<p style="color:var(--text-secondary);">Loading…</p>';
  const { data, error } = await sb.from(TABLE).select('*').order('date', { ascending: false });
  if (error) { list.innerHTML = ''; showMsg($('adminMsg'), 'Load error: ' + error.message, 'err'); return; }

  $('countLabel').textContent = `${data.length} entries`;
  if (!data.length) { list.innerHTML = '<p style="color:var(--text-secondary);">Belum ada entri. Klik "+ New Entry".</p>'; return; }

  list.innerHTML = data.map(e => `
    <div class="adm-entry" style="--sev:${SEV_COLORS[e.severity] || '#333'}">
      <div class="info">
        <div class="slug">${e.slug}</div>
        <div class="ttl">${escapeHtml(e.title)}</div>
        <div class="sub">
          <span class="sev-tag" style="background:${SEV_COLORS[e.severity]}22;color:${SEV_COLORS[e.severity]}">${e.severity}</span>
          &nbsp;·&nbsp; ${e.target || '—'} &nbsp;·&nbsp; ${e.date || '—'} &nbsp;·&nbsp; $${(e.bounty||0).toLocaleString()}
        </div>
      </div>
      <div class="actions">
        <button class="btn btn-ghost btn-sm" onclick="editEntry(${e.id})">Edit</button>
        <button class="btn btn-danger btn-sm" onclick="deleteEntry(${e.id}, '${e.slug}')">Delete</button>
      </div>
    </div>
  `).join('');
}

let editCache = {};

function openEditor(entry) {
  $('editorMsg').className = 'msg';
  $('editorTitle').textContent = entry ? 'Edit Entry' : 'New Entry';
  $('f_id').value = entry ? entry.id : '';
  $('f_slug').value = entry ? entry.slug : '';
  $('f_severity').value = entry ? entry.severity : 'medium';
  $('f_title').value = entry ? entry.title : '';
  $('f_target').value = entry ? (entry.target || '') : '';
  $('f_date').value = entry ? (entry.date || '') : new Date().toISOString().slice(0,10);
  $('f_bounty').value = entry ? (entry.bounty || 0) : 0;
  $('f_cve').value = entry ? (entry.cve || '') : '';
  $('f_cvss').value = entry ? (entry.cvss || '') : '';
  $('f_status').value = entry ? (entry.status || 'Resolved') : 'Resolved';
  $('f_technique').value = entry ? (entry.technique || '') : '';
  $('f_description').value = entry ? (entry.description || '') : '';
  $('f_steps').value = entry ? (entry.steps || '') : '';
  $('f_impact').value = entry ? (entry.impact || '') : '';
  $('f_remediation').value = entry ? (entry.remediation || '') : '';
  $('f_refs').value = entry && Array.isArray(entry.refs) ? entry.refs.join('\n') : '';
  editorOverlay.classList.add('active');
}

window.editEntry = async function(id) {
  const { data, error } = await sb.from(TABLE).select('*').eq('id', id).single();
  if (error) { showMsg($('adminMsg'), error.message, 'err'); return; }
  openEditor(data);
};

window.deleteEntry = async function(id, slug) {
  if (!confirm(`Hapus entri "${slug}"? Tindakan ini permanen.`)) return;
  const { error } = await sb.from(TABLE).delete().eq('id', id);
  if (error) { showMsg($('adminMsg'), 'Delete gagal: ' + error.message, 'err'); return; }
  showMsg($('adminMsg'), `Entri ${slug} dihapus.`, 'ok');
  loadEntries();
};

async function saveEntry() {
  const id = $('f_id').value;
  const refs = $('f_refs').value.split('\n').map(s => s.trim()).filter(Boolean);
  const payload = {
    slug: $('f_slug').value.trim(),
    severity: $('f_severity').value,
    title: $('f_title').value.trim(),
    target: $('f_target').value.trim() || null,
    date: $('f_date').value || null,
    bounty: parseInt($('f_bounty').value) || 0,
    cve: $('f_cve').value.trim() || null,
    cvss: $('f_cvss').value ? parseFloat($('f_cvss').value) : null,
    status: $('f_status').value.trim() || 'Resolved',
    technique: $('f_technique').value.trim() || null,
    description: $('f_description').value.trim() || null,
    steps: $('f_steps').value || null,
    impact: $('f_impact').value.trim() || null,
    remediation: $('f_remediation').value.trim() || null,
    refs: refs
  };

  if (!payload.slug || !payload.title) {
    showMsg($('editorMsg'), 'Slug dan Title wajib diisi.', 'err'); return;
  }

  $('saveBtn').textContent = 'Saving…';
  $('saveBtn').disabled = true;

  let error;
  if (id) {
    ({ error } = await sb.from(TABLE).update(payload).eq('id', id));
  } else {
    ({ error } = await sb.from(TABLE).insert(payload));
  }

  $('saveBtn').textContent = 'Save Entry';
  $('saveBtn').disabled = false;

  if (error) {
    const dup = error.message.includes('duplicate') || error.code === '23505';
    showMsg($('editorMsg'), dup ? 'Slug sudah dipakai. Pakai slug unik.' : error.message, 'err');
    return;
  }

  editorOverlay.classList.remove('active');
  showMsg($('adminMsg'), id ? 'Entri diupdate.' : 'Entri baru dipublish!', 'ok');
  loadEntries();
}

function escapeHtml(str) {
  const d = document.createElement('div'); d.textContent = str || ''; return d.innerHTML;
}

// ---------- EVENTS ----------
$('loginBtn').addEventListener('click', login);
$('password').addEventListener('keydown', e => { if (e.key === 'Enter') login(); });
$('logoutBtn').addEventListener('click', logout);
$('newBtn').addEventListener('click', () => openEditor(null));
$('cancelBtn').addEventListener('click', () => editorOverlay.classList.remove('active'));
$('saveBtn').addEventListener('click', saveEntry);
editorOverlay.addEventListener('click', e => { if (e.target === editorOverlay) editorOverlay.classList.remove('active'); });

// Boot
checkSession();
