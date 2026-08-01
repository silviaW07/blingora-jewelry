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

// src/backend/actions/Dashboard.ts
var Dashboard_exports = {};
__export(Dashboard_exports, {
  getAdminProfile: () => getAdminProfile,
  getImportTasksOverview: () => getImportTasksOverview,
  getKpiStats: () => getKpiStats,
  getRecentProducts: () => getRecentProducts,
  getRecentUsers: () => getRecentUsers,
  getStockAlerts: () => getStockAlerts,
  retryImportTask: () => retryImportTask
});
module.exports = __toCommonJS(Dashboard_exports);
var import_prisma = __toESM(require_prisma());
var import_action_utils = __toESM(require_action_utils());
var getAdminProfile = (0, import_action_utils.requireRole)(import_action_utils.UserRole.ADMIN)(
  (0, import_action_utils.withResult)(async () => {
    const { userId } = (0, import_action_utils.getAuthContext)();
    const user = await import_prisma.default.sysuser.findUnique({
      where: { id: userId },
      select: {
        account: true,
        username: true,
        email: true,
        avatarUrl: true
      }
    });
    if (!user) {
      throw new Error("\u5F53\u524D\u7528\u6237\u4FE1\u606F\u4E0D\u5B58\u5728");
    }
    return user;
  })
);
var getKpiStats = (0, import_action_utils.requireRole)(import_action_utils.UserRole.ADMIN)(
  (0, import_action_utils.withResult)(async () => {
    const totalProductCount = await import_prisma.default.product.count();
    const today = /* @__PURE__ */ new Date();
    today.setHours(0, 0, 0, 0);
    const todayImportCount = await import_prisma.default.importtask.count({
      where: {
        createdAt: {
          gte: today
        }
      }
    });
    const lowStockAlertCount = await import_prisma.default.productsku.count({
      where: {
        stock: { lte: 20 },
        product: {
          status: "ACTIVE"
        }
      }
    });
    const now = /* @__PURE__ */ new Date();
    const dayOfWeek = now.getDay();
    const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const thisWeekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - diff);
    thisWeekStart.setHours(0, 0, 0, 0);
    const newRegisteredUserCount = await import_prisma.default.sysuser.count({
      where: {
        role: "CUSTOMER",
        createdAt: {
          gte: thisWeekStart
        }
      }
    });
    return {
      totalProductCount,
      todayImportCount,
      lowStockAlertCount,
      newRegisteredUserCount
    };
  })
);
var getImportTasksOverview = (0, import_action_utils.requireRole)(import_action_utils.UserRole.ADMIN)(
  (0, import_action_utils.withResult)(async () => {
    const list = await import_prisma.default.importtask.findMany({
      orderBy: { createdAt: "desc" },
      take: 6,
      select: {
        id: true,
        taskName: true,
        status: true,
        progressPercent: true,
        createdAt: true
      }
    });
    return list.map((item) => ({
      id: item.id,
      taskName: item.taskName,
      status: item.status,
      progressPercent: item.progressPercent,
      createdAt: item.createdAt
    }));
  })
);
var retryImportTask = (0, import_action_utils.requireRole)(import_action_utils.UserRole.ADMIN)(
  (0, import_action_utils.withResult)(async (input) => {
    await import_prisma.default.$transaction(async (tx) => {
      const task = await tx.importtask.findUnique({
        where: { id: input.id },
        select: { id: true, status: true }
      });
      if (!task) {
        throw new Error("\u5BFC\u5165\u4EFB\u52A1\u4E0D\u5B58\u5728");
      }
      if (task.status !== "FAILED") {
        throw new Error("\u53EA\u6709\u5931\u8D25\u7684\u4EFB\u52A1\u624D\u53EF\u4EE5\u91CD\u8BD5");
      }
      await tx.importtask.update({
        where: { id: input.id },
        data: {
          status: "PENDING",
          progressPercent: 0,
          failureCount: 0
        }
      });
      await tx.importtaskitem.updateMany({
        where: { importTaskId: input.id },
        data: {
          failureReason: null
        }
      });
    });
  })
);
var getStockAlerts = (0, import_action_utils.requireRole)(import_action_utils.UserRole.ADMIN)(
  (0, import_action_utils.withResult)(async () => {
    const list = await import_prisma.default.productsku.findMany({
      where: {
        stock: { lte: 20 },
        product: {
          status: "ACTIVE"
        }
      },
      take: 10,
      select: {
        id: true,
        skuCode: true,
        stock: true,
        product: {
          select: {
            name: true
          }
        }
      }
    });
    return list.map((item) => ({
      id: item.id,
      skuCode: item.skuCode,
      productName: item.product.name,
      stock: item.stock
    }));
  })
);
var getRecentProducts = (0, import_action_utils.requireRole)(import_action_utils.UserRole.ADMIN)(
  (0, import_action_utils.withResult)(async () => {
    const list = await import_prisma.default.product.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        id: true,
        productCode: true,
        name: true,
        status: true,
        mainImageUrl: true,
        createdAt: true,
        category: {
          select: {
            name: true
          }
        },
        skus: {
          take: 1,
          select: {
            price: true
          }
        }
      }
    });
    return list.map((item) => ({
      id: item.id,
      productCode: item.productCode,
      name: item.name,
      categoryName: item.category?.name || "",
      price: item.skus?.[0]?.price ? item.skus[0].price.toNumber() : 0,
      status: item.status,
      mainImageUrl: item.mainImageUrl,
      createdAt: item.createdAt
    }));
  })
);
var getRecentUsers = (0, import_action_utils.requireRole)(import_action_utils.UserRole.ADMIN)(
  (0, import_action_utils.withResult)(async () => {
    const list = await import_prisma.default.sysuser.findMany({
      where: {
        role: "CUSTOMER"
      },
      orderBy: { createdAt: "desc" },
      take: 8,
      select: {
        id: true,
        username: true,
        email: true,
        avatarUrl: true,
        createdAt: true
      }
    });
    return list.map((item) => ({
      id: item.id,
      username: item.username,
      email: item.email,
      avatarUrl: item.avatarUrl,
      createdAt: item.createdAt
    }));
  })
);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  getAdminProfile,
  getImportTasksOverview,
  getKpiStats,
  getRecentProducts,
  getRecentUsers,
  getStockAlerts,
  retryImportTask
});
