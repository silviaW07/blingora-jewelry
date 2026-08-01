'use server'

export type {
  ShippingChannelFilterStatus,
  ShippingChannelItem,
  GetShippingChannelListInput,
  GetShippingChannelListOutput,
  SaveShippingChannelInput,
  SaveShippingChannelOutput,
  DeleteShippingChannelInput,
  DeleteShippingChannelOutput,
  UpdateShippingChannelStatusInput,
  UpdateShippingChannelStatusOutput,
} from '@/backend/actions/ShippingChannelConfig'

export {
  getShippingChannelList,
  saveShippingChannel,
  deleteShippingChannel,
  updateShippingChannelStatus,
} from '@/backend/actions/ShippingChannelConfig'
