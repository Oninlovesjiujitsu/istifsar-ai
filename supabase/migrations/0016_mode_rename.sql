-- Rename mode enum values: raw_evidence → scholarly_consensus, interpreted → scholar_lens

ALTER TABLE conversations DROP CONSTRAINT IF EXISTS conversations_mode_check;
ALTER TABLE archive_gaps  DROP CONSTRAINT IF EXISTS archive_gaps_mode_check;

UPDATE conversations SET mode = 'scholarly_consensus' WHERE mode = 'raw_evidence';
UPDATE conversations SET mode = 'scholar_lens'        WHERE mode = 'interpreted';

UPDATE archive_gaps SET mode = 'scholarly_consensus' WHERE mode = 'raw_evidence';
UPDATE archive_gaps SET mode = 'scholar_lens'        WHERE mode = 'interpreted';

ALTER TABLE conversations
  ADD CONSTRAINT conversations_mode_check
  CHECK (mode IN ('scholarly_consensus', 'scholar_lens'));

ALTER TABLE conversations
  ALTER COLUMN mode SET DEFAULT 'scholarly_consensus';

ALTER TABLE archive_gaps
  ADD CONSTRAINT archive_gaps_mode_check
  CHECK (mode IN ('scholarly_consensus', 'scholar_lens'));

ALTER TABLE archive_gaps
  ALTER COLUMN mode SET DEFAULT 'scholarly_consensus';
