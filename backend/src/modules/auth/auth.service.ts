import { PrismaClient, User } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { AppError } from '../../plugins/errors'
import { LoginBody, RegisterBody } from './auth.schema'

export function publicUser(user: Pick<User, 'id' | 'name' | 'email' | 'role'>) {
  return { id: user.id, name: user.name, email: user.email, role: user.role }
}

export async function registerUser(prisma: PrismaClient, input: RegisterBody) {
  const exists = await prisma.user.findUnique({ where: { email: input.email } })
  if (exists) {
    throw new AppError(409, 'EMAIL_IN_USE', 'Já existe uma conta com esse e-mail')
  }
  const passwordHash = await bcrypt.hash(input.password, 10)
  return prisma.user.create({
    data: { name: input.name, email: input.email, passwordHash, role: 'USER' },
  })
}

export async function authenticateUser(prisma: PrismaClient, input: LoginBody) {
  const user = await prisma.user.findUnique({ where: { email: input.email } })
  const ok = user ? await bcrypt.compare(input.password, user.passwordHash) : false
  if (!user || !ok) {
    throw new AppError(401, 'INVALID_CREDENTIALS', 'E-mail ou senha incorretos')
  }
  return user
}

export async function getUserById(prisma: PrismaClient, id: string) {
  const user = await prisma.user.findUnique({ where: { id } })
  if (!user) throw new AppError(401, 'UNAUTHORIZED', 'Usuário não encontrado')
  return user
}
