import { authContext } from './context';
import {
    THIRD_PARTY_GOOGLE_CLIENT_ID,
    THIRD_PARTY_GOOGLE_CLIENT_SECRET,
    THIRD_PARTY_GOOGLE_CLIENT_ID_DEPLOY,
    THIRD_PARTY_GOOGLE_CLIENT_SECRET_DEPLOY,
    THIRD_PARTY_STRIPE_SECRET_KEY,
    THIRD_PARTY_STRIPE_SECRET_KEY_DEPLOY,
    THIRD_PARTY_ALIPAY_APP_ID,
    THIRD_PARTY_ALIPAY_PRIVATE_KEY,
    THIRD_PARTY_ALIPAY_PUBLIC_KEY,
    THIRD_PARTY_ALIPAY_GATEWAY,
    THIRD_PARTY_ALIPAY_APP_ID_DEPLOY,
    THIRD_PARTY_ALIPAY_PRIVATE_KEY_DEPLOY,
    THIRD_PARTY_ALIPAY_PUBLIC_KEY_DEPLOY,
    THIRD_PARTY_ALIPAY_GATEWAY_DEPLOY,
    THIRD_PARTY_CLINK_API_KEY,
    THIRD_PARTY_CLINK_API_BASE_URL,
    THIRD_PARTY_CLINK_PUBLISHABLE_KEY,
    THIRD_PARTY_CLINK_WEBHOOK_SIGNING_KEY,
    THIRD_PARTY_CLINK_API_KEY_DEPLOY,
    THIRD_PARTY_CLINK_API_BASE_URL_DEPLOY,
    THIRD_PARTY_CLINK_PUBLISHABLE_KEY_DEPLOY,
    THIRD_PARTY_CLINK_WEBHOOK_SIGNING_KEY_DEPLOY,
    THIRD_PARTY_AI_API_KEY,
    THIRD_PARTY_AI_BASE_URL,
    THIRD_PARTY_AI_DEFAULT_MODEL,
    THIRD_PARTY_AI_API_KEY_DEPLOY,
    THIRD_PARTY_AI_BASE_URL_DEPLOY,
    THIRD_PARTY_AI_DEFAULT_MODEL_DEPLOY,
    THIRD_PARTY_AI_IMAGE_API_KEY,
    THIRD_PARTY_AI_IMAGE_BASE_URL,
    THIRD_PARTY_AI_IMAGE_DEFAULT_MODEL,
    THIRD_PARTY_AI_IMAGE_API_KEY_DEPLOY,
    THIRD_PARTY_AI_IMAGE_BASE_URL_DEPLOY,
    THIRD_PARTY_AI_IMAGE_DEFAULT_MODEL_DEPLOY,
    THIRD_PARTY_SESSION_SECRET,
    THIRD_PARTY_SESSION_SECRET_DEPLOY,
} from './common';

export type CredentialMode = 'preview' | 'deploy';

function getRequestHeaders(): Record<string, string> | undefined {
    const runtimeHeaders = (globalThis as { __runtimeRequestHeaders?: Record<string, string> | null })
        .__runtimeRequestHeaders;
    if (runtimeHeaders && typeof runtimeHeaders === 'object' && Object.keys(runtimeHeaders).length > 0) {
        return runtimeHeaders;
    }
    const ctx = authContext?.getStore?.();
    if (ctx?.headers && Object.keys(ctx.headers).length > 0) {
        return ctx.headers;
    }
    return undefined;
}

export function isDeployedRequest(): boolean {
    return true; // APP_BUILD_DEPLOY_ONLY
}

export function getCredentialMode(): CredentialMode {
    return isDeployedRequest() ? 'deploy' : 'preview';
}

export function isUnsetSecretValue(value: string): boolean {
    const v = (value || '').trim();
    return !v || /^\{\{[A-Z0-9_]+\}\}$/.test(v);
}

function normalizeSecret(value: string): string {
    return isUnsetSecretValue(value) ? '' : value.trim();
}

export interface GoogleOAuthSecrets {
    clientId: string;
    clientSecret: string;
    sessionSecret: string;
    credentialMode: CredentialMode;
}

export function resolveGoogleOAuthSecrets(): GoogleOAuthSecrets {
    const credentialMode = getCredentialMode();
    const previewClientId = normalizeSecret(THIRD_PARTY_GOOGLE_CLIENT_ID);
    const previewClientSecret = normalizeSecret(THIRD_PARTY_GOOGLE_CLIENT_SECRET);
    const previewSessionSecret = normalizeSecret(THIRD_PARTY_SESSION_SECRET);

    if (credentialMode === 'preview') {
        return {
            clientId: previewClientId,
            clientSecret: previewClientSecret,
            sessionSecret: previewSessionSecret,
            credentialMode,
        };
    }

    const deployClientId = normalizeSecret(THIRD_PARTY_GOOGLE_CLIENT_ID_DEPLOY);
    const deployClientSecret = normalizeSecret(THIRD_PARTY_GOOGLE_CLIENT_SECRET_DEPLOY);
    const deploySessionSecret = normalizeSecret(THIRD_PARTY_SESSION_SECRET_DEPLOY);

    return {
        clientId: assertConfiguredSecret(deployClientId, 'THIRD_PARTY_GOOGLE_CLIENT_ID'),
        clientSecret: assertConfiguredSecret(deployClientSecret, 'THIRD_PARTY_GOOGLE_CLIENT_SECRET'),
        sessionSecret: normalizeSecret(deploySessionSecret),
        credentialMode,
    };
}

export function assertConfiguredSecret(value: string, secretName: string): string {
    const normalized = normalizeSecret(value);
    if (!normalized) {
        throw new Error(`${secretName} 未配置：请在平台配置支付 Secret 后重新部署。`);
    }
    return normalized;
}

export function resolvePaymentSecret(
    previewValue: string,
    deployValue: string,
    secretName: string,
): string {
    if (!isDeployedRequest()) {
        const preview = normalizeSecret(previewValue);
        if (!preview) {
            throw new Error(`${secretName} 未配置：预览环境缺少平台测试 Secret。`);
        }
        return preview;
    }

    return assertConfiguredSecret(deployValue, secretName);
}

export function resolveOptionalPaymentSecret(previewValue: string, deployValue: string): string {
    if (!isDeployedRequest()) {
        return normalizeSecret(previewValue);
    }
    return normalizeSecret(deployValue);
}

export function resolveStripeSecretKey(): string {
    return resolvePaymentSecret(
        THIRD_PARTY_STRIPE_SECRET_KEY,
        THIRD_PARTY_STRIPE_SECRET_KEY_DEPLOY,
        'THIRD_PARTY_STRIPE_SECRET_KEY',
    );
}

export function resolveAlipaySecrets() {
    return {
        appId: resolvePaymentSecret(
            THIRD_PARTY_ALIPAY_APP_ID,
            THIRD_PARTY_ALIPAY_APP_ID_DEPLOY,
            'THIRD_PARTY_ALIPAY_APP_ID',
        ),
        privateKey: resolvePaymentSecret(
            THIRD_PARTY_ALIPAY_PRIVATE_KEY,
            THIRD_PARTY_ALIPAY_PRIVATE_KEY_DEPLOY,
            'THIRD_PARTY_ALIPAY_PRIVATE_KEY',
        ),
        publicKey: resolvePaymentSecret(
            THIRD_PARTY_ALIPAY_PUBLIC_KEY,
            THIRD_PARTY_ALIPAY_PUBLIC_KEY_DEPLOY,
            'THIRD_PARTY_ALIPAY_PUBLIC_KEY',
        ),
        gateway: resolvePaymentSecret(
            THIRD_PARTY_ALIPAY_GATEWAY,
            THIRD_PARTY_ALIPAY_GATEWAY_DEPLOY,
            'THIRD_PARTY_ALIPAY_GATEWAY',
        ),
    };
}

export function resolveClinkSecrets() {
    return {
        apiKey: resolvePaymentSecret(
            THIRD_PARTY_CLINK_API_KEY,
            THIRD_PARTY_CLINK_API_KEY_DEPLOY,
            'THIRD_PARTY_CLINK_API_KEY',
        ),
        apiBaseUrl: resolveOptionalPaymentSecret(
            THIRD_PARTY_CLINK_API_BASE_URL,
            THIRD_PARTY_CLINK_API_BASE_URL_DEPLOY,
        ),
        publishableKey: resolveOptionalPaymentSecret(
            THIRD_PARTY_CLINK_PUBLISHABLE_KEY,
            THIRD_PARTY_CLINK_PUBLISHABLE_KEY_DEPLOY,
        ),
        webhookSigningKey: resolveOptionalPaymentSecret(
            THIRD_PARTY_CLINK_WEBHOOK_SIGNING_KEY,
            THIRD_PARTY_CLINK_WEBHOOK_SIGNING_KEY_DEPLOY,
        ),
    };
}

export function resolveAiSecrets() {
    const credentialMode = getCredentialMode();
    if (credentialMode === 'preview') {
        return {
            apiKey: normalizeSecret(THIRD_PARTY_AI_API_KEY),
            baseUrl: normalizeSecret(THIRD_PARTY_AI_BASE_URL),
            defaultModel: normalizeSecret(THIRD_PARTY_AI_DEFAULT_MODEL),
        };
    }
    return {
        apiKey: normalizeSecret(THIRD_PARTY_AI_API_KEY_DEPLOY),
        baseUrl: normalizeSecret(THIRD_PARTY_AI_BASE_URL_DEPLOY),
        defaultModel: normalizeSecret(THIRD_PARTY_AI_DEFAULT_MODEL_DEPLOY),
    };
}

export function resolveAiImageSecrets() {
    const credentialMode = getCredentialMode();
    if (credentialMode === 'preview') {
        return {
            apiKey: normalizeSecret(THIRD_PARTY_AI_IMAGE_API_KEY),
            baseUrl: normalizeSecret(THIRD_PARTY_AI_IMAGE_BASE_URL),
            defaultModel: normalizeSecret(THIRD_PARTY_AI_IMAGE_DEFAULT_MODEL),
        };
    }
    return {
        apiKey: normalizeSecret(THIRD_PARTY_AI_IMAGE_API_KEY_DEPLOY),
        baseUrl: normalizeSecret(THIRD_PARTY_AI_IMAGE_BASE_URL_DEPLOY),
        defaultModel: normalizeSecret(THIRD_PARTY_AI_IMAGE_DEFAULT_MODEL_DEPLOY),
    };
}
