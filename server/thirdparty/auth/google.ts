import CryptoJS from 'crypto-js';
import {
    PROJECT_ID,
    THIRD_PARTY_GOOGLE_CALLBACK_URL,
} from '../common';
import { authContext } from '../context';
import { resolveGoogleOAuthSecrets, isDeployedRequest } from '../secret-resolver';
import { AuthState } from './AuthState';
import { ThirdPartyAuthProvider, ThirdPartyUser } from '../auth-definitions';

export { THIRD_PARTY_GOOGLE_CALLBACK_URL } from '../common';

export const provider: ThirdPartyAuthProvider = {
    getAuthUrl: getGoogleAuthUrl,
    getAuthUser: getAuthUser,
};

/**
 * 生成 Google OAuth2 授权 URL。
 *
 * 回调由代理层统一处理（code exchange + userinfo + 加密 + redirect），
 * 子项目只需要生成授权 URL 和解密 auth_token。
 *
 * state 参数中携带 projectId 与 credentialMode，代理层据此区分预览/部署凭据。
 */
export function getGoogleAuthUrl(successRedirectUrl: string, failedRedirectUrl?: string): string {
    const oauthSecrets = resolveGoogleOAuthSecrets();
    const state: AuthState = {
        provider: 'google',
        projectId: PROJECT_ID,
        successRedirectUrl,
        failedRedirectUrl,
        nonce: Math.random().toString(36).substring(7),
        oauthStatsMode: isDeployedRequest() ? 'prod' : 'test',
        credentialMode: oauthSecrets.credentialMode,
    };

    const clientId = oauthSecrets.clientId;
    if (!clientId) {
        throw new Error(
            'Google OAuth client_id 未配置：请在平台配置 Google Client ID，或填写 server/thirdparty/common.ts',
        );
    }

    const params = new URLSearchParams({
        client_id: clientId,
        redirect_uri: THIRD_PARTY_GOOGLE_CALLBACK_URL,
        response_type: 'code',
        scope: 'openid email profile',
        state: JSON.stringify(state),
        access_type: 'offline',
        prompt: 'consent',
    });

    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

/**
 * 从加密的 auth_token 中解密用户信息。
 */
export async function getAuthUser(authToken?: string): Promise<ThirdPartyUser | null> {
    try {
        let token: string | undefined = authToken;

        if (!token) {
            const ctx = authContext?.getStore?.();
            if (ctx && ctx.cookies) {
                token = ctx.cookies['auth_token'];
            }
        }

        if (!token) {
            console.error('Failed to get auth token: no token provided and no cookie found');
            return null;
        }

        const decodedToken = decodeURIComponent(token);
        const { sessionSecret } = resolveGoogleOAuthSecrets();
        const secret = sessionSecret || '';
        if (!secret) {
            console.error('Failed to get auth user: session secret is not configured');
            return null;
        }

        const bytes = CryptoJS.AES.decrypt(decodedToken, secret);
        const originalText = bytes.toString(CryptoJS.enc.Utf8);

        if (!originalText) {
            return null;
        }

        return JSON.parse(originalText);
    } catch (e) {
        console.error('Failed to get auth user:', e);
        return null;
    }
}

export function getAuthProvider(_name?: string): ThirdPartyAuthProvider {
    return provider;
}
