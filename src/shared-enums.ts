/**
 * 枚举中心 — 从 prisma/schema.prisma 自动生成
 * 运行: npx tsx scripts/generate-schema-meta.ts
 * ⚠️ 请勿手动修改，schema 变更后重新生成
 */

export const userrole = {
  CUSTOMER: 'CUSTOMER',
  ADMIN: 'ADMIN',
} as const
export type userroleType = typeof userrole[keyof typeof userrole]

export const userstatus = {
  ACTIVE: 'ACTIVE',
  DISABLED: 'DISABLED',
} as const
export type userstatusType = typeof userstatus[keyof typeof userstatus]

export const categorystatus = {
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
} as const
export type categorystatusType = typeof categorystatus[keyof typeof categorystatus]

export const productstatus = {
  DRAFT: 'DRAFT',
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
} as const
export type productstatusType = typeof productstatus[keyof typeof productstatus]

export const productsource = {
  MANUAL: 'MANUAL',
  IMPORT_1688: 'IMPORT_1688',
} as const
export type productsourceType = typeof productsource[keyof typeof productsource]

export const stockstatus = {
  IN_STOCK: 'IN_STOCK',
  LOW_STOCK: 'LOW_STOCK',
  OUT_OF_STOCK: 'OUT_OF_STOCK',
} as const
export type stockstatusType = typeof stockstatus[keyof typeof stockstatus]

export const cartitemstatus = {
  VALID: 'VALID',
  INVALID: 'INVALID',
} as const
export type cartitemstatusType = typeof cartitemstatus[keyof typeof cartitemstatus]

export const importtaskstatus = {
  PENDING: 'PENDING',
  RUNNING: 'RUNNING',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED',
} as const
export type importtaskstatusType = typeof importtaskstatus[keyof typeof importtaskstatus]

/** 所有枚举名称列表 */
export const ALL_ENUMS = ['userrole', 'userstatus', 'categorystatus', 'productstatus', 'productsource', 'stockstatus', 'cartitemstatus', 'importtaskstatus'] as const
