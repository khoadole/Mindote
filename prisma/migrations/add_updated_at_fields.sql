-- =====================================================
-- DATABASE SCHEMA MIGRATION: Add updatedAt fields
-- =====================================================
--
-- This migration adds:
-- 1. updated_at column to words table
-- 2. updated_at column to reading_passages table
-- 
-- Run this in Supabase SQL Editor BEFORE running prisma migrate
-- =====================================================

-- Add updated_at to words table
ALTER TABLE words 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Add trigger to auto-update updated_at on words
CREATE OR REPLACE FUNCTION update_words_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql
SET search_path = public;

DROP TRIGGER IF EXISTS trigger_words_updated_at ON words;
CREATE TRIGGER trigger_words_updated_at
    BEFORE UPDATE ON words
    FOR EACH ROW
    EXECUTE FUNCTION update_words_updated_at();

-- Add updated_at to reading_passages table
ALTER TABLE reading_passages 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Add trigger to auto-update updated_at on reading_passages
CREATE OR REPLACE FUNCTION update_reading_passages_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql
SET search_path = public;

DROP TRIGGER IF EXISTS trigger_reading_passages_updated_at ON reading_passages;
CREATE TRIGGER trigger_reading_passages_updated_at
    BEFORE UPDATE ON reading_passages
    FOR EACH ROW
    EXECUTE FUNCTION update_reading_passages_updated_at();

-- Update existing rows to have updated_at = created_at
UPDATE words SET updated_at = created_at WHERE updated_at IS NULL;
UPDATE reading_passages SET updated_at = created_at WHERE updated_at IS NULL;

-- Make updated_at NOT NULL after populating
ALTER TABLE words ALTER COLUMN updated_at SET NOT NULL;
ALTER TABLE reading_passages ALTER COLUMN updated_at SET NOT NULL;

-- Verify columns were added
SELECT 
    table_name, 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name IN ('words', 'reading_passages') 
  AND column_name = 'updated_at';
