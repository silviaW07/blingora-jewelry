/**
 * Webpack Loader：生成路由布局相关代码
 * 替代 babel-plugin-generate-route-layout.js
 *
 * 功能：
 * 1. 从 Next.js App Router 约定路由中提取路由信息
 * 2. 将路由信息注入到 not-found.tsx、error.tsx 和 PageErrorBoundary.tsx 中
 */

const path = require('path')
const fs = require('fs')
const { parse } = require('@babel/parser')
const traverse = require('@babel/traverse').default
const generate = require('@babel/generator').default
const t = require('@babel/types')

// 模块级别的路由缓存
const routeCache = {
  backendPaths: [],
  frontendPaths: [],
  appPaths: [],
  routeMap: {},
  backendHomePath: '/backenddashboard',
  frontendHomePath: '/',
  appHomePath: '/',
  extracted: false,
  lastScan: 0
}

// 扫描间隔（毫秒）
const SCAN_INTERVAL = 5000

/**
 * 扫描 app 目录获取所有路由
 */
function scanAppRoutes(projectRoot) {
  const now = Date.now()
  if (routeCache.extracted && now - routeCache.lastScan < SCAN_INTERVAL) {
    return // 使用缓存
  }

  const appDir = path.join(projectRoot, 'app')
  if (!fs.existsSync(appDir)) return

  routeCache.backendPaths = []
  routeCache.frontendPaths = []
  routeCache.appPaths = []
  routeCache.routeMap = {}

  function scanDir(dir, routePrefix = '') {
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true })

      for (const entry of entries) {
        if (entry.name.startsWith('.') || entry.name === 'node_modules')
          continue

        const fullPath = path.join(dir, entry.name)

        if (entry.isDirectory()) {
          let newPrefix = routePrefix

          // 处理路由组（括号包裹）
          if (entry.name.startsWith('(') && entry.name.endsWith(')')) {
            // 路由组不影响 URL，但记录类型
            const groupName = entry.name.slice(1, -1)
            scanDir(fullPath, routePrefix)
          } else {
            newPrefix = `${routePrefix}/${entry.name}`
            scanDir(fullPath, newPrefix)
          }
        } else if (entry.name === 'page.tsx' || entry.name === 'page.jsx') {
          const routePath = routePrefix || '/'
          const normalizedRoute = routePath.replace(/\/+/g, '/') || '/'

          // 判断路由类型
          const relativePath = path.relative(appDir, dir).replace(/\\/g, '/')
          if (relativePath.includes('(backend)')) {
            if (!routeCache.backendPaths.includes(normalizedRoute)) {
              routeCache.backendPaths.push(normalizedRoute)
              if (normalizedRoute.includes('dashboard')) {
                routeCache.backendHomePath = normalizedRoute
              }
            }
          } else if (relativePath.includes('(frontend)')) {
            if (!routeCache.frontendPaths.includes(normalizedRoute)) {
              routeCache.frontendPaths.push(normalizedRoute)
              if (normalizedRoute === '/') {
                routeCache.frontendHomePath = '/'
              }
            }
          } else if (relativePath.includes('(app)')) {
            if (!routeCache.appPaths.includes(normalizedRoute)) {
              routeCache.appPaths.push(normalizedRoute)
              // 识别 App 首页：包含 'home' 或者就是 '/apphome'
              if (normalizedRoute.includes('home') || normalizedRoute === '/apphome') {
                routeCache.appHomePath = normalizedRoute
              }
            }
          }

          // 构建组件名
          const dirName = path.basename(dir)
          const componentName =
            dirName.charAt(0).toUpperCase() + dirName.slice(1) + 'Page'
          routeCache.routeMap[normalizedRoute] = componentName
        }
      }
    } catch (e) {
      // 静默失败
    }
  }

  scanDir(appDir)
  routeCache.extracted = true
  routeCache.lastScan = now
}

/**
 * 生成 handleTargetHome 函数体
 */
function generateHandleTargetHomeBody() {
  const { 
    backendPaths, 
    frontendPaths, 
    appPaths,
    backendHomePath, 
    frontendHomePath,
    appHomePath
  } = routeCache

  // 生成路由检查代码
  const backendChecks =
    backendPaths
      .map((p) => `cleanPath === '${p.toLowerCase()}'`)
      .join(' || ') || 'false'
  const frontendChecks =
    frontendPaths
      .map((p) => `cleanPath === '${p.toLowerCase()}'`)
      .join(' || ') || 'false'
  const appChecks =
    appPaths
      .map((p) => `cleanPath === '${p.toLowerCase()}'`)
      .join(' || ') || 'false'

  return `
    // 自动生成的路由匹配逻辑
    var pathToNormalize = typeof window !== 'undefined' ? window.location.pathname : '/';
    var cleanPath = pathToNormalize.toLowerCase().trim().split('#')[0].split('?')[0];
    if (!cleanPath.startsWith('/')) cleanPath = '/' + cleanPath;
    if (cleanPath.length > 1 && cleanPath.endsWith('/')) cleanPath = cleanPath.slice(0, -1);
    
    var isBackend = ${backendChecks};
    var isFrontend = ${frontendChecks};
    var isApp = ${appChecks};
    
    var targetPath = '${frontendHomePath}';
    if (isBackend) {
      targetPath = '${backendHomePath}';
    } else if (isApp) {
      targetPath = '${appHomePath}';
    } else if (isFrontend) {
      targetPath = '${frontendHomePath}';
    }
    router.replace(targetPath);
  `
}

/**
 * 为 PageErrorBoundary.tsx 的 logData 生成 getCurrentRouteName / getCurrentComponentName 及路由相关属性
 */
function buildLogDataRouteHelpers() {
  const { routeMap = {}, backendPaths = [], frontendPaths = [] } = routeCache
  const stripLeadingSlash = (s) => (s && s.startsWith('/') ? s.slice(1) : s || '')
  const errorBoundaryRouteMap = {
    ...frontendPaths.reduce((acc, p) => {
      acc[p] = `frontend:${p === '/' ? p : stripLeadingSlash(p)}`
      return acc
    }, {}),
    ...backendPaths.reduce((acc, p) => {
      acc[p] = `backend:${p === '/' ? p : stripLeadingSlash(p)}`
      return acc
    }, {})
  }
  const routeMapStr = JSON.stringify(routeMap)
  const errorBoundaryRouteMapStr = JSON.stringify(errorBoundaryRouteMap)

  const getCurrentRouteNameCode = `
    function getCurrentRouteName(currentUrl) {
      var normalizedPath = currentUrl;
      var cleanPath = normalizedPath;
      if (cleanPath.endsWith('/') && cleanPath !== '/') cleanPath = cleanPath.slice(0, -1);
      var errorBoundaryRouteMap = ${errorBoundaryRouteMapStr};
      if (errorBoundaryRouteMap[cleanPath]) return errorBoundaryRouteMap[cleanPath];
      return 'unknown';
    }
  `
  const getCurrentComponentNameCode = `
    function getCurrentComponentName() {
      var currentPath = typeof window !== 'undefined' ? window.location.pathname : '/';
      var normalizedPath = currentPath;
      var cleanPath = normalizedPath;
      if (cleanPath.endsWith('/') && cleanPath !== '/') cleanPath = cleanPath.slice(0, -1);
      var routeMap = ${routeMapStr};
      return routeMap[cleanPath] || 'unknown';
    }
  `
  let getCurrentRouteNameStmt
  let getCurrentComponentNameStmt
  try {
    getCurrentRouteNameStmt = parse(getCurrentRouteNameCode, { sourceType: 'module' }).program.body[0]
    getCurrentComponentNameStmt = parse(getCurrentComponentNameCode, { sourceType: 'module' }).program.body[0]
  } catch (e) {
    return { statements: [], properties: [] }
  }

  const propertiesCode = `({
    routeName: getCurrentRouteName(typeof window !== 'undefined' ? window.location.pathname : '/'),
    componentName: getCurrentComponentName(),
    routerComponentName: sourceLocation?.function || 'unknown'
  })`
  let properties
  try {
    properties = parse(propertiesCode, { sourceType: 'module' }).program.body[0].expression.properties
  } catch (e) {
    return { statements: [getCurrentRouteNameStmt, getCurrentComponentNameStmt], properties: [] }
  }

  return {
    statements: [getCurrentRouteNameStmt, getCurrentComponentNameStmt],
    properties
  }
}

module.exports = function routeLayoutLoader(source) {
  const callback = this.async()
  const resourcePath = this.resourcePath

  // 只处理特定文件
  const normalizedPath = resourcePath.replace(/\\/g, '/')
  const isNotFoundFile =
    normalizedPath.includes('/not-found.tsx') ||
    normalizedPath.endsWith('not-found.tsx')
  const isErrorFile =
    (normalizedPath.includes('/error.tsx') || normalizedPath.endsWith('error.tsx')) &&
    !normalizedPath.includes('PageErrorBoundary')
  const isPageErrorBoundaryFile = normalizedPath.includes('NextPageErrorBoundary')

  if (!isNotFoundFile && !isErrorFile && !isPageErrorBoundaryFile) {
    return callback(null, source)
  }

  // 排除 node_modules
  if (resourcePath.includes('node_modules')) {
    return callback(null, source)
  }

  try {
    const projectRoot = process.cwd()

    // 扫描路由
    scanAppRoutes(projectRoot)

    // 解析代码
    let ast
    try {
      ast = parse(source, {
        sourceType: 'module',
        plugins: ['jsx', 'typescript', 'decorators-legacy'],
        errorRecovery: true
      })
    } catch (parseError) {
      return callback(null, source)
    }

    let modified = false

    // not-found.tsx / error.tsx：替换 handleTargetHome 函数体
    if (isNotFoundFile || isErrorFile) {
      traverse(ast, {
        VariableDeclarator(varPath) {
          try {
            if (varPath.node?.id?.name === 'handleTargetHome') {
              const init = varPath.node.init
              if (
                init &&
                (init.type === 'ArrowFunctionExpression' ||
                  init.type === 'FunctionExpression')
              ) {
                const currentBody = generate(init.body).code
                if (currentBody.includes('自动生成的路由匹配逻辑')) return
                const newBodyCode = generateHandleTargetHomeBody()
                const newBodyAst = parse(`function temp() { ${newBodyCode} }`, {
                  sourceType: 'module',
                  plugins: ['jsx', 'typescript']
                })
                init.body = newBodyAst.program.body[0].body
                modified = true
              }
            }
          } catch (e) {
            // 静默失败
          }
        },
        FunctionDeclaration(funcPath) {
          try {
            if (funcPath.node?.id?.name === 'handleTargetHome') {
              const currentBody = generate(funcPath.node.body).code
              if (currentBody.includes('自动生成的路由匹配逻辑')) return
              const newBodyCode = generateHandleTargetHomeBody()
              const newBodyAst = parse(`function temp() { ${newBodyCode} }`, {
                sourceType: 'module',
                plugins: ['jsx', 'typescript']
              })
              funcPath.node.body = newBodyAst.program.body[0].body
              modified = true
            }
          } catch (e) {
            // 静默失败
          }
        }
      })
    }

    // PageErrorBoundary.tsx：为 handleFix 内的 logData 注入 routeName / componentName / routerComponentName
    if (isPageErrorBoundaryFile) {
      const { statements: routeHelperStatements, properties: routeProperties } = buildLogDataRouteHelpers()
      if (routeHelperStatements.length && routeProperties.length) {
        traverse(ast, {
          VariableDeclarator(varPath) {
            try {
              if (varPath.node?.id?.name !== 'logData') return
              const init = varPath.node.init
              if (!init || init.type !== 'ObjectExpression') return
              const props = init.properties || []
              const hasRouteName = props.some(
                (p) => t.isObjectProperty(p) && (p.key?.name === 'routeName' || p.key?.value === 'routeName')
              )
              if (hasRouteName) return // 已处理

              const parent = varPath.getFunctionParent()
              if (!parent || !parent.node.body || !t.isBlockStatement(parent.node.body)) return
              const body = parent.node.body.body
              const hasHelper = body.some(
                (stmt) => t.isFunctionDeclaration(stmt) && stmt.id?.name === 'getCurrentRouteName'
              )
              if (!hasHelper) {
                body.unshift(...routeHelperStatements)
              }
              init.properties.push(...routeProperties)
              modified = true
            } catch (e) {
              // 静默失败
            }
          }
        })
      }
    }

    if (modified) {
      const output = generate(
        ast,
        {
          retainLines: true,
          compact: false
        },
        source
      )
      callback(null, output.code)
    } else {
      callback(null, source)
    }
  } catch (error) {
    callback(null, source)
  }
}
