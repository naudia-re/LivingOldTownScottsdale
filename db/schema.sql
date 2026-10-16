-- =====================================================================
-- LIVING OLD TOWN SCOTTSDALE — Blog / CMS schema
-- Paste this whole file into: Supabase Dashboard -> SQL Editor -> New query -> Run
-- Safe to re-run (idempotent).
-- =====================================================================

-- ---- Extensions -----------------------------------------------------
create extension if not exists "pgcrypto";   -- for gen_random_uuid()

-- ---- Categories (the 8 sections blogs can "drop" into) --------------
create table if not exists public.categories (
  slug        text primary key,
  label       text not null,
  description text,
  drops_on    text,                -- human note: which page(s) this surfaces on
  sort_order  int  default 100
);

insert into public.categories (slug, label, description, drops_on, sort_order) values
  ('journal',      'Old Town Life',      'General editorial / journal stories',        'Old Town Life hub, Home, Blog',            10),
  ('str',          'STR Investing',      'Short-term rental investing content',        'STR Hub, Blog',                            20),
  ('neighborhood', 'Neighborhood Guides','Guides to specific neighborhoods/condos',    'Directory, Single Family, Condos, Blog',   30),
  ('market',       'Market Updates',     'Market reports and stats',                   'Buy, Sell, Home, Blog',                    40),
  ('local',        'Local Favorites',    'Restaurants, shops, spots worth your time',  'Old Town Life (Spots), Blog',              50),
  ('builders',     'Builders',           'Stories of the builders/architects',         'Old Town Life (Builders), History, Blog',  60),
  ('seasons',      'By Season',          'Seasonal guides (spring/summer/fall/winter)','Old Town Life (By Season), Blog',          70),
  ('lists',        'The Lists',          'Curated lists locals save',                  'Old Town Life (The Lists), Blog',          80)
on conflict (slug) do update
  set label = excluded.label,
      description = excluded.description,
      drops_on = excluded.drops_on,
      sort_order = excluded.sort_order;

-- ---- Posts ----------------------------------------------------------
create table if not exists public.posts (
  id               uuid primary key default gen_random_uuid(),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  published_at     timestamptz,
  status           text not null default 'draft',          -- 'draft' | 'published'
  title            text not null,
  slug             text not null unique,
  category         text not null references public.categories(slug),
  excerpt          text,
  body             text,                                    -- rich HTML from the editor
  cover_image      text,                                    -- public Storage URL
  cover_alt        text,
  seo_title        text,
  seo_description  text,
  author           text default 'Naudia Andrescavage',
  read_minutes     int  default 4
);

create index if not exists posts_status_pub_idx on public.posts (status, published_at desc);
create index if not exists posts_category_idx   on public.posts (category);

-- keep updated_at fresh
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

drop trigger if exists posts_touch on public.posts;
create trigger posts_touch before update on public.posts
  for each row execute function public.touch_updated_at();

-- ---- Row Level Security --------------------------------------------
alter table public.posts      enable row level security;
alter table public.categories enable row level security;

-- Public (anonymous) visitors: can read PUBLISHED posts + all categories
drop policy if exists "public reads published posts" on public.posts;
create policy "public reads published posts" on public.posts
  for select using (status = 'published');

drop policy if exists "public reads categories" on public.categories;
create policy "public reads categories" on public.categories
  for select using (true);

-- Logged-in admins (anyone who can sign in): full control
drop policy if exists "authed full read"   on public.posts;
create policy "authed full read"   on public.posts for select using (auth.role() = 'authenticated');
drop policy if exists "authed insert"      on public.posts;
create policy "authed insert"      on public.posts for insert with check (auth.role() = 'authenticated');
drop policy if exists "authed update"      on public.posts;
create policy "authed update"      on public.posts for update using (auth.role() = 'authenticated');
drop policy if exists "authed delete"      on public.posts;
create policy "authed delete"      on public.posts for delete using (auth.role() = 'authenticated');

drop policy if exists "authed manage categories" on public.categories;
create policy "authed manage categories" on public.categories
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- ---- Storage bucket for post images --------------------------------
insert into storage.buckets (id, name, public)
values ('blog-images', 'blog-images', true)
on conflict (id) do nothing;

drop policy if exists "public read blog images" on storage.objects;
create policy "public read blog images" on storage.objects
  for select using (bucket_id = 'blog-images');

drop policy if exists "authed upload blog images" on storage.objects;
create policy "authed upload blog images" on storage.objects
  for insert with check (bucket_id = 'blog-images' and auth.role() = 'authenticated');

drop policy if exists "authed update blog images" on storage.objects;
create policy "authed update blog images" on storage.objects
  for update using (bucket_id = 'blog-images' and auth.role() = 'authenticated');

drop policy if exists "authed delete blog images" on storage.objects;
create policy "authed delete blog images" on storage.objects
  for delete using (bucket_id = 'blog-images' and auth.role() = 'authenticated');

-- Done. Create your admin login under Authentication -> Users -> Add user.
