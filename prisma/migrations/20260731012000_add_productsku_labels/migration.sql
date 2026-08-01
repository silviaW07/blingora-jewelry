ALTER TABLE `productsku`
  ADD COLUMN `minOrderQty` INTEGER NULL,
  ADD COLUMN `materialLabel` VARCHAR(60) NULL,
  ADD COLUMN `sizeLabel` VARCHAR(60) NULL;
