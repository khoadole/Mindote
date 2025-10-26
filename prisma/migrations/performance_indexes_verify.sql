-- ================================================
-- VERIFICATION QUERIES
-- ================================================
-- Run these AFTER applying performance_indexes.sql
-- to verify indexes were created successfully
-- ================================================

-- ================================================
-- 1. CHECK ALL INDEXES ON WORDS TABLE
-- ================================================
SELECT 
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'words'
ORDER BY indexname;

-- Expected indexes:
-- ✅ idx_words_collection_next_review
-- ✅ idx_words_collection_next_review_partial
-- ✅ idx_words_collection_score_created
-- ✅ idx_words_created_at_brin
-- ✅ idx_words_definition_gin
-- ✅ idx_words_mastered
-- ✅ idx_words_term_gin
-- ✅ words_collection_id_score_idx (existing)
-- ✅ words_collection_id_term_idx (existing)
-- ✅ words_next_review_idx (existing)
-- ✅ words_pkey (primary key)

-- ================================================
-- 2. CHECK INDEX SIZES
-- ================================================
SELECT
  indexrelname as index_name,
  pg_size_pretty(pg_relation_size(indexrelid)) as index_size,
  idx_scan as times_used
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
  AND tablename = 'words'
ORDER BY pg_relation_size(indexrelid) DESC;

-- Expected sizes:
-- GIN indexes: 1-10 MB
-- B-tree indexes: 0.5-5 MB
-- BRIN indexes: 8-64 KB (very small!)

-- ================================================
-- 3. CHECK ALL TABLE INDEX SIZES
-- ================================================
SELECT
  indexrelname as index_name,
  tablename,
  pg_size_pretty(pg_relation_size(indexrelid)) as index_size
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY pg_relation_size(indexrelid) DESC;

-- ================================================
-- 4. CHECK INDEX USAGE (Run after a few days)
-- ================================================
SELECT
  schemaname,
  tablename,
  indexrelname,
  idx_scan as times_used,
  idx_tup_read as tuples_read,
  idx_tup_fetch as tuples_fetched,
  pg_size_pretty(pg_relation_size(indexrelid)) as index_size
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
  AND tablename IN ('words', 'collections', 'users')
ORDER BY idx_scan DESC;

-- High idx_scan = index is being used frequently ✅
-- Low/zero idx_scan = index might not be needed ⚠️

-- ================================================
-- 5. CHECK FOR UNUSED INDEXES (Cleanup later)
-- ================================================
SELECT
  schemaname,
  tablename,
  indexrelname,
  idx_scan,
  pg_size_pretty(pg_relation_size(indexrelid)) as index_size
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
  AND idx_scan = 0
  AND indexrelname NOT LIKE '%_pkey'
  AND indexrelname NOT LIKE '%_collection_id_term_key'
ORDER BY pg_relation_size(indexrelid) DESC;

-- If an index has 0 scans after 1 week, consider dropping it

-- ================================================
-- 6. CHECK TABLE STATISTICS
-- ================================================
SELECT
  schemaname,
  tablename,
  n_live_tup as row_count,
  n_dead_tup as dead_rows,
  last_vacuum,
  last_autovacuum,
  last_analyze,
  last_autoanalyze
FROM pg_stat_user_tables
WHERE schemaname = 'public'
ORDER BY n_live_tup DESC;

-- ================================================
-- 7. TEST TEXT SEARCH PERFORMANCE
-- ================================================
-- Test if GIN indexes are being used

EXPLAIN ANALYZE
SELECT * FROM words 
WHERE term ILIKE '%test%'
LIMIT 10;

-- Should show "Bitmap Index Scan using idx_words_term_gin"

EXPLAIN ANALYZE
SELECT * FROM words 
WHERE definition ILIKE '%example%'
LIMIT 10;

-- Should show "Bitmap Index Scan using idx_words_definition_gin"

-- ================================================
-- 8. TEST REVIEW QUERY PERFORMANCE
-- ================================================
-- Test composite index on review queries

EXPLAIN ANALYZE
SELECT w.*, c.name 
FROM words w
JOIN collections c ON w.collection_id = c.id
WHERE c.user_id = 'YOUR_USER_ID_HERE'::uuid
  AND (w.next_review IS NULL OR w.next_review <= NOW())
ORDER BY w.next_review ASC
LIMIT 50;

-- Should show "Index Scan using idx_words_collection_next_review"

-- ================================================
-- 9. CHECK CACHE HIT RATE
-- ================================================
-- Should be > 99% for optimal performance

SELECT
  'index hit rate' as name,
  (sum(idx_blks_hit)) / nullif(sum(idx_blks_hit + idx_blks_read), 0) * 100 as hit_rate_percent
FROM pg_statio_user_indexes
UNION ALL
SELECT
  'table hit rate' as name,
  sum(heap_blks_hit) / nullif(sum(heap_blks_hit) + sum(heap_blks_read), 0) * 100 as hit_rate_percent
FROM pg_statio_user_tables;

-- Target: > 99% for both

-- ================================================
-- 10. SUMMARY: INDEX HEALTH CHECK
-- ================================================
SELECT
  t.schemaname,
  t.tablename,
  pg_size_pretty(pg_total_relation_size(t.schemaname||'.'||t.tablename)) as total_size,
  pg_size_pretty(pg_relation_size(t.schemaname||'.'||t.tablename)) as table_size,
  pg_size_pretty(pg_total_relation_size(t.schemaname||'.'||t.tablename) - pg_relation_size(t.schemaname||'.'||t.tablename)) as indexes_size,
  (SELECT count(*) FROM pg_indexes WHERE tablename = t.tablename) as index_count
FROM pg_tables t
WHERE t.schemaname = 'public'
ORDER BY pg_total_relation_size(t.schemaname||'.'||t.tablename) DESC;

-- ================================================
-- DONE!
-- ================================================
-- If all queries above return expected results,
-- your performance optimization is complete! 🎉
