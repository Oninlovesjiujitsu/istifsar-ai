
-- ---------------------------------------------------------------------------
-- archive_gaps: add era / geography / subject columns for auto-categorization
-- ---------------------------------------------------------------------------
-- After a query fails the similarity gate, a background Gemini Flash call
-- classifies the query and populates these columns so historians can filter
-- the Bounty Board by their area of expertise.

alter table public.archive_gaps
  add column if not exists era       text,
  add column if not exists geography  text,
  add column if not exists subject    text;

comment on column public.archive_gaps.era is 'Auto-detected historical era (e.g., "Pre-Colonial", "Philippine Revolution").';
comment on column public.archive_gaps.geography is 'Auto-detected geographic focus (e.g., "Philippines", "Southeast Asia").';
comment on column public.archive_gaps.subject is 'Auto-detected subject matter (e.g., "Trade", "Governance", "Military").';
