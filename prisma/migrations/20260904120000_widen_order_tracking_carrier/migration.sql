-- Channel names can exceed the old 60-char trackingCarrier column (P2000 on checkout).
ALTER TABLE `orderrecord` MODIFY `trackingCarrier` VARCHAR(255) NULL;
