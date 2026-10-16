// =====================================================================
// STR Hub auth + gate logic
//
// Behavior:
//   - If Supabase is configured (URL + anon key set) AND the SDK is
//     present, real auth is used: email/password sign-up, sign-in, and
//     magic-link delivery. Session persists across reloads.
//   - Otherwise, a soft demo gate runs: a localStorage flag unlocks the
//     listings after a name + email is captured. The lead is stored in
//     `lotsLeads` so you can pull it later or wire to a CRM.
//
// Either path reveals the .str-listings section by removing the
// `.is-locked` class.
// =====================================================================

(function () {
  const $ = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));

  const overlay = $('#authOverlay');
  const modal = $('#authModal');
  const tabs = $$('.auth-tab', overlay);
  const panels = $$('.auth-panel', overlay);
  const lockedSection = $('#strListings');
  const lockedCta = $('#strUnlockCta');
  const signedInBar = $('#strSignedInBar');
  const signedInEmail = $('#strSignedInEmail');
  const signOutBtn = $('#strSignOut');

  if (!overlay) return;

  // --- Tabs ---
  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      tabs.forEach((t) => t.classList.remove('is-active'));
      panels.forEach((p) => p.classList.remove('is-active'));
      tab.classList.add('is-active');
      const targetPanel = $('#' + tab.dataset.tab, overlay);
      if (targetPanel) targetPanel.classList.add('is-active');
    });
  });

  // --- Open / close ---
  function openModal() {
    overlay.classList.add('is-open');
    document.body.style.overflow = 'hidden';
    setTimeout(() => modal.querySelector('input')?.focus(), 100);
  }
  function closeModal() {
    overlay.classList.remove('is-open');
    document.body.style.overflow = '';
  }
  $('#authClose')?.addEventListener('click', closeModal);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeModal();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && overlay.classList.contains('is-open')) closeModal();
  });

  // Open from any element with class .js-str-unlock
  $$('.js-str-unlock').forEach((el) => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      openModal();
    });
  });

  // --- Unlock UI ---
  function unlock(email) {
    if (lockedSection) lockedSection.classList.remove('is-locked');
    if (lockedCta) lockedCta.hidden = true;
    if (signedInBar) signedInBar.hidden = false;
    if (signedInEmail) signedInEmail.textContent = email || 'you';
    closeModal();
  }
  function lock() {
    if (lockedSection) lockedSection.classList.add('is-locked');
    if (lockedCta) lockedCta.hidden = false;
    if (signedInBar) signedInBar.hidden = true;
  }

  // --- Status message helper ---
  function setStatus(panelId, message, isError) {
    const status = $('#' + panelId + ' .auth-status');
    if (!status) return;
    status.textContent = message;
    status.style.color = isError ? '#c4302b' : '#666';
  }

  // --- Supabase real-auth path ---
  const cfg = window.LOTS_SUPABASE || {};
  const supabaseReady =
    !!cfg.SUPABASE_URL && !!cfg.SUPABASE_ANON_KEY && typeof window.supabase !== 'undefined';

  if (supabaseReady) {
    const client = window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY);

    // Check existing session
    client.auth.getSession().then(({ data }) => {
      if (data.session?.user) unlock(data.session.user.email);
    });

    // Listen for sign-in / sign-out events
    client.auth.onAuthStateChange((event, session) => {
      if (session?.user) unlock(session.user.email);
      if (event === 'SIGNED_OUT') lock();
    });

    // Sign in
    $('#authSignInForm')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const data = Object.fromEntries(new FormData(e.target));
      setStatus('panel-signin', 'Signing you in…');
      const { error } = await client.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });
      if (error) setStatus('panel-signin', error.message, true);
    });

    // Sign up
    $('#authSignUpForm')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const data = Object.fromEntries(new FormData(e.target));
      setStatus('panel-signup', 'Creating your account…');
      const { error } = await client.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: { firstName: data.firstName, lastName: data.lastName },
        },
      });
      if (error) setStatus('panel-signup', error.message, true);
      else
        setStatus(
          'panel-signup',
          'Check your email for a confirmation link, then come back and sign in.'
        );
    });

    // Magic link
    $('#authMagicForm')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const data = Object.fromEntries(new FormData(e.target));
      setStatus('panel-magic', 'Sending your magic link…');
      const { error } = await client.auth.signInWithOtp({
        email: data.email,
        options: { emailRedirectTo: window.location.href },
      });
      if (error) setStatus('panel-magic', error.message, true);
      else setStatus('panel-magic', 'Magic link sent — check your inbox and click the link.');
    });

    // Sign out
    signOutBtn?.addEventListener('click', async () => {
      await client.auth.signOut();
      lock();
    });
  } else {
    // --- Soft demo gate (no Supabase config yet) ---
    const SOFT_KEY = 'lotsStrSoftUnlock';
    const existing = localStorage.getItem(SOFT_KEY);
    if (existing) {
      try {
        unlock(JSON.parse(existing).email);
      } catch (_) {}
    }

    function softUnlock(data) {
      localStorage.setItem(SOFT_KEY, JSON.stringify({ ...data, ts: new Date().toISOString() }));
      try {
        const leads = JSON.parse(localStorage.getItem('lotsLeads') || '[]');
        leads.push({ ...data, source: 'str-gate', ts: new Date().toISOString() });
        localStorage.setItem('lotsLeads', JSON.stringify(leads));
      } catch (_) {}
      unlock(data.email);
    }

    $('#authSignInForm')?.addEventListener('submit', (e) => {
      e.preventDefault();
      const data = Object.fromEntries(new FormData(e.target));
      softUnlock({ email: data.email });
    });
    $('#authSignUpForm')?.addEventListener('submit', (e) => {
      e.preventDefault();
      const data = Object.fromEntries(new FormData(e.target));
      softUnlock(data);
    });
    $('#authMagicForm')?.addEventListener('submit', (e) => {
      e.preventDefault();
      const data = Object.fromEntries(new FormData(e.target));
      setStatus('panel-magic', 'Demo mode — listings unlocked locally. Configure Supabase to send a real magic link.');
      softUnlock({ email: data.email });
    });

    signOutBtn?.addEventListener('click', () => {
      localStorage.removeItem(SOFT_KEY);
      lock();
    });

    // Stamp a small "demo mode" hint at the bottom of the modal
    const hint = $('.auth-mode-hint');
    if (hint)
      hint.textContent =
        'Demo mode: listings unlock locally on submit. Wire Supabase in js/supabase-config.js for real accounts.';
  }
})();
