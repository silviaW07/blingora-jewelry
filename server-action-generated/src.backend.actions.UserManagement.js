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

// src/backend/actions/UserManagement.ts
var UserManagement_exports = {};
__export(UserManagement_exports, {
  deleteUser: () => deleteUser,
  getUserDetail: () => getUserDetail,
  getUserList: () => getUserList,
  updateUserStatus: () => updateUserStatus
});
module.exports = __toCommonJS(UserManagement_exports);
var import_prisma = __toESM(require_prisma());
var import_action_utils = __toESM(require_action_utils());
var ORDER_STATUS_PRIORITY = {
  PENDING_PAYMENT: 1,
  PAID: 2,
  PROCESSING: 3,
  SHIPPED: 4,
  DELIVERED: 5,
  CANCELLED: 6,
  REFUNDED: 7
};
function mapOrderStatus(status) {
  switch (status) {
    case "PENDING_PAYMENT":
      return "PENDING_PAYMENT";
    case "PAID":
    case "PROCESSING":
      return "PAID";
    case "SHIPPED":
      return "SHIPPED";
    case "DELIVERED":
      return "COMPLETED";
    default:
      return "COMPLETED";
  }
}
function createEmptyOrderSummary() {
  return {
    total: 0,
    pendingPayment: 0,
    paid: 0,
    shipped: 0,
    completed: 0
  };
}
function buildOrderSummary(statuses) {
  return statuses.reduce((summary, status) => {
    const mappedStatus = mapOrderStatus(status);
    summary.total += 1;
    if (mappedStatus === "PENDING_PAYMENT") summary.pendingPayment += 1;
    if (mappedStatus === "PAID") summary.paid += 1;
    if (mappedStatus === "SHIPPED") summary.shipped += 1;
    if (mappedStatus === "COMPLETED") summary.completed += 1;
    return summary;
  }, createEmptyOrderSummary());
}
var getUserList = (0, import_action_utils.requireRole)([import_action_utils.UserRole.ADMIN])(
  (0, import_action_utils.withResult)(async (input) => {
    const page = input.page && input.page > 0 ? input.page : 1;
    const pageSize = input.pageSize && input.pageSize > 0 ? input.pageSize : 20;
    const skip = (page - 1) * pageSize;
    const where = {};
    if (input.account?.trim()) {
      where.account = { contains: input.account.trim() };
    }
    if (input.email?.trim()) {
      where.email = { contains: input.email.trim() };
    }
    if (input.role) {
      where.role = input.role.toUpperCase();
    }
    if (input.status) {
      where.status = input.status.toUpperCase();
    }
    const [total, users] = await Promise.all([
      import_prisma.default.sysuser.count({ where }),
      import_prisma.default.sysuser.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: "desc" },
        include: {
          carts: {
            include: {
              _count: {
                select: { items: true }
              }
            }
          },
          orders: {
            select: {
              status: true
            }
          }
        }
      })
    ]);
    const emails = Array.from(new Set(users.map((user) => user.email.trim().toLowerCase()).filter(Boolean)));
    const emailOrders = emails.length ? await import_prisma.default.orderrecord.findMany({
      where: {
        user: {
          email: {
            in: emails
          }
        }
      },
      select: {
        userId: true,
        status: true,
        user: {
          select: {
            email: true
          }
        }
      }
    }) : [];
    const emailStatusMap = /* @__PURE__ */ new Map();
    for (const order of emailOrders) {
      const emailKey = order.user.email.trim().toLowerCase();
      const bucket = emailStatusMap.get(emailKey) ?? [];
      bucket.push(order.status);
      emailStatusMap.set(emailKey, bucket);
    }
    const list = users.map((user) => {
      const cart = user.carts[0];
      const directStatuses = user.orders.map((order) => order.status);
      const emailStatuses = user.email ? emailStatusMap.get(user.email.trim().toLowerCase()) ?? [] : [];
      const mergedStatuses = [...directStatuses];
      for (const status of emailStatuses) {
        mergedStatuses.push(status);
      }
      return {
        id: user.id,
        account: user.account,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt.toISOString(),
        status: user.status,
        cartItemCount: cart?._count?.items ?? 0,
        orderCount: mergedStatuses.length,
        orderSummary: buildOrderSummary(mergedStatuses)
      };
    });
    return { list, total };
  })
);
var getUserDetail = (0, import_action_utils.requireRole)([import_action_utils.UserRole.ADMIN])(
  (0, import_action_utils.withResult)(async (input) => {
    const user = await import_prisma.default.sysuser.findUnique({
      where: { id: input.id },
      include: {
        carts: {
          include: {
            _count: {
              select: { items: true }
            }
          }
        },
        orders: {
          select: {
            id: true,
            orderNo: true,
            status: true,
            totalAmount: true,
            currencyCode: true,
            createdAt: true
          }
        }
      }
    });
    if (!user) {
      throw new Error("\u7528\u6237\u4E0D\u5B58\u5728");
    }
    const emailMatchedOrders = user.email ? await import_prisma.default.orderrecord.findMany({
      where: {
        user: {
          email: user.email.trim()
        }
      },
      select: {
        id: true,
        orderNo: true,
        status: true,
        totalAmount: true,
        currencyCode: true,
        createdAt: true,
        userId: true,
        user: {
          select: {
            email: true
          }
        }
      }
    }) : [];
    const orderMap = /* @__PURE__ */ new Map();
    for (const order of user.orders) {
      const rawStatus = order.status;
      orderMap.set(order.id, {
        id: order.id,
        orderNo: order.orderNo,
        email: user.email,
        rawStatus,
        mappedStatus: mapOrderStatus(rawStatus),
        totalAmount: Number(order.totalAmount),
        currencyCode: order.currencyCode,
        createdAt: order.createdAt.toISOString(),
        matchedBy: "USER_ID"
      });
    }
    for (const order of emailMatchedOrders) {
      if (orderMap.has(order.id)) {
        continue;
      }
      const rawStatus = order.status;
      orderMap.set(order.id, {
        id: order.id,
        orderNo: order.orderNo,
        email: order.user.email,
        rawStatus,
        mappedStatus: mapOrderStatus(rawStatus),
        totalAmount: Number(order.totalAmount),
        currencyCode: order.currencyCode,
        createdAt: order.createdAt.toISOString(),
        matchedBy: order.userId === user.id ? "USER_ID" : "EMAIL"
      });
    }
    const orderRecords = Array.from(orderMap.values()).filter((order) => ["PENDING_PAYMENT", "PAID", "PROCESSING", "SHIPPED", "DELIVERED"].includes(order.rawStatus)).sort((a, b) => {
      const timeDiff = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      if (timeDiff !== 0) return timeDiff;
      return ORDER_STATUS_PRIORITY[a.rawStatus] - ORDER_STATUS_PRIORITY[b.rawStatus];
    });
    const cart = user.carts[0];
    const orderSummary = buildOrderSummary(orderRecords.map((order) => order.rawStatus));
    return {
      id: user.id,
      account: user.account,
      email: user.email,
      role: user.role,
      status: user.status,
      createdAt: user.createdAt.toISOString(),
      lastLoginAt: user.lastLoginAt ? user.lastLoginAt.toISOString() : null,
      cartId: cart?.id ?? null,
      cartItemCount: cart?._count?.items ?? 0,
      orderCount: orderRecords.length,
      orderSummary,
      orderRecords
    };
  })
);
var updateUserStatus = (0, import_action_utils.requireRole)([import_action_utils.UserRole.ADMIN])(
  (0, import_action_utils.withResult)(async (input) => {
    const { id, status } = input;
    const targetStatus = status.toUpperCase();
    const targetUser = await import_prisma.default.sysuser.findUnique({
      where: { id }
    });
    if (!targetUser) {
      throw new Error("\u64CD\u4F5C\u7684\u76EE\u6807\u7528\u6237\u4E0D\u5B58\u5728");
    }
    if (targetStatus === "DISABLED" && targetUser.role === "ADMIN" && targetUser.status === "ACTIVE") {
      const activeAdminCount = await import_prisma.default.sysuser.count({
        where: {
          role: "ADMIN",
          status: "ACTIVE"
        }
      });
      if (activeAdminCount <= 1) {
        throw new Error("\u7CFB\u7EDF\u5FC5\u987B\u81F3\u5C11\u4FDD\u75591\u4E2A\u6FC0\u6D3B\u72B6\u6001\u7684\u7BA1\u7406\u5458\u8D26\u53F7\uFF0C\u65E0\u6CD5\u7981\u7528\u8BE5\u8D26\u6237");
      }
    }
    await import_prisma.default.sysuser.update({
      where: { id },
      data: { status: targetStatus }
    });
  })
);
var deleteUser = (0, import_action_utils.requireRole)([import_action_utils.UserRole.ADMIN])(
  (0, import_action_utils.withResult)(async (input) => {
    const { userId: currentUserId } = (0, import_action_utils.getAuthContext)();
    const targetId = input.id;
    if (currentUserId === targetId) {
      throw new Error("\u5F53\u524D\u767B\u5F55\u7BA1\u7406\u5458\u4E0D\u53EF\u5220\u9664\u81EA\u5DF1");
    }
    const targetUser = await import_prisma.default.sysuser.findUnique({
      where: { id: targetId },
      include: {
        carts: true,
        _count: {
          select: { importTasks: true }
        }
      }
    });
    if (!targetUser) {
      throw new Error("\u8981\u5220\u9664\u7684\u7528\u6237\u4E0D\u5B58\u5728");
    }
    if (targetUser.role === "ADMIN") {
      if (targetUser._count.importTasks > 0) {
        throw new Error("\u8BE5\u7BA1\u7406\u5458\u5B58\u5728\u5173\u8054\u7684\u5546\u54C1\u5BFC\u5165\u4EFB\u52A1\uFF0C\u7981\u6B62\u5220\u9664");
      }
      if (targetUser.status === "ACTIVE") {
        const activeAdminCount = await import_prisma.default.sysuser.count({
          where: { role: "ADMIN", status: "ACTIVE" }
        });
        if (activeAdminCount <= 1) {
          throw new Error("\u7CFB\u7EDF\u5FC5\u987B\u81F3\u5C11\u4FDD\u75591\u4E2A\u6FC0\u6D3B\u72B6\u6001\u7684\u7BA1\u7406\u5458\u8D26\u53F7\uFF0C\u65E0\u6CD5\u5220\u9664\u8BE5\u8D26\u6237");
        }
      }
    }
    await import_prisma.default.$transaction(async (tx) => {
      if (targetUser.role === "CUSTOMER" && targetUser.carts.length > 0) {
        const cartIds = targetUser.carts.map((c) => c.id);
        await tx.cartitem.deleteMany({
          where: { cartId: { in: cartIds } }
        });
        await tx.cart.deleteMany({
          where: { id: { in: cartIds } }
        });
      }
      await tx.sysuser.delete({
        where: { id: targetId }
      });
    });
  })
);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  deleteUser,
  getUserDetail,
  getUserList,
  updateUserStatus
});
