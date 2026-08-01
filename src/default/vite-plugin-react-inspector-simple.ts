import type { Plugin, TransformResult } from 'vite'
import { parse } from '@babel/parser'
import MagicString from 'magic-string'
import path from 'path'

// 缓存 estree-walker 的导入，避免重复动态导入
let walkerCache: any = null

/**
 * 获取 estree-walker，使用缓存避免重复导入
 */
async function getWalker() {
  if (!walkerCache) {
    const { walk } = await import('estree-walker')
    walkerCache = walk
  }
  return walkerCache
}



/**
 * 插件配置选项接口
 */
export interface VitePluginReactInspectorSimpleOptions {
  /**
   * 要处理的文件扩展名
   */
  extensions?: string[]

  /**
   * 排除的文件模式
   */
  exclude?: (string | RegExp)[]

  /**
   * 是否包含内容信息（文本、className、placeholder）
   * @default true
   */
  includeContent?: boolean

  /**
   * 自定义属性前缀
   * @default 'data-source'
   */
  attributePrefix?: string


}

/**
 * 应该排除的特殊元素（React Fragment 等）
 */
const EXCLUDED_ELEMENTS = new Set([
  'Fragment',
  'React.Fragment',
  '<>',
  '_Fragment',
])

/**
 * 从项目根目录开始查找
 */
function findProjectRoot(startPath = process.cwd()): string {
  try {
    let currentPath = startPath
    let count = 0

    while (currentPath !== path.parse(currentPath).root && count < 20) {
      if (require('fs').existsSync(path.join(currentPath, 'package.json'))) {
        return currentPath
      }
      currentPath = path.dirname(currentPath)
      count++
    }

    return process.cwd()
  } catch (error) {
    return process.cwd()
  }
}



/**
 * 提取 JSX 元素的内容信息
 */
function extractElementContent(jsxElement: any): Record<string, any> {
  const content: Record<string, any> = {}

  if (!jsxElement.children) return content

  // 提取文本内容
  const textContent = jsxElement.children
    .map((child: any) => {
      if (child.type === 'JSXText') {
        return child.value.trim()
      } else if (
        child.type === 'JSXExpressionContainer' && 
        child.expression.type === 'StringLiteral'
      ) {
        return child.expression.value
      }
      return ''
    })
    .filter(Boolean)
    .join(' ')
    .trim()

  if (textContent) {
    content.text = textContent
  }

  return content
}

/**
 * 提取 JSX 属性信息
 */
function extractElementAttributes(attributes: any[]): Record<string, any> {
  const attrs: Record<string, any> = {}

  attributes.forEach((attr: any) => {
    if (attr.type === 'JSXAttribute' && attr.name.name) {
      if (attr.value?.type === 'StringLiteral') {
        attrs[attr.name.name] = attr.value.value
      } else if (
        attr.value?.type === 'JSXExpressionContainer' && 
        attr.value.expression.type === 'StringLiteral'
      ) {
        attrs[attr.name.name] = attr.value.expression.value
      }
    }
  })

  return attrs
}

/**
 * 获取 JSX 元素名称
 */
function getElementName(jsxName: any): string | null {
  if (jsxName.type === 'JSXIdentifier') {
    return jsxName.name
  } else if (jsxName.type === 'JSXMemberExpression') {
    return `${jsxName.object.name}.${jsxName.property.name}`
  }
  return null
}

/**
 * 判断是否应该标记元素
 */
function shouldTagElement(elementName: string): boolean {
  return !EXCLUDED_ELEMENTS.has(elementName)
}

/**
 * Vite 插件：为 JSX 元素添加源码位置属性
 * 
 * @param options 插件配置选项
 * @returns Vite 插件实例
 */
export default function VitePluginReactInspectorSimple(
  options: VitePluginReactInspectorSimpleOptions = {}
): Plugin {
  const {
    extensions = ['.jsx', '.tsx', '.js'],
    exclude = [/node_modules/, /\.d\.ts$/],
    includeContent = true,
    attributePrefix = 'data-source',
  } = options

  const projectRoot = findProjectRoot()
  const validExtensions = new Set(extensions)


  return {
    name: 'vite-plugin-react-inspector-simple',
    enforce: 'pre',

    async transform(code: string, id: string): Promise<TransformResult | null> {
      // 检查文件扩展名
      if (!validExtensions.has(path.extname(id))) {
        return null
      }

      // 检查排除规则
      const shouldExclude = exclude.some(pattern => {
        if (typeof pattern === 'string') {
          return id.includes(pattern)
        }
        return pattern.test(id)
      })

      // 如果明确排除，则跳过
      if (shouldExclude) {
        return null
      }

      // 获取相对路径和文件名
      const relativePath = path.relative(projectRoot, id)
      const fileName = path.basename(id)


      try {
        // 解析 AST
        const ast = parse(code, {
          sourceType: 'module',
          plugins: ['jsx', 'typescript', 'decorators-legacy']
        })

        const magicString = new MagicString(code)
        let changedElementsCount = 0
        let currentElement: any = null

        // 使用缓存的 walker，避免重复动态导入
        const walk = await getWalker()

        // 遍历 AST
        walk(ast as any, {
          enter(node: any) {
            if (node.type === 'JSXElement') {
              currentElement = node
            }

            // 处理 JSX 开放标签
            if (node.type === 'JSXOpeningElement') {
              const elementName = getElementName(node.name)

              if (!elementName || !shouldTagElement(elementName)) {
                return
              }

              // 获取位置信息
              const line = node.loc?.start?.line ?? 0
              const column = node.loc?.start?.column ?? 0

              const componentId = `${relativePath}:${line}:${column}`
              const sourceFileName = fileName
              const sourceLine = line
              const sourceColumn = column



              // 提取属性和内容信息
              const attributes = extractElementAttributes(node.attributes || [])
              const content = includeContent ? extractElementContent(currentElement) : {}

              // 合并内容信息
              const contentInfo: Record<string, any> = {}
              if (content.text) contentInfo.text = content.text
              if (attributes.placeholder) contentInfo.placeholder = attributes.placeholder
              if (attributes.className) contentInfo.className = attributes.className

              // 构建要添加的属性
              const attributesToAdd = [
                `${attributePrefix}-id="${componentId}"`,
                `${attributePrefix}-name="${elementName}"`,
                `${attributePrefix}-file="${sourceFileName}"`,
                `${attributePrefix}-line="${sourceLine}"`,
                `${attributePrefix}-column="${sourceColumn}"`
              ]

              // 如果有内容信息，添加内容属性
              if (Object.keys(contentInfo).length > 0) {
                const encodedContent = encodeURIComponent(JSON.stringify(contentInfo))
                attributesToAdd.push(`${attributePrefix}-content="${encodedContent}"`)
              }

              // 找到正确的插入位置：
              // 1. 如果有 typeParameters（泛型），在泛型后插入
              // 2. 如果有现有属性，在第一个属性前插入  
              // 3. 否则在元素名称后插入
              let insertPosition: number

              if (node.typeParameters && node.typeParameters.end) {
                // 有泛型参数，在泛型后插入属性
                insertPosition = node.typeParameters.end
              } else if (node.attributes && node.attributes.length > 0) {
                // 有现有属性，在第一个属性前插入
                insertPosition = node.attributes[0].start
              } else {
                // 没有属性和泛型，在元素名称后插入
                insertPosition = node.name.end ?? 0
              }

              magicString.appendLeft(insertPosition, ` ${attributesToAdd.join(' ')}`)

              changedElementsCount++
            }
          }
        })

        if (changedElementsCount > 0) {

          return {
            code: magicString.toString(),
            map: magicString.generateMap({ hires: true })
          }
        }

        return null
      } catch (error) {

        return null
      }
    }
  }
}