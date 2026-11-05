import { z } from 'zod'
import { cartItems } from '../orders/orders.schema'

export const previewBody = z.object({ items: cartItems })
