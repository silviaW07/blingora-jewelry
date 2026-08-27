-- CreateTable
CREATE TABLE `buyer_show_media` (
    `id` VARCHAR(36) NOT NULL,
    `media_type` ENUM('IMAGE', 'VIDEO') NOT NULL,
    `media_url` VARCHAR(700) NOT NULL,
    `title` VARCHAR(160) NULL,
    `sort_weight` INTEGER NOT NULL DEFAULT 0,
    `is_enabled` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `buyer_show_media_is_enabled_sort_weight_idx`(`is_enabled`, `sort_weight`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `buyer_show_comment` (
    `id` VARCHAR(36) NOT NULL,
    `author_name` VARCHAR(80) NOT NULL,
    `content` TEXT NOT NULL,
    `status` ENUM('PENDING', 'APPROVED', 'REJECTED') NOT NULL DEFAULT 'PENDING',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `reviewed_at` DATETIME(3) NULL,

    INDEX `buyer_show_comment_status_createdAt_idx`(`status`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
