SET FOREIGN_KEY_CHECKS=0;
-- AlterTable
ALTER TABLE `importtask` ADD COLUMN `finishedAt` DATETIME(3) NULL,
    ADD COLUMN `lastRateLimitedAt` DATETIME(3) NULL,
    ADD COLUMN `lastScheduledAt` DATETIME(3) NULL,
    ADD COLUMN `queueConcurrency` INTEGER NOT NULL DEFAULT 1,
    ADD COLUMN `rateLimitMaxDelaySec` INTEGER NOT NULL DEFAULT 5,
    ADD COLUMN `rateLimitMinDelaySec` INTEGER NOT NULL DEFAULT 2,
    ADD COLUMN `startedAt` DATETIME(3) NULL,
    MODIFY `status` ENUM('PENDING', 'RUNNING', 'COMPLETED', 'FAILED', 'QUEUED', 'RATE_LIMITED', 'PARTIAL_SUCCESS', 'RETRY_PENDING') NOT NULL DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE `importtaskitem` ADD COLUMN `availableStock` INTEGER NULL,
    ADD COLUMN `cnyPriceMax` DECIMAL(10, 2) NULL,
    ADD COLUMN `cnyPriceMin` DECIMAL(10, 2) NULL,
    ADD COLUMN `coefficient` DECIMAL(8, 2) NULL,
    ADD COLUMN `costPrice` DECIMAL(10, 2) NULL,
    ADD COLUMN `fetchFinishedAt` DATETIME(3) NULL,
    ADD COLUMN `fetchStartedAt` DATETIME(3) NULL,
    ADD COLUMN `fetchStatus` ENUM('PENDING', 'RUNNING', 'COMPLETED', 'FAILED', 'QUEUED', 'RATE_LIMITED', 'PARTIAL_SUCCESS', 'RETRY_PENDING') NOT NULL DEFAULT 'PENDING',
    ADD COLUMN `goodsStatus` ENUM('DRAFT', 'ACTIVE', 'INACTIVE', 'OUT_OF_STOCK', 'PREORDER') NULL,
    ADD COLUMN `isPublished` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `mainImageUrl` VARCHAR(700) NULL,
    ADD COLUMN `minimumOrderQuantity` INTEGER NULL,
    ADD COLUMN `productDetail` LONGTEXT NULL,
    ADD COLUMN `publishStartedAt` DATETIME(3) NULL,
    ADD COLUMN `publishStatus` ENUM('PENDING', 'RUNNING', 'COMPLETED', 'FAILED', 'QUEUED', 'RATE_LIMITED', 'PARTIAL_SUCCESS', 'RETRY_PENDING') NOT NULL DEFAULT 'PENDING',
    ADD COLUMN `publishedAt` DATETIME(3) NULL,
    ADD COLUMN `retryCount` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `skuSummaryText` LONGTEXT NULL,
    ADD COLUMN `sourceCategoryName` VARCHAR(150) NULL,
    ADD COLUMN `supplierName` VARCHAR(150) NULL,
    ADD COLUMN `targetCategoryId` VARCHAR(36) NULL,
    ADD COLUMN `usdPriceMax` DECIMAL(10, 2) NULL,
    ADD COLUMN `usdPriceMin` DECIMAL(10, 2) NULL,
    ADD COLUMN `weightGrams` INTEGER NULL;

-- CreateIndex
CREATE INDEX `importtask_status_idx` ON `importtask`(`status`);

-- CreateIndex
CREATE INDEX `importtaskitem_fetchStatus_idx` ON `importtaskitem`(`fetchStatus`);

-- CreateIndex
CREATE INDEX `importtaskitem_publishStatus_idx` ON `importtaskitem`(`publishStatus`);

-- CreateIndex
CREATE INDEX `importtaskitem_isPublished_idx` ON `importtaskitem`(`isPublished`);

-- CreateIndex
CREATE INDEX `importtaskitem_targetCategoryId_idx` ON `importtaskitem`(`targetCategoryId`);
SET FOREIGN_KEY_CHECKS=1;