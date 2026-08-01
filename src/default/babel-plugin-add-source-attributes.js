/**
 * Babel 插件：为 JSX 元素添加 data-source-* 属性
 * 参考 rsbuild-plugin-react-inspector-simple.ts 的属性字段
 * 在 Turbopack 打包时自动注入源文件路径和行号信息
 */

const path = require('path');
const fs = require('fs');

module.exports = function ({ types: t }) {
  // 排除的元素列表（不需要添加属性）
  const EXCLUDED_ELEMENTS = new Set([
    'Fragment',
    'React.Fragment',
    '<>',
    '_Fragment',
  ]);

  // 获取元素名称
  function getElementName(jsxName) {
    if (jsxName.type === 'JSXIdentifier') {
      return jsxName.name;
    } else if (jsxName.type === 'JSXMemberExpression') {
      return `${jsxName.object.name}.${jsxName.property.name}`;
    }
    return null;
  }

  // 检查是否应该为元素添加属性
  function shouldTagElement(elementName) {
    return elementName && !EXCLUDED_ELEMENTS.has(elementName);
  }

  // 从组件文件名中提取页面名称前缀
  // 例如：HomePage_FeaturedBooksSection.tsx -> HomePage
  function extractPageNameFromFileName(fileName) {
    try {
      const nameWithoutExt = fileName.replace(/\.(tsx?|jsx?)$/i, '');
      const underscoreIndex = nameWithoutExt.indexOf('_');
      if (underscoreIndex === -1) {
        return null;
      }
      const pageName = nameWithoutExt.substring(0, underscoreIndex);
      return pageName || null;
    } catch (e) {
      return null;
    }
  }

  // 从页面文件中提取页面名称（从默认导出的函数名）
  function extractPageNameFromPageFile(componentFilePath, pageNameFromFileName, projectRoot) {
    try {
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
            const { parse } = require('@babel/parser');
            const pageAst = parse(pageFileContent, {
              sourceType: 'module',
              plugins: ['jsx', 'typescript', 'decorators-legacy'],
            });
            
            const pageFunctionName = getDefaultExportFunctionName(pageAst);
            return pageFunctionName || pageNameFromFileName;
          } catch (error) {
            return pageNameFromFileName;
          }
        }
      }
      
      return pageNameFromFileName;
    } catch (e) {
      return pageNameFromFileName;
    }
  }

  // 获取组件的默认导出函数名
  function getDefaultExportFunctionName(ast) {
    try {
      const body = ast.program?.body || ast.body;
      if (!body) return null;
      
      for (const node of body) {
        if (node.type === 'ExportDefaultDeclaration' && node.declaration) {
          const decl = node.declaration;
          // export default function ComponentName() {}
          if (decl.type === 'FunctionDeclaration' && decl.id) {
            return decl.id.name;
          }
          // export default ComponentName (ComponentName 是标识符)
          if (decl.type === 'Identifier') {
            const name = decl.name;
            for (const bodyNode of body) {
              if (bodyNode.type === 'FunctionDeclaration' && bodyNode.id?.name === name) {
                return name;
              }
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
        }
      }
      
      return null;
    } catch (e) {
      return null;
    }
  }

  // 找到默认导出函数的节点
  function findDefaultExportFunction(ast) {
    try {
      const body = ast.program?.body || ast.body;
      if (!body) return null;
      
      for (const node of body) {
        if (node.type === 'ExportDefaultDeclaration' && node.declaration) {
          const decl = node.declaration;
          if (decl.type === 'FunctionDeclaration') {
            return decl;
          }
          if (decl.type === 'Identifier') {
            const name = decl.name;
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
          if (decl.type === 'FunctionExpression' || decl.type === 'ArrowFunctionExpression') {
            return decl;
          }
        }
      }
      
      return null;
    } catch (e) {
      return null;
    }
  }

  // 从组件函数名中去除页面名称前缀
  function removePageNamePrefix(componentName, pageName) {
    try {
      if (componentName && pageName && componentName.startsWith(pageName)) {
        return componentName.substring(pageName.length);
      }
      return componentName;
    } catch (e) {
      return componentName;
    }
  }

  // 检查文件路径是否在 app 目录下
  function isAppFile(filePath, projectRoot) {
    try {
      if (!filePath) return false;
      // 标准化路径
      const normalizedPath = filePath.replace(/\\/g, '/');
      // 检查是否包含 app/ 目录
      return normalizedPath.includes('/app/') && normalizedPath.endsWith('.tsx');
    } catch (e) {
      return false;
    }
  }

  // 检查文件路径是否是组件文件（src/components/ 下的文件）
  function isComponentFile(filePath, projectRoot) {
    try {
      if (!filePath) return false;
      // 标准化路径
      const normalizedPath = filePath.replace(/\\/g, '/');
      // 检查是否包含 src/components/ 或 components/ 目录
      return (normalizedPath.includes('/src/components/') || normalizedPath.includes('/components/')) && normalizedPath.endsWith('.tsx');
    } catch (e) {
      return false;
    }
  }

  // 从组件文件名中提取 controller name
  // 例如：MallHomePage_SeasonalHero.tsx -> SeasonalHero
  function extractControllerNameFromComponentFile(filePath) {
    try {
      if (!filePath) return null;
      const pathModule = require('path');
      const fileName = pathModule.basename(filePath, pathModule.extname(filePath));
      // 查找最后一个下划线的位置
      const underscoreIndex = fileName.lastIndexOf('_');
      if (underscoreIndex !== -1 && underscoreIndex < fileName.length - 1) {
        return fileName.substring(underscoreIndex + 1);
      }
      return null;
    } catch (e) {
      return null;
    }
  }

  // 从 app 文件中提取导入的组件名和对应的 controller name
  function extractImportedComponents(ast) {
    try {
      const body = ast.program?.body || ast.body;
      if (!body) return new Map();
      
      const componentMap = new Map(); // Map<componentName, controllerName>
      
      for (const node of body) {
        if (node.type === 'ImportDeclaration' && node.source) {
          const sourceValue = node.source.value;
          // 检查是否是从 @/components 导入的（支持多种格式）
          // 匹配：@/components/xxx 或 @/components/xxx/yyy 等
          if (sourceValue && (
            sourceValue.startsWith('@/components') || 
            sourceValue.includes('/components/')
          )) {
            for (const specifier of node.specifiers || []) {
              if (specifier.type === 'ImportDefaultSpecifier' && specifier.local) {
                const componentName = specifier.local.name;
                // 从组件名中提取 controller name（去除页面名称前缀）
                // 例如：MallHomePage_SeasonalHero -> SeasonalHero
                const underscoreIndex = componentName.indexOf('_');
                if (underscoreIndex !== -1 && underscoreIndex < componentName.length - 1) {
                  const controllerName = componentName.substring(underscoreIndex + 1);
                  componentMap.set(componentName, controllerName);
                } else {
                  // 如果没有下划线，使用组件名本身
                  componentMap.set(componentName, componentName);
                }
              }
            }
          }
        }
      }
      
      return componentMap;
    } catch (e) {
      return new Map();
    }
  }

  // 检查 JSX 元素是否是某个导入组件的使用
  function isImportedComponentUsage(jsxPath, componentMap) {
    try {
      if (!jsxPath || !jsxPath.node || !componentMap || componentMap.size === 0) {
        return null;
      }
      
      const jsxName = jsxPath.node.name;
      if (!jsxName) return null;
      
      let componentName = null;
      if (jsxName.type === 'JSXIdentifier') {
        componentName = jsxName.name;
      } else if (jsxName.type === 'JSXMemberExpression') {
        // 处理类似 React.Component 的情况，但这里我们主要关注直接组件
        return null;
      }
      
      if (componentName && componentMap.has(componentName)) {
        return componentMap.get(componentName);
      }
      
      return null;
    } catch (e) {
      return null;
    }
  }

  // 检查 JSX 元素是否已有 data-controller-name 属性
  function hasControllerNameAttribute(attributes) {
    try {
      return attributes?.some(
        (attr) => 
          attr?.type === 'JSXAttribute' && 
          attr.name?.name === 'data-controller-name'
      );
    } catch (e) {
      return false;
    }
  }

  // 检查 JSX 元素是否是 return 语句的第一个 JSX 元素（组件的根元素）
  function isFirstJSXInReturn(jsxPath) {
    try {
      // 向上查找，找到包含这个 JSX 的 return 语句
      let currentPath = jsxPath;
      let returnPath = null;
      let depth = 0;
      let foundFunction = false;
      
      while (currentPath && depth < 20) {
        if (currentPath.isReturnStatement && currentPath.isReturnStatement()) {
          returnPath = currentPath;
          break;
        }
        
        // 检查节点类型（使用 node.type 而不是 is* 方法，更精确）
        const nodeType = currentPath.node?.type;
        
        // 如果遇到了函数表达式或箭头函数（回调函数），说明不是组件的根元素
        if (nodeType === 'ArrowFunctionExpression' || nodeType === 'FunctionExpression') {
          // 检查这个函数是否是组件的默认导出函数
          // 如果是回调函数（例如 map 的回调），应该返回 false
          // 我们需要检查这个函数的父节点是否是 CallExpression（说明它是回调）
          const parentNode = currentPath.parentPath?.node;
          if (parentNode && (
              parentNode.type === 'CallExpression' || 
              parentNode.type === 'ArrayMethod' ||
              (parentNode.type === 'MemberExpression' && parentNode.property?.name === 'map')
            )) {
            // 这是回调函数，不是组件函数
            return false;
          }
          foundFunction = true;
        }
        
        // 如果遇到了循环、条件等，说明不是根元素
        // 但 JSX 相关的节点（JSXElement, JSXOpeningElement, JSXFragment 等）应该继续向上查找
        if (nodeType && 
            (nodeType === 'ForStatement' || nodeType === 'ForInStatement' || 
             nodeType === 'ForOfStatement' || nodeType === 'WhileStatement' ||
             nodeType === 'IfStatement' || nodeType === 'SwitchStatement')) {
          return false;
        }
        
        // 注意：不要在这里检查 CallExpression，因为 JSX 可能被包装在函数调用中
        // JSX 相关节点（JSXElement, JSXOpeningElement, JSXFragment 等）应该继续向上查找
        currentPath = currentPath.parentPath;
        depth++;
      }
      
      if (!returnPath) {
        return false;
      }
      
      // 检查 return 语句是否在回调函数内部（例如 map 的回调）
      // 如果是，则不是组件的根元素
      let checkPath = returnPath.parentPath;
      let checkDepth = 0;
      let foundDefaultExportFunction = false;
      
      while (checkPath && checkDepth < 10) {
        const checkNodeType = checkPath.node?.type;
        
        // 如果遇到了箭头函数或函数表达式，检查它的父节点是否是 CallExpression
        if (checkNodeType === 'ArrowFunctionExpression' || checkNodeType === 'FunctionExpression') {
          const parentNode = checkPath.parentPath?.node;
          // 如果父节点是 CallExpression，说明这可能是回调函数
          if (parentNode && parentNode.type === 'CallExpression') {
            const callee = parentNode.callee;
            // 检查是否是数组方法调用（map, filter, forEach 等）
            if (callee && (
                (callee.type === 'MemberExpression' && 
                 ['map', 'filter', 'forEach', 'reduce', 'find', 'some', 'every'].includes(callee.property?.name)) ||
                (callee.type === 'Identifier' && 
                 ['map', 'filter', 'forEach', 'reduce', 'find', 'some', 'every'].includes(callee.name))
              )) {
              // 这是回调函数中的 return，不是组件的根 return
              return false;
            }
          }
          // 如果不是回调函数，继续向上查找，看是否是默认导出函数的一部分
        }
        
        // 如果遇到了 CallExpression，检查是否是数组方法调用
        if (checkNodeType === 'CallExpression') {
          const callee = checkPath.node.callee;
          if (callee && (
              (callee.type === 'MemberExpression' && 
               ['map', 'filter', 'forEach', 'reduce', 'find', 'some', 'every'].includes(callee.property?.name)) ||
              (callee.type === 'Identifier' && 
               ['map', 'filter', 'forEach', 'reduce', 'find', 'some', 'every'].includes(callee.name))
            )) {
            // 这是回调函数中的 return，不是组件的根 return
            return false;
          }
        }
        
        // 如果遇到了函数声明，检查是否是默认导出
        if (checkNodeType === 'FunctionDeclaration') {
          // 检查这个函数是否是默认导出
          // 需要向上查找 ExportDefaultDeclaration
          let exportCheckPath = checkPath.parentPath;
          let exportDepth = 0;
          let isDefaultExport = false;
          
          while (exportCheckPath && exportDepth < 5) {
            const exportNodeType = exportCheckPath.node?.type;
            if (exportNodeType === 'ExportDefaultDeclaration') {
              // 检查导出的是否是这个函数
              const exported = exportCheckPath.node.declaration;
              if (exported === checkPath.node || 
                  (exported && exported.id && checkPath.node.id && exported.id.name === checkPath.node.id.name)) {
                isDefaultExport = true;
                break;
              }
            }
            // 如果遇到了其他顶层声明，停止查找
            if (exportNodeType === 'Program') {
              break;
            }
            exportCheckPath = exportCheckPath.parentPath;
            exportDepth++;
          }
          
          // 只有默认导出的函数才被认为是组件函数
          if (isDefaultExport) {
            foundDefaultExportFunction = true;
            break;
          } else {
            // 如果不是默认导出，说明 return 不在组件函数中
            return false;
          }
        }
        
        // 如果遇到了箭头函数或函数表达式，检查是否是默认导出的一部分
        if (checkNodeType === 'ArrowFunctionExpression' || checkNodeType === 'FunctionExpression') {
          // 检查这个函数是否是默认导出
          let exportCheckPath = checkPath.parentPath;
          let exportDepth = 0;
          let isDefaultExport = false;
          let variableName = null;
          
          // 首先检查是否在变量声明中（const ComponentName = () => {}）
          if (exportCheckPath && exportCheckPath.node?.type === 'VariableDeclarator') {
            const declarator = exportCheckPath.node;
            if (declarator.id && declarator.id.type === 'Identifier') {
              variableName = declarator.id.name;
            }
          }
          
          while (exportCheckPath && exportDepth < 5) {
            const exportNodeType = exportCheckPath.node?.type;
            
            // 如果是直接导出函数表达式
            if (exportNodeType === 'ExportDefaultDeclaration') {
              const exported = exportCheckPath.node.declaration;
              if (exported === checkPath.node) {
                isDefaultExport = true;
                break;
              }
              // 如果导出的是标识符，检查是否匹配变量名
              if (exported && exported.type === 'Identifier' && variableName && exported.name === variableName) {
                isDefaultExport = true;
                break;
              }
            }
            
            // 如果遇到了 Program，需要在整个 Program 中查找 export default
            if (exportNodeType === 'Program') {
              // 在 Program 的 body 中查找 export default
              const programBody = exportCheckPath.node.body || [];
              for (const node of programBody) {
                if (node.type === 'ExportDefaultDeclaration') {
                  const exported = node.declaration;
                  // 检查导出的是否是变量名
                  if (exported && exported.type === 'Identifier' && variableName && exported.name === variableName) {
                    isDefaultExport = true;
                    break;
                  }
                  // 检查导出的是否是函数本身
                  if (exported === checkPath.node) {
                    isDefaultExport = true;
                    break;
                  }
                }
              }
              if (isDefaultExport) {
                break;
              }
              // 到达 Program，停止查找
              break;
            }
            
            exportCheckPath = exportCheckPath.parentPath;
            exportDepth++;
          }
          
          // 只有默认导出的函数才被认为是组件函数
          if (isDefaultExport) {
            foundDefaultExportFunction = true;
            break;
          }
          // 如果不是默认导出，继续向上查找（可能是内部函数）
        }
        
        checkPath = checkPath.parentPath;
        checkDepth++;
      }
      
      // 如果没有找到默认导出函数，说明 return 不在组件函数中
      if (!foundDefaultExportFunction) {
        return false;
      }
      
      // 检查这个 JSX 是否是 return 语句中的第一个 JSX 元素
      const returnArg = returnPath.node.argument;
      if (!returnArg) {
        return false;
      }
      
      // 如果 return 的直接参数就是 JSX，那么它的 openingElement 就是第一个
      if (returnArg.type === 'JSXElement') {
        return jsxPath.node === returnArg.openingElement;
      }
      
      // 如果 return 的参数是 Fragment（<>...</>），检查第一个子元素
      if (returnArg.type === 'JSXFragment') {
        const firstChild = returnArg.children?.[0];
        if (firstChild && firstChild.type === 'JSXElement') {
          return jsxPath.node === firstChild.openingElement;
        }
        return false;
      }
      
      // 如果 return 的参数是条件表达式，需要检查是否是第一个分支的第一个 JSX
      if (returnArg.type === 'ConditionalExpression') {
        // 检查是否是 then 分支的第一个 JSX
        if (returnArg.consequent && returnArg.consequent.type === 'JSXElement') {
          if (jsxPath.node === returnArg.consequent.openingElement) {
            return true;
          }
        }
        // 检查是否是 else 分支的第一个 JSX
        if (returnArg.alternate && returnArg.alternate.type === 'JSXElement') {
          if (jsxPath.node === returnArg.alternate.openingElement) {
            return true;
          }
        }
      }
      
      // 如果 return 的参数是逻辑表达式（&& 或 ||），检查第一个操作数
      if (returnArg.type === 'LogicalExpression') {
        if (returnArg.left && returnArg.left.type === 'JSXElement') {
          if (jsxPath.node === returnArg.left.openingElement) {
            return true;
          }
        }
      }
      
      // 如果 return 的参数是数组表达式，检查第一个元素
      if (returnArg.type === 'ArrayExpression') {
        const firstElement = returnArg.elements?.[0];
        if (firstElement && firstElement.type === 'JSXElement') {
          if (jsxPath.node === firstElement.openingElement) {
            return true;
          }
        }
      }
      
      return false;
    } catch (e) {
      return false;
    }
  }

  // 提取元素属性
  function extractElementAttributes(attributes) {
    const attrs = {};
    attributes.forEach((attr) => {
      if (attr.type === 'JSXAttribute' && attr.name && attr.name.name) {
        if (attr.value && attr.value.type === 'StringLiteral') {
          attrs[attr.name.name] = attr.value.value;
        } else if (
          attr.value &&
          attr.value.type === 'JSXExpressionContainer' &&
          attr.value.expression &&
          attr.value.expression.type === 'StringLiteral'
        ) {
          attrs[attr.name.name] = attr.value.expression.value;
        }
      }
    });
    return attrs;
  }

  // 提取元素内容
  function extractElementContent(jsxElement) {
    const content = {};
    if (!jsxElement || !jsxElement.children) return content;

    const textContent = jsxElement.children
      .map((child) => {
        if (child.type === 'JSXText') {
          return child.value.trim();
        } else if (
          child.type === 'JSXExpressionContainer' &&
          child.expression &&
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

  return {
    name: 'add-source-attributes',
    visitor: {
      Program(programPath, state) {
        try {
          const filename = state?.file?.opts?.filename || state?.file?.opts?.sourceFileName || '';
          if (!filename) return;

          const projectRoot = process.cwd();
          const isApp = isAppFile(filename, projectRoot);
          const isComponent = isComponentFile(filename, projectRoot);
          
          if (isApp) {
            const ast = programPath.node;
            // 提取导入的组件和对应的 controller name
            const componentMap = extractImportedComponents(ast);
            // 将 componentMap 存储到 state 中，供 JSXOpeningElement 使用
            if (componentMap.size > 0) {
              state.componentMap = componentMap;
              state.isAppFile = true;
            }
          }
          
          if (isComponent) {
            // 从组件文件名中提取 controller name
            const controllerName = extractControllerNameFromComponentFile(filename);
            if (controllerName) {
              state.componentControllerName = controllerName;
              state.isComponentFile = true;
            }
          }
        } catch (e) {
          // 静默失败
        }
      },
      JSXOpeningElement(path, state) {
        try {
          // 获取当前文件的路径信息
          const filename = state?.file?.opts?.filename || state?.file?.opts?.sourceFileName;
          if (!filename) return;

          // 获取当前节点的位置信息
          const node = path?.node;
          if (!node) return;
          
          const loc = node.loc;
          if (!loc || !loc.start) return;

          // 获取元素名称
          const elementName = getElementName(node.name);
          if (!shouldTagElement(elementName)) {
            return;
          }

          // 计算相对路径（相对于项目根目录）
          const projectRoot = process.cwd();
          let relativePath = filename;
          try {
            const pathModule = require('path');
            relativePath = pathModule.relative(projectRoot, filename);
            // 统一使用正斜杠
            relativePath = relativePath.replace(/\\/g, '/');
          } catch (e) {
            // 如果计算失败，使用原始路径
            relativePath = filename.replace(/\\/g, '/');
          }

          // 获取文件名
          let fileName = filename;
          try {
            const pathModule = require('path');
            fileName = pathModule.basename(filename);
          } catch (e) {
            // 如果失败，使用原始文件名
            fileName = filename.split('/').pop() || filename.split('\\').pop() || 'unknown';
          }

          // 获取行号和列号
          const line = loc.start.line || 0;
          const column = loc.start.column || 0;

          // 构建 componentId
          const componentId = `${relativePath}:${line}:${column}`;

          // 检查是否需要添加 data-controller-name
          let controllerNameAttr = null;
          
          // 1. 如果是组件文件，检查是否是根元素
          if (state?.isComponentFile && state?.componentControllerName) {
            try {
              const hasControllerName = hasControllerNameAttribute(node.attributes || []);
              
              if (!hasControllerName) {
                // 检查是否是 return 语句的第一个 JSX 元素（根元素）
                const isRoot = isFirstJSXInReturn(path);
                
                if (isRoot) {
                  controllerNameAttr = t.jsxAttribute(
                    t.jsxIdentifier('data-controller-name'),
                    t.stringLiteral(state.componentControllerName)
                  );
                }
              }
            } catch (e) {
              // 静默失败
            }
          }
          
          // 2. 如果是 app 文件中导入的组件使用
          if (!controllerNameAttr && state?.isAppFile && state?.componentMap && state.componentMap.size > 0) {
            try {
              const hasControllerName = hasControllerNameAttribute(node.attributes || []);
              
              if (!hasControllerName) {
                // 检查是否是导入组件的使用
                const controllerName = isImportedComponentUsage(path, state.componentMap);
                
                if (controllerName) {
                  controllerNameAttr = t.jsxAttribute(
                    t.jsxIdentifier('data-controller-name'),
                    t.stringLiteral(controllerName)
                  );
                }
              }
            } catch (e) {
              // 静默失败
            }
          }

          // 检查是否已经存在 data-source-* 属性
          // 注意：这里使用 node.attributes，如果上面替换了节点，node 应该已经更新
          const hasDataSourceId = node.attributes?.some(
            (attr) =>
              attr?.name &&
              attr.name.name === 'data-source-id'
          );

          if (hasDataSourceId) {
            // 如果已经存在，不重复添加
            return;
          }

          // 提取元素属性和内容
          const attributes = extractElementAttributes(node.attributes || []);
          let content = {};
          try {
            const jsxElement = path?.parent;
            if (jsxElement) {
              content = extractElementContent(jsxElement);
            }
          } catch (e) {
            // 如果提取内容失败，继续处理
            content = {};
          }

          // 构建内容信息
          const contentInfo = {};
          if (content?.text) contentInfo.text = content.text;
          if (attributes?.placeholder) contentInfo.placeholder = attributes.placeholder;
          if (attributes?.className) contentInfo.className = attributes.className;

          // 默认属性前缀（可通过配置修改）
          const attributePrefix = state?.opts?.attributePrefix || 'data-source';
          const includeContent = state?.opts?.includeContent !== false; // 默认包含内容

          // 添加所有属性
          const attributesToAdd = [];
          try {
            attributesToAdd.push(
              t.jsxAttribute(
                t.jsxIdentifier(`${attributePrefix}-id`),
                t.stringLiteral(componentId)
              ),
              t.jsxAttribute(
                t.jsxIdentifier(`${attributePrefix}-name`),
                t.stringLiteral(elementName || 'unknown')
              ),
              t.jsxAttribute(
                t.jsxIdentifier(`${attributePrefix}-file`),
                t.stringLiteral(fileName)
              ),
              t.jsxAttribute(
                t.jsxIdentifier(`${attributePrefix}-line`),
                t.stringLiteral(String(line))
              ),
              t.jsxAttribute(
                t.jsxIdentifier(`${attributePrefix}-column`),
                t.stringLiteral(String(column))
              )
            );

            // 如果包含内容且有内容信息，添加 content 属性
            if (includeContent && Object.keys(contentInfo).length > 0) {
              try {
                const encodedContent = encodeURIComponent(JSON.stringify(contentInfo));
                attributesToAdd.push(
                  t.jsxAttribute(
                    t.jsxIdentifier(`${attributePrefix}-content`),
                    t.stringLiteral(encodedContent)
                  )
                );
              } catch (e) {
                // 如果编码失败，跳过 content 属性
              }
            }

            // 保留原有的 data-file 和 data-column（向后兼容）
            attributesToAdd.push(
              t.jsxAttribute(
                t.jsxIdentifier('data-file'),
                t.stringLiteral(relativePath)
              )
            );
            attributesToAdd.push(
              t.jsxAttribute(
                t.jsxIdentifier('data-column'),
                t.stringLiteral(`${line}:${column + 1}`)
              )
            );

            // 将所有新属性添加到节点（统一添加，包括 data-controller-name）
            if (node.attributes && Array.isArray(node.attributes)) {
              // 检查是否已经有 data-controller-name
              const hasExistingControllerName = node.attributes.some(
                (attr) => attr?.name?.name === 'data-controller-name'
              );
              
              // 如果有 data-controller-name 需要添加，先添加到 attributesToAdd 的最前面
              if (controllerNameAttr && !hasExistingControllerName) {
                attributesToAdd.unshift(controllerNameAttr);
              }
              
              // 添加所有属性（包括 data-controller-name 和 data-source-*）
              node.attributes.push(...attributesToAdd);
              
              // 如果有 data-controller-name，确保它在最前面
              if (controllerNameAttr || hasExistingControllerName) {
                const controllerNameIndex = node.attributes.findIndex(
                  (attr) => attr?.name?.name === 'data-controller-name'
                );
                if (controllerNameIndex > 0) {
                  // 如果不在最前面，移到最前面
                  const attr = node.attributes.splice(controllerNameIndex, 1)[0];
                  node.attributes.unshift(attr);
                }
              }
              
              // 确保 Babel 知道节点被修改了
              path.node = node;
            }
          } catch (e) {
            // 如果添加属性失败，静默失败
            return;
          }
        } catch (e) {
          // 任何错误都静默处理，不中断构建
          return;
        }
      },
    },
  };
};

