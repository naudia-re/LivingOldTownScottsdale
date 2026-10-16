/* ============================================================
   LOTS Blog Studio — admin logic (Supabase)
   ============================================================ */
(function () {
  "use strict";

  const cfg = window.LOTS_SUPABASE || {};
  const CONFIGURED = !!(cfg.SUPABASE_URL && cfg.SUPABASE_ANON_KEY);
  const BUCKET = "blog-images";

  const $ = (id) => document.getElementById(id);
  const show = (el) => el && el.classList.remove("hidden");
  const hide = (el) => el && el.classList.add("hidden");

  let sb = null;
  let categories = [];
  let editingId = null; // null = new post

  // ---- Config gate -------------------------------------------------
  if (!CONFIGURED) {
    show($("configBanner"));
  } else {
    sb = window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY);
  }

  // ---- Quill editor ------------------------------------------------
  const quill = new Quill("#editor", {
    theme: "snow",
    placeholder: "Write your story…",
    modules: {
      toolbar: [
        [{ header: [2, 3, false] }],
        ["bold", "italic", "underline", "blockquote"],
        [{ list: "ordered" }, { list: "bullet" }],
        ["link"],
        ["clean"],
      ],
    },
  });

  // ---- Helpers -----------------------------------------------------
  function slugify(s) {
    return (s || "")
      .toLowerCase().trim()
      .replace(/['’]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80);
  }
  function msg(el, text, kind) {
    el.textContent = text || "";
    el.className = "msg" + (kind ? " " + kind : "");
  }
  function esc(s) {
    return (s || "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  }
  function fmtDate(iso) {
    if (!iso) return "—";
    return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  }
  function readMinutes(html) {
    const words = (html || "").replace(/<[^>]*>/g, " ").trim().split(/\s+/).filter(Boolean).length;
    return Math.max(1, Math.round(words / 200));
  }

  // ---- Categories --------------------------------------------------
  const FALLBACK_CATS = [
    ["journal", "Old Town Life", "Old Town Life hub, Home, Blog"],
    ["str", "STR Investing", "STR Hub, Blog"],
    ["neighborhood", "Neighborhood Guides", "Directory, Single Family, Condos, Blog"],
    ["market", "Market Updates", "Buy, Sell, Home, Blog"],
    ["local", "Local Favorites", "Old Town Life (Spots), Blog"],
    ["builders", "Builders", "Old Town Life (Builders), History, Blog"],
    ["seasons", "By Season", "Old Town Life (By Season), Blog"],
    ["lists", "The Lists", "Old Town Life (The Lists), Blog"],
  ].map(([slug, label, drops_on]) => ({ slug, label, drops_on }));

  async function loadCategories() {
    if (sb) {
      const { data, error } = await sb.from("categories").select("*").order("sort_order");
      if (!error && data && data.length) { categories = data; }
    }
    if (!categories.length) categories = FALLBACK_CATS;
    const sel = $("fCategory");
    sel.innerHTML = categories.map((c) => `<option value="${c.slug}">${esc(c.label)}</option>`).join("");
    updateCatHint();
  }
  function updateCatHint() {
    const c = categories.find((x) => x.slug === $("fCategory").value);
    $("catHint").textContent = c && c.drops_on ? "Surfaces on: " + c.drops_on : "";
  }

  // ---- Auth --------------------------------------------------------
  async function refreshSession() {
    if (!sb) { show($("appView")); hide($("loginView")); await loadCategories(); await loadPosts(); return; }
    const { data } = await sb.auth.getSession();
    if (data.session) enterApp(data.session.user);
    else { show($("loginView")); hide($("appView")); }
  }
  async function enterApp(user) {
    hide($("loginView")); show($("appView"));
    $("whoami").textContent = user ? user.email : "preview mode";
    await loadCategories();
    await loadPosts();
  }

  $("loginForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!sb) { msg($("loginMsg"), "Connect Supabase first (see banner).", "err"); return; }
    $("loginBtn").disabled = true;
    msg($("loginMsg"), "Signing in…");
    const { data, error } = await sb.auth.signInWithPassword({
      email: $("loginEmail").value.trim(),
      password: $("loginPassword").value,
    });
    $("loginBtn").disabled = false;
    if (error) { msg($("loginMsg"), error.message, "err"); return; }
    msg($("loginMsg"), "");
    enterApp(data.user);
  });

  $("logoutBtn").addEventListener("click", async () => {
    if (sb) await sb.auth.signOut();
    hide($("appView")); show($("loginView"));
  });

  // ---- List --------------------------------------------------------
  async function loadPosts() {
    const body = $("listBody");
    if (!sb) {
      body.innerHTML = `<div class="empty">Preview mode — once Supabase is connected, your posts will list here.<br>Click “+ New Post” to explore the editor.</div>`;
      return;
    }
    body.innerHTML = `<div class="empty">Loading…</div>`;
    const { data, error } = await sb.from("posts").select("*").order("updated_at", { ascending: false });
    if (error) { body.innerHTML = `<div class="empty">Couldn’t load posts: ${esc(error.message)}</div>`; return; }
    if (!data.length) { body.innerHTML = `<div class="empty">No posts yet. Click “+ New Post” to write your first.</div>`; return; }
    const catLabel = (slug) => (categories.find((c) => c.slug === slug) || {}).label || slug;
    body.innerHTML = `
      <table><thead><tr>
        <th>Title</th><th>Category</th><th>Status</th><th>Updated</th><th></th>
      </tr></thead><tbody>
      ${data.map((p) => `
        <tr>
          <td><span class="row-title">${esc(p.title)}</span></td>
          <td><span class="cat-pill">${esc(catLabel(p.category))}</span></td>
          <td><span class="pill ${p.status === "published" ? "pub" : "draft"}">${p.status}</span></td>
          <td style="color:var(--muted);font-size:12px">${fmtDate(p.updated_at)}</td>
          <td style="text-align:right"><button class="link-btn" data-edit="${p.id}">Edit →</button></td>
        </tr>`).join("")}
      </tbody></table>`;
    body.querySelectorAll("[data-edit]").forEach((b) =>
      b.addEventListener("click", () => openEditor(data.find((p) => p.id === b.dataset.edit)))
    );
  }

  // ---- Editor ------------------------------------------------------
  function openEditor(post) {
    editingId = post ? post.id : null;
    hide($("listView")); show($("editorView"));
    msg($("edMsg"), "");
    $("edMode").textContent = post ? "Edit Post" : "New Post";
    $("edHeading").textContent = post ? "Edit story" : "Write a story";
    $("fTitle").value = post ? post.title || "" : "";
    $("fSlug").value = post ? post.slug || "" : "";
    $("fExcerpt").value = post ? post.excerpt || "" : "";
    $("fSeoTitle").value = post ? post.seo_title || "" : "";
    $("fSeoDesc").value = post ? post.seo_description || "" : "";
    $("fCoverAlt").value = post ? post.cover_alt || "" : "";
    $("fCategory").value = post ? post.category || categories[0].slug : categories[0].slug;
    $("fFeatured").checked = post ? !!post.featured : false;
    quill.root.innerHTML = post ? post.body || "" : "";
    const cp = $("coverPreview");
    if (post && post.cover_image) { cp.src = post.cover_image; cp.style.display = "block"; cp.dataset.url = post.cover_image; }
    else { cp.style.display = "none"; cp.src = ""; cp.dataset.url = ""; }
    $("deleteBtn").style.visibility = post ? "visible" : "hidden";
    updateCatHint(); updateSeoPreview(); updateCounts();
    window.scrollTo(0, 0);
  }
  function closeEditor() { hide($("editorView")); show($("listView")); editingId = null; }

  // title -> slug autofill (only if slug empty or was auto)
  let slugTouched = false;
  $("fSlug").addEventListener("input", () => { slugTouched = true; });
  $("fTitle").addEventListener("input", () => {
    if (!slugTouched || !$("fSlug").value) $("fSlug").value = slugify($("fTitle").value);
    updateSeoPreview();
  });
  $("fCategory").addEventListener("change", updateCatHint);

  // SEO preview + counts
  function updateSeoPreview() {
    const t = $("fSeoTitle").value || $("fTitle").value || "Post title";
    const d = $("fSeoDesc").value || $("fExcerpt").value || "Your meta description will appear here…";
    $("seoPrevTitle").textContent = t;
    $("seoPrevDesc").textContent = d;
    document.querySelector(".seo-preview .u").textContent =
      "livingoldtownscottsdale.com › blog › " + (slugify($("fSlug").value || $("fTitle").value) || "slug");
  }
  function updateCounts() {
    const tc = $("fSeoTitle").value.length, dc = $("fSeoDesc").value.length;
    $("seoTitleCount").textContent = `${tc}/60`;
    $("seoTitleCount").className = "count" + (tc > 60 ? " over" : "");
    $("seoDescCount").textContent = `${dc}/160`;
    $("seoDescCount").className = "count" + (dc > 160 ? " over" : "");
  }
  ["fSeoTitle", "fSeoDesc", "fExcerpt"].forEach((id) =>
    $(id).addEventListener("input", () => { updateSeoPreview(); updateCounts(); })
  );

  // Cover upload
  $("fCover").addEventListener("change", async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const cp = $("coverPreview");
    cp.src = URL.createObjectURL(file); cp.style.display = "block";
    if (!sb) { msg($("edMsg"), "Preview only — image will upload once Supabase is connected.", ""); return; }
    msg($("edMsg"), "Uploading image…");
    const path = `${Date.now()}-${slugify(file.name.replace(/\.[^.]+$/, ""))}.${file.name.split(".").pop()}`;
    const { error } = await sb.storage.from(BUCKET).upload(path, file, { upsert: true, contentType: file.type });
    if (error) { msg($("edMsg"), "Image upload failed: " + error.message, "err"); return; }
    const { data } = sb.storage.from(BUCKET).getPublicUrl(path);
    cp.dataset.url = data.publicUrl;
    msg($("edMsg"), "Image uploaded ✓", "ok");
  });

  // Collect form -> record
  function collect(status) {
    const title = $("fTitle").value.trim();
    const slug = slugify($("fSlug").value || title);
    const body = quill.root.innerHTML;
    return {
      record: {
        title, slug,
        category: $("fCategory").value,
        featured: $("fFeatured").checked,
        excerpt: $("fExcerpt").value.trim(),
        body,
        cover_image: $("coverPreview").dataset.url || null,
        cover_alt: $("fCoverAlt").value.trim() || null,
        seo_title: $("fSeoTitle").value.trim() || null,
        seo_description: $("fSeoDesc").value.trim() || null,
        read_minutes: readMinutes(body),
        status,
        ...(status === "published" ? { published_at: new Date().toISOString() } : {}),
      },
      title, slug,
    };
  }

  async function save(status) {
    const { record, title, slug } = collect(status);
    if (!title) { msg($("edMsg"), "Add a title first.", "err"); return; }
    if (!slug) { msg($("edMsg"), "Add a title or slug.", "err"); return; }
    if (!sb) { msg($("edMsg"), "Preview only — connect Supabase to save. Everything else works.", ""); return; }
    msg($("edMsg"), "Saving…");
    let error;
    if (editingId) ({ error } = await sb.from("posts").update(record).eq("id", editingId));
    else ({ error } = await sb.from("posts").insert(record));
    // Safety net: if the "featured" column hasn't been added yet (PGRST204),
    // retry the write without it so saving still works.
    if (error && error.code === "PGRST204" && "featured" in record) {
      const rest = Object.assign({}, record); delete rest.featured;
      if (editingId) ({ error } = await sb.from("posts").update(rest).eq("id", editingId));
      else ({ error } = await sb.from("posts").insert(rest));
    }
    if (error) {
      msg($("edMsg"), (error.code === "23505" ? "That URL slug is already used — change it." : error.message), "err");
      return;
    }
    msg($("edMsg"), status === "published" ? "Published ✓" : "Draft saved ✓", "ok");
    await loadPosts();
    setTimeout(closeEditor, 700);
  }

  $("saveDraftBtn").addEventListener("click", () => save("draft"));
  $("saveDraftBtn2").addEventListener("click", () => save("draft"));
  $("publishBtn").addEventListener("click", () => save("published"));
  $("publishBtn2").addEventListener("click", () => save("published"));
  $("newPostBtn").addEventListener("click", () => openEditor(null));
  $("backBtn").addEventListener("click", closeEditor);

  $("deleteBtn").addEventListener("click", async () => {
    if (!editingId || !sb) { closeEditor(); return; }
    if (!confirm("Delete this post permanently?")) return;
    const { error } = await sb.from("posts").delete().eq("id", editingId);
    if (error) { msg($("edMsg"), error.message, "err"); return; }
    await loadPosts(); closeEditor();
  });

  // ---- Site Content editor -----------------------------------------
  const SITE_FIELDS = [
    { group: "Homepage — Intro", fields: [
      { key: "home.statement.body",  label: "Intro paragraph", type: "textarea" },
      { key: "home.statement.body2", label: "Closing line",    type: "text" },
    ]},
    { group: "Homepage — Tile 1 (Condos)", fields: [
      { key: "home.tile1.tag",   label: "Label",       type: "text" },
      { key: "home.tile1.title", label: "Title",       type: "text" },
      { key: "home.tile1.desc",  label: "Description", type: "textarea" },
      { key: "home.tile1.image", label: "Image",       type: "image" },
      { key: "home.tile1.link",  label: "Link (page)", type: "text" },
    ]},
    { group: "Homepage — Tile 2 (STR Hub)", fields: [
      { key: "home.tile2.tag",   label: "Label",       type: "text" },
      { key: "home.tile2.title", label: "Title",       type: "text" },
      { key: "home.tile2.desc",  label: "Description", type: "textarea" },
      { key: "home.tile2.image", label: "Image",       type: "image" },
      { key: "home.tile2.link",  label: "Link (page)", type: "text" },
    ]},
    { group: "Homepage — Tile 3 (Old Town Life)", fields: [
      { key: "home.tile3.tag",   label: "Label",       type: "text" },
      { key: "home.tile3.title", label: "Title",       type: "text" },
      { key: "home.tile3.desc",  label: "Description", type: "textarea" },
      { key: "home.tile3.image", label: "Image",       type: "image" },
      { key: "home.tile3.link",  label: "Link (page)", type: "text" },
    ]},
  ];
  let siteValues = {};

  function resolveImg(val) {
    if (!val) return "";
    if (/^https?:|^data:/.test(val)) return val;
    return "../" + val.replace(/^\//, ""); // admin lives in /admin/, site paths are root-relative
  }

  async function loadSiteContent() {
    const form = $("siteForm");
    if (!sb) { form.innerHTML = '<div class="empty">Connect Supabase to edit site content.</div>'; return; }
    form.innerHTML = '<div class="empty">Loading…</div>';
    const { data, error } = await sb.from("site_content").select("key,value");
    if (error) {
      form.innerHTML = '<div class="empty">Couldn’t load — have you run <code>db/site_content.sql</code>? (' + esc(error.message) + ')</div>';
      return;
    }
    siteValues = {}; (data || []).forEach(r => { siteValues[r.key] = r.value; });
    renderSiteForm();
  }

  function renderSiteForm() {
    $("siteForm").innerHTML = SITE_FIELDS.map(g => {
      const fields = g.fields.map(f => {
        const val = siteValues[f.key] != null ? siteValues[f.key] : "";
        if (f.type === "image") {
          return `<div class="field"><label>${esc(f.label)}</label>
            <div class="sc-img-row">
              <img class="sc-img-prev" id="scimg-${esc(f.key)}" src="${esc(resolveImg(val))}" alt="">
              <input type="file" accept="image/*" data-imgkey="${esc(f.key)}">
            </div>
            <div class="hint">Upload to swap this image (~1600px wide looks best).</div></div>`;
        }
        const input = f.type === "textarea"
          ? `<textarea rows="3" data-sckey="${esc(f.key)}">${esc(val)}</textarea>`
          : `<input type="text" data-sckey="${esc(f.key)}" value="${esc(val)}">`;
        return `<div class="field"><label>${esc(f.label)}</label>${input}</div>`;
      }).join("");
      return `<div class="sc-group"><h3 class="sc-group-title">${esc(g.group)}</h3>${fields}</div>`;
    }).join("");
    $("siteForm").querySelectorAll('input[type=file][data-imgkey]').forEach(inp =>
      inp.addEventListener("change", e => handleSiteImage(e, inp.dataset.imgkey))
    );
  }

  async function handleSiteImage(e, key) {
    const file = e.target.files[0]; if (!file || !sb) return;
    $("scimg-" + key).src = URL.createObjectURL(file);
    msg($("siteMsg"), "Uploading image…");
    const path = `site/${key.replace(/[^a-z0-9]+/gi, "-")}-${Date.now()}.${file.name.split(".").pop()}`;
    const { error } = await sb.storage.from(BUCKET).upload(path, file, { upsert: true, contentType: file.type });
    if (error) { msg($("siteMsg"), "Upload failed: " + error.message, "err"); return; }
    const { data } = sb.storage.from(BUCKET).getPublicUrl(path);
    siteValues[key] = data.publicUrl;
    $("scimg-" + key).src = data.publicUrl;
    msg($("siteMsg"), "Image uploaded ✓ — click Save Changes to keep it.", "ok");
  }

  async function saveSiteContent() {
    if (!sb) { msg($("siteMsg"), "Connect Supabase first.", "err"); return; }
    $("siteForm").querySelectorAll("[data-sckey]").forEach(el => { siteValues[el.dataset.sckey] = el.value; });
    const rows = Object.keys(siteValues).map(k => ({ key: k, value: siteValues[k] }));
    if (!rows.length) { msg($("siteMsg"), "Nothing to save yet.", ""); return; }
    msg($("siteMsg"), "Saving…");
    const { error } = await sb.from("site_content").upsert(rows, { onConflict: "key" });
    if (error) { msg($("siteMsg"), error.message, "err"); return; }
    msg($("siteMsg"), "Saved ✓ — live on the homepage now (reload to see it).", "ok");
  }

  function showPosts() {
    $("tabPosts").classList.add("is-active"); $("tabSite").classList.remove("is-active");
    show($("listView")); hide($("siteView")); hide($("editorView"));
  }
  function showSite() {
    $("tabSite").classList.add("is-active"); $("tabPosts").classList.remove("is-active");
    hide($("listView")); hide($("editorView")); show($("siteView")); loadSiteContent();
  }
  $("tabPosts").addEventListener("click", showPosts);
  $("tabSite").addEventListener("click", showSite);
  $("saveSiteBtn").addEventListener("click", saveSiteContent);
  $("saveSiteBtn2").addEventListener("click", saveSiteContent);

  // ---- Go ----------------------------------------------------------
  refreshSession();
})();
