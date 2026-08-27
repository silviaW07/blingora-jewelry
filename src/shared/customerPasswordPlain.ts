const PLAIN_MAX = 255

function clipPlain(password: string): string {
  return String(password || '').slice(0, PLAIN_MAX)
}

type UserDb = {
  sysuser: {
    update: (args: unknown) => Promise<unknown>
    findMany: (args: unknown) => Promise<Array<{ id: string; passwordPlain?: string | null }>>
  }
  $executeRaw: (query: TemplateStringsArray, ...values: unknown[]) => Promise<unknown>
  $queryRaw: (query: TemplateStringsArray, ...values: unknown[]) => Promise<unknown>
}

/** 注册/登录成功后写入客户明文密码。列尚未同步时静默跳过，避免阻断注册。 */
export async function saveCustomerPasswordPlain(
  db: UserDb,
  userId: string,
  password: string,
): Promise<void> {
  const plain = clipPlain(password)
  const id = String(userId || '')
  if (!plain || !id) return

  try {
    await db.sysuser.update({
      where: { id },
      data: { passwordPlain: plain },
      select: { id: true },
    })
    return
  } catch {
    // fall through
  }

  try {
    await db.$executeRaw`
      UPDATE \`sysuser\`
      SET \`passwordPlain\` = ${plain}
      WHERE \`id\` = ${id} AND \`role\` = ${'CUSTOMER'}
    `
  } catch {
    // Column may not exist yet on a lagging schema.
  }
}

export async function loadCustomerPasswordPlains(
  db: UserDb,
  userIds: string[],
): Promise<Map<string, string | null>> {
  const map = new Map<string, string | null>()
  const ids = [...new Set(userIds.filter(Boolean))]
  if (ids.length === 0) return map

  try {
    const rows = await db.sysuser.findMany({
      where: { id: { in: ids }, role: 'CUSTOMER' },
      select: { id: true, passwordPlain: true },
    })
    for (const row of rows || []) {
      map.set(row.id, row.passwordPlain || null)
    }
    return map
  } catch {
    // Column missing from Prisma client — try raw SQL per id
  }

  try {
    for (const id of ids) {
      const rows = (await db.$queryRaw`
        SELECT \`id\`, \`passwordPlain\`
        FROM \`sysuser\`
        WHERE \`id\` = ${id} AND \`role\` = ${'CUSTOMER'}
        LIMIT 1
      `) as Array<{ id: string; passwordPlain: string | null }>
      const row = rows?.[0]
      if (row) map.set(row.id, row.passwordPlain || null)
    }
  } catch {
    // Column may not exist yet on a lagging schema.
  }
  return map
}
