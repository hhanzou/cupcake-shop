import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { createOrderBody, idParams } from './orders.schema'
import { createOrder, getUserOrder, listUserOrders } from './orders.service'

const orderRoutes: FastifyPluginAsyncZod = async (app) => {
  app.addHook('preHandler', app.authenticate)

  app.post('/', { schema: { body: createOrderBody } }, async (req, reply) => {
    const order = await createOrder(app.prisma, req.user.sub, req.body)
    return reply.status(201).send(order)
  })

  app.get('/', async (req) => listUserOrders(app.prisma, req.user.sub))

  app.get('/:id', { schema: { params: idParams } }, async (req) =>
    getUserOrder(app.prisma, req.user.sub, req.params.id),
  )
}

export default orderRoutes
