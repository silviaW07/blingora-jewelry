// 默认的鉴权工具实现
// 如果有登录页面，此文件会被实际的鉴权逻辑覆盖

export class UnauthorizedError extends Error {
  constructor(message = '请登录') {
    super(message);
    this.name = 'UnauthorizedError';
  }
  get statusCode(): number {
    return 401;
  }
}

export class ForbiddenError extends Error {
  constructor(message = '权限不足') {
    super(message);
    this.name = 'ForbiddenError';
  }
  get statusCode(): number {
    return 403;
  }
}

export async function parseToken(token: string): Promise<any> {
  // 默认实现：不做任何验证，返回 null
  return null;
}

export async function runWithAuth<T>(
  authContext: any,
  fn: () => Promise<T>
): Promise<T> {
  // 默认实现：直接执行函数，不做鉴权
  return fn();
}
