/* ============================================================
   Blog grid loader — pulls PUBLISHED posts from Supabase and
   prepends them to #blogGrid on blog.html. Matches the existing
   .blog-card markup and the data-tag filter system.
   No-op if Supabase isn't configured.
   ============================================================ */
(function () {
  "use strict";
  const cfg = window.LOTS_SUPABASE || {};
  if (!cfg.SUPABASE_URL || !cfg.SUPABASE_ANON_KEY) return;

  const grid = document.getElementById("blogGrid");
  if (!grid) return;

  const CAT = { journal:"Old Town Life", str:"STR Investing", neighborhood:"Neighborhood Guides",
    market:"Market Updates", local:"Local Favorites", builders:"Builders", seasons:"By Season", lists:"The Lists" };
  const FALLBACK_IMG = "../assets/coming-soon.jpg";

  function esc(s){ return (s||"").replace(/[&<>"]/g, c => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;" }[c])); }

  const H = { apikey: cfg.SUPABASE_ANON_KEY, Authorization: "Bearer " + cfg.SUPABASE_ANON_KEY };
  const base = `${cfg.SUPABASE_URL}/rest/v1/posts?status=eq.published` +
    `&select=title,slug,category,excerpt,cover_image,cover_alt`;
  // Try with featured (pin) support; fall back if the column isn't added yet.
  const withF = base + `,featured&order=featured.desc,published_at.desc`;
  const noF = base + `&order=published_at.desc`;

  fetch(withF, { headers: H })
    .then(r => r.ok ? r.json() : fetch(noF, { headers: H }).then(r2 => r2.ok ? r2.json() : []))
    .then(posts => {
      if (!Array.isArray(posts) || !posts.length) return;
      const frag = document.createDocumentFragment();
      posts.forEach(p => {
        const a = document.createElement("a");
        a.className = "blog-card";
        a.href = "../blog/post.html?slug=" + encodeURIComponent(p.slug);
        a.setAttribute("data-tag", p.category || "journal");
        const img = p.cover_image || FALLBACK_IMG;
        const alt = esc(p.cover_alt || p.title || "");
        const badge = p.featured
          ? `<span style="position:absolute;top:10px;left:10px;z-index:2;background:#ae6d47;color:#fff;font:600 9px/1 'DM Sans',sans-serif;letter-spacing:.15em;text-transform:uppercase;padding:5px 9px;">★ Featured</span>`
          : "";
        a.innerHTML =
          `<div class="blog-card-img" style="position:relative">${badge}<img src="${esc(img)}" alt="${alt}" loading="lazy"></div>` +
          `<div class="blog-card-body">` +
            `<span class="blog-card-tag">${esc(CAT[p.category] || p.category || "")}</span>` +
            `<h3 class="blog-card-title">${esc(p.title || "")}</h3>` +
            `<p class="blog-card-ex">${esc(p.excerpt || "")}</p>` +
          `</div>`;
        frag.appendChild(a);
      });
      // newest posts first, ahead of the hardcoded cards
      grid.insertBefore(frag, grid.firstChild);
      // de-dupe: a post now in the database replaces its old hardcoded card.
      // Static cards link to ../blog/<slug>.html; dynamic cards link to
      // ../blog/post.html?slug=<slug>, so they never collide.
      posts.forEach(p => {
        grid.querySelectorAll('a.blog-card[href$="/' + p.slug + '.html"]').forEach(card => card.remove());
      });
      // respect whatever filter is currently active
      const active = document.querySelector(".blog-filter.is-active");
      if (active && typeof window.__applyBlogFilter === "function") {
        window.__applyBlogFilter(active.dataset.filter);
      }
    })
    .catch(() => {/* silent — blog still shows hardcoded posts */});
})();
