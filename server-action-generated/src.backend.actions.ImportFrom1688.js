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

// src/backend/actions/ImportFrom1688.ts
var ImportFrom1688_exports = {};
__export(ImportFrom1688_exports, {
  confirmImportProducts: () => confirmImportProducts,
  createImportTask: () => createImportTask,
  deleteImportTask: () => deleteImportTask,
  getCategoryOptions: () => getCategoryOptions,
  getImportTaskDetail: () => getImportTaskDetail,
  getImportTaskList: () => getImportTaskList,
  getPendingImportQueue: () => getPendingImportQueue,
  inlineUpdatePendingImportItemField: () => inlineUpdatePendingImportItemField,
  parseTableImportContent: () => parseTableImportContent,
  publishPendingImportItems: () => publishPendingImportItems,
  retryImportTask: () => retryImportTask,
  startParseTask: () => startParseTask,
  updateTaskItemPreview: () => updateTaskItemPreview
});
module.exports = __toCommonJS(ImportFrom1688_exports);
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
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  confirmImportProducts,
  createImportTask,
  deleteImportTask,
  getCategoryOptions,
  getImportTaskDetail,
  getImportTaskList,
  getPendingImportQueue,
  inlineUpdatePendingImportItemField,
  parseTableImportContent,
  publishPendingImportItems,
  retryImportTask,
  startParseTask,
  updateTaskItemPreview
});
