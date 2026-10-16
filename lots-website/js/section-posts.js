/* ============================================================
   Section post grids — drop a container on any page:
     <div data-section-posts="str" data-limit="6"
          data-heading="From the Blog" data-eyebrow="STR Investing"></div>
   data-section-posts: one or more category slugs (comma-separated).
   Featured posts (pinned in the editor) sort first with a "Featured" badge.
   Self-contained styles; no-op if Supabase isn't configured or no posts.
   ============================================================ */
(function () {
  "use strict";
  const cfg = window.LOTS_SUPABASE || {};
  if (!cfg.SUPABASE_URL || !cfg.SUPABASE_ANON_KEY) return;
  const containers = document.querySelectorAll("[data-section-posts]");
  if (!containers.length) return;

  const CAT = { journal:"Old Town Life", str:"STR Investing", neighborhood:"Neighborhood Guides",
    market:"Market Updates", local:"Local Favorites", builders:"Builders", seasons:"By Season", lists:"The Lists" };

  // styles (injected once)
  const css = `
  .sp-section{padding:72px 24px;max-width:1240px;margin:0 auto;}
  .sp-head{text-align:center;margin-bottom:40px;}
  .sp-eyebrow{font-family:'DM Sans',sans-serif;font-size:9px;font-weight:600;letter-spacing:.3em;text-transform:uppercase;color:#ae6d47;margin:0 0 12px;}
  .sp-heading{font-family:'Cormorant',Georgia,serif;font-weight:300;font-size:clamp(28px,4vw,44px);letter-spacing:.02em;text-transform:uppercase;color:#1a1a1a;margin:0;line-height:1.1;}
  .sp-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:28px;}
  @media(max-width:900px){.sp-grid{grid-template-columns:repeat(2,1fr);}}
  @media(max-width:600px){.sp-grid{grid-template-columns:1fr;}}
  .sp-card{display:block;text-decoration:none;color:inherit;border:1px solid #eee;background:#fff;overflow:hidden;transition:transform .35s cubic-bezier(.16,1,.3,1),box-shadow .35s cubic-bezier(.16,1,.3,1);}
  .sp-card:hover{transform:translateY(-3px);box-shadow:0 16px 40px rgba(0,0,0,.07);}
  .sp-imgwrap{position:relative;aspect-ratio:4/3;overflow:hidden;background:#f2ece2;}
  .sp-imgwrap img{width:100%;height:100%;object-fit:cover;display:block;}
  .sp-badge{position:absolute;top:12px;left:12px;background:#ae6d47;color:#fff;font-family:'DM Sans',sans-serif;font-size:9px;font-weight:600;letter-spacing:.18em;text-transform:uppercase;padding:6px 11px;}
  .sp-body{padding:20px 22px 26px;}
  .sp-tag{font-family:'DM Sans',sans-serif;font-size:9px;font-weight:600;letter-spacing:.25em;text-transform:uppercase;color:#ae6d47;}
  .sp-title{font-family:'Cormorant',Georgia,serif;font-weight:400;font-size:22px;line-height:1.2;color:#1a1a1a;margin:10px 0 8px;}
  .sp-ex{font-family:'DM Sans',sans-serif;font-size:14px;font-weight:300;line-height:1.7;color:#666;margin:0;}
  `;
  const st = document.createElement("style"); st.textContent = css; document.head.appendChild(st);

  function esc(s){ return (s||"").replace(/[&<>"]/g, c => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;" }[c])); }

  containers.forEach(el => {
    const cats = (el.dataset.sectionPosts || "").split(",").map(s => s.trim()).filter(Boolean);
    if (!cats.length) return;
    const limit = parseInt(el.dataset.limit || "6", 10);
    const heading = el.dataset.heading || "From the Blog";
    const eyebrow = el.dataset.eyebrow || "Latest Stories";
    const catFilter = cats.length === 1 ? `category=eq.${cats[0]}` : `category=in.(${cats.join(",")})`;
    const H = { apikey: cfg.SUPABASE_ANON_KEY, Authorization: "Bearer " + cfg.SUPABASE_ANON_KEY };
    const base = `${cfg.SUPABASE_URL}/rest/v1/posts?status=eq.published&${catFilter}` +
      `&select=title,slug,category,excerpt,cover_image,cover_alt`;
    // Try with featured (pin) support; fall back if the column isn't added yet.
    const withF = base + `,featured&order=featured.desc,published_at.desc&limit=${limit}`;
    const noF = base + `&order=published_at.desc&limit=${limit}`;

    fetch(withF, { headers: H })
      .then(r => r.ok ? r.json() : fetch(noF, { headers: H }).then(r2 => r2.ok ? r2.json() : []))
      .then(posts => {
        if (!Array.isArray(posts) || !posts.length) return; // nothing to show -> leave page as-is
        const cards = posts.map(p => {
          const img = p.cover_image || "../assets/coming-soon.jpg";
          const badge = p.featured ? `<span class="sp-badge">★ Featured</span>` : "";
          return `<a class="sp-card" href="../blog/post.html?slug=${encodeURIComponent(p.slug)}">
            <div class="sp-imgwrap">${badge}<img src="${esc(img)}" alt="${esc(p.cover_alt || p.title || "")}" loading="lazy"></div>
            <div class="sp-body">
              <span class="sp-tag">${esc(CAT[p.category] || p.category || "")}</span>
              <h3 class="sp-title">${esc(p.title || "")}</h3>
              <p class="sp-ex">${esc(p.excerpt || "")}</p>
            </div></a>`;
        }).join("");
        el.innerHTML = `<section class="sp-section">
          <div class="sp-head"><p class="sp-eyebrow">${esc(eyebrow)}</p><h2 class="sp-heading">${esc(heading)}</h2></div>
          <div class="sp-grid">${cards}</div>
        </section>`;
      })
      .catch(() => {/* silent */});
  });
})();
