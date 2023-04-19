/*
  Warnings:

  - Added the required column `artistName` to the `Album` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `Album` ADD COLUMN `artistName` VARCHAR(191) NOT NULL;
