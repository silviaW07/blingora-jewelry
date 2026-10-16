import { randomUUID } from 'crypto'
import prisma from '@/tools/prisma'

export interface BuyerShowProofRecord {
  id: string
  imageUrl: string
  title: string
  body: string
  sortWeight: number
  isEnabled: boolean
  createdAt: string
}

type ProofSqlRow = {
  id: string
  image_url: string
  title: string
  body: string
  sort_weight: number | null
  is_enabled: number | boolean | null
  createdAt: Date | string
}

function mapProof(row: ProofSqlRow): BuyerShowProofRecord {
  const created = row.createdAt instanceof Date ? row.createdAt.toISOString() : String(row.createdAt || '')
  return {
    id: String(row.id || ''),
    imageUrl: String(row.image_url || '').trim(),
    title: String(row.title || '').trim(),
    body: String(row.body || '').trim(),
    sortWeight: Number(row.sort_weight) || 0,
    isEnabled: row.is_enabled === true || Number(row.is_enabled) === 1,
    createdAt: created,
  }
}

export async function listBuyerShowProofs(enabledOnly: boolean): Promise<BuyerShowProofRecord[]> {
  const rows = enabledOnly
    ? await prisma.$queryRaw<ProofSqlRow[]>`
        SELECT id, image_url, title, body, sort_weight, is_enabled, createdAt
        FROM buyer_show_proof
        WHERE is_enabled = 1
        ORDER BY sort_weight DESC, createdAt DESC
      `
    : await prisma.$queryRaw<ProofSqlRow[]>`
        SELECT id, image_url, title, body, sort_weight, is_enabled, createdAt
        FROM buyer_show_proof
        ORDER BY sort_weight DESC, createdAt DESC
      `
  return (rows || []).map(mapProof).filter((row) => row.imageUrl && row.title && row.body)
}

export async function createBuyerShowProof(input: {
  imageUrl: string
  title: string
  body: string
}): Promise<{ id: string }> {
  const imageUrl = String(input.imageUrl || '').trim().slice(0, 700)
  const title = String(input.title || '').trim().slice(0, 160)
  const body = String(input.body || '').trim().slice(0, 2000)
  if (!imageUrl) throw new Error('请先上传一张图片')
  if (!title) throw new Error('请填写标题')
  if (!body) throw new Error('请填写说明文案')
  const id = randomUUID()
  const existing = await prisma.$queryRaw<Array<{ maxWeight: number | null }>>`
    SELECT MAX(sort_weight) AS maxWeight FROM buyer_show_proof
  `
  const sortWeight = Number(existing?.[0]?.maxWeight || 0) + 1
  await prisma.$executeRaw`
    INSERT INTO buyer_show_proof (id, image_url, title, body, sort_weight, is_enabled, createdAt, updatedAt)
    VALUES (${id}, ${imageUrl}, ${title}, ${body}, ${sortWeight}, 1, NOW(3), NOW(3))
  `
  return { id }
}

export async function updateBuyerShowProof(input: {
  id: string
  title?: string
  body?: string
  isEnabled?: boolean
  sortWeight?: number
}): Promise<void> {
  const id = String(input.id || '').trim()
  if (!id) throw new Error('记录不存在')
  if (input.title !== undefined) {
    const title = String(input.title || '').trim().slice(0, 160)
    if (!title) throw new Error('标题不能为空')
    await prisma.$executeRaw`UPDATE buyer_show_proof SET title = ${title}, updatedAt = NOW(3) WHERE id = ${id}`
  }
  if (input.body !== undefined) {
    const body = String(input.body || '').trim().slice(0, 2000)
    if (!body) throw new Error('说明文案不能为空')
    await prisma.$executeRaw`UPDATE buyer_show_proof SET body = ${body}, updatedAt = NOW(3) WHERE id = ${id}`
  }
  if (input.isEnabled !== undefined) {
    const enabled = input.isEnabled ? 1 : 0
    await prisma.$executeRaw`UPDATE buyer_show_proof SET is_enabled = ${enabled}, updatedAt = NOW(3) WHERE id = ${id}`
  }
  if (input.sortWeight !== undefined) {
    const sortWeight = Number(input.sortWeight) || 0
    await prisma.$executeRaw`UPDATE buyer_show_proof SET sort_weight = ${sortWeight}, updatedAt = NOW(3) WHERE id = ${id}`
  }
}

export async function deleteBuyerShowProof(id: string): Promise<void> {
  const proofId = String(id || '').trim()
  if (!proofId) throw new Error('记录不存在')
  await prisma.$executeRaw`DELETE FROM buyer_show_proof WHERE id = ${proofId}`
}
