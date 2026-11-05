import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { previewBody } from './cart.schema'
import { previewCart } from './cart.service'

const cartRoutes: FastifyPluginAsyncZod = async (app) => {
  app.post('/preview', { schema: { body: previewBody } }, async (req) =>
    previewCart(app.prisma, req.body.items),
  )
}

export default cartRoutes
