export const PASSWORD_MIN = 8
export const PASSWORD_MAX = 72

/**
 * Regras de senha forte, as mesmas da API (backend/src/modules/auth/password.ts).
 * Letras acentuadas contam ("É" é maiúscula, "ç" é minúscula); espaço não é caractere especial.
 */
export const PASSWORD_RULES = [
  { id: 'length', label: `Pelo menos ${PASSWORD_MIN} caracteres`, test: (p: string) => p.length >= PASSWORD_MIN },
  { id: 'upper', label: '1 letra maiúscula', test: (p: string) => /\p{Lu}/u.test(p) },
  { id: 'lower', label: '1 letra minúscula', test: (p: string) => /\p{Ll}/u.test(p) },
  { id: 'number', label: '1 número', test: (p: string) => /\p{N}/u.test(p) },
  { id: 'special', label: '1 caractere especial (ex.: ! @ # $ %)', test: (p: string) => /[^\p{L}\p{N}\s]/u.test(p) },
] as const

export type PasswordRuleId = (typeof PASSWORD_RULES)[number]['id']

/** Situação de cada regra para a senha digitada. */
export function checkPassword(password: string) {
  return PASSWORD_RULES.map((rule) => ({ id: rule.id, label: rule.label, ok: rule.test(password) }))
}

export function isStrongPassword(password: string) {
  return password.length <= PASSWORD_MAX && PASSWORD_RULES.every((rule) => rule.test(password))
}
