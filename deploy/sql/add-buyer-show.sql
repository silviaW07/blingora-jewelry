-- 买家秀媒体 + 留言（含可选评分）
CREATE TABLE IF NOT EXISTS `buyer_show_media` (
  `id` VARCHAR(36) NOT NULL,
  `media_type` ENUM('IMAGE','VIDEO') NOT NULL,
  `media_url` VARCHAR(700) NOT NULL,
  `title` VARCHAR(160) NULL,
  `sort_weight` INT NOT NULL DEFAULT 0,
  `is_enabled` TINYINT(1) NOT NULL DEFAULT 1,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  INDEX `buyer_show_media_is_enabled_sort_weight_idx` (`is_enabled`, `sort_weight`)
);

CREATE TABLE IF NOT EXISTS `buyer_show_comment` (
  `id` VARCHAR(36) NOT NULL,
  `author_name` VARCHAR(80) NOT NULL,
  `content` TEXT NOT NULL,
  `rating` INT NULL,
  `status` ENUM('PENDING','APPROVED','REJECTED') NOT NULL DEFAULT 'PENDING',
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `reviewed_at` DATETIME(3) NULL,
  PRIMARY KEY (`id`),
  INDEX `buyer_show_comment_status_createdAt_idx` (`status`, `createdAt`)
);

-- 已有表时补评分列（已存在则忽略报错）
ALTER TABLE `buyer_show_comment` ADD COLUMN `rating` INT NULL;
