/**
 * 从 prisma/schema.prisma 自动提取并生成：
 *   1. shared-enums.ts — 枚举中心（所有 Prisma enum）
 *   2. 在 schema.prisma 的 FK 字段后追加血缘注释（// FK → table.column）
 *
 * 用法: npx tsx scripts/generate-schema-meta.ts
 * schema 变了重新跑一次即可。
 */

import * as fs from 'fs'
import * as path from 'path'

const SCHEMA_PATH = path.resolve(__dirname, '../prisma/schema.prisma')
const ENUMS_OUTPUT = path.resolve(__dirname, '../src/shared-enums.ts')

const schema = fs.readFileSync(SCHEMA_PATH, 'utf-8')

// ================================================================
// 1. 解析枚举
// ================================================================

interface EnumDef {
  name: string
  values: string[]
}

function parseEnums(src: string): EnumDef[] {
  const enums: EnumDef[] = []
  const regex = /enum\s+(\w+)\s*\{([^}]+)\}/g
  let match: RegExpExecArray | null

  while ((match = regex.exec(src)) !== null) {
    const name = match[1]
    const body = match[2]
    const values = body
      .split('\n')
      .map(line => line.trim())
      .filter(line => line && !line.startsWith('//'))
    enums.push({ name, values })
  }
  return enums
}

// ================================================================
// 2. 解析 @relation 提取 FK→PK 映射
// ================================================================

interface FKMapping {
  /** FK 字段名，如 paper_id */
  fkColumn: string
  /** 目标表名，如 paper */
  toTable: string
  /** 目标字段名，如 id */
  toColumn: string
  /** 是否级联删除 */
  cascade: boolean
}

function parseRelationsFromModel(modelBody: string): FKMapping[] {
  const mappings: FKMapping[] = []
  const lines = modelBody.split('\n')

  for (const line of lines) {
    const relMatch = line.match(
      /@relation\s*\([^)]*fields:\s*\[(\w+)\]\s*,\s*references:\s*\[(\w+)\]([^)]*)\)/
    )
    if (relMatch) {
      const fkColumn = relMatch[1]
      const toColumn = relMatch[2]
      const rest = relMatch[3]
      const cascade = rest.includes('Cascade')

      // 从行首取目标 model 名（字段类型）
      const typeMatch = line.trim().match(/^\w+\s+(\w+)/)
      const toTable = typeMatch ? typeMatch[1] : 'unknown'

      mappings.push({ fkColumn, toTable, toColumn, cascade })
    }
  }
  return mappings
}

// ================================================================
// 3. 给 schema.prisma 的 FK 字段行追加注释
// ================================================================

function annotateSchema(src: string): string {
  const lines = src.split('\n')
  const output: string[] = []

  let inModel = false
  let currentModelBody = ''
  let currentModelStartLine = 0
  let modelLines: string[] = []

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]

    // 检测 model 开始
    if (line.match(/^model\s+\w+\s*\{/)) {
      inModel = true
      currentModelBody = ''
      currentModelStartLine = i
      modelLines = [line]
      continue
    }

    // 在 model 内部收集行
    if (inModel) {
      modelLines.push(line)

      // 检测 model 结束
      if (/^\s*\}(\s*\/\/.*)?\s*$/.test(line)) {
        inModel = false
        currentModelBody = modelLines.join('\n')

        // 解析该 model 的 @relation
        const fks = parseRelationsFromModel(currentModelBody)

        // 重新处理 model 内的行，给 FK 字段追加注释
        for (const ml of modelLines) {
          let annotatedLine = ml

          // 对每个 FK 映射，检查这行是否定义了对应的 FK 字段
          for (const fk of fks) {
            // 匹配: fkColumn  String  @db.VarChar(36) 这种字段定义行
            const fieldRegex = new RegExp(
              `^(\\s+${fk.fkColumn}\\s+\\w+.*)$`
            )
            if (fieldRegex.test(ml)) {
              // 先清理旧的 FK 注释（如果已经有的话）
              annotatedLine = annotatedLine.replace(/\s*\/\/ FK → .*$/, '')
              // 追加血缘注释
              const cascadeNote = fk.cascade ? ', 级联删除' : ''
              annotatedLine += ` // FK → ${fk.toTable}.${fk.toColumn}${cascadeNote}`
              break
            }
          }

          // 跳过 @relation 那行（纯关系定义行，不是字段定义）
          output.push(annotatedLine)
        }
        continue
      }
      continue
    }

    output.push(line)
  }

  return output.join('\n')
}

// ================================================================
// 执行
// ================================================================

// --- shared-enums.ts ---
const enums = parseEnums(schema)

const enumLines: string[] = [
  '/**',
  ' * 枚举中心 — 从 prisma/schema.prisma 自动生成',
  ' * 运行: npx tsx scripts/generate-schema-meta.ts',
  ' * ⚠️ 请勿手动修改，schema 变更后重新生成',
  ' */',
  '',
]

for (const e of enums) {
  enumLines.push(`export const ${e.name} = {`)
  for (const v of e.values) {
    enumLines.push(`  ${v}: '${v}',`)
  }
  enumLines.push('} as const')
  enumLines.push(`export type ${e.name}Type = typeof ${e.name}[keyof typeof ${e.name}]`)
  enumLines.push('')
}

enumLines.push('/** 所有枚举名称列表 */')
enumLines.push(`export const ALL_ENUMS = [${enums.map(e => `'${e.name}'`).join(', ')}] as const`)
enumLines.push('')

fs.writeFileSync(ENUMS_OUTPUT, enumLines.join('\n'), 'utf-8')
console.log(`✅ 枚举中心已生成: ${ENUMS_OUTPUT}`)
console.log(`   共 ${enums.length} 个枚举: ${enums.map(e => e.name).join(', ')}`)

// --- 标注 schema.prisma ---
const annotated = annotateSchema(schema)
fs.writeFileSync(SCHEMA_PATH, annotated, 'utf-8')
console.log(`✅ schema.prisma 已标注血缘注释`)

// 统计标注了多少个 FK
const fkCount = (annotated.match(/\/\/ FK →/g) || []).length
console.log(`   共标注 ${fkCount} 个外键字段`)
