/*
  Warnings:

  - A unique constraint covering the columns `[title]` on the table `Album` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `release` to the `Album` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tracks` to the `Album` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `Album` ADD COLUMN `release` VARCHAR(191) NOT NULL,
    ADD COLUMN `tracks` INTEGER NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX `Album_title_key` ON `Album`(`title`);
