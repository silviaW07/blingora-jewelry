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
ALTER TABLE `categoryfilterbinding` DROP FOREIGN KEY `categoryfilterbinding_categoryId_fkey`;

-- DropForeignKey
ALTER TABLE `categoryfilterbinding` DROP FOREIGN KEY `categoryfilterbinding_filterSpecId_fkey`;

-- DropForeignKey
ALTER TABLE `categorykeywordlink` DROP FOREIGN KEY `categorykeywordlink_categoryId_fkey`;

-- DropForeignKey
ALTER TABLE `categorykeywordlink` DROP FOREIGN KEY `categorykeywordlink_keywordGroupId_fkey`;

-- DropForeignKey
ALTER TABLE `categorynavconfig` DROP FOREIGN KEY `categorynavconfig_categoryId_fkey`;

-- DropForeignKey
ALTER TABLE `categoryspectemplatebinding` DROP FOREIGN KEY `categoryspectemplatebinding_categoryId_fkey`;

-- DropForeignKey
ALTER TABLE `categoryspectemplatebinding` DROP FOREIGN KEY `categoryspectemplatebinding_specTemplateId_fkey`;

-- DropForeignKey
ALTER TABLE `customercommunication` DROP FOREIGN KEY `customercommunication_userId_fkey`;

-- DropForeignKey
ALTER TABLE `customertaglink` DROP FOREIGN KEY `customertaglink_tagId_fkey`;

-- DropForeignKey
ALTER TABLE `customertaglink` DROP FOREIGN KEY `customertaglink_userId_fkey`;

-- DropForeignKey
ALTER TABLE `customorder` DROP FOREIGN KEY `customorder_productId_fkey`;

-- DropForeignKey
ALTER TABLE `customorder` DROP FOREIGN KEY `customorder_productSkuId_fkey`;

-- DropForeignKey
ALTER TABLE `customorder` DROP FOREIGN KEY `customorder_userId_fkey`;

-- DropForeignKey
ALTER TABLE `importtask` DROP FOREIGN KEY `importtask_creatorId_fkey`;

-- DropForeignKey
ALTER TABLE `importtaskitem` DROP FOREIGN KEY `importtaskitem_importTaskId_fkey`;

-- DropForeignKey
ALTER TABLE `importtaskitem` DROP FOREIGN KEY `importtaskitem_operatorId_fkey`;

-- DropForeignKey
ALTER TABLE `keyworditem` DROP FOREIGN KEY `keyworditem_groupId_fkey`;

-- DropForeignKey
ALTER TABLE `lookbookproduct` DROP FOREIGN KEY `lookbookproduct_lookbookId_fkey`;

-- DropForeignKey
ALTER TABLE `lookbookproduct` DROP FOREIGN KEY `lookbookproduct_productId_fkey`;

-- DropForeignKey
ALTER TABLE `orderitem` DROP FOREIGN KEY `orderitem_orderId_fkey`;

-- DropForeignKey
ALTER TABLE `orderitem` DROP FOREIGN KEY `orderitem_productId_fkey`;

-- DropForeignKey
ALTER TABLE `orderitem` DROP FOREIGN KEY `orderitem_productSkuId_fkey`;

-- DropForeignKey
ALTER TABLE `orderlogisticssegment` DROP FOREIGN KEY `orderlogisticssegment_orderId_fkey`;

-- DropForeignKey
ALTER TABLE `orderoperationlog` DROP FOREIGN KEY `orderoperationlog_orderId_fkey`;

-- DropForeignKey
ALTER TABLE `orderrecord` DROP FOREIGN KEY `orderrecord_userId_fkey`;

-- DropForeignKey
ALTER TABLE `product` DROP FOREIGN KEY `product_categoryId_fkey`;

-- DropForeignKey
ALTER TABLE `productcategory` DROP FOREIGN KEY `productcategory_categoryId_fkey`;

-- DropForeignKey
ALTER TABLE `productcategory` DROP FOREIGN KEY `productcategory_productId_fkey`;

-- DropForeignKey
ALTER TABLE `productreview` DROP FOREIGN KEY `productreview_productId_fkey`;

-- DropForeignKey
ALTER TABLE `productreview` DROP FOREIGN KEY `productreview_userId_fkey`;

-- DropForeignKey
ALTER TABLE `productsku` DROP FOREIGN KEY `productsku_productId_fkey`;

-- DropForeignKey
ALTER TABLE `useraddress` DROP FOREIGN KEY `useraddress_userId_fkey`;

-- DropForeignKey
ALTER TABLE `wishlistitem` DROP FOREIGN KEY `wishlistitem_productId_fkey`;

-- DropForeignKey
ALTER TABLE `wishlistitem` DROP FOREIGN KEY `wishlistitem_userId_fkey`;

-- AlterTable
ALTER TABLE `keywordgroup` ADD COLUMN `sceneSlotKey` VARCHAR(160) NULL,
    ADD COLUMN `sceneSlotName` VARCHAR(120) NULL;

-- AlterTable
ALTER TABLE `sitesetting` MODIFY `settingType` ENUM('PROMO_BAR', 'HERO_BANNER', 'CATEGORY_BANNER', 'HOT_MATERIAL', 'LOOKBOOK', 'TRUST_BADGE', 'HOT_SEARCH', 'FOOTER_LINK', 'FLOAT_CONTACT', 'HOMEPAGE_POSTER', 'HOME_SECTION', 'STATIC_COPY', 'EMAIL_TEMPLATE', 'PAYMENT_METHOD', 'CURRENCY_SETTING', 'EXCHANGE_RATE', 'SHIPPING_TEMPLATE', 'TAX_RULE', 'ROLE_PERMISSION', 'HOME_BRAND_SECTION', 'HOME_REVIEW_SECTION', 'HOME_FEATURED_KEYWORDS', 'FRONTEND_SCENE_SLOT') NOT NULL;

-- CreateTable
CREATE TABLE `keywordgroupproduct` (
    `id` VARCHAR(36) NOT NULL,
    `keywordGroupId` VARCHAR(36) NOT NULL,
    `productId` VARCHAR(36) NOT NULL,
    `sortWeight` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `keywordgroupproduct_keywordGroupId_idx`(`keywordGroupId`),
    INDEX `keywordgroupproduct_productId_idx`(`productId`),
    INDEX `keywordgroupproduct_sortWeight_idx`(`sortWeight`),
    UNIQUE INDEX `keywordgroupproduct_keywordGroupId_productId_key`(`keywordGroupId`, `productId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `keywordgroup_sceneSlotKey_idx` ON `keywordgroup`(`sceneSlotKey`);

-- AddForeignKey
ALTER TABLE `categorynavconfig` ADD CONSTRAINT `categorynavconfig_categoryId_fkey` FOREIGN KEY (`categoryId`) REFERENCES `category`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

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
ALTER TABLE `customorder` ADD CONSTRAINT `customorder_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `sysuser`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `customorder` ADD CONSTRAINT `customorder_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `product`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `customorder` ADD CONSTRAINT `customorder_productSkuId_fkey` FOREIGN KEY (`productSkuId`) REFERENCES `productsku`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `productcategory` ADD CONSTRAINT `productcategory_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `product`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `productcategory` ADD CONSTRAINT `productcategory_categoryId_fkey` FOREIGN KEY (`categoryId`) REFERENCES `category`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `categoryfilterbinding` ADD CONSTRAINT `categoryfilterbinding_categoryId_fkey` FOREIGN KEY (`categoryId`) REFERENCES `category`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `categoryfilterbinding` ADD CONSTRAINT `categoryfilterbinding_filterSpecId_fkey` FOREIGN KEY (`filterSpecId`) REFERENCES `filterspec`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `categoryspectemplatebinding` ADD CONSTRAINT `categoryspectemplatebinding_categoryId_fkey` FOREIGN KEY (`categoryId`) REFERENCES `category`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `categoryspectemplatebinding` ADD CONSTRAINT `categoryspectemplatebinding_specTemplateId_fkey` FOREIGN KEY (`specTemplateId`) REFERENCES `spectemplate`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `customertaglink` ADD CONSTRAINT `customertaglink_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `sysuser`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `customertaglink` ADD CONSTRAINT `customertaglink_tagId_fkey` FOREIGN KEY (`tagId`) REFERENCES `customertag`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `customercommunication` ADD CONSTRAINT `customercommunication_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `sysuser`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `orderlogisticssegment` ADD CONSTRAINT `orderlogisticssegment_orderId_fkey` FOREIGN KEY (`orderId`) REFERENCES `orderrecord`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `orderoperationlog` ADD CONSTRAINT `orderoperationlog_orderId_fkey` FOREIGN KEY (`orderId`) REFERENCES `orderrecord`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `keyworditem` ADD CONSTRAINT `keyworditem_groupId_fkey` FOREIGN KEY (`groupId`) REFERENCES `keywordgroup`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `categorykeywordlink` ADD CONSTRAINT `categorykeywordlink_categoryId_fkey` FOREIGN KEY (`categoryId`) REFERENCES `category`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `categorykeywordlink` ADD CONSTRAINT `categorykeywordlink_keywordGroupId_fkey` FOREIGN KEY (`keywordGroupId`) REFERENCES `keywordgroup`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `keywordgroupproduct` ADD CONSTRAINT `keywordgroupproduct_keywordGroupId_fkey` FOREIGN KEY (`keywordGroupId`) REFERENCES `keywordgroup`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `keywordgroupproduct` ADD CONSTRAINT `keywordgroupproduct_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `product`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
SET FOREIGN_KEY_CHECKS=1;