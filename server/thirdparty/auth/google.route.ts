import { Router } from 'express';
import CryptoJS from 'crypto-js';
import {
    THIRD_PARTY_GOOGLE_CLIENT_ID,
    THIRD_PARTY_GOOGLE_CLIENT_SECRET,
    THIRD_PARTY_GOOGLE_CALLBACK_URL,
    THIRD_PARTY_SESSION_SECRET,
    FRONTEND_URL,
    PROJECT_ID,
} from '../common';

/**
 * Google OAuth2 直连回调路由（不依赖 Passport）。
 *
 * 处理 /api/auth/google/callback：
 * 1. 解析 state 获取重定向 URL
 * 2. 用 authorization code 换 access_token（Google token endpoint）
 * 3. 用 access_token 获取 userinfo（Google userinfo endpoint）
 * 4. 将用户信息加密为 auth_token，重定向回前端
 *
 * 本地开发环境使用。线上环境由代理层（multiple-prisma-runtime）统一处理。
 */
export function setupGoogleDirectAuth(router: Router) {
    router.get('/api/auth/google/callback', async (req, res) => {
        const { code, state } = req.query;
        let successRedirect = '';
        let failureRedirect = '/';

        try {
            // ── 1. 解析 state ──
            if (state && typeof state === 'string') {
                try {
                    let stateObj;
                    try {
                        stateObj = JSON.parse(state);
                    } catch {
                        stateObj = JSON.parse(decodeURIComponent(state));
                    }
                    if (stateObj) {
                        if (stateObj.successRedirectUrl) successRedirect = stateObj.successRedirectUrl;
                        if (stateObj.failedRedirectUrl) failureRedirect = stateObj.failedRedirectUrl;
                    }
                } catch (e) {
                    console.warn('[Google Direct] Failed to parse state:', e);
                }
            }

            // URL 补全
            if (successRedirect && !successRedirect.startsWith('http') && !successRedirect.startsWith('/' + PROJECT_ID)) {
                successRedirect = `${FRONTEND_URL}/${PROJECT_ID}${successRedirect.startsWith('/') ? '' : '/'}${successRedirect}`;
            }
            if (failureRedirect && !failureRedirect.startsWith('http') && !failureRedirect.startsWith('/' + PROJECT_ID)) {
                failureRedirect = `${FRONTEND_URL}/${PROJECT_ID}${failureRedirect.startsWith('/') ? '' : '/'}${failureRedirect}`;
            }

            if (!code || !successRedirect) {
                console.error('[Google Direct] Missing code or successRedirectUrl');
                return res.redirect(failureRedirect);
            }

            // ── 2. Code Exchange — 用 authorization code 换 access_token ──
            const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: new URLSearchParams({
                    grant_type: 'authorization_code',
                    code: code as string,
                    redirect_uri: THIRD_PARTY_GOOGLE_CALLBACK_URL,
                    client_id: THIRD_PARTY_GOOGLE_CLIENT_ID,
                    client_secret: THIRD_PARTY_GOOGLE_CLIENT_SECRET,
                }),
            });

            if (!tokenResponse.ok) {
                console.error('[Google Direct] Token exchange failed:', await tokenResponse.text());
                return res.redirect(failureRedirect);
            }

            const tokenData = await tokenResponse.json() as { access_token: string };

            // ── 3. 获取 userinfo ──
            const userinfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
                headers: { Authorization: `Bearer ${tokenData.access_token}` },
            });

            if (!userinfoResponse.ok) {
                console.error('[Google Direct] Userinfo fetch failed:', await userinfoResponse.text());
                return res.redirect(failureRedirect);
            }

            const userinfo = await userinfoResponse.json() as {
                id: string;
                name?: string;
                email?: string;
                picture?: string;
                given_name?: string;
                family_name?: string;
                [key: string]: any;
            };

            // ── 4. 映射为 ThirdPartyUser 格式 ──
            const user = {
                id: userinfo.id,
                displayName: userinfo.name || '',
                email: userinfo.email || '',
                photos: userinfo.picture ? [{ value: userinfo.picture }] : [],
                provider: 'google',
                _json: userinfo,
            };

            // ── 5. 加密并重定向 ──
            const userToken = CryptoJS.AES.encrypt(
                JSON.stringify(user),
                THIRD_PARTY_SESSION_SECRET,
            ).toString();
            const separator = successRedirect.includes('?') ? '&' : '?';
            res.redirect(
                `${successRedirect}${separator}auth_token=${encodeURIComponent(userToken)}`,
            );
        } catch (error) {
            console.error('[Google Direct] Callback error:', error);
            res.redirect(failureRedirect);
        }
    });
}
