export const DAILY_NEW_ARRIVAL_CATEGORY_KEYWORD = '每日上新'

const DAILY_NEW_ARRIVAL_NAME_PATTERNS = [
  '每日上新',
  '每月上新',
  'daily new arrival',
  'daily new arrivals',
  'daily new',
  'new arrival',
  'new arrivals',
]

/** 短名精确匹配（导航常显示为 New） */
const DAILY_NEW_ARRIVAL_EXACT_NAMES = ['new', '上新', '新品']

export type DailyNewArrivalCategoryRef = {
  category_id: string
  category_name: string
  children?: Array<{
    category_id: string
    category_name: string
  }>
}

export const isDailyNewArrivalCategoryName = (name?: string | null) => {
  const value = String(name || '').trim().toLowerCase()
  if (!value) return false
  if (DAILY_NEW_ARRIVAL_EXACT_NAMES.includes(value)) return true
  return DAILY_NEW_ARRIVAL_NAME_PATTERNS.some((pattern) => value.includes(pattern.toLowerCase()))
}

export const findDailyNewArrivalCategoryId = (categories: DailyNewArrivalCategoryRef[]) => {
  for (const category of categories) {
    if (isDailyNewArrivalCategoryName(category.category_name)) {
      return category.category_id
    }

    for (const child of category.children || []) {
      if (isDailyNewArrivalCategoryName(child.category_name)) {
        return child.category_id
      }
    }
  }

  return null
}

export type DailyNewArrivalMonthRef = {
  year: number
  month: number
  monthKey: string
}

export const toMonthKey = (year: number, month: number) =>
  `${year}-${String(month).padStart(2, '0')}`

export const parseMonthKey = (monthKey: string) => {
  const [yearText, monthText] = monthKey.split('-')
  return {
    year: Number(yearText),
    month: Number(monthText),
  }
}

export const buildLast6Months = (referenceDate = new Date()): DailyNewArrivalMonthRef[] => {
  const months: DailyNewArrivalMonthRef[] = []

  for (let offset = 0; offset <= 5; offset += 1) {
    const date = new Date(referenceDate.getFullYear(), referenceDate.getMonth() - offset, 1)
    const year = date.getFullYear()
    const month = date.getMonth() + 1

    months.push({
      year,
      month,
      monthKey: toMonthKey(year, month),
    })
  }

  return months
}

export const formatMonthLabel = (year: number, month: number) =>
  new Date(year, month - 1, 1).toLocaleDateString('en-US', {
    month: 'short',
    year: 'numeric',
  })

export const getMonthDateRange = (year: number, month: number) => {
  const start = new Date(year, month - 1, 1, 0, 0, 0, 0)
  const end = new Date(year, month, 1, 0, 0, 0, 0)

  return { start, end }
}

/** 最近 6 个月（含当月）窗口起点：最旧那个月的 1 号 00:00 */
export const getLast6MonthsRangeStart = (referenceDate = new Date()) => {
  const months = buildLast6Months(referenceDate)
  const oldest = months[months.length - 1]
  return getMonthDateRange(oldest.year, oldest.month).start
}
