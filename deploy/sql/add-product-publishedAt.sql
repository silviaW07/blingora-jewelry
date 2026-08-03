-- New / 每月上新：为 product 增加 publishedAt，并回填已上架商品
-- 在服务器执行（MySQL）：
--   mysql -uroot -p'Admin@2026' PROJ_fcb9e6ee_snap_20260726_092922_893 < deploy/sql/add-product-publishedAt.sql
-- 然后：pm2 restart rpc

SET @db := DATABASE();

-- 若列已存在会报错，可忽略后继续后面的 UPDATE
ALTER TABLE `product` ADD COLUMN `publishedAt` DATETIME(3) NULL;

-- 索引（已存在则跳过）
SET @idx_exists := (
  SELECT COUNT(1) FROM information_schema.statistics
  WHERE table_schema = @db AND table_name = 'product' AND index_name = 'product_publishedAt_idx'
);
SET @sql := IF(@idx_exists = 0,
  'CREATE INDEX `product_publishedAt_idx` ON `product` (`publishedAt`)',
  'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 回填：已上架且无 publishedAt → 用 createdAt 归入对应月份
UPDATE `product`
SET `publishedAt` = `createdAt`,
    `isNewArrival` = 1
WHERE `status` = 'ACTIVE'
  AND (`publishedAt` IS NULL);
