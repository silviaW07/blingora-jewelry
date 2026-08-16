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

// common-redirect:@/backend/action_utils
var require_action_utils = __commonJS({
  "common-redirect:@/backend/action_utils"(exports2, module2) {
    module2.exports = require("./_common").backendAuth;
  }
});

// src/backend/actions/CategoryManagement.ts
var CategoryManagement_exports = {};
__export(CategoryManagement_exports, {
  batchApplyKeywordsToCategories: () => batchApplyKeywordsToCategories,
  batchCreateSubcategories: () => batchCreateSubcategories,
  batchDeleteCategories: () => batchDeleteCategories,
  batchMoveCategoryParent: () => batchMoveCategoryParent,
  batchRemoveKeywordGroupProductLinks: () => batchRemoveKeywordGroupProductLinks,
  batchUpdateCategoryStatus: () => batchUpdateCategoryStatus,
  batchUpsertKeywordItems: () => batchUpsertKeywordItems,
  createCategory: () => createCategory,
  createKeywordGroup: () => createKeywordGroup,
  createKeywordItem: () => createKeywordItem,
  deleteCategory: () => deleteCategory,
  deleteKeywordGroup: () => deleteKeywordGroup,
  deleteKeywordItem: () => deleteKeywordItem,
  getCategoryList: () => getCategoryList,
  getKeywordGroupTypeLabels: () => getKeywordGroupTypeLabels,
  getKeywordGroups: () => getKeywordGroups,
  removeKeywordGroupProductLink: () => removeKeywordGroupProductLink,
  saveCategoryRecommendedKeywords: () => saveCategoryRecommendedKeywords,
  saveCategoryTopPromotionConfig: () => saveCategoryTopPromotionConfig,
  saveHomepagePosterConfig: () => saveHomepagePosterConfig,
  searchKeywordGroupProducts: () => searchKeywordGroupProducts,
  updateCategory: () => updateCategory,
  updateCategorySortWeight: () => updateCategorySortWeight,
  updateCategoryStatus: () => updateCategoryStatus,
  updateKeywordGroup: () => updateKeywordGroup,
  updateKeywordItem: () => updateKeywordItem
});
module.exports = __toCommonJS(CategoryManagement_exports);
var import_prisma = __toESM(require_prisma());
var import_action_utils = __toESM(require_action_utils());
var DEFAULT_BRAND_DISPLAY_CONFIG = {
  showChildrenByDefault: true,
  allowChildrenCollapse: false,
  showBrandFilter: true,
  brandFilterCollapsedRows: 2
};
var DEFAULT_CATEGORY_TOP_PROMOTION_CONFIG = {
  enabled: false,
  message: "",
  end_time: null,
  background_color: "#000000",
  text_color: "#ffffff"
};
var KEYWORD_GROUP_TYPE_LABELS = {
  BRAND: "\u54C1\u724C",
  NEW_ARRIVAL: "\u65B0\u54C1",
  PROMOTION: "\u4FC3\u9500",
  GENERAL: "\u901A\u7528"
};
var DEFAULT_MAIN_DISPLAY_CONFIG = {
  showChildrenByDefault: false,
  allowChildrenCollapse: true,
  showBrandFilter: false,
  brandFilterCollapsedRows: 2
};
function normalizePosterAspectPreset(value) {
  if (value === "WIDE_BANNER" || value === "SQUARE") return value;
  return "CROSS_BORDER_HERO";
}
function enumToKeywordGroupType(value) {
  if (value === "NEW_ARRIVAL") return "NEW_ARRIVAL";
  if (value === "PROMOTION") return "PROMOTION";
  if (value === "BRAND") return "BRAND";
  return "GENERAL";
}
function normalizeKeywordSceneArea(value) {
  if (value === "LEFT_NAV" || value === "RECOMMENDATION" || value === "BOTH") {
    return value;
  }
  return "BOTH";
}
function getKeywordSceneAreaFromGroup(group) {
  return normalizeKeywordSceneArea(group.sceneArea);
}
function normalizePosterItems(items) {
  return items.filter((item) => item.image_url?.trim()).map((item, index) => ({
    id: item.id?.trim() || `poster-${Date.now()}-${index}`,
    title: item.title?.trim() || `\u6D77\u62A5 ${index + 1}`,
    image_url: item.image_url.trim(),
    link: item.link?.trim() || null,
    sort_weight: Number.isFinite(item.sort_weight) ? item.sort_weight : index,
    is_active: item.is_active !== false,
    aspect_preset: normalizePosterAspectPreset(item.aspect_preset)
  })).sort((a, b) => b.sort_weight - a.sort_weight);
}
function normalizeOptionalSlug(slug) {
  const normalized = slug?.trim() ?? "";
  return normalized.length > 0 ? normalized : null;
}
function normalizeBrandKeywords(keywords) {
  return Array.from(new Set((keywords ?? []).map((keyword) => keyword.trim()).filter(Boolean)));
}
function normalizeKeyword(keyword) {
  return keyword.trim();
}
function normalizeKeywordToken(keyword) {
  return keyword.trim().toLowerCase();
}
function normalizeSceneValue(value) {
  const normalized = value?.trim() ?? "";
  return normalized.length > 0 ? normalized : null;
}
function getCategoryKindFromRecord(category) {
  if (category.level !== 1) return "MAIN";
  if (category.isBrandCategory) return "BRAND";
  return "MAIN";
}
function normalizeCategoryDisplayConfig(config, categoryKind) {
  const base = categoryKind === "BRAND" ? DEFAULT_BRAND_DISPLAY_CONFIG : DEFAULT_MAIN_DISPLAY_CONFIG;
  const source = config ?? {};
  return {
    showChildrenByDefault: typeof source.showChildrenByDefault === "boolean" ? source.showChildrenByDefault : base.showChildrenByDefault,
    allowChildrenCollapse: typeof source.allowChildrenCollapse === "boolean" ? source.allowChildrenCollapse : base.allowChildrenCollapse,
    showBrandFilter: typeof source.showBrandFilter === "boolean" ? source.showBrandFilter : base.showBrandFilter,
    brandFilterCollapsedRows: typeof source.brandFilterCollapsedRows === "number" && Number.isFinite(source.brandFilterCollapsedRows) && source.brandFilterCollapsedRows > 0 ? Math.max(1, Math.round(source.brandFilterCollapsedRows)) : base.brandFilterCollapsedRows
  };
}
function getBrandKeywordsFromRecord(category) {
  const rawKeywords = category.brandKeywordsJson;
  if (!Array.isArray(rawKeywords)) return [];
  return rawKeywords.map((item) => {
    if (typeof item === "string") return item.trim();
    if (item && typeof item === "object" && "keyword" in item) {
      return String(item.keyword ?? "").trim();
    }
    return "";
  }).filter(Boolean);
}
function toCategoryWriteData(input) {
  const normalizedBrandKeywords = normalizeBrandKeywords(input.brand_keywords);
  const normalizedKind = input.level === 1 && input.category_kind === "BRAND" ? "BRAND" : "MAIN";
  const normalizedDisplayConfig = normalizeCategoryDisplayConfig(input.category_display_config, normalizedKind);
  const sanitizedBannerImage = normalizedKind === "BRAND" ? null : input.banner_image_url?.trim() || null;
  const normalizedPriceCoefficient = normalizedKind === "MAIN" ? Number.isFinite(input.price_coefficient ?? void 0) ? Number(input.price_coefficient) : 1 : 1;
  return {
    name: input.category_name.trim(),
    slug: normalizeOptionalSlug(input.category_slug),
    parentId: input.parent_id ?? null,
    level: input.level,
    imageUrl: input.image_url?.trim() || null,
    bannerImageUrl: sanitizedBannerImage,
    description: input.description?.trim() || null,
    sortWeight: Number.isFinite(input.sort_weight) ? Number(input.sort_weight) : 0,
    status: (input.status ?? "ACTIVE") === "ACTIVE" ? "ACTIVE" : "INACTIVE",
    isBrandCategory: normalizedKind === "BRAND",
    priceCoefficient: normalizedPriceCoefficient,
    categoryDisplayConfigJson: normalizedDisplayConfig,
    brandKeywordsJson: normalizedBrandKeywords.map((keyword, index) => ({
      keyword,
      weight: Math.max(1, normalizedBrandKeywords.length - index)
    }))
  };
}
async function parsePosterConfigs() {
  const posterSettings = await import_prisma.default.sitesetting.findMany({
    where: { settingType: "HOMEPAGE_POSTER" },
    orderBy: [{ sortWeight: "desc" }, { createdAt: "asc" }]
  });
  const parsed = posterSettings.map((setting) => {
    const payload = setting.contentJson ?? {};
    const categoryId = payload.categoryId || null;
    if (!categoryId) return null;
    const items = (payload.items ?? []).map((item, index) => ({
      id: item.id || `poster-${setting.id}-${index}`,
      title: item.title || `\u6D77\u62A5 ${index + 1}`,
      image_url: item.image_url || item.imageUrl || "",
      link: item.link || null,
      sort_weight: item.sort_weight ?? item.sortWeight ?? index,
      is_active: item.is_active ?? item.isActive ?? true,
      aspect_preset: normalizePosterAspectPreset(item.aspect_preset || item.aspectPreset)
    })).filter((item) => item.image_url);
    return {
      category_id: categoryId,
      items
    };
  });
  return parsed.filter((config) => config !== null);
}
async function parseRecommendedKeywordItems() {
  const setting = await import_prisma.default.sitesetting.findFirst({
    where: { title: "CATEGORY_RECOMMENDED_KEYWORDS" },
    orderBy: [{ updatedAt: "desc" }]
  });
  const payload = setting?.contentJson ?? {};
  const rawItems = payload.items ?? [];
  const categoryIds = Array.from(
    new Set(
      rawItems.map((item) => item.category_id || item.categoryId).filter((value) => Boolean(value))
    )
  );
  if (categoryIds.length === 0) return [];
  const categories = await import_prisma.default.category.findMany({
    where: { id: { in: categoryIds }, level: 1 },
    select: { id: true, name: true, slug: true, isBrandCategory: true }
  });
  const categoryMap = new Map(
    categories.filter((item) => !item.isBrandCategory).map((item) => [item.id, item])
  );
  return rawItems.map((item) => {
    const categoryId = item.category_id || item.categoryId;
    if (!categoryId) return null;
    const category = categoryMap.get(categoryId);
    if (!category) return null;
    return {
      keyword_group_id: "",
      keyword_group_name: "",
      keyword_group_slug: null,
      group_type: "GENERAL",
      scene_area: "BOTH",
      scene_key: null,
      linked_category_count: 0,
      keyword_count: 0,
      category_id: category.id,
      category_name: category.name,
      category_slug: category.slug,
      sort_weight: Number.isFinite(item.sort_weight) ? Number(item.sort_weight) : Number.isFinite(item.sortWeight) ? Number(item.sortWeight) : 0,
      is_active: item.is_active ?? item.isActive ?? true
    };
  }).filter((item) => item !== null).sort((a, b) => b.sort_weight - a.sort_weight || a.category_name.localeCompare(b.category_name, "zh-CN"));
}
async function parseCategoryTopPromotionConfig() {
  const setting = await import_prisma.default.sitesetting.findFirst({
    where: { title: "CATEGORY_TOP_PROMOTION" },
    orderBy: [{ updatedAt: "desc" }]
  });
  const payload = setting?.contentJson ?? {};
  return {
    enabled: payload.enabled ?? setting?.isActive ?? DEFAULT_CATEGORY_TOP_PROMOTION_CONFIG.enabled,
    message: typeof payload.message === "string" ? payload.message : DEFAULT_CATEGORY_TOP_PROMOTION_CONFIG.message,
    end_time: payload.end_time ?? payload.endTime ?? DEFAULT_CATEGORY_TOP_PROMOTION_CONFIG.end_time,
    background_color: payload.background_color ?? payload.backgroundColor ?? DEFAULT_CATEGORY_TOP_PROMOTION_CONFIG.background_color,
    text_color: payload.text_color ?? payload.textColor ?? DEFAULT_CATEGORY_TOP_PROMOTION_CONFIG.text_color
  };
}
async function validateCategoryHierarchy(params) {
  const { category_id, parent_id, level } = params;
  if (level === 1) {
    return { parentId: null };
  }
  if (!parent_id) {
    return { parentId: null };
  }
  if (parent_id === category_id) {
    throw new Error("\u5206\u7C7B\u4E0D\u80FD\u8BBE\u7F6E\u81EA\u5DF1\u4E3A\u4E0A\u7EA7\u5206\u7C7B");
  }
  const parent = await import_prisma.default.category.findUnique({ where: { id: parent_id } });
  if (!parent) {
    throw new Error("\u6240\u9009\u4E0A\u7EA7\u5206\u7C7B\u4E0D\u5B58\u5728");
  }
  if (parent.level !== 1) {
    throw new Error("\u4E8C\u7EA7\u5206\u7C7B\u7684\u4E0A\u7EA7\u5206\u7C7B\u5FC5\u987B\u4E3A\u4E00\u7EA7\u5206\u7C7B");
  }
  if (getCategoryKindFromRecord(parent) === "BRAND") {
    throw new Error("\u54C1\u724C\u5206\u7C7B\u4E0D\u80FD\u4F5C\u4E3A\u4E8C\u7EA7\u5206\u7C7B\u7684\u4E0A\u7EA7\u5206\u7C7B");
  }
  return { parentId: parent.id };
}
async function ensureNoCycleForBatchMove(params) {
  const { categoryIds, targetParentId } = params;
  if (!targetParentId) return;
  if (categoryIds.includes(targetParentId)) {
    throw new Error("\u76EE\u6807\u7236\u5206\u7C7B\u4E0D\u80FD\u662F\u5F85\u79FB\u52A8\u5206\u7C7B\u672C\u8EAB");
  }
  const allCategories = await import_prisma.default.category.findMany({
    select: { id: true, parentId: true, level: true, keywordMappingJson: true, isBrandCategory: true }
  });
  const parentMap = new Map(allCategories.map((item) => [item.id, item.parentId]));
  let cursor = targetParentId;
  while (cursor) {
    if (categoryIds.includes(cursor)) {
      throw new Error("\u6279\u91CF\u79FB\u52A8\u540E\u4F1A\u5F62\u6210\u5FAA\u73AF\u5C42\u7EA7\uFF0C\u8BF7\u91CD\u65B0\u9009\u62E9\u76EE\u6807\u7236\u5206\u7C7B");
    }
    cursor = parentMap.get(cursor);
  }
}
async function updateCategoryAndCascade(categoryId, updateData, newStatus) {
  const directProducts = await import_prisma.default.product.findMany({
    where: { categoryId },
    select: { id: true }
  });
  const productIds = directProducts.map((p) => p.id);
  const items = newStatus === "ACTIVE" && productIds.length > 0 ? await import_prisma.default.cartitem.findMany({
    where: { productId: { in: productIds } },
    include: { product: true, productSku: true }
  }) : [];
  await import_prisma.default.$transaction(async (tx) => {
    await tx.category.update({
      where: { id: categoryId },
      data: updateData
    });
    if (productIds.length === 0) return;
    if (newStatus === "INACTIVE") {
      await tx.cartitem.updateMany({
        where: { productId: { in: productIds } },
        data: { status: "INVALID" }
      });
    } else if (newStatus === "ACTIVE") {
      const toValidIds = [];
      const toInvalidIds = [];
      for (const item of items) {
        const isValid = item.product.status === "ACTIVE" && item.productSku.stock >= item.quantity;
        if (isValid && item.status !== "VALID") {
          toValidIds.push(item.id);
        } else if (!isValid && item.status !== "INVALID") {
          toInvalidIds.push(item.id);
        }
      }
      if (toValidIds.length > 0) {
        await tx.cartitem.updateMany({
          where: { id: { in: toValidIds } },
          data: { status: "VALID" }
        });
      }
      if (toInvalidIds.length > 0) {
        await tx.cartitem.updateMany({
          where: { id: { in: toInvalidIds } },
          data: { status: "INVALID" }
        });
      }
    }
  });
}
var buildKeywordTree = (items) => {
  const nodeMap = /* @__PURE__ */ new Map();
  items.forEach((item) => {
    nodeMap.set(item.id, {
      keyword_item_id: item.id,
      keyword: item.keyword,
      normalized_keyword: item.normalizedKeyword,
      parent_keyword_id: item.parentKeywordId,
      sort_weight: item.sortWeight,
      is_active: item.isActive,
      child_count: 0,
      children: []
    });
  });
  const roots = [];
  items.forEach((item) => {
    const node = nodeMap.get(item.id);
    if (item.parentKeywordId && nodeMap.has(item.parentKeywordId)) {
      nodeMap.get(item.parentKeywordId).children.push(node);
    } else {
      roots.push(node);
    }
  });
  const sortNodes = (nodes) => {
    nodes.sort((a, b) => b.sort_weight - a.sort_weight || a.keyword.localeCompare(b.keyword, "zh-CN"));
    nodes.forEach((node) => {
      sortNodes(node.children);
      node.child_count = node.children.length;
    });
  };
  sortNodes(roots);
  return roots;
};
var getKeywordGroupWhereInput = (input) => {
  const where = {};
  if (input?.scene_key !== void 0) {
    where.sceneKey = normalizeSceneValue(input.scene_key);
  }
  if (input?.scene_type !== void 0) {
    where.sceneType = normalizeSceneValue(input.scene_type);
  }
  if (input?.include_inactive !== true) {
    where.isActive = true;
  }
  return where;
};
var getKeywordOperationData = async (input) => {
  const groupWhere = getKeywordGroupWhereInput(input);
  const [groups, keywords, links, groupProductLinks, categoryOptions, sceneSlotSettings] = await Promise.all([
    import_prisma.default.keywordgroup.findMany({
      where: groupWhere,
      orderBy: [{ sortWeight: "desc" }, { createdAt: "asc" }],
      include: {
        productLinks: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                slug: true,
                mainImageUrl: true,
                sortWeight: true,
                createdAt: true,
                skus: {
                  select: { skuCode: true, price: true },
                  orderBy: [{ createdAt: "asc" }],
                  take: 1
                }
              }
            }
          },
          orderBy: [{ sortWeight: "desc" }, { createdAt: "asc" }]
        }
      }
    }),
    import_prisma.default.keyworditem.findMany({
      orderBy: [{ sortWeight: "desc" }, { createdAt: "asc" }]
    }),
    import_prisma.default.categorykeywordlink.findMany({
      orderBy: [{ sortWeight: "desc" }, { createdAt: "asc" }]
    }),
    import_prisma.default.keywordgroupproduct.findMany({
      select: { keywordGroupId: true, productId: true }
    }),
    import_prisma.default.category.findMany({
      where: { level: 1, isBrandCategory: false },
      orderBy: [{ sortWeight: "desc" }, { createdAt: "desc" }],
      select: {
        id: true,
        name: true,
        level: true,
        parentId: true,
        isBrandCategory: true
      }
    }),
    import_prisma.default.sitesetting.findMany({
      where: { settingType: "FRONTEND_SCENE_SLOT", isActive: true },
      orderBy: [{ sortWeight: "desc" }, { createdAt: "asc" }],
      select: {
        title: true,
        subtitle: true,
        sortWeight: true,
        contentJson: true
      }
    })
  ]);
  const sceneSlotOptions = sceneSlotSettings.map((setting) => {
    const content = setting.contentJson ?? {};
    const sceneSlotKey = typeof content.scene_slot_key === "string" ? content.scene_slot_key.trim() : "";
    if (!sceneSlotKey) return null;
    return {
      scene_slot_key: sceneSlotKey,
      scene_slot_name: typeof content.scene_slot_name === "string" && content.scene_slot_name.trim() ? content.scene_slot_name.trim() : setting.title?.trim() || sceneSlotKey,
      scene_key: typeof content.scene_key === "string" ? content.scene_key.trim() || null : null,
      scene_type: typeof content.scene_type === "string" ? content.scene_type.trim() || null : null,
      sort_weight: Number.isFinite(content.sort_weight) ? Number(content.sort_weight) : setting.sortWeight
    };
  }).filter((item) => Boolean(item));
  return {
    group_summaries: groups.map((group) => {
      const groupKeywords = keywords.filter((item) => item.groupId === group.id);
      const groupLinks = links.filter((item) => item.keywordGroupId === group.id);
      const linkedProducts = group.productLinks.map((link) => ({
        product_id: link.product.id,
        product_name: link.product.name,
        product_slug: link.product.slug,
        sku_code: link.product.skus[0]?.skuCode ?? null,
        image_url: link.product.mainImageUrl,
        price: link.product.skus[0]?.price ? Number(link.product.skus[0].price) : null,
        created_at: link.product.createdAt.toISOString(),
        sort_weight: link.sortWeight
      }));
      return {
        keyword_group_id: group.id,
        name: group.name,
        slug: group.slug,
        group_type: enumToKeywordGroupType(group.groupType),
        scene_area: getKeywordSceneAreaFromGroup(group),
        scene_key: group.sceneKey,
        scene_type: group.sceneType,
        scene_slot_key: group.sceneSlotKey,
        scene_slot_name: group.sceneSlotName,
        parent_group_id: group.parentGroupId,
        sort_weight: group.sortWeight,
        is_active: group.isActive,
        description: group.description,
        floor_title: group.floorTitle,
        floor_icon: group.floorIcon,
        floor_link: group.floorLink,
        homepage_sort_weight: group.homepageSortWeight ?? 0,
        show_on_homepage: group.showOnHomepage === true,
        keyword_count: groupKeywords.length,
        linked_category_count: new Set(groupLinks.map((item) => item.categoryId)).size,
        homepage_link_count: groupLinks.filter((item) => item.applyToHomepage).length,
        linked_product_count: linkedProducts.length,
        linked_products: linkedProducts,
        keywords: buildKeywordTree(groupKeywords)
      };
    }),
    category_options: categoryOptions.map((item) => ({
      category_id: item.id,
      category_name: item.name,
      level: item.level === 2 ? 2 : 1,
      parent_id: item.parentId,
      category_kind: item.isBrandCategory ? "BRAND" : "MAIN"
    })),
    scene_slot_options: sceneSlotOptions
  };
};
var getKeywordItemLineageMap = (items) => {
  const itemMap = new Map(items.map((item) => [item.id, item]));
  const lineageMap = /* @__PURE__ */ new Map();
  items.forEach((item) => {
    if (!item.parentKeywordId) {
      lineageMap.set(item.id, { parent_keyword_id: null, parent_keyword_text: null });
      return;
    }
    const parent = itemMap.get(item.parentKeywordId) ?? null;
    lineageMap.set(item.id, {
      parent_keyword_id: parent?.id ?? null,
      parent_keyword_text: parent?.keyword ?? null
    });
  });
  return lineageMap;
};
var buildCategoryKeywordLinks = (params) => {
  const groupMap = new Map(params.groups.map((group) => [group.id, group]));
  const itemMap = new Map(params.items.map((item) => [item.id, item]));
  const lineageMap = getKeywordItemLineageMap(params.items);
  const categoryMap = /* @__PURE__ */ new Map();
  params.links.forEach((link) => {
    const group = groupMap.get(link.keywordGroupId);
    if (!group) return;
    const keywordItem = link.keywordItemId ? itemMap.get(link.keywordItemId) ?? null : null;
    const lineage = keywordItem ? lineageMap.get(keywordItem.id) : { parent_keyword_id: null, parent_keyword_text: null };
    const item = {
      link_id: link.id,
      keyword_group_id: group.id,
      keyword_group_name: group.name,
      keyword_group_type: enumToKeywordGroupType(group.groupType),
      keyword_scene_area: "BOTH",
      keyword_item_id: keywordItem?.id ?? null,
      keyword_text: keywordItem?.keyword ?? null,
      parent_keyword_id: lineage?.parent_keyword_id ?? null,
      parent_keyword_text: lineage?.parent_keyword_text ?? null,
      apply_to_homepage: link.applyToHomepage,
      sort_weight: link.sortWeight
    };
    const list = categoryMap.get(link.categoryId) ?? [];
    list.push(item);
    categoryMap.set(link.categoryId, list);
  });
  categoryMap.forEach((list) => {
    list.sort((a, b) => b.sort_weight - a.sort_weight || a.keyword_group_name.localeCompare(b.keyword_group_name, "zh-CN"));
  });
  return categoryMap;
};
var getKeywordGroups = (0, import_action_utils.requireRole)([import_action_utils.UserRole.ADMIN])(
  (0, import_action_utils.withResult)(async (input = {}) => {
    const result = await getKeywordOperationData(input);
    return result.group_summaries;
  })
);
var searchKeywordGroupProducts = (0, import_action_utils.requireRole)([import_action_utils.UserRole.ADMIN])(
  (0, import_action_utils.withResult)(async (input = {}) => {
    const keywordGroupId = input.keyword_group_id?.trim() ?? "";
    if (!keywordGroupId) {
      throw new Error("\u7F3A\u5C11\u5173\u952E\u8BCD\u5206\u7EC4\u4E0A\u4E0B\u6587");
    }
    const page = Number.isFinite(input.page) && Number(input.page) > 0 ? Number(input.page) : 1;
    const pageSize = Number.isFinite(input.page_size) && Number(input.page_size) > 0 ? Math.min(Number(input.page_size), 50) : 12;
    const keyword = input.keyword?.trim() ?? "";
    const spu = input.spu?.trim() ?? "";
    const relationScope = input.relation_scope === "UNLINKED" ? "UNLINKED" : "LINKED";
    const minPrice = Number.isFinite(input.min_price) ? Number(input.min_price) : null;
    const maxPrice = Number.isFinite(input.max_price) ? Number(input.max_price) : null;
    const group = await import_prisma.default.keywordgroup.findUnique({ where: { id: keywordGroupId } });
    if (!group) {
      throw new Error("\u5173\u952E\u8BCD\u5206\u7EC4\u4E0D\u5B58\u5728");
    }
    const linkedRows = await import_prisma.default.keywordgroupproduct.findMany({
      where: { keywordGroupId },
      select: {
        productId: true,
        sortWeight: true
      }
    });
    const linkedIdSet = new Set(linkedRows.map((item) => item.productId));
    const linkedSortWeightMap = new Map(linkedRows.map((item) => [item.productId, item.sortWeight]));
    const where = {
      goodsStatus: { not: "DELETED" }
    };
    const andConditions = [];
    if (relationScope === "LINKED") {
      if (linkedIdSet.size === 0) {
        return {
          list: [],
          total: 0,
          page,
          page_size: pageSize
        };
      }
      andConditions.push({ id: { in: Array.from(linkedIdSet) } });
    } else if (linkedIdSet.size > 0) {
      andConditions.push({ id: { notIn: Array.from(linkedIdSet) } });
    }
    if (keyword) {
      andConditions.push({
        OR: [
          { name: { contains: keyword } },
          { productCode: { contains: keyword } }
        ]
      });
    }
    if (spu) {
      andConditions.push({
        skus: {
          some: { skuCode: { contains: spu } }
        }
      });
    }
    if (minPrice !== null || maxPrice !== null) {
      andConditions.push({
        skus: {
          some: {
            ...minPrice !== null ? { price: { gte: minPrice } } : {},
            ...maxPrice !== null ? { price: { lte: maxPrice } } : {}
          }
        }
      });
    }
    if (andConditions.length > 0) {
      where.AND = andConditions;
    }
    const [products, total] = await Promise.all([
      import_prisma.default.product.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: relationScope === "LINKED" ? [{ createdAt: "desc" }] : [{ sortWeight: "desc" }, { createdAt: "desc" }],
        select: {
          id: true,
          name: true,
          slug: true,
          mainImageUrl: true,
          sortWeight: true,
          createdAt: true,
          skus: {
            select: { skuCode: true, price: true, createdAt: true },
            orderBy: [{ createdAt: "asc" }]
          }
        }
      }),
      import_prisma.default.product.count({ where })
    ]);
    const sortedProducts = relationScope === "LINKED" ? [...products].sort((a, b) => {
      const weightDiff = (linkedSortWeightMap.get(b.id) ?? 0) - (linkedSortWeightMap.get(a.id) ?? 0);
      if (weightDiff !== 0) return weightDiff;
      return (b.createdAt ? new Date(b.createdAt).getTime() : 0) - (a.createdAt ? new Date(a.createdAt).getTime() : 0);
    }) : products;
    return {
      list: sortedProducts.map((item) => {
        const firstSku = item.skus[0] ?? null;
        const lowestSalePrice = item.skus.length > 0 ? item.skus.reduce((lowest, sku) => {
          const salePrice = sku.price == null ? null : Number(sku.price);
          if (salePrice == null || Number.isNaN(salePrice)) return lowest;
          if (lowest == null) return salePrice;
          return salePrice < lowest ? salePrice : lowest;
        }, null) : null;
        return {
          product_id: item.id,
          product_name: item.name,
          product_slug: item.slug,
          sku_code: firstSku?.skuCode ?? null,
          image_url: item.mainImageUrl,
          price: lowestSalePrice,
          created_at: item.createdAt.toISOString(),
          sort_weight: linkedSortWeightMap.get(item.id) ?? item.sortWeight
        };
      }),
      total,
      page,
      page_size: pageSize
    };
  })
);
var removeKeywordGroupProductLink = (0, import_action_utils.requireRole)([import_action_utils.UserRole.ADMIN])(
  (0, import_action_utils.withResult)(async (input) => {
    const keywordGroupId = input.keyword_group_id?.trim();
    const productId = input.product_id?.trim();
    if (!keywordGroupId || !productId) throw new Error("\u7F3A\u5C11\u5F85\u89E3\u7ED1\u5546\u54C1");
    await import_prisma.default.keywordgroupproduct.deleteMany({
      where: {
        keywordGroupId,
        productId
      }
    });
  })
);
var batchRemoveKeywordGroupProductLinks = (0, import_action_utils.requireRole)([import_action_utils.UserRole.ADMIN])(
  (0, import_action_utils.withResult)(async (input) => {
    const keywordGroupId = input.keyword_group_id?.trim();
    const productIds = Array.from(new Set((input.product_ids ?? []).map((item) => item.trim()).filter(Boolean)));
    if (!keywordGroupId) throw new Error("\u7F3A\u5C11\u5173\u952E\u8BCD\u5206\u7EC4");
    if (productIds.length === 0) throw new Error("\u8BF7\u81F3\u5C11\u9009\u62E9\u4E00\u4E2A\u5546\u54C1");
    const result = await import_prisma.default.keywordgroupproduct.deleteMany({
      where: {
        keywordGroupId,
        productId: { in: productIds }
      }
    });
    return {
      removed_count: result.count
    };
  })
);
var syncKeywordGroupProducts = async (keywordGroupId, linkedProducts) => {
  const normalized = Array.from(new Map((linkedProducts ?? []).filter((item) => item?.product_id).map((item, index) => [item.product_id, {
    product_id: item.product_id,
    sort_weight: Number.isFinite(item.sort_weight) ? Number(item.sort_weight) : linkedProducts.length - index
  }])).values());
  await import_prisma.default.keywordgroupproduct.deleteMany({ where: { keywordGroupId } });
  if (normalized.length === 0) return;
  const existingProducts = await import_prisma.default.product.findMany({
    where: { id: { in: normalized.map((item) => item.product_id) } },
    select: { id: true }
  });
  const existingIds = new Set(existingProducts.map((item) => item.id));
  const createData = normalized.filter((item) => existingIds.has(item.product_id)).map((item, index) => ({
    keywordGroupId,
    productId: item.product_id,
    sortWeight: Number.isFinite(item.sort_weight) ? Number(item.sort_weight) : normalized.length - index
  }));
  if (createData.length > 0) {
    await import_prisma.default.keywordgroupproduct.createMany({ data: createData });
  }
};
var getCategoryList = (0, import_action_utils.requireRole)([import_action_utils.UserRole.ADMIN])(
  (0, import_action_utils.withResult)(async (input) => {
    const { keyword, status, level, page = 1, page_size = 20 } = input;
    const skip = (page - 1) * page_size;
    const take = page_size;
    const where = {};
    if (keyword) {
      where.OR = [{ name: { contains: keyword } }, { slug: { contains: keyword } }];
    }
    if (status) {
      where.status = status === "ACTIVE" ? "ACTIVE" : "INACTIVE";
    }
    if (level) {
      where.level = level;
    }
    const [categories, total, parentOptions, posterConfigs, recommendedKeywordItems, topPromotionConfig, childCategories, keywordOperationData, allKeywordGroups, allKeywordItems, allCategoryKeywordLinks] = await Promise.all([
      import_prisma.default.category.findMany({
        where,
        skip,
        take,
        orderBy: [{ level: "asc" }, { isBrandCategory: "asc" }, { sortWeight: "desc" }, { createdAt: "desc" }],
        include: {
          parent: {
            select: { id: true, name: true }
          },
          _count: {
            select: { products: true, children: true }
          }
        }
      }),
      import_prisma.default.category.count({ where }),
      import_prisma.default.category.findMany({
        where: { level: 1, isBrandCategory: false },
        orderBy: [{ sortWeight: "desc" }, { createdAt: "desc" }],
        select: {
          id: true,
          name: true,
          level: true,
          parentId: true,
          isBrandCategory: true
        }
      }),
      parsePosterConfigs(),
      parseRecommendedKeywordItems(),
      parseCategoryTopPromotionConfig(),
      import_prisma.default.category.findMany({
        where: { parentId: { not: null } },
        select: {
          id: true,
          parentId: true
        }
      }),
      getKeywordOperationData(),
      import_prisma.default.keywordgroup.findMany({
        select: { id: true, name: true, groupType: true }
      }),
      import_prisma.default.keyworditem.findMany({
        select: { id: true, keyword: true, parentKeywordId: true }
      }),
      import_prisma.default.categorykeywordlink.findMany({
        select: {
          id: true,
          categoryId: true,
          keywordGroupId: true,
          keywordItemId: true,
          applyToHomepage: true,
          sortWeight: true
        }
      })
    ]);
    const childToParentMap = /* @__PURE__ */ new Map();
    childCategories.forEach((item) => {
      if (item.parentId) {
        childToParentMap.set(item.id, item.parentId);
      }
    });
    const mainTopLevelCategoryIds = categories.filter((category) => category.level === 1 && getCategoryKindFromRecord(category) === "MAIN").map((category) => category.id);
    const descendantProducts = mainTopLevelCategoryIds.length > 0 ? await import_prisma.default.productcategory.findMany({
      where: {
        categoryId: {
          in: Array.from(childToParentMap.keys())
        }
      },
      select: {
        categoryId: true,
        product: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: [{ product: { sortWeight: "desc" } }, { product: { createdAt: "desc" } }]
    }) : [];
    const descendantProductMap = /* @__PURE__ */ new Map();
    for (const item of descendantProducts) {
      const parentId = childToParentMap.get(item.categoryId);
      if (!parentId || !mainTopLevelCategoryIds.includes(parentId)) continue;
      if (!descendantProductMap.has(parentId)) {
        descendantProductMap.set(parentId, /* @__PURE__ */ new Map());
      }
      descendantProductMap.get(parentId).set(item.product.id, {
        product_id: item.product.id,
        product_name: item.product.name
      });
    }
    const posterConfigMap = new Map(posterConfigs.map((config) => [config.category_id, config]));
    const categoryKeywordLinksMap = buildCategoryKeywordLinks({
      links: allCategoryKeywordLinks,
      groups: allKeywordGroups,
      items: allKeywordItems
    });
    return {
      list: categories.map((c) => {
        const categoryKind = getCategoryKindFromRecord(c);
        const descendantProductsForParent = c.level === 1 && categoryKind === "MAIN" ? Array.from(descendantProductMap.get(c.id)?.values() ?? []) : [];
        const categoryDisplayConfig = normalizeCategoryDisplayConfig(c.categoryDisplayConfigJson, categoryKind);
        const keywordLinks = categoryKeywordLinksMap.get(c.id) ?? [];
        return {
          category_id: c.id,
          category_name: c.name,
          category_slug: c.slug,
          parent_id: c.parentId,
          parent_name: c.parent?.name || null,
          level: c.level === 2 ? 2 : 1,
          image_url: c.imageUrl,
          banner_image_url: categoryKind === "BRAND" ? null : c.bannerImageUrl,
          description: c.description,
          sort_weight: c.sortWeight,
          status: c.status,
          category_kind: categoryKind,
          is_brand_category: categoryKind === "BRAND",
          brand_keywords: getBrandKeywordsFromRecord(c),
          price_coefficient: Number(c.priceCoefficient ?? 1),
          category_display_config: categoryDisplayConfig,
          can_configure_poster: c.level === 1 && categoryKind === "MAIN",
          product_count: c._count.products,
          child_count: categoryKind === "MAIN" ? c._count.children : 0,
          descendant_product_count: descendantProductsForParent.length,
          descendant_product_preview: descendantProductsForParent,
          keyword_link_count: keywordLinks.length,
          homepage_keyword_link_count: keywordLinks.filter((link) => link.apply_to_homepage).length,
          keyword_links: keywordLinks,
          nav_config: null,
          created_at: c.createdAt.toISOString(),
          updated_at: c.updatedAt.toISOString()
        };
      }),
      total,
      parent_options: parentOptions.map((item) => ({
        category_id: item.id,
        category_name: item.name,
        level: item.level === 2 ? 2 : 1,
        parent_id: item.parentId,
        category_kind: item.isBrandCategory ? "BRAND" : "MAIN"
      })),
      poster_configs: posterConfigs.filter((config) => {
        const category = categories.find((item) => item.id === config.category_id);
        if (category) {
          return getCategoryKindFromRecord(category) === "MAIN" && category.level === 1;
        }
        return true;
      }),
      recommended_keyword_items: recommendedKeywordItems,
      keyword_operation_data: keywordOperationData,
      top_promotion_config: topPromotionConfig,
      nav_config_items: []
    };
  })
);
var createCategory = (0, import_action_utils.requireRole)([import_action_utils.UserRole.ADMIN])(
  (0, import_action_utils.withResult)(async (input) => {
    const { category_name, category_slug, parent_id, level, image_url, banner_image_url, description, sort_weight, status, category_kind, brand_keywords, price_coefficient, category_display_config } = input;
    const trimmedName = category_name.trim();
    if (!trimmedName) throw new Error("\u5206\u7C7B\u540D\u79F0\u4E0D\u80FD\u4E3A\u7A7A");
    const existName = await import_prisma.default.category.findFirst({ where: { name: trimmedName } });
    if (existName) throw new Error("\u5206\u7C7B\u540D\u79F0\u5DF2\u5B58\u5728");
    const normalizedCategoryKind = level === 1 && category_kind === "BRAND" ? "BRAND" : "MAIN";
    const { parentId } = await validateCategoryHierarchy({ parent_id, level });
    await import_prisma.default.category.create({
      data: toCategoryWriteData({
        category_name: trimmedName,
        category_slug,
        parent_id: parentId,
        level,
        image_url,
        banner_image_url,
        description,
        sort_weight: sort_weight ?? 0,
        status: status ?? "ACTIVE",
        category_kind: normalizedCategoryKind,
        brand_keywords,
        price_coefficient: price_coefficient ?? void 0,
        category_display_config
      })
    });
  })
);
var batchCreateSubcategories = (0, import_action_utils.requireRole)([import_action_utils.UserRole.ADMIN])(
  (0, import_action_utils.withResult)(async (input) => {
    const { parent_id, category_names, status = "ACTIVE" } = input;
    const { parentId } = await validateCategoryHierarchy({ parent_id, level: 2 });
    const normalizedNames = Array.from(new Set(category_names.map((name) => name.trim()).filter(Boolean)));
    if (normalizedNames.length === 0) {
      throw new Error("\u8BF7\u81F3\u5C11\u8F93\u5165\u4E00\u4E2A\u5B50\u7C7B\u540D\u79F0");
    }
    const existing = await import_prisma.default.category.findMany({
      where: { name: { in: normalizedNames } },
      select: { name: true }
    });
    const existingNameSet = new Set(existing.map((item) => item.name));
    const creatableNames = normalizedNames.filter((name) => !existingNameSet.has(name));
    if (creatableNames.length === 0) {
      throw new Error("\u8F93\u5165\u7684\u5B50\u7C7B\u540D\u79F0\u5747\u5DF2\u5B58\u5728\uFF0C\u672A\u521B\u5EFA\u65B0\u5206\u7C7B");
    }
    await import_prisma.default.category.createMany({
      data: creatableNames.map((name, index) => ({
        name,
        slug: null,
        parentId,
        level: parentId ? 2 : 1,
        sortWeight: creatableNames.length - index,
        status: status === "ACTIVE" ? "ACTIVE" : "INACTIVE",
        isBrandCategory: false,
        priceCoefficient: 1,
        categoryDisplayConfigJson: DEFAULT_MAIN_DISPLAY_CONFIG,
        brandKeywordsJson: []
      }))
    });
    return { created_count: creatableNames.length };
  })
);
var updateCategory = (0, import_action_utils.requireRole)([import_action_utils.UserRole.ADMIN])(
  (0, import_action_utils.withResult)(async (input) => {
    const { category_id, category_name, category_slug, parent_id, level, image_url, banner_image_url, description, sort_weight, status, category_kind, brand_keywords, price_coefficient, category_display_config } = input;
    const category = await import_prisma.default.category.findUnique({ where: { id: category_id } });
    if (!category) throw new Error("\u5206\u7C7B\u4E0D\u5B58\u5728");
    const trimmedName = category_name.trim();
    if (!trimmedName) throw new Error("\u5206\u7C7B\u540D\u79F0\u4E0D\u80FD\u4E3A\u7A7A");
    const existName = await import_prisma.default.category.findFirst({ where: { name: trimmedName, id: { not: category_id } } });
    if (existName) throw new Error("\u5206\u7C7B\u540D\u79F0\u5DF2\u5B58\u5728");
    const normalizedCategoryKind = level === 1 && category_kind === "BRAND" ? "BRAND" : "MAIN";
    const { parentId } = await validateCategoryHierarchy({ category_id, parent_id, level });
    const newStatus = status === "ACTIVE" ? "ACTIVE" : "INACTIVE";
    const updateData = toCategoryWriteData({
      category_name: trimmedName,
      category_slug,
      parent_id: parentId,
      level,
      image_url,
      banner_image_url,
      description,
      sort_weight: sort_weight ?? 0,
      status: status ?? "ACTIVE",
      category_kind: normalizedCategoryKind,
      brand_keywords,
      price_coefficient: price_coefficient ?? void 0,
      category_display_config
    });
    if (category.status !== newStatus) {
      await updateCategoryAndCascade(category_id, updateData, newStatus);
    } else {
      await import_prisma.default.category.update({
        where: { id: category_id },
        data: updateData
      });
    }
  })
);
var updateCategoryStatus = (0, import_action_utils.requireRole)([import_action_utils.UserRole.ADMIN])(
  (0, import_action_utils.withResult)(async (input) => {
    const { category_id, status } = input;
    const category = await import_prisma.default.category.findUnique({ where: { id: category_id } });
    if (!category) throw new Error("\u5206\u7C7B\u4E0D\u5B58\u5728");
    const newStatus = status === "ACTIVE" ? "ACTIVE" : "INACTIVE";
    if (category.status !== newStatus) {
      await updateCategoryAndCascade(category_id, { status: newStatus }, newStatus);
    }
  })
);
var updateCategorySortWeight = (0, import_action_utils.requireRole)([import_action_utils.UserRole.ADMIN])(
  (0, import_action_utils.withResult)(async (input) => {
    const { category_id, sort_weight } = input;
    const category = await import_prisma.default.category.findUnique({ where: { id: category_id } });
    if (!category) throw new Error("\u5206\u7C7B\u4E0D\u5B58\u5728");
    await import_prisma.default.category.update({
      where: { id: category_id },
      data: { sortWeight: sort_weight }
    });
  })
);
var saveHomepagePosterConfig = (0, import_action_utils.requireRole)([import_action_utils.UserRole.ADMIN])(
  (0, import_action_utils.withResult)(async (input) => {
    const { category_id, items } = input;
    const category = await import_prisma.default.category.findUnique({ where: { id: category_id } });
    if (!category) throw new Error("\u5206\u7C7B\u4E0D\u5B58\u5728");
    if (category.level !== 1 || getCategoryKindFromRecord(category) !== "MAIN") {
      throw new Error("\u4EC5\u4E00\u7EA7\u4E3B\u7C7B\u76EE\u53EF\u7EF4\u62A4\u76EE\u5F55\u6D77\u62A5");
    }
    const normalizedItems = normalizePosterItems(items);
    const existing = await import_prisma.default.sitesetting.findFirst({
      where: {
        settingType: "HOMEPAGE_POSTER"
      }
    });
    const matchedExisting = existing && (existing.contentJson ?? {}).categoryId === category_id ? existing : null;
    const contentJson = {
      categoryId: category_id,
      items: normalizedItems.map((item) => ({
        id: item.id,
        title: item.title,
        image_url: item.image_url,
        link: item.link,
        sort_weight: item.sort_weight,
        is_active: item.is_active,
        aspect_preset: item.aspect_preset
      }))
    };
    if (matchedExisting) {
      await import_prisma.default.sitesetting.update({
        where: { id: matchedExisting.id },
        data: {
          title: `${category.name} \u9996\u9875\u6D77\u62A5`,
          contentJson,
          imageUrl: normalizedItems[0]?.image_url || null,
          isActive: true
        }
      });
      return;
    }
    await import_prisma.default.sitesetting.create({
      data: {
        settingType: "HOMEPAGE_POSTER",
        title: `${category.name} \u9996\u9875\u6D77\u62A5`,
        subtitle: "\u5206\u7C7B\u76EE\u5F55\u6D77\u62A5\u914D\u7F6E",
        contentJson,
        imageUrl: normalizedItems[0]?.image_url || null,
        sortWeight: category.sortWeight,
        isActive: true
      }
    });
  })
);
var saveCategoryRecommendedKeywords = (0, import_action_utils.requireRole)([import_action_utils.UserRole.ADMIN])(
  (0, import_action_utils.withResult)(async (input) => {
    const items = Array.from(
      new Map(
        (input.items ?? []).filter((item) => item?.category_id).map((item) => [
          item.category_id,
          {
            category_id: item.category_id,
            sort_weight: Number.isFinite(item.sort_weight) ? Number(item.sort_weight) : 0,
            is_active: item.is_active !== false
          }
        ])
      ).values()
    );
    if (items.length === 0) {
      throw new Error("\u8BF7\u81F3\u5C11\u9009\u62E9\u4E00\u4E2A\u4E00\u7EA7\u5206\u7C7B");
    }
    const categories = await import_prisma.default.category.findMany({
      where: { id: { in: items.map((item) => item.category_id) }, level: 1, isBrandCategory: false },
      select: { id: true, name: true, slug: true }
    });
    if (categories.length !== items.length) {
      throw new Error("\u63A8\u8350\u5173\u952E\u8BCD\u4EC5\u652F\u6301\u5DF2\u5B58\u5728\u7684\u4E00\u7EA7\u4E3B\u7C7B\u76EE");
    }
    const contentJson = {
      items: items.map((item) => ({
        category_id: item.category_id,
        sort_weight: item.sort_weight,
        is_active: item.is_active
      }))
    };
    const existing = await import_prisma.default.sitesetting.findFirst({
      where: { title: "CATEGORY_RECOMMENDED_KEYWORDS" },
      orderBy: [{ updatedAt: "desc" }]
    });
    const subtitle = "\u5206\u7C7B\u9875\u70ED\u95E8\u641C\u7D22\u7EF4\u62A4";
    const activeCount = items.filter((item) => item.is_active).length;
    const maxSortWeight = items.reduce((max, item) => Math.max(max, item.sort_weight), 0);
    if (existing) {
      await import_prisma.default.sitesetting.update({
        where: { id: existing.id },
        data: {
          title: "CATEGORY_RECOMMENDED_KEYWORDS",
          subtitle,
          contentJson,
          imageUrl: null,
          sortWeight: maxSortWeight,
          isActive: activeCount > 0
        }
      });
      return;
    }
    await import_prisma.default.sitesetting.create({
      data: {
        settingType: "STATIC_COPY",
        title: "CATEGORY_RECOMMENDED_KEYWORDS",
        subtitle,
        contentJson,
        imageUrl: null,
        sortWeight: maxSortWeight,
        isActive: activeCount > 0
      }
    });
  })
);
var saveCategoryTopPromotionConfig = (0, import_action_utils.requireRole)([import_action_utils.UserRole.ADMIN])(
  (0, import_action_utils.withResult)(async (input) => {
    const message = input.message.trim();
    const endTime = input.end_time?.trim() ? input.end_time.trim() : null;
    const backgroundColor = input.background_color?.trim() || DEFAULT_CATEGORY_TOP_PROMOTION_CONFIG.background_color;
    const textColor = input.text_color?.trim() || DEFAULT_CATEGORY_TOP_PROMOTION_CONFIG.text_color;
    const contentJson = {
      enabled: input.enabled === true,
      message,
      end_time: endTime,
      background_color: backgroundColor,
      text_color: textColor
    };
    const existing = await import_prisma.default.sitesetting.findFirst({
      where: { title: "CATEGORY_TOP_PROMOTION" },
      orderBy: [{ updatedAt: "desc" }]
    });
    if (existing) {
      await import_prisma.default.sitesetting.update({
        where: { id: existing.id },
        data: {
          settingType: existing.settingType,
          title: "CATEGORY_TOP_PROMOTION",
          subtitle: "\u5206\u7C7B\u9875\u9876\u90E8\u4FC3\u9500\u5012\u8BA1\u65F6\u914D\u7F6E",
          contentJson,
          imageUrl: null,
          isActive: input.enabled === true
        }
      });
      return;
    }
    await import_prisma.default.sitesetting.create({
      data: {
        settingType: "STATIC_COPY",
        title: "CATEGORY_TOP_PROMOTION",
        subtitle: "\u5206\u7C7B\u9875\u9876\u90E8\u4FC3\u9500\u5012\u8BA1\u65F6\u914D\u7F6E",
        contentJson,
        imageUrl: null,
        sortWeight: 0,
        isActive: input.enabled === true
      }
    });
  })
);
var deleteCategory = (0, import_action_utils.requireRole)([import_action_utils.UserRole.ADMIN])(
  (0, import_action_utils.withResult)(async (input) => {
    const { category_id } = input;
    const category = await import_prisma.default.category.findUnique({
      where: { id: category_id },
      include: {
        _count: {
          select: { products: true, children: true }
        }
      }
    });
    if (!category) throw new Error("\u5206\u7C7B\u4E0D\u5B58\u5728");
    if (category._count.children > 0) {
      throw new Error("\u8BE5\u5206\u7C7B\u4E0B\u4ECD\u5B58\u5728\u5B50\u5206\u7C7B\uFF0C\u8BF7\u5148\u8FC1\u79FB\u6216\u5220\u9664\u5B50\u5206\u7C7B\u540E\u518D\u64CD\u4F5C");
    }
    if (category._count.products > 0) {
      throw new Error("\u8BE5\u5206\u7C7B\u4E0B\u4ECD\u5B58\u5728\u5173\u8054\u5546\u54C1\uFF0C\u8BF7\u5148\u5C06\u5546\u54C1\u6539\u7ED1\u5230\u5176\u4ED6\u5206\u7C7B\u540E\u518D\u5220\u9664");
    }
    await import_prisma.default.categorykeywordlink.deleteMany({ where: { categoryId: category_id } });
    await import_prisma.default.category.delete({
      where: { id: category_id }
    });
  })
);
var createKeywordGroup = (0, import_action_utils.requireRole)([import_action_utils.UserRole.ADMIN])(
  (0, import_action_utils.withResult)(async (input) => {
    const normalizedName = input.name.trim();
    if (!normalizedName) throw new Error("\u5173\u952E\u8BCD\u5206\u7EC4\u540D\u79F0\u4E0D\u80FD\u4E3A\u7A7A");
    const existing = await import_prisma.default.keywordgroup.findFirst({ where: { name: normalizedName } });
    if (existing) throw new Error("\u5173\u952E\u8BCD\u5206\u7EC4\u540D\u79F0\u5DF2\u5B58\u5728");
    const created = await import_prisma.default.keywordgroup.create({
      data: {
        name: normalizedName,
        slug: normalizeOptionalSlug(input.slug),
        groupType: input.group_type,
        sceneKey: normalizeSceneValue(input.scene_key),
        sceneType: normalizeSceneValue(input.scene_type),
        sceneSlotKey: normalizeSceneValue(input.scene_slot_key),
        sceneSlotName: input.scene_slot_name?.trim() || null,
        description: input.description?.trim() || null,
        floorTitle: input.floor_title?.trim() || null,
        floorIcon: input.floor_icon?.trim() || null,
        floorLink: input.floor_link?.trim() || null,
        homepageSortWeight: Number.isFinite(input.homepage_sort_weight) ? Number(input.homepage_sort_weight) : 0,
        showOnHomepage: input.show_on_homepage === true,
        sortWeight: Number.isFinite(input.sort_weight) ? Number(input.sort_weight) : 0,
        isActive: input.is_active !== false
      }
    });
    await syncKeywordGroupProducts(created.id, input.linked_products);
  })
);
var updateKeywordGroup = (0, import_action_utils.requireRole)([import_action_utils.UserRole.ADMIN])(
  (0, import_action_utils.withResult)(async (input) => {
    const normalizedName = input.name.trim();
    if (!normalizedName) throw new Error("\u5173\u952E\u8BCD\u5206\u7EC4\u540D\u79F0\u4E0D\u80FD\u4E3A\u7A7A");
    const group = await import_prisma.default.keywordgroup.findUnique({ where: { id: input.keyword_group_id } });
    if (!group) throw new Error("\u5173\u952E\u8BCD\u5206\u7EC4\u4E0D\u5B58\u5728");
    const existing = await import_prisma.default.keywordgroup.findFirst({
      where: {
        name: normalizedName,
        id: { not: input.keyword_group_id }
      }
    });
    if (existing) throw new Error("\u5173\u952E\u8BCD\u5206\u7EC4\u540D\u79F0\u5DF2\u5B58\u5728");
    await import_prisma.default.keywordgroup.update({
      where: { id: input.keyword_group_id },
      data: {
        name: normalizedName,
        slug: normalizeOptionalSlug(input.slug),
        groupType: input.group_type,
        sceneKey: normalizeSceneValue(input.scene_key),
        sceneType: normalizeSceneValue(input.scene_type),
        sceneSlotKey: normalizeSceneValue(input.scene_slot_key),
        sceneSlotName: input.scene_slot_name?.trim() || null,
        description: input.description?.trim() || null,
        floorTitle: input.floor_title?.trim() || null,
        floorIcon: input.floor_icon?.trim() || null,
        floorLink: input.floor_link?.trim() || null,
        homepageSortWeight: Number.isFinite(input.homepage_sort_weight) ? Number(input.homepage_sort_weight) : 0,
        showOnHomepage: input.show_on_homepage === true,
        sortWeight: Number.isFinite(input.sort_weight) ? Number(input.sort_weight) : 0,
        isActive: input.is_active !== false
      }
    });
    await syncKeywordGroupProducts(input.keyword_group_id, input.linked_products);
  })
);
var deleteKeywordGroup = (0, import_action_utils.requireRole)([import_action_utils.UserRole.ADMIN])(
  (0, import_action_utils.withResult)(async (input) => {
    const group = await import_prisma.default.keywordgroup.findUnique({ where: { id: input.keyword_group_id } });
    if (!group) throw new Error("\u5173\u952E\u8BCD\u5206\u7EC4\u4E0D\u5B58\u5728");
    await import_prisma.default.$transaction(async (tx) => {
      const keywordIds = await tx.keyworditem.findMany({
        where: { groupId: input.keyword_group_id },
        select: { id: true }
      });
      const ids = keywordIds.map((item) => item.id);
      if (ids.length > 0) {
        await tx.categorykeywordlink.deleteMany({ where: { keywordItemId: { in: ids } } });
      }
      await tx.categorykeywordlink.deleteMany({ where: { keywordGroupId: input.keyword_group_id } });
      await tx.keyworditem.deleteMany({ where: { groupId: input.keyword_group_id } });
      await tx.keywordgroup.delete({ where: { id: input.keyword_group_id } });
    });
  })
);
var createKeywordItem = (0, import_action_utils.requireRole)([import_action_utils.UserRole.ADMIN])(
  (0, import_action_utils.withResult)(async (input) => {
    const keyword = normalizeKeyword(input.keyword);
    if (!keyword) throw new Error("\u5173\u952E\u8BCD\u4E0D\u80FD\u4E3A\u7A7A");
    const group = await import_prisma.default.keywordgroup.findUnique({ where: { id: input.keyword_group_id } });
    if (!group) throw new Error("\u5173\u952E\u8BCD\u5206\u7EC4\u4E0D\u5B58\u5728");
    if (input.parent_keyword_id) {
      const parentKeyword = await import_prisma.default.keyworditem.findUnique({ where: { id: input.parent_keyword_id } });
      if (!parentKeyword) throw new Error("\u4E0A\u7EA7\u5173\u952E\u8BCD\u4E0D\u5B58\u5728");
      if (parentKeyword.groupId !== input.keyword_group_id) throw new Error("\u4E8C\u7EA7\u5173\u952E\u8BCD\u5FC5\u987B\u5F52\u5C5E\u540C\u4E00\u5173\u952E\u8BCD\u5206\u7EC4");
      if (parentKeyword.parentKeywordId) throw new Error("\u5F53\u524D\u4EC5\u652F\u6301\u4E00\u7EA7\u5173\u952E\u8BCD\u4E0B\u65B0\u589E\u4E8C\u7EA7\u5173\u952E\u8BCD");
    }
    const normalizedToken = normalizeKeywordToken(keyword);
    const existing = await import_prisma.default.keyworditem.findFirst({
      where: {
        groupId: input.keyword_group_id,
        parentKeywordId: input.parent_keyword_id ?? null,
        normalizedKeyword: normalizedToken
      }
    });
    if (existing) throw new Error("\u540C\u5C42\u7EA7\u4E0B\u5DF2\u5B58\u5728\u76F8\u540C\u5173\u952E\u8BCD");
    await import_prisma.default.keyworditem.create({
      data: {
        groupId: input.keyword_group_id,
        parentKeywordId: input.parent_keyword_id ?? null,
        keyword,
        normalizedKeyword: normalizedToken,
        sortWeight: Number.isFinite(input.sort_weight) ? Number(input.sort_weight) : 0,
        isActive: input.is_active !== false
      }
    });
  })
);
var updateKeywordItem = (0, import_action_utils.requireRole)([import_action_utils.UserRole.ADMIN])(
  (0, import_action_utils.withResult)(async (input) => {
    const keyword = normalizeKeyword(input.keyword);
    if (!keyword) throw new Error("\u5173\u952E\u8BCD\u4E0D\u80FD\u4E3A\u7A7A");
    const item = await import_prisma.default.keyworditem.findUnique({ where: { id: input.keyword_item_id } });
    if (!item) throw new Error("\u5173\u952E\u8BCD\u4E0D\u5B58\u5728");
    const nextParentKeywordId = input.parent_keyword_id === void 0 ? item.parentKeywordId : input.parent_keyword_id ?? null;
    if (nextParentKeywordId === item.id) {
      throw new Error("\u5173\u952E\u8BCD\u4E0D\u80FD\u8BBE\u7F6E\u81EA\u5DF1\u4E3A\u4E0A\u7EA7");
    }
    if (nextParentKeywordId) {
      const parentKeyword = await import_prisma.default.keyworditem.findUnique({ where: { id: nextParentKeywordId } });
      if (!parentKeyword) throw new Error("\u4E0A\u7EA7\u5173\u952E\u8BCD\u4E0D\u5B58\u5728");
      if (parentKeyword.groupId !== item.groupId) throw new Error("\u4E8C\u7EA7\u5173\u952E\u8BCD\u5FC5\u987B\u5F52\u5C5E\u540C\u4E00\u5173\u952E\u8BCD\u5206\u7EC4");
      if (parentKeyword.parentKeywordId) throw new Error("\u5F53\u524D\u4EC5\u652F\u6301\u4E00\u7EA7\u5173\u952E\u8BCD\u4E0B\u7EF4\u62A4\u4E8C\u7EA7\u5173\u952E\u8BCD");
    }
    const normalizedToken = normalizeKeywordToken(keyword);
    const existing = await import_prisma.default.keyworditem.findFirst({
      where: {
        groupId: item.groupId,
        parentKeywordId: nextParentKeywordId,
        normalizedKeyword: normalizedToken,
        id: { not: item.id }
      }
    });
    if (existing) throw new Error("\u540C\u5C42\u7EA7\u4E0B\u5DF2\u5B58\u5728\u76F8\u540C\u5173\u952E\u8BCD");
    await import_prisma.default.keyworditem.update({
      where: { id: input.keyword_item_id },
      data: {
        keyword,
        parentKeywordId: nextParentKeywordId,
        normalizedKeyword: normalizedToken,
        sortWeight: Number.isFinite(input.sort_weight) ? Number(input.sort_weight) : item.sortWeight,
        isActive: input.is_active !== false
      }
    });
  })
);
var deleteKeywordItem = (0, import_action_utils.requireRole)([import_action_utils.UserRole.ADMIN])(
  (0, import_action_utils.withResult)(async (input) => {
    const item = await import_prisma.default.keyworditem.findUnique({ where: { id: input.keyword_item_id } });
    if (!item) throw new Error("\u5173\u952E\u8BCD\u4E0D\u5B58\u5728");
    const childItems = await import_prisma.default.keyworditem.findMany({
      where: { parentKeywordId: input.keyword_item_id },
      select: { id: true }
    });
    const idsToDelete = [input.keyword_item_id, ...childItems.map((child) => child.id)];
    await import_prisma.default.$transaction(async (tx) => {
      await tx.categorykeywordlink.deleteMany({ where: { keywordItemId: { in: idsToDelete } } });
      await tx.keyworditem.deleteMany({ where: { id: { in: idsToDelete } } });
    });
  })
);
var batchUpsertKeywordItems = (0, import_action_utils.requireRole)([import_action_utils.UserRole.ADMIN])(
  (0, import_action_utils.withResult)(async (input) => {
    const group = await import_prisma.default.keywordgroup.findUnique({ where: { id: input.keyword_group_id } });
    if (!group) throw new Error("\u5173\u952E\u8BCD\u5206\u7EC4\u4E0D\u5B58\u5728");
    const normalizedItems = (input.items ?? []).map((item) => ({
      keyword_item_id: item.keyword_item_id ?? null,
      keyword: normalizeKeyword(item.keyword),
      parent_keyword_id: item.parent_keyword_id === void 0 ? input.parent_keyword_id ?? null : item.parent_keyword_id ?? null,
      sort_weight: Number.isFinite(item.sort_weight) ? Number(item.sort_weight) : 0,
      is_active: item.is_active !== false
    })).filter((item) => item.keyword);
    if (normalizedItems.length === 0) {
      throw new Error("\u8BF7\u81F3\u5C11\u5F55\u5165\u4E00\u6761\u6709\u6548\u5173\u952E\u8BCD");
    }
    const parentIds = Array.from(new Set(normalizedItems.map((item) => item.parent_keyword_id).filter((value) => Boolean(value))));
    const existingItems = await import_prisma.default.keyworditem.findMany({
      where: {
        OR: [
          { id: { in: normalizedItems.map((item) => item.keyword_item_id).filter((value) => Boolean(value)) } },
          parentIds.length > 0 ? { id: { in: parentIds } } : void 0
        ].filter(Boolean)
      }
    });
    const itemMap = new Map(existingItems.map((item) => [item.id, item]));
    normalizedItems.forEach((item) => {
      if (item.parent_keyword_id) {
        const parent = itemMap.get(item.parent_keyword_id);
        if (!parent) throw new Error("\u5B58\u5728\u65E0\u6548\u7684\u4E0A\u7EA7\u5173\u952E\u8BCD");
        if (parent.groupId !== input.keyword_group_id) throw new Error("\u4E8C\u7EA7\u5173\u952E\u8BCD\u5FC5\u987B\u5F52\u5C5E\u540C\u4E00\u5173\u952E\u8BCD\u5206\u7EC4");
        if (parent.parentKeywordId) throw new Error("\u5F53\u524D\u4EC5\u652F\u6301\u4E00\u7EA7\u5173\u952E\u8BCD\u4E0B\u7EF4\u62A4\u4E8C\u7EA7\u5173\u952E\u8BCD");
      }
      if (item.keyword_item_id && item.parent_keyword_id === item.keyword_item_id) {
        throw new Error("\u5173\u952E\u8BCD\u4E0D\u80FD\u8BBE\u7F6E\u81EA\u5DF1\u4E3A\u4E0A\u7EA7");
      }
    });
    const duplicateKeySet = /* @__PURE__ */ new Set();
    normalizedItems.forEach((item) => {
      const duplicateKey = `${item.parent_keyword_id ?? "root"}::${normalizeKeywordToken(item.keyword)}`;
      if (duplicateKeySet.has(duplicateKey)) {
        throw new Error("\u6279\u91CF\u5185\u5BB9\u4E2D\u5B58\u5728\u540C\u5C42\u7EA7\u91CD\u590D\u5173\u952E\u8BCD\uFF0C\u8BF7\u8C03\u6574\u540E\u91CD\u8BD5");
      }
      duplicateKeySet.add(duplicateKey);
    });
    await import_prisma.default.$transaction(async (tx) => {
      for (const item of normalizedItems) {
        const normalizedToken = normalizeKeywordToken(item.keyword);
        const existing = await tx.keyworditem.findFirst({
          where: {
            groupId: input.keyword_group_id,
            parentKeywordId: item.parent_keyword_id,
            normalizedKeyword: normalizedToken,
            ...item.keyword_item_id ? { id: { not: item.keyword_item_id } } : {}
          }
        });
        if (existing) {
          throw new Error(`\u5173\u952E\u8BCD"${item.keyword}"\u5728\u540C\u5C42\u7EA7\u5DF2\u5B58\u5728`);
        }
        if (item.keyword_item_id) {
          const current = await tx.keyworditem.findUnique({ where: { id: item.keyword_item_id } });
          if (!current || current.groupId !== input.keyword_group_id) {
            throw new Error("\u5B58\u5728\u4E0D\u53EF\u7F16\u8F91\u7684\u5173\u952E\u8BCD\u8BB0\u5F55\uFF0C\u8BF7\u5237\u65B0\u540E\u91CD\u8BD5");
          }
          await tx.keyworditem.update({
            where: { id: item.keyword_item_id },
            data: {
              keyword: item.keyword,
              parentKeywordId: item.parent_keyword_id,
              normalizedKeyword: normalizedToken,
              sortWeight: item.sort_weight,
              isActive: item.is_active
            }
          });
          continue;
        }
        await tx.keyworditem.create({
          data: {
            groupId: input.keyword_group_id,
            parentKeywordId: item.parent_keyword_id,
            keyword: item.keyword,
            normalizedKeyword: normalizedToken,
            sortWeight: item.sort_weight,
            isActive: item.is_active
          }
        });
      }
    });
  })
);
var batchApplyKeywordsToCategories = (0, import_action_utils.requireRole)([import_action_utils.UserRole.ADMIN])(
  (0, import_action_utils.withResult)(async (input) => {
    const categoryIds = Array.from(new Set((input.category_ids ?? []).filter(Boolean)));
    if (categoryIds.length === 0) throw new Error("\u8BF7\u81F3\u5C11\u9009\u62E9\u4E00\u4E2A\u5206\u7C7B");
    const group = await import_prisma.default.keywordgroup.findUnique({ where: { id: input.keyword_group_id } });
    if (!group) throw new Error("\u5173\u952E\u8BCD\u5206\u7EC4\u4E0D\u5B58\u5728");
    const categories = await import_prisma.default.category.findMany({
      where: { id: { in: categoryIds } },
      select: { id: true, name: true }
    });
    if (categories.length !== categoryIds.length) {
      throw new Error("\u5B58\u5728\u4E0D\u53EF\u7528\u7684\u76EE\u6807\u5206\u7C7B\uFF0C\u8BF7\u5237\u65B0\u540E\u91CD\u8BD5");
    }
    const keywordItemIds = Array.from(new Set((input.keyword_item_ids ?? []).filter(Boolean)));
    if (keywordItemIds.length > 0) {
      const validItems = await import_prisma.default.keyworditem.findMany({
        where: { id: { in: keywordItemIds }, groupId: input.keyword_group_id },
        select: { id: true }
      });
      if (validItems.length !== keywordItemIds.length) {
        throw new Error("\u5B58\u5728\u4E0D\u5C5E\u4E8E\u5F53\u524D\u5206\u7EC4\u7684\u5173\u952E\u8BCD\uFF0C\u8BF7\u5237\u65B0\u540E\u91CD\u8BD5");
      }
    }
    const linkTargets = keywordItemIds.length > 0 ? keywordItemIds : [null];
    const existingLinks = await import_prisma.default.categorykeywordlink.findMany({
      where: {
        categoryId: { in: categoryIds },
        keywordGroupId: input.keyword_group_id,
        keywordItemId: keywordItemIds.length > 0 ? { in: keywordItemIds } : null
      },
      select: { id: true, categoryId: true, keywordItemId: true }
    });
    const existingKeySet = new Set(existingLinks.map((item) => `${item.categoryId}_${item.keywordItemId ?? "group"}`));
    const creatableEntries = [];
    categoryIds.forEach((categoryId) => {
      linkTargets.forEach((keywordItemId) => {
        const key = `${categoryId}_${keywordItemId ?? "group"}`;
        if (!existingKeySet.has(key)) {
          creatableEntries.push({ categoryId, keywordItemId });
        }
      });
    });
    if (creatableEntries.length > 0) {
      await import_prisma.default.categorykeywordlink.createMany({
        data: creatableEntries.map((entry, index) => ({
          categoryId: entry.categoryId,
          keywordGroupId: input.keyword_group_id,
          keywordItemId: entry.keywordItemId,
          applyToHomepage: input.apply_to_homepage,
          sortWeight: creatableEntries.length - index
        })),
        skipDuplicates: true
      });
    }
    if (input.apply_to_homepage) {
      await import_prisma.default.categorykeywordlink.updateMany({
        where: {
          categoryId: { in: categoryIds },
          keywordGroupId: input.keyword_group_id,
          keywordItemId: keywordItemIds.length > 0 ? { in: keywordItemIds } : null
        },
        data: { applyToHomepage: true }
      });
    }
    return {
      success_count: categoryIds.length,
      failed_count: 0,
      message: ""
    };
  })
);
var batchDeleteCategories = (0, import_action_utils.requireRole)([import_action_utils.UserRole.ADMIN])(
  (0, import_action_utils.withResult)(async (input) => {
    const categoryIds = Array.from(new Set((input.category_ids ?? []).filter(Boolean)));
    if (categoryIds.length === 0) throw new Error("\u8BF7\u81F3\u5C11\u9009\u62E9\u4E00\u4E2A\u5206\u7C7B");
    const categories = await import_prisma.default.category.findMany({
      where: { id: { in: categoryIds } },
      include: {
        _count: {
          select: { products: true, children: true }
        }
      }
    });
    let successCount = 0;
    const failedMessages = [];
    for (const category of categories) {
      if (category._count.children > 0) {
        failedMessages.push(`${category.name}\uFF1A\u4ECD\u5B58\u5728\u5B50\u5206\u7C7B`);
        continue;
      }
      if (category._count.products > 0) {
        failedMessages.push(`${category.name}\uFF1A\u4ECD\u5B58\u5728\u5173\u8054\u5546\u54C1`);
        continue;
      }
      await import_prisma.default.$transaction(async (tx) => {
        await tx.categorykeywordlink.deleteMany({ where: { categoryId: category.id } });
        await tx.category.delete({ where: { id: category.id } });
      });
      successCount += 1;
    }
    return {
      success_count: successCount,
      failed_count: categoryIds.length - successCount,
      message: failedMessages.join("; ")
    };
  })
);
var batchUpdateCategoryStatus = (0, import_action_utils.requireRole)([import_action_utils.UserRole.ADMIN])(
  (0, import_action_utils.withResult)(async (input) => {
    const categoryIds = Array.from(new Set((input.category_ids ?? []).filter(Boolean)));
    if (categoryIds.length === 0) throw new Error("\u8BF7\u81F3\u5C11\u9009\u62E9\u4E00\u4E2A\u5206\u7C7B");
    const categories = await import_prisma.default.category.findMany({ where: { id: { in: categoryIds } } });
    for (const category of categories) {
      const newStatus = input.status === "ACTIVE" ? "ACTIVE" : "INACTIVE";
      if (category.status === newStatus) continue;
      await updateCategoryAndCascade(category.id, { status: newStatus }, newStatus);
    }
    return {
      success_count: categories.length,
      failed_count: 0,
      message: ""
    };
  })
);
var batchMoveCategoryParent = (0, import_action_utils.requireRole)([import_action_utils.UserRole.ADMIN])(
  (0, import_action_utils.withResult)(async (input) => {
    const categoryIds = Array.from(new Set((input.category_ids ?? []).filter(Boolean)));
    if (categoryIds.length === 0) throw new Error("\u8BF7\u81F3\u5C11\u9009\u62E9\u4E00\u4E2A\u5206\u7C7B");
    await ensureNoCycleForBatchMove({ categoryIds, targetParentId: input.target_parent_id });
    let parentId = null;
    if (input.target_parent_id) {
      const parent = await import_prisma.default.category.findUnique({ where: { id: input.target_parent_id } });
      if (!parent) throw new Error("\u76EE\u6807\u7236\u5206\u7C7B\u4E0D\u5B58\u5728");
      if (parent.level !== 1) throw new Error("\u76EE\u6807\u7236\u5206\u7C7B\u5FC5\u987B\u4E3A\u4E00\u7EA7\u5206\u7C7B");
      if (getCategoryKindFromRecord(parent) === "BRAND") throw new Error("\u54C1\u724C\u5206\u7C7B\u4E0D\u80FD\u4F5C\u4E3A\u76EE\u6807\u7236\u5206\u7C7B");
      parentId = parent.id;
    }
    const categories = await import_prisma.default.category.findMany({ where: { id: { in: categoryIds } } });
    let successCount = 0;
    const failedMessages = [];
    for (const category of categories) {
      if (category.level !== 2) {
        failedMessages.push(`${category.name}\uFF1A\u4EC5\u652F\u6301\u79FB\u52A8\u4E8C\u7EA7\u5206\u7C7B`);
        continue;
      }
      await import_prisma.default.category.update({
        where: { id: category.id },
        data: { parentId }
      });
      successCount += 1;
    }
    return {
      success_count: successCount,
      failed_count: categories.length - successCount,
      message: failedMessages.join("; ")
    };
  })
);
var getKeywordGroupTypeLabels = (0, import_action_utils.requireRole)([import_action_utils.UserRole.ADMIN])(
  (0, import_action_utils.withResult)(async () => KEYWORD_GROUP_TYPE_LABELS)
);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  batchApplyKeywordsToCategories,
  batchCreateSubcategories,
  batchDeleteCategories,
  batchMoveCategoryParent,
  batchRemoveKeywordGroupProductLinks,
  batchUpdateCategoryStatus,
  batchUpsertKeywordItems,
  createCategory,
  createKeywordGroup,
  createKeywordItem,
  deleteCategory,
  deleteKeywordGroup,
  deleteKeywordItem,
  getCategoryList,
  getKeywordGroupTypeLabels,
  getKeywordGroups,
  removeKeywordGroupProductLink,
  saveCategoryRecommendedKeywords,
  saveCategoryTopPromotionConfig,
  saveHomepagePosterConfig,
  searchKeywordGroupProducts,
  updateCategory,
  updateCategorySortWeight,
  updateCategoryStatus,
  updateKeywordGroup,
  updateKeywordItem
});
