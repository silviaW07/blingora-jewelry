SET FOREIGN_KEY_CHECKS=0;
-- CreateTable
CREATE TABLE `homeRecommendCollection` (
    `id` VARCHAR(36) NOT NULL,
    `name` VARCHAR(150) NOT NULL,
    `description` TEXT NULL,
    `sourceZoneId` VARCHAR(36) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `homeRecommendCollection_sourceZoneId_key`(`sourceZoneId`),
    INDEX `homeRecommendCollection_isActive_idx`(`isActive`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `homeRecommendCollectionItem` (
    `id` VARCHAR(36) NOT NULL,
    `collectionId` VARCHAR(36) NOT NULL,
    `productId` VARCHAR(36) NOT NULL,
    `sortWeight` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `homeRecommendCollectionItem_collectionId_idx`(`collectionId`),
    INDEX `homeRecommendCollectionItem_productId_idx`(`productId`),
    INDEX `homeRecommendCollectionItem_sortWeight_idx`(`sortWeight`),
    UNIQUE INDEX `homeRecommendCollectionItem_collectionId_productId_key`(`collectionId`, `productId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `homeRecommendZone` (
    `id` VARCHAR(36) NOT NULL,
    `title` VARCHAR(150) NOT NULL,
    `zoneType` ENUM('PRODUCT', 'CATEGORY') NOT NULL,
    `pcCols` INTEGER NOT NULL DEFAULT 4,
    `mobileCols` INTEGER NOT NULL DEFAULT 2,
    `sortWeight` INTEGER NOT NULL DEFAULT 0,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `boundCollectionId` VARCHAR(36) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `homeRecommendZone_boundCollectionId_key`(`boundCollectionId`),
    INDEX `homeRecommendZone_zoneType_idx`(`zoneType`),
    INDEX `homeRecommendZone_isActive_idx`(`isActive`),
    INDEX `homeRecommendZone_sortWeight_idx`(`sortWeight`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `homeRecommendZoneItem` (
    `id` VARCHAR(36) NOT NULL,
    `zoneId` VARCHAR(36) NOT NULL,
    `entityType` ENUM('PRODUCT', 'CATEGORY') NOT NULL,
    `productId` VARCHAR(36) NULL,
    `categoryId` VARCHAR(36) NULL,
    `sortWeight` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `homeRecommendZoneItem_zoneId_idx`(`zoneId`),
    INDEX `homeRecommendZoneItem_productId_idx`(`productId`),
    INDEX `homeRecommendZoneItem_categoryId_idx`(`categoryId`),
    INDEX `homeRecommendZoneItem_sortWeight_idx`(`sortWeight`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `homeRecommendCollection` ADD CONSTRAINT `homeRecommendCollection_sourceZoneId_fkey` FOREIGN KEY (`sourceZoneId`) REFERENCES `homeRecommendZone`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `homeRecommendCollectionItem` ADD CONSTRAINT `homeRecommendCollectionItem_collectionId_fkey` FOREIGN KEY (`collectionId`) REFERENCES `homeRecommendCollection`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `homeRecommendCollectionItem` ADD CONSTRAINT `homeRecommendCollectionItem_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `product`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `homeRecommendZone` ADD CONSTRAINT `homeRecommendZone_boundCollectionId_fkey` FOREIGN KEY (`boundCollectionId`) REFERENCES `homeRecommendCollection`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `homeRecommendZoneItem` ADD CONSTRAINT `homeRecommendZoneItem_zoneId_fkey` FOREIGN KEY (`zoneId`) REFERENCES `homeRecommendZone`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `homeRecommendZoneItem` ADD CONSTRAINT `homeRecommendZoneItem_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `product`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `homeRecommendZoneItem` ADD CONSTRAINT `homeRecommendZoneItem_categoryId_fkey` FOREIGN KEY (`categoryId`) REFERENCES `category`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
SET FOREIGN_KEY_CHECKS=1;