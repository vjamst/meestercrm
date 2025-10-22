// scripts/supabaseClient.js
// Supabase client + auth helpers (v2)

let _supabase = null;

export function getSavedConfig() {
  try { return JSON.parse(localStorage.getItem('supabaseConfig') || '{}'); }
  catch { return {}; }
}

export function saveConfig({ url, key }) {
  localStorage.setItem('supabaseConfig', JSON.stringify({ url, key }));
}

export function initSupabase() {
  const cfg = getSavedConfig();
  if (!cfg.url || !cfg.key) return null;
  // global supabase from CDN in index.html
  _supabase = window.supabase.createClient(cfg.url, cfg.key);
  return _supabase;
}

export function getSupabase() {
  return _supabase ?? initSupabase();
}

export async function getUser() {
  const sb = getSupabase();
  if (!sb) return null;
  const { data: { user } } = await sb.auth.getUser();
  return user || null;
}

export async function ensureAuth({ redirectTo = window.location.href } = {}) {
  const sb = getSupabase();
  if (!sb) return false;

  const { data: { session } } = await sb.auth.getSession();
  if (session?.user) return true;

  const email = prompt('Log in met je e-mailadres (magic link):');
  if (!email) return false;

  const { error } = await sb.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: redirectTo }
  });
  if (error) {
    alert('Login mislukt: ' + error.message);
    return false;
  }
  alert('Check je mailbox voor de loginlink. Keer terug na klikken.');
  return false;
}

export function onAuthChange(cb) {
  const sb = getSupabase();
  if (!sb) return () => {};
  const { data: sub } = sb.auth.onAuthStateChange((_e, session) => cb(session));
  return () => sub.subscription.unsubscribe();
}
