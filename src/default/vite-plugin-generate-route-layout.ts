import { Plugin } from 'vite';
import fs from 'fs';
import path from 'path';

export default function autoNotFoundRoutePlugin(basePath: string): Plugin {
  let projectRoot = process.cwd();
  let backendPaths: string[] = [];
  let frontendPaths: string[] = [];

  const mainId = path.resolve(projectRoot, 'src/main.tsx');
  const notFoundId = path.resolve(projectRoot, 'src/default/NotFound.tsx');
  return {
    name: 'auto-notfound-route',
    apply: 'build',

    async buildStart() {
      try {
        // 读取 App.tsx 获取 Router 的 basename
        // 尝试从多个可能的路径读取 App.tsx
        let appPath = path.resolve(projectRoot, 'src/App.tsx');
        let appCode = '';
        
        try {
          appCode = await fs.promises.readFile(appPath, 'utf-8');
        } catch (error) {
          // 如果当前路径不存在，尝试从其他可能的路径读取
          const possiblePaths = [
            path.resolve(process.cwd(), 'src/App.tsx'),
            path.resolve(process.cwd(), 'aigcode-demo/src/App.tsx'),
            path.resolve(process.cwd(), '../src/App.tsx'),
            path.resolve(process.cwd(), '../../src/App.tsx')
          ];
          
          for (const possiblePath of possiblePaths) {
            try {
              appCode = await fs.promises.readFile(possiblePath, 'utf-8');
              appPath = possiblePath;
              break;
            } catch (e) {
              // 继续尝试下一个路径
            }
          }
        }
        
        if (!appCode) {
          return;
        }
        
        // 直接使用传入的 basePath，不再从 App.tsx 提取
        // 提取所有使用 BackendBasicLayout 的组件名
        const backendItemRegex = /const\s+(\w+)\s*=\s*\(\)\s*=>\s*<BackendBasicLayout[^>]*>[\s\S]*?<\/BackendBasicLayout>/g;
        const backendItems: string[] = [];
        let match: RegExpExecArray | null;
        
        while ((match = backendItemRegex.exec(appCode)) !== null) {
          backendItems.push(match[1]);
        }

        // 提取所有使用 FrontendBasicLayout 的组件名
        const frontendItemRegex = /const\s+(\w+)\s*=\s*\(\)\s*=>\s*<FrontendBasicLayout[^>]*>[\s\S]*?<\/FrontendBasicLayout>/g;
        const frontendItems: string[] = [];
        
        while ((match = frontendItemRegex.exec(appCode)) !== null) {
          frontendItems.push(match[1]);
        }

        // 找所有 <Route path="..." element={<Xxx />} />
        const routeRegex = /<Route\s+path\s*=\s*["`']([^"`']+)["`']\s+element\s*=\s*{<(\w+)\s*\/?>}\s*\/?>/gs;
        let backendPathsTemp: string[] = [];
        let frontendPathsTemp: string[] = [];
        
        while ((match = routeRegex.exec(appCode)) !== null) {
          const path = match[1];
          const componentName = match[2];
          
          // 根据组件使用的布局来判断路由类型
          if (backendItems.includes(componentName)) {
            backendPathsTemp.push(path);
          } else if (frontendItems.includes(componentName)) {
            frontendPathsTemp.push(path);
          }
          // 对于没有使用布局包装的组件，不归类为任何类型
        }
        
        // 直接使用提取的路径，不去重
        backendPaths = backendPathsTemp;
        frontendPaths = frontendPathsTemp;
        
       
      } catch {
      }
    },

    async transform(code: string, id: string) {
      try {
    
        if (id === mainId) {
          try {
            const ROUTE_MONITOR_START = '// 自动生成的路由监听代码 START';
            const ROUTE_MONITOR_END = '// 自动生成的路由监听代码 END';

            // 兜底：确保 backendPaths 是数组且不为空
            const safeBackendPaths = Array.isArray(backendPaths) ? backendPaths : [];
            if (safeBackendPaths.length === 0) {
              return code;
            }

            let routeMonitorCode = `${ROUTE_MONITOR_START}\n`;
            routeMonitorCode += `
const isBackendRoute = function(path) {
  // 移除 base 路径前缀进行匹配
  var normalizedPath = path;
  var basePath = window.__dynamic_base__ || '${basePath}';
  
  // 特殊处理：当路径恰好等于 basePath 时，应该被当作根路径处理
  if (basePath !== '/' && path === basePath) {
    normalizedPath = '/';
  } else if (basePath !== '/' && path.startsWith(basePath)) {
    // 更精确的路径前缀移除
    normalizedPath = path.substring(basePath.length);
    // 确保以 / 开头，如果移除后为空字符串，则设为根路径
    if (normalizedPath === '') {
      normalizedPath = '/';
    } else if (!normalizedPath.startsWith('/')) {
      normalizedPath = '/' + normalizedPath;
    }
  }
  
  // 处理末尾斜杠：移除末尾斜杠进行匹配
  var cleanPath = normalizedPath;
  if (cleanPath.endsWith('/') && cleanPath !== '/') {
    cleanPath = cleanPath.slice(0, -1);
  }
  
  // 先尝试精确匹配（大小写不敏感）
  var exactMatch = ${safeBackendPaths.length > 0 ? safeBackendPaths.map(path => {
    return `cleanPath.toLowerCase() === '${path}'.toLowerCase()`;
  }).join(' || ') : 'false'};
  
  if (exactMatch) {
    return true;
  }
  
  // 精确匹配失败，使用正则匹配（大小写不敏感）
  var regexMatch = ${safeBackendPaths.length > 0 ? safeBackendPaths.map(path => {
    // 将路由路径转换为正则表达式进行更精确的匹配，支持大小写不敏感
    const routePattern = path.replace(/:[^/]+/g, '[^/]+').replace(/\//g, '\\/');
    return `new RegExp(${JSON.stringify('^' + routePattern + '(?:\\/.*)?$')}, 'i').test(cleanPath)`;
  }).join(' || ') : 'false'};
  
  return regexMatch;
};

const isFrontendRoute = function(path) {
  // 移除 base 路径前缀进行匹配
  var normalizedPath = path;
  var basePath = window.__dynamic_base__ || '${basePath}';
  
  // 特殊处理：当路径恰好等于 basePath 时，应该被当作根路径处理
  if (basePath !== '/' && path === basePath) {
    normalizedPath = '/';
  } else if (basePath !== '/' && path.startsWith(basePath)) {
    // 更精确的路径前缀移除
    normalizedPath = path.substring(basePath.length);
    // 确保以 / 开头，如果移除后为空字符串，则设为根路径
    if (normalizedPath === '') {
      normalizedPath = '/';
    } else if (!normalizedPath.startsWith('/')) {
      normalizedPath = '/' + normalizedPath;
    }
  }
  
  // 处理末尾斜杠：移除末尾斜杠进行匹配
  var cleanPath = normalizedPath;
  if (cleanPath.endsWith('/') && cleanPath !== '/') {
    cleanPath = cleanPath.slice(0, -1);
  }
  
  // 先尝试精确匹配（大小写不敏感）
  var exactMatch = ${frontendPaths.length > 0 ? frontendPaths.map(path => {
    return `cleanPath.toLowerCase() === '${path}'.toLowerCase()`;
  }).join(' || ') : 'false'};
  
  if (exactMatch) {
    return true;
  }
  
  // 精确匹配失败，使用正则匹配（大小写不敏感）
  var regexMatch = ${frontendPaths.length > 0 ? frontendPaths.map(path => {
    // 将路由路径转换为正则表达式进行更精确的匹配，支持大小写不敏感
    const routePattern = path.replace(/:[^/]+/g, '[^/]+').replace(/\//g, '\\/');
    return `new RegExp(${JSON.stringify('^' + routePattern + '(?:\\/.*)?$')}, 'i').test(cleanPath)`;
  }).join(' || ') : 'false'};
  
  return regexMatch;
};

var lastPath = window.location.pathname;
var getRouteType = function(path) { 
  var basePath = window.__dynamic_base__ || '${basePath}';
  
  // 特殊处理：当路径恰好等于 basePath 时，直接检查根路径配置
  if (basePath !== '/' && path === basePath) {
    // 检查根路径是否在前台或后台路由中
    if (${backendPaths.includes('/') ? 'true' : 'false'}) {
      return 'backend';
    }
    if (${frontendPaths.includes('/') ? 'true' : 'false'}) {
      return 'frontend';
    }
  }
  
  
  // 其他路径使用原有的检查逻辑
  if (isBackendRoute(path)) return 'backend';
  if (isFrontendRoute(path)) return 'frontend';
  
  return 'unrestricted'; // 不限制的路由
};

window.addEventListener('popstate', function() {
  var currentPath = window.location.pathname;
  lastPath = currentPath;
});

var originalPushState = history.pushState;
var originalReplaceState = history.replaceState;

history.pushState = function() {
  var currentPath = window.location.pathname;
  var newPath = arguments[2] || currentPath;
  
  // 检查路由类型
  var currentType = getRouteType(currentPath);
  var newType = getRouteType(newPath);
  
  // 只禁止前台和后台之间的直接跳转
  if ((currentType === 'frontend' && newType === 'backend') || 
      (currentType === 'backend' && newType === 'frontend')) {
    var reason = currentType === 'frontend' && newType === 'backend' ? 'frontend_to_backend_blocked' : 'backend_to_frontend_blocked';
    var message = currentType === 'frontend' && newType === 'backend' ? '前台页面禁止跳转到后台路由' : '后台页面禁止跳转到前台路由';
    
    // 禁止跨域跳转
    window.parent.postMessage({
      type: 'RouteBlocked',
      reason: reason,
      from: {
        url: currentPath,
        type: currentType
      },
      to: {
        url: newPath,
        type: newType
      },
      message: message
    }, '*');
    return; // 阻止跳转
  }
  
  originalPushState.apply(this, arguments);
  lastPath = newPath;
};

history.replaceState = function() {
  var currentPath = window.location.pathname;
  var newPath = arguments[2] || currentPath;
  
  // 检查路由类型
  var currentType = getRouteType(currentPath);
  var newType = getRouteType(newPath);
  
  // 只禁止前台和后台之间的直接跳转
  if ((currentType === 'frontend' && newType === 'backend') || 
      (currentType === 'backend' && newType === 'frontend')) {
    var reason = currentType === 'frontend' && newType === 'backend' ? 'frontend_to_backend_blocked' : 'backend_to_frontend_blocked';
    var message = currentType === 'frontend' && newType === 'backend' ? '前台页面禁止跳转到后台路由' : '后台页面禁止跳转到前台路由';
    
    // 禁止跨域跳转
    window.parent.postMessage({
      type: 'RouteBlocked',
      reason: reason,
      from: {
        url: currentPath,
        type: currentType
      },
      to: {
        url: newPath,
        type: newType
      },
      message: message
    }, '*');
    return; // 阻止跳转
  }
  
  originalReplaceState.apply(this, arguments);
  lastPath = newPath;
};\n`;
            routeMonitorCode += `${ROUTE_MONITOR_END}\n`;

            return code + '\n\n' + routeMonitorCode;
          } catch{
            return code; // 回退到原始代码
          }
        }
     
        // 处理 NotFound.js，修改路由跳转逻辑
        if (id === notFoundId) {
          try {
            const GENERATED_START = '// 自动生成的路由判断 START';
            const GENERATED_END = '// 自动生成的路由判断 END';
            
            // 兜底：确保 backendPaths 和 frontendPaths 是数组
            const safeBackendPaths = Array.isArray(backendPaths) ? backendPaths : [];
            const safeFrontendPaths = Array.isArray(frontendPaths) ? frontendPaths : [];
            
            let ifElseCode = `${GENERATED_START}\n`;
            ifElseCode += '        // 移除 base 路径前缀进行匹配\n';
            ifElseCode += '        var normalizedPath = location.pathname;\n';
            ifElseCode += `        var basePath = window.__dynamic_base__ || '${basePath}';\n`;
            ifElseCode += '        // 特殊处理：当路径恰好等于 basePath 时，应该被当作根路径处理\n';
            ifElseCode += '        if (basePath !== "/" && location.pathname === basePath) {\n';
            ifElseCode += '            normalizedPath = "/";\n';
            ifElseCode += '        } else if (basePath !== "/" && location.pathname.startsWith(basePath)) {\n';
            ifElseCode += '            // 更精确的路径前缀移除\n';
            ifElseCode += '            normalizedPath = location.pathname.substring(basePath.length);\n';
            ifElseCode += '            // 确保以 / 开头，如果移除后为空字符串，则设为根路径\n';
            ifElseCode += '            if (normalizedPath === "") {\n';
            ifElseCode += '                normalizedPath = "/";\n';
            ifElseCode += '            } else if (!normalizedPath.startsWith("/")) {\n';
            ifElseCode += '                normalizedPath = "/" + normalizedPath;\n';
            ifElseCode += '            }\n';
            ifElseCode += '        }\n';
            ifElseCode += '        // 处理末尾斜杠：移除末尾斜杠进行匹配\n';
            ifElseCode += '        var cleanPath = normalizedPath;\n';
            ifElseCode += '        if (cleanPath.endsWith("/") && cleanPath !== "/") {\n';
            ifElseCode += '            cleanPath = cleanPath.slice(0, -1);\n';
            ifElseCode += '        }\n';
            ifElseCode += '        // 判断路由类型\n';
            ifElseCode += '        var isBackend = false;\n';
            ifElseCode += '        var isFrontend = false;\n';
            
            // 后台路由判断
            if (safeBackendPaths.length > 0) {
              ifElseCode += '        // 后台路由判断\n';
              ifElseCode += '        var backendExactMatch = ';
              ifElseCode += safeBackendPaths
                .map(path => {
                  return `cleanPath.toLowerCase() === '${path}'.toLowerCase()`;
                }).join(' ||\n                          ');
              ifElseCode += ';\n';
              ifElseCode += '        if (backendExactMatch) {\n';
              ifElseCode += '            isBackend = true;\n';
              ifElseCode += '        } else {\n';
              ifElseCode += '            // 后台路由正则匹配\n';
              ifElseCode += '            isBackend = ';
              ifElseCode += safeBackendPaths.length > 0 ? safeBackendPaths
                .map(path => {
                  // 将路由路径转换为正则表达式进行更精确的匹配，支持大小写不敏感
                  const routePattern = path.replace(/:[^/]+/g, '[^/]+').replace(/\//g, '\\/');
                  return `new RegExp(${JSON.stringify('^' + routePattern + '(?:\\/.*)?$')}, 'i').test(cleanPath)`;
                }).join(' ||\n                          ') : 'false';
              ifElseCode += ';\n';
              ifElseCode += '        }\n';
            }
            
            // 前台路由判断
            if (safeFrontendPaths.length > 0) {
              ifElseCode += '        // 前台路由判断\n';
              ifElseCode += '        var frontendExactMatch = ';
              ifElseCode += safeFrontendPaths
                .map(path => {
                  return `cleanPath.toLowerCase() === '${path}'.toLowerCase()`;
                }).join(' ||\n                          ');
              ifElseCode += ';\n';
              ifElseCode += '        if (frontendExactMatch) {\n';
              ifElseCode += '            isFrontend = true;\n';
              ifElseCode += '        } else {\n';
              ifElseCode += '            // 前台路由正则匹配\n';
              ifElseCode += '            isFrontend = ';
              ifElseCode += safeFrontendPaths.length > 0 ? safeFrontendPaths
                .map(path => {
                  // 将路由路径转换为正则表达式进行更精确的匹配，支持大小写不敏感
                  const routePattern = path.replace(/:[^/]+/g, '[^/]+').replace(/\//g, '\\/');
                  return `new RegExp(${JSON.stringify('^' + routePattern + '(?:\\/.*)?$')}, 'i').test(cleanPath)`;
                }).join(' ||\n                          ') : 'false';
              ifElseCode += ';\n';
              ifElseCode += '        }\n';
            }
            
            // 路由跳转逻辑
            ifElseCode += '        // 路由跳转逻辑\n';
            ifElseCode += '        if (isBackend) {\n';
            ifElseCode += '            navigator("/dashboardpage");\n';
            ifElseCode += '        } else if (isFrontend) {\n';
            ifElseCode += '            navigator("/");\n';
            ifElseCode += '        } else {\n';
            ifElseCode += '            // 不限制的路由，默认跳转到前台首页\n';
            ifElseCode += '            navigator("/");\n';
            ifElseCode += '        }\n';
            ifElseCode += `    ${GENERATED_END}\n`;

            // 直接替换 handleTargetHome
            const handleTargetHomeRegex = /(?:var|let|const)\s+handleTargetHome\s*=\s*\(\)\s*=>\s*\{[^}]*\}/;
            return code.replace(
              handleTargetHomeRegex,
              `const handleTargetHome = () => {\n${ifElseCode}    }`
            );
          } catch{
            return code; // 回退到原始代码
          }
        }

        return null;
      } catch {
        return code; // 最外层兜底，回退到原始代码
      }
    }
  };
}