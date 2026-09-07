import prisma from '@/tools/prisma'

/** Avoid a DB write on every page/cart ping. */
const MIN_INTERVAL_MS = 10 * 60 * 1000

/**
 * Cookie/session visits count as signed-in — no password prompt.
 * Updates lastLoginAt when the previous stamp is missing or older than 10 minutes.
 */
export async function touchCustomerLastSeen(userId: string): Promise<void> {
  const id = String(userId || '').trim()
  if (!id) return
  const cutoff = new Date(Date.now() - MIN_INTERVAL_MS)
  try {
    await prisma.sysuser.updateMany({
      where: {
        id,
        OR: [{ lastLoginAt: null }, { lastLoginAt: { lt: cutoff } }],
      },
      data: { lastLoginAt: new Date() },
    })
  } catch {
    // schema lag / db blip — never block browsing or checkout
  }
}
