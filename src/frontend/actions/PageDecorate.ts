'use server'

import prisma from '@/tools/prisma'
import { withResult } from '@/frontend/action_utils'
import type { DecorateStore } from '@/frontend/decorate/types'
import {
  PAGE_DECORATE_SETTING_TITLE,
  normalizeStore,
  type PageDecorateConfigResult,
} from '@/frontend/decorate/pageDecorateShared'

/**
 * 前台公开读取页面可视化装修补丁（标题/文案/图标/链接等）
 */
export const getPageDecorateConfig = withResult(
  async (): Promise<PageDecorateConfigResult> => {
    const setting = await prisma.sitesetting.findFirst({
      where: {
        settingType: 'STATIC_COPY',
        title: PAGE_DECORATE_SETTING_TITLE,
      },
      orderBy: { updatedAt: 'desc' },
    })

    if (!setting) {
      return { store: {}, persisted: false }
    }

    return {
      store: normalizeStore(setting.contentJson),
      persisted: true,
    }
  },
)

/**
 * 可视化装修「发布」时保存整页装修补丁到 sitesetting
 */
export const savePageDecorateConfig = withResult(
  async (input: DecorateStore): Promise<DecorateStore> => {
    const store = normalizeStore(input)

    const existing = await prisma.sitesetting.findFirst({
      where: {
        settingType: 'STATIC_COPY',
        title: PAGE_DECORATE_SETTING_TITLE,
      },
      orderBy: { updatedAt: 'desc' },
    })

    if (existing) {
      await prisma.sitesetting.update({
        where: { id: existing.id },
        data: {
          contentJson: store,
          isActive: true,
          subtitle: 'page visual decorate',
        },
      })
    } else {
      await prisma.sitesetting.create({
        data: {
          settingType: 'STATIC_COPY',
          title: PAGE_DECORATE_SETTING_TITLE,
          subtitle: 'page visual decorate',
          contentJson: store,
          isActive: true,
          sortWeight: 0,
        },
      })
    }

    return store
  },
)
