/**
 * Webpack Loader：为 JSX 元素添加 data-source-* 属性
 * 替代 babel-plugin-add-source-attributes.js
 *
 * 在 SWC 编译后处理代码，注入调试属性
 */

const path = require('path')
const { parse } = require('@babel/parser')
const traverse = require('@babel/traverse').default
const generate = require('@babel/generator').default
const t = require('@babel/types')

// 排除的元素列表
const EXCLUDED_ELEMENTS = new Set([
  'Fragment',
  'React.Fragment',
  '<>',
  '_Fragment',
  '_jsxDEV', // React 开发模式函数
  '_jsx' // React 生产模式函数
])

// 获取元素名称
function getElementName(jsxName) {
  if (!jsxName) return null
  if (jsxName.type === 'JSXIdentifier') {
    return jsxName.name
  } else if (jsxName.type === 'JSXMemberExpression') {
    return `${jsxName.object?.name || ''}.${jsxName.property?.name || ''}`
  }
  return null
}

// 检查是否应该为元素添加属性
function shouldTagElement(elementName) {
  return elementName && !EXCLUDED_ELEMENTS.has(elementName)
}

// 检查文件是否在 app 目录下
function isAppFile(filePath) {
  if (!filePath) return false
  const normalizedPath = filePath.replace(/\\/g, '/')
  return (
    normalizedPath.includes('/app/') &&
    (normalizedPath.endsWith('.tsx') || normalizedPath.endsWith('.jsx'))
  )
}

// 检查是否是组件文件
function isComponentFile(filePath) {
  if (!filePath) return false
  const normalizedPath = filePath.replace(/\\/g, '/')
  return (
    (normalizedPath.includes('/src/components/') ||
      normalizedPath.includes('/components/')) &&
    (normalizedPath.endsWith('.tsx') || normalizedPath.endsWith('.jsx'))
  )
}

// 从组件文件名中提取 controller name
// HomePage_FeaturedBooksSection.tsx -> FeaturedBooksSection
// AdminLoginView.tsx -> AdminLoginView
function extractControllerNameFromComponentFile(filePath) {
  if (!filePath) return null
  const fileName = path.basename(filePath, path.extname(filePath))
  const underscoreIndex = fileName.lastIndexOf('_')
  if (underscoreIndex !== -1 && underscoreIndex < fileName.length - 1) {
    return fileName.substring(underscoreIndex + 1)
  }
  // 没有下划线，返回完整文件名
  return fileName
}

// 提取导入的组件映射
function extractImportedComponents(ast) {
  const componentMap = new Map()

  try {
    const body = ast.program?.body || []
    for (const node of body) {
      if (node.type === 'ImportDeclaration' && node.source) {
        const sourceValue = node.source.value
        if (
          sourceValue &&
          (sourceValue.startsWith('@/components') ||
            sourceValue.includes('/components/'))
        ) {
          for (const specifier of node.specifiers || []) {
            if (
              specifier.type === 'ImportDefaultSpecifier' &&
              specifier.local
            ) {
              const componentName = specifier.local.name
              const underscoreIndex = componentName.indexOf('_')
              if (
                underscoreIndex !== -1 &&
                underscoreIndex < componentName.length - 1
              ) {
                const controllerName = componentName.substring(
                  underscoreIndex + 1
                )
                componentMap.set(componentName, controllerName)
              } else {
                componentMap.set(componentName, componentName)
              }
            }
          }
        }
      }
    }
  } catch (e) {
    // 静默失败
  }

  return componentMap
}

// 检查是否是 return 语句中的第一个 JSX 元素
function isFirstJSXInReturn(jsxPath) {
  try {
    let currentPath = jsxPath
    let returnPath = null
    let depth = 0

    while (currentPath && depth < 20) {
      if (currentPath.isReturnStatement && currentPath.isReturnStatement()) {
        returnPath = currentPath
        break
      }

      const nodeType = currentPath.node?.type

      // 如果遇到回调函数，说明不是组件的根元素
      if (
        nodeType === 'ArrowFunctionExpression' ||
        nodeType === 'FunctionExpression'
      ) {
        const parentNode = currentPath.parentPath?.node
        if (parentNode && parentNode.type === 'CallExpression') {
          return false
        }
      }

      currentPath = currentPath.parentPath
      depth++
    }

    if (!returnPath) return false

    const returnArg = returnPath.node.argument
    if (!returnArg) return false

    if (returnArg.type === 'JSXElement') {
      return jsxPath.node === returnArg.openingElement
    }

    if (returnArg.type === 'JSXFragment') {
      const firstChild = returnArg.children?.[0]
      if (firstChild && firstChild.type === 'JSXElement') {
        return jsxPath.node === firstChild.openingElement
      }
    }

    return false
  } catch (e) {
    return false
  }
}

module.exports = function sourceAttributesLoader(source) {
  const callback = this.async()
  const resourcePath = this.resourcePath

  // 只处理 tsx/jsx 文件
  if (!resourcePath.endsWith('.tsx') && !resourcePath.endsWith('.jsx')) {
    return callback(null, source)
  }

  // 排除 node_modules
  if (resourcePath.includes('node_modules')) {
    return callback(null, source)
  }

  try {
    const projectRoot = process.cwd()
    const relativePath = path
      .relative(projectRoot, resourcePath)
      .replace(/\\/g, '/')
    const fileName = path.basename(resourcePath)

    const isApp = isAppFile(resourcePath)
    const isComponent = isComponentFile(resourcePath)

    // 解析代码
    let ast
    try {
      ast = parse(source, {
        sourceType: 'module',
        plugins: ['jsx', 'typescript', 'decorators-legacy'],
        errorRecovery: true
      })
    } catch (parseError) {
      // 解析失败，返回原始代码
      return callback(null, source)
    }

    let componentMap = new Map()
    let componentControllerName = null

    if (isApp) {
      componentMap = extractImportedComponents(ast)
    }

    if (isComponent) {
      componentControllerName =
        extractControllerNameFromComponentFile(resourcePath)
    }

    let modified = false

    // 遍历 AST
    traverse(ast, {
      JSXOpeningElement(jsxPath) {
        try {
          const node = jsxPath.node
          if (!node || !node.loc) return

          const elementName = getElementName(node.name)
          if (!shouldTagElement(elementName)) return

          const line = node.loc.start.line || 0
          const column = node.loc.start.column || 0
          const componentId = `${relativePath}:${line}:${column}`

          // 检查是否已存在 data-source-id
          const hasDataSourceId = node.attributes?.some(
            (attr) => attr?.name?.name === 'data-source-id'
          )

          if (hasDataSourceId) return

          // 准备添加的属性
          const attributesToAdd = []

          // 添加 data-controller-name（如果适用）
          // 1. 组件文件：为根元素添加 controller-name
          if (isComponent && componentControllerName) {
            const hasControllerName = node.attributes?.some(
              (attr) => attr?.name?.name === 'data-controller-name'
            )
            if (!hasControllerName && isFirstJSXInReturn(jsxPath)) {
              attributesToAdd.push(
                t.jsxAttribute(
                  t.jsxIdentifier('data-controller-name'),
                  t.stringLiteral(componentControllerName)
                )
              )
            }
          }

          // 2. App 文件：为导入的组件添加 controller-name
          if (isApp && componentMap.size > 0) {
            const hasControllerName = node.attributes?.some(
              (attr) => attr?.name?.name === 'data-controller-name'
            )
            if (!hasControllerName) {
              // 检查当前元素是否是导入的组件
              const jsxName = node.name
              let componentName = null
              if (jsxName && jsxName.type === 'JSXIdentifier') {
                componentName = jsxName.name
              }
              if (componentName && componentMap.has(componentName)) {
                const controllerName = componentMap.get(componentName)
                attributesToAdd.push(
                  t.jsxAttribute(
                    t.jsxIdentifier('data-controller-name'),
                    t.stringLiteral(controllerName)
                  )
                )
              }
            }
          }

          // 提取元素属性用于 data-source-content
          const contentInfo = {}
          for (const attr of node.attributes || []) {
            if (attr.type === 'JSXAttribute' && attr.name?.name) {
              const attrName = attr.name.name
              if (attrName === 'className' || attrName === 'placeholder') {
                if (attr.value?.type === 'StringLiteral') {
                  contentInfo[attrName] = attr.value.value
                }
              }
            }
          }

          // 添加 data-source-* 属性
          attributesToAdd.push(
            t.jsxAttribute(
              t.jsxIdentifier('data-source-id'),
              t.stringLiteral(componentId)
            ),
            t.jsxAttribute(
              t.jsxIdentifier('data-source-name'),
              t.stringLiteral(elementName || 'unknown')
            ),
            t.jsxAttribute(
              t.jsxIdentifier('data-source-file'),
              t.stringLiteral(fileName)
            ),
            t.jsxAttribute(
              t.jsxIdentifier('data-source-line'),
              t.stringLiteral(String(line))
            ),
            t.jsxAttribute(
              t.jsxIdentifier('data-source-column'),
              t.stringLiteral(String(column))
            )
          )

          // 添加 data-source-content（URL 编码的 JSON）
          if (Object.keys(contentInfo).length > 0) {
            try {
              const encodedContent = encodeURIComponent(
                JSON.stringify(contentInfo)
              )
              attributesToAdd.push(
                t.jsxAttribute(
                  t.jsxIdentifier('data-source-content'),
                  t.stringLiteral(encodedContent)
                )
              )
            } catch (e) {
              // 编码失败时跳过
            }
          }

          // 向后兼容属性
          attributesToAdd.push(
            t.jsxAttribute(
              t.jsxIdentifier('data-file'),
              t.stringLiteral(relativePath)
            ),
            t.jsxAttribute(
              t.jsxIdentifier('data-column'),
              t.stringLiteral(`${line}:${column + 1}`)
            )
          )

          // 添加属性到节点
          if (node.attributes && Array.isArray(node.attributes)) {
            node.attributes.push(...attributesToAdd)
            modified = true
          }
        } catch (e) {
          // 静默失败
        }
      }
    })

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
    // 发生错误时返回原始代码
    callback(null, source)
  }
}
