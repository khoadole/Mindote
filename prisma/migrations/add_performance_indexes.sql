-- =====================================================
-- PERFORMANCE OPTIMIZATION INDEXES
-- =====================================================
-- 
-- Script này tạo các indexes để tối ưu performance:
-- 1. GIN indexes cho text search (10-100x faster)
-- 2. BRIN indexes cho time-series data
-- 3. Partial indexes cho specific queries
--
-- Cách chạy:
-- 1. Mở Supabase Dashboard > SQL Editor
-- 2. Copy và paste script này
-- 3. Click "Run" để execute
-- =====================================================

-- Enable pg_trgm extension for fuzzy text search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- =====================================================
-- GIN INDEXES FOR TEXT SEARCH
-- =====================================================
-- These indexes make LIKE '%query%' and ILIKE searches 10-100x faster

-- Index for word term search
CREATE INDEX IF NOT EXISTS idx_words_term_gin 
  ON words USING GIN (term gin_trgm_ops);

-- Index for word definition search
CREATE INDEX IF NOT EXISTS idx_words_definition_gin 
  ON words USING GIN (definition gin_trgm_ops);

-- Index for reading passage title search
CREATE INDEX IF NOT EXISTS idx_reading_passages_title_gin
  ON reading_passages USING GIN (title gin_trgm_ops);

-- Index for reading passage content search
CREATE INDEX IF NOT EXISTS idx_reading_passages_content_gin
  ON reading_passages USING GIN (content gin_trgm_ops);

-- =====================================================
-- BRIN INDEXES FOR TIME-SERIES DATA
-- =====================================================
-- BRIN indexes are smaller and faster for time-ordered data

-- Words created_at for sorting by date
CREATE INDEX IF NOT EXISTS idx_words_created_at_brin 
  ON words USING BRIN (created_at);

-- Collections created_at
CREATE INDEX IF NOT EXISTS idx_collections_created_at_brin 
  ON collections USING BRIN (created_at);

-- Reading passages created_at
CREATE INDEX IF NOT EXISTS idx_reading_passages_created_at_brin
  ON reading_passages USING BRIN (created_at);

-- Reading attempts completed_at
CREATE INDEX IF NOT EXISTS idx_reading_attempts_completed_at_brin
  ON reading_attempts USING BRIN (completed_at);

-- YouTube history created_at
CREATE INDEX IF NOT EXISTS idx_youtube_history_created_at_brin
  ON youtube_history USING BRIN (created_at);

-- =====================================================
-- PARTIAL INDEXES FOR SPECIFIC QUERIES
-- =====================================================

-- Index for due words (SRS review queries)
-- Only indexes words that are due for review
CREATE INDEX IF NOT EXISTS idx_words_due_for_review
  ON words (collection_id, next_review)
  WHERE next_review IS NOT NULL;

-- Index for new words (never reviewed)
CREATE INDEX IF NOT EXISTS idx_words_new
  ON words (collection_id, created_at)
  WHERE next_review IS NULL;

-- =====================================================
-- UPDATE STATISTICS
-- =====================================================
-- Run ANALYZE to update query planner statistics

ANALYZE words;
ANALYZE collections;
ANALYZE users;
ANALYZE settings;
ANALYZE youtube_history;
ANALYZE ai_usage;
ANALYZE reading_passages;
ANALYZE reading_attempts;
ANALYZE plans;
ANALYZE subscriptions;
ANALYZE webhook_events;

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================
-- Uncomment to verify indexes were created:

-- List all custom indexes
-- SELECT indexname, indexdef 
-- FROM pg_indexes 
-- WHERE schemaname = 'public' 
--   AND indexname LIKE 'idx_%'
-- ORDER BY tablename, indexname;

-- Check index sizes
-- SELECT 
--   indexrelname AS index_name,
--   pg_size_pretty(pg_relation_size(indexrelid)) AS index_size
-- FROM pg_stat_user_indexes
-- WHERE schemaname = 'public'
-- ORDER BY pg_relation_size(indexrelid) DESC;

