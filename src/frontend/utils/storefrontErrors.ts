/**
 * Storefront action errors: message is an i18n key (e.g. checkout.errors.nameRequired).
 * UI should call translateStorefrontError(t, err).
 */

export function storefrontError(i18nKey: string): Error {
  return new Error(i18nKey)
}

/** Legacy Chinese messages → i18n keys (older clients / cached RPC). */
const LEGACY_ZH_TO_KEY: Record<string, string> = {
  '请填写 First Name / Last Name': 'checkout.errors.nameRequired',
  '请填写收货人姓名': 'checkout.errors.nameRequired',
  '请填写联系电话': 'checkout.errors.phoneRequired',
  '请填写 Address Line 1': 'checkout.errors.addressRequired',
  '请填写收货地址': 'checkout.errors.addressRequired',
  '请选择 State/Province': 'checkout.errors.stateRequired',
  '请填写 Zip Code': 'checkout.errors.zipRequired',
  '请填写邮编': 'checkout.errors.zipRequired',
  '购物车为空，无法下单': 'checkout.errors.emptyCart',
  '商品信息已变更，请刷新购物车后重试': 'checkout.errors.cartChanged',
  '该商品不存在或已下架': 'product.errors.unavailable',
  '商品库存不足': 'product.errors.outOfStock',
  '库存不足，请减少购买数量': 'product.errors.outOfStock',
  '加购后数量超过了当前商品库存上限': 'product.errors.outOfStock',
  '加购后数量超过可用库存，请减少购买数量': 'product.errors.outOfStock',
  '购物车条目不存在或无权访问': 'cart.errors.itemMissing',
  '请先登录': 'auth.loginRequired',
  '下单失败，请稍后重试': 'checkout.placeOrderFailed',
  '加载物流渠道失败': 'checkout.errors.shippingLoadFailed',
  '订单号生成繁忙，请稍后重试': 'checkout.placeOrderFailed',
  '今日订单序号已用尽': 'checkout.placeOrderFailed',
}

export function translateStorefrontError(
  t: (key: string, options?: Record<string, unknown>) => string,
  error: unknown,
  fallbackKey = 'checkout.placeOrderFailed',
): string {
  const raw = String((error as Error)?.message || '').trim()
  if (!raw) return t(fallbackKey)

  const key = LEGACY_ZH_TO_KEY[raw] || raw
  if (
    key.startsWith('checkout.') ||
    key.startsWith('cart.') ||
    key.startsWith('product.') ||
    key.startsWith('auth.')
  ) {
    return t(key, { defaultValue: t(fallbackKey) })
  }
  return raw
}
