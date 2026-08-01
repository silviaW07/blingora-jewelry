// 后台 Session Store
// 使用方法: import { useAdminSession } from '@/tools/BackendSession';
import { createPersistStore } from './storeFactory';

//backenduse, 后台用户登录session
export class AdminSession{ 
    token: string;
    user_id: string;
    username: string;
    constructor() { 
        this.token='';
        this.user_id='';
        this.username='';
    }
}

export const useAdminSession = createPersistStore<AdminSession>('AdminSession', { token: '', user_id: '', username: '' });
