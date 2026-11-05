import { z } from 'zod'

export const categoryBody = z.object({
  name: z.string().trim().min(1, 'Nome é obrigatório').max(60),
})

export const idParams = z.object({ id: z.string().min(1) })

export type CategoryBody = z.infer<typeof categoryBody>
