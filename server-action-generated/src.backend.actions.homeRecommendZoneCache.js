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

// src/backend/actions/homeRecommendZoneCache.ts
var homeRecommendZoneCache_exports = {};
__export(homeRecommendZoneCache_exports, {
  HOME_RECOMMEND_ZONE_CACHE_TAG: () => HOME_RECOMMEND_ZONE_CACHE_TAG,
  invalidateHomeRecommendZoneCache: () => invalidateHomeRecommendZoneCache,
  readHomeRecommendZonesWithCache: () => readHomeRecommendZonesWithCache
});
module.exports = __toCommonJS(homeRecommendZoneCache_exports);
var import_prisma = __toESM(require_prisma());
var HOME_RECOMMEND_ZONE_CACHE_TAG = "home-recommend-zones";
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
function invalidateHomeRecommendZoneCache() {
  cachedZones = null;
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  HOME_RECOMMEND_ZONE_CACHE_TAG,
  invalidateHomeRecommendZoneCache,
  readHomeRecommendZonesWithCache
});
