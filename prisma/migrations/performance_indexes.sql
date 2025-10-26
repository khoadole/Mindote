-- ================================================
-- Performance Optimization Migration
-- ================================================
-- This migration adds indexes to improve query performance
-- Safe to run on production (uses IF NOT EXISTS)
-- Estimated time: 1-5 minutes depending on data size
-- ================================================

-- Enable pg_trgm extension for fuzzy text search and LIKE optimization
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ================================================
-- TEXT SEARCH INDEXES (GIN)
-- ================================================
-- These indexes dramatically improve text search performance
-- GIN (Generalized Inverted Index) is perfect for text search

-- Index for searching words by term
CREATE INDEX IF NOT EXISTS idx_words_term_gin 
  ON words USING GIN (term gin_trgm_ops);

-- Index for searching words by definition  
CREATE INDEX IF NOT EXISTS idx_words_definition_gin 
  ON words USING GIN (definition gin_trgm_ops);

-- ================================================
-- COMPOSITE INDEXES
-- ================================================
-- Composite indexes improve queries that filter by multiple columns

-- Optimize review queries (filter by collection + nextReview)
CREATE INDEX IF NOT EXISTS idx_words_collection_next_review 
  ON words (collection_id, next_review);

-- Optimize queries that sort by score within a collection
CREATE INDEX IF NOT EXISTS idx_words_collection_score_created 
  ON words (collection_id, score DESC, created_at DESC);

-- ================================================
-- PARTIAL INDEXES
-- ================================================
-- Partial indexes are smaller and faster for specific queries

-- Index for due words only (nextReview in the past or NULL)
-- Note: We cannot use NOW() in partial index, so we index all nextReview values
-- The WHERE clause will be applied at query time instead
CREATE INDEX IF NOT EXISTS idx_words_collection_next_review_partial 
  ON words (collection_id, next_review) 
  WHERE next_review IS NOT NULL;

-- Index for high-score words (for mastered words queries)
CREATE INDEX IF NOT EXISTS idx_words_mastered 
  ON words (collection_id, score) 
  WHERE score >= 80;

-- ================================================
-- BRIN INDEXES (Time-Series Data)
-- ================================================
-- BRIN indexes are 10-100x smaller than B-tree for sorted data
-- Perfect for created_at columns that always increase

-- BRIN index for words creation time
CREATE INDEX IF NOT EXISTS idx_words_created_at_brin 
  ON words USING BRIN (created_at);

-- BRIN index for collections creation time
CREATE INDEX IF NOT EXISTS idx_collections_created_at_brin 
  ON collections USING BRIN (created_at);

-- ================================================
-- UPDATE STATISTICS
-- ================================================
-- Ensures Postgres query planner has accurate data

ANALYZE words;
ANALYZE collections;
ANALYZE users;
ANALYZE settings;

-- ================================================
-- MIGRATION COMPLETE
-- ================================================
-- All indexes have been created successfully!
-- Run the verification queries separately to check results.
-- See: performance_indexes_verify.sql
