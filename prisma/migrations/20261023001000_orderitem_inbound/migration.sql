-- Register how many units of each order line have arrived in the warehouse.
ALTER TABLE `orderitem`
  ADD COLUMN `inboundQty` INT NOT NULL DEFAULT 0,
  ADD COLUMN `inboundNote` VARCHAR(255) NULL,
  ADD COLUMN `inboundAt` DATETIME(3) NULL;
