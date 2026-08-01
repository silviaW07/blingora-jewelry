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

// src/frontend/actions/Cart.ts
var Cart_exports = {};
__export(Cart_exports, {
  clearCart: () => clearCart,
  getCartData: () => getCartData,
  getRecommendedProducts: () => getRecommendedProducts,
  removeCartItem: () => removeCartItem,
  removeInvalidCartItems: () => removeInvalidCartItems,
  updateCartItemQuantity: () => updateCartItemQuantity
});
module.exports = __toCommonJS(Cart_exports);
var import_prisma = __toESM(require_prisma());
var import_action_utils = __toESM(require_action_utils());
var getCartData = (0, import_action_utils.requireRole)([import_action_utils.UserRole.CUSTOMER])(
  (0, import_action_utils.withResult)(async () => {
    const { userId } = (0, import_action_utils.getAuthContext)();
    let cart = await import_prisma.default.cart.findUnique({
      where: { accountId: userId }
    });
    if (!cart) {
      cart = await import_prisma.default.cart.create({
        data: { account: { connect: { id: userId } } }
      });
    }
    const rawItems = await import_prisma.default.cartitem.findMany({
      where: { cartId: cart.id },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            status: true,
            mainImageUrl: true,
            category: { select: { status: true } }
          }
        },
        productSku: {
          select: {
            id: true,
            price: true,
            stock: true,
            attributeJson: true
          }
        }
      },
      orderBy: { createdAt: "desc" }
    });
    const updates = [];
    let totalPrice = 0;
    const items = [];
    for (const item of rawItems) {
      const pStatus = item.product.status;
      const cStatus = item.product.category?.status;
      const stock = item.productSku.stock;
      let isValid = true;
      let invalidReason = null;
      if (pStatus !== "ACTIVE" || cStatus !== "ACTIVE") {
        isValid = false;
        invalidReason = "\u5546\u54C1\u6216\u5206\u7C7B\u5DF2\u5931\u6548";
      } else if (stock < item.quantity) {
        isValid = false;
        invalidReason = "\u5E93\u5B58\u4E0D\u8DB3";
      }
      const expectedStatus = isValid ? "VALID" : "INVALID";
      if (item.status !== expectedStatus) {
        updates.push(
          import_prisma.default.cartitem.update({
            where: { id: item.id },
            data: { status: expectedStatus }
          })
        );
      }
      const priceNum = item.productSku.price.toNumber();
      if (isValid) {
        totalPrice += priceNum * item.quantity;
      }
      const rawAttrs = item.productSku.attributeJson || [];
      const skuAttributes = rawAttrs.map((attr) => ({
        name: attr?.name || "",
        value: attr?.value || ""
      }));
      items.push({
        cartItemId: item.id,
        productId: item.product.id,
        productSkuId: item.productSku.id,
        productName: item.product.name,
        mainImageUrl: item.product.mainImageUrl,
        skuAttributes,
        price: priceNum,
        quantity: item.quantity,
        stock,
        status: expectedStatus,
        invalidReason,
        subtotal: priceNum * item.quantity
      });
    }
    if (updates.length > 0) {
      await import_prisma.default.$transaction(updates);
    }
    const summary = {
      totalPrice,
      shippingFee: 0,
      // 暂无全局运费设定，给前端展示占位
      discount: 0,
      // 暂无全局折扣设定，给前端展示占位
      finalAmount: totalPrice
    };
    return { items, summary };
  })
);
var updateCartItemQuantity = (0, import_action_utils.requireRole)([import_action_utils.UserRole.CUSTOMER])(
  (0, import_action_utils.withResult)(async (input) => {
    const { userId } = (0, import_action_utils.getAuthContext)();
    const { cartItemId, quantity } = input;
    if (quantity <= 0) {
      await import_prisma.default.cartitem.deleteMany({
        where: { id: cartItemId, cart: { accountId: userId } }
      });
      return true;
    }
    const item = await import_prisma.default.cartitem.findFirst({
      where: { id: cartItemId, cart: { accountId: userId } },
      include: {
        product: { select: { status: true, category: { select: { status: true } } } },
        productSku: { select: { stock: true } }
      }
    });
    if (!item) {
      throw new Error("\u8D2D\u7269\u8F66\u6761\u76EE\u4E0D\u5B58\u5728\u6216\u65E0\u6743\u8BBF\u95EE");
    }
    if (quantity > item.productSku.stock) {
      throw new Error(`\u66F4\u65B0\u5931\u8D25\uFF0C\u5E93\u5B58\u4E0D\u8DB3\uFF08\u5F53\u524D\u5E93\u5B58: ${item.productSku.stock}\uFF09`);
    }
    const isProductActive = item.product.status === "ACTIVE";
    const isCategoryActive = item.product.category?.status === "ACTIVE";
    const newStatus = isProductActive && isCategoryActive && item.productSku.stock >= quantity ? "VALID" : "INVALID";
    if (!isProductActive || !isCategoryActive) {
      throw new Error("\u8BE5\u5546\u54C1\u5DF2\u4E0B\u67B6\uFF0C\u4E0D\u5141\u8BB8\u4FEE\u6539\u6570\u91CF");
    }
    await import_prisma.default.cartitem.update({
      where: { id: cartItemId },
      data: {
        quantity,
        status: newStatus
      }
    });
    return true;
  })
);
var removeCartItem = (0, import_action_utils.requireRole)([import_action_utils.UserRole.CUSTOMER])(
  (0, import_action_utils.withResult)(async (input) => {
    const { userId } = (0, import_action_utils.getAuthContext)();
    await import_prisma.default.cartitem.deleteMany({
      where: {
        id: input.cartItemId,
        cart: { accountId: userId }
      }
    });
    return true;
  })
);
var clearCart = (0, import_action_utils.requireRole)([import_action_utils.UserRole.CUSTOMER])(
  (0, import_action_utils.withResult)(async () => {
    const { userId } = (0, import_action_utils.getAuthContext)();
    await import_prisma.default.cartitem.deleteMany({
      where: { cart: { accountId: userId } }
    });
    return true;
  })
);
var removeInvalidCartItems = (0, import_action_utils.requireRole)([import_action_utils.UserRole.CUSTOMER])(
  (0, import_action_utils.withResult)(async () => {
    const { userId } = (0, import_action_utils.getAuthContext)();
    await import_prisma.default.cartitem.deleteMany({
      where: {
        cart: { accountId: userId },
        status: "INVALID"
      }
    });
    return true;
  })
);
var getRecommendedProducts = (0, import_action_utils.requireRole)([import_action_utils.UserRole.CUSTOMER])(
  (0, import_action_utils.withResult)(async () => {
    const products = await import_prisma.default.product.findMany({
      where: {
        status: "ACTIVE",
        category: { status: "ACTIVE" }
      },
      select: {
        id: true,
        name: true,
        mainImageUrl: true,
        ratingAverage: true,
        skus: {
          select: { price: true }
        }
      },
      orderBy: [
        { sortWeight: "desc" },
        { createdAt: "desc" }
      ],
      take: 8
    });
    const list = products.map((p) => {
      let priceMin = 0;
      if (p.skus && p.skus.length > 0) {
        priceMin = Math.min(...p.skus.map((s) => s.price.toNumber()));
      }
      return {
        productId: p.id,
        name: p.name,
        mainImageUrl: p.mainImageUrl,
        ratingAverage: p.ratingAverage,
        priceMin
      };
    });
    return { list };
  })
);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  clearCart,
  getCartData,
  getRecommendedProducts,
  removeCartItem,
  removeInvalidCartItems,
  updateCartItemQuantity
});
