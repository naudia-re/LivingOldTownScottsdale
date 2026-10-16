-- Add the "Feature on section page" pin flag to posts.
-- Paste into Supabase SQL Editor -> New snippet -> Run. Safe to re-run.
alter table public.posts add column if not exists featured boolean not null default false;
create index if not exists posts_featured_idx on public.posts (category, featured, published_at desc);
