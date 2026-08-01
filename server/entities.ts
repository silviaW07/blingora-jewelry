import { PrismaClient, Prisma } from '../prisma-generated/client';
import {
  cart, 
  cart_uniqueKey, 
  cart_without_PKs, 
  cartitem, 
  cartitem_uniqueKey, 
  cartitem_without_PKs, 
  category, 
  category_uniqueKey, 
  category_without_PKs, 
  filtered_cart, 
  filtered_cartitem, 
  filtered_category, 
  filtered_importtask, 
  filtered_importtaskitem, 
  filtered_product, 
  filtered_productsku, 
  filtered_sysuser, 
  importtask, 
  importtask_uniqueKey, 
  importtask_without_PKs, 
  importtaskitem, 
  importtaskitem_uniqueKey, 
  importtaskitem_without_PKs, 
  product, 
  product_uniqueKey, 
  product_without_PKs, 
  productsku, 
  productsku_uniqueKey, 
  productsku_without_PKs, 
  sysuser, 
  sysuser_uniqueKey, 
  sysuser_without_PKs,
  Entities
} from './entities.type';

export const prisma = new PrismaClient();

export const default_entities: Entities = {
  sysuser: {
    /**
        * 创建sysuser记录
        * @param data 包含所有字段的数据 (包括手动设置的主键)
        * @returns 创建的记录或null
        */
        Create: async (data: sysuser): Promise<sysuser | null> => {
            try {
                return await prisma.sysuser.create({
                    data: data 
                });
            } catch (error) {
                console.error(`Error creating sysuser:`, error);
                return null;
            }
        },

    /**
        * 根据主键获取记录
        * @param args 主键参数
        * @returns 记录或null
        */
        Get: async (args: sysuser_uniqueKey): Promise<sysuser | null> => {
            try {
                return await prisma.sysuser.findUnique({
                    where: { id: args.id },
                });
            } catch (error) {
                console.error(`Error getting sysuser:`, error);
                return null;
            }
        },

    /**
        * 获取所有记录
        * @param args 可选筛选条件 (类型: filtered_sysuser)
        * @returns 记录数组
        */
        GetAll: async (args?: filtered_sysuser): Promise<sysuser[]> => {
            try {
                return await prisma.sysuser.findMany({
                    where: args as any, 
                });
            } catch (error) {
                console.error(`Error getting all sysuser:`, error);
                return [];
            }
        },

    /**
        * 分页获取记录
        * @param pageNumber 页码 (默认 1)
        * @param pageSize 每页大小 (默认 10)
        * @param args 可选筛选条件 (类型: filtered_sysuser)
        * @returns 分页记录数组
        */
        GetPage: async (
            pageNumber: number = 1,
            pageSize: number = 10,
            args?: filtered_sysuser
        ): Promise<sysuser[]> => {
            try {
                const skip = (pageNumber - 1) * pageSize;
                return await prisma.sysuser.findMany({
                    where: args as any, 
                    skip,
                    take: pageSize,
                });
            } catch (error) {
                console.error(`Error getting paged sysuser:`, error);
                return [];
            }
        },

    /**
        * 统计记录数
        * @param args 可选筛选条件 (类型: filtered_sysuser)
        * @returns 记录数量
        */
        Count: async (args?: filtered_sysuser): Promise<number> => {
            try {
                return await prisma.sysuser.count({
                    where: args as any, 
                });
            } catch (error) {
                console.error(`Error counting sysuser:`, error);
                return 0;
            }
        },

    /**
        * 更新记录
        * @param args 包含主键 (where) 和更新数据 (data)
        * @returns 更新后的记录或null
        */
        Update: async (args: { where: sysuser_uniqueKey; data: sysuser_without_PKs }): Promise<sysuser | null> => {
            try {
                return await prisma.sysuser.update({
                    where: { id: args.where.id },
                    data: args.data 
                });
            } catch (error) {
                console.error(`Error updating sysuser:`, error);
                return null;
            }
        },

    /**
        * 删除记录
        * @param args 主键参数
        * @returns 删除的记录或null
        */
        Delete: async (args: sysuser_uniqueKey): Promise<sysuser | null> => {
            try {
                return await prisma.sysuser.delete({
                    where: { id: args.id },
                });
            } catch (error) {
                console.error(`Error deleting sysuser:`, error);
                return null;
            }
        },  },
  category: {
    /**
        * 创建category记录
        * @param data 包含所有字段的数据 (包括手动设置的主键)
        * @returns 创建的记录或null
        */
        Create: async (data: category): Promise<category | null> => {
            try {
                return await prisma.category.create({
                    data: data 
                });
            } catch (error) {
                console.error(`Error creating category:`, error);
                return null;
            }
        },

    /**
        * 根据主键获取记录
        * @param args 主键参数
        * @returns 记录或null
        */
        Get: async (args: category_uniqueKey): Promise<category | null> => {
            try {
                return await prisma.category.findUnique({
                    where: { id: args.id },
                });
            } catch (error) {
                console.error(`Error getting category:`, error);
                return null;
            }
        },

    /**
        * 获取所有记录
        * @param args 可选筛选条件 (类型: filtered_category)
        * @returns 记录数组
        */
        GetAll: async (args?: filtered_category): Promise<category[]> => {
            try {
                return await prisma.category.findMany({
                    where: args as any, 
                });
            } catch (error) {
                console.error(`Error getting all category:`, error);
                return [];
            }
        },

    /**
        * 分页获取记录
        * @param pageNumber 页码 (默认 1)
        * @param pageSize 每页大小 (默认 10)
        * @param args 可选筛选条件 (类型: filtered_category)
        * @returns 分页记录数组
        */
        GetPage: async (
            pageNumber: number = 1,
            pageSize: number = 10,
            args?: filtered_category
        ): Promise<category[]> => {
            try {
                const skip = (pageNumber - 1) * pageSize;
                return await prisma.category.findMany({
                    where: args as any, 
                    skip,
                    take: pageSize,
                });
            } catch (error) {
                console.error(`Error getting paged category:`, error);
                return [];
            }
        },

    /**
        * 统计记录数
        * @param args 可选筛选条件 (类型: filtered_category)
        * @returns 记录数量
        */
        Count: async (args?: filtered_category): Promise<number> => {
            try {
                return await prisma.category.count({
                    where: args as any, 
                });
            } catch (error) {
                console.error(`Error counting category:`, error);
                return 0;
            }
        },

    /**
        * 更新记录
        * @param args 包含主键 (where) 和更新数据 (data)
        * @returns 更新后的记录或null
        */
        Update: async (args: { where: category_uniqueKey; data: category_without_PKs }): Promise<category | null> => {
            try {
                return await prisma.category.update({
                    where: { id: args.where.id },
                    data: args.data 
                });
            } catch (error) {
                console.error(`Error updating category:`, error);
                return null;
            }
        },

    /**
        * 删除记录
        * @param args 主键参数
        * @returns 删除的记录或null
        */
        Delete: async (args: category_uniqueKey): Promise<category | null> => {
            try {
                return await prisma.category.delete({
                    where: { id: args.id },
                });
            } catch (error) {
                console.error(`Error deleting category:`, error);
                return null;
            }
        },  },
  product: {
    /**
        * 创建product记录
        * @param data 包含所有字段的数据 (包括手动设置的主键)
        * @returns 创建的记录或null
        */
        Create: async (data: product): Promise<product | null> => {
            try {
                return await prisma.product.create({
                    data: data 
                });
            } catch (error) {
                console.error(`Error creating product:`, error);
                return null;
            }
        },

    /**
        * 根据主键获取记录
        * @param args 主键参数
        * @returns 记录或null
        */
        Get: async (args: product_uniqueKey): Promise<product | null> => {
            try {
                return await prisma.product.findUnique({
                    where: { id: args.id },
                });
            } catch (error) {
                console.error(`Error getting product:`, error);
                return null;
            }
        },

    /**
        * 获取所有记录
        * @param args 可选筛选条件 (类型: filtered_product)
        * @returns 记录数组
        */
        GetAll: async (args?: filtered_product): Promise<product[]> => {
            try {
                return await prisma.product.findMany({
                    where: args as any, 
                });
            } catch (error) {
                console.error(`Error getting all product:`, error);
                return [];
            }
        },

    /**
        * 分页获取记录
        * @param pageNumber 页码 (默认 1)
        * @param pageSize 每页大小 (默认 10)
        * @param args 可选筛选条件 (类型: filtered_product)
        * @returns 分页记录数组
        */
        GetPage: async (
            pageNumber: number = 1,
            pageSize: number = 10,
            args?: filtered_product
        ): Promise<product[]> => {
            try {
                const skip = (pageNumber - 1) * pageSize;
                return await prisma.product.findMany({
                    where: args as any, 
                    skip,
                    take: pageSize,
                });
            } catch (error) {
                console.error(`Error getting paged product:`, error);
                return [];
            }
        },

    /**
        * 统计记录数
        * @param args 可选筛选条件 (类型: filtered_product)
        * @returns 记录数量
        */
        Count: async (args?: filtered_product): Promise<number> => {
            try {
                return await prisma.product.count({
                    where: args as any, 
                });
            } catch (error) {
                console.error(`Error counting product:`, error);
                return 0;
            }
        },

    /**
        * 更新记录
        * @param args 包含主键 (where) 和更新数据 (data)
        * @returns 更新后的记录或null
        */
        Update: async (args: { where: product_uniqueKey; data: product_without_PKs }): Promise<product | null> => {
            try {
                return await prisma.product.update({
                    where: { id: args.where.id },
                    data: args.data 
                });
            } catch (error) {
                console.error(`Error updating product:`, error);
                return null;
            }
        },

    /**
        * 删除记录
        * @param args 主键参数
        * @returns 删除的记录或null
        */
        Delete: async (args: product_uniqueKey): Promise<product | null> => {
            try {
                return await prisma.product.delete({
                    where: { id: args.id },
                });
            } catch (error) {
                console.error(`Error deleting product:`, error);
                return null;
            }
        },  },
  productsku: {
    /**
        * 创建productsku记录
        * @param data 包含所有字段的数据 (包括手动设置的主键)
        * @returns 创建的记录或null
        */
        Create: async (data: productsku): Promise<productsku | null> => {
            try {
                return await prisma.productsku.create({
                    data: data 
                });
            } catch (error) {
                console.error(`Error creating productsku:`, error);
                return null;
            }
        },

    /**
        * 根据主键获取记录
        * @param args 主键参数
        * @returns 记录或null
        */
        Get: async (args: productsku_uniqueKey): Promise<productsku | null> => {
            try {
                return await prisma.productsku.findUnique({
                    where: { id: args.id },
                });
            } catch (error) {
                console.error(`Error getting productsku:`, error);
                return null;
            }
        },

    /**
        * 获取所有记录
        * @param args 可选筛选条件 (类型: filtered_productsku)
        * @returns 记录数组
        */
        GetAll: async (args?: filtered_productsku): Promise<productsku[]> => {
            try {
                return await prisma.productsku.findMany({
                    where: args as any, 
                });
            } catch (error) {
                console.error(`Error getting all productsku:`, error);
                return [];
            }
        },

    /**
        * 分页获取记录
        * @param pageNumber 页码 (默认 1)
        * @param pageSize 每页大小 (默认 10)
        * @param args 可选筛选条件 (类型: filtered_productsku)
        * @returns 分页记录数组
        */
        GetPage: async (
            pageNumber: number = 1,
            pageSize: number = 10,
            args?: filtered_productsku
        ): Promise<productsku[]> => {
            try {
                const skip = (pageNumber - 1) * pageSize;
                return await prisma.productsku.findMany({
                    where: args as any, 
                    skip,
                    take: pageSize,
                });
            } catch (error) {
                console.error(`Error getting paged productsku:`, error);
                return [];
            }
        },

    /**
        * 统计记录数
        * @param args 可选筛选条件 (类型: filtered_productsku)
        * @returns 记录数量
        */
        Count: async (args?: filtered_productsku): Promise<number> => {
            try {
                return await prisma.productsku.count({
                    where: args as any, 
                });
            } catch (error) {
                console.error(`Error counting productsku:`, error);
                return 0;
            }
        },

    /**
        * 更新记录
        * @param args 包含主键 (where) 和更新数据 (data)
        * @returns 更新后的记录或null
        */
        Update: async (args: { where: productsku_uniqueKey; data: productsku_without_PKs }): Promise<productsku | null> => {
            try {
                return await prisma.productsku.update({
                    where: { id: args.where.id },
                    data: args.data 
                });
            } catch (error) {
                console.error(`Error updating productsku:`, error);
                return null;
            }
        },

    /**
        * 删除记录
        * @param args 主键参数
        * @returns 删除的记录或null
        */
        Delete: async (args: productsku_uniqueKey): Promise<productsku | null> => {
            try {
                return await prisma.productsku.delete({
                    where: { id: args.id },
                });
            } catch (error) {
                console.error(`Error deleting productsku:`, error);
                return null;
            }
        },  },
  cart: {
    /**
        * 创建cart记录
        * @param data 包含所有字段的数据 (包括手动设置的主键)
        * @returns 创建的记录或null
        */
        Create: async (data: cart): Promise<cart | null> => {
            try {
                return await prisma.cart.create({
                    data: data 
                });
            } catch (error) {
                console.error(`Error creating cart:`, error);
                return null;
            }
        },

    /**
        * 根据主键获取记录
        * @param args 主键参数
        * @returns 记录或null
        */
        Get: async (args: cart_uniqueKey): Promise<cart | null> => {
            try {
                return await prisma.cart.findUnique({
                    where: { id: args.id },
                });
            } catch (error) {
                console.error(`Error getting cart:`, error);
                return null;
            }
        },

    /**
        * 获取所有记录
        * @param args 可选筛选条件 (类型: filtered_cart)
        * @returns 记录数组
        */
        GetAll: async (args?: filtered_cart): Promise<cart[]> => {
            try {
                return await prisma.cart.findMany({
                    where: args as any, 
                });
            } catch (error) {
                console.error(`Error getting all cart:`, error);
                return [];
            }
        },

    /**
        * 分页获取记录
        * @param pageNumber 页码 (默认 1)
        * @param pageSize 每页大小 (默认 10)
        * @param args 可选筛选条件 (类型: filtered_cart)
        * @returns 分页记录数组
        */
        GetPage: async (
            pageNumber: number = 1,
            pageSize: number = 10,
            args?: filtered_cart
        ): Promise<cart[]> => {
            try {
                const skip = (pageNumber - 1) * pageSize;
                return await prisma.cart.findMany({
                    where: args as any, 
                    skip,
                    take: pageSize,
                });
            } catch (error) {
                console.error(`Error getting paged cart:`, error);
                return [];
            }
        },

    /**
        * 统计记录数
        * @param args 可选筛选条件 (类型: filtered_cart)
        * @returns 记录数量
        */
        Count: async (args?: filtered_cart): Promise<number> => {
            try {
                return await prisma.cart.count({
                    where: args as any, 
                });
            } catch (error) {
                console.error(`Error counting cart:`, error);
                return 0;
            }
        },

    /**
        * 更新记录
        * @param args 包含主键 (where) 和更新数据 (data)
        * @returns 更新后的记录或null
        */
        Update: async (args: { where: cart_uniqueKey; data: cart_without_PKs }): Promise<cart | null> => {
            try {
                return await prisma.cart.update({
                    where: { id: args.where.id },
                    data: args.data 
                });
            } catch (error) {
                console.error(`Error updating cart:`, error);
                return null;
            }
        },

    /**
        * 删除记录
        * @param args 主键参数
        * @returns 删除的记录或null
        */
        Delete: async (args: cart_uniqueKey): Promise<cart | null> => {
            try {
                return await prisma.cart.delete({
                    where: { id: args.id },
                });
            } catch (error) {
                console.error(`Error deleting cart:`, error);
                return null;
            }
        },  },
  cartitem: {
    /**
        * 创建cartitem记录
        * @param data 包含所有字段的数据 (包括手动设置的主键)
        * @returns 创建的记录或null
        */
        Create: async (data: cartitem): Promise<cartitem | null> => {
            try {
                return await prisma.cartitem.create({
                    data: data 
                });
            } catch (error) {
                console.error(`Error creating cartitem:`, error);
                return null;
            }
        },

    /**
        * 根据主键获取记录
        * @param args 主键参数
        * @returns 记录或null
        */
        Get: async (args: cartitem_uniqueKey): Promise<cartitem | null> => {
            try {
                return await prisma.cartitem.findUnique({
                    where: { id: args.id },
                });
            } catch (error) {
                console.error(`Error getting cartitem:`, error);
                return null;
            }
        },

    /**
        * 获取所有记录
        * @param args 可选筛选条件 (类型: filtered_cartitem)
        * @returns 记录数组
        */
        GetAll: async (args?: filtered_cartitem): Promise<cartitem[]> => {
            try {
                return await prisma.cartitem.findMany({
                    where: args as any, 
                });
            } catch (error) {
                console.error(`Error getting all cartitem:`, error);
                return [];
            }
        },

    /**
        * 分页获取记录
        * @param pageNumber 页码 (默认 1)
        * @param pageSize 每页大小 (默认 10)
        * @param args 可选筛选条件 (类型: filtered_cartitem)
        * @returns 分页记录数组
        */
        GetPage: async (
            pageNumber: number = 1,
            pageSize: number = 10,
            args?: filtered_cartitem
        ): Promise<cartitem[]> => {
            try {
                const skip = (pageNumber - 1) * pageSize;
                return await prisma.cartitem.findMany({
                    where: args as any, 
                    skip,
                    take: pageSize,
                });
            } catch (error) {
                console.error(`Error getting paged cartitem:`, error);
                return [];
            }
        },

    /**
        * 统计记录数
        * @param args 可选筛选条件 (类型: filtered_cartitem)
        * @returns 记录数量
        */
        Count: async (args?: filtered_cartitem): Promise<number> => {
            try {
                return await prisma.cartitem.count({
                    where: args as any, 
                });
            } catch (error) {
                console.error(`Error counting cartitem:`, error);
                return 0;
            }
        },

    /**
        * 更新记录
        * @param args 包含主键 (where) 和更新数据 (data)
        * @returns 更新后的记录或null
        */
        Update: async (args: { where: cartitem_uniqueKey; data: cartitem_without_PKs }): Promise<cartitem | null> => {
            try {
                return await prisma.cartitem.update({
                    where: { id: args.where.id },
                    data: args.data 
                });
            } catch (error) {
                console.error(`Error updating cartitem:`, error);
                return null;
            }
        },

    /**
        * 删除记录
        * @param args 主键参数
        * @returns 删除的记录或null
        */
        Delete: async (args: cartitem_uniqueKey): Promise<cartitem | null> => {
            try {
                return await prisma.cartitem.delete({
                    where: { id: args.id },
                });
            } catch (error) {
                console.error(`Error deleting cartitem:`, error);
                return null;
            }
        },  },
  importtask: {
    /**
        * 创建importtask记录
        * @param data 包含所有字段的数据 (包括手动设置的主键)
        * @returns 创建的记录或null
        */
        Create: async (data: importtask): Promise<importtask | null> => {
            try {
                return await prisma.importtask.create({
                    data: data 
                });
            } catch (error) {
                console.error(`Error creating importtask:`, error);
                return null;
            }
        },

    /**
        * 根据主键获取记录
        * @param args 主键参数
        * @returns 记录或null
        */
        Get: async (args: importtask_uniqueKey): Promise<importtask | null> => {
            try {
                return await prisma.importtask.findUnique({
                    where: { id: args.id },
                });
            } catch (error) {
                console.error(`Error getting importtask:`, error);
                return null;
            }
        },

    /**
        * 获取所有记录
        * @param args 可选筛选条件 (类型: filtered_importtask)
        * @returns 记录数组
        */
        GetAll: async (args?: filtered_importtask): Promise<importtask[]> => {
            try {
                return await prisma.importtask.findMany({
                    where: args as any, 
                });
            } catch (error) {
                console.error(`Error getting all importtask:`, error);
                return [];
            }
        },

    /**
        * 分页获取记录
        * @param pageNumber 页码 (默认 1)
        * @param pageSize 每页大小 (默认 10)
        * @param args 可选筛选条件 (类型: filtered_importtask)
        * @returns 分页记录数组
        */
        GetPage: async (
            pageNumber: number = 1,
            pageSize: number = 10,
            args?: filtered_importtask
        ): Promise<importtask[]> => {
            try {
                const skip = (pageNumber - 1) * pageSize;
                return await prisma.importtask.findMany({
                    where: args as any, 
                    skip,
                    take: pageSize,
                });
            } catch (error) {
                console.error(`Error getting paged importtask:`, error);
                return [];
            }
        },

    /**
        * 统计记录数
        * @param args 可选筛选条件 (类型: filtered_importtask)
        * @returns 记录数量
        */
        Count: async (args?: filtered_importtask): Promise<number> => {
            try {
                return await prisma.importtask.count({
                    where: args as any, 
                });
            } catch (error) {
                console.error(`Error counting importtask:`, error);
                return 0;
            }
        },

    /**
        * 更新记录
        * @param args 包含主键 (where) 和更新数据 (data)
        * @returns 更新后的记录或null
        */
        Update: async (args: { where: importtask_uniqueKey; data: importtask_without_PKs }): Promise<importtask | null> => {
            try {
                return await prisma.importtask.update({
                    where: { id: args.where.id },
                    data: args.data 
                });
            } catch (error) {
                console.error(`Error updating importtask:`, error);
                return null;
            }
        },

    /**
        * 删除记录
        * @param args 主键参数
        * @returns 删除的记录或null
        */
        Delete: async (args: importtask_uniqueKey): Promise<importtask | null> => {
            try {
                return await prisma.importtask.delete({
                    where: { id: args.id },
                });
            } catch (error) {
                console.error(`Error deleting importtask:`, error);
                return null;
            }
        },  },
  importtaskitem: {
    /**
        * 创建importtaskitem记录
        * @param data 包含所有字段的数据 (包括手动设置的主键)
        * @returns 创建的记录或null
        */
        Create: async (data: importtaskitem): Promise<importtaskitem | null> => {
            try {
                return await prisma.importtaskitem.create({
                    data: data 
                });
            } catch (error) {
                console.error(`Error creating importtaskitem:`, error);
                return null;
            }
        },

    /**
        * 根据主键获取记录
        * @param args 主键参数
        * @returns 记录或null
        */
        Get: async (args: importtaskitem_uniqueKey): Promise<importtaskitem | null> => {
            try {
                return await prisma.importtaskitem.findUnique({
                    where: { id: args.id },
                });
            } catch (error) {
                console.error(`Error getting importtaskitem:`, error);
                return null;
            }
        },

    /**
        * 获取所有记录
        * @param args 可选筛选条件 (类型: filtered_importtaskitem)
        * @returns 记录数组
        */
        GetAll: async (args?: filtered_importtaskitem): Promise<importtaskitem[]> => {
            try {
                return await prisma.importtaskitem.findMany({
                    where: args as any, 
                });
            } catch (error) {
                console.error(`Error getting all importtaskitem:`, error);
                return [];
            }
        },

    /**
        * 分页获取记录
        * @param pageNumber 页码 (默认 1)
        * @param pageSize 每页大小 (默认 10)
        * @param args 可选筛选条件 (类型: filtered_importtaskitem)
        * @returns 分页记录数组
        */
        GetPage: async (
            pageNumber: number = 1,
            pageSize: number = 10,
            args?: filtered_importtaskitem
        ): Promise<importtaskitem[]> => {
            try {
                const skip = (pageNumber - 1) * pageSize;
                return await prisma.importtaskitem.findMany({
                    where: args as any, 
                    skip,
                    take: pageSize,
                });
            } catch (error) {
                console.error(`Error getting paged importtaskitem:`, error);
                return [];
            }
        },

    /**
        * 统计记录数
        * @param args 可选筛选条件 (类型: filtered_importtaskitem)
        * @returns 记录数量
        */
        Count: async (args?: filtered_importtaskitem): Promise<number> => {
            try {
                return await prisma.importtaskitem.count({
                    where: args as any, 
                });
            } catch (error) {
                console.error(`Error counting importtaskitem:`, error);
                return 0;
            }
        },

    /**
        * 更新记录
        * @param args 包含主键 (where) 和更新数据 (data)
        * @returns 更新后的记录或null
        */
        Update: async (args: { where: importtaskitem_uniqueKey; data: importtaskitem_without_PKs }): Promise<importtaskitem | null> => {
            try {
                return await prisma.importtaskitem.update({
                    where: { id: args.where.id },
                    data: args.data 
                });
            } catch (error) {
                console.error(`Error updating importtaskitem:`, error);
                return null;
            }
        },

    /**
        * 删除记录
        * @param args 主键参数
        * @returns 删除的记录或null
        */
        Delete: async (args: importtaskitem_uniqueKey): Promise<importtaskitem | null> => {
            try {
                return await prisma.importtaskitem.delete({
                    where: { id: args.id },
                });
            } catch (error) {
                console.error(`Error deleting importtaskitem:`, error);
                return null;
            }
        },  },
};
