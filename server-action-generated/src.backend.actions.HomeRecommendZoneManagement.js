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

// src/backend/actions/HomeRecommendZoneManagement.ts
var HomeRecommendZoneManagement_exports = {};
__export(HomeRecommendZoneManagement_exports, {
  batchUpdateZoneSortWeight: () => batchUpdateZoneSortWeight,
  createRecommendZone: () => createRecommendZone,
  deleteRecommendZone: () => deleteRecommendZone,
  duplicateRecommendZone: () => duplicateRecommendZone,
  getRecommendZoneDetail: () => getRecommendZoneDetail,
  getRecommendZoneList: () => getRecommendZoneList,
  getSelectableCategories: () => getSelectableCategories,
  getSelectableProducts: () => getSelectableProducts,
  updateRecommendZone: () => updateRecommendZone,
  updateRecommendZoneStatus: () => updateRecommendZoneStatus
});
module.exports = __toCommonJS(HomeRecommendZoneManagement_exports);
var import_prisma2 = __toESM(require_prisma());
var import_action_utils = __toESM(require_action_utils());

// src/backend/actions/homeRecommendZoneCache.ts
var import_prisma = __toESM(require_prisma());
var cachedZones = null;
function invalidateHomeRecommendZoneCache() {
  cachedZones = null;
}

// src/backend/actions/HomeRecommendZoneManagement.ts
var sanitizeZoneConfig = (input) => {
  const title = input.title.trim();
  if (!title) throw new Error("\u4E13\u533A\u6807\u9898\u4E0D\u80FD\u4E3A\u7A7A");
  if (![3, 4, 5].includes(input.pcCols)) {
    throw new Error("PC\u7AEF\u5217\u6570\u4EC5\u652F\u6301 3\u30014\u30015 \u5217");
  }
  if (![1, 2].includes(input.mobileCols)) {
    throw new Error("\u624B\u673A\u7AEF\u5217\u6570\u4EC5\u652F\u6301 1\u30012 \u5217");
  }
  const sortWeight = Number.isFinite(input.sortWeight) ? input.sortWeight : 0;
  const uniqueItems = /* @__PURE__ */ new Map();
  input.items.forEach((item, index) => {
    if (!item.entityId) {
      throw new Error(`\u7B2C ${index + 1} \u6761\u5185\u5BB9\u7F3A\u5C11\u5B9E\u4F53ID`);
    }
    if (!uniqueItems.has(item.entityId)) {
      uniqueItems.set(item.entityId, {
        entityId: item.entityId,
        sortWeight: Number.isFinite(item.sortWeight) ? item.sortWeight : 0
      });
    }
  });
  return {
    title,
    zoneType: input.zoneType,
    pcCols: input.pcCols,
    mobileCols: input.mobileCols,
    sortWeight,
    isActive: input.isActive,
    collectionName: input.zoneType === "PRODUCT" ? input.collectionName?.trim() || "" : "",
    items: Array.from(uniqueItems.values())
  };
};
async function assertSelectableEntities(zoneType, items) {
  if (items.length === 0) {
    return;
  }
  const entityIds = items.map((item) => item.entityId);
  if (zoneType === "PRODUCT") {
    const count2 = await import_prisma2.default.product.count({
      where: {
        id: { in: entityIds },
        status: "ACTIVE",
        category: {
          status: "ACTIVE"
        }
      }
    });
    if (count2 !== entityIds.length) {
      throw new Error("\u6240\u9009\u5546\u54C1\u4E2D\u5305\u542B\u672A\u4E0A\u67B6\u6216\u6240\u5C5E\u5206\u7C7B\u672A\u542F\u7528\u7684\u5546\u54C1\uFF0C\u8BF7\u5237\u65B0\u540E\u91CD\u8BD5");
    }
    return;
  }
  const count = await import_prisma2.default.category.count({
    where: {
      id: { in: entityIds },
      status: "ACTIVE"
    }
  });
  if (count !== entityIds.length) {
    throw new Error("\u6240\u9009\u7C7B\u76EE\u4E2D\u5305\u542B\u672A\u542F\u7528\u7C7B\u76EE\uFF0C\u8BF7\u5237\u65B0\u540E\u91CD\u8BD5");
  }
}
var getRecommendZoneList = (0, import_action_utils.requireRole)([import_action_utils.UserRole.ADMIN])(
  (0, import_action_utils.withResult)(async (input) => {
    const page = input.page || 1;
    const pageSize = input.pageSize || 20;
    const skip = (page - 1) * pageSize;
    const whereClause = {};
    if (input.keyword) {
      whereClause.title = { contains: input.keyword };
    }
    const [total, list] = await import_prisma2.default.$transaction([
      import_prisma2.default.homeRecommendZone.count({ where: whereClause }),
      import_prisma2.default.homeRecommendZone.findMany({
        where: whereClause,
        include: {
          _count: {
            select: {
              items: true
            }
          }
        },
        orderBy: { sortWeight: "desc" },
        skip,
        take: pageSize
      })
    ]);
    return {
      total,
      list: list.map((item) => ({
        id: item.id,
        title: item.title,
        zoneType: item.zoneType,
        pcCols: item.pcCols,
        mobileCols: item.mobileCols,
        sortWeight: item.sortWeight,
        isActive: item.isActive,
        boundCollectionId: item.boundCollectionId,
        isBoundCollection: !!item.boundCollectionId,
        itemCount: item._count.items,
        createdAt: item.createdAt.toISOString(),
        updatedAt: item.updatedAt.toISOString()
      }))
    };
  })
);
var getRecommendZoneDetail = (0, import_action_utils.requireRole)([import_action_utils.UserRole.ADMIN])(
  (0, import_action_utils.withResult)(async (id) => {
    const zone = await import_prisma2.default.homeRecommendZone.findUnique({
      where: { id },
      include: {
        boundCollection: true,
        items: {
          orderBy: [
            { sortWeight: "desc" },
            { createdAt: "asc" }
          ],
          include: {
            product: true,
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
    if (!zone) {
      throw new Error("\u8BE5\u63A8\u8350\u4E13\u533A\u4E0D\u5B58\u5728");
    }
    const detailItems = zone.items.map((item) => {
      if (zone.zoneType === "PRODUCT" && item.product) {
        return {
          id: item.product.id,
          entityId: item.product.id,
          name: item.product.name,
          codeOrSku: item.product.productCode,
          imageUrl: item.product.mainImageUrl,
          status: item.product.status,
          sortWeight: item.sortWeight
        };
      } else if (zone.zoneType === "CATEGORY" && item.category) {
        return {
          id: item.category.id,
          entityId: item.category.id,
          name: item.category.name,
          codeOrSku: item.category.slug || "-",
          imageUrl: item.category.imageUrl,
          status: item.category.status,
          sortWeight: item.sortWeight
        };
      } else if (zone.zoneType === "SIDE_NAV" && item.category) {
        return {
          id: item.category.id,
          entityId: item.category.id,
          name: item.category.name,
          codeOrSku: item.category.slug || "-",
          imageUrl: item.category.imageUrl,
          status: item.category.status,
          sortWeight: item.sortWeight,
          level: item.category.level,
          parentId: item.category.parentId,
          parentName: item.category.parent?.name || null,
          productCount: item.category._count.products
        };
      }
      throw new Error("\u4E13\u533A\u660E\u7EC6\u6570\u636E\u5F02\u5E38");
    });
    return {
      id: zone.id,
      title: zone.title,
      zoneType: zone.zoneType,
      pcCols: zone.pcCols,
      mobileCols: zone.mobileCols,
      sortWeight: zone.sortWeight,
      isActive: zone.isActive,
      boundCollectionId: zone.boundCollectionId,
      collectionName: zone.boundCollection?.name || "",
      items: detailItems
    };
  })
);
var createRecommendZone = (0, import_action_utils.requireRole)([import_action_utils.UserRole.ADMIN])(
  (0, import_action_utils.withResult)(async (input) => {
    const payload = sanitizeZoneConfig(input);
    await assertSelectableEntities(payload.zoneType, payload.items);
    await import_prisma2.default.$transaction(async (tx) => {
      const zone = await tx.homeRecommendZone.create({
        data: {
          title: payload.title,
          zoneType: payload.zoneType,
          pcCols: payload.pcCols,
          mobileCols: payload.mobileCols,
          sortWeight: payload.sortWeight,
          isActive: payload.isActive
        }
      });
      if (payload.items.length > 0) {
        const isSideNavZone = payload.zoneType === "SIDE_NAV";
        const itemData = payload.items.map((i) => ({
          zoneId: zone.id,
          entityType: payload.zoneType,
          productId: payload.zoneType === "PRODUCT" ? i.entityId : null,
          categoryId: isSideNavZone || payload.zoneType === "CATEGORY" ? i.entityId : null,
          sortWeight: i.sortWeight
        }));
        await tx.homeRecommendZoneItem.createMany({ data: itemData });
      }
      if (payload.zoneType === "PRODUCT" && payload.collectionName) {
        const collection = await tx.homeRecommendCollection.create({
          data: {
            name: payload.collectionName,
            sourceZoneId: zone.id,
            isActive: true
          }
        });
        if (payload.items.length > 0) {
          const colItems = payload.items.map((i) => ({
            collectionId: collection.id,
            productId: i.entityId,
            sortWeight: i.sortWeight
          }));
          await tx.homeRecommendCollectionItem.createMany({ data: colItems });
        }
        await tx.homeRecommendZone.update({
          where: { id: zone.id },
          data: { boundCollectionId: collection.id }
        });
      }
    });
    invalidateHomeRecommendZoneCache();
  })
);
var updateRecommendZone = (0, import_action_utils.requireRole)([import_action_utils.UserRole.ADMIN])(
  (0, import_action_utils.withResult)(async (input) => {
    if (!input.id) throw new Error("\u7F3A\u5C11\u4E13\u533AID");
    const payload = sanitizeZoneConfig(input);
    await assertSelectableEntities(payload.zoneType, payload.items);
    await import_prisma2.default.$transaction(async (tx) => {
      const zone = await tx.homeRecommendZone.findUnique({
        where: { id: input.id },
        include: { boundCollection: true }
      });
      if (!zone) throw new Error("\u4E13\u533A\u4E0D\u5B58\u5728");
      await tx.homeRecommendZone.update({
        where: { id: input.id },
        data: {
          title: payload.title,
          zoneType: payload.zoneType,
          pcCols: payload.pcCols,
          mobileCols: payload.mobileCols,
          sortWeight: payload.sortWeight,
          isActive: payload.isActive
        }
      });
      await tx.homeRecommendZoneItem.deleteMany({ where: { zoneId: input.id } });
      if (payload.items.length > 0) {
        const isSideNavZone = payload.zoneType === "SIDE_NAV";
        const itemData = payload.items.map((i) => ({
          zoneId: input.id,
          entityType: payload.zoneType,
          productId: payload.zoneType === "PRODUCT" ? i.entityId : null,
          categoryId: isSideNavZone || payload.zoneType === "CATEGORY" ? i.entityId : null,
          sortWeight: i.sortWeight
        }));
        await tx.homeRecommendZoneItem.createMany({ data: itemData });
      }
      if (payload.zoneType === "PRODUCT") {
        const wantCollection = !!payload.collectionName;
        if (wantCollection) {
          if (zone.boundCollectionId) {
            await tx.homeRecommendCollection.update({
              where: { id: zone.boundCollectionId },
              data: { name: payload.collectionName }
            });
            await tx.homeRecommendCollectionItem.deleteMany({ where: { collectionId: zone.boundCollectionId } });
            if (payload.items.length > 0) {
              await tx.homeRecommendCollectionItem.createMany({
                data: payload.items.map((i) => ({
                  collectionId: zone.boundCollectionId,
                  productId: i.entityId,
                  sortWeight: i.sortWeight
                }))
              });
            }
          } else {
            const collection = await tx.homeRecommendCollection.create({
              data: {
                name: payload.collectionName,
                sourceZoneId: zone.id,
                isActive: true
              }
            });
            if (payload.items.length > 0) {
              await tx.homeRecommendCollectionItem.createMany({
                data: payload.items.map((i) => ({
                  collectionId: collection.id,
                  productId: i.entityId,
                  sortWeight: i.sortWeight
                }))
              });
            }
            await tx.homeRecommendZone.update({
              where: { id: zone.id },
              data: { boundCollectionId: collection.id }
            });
          }
        } else if (zone.boundCollectionId) {
          await tx.homeRecommendZone.update({
            where: { id: zone.id },
            data: { boundCollectionId: null }
          });
        }
      } else if (zone.boundCollectionId) {
        await tx.homeRecommendZone.update({
          where: { id: zone.id },
          data: { boundCollectionId: null }
        });
      }
    });
    invalidateHomeRecommendZoneCache();
  })
);
var duplicateRecommendZone = (0, import_action_utils.requireRole)([import_action_utils.UserRole.ADMIN])(
  (0, import_action_utils.withResult)(async (input) => {
    const zone = await import_prisma2.default.homeRecommendZone.findUnique({
      where: { id: input.id },
      include: {
        boundCollection: true,
        items: {
          orderBy: [{ sortWeight: "desc" }, { createdAt: "asc" }]
        }
      }
    });
    if (!zone) {
      throw new Error("\u8BE5\u63A8\u8350\u4E13\u533A\u4E0D\u5B58\u5728");
    }
    const nextTitle = `${zone.title} (\u590D\u5236)`;
    await import_prisma2.default.$transaction(async (tx) => {
      const duplicatedZone = await tx.homeRecommendZone.create({
        data: {
          title: nextTitle,
          zoneType: zone.zoneType,
          pcCols: zone.pcCols,
          mobileCols: zone.mobileCols,
          sortWeight: zone.sortWeight,
          isActive: zone.isActive
        }
      });
      if (zone.items.length > 0) {
        await tx.homeRecommendZoneItem.createMany({
          data: zone.items.map((item) => ({
            zoneId: duplicatedZone.id,
            entityType: item.entityType,
            productId: item.productId,
            categoryId: item.categoryId,
            sortWeight: item.sortWeight
          }))
        });
      }
      if (zone.zoneType === "PRODUCT" && zone.boundCollection && zone.items.length > 0) {
        const duplicatedCollection = await tx.homeRecommendCollection.create({
          data: {
            name: `${zone.boundCollection.name} (\u590D\u5236)`,
            sourceZoneId: duplicatedZone.id,
            isActive: zone.boundCollection.isActive
          }
        });
        await tx.homeRecommendCollectionItem.createMany({
          data: zone.items.filter((item) => item.productId).map((item) => ({
            collectionId: duplicatedCollection.id,
            productId: item.productId,
            sortWeight: item.sortWeight
          }))
        });
        await tx.homeRecommendZone.update({
          where: { id: duplicatedZone.id },
          data: { boundCollectionId: duplicatedCollection.id }
        });
      }
    });
    invalidateHomeRecommendZoneCache();
  })
);
var deleteRecommendZone = (0, import_action_utils.requireRole)([import_action_utils.UserRole.ADMIN])(
  (0, import_action_utils.withResult)(async (id) => {
    await import_prisma2.default.$transaction(async (tx) => {
      await tx.homeRecommendZone.update({
        where: { id },
        data: { boundCollectionId: null }
      });
      await tx.homeRecommendZoneItem.deleteMany({
        where: { zoneId: id }
      });
      await tx.homeRecommendZone.delete({
        where: { id }
      });
    });
    invalidateHomeRecommendZoneCache();
  })
);
var updateRecommendZoneStatus = (0, import_action_utils.requireRole)([import_action_utils.UserRole.ADMIN])(
  (0, import_action_utils.withResult)(async (id, isActive) => {
    await import_prisma2.default.homeRecommendZone.update({
      where: { id },
      data: { isActive }
    });
    invalidateHomeRecommendZoneCache();
  })
);
var batchUpdateZoneSortWeight = (0, import_action_utils.requireRole)([import_action_utils.UserRole.ADMIN])(
  (0, import_action_utils.withResult)(async (input) => {
    if (!input.updates || input.updates.length === 0) return;
    await import_prisma2.default.$transaction(
      input.updates.map(
        (u) => import_prisma2.default.homeRecommendZone.update({
          where: { id: u.id },
          data: { sortWeight: u.sortWeight }
        })
      )
    );
    invalidateHomeRecommendZoneCache();
  })
);
var getSelectableProducts = (0, import_action_utils.requireRole)([import_action_utils.UserRole.ADMIN])(
  (0, import_action_utils.withResult)(async (input) => {
    const page = input.page || 1;
    const pageSize = input.pageSize || 10;
    const skip = (page - 1) * pageSize;
    const whereClause = {
      status: "ACTIVE",
      category: {
        status: "ACTIVE"
      }
    };
    if (input.keyword) {
      whereClause.OR = [
        { name: { contains: input.keyword } },
        { productCode: { contains: input.keyword } }
      ];
    }
    if (input.categoryId) {
      whereClause.categoryId = input.categoryId;
    }
    const [total, products] = await import_prisma2.default.$transaction([
      import_prisma2.default.product.count({ where: whereClause }),
      import_prisma2.default.product.findMany({
        where: whereClause,
        skip,
        take: pageSize,
        orderBy: { sortWeight: "desc" },
        include: {
          category: { select: { name: true } },
          skus: {
            select: { price: true },
            orderBy: { price: "asc" },
            take: 1
          }
        }
      })
    ]);
    return {
      total,
      list: products.map((p) => ({
        id: p.id,
        name: p.name,
        productCode: p.productCode,
        mainImageUrl: p.mainImageUrl,
        categoryName: p.category.name,
        price: p.skus[0]?.price?.toNumber() || 0
      }))
    };
  })
);
var getSelectableCategories = (0, import_action_utils.requireRole)([import_action_utils.UserRole.ADMIN])(
  (0, import_action_utils.withResult)(async (input) => {
    const page = input.page || 1;
    const pageSize = input.pageSize || 10;
    const skip = (page - 1) * pageSize;
    const whereClause = {
      status: "ACTIVE"
    };
    if (input.keyword) {
      whereClause.name = { contains: input.keyword };
    }
    const [total, categories] = await import_prisma2.default.$transaction([
      import_prisma2.default.category.count({ where: whereClause }),
      import_prisma2.default.category.findMany({
        where: whereClause,
        skip,
        take: pageSize,
        orderBy: { sortWeight: "desc" },
        include: {
          parent: { select: { name: true } }
        }
      })
    ]);
    return {
      total,
      list: categories.map((c) => ({
        id: c.id,
        name: c.name,
        level: c.level,
        imageUrl: c.imageUrl,
        parentName: c.parent?.name || null
      }))
    };
  })
);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  batchUpdateZoneSortWeight,
  createRecommendZone,
  deleteRecommendZone,
  duplicateRecommendZone,
  getRecommendZoneDetail,
  getRecommendZoneList,
  getSelectableCategories,
  getSelectableProducts,
  updateRecommendZone,
  updateRecommendZoneStatus
});
