import { Router } from 'express';
import { setupGoogleDirectAuth } from './google.route';

export function setupThirdPartyAuth(router: Router) {
    // Google OAuth 直连回调路由（本地开发用）
    // 线上环境由代理层（multiple-prisma-runtime）统一处理回调，此路由不会被命中
    setupGoogleDirectAuth(router);
}
