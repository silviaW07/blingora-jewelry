SET FOREIGN_KEY_CHECKS=0;
-- CreateTable
CREATE TABLE `sysuser` (
    `id` VARCHAR(36) NOT NULL,
    `account` VARCHAR(50) NOT NULL,
    `password` VARCHAR(255) NOT NULL,
    `email` VARCHAR(100) NOT NULL,
    `role` ENUM('CUSTOMER', 'ADMIN') NOT NULL,
    `status` ENUM('ACTIVE', 'DISABLED') NOT NULL DEFAULT 'ACTIVE',
    `username` VARCHAR(100) NOT NULL,
    `avatarUrl` VARCHAR(700) NULL,
    `lastLoginAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `sysuser_account_key`(`account`),
    UNIQUE INDEX `sysuser_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `category` (
    `id` VARCHAR(36) NOT NULL,
    `name` VARCHAR(120) NOT NULL,
    `slug` VARCHAR(120) NOT NULL,
    `imageUrl` VARCHAR(700) NULL,
    `description` TEXT NULL,
    `sortWeight` INTEGER NOT NULL DEFAULT 0,
    `status` ENUM('ACTIVE', 'INACTIVE') NOT NULL DEFAULT 'ACTIVE',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `category_name_key`(`name`),
    UNIQUE INDEX `category_slug_key`(`slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `product` (
    `id` VARCHAR(36) NOT NULL,
    `categoryId` VARCHAR(36) NOT NULL,
    `name` VARCHAR(200) NOT NULL,
    `slug` VARCHAR(200) NOT NULL,
    `productCode` VARCHAR(100) NOT NULL,
    `source` ENUM('MANUAL', 'IMPORT_1688') NOT NULL,
    `status` ENUM('DRAFT', 'ACTIVE', 'INACTIVE') NOT NULL DEFAULT 'DRAFT',
    `mainImageUrl` VARCHAR(700) NOT NULL,
    `galleryJson` JSON NOT NULL,
    `shortDescription` TEXT NULL,
    `sellingPointsJson` JSON NULL,
    `detailContentJson` JSON NULL,
    `parameterJson` JSON NULL,
    `tradeInfoJson` JSON NULL,
    `faqJson` JSON NULL,
    `ratingAverage` DOUBLE NOT NULL DEFAULT 0,
    `ratingCount` INTEGER NOT NULL DEFAULT 0,
    `sortWeight` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `product_slug_key`(`slug`),
    UNIQUE INDEX `product_productCode_key`(`productCode`),
    INDEX `product_categoryId_idx`(`categoryId`),
    INDEX `product_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `productsku` (
    `id` VARCHAR(36) NOT NULL,
    `productId` VARCHAR(36) NOT NULL,
    `skuCode` VARCHAR(100) NOT NULL,
    `imageUrl` VARCHAR(700) NULL,
    `price` DECIMAL(10, 2) NOT NULL,
    `originalPrice` DECIMAL(10, 2) NULL,
    `stock` INTEGER NOT NULL DEFAULT 0,
    `stockStatus` ENUM('IN_STOCK', 'LOW_STOCK', 'OUT_OF_STOCK') NOT NULL DEFAULT 'IN_STOCK',
    `attributeJson` JSON NOT NULL,
    `deliveryDays` INTEGER NULL,
    `weightKg` DECIMAL(10, 3) NULL,
    `volumeM3` DECIMAL(10, 4) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `productsku_skuCode_key`(`skuCode`),
    INDEX `productsku_productId_idx`(`productId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `cart` (
    `id` VARCHAR(36) NOT NULL,
    `accountId` VARCHAR(36) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `cart_accountId_key`(`accountId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `cartitem` (
    `id` VARCHAR(36) NOT NULL,
    `cartId` VARCHAR(36) NOT NULL,
    `productId` VARCHAR(36) NOT NULL,
    `productSkuId` VARCHAR(36) NOT NULL,
    `quantity` INTEGER NOT NULL DEFAULT 1,
    `status` ENUM('VALID', 'INVALID') NOT NULL DEFAULT 'VALID',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `cartitem_cartId_idx`(`cartId`),
    INDEX `cartitem_productId_idx`(`productId`),
    INDEX `cartitem_productSkuId_idx`(`productSkuId`),
    UNIQUE INDEX `cartitem_cartId_productSkuId_key`(`cartId`, `productSkuId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `importtask` (
    `id` VARCHAR(36) NOT NULL,
    `creatorId` VARCHAR(36) NOT NULL,
    `taskName` VARCHAR(150) NOT NULL,
    `status` ENUM('PENDING', 'RUNNING', 'COMPLETED', 'FAILED') NOT NULL DEFAULT 'PENDING',
    `sourceLinkCount` INTEGER NOT NULL DEFAULT 0,
    `successCount` INTEGER NOT NULL DEFAULT 0,
    `failureCount` INTEGER NOT NULL DEFAULT 0,
    `progressPercent` INTEGER NOT NULL DEFAULT 0,
    `markupRate` DECIMAL(5, 2) NULL,
    `defaultStatus` ENUM('DRAFT', 'ACTIVE', 'INACTIVE') NOT NULL DEFAULT 'DRAFT',
    `defaultCategoryId` VARCHAR(36) NULL,
    `stockStrategyJson` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `importtask_creatorId_idx`(`creatorId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `importtaskitem` (
    `id` VARCHAR(36) NOT NULL,
    `importTaskId` VARCHAR(36) NOT NULL,
    `operatorId` VARCHAR(36) NOT NULL,
    `sourceUrl` VARCHAR(700) NOT NULL,
    `parsedName` VARCHAR(200) NULL,
    `parsedMainImageUrl` VARCHAR(700) NULL,
    `parsedPriceMin` DECIMAL(10, 2) NULL,
    `parsedPriceMax` DECIMAL(10, 2) NULL,
    `specSummaryJson` JSON NULL,
    `previewDataJson` JSON NULL,
    `isSelected` BOOLEAN NOT NULL DEFAULT false,
    `importedProductId` VARCHAR(36) NULL,
    `failureReason` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `importtaskitem_importTaskId_idx`(`importTaskId`),
    INDEX `importtaskitem_operatorId_idx`(`operatorId`),
    INDEX `importtaskitem_importedProductId_idx`(`importedProductId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `product` ADD CONSTRAINT `product_categoryId_fkey` FOREIGN KEY (`categoryId`) REFERENCES `category`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `productsku` ADD CONSTRAINT `productsku_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `product`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `cart` ADD CONSTRAINT `cart_accountId_fkey` FOREIGN KEY (`accountId`) REFERENCES `sysuser`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `cartitem` ADD CONSTRAINT `cartitem_cartId_fkey` FOREIGN KEY (`cartId`) REFERENCES `cart`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `cartitem` ADD CONSTRAINT `cartitem_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `product`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `cartitem` ADD CONSTRAINT `cartitem_productSkuId_fkey` FOREIGN KEY (`productSkuId`) REFERENCES `productsku`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `importtask` ADD CONSTRAINT `importtask_creatorId_fkey` FOREIGN KEY (`creatorId`) REFERENCES `sysuser`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `importtaskitem` ADD CONSTRAINT `importtaskitem_importTaskId_fkey` FOREIGN KEY (`importTaskId`) REFERENCES `importtask`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `importtaskitem` ADD CONSTRAINT `importtaskitem_operatorId_fkey` FOREIGN KEY (`operatorId`) REFERENCES `sysuser`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `importtaskitem` ADD CONSTRAINT `importtaskitem_importedProductId_fkey` FOREIGN KEY (`importedProductId`) REFERENCES `product`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
SET FOREIGN_KEY_CHECKS=1;