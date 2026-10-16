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

  const url = `${cfg.SUPABASE_URL}/rest/v1/posts` +
    `?status=eq.published&select=title,slug,category,excerpt,cover_image,cover_alt&order=published_at.desc`;

  fetch(url, { headers: { apikey: cfg.SUPABASE_ANON_KEY, Authorization: "Bearer " + cfg.SUPABASE_ANON_KEY } })
    .then(r => r.ok ? r.json() : [])
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
        a.innerHTML =
          `<div class="blog-card-img"><img src="${esc(img)}" alt="${alt}" loading="lazy"></div>` +
          `<div class="blog-card-body">` +
            `<span class="blog-card-tag">${esc(CAT[p.category] || p.category || "")}</span>` +
            `<h3 class="blog-card-title">${esc(p.title || "")}</h3>` +
            `<p class="blog-card-ex">${esc(p.excerpt || "")}</p>` +
          `</div>`;
        frag.appendChild(a);
      });
      // newest posts first, ahead of the hardcoded cards
      grid.insertBefore(frag, grid.firstChild);
      // respect whatever filter is currently active
      const active = document.querySelector(".blog-filter.is-active");
      if (active && typeof window.__applyBlogFilter === "function") {
        window.__applyBlogFilter(active.dataset.filter);
      }
    })
    .catch(() => {/* silent — blog still shows hardcoded posts */});
})();
