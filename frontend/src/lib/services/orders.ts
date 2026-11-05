import { authRequest } from '../auth-request'
import type { AddressInput, CartItemInput, FulfillmentType, Order } from '../types'

export type CreateOrderInput = {
  fulfillmentType: FulfillmentType
  scheduledDate: string
  items: CartItemInput[]
  address?: AddressInput
}

export const createOrder = (body: CreateOrderInput) =>
  authRequest<Order>('/orders', { method: 'POST', body })

export const listOrders = () => authRequest<{ data: Order[] }>('/orders')

export const getOrder = (id: string) => authRequest<Order>(`/orders/${encodeURIComponent(id)}`)
