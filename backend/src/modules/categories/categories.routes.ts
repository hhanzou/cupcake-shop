import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { categoryBody, idParams } from './categories.schema'
import {
  createCategory,
  deleteCategory,
  listCategories,
  updateCategory,
} from './categories.service'

const categoryRoutes: FastifyPluginAsyncZod = async (app) => {
  app.get('/', async () => ({ data: await listCategories(app.prisma) }))

  app.post(
    '/',
    { preHandler: app.requireAdmin, schema: { body: categoryBody } },
    async (req, reply) => {
      const category = await createCategory(app.prisma, req.body.name)
      return reply.status(201).send(category)
    },
  )

  app.put(
    '/:id',
    { preHandler: app.requireAdmin, schema: { params: idParams, body: categoryBody } },
    async (req) => updateCategory(app.prisma, req.params.id, req.body.name),
  )

  app.delete(
    '/:id',
    { preHandler: app.requireAdmin, schema: { params: idParams } },
    async (req, reply) => {
      await deleteCategory(app.prisma, req.params.id)
      return reply.status(204).send()
    },
  )
}

export default categoryRoutes
