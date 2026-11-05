import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { idParams } from './orders.schema'
import { listAllOrders, updateOrderStatus } from './orders.admin.service'

const orderStatus = z.enum(['CONFIRMED', 'PREPARING', 'READY', 'COMPLETED', 'CANCELED'])

const listQuery = z.object({
  status: orderStatus.optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(12),
})

const adminOrderRoutes: FastifyPluginAsyncZod = async (app) => {
  app.addHook('preHandler', app.requireAdmin)

  app.get('/', { schema: { querystring: listQuery } }, async (req) =>
    listAllOrders(app.prisma, req.query),
  )

  app.patch(
    '/:id/status',
    { schema: { params: idParams, body: z.object({ status: orderStatus }) } },
    async (req) => updateOrderStatus(app.prisma, req.params.id, req.body.status),
  )
}

export default adminOrderRoutes
