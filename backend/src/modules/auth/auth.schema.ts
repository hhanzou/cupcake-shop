import { z } from 'zod'
import { strongPassword } from './password'

const email = z.string().trim().toLowerCase().pipe(z.email('E-mail inválido'))

export const registerBody = z.object({
  name: z.string().trim().min(1, 'Nome é obrigatório').max(120),
  email,
  password: strongPassword,
})

export const loginBody = z.object({
  email,
  password: z.string().min(1),
})

export type RegisterBody = z.infer<typeof registerBody>
export type LoginBody = z.infer<typeof loginBody>
