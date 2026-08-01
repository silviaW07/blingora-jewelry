/**
 * Babel 插件：生成路由布局相关代码（Next.js App Router + Turbopack 版本）
 * 参考 rsbuild-plugin-generate-route-layout.ts
 * 
 * 功能：
 * 1. 从 Next.js App Router 约定路由中提取路由信息
 * 2. 将路由信息注入到 NotFound.tsx 和错误边界文件中
 * 3. 无需预处理脚本，完全在编译时完成
 */

const path = require('path');
const fs = require('fs');

// 模块级别的缓存，用于在文件间共享路由信息
const routeCache = {
  backendPaths: [],
  frontendPaths: [],
  routeMap: {},
  backendHomePath: '/backenddashboardpage',
  frontendHomePath: '/',
  extracted: false
};

/**
 * 从文件路径提取 Next.js App Router 路由路径
 * 例如: app/(backend)/backenddashboardpage/page.tsx -> /backenddashboardpage
 */
function extractRouteFromFilePath(filePath, appDir = 'app') {
  // 标准化路径
  const normalizedPath = filePath.replace(/\\/g, '/');
  
  // 查找 app 目录的位置
  const appIndex = normalizedPath.indexOf(`/${appDir}/`);
  if (appIndex === -1) {
    return null;
  }
  
  // 提取 app 目录之后的部分
  let routePath = normalizedPath.substring(appIndex + appDir.length + 2);
  
  // 移除文件名（page.tsx, layout.tsx 等）
  routePath = routePath.replace(/\/page\.(tsx|ts|jsx|js)$/, '');
  routePath = routePath.replace(/\/layout\.(tsx|ts|jsx|js)$/, '');
  routePath = routePath.replace(/\/loading\.(tsx|ts|jsx|js)$/, '');
  routePath = routePath.replace(/\/error\.(tsx|ts|jsx|js)$/, '');
  
  // 移除路由组（括号包裹的目录名，如 (backend), (frontend)）
  routePath = routePath.replace(/\([^)]+\)\//g, '');
  
  // 构建完整路由路径
  if (!routePath || routePath === '') {
    routePath = '/';
  } else {
    routePath = '/' + routePath.replace(/\/+/g, '/').replace(/\/$/, '');
  }
  
  return routePath;
}

/**
 * 判断路由类型（从文件路径）
 */
function getRouteTypeFromFilePath(filePath) {
  const normalizedPath = filePath.replace(/\\/g, '/');
  
  if (normalizedPath.includes('/(backend)/')) {
    return 'backend';
  } else if (normalizedPath.includes('/(frontend)/')) {
    return 'frontend';
  }
  
  return null;
}

/**
 * 提取路由信息并更新缓存
 */
function extractAndCacheRoute(filePath) {
  const routePath = extractRouteFromFilePath(filePath);
  if (!routePath) return;
  
  const routeType = getRouteTypeFromFilePath(filePath);
  
  // 提取组件名（从文件名）
  const fileName = path.basename(filePath, path.extname(filePath));
  let componentName = fileName;
  if (fileName === 'page') {
    // 从目录名获取组件名
    const dirName = path.basename(path.dirname(filePath));
    componentName = dirName.charAt(0).toUpperCase() + dirName.slice(1) + 'Page';
  }
  
  // 更新路由映射
  routeCache.routeMap[routePath] = componentName;
  
  // 根据类型添加到对应列表
  if (routeType === 'backend') {
    if (!routeCache.backendPaths.includes(routePath)) {
      routeCache.backendPaths.push(routePath);
      // 如果是首页，更新首页路径
      if (routePath === '/backenddashboardpage' || routePath.includes('dashboard')) {
        routeCache.backendHomePath = routePath;
      }
    }
  } else if (routeType === 'frontend') {
    if (!routeCache.frontendPaths.includes(routePath)) {
      routeCache.frontendPaths.push(routePath);
      // 如果是首页
      if (routePath === '/') {
        routeCache.frontendHomePath = '/';
      }
    }
  }
}

module.exports = function ({ types: t, template }) {
  // 简化的路由匹配工具函数模板（与修改后的 not-found.tsx 一致）
  const routeMatcherTemplate = template`
    // 路由匹配工具函数
    if (!window.__routeMatcher__) {
      window.__routeMatcher__ = {
        normalizePath: function(path) {
          if (!path) return '/';
          var normalized = path.toLowerCase().trim().split('#')[0].split('?')[0];
          if (!normalized) return '/';
          if (!normalized.startsWith('/')) normalized = '/' + normalized;
          if (normalized.length > 1 && normalized.endsWith('/')) {
            normalized = normalized.slice(0, -1);
          }
          return normalized;
        },
        matchPathWithWildcard: function(pattern, targetPath) {
          if (!pattern || !targetPath) return false;
          var normalizedPattern = this.normalizePath(pattern);
          var normalizedTarget = this.normalizePath(targetPath);
        
          if (normalizedPattern === '*') return true;
          var wildcardIndex = normalizedPattern.indexOf('*');
          var prefixPart = normalizedPattern.slice(0, wildcardIndex);
          var normalizedPrefix = this.normalizePath(prefixPart);
          if (normalizedPrefix === '/') return true;
          if (normalizedTarget === normalizedPrefix) return true;
          return normalizedTarget.startsWith(normalizedPrefix + '/');
        }
      };
    }
  `;

  // 辅助函数：标准化路由模式
  function normalizePattern(rawPattern) {
    if (!rawPattern) return '';
    const cleaned = rawPattern.toLowerCase().trim().split('#')[0]?.split('?')[0] ?? '';
    if (!cleaned) return '';
    const collapsed = cleaned.replace(/\/+/g, '/');
    return collapsed.startsWith('/') ? collapsed : '/' + collapsed;
  }


  /**
   * 生成交互脚本代码
   */
  function generateInteractiveScript() {
    return `
(function() {
  'use strict';
  
  // 确保只在客户端运行
  if (typeof window === 'undefined') {
    return;
  }
  
  // 确保只初始化一次
  if (window.__autoInteractiveStyles__) {
    return;
  }
  window.__autoInteractiveStyles__ = true;
  
  // 将连字符格式转换为驼峰格式（如 bg-img -> bgImg）
  function kebabToCamel(str) {
    return str.replace(/-([a-z])/g, function(match, letter) {
      return letter.toUpperCase();
    });
  }
  
  // CSS 变量后缀到 CSS 属性的映射（扩展更多样式支持）
  // 支持连字符和驼峰两种格式
  var propertyMap = {
    'bg': 'background-color',
    'bgImg': 'background-image',
    'bg-img': 'background-image',
    'color': 'color',
    'font-size': 'font-size',
    'fontSize': 'font-size',
    'fontWeight': 'font-weight',
    'font-weight': 'font-weight',
    'border': 'border',
    'borderColor': 'border-color',
    'border-color': 'border-color',
    'borderRadius': 'border-radius',
    'border-radius': 'border-radius',
    'opacity': 'opacity',
    'boxShadow': 'box-shadow',
    'box-shadow': 'box-shadow',
    'textShadow': 'text-shadow',
    'text-shadow': 'text-shadow',
    'transform': 'transform',
    'transition': 'transition',
    'scale': 'transform',
    'rotate': 'transform',
    'cursor': 'cursor',
    'padding': 'padding',
    'margin': 'margin'
  };
  
  // 存储当前处于 active 状态的元素
  var activeElement = null;
  // 存储 activeElement 是否已经移出（用于判断抬起时应该恢复什么值）
  var activeElementLeft = false;
  
  // 预编译的正则表达式缓存（性能优化）
  var stylePropRegexCache = {};
  
  // 检查元素是否有交互变量
  function hasInteractiveVars(element) {
    if (!element || !element.getAttribute) return false;
    var style = element.getAttribute('style') || '';
    // 使用 indexOf 代替正则表达式测试（性能更好）
    var hasHover = style.indexOf('--autpohover-') !== -1;
    var hasActive = style.indexOf('--autpoactive-') !== -1;
    return hasHover || hasActive;
  }
  
  // 获取当前 CSS 属性的值（优先从内联样式，其次从 computed style）
  function getCurrentPropertyValue(element, cssProp) {
    // 先从内联样式中读取（排除 CSS 变量）
    var inlineStyle = element.getAttribute('style') || '';
    if (inlineStyle) {
      // 只匹配实际的 CSS 属性，不匹配 CSS 变量（--开头）
      var propRegex = new RegExp('(^|;)\\s*' + cssProp.replace(/[.*+?^\\$\\{}()|[\\]\\\\]/g, '\\\\$&') + '\\s*:\\s*([^;]+)', 'i');
      var match = inlineStyle.match(propRegex);
      if (match && match[2]) {
        var value = match[2].trim();
        // 确保不是 CSS 变量
        if (value && !value.trim().startsWith('--')) {
          return value;
        }
      }
    }
    
    // 如果内联样式中没有，从 computed style 读取
    try {
      var computed = window.getComputedStyle(element);
      // getPropertyValue 需要 kebab-case 格式
      var kebabProp = cssProp.replace(/([A-Z])/g, '-$1').toLowerCase();
      var value = computed.getPropertyValue(kebabProp).trim();
      if (value && value !== 'none' && value !== 'auto' && !value.startsWith('--')) {
        return value;
      }
    } catch (e) {}
    
    return '';
  }
  
  // 设置 CSS 属性到 style（保留 CSS 变量）
  function setPropertyToStyle(element, cssProp, value) {
    var currentStyle = element.getAttribute('style') || '';
    
    // 分离 CSS 变量和普通属性
    var cssVars = [];
    var normalProps = [];
    var parts = currentStyle.split(';');
    
    for (var i = 0; i < parts.length; i++) {
      var part = parts[i].trim();
      if (!part) continue;
      
      // 检查是否是 CSS 变量（以 -- 开头）
      if (part.startsWith('--')) {
        cssVars.push(part);
      } else {
        // 检查是否是当前要设置的属性
        var propMatch = part.match(/^([^:]+)\s*:/);
        if (propMatch) {
          var propName = propMatch[1].trim();
          // 转换为 kebab-case 进行比较
          var kebabProp = cssProp.replace(/([A-Z])/g, '-$1').toLowerCase();
          var kebabPropName = propName.replace(/([A-Z])/g, '-$1').toLowerCase();
          if (kebabPropName !== kebabProp) {
            normalProps.push(part);
          }
          // 如果是当前属性，跳过（会被新值替换）
        } else {
          normalProps.push(part);
        }
      }
    }
    
    // 构建新的 style
    var newStyleParts = [];
    
    // 先添加普通属性
    for (var j = 0; j < normalProps.length; j++) {
      if (normalProps[j]) {
        newStyleParts.push(normalProps[j]);
      }
    }
    
    // 添加新值
    if (value) {
      // 转换为 kebab-case 格式
      var kebabProp = cssProp.replace(/([A-Z])/g, '-$1').toLowerCase();
      newStyleParts.push(kebabProp + ': ' + value);
    }
    
    // 最后添加 CSS 变量（保留所有 CSS 变量）
    for (var k = 0; k < cssVars.length; k++) {
      if (cssVars[k]) {
        newStyleParts.push(cssVars[k]);
      }
    }
    
    var newStyle = newStyleParts.join('; ').trim();
    
    if (newStyle) {
      element.setAttribute('style', newStyle);
    } else {
      element.removeAttribute('style');
    }
  }
  
  // 向上查找包含交互变量的元素（优化：使用缓存）
  function findInteractiveElement(target) {
    if (!target) {
      return null;
    }
    var el = target;
    var depth = 0;
    while (el && el !== document.body && el !== document.documentElement && depth < 10) {
      if (hasInteractiveVars(el)) {
        return el;
      }
      el = el.parentElement;
      depth++;
    }
    return null;
  }
  
  // 获取 CSS 变量值（优化：优先从内联样式读取，避免昂贵的 getComputedStyle）
  function getVarValue(element, varName, inlineStyle) {
    // 优先从内联样式中查找（性能更好）
    if (inlineStyle) {
      var escapedVarName = varName.replace(/[.*+?^\\$\\{}()|[\\]\\\\]/g, '\\\\$&');
      var pattern = escapedVarName + '\\s*:\\s*([^;]+)';
      var regex = new RegExp(pattern, 'i');
      var match = inlineStyle.match(regex);
      if (match && match[1]) {
        return match[1].trim();
      }
    }
    
    // 如果内联样式中没有，才使用 getComputedStyle（较昂贵）
    try {
      var computed = window.getComputedStyle(element);
      var value = computed.getPropertyValue(varName).trim();
      if (value) return value;
    } catch (e) {}
    
    return '';
  }
  
  // 获取样式属性的正则表达式（缓存优化）
  function getStylePropRegex(prop) {
    if (!stylePropRegexCache[prop]) {
      var escapedProp = prop.replace(/[.*+?^\\$\\{}()|[\\]\\\\]/g, '\\\\$&');
      stylePropRegexCache[prop] = new RegExp(escapedProp + '\\s*:[^;]+;?', 'gi');
    }
    return stylePropRegexCache[prop];
  }
  
  // 应用样式（hover 或 active）
  function applyStyle(element, prefix) {
    if (!element || !element.getAttribute) return;
    
    var inlineStyle = element.getAttribute('style') || '';
    
    // 构建匹配特定前缀的正则表达式（如 --autpohover- 或 --autpoactive-）
    var escapedPrefix = prefix.replace(/[.*+?^\\$\\{}()|[\\]\\\\]/g, '\\\\$&');
    var varPatternRegex = new RegExp(escapedPrefix + '([a-zA-Z][a-zA-Z0-9-]*)\\s*:\\s*([^;]+)', 'gi');
    var match;
    var propertiesToApply = {};
    var transformParts = [];
    
    // 从内联样式中查找所有匹配的变量
    while ((match = varPatternRegex.exec(inlineStyle)) !== null) {
      var suffix = match[1]; // 如 'bg', 'color', 'box-shadow', 'bg-img'
      // 先尝试直接查找，如果找不到则转换为驼峰格式再查找
      var cssProp = propertyMap[suffix] || propertyMap[kebabToCamel(suffix)];
      if (cssProp) {
        var value = match[2].trim();
        if (value) {
          // 特殊处理 transform 相关的属性
          if (suffix === 'transform' || suffix === 'scale' || suffix === 'rotate') {
            if (suffix === 'transform') {
              transformParts.push(value);
            } else if (suffix === 'scale') {
              transformParts.push('scale(' + value + ')');
            } else if (suffix === 'rotate') {
              transformParts.push('rotate(' + value + ')');
            }
          } else {
            propertiesToApply[cssProp] = {
              suffix: suffix,
              value: value
            };
          }
        }
      }
    }
    
    // 合并 transform 相关的属性
    if (transformParts.length > 0) {
      propertiesToApply['transform'] = {
        suffix: 'transform',
        value: transformParts.join(' ')
      };
    }
    
    // 如果没有找到任何样式，直接返回
    if (Object.keys(propertiesToApply).length === 0) {
      return;
    }
    
    var isActive = prefix === '--autpoactive-';
    var isHover = prefix === '--autpohover-';
    
    // 如果是第一次应用样式（hover），保存整个初始 style
    if (isHover && !element.getAttribute('data-original-style')) {
      // 保存初始的完整 style（排除 CSS 变量和 transition）
      var originalStyle = element.getAttribute('style') || '';
      // 移除 CSS 变量和 transition，只保留实际的 CSS 属性
      var parts = originalStyle.split(';');
      var originalProps = [];
      for (var i = 0; i < parts.length; i++) {
        var part = parts[i].trim();
        if (!part) continue;
        // 排除 CSS 变量（--开头）和 transition
        if (!part.startsWith('--') && !part.toLowerCase().startsWith('transition')) {
          originalProps.push(part);
        }
      }
      var cleanedOriginalStyle = originalProps.join('; ');
      if (cleanedOriginalStyle) {
        element.setAttribute('data-original-style', cleanedOriginalStyle);
      }
    }
    
    // 如果应用的是 active 样式，且已经有原始样式（说明 hover 已应用），保存当前的 hover 状态 style
    if (isActive && element.getAttribute('data-original-style') && !element.getAttribute('data-hover-style')) {
      // 保存当前的 hover 状态 style（排除 CSS 变量和 transition）
      var currentStyle = element.getAttribute('style') || '';
      var parts = currentStyle.split(';');
      var hoverProps = [];
      for (var i = 0; i < parts.length; i++) {
        var part = parts[i].trim();
        if (!part) continue;
        // 排除 CSS 变量（--开头）和 transition
        if (!part.startsWith('--') && !part.toLowerCase().startsWith('transition')) {
          hoverProps.push(part);
        }
      }
      var cleanedHoverStyle = hoverProps.join('; ');
      if (cleanedHoverStyle) {
        element.setAttribute('data-hover-style', cleanedHoverStyle);
      }
    }
    
    // 添加 transition（如果还没有）
    if (!inlineStyle.includes('transition')) {
      var currentStyle = element.getAttribute('style') || '';
      element.setAttribute('style', (currentStyle ? currentStyle + '; ' : '') + 'transition: all 0.2s ease');
    }
    
    // 应用新值
    for (var cssProp in propertiesToApply) {
      var propInfo = propertiesToApply[cssProp];
      setPropertyToStyle(element, cssProp, propInfo.value);
    }
  }
  
  // 移除样式：恢复所有保存的默认值
  // restoreHover: true 表示恢复 hover 状态（用于移除 active），false 表示恢复原始状态（用于移除 hover）
  // clearData: true 表示清理所有 data 属性，false 表示保留 data-original-style（用于后续恢复）
  // removeBoth: true 表示同时移除 active 和 hover 属性（用于移出后再抬起的情况）
  function removeStyle(element, restoreHover, clearData, removeBoth) {
    // 如果 clearData 未指定，根据 restoreHover 决定：恢复 hover 时不清理（因为离开时还需要原始值），恢复原始值时清理
    if (clearData === undefined) {
      clearData = !restoreHover;
    }
    if (!element || !element.getAttribute) return;
    
    // 获取保存的原始 style 和 hover style
    var originalStyle = element.getAttribute('data-original-style') || '';
    var hoverStyle = element.getAttribute('data-hover-style') || '';
    
    // 确定要恢复的 style
    var styleToRestore = '';
    if (restoreHover && hoverStyle) {
      // 恢复 hover 状态
      styleToRestore = hoverStyle;
    } else if (originalStyle) {
      // 恢复原始状态
      styleToRestore = originalStyle;
    }
    
    // 获取当前的 style，提取 CSS 变量
    var currentStyle = element.getAttribute('style') || '';
    var cssVars = [];
    var parts = currentStyle.split(';');
    
    for (var p = 0; p < parts.length; p++) {
      var part = parts[p].trim();
      if (!part) continue;
      // 保留 CSS 变量（--开头）
      if (part.startsWith('--')) {
        cssVars.push(part);
      }
    }
    
    // 构建新的 style：恢复的样式 + CSS 变量
    var newStyleParts = [];
    
    // 如果有要恢复的样式，添加它
    if (styleToRestore) {
      // 解析恢复的样式，排除 transition
      var restoreParts = styleToRestore.split(';');
      for (var i = 0; i < restoreParts.length; i++) {
        var part = restoreParts[i].trim();
        if (part && !part.toLowerCase().startsWith('transition')) {
          newStyleParts.push(part);
        }
      }
    }
    
    // 添加 CSS 变量
    for (var k = 0; k < cssVars.length; k++) {
      if (cssVars[k]) {
        newStyleParts.push(cssVars[k]);
      }
    }
    
    var newStyle = newStyleParts.join('; ').trim();
    
    if (newStyle) {
      element.setAttribute('style', newStyle);
    } else {
      element.removeAttribute('style');
    }
    
    // 根据 clearData 决定是否清理 data 属性
    if (clearData) {
      // 清理所有 data 属性
      var attrs = element.attributes;
      var attrsToRemove = [];
      for (var j = 0; j < attrs.length; j++) {
        var attrName = attrs[j].name;
        if (attrName && (
          attrName.startsWith('data-original-style') ||
          attrName.startsWith('data-hover-style') ||
          attrName.startsWith('data-default-') ||
          attrName.startsWith('data-hover-')
        )) {
          attrsToRemove.push(attrName);
        }
      }
      for (var k = 0; k < attrsToRemove.length; k++) {
        element.removeAttribute(attrsToRemove[k]);
      }
    } else {
      // 只清理 data-hover-style，保留 data-original-style（用于后续恢复原始值）
      if (element.getAttribute('data-hover-style')) {
        element.removeAttribute('data-hover-style');
      }
    }
  }
  
  // 检查 SDK 是否处于编辑模式（事件拦截模式）
  function isSDKEditModeEnabled() {
    try {
      // 检查 SDK 是否存在
      if (typeof window !== 'undefined' && window.CustomBlockSDK) {
        var sdk = window.CustomBlockSDK.OptimizedCustomBlockSDK;
        if (sdk && sdk.getInstance) {
          var instance = sdk.getInstance();
          if (instance && instance.eventManager) {
            // 检查事件阻止功能是否启用（这通常表示编辑模式）
            return instance.eventManager.isEventBlockingEnabled && instance.eventManager.isEventBlockingEnabled();
          }
        }
      }
      // 兼容性检查：通过 CBSDK 别名
      if (typeof window !== 'undefined' && window.CBSDK) {
        var sdk = window.CBSDK.OptimizedCustomBlockSDK;
        if (sdk && sdk.getInstance) {
          var instance = sdk.getInstance();
          if (instance && instance.eventManager) {
            return instance.eventManager.isEventBlockingEnabled && instance.eventManager.isEventBlockingEnabled();
          }
        }
      }
    } catch (e) {
      // 忽略检查错误，不影响样式处理
    }
    return false;
  }
  
  // 延迟执行样式处理的包装函数，确保 SDK 事件拦截优先执行
  function deferStyleUpdate(callback) {
    // 使用 requestAnimationFrame 延迟到下一个渲染帧，让 SDK 先处理事件拦截
    if (typeof requestAnimationFrame !== 'undefined') {
      requestAnimationFrame(callback);
    } else {
      // 降级到 setTimeout
      setTimeout(callback, 0);
    }
  }
  
  // 检查是否应该处理事件：SDK 存在且启用时禁止，否则允许
  function shouldProcessEvent() {
    // SDK 存在且启用事件阻止时，返回 false（禁止处理）
    // SDK 不存在或未启用时，返回 true（允许处理）
    return !isSDKEditModeEnabled();
  }
  
  // 事件处理
  function handleEnter(e) {
    // SDK 存在且启用时，禁止处理事件
    if (!shouldProcessEvent()) {
      return;
    }
    
    var el = findInteractiveElement(e.target);
    if (el && el !== activeElement) {
      if (hasInteractiveVars(el)) {
        applyStyle(el, '--autpohover-');
      }
    }
  }
  
  function handleLeave(e) {
    // SDK 存在且启用时，禁止处理事件
    if (!shouldProcessEvent()) {
      return;
    }
    
    // 如果存在 activeElement，检查是否离开了它
    if (activeElement && activeElement !== null) {
      // 检查事件目标是否在 activeElement 内
      var isTargetInside = false;
      if (e.target && activeElement.contains && activeElement.contains(e.target)) {
        isTargetInside = true;
      }
      
      // 检查 relatedTarget 是否在 activeElement 内
      var relatedTarget = e.relatedTarget;
      var isRelatedTargetInside = false;
      if (relatedTarget && activeElement.contains && activeElement.contains(relatedTarget)) {
        isRelatedTargetInside = true;
      }
      
      // 如果事件目标不在 activeElement 内，或者 relatedTarget 不在 activeElement 内，说明已经移出了
      if (!isTargetInside || (relatedTarget && !isRelatedTargetInside)) {
        activeElementLeft = true;
        return;
      }
    }
    
    // 处理普通的 hover 元素离开
    var el = findInteractiveElement(e.target);
    if (el && el !== activeElement) {
      // 离开元素，移除 hover 样式（只恢复默认值）
      removeStyle(el, false);
    }
  }
  
  function handleDown(e) {
    // SDK 存在且启用时，禁止处理事件
    if (!shouldProcessEvent()) {
      return;
    }
    
    var el = findInteractiveElement(e.target);
    if (el) {
      if (hasInteractiveVars(el)) {
        activeElement = el;
        activeElementLeft = false; // 重置移出标志
        applyStyle(el, '--autpoactive-');
      }
    }
  }
  
  function handleUp(e) {
    // SDK 存在且启用时，禁止处理事件
    if (!shouldProcessEvent()) {
      return;
    }
    
    if (activeElement) {
      // 优先使用 activeElementLeft 标志：如果已经移出，直接恢复默认值
      if (activeElementLeft) {
        // 已经移出，移除所有 hover 和 active 属性，恢复原始默认值
        removeStyle(activeElement, false, true, true);
        activeElement = null;
        activeElementLeft = false;
        return;
      }
      
      // 检查鼠标/触摸是否仍在 activeElement 上（包括其子元素）
      // 使用多种方式判断，确保准确性
      var isStillOnElement = false;
      
      // 方式1：检查事件目标是否在 activeElement 内
      if (e.target && activeElement.contains && activeElement.contains(e.target)) {
        isStillOnElement = true;
      }
      
      // 方式2：检查鼠标位置下的元素是否在 activeElement 内（对于 mouseup 事件）
      if (!isStillOnElement && e.type === 'mouseup' && e.clientX !== undefined && e.clientY !== undefined) {
        try {
          var elementAtPoint = document.elementFromPoint(e.clientX, e.clientY);
          if (elementAtPoint && activeElement.contains && activeElement.contains(elementAtPoint)) {
            isStillOnElement = true;
          }
        } catch (err) {
          // 忽略错误
        }
      }
      
      // 方式3：检查 findInteractiveElement 的结果
      if (!isStillOnElement) {
        var el = findInteractiveElement(e.target);
        if (el === activeElement) {
          isStillOnElement = true;
        } else if (el && activeElement.contains && activeElement.contains(el)) {
          isStillOnElement = true;
        }
      }
      
      // 抬起时检查是否还在元素内
      // 如果还在元素内，恢复 hover 值（不清理 data-default-xxx，因为离开时还需要用它恢复默认值）
      // 如果不在元素内，移除所有 hover 和 active 属性，恢复原始默认值
      if (isStillOnElement) {
        // 还在元素上，恢复 hover 值，但保留 data-default-xxx
        removeStyle(activeElement, true, false);
      } else {
        // 不在元素内，移除所有 hover 和 active 属性，恢复原始默认值
        removeStyle(activeElement, false, true, true);
      }
      
      activeElement = null;
      activeElementLeft = false; // 重置移出标志
    }
  }
  
  // 绑定事件（桌面端和移动端）
  // 注意：使用 capture 阶段，但通过延迟处理确保 SDK 的拦截器优先执行
  document.addEventListener('mouseenter', handleEnter, true);
  document.addEventListener('mouseleave', handleLeave, true);
  document.addEventListener('mousedown', handleDown, true);
  document.addEventListener('mouseup', handleUp, true);
  
  // 移动端支持
  document.addEventListener('touchstart', handleDown, true);
  document.addEventListener('touchend', handleUp, true);
  document.addEventListener('touchcancel', handleUp, true);
  
})();
`;
  }

  /**
   * 在根 layout 中添加交互脚本（使用 Next.js Script 组件）
   */
  function addInteractiveScriptToRootLayout(path, t, template) {
    try {
      // 检查是否已导入 Script，如果没有则添加
      let hasScriptImport = false;
      path.traverse({
        ImportDeclaration(importPath) {
          const source = importPath.node.source;
          if (t.isStringLiteral(source) && source.value === 'next/script') {
            const specifiers = importPath.node.specifiers || [];
            hasScriptImport = specifiers.some(spec => {
              if (t.isImportSpecifier(spec) || t.isImportDefaultSpecifier(spec)) {
                const imported = spec.imported || spec.local;
                return t.isIdentifier(imported) && imported.name === 'Script';
              }
              return false;
            });
            
            // 如果没有 Script，添加到现有导入
            if (!hasScriptImport) {
              const scriptSpecifier = t.importSpecifier(
                t.identifier('Script'),
                t.identifier('Script')
              );
              importPath.node.specifiers.push(scriptSpecifier);
              hasScriptImport = true;
            }
          }
        }
      });
      
      // 如果没有导入，添加新的 import 语句
      if (!hasScriptImport) {
        const scriptImport = t.importDeclaration(
          [t.importSpecifier(t.identifier('Script'), t.identifier('Script'))],
          t.stringLiteral('next/script')
        );
        const program = path.node;
        if (program.body && Array.isArray(program.body)) {
          // 找到最后一个 import 语句的位置
          let lastImportIndex = -1;
          for (let i = 0; i < program.body.length; i++) {
            if (program.body[i].type === 'ImportDeclaration') {
              lastImportIndex = i;
            }
          }
          if (lastImportIndex >= 0) {
            program.body.splice(lastImportIndex + 1, 0, scriptImport);
          } else {
            program.body.unshift(scriptImport);
          }
        }
      }
      
      // 查找 body 标签（在 JSX 树中查找）
      let bodyElement = null;
      
      path.traverse({
        JSXElement(jsxPath) {
          const node = jsxPath.node;
          if (node.openingElement) {
            const name = node.openingElement.name;
            // 检查是否是 body 标签
            if (t.isJSXIdentifier(name) && name.name === 'body') {
              bodyElement = jsxPath;
              jsxPath.stop(); // 找到后停止遍历
            }
          }
        }
      });
      
      if (!bodyElement) {
        // 调试：打印所有 JSX 元素
        path.traverse({
          JSXElement(jsxPath) {
            const node = jsxPath.node;
            if (node.openingElement) {
              const name = node.openingElement.name;
              if (t.isJSXIdentifier(name)) {
              }
            }
          }
        });
        return;
      }
      
      
      // 检查是否已经添加过脚本
      const bodyNode = bodyElement.node;
      if (bodyNode.children && Array.isArray(bodyNode.children)) {
        const hasScript = bodyNode.children.some(child => {
          if (t.isJSXElement(child)) {
            const name = child.openingElement.name;
            if (t.isJSXIdentifier(name) && name.name === 'Script') {
              // 检查是否有 id="auto-interactive-styles"
              const idAttr = child.openingElement.attributes.find(
                attr => t.isJSXAttribute(attr) && 
                        t.isJSXIdentifier(attr.name) && 
                        attr.name.name === 'id'
              );
              if (idAttr && t.isStringLiteral(idAttr.value) && 
                  idAttr.value.value === 'auto-interactive-styles') {
                return true;
              }
            }
          }
          return false;
        });
        
        if (hasScript) {
          return;
        }
      }
      
      // 生成脚本代码
      const scriptCode = generateInteractiveScript();
      
      // 创建 Next.js Script 组件
      const scriptElement = t.jsxElement(
        t.jsxOpeningElement(
          t.jsxIdentifier('Script'),
          [
            t.jsxAttribute(
              t.jsxIdentifier('id'),
              t.stringLiteral('auto-interactive-styles')
            ),
            t.jsxAttribute(
              t.jsxIdentifier('strategy'),
              t.stringLiteral('afterInteractive')
            ),
            t.jsxAttribute(
              t.jsxIdentifier('dangerouslySetInnerHTML'),
              t.jsxExpressionContainer(
                t.objectExpression([
                  t.objectProperty(
                    t.identifier('__html'),
                    t.stringLiteral(scriptCode)
                  )
                ])
              )
            )
          ]
        ),
        t.jsxClosingElement(t.jsxIdentifier('Script')),
        []
      );
      
      // 将 Script 添加到 body 的 children 中
      if (!bodyNode.children) {
        bodyNode.children = [];
      }
      bodyNode.children.push(scriptElement);
      
    } catch (e) {
    }
  }

  return {
    name: 'babel-plugin-generate-route-layout',
    visitor: {
      Program: {
        enter(path, state) {
          try {
            const filename = state?.file?.opts?.filename || '';
            const options = state?.opts || {};
            const basePath = options.basePath || '/';
            const normalizedFilename = filename.replace(/\\/g, '/');

            // 如果文件在 app 目录下，提取路由信息
            if (filename && filename.includes('/app/') && filename.includes('/page.tsx')) {
              try {
                extractAndCacheRoute(filename);
              } catch (e) {
                // 静默失败，不影响构建
              }
            }

            // 检查是否是需要处理的文件
            const isNotFoundFile = normalizedFilename.includes('/not-found.tsx') || normalizedFilename.endsWith('not-found.tsx');
            const isErrorBoundaryFile = normalizedFilename.includes('/error.tsx') || normalizedFilename.endsWith('error.tsx') || normalizedFilename.includes('ErrorBoundary');
            
            // 处理 NotFound.tsx 文件（Next.js 的 not-found.tsx）
            if (isNotFoundFile) {
              try {
                path.traverse({
                  VariableDeclarator(varPath) {
                    try {
                      // 处理 const handleTargetHome = () => {}
                      if (varPath?.node?.id && varPath.node.id.name === 'handleTargetHome') {
                        const init = varPath.node.init;
                        if (init && (init.type === 'ArrowFunctionExpression' || init.type === 'FunctionExpression')) {
                          transformHandleTargetHome(varPath, routeCache, basePath, t, template, routeMatcherTemplate, 'not-found', init);
                        }
                      }
                    } catch (e) {
                      // 静默失败
                    }
                  },
                  FunctionDeclaration(funcPath) {
                    try {
                      // 处理 function handleTargetHome() {}
                      if (funcPath?.node?.id && funcPath.node.id.name === 'handleTargetHome') {
                        transformHandleTargetHome(funcPath, routeCache, basePath, t, template, routeMatcherTemplate, 'not-found');
                      }
                    } catch (e) {
                      // 静默失败
                    }
                  }
                });
              } catch (e) {
                // 静默失败，不影响构建
              }
            }

            // 处理错误边界文件（Next.js 的 error.tsx）
            if (isErrorBoundaryFile) {
              try {
                path.traverse({
                  VariableDeclarator(varPath) {
                    try {
                      // 处理 handleTargetHome 函数
                      if (varPath?.node?.id && varPath.node.id.name === 'handleTargetHome') {
                        const init = varPath.node.init;
                        if (init && (init.type === 'ArrowFunctionExpression' || init.type === 'FunctionExpression')) {
                          transformHandleTargetHome(varPath, routeCache, basePath, t, template, routeMatcherTemplate, 'error', init);
                        }
                      }
                    } catch (e) {
                      // 静默失败
                    }
                  },
                  // 处理函数内部的 logData（如 handleFix 函数）
                  FunctionDeclaration(funcPath) {
                    try {
                      funcPath.traverse({
                        VariableDeclarator(innerVarPath) {
                          try {
                            if (innerVarPath?.node?.id && innerVarPath.node.id.name === 'logData') {
                              transformLogData(innerVarPath, routeCache, basePath, t, template, funcPath);
                            }
                          } catch (e) {
                            // 静默失败
                          }
                        }
                      });
                    } catch (e) {
                      // 静默失败
                    }
                  },
                  ArrowFunctionExpression(arrowPath) {
                    try {
                      if (arrowPath?.node?.body?.type === 'BlockStatement') {
                        arrowPath.traverse({
                          VariableDeclarator(innerVarPath) {
                            try {
                              if (innerVarPath?.node?.id && innerVarPath.node.id.name === 'logData') {
                                transformLogData(innerVarPath, routeCache, basePath, t, template, arrowPath);
                              }
                            } catch (e) {
                              // 静默失败
                            }
                          }
                        });
                      }
                    } catch (e) {
                      // 静默失败
                    }
                  }
                });
              } catch (e) {
                // 静默失败，不影响构建
              }
            }

            // 在 enter 阶段检测并处理根 layout.tsx
            try {
              // 检查是否是 app/layout.tsx（根 layout，不是子路由的 layout）
              const isRootLayout = normalizedFilename === 'app/layout.tsx' || 
                                   normalizedFilename.endsWith('/app/layout.tsx') ||
                                   (normalizedFilename.includes('/app/layout.tsx') && 
                                    !normalizedFilename.includes('/(') && 
                                    !normalizedFilename.includes(')/'));
              
              if (isRootLayout) {
                addInteractiveScriptToRootLayout(path, t, template);
              }
            } catch (e) {
              console.error('[Babel Plugin] 处理 layout 失败:', e);
            }
          } catch (e) {
            // 任何错误都静默处理，不中断构建
            return;
          }
        }
      },
    }
  };
};

/**
 * 转换 handleTargetHome 函数（用于 not-found.tsx 和 error.tsx）
 */
function transformHandleTargetHome(path, routeCache, basePath, t, template, routeMatcherTemplate, fileType, functionNode = null) {
  try {
    const backendPaths = routeCache?.backendPaths || [];
    const frontendPaths = routeCache?.frontendPaths || [];
    const backendHomePath = routeCache?.backendHomePath || '/backenddashboardpage';
    const frontendHomePath = routeCache?.frontendHomePath || '/';

    // 检查是否已经存在路由匹配逻辑（避免重复转换）
    let functionBody;
    try {
      functionBody = functionNode ? functionNode.body : path?.get('body');
    } catch (e) {
      return; // 如果获取失败，直接返回
    }
    
    // Check if functionBody is a BlockStatement (handle both path objects and plain nodes)
    const isBlockStatement = functionBody && (
      (typeof functionBody.isBlockStatement === 'function' && functionBody.isBlockStatement()) ||
      (functionBody.type === 'BlockStatement')
    );
    if (isBlockStatement) {
      try {
        const bodyText = path?.getSource?.();
        // 如果已经存在 __routeMatcher__，说明已经转换过了
        if (bodyText && typeof bodyText === 'string' && bodyText.includes('__routeMatcher__')) {
          return; // 跳过转换
        }
      } catch (e) {
        // 如果获取源码失败，继续处理
      }
    }

  // 生成路由匹配代码
  // routeMatcherTemplate 返回一个完整的语句，直接使用
  let routeMatcherCode = [];
  try {
    const routeMatcherStatement = routeMatcherTemplate();
    if (routeMatcherStatement) {
      routeMatcherCode = [routeMatcherStatement];
    }
  } catch (e) {
    // 静默失败
    routeMatcherCode = [];
  }
  
  // 简化的路径规范化代码（移除 basePath 处理，与修改后的 not-found.tsx 一致）
  let pathNormalizationCode;
  try {
    const pathNormalizationTemplate = template(`
      // 移除 base 路径前缀进行匹配
      var pathToNormalize = typeof window !== 'undefined' ? window.location.pathname : '/';

      var cleanPath = window.__routeMatcher__.normalizePath(pathToNormalize);
    `);
    pathNormalizationCode = pathNormalizationTemplate();
    
    // 如果返回的是 Program 节点，提取语句
    if (pathNormalizationCode && pathNormalizationCode.type === 'Program') {
      pathNormalizationCode = pathNormalizationCode.body;
    }
  } catch (e) {
    // 静默失败
    pathNormalizationCode = [];
  }

    // 生成路由判断代码
    let routeCheckCode = [];
    
    function normalizePattern(rawPattern) {
      if (!rawPattern) return '';
      try {
        const cleaned = rawPattern.toLowerCase().trim().split('#')[0]?.split('?')[0] ?? '';
        if (!cleaned) return '';
        const collapsed = cleaned.replace(/\/+/g, '/');
        return collapsed.startsWith('/') ? collapsed : '/' + collapsed;
      } catch (e) {
        return '';
      }
    }
    
    try {
      if (backendPaths.length > 0) {
        const backendChecks = backendPaths.map(routePath => {
          try {
            const normalizedPattern = normalizePattern(routePath);
            // Use template.expression to create an expression, not a statement
            return template.expression`window.__routeMatcher__.matchPathWithWildcard(${t.stringLiteral(normalizedPattern)}, cleanPath)`();
          } catch (e) {
            return null;
          }
        }).filter(Boolean);
        
        if (backendChecks.length > 0) {
          try {
            routeCheckCode.push(
              template`var isBackend = ${backendChecks.reduce((acc, check) => 
                acc ? t.logicalExpression('||', acc, check) : check
              )};`()
            );
          } catch (e) {
            routeCheckCode.push(template`var isBackend = false;`());
          }
        } else {
          routeCheckCode.push(template`var isBackend = false;`());
        }
      } else {
        routeCheckCode.push(template`var isBackend = false;`());
      }
    } catch (e) {
      routeCheckCode.push(template`var isBackend = false;`());
    }

    try {
      if (frontendPaths.length > 0) {
        const frontendChecks = frontendPaths.map(routePath => {
          try {
            const normalizedPattern = normalizePattern(routePath);
            // Use template.expression to create an expression, not a statement
            return template.expression`window.__routeMatcher__.matchPathWithWildcard(${t.stringLiteral(normalizedPattern)}, cleanPath)`();
          } catch (e) {
            return null;
          }
        }).filter(Boolean);
        
        if (frontendChecks.length > 0) {
          try {
            routeCheckCode.push(
              template`var isFrontend = ${frontendChecks.reduce((acc, check) => 
                acc ? t.logicalExpression('||', acc, check) : check
              )};`()
            );
          } catch (e) {
            routeCheckCode.push(template`var isFrontend = false;`());
          }
        } else {
          routeCheckCode.push(template`var isFrontend = false;`());
        }
      } else {
        routeCheckCode.push(template`var isFrontend = false;`());
      }
    } catch (e) {
      routeCheckCode.push(template`var isFrontend = false;`());
    }

    // 生成路由跳转代码（使用 Next.js router）
    let navigationCode = [];
    try {
      navigationCode = template(`
        var targetPath = FRONTEND_HOME_PATH_PLACEHOLDER;
        if (isBackend) {
          targetPath = BACKEND_HOME_PATH_PLACEHOLDER;
        } else if (isFrontend) {
          targetPath = FRONTEND_HOME_PATH_PLACEHOLDER;
        }
        router.replace(targetPath);
      `, {
        placeholderPattern: /^(FRONTEND_HOME_PATH_PLACEHOLDER|BACKEND_HOME_PATH_PLACEHOLDER)$/
      })({
        FRONTEND_HOME_PATH_PLACEHOLDER: t.stringLiteral(frontendHomePath),
        BACKEND_HOME_PATH_PLACEHOLDER: t.stringLiteral(backendHomePath)
      });
    } catch (e) {
      // 如果生成失败，使用默认值
      try {
        navigationCode = template`router.replace('/');`();
      } catch (e2) {
        navigationCode = [];
      }
    }

    // 组合所有代码
    // 确保 pathNormalizationCode 和 navigationCode 是数组形式
    let pathNormalizationStatements = [];
    try {
      if (pathNormalizationCode) {
        if (Array.isArray(pathNormalizationCode)) {
          pathNormalizationStatements = pathNormalizationCode;
        } else if (pathNormalizationCode.type === 'BlockStatement' && pathNormalizationCode.body) {
          pathNormalizationStatements = pathNormalizationCode.body;
        } else {
          pathNormalizationStatements = [pathNormalizationCode];
        }
      }
    } catch (e) {
      pathNormalizationStatements = [];
    }
    
    let navigationStatements = [];
    try {
      if (navigationCode) {
        if (Array.isArray(navigationCode)) {
          navigationStatements = navigationCode;
        } else if (navigationCode.type === 'BlockStatement' && navigationCode.body) {
          navigationStatements = navigationCode.body;
        } else {
          navigationStatements = [navigationCode];
        }
      }
    } catch (e) {
      navigationStatements = [];
    }

    const newBody = [
      ...routeMatcherCode,
      ...pathNormalizationStatements,
      ...routeCheckCode,
      ...navigationStatements
    ];

    // 替换函数体
    try {
      if (functionNode) {
        // 处理箭头函数或函数表达式
        // 直接替换整个函数体
        if (functionNode.body !== undefined) {
          functionNode.body = t.blockStatement(newBody);
        }
      } else {
        // 处理函数声明
        const bodyPath = path?.get('body');
        if (bodyPath && typeof bodyPath.replaceWith === 'function') {
          bodyPath.replaceWith(t.blockStatement(newBody));
        }
      }
    } catch (e) {
      // 如果替换失败，静默失败
      return;
    }
  } catch (e) {
    // 任何错误都静默处理，不中断构建
    return;
  }
}

/**
 * 转换 error.tsx 中的 logData 对象，添加路由信息
 */
function transformLogData(varPath, routeCache, basePath, t, template, parentPath = null) {
  try {
    const routeMap = routeCache?.routeMap || {};
    const backendPaths = routeCache?.backendPaths || [];
    const frontendPaths = routeCache?.frontendPaths || [];

    // 生成路由匹配函数（作为单独的变量声明）
    let errorBoundaryRouteMap = {};
    try {
      errorBoundaryRouteMap = {
        ...frontendPaths.reduce((acc, p) => {
          try {
            const clean = p === '/' ? p : p.startsWith('/') ? p.substring(1) : p;
            acc[p] = `frontend:${clean}`;
          } catch (e) {
            // 跳过无效路径
          }
          return acc;
        }, {}),
        ...backendPaths.reduce((acc, p) => {
          try {
            const clean = p === '/' ? p : p.startsWith('/') ? p.substring(1) : p;
            acc[p] = `backend:${clean}`;
          } catch (e) {
            // 跳过无效路径
          }
          return acc;
        }, {})
      };
    } catch (e) {
      errorBoundaryRouteMap = {};
    }

    // 构建代码字符串，使用字符串拼接避免模板字符串插值问题
    let errorBoundaryRouteMapStr = '{}';
    let routeMapStr = '{}';
    try {
      errorBoundaryRouteMapStr = JSON.stringify(errorBoundaryRouteMap);
    } catch (e) {
      errorBoundaryRouteMapStr = '{}';
    }
    try {
      routeMapStr = JSON.stringify(routeMap);
    } catch (e) {
      routeMapStr = '{}';
    }
  
  // 简化的 getCurrentRouteName（移除 basePath 处理）
  const getCurrentRouteNameFuncCode = 'const getCurrentRouteName = function(currentUrl) {\n' +
    '  var normalizedPath = currentUrl;\n' +
    '  var cleanPath = normalizedPath;\n' +
    '  if (cleanPath.endsWith(\'/\') && cleanPath !== \'/\') {\n' +
    '    cleanPath = cleanPath.slice(0, -1);\n' +
    '  }\n' +
    '  var errorBoundaryRouteMap = ' + errorBoundaryRouteMapStr + ';\n' +
    '  if (errorBoundaryRouteMap[cleanPath]) {\n' +
    '    return errorBoundaryRouteMap[cleanPath];\n' +
    '  }\n' +
    '  return \'unknown\';\n' +
    '};';

  // 简化的 getCurrentComponentName（移除 basePath 处理）
  const getCurrentComponentNameFuncCode = 'const getCurrentComponentName = function() {\n' +
    '  var currentPath = typeof window !== \'undefined\' ? window.location.pathname : \'/\';\n' +
    '  var normalizedPath = currentPath;\n' +
    '  var cleanPath = normalizedPath;\n' +
    '  if (cleanPath.endsWith(\'/\') && cleanPath !== \'/\') {\n' +
    '    cleanPath = cleanPath.slice(0, -1);\n' +
    '  }\n' +
    '  var routeMap = ' + routeMapStr + ';\n' +
    '  return routeMap[cleanPath] || \'unknown\';\n' +
    '};';
  
    // 使用 template.statement 解析代码字符串
    let getCurrentRouteNameFunc, getCurrentComponentNameFunc;
    try {
      getCurrentRouteNameFunc = template.statement(getCurrentRouteNameFuncCode)();
      getCurrentComponentNameFunc = template.statement(getCurrentComponentNameFuncCode)();
    } catch (e) {
      // 如果 template.statement 失败，尝试使用 @babel/parser
      try {
        const { parse } = require('@babel/parser');
        const getCurrentRouteNameAst = parse(getCurrentRouteNameFuncCode, { sourceType: 'module' });
        getCurrentRouteNameFunc = getCurrentRouteNameAst.program.body[0];
        
        const getCurrentComponentNameAst = parse(getCurrentComponentNameFuncCode, { sourceType: 'module' });
        getCurrentComponentNameFunc = getCurrentComponentNameAst.program.body[0];
      } catch (parseError) {
        // 如果解析失败，静默返回，不中断构建
        return;
      }
    }

    // 查找 logData 对象表达式
    const init = varPath?.node?.init;
    if (!init || init.type !== 'ObjectExpression') {
      return;
    }
    
    // 检查是否已经存在相关属性（避免重复转换）
    let hasRouteName = false;
    let hasComponentName = false;
    let hasRouterComponentName = false;
    
    try {
      if (init.properties && Array.isArray(init.properties)) {
        hasRouteName = init.properties.some(prop => 
          prop?.type === 'ObjectProperty' && 
          prop.key && 
          (prop.key.name === 'routeName' || (prop.key.type === 'StringLiteral' && prop.key.value === 'routeName'))
        );
        
        hasComponentName = init.properties.some(prop => 
          prop?.type === 'ObjectProperty' && 
          prop.key && 
          (prop.key.name === 'componentName' || (prop.key.type === 'StringLiteral' && prop.key.value === 'componentName'))
        );
        
        hasRouterComponentName = init.properties.some(prop => 
          prop?.type === 'ObjectProperty' && 
          prop.key && 
          (prop.key.name === 'routerComponentName' || (prop.key.type === 'StringLiteral' && prop.key.value === 'routerComponentName'))
        );
      }
    } catch (e) {
      // 如果检查失败，继续处理
    }

    // 在 logData 定义之前插入路由匹配函数
    // 先查找包含 logData 的函数
    try {
      const containingFunction = parentPath || (varPath?.findParent ? varPath.findParent(p => 
        p?.isFunctionDeclaration?.() || p?.isArrowFunctionExpression?.() || p?.isFunctionExpression?.()
      ) : null);
      
      if (containingFunction && getCurrentRouteNameFunc && getCurrentComponentNameFunc) {
        // 在函数体的开始处插入路由匹配函数
        try {
          const funcBody = containingFunction.get('body');
          if (funcBody && funcBody.isBlockStatement && funcBody.isBlockStatement()) {
            const statements = funcBody.node?.body || [];
            // 检查是否已经插入了路由匹配函数
            const hasRouteFunction = statements.some(stmt => 
              stmt?.type === 'VariableDeclaration' && 
              stmt.declarations?.some(decl => decl?.id?.name === 'getCurrentRouteName')
            );
            if (!hasRouteFunction && typeof funcBody.unshiftContainer === 'function') {
              // 插入两个函数声明
              funcBody.unshiftContainer('body', [getCurrentRouteNameFunc, getCurrentComponentNameFunc]);
            }
          }
        } catch (e) {
          // 如果插入失败，继续处理其他部分
        }
      }
    } catch (e) {
      // 如果查找父函数失败，继续处理其他部分
    }

    // 查找 sourceLocation 属性的位置
    let sourceLocationIndex = -1;
    try {
      if (init.properties && Array.isArray(init.properties)) {
        init.properties.forEach((prop, index) => {
          try {
            if (prop?.type === 'ObjectProperty' && prop.key) {
              const keyName = prop.key.name || (prop.key.type === 'StringLiteral' && prop.key.value);
              if (keyName === 'sourceLocation') {
                sourceLocationIndex = index;
              }
            }
          } catch (e) {
            // 跳过无效属性
          }
        });
      }
    } catch (e) {
      // 如果查找失败，继续处理
    }

    // 添加 routerComponentName（在 sourceLocation 之后）
    try {
      if (!hasRouterComponentName && sourceLocationIndex >= 0 && init.properties && Array.isArray(init.properties)) {
        const routerComponentNameProp = t.objectProperty(
          t.identifier('routerComponentName'),
          template.expression`errorInfo.sourceLocation?.function || 'unknown'`()
        );
        // 在 sourceLocation 之后插入
        init.properties.splice(sourceLocationIndex + 1, 0, routerComponentNameProp);
      }
    } catch (e) {
      // 如果添加失败，继续处理
    }

    // 添加 routeName 和 componentName 属性（在最后）
    try {
      if (!hasRouteName && init.properties && Array.isArray(init.properties)) {
        init.properties.push(
          t.objectProperty(
            t.identifier('routeName'),
            template.expression`getCurrentRouteName(typeof window !== 'undefined' ? window.location.pathname : '/')`()
          )
        );
      }
    } catch (e) {
      // 如果添加失败，继续处理
    }
    
    try {
      if (!hasComponentName && init.properties && Array.isArray(init.properties)) {
        init.properties.push(
          t.objectProperty(
            t.identifier('componentName'),
            template.expression`getCurrentComponentName()`()
          )
        );
      }
    } catch (e) {
      // 如果添加失败，静默失败
    }
  } catch (e) {
    // 任何错误都静默处理，不中断构建
    return;
  }
}

