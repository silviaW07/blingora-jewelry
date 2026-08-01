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

// src/backend/actions/BannerManagement.ts
var BannerManagement_exports = {};
__export(BannerManagement_exports, {
  batchDeleteBanners: () => batchDeleteBanners,
  batchUpdateBannerStatus: () => batchUpdateBannerStatus,
  createBanner: () => createBanner,
  deleteBanner: () => deleteBanner,
  getBannerList: () => getBannerList,
  updateBanner: () => updateBanner,
  updateBannerSortWeight: () => updateBannerSortWeight,
  updateBannerStatus: () => updateBannerStatus
});
module.exports = __toCommonJS(BannerManagement_exports);
var import_prisma = __toESM(require_prisma());
var import_action_utils = __toESM(require_action_utils());
var getBannerList = (0, import_action_utils.requireRole)([import_action_utils.UserRole.ADMIN])(
  (0, import_action_utils.withResult)(async (input) => {
    const {
      search_keyword = "",
      filter_status = "ALL",
      page = 1,
      page_size = 20
    } = input;
    const skip = Math.max(0, (page - 1) * page_size);
    const take = page_size;
    const where = {
      ...search_keyword ? { title: { contains: search_keyword } } : {},
      ...filter_status === "ENABLED" ? { isEnabled: true } : {},
      ...filter_status === "DISABLED" ? { isEnabled: false } : {}
    };
    const [total, records] = await import_prisma.default.$transaction([
      import_prisma.default.categorybanner.count({ where }),
      import_prisma.default.categorybanner.findMany({
        where,
        orderBy: [
          { sortWeight: "desc" },
          { updatedAt: "desc" }
        ],
        skip,
        take
      })
    ]);
    const list = records.map((record) => ({
      banner_id: record.id,
      banner_title: record.title,
      banner_imageUrl: record.imageUrl,
      banner_linkUrl: record.linkUrl,
      banner_sortWeight: record.sortWeight,
      banner_isEnabled: record.isEnabled,
      banner_updatedAt: record.updatedAt.toISOString()
    }));
    return { list, total };
  })
);
var createBanner = (0, import_action_utils.requireRole)([import_action_utils.UserRole.ADMIN])(
  (0, import_action_utils.withResult)(async (input) => {
    if (!input.banner_imageUrl) {
      throw new Error("\u8BF7\u4E0A\u4F20\u5C01\u9762\u56FE");
    }
    await import_prisma.default.categorybanner.create({
      data: {
        title: input.banner_title || null,
        imageUrl: input.banner_imageUrl,
        linkUrl: input.banner_linkUrl || "",
        sortWeight: input.banner_sortWeight,
        isEnabled: input.banner_isEnabled
      }
    });
    return { success: true };
  })
);
var updateBanner = (0, import_action_utils.requireRole)([import_action_utils.UserRole.ADMIN])(
  (0, import_action_utils.withResult)(async (input) => {
    if (!input.banner_id) throw new Error("Banner ID \u4E0D\u80FD\u4E3A\u7A7A");
    if (!input.banner_imageUrl) throw new Error("\u8BF7\u4E0A\u4F20\u5C01\u9762\u56FE");
    await import_prisma.default.categorybanner.update({
      where: { id: input.banner_id },
      data: {
        title: input.banner_title || null,
        imageUrl: input.banner_imageUrl,
        linkUrl: input.banner_linkUrl || "",
        sortWeight: input.banner_sortWeight,
        isEnabled: input.banner_isEnabled
      }
    });
    return { success: true };
  })
);
var deleteBanner = (0, import_action_utils.requireRole)([import_action_utils.UserRole.ADMIN])(
  (0, import_action_utils.withResult)(async (input) => {
    if (!input.banner_id) throw new Error("Banner ID \u4E0D\u80FD\u4E3A\u7A7A");
    await import_prisma.default.categorybanner.delete({
      where: { id: input.banner_id }
    });
    return { success: true };
  })
);
var batchDeleteBanners = (0, import_action_utils.requireRole)([import_action_utils.UserRole.ADMIN])(
  (0, import_action_utils.withResult)(async (input) => {
    if (!input.banner_ids || input.banner_ids.length === 0) {
      throw new Error("\u8BF7\u9009\u62E9\u8981\u5220\u9664\u7684 Banner");
    }
    const result = await import_prisma.default.categorybanner.deleteMany({
      where: { id: { in: input.banner_ids } }
    });
    return { count: result.count };
  })
);
var batchUpdateBannerStatus = (0, import_action_utils.requireRole)([import_action_utils.UserRole.ADMIN])(
  (0, import_action_utils.withResult)(async (input) => {
    if (!input.banner_ids || input.banner_ids.length === 0) {
      throw new Error("\u8BF7\u9009\u62E9\u8981\u66F4\u65B0\u7684 Banner");
    }
    const result = await import_prisma.default.categorybanner.updateMany({
      where: { id: { in: input.banner_ids } },
      data: { isEnabled: input.banner_isEnabled }
    });
    return { count: result.count };
  })
);
var updateBannerSortWeight = (0, import_action_utils.requireRole)([import_action_utils.UserRole.ADMIN])(
  (0, import_action_utils.withResult)(async (input) => {
    if (!input.banner_id) throw new Error("Banner ID \u4E0D\u80FD\u4E3A\u7A7A");
    await import_prisma.default.categorybanner.update({
      where: { id: input.banner_id },
      data: { sortWeight: input.banner_sortWeight }
    });
    return { success: true };
  })
);
var updateBannerStatus = (0, import_action_utils.requireRole)([import_action_utils.UserRole.ADMIN])(
  (0, import_action_utils.withResult)(async (input) => {
    if (!input.banner_id) throw new Error("Banner ID \u4E0D\u80FD\u4E3A\u7A7A");
    await import_prisma.default.categorybanner.update({
      where: { id: input.banner_id },
      data: { isEnabled: input.banner_isEnabled }
    });
    return { success: true };
  })
);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  batchDeleteBanners,
  batchUpdateBannerStatus,
  createBanner,
  deleteBanner,
  getBannerList,
  updateBanner,
  updateBannerSortWeight,
  updateBannerStatus
});
