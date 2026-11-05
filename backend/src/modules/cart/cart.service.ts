import { PrismaClient } from '@prisma/client'
import { formatMoney } from '../../shared/money'
import { CartItemInput } from '../orders/orders.schema'
import { priceItems } from '../orders/orders.service'

export async function previewCart(prisma: PrismaClient, items: CartItemInput[]) {
  const { lines, unavailableProductIds, total } = await priceItems(prisma, items)
  return {
    items: lines.map((line) => ({
      productId: line.productId,
      name: line.name,
      quantity: line.quantity,
      unitPrice: formatMoney(line.unitPrice),
      lineTotal: formatMoney(line.lineTotal),
    })),
    unavailableProductIds,
    total: formatMoney(total),
  }
}
