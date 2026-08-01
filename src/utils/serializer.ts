/**
 * 自定义序列化/反序列化工具
 * 替代 superjson，支持 Date、BigInt、Set、Map、undefined、NaN、Infinity、RegExp 等特殊类型
 */

// 特殊类型的标记
const TYPE_MARKERS = {
  DATE: '__DATE__',
  BIGINT: '__BIGINT__',
  SET: '__SET__',
  MAP: '__MAP__',
  UNDEFINED: '__UNDEFINED__',
  NAN: '__NAN__',
  INFINITY: '__INFINITY__',
  NEGATIVE_INFINITY: '__NEGATIVE_INFINITY__',
  REGEXP: '__REGEXP__',
} as const;

interface SerializedValue {
  json: any;
  meta?: {
    values?: Record<string, string>;
  };
}

/**
 * 序列化值，将特殊类型转换为 JSON 兼容格式
 */
function serializeValue(value: any, path: string = '', meta: Record<string, string> = {}): any {
  // 处理 null
  if (value === null) {
    return null;
  }

  // 处理 undefined
  if (value === undefined) {
    const metaKey = path || 'root';
    meta[metaKey] = TYPE_MARKERS.UNDEFINED;
    return null;
  }

  // 处理 Date
  if (value instanceof Date) {
    const metaKey = path || 'root';
    meta[metaKey] = TYPE_MARKERS.DATE;
    return value.toISOString();
  }

  // 处理 BigInt
  if (typeof value === 'bigint') {
    const metaKey = path || 'root';
    meta[metaKey] = TYPE_MARKERS.BIGINT;
    return value.toString();
  }

  // 处理 NaN
  if (Number.isNaN(value)) {
    const metaKey = path || 'root';
    meta[metaKey] = TYPE_MARKERS.NAN;
    return null;
  }

  // 处理 Infinity
  if (value === Infinity) {
    const metaKey = path || 'root';
    meta[metaKey] = TYPE_MARKERS.INFINITY;
    return null;
  }

  // 处理 -Infinity
  if (value === -Infinity) {
    const metaKey = path || 'root';
    meta[metaKey] = TYPE_MARKERS.NEGATIVE_INFINITY;
    return null;
  }

  // 处理 RegExp
  if (value instanceof RegExp) {
    const metaKey = path || 'root';
    meta[metaKey] = TYPE_MARKERS.REGEXP;
    return {
      source: value.source,
      flags: value.flags,
    };
  }

  // 处理 Set
  if (value instanceof Set) {
    const metaKey = path || 'root';
    meta[metaKey] = TYPE_MARKERS.SET;
    const items: any[] = [];
    let index = 0;
    value.forEach((item) => {
      const itemPath = path ? `${path}.${index}` : String(index);
      items.push(serializeValue(item, itemPath, meta));
      index++;
    });
    return items;
  }

  // 处理 Map
  if (value instanceof Map) {
    const metaKey = path || 'root';
    meta[metaKey] = TYPE_MARKERS.MAP;
    const entries: [any, any][] = [];
    let index = 0;
    value.forEach((val, key) => {
      const keyPath = path ? `${path}.k${index}` : `k${index}`;
      const valPath = path ? `${path}.v${index}` : `v${index}`;
      entries.push([
        serializeValue(key, keyPath, meta),
        serializeValue(val, valPath, meta),
      ]);
      index++;
    });
    return entries;
  }

  // 处理数组
  if (Array.isArray(value)) {
    return value.map((item, index) => {
      const itemPath = path ? `${path}.${index}` : String(index);
      return serializeValue(item, itemPath, meta);
    });
  }

  // 处理对象
  if (typeof value === 'object') {
    const result: Record<string, any> = {};
    for (const key in value) {
      if (Object.prototype.hasOwnProperty.call(value, key)) {
        const propPath = path ? `${path}.${key}` : key;
        result[key] = serializeValue(value[key], propPath, meta);
      }
    }
    return result;
  }

  // 基本类型直接返回
  return value;
}

/**
 * 反序列化值，将 JSON 格式恢复为特殊类型
 */
function deserializeValue(value: any, path: string = '', meta: Record<string, string> = {}): any {
  const metaKey = path || 'root';
  const typeMarker = meta[metaKey];

  // 根据类型标记恢复特殊类型
  if (typeMarker === TYPE_MARKERS.DATE) {
    return new Date(value);
  }

  if (typeMarker === TYPE_MARKERS.BIGINT) {
    return BigInt(value);
  }

  if (typeMarker === TYPE_MARKERS.UNDEFINED) {
    return undefined;
  }

  if (typeMarker === TYPE_MARKERS.NAN) {
    return NaN;
  }

  if (typeMarker === TYPE_MARKERS.INFINITY) {
    return Infinity;
  }

  if (typeMarker === TYPE_MARKERS.NEGATIVE_INFINITY) {
    return -Infinity;
  }

  if (typeMarker === TYPE_MARKERS.REGEXP) {
    return new RegExp(value.source, value.flags);
  }

  if (typeMarker === TYPE_MARKERS.SET) {
    if (!Array.isArray(value)) {
      return new Set();
    }
    const set = new Set();
    value.forEach((item: any, index: number) => {
      const itemPath = path ? `${path}.${index}` : String(index);
      set.add(deserializeValue(item, itemPath, meta));
    });
    return set;
  }

  if (typeMarker === TYPE_MARKERS.MAP) {
    if (!Array.isArray(value)) {
      return new Map();
    }
    const map = new Map();
    value.forEach((entry: [any, any], index: number) => {
      const keyPath = path ? `${path}.k${index}` : `k${index}`;
      const valPath = path ? `${path}.v${index}` : `v${index}`;
      const key = deserializeValue(entry[0], keyPath, meta);
      const val = deserializeValue(entry[1], valPath, meta);
      map.set(key, val);
    });
    return map;
  }

  // 处理数组
  if (Array.isArray(value)) {
    return value.map((item, index) => {
      const itemPath = path ? `${path}.${index}` : String(index);
      return deserializeValue(item, itemPath, meta);
    });
  }

  // 处理对象
  if (value !== null && typeof value === 'object') {
    const result: Record<string, any> = {};
    for (const key in value) {
      if (Object.prototype.hasOwnProperty.call(value, key)) {
        const propPath = path ? `${path}.${key}` : key;
        result[key] = deserializeValue(value[key], propPath, meta);
      }
    }
    return result;
  }

  // 基本类型直接返回
  return value;
}

/**
 * 序列化对象，返回 { json, meta } 格式
 */
export function serialize(value: any): SerializedValue {
  const meta: Record<string, string> = {};
  const json = serializeValue(value, '', meta);

  return {
    json,
    meta: Object.keys(meta).length > 0 ? { values: meta } : undefined,
  };
}

/**
 * 反序列化对象，从 { json, meta } 格式恢复
 */
export function deserialize<T = any>(serialized: SerializedValue | any): T {
  // 处理 null、undefined 或基本类型
  if (serialized === null || serialized === undefined || typeof serialized !== 'object') {
    return serialized as T;
  }

  // 如果已经是序列化后的格式（有 json 字段）
  if ('json' in serialized) {
    const { json, meta } = serialized as SerializedValue;
    const metaValues = meta?.values || {};
    return deserializeValue(json, '', metaValues) as T;
  }

  // 如果传入的是普通对象（可能是数组或其他对象），尝试递归反序列化
  // 这种情况可能是从 JSON.parse 得到的，但没有包装成 { json, meta } 格式
  // 为了兼容性，我们尝试递归处理
  return deserializeValue(serialized, '', {}) as T;
}

/**
 * 默认导出，提供与 superjson 兼容的 API
 */
const serializer = {
  serialize,
  deserialize,
};

export default serializer;
