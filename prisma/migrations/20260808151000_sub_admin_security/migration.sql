-- Add the limited backend operator role while preserving existing role values.
ALTER TABLE `sysuser`
  MODIFY `role` ENUM('CUSTOMER', 'ADMIN', 'SUB_ADMIN') NOT NULL;

-- Plaintext passwords must never be retained or returned by admin APIs.
UPDATE `sysuser` SET `passwordPlain` = NULL WHERE `passwordPlain` IS NOT NULL;
ALTER TABLE `sysuser` DROP COLUMN `passwordPlain`;
