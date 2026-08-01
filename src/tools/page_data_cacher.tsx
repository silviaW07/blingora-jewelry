
enum CacheType {
  Local,
  Session
}


class Cache {
  private storage: Storage;

  constructor(type: CacheType) {
    this.storage = type === CacheType.Local ? localStorage : sessionStorage;
  }

  setCache(key: string, value: any): void {
    if (value !== undefined && value !== null) {
      this.storage.setItem(key, JSON.stringify(value));
    }
  }

  getCache<T>(key: string): T | null {
    const value = this.storage.getItem(key);
    if (value) {
      return JSON.parse(value) as T;
    }
    return null;
  }

  removeCache(key: string): void {
    this.storage.removeItem(key);
  }

  clear(): void {
    this.storage.clear();
  }

  toJSON(): string {
    const cacheData: { [key: string]: any } = {};
    for (let i = 0; i < this.storage.length; i++) {
      const key = this.storage.key(i);
      if (key) {
        const value = this.getCache(key);
        cacheData[key] = value;
      }
    }
    return JSON.stringify(cacheData, null, 2); // 格式化输出，缩进为2个空格
  }
}

const pageDataCache = new Cache(CacheType.Session);

export default pageDataCache