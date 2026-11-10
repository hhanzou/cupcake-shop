import { z } from 'zod'

export const PASSWORD_MIN = 8
export const PASSWORD_MAX = 72

/**
 * Regras de senha forte. As mesmas regras existem no front (frontend/src/lib/password.ts),
 * para a lista de exigências do cadastro; mantenha as duas em sincronia.
 * Letras acentuadas contam ("É" é maiúscula, "ç" é minúscula).
 */
export const PASSWORD_RULES = [
  { pattern: /\p{Lu}/u, message: 'A senha precisa ter ao menos 1 letra maiúscula' },
  { pattern: /\p{Ll}/u, message: 'A senha precisa ter ao menos 1 letra minúscula' },
  { pattern: /\p{N}/u, message: 'A senha precisa ter ao menos 1 número' },
  { pattern: /[^\p{L}\p{N}\s]/u, message: 'A senha precisa ter ao menos 1 caractere especial (ex.: ! @ # $ %)' },
] as const

/** Senha nova (cadastro): todas as regras são checadas e todas as que falharem são devolvidas. */
export const strongPassword = PASSWORD_RULES.reduce(
  (schema, rule) => schema.regex(rule.pattern, rule.message),
  z
    .string()
    .min(PASSWORD_MIN, `A senha precisa ter pelo menos ${PASSWORD_MIN} caracteres`)
    .max(PASSWORD_MAX, `A senha pode ter no máximo ${PASSWORD_MAX} caracteres`),
)
