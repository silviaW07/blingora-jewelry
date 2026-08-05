import { getCustomerServiceConfig } from '@/frontend/actions/CustomerService'
import {
  normalizeCustomerServiceConfig,
  readCustomerServiceLocal,
  writeCustomerServiceLocal,
  type CustomerServiceConfig,
} from '@/frontend/decorate/customerService'

type CustomerServiceConfigResult = {
  config: CustomerServiceConfig
  persisted: boolean
}

let inflight: Promise<CustomerServiceConfigResult> | null = null
let lastFetchedAt = 0

const TTL_MS = 60 * 1000

/**
 * Deduped customer-service config RPC (layout DecorateMode + MobileStorefrontHeader).
 * LocalStorage stays the instant display source; this only refreshes in the background.
 */
export async function loadCustomerServiceConfigCached(options?: {
  force?: boolean
}): Promise<CustomerServiceConfigResult> {
  const force = Boolean(options?.force)
  if (!force && inflight) return inflight

  if (!force && lastFetchedAt > 0 && Date.now() - lastFetchedAt < TTL_MS) {
    return {
      persisted: true,
      config: readCustomerServiceLocal(),
    }
  }

  inflight = getCustomerServiceConfig()
    .then((res) => {
      lastFetchedAt = Date.now()
      if (res?.persisted && res.config) {
        writeCustomerServiceLocal(normalizeCustomerServiceConfig(res.config))
      }
      return res as CustomerServiceConfigResult
    })
    .finally(() => {
      inflight = null
    })

  return inflight
}
