import { z } from 'zod'

const email = z.string().trim().toLowerCase().pipe(z.email('E-mail inválido'))

export const registerBody = z.object({
  name: z.string().trim().min(1, 'Nome é obrigatório').max(120),
  email,
  password: z.string().min(8, 'A senha precisa ter pelo menos 8 caracteres').max(72),
})

export const loginBody = z.object({
  email,
  password: z.string().min(1),
})

export type RegisterBody = z.infer<typeof registerBody>
export type LoginBody = z.infer<typeof loginBody>
