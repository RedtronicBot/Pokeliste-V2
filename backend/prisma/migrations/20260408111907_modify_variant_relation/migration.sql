/*
  Warnings:

  - The primary key for the `OwnedVariant` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the `_OwnedVariantToUser` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[userId,cardId]` on the table `OwnedVariant` will be added. If there are existing duplicate values, this will fail.
  - The required column `id` was added to the `OwnedVariant` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.
  - Added the required column `userId` to the `OwnedVariant` table without a default value. This is not possible if the table is not empty.

*/
-- Supprime la foreign key de Card vers OwnedVariant
-- Supprime l'ancienne table de jointure implicite si elle existe
DROP TABLE IF EXISTS `_OwnedVariantToUser`;

-- Recrée OwnedVariant avec la nouvelle structure
DROP TABLE `OwnedVariant`;
CREATE TABLE `OwnedVariant` (
    `id`            VARCHAR(191) NOT NULL,
    `userId`        VARCHAR(191) NOT NULL,
    `cardId`        VARCHAR(191) NOT NULL,
    `normal`        INTEGER NOT NULL,
    `holo`          INTEGER NOT NULL,
    `reverse`       INTEGER NOT NULL,
    `firstEdition`  INTEGER NOT NULL,
    `secondEdition` INTEGER NOT NULL,

    UNIQUE INDEX `OwnedVariant_userId_cardId_key`(`userId`, `cardId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `OwnedVariant` ADD CONSTRAINT `OwnedVariant_userId_fkey`
    FOREIGN KEY (`userId`) REFERENCES `User`(`id`)
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `OwnedVariant` ADD CONSTRAINT `OwnedVariant_cardId_fkey`
    FOREIGN KEY (`cardId`) REFERENCES `Card`(`id`)
    ON DELETE RESTRICT ON UPDATE CASCADE;
