'use client';

// 前台 Session Store
// 使用方法: import { useUserSession } from '@/tools/FrontendSession';
import { createPersistStore } from './storeFactory';

export type FrontendUserRole = 'CUSTOMER';

export class UserSession {
  token: string;
  user_id: string;
  username: string;
  email: string;
  preferredLocale: string;
  role: FrontendUserRole;

  constructor() {
    this.token = '';
    this.user_id = '';
    this.username = '';
    this.email = '';
    this.preferredLocale = 'en';
    this.role = 'CUSTOMER';
  }
}

export const useUserSession = createPersistStore<UserSession>('UserSession', {
  token: '',
  user_id: '',
  username: '',
  email: '',
  preferredLocale: 'en',
  role: 'CUSTOMER'
});
