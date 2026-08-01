import { parse } from '@babel/parser';
import MagicString from 'magic-string';
import path from 'path';

// 缓存 estree-walker 的导入
let walkerCache: any = null;

async function getWalker() {
  if (!walkerCache) {
    const { walk } = await import('estree-walker');
    walkerCache = walk;
  }
  return walkerCache;
}

export interface ReactInspectorSimpleOptions {
  extensions?: string[];
  exclude?: (string | RegExp)[];
  includeContent?: boolean;
  attributePrefix?: string;
}

const EXCLUDED_ELEMENTS = new Set([
  'Fragment',
  'React.Fragment',
  '<>',
  '_Fragment',
]);

function findProjectRoot(startPath = process.cwd()): string {
  try {
    let currentPath = startPath;
    let count = 0;

    while (currentPath !== path.parse(currentPath).root && count < 20) {
      if (require('fs').existsSync(path.join(currentPath, 'package.json'))) {
        return currentPath;
      }
      currentPath = path.dirname(currentPath);
      count++;
    }

    return process.cwd();
  } catch (error) {
    return process.cwd();
  }
}

function extractElementContent(jsxElement: any): Record<string, any> {
  const content: Record<string, any> = {};

  if (!jsxElement.children) return content;

  const textContent = jsxElement.children
    .map((child: any) => {
      if (child.type === 'JSXText') {
        return child.value.trim();
      } else if (
        child.type === 'JSXExpressionContainer' && 
        child.expression.type === 'StringLiteral'
      ) {
        return child.expression.value;
      }
      return '';
    })
    .filter(Boolean)
    .join(' ')
    .trim();

  if (textContent) {
    content.text = textContent;
  }

  return content;
}

function extractElementAttributes(attributes: any[]): Record<string, any> {
  const attrs: Record<string, any> = {};

  attributes.forEach((attr: any) => {
    if (attr.type === 'JSXAttribute' && attr.name.name) {
      if (attr.value?.type === 'StringLiteral') {
        attrs[attr.name.name] = attr.value.value;
      } else if (
        attr.value?.type === 'JSXExpressionContainer' && 
        attr.value.expression.type === 'StringLiteral'
      ) {
        attrs[attr.name.name] = attr.value.expression.value;
      }
    }
  });

  return attrs;
}

function getElementName(jsxName: any): string | null {
  if (jsxName.type === 'JSXIdentifier') {
    return jsxName.name;
  } else if (jsxName.type === 'JSXMemberExpression') {
    return `${jsxName.object.name}.${jsxName.property.name}`;
  }
  return null;
}

function shouldTagElement(elementName: string): boolean {
  return !EXCLUDED_ELEMENTS.has(elementName);
}

// 从组件文件名中提取页面名称前缀
// 例如：HomePage_FeaturedBooksSection.tsx -> HomePage
// 例如：BookManagementPage_OperationsBar.tsx -> BookManagementPage
function extractPageNameFromFileName(fileName: string): string | null {
  // 移除文件扩展名
  const nameWithoutExt = fileName.replace(/\.(tsx?|jsx?)$/i, '');
  
  // 检查是否包含下划线分隔符
  const underscoreIndex = nameWithoutExt.indexOf('_');
  if (underscoreIndex === -1) {
    return null;
  }
  
  // 提取下划线前的部分作为页面名称
  const pageName = nameWithoutExt.substring(0, underscoreIndex);
  return pageName || null;
}

// 从页面文件中提取页面名称（从默认导出的函数名）
// 例如：src/pages/HomePage.tsx -> HomePage
// 例如：src/pages/BookManagementPage.tsx -> BookManagementPage
async function extractPageNameFromPageFile(
  componentFilePath: string,
  pageNameFromFileName: string,
  projectRoot: string
): Promise<string | null> {
  const fs = require('fs');
  
  // 构建页面文件路径
  // 例如：src/components/HomePage_FeaturedBooksSection.tsx -> src/pages/HomePage.tsx
  const possibleExtensions = ['.tsx', '.ts', '.jsx', '.js'];
  
  for (const ext of possibleExtensions) {
    const pageFilePath = path.join(
      projectRoot,
      'src',
      'pages',
      `${pageNameFromFileName}${ext}`
    );
    
    if (fs.existsSync(pageFilePath)) {
      try {
        const pageFileContent = fs.readFileSync(pageFilePath, 'utf-8');
        const pageAst = parse(pageFileContent, {
          sourceType: 'module',
          plugins: ['jsx', 'typescript', 'decorators-legacy'],
        });
        
        // 从页面文件中提取默认导出的函数名
        const pageFunctionName = getDefaultExportFunctionName(pageAst);
        return pageFunctionName;
      } catch (error) {
        // 如果解析失败，返回从文件名提取的页面名称
        return pageNameFromFileName;
      }
    }
  }
  
  // 如果页面文件不存在，返回从文件名提取的页面名称
  return pageNameFromFileName;
}

// 从组件函数名中去除页面名称前缀
// 例如：HomePageFeaturedBooksSection + HomePage -> FeaturedBooksSection
// 例如：BookManagementPageOperationsBar + BookManagementPage -> OperationsBar
function removePageNamePrefix(componentName: string, pageName: string): string {
  // 如果组件名以页面名开头，则去除
  if (componentName.startsWith(pageName)) {
    return componentName.substring(pageName.length);
  }
  return componentName;
}

// 检查文件路径是否在 src/components/ 下且是直接文件（不在子目录中）
function isComponentFileInComponents(filePath: string, projectRoot: string): boolean {
  const relativePath = path.relative(projectRoot, filePath);
  // 检查是否在 src/components/ 目录下
  if (!relativePath.includes('src/components/')) {
    return false;
  }
  
  // 提取 src/components/ 之后的部分
  const componentsIndex = relativePath.indexOf('src/components/');
  const afterComponents = relativePath.substring(componentsIndex + 'src/components/'.length);
  
  // 检查是否在子目录中（包含路径分隔符）
  // 例如：ui/alert-dialog.tsx 或 @base/xxx.tsx 都不算
  if (afterComponents.includes(path.sep)) {
    return false;
  }
  
  // 确保是直接文件，例如：BookDetailPage_BookDetailHero.tsx ✓
  return true;
}

// 通过 AST 检查是否是组件文件：有默认导出的函数组件
function isComponentFile(ast: any): boolean {
  const defaultExport = findDefaultExportFunction(ast);
  if (defaultExport === null) {
    return false;
  }
  // 确保是函数类型（函数声明、函数表达式或箭头函数）
  return (
    defaultExport.type === 'FunctionDeclaration' ||
    defaultExport.type === 'FunctionExpression' ||
    defaultExport.type === 'ArrowFunctionExpression'
  );
}

// 获取组件的默认导出函数名
function getDefaultExportFunctionName(ast: any): string | null {
  // @babel/parser 返回的 AST 结构是 { type: 'File', program: { type: 'Program', body: [...] } }
  const body = ast.program?.body || ast.body;
  if (!body) return null;
  
  for (const node of body) {
    // 处理 export default function ComponentName() {}
    if (node.type === 'ExportDefaultDeclaration' && node.declaration) {
      const decl = node.declaration;
      // export default function ComponentName() {}
      if (decl.type === 'FunctionDeclaration' && decl.id) {
        return decl.id.name;
      }
      // export default ComponentName (ComponentName 是标识符)
      if (decl.type === 'Identifier') {
        const name = decl.name;
        // 查找对应的函数声明或变量声明
        for (const bodyNode of body) {
          // 函数声明
          if (bodyNode.type === 'FunctionDeclaration' && bodyNode.id?.name === name) {
            return name;
          }
          // 变量声明（函数表达式或箭头函数）
          if (bodyNode.type === 'VariableDeclaration') {
            for (const declarator of bodyNode.declarations || []) {
              if (declarator.id?.name === name && 
                  (declarator.init?.type === 'FunctionExpression' ||
                   declarator.init?.type === 'ArrowFunctionExpression')) {
                return name;
              }
            }
          }
        }
      }
      // export default () => {} 或 export default function() {}
      // 这种情况下没有函数名，返回 null
    }
  }
  
  return null;
}

// 检查 JSX 元素是否已有 data-controller-name 属性
function hasControllerNameAttribute(attributes: any[]): boolean {
  return attributes.some(
    (attr: any) => 
      attr.type === 'JSXAttribute' && 
      attr.name?.name === 'data-controller-name'
  );
}

// 找到默认导出函数的节点
function findDefaultExportFunction(ast: any): any {
  // @babel/parser 返回的 AST 结构是 { type: 'File', program: { type: 'Program', body: [...] } }
  const body = ast.program?.body || ast.body;
  if (!body) {
    return null;
  }
  
  for (const node of body) {
    if (node.type === 'ExportDefaultDeclaration' && node.declaration) {
      const decl = node.declaration;
      // export default function ComponentName() {}
      if (decl.type === 'FunctionDeclaration') {
        return decl;
      }
      // export default ComponentName (ComponentName 是函数)
      if (decl.type === 'Identifier') {
        const name = decl.name;
        // 查找对应的函数声明或变量声明
        for (const bodyNode of body) {
          if (bodyNode.type === 'FunctionDeclaration' && bodyNode.id?.name === name) {
            return bodyNode;
          }
          if (bodyNode.type === 'VariableDeclaration') {
            for (const declarator of bodyNode.declarations || []) {
              if (declarator.id?.name === name && 
                  (declarator.init?.type === 'FunctionExpression' ||
                   declarator.init?.type === 'ArrowFunctionExpression')) {
                return declarator.init;
              }
            }
          }
        }
      }
      // export default () => {}
      if (decl.type === 'FunctionExpression' || decl.type === 'ArrowFunctionExpression') {
        return decl;
      }
    }
  }
  
  return null;
}

// 检查一个节点是否在 JSXExpressionContainer 中（嵌套在 JSX 中）
// 通过遍历 AST 找到包含该节点的 JSXExpressionContainer
function isInJSXExpressionContainer(node: any, ast: any, walk: any): boolean {
  if (!node || !node.start || !node.end) {
    return false;
  }
  
  // 遍历 AST，查找包含该节点的 JSXExpressionContainer
  let inJSXExpression = false;
  
  walk(ast, {
    enter(n: any) {
      // 如果已经找到，就不需要继续了
      if (inJSXExpression) {
        this.skip();
        return;
      }
      
      // 检查是否是 JSXExpressionContainer 且包含目标节点
      if (n.type === 'JSXExpressionContainer' && n.start && n.end) {
        // 检查目标节点是否在这个 JSXExpressionContainer 内部
        // 使用位置范围检查
        if (node.start >= n.start && node.end <= n.end) {
          inJSXExpression = true;
          this.skip();
        }
      }
    },
  });
  
  return inJSXExpression;
}

// 找到函数体中所有顶层的 return 语句的第一个 JSX 元素
// 只收集函数体直接子级的 return，或顶层 if/else 分支中的 return
// 忽略嵌套在 JSX 表达式中的 return
function findAllFirstJSXInReturns(functionNode: any, ast: any, walk: any): Array<{ element: any; openingElement: any }> {
  const topLevelReturns: any[] = [];
  
  // 获取函数体（BlockStatement）
  let functionBody: any = null;
  if (functionNode.body) {
    if (functionNode.body.type === 'BlockStatement') {
      functionBody = functionNode.body;
    } else {
      // 箭头函数直接返回表达式，没有 BlockStatement
      // 这种情况下，整个 body 就是一个 return 表达式
      if (functionNode.body.type === 'JSXElement') {
        // 直接返回 JSX，处理这种情况
        const openingElement = functionNode.body.openingElement;
        if (openingElement) {
          return [{ element: functionNode.body, openingElement }];
        }
      }
      return [];
    }
  } else {
    return [];
  }
  
  // 递归收集顶层 return 语句
  // 遍历函数体的所有语句
  function collectTopLevelReturns(statements: any[]): void {
    for (const stmt of statements) {
      if (stmt.type === 'ReturnStatement') {
        // 检查这个 return 是否在 JSX 表达式中
        if (!isInJSXExpressionContainer(stmt, ast, walk)) {
          topLevelReturns.push(stmt);
        }
      } else if (stmt.type === 'IfStatement') {
        // 处理 if 语句：检查 then 分支和 else 分支
        if (stmt.consequent) {
          if (stmt.consequent.type === 'ReturnStatement') {
            if (!isInJSXExpressionContainer(stmt.consequent, ast, walk)) {
              topLevelReturns.push(stmt.consequent);
            }
          } else if (stmt.consequent.type === 'BlockStatement') {
            // 递归检查 if 块中的语句
            collectTopLevelReturns(stmt.consequent.body);
          }
        }
        if (stmt.alternate) {
          if (stmt.alternate.type === 'ReturnStatement') {
            if (!isInJSXExpressionContainer(stmt.alternate, ast, walk)) {
              topLevelReturns.push(stmt.alternate);
            }
          } else if (stmt.alternate.type === 'IfStatement') {
            // else if 的情况，递归处理
            collectTopLevelReturns([stmt.alternate]);
          } else if (stmt.alternate.type === 'BlockStatement') {
            // 递归检查 else 块中的语句
            collectTopLevelReturns(stmt.alternate.body);
          }
        }
      }
      // 可以扩展其他语句类型，如 switch-case 等
    }
  }
  
  collectTopLevelReturns(functionBody.body || []);
  
  // 如果没有顶层 return 语句，返回空数组
  if (topLevelReturns.length === 0) {
    return [];
  }
  
  // 为每个顶层 return 语句找到第一个 JSX 元素
  const results: Array<{ element: any; openingElement: any }> = [];
  
  for (const returnStmt of topLevelReturns) {
    let firstJSXElement: any = null;
    let firstJSXOpeningElement: any = null;
    
    walk(returnStmt, {
      enter(node: any) {
        if (node.type === 'JSXElement' && !firstJSXElement) {
          firstJSXElement = node;
        }
        
        if (node.type === 'JSXOpeningElement' && !firstJSXOpeningElement) {
          firstJSXOpeningElement = node;
          // 找到第一个就停止遍历这个 return
          this.skip();
        }
      },
    });
    
    if (firstJSXOpeningElement) {
      results.push({ element: firstJSXElement, openingElement: firstJSXOpeningElement });
    }
  }
  
  return results;
}

// 找到组件中所有 return 语句的第一个 JSX 元素
function findAllFirstJSXElementsInReturns(ast: any, walk: any): Array<{ element: any; openingElement: any }> {
  const defaultExportFunction = findDefaultExportFunction(ast);
  if (!defaultExportFunction) {
    return [];
  }
  
  return findAllFirstJSXInReturns(defaultExportFunction, ast, walk);
}

export default function rsbuildPluginReactInspectorSimple(
  options: ReactInspectorSimpleOptions = {}
): any {
  const {
    extensions = ['.jsx', '.tsx', '.js'],
    exclude = [/node_modules/, /\.d\.ts$/],
    includeContent = true,
    attributePrefix = 'data-source',
  } = options;

  const projectRoot = findProjectRoot();
  const validExtensions = new Set(extensions);

  return {
    name: 'rsbuild-plugin-react-inspector-simple',
    setup(api:any) {
      api.transform(
        {
          test: (filePath: string) => {
            const ext = path.extname(filePath);
            return validExtensions.has(ext);
          },
          exclude: [
            /node_modules/,
            /\.d\.ts$/,
            ...exclude,
          ],
          order: 'pre',
        },
        async ({ code, resourcePath }: { code: string; resourcePath: string }) => {
          try {
            // 额外检查：确保忽略 node_modules 和 .d.ts 文件
            if (resourcePath.includes('node_modules') || resourcePath.endsWith('.d.ts')) {
              return { code };
            }
            
            const id = resourcePath;
            const relativePath = path.relative(projectRoot, id);
            const fileName = path.basename(id);
            const ast = parse(code, {
              sourceType: 'module',
              plugins: ['jsx', 'typescript', 'decorators-legacy'],
            });

            const magicString = new MagicString(code);
            let changedElementsCount = 0;
            let currentElement: any = null;

            const walk = await getWalker();

            // 检查文件路径是否在 src/components/ 下且是直接文件
            const isInComponents = isComponentFileInComponents(id, projectRoot);

            // 通过 AST 检查是否是组件文件（有默认导出的函数组件）
            const isComponent = isComponentFile(ast);
            // 只有同时满足：1. 在 src/components/ 下且是直接文件 2. 有默认导出的函数组件
            if (isInComponents && isComponent) {
              // 获取默认导出的函数名
              const functionName = getDefaultExportFunctionName(ast);
              if (functionName) {
                // 从文件名中提取页面名称前缀
                const pageNameFromFileName = extractPageNameFromFileName(fileName);
                
                // 如果从文件名中提取到了页面名称，尝试从页面文件中获取准确的页面名称
                let pageName: string | null = null;
                if (pageNameFromFileName) {
                  pageName = await extractPageNameFromPageFile(
                    id,
                    pageNameFromFileName,
                    projectRoot
                  );
                }
                
                // 如果提取到了页面名称，从函数名中去除这个前缀
                let controllerName = functionName;
                if (pageName) {
                  controllerName = removePageNamePrefix(functionName, pageName);
                }
                
                // 找到所有 return 语句的第一个 JSX 元素
                const allFirstJSX = findAllFirstJSXElementsInReturns(ast, walk);
                
                // 为每个 return 的第一个 JSX 元素添加 data-controller-name
                for (const jsxInfo of allFirstJSX) {
                  if (jsxInfo && jsxInfo.openingElement) {
                    const openingElement = jsxInfo.openingElement;
                    
                    // 检查是否已有 data-controller-name 属性
                    const hasControllerName = hasControllerNameAttribute(
                      openingElement.attributes || []
                    );
                    
                    if (!hasControllerName) {
                      // 添加 data-controller-name 属性
                      let insertPosition: number;
                      
                      if (openingElement.attributes && openingElement.attributes.length > 0) {
                        // 在第一个属性前插入
                        insertPosition = openingElement.attributes[0].start;
                      } else {
                        // 在元素名后插入
                        insertPosition = openingElement.name.end ?? 0;
                      }
                      
                      magicString.appendLeft(
                        insertPosition,
                        ` data-controller-name="${controllerName}"`
                      );
                      changedElementsCount++;
                    }
                  }
                }
              }
            }

            // 原有的逻辑：为所有 JSX 元素添加 data-source-* 属性
            walk(ast as any, {
              enter(node: any) {
                if (node.type === 'JSXElement') {
                  currentElement = node;
                }

                if (node.type === 'JSXOpeningElement') {
                  const elementName = getElementName(node.name);

                  if (!elementName || !shouldTagElement(elementName)) {
                    return;
                  }

                  const line = node.loc?.start?.line ?? 0;
                  const column = node.loc?.start?.column ?? 0;

                  const componentId = `${relativePath}:${line}:${column}`;
                  const sourceFileName = fileName;
                  const sourceLine = line;
                  const sourceColumn = column;

                  const attributes = extractElementAttributes(node.attributes || []);
                  const content = includeContent ? extractElementContent(currentElement) : {};

                  const contentInfo: Record<string, any> = {};
                  if (content.text) contentInfo.text = content.text;
                  if (attributes.placeholder) contentInfo.placeholder = attributes.placeholder;
                  if (attributes.className) contentInfo.className = attributes.className;

                  const attributesToAdd = [
                    `${attributePrefix}-id="${componentId}"`,
                    `${attributePrefix}-name="${elementName}"`,
                    `${attributePrefix}-file="${sourceFileName}"`,
                    `${attributePrefix}-line="${sourceLine}"`,
                    `${attributePrefix}-column="${sourceColumn}"`,
                  ];

                  if (Object.keys(contentInfo).length > 0) {
                    const encodedContent = encodeURIComponent(JSON.stringify(contentInfo));
                    attributesToAdd.push(`${attributePrefix}-content="${encodedContent}"`);
                  }

                  let insertPosition: number;

                  if (node.typeParameters && node.typeParameters.end) {
                    insertPosition = node.typeParameters.end;
                  } else if (node.attributes && node.attributes.length > 0) {
                    insertPosition = node.attributes[0].start;
                  } else {
                    insertPosition = node.name.end ?? 0;
                  }

                  magicString.appendLeft(insertPosition, ` ${attributesToAdd.join(' ')}`);
                  changedElementsCount++;
                }
              },
            });

            if (changedElementsCount > 0) {
              return {
                code: magicString.toString(),
                map: magicString.generateMap({ hires: true }),
              };
            }

            return { code };
          } catch (error) {
            console.error('Error in react-inspector plugin:', error);
            return { code };
          }
        }
      );
    },
  };
}