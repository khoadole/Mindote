-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES FOR SUPABASE
-- =====================================================
-- 
-- Script này tạo các policies để đảm bảo:
-- 1. Users chỉ có thể truy cập data của chính họ
-- 2. Mỗi bảng có policies riêng cho SELECT, INSERT, UPDATE, DELETE
-- 3. Sử dụng auth.uid() từ Supabase Auth để xác định user
--
-- Cách chạy:
-- 1. Mở Supabase Dashboard > SQL Editor
-- 2. Copy và paste script này
-- 3. Click "Run" để execute
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE "Collection" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Word" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Setting" ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- COLLECTION POLICIES
-- =====================================================

-- Policy: Users can view only their own collections
CREATE POLICY "Users can view their own collections"
ON "Collection"
FOR SELECT
USING (auth.uid() = "userId");

-- Policy: Users can insert collections for themselves
CREATE POLICY "Users can insert their own collections"
ON "Collection"
FOR INSERT
WITH CHECK (auth.uid() = "userId");

-- Policy: Users can update only their own collections
CREATE POLICY "Users can update their own collections"
ON "Collection"
FOR UPDATE
USING (auth.uid() = "userId")
WITH CHECK (auth.uid() = "userId");

-- Policy: Users can delete only their own collections
CREATE POLICY "Users can delete their own collections"
ON "Collection"
FOR DELETE
USING (auth.uid() = "userId");

-- =====================================================
-- WORD POLICIES
-- =====================================================

-- Policy: Users can view words in their collections
CREATE POLICY "Users can view words in their collections"
ON "Word"
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM "Collection"
    WHERE "Collection"."id" = "Word"."collectionId"
    AND "Collection"."userId" = auth.uid()
  )
);

-- Policy: Users can insert words into their collections
CREATE POLICY "Users can insert words into their collections"
ON "Word"
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM "Collection"
    WHERE "Collection"."id" = "Word"."collectionId"
    AND "Collection"."userId" = auth.uid()
  )
);

-- Policy: Users can update words in their collections
CREATE POLICY "Users can update words in their collections"
ON "Word"
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM "Collection"
    WHERE "Collection"."id" = "Word"."collectionId"
    AND "Collection"."userId" = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM "Collection"
    WHERE "Collection"."id" = "Word"."collectionId"
    AND "Collection"."userId" = auth.uid()
  )
);

-- Policy: Users can delete words from their collections
CREATE POLICY "Users can delete words from their collections"
ON "Word"
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM "Collection"
    WHERE "Collection"."id" = "Word"."collectionId"
    AND "Collection"."userId" = auth.uid()
  )
);

-- =====================================================
-- SETTING POLICIES
-- =====================================================

-- Policy: Users can view only their own settings
CREATE POLICY "Users can view their own settings"
ON "Setting"
FOR SELECT
USING (auth.uid() = "userId");

-- Policy: Users can insert settings for themselves
CREATE POLICY "Users can insert their own settings"
ON "Setting"
FOR INSERT
WITH CHECK (auth.uid() = "userId");

-- Policy: Users can update only their own settings
CREATE POLICY "Users can update their own settings"
ON "Setting"
FOR UPDATE
USING (auth.uid() = "userId")
WITH CHECK (auth.uid() = "userId");

-- Policy: Users can delete only their own settings
CREATE POLICY "Users can delete their own settings"
ON "Setting"
FOR DELETE
USING (auth.uid() = "userId");

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================
-- Uncomment to test your policies:

-- Check if RLS is enabled
-- SELECT tablename, rowsecurity 
-- FROM pg_tables 
-- WHERE schemaname = 'public' 
-- AND tablename IN ('Collection', 'Word', 'Setting');

-- List all policies
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
-- FROM pg_policies
-- WHERE schemaname = 'public'
-- ORDER BY tablename, policyname;
