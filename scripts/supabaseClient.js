import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.39.7/+esm';

let supabaseClient = null;

export function initSupabase({ url, key }) {
  if (!url || !key) {
    throw new Error('Supabase configuratie is onvolledig.');
  }
  supabaseClient = createClient(url, key, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  });
  return supabaseClient;
}

export function getSupabase() {
  if (!supabaseClient) {
    throw new Error('Supabase is nog niet geconfigureerd.');
  }
  return supabaseClient;
}

export function resetSupabase() {
  supabaseClient = null;
}

export async function testConnection() {
  if (!supabaseClient) return false;
  try {
    const { error } = await supabaseClient.from('clients').select('id', { count: 'exact', head: true }).limit(1);
    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Supabase test mislukt', error);
    return false;
  }
}
