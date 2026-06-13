// =====================================================================
// SUPABASE CONFIG — fill in these two values to enable real auth.
// =====================================================================
//
// Setup steps (~5 minutes):
//   1. Go to https://supabase.com and create a free account.
//   2. Click "New project" — name it "lots-str" or similar.
//   3. Once it provisions, go to Project Settings -> API.
//   4. Copy "Project URL"   -> paste below as SUPABASE_URL
//      Copy "anon public key" -> paste below as SUPABASE_ANON_KEY
//   5. In the Supabase dashboard, go to Authentication -> Providers and
//      make sure "Email" is enabled. To use magic links only (passwordless),
//      keep "Confirm email" on. To allow password sign-ups too, leave the
//      default Email auth on.
//   6. Optional: under Authentication -> URL Configuration, add your
//      production site URL so magic-link redirects land back on this page.
//
// Until both values are filled in, the STR page falls back to a soft demo
// gate: name + email captured into localStorage, listings unlock locally.
// This is great for the presentation. Swap to real auth when ready.
// =====================================================================

window.LOTS_SUPABASE = {
  // TODO: paste your project URL here, e.g. 'https://xxxxx.supabase.co'
  SUPABASE_URL: '',
  // TODO: paste your anon public key here
  SUPABASE_ANON_KEY: '',
};
