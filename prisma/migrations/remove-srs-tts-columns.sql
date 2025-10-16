-- =============================================
-- Remove srsEnabled and ttsEnabled columns
-- Chạy script này trong Supabase SQL Editor
-- =============================================

-- Drop columns from settings table
ALTER TABLE public.settings 
DROP COLUMN IF EXISTS srs_enabled,
DROP COLUMN IF EXISTS tts_enabled;

-- =============================================
-- Done! Columns removed successfully
-- =============================================

-- Verify schema
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'settings'
ORDER BY ordinal_position;
