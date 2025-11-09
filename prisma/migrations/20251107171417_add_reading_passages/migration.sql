-- CreateTable
CREATE TABLE "reading_passages" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "collection_id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "level" TEXT NOT NULL,
    "word_count" INTEGER NOT NULL,
    "estimated_time" INTEGER NOT NULL,
    "words_used" TEXT[],
    "questions" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reading_passages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reading_attempts" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "passage_id" UUID NOT NULL,
    "time_spent" INTEGER NOT NULL,
    "score" INTEGER NOT NULL,
    "answers" JSONB NOT NULL,
    "completed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reading_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "reading_passages_user_id_collection_id_idx" ON "reading_passages"("user_id", "collection_id");

-- CreateIndex
CREATE INDEX "reading_passages_level_idx" ON "reading_passages"("level");

-- CreateIndex
CREATE INDEX "reading_passages_created_at_idx" ON "reading_passages"("created_at");

-- CreateIndex
CREATE INDEX "reading_attempts_user_id_passage_id_idx" ON "reading_attempts"("user_id", "passage_id");

-- CreateIndex
CREATE INDEX "reading_attempts_user_id_completed_at_idx" ON "reading_attempts"("user_id", "completed_at");

-- AddForeignKey
ALTER TABLE "reading_passages" ADD CONSTRAINT "reading_passages_collection_id_fkey" FOREIGN KEY ("collection_id") REFERENCES "collections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reading_attempts" ADD CONSTRAINT "reading_attempts_passage_id_fkey" FOREIGN KEY ("passage_id") REFERENCES "reading_passages"("id") ON DELETE CASCADE ON UPDATE CASCADE;
