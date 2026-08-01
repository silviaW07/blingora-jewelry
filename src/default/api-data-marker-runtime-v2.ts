/* eslint-disable no-console */
const API_SERVICE_NAME_ATTR = 'data-api-service-name';
const API_KEY_ATTR = 'data-api-key';
const SERVICE_NAME_PREFIX = 'entities';
const DEBUG_LOCAL_STORAGE_KEY = 'api-data-marker-debug';

let debugEnabled = false;

type Primitive = string | number | boolean | null;

interface RequestContext {
  url: string;
  method: string;
  entityName?: string;
}

interface DataFieldMetadata {
  path: string;
  recordKey?: string | number;
  url: string;
  method: string;
  entityName?: string;
  fieldName?: string;
  dataApiServiceName: string;
}

interface TraversalContext {
  path: string[];
  recordKey?: string | number;
}

type IndexedValue = string;

const valueIndex = new Map<IndexedValue, DataFieldMetadata[]>();
// 缓存已排序的元数据，减少重复计算
const sortedMetadataCache = new Map<IndexedValue, DataFieldMetadata[]>();
// 记录每个 API 调用的时间戳，用于匹配时优先选择最近的
const apiCallTimestamps = new Map<string, number>();
let annotationScheduled = false;
let annotationTimer: ReturnType<typeof setTimeout> | null = null;
// 索引最大容量，防止内存占用过大
const MAX_INDEX_SIZE = 10000;
const MAX_ENTRIES_PER_VALUE = 50;
const scheduleMicrotask =
  typeof queueMicrotask === 'function'
    ? queueMicrotask
    : (cb: () => void) => {
        Promise.resolve()
          .then(cb)
          .catch((error) => {
            console.error('[api-data-marker] Failed to execute microtask', error);
          });
      };

function resolveDebugEnabled(): boolean {
  try {
    const globalFlag =
      typeof window !== 'undefined' && (window as any).__API_DATA_MARKER_DEBUG__;
    const localFlag =
      typeof window !== 'undefined' &&
      window.localStorage &&
      window.localStorage.getItem(DEBUG_LOCAL_STORAGE_KEY);
    const searchFlag =
      typeof window !== 'undefined' &&
      typeof window.location !== 'undefined' &&
      new URLSearchParams(window.location.search).get('apiDataDebug');

    return Boolean(
      globalFlag ||
        (typeof localFlag === 'string' && localFlag !== '0' && localFlag.toLowerCase() !== 'false') ||
        (typeof searchFlag === 'string' &&
          searchFlag !== '0' &&
          searchFlag.toLowerCase() !== 'false')
    );
  } catch {
    return false;
  }
}

function debugLog(message: string, payload?: unknown) {
  if (!debugEnabled) return;
  if (payload === undefined) {
    console.log(`[api-data-marker][debug] ${message}`);
  } else {
    console.log(`[api-data-marker][debug] ${message}`, payload);
  }
}

declare global {
  interface Window {
    __API_DATA_MARKER_ACTIVE__?: boolean;
    __API_DATA_MARKER_FETCH_WRAPPED__?: boolean;
    __API_DATA_MARKER_ORIGINAL_FETCH__?: typeof fetch;
    __API_DATA_MARKER_DEBUG__?: boolean;
    toggleApiDataMarkerDebug?: (enabled: boolean) => void;
      apiDataMarker?: {
      isActive: () => boolean;
      isDebugEnabled: () => boolean;
      enableDebug: () => void;
      disableDebug: () => void;
      getIndexSnapshot: () => Array<{ value: string; entries: DataFieldMetadata[] }>;
      getEntriesForValue: (value: string) => DataFieldMetadata[];
      clearSortCache: () => void;
      getIndexStats: () => { totalValues: number; totalEntries: number; cacheSize: number };
    };
  }
}

let originalFetchRef: typeof fetch | null = null;

function normalizeValue(value: Primitive): IndexedValue | null {
  if (value === null || value === undefined) return null;
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  if (typeof value === 'number') return String(value);
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return null;
    if (trimmed.length > 512) return null;
    return trimmed;
  }
  return null;
}

function formatPath(path: string[]): string {
  return path
    .map((segment, index) => {
      if (segment.startsWith('[')) {
        return segment;
      }
      return index === 0 ? segment : `.${segment}`;
    })
    .join('');
}

function normalizeServiceNamePart(value?: string | number | null): string {
  if (value === undefined || value === null) {
    return 'unknown';
  }
  const normalized = String(value)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  return normalized || 'unknown';
}

function buildServiceName(entityName?: string, fieldName?: string): string {
  const entityPart = normalizeServiceNamePart(entityName);
  const fieldPart = normalizeServiceNamePart(fieldName);
  return `${SERVICE_NAME_PREFIX}-${entityPart}-${fieldPart}`;
}

function isCurrentServiceName(value: string | null): boolean {
  return Boolean(value && value.startsWith(`${SERVICE_NAME_PREFIX}-`));
}

function extractFieldName(pathSegments: string[]): string | undefined {
  for (let i = pathSegments.length - 1; i >= 0; i--) {
    const segment = pathSegments[i];
    if (!segment || segment.startsWith('[')) {
      continue;
    }
    if (segment === 'data' && i === 0) {
      continue;
    }
    return segment;
  }
  return undefined;
}

function hasCurrentMarker(el: HTMLElement): boolean {
  return isCurrentServiceName(el.getAttribute(API_SERVICE_NAME_ATTR));
}

function clearLegacyAttributes(el: HTMLElement) {
  let removed = false;
  const serviceAttrValue = el.getAttribute(API_SERVICE_NAME_ATTR);
  const hasValidService = isCurrentServiceName(serviceAttrValue);

  for (const attribute of Array.from(el.attributes)) {
    if (!attribute.name.startsWith('data-api-')) continue;

    if (attribute.name === API_SERVICE_NAME_ATTR) {
      if (!isCurrentServiceName(attribute.value)) {
        el.removeAttribute(attribute.name);
        removed = true;
      }
      continue;
    }

    if (attribute.name === API_KEY_ATTR && hasValidService) {
      continue;
    }

    // 保留 unique-id 相关属性和 in-loop 属性
if (attribute.name === 'data-api-unique-id' ||
    attribute.name === 'data-api-unique-page-name' ||
    attribute.name === 'data-api-bind-info' ||
    attribute.name === 'data-api-map-var-name' ||
    attribute.name === 'data-api-exclude-tracking' ||
    attribute.name === 'data-api-in-loop') {  // ⬅️ 添加这一行
  continue;
}

    el.removeAttribute(attribute.name);
    removed = true;
  }

  if (removed) {
    debugLog('clearLegacyAttributes: removed old markers', {
      tagName: el.tagName,
    });
  }
}

function isWithinGridLayout(el: HTMLElement): boolean {
  if (typeof window === 'undefined' || typeof window.getComputedStyle !== 'function') {
    return false;
  }

  let current: HTMLElement | null = el;
  while (current) {
    const display = window.getComputedStyle(current).display;
    if (display === 'grid' || display === 'inline-grid') {
      return true;
    }
    current = current.parentElement;
  }

  return false;
}

function ensureGridImageTag(el: HTMLImageElement): boolean {
  if (!isWithinGridLayout(el)) {
    return false;
  }

  if (hasCurrentMarker(el)) {
    return true;
  }

  clearLegacyAttributes(el);
  const fallbackServiceName = buildServiceName('grid', 'image');
  el.setAttribute(API_SERVICE_NAME_ATTR, fallbackServiceName);

  debugLog('ensureGridImageTag: forced tag for grid image', {
    tagName: el.tagName,
    src: el.currentSrc || el.getAttribute('src') || undefined,
  });

  return true;
}

// 清理索引，保持大小在限制范围内
function cleanupIndex() {
  if (valueIndex.size <= MAX_INDEX_SIZE) return;

  // 按使用频率排序，删除使用最少的条目
  const entries = Array.from(valueIndex.entries());
  entries.sort((a, b) => a[1].length - b[1].length);

  const toRemove = entries.slice(0, entries.length - MAX_INDEX_SIZE);
  toRemove.forEach(([key]) => {
    valueIndex.delete(key);
    sortedMetadataCache.delete(key);
  });

  debugLog('cleanupIndex: removed old entries', { removed: toRemove.length });
}

// 将接口数据值作为 key，存储对应的接口元信息
function registerValue(rawValue: Primitive, ctx: TraversalContext, request: RequestContext) {
  const normalized = normalizeValue(rawValue);
  if (!normalized) return;

  const pathString = formatPath(ctx.path);
  if (!pathString) return;

  const fieldName = extractFieldName(ctx.path);
  const dataApiServiceName = buildServiceName(request.entityName, fieldName);

  // 记录 API 调用时间
  const apiKey = `${request.url}:${request.method}`;
  const timestamp = Date.now();
  apiCallTimestamps.set(apiKey, timestamp);

  const metadata: DataFieldMetadata = {
    path: pathString,
    recordKey: ctx.recordKey,
    url: request.url,
    method: request.method,
    entityName: request.entityName,
    fieldName,
    dataApiServiceName,
  };

  // 辅助函数 - 注册单个值到索引，图片列表是用｜分隔的数据
  const registerMetadata = (value: string, isPartOfList: boolean = false) => {
    const existing = valueIndex.get(value) || [];
    
    // 限制每个值的条目数,超出时删除最旧的
    if (existing.length >= MAX_ENTRIES_PER_VALUE) {
      existing.shift();
    }
    
    existing.push(metadata);
    valueIndex.set(value, existing);
    
    // 清除该值的排序缓存
    sortedMetadataCache.delete(value);

    if (isPartOfList) {
      debugLog('registerValue: indexed split part', {
        part: value.slice(0, 120),
        originalValue: normalized.slice(0, 120),
        path: metadata.path,
        url: metadata.url,
      });
    }
  };

  // 索引原始完整值
  registerMetadata(normalized);

  // 如果值包含 "|",也索引每个分割部分
  if (normalized.includes('|')) {
    const parts = normalized.split('|').map(part => part.trim()).filter(Boolean);
    
    // 只处理 URL 列表的情况
    const looksLikeUrlList = parts.some(part => 
      part.startsWith('http://') || 
      part.startsWith('https://') 
    );
    
    // 或者部分数量合理(不是超长文本)
    if (looksLikeUrlList || (parts.length >= 2 && parts.length <= 10)) {
      parts.forEach(part => {
        const partNormalized = normalizeValue(part);
        if (partNormalized && partNormalized.length >= 2) {
          registerMetadata(partNormalized, true);
        }
      });
    }
  }

  // 索引过大时清理
  if (valueIndex.size > MAX_INDEX_SIZE) {
    cleanupIndex();
  }

  debugLog('registerValue: indexed value', {
    value: normalized.slice(0, 120),
    path: metadata.path,
    url: metadata.url,
    recordKey: metadata.recordKey,
    entity: metadata.entityName,
    field: metadata.fieldName,
  });
}

function traverseData(
  value: unknown,
  ctx: TraversalContext,
  request: RequestContext,
  seen: WeakSet<object>
) {
  if (value === null || value === undefined) {
    return;
  }

  const valueType = typeof value;

  if (valueType === 'string' || valueType === 'number' || valueType === 'boolean') {
    registerValue(value as Primitive, ctx, request);
    return;
  }

  if (Array.isArray(value)) {
    value.forEach((item, index) => {
      traverseData(
        item,
        {
          path: [...ctx.path, `[${index}]`],
          recordKey: ctx.recordKey,
        },
        request,
        seen
      );
    });
    return;
  }

  if (valueType === 'object') {
    const objectValue = value as Record<string, unknown>;

    if (seen.has(objectValue)) {
      return;
    }
    seen.add(objectValue);

    const potentialKey =
      typeof objectValue.id === 'string' ||
      typeof objectValue.id === 'number'
        ? objectValue.id
        : typeof objectValue.key === 'string' || typeof objectValue.key === 'number'
          ? objectValue.key
          : undefined;

    Object.entries(objectValue).forEach(([key, childValue]) => {
      traverseData(
        childValue,
        {
          path: [...ctx.path, key],
          recordKey: potentialKey ?? ctx.recordKey,
        },
        request,
        seen
      );
    });
  }
}

function processApiResponse(payload: unknown, request: RequestContext) {
  if (payload === null || payload === undefined) return;

  const seen = new WeakSet<object>();

  debugLog('processApiResponse: payload received', {
    url: request.url,
    method: request.method,
  });

  const hasDataWrapper =
    typeof payload === 'object' && payload !== null && 'data' in (payload as Record<string, unknown>);
  const payloadRecord = hasDataWrapper ? (payload as Record<string, unknown>) : null;

  if (hasDataWrapper) {
    const innerData = payloadRecord ? (payloadRecord as any).data : undefined;
    traverseData(
      innerData,
      {
        path: ['data'],
      },
      request,
      seen
    );
  } else {
    traverseData(
      payload,
      {
        path: [],
      },
      request,
      seen
    );
  }

  scheduleAnnotation();
}

// 获取 API 调用时间戳
function getApiTimestamp(metadata: DataFieldMetadata): number {
  const apiKey = `${metadata.url}:${metadata.method}`;
  return apiCallTimestamps.get(apiKey) || 0;
}

// 计算匹配分数，用于在多个候选值中选择最合适的
function calculateMatchScore(metadata: DataFieldMetadata): number {
  let score = 0;

  // 路径深度，越深越精确
  const pathDepth = metadata.path.split('.').length;
  score += pathDepth * 100;

  // 优先选择最近的 API 调用
  const timestamp = getApiTimestamp(metadata);
  if (timestamp > 0) {
    const timeDiff = Date.now() - timestamp;
    // 5分钟内的调用有额外加分
    if (timeDiff < 5 * 60 * 1000) {
      score += Math.max(0, 500 - timeDiff / 1000);
    }
  }
  return score;
}

function getMetadataForValue(value: string): DataFieldMetadata | null {
  const candidates = valueIndex.get(value);
  if (!candidates || candidates.length === 0) return null;

  // 只有一个候选时直接返回
  if (candidates.length === 1) {
    return candidates[0];
  }

  // 先查缓存
  let sorted = sortedMetadataCache.get(value);
  if (!sorted) {
    // 按匹配分数排序
    sorted = [...candidates].sort((a, b) => {
      const scoreA = calculateMatchScore(a);
      const scoreB = calculateMatchScore(b);
      
      if (scoreB !== scoreA) {
        return scoreB - scoreA;
      }
      
      // 分数相同时按路径深度排序
      const aDetail = a.path.split('.').length;
      const bDetail = b.path.split('.').length;
      return bDetail - aDetail;
    });

    sortedMetadataCache.set(value, sorted);
  }

  return sorted[0];
}

function applyMetadataToElement(el: HTMLElement, metadata: DataFieldMetadata) {
  if (hasCurrentMarker(el)) return;

  clearLegacyAttributes(el);
  const serviceName =
    metadata.dataApiServiceName || buildServiceName(metadata.entityName, metadata.fieldName);
  el.setAttribute(API_SERVICE_NAME_ATTR, serviceName);
  if (metadata.recordKey !== undefined) {
    el.setAttribute(API_KEY_ATTR, String(metadata.recordKey));
  }

  debugLog('applyMetadataToElement: element tagged', {
    tagName: el.tagName,
    text: el.textContent ? el.textContent.slice(0, 80) : undefined,
    metadata,
  });
}

function annotateTextElement(el: HTMLElement) {
  if (el.children.length > 0) return;

  const textContent = el.textContent?.trim();
  if (!textContent) return;
  if (textContent.length < 2) return;

  const metadata = getMetadataForValue(textContent);
  if (!metadata) {
    debugLog('annotateTextElement: no metadata match', {
      text: textContent.slice(0, 120),
      tagName: el.tagName,
    });
    return;
  }

  applyMetadataToElement(el, metadata);
}

function annotateImageElement(el: HTMLElement) {
  if (!(el instanceof HTMLImageElement)) return;

  // 如果已经有 exclude 标记,直接跳过，不需要标注
  if (el.getAttribute('data-api-exclude-tracking') === 'true') {
    debugLog('annotateImageElement: already excluded from tracking', { 
      src: el.currentSrc || el.getAttribute('src') || '' 
    });
    return;
  }

  // 如果已经有 service name 标记,说明已经标注过了,跳过
  if (hasCurrentMarker(el)) {
    debugLog('annotateImageElement: already has service name', { 
      serviceName: el.getAttribute(API_SERVICE_NAME_ATTR) 
    });
    return;
  }

  // 获取图片 src
  const src = el.currentSrc || el.getAttribute('src') || '';
  const normalized = normalizeValue(src);
  
  if (!normalized) {
    // src 无效,标记为排除
    el.setAttribute('data-api-exclude-tracking', 'false');
    debugLog('annotateImageElement: invalid src, marked as excluded', { src });
    return;
  }

  // 尝试查找精确匹配
  const metadata = getMetadataForValue(normalized);
  
  if (metadata) {
    // ✅ 找到精确匹配 - 标注 service name
    applyMetadataToElement(el, metadata);
    debugLog('annotateImageElement: exact match found, tagged', { 
      src: normalized.slice(0, 120),
      serviceName: metadata.dataApiServiceName,
      path: metadata.path,
    });
  } else {
    // ❌ 未找到匹配 - 标记为排除
    el.setAttribute('data-api-exclude-tracking', 'false');
    debugLog('annotateImageElement: no match found, marked as excluded', { 
      src: normalized.slice(0, 120) 
    });
  }
}

function annotateElement(el: HTMLElement) {
  clearLegacyAttributes(el);

  if (hasCurrentMarker(el)) {
    debugLog('annotateElement: already tagged', {
      tagName: el.tagName,
    });
    return;
  }
  annotateImageElement(el);
  annotateTextElement(el);
}

// 每批处理的元素数量
const BATCH_SIZE = 50;
// 批次间延迟时间
const BATCH_DELAY_MS = 0;

function walkAndAnnotate(root: ParentNode) {
  const treeWalker = document.createTreeWalker(
    root,
    NodeFilter.SHOW_ELEMENT,
    {
      acceptNode: (node) => {
        if (!(node instanceof HTMLElement)) return NodeFilter.FILTER_REJECT;
        return hasCurrentMarker(node) ? NodeFilter.FILTER_SKIP : NodeFilter.FILTER_ACCEPT;
      },
    },
  );

  // 批量处理，避免阻塞主线程
  function processBatch() {
    let processed = 0;
    let current = treeWalker.currentNode as HTMLElement | null;
    
    // 移动到第一个节点
    if (!current || current === root) {
      current = treeWalker.nextNode() as HTMLElement | null;
    }

    while (current && processed < BATCH_SIZE) {
      annotateElement(current);
      current = treeWalker.nextNode() as HTMLElement | null;
      processed++;
    }

    // 还有节点时继续处理
    if (current) {
      if (typeof requestIdleCallback !== 'undefined') {
        requestIdleCallback(processBatch, { timeout: 1000 });
      } else {
        setTimeout(processBatch, BATCH_DELAY_MS);
      }
    }
  }

  processBatch();
}

function annotateFromMutation(mutation: MutationRecord) {
  if (mutation.type === 'childList') {
    mutation.addedNodes.forEach((node) => {
      if (node instanceof HTMLElement) {
        annotateElement(node);
        walkAndAnnotate(node);
        debugLog('annotateFromMutation: HTMLElement added', {
          tagName: node.tagName,
          id: node.id,
          className: node.className,
        });
      } else if (node instanceof Text && node.parentElement) {
        annotateElement(node.parentElement);
        debugLog('annotateFromMutation: Text node added', {
          parentTag: node.parentElement.tagName,
        });
      }
    });
  } else if (mutation.type === 'characterData') {
    const parent = mutation.target.parentElement;
    if (parent) {
      annotateElement(parent);
      debugLog('annotateFromMutation: characterData changed', {
        parentTag: parent.tagName,
        snippet: parent.textContent ? parent.textContent.slice(0, 80) : '',
      });
    }
  } else if (mutation.type === 'attributes' && mutation.target instanceof HTMLElement) {
    annotateElement(mutation.target);
    debugLog('annotateFromMutation: attribute changed', {
      tagName: mutation.target.tagName,
      attributeName: mutation.attributeName,
    });
  }
}

// DOM 变更批量处理
let mutationBatchTimer: ReturnType<typeof setTimeout> | null = null;
const MUTATION_BATCH_DELAY_MS = 150;
const pendingMutations: MutationRecord[] = [];

function observeDomForChanges() {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  debugLog('observeDomForChanges: MutationObserver attached');

  const observer = new MutationObserver((mutations) => {
    // 添加到待处理队列
    pendingMutations.push(...mutations);

    // 清除之前的定时器
    if (mutationBatchTimer) {
      clearTimeout(mutationBatchTimer);
    }

    // 延迟批量处理，避免频繁触发
    mutationBatchTimer = setTimeout(() => {
      // 去重处理
      const uniqueTargets = new Set<Node>();
      pendingMutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach((node) => {
            if (node instanceof HTMLElement || (node instanceof Text && node.parentElement)) {
              uniqueTargets.add(node instanceof HTMLElement ? node : node.parentElement!);
            }
          });
        } else if (mutation.target instanceof HTMLElement) {
          uniqueTargets.add(mutation.target);
        }
      });

      // 处理所有待处理的变更
      pendingMutations.forEach((mutation) => annotateFromMutation(mutation));
      
      // 清空队列
      pendingMutations.length = 0;
      mutationBatchTimer = null;

      // 触发完整扫描
      scheduleAnnotation();
    }, MUTATION_BATCH_DELAY_MS);
  });

  observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
    characterData: true,
    attributes: true,
    attributeFilter: ['src', 'href', 'value', 'text', 'content'],
  });

  document.addEventListener('DOMContentLoaded', () => {
    scheduleAnnotation();
  });
}

// 防抖延迟时间
const ANNOTATION_DEBOUNCE_MS = 100;

function scheduleAnnotation() {
  // 清除之前的定时器
  if (annotationTimer) {
    clearTimeout(annotationTimer);
    annotationTimer = null;
  }

  // 已调度则跳过
  if (annotationScheduled) return;
  
  annotationScheduled = true;
  debugLog('scheduleAnnotation: queued microtask');

  // 防抖处理
  annotationTimer = setTimeout(() => {
    annotationScheduled = false;
    annotationTimer = null;
    
    if (typeof document !== 'undefined' && document.body) {
      walkAndAnnotate(document.body);
      debugLog('scheduleAnnotation: running annotation sweep');
    }
  }, ANNOTATION_DEBOUNCE_MS);
}

function parseRequestBody(body: BodyInit | null | undefined) {
  if (!body) return null;

  if (typeof body === 'string') {
    try {
      return JSON.parse(body);
    } catch {
      return null;
    }
  }

  if (body instanceof URLSearchParams) {
    const params = Object.fromEntries(body.entries());
    return params;
  }

  if (body instanceof FormData) {
    const params: Record<string, unknown> = {};
    body.forEach((value, key) => {
      params[key] = value;
    });
    return params;
  }

  return null;
}

interface BodyDetails {
  entityName?: string;
}

function extractBodyDetails(bodyPayload: unknown): BodyDetails {
  if (!bodyPayload || typeof bodyPayload !== 'object') {
    return {};
  }

  const payloadRecord = bodyPayload as Record<string, unknown>;
  const entityName =
    typeof payloadRecord.entity === 'string' ? payloadRecord.entity : undefined;

  return { entityName };
}

function extractRequestContext(input: RequestInfo | URL, init?: RequestInit): RequestContext {
  if (input instanceof Request) {
    const method = (input.method || init?.method || 'GET').toUpperCase();
    const parsedBody = parseRequestBody(init?.body ?? null);
    const details = extractBodyDetails(parsedBody);
    return {
      url: input.url,
      method,
      entityName: details.entityName,
    };
  }

  const url = typeof input === 'string' ? input : input.toString();
  const method = init?.method ? init.method.toUpperCase() : 'GET';
  const bodyPayload = parseRequestBody(init?.body ?? null);
  const details = extractBodyDetails(bodyPayload);
  return {
    url,
    method,
    entityName: details.entityName,
  };
}

function wrapFetch() {
  if (typeof window === 'undefined' || typeof window.fetch !== 'function') return;

  debugLog('wrapFetch: overriding global fetch');

  const originalFetch = window.fetch.bind(window);
  originalFetchRef = originalFetch;

  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const requestContext = extractRequestContext(input, init);

    debugLog('fetch: request started', requestContext);

    try {
      const response = await originalFetch(input, init);

      try {
        const cloned = response.clone();
        cloned
          .json()
          .then((payload) => {
            processApiResponse(payload, requestContext);
          })
          .catch(() => {
            // 忽略非 JSON 响应
            debugLog('fetch: response not JSON', {
              url: requestContext.url,
              method: requestContext.method,
            });
          });
      } catch (cloneError) {
        console.warn('[api-data-marker] Failed to inspect response', cloneError);
        debugLog('fetch: failed to clone response', {
          url: requestContext.url,
          error: cloneError,
        });
      }

      return response;
    } catch (fetchError) {
      debugLog('fetch: request threw error', {
        url: requestContext.url,
        error: fetchError,
      });
      throw fetchError;
    }
  };

  window.__API_DATA_MARKER_FETCH_WRAPPED__ = true;
  window.__API_DATA_MARKER_ORIGINAL_FETCH__ = originalFetch;
}

function cloneMetadata(metadata: DataFieldMetadata): DataFieldMetadata {
  return { ...metadata };
}

function getIndexSnapshot(): Array<{ value: string; entries: DataFieldMetadata[] }> {
  return Array.from(valueIndex.entries()).map(([value, entries]) => ({
    value,
    entries: entries.map((entry) => cloneMetadata(entry)),
  }));
}

function installGlobalIntrospection() {
  if (typeof window === 'undefined') return;

  const api = {
    isActive: () => true,
    isDebugEnabled: () => debugEnabled,
    enableDebug: () => {
      window.toggleApiDataMarkerDebug?.(true);
    },
    disableDebug: () => {
      window.toggleApiDataMarkerDebug?.(false);
    },
    getIndexSnapshot: () => getIndexSnapshot(),
    getEntriesForValue: (value: string) => {
      const entries = valueIndex.get(value);
      return entries ? entries.map((entry) => cloneMetadata(entry)) : [];
    },
    clearSortCache: () => {
      clearSortCache();
    },
    getIndexStats: () => {
      let totalEntries = 0;
      valueIndex.forEach((entries) => {
        totalEntries += entries.length;
      });
      return {
        totalValues: valueIndex.size,
        totalEntries,
        cacheSize: sortedMetadataCache.size,
      };
    },
  };

  window.__API_DATA_MARKER_ACTIVE__ = true;
  window.apiDataMarker = api;

  if (!window.toggleApiDataMarkerDebug) {
    window.toggleApiDataMarkerDebug = (enabled: boolean) => {
      try {
        if (enabled) {
          window.localStorage?.setItem(DEBUG_LOCAL_STORAGE_KEY, '1');
        } else {
          window.localStorage?.removeItem(DEBUG_LOCAL_STORAGE_KEY);
        }
      } catch (error) {
        console.warn('[api-data-marker] Failed to toggle debug flag', error);
      }
      debugEnabled = resolveDebugEnabled();
      debugLog('toggleApiDataMarkerDebug: debug flag updated', { debugEnabled });
    };
  }
}

// 清除排序缓存，页面切换时重新计算
function clearSortCache() {
  sortedMetadataCache.clear();
  debugLog('clearSortCache: cleared sorted metadata cache');
}

function bootstrap() {
  debugEnabled = resolveDebugEnabled();
  debugLog('bootstrap: starting runtime', { debugEnabled });

  if (typeof window !== 'undefined') {
    window.addEventListener('storage', (event) => {
      if (event.key === DEBUG_LOCAL_STORAGE_KEY) {
        debugEnabled = resolveDebugEnabled();
        debugLog('storage event: debug flag changed', { debugEnabled });
      }
    });

    // 监听页面路由变化
    let lastPathname = window.location.pathname;
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;

    history.pushState = function(...args) {
      originalPushState.apply(history, args);
      const newPathname = window.location.pathname;
      if (newPathname !== lastPathname) {
        lastPathname = newPathname;
        clearSortCache();
        debugLog('bootstrap: pathname changed, cleared cache', { newPathname });
      }
    };

    history.replaceState = function(...args) {
      originalReplaceState.apply(history, args);
      const newPathname = window.location.pathname;
      if (newPathname !== lastPathname) {
        lastPathname = newPathname;
        clearSortCache();
        debugLog('bootstrap: pathname changed, cleared cache', { newPathname });
      }
    };

    // 监听浏览器前进后退
    window.addEventListener('popstate', () => {
      const newPathname = window.location.pathname;
      if (newPathname !== lastPathname) {
        lastPathname = newPathname;
        clearSortCache();
        debugLog('bootstrap: pathname changed via popstate, cleared cache', { newPathname });
      }
    });
  }

  wrapFetch();
  installGlobalIntrospection();
  observeDomForChanges();
  scheduleAnnotation();
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootstrap, { once: true });
  } else {
    bootstrap();
  }
}

export {};
