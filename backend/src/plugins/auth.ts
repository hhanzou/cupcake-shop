import { FastifyReply, FastifyRequest } from 'fastify'
import fp from 'fastify-plugin'
import jwt from '@fastify/jwt'
import { Role } from '@prisma/client'
import { env } from '../env'
import { AppError } from './errors'

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: { sub: string; role: Role }
    user: { sub: string; role: Role }
  }
}

declare module 'fastify' {
  interface FastifyInstance {
    authenticate: (req: FastifyRequest, reply: FastifyReply) => Promise<void>
    requireAdmin: (req: FastifyRequest, reply: FastifyReply) => Promise<void>
  }
}

export default fp(async (app) => {
  await app.register(jwt, {
    secret: env.JWT_SECRET,
    sign: { expiresIn: '7d' },
  })

  const authenticate = async (req: FastifyRequest) => {
    try {
      await req.jwtVerify()
    } catch {
      throw new AppError(401, 'UNAUTHORIZED', 'Token ausente ou inválido')
    }
  }

  const requireAdmin = async (req: FastifyRequest) => {
    await authenticate(req)
    if (req.user.role !== 'ADMIN') {
      throw new AppError(403, 'FORBIDDEN', 'Acesso restrito a administradores')
    }
  }

  app.decorate('authenticate', authenticate)
  app.decorate('requireAdmin', requireAdmin)
})
