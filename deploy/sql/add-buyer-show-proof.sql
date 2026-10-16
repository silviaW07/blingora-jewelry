-- 买家秀真实性证明：一张图 + 标题 + 说明，前台展示在照片墙上方
CREATE TABLE IF NOT EXISTS `buyer_show_proof` (
  `id` VARCHAR(36) NOT NULL,
  `image_url` VARCHAR(700) NOT NULL,
  `title` VARCHAR(160) NOT NULL,
  `body` TEXT NOT NULL,
  `sort_weight` INT NOT NULL DEFAULT 0,
  `is_enabled` TINYINT(1) NOT NULL DEFAULT 1,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  INDEX `buyer_show_proof_is_enabled_sort_weight_idx` (`is_enabled`, `sort_weight`)
);
