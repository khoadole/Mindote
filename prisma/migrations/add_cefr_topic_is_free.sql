-- Add isFree column to cefr_topics
-- Apply via Supabase Dashboard → SQL Editor

ALTER TABLE cefr_topics ADD COLUMN IF NOT EXISTS is_free BOOLEAN NOT NULL DEFAULT FALSE;

-- Set the first 2 topics per level (by "order" ASC) as free
UPDATE cefr_topics
SET is_free = TRUE
WHERE id IN (
  SELECT id FROM (
    SELECT id, ROW_NUMBER() OVER (PARTITION BY level ORDER BY "order" ASC) AS rn
    FROM cefr_topics
  ) sub
  WHERE rn <= 2
);
