-- 物流渠道：计费模式 + 渠道系数（运费统一人民币，规则仍存于 countryFeesJson）
ALTER TABLE `shippingchannel`
  ADD COLUMN `billingMode` VARCHAR(30) NOT NULL DEFAULT 'EXPRESS_TIER',
  ADD COLUMN `channelCoefficient` DECIMAL(10, 4) NOT NULL DEFAULT 1.0000;

CREATE INDEX `shippingchannel_billingMode_idx` ON `shippingchannel`(`billingMode`);
