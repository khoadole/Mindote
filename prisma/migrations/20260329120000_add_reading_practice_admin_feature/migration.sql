-- CreateTable: admin-managed reading practice parts
CREATE TABLE "reading_practice_parts" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "exam_title" TEXT NOT NULL,
  "exam_code" TEXT,
  "part_number" INTEGER NOT NULL,
  "title" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "instructions" TEXT,
  "question_blocks" JSONB NOT NULL,
  "total_questions" INTEGER NOT NULL DEFAULT 0,
  "estimated_minutes" INTEGER NOT NULL DEFAULT 20,
  "level" TEXT,
  "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "status" TEXT NOT NULL DEFAULT 'DRAFT',
  "display_order" INTEGER NOT NULL DEFAULT 0,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "reading_practice_parts_pkey" PRIMARY KEY ("id")
);

-- CreateTable: latest user attempt per reading practice part
CREATE TABLE "reading_practice_attempts" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "user_id" UUID NOT NULL,
  "part_id" UUID NOT NULL,
  "answers" JSONB NOT NULL,
  "result" JSONB,
  "correct_count" INTEGER NOT NULL,
  "total_count" INTEGER NOT NULL,
  "score" INTEGER NOT NULL,
  "completed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "reading_practice_attempts_pkey" PRIMARY KEY ("id")
);

-- Indexes for listing/filtering performance
CREATE INDEX "reading_practice_parts_status_part_number_display_order_idx"
  ON "reading_practice_parts"("status", "part_number", "display_order");
CREATE INDEX "reading_practice_parts_exam_title_idx"
  ON "reading_practice_parts"("exam_title");
CREATE INDEX "reading_practice_parts_created_at_idx"
  ON "reading_practice_parts"("created_at");

-- Unique latest attempt per user + part
CREATE UNIQUE INDEX "reading_practice_attempts_user_id_part_id_key"
  ON "reading_practice_attempts"("user_id", "part_id");
CREATE INDEX "reading_practice_attempts_user_id_completed_at_idx"
  ON "reading_practice_attempts"("user_id", "completed_at");

-- Foreign keys
ALTER TABLE "reading_practice_attempts"
  ADD CONSTRAINT "reading_practice_attempts_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "reading_practice_attempts"
  ADD CONSTRAINT "reading_practice_attempts_part_id_fkey"
  FOREIGN KEY ("part_id") REFERENCES "reading_practice_parts"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
