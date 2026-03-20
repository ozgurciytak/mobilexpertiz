/*
  Warnings:

  - A unique constraint covering the columns `[tcNo]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `tcNo` to the `User` table without a default value. This is not possible if the table is not empty.
  - Made the column `phone` on table `User` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
-- Önce tcNo alanını NULL olabilir şekilde ekleyelim
ALTER TABLE "User" ADD COLUMN "tcNo" TEXT;

-- Mevcut kullanıcılar için benzersiz geçici TC'ler atayalım (id üzerinden)
UPDATE "User" SET "tcNo" = 'TEMP_' || CAST(id AS TEXT) WHERE "tcNo" IS NULL;

-- NULL olan telefonları temizleyelim
UPDATE "User" SET "phone" = '05000000000' WHERE "phone" IS NULL;

-- Artık alanları NOT NULL yapabiliriz
ALTER TABLE "User" ALTER COLUMN "tcNo" SET NOT NULL;
ALTER TABLE "User" ALTER COLUMN "phone" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "User_tcNo_key" ON "User"("tcNo");
