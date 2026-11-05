import { request } from '../api'
import type { CartItemInput, CartPreview } from '../types'

export const previewCart = (items: CartItemInput[]) =>
  request<CartPreview>('/cart/preview', { method: 'POST', body: { items } })
