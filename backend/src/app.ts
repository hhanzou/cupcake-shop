import Fastify from 'fastify'
import cors from '@fastify/cors'
import { serializerCompiler, validatorCompiler, ZodTypeProvider } from 'fastify-type-provider-zod'
import { env } from './env'
import prismaPlugin from './plugins/prisma'
import errorsPlugin from './plugins/errors'
import authPlugin from './plugins/auth'
import authRoutes from './modules/auth/auth.routes'
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
  await app.register(prismaPlugin)
  await app.register(authPlugin)

  await app.register(authRoutes, { prefix: '/auth' })
  await app.register(categoryRoutes, { prefix: '/categories' })
  await app.register(productRoutes, { prefix: '/products' })

  app.get('/health', async () => ({ status: 'ok' }))

  return app
}
