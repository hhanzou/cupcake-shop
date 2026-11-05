import type { FulfillmentType, OrderStatus } from './types'

export const STATUS_LABEL: Record<OrderStatus, string> = {
  CONFIRMED: 'Confirmado',
  PREPARING: 'Em preparo',
  READY: 'Pronto',
  COMPLETED: 'Concluído',
  CANCELED: 'Cancelado',
}

export const FULFILLMENT_LABEL: Record<FulfillmentType, string> = {
  PICKUP: 'Retirada na loja',
  DELIVERY: 'Entrega',
}

export const ORDER_STATUSES = Object.keys(STATUS_LABEL) as OrderStatus[]
