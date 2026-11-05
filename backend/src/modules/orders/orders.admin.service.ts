import { OrderStatus, Prisma, PrismaClient } from '@prisma/client'
import { AppError } from '../../plugins/errors'
import { adminOrderInclude, serializeOrder } from './orders.service'

export async function listAllOrders(
  prisma: PrismaClient,
  query: { status?: OrderStatus; page: number; limit: number },
) {
  const where: Prisma.OrderWhereInput = query.status ? { status: query.status } : {}

  const [total, orders] = await Promise.all([
    prisma.order.count({ where }),
    prisma.order.findMany({
      where,
      orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
      skip: (query.page - 1) * query.limit,
      take: query.limit,
      include: adminOrderInclude,
    }),
  ])

  return { data: orders.map(serializeOrder), page: query.page, limit: query.limit, total }
}

export async function updateOrderStatus(prisma: PrismaClient, id: string, status: OrderStatus) {
  const result = await prisma.order.updateMany({ where: { id }, data: { status } })
  if (result.count === 0) throw new AppError(404, 'ORDER_NOT_FOUND', 'Pedido não encontrado')

  const order = await prisma.order.findUniqueOrThrow({ where: { id }, include: adminOrderInclude })
  return serializeOrder(order)
}
