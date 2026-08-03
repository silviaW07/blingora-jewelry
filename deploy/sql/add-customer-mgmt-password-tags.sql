-- Customer management: plaintext password for admin assist + default tags
-- If column already exists, skip this ALTER (duplicate-column error is safe to ignore).
ALTER TABLE `sysuser`
  ADD COLUMN `passwordPlain` VARCHAR(255) NULL AFTER `password`;

INSERT INTO `customertag` (`id`, `name`, `code`, `color`, `description`, `createdAt`, `updatedAt`)
SELECT UUID(), '新注册客户', 'NEW_REGISTERED', '#22c55e', '新注册尚未深入跟进的客户', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM `customertag` WHERE `code` = 'NEW_REGISTERED');

INSERT INTO `customertag` (`id`, `name`, `code`, `color`, `description`, `createdAt`, `updatedAt`)
SELECT UUID(), '未转化客户', 'NOT_CONVERTED', '#94a3b8', '浏览/加购但未下单', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM `customertag` WHERE `code` = 'NOT_CONVERTED');

INSERT INTO `customertag` (`id`, `name`, `code`, `color`, `description`, `createdAt`, `updatedAt`)
SELECT UUID(), '首单客户', 'FIRST_ORDER', '#3b82f6', '已完成首单', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM `customertag` WHERE `code` = 'FIRST_ORDER');

INSERT INTO `customertag` (`id`, `name`, `code`, `color`, `description`, `createdAt`, `updatedAt`)
SELECT UUID(), '多单客户', 'MULTI_ORDER', '#8b5cf6', '多次下单的复购客户', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM `customertag` WHERE `code` = 'MULTI_ORDER');

INSERT INTO `customertag` (`id`, `name`, `code`, `color`, `description`, `createdAt`, `updatedAt`)
SELECT UUID(), '高危客户', 'HIGH_RISK', '#ef4444', '投诉/拒付等高风险客户', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM `customertag` WHERE `code` = 'HIGH_RISK');

INSERT INTO `customertag` (`id`, `name`, `code`, `color`, `description`, `createdAt`, `updatedAt`)
SELECT UUID(), '流失客户', 'CHURNED', '#f97316', '长期未回访的流失客户', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM `customertag` WHERE `code` = 'CHURNED');
