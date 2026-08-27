-- 客户类型标记时间：用于仪表盘「总注册数」详情里的本周/本月/本年首单、复购统计
-- 若列已存在会报错，可忽略

ALTER TABLE `sysuser` ADD COLUMN `customerTypeUpdatedAt` DATETIME(3) NULL;
