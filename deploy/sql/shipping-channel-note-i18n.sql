-- Shipping channel admin note + Spanish display fields.
-- Ignore duplicate-column errors if already applied.
ALTER TABLE `shippingchannel`
  MODIFY `name` VARCHAR(200) NOT NULL;

ALTER TABLE `shippingchannel`
  ADD COLUMN `nameEs` VARCHAR(200) NULL AFTER `name`;

ALTER TABLE `shippingchannel`
  ADD COLUMN `estimatedTimeEs` VARCHAR(120) NULL AFTER `estimatedTime`;

ALTER TABLE `shippingchannel`
  ADD COLUMN `adminNote` VARCHAR(500) NULL AFTER `estimatedTimeEs`;
