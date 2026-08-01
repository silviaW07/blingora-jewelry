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

// src/frontend/actions/ProductDetail.ts
var ProductDetail_exports = {};
__export(ProductDetail_exports, {
  addToCart: () => addToCart,
  getProductDetail: () => getProductDetail,
  getRelatedProducts: () => getRelatedProducts
});
module.exports = __toCommonJS(ProductDetail_exports);
var import_prisma = __toESM(require_prisma());
var import_action_utils = __toESM(require_action_utils());
var getProductDetail = (0, import_action_utils.withResult)(
  async (input) => {
    if (!input.productId && !input.slug) {
      throw new Error("\u7F3A\u5C11\u5FC5\u8981\u7684\u5546\u54C1\u6807\u8BC6");
    }
    const whereCondition = input.productId ? { id: input.productId } : { slug: input.slug };
    const product = await import_prisma.default.product.findUnique({
      where: whereCondition,
      include: {
        category: true,
        skus: true
      }
    });
    if (!product) {
      throw new Error("\u672A\u627E\u5230\u5BF9\u5E94\u5546\u54C1");
    }
    const detailData = {
      id: product.id,
      name: product.name,
      productCode: product.productCode,
      status: product.status,
      mainImageUrl: product.mainImageUrl,
      galleryJson: product.galleryJson,
      shortDescription: product.shortDescription,
      sellingPointsJson: product.sellingPointsJson ? product.sellingPointsJson : null,
      detailContentJson: product.detailContentJson ? product.detailContentJson : null,
      parameterJson: product.parameterJson ? product.parameterJson : null,
      tradeInfoJson: product.tradeInfoJson ? product.tradeInfoJson : null,
      faqJson: product.faqJson ? product.faqJson : null,
      ratingAverage: product.ratingAverage,
      ratingCount: product.ratingCount,
      categoryId: product.categoryId,
      category: {
        id: product.category.id,
        name: product.category.name,
        status: product.category.status
      },
      skus: product.skus.map((sku) => ({
        id: sku.id,
        skuCode: sku.skuCode,
        imageUrl: sku.imageUrl,
        price: sku.price.toNumber(),
        originalPrice: sku.originalPrice ? sku.originalPrice.toNumber() : null,
        stock: sku.stock,
        stockStatus: sku.stockStatus,
        attributeJson: sku.attributeJson,
        deliveryDays: sku.deliveryDays,
        weightKg: sku.weightKg ? sku.weightKg.toNumber() : null,
        volumeM3: sku.volumeM3 ? sku.volumeM3.toNumber() : null
      }))
    };
    return { product: detailData };
  }
);
var getRelatedProducts = (0, import_action_utils.withResult)(
  async (input) => {
    const products = await import_prisma.default.product.findMany({
      where: {
        categoryId: input.categoryId,
        id: { not: input.excludeProductId },
        status: "ACTIVE",
        category: {
          status: "ACTIVE"
        }
      },
      take: 4,
      orderBy: { sortWeight: "desc" },
      include: {
        skus: {
          select: { price: true }
        }
      }
    });
    const list = products.map((p) => {
      const minPrice = p.skus.length > 0 ? Math.min(...p.skus.map((s) => s.price.toNumber())) : 0;
      return {
        id: p.id,
        name: p.name,
        slug: p.slug,
        mainImageUrl: p.mainImageUrl,
        minPrice
      };
    });
    return { list };
  }
);
var addToCart = (0, import_action_utils.requireRole)([import_action_utils.UserRole.CUSTOMER])(
  (0, import_action_utils.withResult)(async (input) => {
    const { userId } = (0, import_action_utils.getAuthContext)();
    if (input.quantity <= 0) {
      throw new Error("\u52A0\u8D2D\u6570\u91CF\u5FC5\u987B\u5927\u4E8E0");
    }
    const sku = await import_prisma.default.productsku.findUnique({
      where: { id: input.productSkuId },
      include: {
        product: {
          include: { category: true }
        }
      }
    });
    if (!sku) {
      throw new Error("\u5546\u54C1SKU\u4E0D\u5B58\u5728");
    }
    if (sku.product.status !== "ACTIVE" || sku.product.category.status !== "ACTIVE") {
      throw new Error("\u8BE5\u5546\u54C1\u5F53\u524D\u4E0D\u53EF\u8D2D\u4E70");
    }
    if (input.quantity > sku.stock) {
      throw new Error(`\u5E93\u5B58\u4E0D\u8DB3\uFF0C\u5F53\u524D\u4EC5\u5269 ${sku.stock} \u4EF6`);
    }
    let cart = await import_prisma.default.cart.findUnique({
      where: { accountId: userId }
    });
    if (!cart) {
      cart = await import_prisma.default.cart.create({
        data: {
          account: { connect: { id: userId } }
        }
      });
    }
    const existingItem = await import_prisma.default.cartitem.findUnique({
      where: {
        cartId_productSkuId: {
          cartId: cart.id,
          productSkuId: input.productSkuId
        }
      }
    });
    if (existingItem) {
      const newQuantity = existingItem.quantity + input.quantity;
      if (newQuantity > sku.stock) {
        throw new Error(`\u52A0\u8D2D\u540E\u603B\u91CF\u5C06\u8D85\u8FC7\u53EF\u7528\u5E93\u5B58\uFF0C\u5F53\u524D\u5E93\u5B58\u4E3A ${sku.stock} \u4EF6`);
      }
      await import_prisma.default.cartitem.update({
        where: { id: existingItem.id },
        data: {
          quantity: newQuantity,
          status: "VALID"
        }
      });
    } else {
      await import_prisma.default.cartitem.create({
        data: {
          cart: { connect: { id: cart.id } },
          product: { connect: { id: sku.productId } },
          productSku: { connect: { id: sku.id } },
          quantity: input.quantity,
          status: "VALID"
        }
      });
    }
    return { success: true };
  })
);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  addToCart,
  getProductDetail,
  getRelatedProducts
});
