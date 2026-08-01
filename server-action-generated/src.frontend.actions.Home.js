"use server";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// common-redirect:@/tools/prisma
var require_prisma = __commonJS({
  "common-redirect:@/tools/prisma"(exports2, module2) {
    module2.exports = require("./_common").prisma;
  }
});

// common-redirect:@/frontend/action_utils
var require_action_utils = __commonJS({
  "common-redirect:@/frontend/action_utils"(exports2, module2) {
    module2.exports = require("./_common").frontendAuth;
  }
});

// src/frontend/actions/Home.ts
var Home_exports = {};
__export(Home_exports, {
  addCartItem: () => addCartItem,
  getBrandShelf: () => getBrandShelf,
  getCategoryDetail: () => getCategoryDetail,
  getCategoryList: () => getCategoryList,
  getHomeCategoryGuide: () => getHomeCategoryGuide,
  getHomeFeaturedProducts: () => getHomeFeaturedProducts,
  getHomeRecommendZones: () => getHomeRecommendZones,
  getHomeReviewSection: () => getHomeReviewSection,
  getHomeSceneKeywordGroups: () => getHomeSceneKeywordGroups,
  getProductList: () => getProductList
});
module.exports = __toCommonJS(Home_exports);

// src/frontend/actions/ProductCategory.ts
var import_prisma2 = __toESM(require_prisma());

// src/backend/actions/homeRecommendZoneCache.ts
var import_prisma = __toESM(require_prisma());
var cachedZones = null;
async function readHomeRecommendZonesWithCache() {
  if (cachedZones) {
    return cachedZones;
  }
  const records = await import_prisma.default.homeRecommendZone.findMany({
    where: {
      isActive: true
    },
    orderBy: [
      { sortWeight: "desc" },
      { createdAt: "desc" }
    ],
    include: {
      items: {
        orderBy: [
          { sortWeight: "desc" },
          { createdAt: "asc" }
        ],
        include: {
          product: {
            include: {
              skus: {
                orderBy: {
                  price: "asc"
                }
              }
            }
          },
          category: {
            include: {
              parent: true,
              _count: {
                select: {
                  products: true
                }
              }
            }
          }
        }
      }
    }
  });
  cachedZones = records;
  return records;
}

// src/frontend/actions/ProductCategory.ts
var import_action_utils = __toESM(require_action_utils());
var USD_EXCHANGE_RATE = 6.5;
var DEFAULT_BRAND_COLLAPSED_ROWS = 3;
var CATEGORY_TOP_PROMOTION_TITLE = "CATEGORY_TOP_PROMOTION";
var DEFAULT_KEYWORD_SCENE_AREAS = ["BOTH", "LEFT_NAV", "RECOMMENDATION"];
var normalizeSceneValue = (value) => {
  if (typeof value !== "string") {
    return void 0;
  }
  const normalized = value.trim();
  return normalized.length > 0 ? normalized : void 0;
};
var parseCategoryDisplayConfig = (rawConfig) => {
  const config = typeof rawConfig === "object" && rawConfig !== null ? rawConfig : {};
  const collapsedRows = Number(config.brandFilterCollapsedRows);
  return {
    showChildrenByDefault: config.showChildrenByDefault !== false,
    allowChildrenCollapse: config.allowChildrenCollapse !== false,
    showBrandFilter: config.showBrandFilter === true,
    brandFilterCollapsedRows: Number.isFinite(collapsedRows) && collapsedRows > 0 ? collapsedRows : DEFAULT_BRAND_COLLAPSED_ROWS
  };
};
var normalizeKeywordSceneArea = (value) => {
  if (value === "LEFT_NAV" || value === "RECOMMENDATION" || value === "BOTH") {
    return value;
  }
  return void 0;
};
var resolveKeywordSceneAreas = (sceneArea) => {
  if (sceneArea === "LEFT_NAV") {
    return ["LEFT_NAV", "BOTH"];
  }
  if (sceneArea === "RECOMMENDATION") {
    return ["RECOMMENDATION", "BOTH"];
  }
  if (sceneArea === "BOTH") {
    return ["BOTH"];
  }
  return DEFAULT_KEYWORD_SCENE_AREAS;
};
var buildKeywordGroupOrderBy = () => [
  { homepageSortWeight: "desc" },
  { sortWeight: "desc" },
  { createdAt: "asc" }
];
var toUsdPrice = (rmbPrice) => {
  if (typeof rmbPrice !== "number" || Number.isNaN(rmbPrice)) {
    return 0;
  }
  return Number((rmbPrice / USD_EXCHANGE_RATE).toFixed(2));
};
var normalizePromotionText = (value) => {
  if (typeof value !== "string") {
    return null;
  }
  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
};
var normalizePromotionBoolean = (value, fallback) => {
  if (typeof value === "boolean") {
    return value;
  }
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (normalized === "true") return true;
    if (normalized === "false") return false;
  }
  return fallback;
};
var normalizePromotionDate = (value) => {
  if (typeof value === "string") {
    const normalized = value.trim();
    if (!normalized) {
      return null;
    }
    const parsed = new Date(normalized);
    return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
  }
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString();
  }
  return null;
};
var parseCategoryTopPromotion = (rawContent, fallbackActive) => {
  const content = typeof rawContent === "object" && rawContent !== null ? rawContent : null;
  if (!content) {
    return null;
  }
  const message = normalizePromotionText(content.message ?? content.text ?? content.title);
  const endTime = normalizePromotionDate(content.end_time ?? content.endTime ?? content.endsAt);
  const backgroundColor = normalizePromotionText(content.background_color ?? content.backgroundColor ?? content.bgColor);
  const textColor = normalizePromotionText(content.text_color ?? content.textColor ?? content.color);
  const enabled = normalizePromotionBoolean(content.enabled, fallbackActive);
  return {
    enabled,
    message,
    end_time: endTime,
    background_color: backgroundColor,
    text_color: textColor
  };
};
var resolveCategoryContext = async (categoryId) => {
  if (!categoryId) {
    return {
      descendantCategoryIds: [],
      categoryIdsForQuery: []
    };
  }
  const currentCategory = await import_prisma2.default.category.findUnique({
    where: { id: categoryId },
    select: {
      id: true,
      level: true,
      parentId: true,
      status: true,
      parent: {
        select: {
          id: true,
          status: true
        }
      },
      children: {
        where: {
          status: "ACTIVE"
        },
        select: {
          id: true
        }
      }
    }
  });
  if (!currentCategory || currentCategory.status !== "ACTIVE") {
    return {
      descendantCategoryIds: [],
      categoryIdsForQuery: []
    };
  }
  if (currentCategory.level === 1) {
    const descendantCategoryIds = currentCategory.children.map((child) => child.id);
    return {
      rootCategoryId: currentCategory.id,
      matchedCategoryId: currentCategory.id,
      matchedCategoryLevel: currentCategory.level,
      descendantCategoryIds,
      categoryIdsForQuery: Array.from(/* @__PURE__ */ new Set([currentCategory.id, ...descendantCategoryIds]))
    };
  }
  return {
    rootCategoryId: currentCategory.parent?.status === "ACTIVE" ? currentCategory.parent.id : currentCategory.parentId || void 0,
    matchedCategoryId: currentCategory.id,
    matchedCategoryLevel: currentCategory.level,
    descendantCategoryIds: [],
    categoryIdsForQuery: [currentCategory.id]
  };
};
var buildProductWhere = (context, brandCategoryId, keywordId, keywordGroupId) => {
  const where = {
    status: "ACTIVE",
    category: {
      status: "ACTIVE"
    }
  };
  const orConditions = [];
  if (context.categoryIdsForQuery.length > 0) {
    orConditions.push({
      categoryId: {
        in: context.categoryIdsForQuery
      }
    });
    orConditions.push({
      relationCategories: {
        some: {
          categoryId: {
            in: context.categoryIdsForQuery
          },
          category: {
            status: "ACTIVE"
          }
        }
      }
    });
  } else if (context.rootCategoryId) {
    where.category = {
      ...where.category,
      OR: [
        { id: context.rootCategoryId },
        { parentId: context.rootCategoryId }
      ]
    };
  }
  if (orConditions.length > 0) {
    where.OR = orConditions;
  }
  if (brandCategoryId) {
    where.brandCategoryId = brandCategoryId;
  }
  if (keywordId) {
    where.relationKeywords = {
      some: {
        keywordId
      }
    };
  }
  if (keywordGroupId) {
    where.keywordGroupLinks = {
      some: {
        keywordGroupId
      }
    };
  }
  return where;
};
var getCategoryList = (0, import_action_utils.withResult)(async () => {
  const categories = await import_prisma2.default.category.findMany({
    where: {
      status: "ACTIVE"
    },
    include: {
      products: {
        where: { status: "ACTIVE" },
        select: { id: true }
      },
      navConfig: true
    },
    orderBy: [
      { sortWeight: "desc" },
      { createdAt: "asc" }
    ]
  });
  const mainCategories = categories.filter((cat) => cat.level === 1 && !cat.isBrandCategory && cat.navConfig?.isVisible !== false);
  const childCategories = categories.filter((cat) => cat.level === 2 && !cat.isBrandCategory);
  const brandCategories = categories.filter((cat) => cat.isBrandCategory);
  return {
    list: mainCategories.map((cat) => ({
      category_id: cat.id,
      category_name: cat.navConfig?.navTitle?.trim() || cat.name,
      category_slug: cat.slug,
      parent_category_id: cat.parentId,
      level: cat.level,
      display_config: parseCategoryDisplayConfig(cat.categoryDisplayConfigJson),
      children: childCategories.filter((child) => child.parentId === cat.id).map((child) => ({
        category_id: child.id,
        category_name: child.name,
        category_slug: child.slug
      })),
      brand_options: brandCategories.filter((brand) => brand.parentId === cat.id).map((brand) => ({
        category_id: brand.id,
        category_name: brand.name,
        category_slug: brand.slug,
        product_count: brand.products.length
      })).sort((a, b) => b.product_count - a.product_count || a.category_name.localeCompare(b.category_name, "zh-CN"))
    }))
  };
});
var getCategoryDetail = (0, import_action_utils.withResult)(async (input) => {
  const category = await import_prisma2.default.category.findUnique({
    where: { id: input.category_id },
    include: {
      parent: true
    }
  });
  if (!category || category.status !== "ACTIVE") {
    return { detail: null };
  }
  const mainCategory = category.level === 1 ? category : category.parent && category.parent.status === "ACTIVE" && !category.parent.isBrandCategory ? category.parent : null;
  if (!mainCategory) {
    return { detail: null };
  }
  const categoryContext = await resolveCategoryContext(category.id);
  const productCount = await import_prisma2.default.product.count({
    where: buildProductWhere(categoryContext)
  });
  const displayConfig = parseCategoryDisplayConfig(mainCategory.categoryDisplayConfigJson);
  return {
    detail: {
      category_id: mainCategory.id,
      category_name: category.name,
      category_description: category.description || mainCategory.description,
      product_count: productCount,
      current_category_id: category.id,
      current_category_level: category.level,
      parent_category_id: category.level === 2 ? mainCategory.id : null,
      display_config: displayConfig,
      show_brand_filter: displayConfig.showBrandFilter
    }
  };
});
var getCategoryPosterList = (0, import_action_utils.withResult)(async (input) => {
  const categoryContext = await resolveCategoryContext(input.category_id);
  const mainCategoryId = categoryContext.rootCategoryId;
  const bannerRecords = await import_prisma2.default.categorybanner.findMany({
    where: {
      isEnabled: true
    },
    orderBy: [
      { sortWeight: "desc" },
      { updatedAt: "desc" }
    ]
  });
  const posterList = bannerRecords.map((banner) => ({
    poster_id: banner.id,
    title: banner.title || "\u9996\u9875\u6A2A\u5E45",
    subtitle: null,
    image_url: banner.imageUrl,
    link_text: null,
    link_url: banner.linkUrl || null,
    category_id: null,
    sort_weight: Number(banner.sortWeight ?? 0)
  }));
  const sortedPosterList = mainCategoryId ? [
    ...posterList.filter((item) => item.category_id === mainCategoryId),
    ...posterList.filter((item) => !item.category_id),
    ...posterList.filter((item) => item.category_id && item.category_id !== mainCategoryId)
  ] : posterList;
  return {
    list: [...sortedPosterList].sort((a, b) => b.sort_weight - a.sort_weight)
  };
});
var getCategoryTopPromotion = (0, import_action_utils.withResult)(async () => {
  const setting = await import_prisma2.default.sitesetting.findFirst({
    where: {
      title: CATEGORY_TOP_PROMOTION_TITLE
    },
    orderBy: [
      { isActive: "desc" },
      { sortWeight: "desc" },
      { createdAt: "desc" }
    ]
  });
  if (!setting) {
    return {
      promotion: null
    };
  }
  return {
    promotion: parseCategoryTopPromotion(setting.contentJson, setting.isActive)
  };
});
var getKeywordGroupList = (0, import_action_utils.withResult)(async (input = {}) => {
  const sceneAreas = resolveKeywordSceneAreas(normalizeKeywordSceneArea(input.scene_area));
  const sceneSlotKey = normalizeSceneValue(input.scene_slot_key);
  const groups = await import_prisma2.default.keywordgroup.findMany({
    where: {
      isActive: true,
      ...input.group_id ? { id: input.group_id } : {},
      ...sceneSlotKey ? { sceneSlotKey } : {},
      sceneArea: {
        in: sceneAreas
      }
    },
    orderBy: buildKeywordGroupOrderBy()
  });
  return {
    list: groups.map((group) => ({
      group_id: group.id,
      group_name: group.floorTitle?.trim() || group.name,
      scene_area: group.sceneArea,
      scene_slot_key: group.sceneSlotKey || null,
      homepage_sort_weight: group.homepageSortWeight,
      sort_weight: group.sortWeight
    }))
  };
});
var getKeywordList = (0, import_action_utils.withResult)(async (input = {}) => {
  const sceneAreas = resolveKeywordSceneAreas(normalizeKeywordSceneArea(input.scene_area));
  const sceneSlotKey = normalizeSceneValue(input.scene_slot_key);
  const groups = await import_prisma2.default.keywordgroup.findMany({
    where: {
      isActive: true,
      ...input.group_id ? { id: input.group_id } : {},
      ...sceneSlotKey ? { sceneSlotKey } : {},
      sceneArea: {
        in: sceneAreas
      }
    },
    include: {
      keywords: {
        where: {
          isActive: true
        },
        orderBy: [
          { sortWeight: "desc" },
          { createdAt: "asc" }
        ],
        include: {
          categoryLinks: {
            orderBy: [
              { createdAt: "asc" }
            ]
          }
        }
      }
    },
    orderBy: buildKeywordGroupOrderBy()
  });
  return {
    list: groups.flatMap((group) => group.keywords.map((keyword) => ({
      keyword_id: keyword.id,
      keyword_label: keyword.keyword,
      category_id: keyword.categoryLinks[0]?.categoryId || null,
      linked_category_ids: keyword.categoryLinks.map((link) => link.categoryId),
      sort_weight: keyword.sortWeight,
      group_id: group.id,
      group_name: group.floorTitle?.trim() || group.name,
      scene_area: group.sceneArea
    }))).sort((a, b) => b.sort_weight - a.sort_weight || a.keyword_label.localeCompare(b.keyword_label, "zh-CN"))
  };
});
var getCategorySideNavZones = (0, import_action_utils.withResult)(async () => {
  const zones = await readHomeRecommendZonesWithCache();
  return {
    zones: zones.filter((zone) => zone.zoneType === "SIDE_NAV").map((zone) => ({
      zone_id: zone.id,
      title: zone.title,
      items: zone.items.reduce((acc, item) => {
        const category = item.category;
        if (item.entityType !== "SIDE_NAV" || !category || category.status !== "ACTIVE") {
          return acc;
        }
        acc.push({
          item_id: item.id,
          category_id: category.id,
          category_name: category.name,
          category_slug: category.slug,
          level: category.level,
          parent_category_id: category.parentId,
          parent_category_name: category.parent?.name || null,
          product_count: category._count.products
        });
        return acc;
      }, [])
    })).filter((zone) => zone.items.length > 0)
  };
});
var getProductList = (0, import_action_utils.withResult)(async (input) => {
  const page = input.page && input.page > 0 ? input.page : 1;
  const pageSize = input.page_size && input.page_size > 0 ? input.page_size : 24;
  const categoryContext = await resolveCategoryContext(input.category_id);
  const dbWhere = buildProductWhere(categoryContext, input.brand_category_id, input.keyword_id, input.keyword_group_id);
  if (input.min_rating !== void 0) {
    dbWhere.ratingAverage = { gte: input.min_rating };
  }
  const dbProducts = await import_prisma2.default.product.findMany({
    where: dbWhere,
    include: {
      skus: true,
      brandCategory: true,
      relationCategories: {
        include: {
          category: {
            select: {
              id: true,
              status: true,
              parentId: true
            }
          }
        }
      },
      relationKeywords: {
        select: {
          keywordId: true
        }
      },
      keywordGroupLinks: {
        select: {
          keywordGroupId: true,
          sortWeight: true
        }
      }
    },
    take: 2e3
  });
  let items = dbProducts.map((p) => {
    const skus = p.skus;
    const skuCount = skus.length;
    const sortedSkus = [...skus].sort((a, b) => a.price.toNumber() - b.price.toNumber());
    const defaultSku = sortedSkus.length > 0 ? sortedSkus[0] : null;
    let stockStatus = "OUT_OF_STOCK";
    if (skus.some((s) => s.stockStatus === "IN_STOCK")) {
      stockStatus = "IN_STOCK";
    } else if (skus.some((s) => s.stockStatus === "LOW_STOCK")) {
      stockStatus = "LOW_STOCK";
    }
    const priceRmb = defaultSku ? defaultSku.price.toNumber() : 0;
    const originalPriceRmb = defaultSku?.originalPrice ? defaultSku.originalPrice.toNumber() : null;
    const priceNum = toUsdPrice(priceRmb);
    const originalPriceNum = originalPriceRmb !== null ? toUsdPrice(originalPriceRmb) : null;
    const hasDiscount = originalPriceNum !== null && originalPriceNum > priceNum;
    return {
      product_id: p.id,
      product_slug: p.slug,
      product_name: p.name,
      main_image_url: p.mainImageUrl,
      short_description: p.shortDescription,
      rating_average: p.ratingAverage,
      rating_count: p.ratingCount,
      stock_status: stockStatus,
      price: priceNum,
      original_price: originalPriceNum,
      has_discount: hasDiscount,
      sku_count: skuCount,
      first_sku_id: defaultSku ? defaultSku.id : "",
      first_sku_price_rmb: priceRmb,
      created_at_timestamp: p.createdAt.getTime(),
      sort_weight: p.sortWeight,
      brand_category_id: p.brandCategoryId,
      brand_category_name: p.brandCategory?.name || null
    };
  });
  if (input.min_price !== void 0) {
    items = items.filter((i) => i.price >= input.min_price);
  }
  if (input.max_price !== void 0) {
    items = items.filter((i) => i.price <= input.max_price);
  }
  if (input.has_discount) {
    items = items.filter((i) => i.has_discount);
  }
  if (input.stock_status && input.stock_status.length > 0) {
    items = items.filter((i) => input.stock_status.includes(i.stock_status));
  }
  const sortBy = input.sort_by || "NEWEST";
  items.sort((a, b) => {
    switch (sortBy) {
      case "PRICE_ASC":
        return a.price - b.price;
      case "PRICE_DESC":
        return b.price - a.price;
      case "POPULARITY":
        if (b.sort_weight !== a.sort_weight) return b.sort_weight - a.sort_weight;
        return b.rating_count - a.rating_count;
      case "NEWEST":
      default:
        if (input.keyword_group_id) {
          if (b.sort_weight !== a.sort_weight) return b.sort_weight - a.sort_weight;
        }
        return b.created_at_timestamp - a.created_at_timestamp;
    }
  });
  const total = items.length;
  const skip = (page - 1) * pageSize;
  return {
    list: items.slice(skip, skip + pageSize),
    total
  };
});
var addToCart = (0, import_action_utils.requireRole)([import_action_utils.UserRole.CUSTOMER])(
  (0, import_action_utils.withResult)(async (input) => {
    const { userId } = (0, import_action_utils.getAuthContext)();
    const product = await import_prisma2.default.product.findUnique({
      where: { id: input.product_id },
      include: { category: true }
    });
    if (!product || product.status !== "ACTIVE" || product.category.status !== "ACTIVE") {
      throw new Error("\u8BE5\u5546\u54C1\u4E0D\u5B58\u5728\u6216\u5DF2\u4E0B\u67B6");
    }
    const sku = await import_prisma2.default.productsku.findUnique({
      where: { id: input.product_sku_id }
    });
    if (!sku || sku.productId !== input.product_id) {
      throw new Error("\u8BF7\u6C42\u7684\u5546\u54C1\u89C4\u683C\u65E0\u6548");
    }
    if (input.quantity <= 0) {
      throw new Error("\u52A0\u8D2D\u6570\u91CF\u5FC5\u987B\u5927\u4E8E\u96F6");
    }
    if (sku.stock < input.quantity) {
      throw new Error("\u5546\u54C1\u5E93\u5B58\u4E0D\u8DB3");
    }
    let cart = await import_prisma2.default.cart.findUnique({
      where: { accountId: userId }
    });
    if (!cart) {
      cart = await import_prisma2.default.cart.create({
        data: {
          account: { connect: { id: userId } }
        }
      });
    }
    const existingItem = await import_prisma2.default.cartitem.findFirst({
      where: {
        cartId: cart.id,
        productSkuId: sku.id,
        engravingText: null,
        engravingFont: null
      }
    });
    if (existingItem) {
      const newQuantity = existingItem.quantity + input.quantity;
      if (newQuantity > sku.stock) {
        throw new Error("\u52A0\u8D2D\u540E\u6570\u91CF\u8D85\u8FC7\u4E86\u5F53\u524D\u5546\u54C1\u5E93\u5B58\u4E0A\u9650");
      }
      await import_prisma2.default.cartitem.update({
        where: { id: existingItem.id },
        data: {
          quantity: newQuantity,
          status: "VALID"
        }
      });
    } else {
      await import_prisma2.default.cartitem.create({
        data: {
          cart: { connect: { id: cart.id } },
          product: { connect: { id: product.id } },
          productSku: { connect: { id: sku.id } },
          quantity: input.quantity,
          status: "VALID"
        }
      });
    }
    return { success: true };
  })
);

// src/frontend/actions/Home.ts
var USD_EXCHANGE_RATE2 = 6.5;
var toUsdPrice2 = (rmbPrice) => {
  if (typeof rmbPrice !== "number" || Number.isNaN(rmbPrice) || rmbPrice <= 0) {
    return 0;
  }
  return Math.round(rmbPrice / USD_EXCHANGE_RATE2 * 100) / 100;
};
var normalizePcCols = (value) => {
  if (value === 3 || value === 5) {
    return value;
  }
  return 4;
};
var normalizeMobileCols = (value) => {
  return value === 1 ? 1 : 2;
};
var getHomeRecommendZones = async () => {
  const zones = await readHomeRecommendZonesWithCache();
  const result = zones.map((zone) => {
    const items = zone.items.reduce((acc, item) => {
      if (item.entityType === "PRODUCT") {
        const product = item.product;
        if (!product || product.status !== "ACTIVE") {
          return acc;
        }
        const sortedSkus = [...product.skus].sort((a, b) => a.price.toNumber() - b.price.toNumber());
        const defaultSku = sortedSkus[0];
        if (!defaultSku) {
          return acc;
        }
        const price = toUsdPrice2(defaultSku.price.toNumber());
        const originalPrice = defaultSku.originalPrice ? toUsdPrice2(defaultSku.originalPrice.toNumber()) : null;
        acc.push({
          itemId: item.id,
          entityType: "PRODUCT",
          productId: product.id,
          categoryId: product.categoryId,
          productName: product.name,
          productSlug: product.slug,
          imageUrl: product.mainImageUrl,
          shortDescription: product.shortDescription,
          price,
          originalPrice,
          ratingAverage: product.ratingAverage,
          ratingCount: product.ratingCount,
          skuCount: product.skus.length,
          defaultSkuId: defaultSku.id
        });
        return acc;
      }
      const category = item.category;
      if (!category || category.status !== "ACTIVE") {
        return acc;
      }
      if (item.entityType === "SIDE_NAV") {
        acc.push({
          itemId: item.id,
          entityType: "SIDE_NAV",
          categoryId: category.id,
          categoryName: category.name,
          categorySlug: category.slug,
          level: category.level,
          parentCategoryId: category.parentId,
          parentCategoryName: category.parent?.name || null,
          productCount: category._count.products
        });
        return acc;
      }
      acc.push({
        itemId: item.id,
        entityType: "CATEGORY",
        categoryId: category.id,
        categoryName: category.name,
        categorySlug: category.slug,
        imageUrl: category.imageUrl || category.bannerImageUrl,
        description: category.description,
        productCount: category._count.products
      });
      return acc;
    }, []);
    if (items.length === 0) {
      return null;
    }
    return {
      zoneId: zone.id,
      title: zone.title,
      zoneType: zone.zoneType,
      pcCols: normalizePcCols(zone.pcCols),
      mobileCols: normalizeMobileCols(zone.mobileCols),
      sortWeight: zone.sortWeight,
      items
    };
  }).filter((zone) => zone !== null);
  return {
    zones: result
  };
};
var getHomeCategoryGuide = getCategoryList;
var getHomeFeaturedProducts = async (input) => {
  const selectedCategoryId = input?.categoryId?.trim() || "";
  const [detailResult, productResult] = await Promise.all([
    selectedCategoryId ? getCategoryDetail({ category_id: selectedCategoryId }) : Promise.resolve({ detail: null }),
    getProductList({ category_id: selectedCategoryId || void 0 })
  ]);
  return {
    selectedCategoryId: selectedCategoryId || null,
    bannerCategory: detailResult.detail ? {
      categoryId: detailResult.detail.category_id,
      categoryName: detailResult.detail.category_name,
      categoryDescription: detailResult.detail.category_description,
      imageUrl: null,
      bannerImageUrl: null,
      slug: null,
      productCount: detailResult.detail.product_count
    } : null,
    products: productResult.list.map((item) => ({
      productId: item.product_id,
      productName: item.product_name,
      productCode: item.product_slug,
      mainImageUrl: item.main_image_url,
      ratingAverage: item.rating_average,
      ratingCount: item.rating_count,
      tradeInfo: null,
      sellingPoints: item.short_description ? [
        {
          title: "Category Highlight",
          content: item.short_description
        }
      ] : null,
      defaultSkuId: item.first_sku_id,
      price: item.price,
      originalPrice: item.original_price,
      deliveryDays: null,
      brandCategoryId: item.brand_category_id,
      brandName: item.brand_category_name
    }))
  };
};
var getBrandShelf = async (input) => {
  const productResult = await getProductList({
    category_id: input?.categoryId?.trim() || void 0,
    sort_by: "POPULARITY",
    page_size: 24
  });
  const grouped = /* @__PURE__ */ new Map();
  productResult.list.forEach((item) => {
    const brandName = item.brand_category_name || "\u7CBE\u9009\u63A8\u8350";
    const current = grouped.get(brandName) || [];
    current.push({
      brandName,
      productId: item.product_id,
      productName: item.product_name,
      productCode: item.product_slug,
      mainImageUrl: item.main_image_url,
      defaultSkuId: item.first_sku_id,
      price: item.price,
      originalPrice: item.original_price,
      ratingAverage: item.rating_average,
      ratingCount: item.rating_count,
      shortDescription: item.short_description
    });
    grouped.set(brandName, current);
  });
  return {
    brands: Array.from(grouped.entries()).map(([brandName, items]) => ({
      brandName,
      items: items.slice(0, 8)
    }))
  };
};
var getHomeReviewSection = async () => ({
  summary: {
    averageRating: 0,
    totalReviews: 0,
    highlightTags: []
  },
  reviews: []
});
var getHomeSceneKeywordGroups = async () => ({
  floors: []
});
var addCartItem = async (input) => {
  await addToCart({
    product_id: input.productId,
    product_sku_id: input.productSkuId,
    quantity: 1
  });
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  addCartItem,
  getBrandShelf,
  getCategoryDetail,
  getCategoryList,
  getHomeCategoryGuide,
  getHomeFeaturedProducts,
  getHomeRecommendZones,
  getHomeReviewSection,
  getHomeSceneKeywordGroups,
  getProductList
});
