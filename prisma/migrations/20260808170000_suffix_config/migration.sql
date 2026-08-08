-- 商品标题后缀预设表：支持“批量加后缀”下拉框自定义 CRUD
CREATE TABLE `suffix_config` (
  `id` VARCHAR(36) NOT NULL,
  `suffix_name` VARCHAR(120) NOT NULL,
  `sortWeight` INTEGER NOT NULL DEFAULT 0,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

  PRIMARY KEY (`id`),
  UNIQUE INDEX `suffix_config_suffix_name_key`(`suffix_name`),
  INDEX `suffix_config_sortWeight_idx`(`sortWeight`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 预置原有下拉框的 5 个固定后缀（保持上线后立即可用）
INSERT INTO `suffix_config` (`id`, `suffix_name`, `sortWeight`) VALUES
  (UUID(), '[13USD]', 50),
  (UUID(), '[3USD]', 40),
  (UUID(), '[清仓]', 30),
  (UUID(), '[特价]', 20),
  (UUID(), '[新品]', 10);
