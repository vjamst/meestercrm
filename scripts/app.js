// scripts/app.js
import {
  initSupabase, getSupabase, getUser,
  ensureAuth, onAuthChange, saveConfig, getSavedConfig
} from './supabaseClient.js';

/* ---------------- UI helpers ---------------- */
function setConnection(ok, text) {
  const el = document.getElementById('connection-indicator');
  el.textContent = text || (ok ? 'Verbonden' : 'Niet verbonden');
  el.classList.toggle('status-badge--success', !!ok);
  el.classList.toggle('status-badge--danger', !ok);
}
const qs = (s) => document.querySelector(s);
const qsa = (s) => Array.from(document.querySelectorAll(s));

/* ---------------- Navigation ---------------- */
qsa('.nav-button').forEach(btn => {
  btn.addEventListener('click', () => {
    qsa('.nav-button').forEach(b => b.classList.remove('active'));
    qsa('.view').forEach(v => v.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById(btn.dataset.target).classList.add('active');
  });
});

/* ---------------- Modals ---------------- */
const backdrop = qs('#modal-backdrop');
const supabaseModal = qs('#supabase-modal');
const clientModal = qs('#client-modal');

function openModal(m) { backdrop.classList.remove('hidden'); m.classList.remove('hidden'); }
function closeModal(m) { backdrop.classList.add('hidden'); m.classList.add('hidden'); }

/* Supabase settings modal */
qs('#open-supabase-settings').addEventListener('click', () => {
  const cfg = getSavedConfig();
  if (cfg.url) qs('#supabase-url').value = cfg.url;
  if (cfg.key) qs('#supabase-key').value = cfg.key;
  openModal(supabaseModal);
});
qs('#cancel-supabase').addEventListener('click', () => closeModal(supabaseModal));
qs('#supabase-form').addEventListener('submit', (e) => {
  e.preventDefault();
  const url = qs('#supabase-url').value.trim();
  const key = qs('#supabase-key').value.trim();
  saveConfig({ url, key });
  closeModal(supabaseModal);
  bootstrap();
});

/* Client modal open/close */
function openClientModal() {
  qs('#client-form').reset();
  qs('#client-modal-title').textContent = 'Nieuwe klant';
  openModal(clientModal);
}
qs('#add-client')?.addEventListener('click', openClientModal);
qs('#empty-add-client')?.addEventListener('click', openClientModal);
qs('#cancel-client')?.addEventListener('click', () => closeModal(clientModal));

/* ---------------- Clients: CRUD ---------------- */
async function saveClient(payload) {
  const sb = getSupabase();
  const user = await getUser();
  if (!user) { await ensureAuth(); return; }

  const { error } = await sb.from('clients').insert({
    user_id: user.id,
    name: payload.name,
    email: payload.email || null,
    phone: payload.phone || null,
    hourly_rate: payload.rate ? Number(payload.rate) : 0,
    notes: payload.notes || null
  });

  if (error) {
    alert('Opslaan mislukt: ' + error.message);
    return;
  }
  closeModal(clientModal);
  await loadClients();
}

qs('#client-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const name = qs('#client-name').value.trim();
  if (!name) return;

  const payload = {
    name,
    email: qs('#client-email').value.trim(),
    phone: qs('#client-phone').value.trim(),
    rate:  qs('#client-rate').value,
    notes: qs('#client-notes').value
  };
  await saveClient(payload);
});

async function loadClients() {
  const sb = getSupabase();
  const user = await getUser();
  if (!user) return;

  const { data, error } = await sb
    .from('clients')
    .select('id,name,email,phone,hourly_rate,created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error(error);
    return;
  }

  const tbody = qs('#clients-table');
  const empty = qs('#clients-empty');

  if (!data || data.length === 0) {
    tbody.innerHTML = '';
    empty.classList.remove('hidden');
    return;
  }
  empty.classList.add('hidden');

  tbody.innerHTML = data.map(c => `
    <tr>
      <td>${c.name ?? ''}</td>
      <td>${[c.email, c.phone].filter(Boolean).join('<br>')}</td>
      <td>€ ${Number(c.hourly_rate ?? 0).toFixed(2)}</td>
      <td>—</td>
      <td><button class="ghost-button" data-id="${c.id}">Wijzig</button></td>
    </tr>
  `).join('');
}

/* ---------------- Bootstrap ---------------- */
async function bootstrap() {
  const sb = initSupabase();
  if (!sb) {
    setConnection(false, 'Niet verbonden');
    return;
  }
  setConnection(true, 'Verbonden');

  onAuthChange((session) => {
    if (session?.user) {
      setConnection(true, 'Verbonden');
      loadClients();
    }
  });

  const user = await getUser();
  if (!user) {
    // nog niet ingelogd => vraag magic link
    await ensureAuth();
  } else {
    await loadClients();
  }

  // “Gegevens verversen” knop
  qs('#refresh-data').addEventListener('click', () => loadClients());
}

bootstrap();
