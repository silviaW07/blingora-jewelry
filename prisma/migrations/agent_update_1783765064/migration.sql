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
ALTER TABLE `orderrecord` DROP FOREIGN KEY `orderrecord_userId_fkey`;

-- DropForeignKey
ALTER TABLE `product` DROP FOREIGN KEY `product_categoryId_fkey`;

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
ALTER TABLE `product` ADD COLUMN `costPrice` DECIMAL(10, 2) NULL,
    ADD COLUMN `supplierName` VARCHAR(160) NULL,
    MODIFY `source` ENUM('MANUAL', 'IMPORT_1688', 'TABLE_IMPORT') NOT NULL;

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
SET FOREIGN_KEY_CHECKS=1;