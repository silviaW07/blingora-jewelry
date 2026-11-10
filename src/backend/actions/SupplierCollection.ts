'use server'

import prisma from '@/tools/prisma'
import { requireStaff } from '@/backend/staffAccess'
import { withResult } from '@/backend/action_utils'
import { randomUUID } from 'crypto'

const LEDGER_TITLE = 'SUPPLIER_COLLECTION_V1'

export interface SupplierCollectionItem {
  id: string
  supplierName: string
  albumUrl: string
  /** 相册访问密码 / 秘密 */
  secret: string
  note: string
  createdAt: string
  updatedAt: string
}

export interface CreateSupplierCollectionInput {
  supplierName: string
  albumUrl: string
  secret?: string
  note?: string
}

export interface UpdateSupplierCollectionInput {
  id: string
  supplierName: string
  albumUrl: string
  secret?: string
  note?: string
}

export interface DeleteSupplierCollectionInput {
  id: string
}

function text(value: unknown, max = 500): string {
  return String(value ?? '').replace(/\s+/g, ' ').trim().slice(0, max)
}

function normalizeItems(raw: unknown): SupplierCollectionItem[] {
  if (!raw || typeof raw !== 'object') return []
  const list = Array.isArray(raw)
    ? raw
    : Array.isArray((raw as { items?: unknown }).items)
      ? (raw as { items: unknown[] }).items
      : []
  return list.flatMap((item, index) => {
    if (!item || typeof item !== 'object' || Array.isArray(item)) return []
    const row = item as Record<string, unknown>
    const supplierName = text(row.supplierName, 120)
    const albumUrl = text(row.albumUrl, 1000)
    if (!supplierName && !albumUrl) return []
    const now = new Date().toISOString()
    return [{
      id: text(row.id, 80) || `supplier-${index + 1}`,
      supplierName,
      albumUrl,
      secret: text(row.secret, 120),
      note: text(row.note, 500),
      createdAt: text(row.createdAt, 40) || now,
      updatedAt: text(row.updatedAt, 40) || now,
    }]
  }).sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)))
}

async function readItems(): Promise<SupplierCollectionItem[]> {
  const setting = await prisma.sitesetting.findFirst({
    where: { settingType: 'STATIC_COPY', title: LEDGER_TITLE },
    orderBy: { updatedAt: 'desc' },
  })
  return normalizeItems(setting?.contentJson)
}

async function writeItems(items: SupplierCollectionItem[]) {
  const payload = { items: normalizeItems(items) }
  const existing = await prisma.sitesetting.findFirst({
    where: { settingType: 'STATIC_COPY', title: LEDGER_TITLE },
    orderBy: { updatedAt: 'desc' },
  })
  if (existing) {
    await prisma.sitesetting.update({
      where: { id: existing.id },
      data: { contentJson: payload, isActive: true },
    })
  } else {
    await prisma.sitesetting.create({
      data: {
        settingType: 'STATIC_COPY',
        title: LEDGER_TITLE,
        subtitle: 'supplier album links',
        contentJson: payload,
        isActive: true,
        sortWeight: 0,
      },
    })
  }
  return payload.items
}

export const listSupplierCollections = requireStaff('suppliercollection')(
  withResult(async (): Promise<SupplierCollectionItem[]> => readItems()),
)

export const createSupplierCollection = requireStaff('suppliercollection')(
  withResult(async (input: CreateSupplierCollectionInput): Promise<SupplierCollectionItem> => {
    const supplierName = text(input?.supplierName, 120)
    const albumUrl = text(input?.albumUrl, 1000)
    if (!supplierName) throw new Error('请填写供应商名称')
    if (!albumUrl) throw new Error('请填写相册链接')
    const now = new Date().toISOString()
    const item: SupplierCollectionItem = {
      id: randomUUID(),
      supplierName,
      albumUrl,
      secret: text(input?.secret, 120),
      note: text(input?.note, 500),
      createdAt: now,
      updatedAt: now,
    }
    const current = await readItems()
    await writeItems([item, ...current])
    return item
  }),
)

export const updateSupplierCollection = requireStaff('suppliercollection')(
  withResult(async (input: UpdateSupplierCollectionInput): Promise<SupplierCollectionItem> => {
    const id = text(input?.id, 80)
    if (!id) throw new Error('缺少记录')
    const supplierName = text(input?.supplierName, 120)
    const albumUrl = text(input?.albumUrl, 1000)
    if (!supplierName) throw new Error('请填写供应商名称')
    if (!albumUrl) throw new Error('请填写相册链接')
    const current = await readItems()
    const index = current.findIndex((item) => item.id === id)
    if (index < 0) throw new Error('记录不存在')
    const next: SupplierCollectionItem = {
      ...current[index],
      supplierName,
      albumUrl,
      secret: text(input?.secret, 120),
      note: text(input?.note, 500),
      updatedAt: new Date().toISOString(),
    }
    const list = [...current]
    list[index] = next
    await writeItems(list)
    return next
  }),
)

export const deleteSupplierCollection = requireStaff('suppliercollection')(
  withResult(async (input: DeleteSupplierCollectionInput): Promise<{ success: boolean }> => {
    const id = text(input?.id, 80)
    if (!id) throw new Error('缺少记录')
    const current = await readItems()
    if (!current.some((item) => item.id === id)) throw new Error('记录不存在')
    await writeItems(current.filter((item) => item.id !== id))
    return { success: true }
  }),
)
