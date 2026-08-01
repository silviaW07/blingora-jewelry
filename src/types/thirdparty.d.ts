/**
 * Type declarations for @/thirdparty/* path aliases.
 * These modules live in server/thirdparty/ which is excluded from the main tsconfig.
 * This declaration file allows action files to import from @/thirdparty/* without TSC errors.
 */

// Google Auth Provider
declare module '@/thirdparty/auth/google' {
    export interface ThirdPartyUser {
        id: string;
        displayName: string;
        email: string;
        photos?: { value: string }[];
        provider: string;
        _json?: any;
        [key: string]: any;
    }

    export interface ThirdPartyAuthProvider {
        getAuthUrl(successRedirectUrl: string, failedRedirectUrl?: string): string;
        getAuthUser(authToken?: string): Promise<ThirdPartyUser | null>;
    }

    export function getAuthProvider(name?: string): ThirdPartyAuthProvider;
    export const provider: ThirdPartyAuthProvider;
    export const THIRD_PARTY_GOOGLE_CALLBACK_URL: string;
}

// Stripe Payment Provider
declare module '@/thirdparty/payment/stripe' {
    export interface CreatePaymentParams {
        amount: number | string;
        userId: string | number;
        successUrl: string;
        cancelUrl: string;
        productName?: string;
        currency?: string;
        [key: string]: any;
    }

    export interface PaymentResult {
        url: string | null;
        sessionId?: string;
        outTradeNo: string;
        [key: string]: any;
    }

    export interface PaymentSessionInfo {
        sessionId: string;
        status: 'paid' | 'unpaid' | 'canceled' | 'failed' | string;
        amountTotal?: number;
        currency?: string;
        metadata?: any;
        raw?: any;
    }

    export interface ThirdPartyPaymentProvider {
        createPaymentSession(params: CreatePaymentParams): Promise<PaymentResult>;
        getPaymentSession(sessionId: string): Promise<PaymentSessionInfo | null>;
    }

    export function getPaymentProvider(name?: string): ThirdPartyPaymentProvider;
    export const provider: ThirdPartyPaymentProvider;
}

// Alipay Payment Provider
declare module '@/thirdparty/payment/alipay' {
    export interface CreatePaymentParams {
        amount: number | string;
        userId: string | number;
        successUrl: string;
        cancelUrl: string;
        productName?: string;
        currency?: string;
        [key: string]: any;
    }

    export interface PaymentResult {
        url: string | null;
        sessionId?: string;
        outTradeNo: string;
        [key: string]: any;
    }

    export interface PaymentSessionInfo {
        sessionId: string;
        status: 'paid' | 'unpaid' | 'canceled' | 'failed' | string;
        amountTotal?: number;
        currency?: string;
        metadata?: any;
        raw?: any;
    }

    export interface ThirdPartyPaymentProvider {
        createPaymentSession(params: CreatePaymentParams): Promise<PaymentResult>;
        getPaymentSession(sessionId: string): Promise<PaymentSessionInfo | null>;
    }

    export function getPaymentProvider(name?: string): ThirdPartyPaymentProvider;
    export const provider: ThirdPartyPaymentProvider;
}

// Clink Payment Provider
declare module '@/thirdparty/payment/clink' {
    export interface CreatePaymentParams {
        amount: number | string;
        userId: string | number;
        customerEmail?: string;
        successUrl: string;
        cancelUrl: string;
        productName?: string;
        currency?: string;
        [key: string]: any;
    }

    export interface PaymentResult {
        url: string | null;
        sessionId?: string;
        outTradeNo: string;
        [key: string]: any;
    }

    export interface PaymentSessionInfo {
        sessionId: string;
        status: 'paid' | 'unpaid' | 'canceled' | 'failed' | string;
        amountTotal?: number;
        currency?: string;
        metadata?: any;
        raw?: any;
    }

    export interface ThirdPartyPaymentProvider {
        createPaymentSession(params: CreatePaymentParams): Promise<PaymentResult>;
        getPaymentSession(sessionId: string): Promise<PaymentSessionInfo | null>;
    }

    export function getPaymentProvider(name?: string): ThirdPartyPaymentProvider;
    export const provider: ThirdPartyPaymentProvider;
}

// Barrel re-export (for backward compat, though direct imports are preferred)
declare module '@/thirdparty' {
    export function getAuthProvider(name: 'google'): import('@/thirdparty/auth/google').ThirdPartyAuthProvider;
    export function getPaymentProvider(name: 'stripe' | 'alipay' | 'clink'): import('@/thirdparty/payment/stripe').ThirdPartyPaymentProvider;
}

// AI Provider (OpenAI-compatible)
declare module '@/thirdparty/ai/openai-compat' {
    export interface ChatMessage {
        role: 'system' | 'user' | 'assistant';
        content: string;
    }

    export interface ChatCompletionParams {
        messages: ChatMessage[];
        model?: string;
        temperature?: number;
        maxTokens?: number;
        stream?: boolean;
    }

    export interface ChatCompletionResult {
        content: string;
        model: string;
        usage?: {
            promptTokens: number;
            completionTokens: number;
            totalTokens: number;
        };
    }

    export interface ImageGenerationParams {
        prompt: string;
        model?: string;
        size?: '256x256' | '512x512' | '1024x1024' | '1792x1024' | '1024x1792' | '2K' | string;
        n?: number;
        responseFormat?: 'url' | 'b64_json';
        watermark?: boolean;
    }

    export interface ImageGenerationResult {
        url: string;
        b64Json?: string;
        revisedPrompt?: string;
    }

    export interface ThirdPartyAIProvider {
        chatCompletion(params: ChatCompletionParams): Promise<ChatCompletionResult>;
        imageGeneration(params: ImageGenerationParams): Promise<ImageGenerationResult>;
    }

    export function getAIProvider(): ThirdPartyAIProvider;
    export const provider: ThirdPartyAIProvider;
}
