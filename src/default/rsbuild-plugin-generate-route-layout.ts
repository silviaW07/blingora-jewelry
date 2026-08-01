import fs from 'fs';
import path from 'path';


interface RouteMap {
  [path: string]: string;
}

interface RouterComponentMap {
  [path: string]: string;
}

interface ExtractedRoutes {
  backendPaths: string[];
  frontendPaths: string[];
  routeMap: RouteMap;
  routerComponentMap: RouterComponentMap;
  backendHomePath: string;
  frontendHomePath: string;
}

interface TransformContext {
  code: string;
}

interface AssetProcessingContext {
  assets: Record<string, any>;
  sources: {
    RawSource: new (content: string) => any;
  };
}

interface RsbuildApi {
  onBeforeBuild: (callback: () => Promise<void>) => void;
  transform: (
    options: {
      test: (filePath: string) => boolean;
      order?: 'pre' | 'post';
    },
    handler: (context: TransformContext) => TransformContext | Promise<TransformContext>
  ) => void;
  processAssets: (
    options: { stage: string },
    handler: (context: AssetProcessingContext) => void
  ) => void;
}


/**
 * 去除路径中的查询参数与哈希部分
 */
function stripQueryAndHash(path: string): string {
  return path.split('#')[0]?.split('?')[0] ?? '';
}

/**
 * 确保路径以 / 开头
 */
function ensureLeadingSlash(path: string): string {
  if (!path.startsWith('/')) {
    return `/${path}`;
  }
  return path;
}

/**
 * 标准化路径：去掉多余空白、大小写、重复斜杠以及末尾斜杠
 * 参考 pathMatcher.ts 的 normalizePath 函数
 */
function normalizePath(path: string): string {
  if (!path || path.length === 0) {
    return '/';
  }

  let normalized = stripQueryAndHash(path.toLowerCase().trim());

  if (!normalized) {
    return '/';
  }

  normalized = ensureLeadingSlash(normalized);
  normalized = normalized.replace(/\/+/g, '/');

  if (normalized.length > 1 && normalized.endsWith('/')) {
    normalized = normalized.slice(0, -1);
  }

  return normalized;
}

/**
 * 标准化路由模式
 */
function normalizePattern(rawPattern: string): string {
  if (!rawPattern) {
    return '';
  }
  const cleaned = stripQueryAndHash(rawPattern.toLowerCase().trim());
  if (!cleaned) {
    return '';
  }
  const collapsed = cleaned.replace(/\/+/g, '/');
  return ensureLeadingSlash(collapsed);
}

/**
 * 标准化路由路径键（用于映射表）
 * 移除通配符和参数，但保持大小写
 */
function normalizeRouteKey(routePath: string): string {
  if (!routePath || routePath.length === 0) {
    return '/';
  }
  
  // 移除通配符后缀
  let normalized = routePath.replace(/\/\*$/, '');
  
  // 移除参数部分（如 :room_id）
  normalized = normalized.replace(/\/:[^/]+/g, '');
  
  // 确保以 / 开头
  normalized = ensureLeadingSlash(normalized);
  
  // 移除重复斜杠
  normalized = normalized.replace(/\/+/g, '/');
  
  // 移除末尾斜杠（除非是根路径）
  if (normalized.length > 1 && normalized.endsWith('/')) {
    normalized = normalized.slice(0, -1);
  }
  
  return normalized;
}

// URLPattern 类型声明（如果浏览器支持）
declare global {
  // eslint-disable-next-line no-var
  var URLPattern: {
    new (init: { pathname: string }, baseURL?: string): {
      test(input: { pathname: string }): boolean;
    };
  } | undefined;
}

/**
 * 生成路由匹配工具函数初始化代码（注册到 window.__routeMatcher__）
 */
function generateRouteMatcherInitCode(): string {
  return `// 路由匹配工具函数初始化（参考 pathMatcher.ts）
(function() {
  if (window.__routeMatcher__) {
    return; // 已经初始化过
  }
  
  var stripQueryAndHash = function(path) {
    return path.split('#')[0]?.split('?')[0] ?? '';
  };
  
  var ensureLeadingSlash = function(path) {
    if (!path.startsWith('/')) {
      return '/' + path;
    }
    return path;
  };
  
  var normalizePath = function(path) {
    if (!path || path.length === 0) {
      return '/';
    }
    var normalized = stripQueryAndHash(path.toLowerCase().trim());
    if (!normalized) {
      return '/';
    }
    normalized = ensureLeadingSlash(normalized);
    normalized = normalized.replace(/\\/+/g, '/');
    if (normalized.length > 1 && normalized.endsWith('/')) {
      normalized = normalized.slice(0, -1);
    }
    return normalized;
  };
  
  var normalizePattern = function(rawPattern) {
    if (!rawPattern) {
      return '';
    }
    var cleaned = stripQueryAndHash(rawPattern.toLowerCase().trim());
    if (!cleaned) {
      return '';
    }
    var collapsed = cleaned.replace(/\\/+/g, '/');
    return ensureLeadingSlash(collapsed);
  };
  
  var matchPathWithWildcard = function(pattern, targetPath) {
    if (!pattern || !targetPath) {
      return false;
    }
    
    // 优先尝试使用 URLPattern API（如果浏览器支持）
    if (typeof URLPattern !== 'undefined') {
      try {
        var normalizedPattern = normalizePattern(pattern);
        if (!normalizedPattern) {
          return false;
        }
        var normalizedTarget = normalizePath(targetPath);
        var urlPattern = new URLPattern({ pathname: normalizedPattern }, 'http://localhost');
        return urlPattern.test({ pathname: normalizedTarget });
      } catch (e) {
        // URLPattern 失败，回退到手动匹配
      }
    }
    
    var rawPattern = normalizePattern(pattern);
    var normalizedTarget = normalizePath(targetPath);
    
    // 如果没有通配符，直接比较
    if (!rawPattern.includes('*')) {
      return rawPattern === normalizedTarget;
    }
    
    // 如果模式是 *，匹配所有路径
    if (rawPattern === '*') {
      return true;
    }
    
    var wildcardIndex = rawPattern.indexOf('*');
    
    // 如果通配符不在末尾，需要特殊处理
    if (wildcardIndex !== rawPattern.length - 1) {
      var prefixPart = rawPattern.slice(0, wildcardIndex);
      var suffixPart = rawPattern.slice(wildcardIndex + 1);
      var normalizedSuffix = normalizePath(suffixPart);
      var normalizedPrefix = normalizePath(prefixPart);
      
      if (normalizedSuffix === '/') {
        return normalizedTarget.startsWith(normalizedPrefix);
      }
      
      return normalizedTarget.startsWith(normalizedPrefix + '/') && normalizedTarget.endsWith(normalizedSuffix);
    }
    
    // 通配符在末尾（如 /path/*）
    var prefixPart = rawPattern.slice(0, wildcardIndex);
    var normalizedPrefix = normalizePath(prefixPart);
    
    if (normalizedPrefix === '/') {
      return true;
    }
    
    // 匹配基础路径本身或所有子路径
    if (normalizedTarget === normalizedPrefix) {
      return true;
    }
    
    return normalizedTarget.startsWith(normalizedPrefix + '/');
  };
  
  // 注册到 window 的私有属性
  window.__routeMatcher__ = {
    stripQueryAndHash: stripQueryAndHash,
    ensureLeadingSlash: ensureLeadingSlash,
    normalizePath: normalizePath,
    normalizePattern: normalizePattern,
    matchPathWithWildcard: matchPathWithWildcard
  };
})();
`;
}

/**
 * 生成路径规范化代码片段（使用 window.__routeMatcher__）
 */
function generatePathNormalizationCode(
  pathVar: string,
  basePath: string,
  indent: string = '  '
): string {
  return `${indent}// 移除 base 路径前缀进行匹配
${indent}var basePath = window.__dynamic_base__ || '${basePath}';
${indent}var pathToNormalize = ${pathVar};

${indent}// 特殊处理：当路径恰好等于 basePath 时，应该被当作根路径处理
${indent}if (basePath !== '/' && pathToNormalize === basePath) {
${indent}  pathToNormalize = '/';
${indent}} else if (basePath !== '/' && pathToNormalize.startsWith(basePath)) {
${indent}  pathToNormalize = pathToNormalize.substring(basePath.length);
${indent}  if (pathToNormalize === '') {
${indent}    pathToNormalize = '/';
${indent}  } else if (!pathToNormalize.startsWith('/')) {
${indent}    pathToNormalize = '/' + pathToNormalize;
${indent}  }
${indent}}

${indent}// 使用 window.__routeMatcher__ 规范化路径，如果未初始化则使用内联实现
${indent}var cleanPath;
${indent}if (window.__routeMatcher__ && typeof window.__routeMatcher__.normalizePath === 'function') {
${indent}  cleanPath = window.__routeMatcher__.normalizePath(pathToNormalize);
${indent}} else {
${indent}  // 内联 fallback 实现（与 generateRouteMatcherInitCode 中的 normalizePath 逻辑一致）
${indent}  if (!pathToNormalize || pathToNormalize.length === 0) {
${indent}    cleanPath = '/';
${indent}  } else {
${indent}    var normalized = pathToNormalize.split('#')[0]?.split('?')[0] ?? '';
${indent}    if (!normalized) {
${indent}      cleanPath = '/';
${indent}    } else {
${indent}      normalized = normalized.toLowerCase().trim();
${indent}      if (!normalized) {
${indent}        cleanPath = '/';
${indent}      } else {
${indent}        if (!normalized.startsWith('/')) {
${indent}          normalized = '/' + normalized;
${indent}        }
${indent}        normalized = normalized.replace(/\\/+/g, '/');
${indent}        if (normalized.length > 1 && normalized.endsWith('/')) {
${indent}          normalized = normalized.slice(0, -1);
${indent}        }
${indent}        cleanPath = normalized;
${indent}      }
${indent}    }
${indent}  }
${indent}}`;
}

/**
 * 生成路由匹配函数代码（使用 React Router 规则，调用 window.__routeMatcher__.matchPathWithWildcard）
 */
function generateRouteMatchFunction(
  routePaths: string[],
  type: 'backend' | 'frontend',
  basePath: string
): string {
  if (routePaths.length === 0) {
    return `function is${type === 'backend' ? 'Backend' : 'Frontend'}Route(path) { return false; }`;
  }

  // 生成所有路由模式的匹配代码，使用统一的 matchPathWithWildcard 函数
  const matchCodes = routePaths.map((routePath) => {
    const normalizedPattern = normalizePattern(routePath);
    return `window.__routeMatcher__.matchPathWithWildcard(${JSON.stringify(normalizedPattern)}, cleanPath)`;
  });

  const allMatches = matchCodes.length > 0
    ? matchCodes.join(' || ')
    : 'false';

  return `const is${type === 'backend' ? 'Backend' : 'Frontend'}Route = function(path) {
  ${generatePathNormalizationCode('path', basePath, '  ')}
  
  // 使用统一的 matchPathWithWildcard 函数进行匹配
  return ${allMatches};
};`;
}


/**
 * 生成路由拦截代码
 */
function generateRouteInterceptionCode(
  backendPaths: string[],
  frontendPaths: string[],
  _backendHomePath: string,
  _frontendHomePath: string,
  basePath: string
): string {
  const backendRouteMatchFn = generateRouteMatchFunction(backendPaths, 'backend', basePath);
  const frontendRouteMatchFn = generateRouteMatchFunction(frontendPaths, 'frontend', basePath);

  const hasBackendRoot = backendPaths.includes('/') ? 'true' : 'false';
  const hasFrontendRoot = frontendPaths.includes('/') ? 'true' : 'false';

  return `
${backendRouteMatchFn}

${frontendRouteMatchFn}

var lastPath = window.location.pathname;
var getRouteType = function(path) { 
  var basePath = window.__dynamic_base__ || '${basePath}';
  
  // 特殊处理：当路径恰好等于 basePath 时，直接检查根路径配置
  if (basePath !== '/' && path === basePath) {
    // 检查根路径是否在前台或后台路由中
    if (${hasBackendRoot}) {
      return 'backend';
    }
    if (${hasFrontendRoot}) {
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
};
`;
}

/**
 * 生成动态路径替换脚本
 */
function generateDynamicBasePathScript(): string {
  return `// 动态路径替换脚本 - 立即拦截版本
(function() {
  // 立即拦截请求，不等待任何初始化
  (function() {
    
    // 拦截图片加载
    var originalImageSrc = Object.getOwnPropertyDescriptor(HTMLImageElement.prototype, 'src');
    Object.defineProperty(HTMLImageElement.prototype, 'src', {
      set: function(value) {
        if (typeof value === 'string' && value.includes('/__dynamic_base__/')) {
          return;
        }
        return originalImageSrc.set.call(this, value);
      },
      get: function() {
        return originalImageSrc.get.call(this);
      }
    });
    
    // 拦截 link 标签
    var originalLinkHref = Object.getOwnPropertyDescriptor(HTMLLinkElement.prototype, 'href');
    Object.defineProperty(HTMLLinkElement.prototype, 'href', {
      set: function(value) {
        if (typeof value === 'string' && value.includes('/__dynamic_base__/')) {
          return;
        }
        return originalLinkHref.set.call(this, value);
      },
      get: function() {
        return originalLinkHref.get.call(this);
      }
    });
    
    // 拦截 script 标签
    var originalScriptSrc = Object.getOwnPropertyDescriptor(HTMLScriptElement.prototype, 'src');
    Object.defineProperty(HTMLScriptElement.prototype, 'src', {
      set: function(value) {
        if (typeof value === 'string' && value.includes('/__dynamic_base__/')) {
          return;
        }
        return originalScriptSrc.set.call(this, value);
      },
      get: function() {
        return originalScriptSrc.get.call(this);
      }
    });
  })();
  
  // 获取动态基础路径
  var getDynamicBase = function() {
    // 可以从环境变量、URL参数、localStorage等获取
    var base = '/';
    
    // 从URL参数获取
    var urlParams = new URLSearchParams(window.location.search);
    var baseParam = urlParams.get('base');
    if (baseParam) {
      base = baseParam;
    }
    
    // 从localStorage获取
    var storedBase = localStorage.getItem('dynamic_base');
    if (storedBase) {
      base = storedBase;
    }
    
    // 从window对象获取
    if (typeof window.__dynamic_base__ !== 'undefined') {
      base = window.__dynamic_base__;
    }
    
    // 确保末尾有 /
    if (!base.endsWith('/')) {
      base = base + '/';
    }
    
    return base;
  };
  
  // 快速路径替换函数
  var replacePaths = function() {
    var base = getDynamicBase();
    
    // 替换所有 img 标签的 src
    var images = document.querySelectorAll('img');
    images.forEach(function(img) {
      var src = img.src;
      if (src && src.includes('/__dynamic_base__/')) {
        img.src = src.replace('/__dynamic_base__/', base);
      }
    });
    
    // 替换所有 link 标签的 href
    var links = document.querySelectorAll('link');
    links.forEach(function(link) {
      var href = link.href;
      if (href && href.includes('/__dynamic_base__/')) {
        link.href = href.replace('/__dynamic_base__/', base);
      }
    });
    
    // 替换所有 script 标签的 src
    var scripts = document.querySelectorAll('script');
    scripts.forEach(function(script) {
      var src = script.src;
      if (src && src.includes('/__dynamic_base__/')) {
        script.src = src.replace('/__dynamic_base__/', base);
      }
    });
  };
  
  // 重写 webpack 的 publicPath 获取函数
  if (typeof window !== 'undefined') {
    // 重写 webpack 的 __webpack_require__.p
    if (typeof __webpack_require__ !== 'undefined' && __webpack_require__.p) {
      var originalP = __webpack_require__.p;
      __webpack_require__.p = function() {
        var base = getDynamicBase();
        return base;
      };
    }
    
    // 重写其他可能的 publicPath 获取方式
    window.getPublicPath = function() {
      return getDynamicBase();
    };
  }
  
  // 移除拦截代码，只保留路径替换功能
  
  // 初始化时设置动态基础路径
  var initDynamicBase = function() {
    var base = getDynamicBase();
    
    // 设置全局变量供其他模块使用
    window.__dynamic_base__ = base;
    
    // 重写 webpack 的 publicPath
    if (typeof __webpack_require__ !== 'undefined') {
      __webpack_require__.p = base;
    }
    
    // 执行路径替换
    replacePaths();
  };
  
  // 页面加载完成后初始化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initDynamicBase);
  } else {
    initDynamicBase();
  }
  
  // 监听动态添加的元素
  if (window.MutationObserver) {
    var observer = new MutationObserver(function(mutations) {
      var shouldReplace = false;
      mutations.forEach(function(mutation) {
        if (mutation.type === 'childList') {
          shouldReplace = true;
        }
      });
      if (shouldReplace) {
        setTimeout(replacePaths, 50);
      }
    });
    
    observer.observe(document, { childList: true, subtree: true });
  }
})();

`;
}


export default function rsbuildAutoNotFoundRoutePlugin(basePath: string): any {
  const projectRoot = process.cwd();
  let backendPaths: string[] = [];
  let frontendPaths: string[] = [];
  let routeMap: RouteMap = {};
  let routerComponentMap: RouterComponentMap = {};

  // 查找 ProLayoutErrorBoundary.tsx 文件的函数（只查找 src 目录下）
  const findErrorBoundaryFile = (dir: string): string | null => {
    try {
      // 确保从 src 目录开始查找
      const srcDir = path.join(dir, 'src');
      if (!fs.existsSync(srcDir) || !fs.statSync(srcDir).isDirectory()) {
        return null;
      }
      
      const files = fs.readdirSync(srcDir);
      for (const file of files) {
        const fullPath = path.join(srcDir, file);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
          if (file === 'node_modules' || file === '.git' || file === 'dist' || file === 'build') {
            continue;
          }
          const result = findErrorBoundaryFileInDir(fullPath);
          if (result) return result;
        } else if (file === 'ProLayoutErrorBoundary.tsx') {
          return fullPath;
        }
      }
    } catch (error) {
      // 忽略错误
    }
    return null;
  };
  
  // 在指定目录下递归查找 ProLayoutErrorBoundary.tsx
  const findErrorBoundaryFileInDir = (dir: string): string | null => {
    try {
      const files = fs.readdirSync(dir);
      for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
          if (file === 'node_modules' || file === '.git' || file === 'dist' || file === 'build') {
            continue;
          }
          const result = findErrorBoundaryFileInDir(fullPath);
          if (result) return result;
        } else if (file === 'ProLayoutErrorBoundary.tsx') {
          return fullPath;
        }
      }
    } catch (error) {
      // 忽略错误
    }
    return null;
  };

  const mainId = path.resolve(projectRoot, 'src/main.tsx');
  const notFoundId = path.resolve(projectRoot, 'src/default/NotFound.tsx');
  let errorBoundaryId: string | null = null;

  return {
    name: 'rsbuild-auto-notfound-route',
    setup(api: RsbuildApi) {
      // 在 setup 开始时查找错误边界文件（只查找一次，避免重复查找）
      errorBoundaryId = findErrorBoundaryFile(projectRoot);
      
      // 默认首页路径，将在 extractRoutes 中被读取和更新
      let frontendHomePath: string = '/'; // 默认前台首页路径
      let backendHomePath: string = '/dashboardpage'; // 默认后台首页路径

      /**
       * 提取路由信息
       */
      const extractRoutes = async (): Promise<ExtractedRoutes> => {
        // eslint-disable-next-line prefer-const
        let currentBackendHomePath = backendHomePath;
        // eslint-disable-next-line prefer-const
        let currentFrontendHomePath = frontendHomePath;
        let appPath = path.resolve(projectRoot, 'src/App.tsx');
        let appCode = '';

        try {
          appCode = await fs.promises.readFile(appPath, 'utf-8');
        } catch (error) {
          const possiblePaths = [
            path.resolve(process.cwd(), 'src/App.tsx'),
            path.resolve(process.cwd(), 'aigcode-demo/src/App.tsx'),
            path.resolve(process.cwd(), '../src/App.tsx'),
            path.resolve(process.cwd(), '../../src/App.tsx'),
          ];

          for (const possiblePath of possiblePaths) {
            try {
              appCode = await fs.promises.readFile(possiblePath, 'utf-8');
              appPath = possiblePath;
              break;
            } catch (e) {
              // 继续尝试
            }
          }
        }

        if (!appCode) {
          return {
            backendPaths: [],
            frontendPaths: [],
            routeMap: {},
            routerComponentMap: {},
            backendHomePath: currentBackendHomePath,
            frontendHomePath: currentFrontendHomePath,
          };
        }

        /**
         * 从组件名中提取实际组件名
         * 如果组件名以 _item 结尾，移除它；否则直接返回
         * 例如: FrontendHomePage_item -> FrontendHomePage
         *      FrontendLoginPage -> FrontendLoginPage
         */
        const extractRouterComponentName = (componentName: string): string => {
          if (componentName.endsWith('_item')) {
            return componentName.slice(0, -5); // 移除 '_item' (5个字符)
          }
          return componentName;
        };

        let match: RegExpExecArray | null;

        // 提取使用 BackendBasicLayout 的组件名
        const backendItemRegex =
          /const\s+(\w+)\s*=\s*\(\)\s*=>\s*<BackendBasicLayout[^>]*>[\s\S]*?<\/BackendBasicLayout>/g;
        const backendItems: string[] = [];

        while ((match = backendItemRegex.exec(appCode)) !== null) {
          backendItems.push(match[1]);
        }

        // 提取使用 FrontendBasicLayout 的组件名
        const frontendItemRegex =
          /const\s+(\w+)\s*=\s*\(\)\s*=>\s*<FrontendBasicLayout[^>]*>[\s\S]*?<\/FrontendBasicLayout>/g;
        const frontendItems: string[] = [];

        while ((match = frontendItemRegex.exec(appCode)) !== null) {
          frontendItems.push(match[1]);
        }

        // 提取所有路由信息，包括注释标识的首页路由
        const routeRegex =
          /<Route\s+path\s*=\s*["`']([^"`']+)["`']\s+element\s*=\s*{<(\w+)\s*\/?>}\s*\/?>\s*\/?\s*\{\s*\/\*\s*(FrontendHome|BackendHome)\s*\*\/\s*\}/g;
        const backendPathsTemp: string[] = [];
        const frontendPathsTemp: string[] = [];
        const routeMapTemp: RouteMap = {};
        const routerComponentMapTemp: RouterComponentMap = {};

        // 先提取带注释标识的首页路由
        while ((match = routeRegex.exec(appCode)) !== null) {
          const routePath = match[1];
          const componentName = match[2]; // wrapper 组件名，例如: FrontendHomePage_item
          const homeType = match[3];
          
          // 从组件名中提取实际组件名（routerComponentName）
          const routerComponentName = extractRouterComponentName(componentName);

          routeMapTemp[routePath] = componentName;
          routerComponentMapTemp[routePath] = routerComponentName;

          if (homeType === 'BackendHome') {
            // 移除通配符后缀，用于跳转
            currentBackendHomePath = routePath.replace(/\/\*$/, '');
            backendPathsTemp.push(routePath);
          } else if (homeType === 'FrontendHome') {
            // 移除通配符后缀，用于跳转
            currentFrontendHomePath = routePath.replace(/\/\*$/, '');
            frontendPathsTemp.push(routePath);
          }
        }

        // 再提取其他路由信息（不带注释标识的）
        const normalRouteRegex =
          /<Route\s+path\s*=\s*["`']([^"`']+)["`']\s+element\s*=\s*{<(\w+)\s*\/?>}\s*\/?>/g;
        while ((match = normalRouteRegex.exec(appCode)) !== null) {
          const routePath = match[1];
          const componentName = match[2]; // wrapper 组件名，例如: FrontendHomePage_item
          
          // 跳过已经处理过的带注释的路由
          if (!routeMapTemp[routePath]) {
            // 从组件名中提取实际组件名（routerComponentName）
            const routerComponentName = extractRouterComponentName(componentName);
            
            routeMapTemp[routePath] = componentName;
            routerComponentMapTemp[routePath] = routerComponentName;

            if (backendItems.includes(componentName)) {
              backendPathsTemp.push(routePath);
            } else if (frontendItems.includes(componentName)) {
              frontendPathsTemp.push(routePath);
            }
          }
        }
        
        return {
          backendPaths: backendPathsTemp,
          frontendPaths: frontendPathsTemp,
          routeMap: routeMapTemp,
          routerComponentMap: routerComponentMapTemp,
          backendHomePath: currentBackendHomePath,
          frontendHomePath: currentFrontendHomePath,
        };
      };

      // 在构建前提取路由信息
      api.onBeforeBuild(async () => {
        try {
          const extracted = await extractRoutes();
          backendPaths = extracted.backendPaths;
          frontendPaths = extracted.frontendPaths;
          routeMap = extracted.routeMap;
          routerComponentMap = extracted.routerComponentMap;
          backendHomePath = extracted.backendHomePath;
          frontendHomePath = extracted.frontendHomePath;
        } catch (error) {
          console.error('❌ [rsbuild-plugin] Error in rsbuild-auto-notfound-route plugin:', error);
          console.error('❌ [rsbuild-plugin] Error stack:', error instanceof Error ? error.stack : String(error));
        }
      });

      // 1. 处理 main.tsx
      api.transform(
        {
          test: (filePath: string) => filePath === mainId,
          order: 'pre',
        },
        ({ code }: TransformContext): TransformContext => {
          try {
            const ROUTE_MONITOR_START = '// 自动生成的路由监听代码 START';
            const ROUTE_MONITOR_END = '// 自动生成的路由监听代码 END';

            const safeBackendPaths = Array.isArray(backendPaths) ? backendPaths : [];
            const safeFrontendPaths = Array.isArray(frontendPaths) ? frontendPaths : [];

            const routeInterceptionCode = generateRouteInterceptionCode(
              safeBackendPaths,
              safeFrontendPaths,
              backendHomePath,
              frontendHomePath,
              basePath
            );

            const dynamicBasePathCode = generateDynamicBasePathScript();
            const routeMatcherInitCode = generateRouteMatcherInitCode();

            const routeMonitorCode = `${ROUTE_MONITOR_START}\n${routeMatcherInitCode}\n${routeInterceptionCode}\n${ROUTE_MONITOR_END}\n${dynamicBasePathCode}`;

            return {
              code: code + '\n\n' + routeMonitorCode,
            };
          } catch (error) {
            console.error('Error processing main.tsx:', error);
            return { code };
          }
        }
      );

      // 2. 处理 NotFound.tsx
      api.transform(
        {
          test: (filePath: string) => filePath === notFoundId,
          order: 'pre',
        },
        async ({ code }: TransformContext): Promise<TransformContext> => {
          try {
            const GENERATED_START = '// 自动生成的路由判断 START';
            const GENERATED_END = '// 自动生成的路由判断 END';

            const safeBackendPaths = Array.isArray(backendPaths) ? backendPaths : [];
            const safeFrontendPaths = Array.isArray(frontendPaths) ? frontendPaths : [];

            const routeMatcherInitCode = generateRouteMatcherInitCode();

            let ifElseCode = `${GENERATED_START}\n`;
            ifElseCode += routeMatcherInitCode.replace(/^/gm, '        '); // 添加缩进
            ifElseCode += '\n';
            ifElseCode += generatePathNormalizationCode('location.pathname', basePath, '        ');
            ifElseCode += '\n        // 判断路由类型\n';
            ifElseCode += '        var isBackend = false;\n';
            ifElseCode += '        var isFrontend = false;\n';

            // 后台路由判断（使用 React Router 规则）
            if (safeBackendPaths.length > 0) {
              ifElseCode += '        // 后台路由判断（使用统一的 matchPathWithWildcard 函数）\n';
              ifElseCode += '        isBackend = ';
              ifElseCode += safeBackendPaths
                .map((routePath) => {
                  const normalizedPattern = normalizePattern(routePath);
                  return `window.__routeMatcher__.matchPathWithWildcard(${JSON.stringify(normalizedPattern)}, cleanPath)`;
                })
                .join(' ||\n                          ');
              ifElseCode += ';\n';
            }

            // 前台路由判断（使用 React Router 规则）
            if (safeFrontendPaths.length > 0) {
              ifElseCode += '        // 前台路由判断（使用统一的 matchPathWithWildcard 函数）\n';
              ifElseCode += '        isFrontend = ';
              ifElseCode += safeFrontendPaths
                .map((routePath) => {
                  const normalizedPattern = normalizePattern(routePath);
                  return `window.__routeMatcher__.matchPathWithWildcard(${JSON.stringify(normalizedPattern)}, cleanPath)`;
                })
                .join(' ||\n                          ');
              ifElseCode += ';\n';
            }

            // 路由跳转逻辑
            ifElseCode += '        // 路由跳转逻辑\n';
            ifElseCode += '        if (isBackend) {\n';
            ifElseCode += `            navigator("${backendHomePath}");\n`;
            ifElseCode += '        } else if (isFrontend) {\n';
            ifElseCode += `            navigator("${frontendHomePath}");\n`;
            ifElseCode += '        } else {\n';
            ifElseCode += '            // 不限制的路由，默认跳转到前台首页\n';
            ifElseCode += `            navigator("${frontendHomePath}");\n`;
            ifElseCode += '        }\n';
            ifElseCode += `    ${GENERATED_END}\n`;

            const handleTargetHomeRegex =
              /(?:var|let|const)\s+handleTargetHome\s*=\s*\(\)\s*=>\s*\{[^}]*\}/;
            const newCode = code.replace(
              handleTargetHomeRegex,
              `const handleTargetHome = () => {\n${ifElseCode}    }`
            );

            return {
              code: newCode,
            };
          } catch (error) {
            console.error('Error processing NotFound.tsx:', error);
            return { code };
          }
        }
      );

      // 3. 处理错误边界文件（使用缓存的 errorBoundaryId）
      if (errorBoundaryId) {
        api.transform(
          {
            test: (filePath: string) => filePath === errorBoundaryId,
            order: 'pre',
          },
        async ({ code }: TransformContext): Promise<TransformContext> => {
          try {
            // 确保路由信息已提取
            if (backendPaths.length === 0 && frontendPaths.length === 0 || Object.keys(routerComponentMap).length === 0) {
              const extracted = await extractRoutes();
              backendPaths = extracted.backendPaths;
              frontendPaths = extracted.frontendPaths;
              routeMap = extracted.routeMap;
              routerComponentMap = extracted.routerComponentMap;
            }

            const errorBoundaryRouteMap: RouteMap = {};

              frontendPaths.forEach((routePath) => {
                const cleanPath =
                  routePath === '/' ? routePath : routePath.startsWith('/') ? routePath.substring(1) : routePath;
                errorBoundaryRouteMap[routePath] = `frontend:${cleanPath}`;
              });

              backendPaths.forEach((routePath) => {
                const cleanPath =
                  routePath === '/' ? routePath : routePath.startsWith('/') ? routePath.substring(1) : routePath;
                errorBoundaryRouteMap[routePath] = `backend:${cleanPath}`;
              });

              // 生成路由匹配函数
              const routeMatchFunction = `
// 自动生成的路由匹配函数 START
const getCurrentRouteName = function(currentUrl) {
  ${generatePathNormalizationCode('currentUrl', basePath)}
  
  // 错误边界专用的路由映射表
  var errorBoundaryRouteMap = ${JSON.stringify(errorBoundaryRouteMap)};
  
  // 先尝试精确匹配
  if (errorBoundaryRouteMap[cleanPath]) {
    return errorBoundaryRouteMap[cleanPath];
  }
  
  // 精确匹配失败，使用正则匹配
  for (var routePath in errorBoundaryRouteMap) {
    var routePattern = routePath.replace(/:[^/]+/g, '[^/]+').replace(/\\//g, '\\\\/');
    var regex = new RegExp('^' + routePattern + '(?:\\\\/.*)?$', 'i');
    if (regex.test(cleanPath)) {
      return errorBoundaryRouteMap[routePath];
    }
  }
  
  return 'unknown';
};

// 获取原始路由路径（用于 routerComponentName）
const getCurrentRoutePath = function(currentUrl) {
  ${generatePathNormalizationCode('currentUrl', basePath)}
  
  // 路由映射表（原始路径）
  var routeMap = ${JSON.stringify(routeMap)};
  
  // 先尝试精确匹配（处理根路径）
  if (cleanPath === '/' && routeMap['/']) {
    return '/';
  }
  
  // 使用正则匹配查找原始路由路径
  for (var routePath in routeMap) {
    // 处理根路径
    if (routePath === '/' && cleanPath === '/') {
      return routePath;
    }
    
    // 处理通配符路由（如 /roomslistingpage/*）
    if (routePath.endsWith('/*')) {
      var basePattern = routePath.slice(0, -2).replace(/\\//g, '\\\\/');
      var regex = new RegExp('^' + basePattern + '(?:\\\\/.*)?$', 'i');
      if (regex.test(cleanPath)) {
        return routePath;
      }
    }
    // 处理参数路由（如 /roomdetailpage/:room_id）
    else if (routePath.includes(':')) {
      var routePattern = routePath.replace(/:[^/]+/g, '[^/]+').replace(/\\//g, '\\\\/');
      var regex = new RegExp('^' + routePattern + '(?:\\\\/.*)?$', 'i');
      if (regex.test(cleanPath)) {
        return routePath;
      }
    }
    // 处理精确匹配的路由
    else if (routePath === cleanPath) {
      return routePath;
    }
  }
  
  return 'unknown';
};
// 自动生成的路由匹配函数 END
`;

              const logDataRegex = /const\s+logData\s*=\s*\{([\s\S]*?)\};/;
              const match = logDataRegex.exec(code);

              if (match) {
                // 在 logData 中添加路由信息
                const newLogData = `const logData = {
              type: 'error:react',
              error: {
                name: errorInfo.error.name,
                message: errorInfo.error.message,
                stack: errorInfo.error.stack
              },
              url: window.location.href,
              userAgent: navigator.userAgent,
              timestamp: Date.now(),
              sourceLocation: this.extractSourceLocation(errorInfo.error),
              errorType: 'react',
              routeName: getCurrentRouteName(window.location.pathname),
              componentName: (function() {
                var currentPath = window.location.pathname;
                var basePath = window.__dynamic_base__ || '${basePath}';
                var normalizedPath = currentPath;
                
                if (basePath !== '/' && currentPath === basePath) {
                  normalizedPath = '/';
                } else if (basePath !== '/' && currentPath.startsWith(basePath)) {
                  normalizedPath = currentPath.substring(basePath.length);
                  if (normalizedPath === '') {
                    normalizedPath = '/';
                  } else if (!normalizedPath.startsWith('/')) {
                    normalizedPath = '/' + normalizedPath;
                  }
                }
                
                var cleanPath = normalizedPath;
                if (cleanPath.endsWith('/') && cleanPath !== '/') {
                  cleanPath = cleanPath.slice(0, -1);
                }
                
                var routeMap = ${JSON.stringify(routeMap)};
                return routeMap[cleanPath] || 'unknown';
              })(),
              routerComponentName: (function() {
                // 先通过 getCurrentRoutePath 获取原始路由路径
                var routePath = getCurrentRoutePath(window.location.pathname);
                var routerComponentMap = ${JSON.stringify(routerComponentMap)};
                // 使用原始路由路径去 routerComponentMap 中查找
                return routerComponentMap[routePath] || 'unknown';
              })()
            };`;
                const newCode = routeMatchFunction + '\n' + code.replace(logDataRegex, newLogData);
                return {
                  code: newCode,
                };
              }

              return { code };
            } catch (error) {
              console.error('Error processing error boundary file:', error);
              return { code };
            }
          }
        );
      }

      // 使用 processAssets 钩子直接修改构建产物
      api.processAssets({ stage: 'optimize' }, ({ assets, sources }: AssetProcessingContext) => {
        // 遍历所有 JavaScript 资源
        Object.keys(assets).forEach((assetName) => {
          if (assetName.endsWith('.js') || assetName.endsWith('.mjs')) {
            const asset = assets[assetName];
            if (asset && typeof asset.source === 'function') {
              const source = asset.source();
              if (typeof source === 'string' && source.includes('/__dynamic_base__/')) {
                // 通用替换：匹配所有 ="/__dynamic_base__/" 的模式
                // 如果 window.__dynamic_base__ 已经是 "/"，就不需要再加 "/"
                let transformed = source.replace(
                  /=\s*["']\/__dynamic_base__\/["']/g,
                  '=(window.__dynamic_base__||"/")+(window.__dynamic_base__==="/"?"":"/")'
                );

                // 兼容性替换：匹配其他可能的 publicPath 设置
                transformed = transformed.replace(
                  /publicPath\s*:\s*["']\/__dynamic_base__\/["']/g,
                  'publicPath:(window.__dynamic_base__||"/")+(window.__dynamic_base__==="/"?"":"/")'
                );

                if (transformed !== source) {
                  // 创建新的 Source 对象
                  const newSource = new sources.RawSource(transformed);
                  assets[assetName] = newSource;
                }
              }
            }
          }
        });
      });
    },
  };
}
