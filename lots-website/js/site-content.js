/* ============================================================
   Site content loader — the "Site Editor" front end.
   Applies editable values (from the site_content table) to any
   element marked with data-cc="<key>". For images/links add
   data-cc-attr="src" (or "href"); text elements get textContent.
   No-op if Supabase isn't configured or nothing is marked.
   ============================================================ */
(function () {
  "use strict";
  const cfg = window.LOTS_SUPABASE || {};
  if (!cfg.SUPABASE_URL || !cfg.SUPABASE_ANON_KEY) return;
  const els = document.querySelectorAll("[data-cc]");
  if (!els.length) return;

  fetch(`${cfg.SUPABASE_URL}/rest/v1/site_content?select=key,value`, {
    headers: { apikey: cfg.SUPABASE_ANON_KEY, Authorization: "Bearer " + cfg.SUPABASE_ANON_KEY },
  })
    .then(r => (r.ok ? r.json() : []))
    .then(rows => {
      if (!Array.isArray(rows) || !rows.length) return;
      const map = {};
      rows.forEach(r => { map[r.key] = r.value; });
      els.forEach(el => {
        const key = el.dataset.cc;
        if (!(key in map) || map[key] == null) return; // keep the hardcoded default
        const attr = el.dataset.ccAttr;
        if (attr) el.setAttribute(attr, map[key]);
        else el.textContent = map[key];
      });
    })
    .catch(() => {/* silent — page keeps its hardcoded content */});
})();
