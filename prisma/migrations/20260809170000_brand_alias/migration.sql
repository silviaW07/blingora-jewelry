-- 品牌别名归一表：采集/上架前把卖家暗语替换为标准品牌名，支持后台自定义 CRUD
CREATE TABLE `brand_alias` (
  `id` VARCHAR(36) NOT NULL,
  `alias` VARCHAR(120) NOT NULL,
  `standard_name` VARCHAR(120) NOT NULL,
  `sortWeight` INTEGER NOT NULL DEFAULT 0,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

  PRIMARY KEY (`id`),
  UNIQUE INDEX `brand_alias_alias_key`(`alias`),
  INDEX `brand_alias_sortWeight_idx`(`sortWeight`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 预置初始品牌映射（上线后立即可用；后续可在后台增删改）
INSERT INTO `brand_alias` (`id`, `alias`, `standard_name`, `sortWeight`) VALUES
  (UUID(), '路易威登', 'Louis Vuitton', 50),
  (UUID(), '蔻C', 'Coach', 40),
  (UUID(), '蔻家', 'Coach', 30),
  (UUID(), '古驰', 'Gucci', 20),
  (UUID(), 'LV', 'Louis Vuitton', 10);
