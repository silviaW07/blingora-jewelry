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

// src/backend/actions/OrderManagement.ts
var OrderManagement_exports = {};
__export(OrderManagement_exports, {
  addLogisticsSegment: () => addLogisticsSegment,
  getOrderDashboardStats: () => getOrderDashboardStats,
  getOrderDetail: () => getOrderDetail,
  getOrderList: () => getOrderList,
  shipOrder: () => shipOrder,
  updateOrderStatus: () => updateOrderStatus
});
module.exports = __toCommonJS(OrderManagement_exports);
var import_prisma = __toESM(require_prisma());
var import_action_utils = __toESM(require_action_utils());
var getOrderDashboardStats = (0, import_action_utils.requireRole)([import_action_utils.UserRole.ADMIN])(
  (0, import_action_utils.withResult)(async () => {
    const pendingShipmentCount = await import_prisma.default.orderrecord.count({
      where: { status: "PROCESSING" }
    });
    const todayStart = /* @__PURE__ */ new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayNewOrderCount = await import_prisma.default.orderrecord.count({
      where: { createdAt: { gte: todayStart } }
    });
    const refundingCount = await import_prisma.default.orderrecord.count({
      where: { status: "REFUNDED" }
      // 根据需求可以独立扩展 REFUNDING 等，按Schema用已退款或找退款申请，此处用已有REFUNDED近似替代
    });
    const totalOrderCount = await import_prisma.default.orderrecord.count();
    return {
      pendingShipmentCount,
      todayNewOrderCount,
      refundingCount,
      totalOrderCount
    };
  })
);
var getOrderList = (0, import_action_utils.requireRole)([import_action_utils.UserRole.ADMIN])(
  (0, import_action_utils.withResult)(async (input) => {
    const {
      keyword,
      status,
      paymentStatus,
      startDate,
      endDate,
      countryName,
      page = 1,
      pageSize = 20
    } = input;
    const skip = (Math.max(1, page) - 1) * pageSize;
    const whereCondition = {};
    if (status) {
      whereCondition.status = status;
    }
    if (paymentStatus) {
      whereCondition.paymentStatus = paymentStatus;
    }
    if (startDate || endDate) {
      whereCondition.createdAt = {};
      if (startDate) whereCondition.createdAt.gte = new Date(startDate);
      if (endDate) whereCondition.createdAt.lte = new Date(endDate);
    }
    if (countryName) {
      whereCondition.address = { countryName: { contains: countryName } };
    }
    if (keyword) {
      whereCondition.OR = [
        { orderNo: { contains: keyword } },
        { user: { username: { contains: keyword } } },
        { user: { email: { contains: keyword } } }
      ];
    }
    const [total, records] = await Promise.all([
      import_prisma.default.orderrecord.count({ where: whereCondition }),
      import_prisma.default.orderrecord.findMany({
        where: whereCondition,
        skip,
        take: pageSize,
        orderBy: { createdAt: "desc" },
        include: {
          user: true,
          address: true,
          items: {
            include: {
              product: { select: { mainImageUrl: true } }
            }
          }
        }
      })
    ]);
    const list = records.map((record) => {
      let itemSummary = "";
      if (record.items.length > 0) {
        const firstItem = record.items[0];
        const totalQty = record.items.reduce((sum, item) => sum + item.quantity, 0);
        itemSummary = `${firstItem.productName} \u7B49\u5171 ${totalQty} \u4EF6`;
      }
      return {
        id: record.id,
        orderNo: record.orderNo,
        status: record.status,
        totalAmount: record.totalAmount.toNumber(),
        currencyCode: record.currencyCode,
        paymentMethod: record.paymentMethod,
        paymentStatus: record.paymentStatus,
        trackingCarrier: record.trackingCarrier,
        trackingNumber: record.trackingNumber,
        createdAt: record.createdAt.toISOString(),
        customerName: record.user.username,
        customerEmail: record.user.email,
        countryName: record.address?.countryName || null,
        itemSummary,
        itemImageUrl: record.items[0]?.product?.mainImageUrl || null
      };
    });
    return { list, total };
  })
);
var getOrderDetail = (0, import_action_utils.requireRole)([import_action_utils.UserRole.ADMIN])(
  (0, import_action_utils.withResult)(async (orderId) => {
    const record = await import_prisma.default.orderrecord.findUnique({
      where: { id: orderId },
      include: {
        user: true,
        address: true,
        items: {
          include: {
            product: { select: { mainImageUrl: true } }
          }
        },
        logistics: {
          orderBy: { createdAt: "desc" }
        },
        logs: {
          orderBy: { createdAt: "desc" }
        }
      }
    });
    if (!record) {
      throw new Error("\u8BA2\u5355\u4E0D\u5B58\u5728");
    }
    let itemSummary = "";
    if (record.items.length > 0) {
      const firstItem = record.items[0];
      const totalQty = record.items.reduce((sum, item) => sum + item.quantity, 0);
      itemSummary = `${firstItem.productName} \u7B49\u5171 ${totalQty} \u4EF6`;
    }
    return {
      id: record.id,
      orderNo: record.orderNo,
      status: record.status,
      totalAmount: record.totalAmount.toNumber(),
      subtotalAmount: record.subtotalAmount.toNumber(),
      discountAmount: record.discountAmount.toNumber(),
      shippingAmount: record.shippingAmount.toNumber(),
      giftWrapAmount: record.giftWrapAmount.toNumber(),
      currencyCode: record.currencyCode,
      paymentMethod: record.paymentMethod,
      paymentStatus: record.paymentStatus,
      shipMethod: record.shipMethod,
      trackingCarrier: record.trackingCarrier,
      trackingNumber: record.trackingNumber,
      estimatedArrivalAt: record.estimatedArrivalAt?.toISOString() || null,
      shippedAt: record.shippedAt?.toISOString() || null,
      internalNote: record.internalNote,
      note: record.note,
      createdAt: record.createdAt.toISOString(),
      customerName: record.user.username,
      customerEmail: record.user.email,
      countryName: record.address?.countryName || null,
      itemSummary,
      itemImageUrl: record.items[0]?.product?.mainImageUrl || null,
      address: record.address ? {
        recipientName: record.address.recipientName,
        phone: record.address.phone,
        countryCode: record.address.countryCode,
        countryName: record.address.countryName,
        stateName: record.address.stateName,
        cityName: record.address.cityName,
        addressLine1: record.address.addressLine1,
        addressLine2: record.address.addressLine2,
        postalCode: record.address.postalCode
      } : null,
      items: record.items.map((item) => ({
        id: item.id,
        productId: item.productId,
        productSkuId: item.productSkuId,
        productName: item.productName,
        skuCode: item.skuCode,
        materialLabel: item.materialLabel,
        sizeLabel: item.sizeLabel,
        engravingText: item.engravingText,
        quantity: item.quantity,
        unitPrice: item.unitPrice.toNumber(),
        lineAmount: item.lineAmount.toNumber(),
        mainImageUrl: item.product?.mainImageUrl
      })),
      logistics: record.logistics.map((log) => ({
        id: log.id,
        segmentType: log.segmentType,
        carrierName: log.carrierName,
        trackingNumber: log.trackingNumber,
        statusLabel: log.statusLabel,
        estimatedArrivalAt: log.estimatedArrivalAt?.toISOString() || null,
        shippedAt: log.shippedAt?.toISOString() || null,
        remark: log.remark,
        timelineJson: log.timelineJson,
        createdAt: log.createdAt.toISOString()
      })),
      logs: record.logs.map((log) => ({
        id: log.id,
        actionType: log.actionType,
        actionNote: log.actionNote,
        operatorName: log.operatorName,
        createdAt: log.createdAt.toISOString()
      }))
    };
  })
);
var shipOrder = (0, import_action_utils.requireRole)([import_action_utils.UserRole.ADMIN])(
  (0, import_action_utils.withResult)(async (input) => {
    const { userId, username } = (0, import_action_utils.getAuthContext)();
    await import_prisma.default.$transaction(async (tx) => {
      const order = await tx.orderrecord.findUnique({ where: { id: input.orderId } });
      if (!order) throw new Error("\u8BA2\u5355\u4E0D\u5B58\u5728");
      if (order.status === "CANCELLED" || order.status === "REFUNDED") {
        throw new Error("\u5DF2\u53D6\u6D88\u6216\u5DF2\u9000\u6B3E\u7684\u8BA2\u5355\u65E0\u6CD5\u53D1\u8D27");
      }
      const shipDate = new Date(input.shippedAt);
      await tx.orderrecord.update({
        where: { id: input.orderId },
        data: {
          status: "SHIPPED",
          trackingCarrier: input.trackingCarrier,
          trackingNumber: input.trackingNumber,
          shippedAt: shipDate,
          ...input.internalNote ? { internalNote: input.internalNote } : {}
        }
      });
      await tx.orderlogisticssegment.create({
        data: {
          orderId: input.orderId,
          segmentType: "\u56FD\u9645\u6BB5/\u4E3B\u5E72",
          // 默认作为主干录入
          carrierName: input.trackingCarrier,
          trackingNumber: input.trackingNumber,
          statusLabel: "\u5DF2\u53D1\u8D27",
          shippedAt: shipDate,
          remark: "\u7BA1\u7406\u5458\u64CD\u4F5C\u4E3B\u5E72\u53D1\u8D27",
          timelineJson: [
            { time: shipDate.toISOString(), label: "\u5305\u88F9\u5DF2\u51FA\u5E93\u53D1\u8D27" }
          ]
        }
      });
      await tx.orderoperationlog.create({
        data: {
          orderId: input.orderId,
          actionType: "\u53D1\u8D27\u5904\u7406",
          actionNote: `\u901A\u8FC7\u627F\u8FD0\u5546 ${input.trackingCarrier} \u53D1\u8D27\uFF0C\u5355\u53F7\uFF1A${input.trackingNumber}\u3002\u5907\u6CE8\uFF1A${input.internalNote || "\u65E0"}`,
          operatorName: username
        }
      });
    });
  })
);
var addLogisticsSegment = (0, import_action_utils.requireRole)([import_action_utils.UserRole.ADMIN])(
  (0, import_action_utils.withResult)(async (input) => {
    const { username } = (0, import_action_utils.getAuthContext)();
    await import_prisma.default.$transaction(async (tx) => {
      const order = await tx.orderrecord.findUnique({ where: { id: input.orderId } });
      if (!order) throw new Error("\u8BA2\u5355\u4E0D\u5B58\u5728");
      await tx.orderlogisticssegment.create({
        data: {
          orderId: input.orderId,
          segmentType: input.segmentType,
          carrierName: input.carrierName,
          trackingNumber: input.trackingNumber,
          statusLabel: input.statusLabel,
          estimatedArrivalAt: input.estimatedArrivalAt ? new Date(input.estimatedArrivalAt) : null,
          remark: input.remark
        }
      });
      if (input.estimatedArrivalAt) {
        await tx.orderrecord.update({
          where: { id: input.orderId },
          data: { estimatedArrivalAt: new Date(input.estimatedArrivalAt) }
        });
      }
      await tx.orderoperationlog.create({
        data: {
          orderId: input.orderId,
          actionType: "\u7269\u6D41\u8282\u70B9\u66F4\u65B0",
          actionNote: `\u66F4\u65B0\u4E86 [${input.segmentType}] \u7269\u6D41\u8BB0\u5F55\uFF1A${input.carrierName || ""} - ${input.statusLabel || ""}`,
          operatorName: username
        }
      });
    });
  })
);
var updateOrderStatus = (0, import_action_utils.requireRole)([import_action_utils.UserRole.ADMIN])(
  (0, import_action_utils.withResult)(async (input) => {
    const { username } = (0, import_action_utils.getAuthContext)();
    const { orderId, newStatus, actionNote } = input;
    if (!actionNote.trim()) {
      throw new Error("\u72B6\u6001\u53D8\u66F4\u5FC5\u987B\u586B\u5199\u5904\u7406\u5907\u6CE8");
    }
    await import_prisma.default.$transaction(async (tx) => {
      const order = await tx.orderrecord.findUnique({ where: { id: orderId } });
      if (!order) throw new Error("\u8BA2\u5355\u4E0D\u5B58\u5728");
      if (order.status === newStatus) {
        return;
      }
      await tx.orderrecord.update({
        where: { id: orderId },
        data: { status: newStatus }
      });
      await tx.orderoperationlog.create({
        data: {
          orderId,
          actionType: `\u72B6\u6001\u53D8\u66F4 (${order.status} -> ${newStatus})`,
          actionNote,
          operatorName: username
        }
      });
    });
  })
);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  addLogisticsSegment,
  getOrderDashboardStats,
  getOrderDetail,
  getOrderList,
  shipOrder,
  updateOrderStatus
});
