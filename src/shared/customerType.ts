/**
 * 客户类型（客户管理列表行内下拉）配置——前后端共享的唯一数据源。
 * value 存库（稳定枚举码），label 为后台展示中文。
 * 新增客户默认 NEW（“新客户”）。
 */
export interface CustomerTypeOption {
  value: string
  label: string
  /** 后台标签色 */
  className: string
}

export const CUSTOMER_TYPE_OPTIONS: CustomerTypeOption[] = [
  { value: 'NEW', label: '新客户', className: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  { value: 'UNCONVERTED', label: '未转化', className: 'bg-slate-100 text-slate-700 border-slate-200' },
  { value: 'FIRST_ORDER', label: '首单', className: 'bg-sky-100 text-sky-800 border-sky-200' },
  { value: 'MULTI_ORDER', label: '多单', className: 'bg-violet-100 text-violet-800 border-violet-200' },
  { value: 'HIGH_RISK', label: '高危', className: 'bg-red-100 text-red-800 border-red-200' },
  { value: 'CHURNED', label: '流失', className: 'bg-amber-100 text-amber-900 border-amber-200' },
]

export function getCustomerTypeClassName(value: string | null | undefined): string {
  const target = normalizeCustomerType(value)
  return CUSTOMER_TYPE_OPTIONS.find((o) => o.value === target)?.className || CUSTOMER_TYPE_OPTIONS[0].className
}

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
