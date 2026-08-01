-- Database snapshot: PROJ_fcb9e6ee_snap_20260726_092922_893
-- Created at: 2026-07-26 10:14:53.840252
-- Include structure: True
-- Include data: True

SET FOREIGN_KEY_CHECKS = 0;

-- Table structure for `_prisma_migrations`
DROP TABLE IF EXISTS `_prisma_migrations`;
CREATE TABLE `_prisma_migrations` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `checksum` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `finished_at` datetime(3) DEFAULT NULL,
  `migration_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `logs` text COLLATE utf8mb4_unicode_ci,
  `rolled_back_at` datetime(3) DEFAULT NULL,
  `started_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `applied_steps_count` int unsigned NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Data for table `_prisma_migrations`
INSERT INTO `_prisma_migrations` (`id`, `checksum`, `finished_at`, `migration_name`, `logs`, `rolled_back_at`, `started_at`, `applied_steps_count`) VALUES
('0677cc0a-1de3-4f46-91b4-b788514f3584', '55c483cd9ee4a0504948d53cd0599d339037af6764cd56478b05f82e5d33d8ff', '2026-07-12 08:23:25', 'agent_update_1783844601', '', NULL, '2026-07-12 08:23:25', 0),
('4e4e2079-dd29-44b2-9d07-c5457722072e', 'cb898d80064a8a3ef29b599b0492d6c581adf1cea0121e2786232d9a638d243d', '2026-07-11 11:20:28', 'agent_update_1783768824', '', NULL, '2026-07-11 11:20:28', 0),
('6af7576f-e1de-4090-b756-cd0a7740e459', 'd7e40bcd61e5265187f5082e408ea6a11fe47a4c8cbe36360ddb9ed181870b26', '2026-07-12 13:49:34', 'agent_update_1783864170', '', NULL, '2026-07-12 13:49:34', 0),
('7909c44b-df76-431c-9d1e-a1e63579d6ed', 'b7a3970493d30734c1cde18cd61bb55295dfce5fda6e25133d2bc7f9072c32b8', '2026-07-12 14:20:33', 'agent_update_1783866030', '', NULL, '2026-07-12 14:20:33', 0),
('7c678bfd-895c-4227-b1bf-947f1fbc627f', '00cb9086205b4a84618785f70cd52a326241f26df7c0e2cf7329cbe10c091cbd', '2026-07-12 08:46:04', 'agent_update_1783845960', '', NULL, '2026-07-12 08:46:04', 0),
('83424007-9a7e-4b4d-a61d-41b6a59c772b', '356c296e920d1e9c1c296c2f9aeb7ec5c52343e4e7c5146592f4d8afb0abaa1c', '2026-07-11 08:19:39', '20260711081937_init', NULL, NULL, '2026-07-11 08:19:39', 1),
('aa7eb089-b2d4-412c-bf06-13af2611b41d', 'dab13205cb8b811d86c73bf7cb356ba3e4c88c2a115915573857817890c74551', '2026-07-11 09:58:14', 'agent_update_1783763891', '', NULL, '2026-07-11 09:58:14', 0),
('b0337f62-eaf1-416b-bac9-f6df38f7ce82', '340e6b6fe3bc03a445346ce37c9c9a463ca7980e425e6e6c98b2f7753fe0a74e', '2026-07-13 10:02:48', 'agent_update_1783936964', '', NULL, '2026-07-13 10:02:48', 0),
('b111d68e-3b0f-4b88-877e-7eeab380eb19', 'd7cc5a11a886e473e994646b4010d85e9c4a36309388811aba8d876a8fafbfd3', '2026-07-13 09:28:55', 'agent_update_1783934932', '', NULL, '2026-07-13 09:28:55', 0),
('c3092653-084e-4fdd-b45f-c364c80ea778', 'a0620064f7996c91bffb3166fc213ef7ceedc9857f08563bbc277b386dd48f2b', '2026-07-11 12:31:24', 'agent_update_1783773080', '', NULL, '2026-07-11 12:31:24', 0),
('cde74ffd-456a-469a-b8c9-9c48f9dea670', '72fe3b53e047c37cad860aab2571e00710898dabff6cef1ab96891662386bebe', '2026-07-11 09:21:33', 'agent_update_1783761689', '', NULL, '2026-07-11 09:21:33', 0),
('d0ea6c5c-18ec-4007-8350-b83ab7c6efe1', 'dff17928a93ad406b3794e76f874e9cd063b2bc1a43c9b75ae7df8bd08853d59', '2026-07-11 10:17:47', 'agent_update_1783765064', '', NULL, '2026-07-11 10:17:47', 0),
('db0fd091-2d62-4f59-880a-d6b24a746106', '387ce83702f159591b41809f7a868ffd75d8c418067e7edb00e96ad94e0c8440', '2026-07-13 13:34:49', 'agent_update_1783949687076553935_6ce39e8f', '', NULL, '2026-07-13 13:34:49', 0),
('db28933b-2d06-4e45-9cce-9b319939384d', 'eec1625ae9862ad2d4717431cf236ac2c2e3e43ab4e2055e72cff22ec719a7ec', '2026-07-11 11:49:34', 'agent_update_1783770571', '', NULL, '2026-07-11 11:49:34', 0),
('e0671634-c984-465f-a0ff-d31d589155f3', '8942379eee1ab5803ef5ba7f5e45a128e1ce10ce52082b89c19d6fa0c4d10f37', '2026-07-12 12:00:18', 'agent_update_1783857615', '', NULL, '2026-07-12 12:00:18', 0),
('e29c1e0f-0f8a-4afe-b538-2a9e760072f0', '76d74b97df6707ce030a85a2577a4d174595fc50c2f826d9363e1ac06e0e414a', '2026-07-24 08:24:48', 'agent_update_1784881485920509906_f32e1da0', '', NULL, '2026-07-24 08:24:48', 0),
('e7bc2c81-bbd0-45fc-a389-1f320d138d5f', '394989a98fb4ad2506f52d6f72bda89a4503c4fcb3c2d9f959b65e15d2db1674', '2026-07-11 10:55:29', 'agent_update_1783767326', '', NULL, '2026-07-11 10:55:29', 0),
('eef0d9dd-e83e-4284-95ee-eb3a73fabb7d', '0d2ff3d62be15d7952543bc038dcefbb8f12d0040925c48dc30f9b8189c5404e', '2026-07-11 10:33:20', 'agent_update_1783765996', '', NULL, '2026-07-11 10:33:20', 0),
('fc16fa67-7a51-46cc-b44e-0f70f191ea97', '2087ba463ff08d3166fe33b87a2285190f99f028fcd6fa313f649cab06bc7004', '2026-07-23 14:43:18', 'agent_update_1784817795822285344_ce5beac2', '', NULL, '2026-07-23 14:43:18', 0);

-- Table structure for `cart`
DROP TABLE IF EXISTS `cart`;
CREATE TABLE `cart` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `accountId` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `cart_accountId_key` (`accountId`),
  CONSTRAINT `cart_accountId_fkey` FOREIGN KEY (`accountId`) REFERENCES `sysuser` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Data for table `cart`
INSERT INTO `cart` (`id`, `accountId`, `createdAt`, `updatedAt`) VALUES
('06cf0b71-b5a0-4753-8aba-da4bfcacce98', '07969d0d-c2c3-494f-a4f1-5dab7830923a', '2026-07-24 09:01:29', '2026-07-24 09:01:29'),
('17cce84d-2119-4ce5-a8b3-453710cda3a3', '1feaf42b-cece-42cf-b920-95473821eb02', '2026-06-27 08:25:18', '2026-07-10 08:25:18'),
('9a3b8fce-f117-4d5f-918b-276d61feabe6', '9e38b788-9a55-4db1-8dad-debe5c87586a', '2026-06-01 08:25:18', '2026-07-06 08:25:18'),
('9f20da01-16b7-4756-ba39-ff56ef7872ab', '955ba548-6a81-48aa-a2df-1634f6cc12eb', '2026-07-07 08:25:18', '2026-07-11 08:25:18'),
('acbc7ec6-d555-49c3-818b-e0bd83c648b0', '36693b1e-2eb2-4bc1-97fb-c879f1185b8a', '2026-07-02 08:25:18', '2026-07-09 08:25:18');

-- Table structure for `cartitem`
DROP TABLE IF EXISTS `cartitem`;
CREATE TABLE `cartitem` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `cartId` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `productId` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `productSkuId` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `quantity` int NOT NULL DEFAULT '1',
  `status` enum('VALID','INVALID') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'VALID',
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `engravingFont` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `engravingPreviewUrl` varchar(700) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `engravingText` varchar(120) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `giftWrapFee` decimal(10,2) DEFAULT NULL,
  `giftWrapSelected` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `cartitem_cartId_productSkuId_engravingText_engravingFont_key` (`cartId`,`productSkuId`,`engravingText`,`engravingFont`),
  KEY `cartitem_cartId_idx` (`cartId`),
  KEY `cartitem_productId_idx` (`productId`),
  KEY `cartitem_productSkuId_idx` (`productSkuId`),
  CONSTRAINT `cartitem_cartId_fkey` FOREIGN KEY (`cartId`) REFERENCES `cart` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `cartitem_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `product` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `cartitem_productSkuId_fkey` FOREIGN KEY (`productSkuId`) REFERENCES `productsku` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Data for table `cartitem`
INSERT INTO `cartitem` (`id`, `cartId`, `productId`, `productSkuId`, `quantity`, `status`, `createdAt`, `updatedAt`, `engravingFont`, `engravingPreviewUrl`, `engravingText`, `giftWrapFee`, `giftWrapSelected`) VALUES
('069999b7-7995-4145-b949-7a692a696dec', '9a3b8fce-f117-4d5f-918b-276d61feabe6', '2f008e64-60d0-4c5a-8f7a-b6d93c9a2d87', 'd151f181-1fd5-4280-a8ab-ddcebe777da9', 2, 'VALID', '2026-06-21 08:25:18', '2026-07-06 08:25:18', NULL, NULL, NULL, NULL, 0),
('13d3dfa1-d693-4759-81e9-a5a07fddff80', '17cce84d-2119-4ce5-a8b3-453710cda3a3', 'a2ea7f58-cea5-4df2-8d95-68c6dc272860', '081d1cc7-b119-4e4a-8a2c-d9245ef13465', 1, 'VALID', '2026-07-01 08:25:18', '2026-07-11 08:37:39', NULL, NULL, NULL, NULL, 0),
('3f894708-ade0-4b63-9f62-f784044941c1', '9a3b8fce-f117-4d5f-918b-276d61feabe6', '4dd45a81-c013-480b-b856-a4e8874a1ebe', '21090e1e-4ba8-41e4-a708-c759a2766490', 1, 'VALID', '2026-06-06 08:25:18', '2026-07-11 12:04:46', NULL, NULL, NULL, NULL, 0),
('51373390-7f0e-47aa-88af-3bf76a9af9e3', 'acbc7ec6-d555-49c3-818b-e0bd83c648b0', '855ef6c4-b24a-4625-a2b5-721372d96b04', 'de02208e-8ac5-401e-933e-bacc282b26e9', 1, 'VALID', '2026-07-03 08:25:18', '2026-07-11 12:04:46', NULL, NULL, NULL, NULL, 0),
('582c0b49-a4c9-4ce4-bd25-c98ec1f1eac2', '17cce84d-2119-4ce5-a8b3-453710cda3a3', 'b895b311-5028-4f74-b28d-75fd80b94c0c', '64afb701-0cec-4f2b-a72a-d373032d7060', 2, 'VALID', '2026-07-06 08:25:18', '2026-07-10 08:25:18', NULL, NULL, NULL, NULL, 0),
('6f2d34a2-7b64-4169-a668-b14c9efb66bb', 'acbc7ec6-d555-49c3-818b-e0bd83c648b0', 'f4656fa0-52b2-46a1-863c-bfa991caec27', '90fdf33e-9470-44f5-a949-f9abe52c5a84', 3, 'VALID', '2026-07-09 08:25:18', '2026-07-11 08:25:18', NULL, NULL, NULL, NULL, 0),
('9e7dbc63-7f7b-4268-96d4-ab12329fcead', '9f20da01-16b7-4756-ba39-ff56ef7872ab', 'a2deb1bc-4f97-4284-b51b-236e7e6a52f1', '3f288d34-ec5d-403d-ae65-7ac7783bf5f2', 2, 'VALID', '2026-07-07 08:25:18', '2026-07-10 08:25:18', NULL, NULL, NULL, NULL, 0),
('f46ee9d2-ab97-4d73-8728-3505ed669ac3', '17cce84d-2119-4ce5-a8b3-453710cda3a3', '13d75331-7ab2-45dd-a585-6f9718cd4823', '6d5991dd-41bc-4fc8-949b-57d60607a0e1', 1, 'VALID', '2026-07-14 11:53:39', '2026-07-14 11:53:39', NULL, NULL, NULL, NULL, 0);

-- Table structure for `category`
DROP TABLE IF EXISTS `category`;
CREATE TABLE `category` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(120) COLLATE utf8mb4_unicode_ci NOT NULL,
  `slug` varchar(120) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `imageUrl` varchar(700) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `sortWeight` int NOT NULL DEFAULT '0',
  `status` enum('ACTIVE','INACTIVE') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'ACTIVE',
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `bannerImageUrl` varchar(700) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `level` int NOT NULL DEFAULT '1',
  `parentId` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `iconUrl` varchar(700) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `path` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `seoDescription` text COLLATE utf8mb4_unicode_ci,
  `seoKeywords` varchar(300) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `seoTitle` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `seoTranslationsJson` json DEFAULT NULL,
  `translationsJson` json DEFAULT NULL,
  `brandCode` varchar(80) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `brandKeywordsJson` json DEFAULT NULL,
  `homepageConfigJson` json DEFAULT NULL,
  `isBrandCategory` tinyint(1) NOT NULL DEFAULT '0',
  `categoryDisplayConfigJson` json DEFAULT NULL,
  `priceCoefficient` decimal(6,2) DEFAULT NULL,
  `keywordMappingJson` json DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `category_parentId_idx` (`parentId`),
  KEY `category_level_idx` (`level`),
  KEY `category_status_idx` (`status`),
  KEY `category_isBrandCategory_idx` (`isBrandCategory`),
  KEY `category_brandCode_idx` (`brandCode`),
  CONSTRAINT `category_parentId_fkey` FOREIGN KEY (`parentId`) REFERENCES `category` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Data for table `category`
INSERT INTO `category` (`id`, `name`, `slug`, `imageUrl`, `description`, `sortWeight`, `status`, `createdAt`, `updatedAt`, `bannerImageUrl`, `level`, `parentId`, `iconUrl`, `path`, `seoDescription`, `seoKeywords`, `seoTitle`, `seoTranslationsJson`, `translationsJson`, `brandCode`, `brandKeywordsJson`, `homepageConfigJson`, `isBrandCategory`, `categoryDisplayConfigJson`, `priceCoefficient`, `keywordMappingJson`) VALUES
('0dff36ea-815f-4f76-9485-ba726e4205c4', '防晒霜', NULL, NULL, NULL, 1, 'ACTIVE', '2026-07-14 10:42:00', '2026-07-14 10:42:00', NULL, 2, '42f3c7d7-a703-45e2-bf52-82e3080c5bb2', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '[]', NULL, 0, '{"showBrandFilter": false, "allowChildrenCollapse": true, "showChildrenByDefault": false, "brandFilterCollapsedRows": 2}', '1.00', NULL),
('1343244c-8af4-4d29-8210-88beb57849f3', '鞋子', NULL, NULL, NULL, 1, 'ACTIVE', '2026-07-14 10:38:08', '2026-07-24 08:04:46', NULL, 1, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '[]', NULL, 0, '{"showBrandFilter": false, "allowChildrenCollapse": true, "showChildrenByDefault": false, "brandFilterCollapsedRows": 2}', '1.00', NULL),
('146d5f31-fc74-40d4-81fd-9cf9b85d9ffe', '防晒服', NULL, 'https://static.nike.com.cn/a/images/t_PDP_1728_v1/f_auto,q_auto:eco,u_9ddf04c7-2a9a-4d76-add1-d15af8f0263d,c_scale,fl_relative,w_1.0,h_1.0,fl_layer_apply/b9de84e0-b4ac-4bab-b71f-ace8087ea692/AS+M+ACG+UV+AIREEZ+BTN+LS+GFX.png', '防晒服', 2, 'ACTIVE', '2026-07-14 10:42:00', '2026-07-14 11:24:47', 'https://static.nike.com.cn/a/images/t_PDP_1728_v1/f_auto,q_auto:eco,u_9ddf04c7-2a9a-4d76-add1-d15af8f0263d,c_scale,fl_relative,w_1.0,h_1.0,fl_layer_apply/936b6a9d-7036-4aa5-8115-ca999404fa38/AS+M+ACG+UV+AIREEZ+BTN+LS+GFX.png', 2, '42f3c7d7-a703-45e2-bf52-82e3080c5bb2', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '[{"weight": 2, "keyword": "卫衣"}, {"weight": 1, "keyword": "连帽"}]', NULL, 0, '{"showBrandFilter": true, "allowChildrenCollapse": true, "showChildrenByDefault": true, "brandFilterCollapsedRows": 2}', '1.00', NULL),
('1ff00246-26a7-4a5e-a1d8-d1b999fcf57a', 'jewelry', 'electronics', 'https://project.autocoder.cc/background/zaki_dev/generated/9c83563212e94759b715547d41c534c7.png', '探索最新科技潮流，提供高品质的智能手机、电脑配件及各类创新电子数码产品，满足日常所需。', 100, 'ACTIVE', '2026-05-27 08:25:17', '2026-07-14 11:54:09', NULL, 1, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '[]', NULL, 0, '{"showBrandFilter": true, "allowChildrenCollapse": true, "showChildrenByDefault": false, "brandFilterCollapsedRows": 3}', '1.00', NULL),
('2b039355-3f36-4a67-bc52-c068cc0446dc', '运动鞋', NULL, 'https://static.nike.com.cn/a/images/t_PDP_1728_v1/f_auto,q_auto:eco,u_9ddf04c7-2a9a-4d76-add1-d15af8f0263d,c_scale,fl_relative,w_1.0,h_1.0,fl_layer_apply/cfbed0a0-8076-47a9-a90e-183d0552f7d6/AIR+ZOOM+PEGASUS+42.png', '鞋子 展示鞋子侧面和正面图', 3, 'ACTIVE', '2026-07-14 10:42:00', '2026-07-14 11:08:13', 'https://static.nike.com.cn/a/images/t_PDP_1728_v1/f_auto,q_auto:eco,u_9ddf04c7-2a9a-4d76-add1-d15af8f0263d,c_scale,fl_relative,w_1.0,h_1.0,fl_layer_apply/cfbed0a0-8076-47a9-a90e-183d0552f7d6/AIR+ZOOM+PEGASUS+42.png', 2, '42f3c7d7-a703-45e2-bf52-82e3080c5bb2', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '[{"weight": 1, "keyword": "DIOR"}]', NULL, 0, '{"showBrandFilter": true, "allowChildrenCollapse": true, "showChildrenByDefault": true, "brandFilterCollapsedRows": 2}', '1.00', NULL),
('322d5508-97d5-4c94-874f-098c1bcdee6c', '衣服', NULL, 'https://static.nike.com.cn/a/images/t_PDP_1728_v1/f_auto,q_auto:eco,u_9ddf04c7-2a9a-4d76-add1-d15af8f0263d,c_scale,fl_relative,w_1.0,h_1.0,fl_layer_apply/56c2facd-847d-4ced-be56-f90c9be3b519/AS+U+NSW+TEE+LSE+BBALL+DUNK.png', NULL, 3, 'ACTIVE', '2026-07-14 10:38:08', '2026-07-14 11:07:49', 'https://static.nike.com.cn/a/images/t_PDP_1728_v1/f_auto,q_auto:eco,u_9ddf04c7-2a9a-4d76-add1-d15af8f0263d,c_scale,fl_relative,w_1.0,h_1.0,fl_layer_apply/555a0dfb-5230-4d9c-9755-ad5cb73c6cbb/AS+M+NK+TEE+LSE+SP+PURPOSES.png', 2, '502e355a-0794-46ac-85d4-56616929ebb0', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '[]', NULL, 0, '{"showBrandFilter": true, "allowChildrenCollapse": true, "showChildrenByDefault": true, "brandFilterCollapsedRows": 2}', '1.00', NULL),
('38cfb97a-1a89-4352-abe9-090903c48ea8', '手镯', NULL, NULL, NULL, 1, 'ACTIVE', '2026-07-14 10:36:37', '2026-07-14 10:36:37', NULL, 2, '1ff00246-26a7-4a5e-a1d8-d1b999fcf57a', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '[]', NULL, 0, '{"showBrandFilter": false, "allowChildrenCollapse": true, "showChildrenByDefault": false, "brandFilterCollapsedRows": 2}', '1.00', NULL),
('42f3c7d7-a703-45e2-bf52-82e3080c5bb2', '户外运动', 'sports', 'https://www.autocoder.cc/background/zaki_prod/generated/7b20ed0f25994a0aa9bb54b551fb5ac1.png', '专为热爱自然与挑战的您准备，精选各类专业运动装备与户外露营用品，助您尽情释放活力。', 60, 'ACTIVE', '2026-04-12 08:25:17', '2026-07-14 11:27:52', NULL, 1, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '[]', NULL, 0, '{"showBrandFilter": false, "allowChildrenCollapse": true, "showChildrenByDefault": false, "brandFilterCollapsedRows": 3}', '1.00', NULL),
('502e355a-0794-46ac-85d4-56616929ebb0', 'Kids', 'fashion', 'https://project.autocoder.cc/background/zaki_pre/generated/5a43017a9e4a436d91aa64dc649f8c8f.png', '精选全球流行趋势，涵盖男女潮流服饰、鞋靴箱包，为您打造个性化穿搭体验，展现独特魅力。', 90, 'ACTIVE', '2026-06-26 08:25:17', '2026-07-14 11:27:36', NULL, 1, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '[]', NULL, 0, '{"showBrandFilter": false, "allowChildrenCollapse": true, "showChildrenByDefault": false, "brandFilterCollapsedRows": 3}', '1.00', NULL),
('6eb7ccf8-52b9-4c46-a669-8ed78a2d6407', '家居生活', 'home', 'https://project.autocoder.cc/background/zaki_test/generated/7a061b3b3426494da79af8ef12f16349.png', '打造温馨舒适的居家环境，汇集精美家具、实用收纳与创意家饰，提升生活品质与幸福感。', 80, 'ACTIVE', '2026-05-12 08:25:17', '2026-07-14 11:27:40', NULL, 1, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '[]', NULL, 0, '{"showBrandFilter": false, "allowChildrenCollapse": true, "showChildrenByDefault": false, "brandFilterCollapsedRows": 3}', '1.00', NULL),
('7957b478-b774-4804-9c05-db97ee5a4e07', '桌子', NULL, NULL, NULL, 2, 'ACTIVE', '2026-07-14 10:38:51', '2026-07-14 10:38:51', NULL, 2, '6eb7ccf8-52b9-4c46-a669-8ed78a2d6407', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '[]', NULL, 0, '{"showBrandFilter": false, "allowChildrenCollapse": true, "showChildrenByDefault": false, "brandFilterCollapsedRows": 2}', '1.00', NULL),
('7ff3acaa-6cb0-4f16-9b35-3cd869a31aef', '戒指', NULL, NULL, NULL, 2, 'ACTIVE', '2026-07-14 10:36:37', '2026-07-14 10:36:37', NULL, 2, '1ff00246-26a7-4a5e-a1d8-d1b999fcf57a', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '[]', NULL, 0, '{"showBrandFilter": false, "allowChildrenCollapse": true, "showChildrenByDefault": false, "brandFilterCollapsedRows": 2}', '1.00', NULL),
('81cd3d26-76bd-447f-8d56-333f97151868', '椅子', NULL, NULL, NULL, 1, 'ACTIVE', '2026-07-14 10:38:51', '2026-07-14 10:38:51', NULL, 2, '6eb7ccf8-52b9-4c46-a669-8ed78a2d6407', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '[]', NULL, 0, '{"showBrandFilter": false, "allowChildrenCollapse": true, "showChildrenByDefault": false, "brandFilterCollapsedRows": 2}', '1.00', NULL),
('87f60d56-b87c-46d7-bd0a-3457996fcdfd', '项链', NULL, NULL, NULL, 3, 'ACTIVE', '2026-07-14 10:36:37', '2026-07-14 10:36:37', NULL, 2, '1ff00246-26a7-4a5e-a1d8-d1b999fcf57a', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '[]', NULL, 0, '{"showBrandFilter": false, "allowChildrenCollapse": true, "showChildrenByDefault": false, "brandFilterCollapsedRows": 2}', '1.00', NULL),
('966dfa88-913a-4f59-ae32-b137b8a2cce7', '美妆个护', 'beauty', 'https://project.autocoder.cc/background/zaki_test/generated/a84754609d9045b6994483aa942c203f.png', '严选国际知名品牌，提供护肤、彩妆及个人护理佳品，让您焕发自然光彩，保持健康美丽状态。', 70, 'ACTIVE', '2026-06-21 08:25:17', '2026-07-14 11:27:44', NULL, 1, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '[]', NULL, 0, '{"showBrandFilter": false, "allowChildrenCollapse": true, "showChildrenByDefault": false, "brandFilterCollapsedRows": 3}', '1.00', NULL),
('c70b006a-a251-408b-aa4e-4ee13ceaa937', '洗面奶', NULL, NULL, NULL, 2, 'ACTIVE', '2026-07-14 10:39:17', '2026-07-14 10:39:17', NULL, 2, '966dfa88-913a-4f59-ae32-b137b8a2cce7', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '[]', NULL, 0, '{"showBrandFilter": false, "allowChildrenCollapse": true, "showChildrenByDefault": false, "brandFilterCollapsedRows": 2}', '1.00', NULL),
('c924289d-e073-47f9-9c0c-74db26d2ae23', 'Bags', '/', NULL, NULL, 0, 'ACTIVE', '2026-07-11 09:38:22', '2026-07-14 11:27:59', NULL, 1, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '[]', NULL, 0, '{"showBrandFilter": false, "allowChildrenCollapse": true, "showChildrenByDefault": false, "brandFilterCollapsedRows": 3}', '1.00', NULL),
('d13034a3-1e51-4f65-9096-6e0609e1b766', '母婴玩具', 'toys', 'https://project.autocoder.cc/background/zaki_dev/generated/593d5b3090b344b2823e166e7c84736d.png', '关注宝宝健康成长，提供安全无毒的婴童服饰、益智玩具及日常护理用品，让妈妈更加安心。', 50, 'ACTIVE', '2026-07-01 08:25:17', '2026-07-14 11:27:56', NULL, 1, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '[]', NULL, 0, '{"showBrandFilter": false, "allowChildrenCollapse": true, "showChildrenByDefault": false, "brandFilterCollapsedRows": 3}', '1.00', NULL),
('d4174d19-f3a6-4b4d-875f-64276a08889a', '精华水', NULL, NULL, NULL, 1, 'ACTIVE', '2026-07-14 10:39:17', '2026-07-14 10:39:17', NULL, 2, '966dfa88-913a-4f59-ae32-b137b8a2cce7', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '[]', NULL, 0, '{"showBrandFilter": false, "allowChildrenCollapse": true, "showChildrenByDefault": false, "brandFilterCollapsedRows": 2}', '1.00', NULL),
('e3338bf2-94c7-4347-96d7-1ac4ad689625', '口红', NULL, NULL, NULL, 3, 'ACTIVE', '2026-07-14 10:39:17', '2026-07-14 10:39:17', NULL, 2, '966dfa88-913a-4f59-ae32-b137b8a2cce7', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '[]', NULL, 0, '{"showBrandFilter": false, "allowChildrenCollapse": true, "showChildrenByDefault": false, "brandFilterCollapsedRows": 2}', '1.00', NULL),
('f1cc0d9d-7cf8-44fb-a200-b4c60ec3b717', '裤子', NULL, NULL, NULL, 2, 'ACTIVE', '2026-07-14 10:38:08', '2026-07-14 10:38:08', NULL, 2, '502e355a-0794-46ac-85d4-56616929ebb0', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '[]', NULL, 0, '{"showBrandFilter": false, "allowChildrenCollapse": true, "showChildrenByDefault": false, "brandFilterCollapsedRows": 2}', '1.00', NULL);

-- Table structure for `categorybanner`
DROP TABLE IF EXISTS `categorybanner`;
CREATE TABLE `categorybanner` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `title` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `imageUrl` varchar(700) COLLATE utf8mb4_unicode_ci NOT NULL,
  `linkUrl` varchar(1000) COLLATE utf8mb4_unicode_ci NOT NULL,
  `sortWeight` int NOT NULL DEFAULT '0',
  `isEnabled` tinyint(1) NOT NULL DEFAULT '1',
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `categorybanner_isEnabled_idx` (`isEnabled`),
  KEY `categorybanner_sortWeight_idx` (`sortWeight`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Data for table `categorybanner`
INSERT INTO `categorybanner` (`id`, `title`, `imageUrl`, `linkUrl`, `sortWeight`, `isEnabled`, `createdAt`, `updatedAt`) VALUES
('452c549f-e6cf-403c-bfc1-0d4b3cece63c', '11', 'https://productp.s3.us-west-2.amazonaws.com/background/project_image/project_pz/PROJ_fcb9e6ee_snap_20260723_132926_019/cdf4ee3b-58fb-48ef-936b-63bfcfcaa767.jpg', '', 0, 1, '2026-07-23 14:01:59', '2026-07-23 14:01:59'),
('banner-cat-001', 'Summer Jewelry Picks', 'https://productp.s3.us-west-2.amazonaws.com/background/project_image/project_pz/PROJ_fcb9e6ee_snap_20260723_131734_196/bae33f7f-04d0-48ec-96c9-2299df1d8f2b.jpg', '/productdetail?productId=demo-summer-ring', 300, 1, '2026-07-12 08:46:16', '2026-07-23 13:19:02'),
('banner-cat-002', 'New Arrivals', 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=1600&q=80', '/productcategory?categoryId=', 200, 1, '2026-07-12 08:46:16', '2026-07-12 08:46:16'),
('banner-cat-003', 'Gift Collection', 'https://images.unsplash.com/photo-1603974372039-adc49044b6bd?auto=format&fit=crop&w=1600&q=80', 'https://example.com/campaign/gift', 100, 1, '2026-07-12 08:46:16', '2026-07-12 08:46:16');

-- Table structure for `categoryfilterbinding`
DROP TABLE IF EXISTS `categoryfilterbinding`;
CREATE TABLE `categoryfilterbinding` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `categoryId` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `filterSpecId` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `sortWeight` int NOT NULL DEFAULT '0',
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `categoryfilterbinding_categoryId_filterSpecId_key` (`categoryId`,`filterSpecId`),
  KEY `categoryfilterbinding_filterSpecId_idx` (`filterSpecId`),
  CONSTRAINT `categoryfilterbinding_categoryId_fkey` FOREIGN KEY (`categoryId`) REFERENCES `category` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `categoryfilterbinding_filterSpecId_fkey` FOREIGN KEY (`filterSpecId`) REFERENCES `filterspec` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Data for table `categoryfilterbinding`
-- Table structure for `categorykeywordlink`
DROP TABLE IF EXISTS `categorykeywordlink`;
CREATE TABLE `categorykeywordlink` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `categoryId` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `keywordGroupId` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `keywordItemId` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `applyToHomepage` tinyint(1) NOT NULL DEFAULT '0',
  `sortWeight` int NOT NULL DEFAULT '0',
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `categorykeywordlink_categoryId_keywordGroupId_keywordItemId_key` (`categoryId`,`keywordGroupId`,`keywordItemId`),
  KEY `categorykeywordlink_categoryId_idx` (`categoryId`),
  KEY `categorykeywordlink_keywordGroupId_idx` (`keywordGroupId`),
  KEY `categorykeywordlink_keywordItemId_idx` (`keywordItemId`),
  CONSTRAINT `categorykeywordlink_categoryId_fkey` FOREIGN KEY (`categoryId`) REFERENCES `category` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `categorykeywordlink_keywordGroupId_fkey` FOREIGN KEY (`keywordGroupId`) REFERENCES `keywordgroup` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `categorykeywordlink_keywordItemId_fkey` FOREIGN KEY (`keywordItemId`) REFERENCES `keyworditem` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Data for table `categorykeywordlink`
INSERT INTO `categorykeywordlink` (`id`, `categoryId`, `keywordGroupId`, `keywordItemId`, `applyToHomepage`, `sortWeight`, `createdAt`, `updatedAt`) VALUES
('0c8f8eaa-1130-4545-8264-724c8367bf4f', '502e355a-0794-46ac-85d4-56616929ebb0', 'kg-brand-root', 'ebfdf741-e351-4362-9861-2d943aa24d08', 1, 1, '2026-07-14 11:41:38', '2026-07-14 11:41:38'),
('2be49718-91b1-48b2-a4df-3da445290e3d', '1ff00246-26a7-4a5e-a1d8-d1b999fcf57a', 'kg-brand-root', 'ebfdf741-e351-4362-9861-2d943aa24d08', 1, 1, '2026-07-14 11:33:38', '2026-07-14 11:44:09'),
('2c19ab87-11ba-43f2-8d98-ac9169dfcce0', '1ff00246-26a7-4a5e-a1d8-d1b999fcf57a', 'kg-promo-root', '77e7eebd-5ef4-445f-9ba4-56ee545044a0', 0, 1, '2026-07-14 11:40:15', '2026-07-14 11:40:15'),
('2e5838e7-aef1-46e1-9cc6-f03583027872', '966dfa88-913a-4f59-ae32-b137b8a2cce7', 'kg-brand-root', 'ebfdf741-e351-4362-9861-2d943aa24d08', 1, 2, '2026-07-14 11:41:38', '2026-07-14 11:41:38'),
('354b94bd-b02b-49f8-8663-a2489a0bf488', '6eb7ccf8-52b9-4c46-a669-8ed78a2d6407', 'kg-brand-root', 'ebfdf741-e351-4362-9861-2d943aa24d08', 1, 6, '2026-07-14 11:41:38', '2026-07-14 11:41:38'),
('3a18f8f2-0504-4715-aeda-2ee62904bdcf', 'c924289d-e073-47f9-9c0c-74db26d2ae23', 'kg-brand-root', 'ebfdf741-e351-4362-9861-2d943aa24d08', 1, 3, '2026-07-14 11:41:38', '2026-07-14 11:41:38'),
('5ca51038-1db1-4165-9d67-068d56935b47', '1ff00246-26a7-4a5e-a1d8-d1b999fcf57a', 'kg-brand-root', '7ee99bf4-39a2-4e8a-a4ed-5187a5c3b8ec', 1, 2, '2026-07-14 11:44:09', '2026-07-14 11:44:09'),
('c4ad81a0-6aee-4a96-86e4-c51b02fb2e04', 'd13034a3-1e51-4f65-9096-6e0609e1b766', 'kg-brand-root', 'ebfdf741-e351-4362-9861-2d943aa24d08', 1, 4, '2026-07-14 11:41:38', '2026-07-14 11:41:38'),
('c8464c93-3b80-4370-b2cf-bd848b40c5ef', '1ff00246-26a7-4a5e-a1d8-d1b999fcf57a', 'kg-brand-root', '743131fa-c6f2-423d-87a3-024c4defcd11', 1, 1, '2026-07-14 11:44:09', '2026-07-14 11:44:09'),
('de49e515-67c7-460a-ade1-3760a75f9338', '1ff00246-26a7-4a5e-a1d8-d1b999fcf57a', 'kg-promo-flash', 'ki-promo-summer', 1, 1, '2026-07-14 11:37:51', '2026-07-14 11:37:51'),
('e2adcf09-e14a-46ce-a426-14c83ccd9afa', '42f3c7d7-a703-45e2-bf52-82e3080c5bb2', 'kg-brand-root', 'ebfdf741-e351-4362-9861-2d943aa24d08', 1, 5, '2026-07-14 11:41:38', '2026-07-14 11:41:38');

-- Table structure for `categorynavconfig`
DROP TABLE IF EXISTS `categorynavconfig`;
CREATE TABLE `categorynavconfig` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `categoryId` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `navTitle` varchar(120) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `sortWeight` int NOT NULL DEFAULT '0',
  `isVisible` tinyint(1) NOT NULL DEFAULT '1',
  `badgeText` varchar(60) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `categorynavconfig_categoryId_key` (`categoryId`),
  KEY `categorynavconfig_isVisible_idx` (`isVisible`),
  KEY `categorynavconfig_sortWeight_idx` (`sortWeight`),
  CONSTRAINT `categorynavconfig_categoryId_fkey` FOREIGN KEY (`categoryId`) REFERENCES `category` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Data for table `categorynavconfig`
-- Table structure for `categoryspectemplatebinding`
DROP TABLE IF EXISTS `categoryspectemplatebinding`;
CREATE TABLE `categoryspectemplatebinding` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `categoryId` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `specTemplateId` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `categoryspectemplatebinding_categoryId_specTemplateId_key` (`categoryId`,`specTemplateId`),
  KEY `categoryspectemplatebinding_specTemplateId_idx` (`specTemplateId`),
  CONSTRAINT `categoryspectemplatebinding_categoryId_fkey` FOREIGN KEY (`categoryId`) REFERENCES `category` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `categoryspectemplatebinding_specTemplateId_fkey` FOREIGN KEY (`specTemplateId`) REFERENCES `spectemplate` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Data for table `categoryspectemplatebinding`
-- Table structure for `currencysetting`
DROP TABLE IF EXISTS `currencysetting`;
CREATE TABLE `currencysetting` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `currencyCode` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL,
  `currencyName` varchar(60) COLLATE utf8mb4_unicode_ci NOT NULL,
  `exchangeRate` decimal(12,6) NOT NULL,
  `isDefault` tinyint(1) NOT NULL DEFAULT '0',
  `isActive` tinyint(1) NOT NULL DEFAULT '1',
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `currencysetting_currencyCode_key` (`currencyCode`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Data for table `currencysetting`
-- Table structure for `customercommunication`
DROP TABLE IF EXISTS `customercommunication`;
CREATE TABLE `customercommunication` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `userId` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `channel` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `content` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `operatorName` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `customercommunication_userId_idx` (`userId`),
  CONSTRAINT `customercommunication_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `sysuser` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Data for table `customercommunication`
-- Table structure for `customertag`
DROP TABLE IF EXISTS `customertag`;
CREATE TABLE `customertag` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(120) COLLATE utf8mb4_unicode_ci NOT NULL,
  `code` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `color` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `customertag_code_key` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Data for table `customertag`
-- Table structure for `customertaglink`
DROP TABLE IF EXISTS `customertaglink`;
CREATE TABLE `customertaglink` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `userId` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tagId` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `customertaglink_userId_tagId_key` (`userId`,`tagId`),
  KEY `customertaglink_tagId_idx` (`tagId`),
  CONSTRAINT `customertaglink_tagId_fkey` FOREIGN KEY (`tagId`) REFERENCES `customertag` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `customertaglink_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `sysuser` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Data for table `customertaglink`
-- Table structure for `customerticket`
DROP TABLE IF EXISTS `customerticket`;
CREATE TABLE `customerticket` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `userId` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `contactName` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(120) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `channel` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `subject` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `content` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` enum('OPEN','REPLIED','RESOLVED','CLOSED') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'OPEN',
  `replyContent` text COLLATE utf8mb4_unicode_ci,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `customerticket_userId_idx` (`userId`),
  KEY `customerticket_status_idx` (`status`),
  CONSTRAINT `customerticket_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `sysuser` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Data for table `customerticket`
-- Table structure for `customorder`
DROP TABLE IF EXISTS `customorder`;
CREATE TABLE `customorder` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `orderId` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `userId` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `productId` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `productSkuId` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `promotionId` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `engravingText` varchar(120) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `engravingFont` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `engravingPreviewUrl` varchar(700) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` enum('PENDING_CONFIRMATION','IN_PRODUCTION','READY_TO_SHIP','SHIPPED','COMPLETED') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'PENDING_CONFIRMATION',
  `productionNote` text COLLATE utf8mb4_unicode_ci,
  `shippingLabelUrl` varchar(700) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `completedAt` datetime(3) DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `customorder_orderId_key` (`orderId`),
  KEY `customorder_userId_idx` (`userId`),
  KEY `customorder_productId_idx` (`productId`),
  KEY `customorder_productSkuId_idx` (`productSkuId`),
  KEY `customorder_status_idx` (`status`),
  KEY `customorder_promotionId_fkey` (`promotionId`),
  CONSTRAINT `customorder_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `product` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `customorder_productSkuId_fkey` FOREIGN KEY (`productSkuId`) REFERENCES `productsku` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `customorder_promotionId_fkey` FOREIGN KEY (`promotionId`) REFERENCES `promotioncampaign` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `customorder_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `sysuser` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Data for table `customorder`
-- Table structure for `filterspec`
DROP TABLE IF EXISTS `filterspec`;
CREATE TABLE `filterspec` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(120) COLLATE utf8mb4_unicode_ci NOT NULL,
  `code` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `inputType` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `optionJson` json DEFAULT NULL,
  `translationsJson` json DEFAULT NULL,
  `sortWeight` int NOT NULL DEFAULT '0',
  `isActive` tinyint(1) NOT NULL DEFAULT '1',
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `filterspec_code_key` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Data for table `filterspec`
-- Table structure for `homerecommendcollection`
DROP TABLE IF EXISTS `homerecommendcollection`;
CREATE TABLE `homerecommendcollection` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `sourceZoneId` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `isActive` tinyint(1) NOT NULL DEFAULT '1',
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `homeRecommendCollection_sourceZoneId_key` (`sourceZoneId`),
  KEY `homeRecommendCollection_isActive_idx` (`isActive`),
  CONSTRAINT `homeRecommendCollection_sourceZoneId_fkey` FOREIGN KEY (`sourceZoneId`) REFERENCES `homerecommendzone` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Data for table `homerecommendcollection`
-- Table structure for `homerecommendcollectionitem`
DROP TABLE IF EXISTS `homerecommendcollectionitem`;
CREATE TABLE `homerecommendcollectionitem` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `collectionId` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `productId` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `sortWeight` int NOT NULL DEFAULT '0',
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `homeRecommendCollectionItem_collectionId_productId_key` (`collectionId`,`productId`),
  KEY `homeRecommendCollectionItem_collectionId_idx` (`collectionId`),
  KEY `homeRecommendCollectionItem_productId_idx` (`productId`),
  KEY `homeRecommendCollectionItem_sortWeight_idx` (`sortWeight`),
  CONSTRAINT `homeRecommendCollectionItem_collectionId_fkey` FOREIGN KEY (`collectionId`) REFERENCES `homerecommendcollection` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `homeRecommendCollectionItem_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `product` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Data for table `homerecommendcollectionitem`
-- Table structure for `homerecommendzone`
DROP TABLE IF EXISTS `homerecommendzone`;
CREATE TABLE `homerecommendzone` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `title` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `zoneType` enum('PRODUCT','CATEGORY','SIDE_NAV') COLLATE utf8mb4_unicode_ci NOT NULL,
  `pcCols` int NOT NULL DEFAULT '4',
  `mobileCols` int NOT NULL DEFAULT '2',
  `pcRows` int NOT NULL DEFAULT '2',
  `sortWeight` int NOT NULL DEFAULT '0',
  `isActive` tinyint(1) NOT NULL DEFAULT '1',
  `boundCollectionId` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `homeRecommendZone_boundCollectionId_key` (`boundCollectionId`),
  KEY `homeRecommendZone_zoneType_idx` (`zoneType`),
  KEY `homeRecommendZone_isActive_idx` (`isActive`),
  KEY `homeRecommendZone_sortWeight_idx` (`sortWeight`),
  CONSTRAINT `homeRecommendZone_boundCollectionId_fkey` FOREIGN KEY (`boundCollectionId`) REFERENCES `homerecommendcollection` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Data for table `homerecommendzone`
INSERT INTO `homerecommendzone` (`id`, `title`, `zoneType`, `pcCols`, `mobileCols`, `sortWeight`, `isActive`, `boundCollectionId`, `createdAt`, `updatedAt`) VALUES
('4d446d2e-4ac0-4791-b23b-3f85be4134cb', 'Hot', 'SIDE_NAV', 4, 2, 0, 1, NULL, '2026-07-24 08:34:14', '2026-07-24 10:05:52'),
('62eac36d-6866-472f-ba6e-68666d6687ff', '为你推荐 (复制)', 'PRODUCT', 4, 2, 200, 1, NULL, '2026-07-23 15:20:21', '2026-07-24 10:19:01'),
('c1fed627-5b20-4984-9d65-8f054dd743f1', '精选分类 (复制)', 'CATEGORY', 5, 2, 200, 1, NULL, '2026-07-23 15:18:56', '2026-07-24 10:18:55'),
('zone-home-category-collection', '精选分类', 'CATEGORY', 5, 2, 150, 1, NULL, '2026-07-23 15:02:13', '2026-07-24 10:18:54'),
('zone-home-featured-picks', '为你推荐', 'PRODUCT', 4, 2, 200, 1, NULL, '2026-07-23 15:02:13', '2026-07-23 15:13:49');

-- Table structure for `homerecommendzoneitem`
DROP TABLE IF EXISTS `homerecommendzoneitem`;
CREATE TABLE `homerecommendzoneitem` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `zoneId` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `entityType` enum('PRODUCT','CATEGORY','SIDE_NAV') COLLATE utf8mb4_unicode_ci NOT NULL,
  `productId` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `categoryId` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `sortWeight` int NOT NULL DEFAULT '0',
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `homeRecommendZoneItem_zoneId_idx` (`zoneId`),
  KEY `homeRecommendZoneItem_productId_idx` (`productId`),
  KEY `homeRecommendZoneItem_categoryId_idx` (`categoryId`),
  KEY `homeRecommendZoneItem_sortWeight_idx` (`sortWeight`),
  CONSTRAINT `homeRecommendZoneItem_categoryId_fkey` FOREIGN KEY (`categoryId`) REFERENCES `category` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `homeRecommendZoneItem_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `product` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `homeRecommendZoneItem_zoneId_fkey` FOREIGN KEY (`zoneId`) REFERENCES `homerecommendzone` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Data for table `homerecommendzoneitem`
INSERT INTO `homerecommendzoneitem` (`id`, `zoneId`, `entityType`, `productId`, `categoryId`, `sortWeight`, `createdAt`, `updatedAt`) VALUES
('182aa82a-940d-4c3f-96cb-ed86e3592d4d', 'c1fed627-5b20-4984-9d65-8f054dd743f1', 'CATEGORY', NULL, '42f3c7d7-a703-45e2-bf52-82e3080c5bb2', 200, '2026-07-23 15:18:56', '2026-07-23 15:18:56'),
('23c2df55-4cf0-4ec8-8869-6dba69803c48', '4d446d2e-4ac0-4791-b23b-3f85be4134cb', 'SIDE_NAV', NULL, '87f60d56-b87c-46d7-bd0a-3457996fcdfd', 40, '2026-07-24 10:05:52', '2026-07-24 10:05:52'),
('30c05e55-86f3-4652-9ff4-62dbdadfe87c', 'c1fed627-5b20-4984-9d65-8f054dd743f1', 'CATEGORY', NULL, '502e355a-0794-46ac-85d4-56616929ebb0', 100, '2026-07-23 15:18:56', '2026-07-23 15:18:56'),
('31573e10-9e6c-4d81-a535-45964990cda5', 'c1fed627-5b20-4984-9d65-8f054dd743f1', 'CATEGORY', NULL, 'd13034a3-1e51-4f65-9096-6e0609e1b766', 400, '2026-07-23 15:18:56', '2026-07-23 15:18:56'),
('4ac9eb4b-996f-401a-b9ff-d5bd86abcfd8', '4d446d2e-4ac0-4791-b23b-3f85be4134cb', 'SIDE_NAV', NULL, 'd13034a3-1e51-4f65-9096-6e0609e1b766', 10, '2026-07-24 10:05:52', '2026-07-24 10:05:52'),
('67a1dfae-a205-4bf6-8024-e18442d6d593', '4d446d2e-4ac0-4791-b23b-3f85be4134cb', 'SIDE_NAV', NULL, 'e3338bf2-94c7-4347-96d7-1ac4ad689625', 50, '2026-07-24 10:05:52', '2026-07-24 10:05:52'),
('91a5aac2-a3f0-41a0-ac19-9ecabc5eb9a6', '4d446d2e-4ac0-4791-b23b-3f85be4134cb', 'SIDE_NAV', NULL, '42f3c7d7-a703-45e2-bf52-82e3080c5bb2', 20, '2026-07-24 10:05:52', '2026-07-24 10:05:52'),
('a29affcc-0a26-4e8d-a16d-91da16e0889f', 'c1fed627-5b20-4984-9d65-8f054dd743f1', 'CATEGORY', NULL, '966dfa88-913a-4f59-ae32-b137b8a2cce7', 300, '2026-07-23 15:18:56', '2026-07-23 15:18:56'),
('e3701f25-c55f-43f0-a70e-ab82168a3317', '4d446d2e-4ac0-4791-b23b-3f85be4134cb', 'SIDE_NAV', NULL, '966dfa88-913a-4f59-ae32-b137b8a2cce7', 30, '2026-07-24 10:05:52', '2026-07-24 10:05:52'),
('fe6f8e5d-8099-4abb-bcb1-58b3c2378a9e', 'c1fed627-5b20-4984-9d65-8f054dd743f1', 'CATEGORY', NULL, '6eb7ccf8-52b9-4c46-a669-8ed78a2d6407', 500, '2026-07-23 15:18:56', '2026-07-23 15:18:56'),
('zone-item-category-1', 'zone-home-category-collection', 'CATEGORY', NULL, '6eb7ccf8-52b9-4c46-a669-8ed78a2d6407', 500, '2026-07-23 15:02:13', '2026-07-23 15:02:13'),
('zone-item-category-2', 'zone-home-category-collection', 'CATEGORY', NULL, 'd13034a3-1e51-4f65-9096-6e0609e1b766', 400, '2026-07-23 15:02:13', '2026-07-23 15:02:13'),
('zone-item-category-3', 'zone-home-category-collection', 'CATEGORY', NULL, '966dfa88-913a-4f59-ae32-b137b8a2cce7', 300, '2026-07-23 15:02:13', '2026-07-23 15:02:13'),
('zone-item-category-4', 'zone-home-category-collection', 'CATEGORY', NULL, '42f3c7d7-a703-45e2-bf52-82e3080c5bb2', 200, '2026-07-23 15:02:13', '2026-07-23 15:02:13'),
('zone-item-category-5', 'zone-home-category-collection', 'CATEGORY', NULL, '502e355a-0794-46ac-85d4-56616929ebb0', 100, '2026-07-23 15:02:13', '2026-07-23 15:02:13');

-- Table structure for `importtask`
DROP TABLE IF EXISTS `importtask`;
CREATE TABLE `importtask` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `creatorId` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `taskName` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` enum('PENDING','RUNNING','COMPLETED','FAILED','QUEUED','RATE_LIMITED','PARTIAL_SUCCESS','RETRY_PENDING') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'PENDING',
  `sourceLinkCount` int NOT NULL DEFAULT '0',
  `successCount` int NOT NULL DEFAULT '0',
  `failureCount` int NOT NULL DEFAULT '0',
  `progressPercent` int NOT NULL DEFAULT '0',
  `markupRate` decimal(5,2) DEFAULT NULL,
  `defaultStatus` enum('DRAFT','ACTIVE','INACTIVE','OUT_OF_STOCK','PREORDER') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'DRAFT',
  `defaultCategoryId` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `stockStrategyJson` json DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `finishedAt` datetime(3) DEFAULT NULL,
  `lastRateLimitedAt` datetime(3) DEFAULT NULL,
  `lastScheduledAt` datetime(3) DEFAULT NULL,
  `queueConcurrency` int NOT NULL DEFAULT '1',
  `rateLimitMaxDelaySec` int NOT NULL DEFAULT '5',
  `rateLimitMinDelaySec` int NOT NULL DEFAULT '2',
  `startedAt` datetime(3) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `importtask_creatorId_idx` (`creatorId`),
  KEY `importtask_status_idx` (`status`),
  CONSTRAINT `importtask_creatorId_fkey` FOREIGN KEY (`creatorId`) REFERENCES `sysuser` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Data for table `importtask`
INSERT INTO `importtask` (`id`, `creatorId`, `taskName`, `status`, `sourceLinkCount`, `successCount`, `failureCount`, `progressPercent`, `markupRate`, `defaultStatus`, `defaultCategoryId`, `stockStrategyJson`, `createdAt`, `updatedAt`, `finishedAt`, `lastRateLimitedAt`, `lastScheduledAt`, `queueConcurrency`, `rateLimitMaxDelaySec`, `rateLimitMinDelaySec`, `startedAt`) VALUES
('0df45162-8a5a-4220-a9b9-e620f8315934', 'b8b6a765-bb58-40b3-8ee3-9d5eb600d216', '夏日清凉系列家居用品批量采集', 'PENDING', 150, 0, 0, 0, '40.00', 'DRAFT', '6eb7ccf8-52b9-4c46-a669-8ed78a2d6407', '{"type": "fixed", "stock": 500}', '2026-07-06 00:00:00', '2026-07-07 00:00:00', NULL, NULL, NULL, 1, 5, 2, NULL),
('13d21f88-02e5-4658-ba2e-de1b82e9f86a', 'b8b6a765-bb58-40b3-8ee3-9d5eb600d216', '导入任务 2026/7/13 13:22:21', 'COMPLETED', 1, 1, 0, 100, '20.00', 'DRAFT', '502e355a-0794-46ac-85d4-56616929ebb0', '{"type": "fixed", "stock": 100}', '2026-07-13 13:22:21', '2026-07-13 13:22:22', NULL, NULL, NULL, 1, 5, 2, NULL),
('2eef1824-09a3-4a82-aedb-531bc56fed4e', 'b8b6a765-bb58-40b3-8ee3-9d5eb600d216', '导入任务 2026/7/26 09:20:48', 'COMPLETED', 1, 1, 0, 100, '20.00', 'DRAFT', '502e355a-0794-46ac-85d4-56616929ebb0', '{"type": "fixed", "stock": 100}', '2026-07-26 09:20:48', '2026-07-26 09:20:48', '2026-07-26 09:20:48', NULL, '2026-07-26 09:20:48', 1, 5, 2, '2026-07-26 09:20:48'),
('439e9f09-13bc-499f-9248-9f1847f8ea5c', 'b8b6a765-bb58-40b3-8ee3-9d5eb600d216', '导入任务 2026/7/26 09:18:57', 'COMPLETED', 1, 1, 0, 100, '1.00', 'DRAFT', '502e355a-0794-46ac-85d4-56616929ebb0', '{"type": "fixed", "stock": 1}', '2026-07-26 09:18:57', '2026-07-26 09:18:57', '2026-07-26 09:18:57', NULL, '2026-07-26 09:18:57', 1, 5, 2, '2026-07-26 09:18:57'),
('4bbdb343-3539-41bc-a13b-bf096f98fbaf', 'b8b6a765-bb58-40b3-8ee3-9d5eb600d216', '导入任务 2026/7/26 09:20:37', 'COMPLETED', 1, 1, 0, 100, '20.00', 'DRAFT', NULL, '{"type": "fixed", "stock": 100}', '2026-07-26 09:20:37', '2026-07-26 09:20:37', '2026-07-26 09:20:37', NULL, '2026-07-26 09:20:37', 1, 5, 2, '2026-07-26 09:20:37'),
('5c29ff93-2734-43fc-9380-e22ae1475be7', 'b8b6a765-bb58-40b3-8ee3-9d5eb600d216', '导入任务 2026/7/25 07:19:05', 'COMPLETED', 1, 1, 0, 100, '1.00', 'DRAFT', '502e355a-0794-46ac-85d4-56616929ebb0', '{"type": "fixed", "stock": 1}', '2026-07-25 07:19:05', '2026-07-25 07:19:05', '2026-07-25 07:19:05', NULL, '2026-07-25 07:19:05', 1, 5, 2, '2026-07-25 07:19:05'),
('78332851-3a6c-42f8-98e3-e7016e966225', 'b8b6a765-bb58-40b3-8ee3-9d5eb600d216', '导入任务 2026/7/25 07:18:32', 'COMPLETED', 1, 1, 0, 100, '20.00', 'DRAFT', 'e3338bf2-94c7-4347-96d7-1ac4ad689625', '{"type": "fixed", "stock": 100}', '2026-07-25 07:18:32', '2026-07-25 07:18:32', '2026-07-25 07:18:32', NULL, '2026-07-25 07:18:32', 1, 5, 2, '2026-07-25 07:18:32'),
('7cb4c4cc-530e-4f2d-bb07-bd82c484b396', 'b8b6a765-bb58-40b3-8ee3-9d5eb600d216', '极简牛皮钱夹与配饰上架任务', 'FAILED', 50, 5, 7, 15, '100.00', 'INACTIVE', '502e355a-0794-46ac-85d4-56616929ebb0', '{"type": "percentage", "ratio": 0.8}', '2026-06-21 00:00:00', '2026-06-23 00:00:00', NULL, NULL, NULL, 1, 5, 2, NULL),
('8e8d16db-b99b-4e01-9e29-0514f7a5fcdb', 'b8b6a765-bb58-40b3-8ee3-9d5eb600d216', '秋冬男士保暖夹克大类采集', 'COMPLETED', 100, 95, 5, 100, '50.00', 'ACTIVE', '502e355a-0794-46ac-85d4-56616929ebb0', '{"max": 200, "min": 50, "type": "random"}', '2026-06-26 00:00:00', '2026-07-06 00:00:00', NULL, NULL, NULL, 1, 5, 2, NULL),
('a52a9e9f-9f57-4feb-9e9d-7427ddc6b3c5', 'b8b6a765-bb58-40b3-8ee3-9d5eb600d216', '导入任务 2026/7/25 07:07:42', 'COMPLETED', 1, 1, 0, 100, '20.00', 'DRAFT', NULL, '{"type": "fixed", "stock": 100}', '2026-07-25 07:07:42', '2026-07-25 07:07:42', '2026-07-25 07:07:42', NULL, '2026-07-25 07:07:42', 1, 5, 2, '2026-07-25 07:07:42'),
('a70f40bd-de1d-4a0a-80c9-e9371e8be7b3', 'b8b6a765-bb58-40b3-8ee3-9d5eb600d216', '1688 智能数码及配件批量导入', 'RUNNING', 200, 170, 0, 85, '30.50', 'DRAFT', '1ff00246-26a7-4a5e-a1d8-d1b999fcf57a', '{"type": "fixed", "stock": 100}', '2026-07-08 00:00:00', '2026-07-10 00:00:00', NULL, NULL, NULL, 1, 5, 2, NULL),
('ac06e639-bd77-4c8b-a528-bdade12ba56a', 'b8b6a765-bb58-40b3-8ee3-9d5eb600d216', '导入任务 2026/7/26 10:01:57', 'COMPLETED', 1, 1, 0, 100, '20.00', 'DRAFT', NULL, '{"type": "fixed", "stock": 100}', '2026-07-26 10:01:57', '2026-07-26 10:01:57', '2026-07-26 10:01:57', NULL, '2026-07-26 10:01:57', 1, 5, 2, '2026-07-26 10:01:57'),
('b0bbb1e9-fe2d-494b-a37c-ed412f4a6364', 'b8b6a765-bb58-40b3-8ee3-9d5eb600d216', '导入任务 2026/7/26 09:20:16', 'COMPLETED', 1, 1, 0, 100, '1.00', 'DRAFT', '502e355a-0794-46ac-85d4-56616929ebb0', '{"type": "fixed", "stock": 1}', '2026-07-26 09:20:16', '2026-07-26 09:20:16', '2026-07-26 09:20:16', NULL, '2026-07-26 09:20:16', 1, 5, 2, '2026-07-26 09:20:16'),
('c17d9072-6fd7-4299-a412-a274be2b8b56', 'b8b6a765-bb58-40b3-8ee3-9d5eb600d216', '导入任务 2026/7/26 09:19:08', 'COMPLETED', 1, 1, 0, 100, '1.00', 'DRAFT', '502e355a-0794-46ac-85d4-56616929ebb0', '{"type": "fixed", "stock": 1}', '2026-07-26 09:19:08', '2026-07-26 09:19:08', '2026-07-26 09:19:08', NULL, '2026-07-26 09:19:08', 1, 5, 2, '2026-07-26 09:19:08'),
('ccbd7d16-b9d6-44dc-b291-39e2e327903f', 'b8b6a765-bb58-40b3-8ee3-9d5eb600d216', '导入任务 2026/7/26 09:51:03', 'COMPLETED', 1, 1, 0, 100, '1.00', 'DRAFT', '502e355a-0794-46ac-85d4-56616929ebb0', '{"type": "fixed", "stock": 1}', '2026-07-26 09:51:03', '2026-07-26 09:51:04', '2026-07-26 09:51:04', NULL, '2026-07-26 09:51:04', 1, 5, 2, '2026-07-26 09:51:04'),
('dcc195ff-e77f-4b3b-a67a-f3807987b124', 'b8b6a765-bb58-40b3-8ee3-9d5eb600d216', '导入任务 2026/7/25 07:05:17', 'COMPLETED', 1, 1, 0, 100, '20.00', 'DRAFT', NULL, '{"type": "fixed", "stock": 100}', '2026-07-25 07:05:17', '2026-07-25 07:05:18', '2026-07-25 07:05:18', NULL, '2026-07-25 07:05:18', 1, 5, 2, '2026-07-25 07:05:18'),
('fdb32ead-2a3a-4574-8d53-ed8d0104c9fc', 'b8b6a765-bb58-40b3-8ee3-9d5eb600d216', '导入任务 2026/7/25 07:19:30', 'COMPLETED', 1, 1, 0, 100, '1.00', 'DRAFT', '502e355a-0794-46ac-85d4-56616929ebb0', '{"type": "fixed", "stock": 1}', '2026-07-25 07:19:30', '2026-07-25 07:19:30', '2026-07-25 07:19:30', NULL, '2026-07-25 07:19:30', 1, 5, 2, '2026-07-25 07:19:30');

-- Table structure for `importtaskitem`
DROP TABLE IF EXISTS `importtaskitem`;
CREATE TABLE `importtaskitem` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `importTaskId` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `operatorId` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `sourceUrl` varchar(700) COLLATE utf8mb4_unicode_ci NOT NULL,
  `parsedName` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `parsedMainImageUrl` varchar(700) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `parsedPriceMin` decimal(10,2) DEFAULT NULL,
  `parsedPriceMax` decimal(10,2) DEFAULT NULL,
  `specSummaryJson` json DEFAULT NULL,
  `previewDataJson` json DEFAULT NULL,
  `isSelected` tinyint(1) NOT NULL DEFAULT '0',
  `importedProductId` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `failureReason` text COLLATE utf8mb4_unicode_ci,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `availableStock` int DEFAULT NULL,
  `cnyPriceMax` decimal(10,2) DEFAULT NULL,
  `cnyPriceMin` decimal(10,2) DEFAULT NULL,
  `coefficient` decimal(8,2) DEFAULT NULL,
  `costPrice` decimal(10,2) DEFAULT NULL,
  `fetchFinishedAt` datetime(3) DEFAULT NULL,
  `fetchStartedAt` datetime(3) DEFAULT NULL,
  `fetchStatus` enum('PENDING','RUNNING','COMPLETED','FAILED','QUEUED','RATE_LIMITED','PARTIAL_SUCCESS','RETRY_PENDING') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'PENDING',
  `goodsStatus` enum('DRAFT','ACTIVE','INACTIVE','OUT_OF_STOCK','PREORDER') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `isPublished` tinyint(1) NOT NULL DEFAULT '0',
  `mainImageUrl` varchar(700) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `minimumOrderQuantity` int DEFAULT NULL,
  `productDetail` longtext COLLATE utf8mb4_unicode_ci,
  `publishStartedAt` datetime(3) DEFAULT NULL,
  `publishStatus` enum('PENDING','RUNNING','COMPLETED','FAILED','QUEUED','RATE_LIMITED','PARTIAL_SUCCESS','RETRY_PENDING') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'PENDING',
  `publishedAt` datetime(3) DEFAULT NULL,
  `retryCount` int NOT NULL DEFAULT '0',
  `skuSummaryText` longtext COLLATE utf8mb4_unicode_ci,
  `sourceCategoryName` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `supplierName` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `targetCategoryId` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `usdPriceMax` decimal(10,2) DEFAULT NULL,
  `usdPriceMin` decimal(10,2) DEFAULT NULL,
  `weightGrams` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `importtaskitem_importTaskId_idx` (`importTaskId`),
  KEY `importtaskitem_operatorId_idx` (`operatorId`),
  KEY `importtaskitem_importedProductId_idx` (`importedProductId`),
  KEY `importtaskitem_fetchStatus_idx` (`fetchStatus`),
  KEY `importtaskitem_publishStatus_idx` (`publishStatus`),
  KEY `importtaskitem_isPublished_idx` (`isPublished`),
  KEY `importtaskitem_targetCategoryId_idx` (`targetCategoryId`),
  CONSTRAINT `importtaskitem_importedProductId_fkey` FOREIGN KEY (`importedProductId`) REFERENCES `product` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `importtaskitem_importTaskId_fkey` FOREIGN KEY (`importTaskId`) REFERENCES `importtask` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `importtaskitem_operatorId_fkey` FOREIGN KEY (`operatorId`) REFERENCES `sysuser` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Data for table `importtaskitem`
INSERT INTO `importtaskitem` (`id`, `importTaskId`, `operatorId`, `sourceUrl`, `parsedName`, `parsedMainImageUrl`, `parsedPriceMin`, `parsedPriceMax`, `specSummaryJson`, `previewDataJson`, `isSelected`, `importedProductId`, `failureReason`, `createdAt`, `updatedAt`, `availableStock`, `cnyPriceMax`, `cnyPriceMin`, `coefficient`, `costPrice`, `fetchFinishedAt`, `fetchStartedAt`, `fetchStatus`, `goodsStatus`, `isPublished`, `mainImageUrl`, `minimumOrderQuantity`, `productDetail`, `publishStartedAt`, `publishStatus`, `publishedAt`, `retryCount`, `skuSummaryText`, `sourceCategoryName`, `supplierName`, `targetCategoryId`, `usdPriceMax`, `usdPriceMin`, `weightGrams`) VALUES
('0278ea34-ea93-4130-8a5c-bad67f644346', 'b0bbb1e9-fe2d-494b-a37c-ed412f4a6364', 'b8b6a765-bb58-40b3-8ee3-9d5eb600d216', 'https://detail.1688.com/offer/1064388358214.html', '[1688抓取] 工业配件 0278ea', 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158', '68.00', '88.00', '[{"name": "规格", "values": ["标准版"]}]', '{"name": "[1688抓取] 工业配件 0278ea", "price": 68.68, "categoryId": "502e355a-0794-46ac-85d4-56616929ebb0", "mainImageUrl": "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158", "shortDescription": "自动抓取的商品简介内容，请根据需要修改。"}', 1, 'd44fbeab-96f8-401e-8395-3e1d7d9d0cbc', NULL, '2026-07-26 09:20:16', '2026-07-26 09:52:53', 100, '88.00', '68.00', '1.00', '68.00', '2026-07-26 09:20:16', '2026-07-26 09:20:16', 'COMPLETED', 'DRAFT', 1, 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158', 1, '自动采集的商品详情，请运营补充图文与说明。', NULL, 'COMPLETED', '2026-07-26 09:52:53', 0, '标准版 / 默认规格', '1688工业配件', '1688 默认供应商', '502e355a-0794-46ac-85d4-56616929ebb0', '12.22', '9.44', 500),
('0c8cc385-2f9d-4b16-b626-f7c8afaa5c1b', 'fdb32ead-2a3a-4574-8d53-ed8d0104c9fc', 'b8b6a765-bb58-40b3-8ee3-9d5eb600d216', 'https://detail.1688.com/offer/1061058906651.html?src=zhanwai&pid=302041_0000&ptid=&exp=enquiry%3AB%3BqueryMobilePhone%3AA%3Bxlyx%3AB&_force_exp_buckets_=11803%2C2024061701%2C2024011602&spm=a2638t.b_30496503.szyx_offer_list.3.44b2436cBn60of&cosite=baidujj_pz&ilike_session=8e9483d80253473c9a22e0caa1f89e28&tracelog=p4p&_p_isad=1&clickid=8e9483d80253473c9a22e0caa1f89e28&sessionid=f52a52fb5e54a7c8c73cf5662efe51f7&a=1353&e=q6HRQ4iR4n7zrrk0AjWQ.80TNDrQDIxA29p5eClkyQ6gacrHveDQFerk32YTL9f6Q5Fu50T7YzF-SLhTy8Yqe-lxv-X4ECd0LXqexl-XFIUAl6GQ3oEpmojwePwNoOFP-ua9Q.nzaWA9BGoV6QyMCm7csYpkDYNrA5h0HaZnaF4M18LM4Irdh9p9uYOGmnrMbiNKoN5HTi61JtTwAvN2GxEUdFy4Fy0WFCdHLF.ipb-rvBXuQdl4FA__&sk=sem&style=1', '[1688抓取] 工业配件 0c8cc3', 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158', '56.00', '76.00', '[{"name": "规格", "values": ["标准版"]}]', '{"name": "[1688抓取] 工业配件 0c8cc3", "price": 56.56, "categoryId": "502e355a-0794-46ac-85d4-56616929ebb0", "mainImageUrl": "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158", "shortDescription": "自动抓取的商品简介内容，请根据需要修改。"}', 1, '8f14ef51-3a5a-4a30-945c-a7d045c2d4d7', NULL, '2026-07-25 07:19:30', '2026-07-26 09:52:53', 100, '76.00', '56.00', '1.00', '56.00', '2026-07-25 07:19:30', '2026-07-25 07:19:30', 'COMPLETED', 'DRAFT', 1, 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158', 1, '自动采集的商品详情，请运营补充图文与说明。', NULL, 'COMPLETED', '2026-07-26 09:52:53', 0, '标准版 / 默认规格', '1688工业配件', '1688 默认供应商', '502e355a-0794-46ac-85d4-56616929ebb0', '10.56', '7.78', 500),
('35f34070-56fd-44d9-8166-39ba66c46160', 'a70f40bd-de1d-4a0a-80c9-e9371e8be7b3', 'b8b6a765-bb58-40b3-8ee3-9d5eb600d216', 'https://detail.1688.com/offer/701234567890.html', '新款TWS真无线蓝牙耳机 迷你隐形 运动降噪入耳式', 'https://productp.s3.us-west-2.amazonaws.com/background/zaki_dev/generated/03b32667c323467aa8bfef4f9bd79a16.png', '15.50', '22.00', '[{"name": "颜色", "values": ["幻夜黑", "冰霜白", "猛男粉"]}, {"name": "版本", "values": ["标准版", "旗舰降噪版"]}]', '{"name": "新款TWS真无线蓝牙耳机 迷你隐形 运动降噪入耳式", "price": 28.5, "categoryId": null, "mainImageUrl": "https://productp.s3.us-west-2.amazonaws.com/background/zaki_dev/generated/d7b643a376f745f48d933d9afc1928f4.png", "shortDescription": "TWS真无线设计，迷你轻巧，无感佩戴，运动狂甩不掉。内置智能降噪芯片，有效过滤环境杂音，带来清晰通话体验。持久续航，配合充电仓可使用一整天。"}', 1, 'c42cb16c-1b14-495a-bdd0-be563184b862', NULL, '2026-07-09 08:25:18', '2026-07-10 08:25:18', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'COMPLETED', NULL, 1, NULL, NULL, NULL, NULL, 'COMPLETED', '2026-07-13 14:14:55', 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
('379c8d78-6e15-4b3c-90db-63247f05086b', '4bbdb343-3539-41bc-a13b-bf096f98fbaf', 'b8b6a765-bb58-40b3-8ee3-9d5eb600d216', 'https://detail.1688.com/offer/1064388358214.html', '[1688抓取] 工业配件 379c8d', 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158', '53.00', '73.00', '[{"name": "规格", "values": ["标准版"]}]', '{"name": "[1688抓取] 工业配件 379c8d", "price": 63.6, "mainImageUrl": "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158", "shortDescription": "自动抓取的商品简介内容，请根据需要修改。"}', 1, NULL, '请选择目标分类', '2026-07-26 09:20:37', '2026-07-26 09:55:17', 100, '73.00', '53.00', '1.00', '53.00', '2026-07-26 09:20:37', '2026-07-26 09:20:37', 'COMPLETED', 'DRAFT', 0, 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158', 1, '自动采集的商品详情，请运营补充图文与说明。', NULL, 'FAILED', NULL, 0, '标准版 / 默认规格', '1688工业配件', '1688 默认供应商', NULL, '10.14', '7.36', 500),
('38ccaf0a-b64a-4f9f-bde7-4adafe18f948', 'dcc195ff-e77f-4b3b-a67a-f3807987b124', 'b8b6a765-bb58-40b3-8ee3-9d5eb600d216', 'https://detail.1688.com/offer/1061058906651.html', '[1688抓取] 工业配件 38ccaf', 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158', '77.00', '97.00', '[{"name": "规格", "values": ["标准版"]}]', '{"name": "[1688抓取] 工业配件 38ccaf", "price": 92.4, "mainImageUrl": "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158", "shortDescription": "自动抓取的商品简介内容，请根据需要修改。"}', 1, NULL, '请选择目标分类', '2026-07-25 07:05:17', '2026-07-26 09:53:16', 100, '97.00', '77.00', '1.00', '77.00', '2026-07-25 07:05:18', '2026-07-25 07:05:18', 'COMPLETED', 'DRAFT', 0, 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158', 1, '自动采集的商品详情，请运营补充图文与说明。', NULL, 'FAILED', NULL, 0, '标准版 / 默认规格', '1688工业配件', '1688 默认供应商', NULL, '13.47', '10.69', 500),
('3f3ac8f5-ba19-4e33-bacd-810c0ac92586', '8e8d16db-b99b-4e01-9e29-0514f7a5fcdb', 'b8b6a765-bb58-40b3-8ee3-9d5eb600d216', 'https://detail.1688.com/offer/803456789012.html', '灯芯绒翻领夹克衫男士 秋季休闲薄款外套 青年潮流', 'https://www.autocoder.cc/background/zaki_prod/generated/fd01309470234981af435c32d41424fc.png', '45.00', '50.00', '[{"name": "颜色", "values": ["焦糖色", "深棕色", "米白色"]}, {"name": "尺码", "values": ["M", "L", "XL", "2XL"]}]', '{"name": "灯芯绒翻领夹克衫男士 秋季休闲薄款外套 青年潮流", "price": 75, "categoryId": null, "mainImageUrl": "https://www.autocoder.cc/background/zaki_prod/generated/20be04587bb34a379f3850ccb5ec9ce0.png", "shortDescription": "精选细坑条灯芯绒面料，质地柔软，光泽复古；简约翻领设计，百搭不挑人；宽松落肩版型，包容各种身材，轻松打造日系文艺复古穿搭风格。"}', 0, NULL, '仅可发布采集完成的商品', '2026-07-03 08:25:18', '2026-07-26 09:53:16', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'PENDING', NULL, 0, NULL, NULL, NULL, NULL, 'FAILED', NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
('44fff2cb-8d49-455f-b370-55c0329d2f7d', '7cb4c4cc-530e-4f2d-bb07-bd82c484b396', 'b8b6a765-bb58-40b3-8ee3-9d5eb600d216', 'https://detail.1688.com/offer/903456789012.html', '极简防盗刷铝合金卡包 RFID屏蔽名片盒 创意信用卡夹', 'https://www.autocoder.cc/background/zaki_prod/generated/7c80512eaee942df8ff2d71262d6fb2c.png', '18.00', '20.00', '[{"name": "颜色", "values": ["拉丝黑", "太空银", "玫瑰金"]}]', '{"name": "极简防盗刷铝合金卡包 RFID屏蔽名片盒 创意信用卡夹", "price": 36, "categoryId": null, "mainImageUrl": "https://www.autocoder.cc/background/zaki_prod/generated/c9995b733f634814adb24f9ee73da0fb.png", "shortDescription": "采用航空级铝合金材质，坚固防压；内置RFID屏蔽层，有效防止NFC设备恶意读取信用卡信息；一键式弹出设计，取卡便捷，可容纳6张标准卡片。"}', 1, NULL, '仅可发布采集完成的商品', '2026-06-23 08:25:18', '2026-07-26 09:53:16', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'PENDING', NULL, 0, NULL, NULL, NULL, NULL, 'FAILED', NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
('6989e0c8-4695-4164-9916-fbd05b4b7507', 'c17d9072-6fd7-4299-a412-a274be2b8b56', 'b8b6a765-bb58-40b3-8ee3-9d5eb600d216', 'https://detail.1688.com/offer/1064388358214.html', '[1688抓取] 工业配件 6989e0', 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158', '60.00', '80.00', '[{"name": "规格", "values": ["标准版"]}]', '{"name": "[1688抓取] 工业配件 6989e0", "price": 60.6, "categoryId": "502e355a-0794-46ac-85d4-56616929ebb0", "mainImageUrl": "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158", "shortDescription": "自动抓取的商品简介内容，请根据需要修改。"}', 1, 'd8785e59-63fb-4e1b-9a13-fff1e618ccae', NULL, '2026-07-26 09:19:08', '2026-07-26 09:52:53', 100, '80.00', '60.00', '1.00', '60.00', '2026-07-26 09:19:08', '2026-07-26 09:19:08', 'COMPLETED', 'DRAFT', 1, 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158', 1, '自动采集的商品详情，请运营补充图文与说明。', NULL, 'COMPLETED', '2026-07-26 09:52:53', 0, '标准版 / 默认规格', '1688工业配件', '1688 默认供应商', '502e355a-0794-46ac-85d4-56616929ebb0', '11.11', '8.33', 500),
('6de8be05-36f3-42fe-8e7c-5c7a9892d2ed', 'a52a9e9f-9f57-4feb-9e9d-7427ddc6b3c5', 'b8b6a765-bb58-40b3-8ee3-9d5eb600d216', 'https://detail.1688.com/offer/1061058906651.html?src=zhanwai&pid=302041_0000&ptid=&exp=enquiry%3AB%3BqueryMobilePhone%3AA%3Bxlyx%3AB&_force_exp_buckets_=11803%2C2024061701%2C2024011602&spm=a2638t.b_30496503.szyx_offer_list.3.44b2436cBn60of&cosite=baidujj_pz&ilike_session=8e9483d80253473c9a22e0caa1f89e28&tracelog=p4p&_p_isad=1&clickid=8e9483d80253473c9a22e0caa1f89e28&sessionid=f52a52fb5e54a7c8c73cf5662efe51f7&a=1353&e=q6HRQ4iR4n7zrrk0AjWQ.80TNDrQDIxA29p5eClkyQ6gacrHveDQFerk32YTL9f6Q5Fu50T7YzF-SLhTy8Yqe-lxv-X4ECd0LXqexl-XFIUAl6GQ3oEpmojwePwNoOFP-ua9Q.nzaWA9BGoV6QyMCm7csYpkDYNrA5h0HaZnaF4M18LM4Irdh9p9uYOGmnrMbiNKoN5HTi61JtTwAvN2GxEUdFy4Fy0WFCdHLF.ipb-rvBXuQdl4FA__&sk=sem&style=1', '[1688抓取] 工业配件 6de8be', 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158', '72.00', '92.00', '[{"name": "规格", "values": ["标准版"]}]', '{"name": "[1688抓取] 工业配件 6de8be", "price": 86.4, "mainImageUrl": "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158", "shortDescription": "自动抓取的商品简介内容，请根据需要修改。"}', 1, NULL, '请选择目标分类', '2026-07-25 07:07:42', '2026-07-26 09:53:16', 100, '92.00', '72.00', '1.00', '72.00', '2026-07-25 07:07:42', '2026-07-25 07:07:42', 'COMPLETED', 'DRAFT', 0, 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158', 1, '自动采集的商品详情，请运营补充图文与说明。', NULL, 'FAILED', NULL, 0, '标准版 / 默认规格', '1688工业配件', '1688 默认供应商', NULL, '12.78', '10.00', 500),
('7680daa7-2d58-4bb9-afbc-1a8c2329bfb1', '8e8d16db-b99b-4e01-9e29-0514f7a5fcdb', 'b8b6a765-bb58-40b3-8ee3-9d5eb600d216', 'https://detail.1688.com/offer/801234567890.html', '秋冬新款男士夹克 摇粒绒立领外套 休闲保暖防风衣', 'https://www.autocoder.cc/background/zaki_prod/generated/9885ad43b63f4394828af5dd0f915d91.png', '55.00', '65.00', '[{"name": "颜色", "values": ["藏青色", "军绿色", "卡其色"]}, {"name": "尺码", "values": ["M", "L", "XL", "2XL", "3XL"]}]', '{"name": "秋冬新款男士夹克 摇粒绒立领外套 休闲保暖防风衣", "price": 99, "categoryId": null, "mainImageUrl": "https://productp.s3.us-west-2.amazonaws.com/background/zaki_test/generated/f9def8d4e6064af3b4b18f6639b6ace1.png", "shortDescription": "采用高密度防风面料，内里复合细密摇粒绒，锁温保暖效果极佳；经典立领设计，修身版型，穿着挺括有型，适合秋冬季日常通勤与户外休闲穿着。"}', 1, NULL, '仅可发布采集完成的商品', '2026-07-01 08:25:18', '2026-07-26 09:53:16', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'PENDING', NULL, 0, NULL, NULL, NULL, NULL, 'FAILED', NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
('79431a2c-8acd-413b-b5be-c14de6d01a93', 'a70f40bd-de1d-4a0a-80c9-e9371e8be7b3', 'b8b6a765-bb58-40b3-8ee3-9d5eb600d216', 'https://detail.1688.com/offer/703456789012.html', 'PD20W快充头 Type-C迷你充电器 适用苹果安卓', 'https://www.autocoder.cc/background/zaki_prod/generated/cd5bf47ee1d04c5bb1044e6f03c2f5e1.png', '12.00', '15.00', '[{"name": "插头规格", "values": ["国标", "美规", "欧规"]}, {"name": "颜色", "values": ["白色", "黑色"]}]', '{"name": "PD20W快充头 Type-C迷你充电器 适用苹果安卓", "price": 19.5, "categoryId": null, "mainImageUrl": "https://www.autocoder.cc/background/zaki_prod/generated/0533c3dff1344577aba5497c5c98528c.png", "shortDescription": "PD 20W大功率快充，30分钟可充至60%电量；体积小巧便携，折叠插脚设计，不占插座空间；内置多重安全防护芯片，过流、过压、短路保护，充电更安心。"}', 1, NULL, '仅可发布采集完成的商品', '2026-07-10 08:25:18', '2026-07-26 09:55:51', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'PENDING', NULL, 0, NULL, NULL, NULL, NULL, 'FAILED', NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
('849f0b83-d923-40f7-8372-ae86d8fd3988', '13d21f88-02e5-4658-ba2e-de1b82e9f86a', 'b8b6a765-bb58-40b3-8ee3-9d5eb600d216', 'https://detail.1688.com/offer/971683800696.html', '[1688抓取] 工业配件 849f0b', 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158', '79.00', '99.00', '[{"name": "规格", "values": ["标准版"]}]', '{"name": "[1688抓取] 工业配件 849f0b", "price": 94.8, "categoryId": "502e355a-0794-46ac-85d4-56616929ebb0", "mainImageUrl": "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158", "shortDescription": "自动抓取的商品简介内容，请根据需要修改。"}', 1, '3116144e-a24f-482b-a9c5-7c52098c6494', NULL, '2026-07-13 13:22:21', '2026-07-13 13:22:25', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'COMPLETED', NULL, 1, NULL, NULL, NULL, NULL, 'COMPLETED', '2026-07-13 14:14:55', 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
('86c50180-a5dd-4674-b46d-f300d06beb92', '0df45162-8a5a-4220-a9b9-e620f8315934', 'b8b6a765-bb58-40b3-8ee3-9d5eb600d216', 'https://detail.1688.com/offer/100345678901.html', '便携式挂脖小风扇 USB充电迷你无叶风扇 户外运动降温神器', 'https://productp.s3.us-west-2.amazonaws.com/background/zaki_dev/generated/c5a36a156b0b4b568180d34ea330913e.png', '18.50', '25.00', '[{"name": "颜色", "values": ["珍珠白", "樱花粉", "薄荷绿"]}, {"name": "电池容量", "values": ["2000mAh", "4000mAh"]}]', '{"name": "便携式挂脖小风扇 USB充电迷你无叶风扇 户外运动降温神器", "price": 35, "categoryId": null, "mainImageUrl": "https://www.autocoder.cc/background/zaki_prod/generated/2e8ecdd6a7c54e629c960b7106434023.png", "shortDescription": "全新无叶设计，防绞发更安全；双涡轮强劲聚风，三档风力调节，瞬间带来全方位清凉体验；人体工学U型颈托，佩戴舒适无负担；大容量电池，长效续航。"}', 0, NULL, '仅可发布采集完成的商品', '2026-07-08 08:25:18', '2026-07-26 09:53:16', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'PENDING', NULL, 0, NULL, NULL, NULL, NULL, 'FAILED', NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
('915bf8a4-a1b2-4948-95ea-4770044709fc', '7cb4c4cc-530e-4f2d-bb07-bd82c484b396', 'b8b6a765-bb58-40b3-8ee3-9d5eb600d216', 'https://detail.1688.com/offer/902345678901.html', '男士商务真皮皮带 自动扣牛皮腰带 青年百搭裤带', 'https://productp.s3.us-west-2.amazonaws.com/background/zaki_test/generated/38b984a69f434ea992573de79bf71568.png', '22.00', '28.00', '[{"name": "扣头样式", "values": ["枪色方扣", "金色圆扣", "银色拉丝"]}, {"name": "长度", "values": ["110cm", "115cm", "120cm", "125cm"]}]', '{"name": "男士商务真皮皮带 自动扣牛皮腰带 青年百搭裤带", "price": 49, "categoryId": null, "mainImageUrl": "https://www.autocoder.cc/background/zaki_prod/generated/8c53ea1749ef47b69d59d1009a018b3d.png", "shortDescription": "合金自动扣头，坚固耐磨不褪色，齿槽咬合紧密；带身选用二层牛皮材质，柔韧耐折，纹理清晰自然；简约商务风格，适合搭配西装或休闲长裤。"}', 0, NULL, '仅可发布采集完成的商品', '2026-06-23 08:25:18', '2026-07-26 09:53:16', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'PENDING', NULL, 0, NULL, NULL, NULL, NULL, 'FAILED', NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
('9e1b972b-d7c8-4c89-8d9f-7c300d52fa0c', '78332851-3a6c-42f8-98e3-e7016e966225', 'b8b6a765-bb58-40b3-8ee3-9d5eb600d216', 'https://detail.1688.com/offer/1061058906651.html', '[1688抓取] 工业配件 9e1b97', 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158', '76.00', '96.00', '[{"name": "规格", "values": ["标准版"]}]', '{"name": "[1688抓取] 工业配件 9e1b97", "price": 91.2, "categoryId": "e3338bf2-94c7-4347-96d7-1ac4ad689625", "mainImageUrl": "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158", "shortDescription": "自动抓取的商品简介内容，请根据需要修改。"}', 1, 'be89d938-f456-4dd0-a024-5aada52a88ba', NULL, '2026-07-25 07:18:32', '2026-07-25 07:18:34', 100, '96.00', '76.00', '1.00', '76.00', '2026-07-25 07:18:32', '2026-07-25 07:18:32', 'COMPLETED', 'DRAFT', 1, 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158', 1, '自动采集的商品详情，请运营补充图文与说明。', NULL, 'COMPLETED', '2026-07-25 07:18:34', 0, '标准版 / 默认规格', '1688工业配件', '1688 默认供应商', 'e3338bf2-94c7-4347-96d7-1ac4ad689625', '13.33', '10.56', 500),
('a621dc3e-e993-43d5-8ab2-364d759c3119', 'ccbd7d16-b9d6-44dc-b291-39e2e327903f', 'b8b6a765-bb58-40b3-8ee3-9d5eb600d216', 'https://detail.1688.com/offer/1061055754494.html', '[1688抓取] 工业配件 a621dc', 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158', '96.00', '116.00', '[{"name": "规格", "values": ["标准版"]}]', '{"name": "[1688抓取] 工业配件 a621dc", "price": 96.96, "categoryId": "502e355a-0794-46ac-85d4-56616929ebb0", "mainImageUrl": "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158", "shortDescription": "自动抓取的商品简介内容，请根据需要修改。"}', 1, '4f5424e2-39fd-4834-9b2a-a6c9d75f71f5', NULL, '2026-07-26 09:51:03', '2026-07-26 09:52:53', 100, '116.00', '96.00', '1.00', '96.00', '2026-07-26 09:51:04', '2026-07-26 09:51:04', 'COMPLETED', 'DRAFT', 1, 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158', 1, '自动采集的商品详情，请运营补充图文与说明。', NULL, 'COMPLETED', '2026-07-26 09:52:53', 0, '标准版 / 默认规格', '1688工业配件', '1688 默认供应商', '502e355a-0794-46ac-85d4-56616929ebb0', '16.11', '13.33', 500),
('b01c53e5-a5aa-4aa7-a283-d8829eb26184', 'ac06e639-bd77-4c8b-a528-bdade12ba56a', 'b8b6a765-bb58-40b3-8ee3-9d5eb600d216', 'https://detail.1688.com/offer/1064388358214.html', '[1688抓取] 工业配件 b01c53', 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158', '70.00', '90.00', '[{"name": "规格", "values": ["标准版"]}]', '{"name": "[1688抓取] 工业配件 b01c53", "price": 84, "mainImageUrl": "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158", "shortDescription": "自动抓取的商品简介内容，请根据需要修改。"}', 1, NULL, NULL, '2026-07-26 10:01:57', '2026-07-26 10:01:57', 100, '90.00', '70.00', '1.00', '70.00', '2026-07-26 10:01:57', '2026-07-26 10:01:57', 'COMPLETED', 'DRAFT', 0, 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158', 1, '自动采集的商品详情，请运营补充图文与说明。', NULL, 'PENDING', NULL, 0, '标准版 / 默认规格', '1688工业配件', '1688 默认供应商', NULL, '12.50', '9.72', 500),
('beb807b8-5864-4b55-8a7d-762386db808d', '0df45162-8a5a-4220-a9b9-e620f8315934', 'b8b6a765-bb58-40b3-8ee3-9d5eb600d216', 'https://detail.1688.com/offer/100123456789.html', '夏季凉感冰丝夏凉被 空调被 可机洗双人薄被子', 'https://productp.s3.us-west-2.amazonaws.com/background/zaki_dev/generated/e980f421b1914690ad73c9a3d6955166.png', '35.00', '55.00', '[{"name": "花色", "values": ["北欧极简", "清新绿叶", "可爱萌宠"]}, {"name": "尺寸", "values": ["150x200cm", "180x220cm", "200x230cm"]}]', '{"name": "夏季凉感冰丝夏凉被 空调被 可机洗双人薄被子", "price": 65, "categoryId": null, "mainImageUrl": "https://www.autocoder.cc/background/zaki_prod/generated/d934a6b66e0b49b3aa070348c2ca9da9.png", "shortDescription": "接触瞬间凉感黑科技面料，能迅速导散体表热量，带来整夜清凉睡眠；整张羽丝棉填充，轻盈透气不压身；支持水洗机洗，不变形不结团，清洁打理更方便。"}', 0, NULL, '仅可发布采集完成的商品', '2026-07-07 08:25:18', '2026-07-26 09:53:16', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'PENDING', NULL, 0, NULL, NULL, NULL, NULL, 'FAILED', NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
('c61d8ac6-b111-4a74-b3c3-b613bec47d0f', '439e9f09-13bc-499f-9248-9f1847f8ea5c', 'b8b6a765-bb58-40b3-8ee3-9d5eb600d216', 'https://detail.1688.com/offer/1064388358214.html', '[1688抓取] 工业配件 c61d8a', 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158', '83.00', '103.00', '[{"name": "规格", "values": ["标准版"]}]', '{"name": "[1688抓取] 工业配件 c61d8a", "price": 83.83, "categoryId": "502e355a-0794-46ac-85d4-56616929ebb0", "mainImageUrl": "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158", "shortDescription": "自动抓取的商品简介内容，请根据需要修改。"}', 1, '9969ef14-d7b4-4542-bd6e-6566632b6640', NULL, '2026-07-26 09:18:57', '2026-07-26 09:52:53', 100, '103.00', '83.00', '1.00', '83.00', '2026-07-26 09:18:57', '2026-07-26 09:18:57', 'COMPLETED', 'DRAFT', 1, 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158', 1, '自动采集的商品详情，请运营补充图文与说明。', NULL, 'COMPLETED', '2026-07-26 09:52:53', 0, '标准版 / 默认规格', '1688工业配件', '1688 默认供应商', '502e355a-0794-46ac-85d4-56616929ebb0', '14.31', '11.53', 500),
('d90cb239-5262-44a4-a73c-93900301969a', '2eef1824-09a3-4a82-aedb-531bc56fed4e', 'b8b6a765-bb58-40b3-8ee3-9d5eb600d216', 'https://detail.1688.com/offer/1064388358214.html', '[1688抓取] 工业配件 d90cb2', 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158', '73.00', '93.00', '[{"name": "规格", "values": ["标准版"]}]', '{"name": "[1688抓取] 工业配件 d90cb2", "price": 87.6, "categoryId": "502e355a-0794-46ac-85d4-56616929ebb0", "mainImageUrl": "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158", "shortDescription": "自动抓取的商品简介内容，请根据需要修改。"}', 1, 'fb8b3f32-c9b5-45d9-ae65-e926a76aa005', NULL, '2026-07-26 09:20:48', '2026-07-26 09:52:53', 100, '93.00', '73.00', '1.00', '73.00', '2026-07-26 09:20:48', '2026-07-26 09:20:48', 'COMPLETED', 'DRAFT', 1, 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158', 1, '自动采集的商品详情，请运营补充图文与说明。', NULL, 'COMPLETED', '2026-07-26 09:52:53', 0, '标准版 / 默认规格', '1688工业配件', '1688 默认供应商', '502e355a-0794-46ac-85d4-56616929ebb0', '12.92', '10.14', 500),
('e7085e9a-36cd-497c-9b80-7b7bcd11b78a', '8e8d16db-b99b-4e01-9e29-0514f7a5fcdb', 'b8b6a765-bb58-40b3-8ee3-9d5eb600d216', 'https://detail.1688.com/offer/802345678901.html', '加厚羊羔绒牛仔外套男 冬季复古机车夹克 棉衣', 'https://productp.s3.us-west-2.amazonaws.com/background/zaki_test/generated/24deba598a124a2abd9e33a488209ef7.png', '85.00', '95.00', '[{"name": "颜色", "values": ["复古蓝", "烟灰黑"]}, {"name": "尺码", "values": ["L", "XL", "2XL", "3XL"]}]', '{"name": "加厚羊羔绒牛仔外套男 冬季复古机车夹克 棉衣", "price": 139, "categoryId": null, "mainImageUrl": "https://productp.s3.us-west-2.amazonaws.com/background/zaki_test/generated/d79bfc3e460d4eb084bcb8e0aa06bc16.png", "shortDescription": "优质水洗牛仔面料，耐磨抗风；内衬全面覆盖厚实羊羔绒，柔软亲肤，抵御严寒；重工金属纽扣，机车风格剪裁，彰显硬汉本色，冬季出街必备单品。"}', 1, NULL, '仅可发布采集完成的商品', '2026-07-02 08:25:18', '2026-07-26 09:53:16', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'PENDING', NULL, 0, NULL, NULL, NULL, NULL, 'FAILED', NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
('e80894b6-d13b-4b90-8257-8b9a74dacafa', '0df45162-8a5a-4220-a9b9-e620f8315934', 'b8b6a765-bb58-40b3-8ee3-9d5eb600d216', 'https://detail.1688.com/offer/100234567890.html', '驱蚊液电热蚊香液 无味婴儿孕妇可用 防蚊液补充装', 'https://www.autocoder.cc/background/zaki_prod/generated/ff5ce93d4dbd47e3b535cae6c298a928.png', '5.50', '15.00', '[{"name": "套餐类型", "values": ["单瓶装", "三瓶装", "三瓶+加热器"]}]', '{"name": "驱蚊液电热蚊香液 无味婴儿孕妇可用 防蚊液补充装", "price": 18, "categoryId": null, "mainImageUrl": "https://www.autocoder.cc/background/zaki_prod/generated/97222d9a1b554d3dab558a08ccd995a6.png", "shortDescription": "温和驱蚊配方，无烟无灰无刺鼻气味，专为母婴人群研发；采用优质芯棒，挥发均匀稳定，单瓶可持续使用约40晚；有效驱赶各类蚊虫，守护全家安稳睡眠。"}', 0, NULL, '仅可发布采集完成的商品', '2026-07-07 08:25:18', '2026-07-26 09:53:16', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'PENDING', NULL, 0, NULL, NULL, NULL, NULL, 'FAILED', NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
('eedad290-853d-496d-90ec-9d5384892340', 'a70f40bd-de1d-4a0a-80c9-e9371e8be7b3', 'b8b6a765-bb58-40b3-8ee3-9d5eb600d216', 'https://detail.1688.com/offer/702345678901.html', '适用苹果15手机壳 磁吸透明防摔保护套', 'https://productp.s3.us-west-2.amazonaws.com/background/zaki_test/generated/8676e649c07e464abbaa559d273c0bc1.png', '8.80', '12.50', '[{"name": "适用型号", "values": ["iPhone 15", "iPhone 15 Pro", "iPhone 15 Pro Max"]}, {"name": "款式", "values": ["超清透明", "磨砂黑"]}]', '{"name": "适用苹果15手机壳 磁吸透明防摔保护套", "price": 16.5, "categoryId": null, "mainImageUrl": "https://www.autocoder.cc/background/zaki_prod/generated/8a6059b8340d4252b30de2c47e162980.png", "shortDescription": "高透光率PC背板，还原裸机色彩；边框采用高弹力TPU材质，四角气囊防摔设计，全面保护手机。支持Magsafe磁吸充电，精准对孔，手感舒适。"}', 0, NULL, '仅可发布采集完成的商品', '2026-07-09 08:25:18', '2026-07-26 09:53:16', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'PENDING', NULL, 0, NULL, NULL, NULL, NULL, 'FAILED', NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
('f1850ec1-5d56-477c-b6ba-1caa339f5ecc', '5c29ff93-2734-43fc-9380-e22ae1475be7', 'b8b6a765-bb58-40b3-8ee3-9d5eb600d216', 'https://detail.1688.com/offer/1061058906651.html', '[1688抓取] 工业配件 f1850e', 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158', '58.00', '78.00', '[{"name": "规格", "values": ["标准版"]}]', '{"name": "[1688抓取] 工业配件 f1850e", "price": 58.58, "categoryId": "502e355a-0794-46ac-85d4-56616929ebb0", "mainImageUrl": "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158", "shortDescription": "自动抓取的商品简介内容，请根据需要修改。"}', 1, '09556e62-0589-4917-9b28-4a6fe52558d8', NULL, '2026-07-25 07:19:05', '2026-07-26 09:52:53', 100, '78.00', '58.00', '1.00', '58.00', '2026-07-25 07:19:05', '2026-07-25 07:19:05', 'COMPLETED', 'DRAFT', 1, 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158', 1, '自动采集的商品详情，请运营补充图文与说明。', NULL, 'COMPLETED', '2026-07-26 09:52:53', 0, '标准版 / 默认规格', '1688工业配件', '1688 默认供应商', '502e355a-0794-46ac-85d4-56616929ebb0', '10.83', '8.06', 500),
('fd11418c-2dd6-47a1-8ebf-b9c7a50078dd', '7cb4c4cc-530e-4f2d-bb07-bd82c484b396', 'b8b6a765-bb58-40b3-8ee3-9d5eb600d216', 'https://detail.1688.com/offer/901234567890.html', '头层牛皮男士短款钱包 真皮横款钱夹 多卡位驾驶证套', 'https://productp.s3.us-west-2.amazonaws.com/background/zaki_pre/generated/78e928aacf374059a68f1094b6730a8f.png', '28.00', '35.00', '[{"name": "颜色", "values": ["经典黑", "咖啡色", "复古棕"]}, {"name": "款式", "values": ["横款", "竖款"]}]', '{"name": "头层牛皮男士短款钱包 真皮横款钱夹 多卡位驾驶证套", "price": 58, "categoryId": null, "mainImageUrl": "https://productp.s3.us-west-2.amazonaws.com/background/zaki_test/generated/a7707e8d3a69436282b067406ceb2be7.png", "shortDescription": "甄选优质头层牛皮，皮面细腻光泽，手感柔软舒适；科学合理的内部空间划分，包含大钞位、多个银行卡位及独立相片位，满足日常出行收纳需求。"}', 0, NULL, '仅可发布采集完成的商品', '2026-06-22 08:25:18', '2026-07-26 09:53:16', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'PENDING', NULL, 0, NULL, NULL, NULL, NULL, 'FAILED', NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

-- Table structure for `keywordgroup`
DROP TABLE IF EXISTS `keywordgroup`;
CREATE TABLE `keywordgroup` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(120) COLLATE utf8mb4_unicode_ci NOT NULL,
  `slug` varchar(120) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `groupType` enum('BRAND','NEW_ARRIVAL','PROMOTION','GENERAL') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'GENERAL',
  `parentGroupId` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `sortWeight` int NOT NULL DEFAULT '0',
  `isActive` tinyint(1) NOT NULL DEFAULT '1',
  `description` text COLLATE utf8mb4_unicode_ci,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `sceneKey` varchar(160) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `sceneType` varchar(80) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `sceneArea` enum('LEFT_NAV','RECOMMENDATION','BOTH') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'RECOMMENDATION',
  `floorIcon` varchar(160) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `floorLink` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `floorTitle` varchar(160) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `homepageSortWeight` int NOT NULL DEFAULT '0',
  `showOnHomepage` tinyint(1) NOT NULL DEFAULT '0',
  `sceneSlotKey` varchar(160) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `sceneSlotName` varchar(120) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `keywordgroup_groupType_idx` (`groupType`),
  KEY `keywordgroup_parentGroupId_idx` (`parentGroupId`),
  KEY `keywordgroup_isActive_idx` (`isActive`),
  KEY `keywordgroup_sceneKey_idx` (`sceneKey`),
  KEY `keywordgroup_sceneType_idx` (`sceneType`),
  KEY `keywordgroup_sceneArea_idx` (`sceneArea`),
  KEY `keywordgroup_showOnHomepage_idx` (`showOnHomepage`),
  KEY `keywordgroup_homepageSortWeight_idx` (`homepageSortWeight`),
  KEY `keywordgroup_sceneSlotKey_idx` (`sceneSlotKey`),
  CONSTRAINT `keywordgroup_parentGroupId_fkey` FOREIGN KEY (`parentGroupId`) REFERENCES `keywordgroup` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Data for table `keywordgroup`
INSERT INTO `keywordgroup` (`id`, `name`, `slug`, `groupType`, `parentGroupId`, `sortWeight`, `isActive`, `description`, `createdAt`, `updatedAt`, `sceneKey`, `sceneType`, `sceneArea`, `floorIcon`, `floorLink`, `floorTitle`, `homepageSortWeight`, `showOnHomepage`, `sceneSlotKey`, `sceneSlotName`) VALUES
('kg-brand-root', '品牌类', 'brand', 'BRAND', NULL, 100, 1, '品牌关键词总分组', '2026-07-12 08:32:30', '2026-07-14 11:55:47', NULL, NULL, 'RECOMMENDATION', 'Gem', '/productcategory', '品牌精选', 100, 1, NULL, NULL),
('kg-new-root', '当日上新类', 'new-arrival', 'NEW_ARRIVAL', NULL, 90, 1, '当日上新关键词分组', '2026-07-12 08:32:30', '2026-07-12 08:32:30', NULL, NULL, 'RECOMMENDATION', 'Sparkles', '/productcategory', '今日上新', 300, 1, NULL, NULL),
('kg-promo-flash', '限时促销', 'flash-sale', 'PROMOTION', 'kg-promo-root', 50, 1, '限时促销二级分组', '2026-07-12 08:32:30', '2026-07-12 08:32:30', NULL, NULL, 'RECOMMENDATION', 'Clock3', '/productcategory', '限时抢购', 100, 1, NULL, NULL),
('kg-promo-root', '促销类', 'promotion', 'PROMOTION', NULL, 80, 1, '促销关键词分组', '2026-07-12 08:32:30', '2026-07-12 08:32:30', NULL, NULL, 'RECOMMENDATION', 'Flame', '/productcategory', '促销专区', 200, 1, NULL, NULL);

-- Table structure for `keywordgroupproduct`
DROP TABLE IF EXISTS `keywordgroupproduct`;
CREATE TABLE `keywordgroupproduct` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `keywordGroupId` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `productId` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `sortWeight` int NOT NULL DEFAULT '0',
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `keywordgroupproduct_keywordGroupId_productId_key` (`keywordGroupId`,`productId`),
  KEY `keywordgroupproduct_keywordGroupId_idx` (`keywordGroupId`),
  KEY `keywordgroupproduct_productId_idx` (`productId`),
  KEY `keywordgroupproduct_sortWeight_idx` (`sortWeight`),
  CONSTRAINT `keywordgroupproduct_keywordGroupId_fkey` FOREIGN KEY (`keywordGroupId`) REFERENCES `keywordgroup` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `keywordgroupproduct_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `product` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Data for table `keywordgroupproduct`
-- Table structure for `keyworditem`
DROP TABLE IF EXISTS `keyworditem`;
CREATE TABLE `keyworditem` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `groupId` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `parentKeywordId` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `keyword` varchar(160) COLLATE utf8mb4_unicode_ci NOT NULL,
  `normalizedKeyword` varchar(160) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `sortWeight` int NOT NULL DEFAULT '0',
  `isActive` tinyint(1) NOT NULL DEFAULT '1',
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `keyworditem_groupId_idx` (`groupId`),
  KEY `keyworditem_parentKeywordId_idx` (`parentKeywordId`),
  KEY `keyworditem_normalizedKeyword_idx` (`normalizedKeyword`),
  KEY `keyworditem_isActive_idx` (`isActive`),
  CONSTRAINT `keyworditem_groupId_fkey` FOREIGN KEY (`groupId`) REFERENCES `keywordgroup` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `keyworditem_parentKeywordId_fkey` FOREIGN KEY (`parentKeywordId`) REFERENCES `keyworditem` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Data for table `keyworditem`
INSERT INTO `keyworditem` (`id`, `groupId`, `parentKeywordId`, `keyword`, `normalizedKeyword`, `sortWeight`, `isActive`, `createdAt`, `updatedAt`) VALUES
('743131fa-c6f2-423d-87a3-024c4defcd11', 'kg-brand-root', NULL, 'DIOR', 'dior', 0, 1, '2026-07-14 11:41:21', '2026-07-14 11:41:21'),
('77e7eebd-5ef4-445f-9ba4-56ee545044a0', 'kg-promo-root', NULL, 'DIOR', 'dior', 0, 1, '2026-07-14 11:40:11', '2026-07-14 11:40:11'),
('7ee99bf4-39a2-4e8a-a4ed-5187a5c3b8ec', 'kg-brand-root', NULL, 'ADW2', 'adw2', 0, 1, '2026-07-14 11:41:21', '2026-07-14 11:41:21'),
('ebfdf741-e351-4362-9861-2d943aa24d08', 'kg-brand-root', NULL, 'LV', 'lv', 1, 1, '2026-07-14 11:33:32', '2026-07-14 11:41:21'),
('ki-new-today', 'kg-new-root', NULL, '今日上新', 'today new', 92, 1, '2026-07-12 08:32:30', '2026-07-12 08:32:30'),
('ki-promo-summer', 'kg-promo-flash', NULL, 'Summer Sale', 'summer sale', 86, 1, '2026-07-12 08:32:30', '2026-07-12 08:32:30');

-- Table structure for `lookbook`
DROP TABLE IF EXISTS `lookbook`;
CREATE TABLE `lookbook` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `title` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `subtitle` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `imageUrl` varchar(700) COLLATE utf8mb4_unicode_ci NOT NULL,
  `videoUrl` varchar(700) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `isActive` tinyint(1) NOT NULL DEFAULT '1',
  `sortWeight` int NOT NULL DEFAULT '0',
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Data for table `lookbook`
-- Table structure for `lookbookproduct`
DROP TABLE IF EXISTS `lookbookproduct`;
CREATE TABLE `lookbookproduct` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `lookbookId` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `productId` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `hotspotJson` json DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `lookbookproduct_lookbookId_productId_key` (`lookbookId`,`productId`),
  KEY `lookbookproduct_lookbookId_idx` (`lookbookId`),
  KEY `lookbookproduct_productId_idx` (`productId`),
  CONSTRAINT `lookbookproduct_lookbookId_fkey` FOREIGN KEY (`lookbookId`) REFERENCES `lookbook` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `lookbookproduct_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `product` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Data for table `lookbookproduct`
-- Table structure for `orderitem`
DROP TABLE IF EXISTS `orderitem`;
CREATE TABLE `orderitem` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `orderId` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `productId` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `productSkuId` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `productName` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `skuCode` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `materialLabel` varchar(60) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `sizeLabel` varchar(60) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `engravingText` varchar(120) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `engravingFont` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `quantity` int NOT NULL DEFAULT '1',
  `unitPrice` decimal(10,2) NOT NULL,
  `lineAmount` decimal(10,2) NOT NULL,
  `giftWrapSelected` tinyint(1) NOT NULL DEFAULT '0',
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `orderitem_orderId_idx` (`orderId`),
  KEY `orderitem_productId_idx` (`productId`),
  KEY `orderitem_productSkuId_idx` (`productSkuId`),
  CONSTRAINT `orderitem_orderId_fkey` FOREIGN KEY (`orderId`) REFERENCES `orderrecord` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `orderitem_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `product` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `orderitem_productSkuId_fkey` FOREIGN KEY (`productSkuId`) REFERENCES `productsku` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Data for table `orderitem`
-- Table structure for `orderlogisticssegment`
DROP TABLE IF EXISTS `orderlogisticssegment`;
CREATE TABLE `orderlogisticssegment` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `orderId` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `segmentType` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `carrierName` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `trackingNumber` varchar(120) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `statusLabel` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `estimatedArrivalAt` datetime(3) DEFAULT NULL,
  `shippedAt` datetime(3) DEFAULT NULL,
  `remark` text COLLATE utf8mb4_unicode_ci,
  `timelineJson` json DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `orderlogisticssegment_orderId_idx` (`orderId`),
  CONSTRAINT `orderlogisticssegment_orderId_fkey` FOREIGN KEY (`orderId`) REFERENCES `orderrecord` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Data for table `orderlogisticssegment`
-- Table structure for `orderoperationlog`
DROP TABLE IF EXISTS `orderoperationlog`;
CREATE TABLE `orderoperationlog` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `orderId` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `actionType` varchar(60) COLLATE utf8mb4_unicode_ci NOT NULL,
  `actionNote` text COLLATE utf8mb4_unicode_ci,
  `operatorName` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `orderoperationlog_orderId_idx` (`orderId`),
  CONSTRAINT `orderoperationlog_orderId_fkey` FOREIGN KEY (`orderId`) REFERENCES `orderrecord` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Data for table `orderoperationlog`
-- Table structure for `orderrecord`
DROP TABLE IF EXISTS `orderrecord`;
CREATE TABLE `orderrecord` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `orderNo` varchar(60) COLLATE utf8mb4_unicode_ci NOT NULL,
  `userId` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `addressId` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` enum('PENDING_PAYMENT','PAID','PROCESSING','SHIPPED','DELIVERED','CANCELLED','REFUNDED') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'PENDING_PAYMENT',
  `currencyCode` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL,
  `localeCode` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `subtotalAmount` decimal(10,2) NOT NULL,
  `discountAmount` decimal(10,2) NOT NULL DEFAULT '0.00',
  `shippingAmount` decimal(10,2) NOT NULL DEFAULT '0.00',
  `giftWrapAmount` decimal(10,2) NOT NULL DEFAULT '0.00',
  `totalAmount` decimal(10,2) NOT NULL,
  `paymentMethod` enum('PAYPAL','BANK_TRANSFER','STRIPE','CREDIT_CARD') COLLATE utf8mb4_unicode_ci NOT NULL,
  `installmentInfo` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `couponId` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `shipMethod` enum('STANDARD','EXPRESS') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'STANDARD',
  `trackingCarrier` varchar(60) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `trackingNumber` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `estimatedArrivalAt` datetime(3) DEFAULT NULL,
  `giftMessage` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `note` text COLLATE utf8mb4_unicode_ci,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `internalNote` text COLLATE utf8mb4_unicode_ci,
  `paymentStatus` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `shippedAt` datetime(3) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `orderrecord_orderNo_key` (`orderNo`),
  KEY `orderrecord_userId_idx` (`userId`),
  KEY `orderrecord_status_idx` (`status`),
  KEY `orderrecord_addressId_fkey` (`addressId`),
  KEY `orderrecord_couponId_fkey` (`couponId`),
  CONSTRAINT `orderrecord_addressId_fkey` FOREIGN KEY (`addressId`) REFERENCES `useraddress` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `orderrecord_couponId_fkey` FOREIGN KEY (`couponId`) REFERENCES `promotioncampaign` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `orderrecord_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `sysuser` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Data for table `orderrecord`
-- Table structure for `product`
DROP TABLE IF EXISTS `product`;
CREATE TABLE `product` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `categoryId` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `slug` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `productCode` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `source` enum('MANUAL','IMPORT_1688','TABLE_IMPORT') COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` enum('DRAFT','ACTIVE','INACTIVE','OUT_OF_STOCK','PREORDER') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'DRAFT',
  `mainImageUrl` varchar(700) COLLATE utf8mb4_unicode_ci NOT NULL,
  `galleryJson` json NOT NULL,
  `shortDescription` text COLLATE utf8mb4_unicode_ci,
  `sellingPointsJson` json DEFAULT NULL,
  `detailContentJson` json DEFAULT NULL,
  `parameterJson` json DEFAULT NULL,
  `tradeInfoJson` json DEFAULT NULL,
  `faqJson` json DEFAULT NULL,
  `ratingAverage` double NOT NULL DEFAULT '0',
  `ratingCount` int NOT NULL DEFAULT '0',
  `sortWeight` int NOT NULL DEFAULT '0',
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `brandName` varchar(120) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `careGuideJson` json DEFAULT NULL,
  `certificateInfo` text COLLATE utf8mb4_unicode_ci,
  `designStory` text COLLATE utf8mb4_unicode_ci,
  `engravingPreviewBaseUrl` varchar(700) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `gemstoneType` enum('DIAMOND','ZIRCON','PEARL','COLOR_GEM','NONE') COLLATE utf8mb4_unicode_ci DEFAULT 'NONE',
  `hoverImageUrl` varchar(700) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `isBestSeller` tinyint(1) NOT NULL DEFAULT '0',
  `isNewArrival` tinyint(1) NOT NULL DEFAULT '0',
  `materialType` enum('GOLD_14K','GOLD_18K','SILVER_925','GOLD_PLATED','ROSE_GOLD','WHITE_GOLD','PEARL','GEMSTONE') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `metalPurity` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `packagingImageUrl` varchar(700) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `platingProcess` varchar(120) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `productType` enum('RING','NECKLACE','EARRING','BRACELET','ANKLET','SET','MENS_JEWELRY','GIFT_BOX','CUSTOM_ENGRAVING') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'RING',
  `rotate360Json` json DEFAULT NULL,
  `sizeGuideJson` json DEFAULT NULL,
  `soldCount` int NOT NULL DEFAULT '0',
  `totalCarat` decimal(8,2) DEFAULT NULL,
  `videoUrl` varchar(700) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `wearImageUrl` varchar(700) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `weightGram` decimal(8,2) DEFAULT NULL,
  `detailText` text COLLATE utf8mb4_unicode_ci,
  `goodsStatus` varchar(60) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `priceCoefficient` decimal(6,2) DEFAULT NULL,
  `costPrice` decimal(10,2) DEFAULT NULL,
  `supplierName` varchar(160) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `detailTranslationsJson` json DEFAULT NULL,
  `isLimitedDiscount` tinyint(1) NOT NULL DEFAULT '0',
  `translationsJson` json DEFAULT NULL,
  `autoBrandMatched` tinyint(1) NOT NULL DEFAULT '0',
  `brandCategoryId` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `brandMatchKeyword` varchar(120) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `product_slug_key` (`slug`),
  UNIQUE KEY `product_productCode_key` (`productCode`),
  KEY `product_categoryId_idx` (`categoryId`),
  KEY `product_status_idx` (`status`),
  KEY `product_productType_idx` (`productType`),
  KEY `product_materialType_idx` (`materialType`),
  KEY `product_gemstoneType_idx` (`gemstoneType`),
  KEY `product_goodsStatus_idx` (`goodsStatus`),
  KEY `product_brandCategoryId_idx` (`brandCategoryId`),
  KEY `product_brandName_idx` (`brandName`),
  CONSTRAINT `product_brandCategoryId_fkey` FOREIGN KEY (`brandCategoryId`) REFERENCES `category` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `product_categoryId_fkey` FOREIGN KEY (`categoryId`) REFERENCES `category` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Data for table `product`
INSERT INTO `product` (`id`, `categoryId`, `name`, `slug`, `productCode`, `source`, `status`, `mainImageUrl`, `galleryJson`, `shortDescription`, `sellingPointsJson`, `detailContentJson`, `parameterJson`, `tradeInfoJson`, `faqJson`, `ratingAverage`, `ratingCount`, `sortWeight`, `createdAt`, `updatedAt`, `brandName`, `careGuideJson`, `certificateInfo`, `designStory`, `engravingPreviewBaseUrl`, `gemstoneType`, `hoverImageUrl`, `isBestSeller`, `isNewArrival`, `materialType`, `metalPurity`, `packagingImageUrl`, `platingProcess`, `productType`, `rotate360Json`, `sizeGuideJson`, `soldCount`, `totalCarat`, `videoUrl`, `wearImageUrl`, `weightGram`, `detailText`, `goodsStatus`, `priceCoefficient`, `costPrice`, `supplierName`, `detailTranslationsJson`, `isLimitedDiscount`, `translationsJson`, `autoBrandMatched`, `brandCategoryId`, `brandMatchKeyword`) VALUES
('09556e62-0589-4917-9b28-4a6fe52558d8', '502e355a-0794-46ac-85d4-56616929ebb0', '[1688抓取] 工业配件 f1850e', 'p-1785059573864474', 'IMP-1785059573864474', 'IMPORT_1688', 'DRAFT', 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158', '[{"url": "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158", "sort": 1}]', '自动采集的商品详情，请运营补充图文与说明。｜1688 默认供应商｜1688工业配件', NULL, NULL, NULL, '{"minOrderQty": 1}', NULL, 0.0, 0, 0, '2026-07-26 09:52:53', '2026-07-26 09:52:53', NULL, NULL, NULL, NULL, NULL, 'NONE', NULL, 0, 0, NULL, NULL, NULL, NULL, 'RING', NULL, NULL, 0, NULL, NULL, NULL, '500.00', '自动采集的商品详情，请运营补充图文与说明。', NULL, '1.00', '58.00', '1688 默认供应商', NULL, 0, NULL, 0, NULL, NULL),
('0b67b39b-2b29-4976-a98d-520585b8bec4', '6eb7ccf8-52b9-4c46-a669-8ed78a2d6407', '人体工学高背网面办公椅', 'ergonomic-high-back-mesh-chair', 'P-1003', 'MANUAL', 'DRAFT', 'https://productp.s3.us-west-2.amazonaws.com/background/zaki_test/generated/221e81b0a04c42f8af610074f7074ef9.png', '[{"url": "https://productp.s3.us-west-2.amazonaws.com/background/zaki_test/generated/b2bd655a52cb4ce8b1bfbaf4a28a4a22.png", "sort": 1}, {"url": "https://productp.s3.us-west-2.amazonaws.com/background/zaki_test/generated/76c653ad12c946ae8c48620d22705ac9.png", "sort": 2}, {"url": "https://productp.s3.us-west-2.amazonaws.com/background/zaki_test/generated/cad71f2ce9ba46a6a1e60f21092cf486.png", "sort": 3}]', '专为久坐人群设计，提供全面背部与腰部支撑，透气网布材质，四季舒爽。', '[{"title": "护腰", "content": "自适应动态腰托"}, {"title": "透气", "content": "高弹力特网材质"}, {"title": "调节", "content": "多维度调节扶手"}, {"title": "底盘", "content": "线控防爆底盘"}]', '[{"type": "text", "title": "腰部支撑", "content": "独创的自适应腰托设计，随坐姿变化自动调节支撑力度，有效缓解腰部疲劳。"}, {"type": "image", "content": "https://productp.s3.us-west-2.amazonaws.com/background/zaki_dev/generated/d9316732b6294526b1201096a735461a.png"}, {"type": "text", "title": "午休神器", "content": "最大支持135度后仰锁定，配合隐藏式脚踏，瞬间化身舒适午休床。"}, {"type": "image", "content": "https://www.autocoder.cc/background/zaki_prod/generated/a53d7d63afc44a40b9d41ddc1b8fa34a.png"}]', '[{"group": "材质信息", "items": [{"key": "靠背材质", "value": "透气网布"}, {"key": "坐垫材质", "value": "高密度海绵/网布可选"}]}, {"group": "尺寸规格", "items": [{"key": "整体高度", "value": "115-125cm可调"}, {"key": "最大承重", "value": "150kg"}]}]', '{"shipFrom": "佛山, 中国", "minOrderQty": "1 件起订", "tradeNotice": "大件商品物流需自提或额外付费送货上门", "deliveryDays": 10, "shippingNote": "下单后72小时内发货", "supportedRegions": ["CN", "US", "EU"]}', '[{"answer": "不复杂，附赠详细说明书及安装工具，单人约15分钟即可完成组装。", "question": "安装复杂吗？"}, {"answer": "采用PU静音万向轮，顺滑且不伤地板。", "question": "轮子会刮花木地板吗？"}, {"answer": "各连接处均有降噪垫片，正常使用下不会产生异响。", "question": "异响严重吗？"}, {"answer": "选用进口高弹力特网，经过严格耐磨测试，不易破损塌陷。", "question": "网布容易破吗？"}]', 0.0, 0, 70, '2026-07-06 08:25:17', '2026-07-10 08:25:17', NULL, NULL, NULL, NULL, NULL, 'NONE', NULL, 0, 0, NULL, NULL, NULL, NULL, 'RING', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '0.00', '未填写供应商', NULL, 0, NULL, 0, NULL, NULL),
('13d75331-7ab2-45dd-a585-6f9718cd4823', '1ff00246-26a7-4a5e-a1d8-d1b999fcf57a', '益智拼装大颗粒积木 婴幼儿童玩具', 'educational-building-blocks-kids', 'SKU-T2024-01', 'MANUAL', 'ACTIVE', 'https://productp.s3.us-west-2.amazonaws.com/background/zaki_dev/generated/fa16c9e8efc74107a78f2160829d2417.png', '[{"url": "https://www.autocoder.cc/background/zaki_prod/generated/72d8482099ed441c93168aae01bc3004.png", "sort": 1}, {"url": "https://www.autocoder.cc/background/zaki_prod/generated/cef27cc4ab1a45618c89db6ba9f34e8b.png", "sort": 2}, {"url": "https://www.autocoder.cc/background/zaki_prod/generated/2333e78762fc47028d00fcf309f7d886.png", "sort": 3}]', '专为低龄宝宝设计的大颗粒积木，防吞咽更安全；色彩鲜艳，激发宝宝想象力与动手能力。', '[{"title": "安全", "content": "大颗粒防吞咽"}, {"title": "材质", "content": "环保ABS无毒无味"}, {"title": "益智", "content": "锻炼手眼协调"}, {"title": "创意", "content": "百变造型随意拼"}]', '[{"type": "image", "content": "https://www.autocoder.cc/background/zaki_prod/generated/72d8482099ed441c93168aae01bc3004.png"}, {"type": "image", "content": "https://www.autocoder.cc/background/zaki_prod/generated/cef27cc4ab1a45618c89db6ba9f34e8b.png"}, {"type": "image", "content": "https://www.autocoder.cc/background/zaki_prod/generated/2333e78762fc47028d00fcf309f7d886.png"}]', '[{"group": "产品规格", "items": [{"key": "颗粒数", "value": "100PCS"}, {"key": "适用年龄", "value": "18个月及以上"}]}, {"group": "包装信息", "items": [{"key": "包装方式", "value": "收纳桶装"}, {"key": "材质", "value": "食品级ABS塑料"}]}]', '{"shipFrom": "澄海, 中国", "minOrderQty": "10 桶起订", "tradeNotice": "量大从优，欢迎咨询", "deliveryDays": 7, "shippingNote": "3天内发货", "supportedRegions": ["Global"]}', '[{"answer": "可以的，建议使用温水清洗，不可高温蒸煮。", "question": "积木可以水洗吗？"}, {"answer": "咬合紧密适中，既保证拼装稳固，又方便宝宝拆卸。", "question": "容易松动吗？"}, {"answer": "本产品为标准大颗粒尺寸，与市面上主流大颗粒积木均可兼容。", "question": "和某高兼容吗？"}, {"answer": "采用环保原料，打开包装绝对无任何异味。", "question": "有异味吗？"}]', 4.9, 380, 55, '2026-07-03 08:25:17', '2026-07-14 11:50:06', NULL, NULL, NULL, NULL, NULL, 'NONE', NULL, 0, 0, NULL, NULL, NULL, NULL, 'RING', NULL, NULL, 0, NULL, NULL, NULL, '5.00', NULL, 'ACTIVE', '1.50', '100.00', '未填写供应商', NULL, 0, NULL, 0, NULL, NULL),
('2a39932c-c927-4011-8715-a95b4fb4b574', '6eb7ccf8-52b9-4c46-a669-8ed78a2d6407', '智能恒温电热毛巾架 卫生间烘干架', 'smart-electric-towel-warmer', 'SKU-H2024-01', 'MANUAL', 'DRAFT', 'https://www.autocoder.cc/background/zaki_prod/generated/d055ee371d844f70a69d70c07546a9b0.png', '[{"url": "https://www.autocoder.cc/background/zaki_prod/generated/ed8550609abd4c40a62dfa31ea5f5780.png", "sort": 1}, {"url": "https://productp.s3.us-west-2.amazonaws.com/background/zaki_dev/generated/3a94cceb180b47a39c361c222ed24673.png", "sort": 2}, {"url": "https://www.autocoder.cc/background/zaki_prod/generated/c6e94d39a79647b1960c9f98cd9ce051.png", "sort": 3}]', '告别潮湿霉味，碳纤维干式发热，快速烘干衣物毛巾；支持手机APP远程操控，杀菌除螨，提升卫浴体验。', '[{"title": "发热", "content": "碳纤维干加热"}, {"title": "智能", "content": "WIFI智联APP控制"}, {"title": "杀菌", "content": "55度恒温抑菌"}, {"title": "防水", "content": "IPX4级整机防水"}]', '[{"type": "text", "title": "恒温科技", "content": "内置智能温控芯片，精准控制表面温度在50-55度之间，烘干不伤衣物，触碰不烫手。"}, {"type": "image", "content": "https://www.autocoder.cc/background/zaki_prod/generated/ffd95d124b70465987237bd4fe57d255.png"}, {"type": "text", "title": "定时模式", "content": "支持自由设定工作时长，下班前提前开启，回家即可享受温暖干燥的浴巾。"}, {"type": "image", "content": "https://www.autocoder.cc/background/zaki_prod/generated/47c2e2fb50a64fe381aca2aa4ce37115.png"}]', '[{"group": "技术参数", "items": [{"key": "额定功率", "value": "300W"}, {"key": "电源线长", "value": "1.5米，带漏电保护插头"}]}, {"group": "外观材质", "items": [{"key": "主体材质", "value": "低碳钢/铝合金"}, {"key": "表面工艺", "value": "高温静电喷涂"}]}]', '{"shipFrom": "温州, 中国", "minOrderQty": "1 套起订", "tradeNotice": "插头规格可根据出口国家定制", "deliveryDays": 10, "shippingNote": "5天内发货", "supportedRegions": ["CN", "EU"]}', '[{"answer": "非常省电，全天开启约只需1度电。", "question": "费电吗？"}, {"answer": "支持明线插座供电，也可在装修时预留暗线安装，更加美观。", "question": "需要预留暗线吗？"}, {"answer": "还可以烘干贴身内衣裤、婴儿衣物、袜子等小件物品。", "question": "只能挂毛巾吗？"}, {"answer": "插头自带漏电保护开关，遇异常微弱电流瞬间切断电源，绝对安全。", "question": "防漏电安全吗？"}]', 0.0, 0, 45, '2026-07-08 08:25:17', '2026-07-10 08:25:17', NULL, NULL, NULL, NULL, NULL, 'NONE', NULL, 0, 0, NULL, NULL, NULL, NULL, 'RING', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '0.00', '未填写供应商', NULL, 0, NULL, 0, NULL, NULL),
('2d54c8c3-fade-43c8-a980-f8264d52f691', '1ff00246-26a7-4a5e-a1d8-d1b999fcf57a', '双向快充便携式移动电源 20000mAh 金属外壳', 'prod-003', 'SKU-P2024-03', 'IMPORT_1688', 'ACTIVE', 'https://productp.s3.us-west-2.amazonaws.com/background/zaki_dev/generated/60c5761fa02b45168c579e914990a92a.png', '[{"url": "https://productp.s3.us-west-2.amazonaws.com/background/zaki_pre/generated/30ac38b37cf04c18884b44f211085c4f.png", "sort": 1}, {"url": "https://productp.s3.us-west-2.amazonaws.com/background/zaki_dev/generated/9a5db9d607914da982b8f9ed28cad841.png", "sort": 2}, {"url": "https://productp.s3.us-west-2.amazonaws.com/background/zaki_test/generated/792e7efb289544078622b95a6d42e7c4.png", "sort": 3}]', '超大容量20000mAh，支持PD3.0等多种快充协议，航空级铝合金外壳，散热更佳，安全耐用，出行必备。', '[{"title": "标签", "content": "货源稳定"}, {"title": "容量", "content": "20000mAh大容量"}, {"title": "快充", "content": "双向PD快充"}, {"title": "材质", "content": "航空铝合金外壳"}]', '[{"type": "text", "title": "安全防护", "content": "内置十重安全防护电路，防过充、过放、短路等，保障您的设备安全。"}, {"type": "image", "content": "https://www.autocoder.cc/background/zaki_prod/generated/a7e4157622f046ec80ed19ffbb2c13d0.png"}, {"type": "text", "title": "兼容性", "content": "广泛兼容主流智能手机、平板电脑以及部分轻薄笔记本电脑。"}, {"type": "image", "content": "https://productp.s3.us-west-2.amazonaws.com/background/zaki_dev/generated/71367bec3e914f8e9a67455d1feeef4a.png"}]', '[{"group": "基本规格", "items": [{"key": "电芯类型", "value": "锂聚合物电池"}, {"key": "外壳材质", "value": "铝合金"}]}, {"group": "输入输出", "items": [{"key": "输入接口", "value": "Type-C"}, {"key": "输出接口", "value": "Type-C, USB-A"}]}]', '{"shipFrom": "东莞, 中国", "minOrderQty": "50 件起订", "tradeNotice": "大批量订单可定制Logo", "deliveryDays": 14, "shippingNote": "7天内发货", "supportedRegions": ["US", "EU", "AS"]}', '[{"answer": "容量符合民航局规定，可以直接携带登机。", "question": "可以带上飞机吗？"}, {"answer": "使用18W及以上快充适配器，约需6-8小时充满。", "question": "充满电需要多久？"}, {"answer": "支持两个设备同时充电，但总输出功率会智能分配。", "question": "支持同时充几个设备？"}, {"answer": "金属外壳导热快，快充时会有温热感，属于正常散热现象。", "question": "外壳会发烫吗？"}]', 4.7, 218, 90, '2026-06-11 08:25:17', '2026-07-14 11:48:27', NULL, NULL, NULL, NULL, NULL, 'NONE', NULL, 0, 0, NULL, NULL, NULL, NULL, 'RING', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, '1.50', '0.00', '未填写供应商', NULL, 0, NULL, 0, NULL, NULL),
('2f008e64-60d0-4c5a-8f7a-b6d93c9a2d87', '1ff00246-26a7-4a5e-a1d8-d1b999fcf57a', '女士高腰提臀无缝瑜伽裤 健身长裤', 'seamless-yoga-leggings-women', 'SKU-F2024-02', 'MANUAL', 'ACTIVE', 'https://productp.s3.us-west-2.amazonaws.com/background/zaki_dev/generated/1ab0b0f7bd0d4f6a8060418ae4debcba.png', '[{"url": "https://productp.s3.us-west-2.amazonaws.com/background/zaki_test/generated/a42737867e9c43fe803281dedde3840f.png", "sort": 1}, {"url": "https://productp.s3.us-west-2.amazonaws.com/background/zaki_test/generated/d68b4ba139c047a4bb16ec7fef0adb00.png", "sort": 2}, {"url": "https://productp.s3.us-west-2.amazonaws.com/background/zaki_test/generated/030cd72b804d4151a74c4bfd10f8bc57.png", "sort": 3}]', '3D立体剪裁，蜜桃臀线设计；裸感速干面料，四面弹力不紧绷，让你在运动中自由伸展，尽显完美曲线。', '[{"title": "提臀", "content": "微笑提臀线"}, {"title": "显瘦", "content": "高腰收腹设计"}, {"title": "面料", "content": "裸感透气速干"}, {"title": "舒适", "content": "无缝工艺防摩擦"}]', '[{"type": "text", "title": "面料科技", "content": "采用锦纶与氨纶科学配比，吸湿排汗性能提升50%，告别运动后的黏腻感。"}, {"type": "image", "content": "https://www.autocoder.cc/background/zaki_prod/generated/bfcdda2944db4bf5b0cc4f1e8c60f770.png"}, {"type": "text", "title": "细节展示", "content": "隐藏式内兜设计，方便存放钥匙、卡片等小物件；裤脚无痕处理，贴合脚踝不起边。"}, {"type": "image", "content": "https://productp.s3.us-west-2.amazonaws.com/background/zaki_dev/generated/b1db1f36865c400694ac88ccbbb25ad3.png"}]', '[{"group": "商品属性", "items": [{"key": "腰型", "value": "高腰"}, {"key": "裤长", "value": "九分裤/长裤"}]}, {"group": "适合场景", "items": [{"key": "运动类型", "value": "瑜伽、跑步、健身、普拉提"}, {"key": "季节", "value": "四季皆宜"}]}]', '{"shipFrom": "义乌, 中国", "minOrderQty": "5 件起订", "tradeNotice": "支持一件代发", "deliveryDays": 6, "shippingNote": "2天内发货", "supportedRegions": ["US", "EU"]}', '[{"answer": "面料厚实且具有高密度编织，深蹲绝对不透，避免尴尬。", "question": "做深蹲会透吗？"}, {"answer": "高腰设计贴合腰腹曲线，运动过程中不易下滑掉裆。", "question": "会掉裆吗？"}, {"answer": "速干面料能快速将汗水扩散蒸发，深色系几乎看不出汗痕。", "question": "出汗后会有汗痕吗？"}, {"answer": "优质弹力纤维恢复性好，正常洗涤不会变形缩水。", "question": "洗了会缩水变形吗？"}]', 4.7, 265, 50, '2026-06-19 08:25:17', '2026-07-14 11:48:26', NULL, NULL, NULL, NULL, NULL, 'NONE', NULL, 0, 0, NULL, NULL, NULL, NULL, 'RING', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, '1.50', '0.00', '未填写供应商', NULL, 0, NULL, 0, NULL, NULL),
('3116144e-a24f-482b-a9c5-7c52098c6494', '502e355a-0794-46ac-85d4-56616929ebb0', '[1688抓取] 工业配件 849f0b', 'p-1783948945533146', 'IMP-1783948945533146', 'IMPORT_1688', 'DRAFT', 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158', '[{"url": "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158", "sort": 1}]', '自动抓取的商品简介内容，请根据需要修改。', NULL, NULL, NULL, NULL, NULL, 0.0, 0, 0, '2026-07-13 13:22:25', '2026-07-13 13:22:25', NULL, NULL, NULL, NULL, NULL, 'NONE', NULL, 0, 0, NULL, NULL, NULL, NULL, 'RING', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, 0, NULL, NULL),
('4dd45a81-c013-480b-b856-a4e8874a1ebe', '1ff00246-26a7-4a5e-a1d8-d1b999fcf57a', '儿童智能早教陪伴机器人 对话故事机', 'smart-early-education-robot', 'SKU-T2024-02', 'MANUAL', 'ACTIVE', 'https://www.autocoder.cc/background/zaki_prod/generated/ae87d2cb47f04b12b8e5c36ee6bf59a0.png', '[{"url": "https://www.autocoder.cc/background/zaki_prod/generated/9b03207581a545108eda542427aec06b.png", "sort": 1}, {"url": "https://productp.s3.us-west-2.amazonaws.com/background/zaki_dev/generated/1a67448b1f8e4e57be5a7bba37d34c42.png", "sort": 2}, {"url": "https://www.autocoder.cc/background/zaki_prod/generated/80f7b313c4f043009e87afe98b077fde.png", "sort": 3}]', '集英语启蒙、国学经典、儿歌故事于一体；支持智能语音交互，解答孩子十万个为什么，是孩子的好玩伴。', '[{"title": "内容", "content": "海量云端资源"}, {"title": "互动", "content": "AI智能语音对话"}, {"title": "材质", "content": "食品级硅胶耳灯"}, {"title": "操作", "content": "微信小程序远程点播"}]', '[{"type": "text", "title": "智能陪伴", "content": "搭载先进的自然语言处理技术，能够精准识别儿童语音，进行趣味横生的对话交流。"}, {"type": "image", "content": "https://www.autocoder.cc/background/zaki_prod/generated/9067682f48dc47bd9c376ec9c4da8807.png"}, {"type": "text", "title": "贴心设计", "content": "机身圆润无棱角，耳朵部分采用柔光材质，夜晚可作为安抚小夜灯使用。"}, {"type": "image", "content": "https://www.autocoder.cc/background/zaki_prod/generated/eb63f82193f944c3ac01208aa69812de.png"}]', '[{"group": "硬件参数", "items": [{"key": "电池容量", "value": "2000mAh"}, {"key": "连接方式", "value": "Wi-Fi 2.4G"}]}, {"group": "功能特性", "items": [{"key": "麦克风", "value": "双麦克风阵列，支持3米远场拾音"}, {"key": "扬声器", "value": "高保真全频喇叭"}]}]', '{"shipFrom": "深圳, 中国", "minOrderQty": "5 台起订", "tradeNotice": "提供一件代发服务", "deliveryDays": 5, "shippingNote": "2天内发货", "supportedRegions": ["CN", "AS"]}', '[{"answer": "智能对话和点播新内容需要联网，设备也内置了部分本地故事，断网时可播放。", "question": "需要一直连网吗？"}, {"answer": "采用专业级音响腔体设计，声音清晰柔和，保护孩子听力。", "question": "音质怎么样？"}, {"answer": "支持，孩子按住语音键可发送微聊消息到家长手机微信。", "question": "可以发微信消息吗？"}, {"answer": "云端海量早教资源持续免费更新，无需额外购买会员。", "question": "资源更新收费吗？"}]', 4.8, 420, 35, '2026-06-06 08:25:17', '2026-07-14 11:48:27', NULL, NULL, NULL, NULL, NULL, 'NONE', NULL, 0, 0, NULL, NULL, NULL, NULL, 'RING', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, '1.50', '0.00', '未填写供应商', NULL, 0, NULL, 0, NULL, NULL),
('4f5424e2-39fd-4834-9b2a-a6c9d75f71f5', '502e355a-0794-46ac-85d4-56616929ebb0', '[1688抓取] 工业配件 a621dc', 'p-1785059573716490', 'IMP-1785059573716490', 'IMPORT_1688', 'DRAFT', 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158', '[{"url": "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158", "sort": 1}]', '自动采集的商品详情，请运营补充图文与说明。｜1688 默认供应商｜1688工业配件', NULL, NULL, NULL, '{"minOrderQty": 1}', NULL, 0.0, 0, 0, '2026-07-26 09:52:53', '2026-07-26 09:52:53', NULL, NULL, NULL, NULL, NULL, 'NONE', NULL, 0, 0, NULL, NULL, NULL, NULL, 'RING', NULL, NULL, 0, NULL, NULL, NULL, '500.00', '自动采集的商品详情，请运营补充图文与说明。', NULL, '1.00', '96.00', '1688 默认供应商', NULL, 0, NULL, 0, NULL, NULL),
('855ef6c4-b24a-4625-a2b5-721372d96b04', '1ff00246-26a7-4a5e-a1d8-d1b999fcf57a', '复古纯棉加厚保暖连帽卫衣 男式', 'vintage-cotton-hoodie-men', 'SKU-F2024-01', 'MANUAL', 'ACTIVE', 'https://www.autocoder.cc/background/zaki_prod/generated/891a4eaca3ed44808260f9f4d4b56df5.png', '[{"url": "https://productp.s3.us-west-2.amazonaws.com/background/zaki_pre/generated/57df2fdb14cc4a88ace7e754fcd4a813.png", "sort": 1}, {"url": "https://productp.s3.us-west-2.amazonaws.com/background/zaki_test/generated/5e3dc7837a46407aa03f74a82c84c580.png", "sort": 2}, {"url": "https://productp.s3.us-west-2.amazonaws.com/background/zaki_dev/generated/5ecba099c3da4f5aac3ea25b7d1d8d16.png", "sort": 3}]', '精选新疆长绒棉，内里加绒加厚处理，保暖性能极佳；宽松落肩版型，尽显慵懒复古风尚。', '[{"title": "面料", "content": "100%精梳纯棉"}, {"title": "保暖", "content": "内里细密摇粒绒"}, {"title": "版型", "content": "Oversize落肩设计"}, {"title": "百搭", "content": "多色可选易穿搭"}]', '[{"type": "text", "title": "工艺细节", "content": "领口与袖口采用高弹力罗纹拼接，水洗不易变形；胸前简约刺绣Logo，彰显品质。"}, {"type": "image", "content": "https://www.autocoder.cc/background/zaki_prod/generated/3905ac85158548799a3aa4aa0ca140ba.png"}, {"type": "text", "title": "穿搭建议", "content": "内搭白T恤露出下摆，下身搭配工装裤或直筒牛仔裤，轻松营造层次感。"}, {"type": "image", "content": "https://productp.s3.us-west-2.amazonaws.com/background/zaki_test/generated/960fde22ceea4958bc6251d67c7d12cb.png"}]', '[{"group": "产品参数", "items": [{"key": "厚薄", "value": "加厚"}, {"key": "版型", "value": "宽松型"}]}, {"group": "洗涤说明", "items": [{"key": "洗涤方式", "value": "建议手洗/轻柔机洗，水温不高于30度"}, {"key": "不可熨烫", "value": "印花部分不可直接熨烫"}]}]', '{"shipFrom": "广州, 中国", "minOrderQty": "2 件起订", "tradeNotice": "色差问题请以实物为准", "deliveryDays": 5, "shippingNote": "2天内发货", "supportedRegions": ["Global"]}', '[{"answer": "面料经过抗起球处理，正常穿着洗涤不易起球。", "question": "容易起球吗？"}, {"answer": "成衣已做预缩水处理，缩水率控制在国家标准范围内。", "question": "缩水严重吗？"}, {"answer": "初次洗涤可能会有轻微浮毛，建议单洗一次后再穿着。", "question": "掉毛吗？"}, {"answer": "版型偏宽松，喜欢合身效果可拍小一码。", "question": "尺码偏大还是偏小？"}]', 4.8, 110, 65, '2026-06-16 08:25:17', '2026-07-14 11:48:26', NULL, NULL, NULL, NULL, NULL, 'NONE', NULL, 0, 0, NULL, NULL, NULL, NULL, 'RING', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, '1.50', '0.00', '未填写供应商', NULL, 0, NULL, 0, NULL, NULL),
('8f14ef51-3a5a-4a30-945c-a7d045c2d4d7', '502e355a-0794-46ac-85d4-56616929ebb0', '[1688抓取] 工业配件 0c8cc3', 'p-1785059573843417', 'IMP-1785059573843417', 'IMPORT_1688', 'DRAFT', 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158', '[{"url": "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158", "sort": 1}]', '自动采集的商品详情，请运营补充图文与说明。｜1688 默认供应商｜1688工业配件', NULL, NULL, NULL, '{"minOrderQty": 1}', NULL, 0.0, 0, 0, '2026-07-26 09:52:53', '2026-07-26 09:52:53', NULL, NULL, NULL, NULL, NULL, 'NONE', NULL, 0, 0, NULL, NULL, NULL, NULL, 'RING', NULL, NULL, 0, NULL, NULL, NULL, '500.00', '自动采集的商品详情，请运营补充图文与说明。', NULL, '1.00', '56.00', '1688 默认供应商', NULL, 0, NULL, 0, NULL, NULL),
('972bd05b-65bb-4182-ab95-d7260e0f65fb', '1ff00246-26a7-4a5e-a1d8-d1b999fcf57a', '水杨酸收缩毛孔爽肤水 控油净痘', 'salicylic-acid-pore-toner', 'SKU-B2024-02', 'MANUAL', 'INACTIVE', 'https://www.autocoder.cc/background/zaki_prod/generated/f4c6602189a2432492c55b4c54e48abf.png', '[{"url": "https://productp.s3.us-west-2.amazonaws.com/background/zaki_test/generated/721cb2968b2b48939686e396b89305ba.png", "sort": 1}, {"url": "https://productp.s3.us-west-2.amazonaws.com/background/zaki_dev/generated/c0f524756bee4bfda4ec52f27decea74.png", "sort": 2}, {"url": "https://www.autocoder.cc/background/zaki_prod/generated/426d87306ae0434ba8489b66d77a35f2.png", "sort": 3}]', '含2%包裹型水杨酸，温和刷酸不刺激；有效溶解深层油脂，疏通毛孔，改善黑头闭口，令肌肤细腻光滑。', '[{"title": "祛痘", "content": "改善闭口粉刺"}, {"title": "控油", "content": "平衡肌肤水油"}, {"title": "细腻", "content": "收敛粗大毛孔"}, {"title": "舒缓", "content": "复配积雪草精粹"}]', '[{"type": "text", "title": "科学配方", "content": "采用缓释包裹技术，降低水杨酸刺激性的同时延长作用时间，新手小白也可轻松建立耐受。"}, {"type": "image", "content": "https://www.autocoder.cc/background/zaki_prod/generated/989df48246cb4a9988b22b997b9d7085.png"}, {"type": "text", "title": "多效合一", "content": "除日常拍打吸收外，还可针对局部闭口黑头严重区域进行湿敷，效果更佳。"}, {"type": "image", "content": "https://productp.s3.us-west-2.amazonaws.com/background/zaki_dev/generated/ef67e2d0dbf94228bf85c73edfe3508c.png"}]', '[{"group": "成分信息", "items": [{"key": "核心成分", "value": "2%水杨酸，北美金缕梅提取物，积雪草提取物"}]}, {"group": "规格说明", "items": [{"key": "容量", "value": "200ml"}, {"key": "适用肤质", "value": "油性、混油性及痘痘肌"}]}]', '{"shipFrom": "广州, 中国", "minOrderQty": "10 瓶起订", "tradeNotice": "商品包装升级中，暂时下架", "deliveryDays": 0, "shippingNote": "暂停发货", "supportedRegions": []}', '[{"answer": "可以，但水杨酸会增加肌肤对紫外线的敏感度，白天使用后请务必做好防晒。", "question": "白天可以使用吗？"}, {"answer": "建议敏感肌先在耳后测试，无不适后再上脸，使用频率从每周1-2次开始。", "question": "敏感肌能用吗？"}, {"answer": "初期使用可能会加速深层炎症爆发，属于正常疏通过程，坚持使用会逐渐改善。", "question": "会爆痘吗？"}, {"answer": "不建议同时与其他果酸、A醇等强功效产品叠加使用，以免损伤肌肤屏障。", "question": "可以和其他酸类叠加吗？"}]', 4.5, 180, 40, '2026-03-13 08:25:17', '2026-07-14 11:48:27', NULL, NULL, NULL, NULL, NULL, 'NONE', NULL, 0, 0, NULL, NULL, NULL, NULL, 'RING', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, '1.50', '0.00', '未填写供应商', NULL, 0, NULL, 0, NULL, NULL),
('9969ef14-d7b4-4542-bd6e-6566632b6640', '502e355a-0794-46ac-85d4-56616929ebb0', '[1688抓取] 工业配件 c61d8a', 'p-178505957382362', 'IMP-178505957382362', 'IMPORT_1688', 'DRAFT', 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158', '[{"url": "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158", "sort": 1}]', '自动采集的商品详情，请运营补充图文与说明。｜1688 默认供应商｜1688工业配件', NULL, NULL, NULL, '{"minOrderQty": 1}', NULL, 0.0, 0, 0, '2026-07-26 09:52:53', '2026-07-26 09:52:53', NULL, NULL, NULL, NULL, NULL, 'NONE', NULL, 0, 0, NULL, NULL, NULL, NULL, 'RING', NULL, NULL, 0, NULL, NULL, NULL, '500.00', '自动采集的商品详情，请运营补充图文与说明。', NULL, '1.00', '83.00', '1688 默认供应商', NULL, 0, NULL, 0, NULL, NULL),
('a2deb1bc-4f97-4284-b51b-236e7e6a52f1', '1ff00246-26a7-4a5e-a1d8-d1b999fcf57a', '氨基酸温和洁面慕斯 泡沫洗面奶', 'amino-acid-cleansing-mousse', 'SKU-B2024-01', 'MANUAL', 'ACTIVE', 'https://www.autocoder.cc/background/zaki_prod/generated/cf8c72fdaaa747a6af2772488c760f32.png', '[{"url": "https://www.autocoder.cc/background/zaki_prod/generated/8705e0d674a4465e91216df8a0234df4.png", "sort": 1}, {"url": "https://www.autocoder.cc/background/zaki_prod/generated/ee2fe0292e1a4e57a3240085a3e79276.png", "sort": 2}, {"url": "https://productp.s3.us-west-2.amazonaws.com/background/zaki_dev/generated/a59b490ea2744866a144f69d356fd7b2.png", "sort": 3}]', '弱酸性配方，接近肌肤自身PH值；一按即出绵密云朵泡，温和清洁毛孔污垢，洗后水润不紧绷。', '[{"title": "成分", "content": "纯正氨基酸表活"}, {"title": "温和", "content": "无皂基不伤肤"}, {"title": "肤感", "content": "洗后不假滑不紧绷"}, {"title": "便捷", "content": "微米级自发泡泵头"}]', '[{"type": "text", "title": "核心成分", "content": "特别添加神经酰胺与玻尿酸精华，清洁的同时修护肌肤屏障，锁住水分。"}, {"type": "image", "content": "https://www.autocoder.cc/background/zaki_prod/generated/f9001a0c9d9d4532a7ea22e7251007f6.png"}, {"type": "text", "title": "适用肤质", "content": "敏感肌、干性肌肤及痘痘肌均可安心使用，不含酒精、香精及防腐剂。"}, {"type": "image", "content": "https://www.autocoder.cc/background/zaki_prod/generated/54b06a2d8bcc47ca9b54b5017412ca65.png"}]', '[{"group": "产品信息", "items": [{"key": "净含量", "value": "150ml"}, {"key": "保质期", "value": "3年"}]}, {"group": "使用方法", "items": [{"key": "用量", "value": "按压1-2泵即可"}, {"key": "步骤", "value": "湿润面部后，将泡沫均匀涂抹打圈按摩，清水洗净"}]}]', '{"shipFrom": "上海, 中国", "minOrderQty": "5 瓶起订", "tradeNotice": "化妆品类运输需特殊包装", "deliveryDays": 3, "shippingNote": "24小时内发货", "supportedRegions": ["CN", "US"]}', '[{"answer": "可卸除日常防晒及淡妆，浓妆建议先使用专业卸妆产品。", "question": "能卸妆吗？"}, {"answer": "成分安全温和，孕妇及哺乳期均可放心使用。", "question": "孕妇可用吗？"}, {"answer": "可以的，氨基酸洁面不挑性别，适合所有肤质。", "question": "男士可以用吗？"}, {"answer": "含有保湿成分，洗后触感水嫩，不会有紧绷感。", "question": "用完脸会干吗？"}]', 4.9, 540, 60, '2026-06-01 08:25:17', '2026-07-14 11:48:27', NULL, NULL, NULL, NULL, NULL, 'NONE', NULL, 0, 0, NULL, NULL, NULL, NULL, 'RING', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, '1.50', '0.00', '未填写供应商', NULL, 0, NULL, 0, NULL, NULL),
('a2ea7f58-cea5-4df2-8d95-68c6dc272860', '1ff00246-26a7-4a5e-a1d8-d1b999fcf57a', '全自动感应不锈钢垃圾桶 智能开盖', 'automatic-sensor-trash-can', 'SKU-H2024-02', 'IMPORT_1688', 'ACTIVE', 'https://www.autocoder.cc/background/zaki_prod/generated/3254b43e39f44256bbfdf27ce4c9d7a7.png', '[{"url": "https://www.autocoder.cc/background/zaki_prod/generated/53a3d5566f24461bbfffaa427922004c.png", "sort": 1}, {"url": "https://productp.s3.us-west-2.amazonaws.com/background/zaki_test/generated/54fc9ba933cc4ac79cee30c6a61c5c75.png", "sort": 2}, {"url": "https://www.autocoder.cc/background/zaki_prod/generated/63af1dfa8b63433b84389a552287ea1e.png", "sort": 3}]', '红外线挥手感应，0.3秒极速开盖，无需触碰更卫生；不锈钢拉丝桶身，防指纹易清洁，密封锁住异味。', '[{"title": "感应", "content": "0.3秒灵敏开启"}, {"title": "续航", "content": "充一次用半年"}, {"title": "材质", "content": "防指纹不锈钢"}, {"title": "静音", "content": "缓降闭合无噪音"}]', '[{"type": "text", "title": "多种开盖方式", "content": "除了红外感应外，还支持踢碰感应和一键常开模式，满足不同场景下的使用需求。"}, {"type": "image", "content": "https://www.autocoder.cc/background/zaki_prod/generated/fda5a37efb4d4167b0728d59073efd7c.png"}, {"type": "text", "title": "密封防臭", "content": "严密贴合的桶盖设计，有效阻隔垃圾异味散发，同时防止飞虫滋生。"}, {"type": "image", "content": "https://productp.s3.us-west-2.amazonaws.com/background/zaki_dev/generated/299d9cb7c3be47db9046e702baeeeb86.png"}]', '[{"group": "规格参数", "items": [{"key": "容量", "value": "12L/15L可选"}, {"key": "供电方式", "value": "USB充电版/电池版"}]}, {"group": "材质工艺", "items": [{"key": "桶身材质", "value": "430不锈钢"}, {"key": "桶盖材质", "value": "ABS高强度塑料"}]}]', '{"shipFrom": "宁波, 中国", "minOrderQty": "5 个起订", "tradeNotice": "产品内置锂电池，走特殊物流通道", "deliveryDays": 6, "shippingNote": "2天内发货", "supportedRegions": ["US", "EU"]}', '[{"answer": "感应区域在感应窗上方20-30cm范围内最为灵敏。", "question": "感应距离是多少？"}, {"answer": "感应角度经过优化，正常走动路过不会误触发。", "question": "路过会自动打开吗？"}, {"answer": "带有独立内桶设计，方便提出倾倒垃圾和水洗清洁。", "question": "内桶可以拿出来洗吗？"}, {"answer": "使用4节5号(AA)电池，日常使用可维持约3-4个月。", "question": "电池版用什么电池？"}]', 4.6, 95, 25, '2026-06-21 08:25:17', '2026-07-14 11:48:26', NULL, NULL, NULL, NULL, NULL, 'NONE', NULL, 0, 0, NULL, NULL, NULL, NULL, 'RING', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, '1.50', '0.00', '未填写供应商', NULL, 0, NULL, 0, NULL, NULL),
('b63f8edd-ff50-40ac-ab63-725c11c85e5c', '502e355a-0794-46ac-85d4-56616929ebb0', '法式复古碎花雪纺连衣裙 收腰显瘦', 'french-vintage-floral-dress', 'SKU-F2024-03', 'MANUAL', 'DRAFT', 'https://productp.s3.us-west-2.amazonaws.com/background/zaki_dev/generated/7c5780ca30e74708bb9239a1b3f9fa13.png', '[{"url": "https://productp.s3.us-west-2.amazonaws.com/background/zaki_dev/generated/59c830957dfc4c5d9370a2c0a4ff74db.png", "sort": 1}, {"url": "https://productp.s3.us-west-2.amazonaws.com/background/zaki_dev/generated/081d84576ca84e019bb389f37735a772.png", "sort": 2}, {"url": "https://productp.s3.us-west-2.amazonaws.com/background/zaki_dev/generated/58bbef7151f34bd5bf93efa4c59fb99f.png", "sort": 3}]', '浪漫法式风情，清新淡雅碎花印花；V领设计拉长颈部线条，高收腰版型优化身材比例，飘逸灵动。', '[{"title": "版型", "content": "X型收腰设计"}, {"title": "面料", "content": "亲肤透气雪纺"}, {"title": "领口", "content": "气质法式V领"}, {"title": "内衬", "content": "防走光顺滑内衬"}]', '[{"type": "text", "title": "设计亮点", "content": "袖口采用精致的微泡泡袖设计，完美遮掩手臂肉肉；裙摆随风摇曳，充满仙气。"}, {"type": "image", "content": "https://productp.s3.us-west-2.amazonaws.com/background/zaki_test/generated/836d0d3f392047c288d10392edb3e2d1.png"}, {"type": "text", "title": "搭配建议", "content": "搭配一双简约的玛丽珍鞋或小白鞋，再配上编织草帽，轻松驾驭度假出游风。"}, {"type": "image", "content": "https://productp.s3.us-west-2.amazonaws.com/background/zaki_test/generated/037406f4708047b68bf717b26cb6bc64.png"}]', '[{"group": "商品信息", "items": [{"key": "裙长", "value": "中长裙"}, {"key": "门襟", "value": "套头/侧边隐形拉链"}]}, {"group": "洗护说明", "items": [{"key": "洗涤", "value": "建议冷水轻柔手洗，不可漂白"}, {"key": "晾晒", "value": "阴凉处悬挂晾干，避免暴晒褪色"}]}]', '{"shipFrom": "杭州, 中国", "minOrderQty": "3 件起订", "tradeNotice": "新品预售，敬请期待", "deliveryDays": 7, "shippingNote": "预售中，15天后发货", "supportedRegions": ["Global"]}', '[{"answer": "裙身自带亲肤顺滑内衬，绝对不会透光。", "question": "雪纺材质会透吗？"}, {"answer": "V领开口深度经过反复测试，既能展现锁骨又不易走光。", "question": "领口会容易走光吗？"}, {"answer": "面料本身无弹，但后背有松紧抽褶设计，包容性强。", "question": "有弹性吗？"}, {"answer": "内衬采用防静电处理，穿着舒适不易贴腿。", "question": "起静电吗？"}]', 0.0, 0, 30, '2026-07-09 08:25:17', '2026-07-10 08:25:17', NULL, NULL, NULL, NULL, NULL, 'NONE', NULL, 0, 0, NULL, NULL, NULL, NULL, 'RING', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '0.00', '未填写供应商', NULL, 0, NULL, 0, NULL, NULL),
('b895b311-5028-4f74-b28d-75fd80b94c0c', '1ff00246-26a7-4a5e-a1d8-d1b999fcf57a', '智能多功能运动防水手环 5.0 触控屏', 'prod-001', 'SKU-W2024-01', 'IMPORT_1688', 'ACTIVE', 'https://productp.s3.us-west-2.amazonaws.com/background/zaki_dev/generated/a529ffcfe7b044e4bcc81b353b3242bf.png', '[{"url": "https://productp.s3.us-west-2.amazonaws.com/background/zaki_dev/generated/ac4e1920ee1e4d14b459a278c28406a2.png", "sort": 1}, {"url": "https://productp.s3.us-west-2.amazonaws.com/background/zaki_test/generated/b0f9409356ab47a68ab4125307c6a773.png", "sort": 2}, {"url": "https://productp.s3.us-west-2.amazonaws.com/background/zaki_dev/generated/759ae59fdbf8418da70489fc53129412.png", "sort": 3}]', '全天候心率血氧监测，50米深度防水，支持多种运动模式，长达14天续航，让您的健康管理更智能便捷。', '[{"title": "标签", "content": "爆款推荐"}, {"title": "健康", "content": "全天候健康监测"}, {"title": "续航", "content": "14天超长续航"}, {"title": "防水", "content": "50米深度防水"}]', '[{"type": "text", "title": "产品概览", "content": "这款智能运动手环集成了最新的生物传感器，能够实时监测您的健康数据。"}, {"type": "image", "content": "https://productp.s3.us-west-2.amazonaws.com/background/zaki_dev/generated/60551c030f944705b66cf213eaee3767.png"}, {"type": "text", "title": "核心功能", "content": "支持多达20种运动模式，精确记录运动轨迹与消耗热量。"}, {"type": "image", "content": "https://www.autocoder.cc/background/zaki_prod/generated/bd1d071ad975436db8a62064874cc704.png"}]', '[{"group": "基本参数", "items": [{"key": "屏幕尺寸", "value": "1.47英寸"}, {"key": "电池容量", "value": "180mAh"}]}, {"group": "网络与连接", "items": [{"key": "蓝牙版本", "value": "蓝牙 5.0"}, {"key": "兼容系统", "value": "Android 6.0 或 iOS 10.0 及以上"}]}]', '{"shipFrom": "深圳, 中国", "minOrderQty": "10 件起订", "tradeNotice": "本商品支持7天无理由退换货", "deliveryDays": 7, "shippingNote": "3天内发货", "supportedRegions": ["US", "EU"]}', '[{"answer": "支持，本产品具备50米防水性能。", "question": "是否支持游泳佩戴？"}, {"answer": "典型使用场景下可达14天。", "question": "电池寿命如何？"}, {"answer": "可以，通过蓝牙连接手机后，可实时接收微信、短信等通知。", "question": "可以接收手机消息吗？"}, {"answer": "自购买之日起提供一年质保服务。", "question": "保修期多久？"}]', 4.9, 142, 100, '2026-06-26 08:25:17', '2026-07-14 11:48:26', NULL, NULL, NULL, NULL, NULL, 'NONE', NULL, 0, 0, NULL, NULL, NULL, NULL, 'RING', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, '1.50', '0.00', '未填写供应商', NULL, 0, NULL, 0, NULL, NULL),
('bcad9a0b-246b-4f20-9eb4-9ea9ef0796cf', '1ff00246-26a7-4a5e-a1d8-d1b999fcf57a', '智能运动健康监测手表', 'smart-sports-health-watch', 'P-1002', 'IMPORT_1688', 'ACTIVE', 'https://productp.s3.us-west-2.amazonaws.com/background/zaki_dev/generated/550b89c9dbe34d8e91874a55c622970a.png', '[{"url": "https://productp.s3.us-west-2.amazonaws.com/background/zaki_dev/generated/7083573cdd6c4afa8bd36f069c54df4d.png", "sort": 1}, {"url": "https://productp.s3.us-west-2.amazonaws.com/background/zaki_dev/generated/1dcf8251fdc64c34ab2d9271f4b8f765.png", "sort": 2}, {"url": "https://www.autocoder.cc/background/zaki_prod/generated/895ea93e12474d949bceb71965b7f90a.png", "sort": 3}]', '全能腕上管家，不仅记录运动数据，更关注您的睡眠与心脏健康。', '[{"title": "屏幕", "content": "AMOLED高清彩屏"}, {"title": "健康", "content": "ECG心电图检测"}, {"title": "运动", "content": "内置独立GPS"}, {"title": "表盘", "content": "海量个性化表盘"}]', '[{"type": "text", "title": "健康守护", "content": "新增ECG心电图功能，随时随地了解心脏状况，为健康保驾护航。"}, {"type": "image", "content": "https://productp.s3.us-west-2.amazonaws.com/background/zaki_test/generated/2efc37d1da9042cabf7991f427ecea02.png"}, {"type": "text", "title": "运动指导", "content": "内置多种专业运动课程，提供实时语音指导，让运动更科学有效。"}, {"type": "image", "content": "https://productp.s3.us-west-2.amazonaws.com/background/zaki_dev/generated/02e03a3fca6b42849e5c4d1f7ff83408.png"}]', '[{"group": "屏幕参数", "items": [{"key": "屏幕材质", "value": "AMOLED"}, {"key": "分辨率", "value": "454x454"}]}, {"group": "传感器", "items": [{"key": "心率传感器", "value": "光学心率传感器"}, {"key": "定位系统", "value": "GPS, GLONASS, Galileo, Beidou"}]}]', '{"shipFrom": "上海, 中国", "minOrderQty": "5 件起订", "tradeNotice": "电子产品请轻拿轻放", "deliveryDays": 5, "shippingNote": "2天内发货", "supportedRegions": ["US", "EU", "AS"]}', '[{"answer": "采用标准22mm快拆表带，市面上大部分表带均可通用。", "question": "表带可以更换吗？"}, {"answer": "支持，可绑定公交卡及部分银行卡使用。", "question": "支持NFC支付吗？"}, {"answer": "本产品非医疗器械，测量数据仅供参考，不作为诊断依据。", "question": "血压测量准吗？"}, {"answer": "手表内置2GB存储空间，可连接蓝牙耳机脱离手机听歌。", "question": "可以独立播放音乐吗？"}]', 4.8, 320, 75, '2026-05-12 08:25:17', '2026-07-14 11:48:27', NULL, NULL, NULL, NULL, NULL, 'NONE', NULL, 0, 0, NULL, NULL, NULL, NULL, 'RING', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, '1.50', '0.00', '未填写供应商', NULL, 0, NULL, 0, NULL, NULL),
('be89d938-f456-4dd0-a024-5aada52a88ba', 'e3338bf2-94c7-4347-96d7-1ac4ad689625', '[1688抓取] 工业配件 9e1b97', 'p-178496391492359', 'IMP-178496391492359', 'IMPORT_1688', 'DRAFT', 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158', '[{"url": "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158", "sort": 1}]', '自动采集的商品详情，请运营补充图文与说明。｜1688 默认供应商｜1688工业配件', NULL, NULL, NULL, '{"minOrderQty": 1}', NULL, 0.0, 0, 0, '2026-07-25 07:18:34', '2026-07-25 07:18:34', NULL, NULL, NULL, NULL, NULL, 'NONE', NULL, 0, 0, NULL, NULL, NULL, NULL, 'RING', NULL, NULL, 0, NULL, NULL, NULL, '500.00', '自动采集的商品详情，请运营补充图文与说明。', NULL, '1.00', '76.00', '1688 默认供应商', NULL, 0, NULL, 0, NULL, NULL),
('c42cb16c-1b14-495a-bdd0-be563184b862', '1ff00246-26a7-4a5e-a1d8-d1b999fcf57a', '无线主动降噪头戴式耳机', 'wireless-noise-cancelling-headphones', 'P-1001', 'IMPORT_1688', 'ACTIVE', 'https://productp.s3.us-west-2.amazonaws.com/background/zaki_dev/generated/9f9d5bc943db4aff883598293aafa1d6.png', '[{"url": "https://productp.s3.us-west-2.amazonaws.com/background/zaki_test/generated/fb8c90a0980b414cb6b9995380857351.png", "sort": 1}, {"url": "https://productp.s3.us-west-2.amazonaws.com/background/zaki_test/generated/4bfe7fb3435b467d8ca147314749ffe0.png", "sort": 2}, {"url": "https://productp.s3.us-west-2.amazonaws.com/background/zaki_test/generated/0de3f6d94fb044669442d5790c6bd223.png", "sort": 3}]', '卓越的降噪体验，让您专注聆听内心的声音，摆脱外界干扰。', '[{"title": "音质", "content": "专业调音，三频均衡"}, {"title": "佩戴", "content": "轻量化设计，久戴不累"}, {"title": "续航", "content": "快充技术，充电10分钟听歌2小时"}, {"title": "通话", "content": "双麦克风通话降噪"}]', '[{"type": "text", "title": "专注时刻", "content": "无论是在喧闹的办公室还是通勤途中，只需戴上耳机，瞬间开启静谧空间。"}, {"type": "image", "content": "https://productp.s3.us-west-2.amazonaws.com/background/zaki_test/generated/e8612b5d4f324b79b012e25e8dda38ef.png"}, {"type": "text", "title": "便捷操控", "content": "耳罩集成触控面板，指尖轻点即可完成播放、暂停、切歌等操作。"}, {"type": "image", "content": "https://productp.s3.us-west-2.amazonaws.com/background/zaki_test/generated/59d7d84e5bff4c7a8fec74be19c43672.png"}]', '[{"group": "音频规格", "items": [{"key": "频响范围", "value": "20Hz-20kHz"}, {"key": "阻抗", "value": "32欧姆"}]}, {"group": "其他", "items": [{"key": "重量", "value": "250g"}, {"key": "充电接口", "value": "Type-C"}]}]', '{"shipFrom": "深圳, 中国", "minOrderQty": "10 件起订", "tradeNotice": "提供OEM定制服务", "deliveryDays": 7, "shippingNote": "3天内发货", "supportedRegions": ["Global"]}', '[{"answer": "完全兼容iOS系统，支持弹窗显示电量。", "question": "支持苹果手机吗？"}, {"answer": "采用先进的降噪算法，底噪控制极佳，几不可闻。", "question": "降噪开启后底噪大吗？"}, {"answer": "耳罩采用卡扣式设计，方便用户自行更换。", "question": "耳罩坏了可以更换吗？"}, {"answer": "搭载最新蓝牙芯片，连接更迅速，抗干扰能力更强。", "question": "蓝牙连接稳定吗？"}]', 4.6, 150, 80, '2026-05-27 08:25:17', '2026-07-14 11:48:27', NULL, NULL, NULL, NULL, NULL, 'NONE', NULL, 0, 0, NULL, NULL, NULL, NULL, 'RING', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, '1.50', '0.00', '未填写供应商', NULL, 0, NULL, 0, NULL, NULL),
('d44fbeab-96f8-401e-8395-3e1d7d9d0cbc', '502e355a-0794-46ac-85d4-56616929ebb0', '[1688抓取] 工业配件 0278ea', 'p-1785059573780246', 'IMP-1785059573780246', 'IMPORT_1688', 'DRAFT', 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158', '[{"url": "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158", "sort": 1}]', '自动采集的商品详情，请运营补充图文与说明。｜1688 默认供应商｜1688工业配件', NULL, NULL, NULL, '{"minOrderQty": 1}', NULL, 0.0, 0, 0, '2026-07-26 09:52:53', '2026-07-26 09:52:53', NULL, NULL, NULL, NULL, NULL, 'NONE', NULL, 0, 0, NULL, NULL, NULL, NULL, 'RING', NULL, NULL, 0, NULL, NULL, NULL, '500.00', '自动采集的商品详情，请运营补充图文与说明。', NULL, '1.00', '68.00', '1688 默认供应商', NULL, 0, NULL, 0, NULL, NULL),
('d8785e59-63fb-4e1b-9a13-fff1e618ccae', '502e355a-0794-46ac-85d4-56616929ebb0', '[1688抓取] 工业配件 6989e0', 'p-1785059573802497', 'IMP-1785059573802497', 'IMPORT_1688', 'DRAFT', 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158', '[{"url": "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158", "sort": 1}]', '自动采集的商品详情，请运营补充图文与说明。｜1688 默认供应商｜1688工业配件', NULL, NULL, NULL, '{"minOrderQty": 1}', NULL, 0.0, 0, 0, '2026-07-26 09:52:53', '2026-07-26 09:52:53', NULL, NULL, NULL, NULL, NULL, 'NONE', NULL, 0, 0, NULL, NULL, NULL, NULL, 'RING', NULL, NULL, 0, NULL, NULL, NULL, '500.00', '自动采集的商品详情，请运营补充图文与说明。', NULL, '1.00', '60.00', '1688 默认供应商', NULL, 0, NULL, 0, NULL, NULL),
('f4656fa0-52b2-46a1-863c-bfa991caec27', '1ff00246-26a7-4a5e-a1d8-d1b999fcf57a', '1080P 智能家用无线监控摄像头 夜视云台版', 'prod-004', 'SKU-C2024-04', 'IMPORT_1688', 'ACTIVE', 'https://productp.s3.us-west-2.amazonaws.com/background/zaki_pre/generated/42cedc6e82244dc88ec042447205f73f.png', '[{"url": "https://www.autocoder.cc/background/zaki_prod/generated/c1b644a475f145b9b52a3324ccd77a39.png", "sort": 1}, {"url": "https://www.autocoder.cc/background/zaki_prod/generated/a619a25e35c844c4ae27574d2307f989.png", "sort": 2}, {"url": "https://productp.s3.us-west-2.amazonaws.com/background/zaki_test/generated/fa78ee54a2884e03b395b117cf0d974e.png", "sort": 3}]', '1080P高清画质，360度全景视野，增强红外夜视，支持AI人形移动侦测与双向语音对讲，守护家庭安全。', '[{"title": "标签", "content": "高转化率"}, {"title": "画质", "content": "1080P全高清"}, {"title": "视野", "content": "360度云台全景"}, {"title": "智能", "content": "AI人形侦测"}]', '[{"type": "text", "title": "高清夜视", "content": "内置多颗红外补光灯，即使在全黑环境下也能呈现清晰细腻的画面。"}, {"type": "image", "content": "https://www.autocoder.cc/background/zaki_prod/generated/b387eda35a9544faa0531bc38b48fe14.png"}, {"type": "text", "title": "智能追踪", "content": "开启移动追踪功能后，摄像头会自动捕捉并跟随移动物体拍摄。"}, {"type": "image", "content": "https://productp.s3.us-west-2.amazonaws.com/background/zaki_dev/generated/d092d425b8dc405f9fc7e5ea72363030.png"}]', '[{"group": "视频参数", "items": [{"key": "分辨率", "value": "1920x1080"}, {"key": "视场角", "value": "水平360度，垂直108度"}]}, {"group": "网络与存储", "items": [{"key": "无线连接", "value": "Wi-Fi IEEE 802.11b/g/n 2.4GHz"}, {"key": "存储功能", "value": "MicroSD卡(最大支持256GB), 云存储"}]}]', '{"shipFrom": "杭州, 中国", "minOrderQty": "20 件起订", "tradeNotice": "产品内置多国语言包", "deliveryDays": 8, "shippingNote": "4天内发货", "supportedRegions": ["US", "EU"]}', '[{"answer": "不需要，连接家里2.4G Wi-Fi即可使用。", "question": "需要拉网线吗？"}, {"answer": "通过专属APP随时随地回放TF卡或云端录像。", "question": "怎么查看录像？"}, {"answer": "支持主账号分享给家人，允许多设备同时在线观看。", "question": "可以多人同时观看吗？"}, {"answer": "64G存储卡在连续录像模式下大约可保存7天画面。", "question": "存储卡能录多久？"}]', 4.9, 88, 85, '2026-06-29 08:25:17', '2026-07-14 11:48:26', NULL, NULL, NULL, NULL, NULL, 'NONE', NULL, 0, 0, NULL, NULL, NULL, NULL, 'RING', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, '1.50', '0.00', '未填写供应商', NULL, 0, NULL, 0, NULL, NULL),
('fb8b3f32-c9b5-45d9-ae65-e926a76aa005', '502e355a-0794-46ac-85d4-56616929ebb0', '[1688抓取] 工业配件 d90cb2', 'p-1785059573745232', 'IMP-1785059573745232', 'IMPORT_1688', 'DRAFT', 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158', '[{"url": "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158", "sort": 1}]', '自动采集的商品详情，请运营补充图文与说明。｜1688 默认供应商｜1688工业配件', NULL, NULL, NULL, '{"minOrderQty": 1}', NULL, 0.0, 0, 0, '2026-07-26 09:52:53', '2026-07-26 09:52:53', NULL, NULL, NULL, NULL, NULL, 'NONE', NULL, 0, 0, NULL, NULL, NULL, NULL, 'RING', NULL, NULL, 0, NULL, NULL, NULL, '500.00', '自动采集的商品详情，请运营补充图文与说明。', NULL, '1.00', '73.00', '1688 默认供应商', NULL, 0, NULL, 0, NULL, NULL);

-- Table structure for `product_category_relations`
DROP TABLE IF EXISTS `product_category_relations`;
CREATE TABLE `product_category_relations` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `productId` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `categoryId` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `product_category_relations_productId_categoryId_key` (`productId`,`categoryId`),
  KEY `product_category_relations_productId_idx` (`productId`),
  KEY `product_category_relations_categoryId_idx` (`categoryId`),
  CONSTRAINT `product_category_relations_categoryId_fkey` FOREIGN KEY (`categoryId`) REFERENCES `category` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `product_category_relations_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `product` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Data for table `product_category_relations`
INSERT INTO `product_category_relations` (`id`, `productId`, `categoryId`, `createdAt`, `updatedAt`) VALUES
('05269bbd-a031-4f2b-80fa-0961d2baa967', 'a2deb1bc-4f97-4284-b51b-236e7e6a52f1', '1ff00246-26a7-4a5e-a1d8-d1b999fcf57a', '2026-07-14 11:43:21', '2026-07-14 11:43:21'),
('119db750-1332-45d4-8895-2f7bb2125a44', '13d75331-7ab2-45dd-a585-6f9718cd4823', '7ff3acaa-6cb0-4f16-9b35-3cd869a31aef', '2026-07-14 11:50:06', '2026-07-14 11:50:06'),
('13d9996d-476f-4907-826f-a60002635058', 'c42cb16c-1b14-495a-bdd0-be563184b862', '1ff00246-26a7-4a5e-a1d8-d1b999fcf57a', '2026-07-14 11:43:21', '2026-07-14 11:43:21'),
('5f8c3782-caaa-485e-9573-f17b84d2ebb0', '855ef6c4-b24a-4625-a2b5-721372d96b04', '1ff00246-26a7-4a5e-a1d8-d1b999fcf57a', '2026-07-14 11:43:21', '2026-07-14 11:43:21'),
('637a5bbf-8743-415c-863d-9371f3d286b9', '972bd05b-65bb-4182-ab95-d7260e0f65fb', '1ff00246-26a7-4a5e-a1d8-d1b999fcf57a', '2026-07-14 11:43:21', '2026-07-14 11:43:21'),
('7ecc4d38-0425-4b3e-9d83-38e1d049d21d', '4dd45a81-c013-480b-b856-a4e8874a1ebe', '1ff00246-26a7-4a5e-a1d8-d1b999fcf57a', '2026-07-14 11:43:21', '2026-07-14 11:43:21'),
('834d05d5-7e9e-11f1-83b6-02cf0dd0fdc5', 'b63f8edd-ff50-40ac-ab63-725c11c85e5c', '502e355a-0794-46ac-85d4-56616929ebb0', '2026-07-13 09:37:49', '2026-07-13 09:37:49'),
('834d05f0-7e9e-11f1-83b6-02cf0dd0fdc5', '0b67b39b-2b29-4976-a98d-520585b8bec4', '6eb7ccf8-52b9-4c46-a669-8ed78a2d6407', '2026-07-13 09:37:49', '2026-07-13 09:37:49'),
('834d060b-7e9e-11f1-83b6-02cf0dd0fdc5', '2a39932c-c927-4011-8715-a95b4fb4b574', '6eb7ccf8-52b9-4c46-a669-8ed78a2d6407', '2026-07-13 09:37:49', '2026-07-13 09:37:49'),
('8ea73489-c1f8-4b42-a76e-97d5d111bf79', '2f008e64-60d0-4c5a-8f7a-b6d93c9a2d87', '1ff00246-26a7-4a5e-a1d8-d1b999fcf57a', '2026-07-14 11:43:21', '2026-07-14 11:43:21'),
('aff74f6a-fc6d-4738-9de7-1fd0d7fd4bb9', '2d54c8c3-fade-43c8-a980-f8264d52f691', '1ff00246-26a7-4a5e-a1d8-d1b999fcf57a', '2026-07-14 11:43:21', '2026-07-14 11:43:21'),
('cfb4b8db-4f84-4929-a68a-089df0c8a5fb', 'a2ea7f58-cea5-4df2-8d95-68c6dc272860', '1ff00246-26a7-4a5e-a1d8-d1b999fcf57a', '2026-07-14 11:43:21', '2026-07-14 11:43:21'),
('dbeb369c-965a-428d-94f7-8e48f5831bef', 'bcad9a0b-246b-4f20-9eb4-9ea9ef0796cf', '1ff00246-26a7-4a5e-a1d8-d1b999fcf57a', '2026-07-14 11:43:21', '2026-07-14 11:43:21'),
('ea5462d4-a407-483c-ad01-2056fe08e8dd', 'b895b311-5028-4f74-b28d-75fd80b94c0c', '1ff00246-26a7-4a5e-a1d8-d1b999fcf57a', '2026-07-14 11:43:21', '2026-07-14 11:43:21'),
('ecc10068-618a-4fa1-8f96-190e5575e114', '13d75331-7ab2-45dd-a585-6f9718cd4823', '1ff00246-26a7-4a5e-a1d8-d1b999fcf57a', '2026-07-14 11:50:06', '2026-07-14 11:50:06'),
('ee17ca6d-a60a-42cd-813a-5d8ab3a946e5', 'f4656fa0-52b2-46a1-863c-bfa991caec27', '1ff00246-26a7-4a5e-a1d8-d1b999fcf57a', '2026-07-14 11:43:21', '2026-07-14 11:43:21');

-- Table structure for `product_keyword_relations`
DROP TABLE IF EXISTS `product_keyword_relations`;
CREATE TABLE `product_keyword_relations` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `productId` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `keywordId` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `product_keyword_relations_productId_keywordId_key` (`productId`,`keywordId`),
  KEY `product_keyword_relations_productId_idx` (`productId`),
  KEY `product_keyword_relations_keywordId_idx` (`keywordId`),
  CONSTRAINT `product_keyword_relations_keywordId_fkey` FOREIGN KEY (`keywordId`) REFERENCES `keyworditem` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `product_keyword_relations_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `product` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Data for table `product_keyword_relations`
INSERT INTO `product_keyword_relations` (`id`, `productId`, `keywordId`, `createdAt`, `updatedAt`) VALUES
('49178aba-0520-4bdb-881a-b7c1031b2bec', 'a2ea7f58-cea5-4df2-8d95-68c6dc272860', 'ebfdf741-e351-4362-9861-2d943aa24d08', '2026-07-14 11:43:45', '2026-07-14 11:43:45'),
('494da557-c293-427f-bba1-e0d2da395097', 'f4656fa0-52b2-46a1-863c-bfa991caec27', 'ebfdf741-e351-4362-9861-2d943aa24d08', '2026-07-14 11:43:45', '2026-07-14 11:43:45'),
('5310ddae-a5d3-4fa8-a27e-8cd950f14715', '2f008e64-60d0-4c5a-8f7a-b6d93c9a2d87', 'ebfdf741-e351-4362-9861-2d943aa24d08', '2026-07-14 11:43:45', '2026-07-14 11:43:45'),
('59fdaf0e-aecd-40fe-9eba-e5e206a40ab9', '13d75331-7ab2-45dd-a585-6f9718cd4823', 'ebfdf741-e351-4362-9861-2d943aa24d08', '2026-07-14 11:52:45', '2026-07-14 11:52:45'),
('775f40f7-3304-4bc9-b740-f9466077aa20', 'b895b311-5028-4f74-b28d-75fd80b94c0c', 'ebfdf741-e351-4362-9861-2d943aa24d08', '2026-07-14 11:43:45', '2026-07-14 11:43:45'),
('8423ada8-a307-41f8-bcad-4bac3a4c2c20', 'c42cb16c-1b14-495a-bdd0-be563184b862', 'ebfdf741-e351-4362-9861-2d943aa24d08', '2026-07-14 11:43:45', '2026-07-14 11:43:45'),
('867ed0c7-6613-453c-a776-b7a57600a0e5', '4dd45a81-c013-480b-b856-a4e8874a1ebe', 'ebfdf741-e351-4362-9861-2d943aa24d08', '2026-07-14 11:43:45', '2026-07-14 11:43:45'),
('98a15a7f-ece6-49bb-8bb6-6bb16880e78d', 'a2deb1bc-4f97-4284-b51b-236e7e6a52f1', 'ebfdf741-e351-4362-9861-2d943aa24d08', '2026-07-14 11:43:45', '2026-07-14 11:43:45'),
('a8af7388-f59d-4df7-9cc7-24dd57fe608b', 'bcad9a0b-246b-4f20-9eb4-9ea9ef0796cf', 'ebfdf741-e351-4362-9861-2d943aa24d08', '2026-07-14 11:43:45', '2026-07-14 11:43:45'),
('add40eb9-95a4-43c7-8bda-1f52c0f5fa76', '972bd05b-65bb-4182-ab95-d7260e0f65fb', 'ebfdf741-e351-4362-9861-2d943aa24d08', '2026-07-14 11:43:45', '2026-07-14 11:43:45'),
('ba02d119-466f-46d4-9d7b-2e8a6f47cd92', '2d54c8c3-fade-43c8-a980-f8264d52f691', 'ebfdf741-e351-4362-9861-2d943aa24d08', '2026-07-14 11:43:45', '2026-07-14 11:43:45'),
('fb76a6c0-86f3-4f7f-95cb-ad289d125271', '855ef6c4-b24a-4625-a2b5-721372d96b04', 'ebfdf741-e351-4362-9861-2d943aa24d08', '2026-07-14 11:43:45', '2026-07-14 11:43:45');

-- Table structure for `productcategory`
DROP TABLE IF EXISTS `productcategory`;
CREATE TABLE `productcategory` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `productId` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `categoryId` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `isPrimary` tinyint(1) NOT NULL DEFAULT '0',
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `productcategory_productId_categoryId_key` (`productId`,`categoryId`),
  KEY `productcategory_categoryId_idx` (`categoryId`),
  CONSTRAINT `productcategory_categoryId_fkey` FOREIGN KEY (`categoryId`) REFERENCES `category` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `productcategory_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `product` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Data for table `productcategory`
-- Table structure for `productreview`
DROP TABLE IF EXISTS `productreview`;
CREATE TABLE `productreview` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `productId` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `userId` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `orderId` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `rating` int NOT NULL,
  `title` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `content` text COLLATE utf8mb4_unicode_ci,
  `imageUrlsJson` json DEFAULT NULL,
  `hasImages` tinyint(1) NOT NULL DEFAULT '0',
  `status` enum('PUBLISHED','HIDDEN','PENDING') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'PUBLISHED',
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `productreview_productId_idx` (`productId`),
  KEY `productreview_userId_idx` (`userId`),
  KEY `productreview_status_idx` (`status`),
  KEY `productreview_orderId_fkey` (`orderId`),
  CONSTRAINT `productreview_orderId_fkey` FOREIGN KEY (`orderId`) REFERENCES `orderrecord` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `productreview_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `product` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `productreview_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `sysuser` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Data for table `productreview`
-- Table structure for `productsku`
DROP TABLE IF EXISTS `productsku`;
CREATE TABLE `productsku` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `productId` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `skuCode` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `imageUrl` varchar(700) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `price` decimal(10,2) NOT NULL,
  `originalPrice` decimal(10,2) DEFAULT NULL,
  `stock` int NOT NULL DEFAULT '0',
  `stockStatus` enum('IN_STOCK','LOW_STOCK','OUT_OF_STOCK') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'IN_STOCK',
  `attributeJson` json NOT NULL,
  `deliveryDays` int DEFAULT NULL,
  `weightKg` decimal(10,3) DEFAULT NULL,
  `volumeM3` decimal(10,4) DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `braceletLengthCm` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `engravingMaxChars` int DEFAULT '0',
  `engravingSupported` tinyint(1) NOT NULL DEFAULT '0',
  `extraFee` decimal(10,2) DEFAULT NULL,
  `fontOptionsJson` json DEFAULT NULL,
  `gemstoneType` enum('DIAMOND','ZIRCON','PEARL','COLOR_GEM','NONE') COLLATE utf8mb4_unicode_ci DEFAULT 'NONE',
  `materialType` enum('GOLD_14K','GOLD_18K','SILVER_925','GOLD_PLATED','ROSE_GOLD','WHITE_GOLD','PEARL','GEMSTONE') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `necklaceLengthInch` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ringSizeEu` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ringSizeUs` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `productsku_skuCode_key` (`skuCode`),
  KEY `productsku_productId_idx` (`productId`),
  KEY `productsku_materialType_idx` (`materialType`),
  CONSTRAINT `productsku_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `product` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Data for table `productsku`
INSERT INTO `productsku` (`id`, `productId`, `skuCode`, `imageUrl`, `price`, `originalPrice`, `stock`, `stockStatus`, `attributeJson`, `deliveryDays`, `weightKg`, `volumeM3`, `createdAt`, `updatedAt`, `braceletLengthCm`, `engravingMaxChars`, `engravingSupported`, `extraFee`, `fontOptionsJson`, `gemstoneType`, `materialType`, `necklaceLengthInch`, `ringSizeEu`, `ringSizeUs`) VALUES
('05b1ac1f-d59f-4bc4-8332-881989def748', 'a2ea7f58-cea5-4df2-8d95-68c6dc272860', 'SKU-H2024-02-15L-W', 'https://www.autocoder.cc/background/zaki_prod/generated/1d4e3ec64dd44d15b1d3dfa4429a6f1c.png', '0.00', '0.00', 4, 'LOW_STOCK', '[{"name": "容量", "value": "15L"}, {"name": "供电", "value": "USB充电版"}, {"name": "颜色", "value": "纯白"}]', 3, '1.800', '0.0250', '2026-05-27 08:25:18', '2026-07-14 11:48:26', NULL, 0, 0, NULL, NULL, 'NONE', NULL, NULL, NULL, NULL),
('081d1cc7-b119-4e4a-8a2c-d9245ef13465', 'a2ea7f58-cea5-4df2-8d95-68c6dc272860', 'SKU-H2024-02-DEFAULT', 'https://productp.s3.us-west-2.amazonaws.com/background/zaki_dev/generated/0d8dbc0283304aafa2f7f348aa0bd5d8.png', '0.00', '0.00', 80, 'IN_STOCK', '[{"name": "颜色", "value": "星空灰"}, {"name": "版本", "value": "降噪升级版"}]', 5, '0.400', '0.0050', '2026-06-21 08:25:18', '2026-07-14 11:48:26', NULL, 0, 0, NULL, NULL, 'NONE', NULL, NULL, NULL, NULL),
('1ac83058-abc7-4d1c-aed6-6d0953972f0f', 'a2deb1bc-4f97-4284-b51b-236e7e6a52f1', 'SKU-B2024-01-300', 'https://www.autocoder.cc/background/zaki_prod/generated/887c55bcee014cd390f6a476e0acbef6.png', '0.00', '0.00', 150, 'IN_STOCK', '[{"name": "规格", "value": "150ml*2"}, {"name": "类型", "value": "双瓶特惠"}]', 2, '0.400', '0.0020', '2026-06-03 08:25:18', '2026-07-14 11:48:27', NULL, 0, 0, NULL, NULL, 'NONE', NULL, NULL, NULL, NULL),
('21090e1e-4ba8-41e4-a708-c759a2766490', '4dd45a81-c013-480b-b856-a4e8874a1ebe', 'SKU-T2024-02-BLUE', 'https://www.autocoder.cc/background/zaki_prod/generated/bbc53213262840fab1510ba9132abdf8.png', '0.00', '0.00', 45, 'IN_STOCK', '[{"name": "颜色", "value": "天空蓝"}, {"name": "版本", "value": "WIFI智能版"}]', 2, '0.800', '0.0080', '2026-06-06 08:25:18', '2026-07-14 11:48:27', NULL, 0, 0, NULL, NULL, 'NONE', NULL, NULL, NULL, NULL),
('23ea536d-fd4c-4c6b-a3f3-a1812d844f8f', '9969ef14-d7b4-4542-bd6e-6566632b6640', 'SKU-178505957382362', 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158', '83.00', NULL, 100, 'IN_STOCK', '[{"name": "来源SKU", "value": "标准版 / 默认规格"}]', NULL, NULL, NULL, '2026-07-26 09:52:53', '2026-07-26 09:52:53', NULL, 0, 0, NULL, NULL, 'NONE', NULL, NULL, NULL, NULL),
('2438bbbd-ac4b-4896-84b5-d456fba143b2', 'f4656fa0-52b2-46a1-863c-bfa991caec27', 'SKU-C2024-04-128G', 'https://www.autocoder.cc/background/zaki_prod/generated/a30bac492fe94736a040abeff84a1140.png', '0.00', '0.00', 25, 'IN_STOCK', '[{"name": "颜色", "value": "纯净白"}, {"name": "存储", "value": "带128G内存卡"}]', 3, '0.360', '0.0030', '2026-07-01 08:25:18', '2026-07-14 11:48:26', NULL, 0, 0, NULL, NULL, 'NONE', NULL, NULL, NULL, NULL),
('27c1504f-a22b-488b-b4c0-5b7c5c7a7682', '09556e62-0589-4917-9b28-4a6fe52558d8', 'SKU-1785059573864474', 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158', '58.00', NULL, 100, 'IN_STOCK', '[{"name": "来源SKU", "value": "标准版 / 默认规格"}]', NULL, NULL, NULL, '2026-07-26 09:52:53', '2026-07-26 09:52:53', NULL, 0, 0, NULL, NULL, 'NONE', NULL, NULL, NULL, NULL),
('2a82f5ba-8e20-460f-aae5-456cc9fa3975', '8f14ef51-3a5a-4a30-945c-a7d045c2d4d7', 'SKU-1785059573843417', 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158', '56.00', NULL, 100, 'IN_STOCK', '[{"name": "来源SKU", "value": "标准版 / 默认规格"}]', NULL, NULL, NULL, '2026-07-26 09:52:53', '2026-07-26 09:52:53', NULL, 0, 0, NULL, NULL, 'NONE', NULL, NULL, NULL, NULL),
('2b6f8735-b71d-4b04-a631-aa7e6b9fcf88', '855ef6c4-b24a-4625-a2b5-721372d96b04', 'SKU-F2024-01-BLACK-L', 'https://productp.s3.us-west-2.amazonaws.com/background/zaki_dev/generated/393b23d0ba2343d08e1d149ef5e94fcb.png', '0.00', '0.00', 8, 'LOW_STOCK', '[{"name": "颜色", "value": "经典黑"}, {"name": "尺码", "value": "L"}]', 3, '0.520', '0.0100', '2026-06-18 08:25:18', '2026-07-14 11:48:26', NULL, 0, 0, NULL, NULL, 'NONE', NULL, NULL, NULL, NULL),
('2e0ad1fb-533b-4d81-9689-e561a18a11b4', '2f008e64-60d0-4c5a-8f7a-b6d93c9a2d87', 'SKU-F2024-02-BLACK-M', 'https://productp.s3.us-west-2.amazonaws.com/background/zaki_dev/generated/212227e7ce1f4b3992a910d09de8dff1.png', '0.00', '0.00', 110, 'IN_STOCK', '[{"name": "颜色", "value": "星夜黑"}, {"name": "尺码", "value": "M"}, {"name": "裤长", "value": "九分裤"}]', 2, '0.250', '0.0030', '2026-06-20 08:25:18', '2026-07-14 11:48:26', NULL, 0, 0, NULL, NULL, 'NONE', NULL, NULL, NULL, NULL),
('38aa5575-b938-4377-b771-8bf907866f2f', 'd44fbeab-96f8-401e-8395-3e1d7d9d0cbc', 'SKU-1785059573780246', 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158', '68.00', NULL, 100, 'IN_STOCK', '[{"name": "来源SKU", "value": "标准版 / 默认规格"}]', NULL, NULL, NULL, '2026-07-26 09:52:53', '2026-07-26 09:52:53', NULL, 0, 0, NULL, NULL, 'NONE', NULL, NULL, NULL, NULL),
('3f288d34-ec5d-403d-ae65-7ac7783bf5f2', 'a2deb1bc-4f97-4284-b51b-236e7e6a52f1', 'SKU-B2024-01-150', 'https://productp.s3.us-west-2.amazonaws.com/background/zaki_dev/generated/e14231f2c6ed495192951d2b09cbfa79.png', '0.00', '0.00', 300, 'IN_STOCK', '[{"name": "规格", "value": "150ml"}, {"name": "类型", "value": "单瓶装"}]', 2, '0.200', '0.0010', '2026-06-01 08:25:18', '2026-07-14 11:48:27', NULL, 0, 0, NULL, NULL, 'NONE', NULL, NULL, NULL, NULL),
('405b09d0-f0dd-4d7e-95e7-b81084e63b01', 'bcad9a0b-246b-4f20-9eb4-9ea9ef0796cf', 'SKU-SW-103', 'https://www.autocoder.cc/background/zaki_prod/generated/aa2ef498d9fb40a28d6e8383f41d3d38.png', '0.00', '0.00', 12, 'IN_STOCK', '[{"name": "颜色", "value": "真皮棕"}, {"name": "表盘", "value": "46mm"}]', 2, '0.220', '0.0020', '2026-05-17 08:25:18', '2026-07-14 11:48:27', NULL, 0, 0, NULL, NULL, 'NONE', NULL, NULL, NULL, NULL),
('4f54aca4-4a6e-446b-b07f-e4ffb1fcbd8c', 'b895b311-5028-4f74-b28d-75fd80b94c0c', 'SKU-W2024-01-BLUE', 'https://www.autocoder.cc/background/zaki_prod/generated/568f8ac946b14553ba3983649268f7dc.png', '0.00', '0.00', 120, 'IN_STOCK', '[{"name": "颜色", "value": "深海蓝"}, {"name": "版本", "value": "标准版"}]', 3, '0.150', '0.0010', '2026-06-27 08:25:18', '2026-07-14 11:48:26', NULL, 0, 0, NULL, NULL, 'NONE', NULL, NULL, NULL, NULL),
('64afb701-0cec-4f2b-a72a-d373032d7060', 'b895b311-5028-4f74-b28d-75fd80b94c0c', 'SKU-W2024-01-DEFAULT', 'https://productp.s3.us-west-2.amazonaws.com/background/zaki_pre/generated/f3265d471aa04c8aa8519f81df959003.png', '0.00', '0.00', 150, 'IN_STOCK', '[{"name": "颜色", "value": "曜石黑"}, {"name": "版本", "value": "标准版"}]', 3, '0.150', '0.0010', '2026-06-26 08:25:18', '2026-07-14 11:48:26', NULL, 0, 0, NULL, NULL, 'NONE', NULL, NULL, NULL, NULL),
('688757b7-3857-437e-b012-dea07c35cc07', 'd8785e59-63fb-4e1b-9a13-fff1e618ccae', 'SKU-1785059573802497', 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158', '60.00', NULL, 100, 'IN_STOCK', '[{"name": "来源SKU", "value": "标准版 / 默认规格"}]', NULL, NULL, NULL, '2026-07-26 09:52:53', '2026-07-26 09:52:53', NULL, 0, 0, NULL, NULL, 'NONE', NULL, NULL, NULL, NULL),
('6d5991dd-41bc-4fc8-949b-57d60607a0e1', '13d75331-7ab2-45dd-a585-6f9718cd4823', 'SKU-T2024-01-200', 'https://project.autocoder.cc/background/zaki_dev/generated/fa16c9e8efc74107a78f2160829d2417.png', '100.00', '110.00', 40, 'IN_STOCK', '[]', NULL, '0.005', NULL, '2026-07-14 11:50:06', '2026-07-14 11:50:06', NULL, 0, 0, NULL, NULL, 'NONE', NULL, NULL, NULL, NULL),
('70bccefd-67fa-4eeb-a13e-f64a02d7fb33', 'c42cb16c-1b14-495a-bdd0-be563184b862', 'SKU-HD-010', 'https://productp.s3.us-west-2.amazonaws.com/background/zaki_test/generated/c908011370004a34b953bfca05aff175.png', '0.00', '0.00', 0, 'OUT_OF_STOCK', '[{"name": "颜色", "value": "樱花粉"}, {"name": "规格", "value": "带收纳盒"}]', 4, '0.300', '0.0040', '2026-06-01 08:25:18', '2026-07-14 11:48:27', NULL, 0, 0, NULL, NULL, 'NONE', NULL, NULL, NULL, NULL),
('7a3ba9ef-2558-4f65-8531-32cf0821678c', 'f4656fa0-52b2-46a1-863c-bfa991caec27', 'SKU-C2024-04-64G', 'https://www.autocoder.cc/background/zaki_prod/generated/a3a2dc858f6241dd9191a9b2fd32e4c9.png', '0.00', '0.00', 45, 'IN_STOCK', '[{"name": "颜色", "value": "纯净白"}, {"name": "存储", "value": "带64G内存卡"}]', 3, '0.360', '0.0030', '2026-06-30 08:25:18', '2026-07-14 11:48:26', NULL, 0, 0, NULL, NULL, 'NONE', NULL, NULL, NULL, NULL),
('828c3b95-5487-4128-b26d-a66c26a0bb20', '855ef6c4-b24a-4625-a2b5-721372d96b04', 'SKU-F2024-01-GREY-XL', 'https://productp.s3.us-west-2.amazonaws.com/background/zaki_dev/generated/bdc84c679419481a9822a86e7c29d0a8.png', '0.00', '0.00', 35, 'IN_STOCK', '[{"name": "颜色", "value": "花灰"}, {"name": "尺码", "value": "XL"}]', 3, '0.540', '0.0120', '2026-06-19 08:25:18', '2026-07-14 11:48:26', NULL, 0, 0, NULL, NULL, 'NONE', NULL, NULL, NULL, NULL),
('8371033a-b66f-4c1a-b6f5-86d68ed1606f', 'c42cb16c-1b14-495a-bdd0-be563184b862', 'SKU-HD-009', 'https://productp.s3.us-west-2.amazonaws.com/background/zaki_test/generated/a1893604678c41f7940b208d13269806.png', '0.00', '0.00', 5, 'LOW_STOCK', '[{"name": "颜色", "value": "曜石黑"}, {"name": "规格", "value": "带收纳盒"}]', 4, '0.300', '0.0040', '2026-05-27 08:25:18', '2026-07-14 11:48:27', NULL, 0, 0, NULL, NULL, 'NONE', NULL, NULL, NULL, NULL),
('85f64f7b-94de-442f-988b-a2c7e447cd52', 'fb8b3f32-c9b5-45d9-ae65-e926a76aa005', 'SKU-1785059573745232', 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158', '73.00', NULL, 100, 'IN_STOCK', '[{"name": "来源SKU", "value": "标准版 / 默认规格"}]', NULL, NULL, NULL, '2026-07-26 09:52:53', '2026-07-26 09:52:53', NULL, 0, 0, NULL, NULL, 'NONE', NULL, NULL, NULL, NULL),
('87d62dfa-094d-4ad7-850a-e21174549bbb', '2f008e64-60d0-4c5a-8f7a-b6d93c9a2d87', 'SKU-F2024-02-BLUE-M', 'https://productp.s3.us-west-2.amazonaws.com/background/zaki_dev/generated/9a649cceadf041e3babf7c094b3d2bf2.png', '0.00', '0.00', 6, 'LOW_STOCK', '[{"name": "颜色", "value": "雾霾蓝"}, {"name": "尺码", "value": "M"}, {"name": "裤长", "value": "九分裤"}]', 2, '0.250', '0.0030', '2026-06-21 08:25:18', '2026-07-14 11:48:26', NULL, 0, 0, NULL, NULL, 'NONE', NULL, NULL, NULL, NULL),
('88ec5645-2b96-44a6-83d6-a35ab111b2e8', '2d54c8c3-fade-43c8-a980-f8264d52f691', 'SKU-P2024-03-SILVER', 'https://productp.s3.us-west-2.amazonaws.com/background/zaki_dev/generated/a7c1b76274bf4af6b98caf900a342efb.png', '0.00', '0.00', 200, 'IN_STOCK', '[{"name": "颜色", "value": "太空银"}, {"name": "容量", "value": "20000mAh"}]', 4, '0.450', '0.0020', '2026-06-11 08:25:18', '2026-07-14 11:48:27', NULL, 0, 0, NULL, NULL, 'NONE', NULL, NULL, NULL, NULL),
('89b58df0-9884-484a-8955-69fb27c8dbd0', 'bcad9a0b-246b-4f20-9eb4-9ea9ef0796cf', 'SKU-SW-102', 'https://www.autocoder.cc/background/zaki_prod/generated/802a9d73c4dd49deafd01ca21d643fbe.png', '0.00', '0.00', 3, 'LOW_STOCK', '[{"name": "颜色", "value": "硅胶黑"}, {"name": "表盘", "value": "46mm"}]', 2, '0.200', '0.0020', '2026-05-12 08:25:18', '2026-07-14 11:48:27', NULL, 0, 0, NULL, NULL, 'NONE', NULL, NULL, NULL, NULL),
('90fdf33e-9470-44f5-a949-f9abe52c5a84', 'f4656fa0-52b2-46a1-863c-bfa991caec27', 'SKU-C2024-04-WHITE', 'https://www.autocoder.cc/background/zaki_prod/generated/8c3ebb0f419544f28e41d1e8d596fd3f.png', '0.00', '0.00', 90, 'IN_STOCK', '[{"name": "颜色", "value": "纯净白"}, {"name": "存储", "value": "无内存卡"}]', 3, '0.350', '0.0030', '2026-06-29 08:25:18', '2026-07-14 11:48:26', NULL, 0, 0, NULL, NULL, 'NONE', NULL, NULL, NULL, NULL),
('9cb82e43-74c5-44e5-9fbc-9483f3c6dfab', '2d54c8c3-fade-43c8-a980-f8264d52f691', 'SKU-P2024-03-BLACK', 'https://productp.s3.us-west-2.amazonaws.com/background/zaki_dev/generated/3425d0a54a0c411eafcdafdf90884293.png', '0.00', '0.00', 0, 'OUT_OF_STOCK', '[{"name": "颜色", "value": "陨石黑"}, {"name": "容量", "value": "20000mAh"}]', 7, '0.450', '0.0020', '2026-06-13 08:25:18', '2026-07-14 11:48:27', NULL, 0, 0, NULL, NULL, 'NONE', NULL, NULL, NULL, NULL),
('9d3232fd-67c5-4c19-94ee-250820b310ff', 'be89d938-f456-4dd0-a024-5aada52a88ba', 'SKU-178496391492359', 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158', '76.00', NULL, 100, 'IN_STOCK', '[{"name": "来源SKU", "value": "标准版 / 默认规格"}]', NULL, NULL, NULL, '2026-07-25 07:18:34', '2026-07-25 07:18:34', NULL, 0, 0, NULL, NULL, 'NONE', NULL, NULL, NULL, NULL),
('af710ecb-4760-4511-8818-e228ca69ef8e', '3116144e-a24f-482b-a9c5-7c52098c6494', 'SKU-1783948945533146', 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158', '94.80', NULL, 100, 'IN_STOCK', '[]', NULL, NULL, NULL, '2026-07-13 13:22:25', '2026-07-13 13:22:25', NULL, 0, 0, NULL, NULL, 'NONE', NULL, NULL, NULL, NULL),
('b7ed7e1f-6db7-4336-8362-99718c07ecfe', '2f008e64-60d0-4c5a-8f7a-b6d93c9a2d87', 'SKU-F2024-02-BLACK-L', 'https://productp.s3.us-west-2.amazonaws.com/background/zaki_test/generated/b4201f21821948a99ef606906acdca29.png', '0.00', '0.00', 5, 'LOW_STOCK', '[{"name": "颜色", "value": "星夜黑"}, {"name": "尺码", "value": "L"}, {"name": "裤长", "value": "九分裤"}]', 2, '0.260', '0.0030', '2026-06-22 08:25:18', '2026-07-14 11:48:26', NULL, 0, 0, NULL, NULL, 'NONE', NULL, NULL, NULL, NULL),
('bb9597aa-ddc4-4dc0-88fd-54ecede1e631', 'a2ea7f58-cea5-4df2-8d95-68c6dc272860', 'SKU-H2024-02-WHITE', 'https://productp.s3.us-west-2.amazonaws.com/background/zaki_dev/generated/570cced00bd6454384382645f17a1307.png', '0.00', '0.00', 60, 'IN_STOCK', '[{"name": "颜色", "value": "珍珠白"}, {"name": "版本", "value": "降噪升级版"}]', 5, '0.400', '0.0050', '2026-06-22 08:25:18', '2026-07-14 11:48:26', NULL, 0, 0, NULL, NULL, 'NONE', NULL, NULL, NULL, NULL),
('c46e68ef-8872-49f7-85a4-908a495449ac', 'a2ea7f58-cea5-4df2-8d95-68c6dc272860', 'SKU-H2024-02-12L', 'https://www.autocoder.cc/background/zaki_prod/generated/f13b2b7dff5c45ffa8567d0a0dbd0d32.png', '0.00', '0.00', 75, 'IN_STOCK', '[{"name": "容量", "value": "12L"}, {"name": "供电", "value": "电池版"}]', 3, '1.500', '0.0200', '2026-05-22 08:25:18', '2026-07-14 11:48:26', NULL, 0, 0, NULL, NULL, 'NONE', NULL, NULL, NULL, NULL),
('cc53672c-4dae-4548-aef2-61d98cc36c05', '4dd45a81-c013-480b-b856-a4e8874a1ebe', 'SKU-T2024-02-PINK', 'https://www.autocoder.cc/background/zaki_prod/generated/16f95d01af5e4a7a89793865732e5532.png', '0.00', '0.00', 0, 'OUT_OF_STOCK', '[{"name": "颜色", "value": "樱花粉"}, {"name": "版本", "value": "WIFI智能版"}]', 5, '0.800', '0.0080', '2026-06-07 08:25:18', '2026-07-14 11:48:27', NULL, 0, 0, NULL, NULL, 'NONE', NULL, NULL, NULL, NULL),
('d151f181-1fd5-4280-a8ab-ddcebe777da9', '2f008e64-60d0-4c5a-8f7a-b6d93c9a2d87', 'SKU-F2024-02-BLACK-S', 'https://productp.s3.us-west-2.amazonaws.com/background/zaki_dev/generated/22d9031e1a2f4fdcac5609b6639c0eb5.png', '0.00', '0.00', 90, 'IN_STOCK', '[{"name": "颜色", "value": "星夜黑"}, {"name": "尺码", "value": "S"}, {"name": "裤长", "value": "九分裤"}]', 2, '0.250', '0.0030', '2026-06-19 08:25:18', '2026-07-14 11:48:26', NULL, 0, 0, NULL, NULL, 'NONE', NULL, NULL, NULL, NULL),
('d382b32f-ed4e-4a7d-8c71-4968db5edaf7', '4dd45a81-c013-480b-b856-a4e8874a1ebe', 'SKU-T2024-02-YELLOW', 'https://productp.s3.us-west-2.amazonaws.com/background/zaki_dev/generated/22ef0d3406074db29b2dc64624a7f877.png', '0.00', '0.00', 30, 'IN_STOCK', '[{"name": "颜色", "value": "柠檬黄"}, {"name": "版本", "value": "WIFI智能版"}]', 2, '0.800', '0.0080', '2026-06-09 08:25:18', '2026-07-14 11:48:27', NULL, 0, 0, NULL, NULL, 'NONE', NULL, NULL, NULL, NULL),
('d9c8f7c5-6a04-4dba-a5ed-15e795947bbe', '4f5424e2-39fd-4834-9b2a-a6c9d75f71f5', 'SKU-1785059573716490', 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158', '96.00', NULL, 100, 'IN_STOCK', '[{"name": "来源SKU", "value": "标准版 / 默认规格"}]', NULL, NULL, NULL, '2026-07-26 09:52:53', '2026-07-26 09:52:53', NULL, 0, 0, NULL, NULL, 'NONE', NULL, NULL, NULL, NULL),
('de02208e-8ac5-401e-933e-bacc282b26e9', '855ef6c4-b24a-4625-a2b5-721372d96b04', 'SKU-F2024-01-GREY-M', 'https://productp.s3.us-west-2.amazonaws.com/background/zaki_dev/generated/922eedf9e3714f9d828484329c112265.png', '0.00', '0.00', 60, 'IN_STOCK', '[{"name": "颜色", "value": "花灰"}, {"name": "尺码", "value": "M"}]', 3, '0.500', '0.0100', '2026-06-16 08:25:18', '2026-07-14 11:48:27', NULL, 0, 0, NULL, NULL, 'NONE', NULL, NULL, NULL, NULL),
('eb826b37-bfeb-47b5-a389-bdea8215c7d8', '2d54c8c3-fade-43c8-a980-f8264d52f691', 'SKU-P2024-03-GOLD', 'https://www.autocoder.cc/background/zaki_prod/generated/9edd01df26a241eaa07ade5c773e73e4.png', '0.00', '0.00', 0, 'OUT_OF_STOCK', '[{"name": "颜色", "value": "香槟金"}, {"name": "容量", "value": "20000mAh"}]', 8, '0.450', '0.0020', '2026-06-16 08:25:18', '2026-07-14 11:48:27', NULL, 0, 0, NULL, NULL, 'NONE', NULL, NULL, NULL, NULL),
('ed4ec993-d210-494c-a47d-a7b329736f9a', 'a2ea7f58-cea5-4df2-8d95-68c6dc272860', 'SKU-H2024-02-15L', 'https://www.autocoder.cc/background/zaki_prod/generated/630628a399574e6fade54735a8e82d5f.png', '0.00', '0.00', 40, 'IN_STOCK', '[{"name": "容量", "value": "15L"}, {"name": "供电", "value": "USB充电版"}]', 3, '1.800', '0.0250', '2026-05-24 08:25:18', '2026-07-14 11:48:26', NULL, 0, 0, NULL, NULL, 'NONE', NULL, NULL, NULL, NULL),
('fde4270d-5733-473d-9a05-ba8623caebb3', '855ef6c4-b24a-4625-a2b5-721372d96b04', 'SKU-F2024-01-GREY-L', 'https://www.autocoder.cc/background/zaki_prod/generated/4c39175fcb15425e9f3eb7ef04b155c7.png', '0.00', '0.00', 45, 'IN_STOCK', '[{"name": "颜色", "value": "花灰"}, {"name": "尺码", "value": "L"}]', 3, '0.520', '0.0100', '2026-06-17 08:25:18', '2026-07-14 11:48:27', NULL, 0, 0, NULL, NULL, 'NONE', NULL, NULL, NULL, NULL);

-- Table structure for `promotioncampaign`
DROP TABLE IF EXISTS `promotioncampaign`;
CREATE TABLE `promotioncampaign` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `promotionType` enum('FLASH_SALE','COUPON','NEW_CUSTOMER','HOLIDAY','FULL_REDUCTION','PERCENTAGE_DISCOUNT','BUY_X_GET_Y') COLLATE utf8mb4_unicode_ci NOT NULL,
  `code` varchar(60) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `discountPercent` decimal(5,2) DEFAULT NULL,
  `discountAmount` decimal(10,2) DEFAULT NULL,
  `minOrderAmount` decimal(10,2) DEFAULT NULL,
  `startAt` datetime(3) DEFAULT NULL,
  `endAt` datetime(3) DEFAULT NULL,
  `usageLimit` int DEFAULT NULL,
  `usedCount` int NOT NULL DEFAULT '0',
  `contentJson` json DEFAULT NULL,
  `isActive` tinyint(1) NOT NULL DEFAULT '1',
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `promotioncampaign_code_key` (`code`),
  KEY `promotioncampaign_promotionType_idx` (`promotionType`),
  KEY `promotioncampaign_isActive_idx` (`isActive`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Data for table `promotioncampaign`
-- Table structure for `rolepermission`
DROP TABLE IF EXISTS `rolepermission`;
CREATE TABLE `rolepermission` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `roleCode` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `permissionKey` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `isAllowed` tinyint(1) NOT NULL DEFAULT '1',
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `rolepermission_roleCode_permissionKey_key` (`roleCode`,`permissionKey`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Data for table `rolepermission`
-- Table structure for `shippingtemplate`
DROP TABLE IF EXISTS `shippingtemplate`;
CREATE TABLE `shippingtemplate` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(120) COLLATE utf8mb4_unicode_ci NOT NULL,
  `countryCode` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `minWeightKg` decimal(10,3) DEFAULT NULL,
  `maxWeightKg` decimal(10,3) DEFAULT NULL,
  `minOrderAmount` decimal(10,2) DEFAULT NULL,
  `maxOrderAmount` decimal(10,2) DEFAULT NULL,
  `shippingFee` decimal(10,2) NOT NULL,
  `freeShippingOver` decimal(10,2) DEFAULT NULL,
  `isActive` tinyint(1) NOT NULL DEFAULT '1',
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Data for table `shippingtemplate`
-- Table structure for `sitesetting`
DROP TABLE IF EXISTS `sitesetting`;
CREATE TABLE `sitesetting` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `settingType` enum('PROMO_BAR','HERO_BANNER','CATEGORY_BANNER','HOT_MATERIAL','LOOKBOOK','TRUST_BADGE','HOT_SEARCH','FOOTER_LINK','FLOAT_CONTACT','HOMEPAGE_POSTER','HOME_SECTION','STATIC_COPY','EMAIL_TEMPLATE','PAYMENT_METHOD','CURRENCY_SETTING','EXCHANGE_RATE','SHIPPING_TEMPLATE','TAX_RULE','ROLE_PERMISSION','HOME_BRAND_SECTION','HOME_REVIEW_SECTION','HOME_FEATURED_KEYWORDS','FRONTEND_SCENE_SLOT') COLLATE utf8mb4_unicode_ci NOT NULL,
  `title` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `subtitle` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `contentJson` json NOT NULL,
  `imageUrl` varchar(700) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `localeCode` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `currencyCode` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `sortWeight` int NOT NULL DEFAULT '0',
  `isActive` tinyint(1) NOT NULL DEFAULT '1',
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `sitesetting_settingType_idx` (`settingType`),
  KEY `sitesetting_isActive_idx` (`isActive`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Data for table `sitesetting`
INSERT INTO `sitesetting` (`id`, `settingType`, `title`, `subtitle`, `contentJson`, `imageUrl`, `localeCode`, `currencyCode`, `sortWeight`, `isActive`, `createdAt`, `updatedAt`) VALUES
('10b07c65-55b0-4d7b-963e-145512bb8555', 'STATIC_COPY', 'CATEGORY_RECOMMENDED_KEYWORDS', '分类页热门搜索维护', '{"items": [{"isActive": true, "sortWeight": 0, "category_id": "1ff00246-26a7-4a5e-a1d8-d1b999fcf57a"}]}', NULL, NULL, NULL, 0, 1, '2026-07-14 11:34:18', '2026-07-14 11:47:00'),
('729ec9d9-7d24-11f1-83b6-02cf0dd0fdc5', 'HOME_FEATURED_KEYWORDS', '首页推荐关键词', '独立于一级分类的首页推荐商品来源', '{"keywords": ["jewelry", "kids", "beauty"]}', NULL, NULL, NULL, 0, 1, '2026-07-11 12:31:32', '2026-07-11 12:31:32'),
('dbabd1cc-7d0f-11f1-83b6-02cf0dd0fdc5', 'HOMEPAGE_POSTER', 'jewelry海报', '目录轮播海报', '{"items": [{"link": "/productcategory?categoryId=1ff00246-26a7-4a5e-a1d8-d1b999fcf57a", "title": "jewelry专区", "imageUrl": "https://project.autocoder.cc/background/zaki_dev/generated/9c83563212e94759b715547d41c534c7.png", "subtitle": "新品与热门单品推荐"}], "categoryId": "1ff00246-26a7-4a5e-a1d8-d1b999fcf57a"}', 'https://project.autocoder.cc/background/zaki_dev/generated/9c83563212e94759b715547d41c534c7.png', 'zh-CN', 'CNY', 99, 1, '2026-07-11 10:04:08', '2026-07-11 10:04:08'),
('dbabd380-7d0f-11f1-83b6-02cf0dd0fdc5', 'HOMEPAGE_POSTER', '时尚服饰海报', '目录轮播海报', '{"items": [{"link": "/productcategory?categoryId=502e355a-0794-46ac-85d4-56616929ebb0", "title": "时尚服饰专区", "imageUrl": "https://productp.s3.us-west-2.amazonaws.com/background/zaki_pre/generated/5a43017a9e4a436d91aa64dc649f8c8f.png", "subtitle": "新品与热门单品推荐"}], "categoryId": "502e355a-0794-46ac-85d4-56616929ebb0"}', 'https://productp.s3.us-west-2.amazonaws.com/background/zaki_pre/generated/5a43017a9e4a436d91aa64dc649f8c8f.png', 'zh-CN', 'CNY', 98, 1, '2026-07-11 10:04:08', '2026-07-11 10:04:08'),
('dbabd3ed-7d0f-11f1-83b6-02cf0dd0fdc5', 'HOMEPAGE_POSTER', '家居生活海报', '目录轮播海报', '{"items": [{"link": "/productcategory?categoryId=6eb7ccf8-52b9-4c46-a669-8ed78a2d6407", "title": "家居生活专区", "imageUrl": "https://productp.s3.us-west-2.amazonaws.com/background/zaki_test/generated/7a061b3b3426494da79af8ef12f16349.png", "subtitle": "新品与热门单品推荐"}], "categoryId": "6eb7ccf8-52b9-4c46-a669-8ed78a2d6407"}', 'https://productp.s3.us-west-2.amazonaws.com/background/zaki_test/generated/7a061b3b3426494da79af8ef12f16349.png', 'zh-CN', 'CNY', 97, 1, '2026-07-11 10:04:08', '2026-07-11 10:04:08'),
('dbabd439-7d0f-11f1-83b6-02cf0dd0fdc5', 'HOMEPAGE_POSTER', '美妆个护海报', '目录轮播海报', '{"items": [{"link": "/productcategory?categoryId=966dfa88-913a-4f59-ae32-b137b8a2cce7", "title": "美妆个护专区", "imageUrl": "https://productp.s3.us-west-2.amazonaws.com/background/zaki_test/generated/a84754609d9045b6994483aa942c203f.png", "subtitle": "新品与热门单品推荐"}], "categoryId": "966dfa88-913a-4f59-ae32-b137b8a2cce7"}', 'https://productp.s3.us-west-2.amazonaws.com/background/zaki_test/generated/a84754609d9045b6994483aa942c203f.png', 'zh-CN', 'CNY', 96, 1, '2026-07-11 10:04:08', '2026-07-11 10:04:08'),
('dbabd47a-7d0f-11f1-83b6-02cf0dd0fdc5', 'HOMEPAGE_POSTER', 'Bags海报', '目录轮播海报', '{"items": [{"link": "/productcategory?categoryId=c924289d-e073-47f9-9c0c-74db26d2ae23", "title": "Bags专区", "imageUrl": "", "subtitle": "新品与热门单品推荐"}], "categoryId": "c924289d-e073-47f9-9c0c-74db26d2ae23"}', '', 'zh-CN', 'CNY', 94, 1, '2026-07-11 10:04:08', '2026-07-11 10:04:08'),
('dbabd4b8-7d0f-11f1-83b6-02cf0dd0fdc5', 'HOMEPAGE_POSTER', '母婴玩具海报', '目录轮播海报', '{"items": [{"link": "/productcategory?categoryId=d13034a3-1e51-4f65-9096-6e0609e1b766", "title": "母婴玩具专区", "imageUrl": "https://productp.s3.us-west-2.amazonaws.com/background/zaki_dev/generated/593d5b3090b344b2823e166e7c84736d.png", "subtitle": "新品与热门单品推荐"}], "categoryId": "d13034a3-1e51-4f65-9096-6e0609e1b766"}', 'https://productp.s3.us-west-2.amazonaws.com/background/zaki_dev/generated/593d5b3090b344b2823e166e7c84736d.png', 'zh-CN', 'CNY', 95, 1, '2026-07-11 10:04:08', '2026-07-11 10:04:08');

-- Table structure for `sizemapping`
DROP TABLE IF EXISTS `sizemapping`;
CREATE TABLE `sizemapping` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `regionCode` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `jewelryType` enum('RING','NECKLACE','EARRING','BRACELET','ANKLET','SET','MENS_JEWELRY','GIFT_BOX','CUSTOM_ENGRAVING') COLLATE utf8mb4_unicode_ci NOT NULL,
  `sourceSize` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `targetRegionCode` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `targetSize` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `note` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `sizemapping_regionCode_jewelryType_idx` (`regionCode`,`jewelryType`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Data for table `sizemapping`
-- Table structure for `spectemplate`
DROP TABLE IF EXISTS `spectemplate`;
CREATE TABLE `spectemplate` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(120) COLLATE utf8mb4_unicode_ci NOT NULL,
  `code` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `fieldsJson` json NOT NULL,
  `translationsJson` json DEFAULT NULL,
  `isActive` tinyint(1) NOT NULL DEFAULT '1',
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `spectemplate_code_key` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Data for table `spectemplate`
-- Table structure for `sysuser`
DROP TABLE IF EXISTS `sysuser`;
CREATE TABLE `sysuser` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `account` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `role` enum('CUSTOMER','ADMIN') COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` enum('ACTIVE','DISABLED') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'ACTIVE',
  `username` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `avatarUrl` varchar(700) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `lastLoginAt` datetime(3) DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `braceletSize` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `phone` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `preferredCurrency` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `preferredLocale` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ringSizeEu` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ringSizeUs` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `savedPreferencesJson` json DEFAULT NULL,
  `adminNote` text COLLATE utf8mb4_unicode_ci,
  `countryCode` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `countryName` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `purchaseCount` int NOT NULL DEFAULT '0',
  `savedSizesJson` json DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `sysuser_account_key` (`account`),
  UNIQUE KEY `sysuser_email_key` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Data for table `sysuser`
INSERT INTO `sysuser` (`id`, `account`, `password`, `email`, `role`, `status`, `username`, `avatarUrl`, `lastLoginAt`, `createdAt`, `updatedAt`, `braceletSize`, `phone`, `preferredCurrency`, `preferredLocale`, `ringSizeEu`, `ringSizeUs`, `savedPreferencesJson`, `adminNote`, `countryCode`, `countryName`, `purchaseCount`, `savedSizesJson`) VALUES
('07969d0d-c2c3-494f-a4f1-5dab7830923a', '2707187015@qq.com', '9b7a7f313c740ade156059bf2cacb2926c27cd091366ee454fb37d53d1ee0e7d', '2707187015@qq.com', 'CUSTOMER', 'ACTIVE', '123', NULL, '2026-07-24 09:01:50', '2026-07-24 09:01:29', '2026-07-24 09:01:50', NULL, '18907141403', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL),
('1feaf42b-cece-42cf-b920-95473821eb02', 'm.chen@example.com', '07480fb9e85b9396af06f006cf1c95024af2531c65fb505cfbd0add1e2f31573', 'm.chen@example.com', 'CUSTOMER', 'ACTIVE', '陈美玲', 'https://productp.s3.us-west-2.amazonaws.com/background/zaki_dev/generated/a0710dc77a9848acaf1bbb36360d9d6e.png', '2026-07-26 09:57:34', '2026-06-26 08:25:17', '2026-07-26 09:57:34', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL),
('36693b1e-2eb2-4bc1-97fb-c879f1185b8a', 'j.wilson@example.com', '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92', 'j.wilson@example.com', 'CUSTOMER', 'ACTIVE', 'James Wilson', 'https://productp.s3.us-west-2.amazonaws.com/background/zaki_dev/generated/298c920a113a42ca92a3bd2d24f27dba.png', '2026-07-08 08:25:17', '2026-07-01 08:25:17', '2026-07-02 08:25:17', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL),
('955ba548-6a81-48aa-a2df-1634f6cc12eb', 't.sato@example.com', '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92', 't.sato@example.com', 'CUSTOMER', 'ACTIVE', '佐藤 健', 'https://images.unsplash.com/photo-1632957801446-d0a26e1b1302?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4MTc3NTR8MHwxfHNlYXJjaHw1fHx3b21hbiUyMHNvcGhpc3RpY2F0ZWQlMjBsaWZlc3R5bGUlMjBoZWFkc2hvdCUyMHByb2ZpbGUlMjBwb3J0cmFpdHxlbnwwfDF8fHwxNzc1ODk1MDUzfDA&ixlib=rb-4.1.0&q=85', '2026-07-10 08:25:17', '2026-07-06 08:25:17', '2026-07-07 08:25:17', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL),
('9e38b788-9a55-4db1-8dad-debe5c87586a', 'sarah.connor@example.com', '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92', 'sarah.connor@example.com', 'CUSTOMER', 'ACTIVE', 'Sarah Connor', 'https://www.autocoder.cc/background/zaki_prod/generated/a144c5db2fc148b69048d4724bfbb553.png', '2026-07-01 08:25:17', '2026-05-27 08:25:17', '2026-05-28 08:25:17', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL),
('a7bd2ae8-0589-4431-95f7-2d67ab8f879b', 'jason_bourne@example.com', '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92', 'jason_bourne@example.com', 'CUSTOMER', 'DISABLED', 'Jason Bourne', 'https://productp.s3.us-west-2.amazonaws.com/background/zaki_dev/generated/12dde241ef9b45a49d80cf9fe05f93fc.png', '2026-06-21 08:25:17', '2026-05-12 08:25:17', '2026-05-13 08:25:17', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL),
('b8b6a765-bb58-40b3-8ee3-9d5eb600d216', 'admin@globaltrade.com', '790f48e3ba51e2d0762e7d4a74d4076a62cfb34d44e3dfbc43798fe9ff399602', 'admin@globaltrade.com', 'ADMIN', 'ACTIVE', '超级管理员', 'https://productp.s3.us-west-2.amazonaws.com/background/zaki_test/generated/7154d9343aaf4ac089d1d995b7661f8b.png', '2026-07-26 10:01:50', '2026-06-16 08:25:17', '2026-07-26 10:01:50', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL),
('cb371005-0848-434d-94a4-25231d33c550', '2543760210@qq.com', '98156f966782350ba25def2afc73a84e779d2e56dca4582182c8ce4a562469a0', '2543760210@qq.com', 'ADMIN', 'ACTIVE', '2543760210@qq.com', NULL, '2026-07-13 09:39:55', '2026-07-11 09:37:40', '2026-07-13 09:39:55', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL);

-- Table structure for `taxrule`
DROP TABLE IF EXISTS `taxrule`;
CREATE TABLE `taxrule` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `countryCode` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL,
  `countryName` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `taxType` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `taxRate` decimal(6,2) NOT NULL,
  `taxNumber` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `isActive` tinyint(1) NOT NULL DEFAULT '1',
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `taxrule_countryCode_idx` (`countryCode`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Data for table `taxrule`
-- Table structure for `useraddress`
DROP TABLE IF EXISTS `useraddress`;
CREATE TABLE `useraddress` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `userId` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `recipientName` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `countryCode` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL,
  `countryName` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `stateName` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `cityName` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `addressLine1` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `addressLine2` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `postalCode` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `isDefault` tinyint(1) NOT NULL DEFAULT '0',
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `useraddress_userId_idx` (`userId`),
  CONSTRAINT `useraddress_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `sysuser` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Data for table `useraddress`
-- Table structure for `wishlistitem`
DROP TABLE IF EXISTS `wishlistitem`;
CREATE TABLE `wishlistitem` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `userId` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `productId` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` enum('ACTIVE','MOVED_TO_CART') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'ACTIVE',
  `shareToken` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `wishlistitem_userId_productId_key` (`userId`,`productId`),
  UNIQUE KEY `wishlistitem_shareToken_key` (`shareToken`),
  KEY `wishlistitem_userId_idx` (`userId`),
  KEY `wishlistitem_productId_idx` (`productId`),
  CONSTRAINT `wishlistitem_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `product` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `wishlistitem_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `sysuser` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Data for table `wishlistitem`
SET FOREIGN_KEY_CHECKS = 1;
