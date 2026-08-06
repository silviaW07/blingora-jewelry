/* 开发环境宿主服务 - 加载增量构建产物 PROJ_xxx.js */
/* touch: reload Coming getComingSoonProductsByDate */
import path from 'path'
import fs from 'fs'
import dns from 'dns'
import net from 'net'
import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'

// Node 20 happy-eyeballs tries AAAA first; on hosts without working IPv6 egress
// outbound fetch (1688 scrape, FX rates) dies with ETIMEDOUT in
// internalConnectMultiple. Force IPv4 unless explicitly opted out.
if (process.env.FORCE_IPV4 !== '0') {
  try {
    dns.setDefaultResultOrder('ipv4first')
    const setAutoSelectFamily = (net as unknown as {
      setDefaultAutoSelectFamily?: (value: boolean) => void
    }).setDefaultAutoSelectFamily
    if (typeof setAutoSelectFamily === 'function') {
      setAutoSelectFamily(false)
    }
    console.log('[DEV] Outbound DNS forced to IPv4 (set FORCE_IPV4=0 to disable)')
  } catch (error) {
    console.warn('[DEV] Failed to force IPv4 DNS order', error)
  }
}

// PM2 / systemd start this without a shell profile, so DATABASE_URL must come
// from the project .env instead of the parent environment.
for (const envFile of ['.env.local', '.env']) {
  const envPath = path.resolve(__dirname, '..', envFile)
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath })
  }
}

// Optional egress proxy for scrapes (1688 blocks/times out from some hosts).
// Set HTTPS_PROXY=http://user:pass@host:port in .env, then `pnpm add undici@6`.
// Pin to 6.x: undici 7 calls webidl APIs that only exist on Node 22, and this
// host runs Node 20. Must run after dotenv above, or .env values are invisible.
const EGRESS_PROXY = (process.env.HTTPS_PROXY || process.env.HTTP_PROXY || '').trim()
if (EGRESS_PROXY) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { ProxyAgent, setGlobalDispatcher } = require('undici')
    // A reverse-tunnelled proxy adds a full round trip before the target is even
    // dialled, so undici's 10s connect default fires long before 1688 answers.
    setGlobalDispatcher(
      new ProxyAgent({
        uri: EGRESS_PROXY,
        connectTimeout: 30_000,
        headersTimeout: 60_000,
        bodyTimeout: 60_000,
      }),
    )
    console.log(`[DEV] Outbound fetch routed through proxy: ${EGRESS_PROXY.replace(/\/\/[^@]*@/, '//***@')}`)
  } catch (error) {
    console.warn(
      '[DEV] HTTPS_PROXY set but undici is unavailable; run `pnpm add undici` to enable proxying',
      (error as Error).message,
    )
  }
} else {
  console.log('[DEV] No HTTPS_PROXY configured; outbound fetch goes direct')
}

// ⚠️ 必须在 require PROJ_*.js 之前设置引擎路径，
// 因为 _common.js 里打包了 PrismaClient，require 时就会尝试加载引擎
const ENGINES_ROOT = path.resolve(__dirname, '../prisma-generated/client')
const _platform = process.platform
const _arch = process.arch

let engineFile: string
if (_platform === 'darwin' && _arch === 'arm64') {
  engineFile = 'libquery_engine-darwin-arm64.dylib.node'
} else if (_platform === 'win32') {
  engineFile =
    _arch === 'arm64'
      ? 'query_engine-windows-arm64.dll.node'
      : 'query_engine-windows.dll.node'
} else {
  // ECS / Linux prod-like
  engineFile = 'libquery_engine-debian-openssl-3.0.x.so.node'
}
const enginePath = path.join(ENGINES_ROOT, engineFile)
if (fs.existsSync(enginePath)) {
  process.env.PRISMA_QUERY_ENGINE_LIBRARY = enginePath
  console.log(`[DEV] Using Prisma engine: ${enginePath}`)
} else {
  console.log(`[DEV] Prisma engine not found at ${enginePath}, using default resolution`)
}

// 动态发现 server-action-generated/PROJ_*.js 入口文件
const generatedDir = path.resolve(__dirname, '../server-action-generated')
const projFile = fs.readdirSync(generatedDir).find(f => f.startsWith('PROJ_') && f.endsWith('.js'))
if (!projFile) {
  console.error('[DEV] ERROR: No PROJ_*.js entry found in server-action-generated/. Run `pnpm run build:server` first.')
  process.exit(1)
}
const bundledModule = require(path.join(generatedDir, projFile)) as { path: string; router: express.Router }
const { router, path: routePath } = bundledModule
console.log(`[DEV] Loaded entry: ${projFile}`)

// 初始化 Prisma Client 并注入到 globalThis
// 这样 Server Action 里的 prisma.ts 可以通过 globalThis.__runtimePrisma 获取
const { PrismaClient } = require('../prisma-generated/client')

/**
 * 用于 take/skip/distinct/orderBy 等参数位置：null 在这些位置无意义，视为无效
 */
function isInvalidValue(val: any): boolean {
  return val === null || val === undefined || val === 'undefined' || val === 'null' || val === ''
}

/**
 * 用于 where/data/cursor 中的字段值：null 是合法值（IS NULL 条件 / 清空字段），不应删除
 */
function isInvalidFieldValue(val: any): boolean {
  return val === undefined || val === 'undefined' || val === 'null' || val === ''
}

/**
 * 归一化字段名：去掉下划线/连字符，全部转小写
 * Proxy / DMMF 偶发传入 undefined/symbol 时不能直接 .replace
 */
function normalizeFieldName(name: unknown): string {
  return String(name ?? '')
    .replace(/[-_]/g, '')
    .toLowerCase()
}

/**
 * 获取 Prisma model 的真实字段名列表
 */
function getModelFields(prisma: any, modelName: string): string[] {
  const collect = (fields: any[] | undefined): string[] =>
    (fields || [])
      .map((f: any) => f?.name)
      .filter((name: unknown): name is string => typeof name === 'string' && name.length > 0)

  try {
    const model = prisma._baseDmmf?.modelMap?.[modelName]
      || prisma._baseDmmf?.modelMap?.[modelName.charAt(0).toUpperCase() + modelName.slice(1)]
    if (model?.fields) {
      return collect(model.fields)
    }
  } catch { /* ignore */ }

  try {
    const model = prisma._dmmf?.modelMap?.[modelName]
      || prisma._dmmf?.modelMap?.[modelName.charAt(0).toUpperCase() + modelName.slice(1)]
    if (model?.fields) {
      return collect(model.fields)
    }
  } catch { /* ignore */ }

  try {
    // Prisma 6+: _runtimeDataModel.models
    const model = prisma._runtimeDataModel?.models?.[modelName]
      || prisma._runtimeDataModel?.models?.[modelName.charAt(0).toUpperCase() + modelName.slice(1)]
    if (model?.fields) {
      return collect(model.fields)
    }
  } catch { /* ignore */ }

  try {
    const delegate = prisma[modelName]
    if (delegate?.fields) {
      return Object.keys(delegate.fields)
    }
  } catch { /* ignore */ }

  return []
}

/**
 * 构建字段名映射表：归一化名 -> 真实字段名
 */
function buildFieldMap(fields: string[]): Map<string, string> {
  const map = new Map<string, string>()
  for (const field of fields) {
    if (field == null || field === '') continue
    map.set(normalizeFieldName(field), field)
  }
  return map
}

/**
 * 获取 model 中 DateTime 类型的字段名集合
 */
function getDateTimeFields(prisma: any, modelName: string): Set<string> {
  const result = new Set<string>()

  try {
    const dmmf = prisma._baseDmmf || prisma._dmmf
    if (dmmf) {
      const model = dmmf.modelMap?.[modelName]
        || dmmf.modelMap?.[modelName.charAt(0).toUpperCase() + modelName.slice(1)]
      if (model?.fields) {
        for (const field of model.fields) {
          if (field.type === 'DateTime') result.add(field.name)
        }
        return result
      }
    }
  } catch { /* ignore */ }

  try {
    // Prisma 6+: _runtimeDataModel.models
    const model = prisma._runtimeDataModel?.models?.[modelName]
      || prisma._runtimeDataModel?.models?.[modelName.charAt(0).toUpperCase() + modelName.slice(1)]
    if (model?.fields) {
      for (const field of model.fields) {
        if (field.type === 'DateTime') result.add(field.name)
      }
    }
  } catch { /* ignore */ }

  return result
}

/**
 * 获取 model 中 @db.Date 类型的字段名集合（MySQL DATE，只存日期不存时间）
 * DMMF 中这类字段: type === 'DateTime' 且 nativeType === ['Date', []]
 */
function getDbDateFields(prisma: any, modelName: string): Set<string> {
  const result = new Set<string>()

  try {
    const dmmf = prisma._baseDmmf || prisma._dmmf
    if (dmmf) {
      const model = dmmf.modelMap?.[modelName]
        || dmmf.modelMap?.[modelName.charAt(0).toUpperCase() + modelName.slice(1)]
      if (model?.fields) {
        for (const field of model.fields) {
          if (field.type === 'DateTime' && Array.isArray(field.nativeType) && field.nativeType[0] === 'Date') {
            result.add(field.name)
          }
        }
        return result
      }
    }
  } catch { /* ignore */ }

  try {
    const model = prisma._runtimeDataModel?.models?.[modelName]
      || prisma._runtimeDataModel?.models?.[modelName.charAt(0).toUpperCase() + modelName.slice(1)]
    if (model?.fields) {
      for (const field of model.fields) {
        if (field.type === 'DateTime' && Array.isArray(field.nativeType) && field.nativeType[0] === 'Date') {
          result.add(field.name)
        }
      }
    }
  } catch { /* ignore */ }

  return result
}

/**
 * 修正 @db.Date 字段的 Date 对象时区问题
 * 根据前端传来的 timezoneOffset（分钟），还原用户本地日期，创建 UTC 零点 Date 对象
 */
function fixDbDateValues(
  obj: any,
  dbDateFields: Set<string>,
  timezoneOffset: number,
  pathStr: string
): void {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return

  for (const key of Object.keys(obj)) {
    const val = obj[key]

    if (dbDateFields.has(key)) {
      if (val instanceof Date && !isNaN(val.getTime())) {
        const localMs = val.getTime() - timezoneOffset * 60 * 1000
        const localDate = new Date(localMs)
        const y = localDate.getUTCFullYear()
        const m = localDate.getUTCMonth()
        const d = localDate.getUTCDate()
        const fixed = new Date(Date.UTC(y, m, d))
        if (fixed.getTime() !== val.getTime()) {
          obj[key] = fixed
          console.log(`[DEV] Fixed @db.Date field ${pathStr}.${key}: ${val.toISOString()} -> ${fixed.toISOString()}`)
        }
      } else if (typeof val === 'string' && ISO_DATE_RE.test(val)) {
        const parsed = new Date(val)
        if (!isNaN(parsed.getTime())) {
          const localMs = parsed.getTime() - timezoneOffset * 60 * 1000
          const localDate = new Date(localMs)
          const y = localDate.getUTCFullYear()
          const m = localDate.getUTCMonth()
          const d = localDate.getUTCDate()
          const fixed = new Date(Date.UTC(y, m, d))
          obj[key] = fixed
          console.log(`[DEV] Fixed @db.Date field ${pathStr}.${key}: "${val}" -> ${fixed.toISOString()}`)
        }
      } else if (val && typeof val === 'object' && !Array.isArray(val) && !(val instanceof Date)) {
        fixDbDateValues(val, dbDateFields, timezoneOffset, `${pathStr}.${key}`)
      }
    } else if (val && typeof val === 'object' && !Array.isArray(val) && !(val instanceof Date)) {
      fixDbDateValues(val, dbDateFields, timezoneOffset, `${pathStr}.${key}`)
    }
  }
}

/**
 * 获取 model 中可空（isRequired === false）的字段名集合
 * 用于判断 where 条件中 null 值是否合法
 */
function getNullableFields(prisma: any, modelName: string): Set<string> {
  const result = new Set<string>()

  try {
    const dmmf = prisma._baseDmmf || prisma._dmmf
    if (dmmf) {
      const model = dmmf.modelMap?.[modelName]
        || dmmf.modelMap?.[modelName.charAt(0).toUpperCase() + modelName.slice(1)]
      if (model?.fields) {
        for (const field of model.fields) {
          if (!field.isRequired) result.add(field.name)
        }
        return result
      }
    }
  } catch { /* ignore */ }

  try {
    const model = prisma._runtimeDataModel?.models?.[modelName]
      || prisma._runtimeDataModel?.models?.[modelName.charAt(0).toUpperCase() + modelName.slice(1)]
    if (model?.fields) {
      for (const field of model.fields) {
        if (!field.isRequired) result.add(field.name)
      }
    }
  } catch { /* ignore */ }

  return result
}

/**
 * 获取 model 中 enum 类型字段的信息
 */
function getEnumFieldMap(prisma: any, modelName: string): Map<string, { enumName: string, valuesMap: Map<string, string> }> {
  const result = new Map<string, { enumName: string, valuesMap: Map<string, string> }>()

  try {
    const dmmf = prisma._baseDmmf || prisma._dmmf
    if (dmmf) {
      const model = dmmf.modelMap?.[modelName]
        || dmmf.modelMap?.[modelName.charAt(0).toUpperCase() + modelName.slice(1)]
      if (model?.fields) {
        const enumMap = new Map<string, string[]>()
        const enums = dmmf.datamodel?.enums || dmmf.schema?.enumTypes?.model || []
        for (const e of enums) {
          const values = (e.values || []).map((v: any) => typeof v === 'string' ? v : v.name)
          enumMap.set(e.name, values)
        }
        for (const field of model.fields) {
          if (field.kind === 'enum' && field.type) {
            const enumValues = enumMap.get(field.type)
            if (enumValues && enumValues.length > 0) {
              const valuesMap = new Map<string, string>()
              for (const v of enumValues) { valuesMap.set(v.toLowerCase(), v) }
              result.set(field.name, { enumName: field.type, valuesMap })
            }
          }
        }
        return result
      }
    }
  } catch { /* ignore */ }

  try {
    // Prisma 6+: _runtimeDataModel
    const rdm = prisma._runtimeDataModel
    if (rdm) {
      const model = rdm.models?.[modelName]
        || rdm.models?.[modelName.charAt(0).toUpperCase() + modelName.slice(1)]
      if (model?.fields) {
        const enumMap = new Map<string, string[]>()
        const enums = rdm.enums || {}
        for (const [enumName, enumDef] of Object.entries(enums)) {
          const values = ((enumDef as any).values || []).map((v: any) => typeof v === 'string' ? v : v.name)
          enumMap.set(enumName, values)
        }
        for (const field of model.fields) {
          if (field.kind === 'enum' && field.type) {
            const enumValues = enumMap.get(field.type)
            if (enumValues && enumValues.length > 0) {
              const valuesMap = new Map<string, string>()
              for (const v of enumValues) { valuesMap.set(v.toLowerCase(), v) }
              result.set(field.name, { enumName: field.type, valuesMap })
            }
          }
        }
      }
    }
  } catch { /* ignore */ }

  return result
}

/**
 * 修正对象中 enum 字段的值（大小写不敏感匹配）
 */
function fixEnumValues(
  obj: any,
  enumFieldMap: Map<string, { enumName: string, valuesMap: Map<string, string> }>,
  pathStr: string,
  isWhere: boolean = false
): void {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return

  for (const key of Object.keys(obj)) {
    const enumInfo = enumFieldMap.get(key)
    if (!enumInfo) continue

    const val = obj[key]

    if (typeof val === 'string') {
      // where 里传 "ALL" 且 enum 定义里没有 ALL，表示不筛选，删掉该条件
      if (isWhere && val.toLowerCase() === 'all' && !enumInfo.valuesMap.has('all')) {
        delete obj[key]
        console.log(`[DEV] Removed enum filter "${val}" for ${pathStr}.${key} (treated as no filter)`)
        continue
      }
      const real = enumInfo.valuesMap.get(val.toLowerCase())
      if (real && real !== val) {
        obj[key] = real
        console.log(`[DEV] Fixed enum value: ${pathStr}.${key} "${val}" -> "${real}"`)
      }
    } else if (val && typeof val === 'object' && !Array.isArray(val)) {
      for (const op of Object.keys(val)) {
        if (typeof val[op] === 'string') {
          const real = enumInfo.valuesMap.get(val[op].toLowerCase())
          if (real && real !== val[op]) {
            console.log(`[DEV] Fixed enum value: ${pathStr}.${key}.${op} "${val[op]}" -> "${real}"`)
            val[op] = real
          }
        } else if (Array.isArray(val[op])) {
          val[op] = val[op].map((item: any) => {
            if (typeof item === 'string') {
              const real = enumInfo.valuesMap.get(item.toLowerCase())
              if (real && real !== item) {
                console.log(`[DEV] Fixed enum value: ${pathStr}.${key}.${op}[] "${item}" -> "${real}"`)
                return real
              }
            }
            return item
          })
        }
      }
    }
  }
}

/**
 * 字符串操作符集合（这些操作符只对 String 字段有效，对 Enum 字段无效）
 */
const STRING_OPS = new Set(['startsWith', 'endsWith', 'contains'])

/**
 * 修正 where 条件中对枚举字段误用字符串操作符（startsWith/endsWith/contains）的情况
 * 将其转换为 in/equals 查询，只在"枚举字段 + 字符串操作符"同时满足时触发
 */
function fixEnumStringOps(
  obj: any,
  enumFieldMap: Map<string, { enumName: string, valuesMap: Map<string, string> }>,
  pathStr: string
): void {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return

  for (const key of Object.keys(obj)) {
    const enumInfo = enumFieldMap.get(key)
    if (!enumInfo) continue

    const val = obj[key]
    if (!val || typeof val !== 'object' || Array.isArray(val)) continue

    for (const op of Object.keys(val)) {
      if (!STRING_OPS.has(op) || typeof val[op] !== 'string') continue

      const search = val[op].toLowerCase()
      const allValues = [...enumInfo.valuesMap.values()]
      let matched: string[]

      if (op === 'startsWith') {
        matched = allValues.filter(v => v.toLowerCase().startsWith(search))
      } else if (op === 'endsWith') {
        matched = allValues.filter(v => v.toLowerCase().endsWith(search))
      } else {
        // contains
        matched = allValues.filter(v => v.toLowerCase().includes(search))
      }

      if (matched.length === 0) {
        delete obj[key]
        console.log(`[DEV] Removed enum ${op} "${val[op]}" for ${pathStr}.${key} (no matching values)`)
      } else if (matched.length === 1) {
        obj[key] = matched[0]
        console.log(`[DEV] Fixed enum ${op}: ${pathStr}.${key} { ${op}: "${val[op]}" } -> "${matched[0]}"`)
      } else {
        obj[key] = { in: matched }
        console.log(`[DEV] Fixed enum ${op}: ${pathStr}.${key} { ${op}: "${val[op]}" } -> { in: [${matched.join(', ')}] }`)
      }
      break
    }
  }
}

/**
 * 递归修正对象中的字段名，使其匹配 Prisma model 的真实字段名
 */
function fixFieldNames(obj: any, fieldMap: Map<string, string>, pathStr: string): void {
  if (!obj || typeof obj !== 'object') return

  if (Array.isArray(obj)) {
    obj.forEach((item, i) => fixFieldNames(item, fieldMap, `${pathStr}[${i}]`))
    return
  }

  for (const key of Object.keys(obj)) {
    const normalized = normalizeFieldName(key)
    const realField = fieldMap.get(normalized)
    const currentKey = realField && realField !== key ? realField : key

    if (realField && realField !== key) {
      obj[realField] = obj[key]
      delete obj[key]
      console.log(`[DEV] Fixed field name: ${pathStr}.${key} -> ${pathStr}.${realField}`)
    }

    const val = obj[currentKey]
    if (val && typeof val === 'object' && !(val instanceof Date)) {
      fixFieldNames(val, fieldMap, `${pathStr}.${currentKey}`)
    }
  }
}

/**
 * 修正 groupBy 聚合字段的兼容性问题
 * 1. _count: { _all: true } → _count: true（groupBy 不支持 _all 展开写法）
 * 2. _count: { select: { _all: true } } → _count: true（AI 错误套用 findMany 语法）
 * 3. _sum: { select: { field: true } } → _sum: { field: true }（剥掉多余 select）
 * 4. orderBy 里的 _count: { _all: "desc" } → _count: { _all: "desc" } 保持不变（orderBy 支持）
 */
const AGGREGATE_KEYS = new Set(['_count', '_sum', '_avg', '_min', '_max'])

function fixGroupByAggregates(args: any): void {
  if (!args || typeof args !== 'object') return

  // 修顶层聚合参数（groupBy 的 _count/_sum 等在顶层）
  for (const key of AGGREGATE_KEYS) {
    const val = args[key]
    if (!val || typeof val !== 'object') continue

    // _count: { select: { _all: true } } → _count: { _all: true }（剥掉多余 select）
    if (val.select && Object.keys(val).length === 1) {
      const inner = val.select
      args[key] = inner
      console.log(`[DEV] Fixed groupBy ${key}: removed extra select wrapper`)
    }
    // _count: { _all: true } 是合法的 groupBy 语法，保持不变
  }

  // 修 select 里的聚合（如果有 select 的话）
  if (args.select && typeof args.select === 'object') {
    for (const key of AGGREGATE_KEYS) {
      const val = args.select[key]
      if (!val || typeof val !== 'object') continue
      if (val.select && Object.keys(val).length === 1) {
        const inner = val.select
        args.select[key] = inner
        console.log(`[DEV] Fixed groupBy select.${key}: removed extra select wrapper`)
      }
      // _count: { _all: true } 是合法的 groupBy 语法，保持不变
    }
  }

  // 修 having 里的聚合
  if (args.having && typeof args.having === 'object') {
    for (const key of AGGREGATE_KEYS) {
      const val = args.having[key]
      if (!val || typeof val !== 'object') continue
      if (val.select && Object.keys(val).length === 1) {
        args.having[key] = val.select
        console.log(`[DEV] Fixed groupBy having.${key}: removed extra select wrapper`)
      }
    }
  }

  // 修 orderBy 里的聚合: _count: { _all: "desc" } → _count: "desc"
  if (args.orderBy) {
    const items = Array.isArray(args.orderBy) ? args.orderBy : [args.orderBy]
    for (const item of items) {
      if (!item || typeof item !== 'object') continue
      for (const key of AGGREGATE_KEYS) {
        const val = item[key]
        if (!val || typeof val !== 'object') continue
        // _count: { _all: "desc" } → _count: "desc" 不行的话，保持对象但去掉 _all
        if (key === '_count' && val._all && Object.keys(val).length === 1) {
          const byFields = args.by
          if (Array.isArray(byFields) && byFields.length > 0) {
            item[key] = { [byFields[0]]: val._all }
            console.log(`[DEV] Fixed groupBy orderBy.${key}: { _all: "${val._all}" } -> { ${byFields[0]}: "${val._all}" }`)
          }
        }
        // _sum: { select: { field: "desc" } } → _sum: { field: "desc" }
        if (val.select && Object.keys(val).length === 1) {
          item[key] = val.select
          console.log(`[DEV] Fixed groupBy orderBy.${key}: removed extra select wrapper`)
        }
      }
    }
  }
}

/**
 * ISO 8601 日期字符串正则
 */
const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:?\d{2})?)?$/

/**
 * 递归清理对象中的无效值，并将 ISO 日期字符串转为 Date 对象
 * 返回 true 表示整个对象应该被删除（变成空对象了）
 */
 // Prisma 查询操作符集合，这些键名中 null 是合法值（如 { not: null } 表示 IS NOT NULL）
const PRISMA_OPERATORS = new Set([
  'not', 'equals', 'gt', 'gte', 'lt', 'lte', 'in', 'notIn',
  'contains', 'startsWith', 'endsWith', 'has', 'hasEvery', 'hasSome', 'isEmpty',
  'every', 'some', 'none', 'is', 'isNot', 'mode', 'search'
])

function cleanInvalidValues(obj: any, path: string, dateTimeFields?: Set<string>, nullableFields?: Set<string>): boolean {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) {
    return false
  }

  for (const key of Object.keys(obj)) {
    const val = obj[key]

    if (isInvalidFieldValue(val)) {
      delete obj[key]
      console.log(`[DEV] Removed invalid ${path}.${key} (was "${val}")`)
    } else if (val === null && nullableFields && !nullableFields.has(key) && !PRISMA_OPERATORS.has(key)) {
      delete obj[key]
      console.log(`[DEV] Removed null for non-nullable field ${path}.${key}`)
    } else if (typeof val === 'string' && dateTimeFields?.has(key) && ISO_DATE_RE.test(val)) {
      const date = new Date(val)
      if (!isNaN(date.getTime())) {
        obj[key] = date
        console.log(`[DEV] Converted ${path}.${key} string to Date`)
      }
    } else if (Array.isArray(val)) {
      for (let i = val.length - 1; i >= 0; i--) {
        const item = val[i]
        if (item && typeof item === 'object' && !Array.isArray(item) && !(item instanceof Date)) {
          const shouldDelete = cleanInvalidValues(item, `${path}.${key}[${i}]`, dateTimeFields, nullableFields)
          if (shouldDelete || Object.keys(item).length === 0) {
            val.splice(i, 1)
            console.log(`[DEV] Removed empty ${path}.${key}[${i}]`)
          }
        }
      }
      if (val.length === 0) {
        delete obj[key]
        console.log(`[DEV] Removed empty array ${path}.${key}`)
      }
    } else if (val && typeof val === 'object' && !Array.isArray(val) && !(val instanceof Date)) {
      const shouldDelete = cleanInvalidValues(val, `${path}.${key}`, dateTimeFields, nullableFields)
      if (shouldDelete || Object.keys(val).length === 0) {
        delete obj[key]
        console.log(`[DEV] Removed empty ${path}.${key}`)
      }
    }
  }

  return Object.keys(obj).length === 0
}

/**
 * 递归将 DateTime 字段的日期字符串转为 Date 对象（不删除任何字段）
 * 用于 data/create/update 等写入参数，避免误删用户故意传的 null
 */
function convertDateStrings(obj: any, path: string, dateTimeFields: Set<string>): void {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return

  for (const key of Object.keys(obj)) {
    const val = obj[key]
    if (typeof val === 'string' && dateTimeFields.has(key) && ISO_DATE_RE.test(val)) {
      const date = new Date(val)
      if (!isNaN(date.getTime())) {
        obj[key] = date
        console.log(`[DEV] Converted ${path}.${key} string "${val}" to Date`)
      }
    } else if (val && typeof val === 'object' && !Array.isArray(val) && !(val instanceof Date)) {
      convertDateStrings(val, `${path}.${key}`, dateTimeFields)
    }
  }
}

/**
 * 获取引用当前 model 的子表关系列表（一层，仅单字段外键）
 * 返回: [{ childModel, childFkField, parentPkField }]
 * 例如 device_log.deviceId -> device.id => { childModel: 'device_log', childFkField: 'deviceId', parentPkField: 'id' }
 */
function getChildRelations(prisma: any, modelName: string): Array<{ childModel: string, childFkField: string, parentPkField: string }> {
  const results: Array<{ childModel: string, childFkField: string, parentPkField: string }> = []

  // 尝试多种 DMMF 来源
  const models =
    prisma._runtimeDataModel?.models
    || prisma._baseDmmf?.modelMap
    || prisma._dmmf?.modelMap

  if (!models) {
    console.log(`[DEV] No DMMF models found for cascade relation lookup`)
    return results
  }

  // 找到当前 model 在 DMMF 中的真实名称（处理大小写）
  const modelNameLower = modelName.toLowerCase()
  let resolvedModelName = modelName
  for (const key of Object.keys(models)) {
    if (key.toLowerCase() === modelNameLower) {
      resolvedModelName = key
      break
    }
  }

  console.log(`[DEV] Looking for child relations of "${modelName}" (resolved: "${resolvedModelName}") among ${Object.keys(models).length} models`)

  for (const [otherModelName, otherModel] of Object.entries(models)) {
    if (otherModelName.toLowerCase() === modelNameLower) continue
    const fields = (otherModel as any).fields || []
    for (const field of fields) {
      // 关系字段: kind === 'object', type 指向目标 model（DMMF 里 type 用的是 PascalCase model 名）
      if (field.kind === 'object' && field.type.toLowerCase() === modelNameLower) {
        const fromFields: string[] = field.relationFromFields || []
        const toFields: string[] = field.relationToFields || []
        // 只处理单字段外键
        if (fromFields.length === 1 && toFields.length === 1) {
          // childModel 用小写（prisma client 的 delegate 名是小写开头）
          const childDelegate = otherModelName.charAt(0).toLowerCase() + otherModelName.slice(1)
          results.push({
            childModel: childDelegate,
            childFkField: fromFields[0],
            parentPkField: toFields[0],
          })
        }
      }
    }
  }

  return results
}

/**
 * 获取当前 model 自身定义的 FK 关系（即当前 model 引用了哪些父表）
 * 返回: [{ fkField, referencedModel, referencedField }]
 * 例如 appointment.patientId -> patientprofile.id
 *   => { fkField: 'patientId', referencedModel: 'patientprofile', referencedField: 'id' }
 */
function getFkRelations(prisma: any, modelName: string): Array<{ fkField: string, referencedModel: string, referencedField: string }> {
  const results: Array<{ fkField: string, referencedModel: string, referencedField: string }> = []

  const models =
    prisma._runtimeDataModel?.models
    || prisma._baseDmmf?.modelMap
    || prisma._dmmf?.modelMap

  if (!models) return results

  const modelNameLower = modelName.toLowerCase()
  let model: any = null
  for (const [key, value] of Object.entries(models)) {
    if (key.toLowerCase() === modelNameLower) {
      model = value
      break
    }
  }

  if (!model?.fields) return results

  for (const field of (model as any).fields) {
    if (field.kind === 'object' && field.relationFromFields && field.relationToFields) {
      const fromFields: string[] = field.relationFromFields || []
      const toFields: string[] = field.relationToFields || []
      if (fromFields.length === 1 && toFields.length === 1) {
        const referencedDelegate = field.type.charAt(0).toLowerCase() + field.type.slice(1)
        results.push({
          fkField: fromFields[0],
          referencedModel: referencedDelegate,
          referencedField: toFields[0],
        })
      }
    }
  }

  return results
}
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/**
 * 获取 model 中所有 VarChar(36) 类型的字段名（即 UUID 字段）
 * 通过 DMMF 检查 field.type === 'String' 且 nativeType 包含 VarChar(36)
 * 如果无法从 nativeType 判断，则回退到字段名以 _id 结尾或等于 id 的 String 字段
 */
function getUuidFields(prisma: any, modelName: string): string[] {
  const result: string[] = []

  const sources = [
    prisma._baseDmmf?.modelMap,
    prisma._dmmf?.modelMap,
    prisma._runtimeDataModel?.models,
  ]

  for (const modelMap of sources) {
    if (!modelMap) continue
    const model = modelMap[modelName]
      || modelMap[modelName.charAt(0).toUpperCase() + modelName.slice(1)]
    if (!model?.fields) continue

    let hasNativeType = false
    for (const field of model.fields) {
      if (field.type === 'String' && Array.isArray(field.nativeType)) {
        hasNativeType = true
        // nativeType: ['VarChar', ['36']] or ['VarChar', [36]]
        if (field.nativeType[0] === 'VarChar') {
          const len = field.nativeType[1]?.[0]
          if (String(len) === '36') {
            result.push(field.name)
          }
        }
      }
    }

    // 如果找到了 nativeType 信息，直接返回
    if (hasNativeType) return result

    // 回退：没有 nativeType 信息时，用字段名启发式判断
    for (const field of model.fields) {
      if (field.type === 'String' && (field.name === 'id' || field.name.endsWith('_id'))) {
        result.push(field.name)
      }
    }
    return result
  }

  return result
}

/**
 * 每次请求的时区偏移（分钟），由 express 中间件从 x-timezone-offset 头设置
 * Proxy 在执行时读取此值
 */
let __currentTimezoneOffset: number | undefined = undefined

/**
 * 创建 Prisma Client 代理，自动清理无效参数和转换格式
 * Prisma 多字段排序必须用数组格式，这里做兼容转换
 */
function createPrismaProxy(prisma: any): any {
  // 缓存每个 model 的字段映射表
  const fieldMapCache = new Map<string, Map<string, string>>()
  const enumFieldMapCache = new Map<string, Map<string, { enumName: string, valuesMap: Map<string, string> }>>()
  const dateTimeFieldsCache = new Map<string, Set<string>>()
  // 缓存每个 model 的子表关系
  const childRelationsCache = new Map<string, Array<{ childModel: string, childFkField: string, parentPkField: string }>>()
  const dbDateFieldsCache = new Map<string, Set<string>>()
  const nullableFieldsCache = new Map<string, Set<string>>()
  const uuidFieldsCache = new Map<string, string[]>()
  const fkRelationsCache = new Map<string, Array<{ fkField: string, referencedModel: string, referencedField: string }>>()

  // 构建 model delegate 名映射表（归一化名 → 真实名）
  const modelDelegateMap = new Map<string, string>()
  for (const key of Object.keys(prisma)) {
    if (key.startsWith('$') || key.startsWith('_')) continue
    if (typeof prisma[key] !== 'object' || prisma[key] === null) continue
    const normalized = normalizeFieldName(key)
    if (modelDelegateMap.has(normalized)) {
      console.log(`[DEV] WARNING: model delegate name collision after normalization: "${key}" and "${modelDelegateMap.get(normalized)}" both normalize to "${normalized}"`)
      continue  // 保留先遍历到的
    }
    modelDelegateMap.set(normalized, key)
  }

  function getFieldMap(modelName: string): Map<string, string> {
    if (!fieldMapCache.has(modelName)) {
      const fields = getModelFields(prisma, modelName)
      fieldMapCache.set(modelName, buildFieldMap(fields))
      if (fields.length > 0) {
        console.log(`[DEV] Cached fields for ${modelName}: [${fields.join(', ')}]`)
      }
    }
    return fieldMapCache.get(modelName)!
  }

  function getEnumMap(modelName: string): Map<string, { enumName: string, valuesMap: Map<string, string> }> {
    if (!enumFieldMapCache.has(modelName)) {
      enumFieldMapCache.set(modelName, getEnumFieldMap(prisma, modelName))
    }
    return enumFieldMapCache.get(modelName)!
  }

  function getDateTimeFieldSet(modelName: string): Set<string> {
    if (!dateTimeFieldsCache.has(modelName)) {
      dateTimeFieldsCache.set(modelName, getDateTimeFields(prisma, modelName))
    }
    return dateTimeFieldsCache.get(modelName)!
  }

  function getChildRels(modelName: string): Array<{ childModel: string, childFkField: string, parentPkField: string }> {
    if (!childRelationsCache.has(modelName)) {
      const rels = getChildRelations(prisma, modelName)
      childRelationsCache.set(modelName, rels)
      if (rels.length > 0) {
        console.log(`[DEV] Cascade relations for ${modelName}:`, rels.map(r => `${r.childModel}.${r.childFkField}`).join(', '))
      }
    }
    return childRelationsCache.get(modelName)!
  }

  function getDbDateFieldSet(modelName: string): Set<string> {
    if (!dbDateFieldsCache.has(modelName)) {
      dbDateFieldsCache.set(modelName, getDbDateFields(prisma, modelName))
    }
    return dbDateFieldsCache.get(modelName)!
  }

  function getNullableFieldSet(modelName: string): Set<string> {
    if (!nullableFieldsCache.has(modelName)) {
      nullableFieldsCache.set(modelName, getNullableFields(prisma, modelName))
    }
    return nullableFieldsCache.get(modelName)!
  }

  function getUuidFieldList(modelName: string): string[] {
    if (!uuidFieldsCache.has(modelName)) {
      uuidFieldsCache.set(modelName, getUuidFields(prisma, modelName))
    }
    return uuidFieldsCache.get(modelName)!
  }

  function getFkRelList(modelName: string): Array<{ fkField: string, referencedModel: string, referencedField: string }> {
    if (!fkRelationsCache.has(modelName)) {
      fkRelationsCache.set(modelName, getFkRelations(prisma, modelName))
    }
    return fkRelationsCache.get(modelName)!
  }

  return new Proxy(prisma, {
    get(target, prop: string) {
      let value = target[prop]
      if (typeof prop !== 'string') {
        return value
      }

      // 拦截 $transaction：数组里有非 PrismaPromise 时兜底处理
      if (prop === '$transaction' && typeof value === 'function') {
        return function(input: any, ...rest: any[]) {
          if (Array.isArray(input)) {
            const hasNonPrismaPromise = input.some(
              (p: any) => !p || typeof p.requestTransaction !== 'function'
            )
            if (hasNonPrismaPromise) {
              console.log(`[DEV] $transaction fallback: array contains non-PrismaPromise elements`)
              return (async () => {
                const results = []
                for (const p of input) results.push(await p)
                return results
              })()
            }
          }
          return value.call(target, input, ...rest)
        }
      }

      // 跳过特殊属性（prop 可能是 symbol）
      if (typeof prop !== 'string') {
        return value
      }
      if (prop.startsWith('$') || prop.startsWith('_')) {
        return value
      }

      // model 名模糊匹配
      if (value === undefined) {
        const normalized = normalizeFieldName(prop)
        const realName = modelDelegateMap.get(normalized)
        if (realName) {
          console.log(`[DEV] Model name fuzzy match: "${prop}" -> "${realName}"`)
          value = target[realName]
          prop = realName  // 更新 prop 使后续字段缓存使用正确的 model 名
        }
      }

      if (typeof value !== 'object' || value === null) {
        return value
      }

      // 为每个 model 创建代理
      return new Proxy(value, {
        get(modelTarget, action: string) {
          const method = modelTarget[action]

          if (typeof method !== 'function') {
            return method
          }

          // 包装方法，自动清理无效参数
          return async function(args: any) {
            if (!args) return method.call(modelTarget, args)

            const fieldMap = getFieldMap(String(prop))

            // 修正字段名（蛇形/驼峰/大小写不敏感）
            if (fieldMap.size > 0) {
              if (args.where) fixFieldNames(args.where, fieldMap, 'where')
              if (args.orderBy) {
                if (Array.isArray(args.orderBy)) {
                  args.orderBy.forEach((item: any, i: number) => fixFieldNames(item, fieldMap, `orderBy[${i}]`))
                } else if (typeof args.orderBy === 'object') {
                  fixFieldNames(args.orderBy, fieldMap, 'orderBy')
                }
              }
              if (args.select) fixFieldNames(args.select, fieldMap, 'select')
              if (args.include) fixFieldNames(args.include, fieldMap, 'include')
              if (args.cursor) fixFieldNames(args.cursor, fieldMap, 'cursor')
              if (args.distinct && Array.isArray(args.distinct)) {
                args.distinct = args.distinct.map((d: string) => {
                  const real = fieldMap.get(normalizeFieldName(d))
                  if (real && real !== d) {
                    console.log(`[DEV] Fixed distinct field: ${d} -> ${real}`)
                    return real
                  }
                  return d
                })
              }
              // 修正 data 字段名（create/update）
              if (args.data) fixFieldNames(args.data, fieldMap, 'data')
              // 修正 create/update/upsert 嵌套参数
              if (args.create) fixFieldNames(args.create, fieldMap, 'create')
              if (args.update) fixFieldNames(args.update, fieldMap, 'update')
            }

            // 修正 enum 值（大小写不敏感）
            const enumMap = getEnumMap(String(prop))
            if (enumMap.size > 0) {
              if (args.where) fixEnumValues(args.where, enumMap, 'where', true)
              if (args.data) fixEnumValues(args.data, enumMap, 'data')
              if (args.create) fixEnumValues(args.create, enumMap, 'create')
              if (args.update) fixEnumValues(args.update, enumMap, 'update')
              // 修正枚举字段误用字符串操作符（startsWith/endsWith/contains）
              if (args.where) fixEnumStringOps(args.where, enumMap, 'where')
            }

            // 修正 @db.Date 字段的时区问题
            const tzOffset = __currentTimezoneOffset
            if (tzOffset !== undefined) {
              const dbDateFieldSet = getDbDateFieldSet(String(prop))
              if (dbDateFieldSet.size > 0) {
                if (args.where) fixDbDateValues(args.where, dbDateFieldSet, tzOffset, 'where')
                if (args.data) fixDbDateValues(args.data, dbDateFieldSet, tzOffset, 'data')
                if (args.create) fixDbDateValues(args.create, dbDateFieldSet, tzOffset, 'create')
                if (args.update) fixDbDateValues(args.update, dbDateFieldSet, tzOffset, 'update')
              }
            }

            // 清理 where（含嵌套）
            const dtFields = getDateTimeFieldSet(String(prop))
            const nullableFieldSet = getNullableFieldSet(String(prop))
            if (args.where) {
              const isEmpty = cleanInvalidValues(args.where, 'where', dtFields, nullableFieldSet)
              if (isEmpty) delete args.where
            }

            // 将 data/create/update 中的日期字符串转为 Date 对象（不删字段）
            if (dtFields.size > 0) {
              if (args.data) convertDateStrings(args.data, 'data', dtFields)
              if (args.create) convertDateStrings(args.create, 'create', dtFields)
              if (args.update) convertDateStrings(args.update, 'update', dtFields)
            }

            // 清理简单参数：take, skip, distinct
            for (const param of ['take', 'skip', 'distinct']) {
              if (isInvalidValue(args[param])) {
                const val = args[param]
                delete args[param]
                console.log(`[DEV] Removed invalid ${param} (was "${val}")`)
              }
            }

            // 清理 cursor（对象格式，需要递归）
            if (args.cursor) {
              const isEmpty = cleanInvalidValues(args.cursor, 'cursor', dtFields, nullableFieldSet)
              if (isEmpty) delete args.cursor
            }

            // 清理和转换 orderBy
            if (args.orderBy) {
              if (Array.isArray(args.orderBy)) {
                args.orderBy = args.orderBy.filter((item: any) => {
                  if (!item || typeof item !== 'object') return false
                  for (const key of Object.keys(item)) {
                    if (isInvalidValue(item[key])) {
                      console.log(`[DEV] Removed invalid orderBy.${key} (was "${item[key]}")`)
                      return false
                    }
                  }
                  return true
                })
                if (args.orderBy.length === 0) delete args.orderBy
              } else if (typeof args.orderBy === 'object') {
                for (const key of Object.keys(args.orderBy)) {
                  if (isInvalidValue(args.orderBy[key])) {
                    delete args.orderBy[key]
                    console.log(`[DEV] Removed invalid orderBy.${key}`)
                  }
                }
                const keys = Object.keys(args.orderBy)
                if (keys.length === 0) {
                  delete args.orderBy
                } else if (keys.length > 1) {
                  args.orderBy = keys.map(key => ({ [key]: args.orderBy[key] }))
                  console.log(`[DEV] Normalized orderBy for ${String(prop)}.${action}:`, args.orderBy)
                }
              } else if (isInvalidValue(args.orderBy)) {
                delete args.orderBy
              }
            }

            // 修正 groupBy 聚合字段的错误 select 包裹
            if (action === 'groupBy') {
              fixGroupByAggregates(args)
            }

            // 级联删除：delete/deleteMany 时自动清理子表关联记录
            if (action === 'delete' || action === 'deleteMany') {
              const modelName = String(prop)
              const childRels = getChildRels(modelName)
              if (childRels.length > 0) {
                console.log(`[DEV] Cascade delete triggered for ${modelName}.${action}`)

                // 用交互式 $transaction 保证事务性和顺序
                const cascadeDelete = async () => {
                  try {
                    // 先查出要删的记录，拿到主键值
                    const pkFields = [...new Set(childRels.map(r => r.parentPkField))]
                    const selectObj: any = {}
                    for (const pk of pkFields) selectObj[pk] = true

                    const toDelete = await prisma[modelName].findMany({
                      where: args.where,
                      select: selectObj,
                    })

                    if (toDelete.length === 0) {
                      return method.call(modelTarget, args)
                    }

                    console.log(`[DEV] Found ${toDelete.length} ${modelName} record(s) to delete, cleaning child tables...`)

                    // 交互式事务：tx 是一个事务内的 prisma client
                    return prisma.$transaction(async (tx: any) => {
                      for (const rel of childRels) {
                        const parentIds = toDelete.map((r: any) => r[rel.parentPkField]).filter((v: any) => v != null)
                        if (parentIds.length === 0) continue

                        if (!tx[rel.childModel]) {
                          console.log(`[DEV] WARNING: tx["${rel.childModel}"] not found, skipping cascade for this relation`)
                          continue
                        }

                        const deleted = await tx[rel.childModel].deleteMany({
                          where: { [rel.childFkField]: { in: parentIds } }
                        })
                        console.log(`[DEV] Cascade deleted ${deleted.count} ${rel.childModel} records where ${rel.childFkField} in [${parentIds.length} ids]`)
                      }

                      // 最后执行原始的 delete/deleteMany（用 tx 保证在同一事务内）
                      if (!tx[modelName]) {
                        console.log(`[DEV] WARNING: tx["${modelName}"] not found, trying original method`)
                        return method.call(modelTarget, args)
                      }
                      return tx[modelName][action](args)
                    })
                  } catch (err: any) {
                    console.error(`[DEV] Cascade delete failed for ${modelName}, falling back to direct delete:`, err.message)
                    return method.call(modelTarget, args)
                  }
                }

                return cascadeDelete()
              }
            }

            // ===== UUID auto-fix: 查询返回空时，尝试将 UUID 值换到同表其他 UUID 字段 =====
            const QUERY_ACTIONS = new Set(['findFirst', 'findUnique', 'findMany', 'count'])
            if (QUERY_ACTIONS.has(action) && args.where) {
              const modelName = String(prop)
              const uuidFields = getUuidFieldList(modelName)

              // 从 where 顶层提取 UUID 值条目
              const uuidEntries: Array<{ field: string, value: string }> = []
              for (const [field, value] of Object.entries(args.where)) {
                if (typeof value === 'string' && UUID_RE.test(value) && uuidFields.includes(field)) {
                  uuidEntries.push({ field, value })
                }
              }

              if (uuidEntries.length > 0) {
                // 先执行原始查询
                const originalResult = await method.call(modelTarget, args)

                // 判断是否为空结果
                const isEmpty = originalResult === null
                  || (Array.isArray(originalResult) && originalResult.length === 0)
                  || (typeof originalResult === 'number' && originalResult === 0)

                if (isEmpty) {
                  // Phase 1: 同表 UUID 字段交换
                  for (const entry of uuidEntries) {
                    const candidates = uuidFields.filter(f => f !== entry.field)
                    for (const candidate of candidates) {
                      const altWhere = { ...args.where }
                      delete altWhere[entry.field]
                      altWhere[candidate] = entry.value

                      try {
                        const altMethod = action === 'findUnique' ? modelTarget.findFirst : method
                        const altResult = await altMethod.call(modelTarget, { ...args, where: altWhere })
                        const altIsEmpty = altResult === null
                          || (Array.isArray(altResult) && altResult.length === 0)
                          || (typeof altResult === 'number' && altResult === 0)

                        if (!altIsEmpty) {
                          console.log(`[DEV] ⚠️ UUID auto-fix: ${modelName}.${action} where.${entry.field}="${entry.value}" → matched on where.${candidate}`)
                          return altResult
                        }
                      } catch { /* candidate 字段查询失败，跳过 */ }
                    }
                  }

                  // Phase 2: 跨表（关联表）UUID 修复
                  // 对每个 FK 字段，去关联表里遍历所有 UUID 字段查找匹配，
                  // 找到后取出关联表对应引用字段的值作为新 FK 值重新查询
                  const fkRels = getFkRelList(modelName)
                  for (const entry of uuidEntries) {
                    const fkRel = fkRels.find(r => r.fkField === entry.field)
                    if (!fkRel) continue

                    const refModelDelegate = (prisma as any)[fkRel.referencedModel]
                    if (!refModelDelegate) continue

                    const refUuidFields = getUuidFieldList(fkRel.referencedModel)
                    for (const refUuidField of refUuidFields) {
                      try {
                        const refResult = await refModelDelegate.findFirst({
                          where: { [refUuidField]: entry.value },
                          select: { [fkRel.referencedField]: true },
                        })
                        if (refResult && refResult[fkRel.referencedField]) {
                          const newFkValue = refResult[fkRel.referencedField]
                          if (newFkValue === entry.value) continue

                          const altWhere = { ...args.where, [entry.field]: newFkValue }
                          const altMethod = action === 'findUnique' ? modelTarget.findFirst : method
                          const altResult = await altMethod.call(modelTarget, { ...args, where: altWhere })
                          const altIsEmpty = altResult === null
                            || (Array.isArray(altResult) && altResult.length === 0)
                            || (typeof altResult === 'number' && altResult === 0)

                          if (!altIsEmpty) {
                            console.log(`[DEV] ⚠️ UUID auto-fix (cross-table): ${modelName}.${action} where.${entry.field}="${entry.value}" → found in ${fkRel.referencedModel}.${refUuidField}, resolved ${fkRel.referencedField}="${newFkValue}"`)
                            return altResult
                          }
                        }
                      } catch { /* 关联表查询失败，跳过 */ }
                    }
                  }
                }

                return originalResult
              }
            }

            return method.call(modelTarget, args)
          }
        }
      })
    }
  })
}

import { AsyncLocalStorage } from 'async_hooks'

// === PrismaClient 缓存池与 AsyncLocalStorage ===
interface RequestContext {
  tzOffset?: number
  isPipelineTest?: boolean
  pipelinePage?: string
}
const reqContext = new AsyncLocalStorage<RequestContext>()
const prismaInstances = new Map<string, any>()

function ensureUtf8mb4Url(rawUrl: string) {
  if (!rawUrl || rawUrl === 'default') return rawUrl
  if (/[?&]charset=/i.test(rawUrl)) return rawUrl
  return rawUrl.includes('?') ? `${rawUrl}&charset=utf8mb4` : `${rawUrl}?charset=utf8mb4`
}

function getPrismaInstanceForContext(ctx?: RequestContext) {
  const isPipelineTest = ctx?.isPipelineTest
  const pipelinePage = ctx?.pipelinePage

  // Local Windows fallback matches src/tools/prisma.ts (no .env required for quick review)
const LOCAL_DEFAULT_DATABASE_URL =
  'mysql://root:LocalDev123!@localhost:3306/PROJ_fcb9e6ee_snap_20260726_092922_893'
let effectiveUrl = process.env.DATABASE_URL || LOCAL_DEFAULT_DATABASE_URL
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = LOCAL_DEFAULT_DATABASE_URL
}

  if (isPipelineTest && pipelinePage && process.env.DATABASE_URL) {
    try {
      const u = new URL(process.env.DATABASE_URL)
      // 提取默认库名并附加 test tag，如果是从根目录切，比如 /PROJ_demo -> /PROJ_demo__test__Abc
      const dbPath = u.pathname.replace(/^\/+/, '')
      u.pathname = `/${dbPath}__test__${pipelinePage.toLowerCase()}`
      effectiveUrl = u.toString()
    } catch {
      // url parse fail fallback
    }
  }

  effectiveUrl = ensureUtf8mb4Url(effectiveUrl)

  const cacheKey = effectiveUrl
  if (prismaInstances.has(cacheKey)) {
    return prismaInstances.get(cacheKey)
  }

  // 构建新连接
  const clientConfig = effectiveUrl !== 'default' ? { datasources: { db: { url: effectiveUrl } } } : {}
  const client = new PrismaClient(clientConfig)

  client
    .$connect()
    .then(() => client.$executeRawUnsafe('SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci'))
    .catch((error: unknown) => {
      console.error('[DEV] failed to initialize utf8mb4 session charset', error)
    })

  // 代理客户端，绑定创建时的上下文（在代理里用到）
  const proxyClient = createPrismaProxy(client)
  prismaInstances.set(cacheKey, proxyClient)

  console.log(`[DEV] Created new Prisma instance for: ${cacheKey}`)
  return proxyClient
}

// 动态代理 Getter：供 server-action 的 prisma.ts 获取当前请求的专属 Prisma Client
Object.defineProperty(globalThis, '__runtimePrisma', {
  get() {
    return getPrismaInstanceForContext(reqContext.getStore())
  }
})
console.log('[DEV] Prisma Client getter injected to globalThis.__runtimePrisma')

const app = express()
app.use(cors({
  exposedHeaders: ['X-Auth-Role']  // 允许前端读取这个响应头
}))
app.use(express.json())

// 中间件：拦截请求头，从头组装 ALS 上下文
app.use((req, _res, next) => {
  const tzHeader = req.headers['x-timezone-offset']
  const tzOffset = tzHeader !== undefined ? Number.parseInt(String(tzHeader), 10) : undefined

  const isPipelineTest = req.headers['x-pipeline-test'] === '1'
  const pipelinePage = req.headers['x-pipeline-page'] as string | undefined

  __currentTimezoneOffset = Number.isNaN(tzOffset) ? undefined : tzOffset

  reqContext.run({
    tzOffset: __currentTimezoneOffset,
    isPipelineTest,
    pipelinePage
  }, () => {
    next()
  })
})

// 挂载增量构建产物的 router
app.use(routePath, router)

// 挂载第三方 OAuth 路由（Logto OIDC 回调）
try {
  const { setupThirdPartyAuth } = require('./thirdparty/auth')
  setupThirdPartyAuth(app)
  console.log('[DEV] Third-party auth routes registered (Logto OIDC callback)')
} catch (e) {
  console.log('[DEV] Third-party auth not available:', (e as Error).message)
}

const PORT = process.env.PORT || 3100

app.get('/healthz', (_req, res) => {
  res.status(200).json({
    ok: true,
    service: 'rpc',
    port: Number(PORT),
    pid: process.pid,
    uptimeSec: Math.round(process.uptime()),
  })
})

app.listen(PORT, () => {
  console.log(`[DEV] RPC Server running at http://localhost:${PORT}`)
  console.log(`[DEV] RPC endpoint: http://localhost:${PORT}${routePath}`)
  console.log(`[DEV] healthz: http://localhost:${PORT}/healthz`)
})
