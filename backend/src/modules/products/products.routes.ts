import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { AppError } from '../../plugins/errors'
import { detectImageType } from '../../shared/image'
import { idParams, productBody, productListQuery } from './products.schema'
import {
  createProduct,
  deactivateProduct,
  getProduct,
  listProducts,
  loadProductImage,
  saveProductImage,
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

  app.put(
    '/:id/image',
    { preHandler: app.requireAdmin, schema: { params: idParams } },
    async (req) => {
      const part = await req.file()
      if (!part || part.fieldname !== 'file') {
        throw new AppError(400, 'IMAGE_REQUIRED', 'Envie o arquivo no campo "file"')
      }
      // Lança 413 (FST_REQ_FILE_TOO_LARGE) se passar do limite.
      const buffer = await part.toBuffer()
      const mimeType = detectImageType(buffer)
      if (!mimeType) {
        throw new AppError(415, 'IMAGE_UNSUPPORTED_TYPE', 'Use uma imagem JPEG, PNG ou WebP')
      }
      return saveProductImage(app.prisma, req.params.id, buffer, mimeType)
    },
  )

  app.get('/:id/image', { schema: { params: idParams } }, async (req, reply) => {
    const image = await loadProductImage(app.prisma, req.params.id)
    return reply
      .header('Content-Type', image.mimeType)
      .header('Cache-Control', 'public, max-age=86400')
      .header('X-Content-Type-Options', 'nosniff')
      .send(Buffer.from(image.data))
  })

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
