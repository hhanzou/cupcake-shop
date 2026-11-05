import Fastify from 'fastify'
import cors from '@fastify/cors'
import multipart from '@fastify/multipart'
import { MAX_IMAGE_BYTES } from './shared/image'
import { serializerCompiler, validatorCompiler, ZodTypeProvider } from 'fastify-type-provider-zod'
import { env } from './env'
import prismaPlugin from './plugins/prisma'
import errorsPlugin from './plugins/errors'
import authPlugin from './plugins/auth'
import authRoutes from './modules/auth/auth.routes'
import cartRoutes from './modules/cart/cart.routes'
import orderRoutes from './modules/orders/orders.routes'
import adminOrderRoutes from './modules/orders/orders.admin.routes'
import productRoutes from './modules/products/products.routes'
import categoryRoutes from './modules/categories/categories.routes'

export async function buildApp() {
  const app = Fastify({
    logger: env.NODE_ENV !== 'test',
  }).withTypeProvider<ZodTypeProvider>()

  app.setValidatorCompiler(validatorCompiler)
  app.setSerializerCompiler(serializerCompiler)

  await app.register(errorsPlugin)
  await app.register(cors, { origin: env.CORS_ORIGIN })
  await app.register(multipart, { limits: { fileSize: MAX_IMAGE_BYTES, files: 1 } })
  await app.register(prismaPlugin)
  await app.register(authPlugin)

  await app.register(authRoutes, { prefix: '/auth' })
  await app.register(categoryRoutes, { prefix: '/categories' })
  await app.register(productRoutes, { prefix: '/products' })
  await app.register(cartRoutes, { prefix: '/cart' })
  await app.register(orderRoutes, { prefix: '/orders' })
  await app.register(adminOrderRoutes, { prefix: '/admin/orders' })

  app.get('/health', async () => ({ status: 'ok' }))

  return app
}
