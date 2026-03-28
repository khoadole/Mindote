-- ============================================
-- Add Daily Activity Tracking for Streak
-- ============================================

-- Create user_daily_activity table to track learning activity per day
CREATE TABLE IF NOT EXISTS "user_daily_activity" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES "users"(id) ON DELETE CASCADE,
  activity_date DATE NOT NULL,
  
  -- Timestamps tracking first and last activity
  first_activity_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_activity_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Activity counters
  review_count INT NOT NULL DEFAULT 0,
  reading_attempt_count INT NOT NULL DEFAULT 0,
  writing_attempt_count INT NOT NULL DEFAULT 0,
  cefr_learn_count INT NOT NULL DEFAULT 0,
  word_created_count INT NOT NULL DEFAULT 0,
  
  total_events INT NOT NULL DEFAULT 1,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE(user_id, activity_date)
);

-- Index for streak calculation queries
CREATE INDEX IF NOT EXISTS "idx_user_daily_activity_user_date" ON "user_daily_activity"(user_id, activity_date DESC);
CREATE INDEX IF NOT EXISTS "idx_user_daily_activity_activity_date" ON "user_daily_activity"(activity_date DESC);

-- ============================================
-- Update User Table for New Streak Logic
-- ============================================

-- Add column for last learning date to support learning-based streak
ALTER TABLE "users" 
ADD COLUMN IF NOT EXISTS "last_learning_date" TIMESTAMP(3);

-- Update comment on current_streak to clarify it's now based on learning activity
COMMENT ON COLUMN "users".current_streak IS 'Current learning streak - incremented when user has learning activity on consecutive days';
