-- AlterTable
ALTER TABLE `product_category_relations` ADD COLUMN `sortWeight` INTEGER NOT NULL DEFAULT 0;

CREATE INDEX `product_category_relations_categoryId_sortWeight_idx` ON `product_category_relations`(`categoryId`, `sortWeight`);
