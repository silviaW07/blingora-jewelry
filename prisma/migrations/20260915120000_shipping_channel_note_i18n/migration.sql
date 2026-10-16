-- Admin-only note + Spanish display fields for shipping channels.
ALTER TABLE `shippingchannel`
  MODIFY `name` VARCHAR(200) NOT NULL,
  ADD COLUMN `nameEs` VARCHAR(200) NULL AFTER `name`,
  ADD COLUMN `estimatedTimeEs` VARCHAR(120) NULL AFTER `estimatedTime`,
  ADD COLUMN `adminNote` VARCHAR(500) NULL AFTER `estimatedTimeEs`;
