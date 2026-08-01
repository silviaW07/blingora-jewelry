#!/usr/bin/env node

/**
 * 构建时生成 data-from 映射文件
 * 扫描指定目录，提取 action function 输出字段中的 data-from 注释
 * 输出到 public/data-from-mapping.json
 * 
 * 用法: node scripts/gen-data-from-mapping.js [dir1] [dir2] ...
 * 
 * 示例:
 *   node scripts/gen-data-from-mapping.js src/types src/frontend/types
 *   
 * 如果不传参数，默认扫描 src/types
 * 如果传入的文件夹不存在，会跳过该文件夹（不报错）
 * 
 * data-from 格式支持:
 *   - 两段式: table-column (主键自动从 Prisma schema 获取)
 *   - 三段式: table-column-pk_column (主键优先从 Prisma schema 获取，其次用传入值)
 * 
 * 输出格式:
 * {
 *   "src.actions.PageName.functionName": {
 *     "field.path": "table-column-pk_column"
 *   }
 * }
 */

const fs = require('fs');
const path = require('path');
const ts = require('typescript');

const DEFAULT_TYPES_DIR = path.resolve(__dirname, '../src/types');
const OUTPUT_FILE = path.resolve(__dirname, '../public/data-from-mapping.json');
const PRISMA_SCHEMA_PATH_GENERATED = path.resolve(__dirname, '../prisma-generated/client/schema.prisma');
const PRISMA_SCHEMA_PATH_SOURCE = path.resolve(__dirname, '../prisma/schema.prisma');

/**
 * 选择 Prisma schema 路径：
 * 1. 当 source / generated 都存在时，优先选择 model 数量更多的 schema（覆盖更完整）
 * 2. 若 model 数量相同，选择更新时间更新的 schema
 * 3. 若仅存在一个，则使用该 schema
 */
function getPrismaSchemaPath() {
  const hasSource = fs.existsSync(PRISMA_SCHEMA_PATH_SOURCE);
  const hasGenerated = fs.existsSync(PRISMA_SCHEMA_PATH_GENERATED);

  if (!hasSource && !hasGenerated) return PRISMA_SCHEMA_PATH_SOURCE;
  if (!hasSource) return PRISMA_SCHEMA_PATH_GENERATED;
  if (!hasGenerated) return PRISMA_SCHEMA_PATH_SOURCE;

  const sourceContent = fs.readFileSync(PRISMA_SCHEMA_PATH_SOURCE, 'utf-8');
  const generatedContent = fs.readFileSync(PRISMA_SCHEMA_PATH_GENERATED, 'utf-8');
  const sourceModelCount = (sourceContent.match(/\bmodel\s+\w+\s*\{/g) || []).length;
  const generatedModelCount = (generatedContent.match(/\bmodel\s+\w+\s*\{/g) || []).length;

  if (generatedModelCount > sourceModelCount) {
    const sourceMtimeMs = fs.statSync(PRISMA_SCHEMA_PATH_SOURCE).mtimeMs;
    const generatedMtimeMs = fs.statSync(PRISMA_SCHEMA_PATH_GENERATED).mtimeMs;
    if (generatedMtimeMs < sourceMtimeMs) {
      console.warn(
        `Generated schema is older than source, but has more models (${generatedModelCount} > ${sourceModelCount}), using generated schema`
      );
    }
    return PRISMA_SCHEMA_PATH_GENERATED;
  }
  if (sourceModelCount > generatedModelCount) {
    return PRISMA_SCHEMA_PATH_SOURCE;
  }

  const sourceMtimeMs = fs.statSync(PRISMA_SCHEMA_PATH_SOURCE).mtimeMs;
  const generatedMtimeMs = fs.statSync(PRISMA_SCHEMA_PATH_GENERATED).mtimeMs;
  if (generatedMtimeMs >= sourceMtimeMs) {
    return PRISMA_SCHEMA_PATH_GENERATED;
  }

  return PRISMA_SCHEMA_PATH_SOURCE;
}

const PRISMA_SCHEMA_PATH = getPrismaSchemaPath();

// ============================================================
// Prisma Schema 解析相关
// ============================================================

/**
 * 解析 Prisma schema 文件，提取 model/table 和 field 的映射关系
 * 返回格式:
 * {
 *   models: {
 *     modelName: { tableName: string, fields: { fieldName: dbFieldName }, primaryKey: string }
 *   },
 *   tableToModel: { tableName: modelName }  // 反向映射
 * }
 */
function parsePrismaSchema(schemaPath) {
  if (!fs.existsSync(schemaPath)) {
    console.warn(`Prisma schema not found at ${schemaPath}, skipping data-from correction`);
    return null;
  }

  const content = fs.readFileSync(schemaPath, 'utf-8');
  const models = {};
  const tableToModel = {};

  // 匹配 model 块
  const modelStartRegex = /model\s+(\w+)\s*\{/g;
  let modelMatch;

  while ((modelMatch = modelStartRegex.exec(content)) !== null) {
    const modelName = modelMatch[1];
    // 从 { 之后开始，找到匹配的闭合 }
    // 跳过字符串与注释中的花括号，避免误计数
    const startIdx = modelMatch.index + modelMatch[0].length;
    let depth = 1;
    let i = startIdx;
    while (i < content.length && depth > 0) {
      const ch = content[i];

      if (ch === '/' && content[i + 1] === '/') {
        // 跳过行注释直到行尾
        while (i < content.length && content[i] !== '\n') i++;
        continue;
      }

      if (ch === '/' && content[i + 1] === '*') {
        // 跳过块注释直到 */
        i += 2;
        while (i < content.length && !(content[i] === '*' && content[i + 1] === '/')) i++;
        i += 2;
        continue;
      }

      if (ch === '"' || ch === '\'' || ch === '`') {
        // 跳过字符串，处理转义字符
        const quote = ch;
        i++;
        while (i < content.length) {
          if (content[i] === '\\') {
            i += 2;
            continue;
          }
          if (content[i] === quote) {
            i++;
            break;
          }
          i++;
        }
        continue;
      }

      if (ch === '{') {
        depth++;
      } else if (ch === '}') {
        depth--;
      }
      i++;
    }

    if (depth !== 0) {
      console.warn(`Unclosed model block detected for model "${modelName}", skipping`);
      continue;
    }

    const modelBody = content.substring(startIdx, i - 1);

    // 提取 @@map("table_name")
    const tableMapMatch = modelBody.match(/@@map\s*\(\s*"([^"]+)"\s*\)/);
    const tableName = tableMapMatch ? tableMapMatch[1] : modelName;

    // 提取字段和 @map
    const fields = {};
    const fieldDbNames = new Set(); // 存储所有数据库字段名
    let primaryKey = null; // 主键字段的数据库名

    // 匹配字段行: fieldName Type ... // 或 fieldName Type ...
    const lines = modelBody.split('\n');
    for (const line of lines) {
      const trimmedLine = line.trim();
      // 跳过空行、注释行、关系字段、@@开头的行
      if (!trimmedLine || 
          trimmedLine.startsWith('//') || 
          trimmedLine.startsWith('@@')) {
        continue;
      }

      // 匹配字段定义: fieldName Type[@modifiers]
      const fieldMatch = trimmedLine.match(/^(\w+)\s+\w+/);
      if (fieldMatch) {
        const fieldName = fieldMatch[1];
        
        // 检查是否有 @map("db_field_name")
        const fieldMapMatch = trimmedLine.match(/@map\s*\(\s*"([^"]+)"\s*\)/);
        const dbFieldName = fieldMapMatch ? fieldMapMatch[1] : fieldName;
        
        fields[fieldName] = dbFieldName;
        fieldDbNames.add(dbFieldName);

        // 检查是否是主键 (@id)
        if (trimmedLine.includes('@id')) {
          primaryKey = dbFieldName;
        }
      }
    }

    models[modelName] = {
      tableName,
      fields,
      fieldDbNames, // 用于验证是否是有效的数据库字段名
      primaryKey    // 主键字段的数据库名
    };
    tableToModel[tableName] = modelName;
  }

  return { models, tableToModel };
}

/**
 * 修正 data-from 注释
 * @param {string} dataFrom - 原始 data-from 值，格式: table_name-field_name 或 table_name-field_name-id_field_name
 * @param {object} prismaInfo - parsePrismaSchema 返回的结果
 * @returns {string|null} - 修正后的值，如果无效则返回 null
 */
function correctDataFrom(dataFrom, prismaInfo) {
  if (!prismaInfo) return dataFrom; // 没有 schema 信息，原样返回

  const parts = dataFrom.split('-');
  // 兼容两段式和三段式
  if (parts.length < 2 || parts.length > 3) {
    console.warn(`Invalid data-from format: ${dataFrom}, expected 2 or 3 parts`);
    return null;
  }

  let [tableName, fieldName, idFieldName] = parts;
  const { models, tableToModel } = prismaInfo;

  // 1. 修正 tableName
  let modelInfo = null;
  if (models[tableName]) {
    // tableName 是 model 名称，获取真实表名
    modelInfo = models[tableName];
    tableName = modelInfo.tableName;
  } else if (tableToModel[tableName]) {
    // tableName 已经是数据库表名
    modelInfo = models[tableToModel[tableName]];
  } else {
    // 无效的表名
    console.warn(`Invalid table name in data-from: ${dataFrom}, table "${parts[0]}" not found`);
    return null;
  }

  // 2. 修正 fieldName
  fieldName = correctFieldName(fieldName, modelInfo, dataFrom);
  if (fieldName === null) return null;

  // 3. 修正 idFieldName：优先使用 Prisma schema 中的主键，其次使用传入的值
  idFieldName = correctIdFieldName(idFieldName, modelInfo);

  return `${tableName}-${fieldName}-${idFieldName}`;
}

/**
 * 修正字段名
 * @param {string} fieldName - 原始字段名
 * @param {object} modelInfo - model 信息
 * @param {string} dataFrom - 原始 data-from（用于日志）
 * @returns {string|null} - 修正后的字段名，无效则返回 null
 */
function correctFieldName(fieldName, modelInfo, dataFrom) {
  const { fields, fieldDbNames } = modelInfo;

  if (fields[fieldName]) {
    // fieldName 是 model 字段名，获取真实数据库字段名
    return fields[fieldName];
  } else if (fieldDbNames.has(fieldName)) {
    // fieldName 已经是数据库字段名
    return fieldName;
  } else {
    // 无效的字段名
    console.warn(`Invalid field name in data-from: ${dataFrom}, field "${fieldName}" not found`);
    return null;
  }
}

/**
 * 修正 id 字段名
 * 优先使用 Prisma schema 中的主键，其次使用传入的值
 * @param {string|undefined} idFieldName - 原始 id 字段名（可能为空，两段式时）
 * @param {object} modelInfo - model 信息
 * @returns {string} - 修正后的 id 字段名
 */
function correctIdFieldName(idFieldName, modelInfo) {
  const { fields, fieldDbNames, primaryKey } = modelInfo;

  // 优先使用 Prisma schema 中的主键
  if (primaryKey) {
    return primaryKey;
  }

  // 如果没有主键信息，尝试使用传入的值
  if (idFieldName) {
    if (fields[idFieldName]) {
      // idFieldName 是 model 字段名，获取真实数据库字段名
      return fields[idFieldName];
    } else if (fieldDbNames.has(idFieldName)) {
      // idFieldName 已经是数据库字段名
      return idFieldName;
    }
  }

  // 兜底：使用 'id'
  return 'id';
}

/**
 * 从联合类型文本中提取非 null/undefined 的单一类型名
 * 例如: "FestivalConfigItem | null" → "FestivalConfigItem"
 * 若不是简单的 Type | null/undefined 形式，返回 null
 */
function extractNonNullableTypeName(typeText) {
  const parts = typeText.split('|').map(p => p.trim()).filter(p => p !== 'null' && p !== 'undefined');
  if (parts.length === 1 && /^\w+$/.test(parts[0])) {
    return parts[0];
  }
  return null;
}

/**
 * 从嵌套的调用表达式中提取最内层的箭头函数/函数表达式
 * 支持: withResult(async () => ...), requireAuth()(withResult(async () => ...)), etc.
 */
function findInnerFunction(node) {
  if (ts.isArrowFunction(node) || ts.isFunctionExpression(node)) {
    return node;
  }
  if (ts.isCallExpression(node)) {
    // 检查参数中是否有函数
    for (const arg of node.arguments) {
      const found = findInnerFunction(arg);
      if (found) return found;
    }
    // 检查被调用的表达式（处理 requireAuth()(withResult(...)) 这种链式调用）
    if (ts.isCallExpression(node.expression)) {
      return findInnerFunction(node.expression);
    }
  }
  return null;
}

/**
 * 解析单个文件，提取 action functions 和相关类型
 */
function parseFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const sourceFile = ts.createSourceFile(
    filePath,
    content,
    ts.ScriptTarget.Latest,
    true
  );

  const types = new Map(); // 存储所有类型定义
  const actions = []; // 存储 action function 信息

  // 第一遍：收集所有类型定义
  ts.forEachChild(sourceFile, (node) => {
    if (ts.isInterfaceDeclaration(node) || ts.isTypeAliasDeclaration(node)) {
      const typeName = node.name.getText(sourceFile);
      types.set(typeName, node);
    }
  });

  // 第二遍：找到 declare function（action functions）
  ts.forEachChild(sourceFile, (node) => {
    if (ts.isFunctionDeclaration(node) && node.modifiers) {
      const isDeclare = node.modifiers.some(
        (m) => m.kind === ts.SyntaxKind.DeclareKeyword
      );
      if (isDeclare && node.name && node.type) {
        const funcName = node.name.getText(sourceFile);
        const returnType = node.type;
        actions.push({ funcName, returnType });
      }
    }

    // 也处理 export const xxx = withResult(...) / requireAuth()(withResult(...)) 模式
    if (ts.isVariableStatement(node) && node.modifiers) {
      const isExport = node.modifiers.some(
        (m) => m.kind === ts.SyntaxKind.ExportKeyword
      );
      if (isExport && node.declarationList.declarations.length > 0) {
        for (const decl of node.declarationList.declarations) {
          if (ts.isIdentifier(decl.name) && decl.initializer) {
            const funcName = decl.name.getText(sourceFile);
            const innerFn = findInnerFunction(decl.initializer);
            if (innerFn && innerFn.type) {
              actions.push({ funcName, returnType: innerFn.type });
            }
          }
        }
      }
    }
  });

  return { sourceFile, content, types, actions };
}

/**
 * 从注释中提取 data-from 值
 */
function extractDataFrom(comment) {
  const match = comment.match(/data-from:\s*([^\s]+)/);
  return match ? match[1] : null;
}

/**
 * 获取属性后的行内注释
 */
function getTrailingComment(node, sourceFile, content) {
  const nodeEnd = node.getEnd();
  const lineEnd = content.indexOf('\n', nodeEnd);
  const trailingText = content.substring(nodeEnd, lineEnd > -1 ? lineEnd : content.length);
  
  const match = trailingText.match(/\/\/\s*(.+)/);
  return match ? match[1].trim() : null;
}

/**
 * 从属性所在行的**上方**扫描：跳过空行，取第一条以 // 开头的整行注释的正文（去掉 // 与首尾空白）。
 * 用于兼容「data-from 写在字段上一行」的写法（如 Home.ts），不改变「同行行尾注释优先」的历史行为。
 */
function getLeadingLineCommentAboveNode(node, sourceFile, content) {
  const pos =
    ts.isPropertySignature(node) && node.name
      ? node.name.getStart(sourceFile)
      : node.getStart(sourceFile);

  let lineStart = content.lastIndexOf('\n', Math.max(0, pos - 1));
  lineStart = lineStart === -1 ? 0 : lineStart + 1;

  let cursor = lineStart - 1;
  while (cursor >= 0) {
    const prevNl = content.lastIndexOf('\n', cursor);
    const prevLineStart = prevNl === -1 ? 0 : prevNl + 1;
    const prevLineRaw = content.substring(prevLineStart, cursor + 1);
    const trimmed = prevLineRaw.trim();

    if (trimmed === '') {
      if (prevLineStart <= 0) break;
      cursor = prevLineStart - 2;
      continue;
    }

    if (trimmed.startsWith('//')) {
      return trimmed.slice(2).trim();
    }

    break;
  }

  return null;
}

/**
 * 解析 data-from 注释来源：优先**本行行尾** `//`（与历史脚本一致）；
 * 若行尾无有效 data-from，再尝试**上一行及更上**的独立 `//` 行（中间可隔空行）。
 */
function getDataFromCommentSource(node, sourceFile, content) {
  const trailing = getTrailingComment(node, sourceFile, content);
  if (trailing && extractDataFrom(trailing)) {
    return trailing;
  }

  const leading = getLeadingLineCommentAboveNode(node, sourceFile, content);
  if (leading && extractDataFrom(leading)) {
    return leading;
  }

  return null;
}

/**
 * 从任意类型节点中提取字段映射。
 * 保持历史 interface 递归逻辑不变，仅补齐 type alias 右侧类型展开。
 */
function extractFieldsFromTypeNode(typeNode, types, sourceFile, content, prefix, visited) {
  const typeText = typeNode.getText(sourceFile);

  // 处理数组类型 Type[]
  if (ts.isArrayTypeNode(typeNode)) {
    const elementType = typeNode.elementType;
    if (ts.isTypeLiteralNode(elementType)) {
      return extractFieldsFromTypeLiteral(
        elementType, types, sourceFile, content, prefix, new Set(visited)
      );
    }

    const resolvedType = resolveTypeName(elementType.getText(sourceFile), types);
    if (resolvedType) {
      return extractFieldsWithDataFrom(
        resolvedType, types, sourceFile, content, prefix, new Set(visited)
      );
    }

    return [];
  }

  // 处理内联对象类型 { ... }
  if (ts.isTypeLiteralNode(typeNode)) {
    return extractFieldsFromTypeLiteral(
      typeNode, types, sourceFile, content, prefix, new Set(visited)
    );
  }

  // 处理 Array<Type> / Array<{...}> / 普通类型引用
  if (ts.isTypeReferenceNode(typeNode)) {
    const refTypeName = typeNode.typeName.getText(sourceFile);
    if (refTypeName === 'Array' && typeNode.typeArguments && typeNode.typeArguments.length > 0) {
      const typeArg = typeNode.typeArguments[0];
      if (ts.isTypeLiteralNode(typeArg)) {
        return extractFieldsFromTypeLiteral(
          typeArg, types, sourceFile, content, prefix, new Set(visited)
        );
      }

      const resolvedArrayType = resolveTypeName(typeArg.getText(sourceFile), types);
      if (resolvedArrayType) {
        return extractFieldsWithDataFrom(
          resolvedArrayType, types, sourceFile, content, prefix, new Set(visited)
        );
      }

      return [];
    }

    const resolvedType = resolveTypeName(typeText, types);
    if (resolvedType) {
      return extractFieldsWithDataFrom(
        resolvedType, types, sourceFile, content, prefix, new Set(visited)
      );
    }
  }

  // 处理 Type | null / Type | undefined 形式
  if (ts.isUnionTypeNode(typeNode)) {
    const nonNullableTypes = typeNode.types.filter((unionMember) => {
      const text = unionMember.getText(sourceFile);
      return text !== 'null' && text !== 'undefined';
    });

    if (nonNullableTypes.length === 1) {
      return extractFieldsFromTypeNode(
        nonNullableTypes[0], types, sourceFile, content, prefix, new Set(visited)
      );
    }
  }

  const resolvedType = resolveTypeName(typeText, types);
  if (resolvedType) {
    return extractFieldsWithDataFrom(
      resolvedType, types, sourceFile, content, prefix, new Set(visited)
    );
  }

  return [];
}

/**
 * 递归遍历类型，提取带 data-from 的字段
 * 支持 extends 继承的接口，以及指向接口/对象/数组的 type alias
 */
function extractFieldsWithDataFrom(typeName, types, sourceFile, content, prefix = '', visited = new Set()) {
  const results = [];
  
  if (visited.has(typeName)) return results;
  visited.add(typeName);

  const typeNode = types.get(typeName);
  if (!typeNode) return results;

  // 处理 type Output = Item[] / Array<Item> / { ... } 等别名
  if (ts.isTypeAliasDeclaration(typeNode)) {
    return extractFieldsFromTypeNode(
      typeNode.type, types, sourceFile, content, prefix, new Set(visited)
    );
  }

  // 处理 interface
  if (ts.isInterfaceDeclaration(typeNode)) {
    // 先处理 extends 继承的接口
    if (typeNode.heritageClauses) {
      for (const clause of typeNode.heritageClauses) {
        if (clause.token === ts.SyntaxKind.ExtendsKeyword) {
          for (const baseType of clause.types) {
            const baseTypeName = baseType.expression.getText(sourceFile);
            if (types.has(baseTypeName)) {
              const inheritedResults = extractFieldsWithDataFrom(
                baseTypeName, types, sourceFile, content, prefix, new Set(visited)
              );
              results.push(...inheritedResults);
            }
          }
        }
      }
    }

    // 再处理自身的成员
    for (const member of typeNode.members) {
      if (ts.isPropertySignature(member) && member.name) {
        const fieldName = member.name.getText(sourceFile);
        const fieldPath = prefix ? `${prefix}.${fieldName}` : fieldName;
        
        // 获取注释（行尾优先，其次为字段上方的 // 行）
        const commentSource = getDataFromCommentSource(member, sourceFile, content);
        if (commentSource) {
          const dataFrom = extractDataFrom(commentSource);
          if (dataFrom) {
            results.push({ fieldPath, dataFrom });
          }
        }

        // 如果字段类型是另一个接口，递归处理
        if (member.type) {
          const nestedResults = extractFieldsFromTypeNode(
            member.type, types, sourceFile, content, fieldPath, new Set(visited)
          );
          results.push(...nestedResults);
        }
      }
    }
  }

  return results;
}

/**
 * 从内联对象类型（TypeLiteral）中提取带 data-from 的字段
 * 例如: { list: FeaturedPropertyItem[], total: number }
 */
function extractFieldsFromTypeLiteral(typeLiteralNode, types, sourceFile, content, prefix, visited) {
  const results = [];

  for (const member of typeLiteralNode.members) {
    if (ts.isPropertySignature(member) && member.name) {
      const fieldName = member.name.getText(sourceFile);
      const fieldPath = prefix ? `${prefix}.${fieldName}` : fieldName;

      // 获取注释（行尾优先，其次为字段上方的 // 行）
      const commentSource = getDataFromCommentSource(member, sourceFile, content);
      if (commentSource) {
        const dataFrom = extractDataFrom(commentSource);
        if (dataFrom) {
          results.push({ fieldPath, dataFrom });
        }
      }

      // 递归处理嵌套类型
      if (member.type) {
        const nestedResults = extractFieldsFromTypeNode(
          member.type, types, sourceFile, content, fieldPath, new Set(visited)
        );
        results.push(...nestedResults);
      }
    }
  }

  return results;
}

/**
 * 从 Promise<Type> 中提取 Type（可能含 | null / | undefined）
 */
function extractPromiseType(typeNode, sourceFile) {
  if (ts.isTypeReferenceNode(typeNode)) {
    const typeName = typeNode.typeName.getText(sourceFile);
    if (typeName === 'Promise' && typeNode.typeArguments && typeNode.typeArguments.length > 0) {
      return typeNode.typeArguments[0].getText(sourceFile);
    }
    return typeName;
  }
  return null;
}

/**
 * 将类型名解析为 types Map 中存在的单一类型名
 * 支持 Type[]、Array<Type>、Type | null、Type | undefined 等形式（含 frontend declare function 返回值）
 */
function resolveTypeName(typeName, types) {
  if (types.has(typeName)) {
    return typeName;
  }

  const arrayMatch = typeName.match(/^(\w+)\[\]$/);
  if (arrayMatch && types.has(arrayMatch[1])) {
    return arrayMatch[1];
  }

  const genericArrayMatch = typeName.match(/^Array<\s*(\w+)\s*>$/);
  if (genericArrayMatch && types.has(genericArrayMatch[1])) {
    return genericArrayMatch[1];
  }

  const nonNullable = extractNonNullableTypeName(typeName);
  if (nonNullable && types.has(nonNullable)) {
    return nonNullable;
  }
  return null;
}

/**
 * 根据文件路径生成 action key 前缀
 * 例如: src/frontend/types/Login.ts -> src.frontend.actions
 *       src/backend/types/User.ts -> src.backend.actions
 */
function getActionKeyPrefix(filePath, rootDir) {
  // 获取相对于项目根目录的路径
  const relativePath = path.relative(rootDir, filePath);
  // 将路径分隔符替换为点，并移除文件名
  const parts = relativePath.split(path.sep);
  // 移除最后的文件名
  parts.pop();
  // 将 types 替换为 actions
  const actionParts = parts.map(part => part === 'types' ? 'actions' : part);
  return actionParts.join('.');
}

/**
 * 处理单个文件，返回 { actionKey: { fieldPath: dataFrom } } 格式
 * @param {object} prismaInfo - Prisma schema 解析结果，用于修正 data-from
 */
function processFile(filePath, pageName, rootDir, prismaInfo) {
  const { sourceFile, content, types, actions } = parseFile(filePath);
  const result = {};

  for (const action of actions) {
    const outputTypeRaw = extractPromiseType(action.returnType, sourceFile);
    if (!outputTypeRaw) continue;

    const outputTypeName = resolveTypeName(outputTypeRaw, types);
    if (!outputTypeName) continue;

    const fields = extractFieldsWithDataFrom(outputTypeName, types, sourceFile, content);
    
    if (fields.length > 0) {
      // 根据实际路径生成 actionKey
      const prefix = getActionKeyPrefix(filePath, rootDir);
      const actionKey = `${prefix}.${pageName}.${action.funcName}`;
      const fieldMap = {};
      
      for (const { fieldPath, dataFrom } of fields) {
        // 修正 data-from 注释
        const correctedDataFrom = correctDataFrom(dataFrom, prismaInfo);
        if (correctedDataFrom) {
          // 同时生成带 data. 前缀和不带前缀的两种 key
          // 兼容 runtime 可能使用的两种 mappingKey 格式
          fieldMap[fieldPath] = correctedDataFrom;
          fieldMap[`data.${fieldPath}`] = correctedDataFrom;
        }
      }
      
      // 只有当有有效字段时才添加
      if (Object.keys(fieldMap).length > 0) {
        result[actionKey] = fieldMap;
      }
    }
  }

  return result;
}

/**
 * 扫描单个目录，返回映射结果
 * @param {object} prismaInfo - Prisma schema 解析结果
 */
function scanDirectory(typesDir, rootDir, prismaInfo) {
  const result = {};
  
  if (!fs.existsSync(typesDir)) {
    console.log(`Skipping non-existent directory: ${typesDir}`);
    return result;
  }

  console.log(`Scanning directory: ${typesDir}`);
  const files = fs.readdirSync(typesDir);
  
  for (const file of files) {
    const filePath = path.join(typesDir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isFile() && file.endsWith('.ts') && !file.endsWith('.d.ts')) {
      const pageName = path.basename(file, '.ts');
      
      // 跳过 global.d.ts 等声明文件
      if (pageName === 'global') continue;
      
      try {
        const fileResult = processFile(filePath, pageName, rootDir, prismaInfo);
        Object.assign(result, fileResult);
      } catch (err) {
        console.error(`Error processing ${filePath}:`, err.message);
      }
    }
  }

  return result;
}

/**
 * 扫描多个文件夹，生成完整映射
 * @param {object} prismaInfo - Prisma schema 解析结果
 */
function generateMapping(directories, rootDir, prismaInfo) {
  const result = {};
  
  for (const dir of directories) {
    const dirResult = scanDirectory(dir, rootDir, prismaInfo);
    Object.assign(result, dirResult);
  }

  return result;
}

// 主程序
function main() {
  // 解析命令行参数，获取要扫描的目录列表
  const args = process.argv.slice(2);
  
  // 项目根目录
  const rootDir = path.resolve(__dirname, '..');
  
  let directories;
  if (args.length > 0) {
    // 将相对路径转换为绝对路径
    directories = args.map(dir => path.resolve(rootDir, dir));
  } else {
    // 默认扫描 src/types
    directories = [DEFAULT_TYPES_DIR];
  }
  
  console.log('Generating data-from mapping...');
  console.log(`Directories to scan: ${directories.join(', ')}`);
  
  // 解析 Prisma schema
  console.log(`Parsing Prisma schema: ${PRISMA_SCHEMA_PATH}`);
  const prismaInfo = parsePrismaSchema(PRISMA_SCHEMA_PATH);
  if (prismaInfo) {
    const modelCount = Object.keys(prismaInfo.models).length;
    console.log(`Found ${modelCount} models in Prisma schema`);
  }
  
  const mapping = generateMapping(directories, rootDir, prismaInfo);
  const actionCount = Object.keys(mapping).length;
  
  // 确保 public 目录存在
  const publicDir = path.dirname(OUTPUT_FILE);
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }
  
  // 写入 JSON 文件
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(mapping, null, 2));
  
  console.log(`Generated ${OUTPUT_FILE}`);
  console.log(`Total actions with data-from mappings: ${actionCount}`);
}

main();
