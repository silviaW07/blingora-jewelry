#!/usr/bin/env node
/**
 * transform-combined.js
 * 优化版：
 * 1. 一次 parse + 一次 generate（原来每个文件 parse 2次 generate 2次）
 * 2. mtime+size 缓存，跳过未变更文件（无需读文件内容，比 MD5 更快）
 * 3. extractArray + addBindings 合并为一次 traverse（用 enter/exit 时序）
 */

const fs = require('node:fs');
const path = require('node:path');
const process = require('node:process');
const crypto = require('node:crypto');
const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;
const generate = require('@babel/generator').default;
const t = require('@babel/types');

// ==========================================
// 缓存（优化点2：mtime+size，无需读文件内容）
// ==========================================

const CACHE_FILE = path.resolve(process.cwd(), '.transform-cache.json');

function loadCache() {
  try {
    if (fs.existsSync(CACHE_FILE)) {
      const data = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8'));
      if (data.version === 3) return data;
    }
  } catch {}
  return { version: 3, files: {} };
}

function saveCache(cache) {
  try { fs.writeFileSync(CACHE_FILE, JSON.stringify(cache)); } catch {}
}

function getFileStat(filePath) {
  const stat = fs.statSync(filePath);
  return { mtime: stat.mtimeMs, size: stat.size };
}

function statMatches(cached, stat) {
  return cached && cached.mtime === stat.mtime && cached.size === stat.size;
}

// ==========================================
// Phase 1 helpers（add-data-api-unique-id）
// ==========================================

const UNIQUE_ATTR = 'data-api-unique-id';
const PAGE_ATTR   = 'data-api-unique-page-name';
const LOOP_ATTR   = 'data-api-in-loop';
const PARENT_KEY_ATTR = 'data-api-parent-key';

function toSafeBase(name) {
  return name.replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-+|-+$/g, '').toLowerCase() || 'component';
}

function getElementName(node) {
  if (t.isJSXIdentifier(node)) return node.name;
  if (t.isJSXMemberExpression(node)) {
    const o = getElementName(node.object), p = getElementName(node.property);
    return o && p ? `${o}.${p}` : p || o || null;
  }
  if (t.isJSXNamespacedName(node)) return `${node.namespace.name}:${node.name.name}`;
  return null;
}

function shouldSkip(name) {
  return !name || name === 'React.Fragment' || name === 'Fragment';
}

function addAttrIfMissing(node, attrName, value) {
  if (node.attributes.some(a => t.isJSXAttribute(a) && t.isJSXIdentifier(a.name) && a.name.name === attrName)) return false;
  const attr = t.jsxAttribute(t.jsxIdentifier(attrName), t.stringLiteral(value));
  const si = node.attributes.findIndex(a => t.isJSXSpreadAttribute(a));
  si === -1 ? node.attributes.push(attr) : node.attributes.splice(si, 0, attr);
  return true;
}

function createIdGenerator(filePath, baseName) {
  const safeBase = toSafeBase(baseName);
  const stableNum = parseInt(crypto.createHash('md5').update(path.resolve(filePath)).digest('hex').slice(0, 8), 16);
  const counts = new Map();
  return () => {
    let id = `${safeBase}-r${crypto.randomBytes(8).toString('hex')}-s${stableNum}`;
    const n = (counts.get(id) || 0) + 1;
    counts.set(id, n);
    if (n > 1) id = `${id}-${n}`;
    return id;
  };
}

function isMemberLike(node) {
  return t.isMemberExpression(node) || t.isOptionalMemberExpression(node);
}

function isCallLike(node) {
  return t.isCallExpression(node) || t.isOptionalCallExpression(node);
}

function getPropName(node) {
  return node?.property?.name || node?.property?.value || null;
}

function isMapCallNode(node) {
  return isCallLike(node) && isMemberLike(node.callee) && getPropName(node.callee) === 'map';
}

function isInsideMapCallback(pathNode) {
  let cur = pathNode;
  while (cur) {
    const parent = cur.parentPath;
    if (!parent) break;
    if (parent.isCallExpression() || parent.isOptionalCallExpression()) {
      if (isMapCallNode(parent.node)) {
        const cb = parent.node.arguments[0];
        if (cb && (t.isArrowFunctionExpression(cb) || t.isFunctionExpression(cb))) {
          let check = pathNode;
          while (check && check !== parent) {
            if (check.node === cb) return true;
            check = check.parentPath;
          }
        }
      }
    }
    cur = parent;
  }
  return false;
}

// ==========================================
// Phase 2 helpers（transform-add-bindings）
// ==========================================

function getMapNestingLevel(path) {
  let level = 0, cur = path.parentPath;
  while (cur) {
    if (cur.isArrowFunctionExpression() || cur.isFunctionExpression()) {
      const ce = cur.parentPath;
      if (ce && isMapCallNode(ce.node)) level++;
    }
    cur = cur.parentPath;
  }
  return level;
}

function handleIndexParameter(path, callback) {
  const scope = path.get('arguments.0').scope;
  const nestingLevel = getMapNestingLevel(path);
  const target = nestingLevel === 0 ? 'index' : `index${nestingLevel}`;
  if (callback.params.length >= 2) {
    const ip = callback.params[1];
    if (!t.isIdentifier(ip) || ip.name === target) return;
    if (scope.hasBinding(target)) {
      const b = scope.getBinding(target);
      if (b?.scope === scope) scope.rename(target, scope.generateUid(target));
    }
    scope.rename(ip.name, target);
  } else if (callback.params.length === 1) {
    if (scope.hasBinding(target)) scope.rename(target, scope.generateUid(target));
    callback.params.push(t.identifier(target));
  }
}

function collectIdentifiers(node, ids = new Set()) {
  if (!node) return ids;
  if (t.isIdentifier(node)) { ids.add(node.name); return ids; }
  if (t.isObjectProperty(node)) { collectIdentifiers(node.value, ids); return ids; }
  for (const key in node) {
    if (key === 'parent' || key === 'leadingComments' || key === 'trailingComments') continue;
    const child = node[key];
    if (Array.isArray(child)) child.forEach(c => collectIdentifiers(c, ids));
    else if (child && typeof child === 'object' && child.type) collectIdentifiers(child, ids);
  }
  return ids;
}

const SAFE_GLOBALS = new Set(['Array','Object','String','Number','Boolean','Date','Math','console','window','document','undefined','null','true','false']);

function hasExternalRefs(arrayExpr, scope) {
  if (!t.isArrayExpression(arrayExpr)) return false;
  for (const name of collectIdentifiers(arrayExpr)) {
    if (SAFE_GLOBALS.has(name)) continue;
    const b = scope.getBinding(name);
    if (!b) return true;
    let s = scope.parent;
    while (s) { if (s === b.scope) return true; s = s.parent; }
  }
  return false;
}

function guessVarName(arrayExpr) {
  if (t.isArrayExpression(arrayExpr) && arrayExpr.elements.length > 0) {
    const first = arrayExpr.elements[0];
    if (t.isObjectExpression(first)) {
      for (const field of ['title','name','label','text','desc','icon']) {
        for (const prop of first.properties) {
          if (t.isObjectProperty(prop) && t.isIdentifier(prop.key) && prop.key.name === field)
            return field.endsWith('s') ? field : field + 's';
        }
      }
    }
  }
  return 'items';
}

function extractInlineArray(path, callee) {
  const arr = callee.object;
  if (t.isSpreadElement(path.parent)) return;
  if (!arr.elements || arr.elements.length <= 1) return;
  if (hasExternalRefs(arr, path.scope)) return;
  const varName = path.scope.generateUid(guessVarName(arr));
  const decl = t.variableDeclaration('const', [t.variableDeclarator(t.identifier(varName), arr)]);
  const stmt = path.getStatementParent();
  if (stmt) {
    decl.leadingComments = [{ type: 'CommentBlock', value: ` Extracted array: ${varName} ` }];
    stmt.insertBefore(decl);
    callee.object = t.identifier(varName);
  }
}

function getArrayName(node) {
  if (t.isIdentifier(node)) return node.name;
  if (isMemberLike(node)) {
    const o = getArrayName(node.object);
    const prop = getPropName(node);
    return o && prop ? `${o}.${prop}` : null;
  }
  if (isCallLike(node) && isMemberLike(node.callee)) return getArrayName(node.callee.object);
  return null;
}

function isStateData(n) { return n && (n.startsWith('state.') || n === 'state'); }

function getMERoot(node) {
  if (t.isIdentifier(node)) return node.name;
  if (isMemberLike(node)) return getMERoot(node.object);
  return null;
}

function getMEPath(node) {
  if (t.isIdentifier(node)) return '';
  if (isMemberLike(node)) {
    const p = getMEPath(node.object), prop = getPropName(node);
    return p && prop ? `${p}.${prop}` : prop || '';
  }
  return '';
}

function collectParentCtx(path, mapContexts) {
  const ctxs = [];
  let cur = path.parentPath;
  while (cur) {
    if (cur.isArrowFunctionExpression() || cur.isFunctionExpression()) {
      const ce = cur.parentPath;
      if (ce && isMapCallNode(ce.node)) {
        const cb = ce.node.arguments[0];
        if (cb && mapContexts.has(cb)) ctxs.unshift(mapContexts.get(cb));
      }
    }
    cur = cur.parentPath;
  }
  return ctxs;
}

function findNearestCb(path, mapContexts) {
  let cur = path.parentPath;
  while (cur) {
    if ((cur.isArrowFunctionExpression() || cur.isFunctionExpression()) && mapContexts.has(cur.node)) return cur;
    cur = cur.parentPath;
  }
  return null;
}

function hasAttr(el, name) {
  return el.attributes.some(a => t.isJSXAttribute(a) && t.isJSXIdentifier(a.name, { name }));
}

function isValidIdentifierName(name) {
  return /^[$A-Z_a-z][$\w]*$/.test(name);
}

function memberAccess(objectName, propertyName) {
  const object = t.identifier(objectName);
  if (isValidIdentifierName(propertyName)) {
    return t.memberExpression(object, t.identifier(propertyName));
  }
  return t.memberExpression(object, t.stringLiteral(propertyName), true);
}

function inferParentKeyField(parentCtx, childArrayName) {
  if (!parentCtx || !childArrayName) return null;
  const prefix = `${parentCtx.itemParam}.`;
  if (!childArrayName.startsWith(prefix)) return null;

  const parentOwnedField = childArrayName.slice(prefix.length).split('.')[0];
  if (!parentOwnedField || !parentOwnedField.includes('_')) return null;

  const ownerPrefix = parentOwnedField.split('_')[0];
  return ownerPrefix ? `${ownerPrefix}_id` : null;
}

function addParentKeyAttrIfPossible(el, ctx) {
  if (hasAttr(el, PARENT_KEY_ATTR)) return;
  const parentCtx = ctx.parentContexts?.[ctx.parentContexts.length - 1];
  const keyField = inferParentKeyField(parentCtx, ctx.arrayName);
  if (!parentCtx || !keyField) return;

  el.attributes.push(
    t.jsxAttribute(
      t.jsxIdentifier(PARENT_KEY_ATTR),
      t.jsxExpressionContainer(memberAccess(parentCtx.itemParam, keyField))
    )
  );
}

function parseJSXME(expr, ctx) {
  let root = expr;
  while (t.isJSXMemberExpression(root.object)) root = root.object;
  if (t.isJSXIdentifier(root.object) && root.object.name === ctx.itemParam) {
    const parts = [];
    let cur = expr;
    while (t.isJSXMemberExpression(cur)) { parts.unshift(cur.property.name); cur = cur.object; }
    return parts.join('.');
  }
  return null;
}

function addBindAttrs(el, ctx, fieldPath) {
  const { parentContexts: pcs = [], arrayName, indexParam, itemParam } = ctx;
  const quasis = [], exprs = [];
  for (const pc of pcs) {
    quasis.push(t.templateElement({ raw: `${pc.arrayName}-`, cooked: `${pc.arrayName}-` }));
    exprs.push(t.identifier(pc.indexParam));
  }
  const prefix = pcs.length > 0 ? `-${arrayName}-` : `${arrayName}-`;
  quasis.push(t.templateElement({ raw: prefix, cooked: prefix }));
  exprs.push(t.identifier(indexParam));
  quasis.push(t.templateElement({ raw: `-${fieldPath}`, cooked: `-${fieldPath}` }, true));
  el.attributes.push(
    t.jsxAttribute(t.jsxIdentifier('data-api-bind-info'), t.jsxExpressionContainer(t.templateLiteral(quasis, exprs))),
    t.jsxAttribute(t.jsxIdentifier('data-api-map-var-name'), t.stringLiteral(itemParam))
  );
}

// ==========================================
// 核心：一次 parse，三次 traverse 合并为两次
// （优化点1 + 优化点3）
//
// traverse 1：extractArray（必须先跑，修改 AST 结构，scope 依赖它）
// traverse 2：Phase1(unique-id) + Phase2(addBindings) 合并，共享一次遍历
// generate：只调用一次
// ==========================================

function processCode(source, filePath) {
  const ast = parser.parse(source, {
    sourceType: 'module',
    sourceFilename: filePath,
    plugins: ['typescript', 'jsx', 'classProperties']
  });

  // --- traverse 1: extractArray + handleIndex（结构变换，必须先做）---
  traverse(ast, {
    'CallExpression|OptionalCallExpression'(path) {
      const callee = path.node.callee;
      if (!isMapCallNode(path.node)) return;
      const cb = path.node.arguments[0];
      if (!cb || !t.isArrowFunctionExpression(cb)) return;
      handleIndexParameter(path, cb);
      if (t.isArrayExpression(callee.object)) extractInlineArray(path, callee);
    }
  });

  // --- traverse 2: Phase1(unique-id) + Phase2(addBindings) 合并 ---
  const baseName = path.basename(filePath, path.extname(filePath));
  const pageName = path.relative(process.cwd(), filePath).replace(/\\/g, '/').replace(/\.(tsx?|jsx?)$/, '');
  const generateId = createIdGenerator(filePath, baseName);
  const mapContexts = new WeakMap(); // 每个文件独立，避免跨文件污染

  traverse(ast, {
    // Phase2: 进入 .map() 时注册上下文
    'CallExpression|OptionalCallExpression': {
      enter(path) {
        const callee = path.node.callee;
        if (!isMapCallNode(path.node)) return;
        const arrayName = getArrayName(callee.object);
        if (isStateData(arrayName)) return;
        const cb = path.node.arguments[0];
        if (cb && t.isArrowFunctionExpression(cb) && cb.params[0]?.name) {
          mapContexts.set(cb, {
            arrayName: arrayName || 'list',
            itemParam: cb.params[0].name,
            indexParam: cb.params[1]?.name || 'index',
            dynamicComponents: new Map(),
            parentContexts: collectParentCtx(path, mapContexts)
          });
        }
      }
    },

    // Phase2: 处理动态组件别名 const Icon = item.icon
    VariableDeclarator(path) {
      const cb = findNearestCb(path, mapContexts);
      if (!cb) return;
      const ctx = mapContexts.get(cb.node);
      if (!ctx) return;
      const { id, init } = path.node;
      if (t.isIdentifier(id) && isMemberLike(init) && getMERoot(init) === ctx.itemParam) {
        ctx.dynamicComponents.set(id.name, getMEPath(init));
      }
    },

    // Phase1 + Phase2: JSX 开标签
    JSXOpeningElement(pathNode) {
      const { node } = pathNode;
      const elName = getElementName(node.name);
      if (shouldSkip(elName)) return;

      // Phase1: unique-id
      if (!node.attributes.some(a => t.isJSXAttribute(a) && t.isJSXIdentifier(a.name) && a.name.name === UNIQUE_ATTR)) {
        const attr = t.jsxAttribute(t.jsxIdentifier(UNIQUE_ATTR), t.stringLiteral(generateId()));
        const si = node.attributes.findIndex(a => t.isJSXSpreadAttribute(a));
        si === -1 ? node.attributes.push(attr) : node.attributes.splice(si, 0, attr);
      }
      addAttrIfMissing(node, PAGE_ATTR, pageName);
      if (isInsideMapCallback(pathNode)) addAttrIfMissing(node, LOOP_ATTR, '1');
    },

    // Phase2: JSX 元素（动态组件 / member expression 组件）
    JSXElement(path) {
      const cb = findNearestCb(path, mapContexts);
      if (!cb) return;
      const ctx = mapContexts.get(cb.node);
      if (!ctx) return;
      const el = path.node.openingElement;
      if (hasAttr(el, 'data-api-bind-info')) return;
      let fieldPath = null;
      // 1. <Icon /> 动态组件别名
      if (t.isJSXIdentifier(el.name) && ctx.dynamicComponents.has(el.name.name)) {
        fieldPath = ctx.dynamicComponents.get(el.name.name);
      }
      // 2. <item.icon /> JSX member expression
      if (!fieldPath && t.isJSXMemberExpression(el.name)) fieldPath = parseJSXME(el.name, ctx);
      if (fieldPath) addBindAttrs(el, ctx, fieldPath);
    },

    // Phase2: JSX 表达式容器 {item.title} / {item}
    JSXExpressionContainer(path) {
      if (path.parentPath.isJSXAttribute()) return;
      const cb = findNearestCb(path, mapContexts);
      if (!cb) return;
      const ctx = mapContexts.get(cb.node);
      if (!ctx) return;
      const expr = path.node.expression;
      const jsxEl = path.findParent(p => p.isJSXElement());
      if (!jsxEl) return;
      const el = jsxEl.node.openingElement;
      if (hasAttr(el, 'data-api-bind-info')) return;
      if (isMemberLike(expr) && getMERoot(expr) === ctx.itemParam) {
        const fp = getMEPath(expr);
        if (fp) addBindAttrs(el, ctx, fp);
      } else if (t.isIdentifier(expr) && expr.name === ctx.itemParam) {
        addBindAttrs(el, ctx, '$item');
        addParentKeyAttrIfPossible(el, ctx);
      }
    }
  });

  // 只 generate 一次（优化点1）
  const { code } = generate(ast, {
    retainLines: false,
    compact: false,
    comments: true,
    jsescOption: { quotes: 'single', minimal: true }
  }, source);

  return code;
}

// ==========================================
// 文件处理（含 mtime+size 缓存，优化点2）
// ==========================================

function processFile(filePath, cache, newCache) {
  if (!/\.(tsx?|jsx?)$/.test(filePath) || !fs.existsSync(filePath)) return { processed: 0, failed: 0 };
  // 用相对路径作为缓存 key，避免绝对路径在不同环境下失效
  const cacheKey = path.relative(process.cwd(), filePath).replace(/\\/g, '/');
  try {
    // mtime+size 判断：不需要读文件内容（优化点2）
    const statBefore = getFileStat(filePath);
    if (statMatches(cache.files[cacheKey], statBefore)) {
      newCache.files[cacheKey] = statBefore;
      console.log(`- Skipped (no change): ${filePath}`);
      return { processed: 0, failed: 0 };
    }

    const source = fs.readFileSync(filePath, 'utf8');
    const code = processCode(source, filePath);

    if (code !== source) {
      // 验证生成代码可解析
      parser.parse(code, { sourceType: 'module', plugins: ['typescript', 'jsx'] });
      fs.writeFileSync(filePath, code, 'utf8');
      console.log(`✓ Modified: ${filePath}`);
    } else {
      console.log(`- Skipped (identical output): ${filePath}`);
    }

    // 写入后重新 stat（文件内容可能已变更，mtime 会更新）
    newCache.files[cacheKey] = getFileStat(filePath);
    return { processed: 1, failed: 0 };
  } catch (e) {
    console.error(`✗ Failed: ${filePath}`, e.message);
    return { processed: 0, failed: 1 };
  }
}

// ==========================================
// 目录遍历（跳过 ui/）
// ==========================================

function walkAndProcess(start, cache, newCache) {
  let total = { processed: 0, failed: 0 };
  const stack = [start];
  while (stack.length) {
    const cur = stack.pop();
    if (path.basename(cur) === 'ui') continue;
    let stat;
    try { stat = fs.statSync(cur); } catch { total.failed++; continue; }
    if (stat.isFile()) {
      const r = processFile(cur, cache, newCache);
      total.processed += r.processed; total.failed += r.failed;
    } else if (stat.isDirectory()) {
      try { for (const item of fs.readdirSync(cur)) stack.push(path.join(cur, item)); }
      catch { total.failed++; }
    }
  }
  return total;
}

// ==========================================
// CLI 入口
// ==========================================

function main() {
  const args = process.argv.slice(2);
  if (!args.length) { console.log('Usage: node transform-combined.js <file_or_dir>,...'); return; }

  const cache = loadCache();
  const newCache = { version: 3, files: {} };

  const targets = args.flatMap(a => a.split(',')).map(s => s.trim()).filter(Boolean);
  let total = { processed: 0, failed: 0 };

  for (const target of targets) {
    const full = path.isAbsolute(target) ? target : path.resolve(process.cwd(), target);
    if (!fs.existsSync(full)) { console.warn(`Not found, skipping: ${full}`); continue; }
    const r = walkAndProcess(full, cache, newCache);
    total.processed += r.processed; total.failed += r.failed;
  }

  saveCache(newCache);
  console.log(`\nDone. Processed: ${total.processed}, Failed: ${total.failed}`);
}

main();
