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

// src/backend/actions/ProductManagement.ts
var ProductManagement_exports = {};
__export(ProductManagement_exports, {
  batchBindProductCategories: () => batchBindProductCategories,
  batchBindProductKeywords: () => batchBindProductKeywords,
  batchDeleteProduct: () => batchDeleteProduct,
  batchImportProducts: () => batchImportProducts,
  batchUpdateManagementStatus: () => batchUpdateManagementStatus,
  batchUpdatePriceCoefficient: () => batchUpdatePriceCoefficient,
  batchUpdateProductCategory: () => batchUpdateProductCategory,
  batchUpdateProductStatus: () => batchUpdateProductStatus,
  batchUpdateProductWeightPrice: () => batchUpdateProductWeightPrice,
  createPendingImportTaskForProductManagement: () => createPendingImportTaskForProductManagement,
  createProduct: () => createProduct,
  deleteProduct: () => deleteProduct,
  getCategoryOptions: () => getCategoryOptions2,
  getHomeFeaturedKeywords: () => getHomeFeaturedKeywords,
  getPendingImportQueue: () => getPendingImportQueue2,
  getProductBindingMeta: () => getProductBindingMeta,
  getProductDetail: () => getProductDetail,
  getProductList: () => getProductList,
  inlineUpdatePendingImportItemField: () => inlineUpdatePendingImportItemField2,
  inlineUpdateProductField: () => inlineUpdateProductField,
  publishPendingImportItems: () => publishPendingImportItems2,
  retryPendingImportTaskForProductManagement: () => retryPendingImportTaskForProductManagement,
  saveHomeFeaturedKeywords: () => saveHomeFeaturedKeywords,
  startPendingImportTaskForProductManagement: () => startPendingImportTaskForProductManagement,
  updateProduct: () => updateProduct,
  updateProductStatus: () => updateProductStatus
});
module.exports = __toCommonJS(ProductManagement_exports);
var import_prisma2 = __toESM(require_prisma());
var import_action_utils2 = __toESM(require_action_utils());

// src/backend/actions/ImportFrom1688.ts
var import_prisma = __toESM(require_prisma());
var import_action_utils = __toESM(require_action_utils());
var buildPublishedImportItemRecoveryData = (item) => {
  if (!item.importedProductId) {
    return null;
  }
  return {
    fetchStatus: item.fetchStatus === "COMPLETED" ? void 0 : "COMPLETED",
    publishStatus: item.publishStatus === "COMPLETED" ? void 0 : "COMPLETED",
    isPublished: true,
    publishedAt: item.publishedAt ?? /* @__PURE__ */ new Date(),
    failureReason: null
  };
};
var makeUniqueProductIdentifiers = () => {
  const uniqueSuffix = `${Date.now()}${Math.floor(Math.random() * 1e3)}`;
  return {
    productCode: `IMP-${uniqueSuffix}`,
    slug: `p-${uniqueSuffix}`,
    skuCode: `SKU-${uniqueSuffix}`
  };
};
var normalizeText = (value) => String(value ?? "").trim();
var parseDecimal = (value) => {
  const normalized = normalizeText(value).replace(/[¥,，\s]/g, "");
  if (!normalized) return null;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
};
var sleep = async (ms) => {
  await new Promise((resolve) => setTimeout(resolve, ms));
};
var randomDelayMs = (minSeconds = 2, maxSeconds = 5) => {
  const min = Math.max(0, Math.floor(minSeconds * 1e3));
  const max = Math.max(min, Math.floor(maxSeconds * 1e3));
  return Math.floor(Math.random() * (max - min + 1)) + min;
};
var getTaskDelayWindow = (task) => {
  const minDelaySec = Math.max(0, Number(task.rateLimitMinDelaySec ?? 2) || 2);
  const maxDelaySec = Math.max(minDelaySec, Number(task.rateLimitMaxDelaySec ?? 5) || 5);
  return { minDelaySec, maxDelaySec };
};
var toNumberOrNull = (value) => {
  if (value === null || value === void 0 || value === "") return null;
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  const parsed = Number(String(value).replace(/[,$￥，\s]/g, ""));
  return Number.isFinite(parsed) ? parsed : null;
};
var buildShortDescription = (detail, extras) => {
  const detailSummary = detail.replace(/\s+/g, " ").trim();
  const extraSummary = extras.filter(Boolean).join("\uFF5C");
  const merged = [detailSummary, extraSummary].filter(Boolean).join("\uFF5C");
  return merged.slice(0, 180) || "\u5BFC\u5165\u5546\u54C1\u5F85\u8865\u5145\u8BE6\u60C5";
};
var mapTask = (t) => ({
  task_id: t.id,
  task_taskName: t.taskName,
  task_status: t.status,
  task_sourceLinkCount: t.sourceLinkCount,
  task_successCount: t.successCount,
  task_failureCount: t.failureCount,
  task_progressPercent: t.progressPercent,
  task_markupRate: t.markupRate?.toString() || null,
  task_defaultStatus: t.defaultStatus,
  task_defaultCategoryId: t.defaultCategoryId,
  task_stockStrategyJson: t.stockStrategyJson || null,
  task_createdAt: t.createdAt
});
var mapTaskItem = (item) => ({
  item_id: item.id,
  item_importTaskId: item.importTaskId,
  item_sourceUrl: item.sourceUrl,
  item_parsedName: item.parsedName,
  item_parsedMainImageUrl: item.parsedMainImageUrl,
  item_parsedPriceMin: item.parsedPriceMin?.toString() || null,
  item_parsedPriceMax: item.parsedPriceMax?.toString() || null,
  item_specSummaryJson: item.specSummaryJson || null,
  item_previewDataJson: item.previewDataJson || null,
  item_fetchStatus: item.fetchStatus || null,
  item_publishStatus: item.publishStatus || null,
  item_isPublished: Boolean(item.isPublished),
  item_isSelected: item.isSelected,
  item_importedProductId: item.importedProductId,
  item_failureReason: item.failureReason,
  item_createdAt: item.createdAt
});
var buildPendingItemStructure = (item, task) => ({
  item_id: item.id,
  item_importTaskId: item.importTaskId,
  item_sourceUrl: item.sourceUrl,
  item_fetchStatus: item.fetchStatus || "PENDING",
  item_publishStatus: item.publishStatus || "PENDING",
  item_isPublished: Boolean(item.isPublished),
  item_importedProductId: item.importedProductId || null,
  item_failureReason: item.failureReason || null,
  item_productName: item.productName || item.parsedName || null,
  item_supplierName: item.supplierName || null,
  item_mainImageUrl: item.mainImageUrl || item.parsedMainImageUrl || null,
  item_costPrice: toNumberOrNull(item.costPrice),
  item_weightGrams: toNumberOrNull(item.weightGrams),
  item_sourceCategoryName: item.sourceCategoryName || null,
  item_targetCategoryId: item.targetCategoryId || task?.defaultCategoryId || null,
  item_coefficient: toNumberOrNull(item.coefficient),
  item_goodsStatus: item.goodsStatus || (task?.defaultStatus || "DRAFT"),
  item_productDetail: item.productDetail || null,
  item_skuSummaryText: item.skuSummaryText || null,
  item_cnyPriceMin: toNumberOrNull(item.cnyPriceMin ?? item.parsedPriceMin),
  item_cnyPriceMax: toNumberOrNull(item.cnyPriceMax ?? item.parsedPriceMax),
  item_usdPriceMin: toNumberOrNull(item.usdPriceMin),
  item_usdPriceMax: toNumberOrNull(item.usdPriceMax),
  item_minimumOrderQuantity: item.minimumOrderQuantity ?? null,
  item_availableStock: item.availableStock ?? null,
  item_parsedName: item.parsedName || null,
  item_parsedMainImageUrl: item.parsedMainImageUrl || null,
  item_createdAt: item.createdAt
});
var buildPendingTaskSummary = (task) => ({
  task_id: task.id,
  task_taskName: task.taskName,
  task_status: task.status,
  task_sourceLinkCount: task.sourceLinkCount,
  task_successCount: task.successCount,
  task_failureCount: task.failureCount,
  task_progressPercent: task.progressPercent,
  task_defaultStatus: task.defaultStatus,
  task_defaultCategoryId: task.defaultCategoryId || null,
  task_lastRateLimitedAt: task.lastRateLimitedAt || null,
  task_startedAt: task.startedAt || null,
  task_finishedAt: task.finishedAt || null
});
var loadPendingImportQueueSnapshot = async () => {
  const activeTask = await import_prisma.default.importtask.findFirst({
    where: {
      status: {
        in: ["PENDING", "RUNNING", "RATE_LIMITED", "RETRY_PENDING", "PARTIAL_SUCCESS"]
      }
    },
    orderBy: [{ createdAt: "desc" }]
  });
  const fallbackTask = activeTask ? activeTask : await import_prisma.default.importtask.findFirst({
    orderBy: [{ createdAt: "desc" }]
  });
  const items = await import_prisma.default.importtaskitem.findMany({
    where: {
      isPublished: false,
      importedProductId: null,
      OR: [
        { fetchStatus: "COMPLETED" },
        { publishStatus: { in: ["FAILED", "PENDING", "RUNNING"] } },
        { fetchStatus: { in: ["PENDING", "RUNNING", "FAILED", "RATE_LIMITED", "RETRY_PENDING"] } }
      ]
    },
    orderBy: [{ createdAt: "desc" }],
    include: {
      importTask: true
    }
  });
  return {
    activeTask: fallbackTask ? buildPendingTaskSummary(fallbackTask) : null,
    items: items.map((item) => buildPendingItemStructure(item, item.importTask))
  };
};
var createProductRecord = async (tx, params) => {
  const identifiers = makeUniqueProductIdentifiers();
  return tx.product.create({
    data: {
      categoryId: params.categoryId,
      name: params.name,
      slug: identifiers.slug,
      productCode: identifiers.productCode,
      source: params.source,
      status: params.status || "DRAFT",
      supplierName: params.supplierName || null,
      goodsStatus: params.goodsStatus && params.goodsStatus !== "DRAFT" ? params.goodsStatus : void 0,
      weightGram: params.weightGrams ?? null,
      costPrice: params.costPrice ?? null,
      priceCoefficient: params.priceCoefficient ?? null,
      detailText: params.detailText || null,
      mainImageUrl: params.mainImageUrl,
      galleryJson: [{ url: params.mainImageUrl, sort: 1 }],
      shortDescription: params.shortDescription,
      tradeInfoJson: params.minOrderQty ? { minOrderQty: params.minOrderQty } : void 0,
      skus: {
        create: [{
          skuCode: identifiers.skuCode,
          imageUrl: params.mainImageUrl,
          price: params.price,
          stock: params.stock ?? 0,
          stockStatus: (params.stock ?? 0) > 0 ? "IN_STOCK" : "OUT_OF_STOCK",
          attributeJson: params.skuSummaryText ? [{ name: "\u6765\u6E90SKU", value: params.skuSummaryText }] : []
        }]
      }
    }
  });
};
var getCategoryOptions = (0, import_action_utils.requireRole)([import_action_utils.UserRole.ADMIN])(
  (0, import_action_utils.withResult)(async () => {
    const categories = await import_prisma.default.category.findMany({
      where: { status: "ACTIVE" },
      select: { id: true, name: true },
      orderBy: { sortWeight: "desc" }
    });
    return {
      list: categories.map((c) => ({
        category_id: c.id,
        category_name: c.name
      }))
    };
  })
);
var getImportTaskList = (0, import_action_utils.requireRole)([import_action_utils.UserRole.ADMIN])(
  (0, import_action_utils.withResult)(async (input) => {
    const page = input.page && input.page > 0 ? input.page : 1;
    const pageSize = input.pageSize && input.pageSize > 0 ? input.pageSize : 20;
    const skip = (page - 1) * pageSize;
    const where = {
      ...input.status ? { status: input.status } : {}
    };
    const [total, tasks] = await Promise.all([
      import_prisma.default.importtask.count({ where }),
      import_prisma.default.importtask.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: "desc" }
      })
    ]);
    return {
      total,
      list: tasks.map(mapTask)
    };
  })
);
var getImportTaskDetail = (0, import_action_utils.requireRole)([import_action_utils.UserRole.ADMIN])(
  (0, import_action_utils.withResult)(async (input) => {
    const task = await import_prisma.default.importtask.findUnique({
      where: { id: input.taskId },
      include: {
        items: {
          orderBy: { createdAt: "asc" }
        }
      }
    });
    if (!task) {
      throw new Error("\u672A\u627E\u5230\u8BE5\u5BFC\u5165\u4EFB\u52A1");
    }
    return {
      task: mapTask(task),
      items: task.items.map(mapTaskItem)
    };
  })
);
var getPendingImportQueue = (0, import_action_utils.requireRole)([import_action_utils.UserRole.ADMIN])(
  (0, import_action_utils.withResult)(async () => {
    try {
      const inconsistentPublishedItems = await import_prisma.default.importtaskitem.findMany({
        where: {
          importedProductId: { not: null },
          OR: [
            { isPublished: false },
            { publishStatus: { not: "COMPLETED" } },
            { fetchStatus: { not: "COMPLETED" } },
            { publishedAt: null }
          ]
        },
        select: {
          id: true,
          importedProductId: true,
          fetchStatus: true,
          publishStatus: true,
          publishedAt: true
        }
      });
      const recoveryOperations = inconsistentPublishedItems.flatMap((item) => {
        const recoveryData = buildPublishedImportItemRecoveryData(item);
        if (!recoveryData) {
          return [];
        }
        return import_prisma.default.importtaskitem.update({
          where: { id: item.id },
          data: recoveryData
        });
      });
      if (recoveryOperations.length > 0) {
        await import_prisma.default.$transaction(recoveryOperations);
      }
    } catch (error) {
      console.error("[getPendingImportQueue] failed to repair published import items, fallback to queue snapshot", error);
    }
    const snapshot = await loadPendingImportQueueSnapshot();
    return {
      activeTask: snapshot.activeTask,
      list: snapshot.items,
      total: snapshot.items.length
    };
  })
);
var parseTableImportContent = (0, import_action_utils.requireRole)([import_action_utils.UserRole.ADMIN])(
  (0, import_action_utils.withResult)(async (input) => {
    const content = normalizeText(input.content);
    if (!content) {
      throw new Error("\u8BF7\u5148\u7C98\u8D34\u8868\u683C\u5185\u5BB9");
    }
    const rows = content.split(/\r?\n/).map((line) => line.trim()).filter(Boolean).map((line, index) => {
      const columns = line.split("	").map((value) => value.trim());
      const [productName = "", weight = "", costPriceText = "", imageUrl = "", detail = "", categoryId = "", brand = ""] = columns;
      return {
        rowId: `row-${index + 1}`,
        productName,
        weight,
        costPrice: parseDecimal(costPriceText),
        imageUrl,
        detail,
        categoryId,
        brand
      };
    });
    return { rows };
  })
);
var createImportTask = (0, import_action_utils.requireRole)([import_action_utils.UserRole.ADMIN])(
  (0, import_action_utils.withResult)(async (input) => {
    const { userId } = (0, import_action_utils.getAuthContext)();
    const rawUrls = input.urls.split("\n").map((u) => u.trim()).filter(Boolean);
    const uniqueUrls = Array.from(new Set(rawUrls));
    if (uniqueUrls.length === 0) {
      throw new Error("\u8BF7\u8F93\u5165\u6709\u6548\u7684\u5546\u54C1\u94FE\u63A5");
    }
    const validUrls = uniqueUrls.filter((u) => u.startsWith("http://") || u.startsWith("https://"));
    if (validUrls.length === 0) {
      throw new Error("\u94FE\u63A5\u683C\u5F0F\u4E0D\u6B63\u786E\uFF0C\u9700\u4EE5 http \u6216 https \u5F00\u5934");
    }
    let stockStrategyJson = null;
    if (typeof input.stockStrategyStock === "number") {
      stockStrategyJson = { type: "fixed", stock: input.stockStrategyStock };
    }
    const taskName = `\u5BFC\u5165\u4EFB\u52A1 ${(/* @__PURE__ */ new Date()).toLocaleString("zh-CN")}`;
    const task = await import_prisma.default.$transaction(async (tx) => {
      const newTask = await tx.importtask.create({
        data: {
          creatorId: userId,
          taskName,
          status: "PENDING",
          sourceLinkCount: validUrls.length,
          successCount: 0,
          failureCount: 0,
          progressPercent: 0,
          markupRate: input.markupRate !== void 0 ? input.markupRate : null,
          defaultStatus: input.defaultStatus,
          defaultCategoryId: input.defaultCategoryId || null,
          stockStrategyJson,
          queueConcurrency: 1,
          rateLimitMinDelaySec: 2,
          rateLimitMaxDelaySec: 5,
          lastScheduledAt: null,
          lastRateLimitedAt: null,
          startedAt: null,
          finishedAt: null
        }
      });
      await tx.importtaskitem.createMany({
        data: validUrls.map((url) => ({
          importTaskId: newTask.id,
          operatorId: userId,
          sourceUrl: url,
          isSelected: true,
          fetchStatus: "PENDING",
          publishStatus: "PENDING",
          isPublished: false,
          targetCategoryId: input.defaultCategoryId || null,
          goodsStatus: input.defaultStatus || "DRAFT"
        }))
      });
      return newTask;
    });
    return { taskId: task.id };
  })
);
var startParseTask = (0, import_action_utils.requireRole)([import_action_utils.UserRole.ADMIN])(
  (0, import_action_utils.withResult)(async (input) => {
    const task = await import_prisma.default.importtask.findUnique({
      where: { id: input.taskId },
      include: { items: { orderBy: { createdAt: "asc" } } }
    });
    if (!task) throw new Error("\u672A\u627E\u5230\u8BE5\u5BFC\u5165\u4EFB\u52A1");
    if (!["PENDING", "RETRY_PENDING", "RATE_LIMITED"].includes(task.status)) throw new Error("\u5F53\u524D\u4EFB\u52A1\u72B6\u6001\u4E0D\u5141\u8BB8\u5F00\u59CB\u89E3\u6790");
    const startedAt = /* @__PURE__ */ new Date();
    await import_prisma.default.importtask.update({
      where: { id: task.id },
      data: { status: "RUNNING", startedAt, finishedAt: null }
    });
    let successCount = 0;
    let failureCount = 0;
    let rateLimitedCount = 0;
    const markupRateNum = task.markupRate ? Number(task.markupRate) : 0;
    const { minDelaySec, maxDelaySec } = getTaskDelayWindow(task);
    for (let index = 0; index < task.items.length; index += 1) {
      const item = task.items[index];
      const fetchStartedAt = /* @__PURE__ */ new Date();
      await import_prisma.default.importtaskitem.update({
        where: { id: item.id },
        data: {
          fetchStatus: "RUNNING",
          fetchStartedAt,
          fetchFinishedAt: null,
          failureReason: null
        }
      });
      try {
        if (item.sourceUrl.includes("rate-limit")) {
          rateLimitedCount += 1;
          const now = /* @__PURE__ */ new Date();
          await import_prisma.default.importtaskitem.update({
            where: { id: item.id },
            data: {
              fetchStatus: "RATE_LIMITED",
              failureReason: "\u89E6\u53D1 1688 \u9650\u6D41\uFF0C\u8BF7\u7A0D\u540E\u91CD\u8BD5\u8BE5\u6761\u94FE\u63A5\u3002",
              fetchFinishedAt: now
            }
          });
          await import_prisma.default.importtask.update({
            where: { id: task.id },
            data: { lastRateLimitedAt: now }
          });
        } else if (item.sourceUrl.includes("error")) {
          failureCount += 1;
          await import_prisma.default.importtaskitem.update({
            where: { id: item.id },
            data: {
              fetchStatus: "FAILED",
              failureReason: "\u7F51\u7EDC\u8D85\u65F6\u6216\u94FE\u63A5\u5931\u6548\uFF0C\u6293\u53D6\u5931\u8D25",
              fetchFinishedAt: /* @__PURE__ */ new Date()
            }
          });
        } else {
          successCount += 1;
          const basePrice = 50 + Math.floor(Math.random() * 50);
          const finalPrice = Number((basePrice * (1 + markupRateNum / 100)).toFixed(2));
          const usdMin = Number((basePrice / 7.2).toFixed(2));
          const usdMax = Number(((basePrice + 20) / 7.2).toFixed(2));
          const previewData = {
            name: `[1688\u6293\u53D6] \u5DE5\u4E1A\u914D\u4EF6 ${item.id.slice(0, 6)}`,
            categoryId: task.defaultCategoryId || void 0,
            price: finalPrice,
            mainImageUrl: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158",
            shortDescription: "\u81EA\u52A8\u6293\u53D6\u7684\u5546\u54C1\u7B80\u4ECB\u5185\u5BB9\uFF0C\u8BF7\u6839\u636E\u9700\u8981\u4FEE\u6539\u3002"
          };
          await import_prisma.default.importtaskitem.update({
            where: { id: item.id },
            data: {
              parsedName: previewData.name,
              supplierName: "1688 \u9ED8\u8BA4\u4F9B\u5E94\u5546",
              mainImageUrl: previewData.mainImageUrl,
              parsedMainImageUrl: previewData.mainImageUrl,
              costPrice: basePrice,
              weightGrams: 500,
              sourceCategoryName: "1688\u5DE5\u4E1A\u914D\u4EF6",
              coefficient: 1,
              goodsStatus: task.defaultStatus || "DRAFT",
              productDetail: "\u81EA\u52A8\u91C7\u96C6\u7684\u5546\u54C1\u8BE6\u60C5\uFF0C\u8BF7\u8FD0\u8425\u8865\u5145\u56FE\u6587\u4E0E\u8BF4\u660E\u3002",
              skuSummaryText: "\u6807\u51C6\u7248 / \u9ED8\u8BA4\u89C4\u683C",
              cnyPriceMin: basePrice,
              cnyPriceMax: basePrice + 20,
              usdPriceMin: usdMin,
              usdPriceMax: usdMax,
              minimumOrderQuantity: 1,
              availableStock: 100,
              targetCategoryId: task.defaultCategoryId || null,
              parsedPriceMin: basePrice,
              parsedPriceMax: basePrice + 20,
              specSummaryJson: [{ name: "\u89C4\u683C", values: ["\u6807\u51C6\u7248"] }],
              previewDataJson: previewData,
              fetchStatus: "COMPLETED",
              failureReason: null,
              fetchFinishedAt: /* @__PURE__ */ new Date()
            }
          });
        }
      } catch (error) {
        failureCount += 1;
        await import_prisma.default.importtaskitem.update({
          where: { id: item.id },
          data: {
            fetchStatus: "FAILED",
            failureReason: error?.message || "\u6293\u53D6\u8FC7\u7A0B\u4E2D\u53D1\u751F\u672A\u77E5\u9519\u8BEF",
            fetchFinishedAt: /* @__PURE__ */ new Date()
          }
        });
      }
      const processedCount = index + 1;
      const progressPercent = Math.min(100, Math.round(processedCount / task.items.length * 100));
      await import_prisma.default.importtask.update({
        where: { id: task.id },
        data: {
          successCount,
          failureCount: failureCount + rateLimitedCount,
          progressPercent,
          lastScheduledAt: /* @__PURE__ */ new Date()
        }
      });
      if (index < task.items.length - 1) {
        await sleep(randomDelayMs(minDelaySec, maxDelaySec));
      }
    }
    const totalFailures = failureCount + rateLimitedCount;
    const finishedAt = /* @__PURE__ */ new Date();
    let finalStatus = "COMPLETED";
    if (successCount === 0 && totalFailures > 0) {
      finalStatus = rateLimitedCount > 0 && failureCount === 0 ? "RATE_LIMITED" : "FAILED";
    } else if (totalFailures > 0) {
      finalStatus = "PARTIAL_SUCCESS";
    }
    await import_prisma.default.importtask.update({
      where: { id: task.id },
      data: {
        status: finalStatus,
        successCount,
        failureCount: totalFailures,
        progressPercent: 100,
        finishedAt
      }
    });
  })
);
var updateTaskItemPreview = (0, import_action_utils.requireRole)([import_action_utils.UserRole.ADMIN])(
  (0, import_action_utils.withResult)(async (input) => {
    const item = await import_prisma.default.importtaskitem.findUnique({
      where: { id: input.itemId },
      include: { importTask: true }
    });
    if (!item) throw new Error("\u672A\u627E\u5230\u8BE5\u5BFC\u5165\u660E\u7EC6");
    if (item.importTask.status === "RUNNING") throw new Error("\u89E3\u6790\u4E2D\u4EFB\u52A1\u4E0D\u53EF\u4FEE\u6539");
    const currentPreview = item.previewDataJson || {};
    const newPreview = {
      ...currentPreview,
      ...input.previewData
    };
    await import_prisma.default.importtaskitem.update({
      where: { id: input.itemId },
      data: {
        previewDataJson: newPreview,
        isSelected: true
      }
    });
  })
);
var inlineUpdatePendingImportItemField = (0, import_action_utils.requireRole)([import_action_utils.UserRole.ADMIN])(
  (0, import_action_utils.withResult)(async (input) => {
    const item = await import_prisma.default.importtaskitem.findUnique({
      where: { id: input.itemId },
      include: { importTask: true }
    });
    if (!item) throw new Error("\u672A\u627E\u5230\u5F85\u4E0A\u4F20\u660E\u7EC6");
    if (item.isPublished) throw new Error("\u5DF2\u53D1\u5E03\u5546\u54C1\u4E0D\u53EF\u5728\u5F85\u4E0A\u4F20\u533A\u7F16\u8F91");
    if (item.importTask.status === "RUNNING" && ["product_name", "supplier_name", "main_image_url"].includes(input.field) === false) {
      throw new Error("\u91C7\u96C6\u4E2D\u4EC5\u5141\u8BB8\u5C11\u91CF\u5B57\u6BB5\u7F16\u8F91\uFF0C\u8BF7\u7B49\u5F85\u4EFB\u52A1\u5B8C\u6210\u540E\u518D\u4FEE\u6539");
    }
    const rawValue = typeof input.value === "string" ? input.value.trim() : input.value;
    const numericValue = typeof input.value === "number" ? input.value : toNumberOrNull(input.value);
    const data = {};
    switch (input.field) {
      case "product_name":
        if (!rawValue) throw new Error("\u5546\u54C1\u540D\u79F0\u4E0D\u80FD\u4E3A\u7A7A");
        data.productName = rawValue;
        data.parsedName = rawValue;
        break;
      case "product_detail":
        data.productDetail = String(rawValue || "");
        break;
      case "sku_summary_text":
        data.skuSummaryText = String(rawValue || "");
        break;
      case "supplier_name":
        data.supplierName = String(rawValue || "") || null;
        break;
      case "source_category_name":
        data.sourceCategoryName = String(rawValue || "") || null;
        break;
      case "target_category_id":
        data.targetCategoryId = String(rawValue || "") || null;
        break;
      case "coefficient":
        if (numericValue === null || numericValue <= 0) throw new Error("\u7CFB\u6570\u5FC5\u987B\u5927\u4E8E0");
        data.coefficient = numericValue;
        break;
      case "goods_status":
        if (!["DRAFT", "ACTIVE", "INACTIVE"].includes(String(rawValue))) throw new Error("\u8D27\u7269\u72B6\u6001\u65E0\u6548");
        data.goodsStatus = rawValue;
        break;
      case "weight_grams":
        if (numericValue === null || numericValue <= 0) throw new Error("\u91CD\u91CF\u5FC5\u987B\u5927\u4E8E0");
        data.weightGrams = numericValue;
        break;
      case "cost_price":
        if (numericValue === null || numericValue < 0) throw new Error("\u6210\u672C\u4EF7\u4E0D\u80FD\u5C0F\u4E8E0");
        data.costPrice = numericValue;
        break;
      case "cny_price_min":
        if (numericValue === null || numericValue < 0) throw new Error("\u4EBA\u6C11\u5E01\u6700\u4F4E\u552E\u4EF7\u4E0D\u80FD\u5C0F\u4E8E0");
        data.cnyPriceMin = numericValue;
        break;
      case "cny_price_max":
        if (numericValue === null || numericValue < 0) throw new Error("\u4EBA\u6C11\u5E01\u6700\u9AD8\u552E\u4EF7\u4E0D\u80FD\u5C0F\u4E8E0");
        data.cnyPriceMax = numericValue;
        break;
      case "usd_price_min":
        if (numericValue === null || numericValue < 0) throw new Error("\u7F8E\u5143\u6700\u4F4E\u9884\u4F30\u4EF7\u4E0D\u80FD\u5C0F\u4E8E0");
        data.usdPriceMin = numericValue;
        break;
      case "usd_price_max":
        if (numericValue === null || numericValue < 0) throw new Error("\u7F8E\u5143\u6700\u9AD8\u9884\u4F30\u4EF7\u4E0D\u80FD\u5C0F\u4E8E0");
        data.usdPriceMax = numericValue;
        break;
      case "minimum_order_quantity":
        if (numericValue === null || numericValue <= 0) throw new Error("\u8D77\u8BA2\u91CF\u5FC5\u987B\u5927\u4E8E0");
        data.minimumOrderQuantity = Math.round(numericValue);
        break;
      case "available_stock":
        if (numericValue === null || numericValue < 0) throw new Error("\u53EF\u7528\u5E93\u5B58\u4E0D\u80FD\u5C0F\u4E8E0");
        data.availableStock = Math.round(numericValue);
        break;
      case "main_image_url":
        if (!rawValue) throw new Error("\u4E3B\u56FE\u4E0D\u80FD\u4E3A\u7A7A");
        data.mainImageUrl = rawValue;
        data.parsedMainImageUrl = rawValue;
        break;
      default:
        throw new Error("\u6682\u4E0D\u652F\u6301\u7684\u5F85\u4E0A\u4F20\u5B57\u6BB5");
    }
    await import_prisma.default.importtaskitem.update({
      where: { id: input.itemId },
      data
    });
  })
);
var publishPendingImportItems = (0, import_action_utils.requireRole)([import_action_utils.UserRole.ADMIN])(
  (0, import_action_utils.withResult)(async (input) => {
    if (!input.itemIds.length) {
      throw new Error("\u8BF7\u81F3\u5C11\u9009\u62E9\u4E00\u6761\u5F85\u4E0A\u4F20\u5546\u54C1");
    }
    let success = 0;
    let fail = 0;
    for (const itemId of input.itemIds) {
      try {
        await import_prisma.default.$transaction(async (tx) => {
          const item = await tx.importtaskitem.findUnique({
            where: { id: itemId },
            include: { importTask: true }
          });
          if (!item) throw new Error("\u5F85\u4E0A\u4F20\u660E\u7EC6\u4E0D\u5B58\u5728");
          const recoveredPublishedData = buildPublishedImportItemRecoveryData(item);
          if (recoveredPublishedData) {
            await tx.importtaskitem.update({
              where: { id: item.id },
              data: recoveredPublishedData
            });
            throw new Error("\u8BE5\u5546\u54C1\u5DF2\u53D1\u5E03");
          }
          if (item.isPublished) throw new Error("\u8BE5\u5546\u54C1\u5DF2\u53D1\u5E03");
          if (item.fetchStatus !== "COMPLETED") throw new Error("\u4EC5\u53EF\u53D1\u5E03\u91C7\u96C6\u5B8C\u6210\u7684\u5546\u54C1");
          const productName = item.parsedName || "";
          const mainImageUrl = item.mainImageUrl || item.parsedMainImageUrl || "";
          const categoryId = item.targetCategoryId || item.importTask.defaultCategoryId || "";
          const cnyMin = toNumberOrNull(item.cnyPriceMin ?? item.parsedPriceMin);
          const cnyMax = toNumberOrNull(item.cnyPriceMax ?? item.parsedPriceMax);
          const price = cnyMin ?? cnyMax ?? toNumberOrNull(item.previewDataJson?.price);
          if (!productName.trim()) throw new Error("\u5546\u54C1\u540D\u79F0\u4E0D\u80FD\u4E3A\u7A7A");
          if (!mainImageUrl.trim()) throw new Error("\u4E3B\u56FE\u4E0D\u80FD\u4E3A\u7A7A");
          if (!categoryId) throw new Error("\u8BF7\u9009\u62E9\u76EE\u6807\u5206\u7C7B");
          if (price === null || price < 0) throw new Error("\u8BF7\u8865\u5145\u6709\u6548\u552E\u4EF7\u533A\u95F4");
          await tx.importtaskitem.update({
            where: { id: itemId },
            data: {
              publishStatus: "RUNNING",
              failureReason: null
            }
          });
          const newProduct = await createProductRecord(tx, {
            categoryId,
            name: productName,
            mainImageUrl,
            shortDescription: buildShortDescription(item.productDetail || "", [item.supplierName || "", item.sourceCategoryName || ""]),
            price,
            source: "IMPORT_1688",
            status: item.goodsStatus || item.importTask.defaultStatus || "DRAFT",
            stock: item.availableStock ?? 0,
            supplierName: item.supplierName || null,
            costPrice: toNumberOrNull(item.costPrice),
            weightGrams: toNumberOrNull(item.weightGrams),
            goodsStatus: item.goodsStatus || null,
            detailText: item.productDetail || null,
            priceCoefficient: toNumberOrNull(item.coefficient),
            minOrderQty: item.minimumOrderQuantity ?? null,
            skuSummaryText: item.skuSummaryText || null
          });
          await tx.importtaskitem.update({
            where: { id: item.id },
            data: {
              fetchStatus: "COMPLETED",
              publishStatus: "COMPLETED",
              isPublished: true,
              importedProductId: newProduct.id,
              publishedAt: /* @__PURE__ */ new Date(),
              failureReason: null
            }
          });
        });
        success += 1;
      } catch (error) {
        fail += 1;
        await import_prisma.default.importtaskitem.update({
          where: { id: itemId },
          data: {
            publishStatus: "FAILED",
            failureReason: error?.message || "\u53D1\u5E03\u5931\u8D25"
          }
        }).catch(() => void 0);
      }
    }
    return { success_count: success, fail_count: fail };
  })
);
var confirmImportProducts = (0, import_action_utils.requireRole)([import_action_utils.UserRole.ADMIN])(
  (0, import_action_utils.withResult)(async (input) => {
    const result = await publishPendingImportItems({ itemIds: input.itemIds });
    if (result.fail_count > 0) {
      throw new Error(`\u90E8\u5206\u5F85\u4E0A\u4F20\u5546\u54C1\u53D1\u5E03\u5931\u8D25\uFF0C\u6210\u529F ${result.success_count} \u6761\uFF0C\u5931\u8D25 ${result.fail_count} \u6761`);
    }
  })
);
var retryImportTask = (0, import_action_utils.requireRole)([import_action_utils.UserRole.ADMIN])(
  (0, import_action_utils.withResult)(async (input) => {
    const task = await import_prisma.default.importtask.findUnique({
      where: { id: input.taskId },
      include: { items: true }
    });
    if (!task) throw new Error("\u672A\u627E\u5230\u4EFB\u52A1\u8BB0\u5F55");
    if (!["FAILED", "COMPLETED", "PARTIAL_SUCCESS", "RATE_LIMITED"].includes(task.status)) {
      throw new Error("\u53EA\u6709\u5DF2\u5B8C\u6210\u3001\u5931\u8D25\u6216\u9650\u6D41\u7684\u4EFB\u52A1\u53EF\u91CD\u8BD5");
    }
    await import_prisma.default.$transaction(async (tx) => {
      await tx.importtask.update({
        where: { id: input.taskId },
        data: {
          status: "RETRY_PENDING",
          successCount: 0,
          failureCount: 0,
          progressPercent: 0,
          lastRateLimitedAt: null,
          startedAt: null,
          finishedAt: null
        }
      });
      await tx.importtaskitem.updateMany({
        where: { importTaskId: input.taskId },
        data: {
          parsedName: null,
          parsedMainImageUrl: null,
          parsedPriceMin: null,
          parsedPriceMax: null,
          supplierName: null,
          mainImageUrl: null,
          costPrice: null,
          weightGrams: null,
          sourceCategoryName: null,
          coefficient: null,
          productDetail: null,
          skuSummaryText: null,
          cnyPriceMin: null,
          cnyPriceMax: null,
          usdPriceMin: null,
          usdPriceMax: null,
          minimumOrderQuantity: null,
          availableStock: null,
          specSummaryJson: void 0,
          previewDataJson: void 0,
          fetchStatus: "PENDING",
          publishStatus: "PENDING",
          failureReason: null,
          importedProductId: null,
          isPublished: false,
          publishedAt: null,
          fetchStartedAt: null,
          fetchFinishedAt: null,
          isSelected: true
        }
      });
    });
  })
);
var deleteImportTask = (0, import_action_utils.requireRole)([import_action_utils.UserRole.ADMIN])(
  (0, import_action_utils.withResult)(async (input) => {
    const task = await import_prisma.default.importtask.findUnique({
      where: { id: input.taskId }
    });
    if (!task) throw new Error("\u672A\u627E\u5230\u4EFB\u52A1\u8BB0\u5F55");
    if (!["FAILED", "COMPLETED", "PARTIAL_SUCCESS", "RATE_LIMITED"].includes(task.status)) {
      throw new Error("\u4EC5\u5141\u8BB8\u5220\u9664\u5DF2\u5B8C\u6210\u3001\u90E8\u5206\u6210\u529F\u3001\u5931\u8D25\u6216\u9650\u6D41\u7684\u4EFB\u52A1\u8BB0\u5F55");
    }
    await import_prisma.default.$transaction(async (tx) => {
      await tx.importtaskitem.deleteMany({ where: { importTaskId: input.taskId } });
      await tx.importtask.delete({ where: { id: input.taskId } });
    });
  })
);

// src/backend/actions/ProductManagement.ts
var USD_EXCHANGE_RATE = 6.5;
function toNumber(value) {
  if (value === null || value === void 0) return null;
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  if (typeof value?.toNumber === "function") return value.toNumber();
  return null;
}
function roundCurrency(value) {
  return Number(value.toFixed(2));
}
function toUsdDisplayPrice(rmbPrice) {
  if (rmbPrice === null || rmbPrice === void 0 || !Number.isFinite(rmbPrice)) return null;
  return roundCurrency(rmbPrice / USD_EXCHANGE_RATE);
}
function normalizeGoodsStatus(goodsStatus) {
  if (!goodsStatus) return null;
  if (goodsStatus === "DELETED") return "DELETED";
  if (goodsStatus === "INACTIVE" || goodsStatus === "LOW_STOCK" || goodsStatus === "OUT_OF_STOCK") return "INACTIVE";
  return "ACTIVE";
}
function mapStatusFilterToProductStatus(statusFilter) {
  if (!statusFilter || statusFilter === "ALL") return ["ACTIVE", "INACTIVE"];
  if (statusFilter === "DELETED") return ["DRAFT"];
  return [statusFilter];
}
function mapProductStatusToGoodsStatus(status) {
  if (status === "ACTIVE") return "ACTIVE";
  if (status === "INACTIVE") return "INACTIVE";
  return "DELETED";
}
function buildDetailContent(detailText, detailContent) {
  const content = (detailContent || []).filter((item) => item && item.content && item.content.trim() !== "");
  if (content.length > 0) return content;
  if (detailText && detailText.trim() !== "") {
    return [{ type: "text", content: detailText.trim(), title: "\u5546\u54C1\u8BE6\u60C5" }];
  }
  return [];
}
function buildGallery(mainImageUrl, gallery) {
  const sanitized = (gallery || []).filter((item) => item?.url?.trim()).map((item, index) => ({ url: item.url.trim(), sort: item.sort || index + 1 }));
  if (mainImageUrl?.trim() && !sanitized.some((item) => item.url === mainImageUrl.trim())) {
    sanitized.unshift({ url: mainImageUrl.trim(), sort: 1 });
  }
  return sanitized.map((item, index) => ({ ...item, sort: index + 1 }));
}
function generateUniqueCode(prefix) {
  return prefix + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substring(2, 6).toUpperCase();
}
function getStockStatus(stock) {
  if (stock <= 0) return "OUT_OF_STOCK";
  return "IN_STOCK";
}
function resolveEffectiveCoefficient(productCoefficient, categoryCoefficient) {
  if (categoryCoefficient !== null && categoryCoefficient !== void 0 && categoryCoefficient > 0) {
    return categoryCoefficient;
  }
  if (productCoefficient !== null && productCoefficient !== void 0 && productCoefficient > 0) {
    return productCoefficient;
  }
  return null;
}
async function findPublishedImportProductByName(name) {
  const normalizedName = String(name || "").trim();
  if (!normalizedName) return null;
  const matchedItem = await import_prisma2.default.importtaskitem.findFirst({
    where: {
      isPublished: true,
      publishStatus: "COMPLETED",
      importedProductId: { not: null },
      OR: [
        { parsedName: normalizedName },
        { parsedName: normalizedName }
      ]
    },
    orderBy: { updatedAt: "desc" },
    select: { importedProductId: true }
  });
  if (!matchedItem?.importedProductId) {
    return null;
  }
  return import_prisma2.default.product.findFirst({
    where: {
      id: matchedItem.importedProductId,
      source: "IMPORT_1688"
    },
    include: {
      category: { select: { id: true, name: true, parentId: true, level: true, priceCoefficient: true } },
      skus: { select: { price: true, originalPrice: true, stock: true } }
    }
  });
}
async function mapProductToListItem(product) {
  const { categoryMap, resolveMainCategory } = await getCategoryMetaMap(import_prisma2.default, [product.categoryId]);
  const prices = product.skus.map((s) => toNumber(s.price) ?? 0);
  const priceMin = prices.length > 0 ? Math.min(...prices) : 0;
  const priceMax = prices.length > 0 ? Math.max(...prices) : 0;
  const totalStock = product.skus.reduce((sum, s) => sum + s.stock, 0);
  const currentCategory = categoryMap.get(product.categoryId) || product.category;
  const mainCategory = currentCategory?.level === 1 ? currentCategory : resolveMainCategory(product.categoryId);
  const mainCategoryCoefficient = toNumber(mainCategory?.priceCoefficient);
  const effectiveCoefficient = resolveEffectiveCoefficient(toNumber(product.priceCoefficient), mainCategoryCoefficient);
  const mappedGoodsStatus = product.status === "DRAFT" ? "DELETED" : normalizeGoodsStatus(product.goodsStatus) || mapProductStatusToGoodsStatus(product.status);
  return {
    product_id: product.id,
    product_name: product.name,
    sku_code_base: product.productCode,
    source: product.source,
    supplier_name: product.supplierName || null,
    brand_keyword: product.brandName || null,
    category_id: product.categoryId,
    category_name: currentCategory?.name || product.category?.name || "--",
    category_level: currentCategory?.level ?? null,
    parent_category_id: currentCategory?.parentId || null,
    parent_category_name: currentCategory?.parentId ? categoryMap.get(currentCategory.parentId)?.name || null : null,
    main_category_id: mainCategory?.id || product.categoryId,
    main_category_name: mainCategory?.name || currentCategory?.name || product.category?.name || "--",
    main_category_price_coefficient: mainCategoryCoefficient,
    goods_status: mappedGoodsStatus,
    weight_gram: toNumber(product.weightGram),
    cost_price: toNumber(product.costPrice),
    price_coefficient: toNumber(product.priceCoefficient),
    effective_price_coefficient: effectiveCoefficient,
    min_order_qty: Number(product.tradeInfoJson?.minOrderQty ?? 0) || null,
    price_min: priceMin,
    price_max: priceMax,
    usd_display_price_min: toUsdDisplayPrice(priceMin) ?? 0,
    usd_display_price_max: toUsdDisplayPrice(priceMax) ?? 0,
    total_stock: totalStock,
    status: product.status,
    created_at: product.createdAt.toISOString(),
    updated_at: product.updatedAt.toISOString()
  };
}
function calculateSkuRmbPrice(costPrice, coefficient) {
  return roundCurrency(costPrice * coefficient);
}
var HOME_FEATURED_KEYWORDS_SETTING_TYPE = "HOME_FEATURED_KEYWORDS";
async function buildProductBindingMeta() {
  const [categories, keywords] = await Promise.all([
    import_prisma2.default.category.findMany({
      where: { status: "ACTIVE" },
      orderBy: [{ level: "asc" }, { sortWeight: "desc" }, { name: "asc" }],
      select: { id: true, name: true, parentId: true, level: true }
    }),
    import_prisma2.default.keyworditem.findMany({
      where: { isActive: true },
      orderBy: [{ sortWeight: "desc" }, { keyword: "asc" }],
      select: { id: true, keyword: true, group: { select: { name: true } } }
    })
  ]);
  return {
    category_options: categories.map((category) => ({
      value: category.id,
      label: `${category.level === 2 ? "\u2014 " : ""}${category.name}`
    })),
    keyword_options: keywords.map((keyword) => ({
      value: keyword.id,
      label: keyword.group?.name ? `${keyword.group.name} / ${keyword.keyword}` : keyword.keyword
    }))
  };
}
async function replaceProductCategoryRelations(tx, productId, linkedCategoryIds) {
  const normalizedCategoryIds = Array.from(new Set(linkedCategoryIds.filter(Boolean)));
  await tx.product_category_relations.deleteMany({ where: { productId } });
  if (normalizedCategoryIds.length > 0) {
    await tx.product_category_relations.createMany({
      data: normalizedCategoryIds.map((categoryId) => ({ productId, categoryId })),
      skipDuplicates: true
    });
  }
}
async function replaceProductKeywordRelations(tx, productId, linkedKeywordIds) {
  const normalizedKeywordIds = Array.from(new Set(linkedKeywordIds.filter(Boolean)));
  await tx.product_keyword_relations.deleteMany({ where: { productId } });
  if (normalizedKeywordIds.length > 0) {
    await tx.product_keyword_relations.createMany({
      data: normalizedKeywordIds.map((keywordId) => ({ productId, keywordId })),
      skipDuplicates: true
    });
  }
}
function buildRelationRows(productIds, relationIds) {
  const normalizedProductIds = Array.from(new Set(productIds.filter(Boolean)));
  const normalizedRelationIds = Array.from(new Set(relationIds.filter(Boolean)));
  return normalizedProductIds.flatMap((productId) => normalizedRelationIds.map((relationId) => ({ productId, relationId })));
}
function normalizeFeaturedKeywords(contentJson) {
  const rawKeywords = contentJson?.keywords;
  if (!Array.isArray(rawKeywords)) return [];
  return Array.from(
    new Set(
      rawKeywords.map((item) => typeof item === "string" ? item.trim() : "").filter(Boolean)
    )
  );
}
async function getCategoryMetaMap(tx, categoryIds) {
  const uniqueIds = Array.from(new Set(categoryIds.filter(Boolean)));
  const categories = await tx.category.findMany({
    where: { id: { in: uniqueIds } },
    select: { id: true, name: true, parentId: true, level: true, priceCoefficient: true }
  });
  const categoryMap = new Map(categories.map((item) => [item.id, item]));
  const missingParentIds = Array.from(new Set(categories.map((item) => item.parentId).filter((id) => !!id && !categoryMap.has(id))));
  if (missingParentIds.length > 0) {
    const parents = await tx.category.findMany({
      where: { id: { in: missingParentIds } },
      select: { id: true, name: true, parentId: true, level: true, priceCoefficient: true }
    });
    parents.forEach((item) => categoryMap.set(item.id, item));
  }
  const resolveMainCategory = (categoryId) => {
    let current = categoryId ? categoryMap.get(categoryId) || null : null;
    let guard = 0;
    while (current?.parentId && guard < 10) {
      const parent = categoryMap.get(current.parentId);
      if (!parent) break;
      current = parent;
      guard += 1;
    }
    return current || null;
  };
  return { categoryMap, resolveMainCategory };
}
async function syncCartItemsValidState(tx, productId) {
  const items = await tx.cartitem.findMany({
    where: { productId },
    include: {
      product: { select: { status: true, category: { select: { status: true } } } },
      productSku: { select: { stock: true } }
    }
  });
  for (const item of items) {
    const isValid = item.product.status === "ACTIVE" && item.product.category.status === "ACTIVE" && item.productSku.stock >= item.quantity;
    const targetStatus = isValid ? "VALID" : "INVALID";
    if (item.status !== targetStatus) {
      await tx.cartitem.update({ where: { id: item.id }, data: { status: targetStatus } });
    }
  }
}
async function recalculateProductSkuPrices(tx, productId, coefficient) {
  const product = await tx.product.findUnique({
    where: { id: productId },
    include: { skus: true }
  });
  if (!product) throw new Error("\u5546\u54C1\u4E0D\u5B58\u5728");
  const costPrice = toNumber(product.costPrice);
  if (costPrice === null || costPrice < 0) {
    throw new Error("\u5546\u54C1\u7F3A\u5C11\u6709\u6548\u6210\u672C\u4EF7\uFF0C\u65E0\u6CD5\u91CD\u7B97\u552E\u4EF7");
  }
  const nextPrice = calculateSkuRmbPrice(costPrice, coefficient);
  const nextOriginalPrice = roundCurrency(nextPrice * 1.1);
  for (const sku of product.skus) {
    await tx.productsku.update({
      where: { id: sku.id },
      data: {
        price: nextPrice,
        originalPrice: nextOriginalPrice
      }
    });
  }
  return { nextPrice, nextOriginalPrice };
}
async function applyProductCoefficient(tx, productId, coefficient) {
  await tx.product.update({
    where: { id: productId },
    data: { priceCoefficient: coefficient }
  });
  await recalculateProductSkuPrices(tx, productId, coefficient);
}
async function applyCategoryCoefficient(tx, productId) {
  const product = await tx.product.findUnique({
    where: { id: productId },
    include: {
      category: { select: { id: true, name: true, parentId: true, level: true, priceCoefficient: true } }
    }
  });
  if (!product) throw new Error("\u5546\u54C1\u4E0D\u5B58\u5728");
  const { categoryMap, resolveMainCategory } = await getCategoryMetaMap(tx, [product.categoryId]);
  const currentCategory = categoryMap.get(product.categoryId) || product.category;
  const mainCategory = currentCategory?.level === 1 ? currentCategory : resolveMainCategory(product.categoryId);
  const categoryCoefficient = toNumber(mainCategory?.priceCoefficient);
  if (categoryCoefficient === null || categoryCoefficient <= 0) {
    throw new Error("\u6240\u5C5E\u4E3B\u7C7B\u76EE\u7F3A\u5C11\u6709\u6548\u552E\u4EF7\u7CFB\u6570");
  }
  await recalculateProductSkuPrices(tx, productId, categoryCoefficient);
}
function validateActivePreconditions(product) {
  if (!product.name || product.name.trim() === "") throw new Error("\u5546\u54C1\u540D\u79F0\u4E0D\u80FD\u4E3A\u7A7A");
  if (!product.category_id) throw new Error("\u5546\u54C1\u5206\u7C7B\u4E0D\u80FD\u4E3A\u7A7A");
  if (!product.goods_status) throw new Error("\u8D27\u7269\u72B6\u6001\u4E0D\u80FD\u4E3A\u7A7A");
  if (product.weight_gram === null || product.weight_gram === void 0 || product.weight_gram <= 0) throw new Error("\u5546\u54C1\u91CD\u91CF\u5FC5\u987B\u5927\u4E8E0");
  if (product.cost_price === null || product.cost_price === void 0 || product.cost_price < 0) throw new Error("\u6210\u672C\u4EF7\u4E0D\u80FD\u4E3A\u7A7A");
  if (product.price_coefficient === null || product.price_coefficient === void 0 || product.price_coefficient <= 0) throw new Error("\u4EF7\u683C\u7CFB\u6570\u5FC5\u987B\u5927\u4E8E0");
  if (!product.main_image_url && (!product.gallery_json || product.gallery_json.length === 0)) throw new Error("\u81F3\u5C11\u5B58\u57281\u4E2A\u6709\u6548\u56FE\u7247URL\u65B9\u53EF\u4E0A\u67B6");
  if (!product.skus || product.skus.length === 0) throw new Error("\u5546\u54C1\u81F3\u5C11\u5B58\u57281\u4E2ASKU\u624D\u80FD\u4E0A\u67B6");
  const hasInvalidSku = product.skus.some((sku) => sku.price <= 0 || sku.stock < 0);
  if (hasInvalidSku) throw new Error("\u6BCF\u4E2A\u53EF\u552ESKU\u5FC5\u987B\u6709\u6709\u6548\u4EF7\u683C\u4E14\u5E93\u5B58\u4E0D\u80FD\u4E3A\u8D1F\u6570");
  if (!product.short_description && !product.detail_text && (!product.detail_content_json || product.detail_content_json.length === 0)) {
    throw new Error("\u5546\u54C1\u5FC5\u987B\u5305\u542B\u57FA\u7840\u63CF\u8FF0\u5185\u5BB9");
  }
}
function buildDraftSku(row) {
  const costPrice = row.cost_price ?? 0;
  const coefficient = row.price_coefficient && row.price_coefficient > 0 ? row.price_coefficient : 1;
  const price = calculateSkuRmbPrice(costPrice, coefficient);
  const originalPrice = roundCurrency(price * 1.1);
  return {
    sku_code: generateUniqueCode("SKU"),
    image_url: row.main_image_url || "",
    price,
    original_price: originalPrice,
    stock: 1,
    attribute_json: [],
    weight_kg: row.weight_gram ? Number((row.weight_gram / 1e3).toFixed(3)) : null,
    usd_display_price: toUsdDisplayPrice(price),
    usd_display_original_price: toUsdDisplayPrice(originalPrice)
  };
}
var getProductBindingMeta = (0, import_action_utils2.requireRole)([import_action_utils2.UserRole.ADMIN])(
  (0, import_action_utils2.withResult)(async () => {
    return buildProductBindingMeta();
  })
);
var getCategoryOptions2 = (0, import_action_utils2.requireRole)([import_action_utils2.UserRole.ADMIN])(
  (0, import_action_utils2.withResult)(async () => {
    const categories = await import_prisma2.default.category.findMany({
      orderBy: [{ level: "asc" }, { sortWeight: "desc" }, { name: "asc" }],
      select: { id: true, name: true, parentId: true, level: true, priceCoefficient: true }
    });
    return categories.map((c) => ({
      category_id: c.id,
      category_name: c.name,
      parent_id: c.parentId,
      level: c.level,
      price_coefficient: toNumber(c.priceCoefficient)
    }));
  })
);
var getProductList = (0, import_action_utils2.requireRole)([import_action_utils2.UserRole.ADMIN])(
  (0, import_action_utils2.withResult)(async (input) => {
    const { keyword, category_id, status, goods_status, status_filter, supplier_name, brand_keyword, page = 1, page_size = 20 } = input;
    const whereClause = {};
    if (keyword) {
      const normalizedKeyword = keyword.trim();
      whereClause.OR = [
        { name: { contains: normalizedKeyword } },
        { productCode: { contains: normalizedKeyword } }
      ];
    }
    if (category_id) {
      whereClause.categoryId = category_id;
    }
    const normalizedStatusList = status ? Array.isArray(status) ? status : [status] : mapStatusFilterToProductStatus(status_filter);
    if (normalizedStatusList && normalizedStatusList.length > 0) {
      whereClause.status = { in: normalizedStatusList.map((s) => s.toUpperCase()) };
    }
    if (goods_status && goods_status !== "DELETED") {
      whereClause.goodsStatus = goods_status;
    }
    if (supplier_name?.trim()) {
      whereClause.supplierName = { contains: supplier_name.trim() };
    }
    if (brand_keyword?.trim()) {
      whereClause.brandName = { contains: brand_keyword.trim() };
    }
    const shouldIncludeDraftResultsForNameSearch = Boolean(keyword?.trim());
    if (!shouldIncludeDraftResultsForNameSearch && normalizedStatusList && normalizedStatusList.length > 0) {
      whereClause.status = { in: normalizedStatusList.map((s) => s.toUpperCase()) };
    }
    const skip = (page - 1) * page_size;
    const [products, publishedImportMatchRecord] = await Promise.all([
      import_prisma2.default.product.findMany({
        where: whereClause,
        skip,
        take: page_size,
        orderBy: { createdAt: "desc" },
        include: {
          category: { select: { id: true, name: true, parentId: true, level: true, priceCoefficient: true } },
          skus: { select: { price: true, originalPrice: true, stock: true } }
        }
      }),
      findPublishedImportProductByName(keyword)
    ]);
    const { categoryMap, resolveMainCategory } = await getCategoryMetaMap(import_prisma2.default, products.map((p) => p.categoryId));
    const list = products.map((p) => {
      const prices = p.skus.map((s) => toNumber(s.price) ?? 0);
      const priceMin = prices.length > 0 ? Math.min(...prices) : 0;
      const priceMax = prices.length > 0 ? Math.max(...prices) : 0;
      const totalStock = p.skus.reduce((sum, s) => sum + s.stock, 0);
      const currentCategory = categoryMap.get(p.categoryId) || p.category;
      const mainCategory = currentCategory?.level === 1 ? currentCategory : resolveMainCategory(p.categoryId);
      const mainCategoryCoefficient = toNumber(mainCategory?.priceCoefficient);
      const effectiveCoefficient = resolveEffectiveCoefficient(toNumber(p.priceCoefficient), mainCategoryCoefficient);
      const mappedGoodsStatus = p.status === "DRAFT" ? "DELETED" : normalizeGoodsStatus(p.goodsStatus) || mapProductStatusToGoodsStatus(p.status);
      return {
        product_id: p.id,
        product_name: p.name,
        sku_code_base: p.productCode,
        source: p.source,
        supplier_name: p.supplierName || null,
        brand_keyword: p.brandName || null,
        category_id: p.categoryId,
        category_name: currentCategory?.name || p.category?.name || "--",
        category_level: currentCategory?.level ?? null,
        parent_category_id: currentCategory?.parentId || null,
        parent_category_name: currentCategory?.parentId ? categoryMap.get(currentCategory.parentId)?.name || null : null,
        main_category_id: mainCategory?.id || p.categoryId,
        main_category_name: mainCategory?.name || currentCategory?.name || p.category?.name || "--",
        main_category_price_coefficient: mainCategoryCoefficient,
        goods_status: mappedGoodsStatus,
        weight_gram: toNumber(p.weightGram),
        cost_price: toNumber(p.costPrice),
        price_coefficient: toNumber(p.priceCoefficient),
        effective_price_coefficient: effectiveCoefficient,
        min_order_qty: Number(p.tradeInfoJson?.minOrderQty ?? 0) || null,
        price_min: priceMin,
        price_max: priceMax,
        usd_display_price_min: toUsdDisplayPrice(priceMin) ?? 0,
        usd_display_price_max: toUsdDisplayPrice(priceMax) ?? 0,
        total_stock: totalStock,
        status: p.status,
        created_at: p.createdAt.toISOString(),
        updated_at: p.updatedAt.toISOString()
      };
    }).filter((item) => {
      if (!normalizedStatusList || normalizedStatusList.length === 0) {
        return true;
      }
      return normalizedStatusList.includes(item.status);
    });
    const published_import_match = publishedImportMatchRecord ? await mapProductToListItem(publishedImportMatchRecord) : null;
    return { list, total: list.length, published_import_match };
  })
);
var getProductDetail = (0, import_action_utils2.requireRole)([import_action_utils2.UserRole.ADMIN])(
  (0, import_action_utils2.withResult)(async (product_id) => {
    const p = await import_prisma2.default.product.findUnique({
      where: { id: product_id },
      include: {
        category: { select: { id: true, name: true, parentId: true, level: true, priceCoefficient: true } },
        skus: true,
        relationCategories: { select: { categoryId: true } },
        relationKeywords: { select: { keywordId: true } }
      }
    });
    if (!p) throw new Error("\u5546\u54C1\u4E0D\u5B58\u5728");
    const { categoryMap, resolveMainCategory } = await getCategoryMetaMap(import_prisma2.default, [p.categoryId]);
    const currentCategory = categoryMap.get(p.categoryId) || p.category;
    const mainCategory = currentCategory?.level === 1 ? currentCategory : resolveMainCategory(p.categoryId);
    const mainCategoryCoefficient = toNumber(mainCategory?.priceCoefficient);
    return {
      product_id: p.id,
      category_id: p.categoryId,
      category_name: currentCategory?.name || p.category?.name || "--",
      main_category_id: mainCategory?.id || p.categoryId,
      main_category_name: mainCategory?.name || currentCategory?.name || p.category?.name || "--",
      main_category_price_coefficient: mainCategoryCoefficient,
      effective_price_coefficient: resolveEffectiveCoefficient(toNumber(p.priceCoefficient), mainCategoryCoefficient),
      linked_category_ids: Array.from(p.relationCategories ?? [], (item) => item.categoryId),
      linked_keyword_ids: Array.from(p.relationKeywords ?? [], (item) => item.keywordId),
      name: p.name,
      product_code: p.productCode,
      source: p.source,
      supplier_name: p.supplierName || null,
      brand_keyword: p.brandName || null,
      status: p.status,
      goods_status: normalizeGoodsStatus(p.goodsStatus),
      weight_gram: toNumber(p.weightGram),
      cost_price: toNumber(p.costPrice),
      price_coefficient: toNumber(p.priceCoefficient),
      detail_text: p.detailText,
      main_image_url: p.mainImageUrl,
      gallery_json: p.galleryJson || [],
      short_description: p.shortDescription,
      selling_points_json: p.sellingPointsJson,
      detail_content_json: p.detailContentJson || buildDetailContent(p.detailText || void 0, null),
      parameter_json: p.parameterJson,
      trade_info_json: p.tradeInfoJson,
      faq_json: p.faqJson,
      skus: p.skus.map((s) => ({
        sku_id: s.id,
        sku_code: s.skuCode,
        image_url: s.imageUrl,
        price: toNumber(s.price) ?? 0,
        original_price: toNumber(s.originalPrice),
        stock: s.stock,
        attribute_json: s.attributeJson || [],
        delivery_days: s.deliveryDays,
        weight_kg: toNumber(s.weightKg),
        volume_m3: toNumber(s.volumeM3),
        usd_display_price: toUsdDisplayPrice(toNumber(s.price)),
        usd_display_original_price: toUsdDisplayPrice(toNumber(s.originalPrice))
      }))
    };
  })
);
var createProduct = (0, import_action_utils2.requireRole)([import_action_utils2.UserRole.ADMIN])(
  (0, import_action_utils2.withResult)(async (input) => {
    if (input.submit_action === "ACTIVE") {
      validateActivePreconditions(input);
    }
    const targetStatus = input.submit_action;
    const baseCode = generateUniqueCode("P");
    const result = await import_prisma2.default.$transaction(async (tx) => {
      const category = await tx.category.findUnique({
        where: { id: input.category_id },
        select: { priceCoefficient: true }
      });
      const effectiveCoefficient = resolveEffectiveCoefficient(input.price_coefficient ?? null, toNumber(category?.priceCoefficient)) ?? input.price_coefficient ?? 1;
      const normalizedCostPrice = input.cost_price ?? 0;
      const product = await tx.product.create({
        data: {
          name: input.name,
          slug: baseCode,
          productCode: baseCode,
          source: "MANUAL",
          supplierName: input.supplier_name?.trim() || null,
          brandName: input.brand_keyword?.trim() || null,
          status: targetStatus,
          goodsStatus: normalizeGoodsStatus(input.goods_status),
          weightGram: input.weight_gram ?? null,
          costPrice: input.cost_price ?? null,
          priceCoefficient: input.price_coefficient ?? null,
          detailText: input.detail_text || null,
          mainImageUrl: input.main_image_url || "",
          galleryJson: buildGallery(input.main_image_url || "", input.gallery_json),
          shortDescription: input.short_description || null,
          detailContentJson: buildDetailContent(input.detail_text, input.detail_content_json),
          parameterJson: input.parameter_json || null,
          category: { connect: { id: input.category_id } },
          skus: {
            create: input.skus.map((s) => {
              const nextPrice = normalizedCostPrice > 0 ? calculateSkuRmbPrice(normalizedCostPrice, effectiveCoefficient) : s.price;
              const nextOriginalPrice = normalizedCostPrice > 0 ? roundCurrency(nextPrice * 1.1) : s.original_price || null;
              return {
                skuCode: s.sku_code || generateUniqueCode("SKU"),
                imageUrl: s.image_url || null,
                price: nextPrice,
                originalPrice: nextOriginalPrice,
                stock: s.stock,
                stockStatus: getStockStatus(s.stock),
                attributeJson: s.attribute_json || [],
                deliveryDays: s.delivery_days || null,
                weightKg: s.weight_kg || null,
                volumeM3: s.volume_m3 || null
              };
            })
          }
        }
      });
      await replaceProductCategoryRelations(tx, product.id, input.linked_category_ids || []);
      await replaceProductKeywordRelations(tx, product.id, input.linked_keyword_ids || []);
      return product;
    });
    return { product_id: result.id };
  })
);
var batchImportProducts = (0, import_action_utils2.requireRole)([import_action_utils2.UserRole.ADMIN])(
  (0, import_action_utils2.withResult)(async (input) => {
    let success = 0;
    let fail = 0;
    for (const row of input.rows) {
      try {
        const detailContent = buildDetailContent(row.detail_text, row.gallery_urls?.slice(1).map((url) => ({ type: "image", content: url })) || []);
        const gallery = buildGallery(row.main_image_url || row.gallery_urls?.[0] || "", [
          ...row.main_image_url ? [{ url: row.main_image_url, sort: 1 }] : [],
          ...(row.gallery_urls || []).map((url, index) => ({ url, sort: index + 1 }))
        ]);
        await createProduct({
          category_id: input.category_id,
          name: row.name,
          supplier_name: row.supplier_name?.trim() || null,
          brand_keyword: row.brand_keyword?.trim() || null,
          goods_status: "ACTIVE",
          weight_gram: row.weight_gram ?? null,
          cost_price: row.cost_price ?? null,
          price_coefficient: row.price_coefficient ?? 1,
          detail_text: row.detail_text || "",
          main_image_url: row.main_image_url || gallery[0]?.url || "",
          short_description: row.detail_text || "",
          gallery_json: gallery,
          detail_content_json: detailContent,
          skus: [buildDraftSku(row)],
          submit_action: "DRAFT"
        });
        success++;
      } catch (error) {
        fail++;
      }
    }
    return { success_count: success, fail_count: fail };
  })
);
var updateProduct = (0, import_action_utils2.requireRole)([import_action_utils2.UserRole.ADMIN])(
  (0, import_action_utils2.withResult)(async (input) => {
    if (input.submit_action === "ACTIVE") {
      validateActivePreconditions(input);
    }
    await import_prisma2.default.$transaction(async (tx) => {
      const category = await tx.category.findUnique({
        where: { id: input.category_id },
        select: { priceCoefficient: true }
      });
      const effectiveCoefficient = resolveEffectiveCoefficient(input.price_coefficient ?? null, toNumber(category?.priceCoefficient)) ?? input.price_coefficient ?? 1;
      const normalizedCostPrice = input.cost_price ?? 0;
      await tx.product.update({
        where: { id: input.product_id },
        data: {
          name: input.name,
          supplierName: input.supplier_name?.trim() || null,
          brandName: input.brand_keyword?.trim() || null,
          status: input.submit_action,
          goodsStatus: input.submit_action === "DRAFT" ? "DELETED" : normalizeGoodsStatus(input.goods_status),
          weightGram: input.weight_gram ?? null,
          costPrice: input.cost_price ?? null,
          priceCoefficient: input.price_coefficient ?? null,
          detailText: input.detail_text || null,
          detailContentJson: buildDetailContent(input.detail_text, input.detail_content_json),
          parameterJson: input.parameter_json || null,
          tradeInfoJson: input.trade_info_json || null,
          faqJson: input.faq_json || null,
          category: { connect: { id: input.category_id } }
        }
      });
      await replaceProductCategoryRelations(tx, input.product_id, input.linked_category_ids || []);
      await replaceProductKeywordRelations(tx, input.product_id, input.linked_keyword_ids || []);
      const existingSkus = await tx.productsku.findMany({ where: { productId: input.product_id }, select: { id: true } });
      const existingSkuIds = existingSkus.map((s) => s.id);
      const incomingSkuIds = input.skus.filter((s) => s.sku_id).map((s) => s.sku_id);
      const skusToDelete = existingSkuIds.filter((id) => !incomingSkuIds.includes(id));
      if (skusToDelete.length > 0) {
        await tx.cartitem.deleteMany({ where: { productSkuId: { in: skusToDelete } } });
        await tx.productsku.deleteMany({ where: { id: { in: skusToDelete } } });
      }
      for (const sku of input.skus) {
        const nextPrice = normalizedCostPrice > 0 ? calculateSkuRmbPrice(normalizedCostPrice, effectiveCoefficient) : sku.price;
        const nextOriginalPrice = normalizedCostPrice > 0 ? roundCurrency(nextPrice * 1.1) : sku.original_price || null;
        const skuData = {
          skuCode: sku.sku_code || generateUniqueCode("SKU"),
          imageUrl: sku.image_url || null,
          price: nextPrice,
          originalPrice: nextOriginalPrice,
          stock: sku.stock,
          stockStatus: getStockStatus(sku.stock),
          attributeJson: sku.attribute_json || [],
          deliveryDays: sku.delivery_days || null,
          weightKg: sku.weight_kg || null,
          volumeM3: sku.volume_m3 || null
        };
        if (sku.sku_id && existingSkuIds.includes(sku.sku_id)) {
          await tx.productsku.update({ where: { id: sku.sku_id }, data: skuData });
        } else {
          await tx.productsku.create({
            data: {
              ...skuData,
              product: { connect: { id: input.product_id } }
            }
          });
        }
      }
      await syncCartItemsValidState(tx, input.product_id);
    });
    return { success: true };
  })
);
var updateProductStatus = (0, import_action_utils2.requireRole)([import_action_utils2.UserRole.ADMIN])(
  (0, import_action_utils2.withResult)(async (input) => {
    const { product_id, target_status } = input;
    await import_prisma2.default.$transaction(async (tx) => {
      const product = await tx.product.findUnique({
        where: { id: product_id },
        include: { skus: true }
      });
      if (!product) throw new Error("\u5546\u54C1\u4E0D\u5B58\u5728");
      if (target_status === "ACTIVE") {
        validateActivePreconditions({
          category_id: product.categoryId,
          name: product.name,
          goods_status: normalizeGoodsStatus(product.goodsStatus) || void 0,
          weight_gram: toNumber(product.weightGram) ?? null,
          cost_price: toNumber(product.costPrice) ?? null,
          price_coefficient: toNumber(product.priceCoefficient) ?? null,
          detail_text: product.detailText || void 0,
          main_image_url: product.mainImageUrl,
          gallery_json: product.galleryJson,
          short_description: product.shortDescription || void 0,
          detail_content_json: product.detailContentJson,
          skus: product.skus.map((s) => ({
            sku_code: s.skuCode,
            price: toNumber(s.price) ?? 0,
            stock: s.stock,
            attribute_json: []
          }))
        });
      } else if (target_status === "DRAFT") {
        if (product.status === "ACTIVE" || product.status === "INACTIVE") {
          throw new Error("\u4E0D\u80FD\u5C06\u5DF2\u4E0A\u67B6\u6216\u5DF2\u4E0B\u67B6\u7684\u5546\u54C1\u8F6C\u4E3A\u8349\u7A3F");
        }
      }
      await tx.product.update({
        where: { id: product_id },
        data: {
          status: target_status,
          goodsStatus: target_status === "DRAFT" ? "DELETED" : mapProductStatusToGoodsStatus(target_status)
        }
      });
      await syncCartItemsValidState(tx, product_id);
    });
    return { success: true };
  })
);
var batchUpdateProductStatus = (0, import_action_utils2.requireRole)([import_action_utils2.UserRole.ADMIN])(
  (0, import_action_utils2.withResult)(async (product_ids, target_status) => {
    let success = 0;
    let fail = 0;
    for (const pid of product_ids) {
      try {
        await updateProductStatus({ product_id: pid, target_status });
        success++;
      } catch (err) {
        fail++;
      }
    }
    return { success_count: success, fail_count: fail };
  })
);
var batchUpdatePriceCoefficient = (0, import_action_utils2.requireRole)([import_action_utils2.UserRole.ADMIN])(
  (0, import_action_utils2.withResult)(async (input) => {
    if (!Array.isArray(input.product_ids) || input.product_ids.length === 0) {
      throw new Error("\u8BF7\u5148\u9009\u62E9\u5546\u54C1");
    }
    if (input.adjust_mode === "PRODUCT_COEFFICIENT") {
      const nextCoefficient = Number(input.price_coefficient);
      if (!Number.isFinite(nextCoefficient) || nextCoefficient <= 0) {
        throw new Error("\u4EF7\u683C\u7CFB\u6570\u5FC5\u987B\u5927\u4E8E0");
      }
    }
    let success = 0;
    let fail = 0;
    for (const pid of input.product_ids) {
      try {
        await import_prisma2.default.$transaction(async (tx) => {
          if (input.adjust_mode === "PRODUCT_COEFFICIENT") {
            await applyProductCoefficient(tx, pid, Number(input.price_coefficient));
          } else {
            await applyCategoryCoefficient(tx, pid);
          }
          await syncCartItemsValidState(tx, pid);
        });
        success++;
      } catch (err) {
        fail++;
      }
    }
    return { success_count: success, fail_count: fail };
  })
);
var inlineUpdateProductField = (0, import_action_utils2.requireRole)([import_action_utils2.UserRole.ADMIN])(
  (0, import_action_utils2.withResult)(async (input) => {
    const product = await import_prisma2.default.product.findUnique({ where: { id: input.product_id } });
    if (!product) throw new Error("\u5546\u54C1\u4E0D\u5B58\u5728");
    if (input.field === "product_name") {
      const nextName = String(input.value || "").trim();
      if (!nextName) throw new Error("\u5546\u54C1\u540D\u79F0\u4E0D\u80FD\u4E3A\u7A7A");
      await import_prisma2.default.product.update({ where: { id: input.product_id }, data: { name: nextName } });
      return { success: true };
    }
    if (input.field === "weight_gram") {
      const nextWeight = Number(input.value);
      if (!Number.isFinite(nextWeight) || nextWeight <= 0) {
        throw new Error("\u91CD\u91CF\u5FC5\u987B\u5927\u4E8E0");
      }
      await import_prisma2.default.$transaction(async (tx) => {
        await tx.product.update({ where: { id: input.product_id }, data: { weightGram: nextWeight } });
        await tx.productsku.updateMany({ where: { productId: input.product_id }, data: { weightKg: Number((nextWeight / 1e3).toFixed(3)) } });
      });
      return { success: true };
    }
    throw new Error("\u6682\u4E0D\u652F\u6301\u7684\u884C\u5185\u7F16\u8F91\u5B57\u6BB5");
  })
);
var batchUpdateProductCategory = (0, import_action_utils2.requireRole)([import_action_utils2.UserRole.ADMIN])(
  (0, import_action_utils2.withResult)(async (input) => {
    if (!input.product_ids.length) throw new Error("\u8BF7\u5148\u9009\u62E9\u5546\u54C1");
    if (!input.category_id) throw new Error("\u8BF7\u9009\u62E9\u76EE\u6807\u5206\u7C7B");
    let success = 0;
    let fail = 0;
    for (const productId of input.product_ids) {
      try {
        await import_prisma2.default.$transaction(async (tx) => {
          await tx.product.update({
            where: { id: productId },
            data: { categoryId: input.category_id }
          });
          await syncCartItemsValidState(tx, productId);
        });
        success++;
      } catch (error) {
        fail++;
      }
    }
    return { success_count: success, fail_count: fail };
  })
);
var batchBindProductCategories = (0, import_action_utils2.requireRole)([import_action_utils2.UserRole.ADMIN])(
  (0, import_action_utils2.withResult)(async (input) => {
    if (!input.product_ids.length) throw new Error("\u8BF7\u5148\u9009\u62E9\u5546\u54C1");
    if (!input.linked_category_ids.length) throw new Error("\u8BF7\u81F3\u5C11\u9009\u62E9\u4E00\u4E2A\u5173\u8054\u7C7B\u76EE");
    const productIds = Array.from(new Set(input.product_ids.filter(Boolean)));
    const linkedCategoryIds = Array.from(new Set(input.linked_category_ids.filter(Boolean)));
    await import_prisma2.default.$transaction(async (tx) => {
      await tx.product_category_relations.deleteMany({
        where: { productId: { in: productIds } }
      });
      const relationRows = buildRelationRows(productIds, linkedCategoryIds);
      if (relationRows.length > 0) {
        await tx.product_category_relations.createMany({
          data: relationRows.map((item) => ({ productId: item.productId, categoryId: item.relationId })),
          skipDuplicates: true
        });
      }
    });
    return { success_count: productIds.length, fail_count: 0 };
  })
);
var batchBindProductKeywords = (0, import_action_utils2.requireRole)([import_action_utils2.UserRole.ADMIN])(
  (0, import_action_utils2.withResult)(async (input) => {
    if (!input.product_ids.length) throw new Error("\u8BF7\u5148\u9009\u62E9\u5546\u54C1");
    if (!input.linked_keyword_ids.length) throw new Error("\u8BF7\u81F3\u5C11\u9009\u62E9\u4E00\u4E2A\u5173\u8054\u5173\u952E\u8BCD");
    const productIds = Array.from(new Set(input.product_ids.filter(Boolean)));
    const linkedKeywordIds = Array.from(new Set(input.linked_keyword_ids.filter(Boolean)));
    await import_prisma2.default.$transaction(async (tx) => {
      await tx.product_keyword_relations.deleteMany({
        where: { productId: { in: productIds } }
      });
      const relationRows = buildRelationRows(productIds, linkedKeywordIds);
      if (relationRows.length > 0) {
        await tx.product_keyword_relations.createMany({
          data: relationRows.map((item) => ({ productId: item.productId, keywordId: item.relationId })),
          skipDuplicates: true
        });
      }
    });
    return { success_count: productIds.length, fail_count: 0 };
  })
);
var batchUpdateManagementStatus = (0, import_action_utils2.requireRole)([import_action_utils2.UserRole.ADMIN])(
  (0, import_action_utils2.withResult)(async (input) => {
    if (!input.product_ids.length) throw new Error("\u8BF7\u5148\u9009\u62E9\u5546\u54C1");
    if (input.target_status === "DELETED") {
      return batchDeleteProduct(input.product_ids);
    }
    return batchUpdateProductStatus(input.product_ids, input.target_status);
  })
);
var batchUpdateProductWeightPrice = (0, import_action_utils2.requireRole)([import_action_utils2.UserRole.ADMIN])(
  (0, import_action_utils2.withResult)(async (input) => {
    if (!input.product_ids.length) throw new Error("\u8BF7\u5148\u9009\u62E9\u5546\u54C1");
    const nextValue = Number(input.value);
    if (!Number.isFinite(nextValue) || nextValue <= 0) {
      throw new Error(input.field === "weight_gram" ? "\u91CD\u91CF\u5FC5\u987B\u5927\u4E8E0" : "\u4EF7\u683C\u7CFB\u6570\u5FC5\u987B\u5927\u4E8E0");
    }
    let success = 0;
    let fail = 0;
    for (const productId of input.product_ids) {
      try {
        await import_prisma2.default.$transaction(async (tx) => {
          if (input.field === "weight_gram") {
            await tx.product.update({ where: { id: productId }, data: { weightGram: nextValue } });
            await tx.productsku.updateMany({ where: { productId }, data: { weightKg: Number((nextValue / 1e3).toFixed(3)) } });
          } else {
            await applyProductCoefficient(tx, productId, nextValue);
          }
          await syncCartItemsValidState(tx, productId);
        });
        success++;
      } catch (error) {
        fail++;
      }
    }
    return { success_count: success, fail_count: fail };
  })
);
var createPendingImportTaskForProductManagement = (0, import_action_utils2.requireRole)([import_action_utils2.UserRole.ADMIN])(
  (0, import_action_utils2.withResult)(async (input) => {
    return createImportTask(input);
  })
);
var startPendingImportTaskForProductManagement = (0, import_action_utils2.requireRole)([import_action_utils2.UserRole.ADMIN])(
  (0, import_action_utils2.withResult)(async (input) => {
    await startParseTask(input);
  })
);
var retryPendingImportTaskForProductManagement = (0, import_action_utils2.requireRole)([import_action_utils2.UserRole.ADMIN])(
  (0, import_action_utils2.withResult)(async (input) => {
    await retryImportTask(input);
  })
);
var getPendingImportQueue2 = (0, import_action_utils2.requireRole)([import_action_utils2.UserRole.ADMIN])(
  (0, import_action_utils2.withResult)(async () => {
    const queue = await getPendingImportQueue();
    return queue;
  })
);
var inlineUpdatePendingImportItemField2 = (0, import_action_utils2.requireRole)([import_action_utils2.UserRole.ADMIN])(
  (0, import_action_utils2.withResult)(async (input) => {
    await inlineUpdatePendingImportItemField({
      itemId: input.item_id,
      field: input.field,
      value: input.value
    });
    return { success: true };
  })
);
var publishPendingImportItems2 = (0, import_action_utils2.requireRole)([import_action_utils2.UserRole.ADMIN])(
  (0, import_action_utils2.withResult)(async (input) => {
    return publishPendingImportItems({ itemIds: input.item_ids });
  })
);
var deleteProduct = (0, import_action_utils2.requireRole)([import_action_utils2.UserRole.ADMIN])(
  (0, import_action_utils2.withResult)(async (product_id) => {
    await import_prisma2.default.$transaction(async (tx) => {
      await tx.product.update({
        where: { id: product_id },
        data: {
          status: "DRAFT",
          goodsStatus: "DELETED"
        }
      });
      await tx.cartitem.updateMany({ where: { productId: product_id }, data: { status: "INVALID" } });
    });
    return { success: true };
  })
);
var batchDeleteProduct = (0, import_action_utils2.requireRole)([import_action_utils2.UserRole.ADMIN])(
  (0, import_action_utils2.withResult)(async (product_ids) => {
    let success = 0;
    let fail = 0;
    for (const pid of product_ids) {
      try {
        await deleteProduct(pid);
        success++;
      } catch (err) {
        fail++;
      }
    }
    return { success_count: success, fail_count: fail };
  })
);
var getHomeFeaturedKeywords = (0, import_action_utils2.requireRole)([import_action_utils2.UserRole.ADMIN])(
  (0, import_action_utils2.withResult)(async () => {
    const setting = await import_prisma2.default.sitesetting.findFirst({
      where: { settingType: HOME_FEATURED_KEYWORDS_SETTING_TYPE },
      orderBy: [{ isActive: "desc" }, { updatedAt: "desc" }],
      select: { contentJson: true }
    });
    return {
      keywords: normalizeFeaturedKeywords(setting?.contentJson)
    };
  })
);
var saveHomeFeaturedKeywords = (0, import_action_utils2.requireRole)([import_action_utils2.UserRole.ADMIN])(
  (0, import_action_utils2.withResult)(async (input) => {
    const keywords = normalizeFeaturedKeywords(input);
    await import_prisma2.default.sitesetting.upsert({
      where: { id: HOME_FEATURED_KEYWORDS_SETTING_TYPE },
      update: {
        title: "\u9996\u9875\u63A8\u8350\u5173\u952E\u8BCD",
        contentJson: { keywords },
        isActive: true
      },
      create: {
        id: HOME_FEATURED_KEYWORDS_SETTING_TYPE,
        settingType: HOME_FEATURED_KEYWORDS_SETTING_TYPE,
        title: "\u9996\u9875\u63A8\u8350\u5173\u952E\u8BCD",
        contentJson: { keywords },
        isActive: true
      }
    });
    return { keywords };
  })
);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  batchBindProductCategories,
  batchBindProductKeywords,
  batchDeleteProduct,
  batchImportProducts,
  batchUpdateManagementStatus,
  batchUpdatePriceCoefficient,
  batchUpdateProductCategory,
  batchUpdateProductStatus,
  batchUpdateProductWeightPrice,
  createPendingImportTaskForProductManagement,
  createProduct,
  deleteProduct,
  getCategoryOptions,
  getHomeFeaturedKeywords,
  getPendingImportQueue,
  getProductBindingMeta,
  getProductDetail,
  getProductList,
  inlineUpdatePendingImportItemField,
  inlineUpdateProductField,
  publishPendingImportItems,
  retryPendingImportTaskForProductManagement,
  saveHomeFeaturedKeywords,
  startPendingImportTaskForProductManagement,
  updateProduct,
  updateProductStatus
});
