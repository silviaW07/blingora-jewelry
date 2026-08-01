import { ThirdPartyPaymentProvider, CreatePaymentParams, PaymentResult, PaymentSessionInfo } from '../payment-definitions';
import { PROJECT_ID, FRONTEND_URL, canonicalStatsProjectId } from '../common';
import { isUnsetSecretValue, resolveClinkSecrets } from '../secret-resolver';

type ClinkStatus = 'paid' | 'unpaid' | 'canceled' | 'failed';

const DEFAULT_THIRD_PARTY_CLINK_API_BASE_URL = 'https://api.clinkbill.com';

function getClinkApiBaseUrl(): string {
    const configured = resolveClinkSecrets().apiBaseUrl;
    if (!configured || isUnsetSecretValue(configured)) {
        return DEFAULT_THIRD_PARTY_CLINK_API_BASE_URL;
    }
    return configured.replace(/\/+$/, '');
}

function buildProjectUrl(path: string): string {
    if (/^https?:\/\//i.test(path)) {
        return path;
    }
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    return `${FRONTEND_URL}/${PROJECT_ID}${normalizedPath}`;
}

function stripClinkHostedSessionPlaceholder(successUrl: string): string {
    if (!successUrl.includes('{CHECKOUT_SESSION_ID}')) {
        return successUrl;
    }
    const isAbsoluteUrl = /^https?:\/\//i.test(successUrl);
    const parsed = new URL(successUrl, isAbsoluteUrl ? undefined : 'https://placeholder.local');
    for (const [key, value] of Array.from(parsed.searchParams.entries())) {
        if (value === '{CHECKOUT_SESSION_ID}') {
            parsed.searchParams.delete(key);
        }
    }
    if (isAbsoluteUrl) {
        return parsed.toString();
    }
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
}

async function clinkRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
    const apiKey = resolveClinkSecrets().apiKey;
    if (!apiKey || isUnsetSecretValue(apiKey)) {
        throw new Error('Clink API key is not configured. Please set THIRD_PARTY_CLINK_API_KEY in project secrets.');
    }

    const response = await fetch(`${getClinkApiBaseUrl()}${path}`, {
        ...init,
        headers: {
            'Content-Type': 'application/json',
            'X-API-Key': apiKey,
            'X-Timestamp': Date.now().toString(),
            ...(init.headers || {}),
        },
    });

    const text = await response.text();
    const data = text ? JSON.parse(text) : {};
    if (!response.ok) {
        const message = (data && (data.message || data.error)) || response.statusText;
        throw new Error(`Clink API request failed: ${message}`);
    }
    if (data && typeof data === 'object' && 'code' in data && data.code !== 200) {
        const message = data.msg || data.message || data.error || 'Unknown Clink business error';
        throw new Error(`Clink API request failed: ${message}`);
    }
    return data as T;
}

function extractValue(data: any, keys: string[]): any {
    for (const key of keys) {
        if (data && data[key] != null) {
            return data[key];
        }
    }
    if (data?.data) {
        return extractValue(data.data, keys);
    }
    return undefined;
}

function normalizeClinkStatus(rawStatus: any): ClinkStatus {
    const status = String(rawStatus || '').trim().toLowerCase();
    if (['paid', 'succeeded', 'success', 'completed', 'complete'].includes(status)) {
        return 'paid';
    }
    if (['canceled', 'cancelled', 'expired', 'closed'].includes(status)) {
        return 'canceled';
    }
    if (['failed', 'failure', 'declined', 'error'].includes(status)) {
        return 'failed';
    }
    return 'unpaid';
}

export const provider: ThirdPartyPaymentProvider = {
    createPaymentSession: createClinkCheckoutSession,
    getPaymentSession: getClinkPaymentSession,
};

export async function createClinkCheckoutSession(params: CreatePaymentParams): Promise<PaymentResult> {
    const {
        amount,
        userId,
        successUrl,
        cancelUrl,
        productName = 'Account Balance Recharge',
        currency = 'usd',
        customerEmail,
    } = params;

    const numericAmount = Number.parseFloat(amount.toString());
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
        throw new Error('Clink amount must be a positive number.');
    }
    const normalizedCustomerEmail = String(customerEmail || '').trim();
    if (!normalizedCustomerEmail) {
        throw new Error('Clink customerEmail is required to create a hosted checkout session.');
    }

    const outTradeNo = `CLINK_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const finalSuccessUrl = stripClinkHostedSessionPlaceholder(successUrl);
    const statsProjectId = canonicalStatsProjectId();
    const body = {
        customerEmail: normalizedCustomerEmail,
        uiMode: 'hostedPage',
        originalAmount: numericAmount,
        originalCurrency: currency.toUpperCase(),
        successUrl: buildProjectUrl(finalSuccessUrl),
        cancelUrl: buildProjectUrl(cancelUrl),
        merchantReferenceId: outTradeNo,
        priceDataList: [
            {
                name: productName,
                description: `Recharge for User ${userId} | Project ${statsProjectId}`,
                unitAmount: numericAmount,
                currency: currency.toUpperCase(),
                quantity: 1,
            },
        ],
        metadata: {
            projectId: statsProjectId,
            userId: userId.toString(),
            outTradeNo,
        },
    };

    const result = await clinkRequest<any>('/api/checkout/session', {
        method: 'POST',
        body: JSON.stringify(body),
    });

    const sessionId = String(extractValue(result, ['id', 'sessionId', 'checkoutSessionId']) || outTradeNo);
    const checkoutUrl = extractValue(result, ['url', 'checkoutUrl', 'hostedUrl', 'hostedPageUrl']);

    return {
        url: checkoutUrl || null,
        sessionId,
        outTradeNo,
        raw: result,
    };
}

export async function getClinkPaymentSession(sessionId: string): Promise<PaymentSessionInfo | null> {
    try {
        let result: any;
        try {
            result = await clinkRequest<any>(`/api/checkout/session/${encodeURIComponent(sessionId)}`, {
                method: 'GET',
            });
        } catch (_sessionError) {
            result = await clinkRequest<any>(`/api/order/${encodeURIComponent(sessionId)}`, {
                method: 'GET',
            });
        }

        const status = normalizeClinkStatus(extractValue(result, ['paymentStatus', 'orderStatus', 'status']));
        const amount = extractValue(result, ['originalAmount', 'amount', 'amountTotal', 'totalAmount']);
        const currency = extractValue(result, ['originalCurrency', 'currency']);

        return {
            sessionId,
            status,
            amountTotal: amount == null ? undefined : Number(amount),
            currency: currency ? String(currency).toLowerCase() : '',
            metadata: extractValue(result, ['metadata']) || {},
            raw: result,
        };
    } catch (error) {
        console.error('Clink Query Error:', error);
        return null;
    }
}

export function getPaymentProvider(_name?: string): ThirdPartyPaymentProvider {
    return provider;
}
