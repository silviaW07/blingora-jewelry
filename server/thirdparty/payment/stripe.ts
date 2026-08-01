import Stripe from 'stripe';
import { PROJECT_ID, FRONTEND_URL, canonicalStatsProjectId } from '../common';
import { resolveStripeSecretKey } from '../secret-resolver';
import { ThirdPartyPaymentProvider, CreatePaymentParams, PaymentResult, PaymentSessionInfo } from '../payment-definitions';

export const provider: ThirdPartyPaymentProvider = {
    createPaymentSession: createStripeCheckoutSession,
    getPaymentSession: getStripePaymentSession
};

const ZERO_DECIMAL_CURRENCIES = new Set([
    'bif', 'clp', 'djf', 'gnf', 'jpy', 'kmf', 'krw', 'mga',
    'pyg', 'rwf', 'ugx', 'vnd', 'vuv', 'xaf', 'xof', 'xpf'
]);

function createStripeClient(): Stripe {
    return new Stripe(resolveStripeSecretKey(), {
        apiVersion: '2025-01-27.acacia' as any,
    });
}

export async function createStripeCheckoutSession(params: CreatePaymentParams): Promise<PaymentResult> {
    const {
        amount,
        userId,
        successUrl,
        cancelUrl,
        productName = 'Account Balance Recharge',
        currency = 'cny'
    } = params;

    const stripe = createStripeClient();

    const outTradeNo = `STRIPE_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

    const lowerCurrency = currency.toLowerCase();
    const isZeroDecimal = ZERO_DECIMAL_CURRENCIES.has(lowerCurrency);
    
    const unitAmount = isZeroDecimal 
        ? Math.round(parseFloat(amount.toString())) 
        : Math.round(parseFloat(amount.toString()) * 100);

    let finalSuccessUrl = successUrl;
    if (!finalSuccessUrl.includes('{CHECKOUT_SESSION_ID}')) {
        if (!finalSuccessUrl.includes('session_id=')) {
            const separator = finalSuccessUrl.includes('?') ? '&' : '?';
            finalSuccessUrl = `${finalSuccessUrl}${separator}session_id={CHECKOUT_SESSION_ID}`;
        }
    }

    const statsProjectId = canonicalStatsProjectId();

    const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [{
            price_data: {
                currency: currency,
                product_data: {
                    name: productName,
                    description: `Recharge for User ${userId}`,
                },
                unit_amount: unitAmount,
            },
            quantity: 1,
        }],
        mode: 'payment',
        success_url: `${FRONTEND_URL}/${PROJECT_ID}${finalSuccessUrl}`,
        cancel_url: `${FRONTEND_URL}/${PROJECT_ID}${cancelUrl}`,
        metadata: {
            projectId: statsProjectId,
            userId: userId.toString(),
            outTradeNo: outTradeNo
        },
        payment_intent_data: {
            metadata: {
                projectId: statsProjectId,
                userId: userId.toString(),
                outTradeNo: outTradeNo
            }
        }
    });

    return {
        url: session.url,
        sessionId: session.id,
        outTradeNo
    };
}

export async function getStripePaymentSession(sessionId: string): Promise<PaymentSessionInfo | null> {
    const stripe = createStripeClient();

    try {
        const session = await stripe.checkout.sessions.retrieve(sessionId);
        return {
            sessionId: session.id,
            status: session.payment_status,
            amountTotal: session.amount_total ? session.amount_total / 100 : 0,
            currency: session.currency || '',
            metadata: session.metadata,
            raw: session
        };
    } catch (error) {
        console.error("Error retrieving Stripe session:", error);
        return null;
    }
}

export function getPaymentProvider(_name?: string): ThirdPartyPaymentProvider {
    return provider;
}
