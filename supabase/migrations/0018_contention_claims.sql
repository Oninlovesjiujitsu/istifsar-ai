-- Extend the contentions table with the richer shape required by the
-- Visual View (Versus card cluster). `topic` names what is disputed in
-- a short phrase; `claims` is a JSONB array of
-- { document_id, claim, excerpt } objects — one entry per scholar in
-- the disagreement. JSONB keeps the shape flexible across 2-way vs
-- 3+-way contentions without a second table.

alter table public.contentions
  add column if not exists topic  text,
  add column if not exists claims jsonb not null default '[]'::jsonb;
