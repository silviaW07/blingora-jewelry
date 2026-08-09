/**
 * 客户类型（客户管理列表行内下拉）配置——前后端共享的唯一数据源。
 * value 存库（稳定枚举码），label 为后台展示中文。
 * 新增客户默认 NEW（“新客户”）。
 */
export interface CustomerTypeOption {
  value: string
  label: string
}

export const CUSTOMER_TYPE_OPTIONS: CustomerTypeOption[] = [
  { value: 'NEW', label: '新客户' },
  { value: 'UNCONVERTED', label: '未转化' },
  { value: 'FIRST_ORDER', label: '首单' },
  { value: 'MULTI_ORDER', label: '多单' },
  { value: 'HIGH_RISK', label: '高危' },
  { value: 'CHURNED', label: '流失' },
]

/** 新增客户默认类型 */
export const DEFAULT_CUSTOMER_TYPE = 'NEW'

export const CUSTOMER_TYPE_VALUES: string[] = CUSTOMER_TYPE_OPTIONS.map(o => o.value)

export function isValidCustomerType(value: string | null | undefined): boolean {
  return !!value && CUSTOMER_TYPE_VALUES.includes(value)
}

/** 兜底：空值/历史脏数据统一按“新客户”展示 */
export function normalizeCustomerType(value: string | null | undefined): string {
  return isValidCustomerType(value || undefined) ? (value as string) : DEFAULT_CUSTOMER_TYPE
}

export function getCustomerTypeLabel(value: string | null | undefined): string {
  const target = normalizeCustomerType(value)
  return CUSTOMER_TYPE_OPTIONS.find(o => o.value === target)?.label || '新客户'
}
