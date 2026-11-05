import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { idParams, productBody, productListQuery } from './products.schema'
import {
  createProduct,
  deactivateProduct,
  getProduct,
  listProducts,
  updateProduct,
} from './products.service'

const productRoutes: FastifyPluginAsyncZod = async (app) => {
  app.get('/', { schema: { querystring: productListQuery } }, async (req) =>
    listProducts(app.prisma, req.query),
  )

  app.get('/:id', { schema: { params: idParams } }, async (req) =>
    getProduct(app.prisma, req.params.id),
  )

  app.post(
    '/',
    { preHandler: app.requireAdmin, schema: { body: productBody } },
    async (req, reply) => reply.status(201).send(await createProduct(app.prisma, req.body)),
  )

  app.put(
    '/:id',
    { preHandler: app.requireAdmin, schema: { params: idParams, body: productBody } },
    async (req) => updateProduct(app.prisma, req.params.id, req.body),
  )

  app.delete(
    '/:id',
    { preHandler: app.requireAdmin, schema: { params: idParams } },
    async (req, reply) => {
      await deactivateProduct(app.prisma, req.params.id)
      return reply.status(204).send()
    },
  )
}

export default productRoutes
