import * as common from './common';
import { 
    ThirdPartyAuthProvider, 
    SupportedAuthProvider,
} from './auth-definitions';
import { 
    ThirdPartyPaymentProvider,
    SupportedPaymentProvider
} from './payment-definitions';

// --- Static Provider Imports ---
// 直接静态 import，不使用 require() 动态加载。
// 原因：esbuild bundle 模式下 require() 动态导入行为不可靠，
// 而 alipay-sdk / stripe 等已在 externals 中，静态 import 更简单可靠。
import { provider as googleProvider } from './auth/google';
import { provider as stripeProvider } from './payment/stripe';
import { provider as alipayProvider } from './payment/alipay';
import { provider as clinkProvider } from './payment/clink';

export { common };

const authProviders: Record<string, ThirdPartyAuthProvider> = {
    google: googleProvider,
};

const paymentProviders: Record<string, ThirdPartyPaymentProvider> = {
    stripe: stripeProvider,
    alipay: alipayProvider,
    clink: clinkProvider,
};

/**
 * Get an authentication provider instance by name.
 * @param name 'google'
 */
export function getAuthProvider(name: SupportedAuthProvider): ThirdPartyAuthProvider {
    const provider = authProviders[name.toLowerCase()];
    if (!provider) {
        throw new Error(`Auth provider '${name}' not found. Available: ${Object.keys(authProviders).join(', ')}`);
    }
    return provider;
}

/**
 * Get a payment provider instance by name.
 * @param name 'stripe' | 'alipay' | 'clink'
 */
export function getPaymentProvider(name: SupportedPaymentProvider): ThirdPartyPaymentProvider {
    const provider = paymentProviders[name.toLowerCase()];
    if (!provider) {
        throw new Error(`Payment provider '${name}' not found. Available: ${Object.keys(paymentProviders).join(', ')}`);
    }
    return provider;
}
