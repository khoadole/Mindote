-- CreateTable: writing_passages stores pre-curated writing prompts (admin-managed)
CREATE TABLE "writing_passages" (
    "id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "title_en" TEXT,
    "source_text" TEXT NOT NULL,
    "reference_text" TEXT,
    "level" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "tags" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "target_word_count" INTEGER NOT NULL DEFAULT 100,
    "estimated_minutes" INTEGER NOT NULL DEFAULT 10,
    "is_published" BOOLEAN NOT NULL DEFAULT true,
    "order" INTEGER NOT NULL DEFAULT 0,
    "vocabulary_hints" JSONB,
    "grammar_focus" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "writing_passages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex: filter by level
CREATE INDEX "writing_passages_level_idx" ON "writing_passages"("level");

-- CreateIndex: filter by topic
CREATE INDEX "writing_passages_topic_idx" ON "writing_passages"("topic");

-- CreateIndex: filter published passages by level (most common query)
CREATE INDEX "writing_passages_is_published_level_idx" ON "writing_passages"("is_published", "level");

-- CreateTable: writing_attempts stores user writing submissions and AI results
-- App logic limits to last 3 attempts per (user_id, passage_id)
CREATE TABLE "writing_attempts" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "passage_id" UUID NOT NULL,
    "user_text" TEXT NOT NULL,
    "ai_result" JSONB,
    "score" DOUBLE PRECISION,
    "completed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "writing_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex: fetch attempts for (user, passage) pair
CREATE INDEX "writing_attempts_user_id_passage_id_idx" ON "writing_attempts"("user_id", "passage_id");

-- CreateIndex: fetch user's recent attempts ordered by date
CREATE INDEX "writing_attempts_user_id_completed_at_idx" ON "writing_attempts"("user_id", "completed_at");

-- AddForeignKey: writing_attempts.user_id → users.id
ALTER TABLE "writing_attempts" ADD CONSTRAINT "writing_attempts_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: writing_attempts.passage_id → writing_passages.id
ALTER TABLE "writing_attempts" ADD CONSTRAINT "writing_attempts_passage_id_fkey"
    FOREIGN KEY ("passage_id") REFERENCES "writing_passages"("id") ON DELETE CASCADE ON UPDATE CASCADE;
