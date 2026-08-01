export type userrole = 'CUSTOMER' | 'ADMIN';

export type userstatus = 'ACTIVE' | 'DISABLED';

export type categorystatus = 'ACTIVE' | 'INACTIVE';

export type productstatus = 'DRAFT' | 'ACTIVE' | 'INACTIVE';

export type productsource = 'MANUAL' | 'IMPORT_1688';

export type stockstatus = 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK';

export type cartitemstatus = 'VALID' | 'INVALID';

export type importtaskstatus = 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';

export type sysuser_uniqueKey = {
  id: string; // Unique Key
};

export type sysuser_without_PKs = {
  account: string;
  password: string;
  email: string;
  role: userrole;
  status: userstatus;
  username: string;
  avatarUrl?: string | null;
  lastLoginAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type sysuser = sysuser_uniqueKey & sysuser_without_PKs;



export type category_uniqueKey = {
  id: string; // Unique Key
};

export type category_without_PKs = {
  name: string;
  slug: string;
  imageUrl?: string | null;
  description?: string | null;
  sortWeight: number; // 排序权重，数值越大越靠前
  status: categorystatus;
  createdAt: Date;
  updatedAt: Date;
};

export type category = category_uniqueKey & category_without_PKs;



export type product_uniqueKey = {
  id: string; // Unique Key
};

export type product_without_PKs = {
  categoryId: string; // Foreign Key to category.id
  name: string;
  slug: string;
  productCode: string;
  source: productsource;
  status: productstatus;
  mainImageUrl: string;
  galleryJson: any; // 商品相册，格式：[{ "url": "图片URL", "sort": 1 }]
  shortDescription?: string | null;
  sellingPointsJson?: any | null; // 商品卖点，格式：[{ "title": "卖点标题", "content": "卖点内容" }]
  detailContentJson?: any | null; // 图文详情，格式：[{ "type": "text|image", "content": "文本内容或图片URL", "title": "可选标题" }]
  parameterJson?: any | null; // 参数表，格式：[{ "group": "参数分组", "items": [{ "key": "参数名", "value": "参数值" }] }]
  tradeInfoJson?: any | null; // 物流与贸易说明，格式：{ "shipFrom": "发货地", "deliveryDays": 7, "minOrderQty": 1, "supportedRegions": ["US","EU"], "shippingNote": "运输说明", "tradeNotice": "注意事项" }
  faqJson?: any | null; // 常见购买问题，格式：[{ "question": "问题", "answer": "回答" }]
  ratingAverage: number; // 平均评分（X分，0-5）
  ratingCount: number; // 评价数量（X个）
  sortWeight: number; // 排序权重，数值越大越靠前
  createdAt: Date;
  updatedAt: Date;
};

export type product = product_uniqueKey & product_without_PKs;



export type productsku_uniqueKey = {
  id: string; // Unique Key
};

export type productsku_without_PKs = {
  productId: string; // Foreign Key to product.id
  skuCode: string;
  imageUrl?: string | null;
  price: number; // 售价（X元）
  originalPrice?: number | null; // 原价（X元）
  stock: number; // 库存（X个）
  stockStatus: stockstatus;
  attributeJson: any; // SKU规格属性，格式：[{ "name": "颜色", "value": "黑色" }, { "name": "尺寸", "value": "L" }]
  deliveryDays?: number | null; // 预计交期（X天）
  weightKg?: number | null; // 重量（X千克）
  volumeM3?: number | null; // 体积（X立方米）
  createdAt: Date;
  updatedAt: Date;
};

export type productsku = productsku_uniqueKey & productsku_without_PKs;



export type cart_uniqueKey = {
  id: string; // Unique Key
};

export type cart_without_PKs = {
  accountId: string; // Foreign Key to sysuser.id
  createdAt: Date;
  updatedAt: Date;
};

export type cart = cart_uniqueKey & cart_without_PKs;



export type cartitem_uniqueKey = {
  id: string; // Unique Key
};

export type cartitem_without_PKs = {
  cartId: string; // Foreign Key to cart.id
  productId: string; // Foreign Key to product.id
  productSkuId: string; // Foreign Key to productsku.id
  quantity: number; // 商品数量（X个）
  status: cartitemstatus;
  createdAt: Date;
  updatedAt: Date;
};

export type cartitem = cartitem_uniqueKey & cartitem_without_PKs;



export type importtask_uniqueKey = {
  id: string; // Unique Key
};

export type importtask_without_PKs = {
  creatorId: string; // Foreign Key to sysuser.id
  taskName: string;
  status: importtaskstatus;
  sourceLinkCount: number; // 来源链接数量（X条）
  successCount: number; // 成功数量（X条）
  failureCount: number; // 失败数量（X条）
  progressPercent: number; // 进度百分比（X%）
  markupRate?: number | null; // 加价比例（X%）
  defaultStatus: productstatus;
  defaultCategoryId?: string | null;
  stockStrategyJson?: any | null; // 默认库存策略，格式：{ "type": "fixed", "stock": 100 }
  createdAt: Date;
  updatedAt: Date;
};

export type importtask = importtask_uniqueKey & importtask_without_PKs;



export type importtaskitem_uniqueKey = {
  id: string; // Unique Key
};

export type importtaskitem_without_PKs = {
  importTaskId: string; // Foreign Key to importtask.id
  operatorId: string; // Foreign Key to sysuser.id
  sourceUrl: string;
  parsedName?: string | null;
  parsedMainImageUrl?: string | null;
  parsedPriceMin?: number | null; // 解析最低价（X元）
  parsedPriceMax?: number | null; // 解析最高价（X元）
  specSummaryJson?: any | null; // 规格摘要，格式：[{ "name": "颜色", "values": ["黑色","白色"] }]
  previewDataJson?: any | null; // 导入预览数据，格式：{ "name": "商品名", "categoryId": "分类ID", "price": 99.99, "mainImageUrl": "图片URL", "shortDescription": "简述" }
  isSelected: boolean;
  importedProductId?: string | null; // Foreign Key to product.id
  failureReason?: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type importtaskitem = importtaskitem_uniqueKey & importtaskitem_without_PKs;




export type StringFilter = {
  contains?: string;
  startsWith?: string;
  endsWith?: string;
  equals?: string;
  in?: string[];
  notIn?: string[];
  not?: string | StringFilter;
};

export type NumberFilter = {
  equals?: number;
  in?: number[];
  notIn?: number[];
  not?: number | NumberFilter;
  lt?: number;
  lte?: number;
  gt?: number;
  gte?: number;
};

export type DateFilter = {
  equals?: Date;
  in?: Date[];
  notIn?: Date[];
  not?: Date | DateFilter;
  lt?: Date;
  lte?: Date;
  gt?: Date;
  gte?: Date;
};

export type userroleFilter = {
  equals?: userrole;
  in?: userrole[];
  notIn?: userrole[];
  not?: userrole | userroleFilter;
};

export type userstatusFilter = {
  equals?: userstatus;
  in?: userstatus[];
  notIn?: userstatus[];
  not?: userstatus | userstatusFilter;
};

export type categorystatusFilter = {
  equals?: categorystatus;
  in?: categorystatus[];
  notIn?: categorystatus[];
  not?: categorystatus | categorystatusFilter;
};

export type productstatusFilter = {
  equals?: productstatus;
  in?: productstatus[];
  notIn?: productstatus[];
  not?: productstatus | productstatusFilter;
};

export type productsourceFilter = {
  equals?: productsource;
  in?: productsource[];
  notIn?: productsource[];
  not?: productsource | productsourceFilter;
};

export type stockstatusFilter = {
  equals?: stockstatus;
  in?: stockstatus[];
  notIn?: stockstatus[];
  not?: stockstatus | stockstatusFilter;
};

export type cartitemstatusFilter = {
  equals?: cartitemstatus;
  in?: cartitemstatus[];
  notIn?: cartitemstatus[];
  not?: cartitemstatus | cartitemstatusFilter;
};

export type importtaskstatusFilter = {
  equals?: importtaskstatus;
  in?: importtaskstatus[];
  notIn?: importtaskstatus[];
  not?: importtaskstatus | importtaskstatusFilter;
};

export type filtered_sysuser = {
  id?: string | StringFilter | null;
  account?: string | StringFilter | null;
  password?: string | StringFilter | null;
  email?: string | StringFilter | null;
  role?: userrole | userroleFilter | null;
  status?: userstatus | userstatusFilter | null;
  username?: string | StringFilter | null;
  avatarUrl?: string | StringFilter | null;
  lastLoginAt?: Date | DateFilter | null;
  createdAt?: Date | DateFilter | null;
  updatedAt?: Date | DateFilter | null;
};

export type filtered_category = {
  id?: string | StringFilter | null;
  name?: string | StringFilter | null;
  slug?: string | StringFilter | null;
  imageUrl?: string | StringFilter | null;
  description?: string | StringFilter | null;
  sortWeight?: number | NumberFilter | null; // 排序权重，数值越大越靠前
  status?: categorystatus | categorystatusFilter | null;
  createdAt?: Date | DateFilter | null;
  updatedAt?: Date | DateFilter | null;
};

export type filtered_product = {
  id?: string | StringFilter | null;
  categoryId?: string | StringFilter | null; // Foreign Key to category.id
  name?: string | StringFilter | null;
  slug?: string | StringFilter | null;
  productCode?: string | StringFilter | null;
  source?: productsource | productsourceFilter | null;
  status?: productstatus | productstatusFilter | null;
  mainImageUrl?: string | StringFilter | null;
  galleryJson?: any | null; // 商品相册，格式：[{ "url": "图片URL", "sort": 1 }]
  shortDescription?: string | StringFilter | null;
  sellingPointsJson?: any | null; // 商品卖点，格式：[{ "title": "卖点标题", "content": "卖点内容" }]
  detailContentJson?: any | null; // 图文详情，格式：[{ "type": "text|image", "content": "文本内容或图片URL", "title": "可选标题" }]
  parameterJson?: any | null; // 参数表，格式：[{ "group": "参数分组", "items": [{ "key": "参数名", "value": "参数值" }] }]
  tradeInfoJson?: any | null; // 物流与贸易说明，格式：{ "shipFrom": "发货地", "deliveryDays": 7, "minOrderQty": 1, "supportedRegions": ["US","EU"], "shippingNote": "运输说明", "tradeNotice": "注意事项" }
  faqJson?: any | null; // 常见购买问题，格式：[{ "question": "问题", "answer": "回答" }]
  ratingAverage?: number | NumberFilter | null; // 平均评分（X分，0-5）
  ratingCount?: number | NumberFilter | null; // 评价数量（X个）
  sortWeight?: number | NumberFilter | null; // 排序权重，数值越大越靠前
  createdAt?: Date | DateFilter | null;
  updatedAt?: Date | DateFilter | null;
};

export type filtered_productsku = {
  id?: string | StringFilter | null;
  productId?: string | StringFilter | null; // Foreign Key to product.id
  skuCode?: string | StringFilter | null;
  imageUrl?: string | StringFilter | null;
  price?: number | NumberFilter | null; // 售价（X元）
  originalPrice?: number | NumberFilter | null; // 原价（X元）
  stock?: number | NumberFilter | null; // 库存（X个）
  stockStatus?: stockstatus | stockstatusFilter | null;
  attributeJson?: any | null; // SKU规格属性，格式：[{ "name": "颜色", "value": "黑色" }, { "name": "尺寸", "value": "L" }]
  deliveryDays?: number | NumberFilter | null; // 预计交期（X天）
  weightKg?: number | NumberFilter | null; // 重量（X千克）
  volumeM3?: number | NumberFilter | null; // 体积（X立方米）
  createdAt?: Date | DateFilter | null;
  updatedAt?: Date | DateFilter | null;
};

export type filtered_cart = {
  id?: string | StringFilter | null;
  accountId?: string | StringFilter | null; // Foreign Key to sysuser.id
  createdAt?: Date | DateFilter | null;
  updatedAt?: Date | DateFilter | null;
};

export type filtered_cartitem = {
  id?: string | StringFilter | null;
  cartId?: string | StringFilter | null; // Foreign Key to cart.id
  productId?: string | StringFilter | null; // Foreign Key to product.id
  productSkuId?: string | StringFilter | null; // Foreign Key to productsku.id
  quantity?: number | NumberFilter | null; // 商品数量（X个）
  status?: cartitemstatus | cartitemstatusFilter | null;
  createdAt?: Date | DateFilter | null;
  updatedAt?: Date | DateFilter | null;
};

export type filtered_importtask = {
  id?: string | StringFilter | null;
  creatorId?: string | StringFilter | null; // Foreign Key to sysuser.id
  taskName?: string | StringFilter | null;
  status?: importtaskstatus | importtaskstatusFilter | null;
  sourceLinkCount?: number | NumberFilter | null; // 来源链接数量（X条）
  successCount?: number | NumberFilter | null; // 成功数量（X条）
  failureCount?: number | NumberFilter | null; // 失败数量（X条）
  progressPercent?: number | NumberFilter | null; // 进度百分比（X%）
  markupRate?: number | NumberFilter | null; // 加价比例（X%）
  defaultStatus?: productstatus | productstatusFilter | null;
  defaultCategoryId?: string | StringFilter | null;
  stockStrategyJson?: any | null; // 默认库存策略，格式：{ "type": "fixed", "stock": 100 }
  createdAt?: Date | DateFilter | null;
  updatedAt?: Date | DateFilter | null;
};

export type filtered_importtaskitem = {
  id?: string | StringFilter | null;
  importTaskId?: string | StringFilter | null; // Foreign Key to importtask.id
  operatorId?: string | StringFilter | null; // Foreign Key to sysuser.id
  sourceUrl?: string | StringFilter | null;
  parsedName?: string | StringFilter | null;
  parsedMainImageUrl?: string | StringFilter | null;
  parsedPriceMin?: number | NumberFilter | null; // 解析最低价（X元）
  parsedPriceMax?: number | NumberFilter | null; // 解析最高价（X元）
  specSummaryJson?: any | null; // 规格摘要，格式：[{ "name": "颜色", "values": ["黑色","白色"] }]
  previewDataJson?: any | null; // 导入预览数据，格式：{ "name": "商品名", "categoryId": "分类ID", "price": 99.99, "mainImageUrl": "图片URL", "shortDescription": "简述" }
  isSelected?: boolean | null;
  importedProductId?: string | StringFilter | null; // Foreign Key to product.id
  failureReason?: string | StringFilter | null;
  createdAt?: Date | DateFilter | null;
  updatedAt?: Date | DateFilter | null;
};

export type Entities = {
  sysuser: {
    Create(data: sysuser): Promise<sysuser | null>;
    Get(args: sysuser_uniqueKey): Promise<sysuser | null>;
    GetAll(args?: filtered_sysuser): Promise<sysuser[]>;
    GetPage(pageNumber?: number, pageSize?: number, args?: filtered_sysuser): Promise<sysuser[]>;
    Count(args?: filtered_sysuser): Promise<number>;
    Update(args: { where: sysuser_uniqueKey; data: sysuser_without_PKs }): Promise<sysuser | null>;
    Delete(args: sysuser_uniqueKey): Promise<sysuser | null>;
  };
  category: {
    Create(data: category): Promise<category | null>;
    Get(args: category_uniqueKey): Promise<category | null>;
    GetAll(args?: filtered_category): Promise<category[]>;
    GetPage(pageNumber?: number, pageSize?: number, args?: filtered_category): Promise<category[]>;
    Count(args?: filtered_category): Promise<number>;
    Update(args: { where: category_uniqueKey; data: category_without_PKs }): Promise<category | null>;
    Delete(args: category_uniqueKey): Promise<category | null>;
  };
  product: {
    Create(data: product): Promise<product | null>;
    Get(args: product_uniqueKey): Promise<product | null>;
    GetAll(args?: filtered_product): Promise<product[]>;
    GetPage(pageNumber?: number, pageSize?: number, args?: filtered_product): Promise<product[]>;
    Count(args?: filtered_product): Promise<number>;
    Update(args: { where: product_uniqueKey; data: product_without_PKs }): Promise<product | null>;
    Delete(args: product_uniqueKey): Promise<product | null>;
  };
  productsku: {
    Create(data: productsku): Promise<productsku | null>;
    Get(args: productsku_uniqueKey): Promise<productsku | null>;
    GetAll(args?: filtered_productsku): Promise<productsku[]>;
    GetPage(pageNumber?: number, pageSize?: number, args?: filtered_productsku): Promise<productsku[]>;
    Count(args?: filtered_productsku): Promise<number>;
    Update(args: { where: productsku_uniqueKey; data: productsku_without_PKs }): Promise<productsku | null>;
    Delete(args: productsku_uniqueKey): Promise<productsku | null>;
  };
  cart: {
    Create(data: cart): Promise<cart | null>;
    Get(args: cart_uniqueKey): Promise<cart | null>;
    GetAll(args?: filtered_cart): Promise<cart[]>;
    GetPage(pageNumber?: number, pageSize?: number, args?: filtered_cart): Promise<cart[]>;
    Count(args?: filtered_cart): Promise<number>;
    Update(args: { where: cart_uniqueKey; data: cart_without_PKs }): Promise<cart | null>;
    Delete(args: cart_uniqueKey): Promise<cart | null>;
  };
  cartitem: {
    Create(data: cartitem): Promise<cartitem | null>;
    Get(args: cartitem_uniqueKey): Promise<cartitem | null>;
    GetAll(args?: filtered_cartitem): Promise<cartitem[]>;
    GetPage(pageNumber?: number, pageSize?: number, args?: filtered_cartitem): Promise<cartitem[]>;
    Count(args?: filtered_cartitem): Promise<number>;
    Update(args: { where: cartitem_uniqueKey; data: cartitem_without_PKs }): Promise<cartitem | null>;
    Delete(args: cartitem_uniqueKey): Promise<cartitem | null>;
  };
  importtask: {
    Create(data: importtask): Promise<importtask | null>;
    Get(args: importtask_uniqueKey): Promise<importtask | null>;
    GetAll(args?: filtered_importtask): Promise<importtask[]>;
    GetPage(pageNumber?: number, pageSize?: number, args?: filtered_importtask): Promise<importtask[]>;
    Count(args?: filtered_importtask): Promise<number>;
    Update(args: { where: importtask_uniqueKey; data: importtask_without_PKs }): Promise<importtask | null>;
    Delete(args: importtask_uniqueKey): Promise<importtask | null>;
  };
  importtaskitem: {
    Create(data: importtaskitem): Promise<importtaskitem | null>;
    Get(args: importtaskitem_uniqueKey): Promise<importtaskitem | null>;
    GetAll(args?: filtered_importtaskitem): Promise<importtaskitem[]>;
    GetPage(pageNumber?: number, pageSize?: number, args?: filtered_importtaskitem): Promise<importtaskitem[]>;
    Count(args?: filtered_importtaskitem): Promise<number>;
    Update(args: { where: importtaskitem_uniqueKey; data: importtaskitem_without_PKs }): Promise<importtaskitem | null>;
    Delete(args: importtaskitem_uniqueKey): Promise<importtaskitem | null>;
  };
};

