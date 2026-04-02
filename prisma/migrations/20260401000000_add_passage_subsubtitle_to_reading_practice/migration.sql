-- Add optional passage sub-subtitle for reading practice detail page
ALTER TABLE "reading_practice_parts"
ADD COLUMN "passage_subsubtitle" TEXT;
