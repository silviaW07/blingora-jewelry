
/**
 * @file payment-definitions.ts
 * @description Defines the external interfaces and types for the third-party payment library.
 * This file serves as the primary reference for AI and developers to understand how to interact with the library.
 * 
 * Usage Pattern:
 * 
 * 1. Get Provider:
 *    import { getPaymentProvider } from '@/thirdparty/payment/stripe';
 *    // or '@/thirdparty/payment/alipay' / '@/thirdparty/payment/clink'
 *    const provider = getPaymentProvider();
 * 
 * 2. Initiate Payment (Server Action):
 *    const result = await provider.createPaymentSession({
 *       amount: 100,
 *       userId: user.id,
 *       // Clink hosted checkout requires customerEmail. Read it from the authenticated account profile.
 *       customerEmail: user.email,
 *       // successUrl/cancelUrl 必须是项目中真实存在的页面路径（用 read_route_config 确认）。
 *       // Clink hosted checkout 会在成功回跳 URL 上追加 `sessionId`，不要使用 Stripe 的 {CHECKOUT_SESSION_ID}。
 *       successUrl: "/当前页面路径?status=success",
 *       cancelUrl: "/当前页面路径?status=cancel"
 *    });
 *    return result; // { url: '...', sessionId: '...' }
 * 
 * 3. Frontend Redirection:
 *    // Use openExternalLinkAsync to open payment page in a new window
 *    import { openExternalLinkAsync } from "@/lib/utils";
 *    setPaymentOpening(true);
 *    openExternalLinkAsync(async () => {
 *      const result = await createPaymentSession({ amount: 100, ... });
 *      return result.url;
 *    }, {
 *      // Payment page is already opened; do not keep the checkout button stuck in "opening".
 *      onNavigate: () => setPaymentOpening(false),
 *      onError: () => setPaymentOpening(false)
 *    });
 * 
 * 4. Verify Payment (Callback Server Action):
 *    // On the real successUrl page, call a server action with session_id/status query params.
 *    const sessionInfo = await provider.getPaymentSession(sessionId);
 *    
 *    if (sessionInfo?.status === 'paid') {
 *       // Update order status in DB
 *       // Notify opener with { type: 'payment-success', ... } or update current page state.
 *       return { success: true, status: 'paid' };
 *    }
 */
export type SupportedPaymentProvider = 'stripe' | 'alipay' | 'clink'; 

export interface CreatePaymentParams {
    /** The amount to charge. */
    amount: number | string;
    /** The user ID associated with the payment. */
    userId: string | number;
    /** Customer email. Required by Clink hosted checkout to create or locate the customer. */
    customerEmail?: string;
    /** URL to redirect to on success. Stripe supports {CHECKOUT_SESSION_ID}; Clink hosted checkout appends sessionId automatically. 本站内的相对路径，不要带http://host前缀 */
    successUrl: string;
    /** URL to redirect to on cancellation. 本站内的相对路径，不要带http://host前缀 */
    cancelUrl: string;
    /** Name of the product (optional). */
    productName?: string;
    /** Currency code (e.g., 'cny', 'usd'). Defaults vary by provider. */
    currency?: string;
    /** Allow provider-specific additional parameters */
    [key: string]: any; 
}

export interface PaymentResult {
    /** The URL to redirect the user to for payment (if applicable). */
    url: string | null;
    /** The session ID of the payment (if applicable). */
    sessionId?: string;
    /** The unique trade number for this transaction. */
    outTradeNo: string;
    [key: string]: any;
}

export interface PaymentSessionInfo {
    sessionId: string;
    /** 
     * Payment status.
     * Standardized values:
     * - 'paid': Payment completed successfully
     * - 'unpaid': Payment initialized but not completed
     * - 'canceled': Payment canceled or closed
     * - 'failed': Payment failed
     */
    status: 'paid' | 'unpaid' | 'canceled' | 'failed' | string; 
    amountTotal?: number;
    currency?: string;
    metadata?: any;
    raw?: any;
}

export interface ThirdPartyPaymentProvider {
    /**
     * Creates a payment session (e.g., Stripe Checkout, Alipay Page).
     */
    createPaymentSession(params: CreatePaymentParams): Promise<PaymentResult>;

    /**
     * Retrieves payment session details by ID.
     */
    getPaymentSession(sessionId: string): Promise<PaymentSessionInfo | null>;
}

/**
 * Factory to get a payment provider.
 */
export type GetPaymentProvider = (name: SupportedPaymentProvider) => ThirdPartyPaymentProvider;