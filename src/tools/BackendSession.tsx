// 后台 Session Store
// 使用方法: import { useAdminSession } from '@/tools/BackendSession';
import { createPersistStore } from './storeFactory';

//backenduse, 后台用户登录session
export class AdminSession{ 
    token: string;
    user_id: string;
    role: 'ADMIN' | 'SUB_ADMIN' | '';
    username: string;
    avatarUrl: string;
    constructor() { 
        this.token='';
        this.user_id='';
        this.role='';
        this.username='';
        this.avatarUrl='';
    }
}

export const useAdminSession = createPersistStore<AdminSession>('AdminSession', {
  token: '',
  user_id: '',
  role: '',
  username: '',
  avatarUrl: '',
});
