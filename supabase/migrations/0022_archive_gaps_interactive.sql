-- Migration 0022: Interactive Archival Request & Discovery Board (archive_gaps, upvotes, comments)

-- 1. Evolve public.archive_gaps
ALTER TABLE public.archive_gaps
  ADD COLUMN IF NOT EXISTS title         text,
  ADD COLUMN IF NOT EXISTS description   text,
  ADD COLUMN IF NOT EXISTS status        text NOT NULL DEFAULT 'open',
  ADD COLUMN IF NOT EXISTS source_type   text NOT NULL DEFAULT 'user_post',
  ADD COLUMN IF NOT EXISTS upvote_count  integer NOT NULL DEFAULT 0;

-- Backfill title for auto_logged records
UPDATE public.archive_gaps SET title = query_text WHERE title IS NULL;

-- Title non-empty constraint
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'archive_gaps_title_not_empty'
  ) THEN
    ALTER TABLE public.archive_gaps
      ADD CONSTRAINT archive_gaps_title_not_empty 
      CHECK (title IS NULL OR char_length(trim(title)) > 0);
  END IF;
END $$;

-- Indexes on archive_gaps
CREATE INDEX IF NOT EXISTS archive_gaps_status_idx ON public.archive_gaps (status);
CREATE INDEX IF NOT EXISTS archive_gaps_upvote_count_idx ON public.archive_gaps (upvote_count DESC);
CREATE INDEX IF NOT EXISTS archive_gaps_source_type_idx ON public.archive_gaps (source_type);


-- 2. New Table: public.archive_gap_upvotes
CREATE TABLE IF NOT EXISTS public.archive_gap_upvotes (
  gap_id     uuid REFERENCES public.archive_gaps(id) ON DELETE CASCADE,
  user_id    uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (gap_id, user_id)
);

CREATE INDEX IF NOT EXISTS archive_gap_upvotes_user_id_idx 
  ON public.archive_gap_upvotes (user_id);

ALTER TABLE public.archive_gap_upvotes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "archive_gap_upvotes: public select" ON public.archive_gap_upvotes;
CREATE POLICY "archive_gap_upvotes: public select"
  ON public.archive_gap_upvotes FOR SELECT USING (true);

DROP POLICY IF EXISTS "archive_gap_upvotes: authenticated insert" ON public.archive_gap_upvotes;
CREATE POLICY "archive_gap_upvotes: authenticated insert"
  ON public.archive_gap_upvotes FOR INSERT TO authenticated
  WITH CHECK (
    (select auth.uid()) = user_id
    AND NOT EXISTS (
      SELECT 1 FROM public.archive_gaps g
      WHERE g.id = gap_id AND g.user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "archive_gap_upvotes: authenticated delete" ON public.archive_gap_upvotes;
CREATE POLICY "archive_gap_upvotes: authenticated delete"
  ON public.archive_gap_upvotes FOR DELETE TO authenticated
  USING ((select auth.uid()) = user_id);


-- 3. New Table: public.archive_gap_comments
CREATE TABLE IF NOT EXISTS public.archive_gap_comments (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gap_id     uuid NOT NULL REFERENCES public.archive_gaps(id) ON DELETE CASCADE,
  user_id    uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content    text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT archive_gap_comments_content_not_empty CHECK (char_length(trim(content)) > 0)
);

CREATE INDEX IF NOT EXISTS archive_gap_comments_gap_id_created_at_idx 
  ON public.archive_gap_comments (gap_id, created_at ASC);

CREATE INDEX IF NOT EXISTS archive_gap_comments_user_id_idx 
  ON public.archive_gap_comments (user_id);

-- Automatic updated_at Trigger
CREATE OR REPLACE FUNCTION public.fn_set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_set_archive_gap_comments_updated_at ON public.archive_gap_comments;
CREATE TRIGGER tr_set_archive_gap_comments_updated_at
  BEFORE UPDATE ON public.archive_gap_comments
  FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();

ALTER TABLE public.archive_gap_comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "archive_gap_comments: public select" ON public.archive_gap_comments;
CREATE POLICY "archive_gap_comments: public select"
  ON public.archive_gap_comments FOR SELECT USING (true);

DROP POLICY IF EXISTS "archive_gap_comments: authenticated insert" ON public.archive_gap_comments;
CREATE POLICY "archive_gap_comments: authenticated insert"
  ON public.archive_gap_comments FOR INSERT TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "archive_gap_comments: owner update" ON public.archive_gap_comments;
CREATE POLICY "archive_gap_comments: owner update"
  ON public.archive_gap_comments FOR UPDATE TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "archive_gap_comments: owner delete" ON public.archive_gap_comments;
CREATE POLICY "archive_gap_comments: owner delete"
  ON public.archive_gap_comments FOR DELETE TO authenticated
  USING ((select auth.uid()) = user_id OR public.is_tier('tier_1'));


-- 4. Upvote Count Auto-Sync Trigger
CREATE OR REPLACE FUNCTION public.fn_sync_gap_upvote_count()
RETURNS trigger AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    UPDATE public.archive_gaps
    SET upvote_count = upvote_count + 1
    WHERE id = NEW.gap_id;
  ELSIF (TG_OP = 'DELETE') THEN
    UPDATE public.archive_gaps
    SET upvote_count = GREATEST(0, upvote_count - 1)
    WHERE id = OLD.gap_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_sync_gap_upvote_count ON public.archive_gap_upvotes;
CREATE TRIGGER tr_sync_gap_upvote_count
AFTER INSERT OR DELETE ON public.archive_gap_upvotes
FOR EACH ROW EXECUTE FUNCTION public.fn_sync_gap_upvote_count();
