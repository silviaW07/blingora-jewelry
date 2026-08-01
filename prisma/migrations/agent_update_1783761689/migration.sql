SET FOREIGN_KEY_CHECKS=0;
-- DropForeignKey
ALTER TABLE `cart` DROP FOREIGN KEY `cart_accountId_fkey`;

-- DropForeignKey
ALTER TABLE `cartitem` DROP FOREIGN KEY `cartitem_cartId_fkey`;

-- DropForeignKey
ALTER TABLE `cartitem` DROP FOREIGN KEY `cartitem_productId_fkey`;

-- DropForeignKey
ALTER TABLE `cartitem` DROP FOREIGN KEY `cartitem_productSkuId_fkey`;

-- DropForeignKey
ALTER TABLE `importtask` DROP FOREIGN KEY `importtask_creatorId_fkey`;

-- DropForeignKey
ALTER TABLE `importtaskitem` DROP FOREIGN KEY `importtaskitem_importTaskId_fkey`;

-- DropForeignKey
ALTER TABLE `importtaskitem` DROP FOREIGN KEY `importtaskitem_operatorId_fkey`;

-- DropForeignKey
ALTER TABLE `product` DROP FOREIGN KEY `product_categoryId_fkey`;

-- DropForeignKey
ALTER TABLE `productsku` DROP FOREIGN KEY `productsku_productId_fkey`;

-- DropIndex
DROP INDEX `cartitem_cartId_productSkuId_key` ON `cartitem`;

-- AlterTable
ALTER TABLE `cartitem` ADD COLUMN `engravingFont` VARCHAR(50) NULL,
    ADD COLUMN `engravingPreviewUrl` VARCHAR(700) NULL,
    ADD COLUMN `engravingText` VARCHAR(120) NULL,
    ADD COLUMN `giftWrapFee` DECIMAL(10, 2) NULL,
    ADD COLUMN `giftWrapSelected` BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE `product` ADD COLUMN `brandName` VARCHAR(120) NULL,
    ADD COLUMN `careGuideJson` JSON NULL,
    ADD COLUMN `certificateInfo` TEXT NULL,
    ADD COLUMN `designStory` TEXT NULL,
    ADD COLUMN `engravingPreviewBaseUrl` VARCHAR(700) NULL,
    ADD COLUMN `gemstoneType` ENUM('DIAMOND', 'ZIRCON', 'PEARL', 'COLOR_GEM', 'NONE') NULL DEFAULT 'NONE',
    ADD COLUMN `hoverImageUrl` VARCHAR(700) NULL,
    ADD COLUMN `isBestSeller` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `isNewArrival` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `materialType` ENUM('GOLD_14K', 'GOLD_18K', 'SILVER_925', 'GOLD_PLATED', 'ROSE_GOLD', 'WHITE_GOLD', 'PEARL', 'GEMSTONE') NULL,
    ADD COLUMN `metalPurity` VARCHAR(50) NULL,
    ADD COLUMN `packagingImageUrl` VARCHAR(700) NULL,
    ADD COLUMN `platingProcess` VARCHAR(120) NULL,
    ADD COLUMN `productType` ENUM('RING', 'NECKLACE', 'EARRING', 'BRACELET', 'ANKLET', 'SET', 'MENS_JEWELRY', 'GIFT_BOX', 'CUSTOM_ENGRAVING') NOT NULL DEFAULT 'RING',
    ADD COLUMN `rotate360Json` JSON NULL,
    ADD COLUMN `sizeGuideJson` JSON NULL,
    ADD COLUMN `soldCount` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `totalCarat` DECIMAL(8, 2) NULL,
    ADD COLUMN `videoUrl` VARCHAR(700) NULL,
    ADD COLUMN `wearImageUrl` VARCHAR(700) NULL,
    ADD COLUMN `weightGram` DECIMAL(8, 2) NULL;

-- AlterTable
ALTER TABLE `productsku` ADD COLUMN `braceletLengthCm` VARCHAR(20) NULL,
    ADD COLUMN `engravingMaxChars` INTEGER NULL DEFAULT 0,
    ADD COLUMN `engravingSupported` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `extraFee` DECIMAL(10, 2) NULL,
    ADD COLUMN `fontOptionsJson` JSON NULL,
    ADD COLUMN `gemstoneType` ENUM('DIAMOND', 'ZIRCON', 'PEARL', 'COLOR_GEM', 'NONE') NULL DEFAULT 'NONE',
    ADD COLUMN `materialType` ENUM('GOLD_14K', 'GOLD_18K', 'SILVER_925', 'GOLD_PLATED', 'ROSE_GOLD', 'WHITE_GOLD', 'PEARL', 'GEMSTONE') NULL,
    ADD COLUMN `necklaceLengthInch` VARCHAR(20) NULL,
    ADD COLUMN `ringSizeEu` VARCHAR(20) NULL,
    ADD COLUMN `ringSizeUs` VARCHAR(20) NULL;

-- AlterTable
ALTER TABLE `sysuser` ADD COLUMN `braceletSize` VARCHAR(20) NULL,
    ADD COLUMN `phone` VARCHAR(30) NULL,
    ADD COLUMN `preferredCurrency` VARCHAR(10) NULL,
    ADD COLUMN `preferredLocale` VARCHAR(20) NULL,
    ADD COLUMN `ringSizeEu` VARCHAR(20) NULL,
    ADD COLUMN `ringSizeUs` VARCHAR(20) NULL,
    ADD COLUMN `savedPreferencesJson` JSON NULL;

-- CreateTable
CREATE TABLE `useraddress` (
    `id` VARCHAR(36) NOT NULL,
    `userId` VARCHAR(36) NOT NULL,
    `recipientName` VARCHAR(100) NOT NULL,
    `phone` VARCHAR(30) NULL,
    `countryCode` VARCHAR(10) NOT NULL,
    `countryName` VARCHAR(100) NOT NULL,
    `stateName` VARCHAR(100) NULL,
    `cityName` VARCHAR(100) NULL,
    `addressLine1` VARCHAR(255) NOT NULL,
    `addressLine2` VARCHAR(255) NULL,
    `postalCode` VARCHAR(30) NULL,
    `isDefault` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `useraddress_userId_idx`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `wishlistitem` (
    `id` VARCHAR(36) NOT NULL,
    `userId` VARCHAR(36) NOT NULL,
    `productId` VARCHAR(36) NOT NULL,
    `status` ENUM('ACTIVE', 'MOVED_TO_CART') NOT NULL DEFAULT 'ACTIVE',
    `shareToken` VARCHAR(100) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `wishlistitem_shareToken_key`(`shareToken`),
    INDEX `wishlistitem_userId_idx`(`userId`),
    INDEX `wishlistitem_productId_idx`(`productId`),
    UNIQUE INDEX `wishlistitem_userId_productId_key`(`userId`, `productId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sitesetting` (
    `id` VARCHAR(36) NOT NULL,
    `settingType` ENUM('PROMO_BAR', 'HERO_BANNER', 'HOT_MATERIAL', 'LOOKBOOK', 'TRUST_BADGE', 'HOT_SEARCH', 'FOOTER_LINK', 'FLOAT_CONTACT', 'HOMEPAGE_POSTER') NOT NULL,
    `title` VARCHAR(150) NOT NULL,
    `subtitle` VARCHAR(200) NULL,
    `contentJson` JSON NOT NULL,
    `imageUrl` VARCHAR(700) NULL,
    `localeCode` VARCHAR(20) NULL,
    `currencyCode` VARCHAR(10) NULL,
    `sortWeight` INTEGER NOT NULL DEFAULT 0,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `sitesetting_settingType_idx`(`settingType`),
    INDEX `sitesetting_isActive_idx`(`isActive`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `lookbook` (
    `id` VARCHAR(36) NOT NULL,
    `title` VARCHAR(150) NOT NULL,
    `subtitle` VARCHAR(200) NULL,
    `imageUrl` VARCHAR(700) NOT NULL,
    `videoUrl` VARCHAR(700) NULL,
    `description` TEXT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `sortWeight` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `lookbookproduct` (
    `id` VARCHAR(36) NOT NULL,
    `lookbookId` VARCHAR(36) NOT NULL,
    `productId` VARCHAR(36) NOT NULL,
    `hotspotJson` JSON NULL,

    INDEX `lookbookproduct_lookbookId_idx`(`lookbookId`),
    INDEX `lookbookproduct_productId_idx`(`productId`),
    UNIQUE INDEX `lookbookproduct_lookbookId_productId_key`(`lookbookId`, `productId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `promotioncampaign` (
    `id` VARCHAR(36) NOT NULL,
    `name` VARCHAR(150) NOT NULL,
    `promotionType` ENUM('FLASH_SALE', 'COUPON', 'NEW_CUSTOMER', 'HOLIDAY') NOT NULL,
    `code` VARCHAR(60) NULL,
    `discountPercent` DECIMAL(5, 2) NULL,
    `discountAmount` DECIMAL(10, 2) NULL,
    `minOrderAmount` DECIMAL(10, 2) NULL,
    `startAt` DATETIME(3) NULL,
    `endAt` DATETIME(3) NULL,
    `usageLimit` INTEGER NULL,
    `usedCount` INTEGER NOT NULL DEFAULT 0,
    `contentJson` JSON NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `promotioncampaign_code_key`(`code`),
    INDEX `promotioncampaign_promotionType_idx`(`promotionType`),
    INDEX `promotioncampaign_isActive_idx`(`isActive`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `orderrecord` (
    `id` VARCHAR(36) NOT NULL,
    `orderNo` VARCHAR(60) NOT NULL,
    `userId` VARCHAR(36) NOT NULL,
    `addressId` VARCHAR(36) NULL,
    `status` ENUM('PENDING_PAYMENT', 'PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED') NOT NULL DEFAULT 'PENDING_PAYMENT',
    `currencyCode` VARCHAR(10) NOT NULL,
    `localeCode` VARCHAR(20) NULL,
    `subtotalAmount` DECIMAL(10, 2) NOT NULL,
    `discountAmount` DECIMAL(10, 2) NOT NULL DEFAULT 0,
    `shippingAmount` DECIMAL(10, 2) NOT NULL DEFAULT 0,
    `giftWrapAmount` DECIMAL(10, 2) NOT NULL DEFAULT 0,
    `totalAmount` DECIMAL(10, 2) NOT NULL,
    `paymentMethod` ENUM('PAYPAL', 'BANK_TRANSFER') NOT NULL,
    `installmentInfo` VARCHAR(100) NULL,
    `couponId` VARCHAR(36) NULL,
    `shipMethod` ENUM('STANDARD', 'EXPRESS') NOT NULL DEFAULT 'STANDARD',
    `trackingCarrier` VARCHAR(60) NULL,
    `trackingNumber` VARCHAR(100) NULL,
    `estimatedArrivalAt` DATETIME(3) NULL,
    `giftMessage` VARCHAR(255) NULL,
    `note` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `orderrecord_orderNo_key`(`orderNo`),
    INDEX `orderrecord_userId_idx`(`userId`),
    INDEX `orderrecord_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `orderitem` (
    `id` VARCHAR(36) NOT NULL,
    `orderId` VARCHAR(36) NOT NULL,
    `productId` VARCHAR(36) NOT NULL,
    `productSkuId` VARCHAR(36) NOT NULL,
    `productName` VARCHAR(200) NOT NULL,
    `skuCode` VARCHAR(100) NOT NULL,
    `materialLabel` VARCHAR(60) NULL,
    `sizeLabel` VARCHAR(60) NULL,
    `engravingText` VARCHAR(120) NULL,
    `engravingFont` VARCHAR(50) NULL,
    `quantity` INTEGER NOT NULL DEFAULT 1,
    `unitPrice` DECIMAL(10, 2) NOT NULL,
    `lineAmount` DECIMAL(10, 2) NOT NULL,
    `giftWrapSelected` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `orderitem_orderId_idx`(`orderId`),
    INDEX `orderitem_productId_idx`(`productId`),
    INDEX `orderitem_productSkuId_idx`(`productSkuId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `productreview` (
    `id` VARCHAR(36) NOT NULL,
    `productId` VARCHAR(36) NOT NULL,
    `userId` VARCHAR(36) NOT NULL,
    `orderId` VARCHAR(36) NULL,
    `rating` INTEGER NOT NULL,
    `title` VARCHAR(150) NULL,
    `content` TEXT NULL,
    `imageUrlsJson` JSON NULL,
    `hasImages` BOOLEAN NOT NULL DEFAULT false,
    `status` ENUM('PUBLISHED', 'HIDDEN', 'PENDING') NOT NULL DEFAULT 'PUBLISHED',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `productreview_productId_idx`(`productId`),
    INDEX `productreview_userId_idx`(`userId`),
    INDEX `productreview_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `customorder` (
    `id` VARCHAR(36) NOT NULL,
    `orderId` VARCHAR(36) NULL,
    `userId` VARCHAR(36) NOT NULL,
    `productId` VARCHAR(36) NOT NULL,
    `productSkuId` VARCHAR(36) NOT NULL,
    `promotionId` VARCHAR(36) NULL,
    `engravingText` VARCHAR(120) NULL,
    `engravingFont` VARCHAR(50) NULL,
    `engravingPreviewUrl` VARCHAR(700) NULL,
    `status` ENUM('PENDING_CONFIRMATION', 'IN_PRODUCTION', 'READY_TO_SHIP', 'SHIPPED', 'COMPLETED') NOT NULL DEFAULT 'PENDING_CONFIRMATION',
    `productionNote` TEXT NULL,
    `shippingLabelUrl` VARCHAR(700) NULL,
    `completedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `customorder_orderId_key`(`orderId`),
    INDEX `customorder_userId_idx`(`userId`),
    INDEX `customorder_productId_idx`(`productId`),
    INDEX `customorder_productSkuId_idx`(`productSkuId`),
    INDEX `customorder_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sizemapping` (
    `id` VARCHAR(36) NOT NULL,
    `regionCode` VARCHAR(20) NOT NULL,
    `jewelryType` ENUM('RING', 'NECKLACE', 'EARRING', 'BRACELET', 'ANKLET', 'SET', 'MENS_JEWELRY', 'GIFT_BOX', 'CUSTOM_ENGRAVING') NOT NULL,
    `sourceSize` VARCHAR(20) NOT NULL,
    `targetRegionCode` VARCHAR(20) NOT NULL,
    `targetSize` VARCHAR(20) NOT NULL,
    `note` VARCHAR(200) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `sizemapping_regionCode_jewelryType_idx`(`regionCode`, `jewelryType`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `customerticket` (
    `id` VARCHAR(36) NOT NULL,
    `userId` VARCHAR(36) NULL,
    `contactName` VARCHAR(100) NOT NULL,
    `email` VARCHAR(120) NULL,
    `channel` VARCHAR(50) NULL,
    `subject` VARCHAR(150) NOT NULL,
    `content` TEXT NOT NULL,
    `status` ENUM('OPEN', 'REPLIED', 'RESOLVED', 'CLOSED') NOT NULL DEFAULT 'OPEN',
    `replyContent` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `customerticket_userId_idx`(`userId`),
    INDEX `customerticket_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE UNIQUE INDEX `cartitem_cartId_productSkuId_engravingText_engravingFont_key` ON `cartitem`(`cartId`, `productSkuId`, `engravingText`, `engravingFont`);

-- CreateIndex
CREATE INDEX `product_productType_idx` ON `product`(`productType`);

-- CreateIndex
CREATE INDEX `product_materialType_idx` ON `product`(`materialType`);

-- CreateIndex
CREATE INDEX `product_gemstoneType_idx` ON `product`(`gemstoneType`);

-- CreateIndex
CREATE INDEX `productsku_materialType_idx` ON `productsku`(`materialType`);

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
ALTER TABLE `useraddress` ADD CONSTRAINT `useraddress_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `sysuser`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `wishlistitem` ADD CONSTRAINT `wishlistitem_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `sysuser`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `wishlistitem` ADD CONSTRAINT `wishlistitem_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `product`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `lookbookproduct` ADD CONSTRAINT `lookbookproduct_lookbookId_fkey` FOREIGN KEY (`lookbookId`) REFERENCES `lookbook`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `lookbookproduct` ADD CONSTRAINT `lookbookproduct_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `product`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `orderrecord` ADD CONSTRAINT `orderrecord_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `sysuser`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `orderrecord` ADD CONSTRAINT `orderrecord_addressId_fkey` FOREIGN KEY (`addressId`) REFERENCES `useraddress`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `orderrecord` ADD CONSTRAINT `orderrecord_couponId_fkey` FOREIGN KEY (`couponId`) REFERENCES `promotioncampaign`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `orderitem` ADD CONSTRAINT `orderitem_orderId_fkey` FOREIGN KEY (`orderId`) REFERENCES `orderrecord`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `orderitem` ADD CONSTRAINT `orderitem_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `product`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `orderitem` ADD CONSTRAINT `orderitem_productSkuId_fkey` FOREIGN KEY (`productSkuId`) REFERENCES `productsku`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `productreview` ADD CONSTRAINT `productreview_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `product`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `productreview` ADD CONSTRAINT `productreview_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `sysuser`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `productreview` ADD CONSTRAINT `productreview_orderId_fkey` FOREIGN KEY (`orderId`) REFERENCES `orderrecord`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `customorder` ADD CONSTRAINT `customorder_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `sysuser`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `customorder` ADD CONSTRAINT `customorder_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `product`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `customorder` ADD CONSTRAINT `customorder_productSkuId_fkey` FOREIGN KEY (`productSkuId`) REFERENCES `productsku`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `customorder` ADD CONSTRAINT `customorder_promotionId_fkey` FOREIGN KEY (`promotionId`) REFERENCES `promotioncampaign`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `customerticket` ADD CONSTRAINT `customerticket_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `sysuser`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
SET FOREIGN_KEY_CHECKS=1;