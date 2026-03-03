// ── HookLens Auth Module ─────────────────────────────────
// Shared across index.html, hooklens-scanner.html, profile.html
const SUPABASE_URL = 'https://tvfmnfckawtvbmwfaxjv.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_KhnkmTKYGENhuuLpekLLwg_j2M2AHsK';
const BACKEND = 'https://hooklens-api.onrender.com';
const STRIPE_PORTAL = 'https://billing.stripe.com/p/login/00w5kD7ZQd0b6VndY7aIM00';

// Load Supabase from CDN (called once per page)
function loadSupabase() {
  return new Promise((resolve) => {
    if (window._supabaseClient) return resolve(window._supabaseClient);
    if (window.supabase) {
      window._supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
      return resolve(window._supabaseClient);
    }
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.js';
    script.onload = () => {
      window._supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
      resolve(window._supabaseClient);
    };
    script.onerror = () => resolve(null);
    document.head.appendChild(script);
  });
}

function getClient() {
  return window._supabaseClient;
}

async function getSession() {
  const client = getClient();
  if (!client) return null;
  const { data } = await client.auth.getSession();
  return data.session;
}

async function getUser() {
  const session = await getSession();
  return session?.user || null;
}

async function getProfile(userId) {
  const client = getClient();
  if (!client) return null;
  const { data } = await client
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();
  return data;
}

async function signOut() {
  const client = getClient();
  if (client) await client.auth.signOut();
  localStorage.removeItem('hl_email');
  window.location.href = 'index.html';
}

async function signInWithGoogle() {
  const client = getClient();
  await client.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: window.location.origin + '/hooklens-scanner.html' }
  });
}

async function signUpWithEmail(email, password) {
  const client = getClient();
  const { data, error } = await client.auth.signUp({
    email,
    password,
    options: { emailRedirectTo: window.location.origin + '/hooklens-scanner.html' }
  });
  return { data, error };
}

async function signInWithEmail(email, password) {
  const client = getClient();
  const { data, error } = await client.auth.signInWithPassword({ email, password });
  return { data, error };
}

// Sync Supabase auth user with backend profiles table
async function syncUserWithBackend(email) {
  try {
    await fetch(BACKEND + '/gate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
  } catch(e) { console.warn('Sync error:', e); }
}
