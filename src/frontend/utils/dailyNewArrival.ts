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

const pad2 = (n: number) => String(n).padStart(2, '0')

/** YYYY-MM-DD (local calendar day) */
export const toDateKey = (d: Date) =>
  `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`

/**
 * YYYY-MM-DD in an IANA timezone (default Asia/Shanghai).
 * Used when admin creates Coming/display drafts so names align with Coming date chips.
 */
export const toDateKeyInTimeZone = (
  date = new Date(),
  timeZone = 'Asia/Shanghai',
): string =>
  new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date)

/** True when product name is a calendar date key (Coming day grouping). */
export const isDateKeyProductName = (name?: string | null) =>
  /^\d{4}-\d{2}-\d{2}$/.test(String(name || '').trim())

/** MM/DD display label */
export const toDateLabel = (d: Date) => `${pad2(d.getMonth() + 1)}/${pad2(d.getDate())}`

export type ComingDateChip = {
  date_key: string
  date_label: string
}

/**
 * Last N calendar days including today, newest first (today → older).
 * Used by mobile Coming date switcher.
 */
export const buildLastNDays = (count = 10, referenceDate = new Date()): ComingDateChip[] => {
  const days: ComingDateChip[] = []
  const safeCount = Math.max(1, Math.min(31, Math.floor(count) || 10))
  const base = new Date(
    referenceDate.getFullYear(),
    referenceDate.getMonth(),
    referenceDate.getDate(),
    12,
    0,
    0,
    0,
  )

  for (let offset = 0; offset < safeCount; offset += 1) {
    const d = new Date(base)
    d.setDate(base.getDate() - offset)
    days.push({
      date_key: toDateKey(d),
      date_label: toDateLabel(d),
    })
  }

  return days
}

/** Local midnight range for YYYY-MM-DD */
export const getDateKeyRange = (dateKey: string) => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(dateKey || '').trim())
  if (!match) return null
  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  if (
    !Number.isInteger(year) ||
    !Number.isInteger(month) ||
    !Number.isInteger(day) ||
    month < 1 ||
    month > 12 ||
    day < 1 ||
    day > 31
  ) {
    return null
  }
  const start = new Date(year, month - 1, day, 0, 0, 0, 0)
  const end = new Date(year, month - 1, day + 1, 0, 0, 0, 0)
  return { start, end, year, month, day }
}
