export const CUSTOMER_LOGIN_EMAIL_NOT_REGISTERED =
  'This email is not registered. Please register.'
export const CUSTOMER_LOGIN_ACCOUNT_NOT_REGISTERED =
  'This account is not registered. Please register.'
export const CUSTOMER_LOGIN_INCORRECT_PASSWORD = 'Incorrect password.'
export const CUSTOMER_LOGIN_NOT_STOREFRONT = 'This account cannot sign in on the storefront.'
export const CUSTOMER_LOGIN_RESTRICTED = 'Account restricted. Please contact support.'

export function customerLoginNotFoundMessage(account: string): string {
  return String(account || '').includes('@')
    ? CUSTOMER_LOGIN_EMAIL_NOT_REGISTERED
    : CUSTOMER_LOGIN_ACCOUNT_NOT_REGISTERED
}

/** Map login/register errors to English storefront copy. Never surface Chinese. */
export function sanitizeCustomerAuthError(raw: unknown, fallback: string): string {
  const message = String(raw || '').trim()
  if (!message) return fallback

  if (/该邮箱已被注册|Email already registered|Unique constraint|P2002/i.test(message)) {
    return 'This email is already registered. Please sign in or use another email.'
  }
  if (/数据库结构未同步/u.test(message)) {
    return 'Sign-in is temporarily unavailable. Please try again.'
  }
  if (/非前台客户|cannot sign in on the storefront/i.test(message)) {
    return CUSTOMER_LOGIN_NOT_STOREFRONT
  }
  if (/账户状态受限|Account restricted/i.test(message)) {
    return CUSTOMER_LOGIN_RESTRICTED
  }
  if (
    /This email is not registered|This account is not registered|请注册|账号不存在|用户不存在|邮箱未注册/i.test(
      message,
    )
  ) {
    return /@/.test(message) || /email/i.test(message)
      ? CUSTOMER_LOGIN_EMAIL_NOT_REGISTERED
      : CUSTOMER_LOGIN_ACCOUNT_NOT_REGISTERED
  }
  if (/Incorrect password|密码错误/i.test(message) && !/账号或密码错误/u.test(message)) {
    return CUSTOMER_LOGIN_INCORRECT_PASSWORD
  }
  if (/账号或密码错误|Incorrect account or password/i.test(message)) {
    return CUSTOMER_LOGIN_INCORRECT_PASSWORD
  }
  if (
    /Invalid `.*` invocation/i.test(message) ||
    /does not exist in the current database/i.test(message) ||
    /passwordPlain/i.test(message) ||
    /prisma/i.test(message) ||
    /ECONNREFUSED|ENOTFOUND|P20\d{2}/i.test(message)
  ) {
    return fallback
  }
  if (/[\u4e00-\u9fff]/.test(message)) {
    return fallback
  }
  return message
}
