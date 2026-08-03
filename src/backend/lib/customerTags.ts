/** 客户标签固定选项（前后端共用，勿放进 'use server' 文件） */

export type CustomerTagCode =
  | 'NEW_REGISTERED'
  | 'NOT_CONVERTED'
  | 'FIRST_ORDER'
  | 'MULTI_ORDER'
  | 'HIGH_RISK'
  | 'CHURNED'
  | ''

export const CUSTOMER_TAG_OPTIONS: ReadonlyArray<{ code: Exclude<CustomerTagCode, ''>; name: string }> = [
  { code: 'NEW_REGISTERED', name: '新注册客户' },
  { code: 'NOT_CONVERTED', name: '未转化客户' },
  { code: 'FIRST_ORDER', name: '首单客户' },
  { code: 'MULTI_ORDER', name: '多单客户' },
  { code: 'HIGH_RISK', name: '高危客户' },
  { code: 'CHURNED', name: '流失客户' },
]
