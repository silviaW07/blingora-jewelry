'use server'

import prisma from '@/tools/prisma'
import { withResult } from '@/frontend/action_utils'
import {
  CUSTOMER_SERVICE_SETTING_TITLE,
  DEFAULT_CUSTOMER_SERVICE_CONFIG,
  normalizeCustomerServiceConfig,
  type CustomerServiceConfig,
} from '@/frontend/decorate/customerService'

const parseContent = (raw: unknown): Partial<CustomerServiceConfig> | null => {
  if (!raw || typeof raw !== 'object') return null
  return raw as Partial<CustomerServiceConfig>
}

export type CustomerServiceConfigResult = {
  config: CustomerServiceConfig
  /** 是否已有后台持久化记录；false 时前端应保留本地装修草稿/缓存 */
  persisted: boolean
}

/**
 * 前台公开读取客服配置（悬浮按钮 / 下单成功弹窗）
 */
export const getCustomerServiceConfig = withResult(
  async (): Promise<CustomerServiceConfigResult> => {
    const setting = await prisma.sitesetting.findFirst({
      where: {
        settingType: 'FLOAT_CONTACT',
        title: CUSTOMER_SERVICE_SETTING_TITLE,
      },
      orderBy: { updatedAt: 'desc' },
    })

    if (!setting) {
      return {
        config: { ...DEFAULT_CUSTOMER_SERVICE_CONFIG },
        persisted: false,
      }
    }

    return {
      config: normalizeCustomerServiceConfig(parseContent(setting.contentJson)),
      persisted: true,
    }
  },
)

/**
 * 可视化装修「发布」时保存客服配置到 sitesetting
 */
export const saveCustomerServiceConfig = withResult(
  async (input: Partial<CustomerServiceConfig>): Promise<CustomerServiceConfig> => {
    const config = normalizeCustomerServiceConfig(input)

    const existing = await prisma.sitesetting.findFirst({
      where: {
        settingType: 'FLOAT_CONTACT',
        title: CUSTOMER_SERVICE_SETTING_TITLE,
      },
      orderBy: { updatedAt: 'desc' },
    })

    if (existing) {
      await prisma.sitesetting.update({
        where: { id: existing.id },
        data: {
          contentJson: config,
          isActive: config.floatEnabled,
          subtitle: config.whatsappNumber,
        },
      })
    } else {
      await prisma.sitesetting.create({
        data: {
          settingType: 'FLOAT_CONTACT',
          title: CUSTOMER_SERVICE_SETTING_TITLE,
          subtitle: config.whatsappNumber,
          contentJson: config,
          isActive: config.floatEnabled,
          sortWeight: 0,
        },
      })
    }

    return config
  },
)
