/**
 * 首页四张服务权益卡片（Shipping / Payment / 买家秀 / Why choose us）
 * 可视化装修 propKey 约定 —— 与 HomeStorefrontView 及 DecorateToolbar 共用。
 */
export const SERVICE_BENEFIT_CARD_COUNT = 4

export type ServiceBenefitDecorateKeys = {
  card: string
  title: string
  desc: string
  icon: string
}

export function getServiceBenefitDecorateKeys(index: number): ServiceBenefitDecorateKeys {
  return {
    card: `home_service_card_${index}`,
    title: `home_service_${index}_title`,
    desc: `home_service_${index}_desc`,
    icon: `home_service_${index}_icon`,
  }
}

/** 解析选中的服务卡片 block key；非服务卡片返回 null */
export function parseServiceBenefitCardIndex(propKey: string | null | undefined): number | null {
  if (!propKey) return null
  const match = /^home_service_card_(\d+)$/.exec(propKey)
  if (!match) return null
  const index = Number(match[1])
  if (!Number.isInteger(index) || index < 0 || index >= SERVICE_BENEFIT_CARD_COUNT) {
    return null
  }
  return index
}
