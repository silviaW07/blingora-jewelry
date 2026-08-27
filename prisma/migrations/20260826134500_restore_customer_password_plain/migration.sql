-- Restore plaintext customer password for admin customer-support display.
-- Ignore "Duplicate column name" if this already exists on the live DB.
ALTER TABLE `sysuser`
  ADD COLUMN `passwordPlain` VARCHAR(255) NULL AFTER `password`;
