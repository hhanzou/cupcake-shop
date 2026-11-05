import Fastify from 'fastify'
import cors from '@fastify/cors'
import prismaPlugin from './plugins/prisma'

export async function buildApp() {
  const app = Fastify({
    logger: process.env.NODE_ENV !== 'test',
  })

  await app.register(cors, { origin: true })
  await app.register(prismaPlugin)

  app.get('/health', async () => ({ status: 'ok' }))

  return app
}
