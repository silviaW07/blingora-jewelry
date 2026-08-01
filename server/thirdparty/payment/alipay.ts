import { AlipaySdk } from 'alipay-sdk';
import { ThirdPartyPaymentProvider, CreatePaymentParams, PaymentResult, PaymentSessionInfo } from '../payment-definitions';
import {
  PROJECT_ID,
  FRONTEND_URL,
  canonicalStatsProjectId,
} from '../common';
import { resolveAlipaySecrets } from '../secret-resolver';

/**
 * @file alipay.ts
 * @description Alipay payment provider implementation using alipay-sdk.
 */

function createAlipaySdk(): AlipaySdk {
    const secrets = resolveAlipaySecrets();
    return new AlipaySdk({
        appId: secrets.appId,
        privateKey: secrets.privateKey,
        alipayPublicKey: secrets.publicKey,
        gateway: secrets.gateway,
    });
}

export const provider: ThirdPartyPaymentProvider = {
    createPaymentSession: createAlipayPagePay,
    getPaymentSession: getAlipayPaymentSession
};

export async function createAlipayPagePay(params: CreatePaymentParams): Promise<PaymentResult> {
    const {
        amount,
        userId,
        successUrl = '/?payment=success',
        productName = 'Account Balance Recharge'
    } = params;

    const alipaySdk = createAlipaySdk();
    const outTradeNo = `ALIPAY_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    
    let finalSuccessUrl = successUrl;
    if (finalSuccessUrl.includes('{CHECKOUT_SESSION_ID}')) {
        finalSuccessUrl = finalSuccessUrl.replace('{CHECKOUT_SESSION_ID}', outTradeNo);
    } else {
        if (!finalSuccessUrl.includes('session_id=')) {
            const separator = finalSuccessUrl.includes('?') ? '&' : '?';
            finalSuccessUrl = `${finalSuccessUrl}${separator}session_id=${outTradeNo}`;
        }
    }
    
    const returnUrl = `${FRONTEND_URL}/${PROJECT_ID}${finalSuccessUrl}`;
    const totalAmount = parseFloat(amount.toString()).toFixed(2);
    const statsProjectId = canonicalStatsProjectId();

    try {
        const result = await alipaySdk.pageExecute('alipay.trade.page.pay', 'GET', {
            bizContent: {
                out_trade_no: outTradeNo,
                product_code: 'FAST_INSTANT_TRADE_PAY',
                total_amount: totalAmount,
                subject: productName,
                body: `Recharge for User ${userId} | Project ${statsProjectId}`,
                passback_params: encodeURIComponent(`projectId=${statsProjectId}&userId=${userId}`),
            },
            returnUrl: returnUrl
        });

        return {
            url: result as unknown as string, 
            outTradeNo: outTradeNo,
            sessionId: outTradeNo
        };
    } catch (error: any) {
        console.error("Alipay SDK Error:", error);
        throw new Error(`Alipay creation failed: ${error.message}`);
    }
}

export async function getAlipayPaymentSession(sessionId: string): Promise<PaymentSessionInfo | null> {
    const alipaySdk = createAlipaySdk();
    try {
        const result = await alipaySdk.exec('alipay.trade.query', {
            bizContent: {
                out_trade_no: sessionId
            }
        });

        let status = 'unpaid';
        if (result.tradeStatus === 'TRADE_SUCCESS' || result.tradeStatus === 'TRADE_FINISHED') {
            status = 'paid';
        } else if (result.tradeStatus === 'TRADE_CLOSED') {
            status = 'canceled';
        }

        return {
            sessionId: sessionId,
            status: status,
            amountTotal: result.totalAmount ? parseFloat(result.totalAmount as string) : 0,
            currency: 'cny',
            metadata: result,
            raw: result
        };
    } catch (error) {
        console.error("Alipay Query Error:", error);
        return null;
    }
}

export function getPaymentProvider(_name?: string): ThirdPartyPaymentProvider {
    return provider;
}
