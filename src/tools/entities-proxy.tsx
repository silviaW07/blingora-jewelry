import type {Entities} from "../../server/entities.type"
import { toast } from "sonner";

// frontend/src/entities-proxy.ts
type EntityMethod = {
  [key: string]: (...args: any[]) => Promise<any>;
};

class EntitiesProxy {
  private baseUrl: string;

  // constructor(baseUrl: string = "" +"/BACKEND_PROJ_fcb9e6ee_snap_20260726_092922_893_snap_20260726_092922_893"+"/api/entities") {
  //   this.baseUrl = baseUrl;
  // }
  constructor(
    baseUrl: string = '' +
      '/backendcommon/api/zaki/PROJ_fcb9e6ee_snap_20260726_092922_893_snap_20260726_092922_893' +
      '/entities-handler'
  ) {
    const dynamicBase = process.env.NEXT_PUBLIC_BASE_PATH;
    this.baseUrl =
        // 不要改任何格式！！影响本地启动
      (dynamicBase
        ? '' +
          '/backendcommon/api/zaki/' +
          dynamicBase +
          '/entities-handler'
        : '' +
          '/backendcommon/api/zaki/PROJ_fcb9e6ee_snap_20260726_092922_893_snap_20260726_092922_893/entities-handler');
  }

  public getProxy(): Entities {
    return new Proxy({} as Entities, {
      get: (_, entity: keyof Entities) => {
        return this.createEntityProxy(entity.toString());
      }
    });
  }

  private createEntityProxy(entity: string): EntityMethod {
    return new Proxy({} as EntityMethod, {
      get: (_, method: string) => {
        return (...args: any[]) => this.executeRequest(entity, method, args);
      }
    });
  }

  private serializeData(data: any): any {
    if (typeof data === "bigint") {
      // 处理 bigint
      return { __type: "BigInt", value: data.toString() };
    }

    if (data instanceof Date) {
      console.log('serializeData' + data);
      // 增强的时间处理逻辑
      // 保留原始的 ISO 字符串格式，同时添加时区偏移信息
      const offset = -data.getTimezoneOffset(); // 单位：分钟
      const localTime = new Date(data.getTime() + offset * 60 * 1000);
      const isoWithOffset = localTime.toISOString().replace('Z', this.formatOffset(offset));

      return {
        __type: 'Date',
        value: data.toISOString(), // 保持原始格式兼容性
        localValue: isoWithOffset, // 新增带时区的格式
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone, // 时区信息
        offset: offset // 时区偏移（分钟）
      };
    }

    if (Array.isArray(data)) {
      return data.map((a) => this.serializeData(a));
    }

    if (data && typeof data === 'object') {
      return Object.fromEntries(
        Object.entries(data).map(([k, v]) => [k, this.serializeData(v)])
      );
    }

    return data;
  }

  // 辅助函数：格式化时区偏移，如 +08:00
  private formatOffset(offsetMinutes: number): string {
    const sign = offsetMinutes >= 0 ? '+' : '-';
    const abs = Math.abs(offsetMinutes);
    const hours = String(Math.floor(abs / 60)).padStart(2, '0');
    const mins = String(abs % 60).padStart(2, '0');
    return `${sign}${hours}:${mins}`;
  }

  private deserializeData(data: any): any {
    if (data?.__type === 'Date') {
      // 增强的时间反序列化逻辑
      if (data.localValue) {
        // 如果有本地时间值，优先使用（带时区信息）
        console.log('deserializeData with timezone:', data.localValue, data.timezone);
        return new Date(data.localValue);
      } else {
        // 兼容原始格式
        console.log('deserializeData legacy format:', data.value);
        const raw = data.value;
        // 关键补丁：无 T 和 Z 时，强制当作 UTC 解析
        if (typeof raw === 'string' && !raw.includes('T') && !raw.endsWith('Z')) {
          const patched = raw.replace(' ', 'T') + 'Z';
          return new Date(patched);
        }
        return new Date(raw);
      }
    }

    if (data?.__type === "BigInt") {
      return BigInt(data.value);
    }

    if (Array.isArray(data)) {
      return data.map((a) => this.deserializeData(a));
    }

    if (data && typeof data === 'object') {
      return Object.fromEntries(
        Object.entries(data).map(([k, v]) => [k, this.deserializeData(v)])
      );
    }

    return data;
  }

  private async executeRequest<T>(
    entity: string,
    method: string,
    args: any[]
  ): Promise<T> {
    try {
      // console.log(args, "executeRequest type check:",Object.prototype.toString.call(args) )
      const serializedArgs = this.serializeData(args);
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entity, method, args: serializedArgs })
      });

      const result = await response.json();

      if (!result.success) {
        toast.error(result?.message || result?.error || 'Request failed');
        throw new Error(result.error || 'Request failed');
      }

      if (method === "Update") {
        // backendcommon 返回的格式和prisma td 对不上
        return await this.executeRequest(entity,"Get",[args[0]["where"]])
      }
      if (method === "Create") {
        return await this.executeRequest(entity,"Get",[{id: result.data.id}])
      }
      return this.deserializeData(result.data);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`EntitiesProxy Error: ${errorMessage}`);
    }
  }
}

export const entities = new EntitiesProxy().getProxy();
