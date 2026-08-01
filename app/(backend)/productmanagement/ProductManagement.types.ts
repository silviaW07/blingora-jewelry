'use server'

// ===== Enums =====
/** 商品状态：草稿(DRAFT) | 上架(ACTIVE) | 下架(INACTIVE) */
export type ProductStatus = 'DRAFT' | 'ACTIVE' | 'INACTIVE'

/** 来源标识：手动(MANUAL) | 1688导入(IMPORT_1688) */
export type ProductSource = 'MANUAL' | 'IMPORT_1688'

/** 库存状态：有货(IN_STOCK) | 库存不足(LOW_STOCK) | 缺货(OUT_OF_STOCK) */
export type StockStatus = 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK'

/** 购物车条目状态：有效(VALID) | 无效(INVALID) */
export type CartItemStatus = 'VALID' | 'INVALID'

// ===== Data Structures (JSON Interfaces) =====
export interface GalleryItem {
  url: string;
  sort: number;
}
export interface SellingPointItem {
  title: string;
  content: string;
}
export interface DetailContentItem {
  type: 'text' | 'image';
  content: string;
  title?: string;
}
export interface ParameterGroup {
  group: string;
  items: { key: string; value: string }[];
}
export interface TradeInfo {
  shipFrom?: string;
  deliveryDays?: number;
  minOrderQty?: number;
  supportedRegions?: string[];
  shippingNote?: string;
  tradeNotice?: string;
}
export interface FaqItem {
  question: string;
  answer: string;
}
export interface SkuAttribute {
  name: string;
  value: string;
}

// ===== Data Structures (Entities) =====
export interface SkuItem {
  sku_id?: string;                        // data-from: productsku-id (编辑必传，新建不传)
  sku_code: string;                       // data-from: productsku-skuCode
  image_url?: string | null;              // data-from: productsku-imageUrl
  price: number;                          // data-from: productsku-price
  original_price?: number | null;         // data-from: productsku-originalPrice
  stock: number;                          // data-from: productsku-stock
  attribute_json: SkuAttribute[];         // data-from: productsku-attributeJson
  delivery_days?: number | null;          // data-from: productsku-deliveryDays
  weight_kg?: number | null;              // data-from: productsku-weightKg
  volume_m3?: number | null;              // data-from: productsku-volumeM3
}

export interface ProductListItem {
  product_id: string;                     // data-from: product-id
  product_name: string;                   // data-from: product-name
  sku_code_base: string;                  // data-from: product-productCode
  source: ProductSource;                  // data-from: product-source
  category_name: string;                  // data-from: category-name
  price_min: number;                      // aggregated
  price_max: number;                      // aggregated
  total_stock: number;                    // aggregated
  status: ProductStatus;                  // data-from: product-status
  created_at: string;                     // data-from: product-createdAt
  updated_at: string;                     // data-from: product-updatedAt
}

export interface CategoryOption {
  category_id: string;                    // data-from: category-id
  category_name: string;                  // data-from: category-name
}

export interface ProductDetail {
  product_id: string;                     // data-from: product-id
  category_id: string;                    // data-from: product-categoryId
  name: string;                           // data-from: product-name
  product_code: string;                   // data-from: product-productCode
  source: ProductSource;                  // data-from: product-source
  status: ProductStatus;                  // data-from: product-status
  main_image_url: string;                 // data-from: product-mainImageUrl
  gallery_json: GalleryItem[];            // data-from: product-galleryJson
  short_description: string | null;       // data-from: product-shortDescription
  selling_points_json: SellingPointItem[] | null; // data-from: product-sellingPointsJson
  detail_content_json: DetailContentItem[] | null;// data-from: product-detailContentJson
  parameter_json: ParameterGroup[] | null;// data-from: product-parameterJson
  trade_info_json: TradeInfo | null;      // data-from: product-tradeInfoJson
  faq_json: FaqItem[] | null;             // data-from: product-faqJson
  skus: SkuItem[];                        // data-from: productsku
}

// ===== Input / Output =====
export interface GetProductListInput {
  keyword?: string;
  category_id?: string;
  status?: ProductStatus | ProductStatus[];
  page?: number;
  page_size?: number;
}
export interface GetProductListOutput {
  list: ProductListItem[];
  total: number;
}

export interface CreateProductInput {
  category_id: string;
  name: string;
  main_image_url: string;
  short_description?: string;
  gallery_json?: GalleryItem[];
  selling_points_json?: SellingPointItem[];
  detail_content_json?: DetailContentItem[];
  parameter_json?: ParameterGroup[];
  trade_info_json?: TradeInfo;
  faq_json?: FaqItem[];
  skus: SkuItem[];
  submit_action: 'DRAFT' | 'ACTIVE';
}
export interface CreateProductOutput {
  product_id: string;
}

export interface UpdateProductInput extends CreateProductInput {
  product_id: string;
}
export interface UpdateProductOutput {
  success: boolean;
}

export interface UpdateProductStatusInput {
  product_id: string;
  target_status: ProductStatus;
}
export interface UpdateProductStatusOutput {
  success: boolean;
}

export interface BatchOperateOutput {
  success_count: number;
  fail_count: number;
}

// ===== Imports =====
import prisma from '@/tools/prisma'
import {
  requireAuth, requireRole, getAuthContext, tryGetAuthContext,
  withResult, hashPassword, signToken, UserRole
} from '@/backend/action_utils'

// ===== Helpers =====

/**
 * 重新判定并刷新购物车条目有效性
 */
async function syncCartItemsValidState(tx: any, productId: string) {
  const items = await tx.cartitem.findMany({
    where: { productId },
    include: {
      product: { select: { status: true, category: { select: { status: true } } } },
      productSku: { select: { stock: true } }
    }
  });

  for (const item of items) {
    const isValid = item.product.status === 'ACTIVE'
      && item.product.category.status === 'ACTIVE'
      && item.productSku.stock >= item.quantity;

    const targetStatus: CartItemStatus = isValid ? 'VALID' : 'INVALID';
    if (item.status !== targetStatus) {
      await tx.cartitem.update({
        where: { id: item.id },
        data: { status: targetStatus }
      });
    }
  }
}

/**
 * 上架前置业务校验
 */
function validateActivePreconditions(product: Omit<CreateProductInput, 'submit_action'>) {
  if (!product.name || product.name.trim() === '') {
    throw new Error('商品名称不能为空');
  }
  if (!product.main_image_url && (!product.gallery_json || product.gallery_json.length === 0)) {
    throw new Error('至少存在1个有效图片URL方可上架');
  }
  if (!product.skus || product.skus.length === 0) {
    throw new Error('商品至少存在1个SKU才能上架');
  }
  const hasInvalidSku = product.skus.some(sku => sku.price <= 0 || sku.stock < 0);
  if (hasInvalidSku) {
    throw new Error('每个可售SKU必须有有效价格且库存不能为负数');
  }
  if (!product.short_description && (!product.detail_content_json || product.detail_content_json.length === 0)) {
    throw new Error('商品必须包含基础描述内容');
  }
}

/**
 * 生成系统内部唯一编码
 */
function generateUniqueCode(prefix: string): string {
  return prefix + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substring(2, 6).toUpperCase();
}

/**
 * 根据 stock 判定 stockStatus
 */
function getStockStatus(stock: number): 'OUT_OF_STOCK' | 'IN_STOCK' {
  return stock <= 0 ? 'OUT_OF_STOCK' : 'IN_STOCK';
}

// ===== Actions =====

/**
 * 获取分类下拉选项
 */
export const getCategoryOptions = requireRole([UserRole.ADMIN])(
  withResult(async (): Promise<CategoryOption[]> => {
    const categories = await prisma.category.findMany({
      orderBy: { sortWeight: 'desc' },
      select: { id: true, name: true }
    });
    return categories.map(c => ({
      category_id: c.id,
      category_name: c.name
    }));
  })
)

/**
 * 获取商品列表 (带搜索、筛选、分页)
 */
export const getProductList = requireRole([UserRole.ADMIN])(
  withResult(async (input: GetProductListInput): Promise<GetProductListOutput> => {
    const { keyword, category_id, status, page = 1, page_size = 20 } = input;
    
    const whereClause: any = {};
    if (keyword) {
      whereClause.name = { contains: keyword };
    }
    if (category_id) {
      whereClause.categoryId = category_id;
    }
    if (status) {
      if (Array.isArray(status)) {
        whereClause.status = { in: status.map(s => s.toUpperCase()) };
      } else {
        whereClause.status = status.toUpperCase();
      }
    }

    const skip = (page - 1) * page_size;
    
    const [total, products] = await Promise.all([
      prisma.product.count({ where: whereClause }),
      prisma.product.findMany({
        where: whereClause,
        skip,
        take: page_size,
        orderBy: { createdAt: 'desc' },
        include: {
          category: { select: { name: true } },
          skus: { select: { price: true, stock: true } }
        }
      })
    ]);

    const list = products.map(p => {
      const prices = p.skus.map(s => s.price.toNumber());
      const priceMin = prices.length > 0 ? Math.min(...prices) : 0;
      const priceMax = prices.length > 0 ? Math.max(...prices) : 0;
      const totalStock = p.skus.reduce((sum, s) => sum + s.stock, 0);

      return {
        product_id: p.id,
        product_name: p.name,
        sku_code_base: p.productCode,
        source: p.source as ProductSource,
        category_name: p.category?.name || '--',
        price_min: priceMin,
        price_max: priceMax,
        total_stock: totalStock,
        status: p.status as ProductStatus,
        created_at: p.createdAt.toISOString(),
        updated_at: p.updatedAt.toISOString(),
      };
    });

    return { list, total };
  })
)

/**
 * 获取商品详情 (含 SKU 回填)
 */
export const getProductDetail = requireRole([UserRole.ADMIN])(
  withResult(async (product_id: string): Promise<ProductDetail> => {
    const p = await prisma.product.findUnique({
      where: { id: product_id },
      include: { skus: true }
    });

    if (!p) throw new Error('商品不存在');

    return {
      product_id: p.id,
      category_id: p.categoryId,
      name: p.name,
      product_code: p.productCode,
      source: p.source as ProductSource,
      status: p.status as ProductStatus,
      main_image_url: p.mainImageUrl,
      gallery_json: (p.galleryJson as any) || [],
      short_description: p.shortDescription,
      selling_points_json: p.sellingPointsJson as any,
      detail_content_json: p.detailContentJson as any,
      parameter_json: p.parameterJson as any,
      trade_info_json: p.tradeInfoJson as any,
      faq_json: p.faqJson as any,
      skus: p.skus.map(s => ({
        sku_id: s.id,
        sku_code: s.skuCode,
        image_url: s.imageUrl,
        price: s.price.toNumber(),
        original_price: s.originalPrice?.toNumber(),
        stock: s.stock,
        attribute_json: (s.attributeJson as any) || [],
        delivery_days: s.deliveryDays,
        weight_kg: s.weightKg?.toNumber(),
        volume_m3: s.volumeM3?.toNumber(),
      }))
    };
  })
)

/**
 * 新增商品
 */
export const createProduct = requireRole([UserRole.ADMIN])(
  withResult(async (input: CreateProductInput): Promise<CreateProductOutput> => {
    if (input.submit_action === 'ACTIVE') {
      validateActivePreconditions(input);
    }

    const targetStatus: ProductStatus = input.submit_action;
    const baseCode = generateUniqueCode('P');
    
    const result = await prisma.$transaction(async (tx) => {
      const product = await tx.product.create({
        data: {
          name: input.name,
          slug: baseCode,
          productCode: baseCode,
          source: 'MANUAL',
          status: targetStatus,
          mainImageUrl: input.main_image_url || '',
          galleryJson: (input.gallery_json as any) || [],
          shortDescription: input.short_description || null,
          sellingPointsJson: (input.selling_points_json as any) || null,
          detailContentJson: (input.detail_content_json as any) || null,
          parameterJson: (input.parameter_json as any) || null,
          tradeInfoJson: (input.trade_info_json as any) || null,
          faqJson: (input.faq_json as any) || null,
          category: { connect: { id: input.category_id } },
          skus: {
            create: input.skus.map(s => ({
              skuCode: s.sku_code || generateUniqueCode('SKU'),
              imageUrl: s.image_url || null,
              price: s.price,
              originalPrice: s.original_price || null,
              stock: s.stock,
              stockStatus: getStockStatus(s.stock),
              attributeJson: (s.attribute_json as any) || [],
              deliveryDays: s.delivery_days || null,
              weightKg: s.weight_kg || null,
              volumeM3: s.volume_m3 || null,
            }))
          }
        }
      });
      return product;
    });

    return { product_id: result.id };
  })
)

/**
 * 编辑商品
 */
export const updateProduct = requireRole([UserRole.ADMIN])(
  withResult(async (input: UpdateProductInput): Promise<UpdateProductOutput> => {
    if (input.submit_action === 'ACTIVE') {
      validateActivePreconditions(input);
    }

    await prisma.$transaction(async (tx) => {
      // 1. 更新商品主体
      await tx.product.update({
        where: { id: input.product_id },
        data: {
          name: input.name,
          status: input.submit_action,
          mainImageUrl: input.main_image_url || '',
          galleryJson: (input.gallery_json as any) || [],
          shortDescription: input.short_description || null,
          sellingPointsJson: (input.selling_points_json as any) || null,
          detailContentJson: (input.detail_content_json as any) || null,
          parameterJson: (input.parameter_json as any) || null,
          tradeInfoJson: (input.trade_info_json as any) || null,
          faqJson: (input.faq_json as any) || null,
          category: { connect: { id: input.category_id } },
        }
      });

      // 2. 找出当前数据库里的 SKU
      const existingSkus = await tx.productsku.findMany({
        where: { productId: input.product_id },
        select: { id: true }
      });
      const existingSkuIds = existingSkus.map(s => s.id);
      const incomingSkuIds = input.skus.filter(s => s.sku_id).map(s => s.sku_id!);

      // 需要删除的 SKU
      const skusToDelete = existingSkuIds.filter(id => !incomingSkuIds.includes(id));
      if (skusToDelete.length > 0) {
        // 删除关联的 cartitem，防止外键约束报错
        await tx.cartitem.deleteMany({
          where: { productSkuId: { in: skusToDelete } }
        });
        await tx.productsku.deleteMany({
          where: { id: { in: skusToDelete } }
        });
      }

      // 需要更新和新建的 SKU
      for (const sku of input.skus) {
        const skuData = {
          skuCode: sku.sku_code || generateUniqueCode('SKU'),
          imageUrl: sku.image_url || null,
          price: sku.price,
          originalPrice: sku.original_price || null,
          stock: sku.stock,
          stockStatus: getStockStatus(sku.stock),
          attributeJson: (sku.attribute_json as any) || [],
          deliveryDays: sku.delivery_days || null,
          weightKg: sku.weight_kg || null,
          volumeM3: sku.volume_m3 || null,
        };

        if (sku.sku_id && existingSkuIds.includes(sku.sku_id)) {
          await tx.productsku.update({
            where: { id: sku.sku_id },
            data: skuData
          });
        } else {
          await tx.productsku.create({
            data: {
              ...skuData,
              product: { connect: { id: input.product_id } }
            }
          });
        }
      }

      // 3. 刷新购物车条目状态
      await syncCartItemsValidState(tx, input.product_id);
    });

    return { success: true };
  })
)

/**
 * 切换商品状态 (单条)
 */
export const updateProductStatus = requireRole([UserRole.ADMIN])(
  withResult(async (input: UpdateProductStatusInput): Promise<UpdateProductStatusOutput> => {
    const { product_id, target_status } = input;
    
    await prisma.$transaction(async (tx) => {
      const product = await tx.product.findUnique({
        where: { id: product_id },
        include: { skus: true }
      });
      
      if (!product) throw new Error('商品不存在');

      if (target_status === 'ACTIVE') {
        // 模拟组装一个用于校验的结构
        validateActivePreconditions({
          category_id: product.categoryId,
          name: product.name,
          main_image_url: product.mainImageUrl,
          gallery_json: product.galleryJson as any,
          short_description: product.shortDescription || undefined,
          detail_content_json: product.detailContentJson as any,
          skus: product.skus.map(s => ({
            sku_code: s.skuCode,
            price: s.price.toNumber(),
            stock: s.stock,
            attribute_json: []
          }))
        });
      } else if (target_status === 'DRAFT') {
        if (product.status === 'ACTIVE' || product.status === 'INACTIVE') {
          throw new Error('不能将已上架或已下架的商品转为草稿');
        }
      }

      await tx.product.update({
        where: { id: product_id },
        data: { status: target_status }
      });

      await syncCartItemsValidState(tx, product_id);
    });

    return { success: true };
  })
)

/**
 * 批量切换商品状态
 */
export const batchUpdateProductStatus = requireRole([UserRole.ADMIN])(
  withResult(async (product_ids: string[], target_status: ProductStatus): Promise<BatchOperateOutput> => {
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
)

/**
 * 删除商品 (单条)
 */
export const deleteProduct = requireRole([UserRole.ADMIN])(
  withResult(async (product_id: string): Promise<UpdateProductStatusOutput> => {
    await prisma.$transaction(async (tx) => {
      // 检查是否有业务引用
      const cartRef = await tx.cartitem.count({ where: { productId: product_id } });
      const taskRef = await tx.importtaskitem.count({ where: { importedProductId: product_id } });

      if (cartRef > 0 || taskRef > 0) {
        // 存在引用，执行逻辑删除语义 (置为 INACTIVE 并级联处理购物车)
        await tx.product.update({
          where: { id: product_id },
          data: { status: 'INACTIVE' }
        });
        await tx.cartitem.updateMany({
          where: { productId: product_id },
          data: { status: 'INVALID' }
        });
      } else {
        // 无引用，彻底清理 SKU 然后删除
        await tx.productsku.deleteMany({ where: { productId: product_id } });
        await tx.product.delete({ where: { id: product_id } });
      }
    });

    return { success: true };
  })
)

/**
 * 批量删除商品
 */
export const batchDeleteProduct = requireRole([UserRole.ADMIN])(
  withResult(async (product_ids: string[]): Promise<BatchOperateOutput> => {
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
)
