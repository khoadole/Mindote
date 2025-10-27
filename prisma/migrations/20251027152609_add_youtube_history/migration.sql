/*
  Warnings:

  - You are about to drop the column `srs_enabled` on the `settings` table. All the data in the column will be lost.
  - You are about to drop the column `tts_enabled` on the `settings` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "settings" DROP COLUMN "srs_enabled",
DROP COLUMN "tts_enabled";

-- AlterTable
ALTER TABLE "words" ADD COLUMN     "ease_factor" DOUBLE PRECISION NOT NULL DEFAULT 2.5,
ADD COLUMN     "interval" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "last_reviewed" TIMESTAMP(3),
ADD COLUMN     "next_review" TIMESTAMP(3),
ADD COLUMN     "part_of_speech" TEXT,
ADD COLUMN     "repetitions" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "youtube_history" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "url" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "video_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "youtube_history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "youtube_history_user_id_created_at_idx" ON "youtube_history"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "youtube_history_video_id_idx" ON "youtube_history"("video_id");

-- CreateIndex
CREATE UNIQUE INDEX "youtube_history_user_id_video_id_key" ON "youtube_history"("user_id", "video_id");

-- CreateIndex
CREATE INDEX "words_collection_id_score_idx" ON "words"("collection_id", "score");

-- CreateIndex
CREATE INDEX "words_next_review_idx" ON "words"("next_review");
