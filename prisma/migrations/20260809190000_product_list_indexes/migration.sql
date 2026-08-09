-- 前台商品列表加速：为快速路径的 WHERE + ORDER BY 增加复合索引
-- 场景：WHERE status='ACTIVE' [AND categoryId/brandCategoryId] ORDER BY createdAt DESC / sortWeight DESC
CREATE INDEX `product_status_createdAt_idx` ON `product`(`status`, `createdAt`);
CREATE INDEX `product_status_sortWeight_idx` ON `product`(`status`, `sortWeight`);
CREATE INDEX `product_categoryId_createdAt_idx` ON `product`(`categoryId`, `createdAt`);
CREATE INDEX `product_brandCategoryId_createdAt_idx` ON `product`(`brandCategoryId`, `createdAt`);
