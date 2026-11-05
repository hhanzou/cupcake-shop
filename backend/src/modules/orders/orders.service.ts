import { Prisma, PrismaClient } from '@prisma/client'
import { AppError } from '../../plugins/errors'
import { formatMoney } from '../../shared/money'
import { CartItemInput, CreateOrderBody } from './orders.schema'
import { validateScheduledDate } from './schedule'

type Db = PrismaClient | Prisma.TransactionClient

export const orderInclude = {
  items: { include: { product: { select: { name: true } } } },
} satisfies Prisma.OrderInclude

export const adminOrderInclude = {
  ...orderInclude,
  user: { select: { id: true, name: true, email: true } },
} satisfies Prisma.OrderInclude

type OrderWithItems = Prisma.OrderGetPayload<{ include: typeof orderInclude }>
type OrderWithUser = Prisma.OrderGetPayload<{ include: typeof adminOrderInclude }>

export function serializeOrder(order: OrderWithItems | OrderWithUser) {
  const address =
    order.fulfillmentType === 'DELIVERY'
      ? {
          street: order.street,
          number: order.number,
          complement: order.complement,
          district: order.district,
          city: order.city,
          state: order.state,
          zipCode: order.zipCode,
        }
      : null

  return {
    id: order.id,
    status: order.status,
    fulfillmentType: order.fulfillmentType,
    scheduledDate: order.scheduledDate.toISOString().slice(0, 10),
    total: formatMoney(order.total),
    address,
    items: order.items.map((item) => ({
      productId: item.productId,
      name: item.product.name,
      quantity: item.quantity,
      unitPrice: formatMoney(item.unitPrice),
      lineTotal: formatMoney(item.unitPrice.mul(item.quantity)),
    })),
    ...('user' in order ? { user: order.user } : {}),
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
  }
}

export type PricedLine = {
  productId: string
  name: string
  quantity: number
  unitPrice: Prisma.Decimal
  lineTotal: Prisma.Decimal
}

/**
 * Soma quantidades repetidas, busca os preços no banco e separa itens disponíveis
 * (produto ativo) dos indisponíveis (inativo ou inexistente). Usada por carrinho e pedidos.
 */
export async function priceItems(db: Db, items: CartItemInput[]) {
  const quantities = new Map<string, number>()
  for (const item of items) {
    quantities.set(item.productId, (quantities.get(item.productId) ?? 0) + item.quantity)
  }

  for (const [productId, quantity] of quantities) {
    if (quantity > 99) {
      throw new AppError(
        400,
        'CART_INVALID_QUANTITY',
        'A quantidade total de um mesmo cupcake não pode passar de 99',
        [{ productId, quantity }],
      )
    }
  }

  const products = await db.product.findMany({
    where: { id: { in: [...quantities.keys()] } },
    select: { id: true, name: true, price: true, active: true },
  })
  const byId = new Map(products.map((p) => [p.id, p]))

  const lines: PricedLine[] = []
  const unavailableProductIds: string[] = []
  let total = new Prisma.Decimal(0)

  for (const [productId, quantity] of quantities) {
    const product = byId.get(productId)
    if (!product || !product.active) {
      unavailableProductIds.push(productId)
      continue
    }
    const lineTotal = product.price.mul(quantity)
    total = total.add(lineTotal)
    lines.push({ productId, name: product.name, quantity, unitPrice: product.price, lineTotal })
  }

  return { lines, unavailableProductIds, total }
}

const ADDRESS_REQUIRED = ['street', 'number', 'district', 'city', 'state', 'zipCode'] as const

function resolveAddress(input: CreateOrderBody) {
  const address = input.address ?? undefined

  if (input.fulfillmentType === 'PICKUP') {
    if (address && Object.values(address).some((v) => v !== undefined)) {
      throw new AppError(400, 'ORDER_INVALID_ADDRESS', 'Retirada na loja não aceita endereço')
    }
    return {}
  }

  const missing = ADDRESS_REQUIRED.filter((field) => !address?.[field])
  if (!address || missing.length > 0) {
    throw new AppError(
      400,
      'ORDER_INVALID_ADDRESS',
      'Entrega exige endereço completo (complemento é opcional)',
      missing.map((field) => ({ path: `address.${field}`, message: 'Campo obrigatório' })),
    )
  }
  return {
    street: address.street,
    number: address.number,
    complement: address.complement || null,
    district: address.district,
    city: address.city,
    state: address.state,
    zipCode: address.zipCode,
  }
}

export async function createOrder(
  prisma: PrismaClient,
  userId: string,
  input: CreateOrderBody,
  now = new Date(),
) {
  const addressData = resolveAddress(input)

  const schedule = validateScheduledDate(input.scheduledDate, now)
  if (!schedule.valid) {
    throw new AppError(400, 'ORDER_INVALID_DATE', schedule.message)
  }

  const order = await prisma.$transaction(async (tx) => {
    const priced = await priceItems(tx, input.items)
    if (priced.unavailableProductIds.length > 0) {
      throw new AppError(
        409,
        'ORDER_ITEM_UNAVAILABLE',
        'Alguns itens não estão mais disponíveis',
        priced.unavailableProductIds,
      )
    }

    return tx.order.create({
      data: {
        userId,
        status: 'CONFIRMED',
        fulfillmentType: input.fulfillmentType,
        scheduledDate: schedule.date,
        total: priced.total,
        ...addressData,
        items: {
          create: priced.lines.map((line) => ({
            productId: line.productId,
            quantity: line.quantity,
            unitPrice: line.unitPrice,
          })),
        },
      },
      include: orderInclude,
    })
  })

  return serializeOrder(order)
}

export async function listUserOrders(prisma: PrismaClient, userId: string) {
  const orders = await prisma.order.findMany({
    where: { userId },
    orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
    include: orderInclude,
  })
  return { data: orders.map(serializeOrder) }
}

export async function getUserOrder(prisma: PrismaClient, userId: string, id: string) {
  const order = await prisma.order.findFirst({ where: { id, userId }, include: orderInclude })
  if (!order) throw new AppError(404, 'ORDER_NOT_FOUND', 'Pedido não encontrado')
  return serializeOrder(order)
}
