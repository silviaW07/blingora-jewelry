// 无需登录
// 使用方法: import { useAppUserSession } from '@/tools/AppSession';
import { createPersistStore } from './storeFactory';

export const useAppUserSession = createPersistStore(
  'AppUserSession',
  {}
);
