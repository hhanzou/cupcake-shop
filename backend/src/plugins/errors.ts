import { FastifyInstance } from 'fastify'
import fp from 'fastify-plugin'
import { Prisma } from '@prisma/client'
import {
  hasZodFastifySchemaValidationErrors,
  isResponseSerializationError,
} from 'fastify-type-provider-zod'

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
    public details?: unknown[],
  ) {
    super(message)
  }
}

function body(code: string, message: string, details?: unknown[]) {
  return { error: { code, message, ...(details ? { details } : {}) } }
}

export default fp(async (app: FastifyInstance) => {
  app.setNotFoundHandler((_req, reply) => {
    reply.status(404).send(body('NOT_FOUND', 'Rota não encontrada'))
  })

  app.setErrorHandler((error, req, reply) => {
    if (error instanceof AppError) {
      return reply.status(error.statusCode).send(body(error.code, error.message, error.details))
    }

    if (hasZodFastifySchemaValidationErrors(error)) {
      const details = error.validation.map((v) => ({
        path: v.instancePath.replace(/^\//, '').replace(/\//g, '.'),
        message: v.message,
      }))
      return reply.status(400).send(body('VALIDATION_ERROR', 'Dados inválidos', details))
    }

    if (isResponseSerializationError(error)) {
      req.log.error(error)
      return reply.status(500).send(body('INTERNAL_ERROR', 'Erro interno do servidor'))
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        return reply.status(409).send(body('CONFLICT', 'Já existe um registro com esse valor'))
      }
      if (error.code === 'P2025') {
        return reply.status(404).send(body('NOT_FOUND', 'Registro não encontrado'))
      }
    }

    const e = error as { statusCode?: number; code?: string; message?: string }
    if (e.statusCode && e.statusCode >= 400 && e.statusCode < 500) {
      return reply
        .status(e.statusCode)
        .send(body(e.code ?? 'BAD_REQUEST', e.message ?? 'Requisição inválida'))
    }

    req.log.error(error)
    return reply.status(500).send(body('INTERNAL_ERROR', 'Erro interno do servidor'))
  })
})
