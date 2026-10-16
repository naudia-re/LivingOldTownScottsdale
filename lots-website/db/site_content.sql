-- =====================================================================
-- SITE CONTENT — editable page content (the "Site Editor")
-- Paste into Supabase SQL Editor -> New snippet -> Run. Safe to re-run
-- (ON CONFLICT DO NOTHING keeps any edits you've already made).
-- =====================================================================

create table if not exists public.site_content (
  key        text primary key,
  value      text,
  updated_at timestamptz not null default now()
);

alter table public.site_content enable row level security;

drop policy if exists "public reads site content" on public.site_content;
create policy "public reads site content" on public.site_content
  for select using (true);

drop policy if exists "authed writes site content" on public.site_content;
create policy "authed writes site content" on public.site_content
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- keep updated_at fresh
create or replace function public.touch_site_content()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;
drop trigger if exists site_content_touch on public.site_content;
create trigger site_content_touch before update on public.site_content
  for each row execute function public.touch_site_content();

-- Seed with the current homepage content (so the page is unchanged until edited)
insert into public.site_content (key, value) values
  ('home.statement.body',  $cc$Here we give you the honest insights, real market perspectives, and local expertise from the people who walk these streets every day. Welcome to the neighborhood, before you even move in.$cc$),
  ('home.statement.body2', $cc$We hope you find home here.$cc$),
  ('home.tile1.tag',   $cc$Luxury Living$cc$),
  ('home.tile1.title', $cc$Luxury Condo Communities$cc$),
  ('home.tile1.desc',  $cc$Optima, Vue, 7180, and more. Amenities, pricing, and walkability by building.$cc$),
  ('home.tile1.image', $cc$assets/home-condo.jpg?v=2$cc$),
  ('home.tile1.link',  $cc$pages/condos.html$cc$),
  ('home.tile2.tag',   $cc$Investment$cc$),
  ('home.tile2.title', $cc$Short-Term Rental Hub$cc$),
  ('home.tile2.desc',  $cc$ROI calculators, zoning maps, and everything you need to invest in Old Town STRs.$cc$),
  ('home.tile2.image', $cc$assets/home-str.jpg?v=3$cc$),
  ('home.tile2.link',  $cc$pages/str-hub.html$cc$),
  ('home.tile3.tag',   $cc$Lifestyle$cc$),
  ('home.tile3.title', $cc$Old Town Life$cc$),
  ('home.tile3.desc',  $cc$Restaurants, events, hidden gems, and the real rhythm of Old Town living.$cc$),
  ('home.tile3.image', $cc$assets/home-insider.jpg?v=4$cc$),
  ('home.tile3.link',  $cc$pages/old-town-life.html$cc$)
on conflict (key) do nothing;
