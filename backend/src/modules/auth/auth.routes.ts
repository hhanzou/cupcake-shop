import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { loginBody, registerBody } from './auth.schema'
import { authenticateUser, getUserById, publicUser, registerUser } from './auth.service'

const authRoutes: FastifyPluginAsyncZod = async (app) => {
  const session = async (user: Parameters<typeof publicUser>[0]) => ({
    token: await app.jwt.sign({ sub: user.id, role: user.role }),
    user: publicUser(user),
  })

  app.post('/register', { schema: { body: registerBody } }, async (req, reply) => {
    const user = await registerUser(app.prisma, req.body)
    return reply.status(201).send(await session(user))
  })

  app.post('/login', { schema: { body: loginBody } }, async (req) => {
    const user = await authenticateUser(app.prisma, req.body)
    return session(user)
  })

  app.get('/me', { preHandler: app.authenticate }, async (req) => {
    const user = await getUserById(app.prisma, req.user.sub)
    return { user: publicUser(user) }
  })
}

export default authRoutes
