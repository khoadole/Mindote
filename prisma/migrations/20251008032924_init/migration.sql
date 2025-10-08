/*
  Warnings:

  - The primary key for the `Collection` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `Setting` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `Word` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the `User` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[collectionId,term]` on the table `Word` will be added. If there are existing duplicate values, this will fail.
  - Changed the type of `id` on the `Collection` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `userId` on the `Collection` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `id` on the `Setting` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `userId` on the `Setting` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `id` on the `Word` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `collectionId` on the `Word` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- DropForeignKey
ALTER TABLE "public"."Collection" DROP CONSTRAINT "Collection_userId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Setting" DROP CONSTRAINT "Setting_userId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Word" DROP CONSTRAINT "Word_collectionId_fkey";

-- DropIndex
DROP INDEX "public"."Word_collectionId_idx";

-- AlterTable
ALTER TABLE "Collection" DROP CONSTRAINT "Collection_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL,
DROP COLUMN "userId",
ADD COLUMN     "userId" UUID NOT NULL,
ADD CONSTRAINT "Collection_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "Setting" DROP CONSTRAINT "Setting_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL,
DROP COLUMN "userId",
ADD COLUMN     "userId" UUID NOT NULL,
ADD CONSTRAINT "Setting_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "Word" DROP CONSTRAINT "Word_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL,
DROP COLUMN "collectionId",
ADD COLUMN     "collectionId" UUID NOT NULL,
ADD CONSTRAINT "Word_pkey" PRIMARY KEY ("id");

-- DropTable
DROP TABLE "public"."User";

-- CreateIndex
CREATE INDEX "Collection_userId_idx" ON "Collection"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Setting_userId_key" ON "Setting"("userId");

-- CreateIndex
CREATE INDEX "Word_collectionId_term_idx" ON "Word"("collectionId", "term");

-- CreateIndex
CREATE UNIQUE INDEX "Word_collectionId_term_key" ON "Word"("collectionId", "term");

-- AddForeignKey
ALTER TABLE "Word" ADD CONSTRAINT "Word_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES "Collection"("id") ON DELETE CASCADE ON UPDATE CASCADE;
